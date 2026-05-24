"""
Lineup Builder Crew.

Trigger: Send lineup with travel instructions to players and parents.
Agents: Tactical Analyst → Travel Coordinator → Technical Coach → Marketing
Outputs: Travel plan (Bern→match→Bern), available player list, 13-player roster,
         parent email with full logistics (travel + arrival + lineup)
"""

import logging
from datetime import datetime, timedelta

from crewai import Agent, Crew, Process, Task
from llm_config import model_for

from tools.player_db import get_roster_players, get_player_details
from tools.email_tool import send_parent_email
from tools.whatsapp_tool import send_whatsapp, send_whatsapp_bulk
from tools.telegram_tool import send_telegram, send_telegram_bulk, send_telegram_channel
from tools.sbb_tool import get_arrival_plan, get_return_plan

logger = logging.getLogger(__name__)


# ── Agents ──────────────────────────────────────────────────────────────

tactical_analyst = Agent(
    role="Tactical Analyst & Opposition Scout",
    goal="Analyze opponents and produce actionable tactical briefings",
    backstory=(
        "Data-driven water polo analyst who studies opponent formations, "
        "key player tendencies, and exploitable defensive gaps."
    ),
    tools=[get_roster_players],
    allow_delegation=False,
    verbose=True,
    llm=model_for("tactical"),
)

travel_coordinator = Agent(
    role="Travel & Logistics Coordinator",
    goal="Plan optimal team travel using Swiss public transport (SBB/CFF)",
    backstory=(
        "Expert Swiss travel coordinator who knows the SBB/CFF network intimately. "
        "You plan team travel with precise departure times, connections, and "
        "ensures the team arrives EXACTLY 1.5 hours before any match. "
        "You always plan trips from Bern HB and back to Bern HB."
    ),
    tools=[get_arrival_plan, get_return_plan],
    allow_delegation=False,
    verbose=True,
    llm=model_for("technical"),
)

technical_coach = Agent(
    role="Technical Head Coach",
    goal="Select optimal rosters from available players and design match strategies",
    backstory=(
        "Former national team head coach. You build rosters that balance "
        "experience with development opportunity, selecting from only "
        "confirmed available players."
    ),
    tools=[get_roster_players, get_player_details],
    allow_delegation=False,
    verbose=True,
    llm=model_for("technical"),
)

marketing_agent = Agent(
    role="Communications Director",
    goal="Draft complete match-day communications with travel + lineup info",
    backstory=(
        "Professional sports club communicator who ensures every parent "
        "knows exactly when and where to be, with clear travel instructions."
    ),
    tools=[send_telegram_channel, send_telegram_bulk, send_telegram, send_parent_email, send_whatsapp_bulk, get_roster_players],
    allow_delegation=False,
    verbose=True,
    llm=model_for("marketing"),
)


# ── Crew Builder ────────────────────────────────────────────────────────

