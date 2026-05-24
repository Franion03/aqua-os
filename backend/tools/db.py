"""
AquaOS Database — SQLite schema for water polo training system.

Tables:
- levels: 7-level development system
- exercises: per-level exercise catalog with YouTube video support
"""

import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "aquaos.db")

# ── 7-Level Development System ──────────────────────────────────────
LEVELS_SEED = [
    {
        "id": 1, "name": "Water Competency & Basic Ball Handling",
        "description": "Establish fundamental water confidence and comfort. Players master proper freestyle technique, basic eggbeater kick, vertical positioning, and basic ball handling.",
        "order": 1,
        "skills": "Proper freestyle swimming technique with correct body alignment and breathing||Strong basic eggbeater kick for stationary stability||Vertical positioning and controlled vertical jumps||Basic ball handling (catching, gripping, and two-handed throwing)||Head-up swimming and simple dribbling||Safe water entries, gliding, and streamline position"
    },
    {
        "id": 2, "name": "Controlled Passing & Continuous Movement",
        "description": "Develop consistent passing and catching technique while learning to move effectively with the ball.",
        "order": 2,
        "skills": "Proper passing technique (wrist snap, ball spin, and accurate release)||Reliable catching with one and two hands while stationary and moving||Core stability and balance during ball handling||Continuous movement while dribbling with head up||Moving catch-and-release in one fluid motion||Basic eggbeater while performing arm actions (passing/sculling)"
    },
    {
        "id": 3, "name": "Handling Pressure & Basic Tactics",
        "description": "Introduce light defensive pressure while refining passing and shooting accuracy. Basic tactical concepts introduced.",
        "order": 3,
        "skills": "Passing and catching under light pressure||Basic faking (short and medium fakes)||Ball shielding and protection with the body||Proper shooting technique (wrist shot and push shot)||Simple tactical concepts: man-up positioning and basic zone defense||Swim-through movements to create space||Maintaining verticality and stability when contested"
    },
    {
        "id": 4, "name": "Individual Dominance & Defensive Fundamentals",
        "description": "Build individual 1v1 skills on both offense and defense.",
        "order": 4,
        "skills": "Winning the outside lane in 1v1 situations||Strong defensive positioning, footwork, and press defense||Contact shooting (shooting while defended)||Effective ball protection in physical duels||Basic transition play (offense to defense and vice versa)||Proper defensive posture (hand up, hips low, controlled distance)||Advanced eggbeater for explosive vertical jumps under pressure"
    },
    {
        "id": 5, "name": "Collective Play & Tactical Versatility",
        "description": "Develop team structure and coordinated play. Positional roles introduced.",
        "order": 5,
        "skills": "Pick and roll execution (timing and spacing)||Advanced man-up patterns and rotations||Defensive player switching and communication||Positional role fundamentals (Center, Center-Back, Wing, Goalie)||M-Zone defensive structure and rotation timing||Tactical patience and structured team attacks||Understanding of basic counterattack timing"
    },
    {
        "id": 6, "name": "High-Level Skills & Adaptive Teamplay",
        "description": "Refine advanced technical skills and develop game intelligence.",
        "order": 6,
        "skills": "Advanced faking (long fakes, shoulder fakes, double fakes, fake-and-drive)||Advanced defensive techniques (steals, shot blocking, fronting the center)||Center position mastery (seal & roll, backhand shots)||Reading opponent defenses and adapting in real time||Complex transition play (counter, reset, or press decisions)||High-level ball control under heavy pressure||Fluid combination of fakes, drives, and shots"
    },
    {
        "id": 7, "name": "High Performance & Competition Mastery",
        "description": "Prepare players for competitive performance at the highest level.",
        "order": 7,
        "skills": "Tactical leadership and play-calling on the field||Full game system execution (complex man-up, double picks, drive rotations)||Elite decision-making under fatigue and high pressure||Reading complex game situations and opponent tendencies||Maintaining technical precision and speed at competition intensity||Advanced pressing variations and defensive adjustments||Complete transition mastery in all game phases"
    },
]


