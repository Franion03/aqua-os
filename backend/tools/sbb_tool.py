"""
SBB Transport API Tool — Swiss public transport connections.

Uses the free transport.opendata.ch API (no API key required).
Returns best connections between two Swiss locations with departure/arrival times.
"""

import logging
import httpx
from crewai.tools import tool

logger = logging.getLogger(__name__)

SBB_API = "https://transport.opendata.ch/v1/connections"


def get_travel_info(from_station: str, to_station: str, date: str, time: str = "07:00",
                     arrive_by: bool = False, limit: int = 3) -> list[dict]:
    """Fetch Swiss public transport connections between two stations.

    Args:
        from_station: Departure location (e.g., "Bern").
        to_station: Destination location (e.g., "Kreuzlingen").
        date: Date in YYYY-MM-DD format.
        time: Time in HH:MM format (default: 07:00).
        arrive_by: If True, find connections arriving by the given time.
        limit: Number of connections to return (default: 3).

    Returns:
        List of connection dicts with: from, to, departure, arrival, duration,
        transfers, sections (with train/bus details).
    """
    params = {
        "from": from_station,
        "to": to_station,
        "date": date,
        "time": time,
        "limit": limit,
    }
    if arrive_by:
        params["isArrivalTime"] = "1"

    try:
        resp = httpx.get(SBB_API, params=params, timeout=15)
        resp.raise_for_status()
        data = resp.json()
        connections = data.get("connections", [])
        return [_format_connection(c) for c in connections]
    except Exception as exc:
        logger.error("SBB API error: %s", exc)
        return [{"error": str(exc)}]


def _get_arrival_plan_raw(to_station: str, date: str, arrival_time: str) -> list[dict]:
    """Find connections that ARRIVE by a specific time (for game scheduling).

    Example: Players need to arrive at "Kreuzlingen" by "12:30" on match day.
    Returns connections from Bern that arrive before 12:30.
    """
    return get_travel_info(
        from_station="Bern",
        to_station=to_station,
        date=date,
        time=arrival_time,
        arrive_by=True,
        limit=3,
    )

def _get_return_plan_raw(from_station: str, date: str, departure_time: str) -> list[dict]:
    """Find connections that depart FROM the match location back to Bern."""
    return get_travel_info(
        from_station=from_station,
        to_station="Bern",
        date=date,
        time=departure_time,
        arrive_by=False,
        limit=3,
    )

# CrewAI tool wrappers
get_arrival_plan = tool("get_arrival_plan")(_get_arrival_plan_raw)
get_return_plan = tool("get_return_plan")(_get_return_plan_raw)


def _format_connection(conn: dict) -> dict:
    """Extract key fields from an SBB API connection response."""
    sections = []
    for sec in conn.get("sections", []):
        walk = sec.get("walk")
        if walk:
            sections.append({
                "type": "walk",
                "duration": _format_duration(walk.get("duration", 0)),
                "from": sec["departure"]["station"]["name"],
                "to": sec["arrival"]["station"]["name"],
            })
            continue

        journey = sec.get("journey")
        if journey:
            sections.append({
                "type": "transit",
                "category": journey.get("category", ""),
                "number": journey.get("number", ""),
                "operator": journey.get("operator", ""),
                "from": sec["departure"]["station"]["name"],
                "to": sec["arrival"]["station"]["name"],
                "departure": sec["departure"]["departure"][:19],
                "arrival": sec["arrival"]["arrival"][:19],
            })

    return {
        "departure": conn["from"]["departure"][:19],
        "arrival": conn["to"]["arrival"][:19],
        "from_station": conn["from"]["station"]["name"],
        "to_station": conn["to"]["station"]["name"],
        "duration": _format_duration(conn.get("duration", 0)),
        "transfers": conn.get("transfers", 0),
        "sections": sections,
    }


def _format_duration(duration) -> str:
    """Parse SBB duration format (string like '00d02:09:00' or int seconds)."""
    if not duration:
        return "0min"
    if isinstance(duration, str):
        import re
        m = re.match(r'(?:(\d+)d)?(\d+):(\d+):(\d+)', duration)
        if m:
            d = int(m.group(1) or 0)
            h = int(m.group(2))
            mins = int(m.group(3))
            total_min = d * 1440 + h * 60 + mins
            if total_min >= 60:
                hh, mm = divmod(total_min, 60)
                return f"{hh}h{mm}min" if mm else f"{hh}h"
            return f"{total_min}min"
        return duration
    seconds = int(duration)
    h, m = divmod(seconds // 60, 60)
    if h > 0:
        return f"{h}h{m}min" if m > 0 else f"{h}h"
    return f"{m}min"