def build_lineup_crew(opponent: str, match_date: str, match_time: str = "14:00",
                       pool: str = "Home Pool", pool_address: str = "",
                       home_city: str = "Bern") -> Crew:
    """Assemble the lineup builder crew with transport planning.

    Args:
        opponent: Name of the opposing club.
        match_date: Match date in YYYY-MM-DD format.
        match_time: Match start time in HH:MM (default: 14:00).
        pool: Pool name or city (e.g., "Kreuzlingen").
        pool_address: Full address of the pool.
        home_city: Home city for departure (default: Bern).
    """

    # Calculate required arrival time: match_time - 1.5 hours
    match_dt = datetime.strptime(f"{match_date} {match_time}", "%Y-%m-%d %H:%M")
    arrival_dt = match_dt - timedelta(hours=1, minutes=30)
    arrival_time = arrival_dt.strftime("%H:%M")
    # Estimated departure from match: match_time + 2h (game + cooldown)
    return_dt = match_dt + timedelta(hours=2)
    return_time = return_dt.strftime("%H:%M")

    analyze_opponent = Task(
        description=(
            f"Analyze the opponent '{opponent}' in our regional youth water polo "
            "league. Identify their formation, key players, and 2-3 tactical "
            "weaknesses. Write a concise tactical briefing."
        ),
        agent=tactical_analyst,
        expected_output="Tactical briefing with formation analysis, key players, weaknesses, and counter-strategy.",
    )

    plan_travel = Task(
        description=(
            f"Plan the team travel from '{home_city}' to '{pool}' on {match_date}. "
            f"The team MUST arrive by {arrival_time} (1.5 hours before the {match_time} match). "
            f"Use the SBB/CFF API to find the best connections. "
            f"Also plan the RETURN trip from '{pool}' back to '{home_city}' "
            f"departing around {return_time}. "
            "CRITICAL: For both trips, provide: "
            "- Exact departure time and station "
            "- All train/bus connections with platform numbers if available "
            "- Total travel duration "
            "- Number of transfers "
            "- Recommended departure time for players from Bern HB"
        ),
        agent=travel_coordinator,
        expected_output=(
            "Detailed travel plan with: OUTBOUND (Bern→match) connections, "
            "RETURN (match→Bern) connections, recommended departure times, "
            "total durations, and transfer details."
        ),
    )

    select_lineup = Task(
        description=(
            f"Based on the tactical analysis of '{opponent}', select the optimal "
            "13-player match roster. Query the player database for all players, "
            "then select starting 7 and 6 substitutes considering player levels, "
            "skill ratings, and position compatibility. "
            "Output: Starting 7 with positions, substitute blocks of 3+2+1, "
            "rotation strategy notes."
        ),
        agent=technical_coach,
        context=[analyze_opponent],
        expected_output=(
            "Structured 13-player lineup with starting 7, 6 substitutes, "
            "position assignments, and rotation plan."
        ),
    )

    send_lineup = Task(
        description=(
            "Draft a complete match-day communication and send it via Telegram channel to ALL parents. "
            "CRITICAL: After drafting, send the message using send_telegram_channel first "
            "(this reaches all parents in the club channel at once). "
            "Include EVERYTHING in ONE message with HTML formatting for Telegram: "
            "1. 📅 <b>MATCH</b>: opponent, date, time, pool address "
            "2. 🚂 <b>TRAVEL</b>: exact departure from Bern HB, connections, arrival, "
            f"   and return trip (players must arrive by {arrival_time}) "
            "3. 🏊 <b>LINEUP</b>: full 13-player roster with positions "
            "4. ✅ <b>CHECKLIST</b>: cap, weight belt, towel, water bottle, swimsuit "
            "5. 📍 <b>MEETING POINT</b>: Bern HB main hall, under the big clock, 30 min before departure "
            "Use HTML tags: <b>bold</b> for section headers, <i>italic</i> for notes, "
            "<a href='...'>links</a> for SBB timetable URLs. "
            "Query the player database to get all parent_telegram handles. "
            "Call send_telegram_channel first to send to the club channel. "
            "Then call send_telegram_bulk with all parent_telegram handles as DM backup. "
            "End with club president signature."
        ),
        agent=marketing_agent,
        context=[plan_travel, select_lineup],
        expected_output=(
            "Complete parent communication draft with match info, travel plan, "
            "lineup, equipment checklist, meeting point, and signature."
        ),
    )

    crew = Crew(
        agents=[tactical_analyst, travel_coordinator, technical_coach, marketing_agent],
        tasks=[analyze_opponent, plan_travel, select_lineup, send_lineup],
        process=Process.sequential,
        verbose=True,
    )
    return crew


def run_lineup_builder(opponent: str = "Regional Rivals", match_date: str = "2026-06-07",
                        match_time: str = "14:00", pool: str = "Home Pool",
                        pool_address: str = "", home_city: str = "Bern") -> dict:
    """Run the lineup builder crew and return structured results."""
    crew = build_lineup_crew(
        opponent=opponent, match_date=match_date, match_time=match_time,
        pool=pool, pool_address=pool_address, home_city=home_city
    )
    result = crew.kickoff()
    return {
        "crew_type": "lineup_builder",
        "opponent": opponent,
        "match_date": match_date,
        "match_time": match_time,
        "pool": pool,
        "raw_output": str(result),
    }
