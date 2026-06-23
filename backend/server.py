"""AquaOS Backend Server - Club Management API"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

# Mock crewai to avoid import errors
import types
crewai_mock = types.ModuleType('crewai')
crewai_tools = types.ModuleType('crewai.tools')
crewai_mock.tools = crewai_tools
crewai_tools.tool = lambda name: lambda f: f
sys.modules['crewai'] = crewai_mock
sys.modules['crewai.tools'] = crewai_tools
chromadb_mock = types.ModuleType('chromadb')
sys.modules['chromadb'] = chromadb_mock

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uvicorn

from tools.db import (
    init_db, get_all_players, get_player, create_player, update_player, delete_player,
    get_all_matches, save_match, update_match_score, get_match,
    get_all_training_sessions, create_training_session, delete_training_session,
    get_all_levels, get_level, get_exercises, add_exercise, delete_exercise,
    get_availability, set_availability
)

app = FastAPI(title='AquaOS Club Management API')
app.add_middleware(CORSMiddleware, allow_origins=['*'], allow_methods=['*'], allow_headers=['*'])

init_db()

# Health
@app.get('/api/health')
def health():
    return {'status': 'ok', 'mode': 'local'}

# --- PLAYERS ---
class PlayerCreate(BaseModel):
    name: str
    age: int
    level: int = 1
    position: str = 'Wing'
    parent_name: str = ''
    parent_email: str = ''
    parent_phone: str = ''
    swimming: int = 50
    ball_handling: int = 50
    shooting: int = 50
    tactics: int = 50
    stamina: int = 50

class PlayerUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    level: Optional[int] = None
    position: Optional[str] = None
    parent_name: Optional[str] = None
    parent_email: Optional[str] = None
    parent_phone: Optional[str] = None
    swimming: Optional[int] = None
    ball_handling: Optional[int] = None
    shooting: Optional[int] = None
    tactics: Optional[int] = None
    stamina: Optional[int] = None
    status: Optional[str] = None

@app.get('/api/players')
def api_players():
    return get_all_players()

@app.get('/api/players/{pid}')
def api_player(pid: int):
    p = get_player(pid)
    if not p:
        raise HTTPException(404, 'Player not found')
    return p

@app.post('/api/players')
def api_create_player(d: PlayerCreate):
    return create_player(**d.model_dump())

@app.put('/api/players/{pid}')
def api_update_player(pid: int, d: PlayerUpdate):
    data = {k: v for k, v in d.model_dump().items() if v is not None}
    if not data:
        raise HTTPException(400, 'No fields to update')
    return update_player(pid, **data)

@app.delete('/api/players/{pid}')
def api_del_player(pid: int):
    delete_player(pid)
    return {'ok': True}

# --- MATCHES ---
class MatchCreate(BaseModel):
    opponent: str
    match_date: str
    match_time: str = '14:00'
    pool: str = 'Home Pool'
    pool_address: str = ''
    home_city: str = 'Bern'

class MatchScore(BaseModel):
    score_home: int
    score_away: int
    notes: str = ''

@app.get('/api/matches/all')
def api_matches():
    return get_all_matches()

@app.get('/api/matches/{mid}')
def api_match(mid: int):
    m = get_match(mid)
    if not m:
        raise HTTPException(404, 'Match not found')
    return m

@app.post('/api/matches')
def api_create_match(d: MatchCreate):
    return save_match(**d.model_dump())

@app.put('/api/matches/{mid}/score')
def api_update_score(mid: int, d: MatchScore):
    return update_match_score(mid, d.score_home, d.score_away, d.notes)

@app.delete('/api/matches/{mid}')
def api_del_match(mid: int):
    from tools.db import get_db
    conn = get_db()
    conn.execute('DELETE FROM matches WHERE id = ?', (mid,))
    conn.commit()
    return {'ok': True}

# --- TRAINING ---
class TrainingCreate(BaseModel):
    session_date: str
    session_time: str = '18:00'
    duration_minutes: int = 90
    focus: str = 'General'
    notes: str = ''
    level_id: Optional[int] = None

@app.get('/api/training')
def api_training():
    return get_all_training_sessions()

@app.post('/api/training')
def api_create_training(d: TrainingCreate):
    return create_training_session(**d.model_dump())

@app.delete('/api/training/{tid}')
def api_del_training(tid: int):
    delete_training_session(tid)
    return {'ok': True}

# --- LEVELS ---
@app.get('/api/levels')
def api_levels():
    return get_all_levels()

@app.get('/api/levels/{lid}')
def api_level(lid: int):
    l = get_level(lid)
    if not l:
        raise HTTPException(404, 'Level not found')
    return l

# --- EXERCISES ---
@app.get('/api/exercises')
def api_exercises(level_id: Optional[int] = None):
    return get_exercises(level_id)

@app.post('/api/exercises')
def api_add_exercise(data: dict):
    return add_exercise(**data)

@app.delete('/api/exercises/{eid}')
def api_del_exercise(eid: int):
    delete_exercise(eid)
    return {'ok': True}

# --- AVAILABILITY ---
@app.get('/api/availability')
def api_avail(match_date: Optional[str] = None, player_id: Optional[int] = None):
    return get_availability(match_date, player_id)

@app.post('/api/availability')
def api_set_avail(data: dict):
    return set_availability(**data)

if __name__ == '__main__':
    uvicorn.run(app, host='127.0.0.1', port=8000)
