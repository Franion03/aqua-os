"""
AquaOS Backend — FastAPI + CrewAI Agent Orchestrator.

Proof-of-concept deployment on AWS EC2 t3.micro (free tier).
Multi-model LLM routing via OpenRouter (preferred) or direct Gemini.
Database: SQLite (embedded). Vector memory: ChromaDB (embedded).

Provider priority:
  1. OPENROUTER_API_KEY → OpenRouter (all providers, per-agent model selection)
  2. GEMINI_API_KEY      → Google Gemini direct (single model)

Per-agent model assignments (OpenRouter paths):
  Tactical Analyst   → deepseek/deepseek-chat     (best reasoning)
  Technical Coach    → google/gemini-2.0-flash-001 (structured output)
  Physical Coach     → google/gemini-2.0-flash-001 (cheap + fast)
  Marketing          → anthropic/claude-3.5-haiku  (best copy tone)
"""

import logging
import os
import sys
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ── LLM Provider Detection (before CrewAI imports) ──────────────────────
# LiteLLM (CrewAI's engine) uses OPENAI_API_BASE + OPENAI_API_KEY.
# OpenRouter speaks the OpenAI protocol, so it's a drop-in swap.

_openrouter_key = os.getenv("OPENROUTER_API_KEY", "")
_gemini_key = os.getenv("GEMINI_API_KEY", "")

# Provider mode — determines which models are available
_llm_provider: str  # "openrouter" | "gemini" | "none"
_llm_default_model: str

if _openrouter_key:
    _llm_provider = "openrouter"
    _llm_default_model = "openrouter/google/gemini-2.0-flash-001"
    os.environ.setdefault("OPENAI_API_BASE", "https://openrouter.ai/api/v1")
    os.environ.setdefault("OPENAI_API_KEY", _openrouter_key)
    os.environ.setdefault("OPENAI_MODEL_NAME", _llm_default_model)
    # OpenRouter-specific headers for cost tracking
    os.environ.setdefault("OR_SITE_URL", "https://github.com/franion03/aqua-os")
    os.environ.setdefault("OR_APP_NAME", "AquaOS")

elif _gemini_key:
    _llm_provider = "gemini"
    _llm_default_model = "gemini-2.0-flash"
    os.environ.setdefault("OPENAI_API_BASE", "https://generativelanguage.googleapis.com/v1beta/openai/")
    os.environ.setdefault("OPENAI_API_KEY", _gemini_key)
    os.environ.setdefault("OPENAI_MODEL_NAME", _llm_default_model)

else:
    _llm_provider = "none"
    _llm_default_model = "none"

# ── Now safe to import CrewAI-dependent modules ─────────────────────────
from crews import CREW_REGISTRY

# ── Database ─────────────────────────────────────────────────────────────
from tools.db import (
    get_all_levels, get_level,
    add_exercise, get_exercises, delete_exercise,
    add_skill, remove_skill, update_skills,
    get_availability, set_availability,
    save_match, get_match,
)

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
    return {
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "llm_provider": _llm_provider,
        "llm_default_model": _llm_default_model,
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

    if _llm_provider == "none":
        raise HTTPException(
            status_code=503,
            detail="No LLM provider configured. Set OPENROUTER_API_KEY or GEMINI_API_KEY.",
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
            "lineup_builder": {
                "description": "Build lineup + SBB travel plan + parent communication",
                "params": {"opponent": "str", "match_date": "YYYY-MM-DD", "match_time": "HH:MM (default 14:00)", "pool": "str (city name for SBB)", "pool_address": "str (optional)", "home_city": "str (default Bern)"},
            },
        }
    }


# ── Levels & Exercises ───────────────────────────────────────────────────
from pydantic import BaseModel as PydanticBase, Field

class ExerciseCreate(PydanticBase):
    level_id: int
    name: str
    description: str
    skill_category: str = "general"
    difficulty: str = "beginner"
    equipment: str = ""
    duration_minutes: int = 15
    youtube_url: str = ""


@app.get("/api/levels")
def api_list_levels():
    """List all 7 training levels."""
    return {"levels": get_all_levels()}


@app.get("/api/levels/{level_id}")
def api_get_level(level_id: int):
    """Get a single level with its exercises."""
    level = get_level(level_id)
    if not level:
        raise HTTPException(status_code=404, detail="Level not found")
    return level