def get_db():
    """Get a database connection with row factory."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    """Create tables and seed data if empty."""
    conn = get_db()

    conn.execute("""
        CREATE TABLE IF NOT EXISTS levels (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            "order" INTEGER NOT NULL,
            skills TEXT NOT NULL,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS exercises (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            level_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            skill_category TEXT NOT NULL DEFAULT 'general',
            difficulty TEXT NOT NULL DEFAULT 'beginner',
            equipment TEXT DEFAULT '',
            duration_minutes INTEGER DEFAULT 15,
            youtube_url TEXT DEFAULT '',
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (level_id) REFERENCES levels(id) ON DELETE CASCADE
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS availability (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player_id INTEGER NOT NULL,
            match_date TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available','unavailable','maybe')),
            note TEXT DEFAULT '',
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now')),
            UNIQUE(player_id, match_date)
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS matches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            opponent TEXT NOT NULL,
            match_date TEXT NOT NULL,
            match_time TEXT DEFAULT '14:00',
            pool TEXT NOT NULL DEFAULT 'Home Pool',
            pool_address TEXT DEFAULT '',
            home_city TEXT DEFAULT 'Bern',
            created_at TEXT DEFAULT (datetime('now'))
        )
    """)

    # Seed levels if empty
    existing = conn.execute("SELECT COUNT(*) FROM levels").fetchone()[0]
    if existing == 0:
        for level in LEVELS_SEED:
            conn.execute(
                "INSERT INTO levels (id, name, description, \"order\", skills) VALUES (?, ?, ?, ?, ?)",
                (level["id"], level["name"], level["description"], level["order"], level["skills"])
            )
        conn.commit()

    conn.close()


# ── Level CRUD ──────────────────────────────────────────────────────

def get_all_levels():
    conn = get_db()
    rows = conn.execute("SELECT * FROM levels ORDER BY \"order\"").fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_level(level_id: int):
    conn = get_db()
    row = conn.execute("SELECT * FROM levels WHERE id = ?", (level_id,)).fetchone()
    # Also fetch exercises for this level
    exercises = conn.execute(
        "SELECT * FROM exercises WHERE level_id = ? ORDER BY id DESC", (level_id,)
    ).fetchall()
    conn.close()
    if not row:
        return None
    result = dict(row)
    result["exercises"] = [dict(e) for e in exercises]
    return result


# ── Exercise CRUD ───────────────────────────────────────────────────

def add_exercise(level_id: int, name: str, description: str, skill_category: str = "general",
                 difficulty: str = "beginner", equipment: str = "", duration_minutes: int = 15,
                 youtube_url: str = ""):
    conn = get_db()
    cursor = conn.execute(
        """INSERT INTO exercises (level_id, name, description, skill_category, difficulty,
           equipment, duration_minutes, youtube_url)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        (level_id, name, description, skill_category, difficulty, equipment, duration_minutes, youtube_url)
    )
    conn.commit()
    exercise_id = cursor.lastrowid
    row = conn.execute("SELECT * FROM exercises WHERE id = ?", (exercise_id,)).fetchone()
    conn.close()
    return dict(row)


def get_exercises(level_id: int = None):
    conn = get_db()
    if level_id:
        rows = conn.execute(
            "SELECT e.*, l.name as level_name FROM exercises e JOIN levels l ON e.level_id = l.id WHERE e.level_id = ? ORDER BY e.id DESC",
            (level_id,)
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT e.*, l.name as level_name FROM exercises e JOIN levels l ON e.level_id = l.id ORDER BY l.\"order\", e.id DESC"
        ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def delete_exercise(exercise_id: int):
    conn = get_db()
    conn.execute("DELETE FROM exercises WHERE id = ?", (exercise_id,))
    conn.commit()
    conn.close()
    return True


# ── Skill CRUD ──────────────────────────────────────────────────────

def add_skill(level_id: int, skill: str) -> dict:
    """Append a skill to a level's skills string."""
    conn = get_db()
    row = conn.execute("SELECT skills FROM levels WHERE id = ?", (level_id,)).fetchone()
    if not row:
        conn.close()
        return None
    current = row["skills"]
    skills = [s.strip() for s in current.split("||") if s.strip()]
    skills.append(skill.strip())
    new_skills = "||".join(skills)
    conn.execute("UPDATE levels SET skills = ?, updated_at = datetime('now') WHERE id = ?", (new_skills, level_id))
    conn.commit()
    row = conn.execute("SELECT * FROM levels WHERE id = ?", (level_id,)).fetchone()
    conn.close()
    return dict(row)


def remove_skill(level_id: int, skill: str) -> dict:
    """Remove a skill from a level's skills string by exact match."""
    conn = get_db()
    row = conn.execute("SELECT skills FROM levels WHERE id = ?", (level_id,)).fetchone()
    if not row:
        conn.close()
        return None
    current = row["skills"]
    skills = [s.strip() for s in current.split("||") if s.strip()]
    skills = [s for s in skills if s.strip() != skill.strip()]
    new_skills = "||".join(skills)
    conn.execute("UPDATE levels SET skills = ?, updated_at = datetime('now') WHERE id = ?", (new_skills, level_id))
    conn.commit()
    row = conn.execute("SELECT * FROM levels WHERE id = ?", (level_id,)).fetchone()
    conn.close()
    return dict(row)


def update_skills(level_id: int, skills_list: list) -> dict:
    """Replace the entire skills list for a level."""
    conn = get_db()
    new_skills = "||".join(s.strip() for s in skills_list if s.strip())
    conn.execute("UPDATE levels SET skills = ?, updated_at = datetime('now') WHERE id = ?", (new_skills, level_id))
    conn.commit()
    row = conn.execute("SELECT * FROM levels WHERE id = ?", (level_id,)).fetchone()
    conn.close()
    return dict(row)


# ── Availability CRUD ─────────────────────────────────────────────

def get_availability(match_date: str = None, player_id: int = None):
    conn = get_db()
    query = "SELECT * FROM availability WHERE 1=1"
    params = []
    if match_date:
        query += " AND match_date = ?"
        params.append(match_date)
    if player_id:
        query += " AND player_id = ?"
        params.append(player_id)
    query += " ORDER BY player_id"
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def set_availability(player_id: int, match_date: str, status: str, note: str = ""):
    conn = get_db()
    conn.execute(
        """INSERT INTO availability (player_id, match_date, status, note)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(player_id, match_date) DO UPDATE SET
           status=excluded.status, note=excluded.note, updated_at=datetime('now')""",
        (player_id, match_date, status, note)
    )
    conn.commit()
    row = conn.execute(
        "SELECT * FROM availability WHERE player_id=? AND match_date=?", (player_id, match_date)
    ).fetchone()
    conn.close()
    return dict(row)


# ── Match CRUD ────────────────────────────────────────────────────

def save_match(opponent: str, match_date: str, match_time: str = "14:00",
               pool: str = "Home Pool", pool_address: str = "", home_city: str = "Bern"):
    conn = get_db()
    cursor = conn.execute(
        """INSERT INTO matches (opponent, match_date, match_time, pool, pool_address, home_city)
           VALUES (?, ?, ?, ?, ?, ?)""",
        (opponent, match_date, match_time, pool, pool_address, home_city)
    )
    conn.commit()
    row = conn.execute("SELECT * FROM matches WHERE id = ?", (cursor.lastrowid,)).fetchone()
    conn.close()
    return dict(row)


def get_match(match_id: int = None, match_date: str = None):
    conn = get_db()
    if match_id:
        row = conn.execute("SELECT * FROM matches WHERE id = ?", (match_id,)).fetchone()
    elif match_date:
        row = conn.execute("SELECT * FROM matches WHERE match_date = ?", (match_date,)).fetchone()
    else:
        row = conn.execute("SELECT * FROM matches ORDER BY match_date DESC LIMIT 1").fetchone()
    conn.close()
    return dict(row) if row else None


# ── Auto-init on import ─────────────────────────────────────────────
init_db()