# ── AquaOS Tools ────────────────────────────────────────────────────────
# CrewAI-compatible tool functions for club operations.
# Each tool is decorated with @tool for CrewAI agent consumption.

from .player_db import get_roster_players, get_player_details, add_progress_log
from .email_tool import send_parent_email
from .calendar_tool import schedule_training, schedule_match

__all__ = [
    "get_roster_players",
    "get_player_details",
    "add_progress_log",
    "send_parent_email",
    "schedule_training",
    "schedule_match",
]
