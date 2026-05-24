import { useState } from 'react';
import { Dumbbell, LayoutDashboard, CalendarDays } from 'lucide-react';
import LevelView from './components/LevelView';
import TrainingPlanner from './components/TrainingPlanner';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'levels', label: 'Levels', icon: Dumbbell },
  { id: 'planner', label: 'Planner', icon: CalendarDays },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('levels');

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
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'levels' && <LevelView />}
          {activeTab === 'planner' && <TrainingPlanner />}
        </div>
      </main>

      <footer className="py-3 text-center border-top" style={{ borderColor: '#1e293b' }}>
        <small className="text-secondary">SKB Waterpolo School © 2026</small>
      </footer>
    </div>
  );
}

function Dashboard() {
  return (
    <div>
      <div className="card card-dark p-4 p-md-5 mb-4" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(6,182,212,0.08) 0%, transparent 60%)' }}>
        <span className="badge rounded-pill mb-2" style={{ background: 'rgba(6,182,212,0.15)', color: '#22d3ee', border: '1px solid rgba(6,182,212,0.2)' }}>Training System</span>
        <h2 className="fw-bold text-white mb-2">SKB Waterpolo School</h2>
        <p className="text-secondary mb-0">7-level progressive development system — from water competency to elite competition mastery.</p>
      </div>

      <div className="row g-3 mb-4">
        {[{ label: 'Levels', value: 7, icon: '🤽' }, { label: 'Players', value: 5, icon: '👥' }, { label: 'Crew Types', value: 5, icon: '🤖' }].map(s => (
          <div key={s.label} className="col-6 col-md-4">
            <div className="card card-dark p-3 p-md-4 text-center h-100">
              <div className="fs-2 mb-2">{s.icon}</div>
              <div className="fs-3 fw-bold text-white">{s.value}</div>
              <small className="text-secondary">{s.label}</small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