@app.post("/api/exercises")
def api_add_exercise(data: ExerciseCreate):
    """Add an exercise to a level."""
    try:
        exercise = add_exercise(
            level_id=data.level_id,
            name=data.name,
            description=data.description,
            skill_category=data.skill_category,
            difficulty=data.difficulty,
            equipment=data.equipment,
            duration_minutes=data.duration_minutes,
            youtube_url=data.youtube_url,
        )
        logger.info("Exercise added: %s (level %d)", data.name, data.level_id)
        return exercise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/exercises")
def api_list_exercises(level_id: int = None):
    """List exercises, optionally filtered by level."""
    return {"exercises": get_exercises(level_id)}


@app.delete("/api/exercises/{exercise_id}")
def api_delete_exercise(exercise_id: int):
    """Delete an exercise."""
    delete_exercise(exercise_id)
    logger.info("Exercise %d deleted", exercise_id)
    return {"status": "ok"}


# ── Skills ──────────────────────────────────────────────────────────

class SkillAction(BaseModel):
    skill: str

@app.post("/api/levels/{level_id}/skills")
def api_add_skill(level_id: int, data: SkillAction):
    """Add a skill to a level."""
    level = add_skill(level_id, data.skill)
    if not level:
        raise HTTPException(status_code=404, detail="Level not found")
    return level

@app.delete("/api/levels/{level_id}/skills")
def api_remove_skill(level_id: int, data: SkillAction):
    """Remove a skill from a level."""
    level = remove_skill(level_id, data.skill)
    if not level:
        raise HTTPException(status_code=404, detail="Level not found")
    return level


# ── Availability ────────────────────────────────────────────────────

class AvailabilitySet(BaseModel):
    player_id: int
    match_date: str
    status: str = "available"
    note: str = ""

@app.get("/api/availability")
def api_get_availability(match_date: str = None, player_id: int = None):
    """Get player availability for a match date."""
    return {"availability": get_availability(match_date=match_date, player_id=player_id)}

@app.post("/api/availability")
def api_set_availability(data: AvailabilitySet):
    """Set a player's availability for a match."""
    return set_availability(
        player_id=data.player_id,
        match_date=data.match_date,
        status=data.status,
        note=data.note,
    )

# ── Matches ─────────────────────────────────────────────────────────

class MatchCreate(BaseModel):
    opponent: str
    match_date: str
    match_time: str = "14:00"
    pool: str = "Home Pool"
    pool_address: str = ""
    home_city: str = "Bern"

@app.post("/api/matches")
def api_save_match(data: MatchCreate):
    """Save a match to the database."""
    return save_match(
        opponent=data.opponent, match_date=data.match_date,
        match_time=data.match_time, pool=data.pool,
        pool_address=data.pool_address, home_city=data.home_city,
    )

@app.get("/api/matches")
def api_get_match(match_date: str = None):
    """Get match info by date or latest match."""
    match = get_match(match_date=match_date)
    if not match:
        raise HTTPException(status_code=404, detail="No match found")
    return match

# ── SBB Travel ──────────────────────────────────────────────────────

from tools.sbb_tool import get_travel_info, _get_arrival_plan_raw, _get_return_plan_raw

@app.get("/api/travel")
def api_travel_info(from_station: str = "Bern", to_station: str = "Kreuzlingen",
                     date: str = None, time: str = "07:00"):
    """Get SBB/CFF public transport connections."""
    if not date:
        date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    return {
        "connections": get_travel_info(
            from_station=from_station, to_station=to_station,
            date=date, time=time
        )
    }

@app.get("/api/travel/arrival")
def api_arrival_plan(to_station: str, date: str, arrival_time: str):
    """Get SBB connections that arrive by a specific time."""
    return {"connections": _get_arrival_plan_raw(to_station, date, arrival_time)}

@app.get("/api/travel/return")
def api_return_plan(from_station: str, date: str, departure_time: str):
    """Get SBB connections departing from match location back to Bern."""
    return {"connections": _get_return_plan_raw(from_station, date, departure_time)}


# ── Main ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn

    logger.info("Starting AquaOS backend — crews: %s", CREW_TYPES)
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False)
