import { useState } from 'react';
import { Plus, Clock, Dumbbell, Save, X, Video } from 'lucide-react';

const API = '/api';
const SKILLS = ['swimming','passing','catching','shooting','defense','conditioning','goalkeeping','tactics','ball_handling','general'];
const DIFFS = ['beginner','intermediate','advanced','elite'];

export default function ExerciseForm({ levelId, levelName, onAdded }) {
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ level_id: levelId, name: '', description: '', skill_category: 'general', difficulty: 'beginner', equipment: '', duration_minutes: 15, youtube_url: '' });

  const submit = async (e) => {
    e.preventDefault(); setSaving(true);
    await fetch(`${API}/exercises`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setForm(f => ({ ...f, name: '', description: '', equipment: '', youtube_url: '' }));
    setSaving(false); setShow(false); onAdded();
  };

  return (
    <div className="mt-3">
      <button onClick={() => setShow(!show)}
        className={`btn btn-sm d-flex align-items-center gap-2 ${show ? 'btn-outline-secondary' : ''}`}
        style={!show ? { background: 'rgba(6,182,212,0.1)', color: '#22d3ee', border: '1px solid rgba(6,182,212,0.2)' } : {}}>
        <Plus size={16} /> {show ? 'Close' : 'Add Exercise'}
      </button>

      {show && (
        <form onSubmit={submit} className="card card-dark mt-3 overflow-hidden">
          <div className="d-flex align-items-center gap-3 p-3 border-bottom" style={{ borderColor: '#1e293b' }}>
            <div className="rounded-3 d-flex align-items-center justify-content-center" style={{ width: 36, height: 36, background: 'rgba(6,182,212,0.1)' }}>
              <Dumbbell size={18} style={{ color: '#22d3ee' }} />
            </div>
            <div>
              <strong className="text-white" style={{ fontSize: '0.9rem' }}>New Exercise</strong>
              <div className="text-secondary" style={{ fontSize: '0.75rem' }}>Adding to <span style={{ color: '#22d3ee' }}>{levelName}</span></div>
            </div>
          </div>

          <div className="p-3 p-md-4">
            <div className="row g-3">
              <div className="col-12">
                <label className="form-label text-secondary mb-1" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Exercise Name</label>
                <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  placeholder="e.g., 10m Wrist Pass Drill" className="form-control form-dark" />
              </div>
              <div className="col-sm-6">
                <label className="form-label text-secondary mb-1" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</label>
                <select value={form.skill_category} onChange={e => setForm({...form, skill_category: e.target.value})} className="form-select form-dark">
                  {SKILLS.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div className="col-sm-6">
                <label className="form-label text-secondary mb-1" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Difficulty</label>
                <select value={form.difficulty} onChange={e => setForm({...form, difficulty: e.target.value})} className="form-select form-dark">
                  {DIFFS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="col-sm-6">
                <label className="form-label text-secondary mb-1" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}><Clock size={12} /> Duration (min)</label>
                <input type="number" value={form.duration_minutes} onChange={e => setForm({...form, duration_minutes: +e.target.value || 15})} min={1} max={120} className="form-control form-dark" />
              </div>
              <div className="col-sm-6">
                <label className="form-label text-secondary mb-1" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}><Dumbbell size={12} /> Equipment</label>
                <input value={form.equipment} onChange={e => setForm({...form, equipment: e.target.value})} placeholder="Balls, cones, belts..." className="form-control form-dark" />
              </div>
              <div className="col-12">
                <label className="form-label text-secondary mb-1" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}><Video size={12} /> YouTube URL</label>
                <input type="url" value={form.youtube_url} onChange={e => setForm({...form, youtube_url: e.target.value})} placeholder="https://www.youtube.com/watch?v=..." className="form-control form-dark" />
              </div>
              <div className="col-12">
                <label className="form-label text-secondary mb-1" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</label>
                <textarea required value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} placeholder="Exercise setup, execution steps, coaching cues..." className="form-control form-dark" />
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 p-3 border-top" style={{ background: 'rgba(2,6,23,0.5)', borderColor: '#1e293b' }}>
            <button type="button" onClick={() => setShow(false)} className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"><X size={15} /> Cancel</button>
            <button type="submit" disabled={saving} className="btn-cyan btn-sm d-flex align-items-center gap-1"><Save size={15} /> {saving ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      )}
    </div>
  );
}
