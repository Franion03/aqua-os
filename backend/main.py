"""
AquaOS Backend — FastAPI + CrewAI Agent Orchestrator.

Proof-of-concept deployment on AWS EC2 t3.micro (free tier).
All agent LLM calls go to Google Gemini (external API).
Database: SQLite (embedded). Vector memory: ChromaDB (embedded).

Crews:
  match_prep      — Tactical Analyst → Technical Coach → Marketing → Physical Coach
  enrollment      — Marketing → Technical Coach
  progress_review — Technical Coach → Physical Coach
  season_plan     — All 4 agents
  injury_response — Physical Coach → Technical Coach → Marketing
"""

import logging
import os
import sys
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ── Configure LLM before CrewAI imports ─────────────────────────────────
# CrewAI v0.80+ uses LiteLLM under the hood. By setting the OpenAI-compatible
# env vars to point at Gemini's endpoint, all agents automatically use Gemini.
# This avoids needing to pass `llm=` to every Agent constructor.

_gemini_key = os.getenv("GEMINI_API_KEY", "")
if _gemini_key:
    os.environ.setdefault("OPENAI_API_BASE", "https://generativelanguage.googleapis.com/v1beta/openai/")
    os.environ.setdefault("OPENAI_API_KEY", _gemini_key)
    os.environ.setdefault("OPENAI_MODEL_NAME", "gemini-2.0-flash")

# ── Now safe to import CrewAI-dependent modules ─────────────────────────
from crews import CREW_REGISTRY

# ── Logging ─────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger("aquaos")

# ── App ─────────────────────────────────────────────────────────────────
app = FastAPI(
    title="AquaOS — Agentic Water Polo Club Manager",
    version="0.1.0-poc",
    docs_url="/api/docs",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── In-memory state ─────────────────────────────────────────────────────
_last_crew_run: dict = {"status": "idle", "timestamp": None, "result": None}

# ── Player store (mirrors tools/player_db.py seed data) ─────────────────
PLAYERS = [
    {"id": 1, "name": "Liam Alvarez", "age": 11, "level": 2},
    {"id": 2, "name": "Mateo Rossi", "age": 13, "level": 3},
    {"id": 3, "name": "Sofia Dubois", "age": 10, "level": 1},
    {"id": 4, "name": "Lucas Kovač", "age": 14, "level": 4},
    {"id": 5, "name": "Emma Santos", "age": 12, "level": 2},
]

CREW_TYPES = sorted(CREW_REGISTRY.keys())


# ── Health ──────────────────────────────────────────────────────────────
@app.get("/api/health")
def health():
    gemini_ok = bool(os.getenv("GEMINI_API_KEY"))
    return {
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "gemini_configured": gemini_ok,
        "crews_available": CREW_TYPES,
        "crewai_version": _get_crewai_version(),
    }


def _get_crewai_version() -> str:
    try:
        from importlib.metadata import version
        return version("crewai")
    except Exception:
        return "unknown"


# ── Players ─────────────────────────────────────────────────────────────
@app.get("/api/players")
def list_players():
    return {"players": PLAYERS, "count": len(PLAYERS)}


@app.get("/api/players/{player_id}")
def get_player(player_id: int):
    for p in PLAYERS:
        if p["id"] == player_id:
            return p
    raise HTTPException(status_code=404, detail="Player not found")


# ── Crew Orchestration ──────────────────────────────────────────────────
class CrewRunRequest(BaseModel):
    crew_type: str  # match_prep, enrollment, progress_review, season_plan, injury_response
    params: dict = {}  # crew-specific kwargs


@app.post("/api/crew/run")
def run_crew(req: CrewRunRequest):
    """Trigger an agent crew. Routes to the appropriate CrewAI crew via CREW_REGISTRY."""
    if req.crew_type not in CREW_REGISTRY:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown crew type '{req.crew_type}'. Options: {CREW_TYPES}",
        )

    if not _gemini_key:
        raise HTTPException(
            status_code=503,
            detail="GEMINI_API_KEY not configured. Set the environment variable and restart.",
        )

    run_fn = CREW_REGISTRY[req.crew_type]
    logger.info("Starting crew '%s' with params: %s", req.crew_type, req.params)

    try:
        result = run_fn(**req.params)
    except Exception as exc:
        logger.exception("Crew '%s' failed", req.crew_type)
        raise HTTPException(
            status_code=500,
            detail=f"Crew execution failed: {exc}",
        )

    _last_crew_run["status"] = "completed"
    _last_crew_run["timestamp"] = datetime.now(timezone.utc).isoformat()
    _last_crew_run["result"] = result

    return result


@app.get("/api/crew/status")
def crew_status():
    return _last_crew_run


@app.get("/api/crew/types")
def list_crew_types():
    """Return available crew types and their required parameters."""
    return {
        "crews": {
            "match_prep": {
                "description": "Prepare for an upcoming match",
                "params": {"opponent": "str", "match_date": "YYYY-MM-DD", "pool": "str (optional)"},
            },
            "enrollment": {
                "description": "Monthly enrollment campaign",
                "params": {"season": "str (optional)", "camp_start": "YYYY-MM-DD (optional)"},
            },
            "progress_review": {
                "description": "Review player progress (all or single)",
                "params": {"player_id": "int (optional, omit for all)"},
            },
            "season_plan": {
                "description": "Full-season planning",
                "params": {"season_name": "str (optional)", "season_start": "YYYY-MM-DD (optional)", "season_end": "YYYY-MM-DD (optional)"},
            },
            "injury_response": {
                "description": "Respond to a player injury",
                "params": {"player_id": "int (required)", "injury_description": "str (required)", "severity": "mild|moderate|severe"},
            },
        }
    }


# ── Main ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn

    logger.info("Starting AquaOS backend — crews: %s", CREW_TYPES)
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False)
