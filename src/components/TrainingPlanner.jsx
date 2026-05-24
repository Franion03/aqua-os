import { ExternalLink, Calendar, Clock, MapPin } from 'lucide-react';

export default function TrainingPlanner() {
  return (
    <div>
      <div className="card card-dark p-4 p-md-5 mb-4" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(6,182,212,0.08) 0%, transparent 60%)' }}>
        <span className="badge rounded-pill mb-2" style={{ background: 'rgba(6,182,212,0.15)', color: '#22d3ee', border: '1px solid rgba(6,182,212,0.2)' }}>Scheduling</span>
        <h2 className="fw-bold text-white mb-2">Training Planner</h2>
        <p className="text-secondary mb-0">All sessions, matches, and events in Google Calendar — no sync needed.</p>
      </div>

      <div className="card card-dark p-4 p-md-5">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
          <div className="d-flex align-items-center gap-3">
            <div className="rounded-3 d-flex align-items-center justify-content-center" style={{ width: 42, height: 42, background: 'rgba(6,182,212,0.1)' }}>
              <Calendar size={22} style={{ color: '#22d3ee' }} />
            </div>
            <div>
              <h5 className="fw-bold text-white mb-0">Google Calendar</h5>
              <small className="text-secondary">Real-time scheduling</small>
            </div>
          </div>
          <a href="https://calendar.google.com" target="_blank" className="btn btn-sm d-flex align-items-center gap-1" style={{ background: 'rgba(6,182,212,0.1)', color: '#22d3ee', border: '1px solid rgba(6,182,212,0.2)' }}>
            <ExternalLink size={14} /> Open Calendar
          </a>
        </div>

        <div className="row g-3">
          <div className="col-md-6">
            <div className="p-3 rounded-3" style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid #1e293b' }}>
              <h6 className="text-uppercase text-secondary mb-3 d-flex align-items-center gap-2" style={{ fontSize: '0.7rem', letterSpacing: '0.1em' }}><Clock size={14} style={{color:'#22d3ee'}} /> How It Works</h6>
              <ol className="mb-0 ps-3 text-secondary" style={{ fontSize: '0.85rem' }}>
                <li className="mb-1">Create a <strong className="text-white">SKB Waterpolo School</strong> calendar</li>
                <li className="mb-1">Add training sessions as recurring events</li>
                <li className="mb-1">Add matches with <MapPin size={10} style={{color:'#22d3ee'}} /> location details</li>
                <li className="mb-1">Use <strong>description field</strong> for exercise plans</li>
                <li>Share with coaches for real-time updates</li>
              </ol>
            </div>
          </div>
          <div className="col-md-6">
            <div className="p-3 rounded-3" style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid #1e293b' }}>
              <h6 className="text-uppercase text-secondary mb-3 d-flex align-items-center gap-2" style={{ fontSize: '0.7rem', letterSpacing: '0.1em' }}><Calendar size={14} style={{color:'#22d3ee'}} /> Coming Soon</h6>
              <ul className="mb-0 ps-3 text-secondary" style={{ fontSize: '0.85rem' }}>
                <li className="mb-1">Embedded calendar view</li>
                <li className="mb-1">Auto-generated lineup emails</li>
                <li>Travel planning sheets</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
