import { useState, useEffect, useCallback } from 'react';
import { Activity, Play, RefreshCw, CheckCircle, AlertCircle, Clock, Bot, Zap, Brain, ChevronRight } from 'lucide-react';

const API = '/api';

export default function CrewMonitor() {
  const [health, setHealth] = useState(null);
  const [crews, setCrews] = useState({});
  const [lastRun, setLastRun] = useState(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(null);
  const [runResult, setRunResult] = useState(null);
  const [form, setForm] = useState({ crew_type: 'match_prep', opponent: '', match_date: '', player_id: '1' });

  const fetchStatus = useCallback(async () => {
    try {
      const [h, c, s] = await Promise.all([
        fetch(`${API}/health`).then(r => r.json()),
        fetch(`${API}/crew/types`).then(r => r.json()),
        fetch(`${API}/crew/status`).then(r => r.json()),
      ]);
      setHealth(h);
      setCrews(c.crews || {});
      setLastRun(s);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchStatus(); const t = setInterval(fetchStatus, 10000); return () => clearInterval(t); }, [fetchStatus]);

  const triggerCrew = async (crewType) => {
    setTriggering(crewType);
    const params = crewType === 'match_prep'
      ? { opponent: form.opponent || 'Unknown Team', match_date: form.match_date || '2026-06-01' }
      : crewType === 'progress_review'
      ? { player_id: parseInt(form.player_id) || 1 }
      : crewType === 'lineup_builder'
      ? { opponent: form.opponent || 'SC Kreuzlingen', match_date: form.match_date || '2026-06-07',
          match_time: form.match_time || '14:00', pool: form.pool || 'Kreuzlingen',
          pool_address: form.pool_address || '', home_city: 'Bern' }
      : {};
    try {
      const r = await fetch(`${API}/crew/run`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ crew_type: crewType, params }),
      });
      const data = await r.json();
      setRunResult({ crew: crewType, data, time: new Date().toLocaleTimeString() });
      fetchStatus();
    } catch (e) { console.error(e); }
    setTriggering(null);
  };

  const crewIcons = {
    match_prep: Zap, enrollment: Bot, progress_review: Brain,
    season_plan: Activity, injury_response: AlertCircle,
    lineup_builder: Activity,
  };

  if (loading) return <div className="text-center py-5 text-secondary">Loading agent status...</div>;

  return (
    <div>
      {/* Hero */}
      <div className="card card-dark p-4 p-md-5 mb-4" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(6,182,212,0.08) 0%, transparent 60%)' }}>
        <span className="badge rounded-pill mb-2" style={{ background: 'rgba(6,182,212,0.15)', color: '#22d3ee', border: '1px solid rgba(6,182,212,0.2)' }}>AI Agents</span>
        <h2 className="fw-bold text-white mb-2">CrewAI Monitor</h2>
        <p className="text-secondary mb-0">Real-time status of your water polo agent crews.</p>
      </div>

      {/* Status bar */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="card card-dark p-3 text-center">
            <div className="fs-5 mb-1">{health?.llm_provider === 'openrouter' ? '🧠' : '🤖'}</div>
            <div className="fw-bold text-white" style={{ fontSize: '1.2rem' }}>{health?.llm_provider || 'unknown'}</div>
            <small className="text-secondary">LLM Provider</small>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card card-dark p-3 text-center">
            <div className="fs-5 mb-1">📦</div>
            <div className="fw-bold text-white" style={{ fontSize: '1.2rem' }}>{health?.crewai_version || '...'}</div>
            <small className="text-secondary">CrewAI</small>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card card-dark p-3 text-center">
            <div className="fs-5 mb-1">👥</div>
            <div className="fw-bold text-white" style={{ fontSize: '1.2rem' }}>{Object.keys(crews).length}</div>
            <small className="text-secondary">Crews Ready</small>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card card-dark p-3 text-center">
            <div className="fs-5 mb-1">{lastRun?.status === 'completed' ? '✅' : '⏳'}</div>
            <div className="fw-bold text-white text-capitalize" style={{ fontSize: '1rem' }}>{lastRun?.status || 'idle'}</div>
            <small className="text-secondary">Last Run</small>
          </div>
        </div>
      </div>

      {/* Last run result */}
      {runResult && (
        <div className="alert d-flex align-items-start gap-3 mb-4" style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)', color: '#e2e8f0', borderRadius: '12px' }}>
          <CheckCircle size={20} style={{ color: '#22d3ee', marginTop: 2 }} />
          <div>
            <strong>Crew "{runResult.crew}" completed</strong> at {runResult.time}
            <pre className="mt-2 mb-0 text-secondary" style={{ fontSize: '0.75rem', maxHeight: 150, overflow: 'auto', whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(runResult.data, null, 2).substring(0, 500)}
            </pre>
          </div>
        </div>
      )}

      {/* Crew list */}
      <div className="row g-3">
        {Object.entries(crews).map(([id, crew]) => {
          const Icon = crewIcons[id] || Bot;
          return (
            <div key={id} className="col-12 col-md-6 col-lg-4">
              <div className="card card-dark h-100">
                <div className="p-4">
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <div className="rounded-3 d-flex align-items-center justify-content-center" style={{ width: 42, height: 42, background: 'rgba(6,182,212,0.1)' }}>
                      <Icon size={22} style={{ color: '#22d3ee' }} />
                    </div>
                    <div>
                      <h6 className="fw-bold text-white mb-0 text-capitalize">{id.replace(/_/g, ' ')}</h6>
                      <small className="text-secondary">{crew.description}</small>
                    </div>
                  </div>

                  {/* Params */}
                  <div className="mb-3">
                    <small className="text-uppercase text-secondary d-block mb-1" style={{ fontSize: '0.65rem', letterSpacing: '0.08em' }}>Parameters</small>
                    <div className="d-flex flex-wrap gap-1">
                      {Object.entries(crew.params || {}).map(([k, v]) => (
                        <code key={k} className="badge" style={{ background: '#1e293b', color: '#94a3b8', fontSize: '0.65rem' }}>{k}: {v}</code>
                      ))}
                    </div>
                  </div>

                  {/* Quick trigger form for match_prep */}
                  {id === 'match_prep' && (
                    <div className="mb-3 p-2 rounded-3" style={{ background: 'rgba(2,6,23,0.3)' }}>
                      <input
                        value={form.opponent} onChange={e => setForm({...form, opponent: e.target.value})}
                        placeholder="Opponent name" className="form-control form-dark form-control-sm mb-2" />
                      <input
                        type="date" value={form.match_date} onChange={e => setForm({...form, match_date: e.target.value})}
                        className="form-control form-dark form-control-sm mb-2" />
                    </div>
                  )}

                  {id === 'progress_review' && (
                    <div className="mb-3 p-2 rounded-3" style={{ background: 'rgba(2,6,23,0.3)' }}>
                      <input
                        type="number" value={form.player_id} onChange={e => setForm({...form, player_id: e.target.value})}
                        placeholder="Player ID" min="1" max="5" className="form-control form-dark form-control-sm" />
                    </div>
                  )}

                  {id === 'lineup_builder' && (
                    <div className="mb-3 p-2 rounded-3" style={{ background: 'rgba(2,6,23,0.3)' }}>
                      <input
                        value={form.opponent} onChange={e => setForm({...form, opponent: e.target.value})}
                        placeholder="Opponent" className="form-control form-dark form-control-sm mb-2" />
                      <input
                        type="date" value={form.match_date} onChange={e => setForm({...form, match_date: e.target.value})}
                        className="form-control form-dark form-control-sm mb-2" />
                      <input
                        value={form.pool || ''} onChange={e => setForm({...form, pool: e.target.value})}
                        placeholder="Pool city (for SBB)" className="form-control form-dark form-control-sm mb-2" />
                      <input
                        value={form.pool_address || ''} onChange={e => setForm({...form, pool_address: e.target.value})}
                        placeholder="Pool full address" className="form-control form-dark form-control-sm mb-2" />
                      <input
                        type="time" value={form.match_time || '14:00'} onChange={e => setForm({...form, match_time: e.target.value})}
                        className="form-control form-dark form-control-sm" />
                    </div>
                  )}

                  <button
                    onClick={() => triggerCrew(id)}
                    disabled={triggering === id}
                    className="btn btn-sm w-100 d-flex align-items-center justify-content-center gap-2"
                    style={{ background: triggering === id ? '#334155' : 'rgba(6,182,212,0.15)', color: triggering === id ? '#94a3b8' : '#22d3ee', border: `1px solid ${triggering === id ? '#475569' : 'rgba(6,182,212,0.25)'}` }}>
                    {triggering === id ? (
                      <><RefreshCw size={14} className="spin" /> Running...</>
                    ) : (
                      <><Play size={14} /> Run Crew</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Refresh button */}
      <div className="text-center mt-4">
        <button onClick={fetchStatus} className="btn btn-sm d-inline-flex align-items-center gap-2" style={{ background: 'rgba(6,182,212,0.1)', color: '#22d3ee', border: '1px solid rgba(6,182,212,0.2)' }}>
          <RefreshCw size={14} /> Refresh Status
        </button>
      </div>

      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
