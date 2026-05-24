"""
Player Database Tool — CrewAI-compatible.

PoC: In-memory store seeded from React frontend data model.
Production: Replace with SQLAlchemy + PostgreSQL.
"""

import json
import logging
from datetime import date
from typing import Optional

from crewai.tools import tool

logger = logging.getLogger(__name__)

# ── Seed data (matches aqua-os/src/App.jsx INITIAL_PLAYERS) ──────────
_PLAYERS = [
    {
        "id": 1, "name": "Liam Alvarez", "age": 11, "level": 2,
        "parent_name": "Roberto Alvarez", "parent_email": "roberto@alvarez.com",
        "parent_phone": "+41791234561",
        "parent_telegram": "@roberto_alvarez",
        "skills": {"swimming": 65, "ballHandling": 58, "shooting": 55, "tactics": 48, "stamina": 70},
        "progress_logs": [
            {"date": "2026-05-10", "note": "Promoted to Level 2: Bronze. Stronger vertical eggbeater."},
            {"date": "2026-04-12", "note": "Completed U12 head-up freestyle speed test."},
        ],
    },
    {
        "id": 2, "name": "Mateo Rossi", "age": 13, "level": 3,
        "parent_name": "Carla Rossi", "parent_email": "carla@rossi.net",
        "parent_phone": "+41791234562",
        "parent_telegram": "@carla_rossi",
        "skills": {"swimming": 80, "ballHandling": 75, "shooting": 72, "tactics": 68, "stamina": 78},
        "progress_logs": [
            {"date": "2026-04-20", "note": "Promoted to Level 3: Silver. Wrist passing accuracy excellent."},
            {"date": "2026-03-01", "note": "Scored 4 goals in training match."},
        ],
    },
    {
        "id": 3, "name": "Sofia Dubois", "age": 10, "level": 1,
        "parent_name": "Jean Dubois", "parent_email": "jean@dubois.org",
        "parent_phone": "+41791234563",
        "parent_telegram": "@jean_dubois",
        "skills": {"swimming": 45, "ballHandling": 35, "shooting": 40, "tactics": 30, "stamina": 50},
        "progress_logs": [
            {"date": "2026-05-15", "note": "Roster initialized. Good comfort in deep water."},
        ],
    },
    {
        "id": 4, "name": "Lucas Kovač", "age": 14, "level": 4,
        "parent_name": "Ivan Kovač", "parent_email": "ivan.kovac@croatia.hr",
        "parent_phone": "+41791234564",
        "parent_telegram": "@ivan_kovac",
        "skills": {"swimming": 92, "ballHandling": 90, "shooting": 95, "tactics": 88, "stamina": 94},
        "progress_logs": [
            {"date": "2026-05-01", "note": "Promoted to Level 4: Gold. CF positioning secure under load."},
            {"date": "2026-02-14", "note": "Lactate swim benchmark: 10x100m on 1:40."},
        ],
    },
    {
        "id": 5, "name": "Emma Santos", "age": 12, "level": 2,
        "parent_name": "Isabella Santos", "parent_email": "isabella@santos-family.com",
        "parent_phone": "+41791234565",
        "parent_telegram": "@isabella_santos",
        "skills": {"swimming": 70, "ballHandling": 62, "shooting": 60, "tactics": 52, "stamina": 68},
        "progress_logs": [
            {"date": "2026-05-18", "note": "Improved layout-to-vertical body transition."},
            {"date": "2026-03-29", "note": "Completed 1-minute high vertical treading challenge."},
        ],
    },
]

LEVEL_NAMES = {1: "Pups / Beginners", 2: "Bronze / Intermediate", 3: "Silver / Advanced", 4: "Gold / Elite"}


@tool("get_roster_players")
def get_roster_players(level: Optional[int] = None) -> str:
    """Fetch all players from the club database, optionally filtered by level (1-4).

    Args:
        level: Optional skill level filter (1=Pups, 2=Bronze, 3=Silver, 4=Gold).

    Returns:
        JSON string with player data: id, name, age, level, skills, parent info.
    """
    players = _PLAYERS
    if level is not None:
        players = [p for p in _PLAYERS if p["level"] == level]

    result = []
    for p in players:
        result.append({
            "id": p["id"],
            "name": p["name"],
            "age": p["age"],
            "level": p["level"],
            "level_name": LEVEL_NAMES.get(p["level"], "Unknown"),
            "skills": p["skills"],
            "parent_name": p["parent_name"],
            "parent_email": p["parent_email"],
            "parent_phone": p.get("parent_phone", ""),
            "parent_telegram": p.get("parent_telegram", ""),
        })

    logger.info("get_roster_players(level=%s) → %d players", level, len(result))
    return json.dumps(result, indent=2)


@tool("get_player_details")
def get_player_details(player_id: int) -> str:
    """Get full details for a single player including progress logs.

    Args:
        player_id: The player's numeric ID (1-5 in PoC).

    Returns:
        JSON string with full player record.
    """
    for p in _PLAYERS:
        if p["id"] == player_id:
            logger.info("get_player_details(%d) → %s", player_id, p["name"])
            return json.dumps(p, indent=2)

    logger.warning("get_player_details(%d) → not found", player_id)
    return json.dumps({"error": f"Player {player_id} not found"})


@tool("add_progress_log")
def add_progress_log(player_id: int, note: str) -> str:
    """Add a progress log entry for a player (e.g., level-up, benchmark achieved).

    Args:
        player_id: The player's numeric ID.
        note: The progression note to record.

    Returns:
        Confirmation string.
    """
    for p in _PLAYERS:
        if p["id"] == player_id:
            entry = {"date": date.today().isoformat(), "note": note}
            p["progress_logs"].append(entry)
            logger.info("add_progress_log(%d) → recorded: %s", player_id, note[:60])
            return json.dumps({"status": "ok", "player": p["name"], "entry": entry})

    return json.dumps({"error": f"Player {player_id} not found"})
