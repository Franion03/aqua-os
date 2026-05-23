#!/usr/bin/env bash
# ── AquaOS PoC Bootstrap ─────────────────────────────────────────────────
# Runs on first boot of the EC2 instance (Amazon Linux 2023).
# Installs: Python 3.12, FastAPI, CrewAI, ChromaDB, Nginx, Certbot.
# Clones the aqua-os repo and starts the backend + frontend.

set -euo pipefail

GEMINI_KEY="${gemini_api_key}"
PROJECT="${project_name}"
REPO_URL="https://github.com/franion03/aqua-os.git"  # update if different
APP_DIR="/opt/aquaos"
LOG_FILE="/var/log/aquaos-bootstrap.log"

exec > >(tee -a "$${LOG_FILE}") 2>&1

echo "=== AquaOS Bootstrap started at $(date -u) ==="

# ── System updates ─────────────────────────────────────────────────
dnf update -y

# ── Install runtime dependencies ───────────────────────────────────
dnf install -y \
  python3.12 \
  python3.12-pip \
  python3.12-devel \
  nginx \
  git \
  gcc \
  sqlite-devel

# Alias python/pip
alternatives --set python3 /usr/bin/python3.12 || true
python3.12 -m ensurepip --upgrade || true

# ── Clone repository ───────────────────────────────────────────────
mkdir -p "$${APP_DIR}"
if [ ! -d "$${APP_DIR}/.git" ]; then
  git clone "$${REPO_URL}" "$${APP_DIR}"
fi
cd "$${APP_DIR}"

# ── Python backend dependencies ────────────────────────────────────
pip3.12 install --upgrade pip

pip3.12 install \
  fastapi \
  uvicorn[standard] \
  crewai \
  chromadb \
  sqlalchemy \
  python-dotenv \
  pydantic \
  httpx

# ── Create .env file for Gemini API key ────────────────────────────
# (used by both the Python backend and optionally the React build)
cat > "$${APP_DIR}/backend/.env" << ENVEOF
GEMINI_API_KEY=$${GEMINI_KEY}
ENVEOF

# Also create a symlink for the frontend .env (if still needed at build time)
mkdir -p "$${APP_DIR}/backend"
touch "$${APP_DIR}/backend/.env"

# ── Nginx reverse proxy config ─────────────────────────────────────
cat > /etc/nginx/conf.d/aquaos.conf << 'NGINXEOF'
server {
    listen 80;
    server_name _;

    # React frontend (built static files served from disk)
    root /opt/aquaos/dist;
    index index.html;

    # API proxy → FastAPI backend on localhost:8000
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;  # CrewAI can take 30-60s per crew run
    }

    # SPA fallback: all non-API, non-file requests → index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
}
NGINXEOF

# Remove default server block
rm -f /etc/nginx/conf.d/default.conf /etc/nginx/nginx.conf.default

# ── systemd service for FastAPI backend ────────────────────────────
cat > /etc/systemd/system/aquaos-backend.service << SERVICEEOF
[Unit]
Description=AquaOS FastAPI Backend (CrewAI)
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/opt/aquaos/backend
Environment=PYTHONUNBUFFERED=1
Environment=GEMINI_API_KEY=$${GEMINI_KEY}
ExecStart=/usr/bin/python3.12 -m uvicorn main:app --host 127.0.0.1 --port 8000 --workers 2
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
SERVICEEOF

systemctl daemon-reload
systemctl enable aquaos-backend

# ── Start Nginx ────────────────────────────────────────────────────
systemctl enable nginx
systemctl start nginx

# ── Build React frontend (if Node available) ───────────────────────
# Note: building on t3.micro is tight (1 GB RAM). Prefer building
# locally and syncing via `npm run build && aws s3 sync dist/ s3://...`.
# For the PoC, we upload a placeholder index.html if dist/ is empty.
if [ ! -f "$${APP_DIR}/dist/index.html" ]; then
  mkdir -p "$${APP_DIR}/dist"
  cat > "$${APP_DIR}/dist/index.html" << HTMLEOF
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AquaOS — PoC</title>
  <style>
    body { font-family: system-ui; max-width: 720px; margin: 4rem auto; padding: 0 1rem; background: #0f172a; color: #e2e8f0; }
    h1 { color: #22d3ee; }
    code { background: #1e293b; padding: 0.15em 0.4em; border-radius: 4px; }
    .endpoint { background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 1rem; margin: 0.5rem 0; }
    .method { font-weight: bold; color: #22d3ee; }
  </style>
</head>
<body>
  <h1>🤽 AquaOS PoC — Running</h1>
  <p>Backend is alive. API endpoints available:</p>
  <div class="endpoint"><span class="method">GET</span> <code>/api/health</code> — Health check</div>
  <div class="endpoint"><span class="method">GET</span> <code>/api/players</code> — List players</div>
  <div class="endpoint"><span class="method">POST</span> <code>/api/crew/run</code> — Trigger agent crew</div>
  <div class="endpoint"><span class="method">GET</span> <code>/api/crew/status</code> — Last crew run status</div>
  <p style="margin-top: 2rem; font-size: 0.85rem; color: #64748b;">
    Full React dashboard builds are deployed separately via <code>npm run build</code> → S3 + CloudFront.
  </p>
</body>
</html>
HTMLEOF
fi

# Fix permissions
chown -R ec2-user:ec2-user "$${APP_DIR}"

# ── Start backend service ──────────────────────────────────────────
systemctl start aquaos-backend || true

echo "=== AquaOS Bootstrap completed at $(date -u) ==="
