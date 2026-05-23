"""
Calendar Tool — CrewAI-compatible.

PoC: Logs calendar events to stdout.
Production: Swap with Google Calendar API or CalDAV.
"""

import json
import logging

from crewai.tools import tool

logger = logging.getLogger(__name__)


@tool("schedule_training")
def schedule_training(date_str: str, time_str: str, pool: str, notes: str) -> str:
    """Schedule a training session on the club calendar.

    Args:
        date_str: Date in ISO format (YYYY-MM-DD).
        time_str: Time in 24h format (HH:MM).
        pool: Pool name or location.
        notes: Session description, drills, or coaching notes.

    Returns:
        JSON confirmation.
    """
    event = {
        "status": "logged",
        "mode": "poc",
        "type": "training",
        "date": date_str,
        "time": time_str,
        "pool": pool,
        "notes": notes,
    }

    logger.info("schedule_training → %s %s @ %s", date_str, time_str, pool)
    print(f"\n📅 TRAINING SCHEDULED (PoC): {date_str} {time_str} @ {pool}\n   {notes}\n")

    return json.dumps(event, indent=2)


@tool("schedule_match")
def schedule_match(
    date_str: str,
    time_str: str,
    opponent: str,
    pool: str,
    notes: str = "",
) -> str:
    """Schedule a competitive match on the club calendar.

    Args:
        date_str: Date in ISO format (YYYY-MM-DD).
        time_str: Time in 24h format (HH:MM).
        opponent: Opposing club name.
        pool: Pool name or location (home/away).
        notes: Additional match notes.

    Returns:
        JSON confirmation.
    """
    event = {
        "status": "logged",
        "mode": "poc",
        "type": "match",
        "date": date_str,
        "time": time_str,
        "opponent": opponent,
        "pool": pool,
        "notes": notes,
    }

    logger.info("schedule_match → %s vs %s @ %s", date_str, opponent, pool)
    print(f"\n🏆 MATCH SCHEDULED (PoC): {date_str} {time_str} — vs {opponent} @ {pool}\n")

    return json.dumps(event, indent=2)
