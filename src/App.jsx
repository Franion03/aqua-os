import { useState, useEffect } from 'react';
import { Dumbbell, LayoutDashboard, CalendarDays, Bot, Users, Trophy } from 'lucide-react';
import LevelView from './components/LevelView';
import TrainingPlanner from './components/TrainingPlanner';
import CrewMonitor from './components/CrewMonitor';
import PlayerTracker from './components/PlayerTracker';

const API = '/api';

// Transform flat API player data to PlayerTracker's expected format
function transformPlayer(p) {
  return {
    id: p.id, name: p.name, age: p.age, level: p.level, position: p.position,
    parentName: p.parent_name || 'N/A', parentEmail: p.parent_email || '',
    parentPhone: p.parent_phone || '', status: p.status || 'active',
    skills: { swimming: p.swimming || 50, ballHandling: p.ball_handling || 50, shooting: p.shooting || 50, tactics: p.tactics || 50, stamina: p.stamina || 50 },
    progressLogs: []
  };
}

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'roster', label: 'Roster', icon: Users },
  { id: 'levels', label: 'Levels', icon: Dumbbell },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'matches', label: 'Matches', icon: Trophy },
  { id: 'crews', label: 'AI Crews', icon: Bot },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [training, setTraining] = useState([]);

  useEffect(() => {
    fetch(`${API}/players`).then(r => r.json()).then(data => setPlayers(data.map(transformPlayer))).catch(() => {});
    fetch(`${API}/matches/all`).then(r => r.json()).then(setMatches).catch(() => {});
    fetch(`${API}/training`).then(r => r.json()).then(setTraining).catch(() => {});
  }, []);

  return (
    <div className="min-vh-100 d-flex flex-column">
      <nav className="navbar navbar-expand navbar-dark-custom sticky-top py-2">
        <div className="container-fluid px-3 px-md-4">
          <span className="navbar-brand d-flex align-items-center gap-2 fw-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
            <span style={{ fontSize: '1.5rem' }}>🤽</span>
            <span className="d-none d-sm-inline">AquaOS</span>
          </span>
          <ul className="navbar-nav flex-row gap-1">
            {TABS.map(tab => (
              <li key={tab.id} className="nav-item">
                <button onClick={() => setActiveTab(tab.id)}
                  className={`nav-link d-flex align-items-center gap-2 ${activeTab === tab.id ? 'active' : ''}`}>
                  <tab.icon size={18} />
                  <span className="d-none d-md-inline">{tab.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <main className="flex-grow-1 py-4">
        <div className="container-fluid px-3 px-md-4" style={{ maxWidth: '1200px' }}>
          {activeTab === 'dashboard' && <Dashboard players={players} matches={matches} training={training} />}
          {activeTab === 'roster' && <PlayerTracker players={players} setPlayers={setPlayers} />}
          {activeTab === 'levels' && <LevelView />}
          {activeTab === 'calendar' && <CalendarView matches={matches} training={training} />}
          {activeTab === 'matches' && <MatchesView matches={matches} setMatches={setMatches} />}
          {activeTab === 'crews' && <CrewMonitor />}
        </div>
      </main>

      <footer className="py-3 text-center border-top" style={{ borderColor: '#1e293b' }}>
        <small className="text-secondary">SKB Waterpolo Club © 2026 — Powered by AquaOS</small>
      </footer>
    </div>
  );
}

function Dashboard({ players, matches, training }) {
  const nextMatch = matches.find(m => m.match_date >= new Date().toISOString().split('T')[0]);
  const activeCount = players.filter(p => p.status === 'active').length;
  const upcomingTraining = training.filter(t => t.session_date >= new Date().toISOString().split('T')[0]);

  return (
    <div>
      <div className="card card-dark p-4 p-md-5 mb-4" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(6,182,212,0.08) 0%, transparent 60%)' }}>
        <span className="badge rounded-pill mb-2" style={{ background: 'rgba(6,182,212,0.15)', color: '#22d3ee', border: '1px solid rgba(6,182,212,0.2)' }}>Club Management Platform</span>
        <h2 className="fw-bold text-white mb-2">SKB Waterpolo Club</h2>
        <p className="text-secondary mb-0">Full club management — roster, training, matches, and AI-powered coaching.</p>
      </div>

      <div className="row g-3 mb-4">
        {[
          { label: 'Active Players', value: activeCount, icon: '👥' },
          { label: 'Matches', value: matches.length, icon: '🏆' },
          { label: 'Training Sessions', value: upcomingTraining.length, icon: '📅' },
          { label: 'Levels', value: 7, icon: '🤽' },
        ].map(s => (
          <div key={s.label} className="col-6 col-md-3">
            <div className="card card-dark p-3 p-md-4 text-center h-100">
              <div className="fs-2 mb-2">{s.icon}</div>
              <div className="fs-3 fw-bold text-white">{s.value}</div>
              <small className="text-secondary">{s.label}</small>
            </div>
          </div>
        ))}
      </div>

      {nextMatch && (
        <div className="card card-dark p-4 mb-4">
          <h5 className="text-white mb-3">🏆 Next Match</h5>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <strong className="text-white">vs {nextMatch.opponent}</strong>
              <p className="text-secondary mb-0">{nextMatch.match_date} at {nextMatch.match_time}</p>
              <small className="text-secondary">{nextMatch.pool}</small>
            </div>
            <span className="badge rounded-pill bg-primary">{nextMatch.home_city === 'Bern' ? 'Home' : 'Away'}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function CalendarView({ matches, training }) {
  const allEvents = [
    ...matches.map(m => ({ type: 'match', date: m.match_date, time: m.match_time, title: `vs ${m.opponent}`, detail: m.pool })),
    ...training.map(t => ({ type: 'training', date: t.session_date, time: t.session_time, title: t.focus, detail: `${t.duration_minutes}min` })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div>
      <h3 className="text-white mb-4">📅 Club Calendar</h3>
      <div className="row g-3">
        {allEvents.map((event, i) => (
          <div key={i} className="col-12 col-md-6">
            <div className="card card-dark p-3 d-flex flex-row align-items-center gap-3">
              <div className="text-center" style={{ minWidth: '60px' }}>
                <div className="fs-4">{event.type === 'match' ? '🏆' : '🏊'}</div>
                <small className="text-secondary">{new Date(event.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</small>
              </div>
              <div className="flex-grow-1">
                <strong className="text-white">{event.title}</strong>
                <p className="text-secondary mb-0 small">{event.time} — {event.detail}</p>
              </div>
              <span className={`badge rounded-pill ${event.type === 'match' ? 'bg-danger' : 'bg-info'}`}>
                {event.type}
              </span>
            </div>
          </div>
        ))}
        {allEvents.length === 0 && <p className="text-secondary">No upcoming events.</p>}
      </div>
    </div>
  );
}

function MatchesView({ matches, setMatches }) {
  const past = matches.filter(m => m.match_date < new Date().toISOString().split('T')[0] || m.score_home !== null);
  const upcoming = matches.filter(m => m.match_date >= new Date().toISOString().split('T')[0] && m.score_home === null);

  return (
    <div>
      <h3 className="text-white mb-4">🏆 Matches</h3>

      {upcoming.length > 0 && (
        <>
          <h5 className="text-secondary mb-3">Upcoming</h5>
          <div className="row g-3 mb-4">
            {upcoming.map(m => (
              <div key={m.id} className="col-12 col-md-6">
                <div className="card card-dark p-3">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <strong className="text-white">vs {m.opponent}</strong>
                      <p className="text-secondary mb-0 small">{m.match_date} at {m.match_time}</p>
                      <small className="text-secondary">{m.pool}</small>
                    </div>
                    <span className="badge rounded-pill bg-warning text-dark">Upcoming</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {past.length > 0 && (
        <>
          <h5 className="text-secondary mb-3">Results</h5>
          <div className="row g-3">
            {past.map(m => (
              <div key={m.id} className="col-12 col-md-6">
                <div className="card card-dark p-3">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <strong className="text-white">vs {m.opponent}</strong>
                      <p className="text-secondary mb-0 small">{m.match_date}</p>
                    </div>
                    {m.score_home !== null ? (
                      <span className={`badge rounded-pill ${m.score_home > m.score_away ? 'bg-success' : m.score_home < m.score_away ? 'bg-danger' : 'bg-secondary'}`}>
                        {m.score_home} - {m.score_away}
                      </span>
                    ) : (
                      <span className="badge rounded-pill bg-secondary">No score</span>
                    )}
                  </div>
                  {m.notes && <small className="text-secondary mt-2 d-block">{m.notes}</small>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {matches.length === 0 && <p className="text-secondary">No matches scheduled.</p>}
    </div>
  );
}