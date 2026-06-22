# Contributing to AquaOS

## Architecture

AquaOS has been split from this monolith into independent microservices:

| Service | Repo | Language | Port |
|---------|------|----------|------|
| REST API | [aqua-os-backend](https://github.com/Franion03/aqua-os-backend) | Go | 8080 |
| Web Dashboard | [aqua-os-web](https://github.com/Franion03/aqua-os-web) | TypeScript/React | 5173 (dev) |
| AI Agents | [aqua-os-crew](https://github.com/Franion03/aqua-os-crew) | Python | 8001 |
| Calendar | [aqua-os-calendar](https://github.com/Franion03/aqua-os-calendar) | C#/.NET | 8082 |
| Infrastructure | [aqua-os-infrastructure](https://github.com/Franion03/aqua-os-infrastructure) | Terraform/HCL | — |

> ⚠️ This monolith repo is deprecated. Submit PRs to the individual service repos above.

## Local Development

```bash
# Clone all repos as siblings
git clone https://github.com/Franion03/aqua-os.git
git clone https://github.com/Franion03/aqua-os-backend.git
git clone https://github.com/Franion03/aqua-os-web.git
git clone https://github.com/Franion03/aqua-os-crew.git
git clone https://github.com/Franion03/aqua-os-calendar.git
git clone https://github.com/Franion03/aqua-os-infrastructure.git

# Run the full stack
cd aqua-os
docker compose -f docker-compose.microservices.yml up --build
```

## Workflow

1. Fork the relevant service repo
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Make changes and add tests
4. Submit a PR with a clear description

## Code Standards

- **Go**: `golangci-lint run` must pass
- **Python**: Pin all dependencies, add type hints
- **TypeScript**: `npm run lint` must pass
- **All**: Include tests for new features

## Security

All repos run Trivy (container scanning), Syft (SBOM), and Gitleaks (secret scanning) in CI. Don't commit secrets.
