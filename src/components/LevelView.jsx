import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Clock, Dumbbell, Trash2, Tag, Video } from 'lucide-react';
import ExerciseForm from './ExerciseForm';

const API = '/api';
const LV = ['', 'lv-1', 'lv-2', 'lv-3', 'lv-4', 'lv-5', 'lv-6', 'lv-7'];

export default function LevelView() {
  const [levels, setLevels] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchLevels = async () => {
    try { const r = await fetch(`${API}/levels`); setLevels((await r.json()).levels || []); } catch (e) {}
    setLoading(false);
  };
  const fetchDetail = async (id) => {
    try { const r = await fetch(`${API}/levels/${id}`); const d = await r.json();
      setLevels(prev => prev.map(l => l.id === id ? { ...l, exercises: d.exercises || [] } : l)); } catch (e) {}
  };

  useEffect(() => { fetchLevels(); }, []);
  useEffect(() => { if (levels.length && !expanded) setExpanded(levels[0].id); }, [levels]);

  const toggle = (id) => { if (expanded === id) setExpanded(null); else { setExpanded(id); fetchDetail(id); } };
  const refresh = (id) => fetchDetail(id);
  const del = async (eid, lid) => { await fetch(`${API}/exercises/${eid}`, { method: 'DELETE' }); fetchDetail(lid); };

  const addSkill = async (levelId, skill) => {
    if (!skill.trim()) return;
    await fetch(`${API}/levels/${levelId}/skills`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ skill: skill.trim() })
    });
    fetchDetail(levelId);
  };
  const removeSkill = async (levelId, skill) => {
    await fetch(`${API}/levels/${levelId}/skills`, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ skill })
    });
    fetchDetail(levelId);
  };

  if (loading) return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="card card-dark p-4"><div className="skeleton w-50 mb-3" style={{height:20}}/><div className="skeleton w-100 mb-2" style={{height:14}}/><div className="skeleton w-75" style={{height:14}}/></div>)}</div>;

  return (
    <div>
      <div className="card card-dark p-4 p-md-5 mb-4" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(6,182,212,0.08) 0%, transparent 60%)' }}>
        <span className="badge rounded-pill mb-2" style={{ background: 'rgba(6,182,212,0.15)', color: '#22d3ee', border: '1px solid rgba(6,182,212,0.2)' }}>SKB Waterpolo School</span>
        <h2 className="fw-bold text-white mb-2">7-Level Development System</h2>
        <p className="text-secondary mb-0">Progressive training from water competency to elite competition mastery.</p>
      </div>

      <div className="space-y-3">
        {levels.map((level, i) => {
          const skills = level.skills?.split('||') || [];
          const isOpen = expanded === level.id;
          return (
            <div key={level.id} className={`${LV[level.order]} card card-dark animate-in`} style={{ animationDelay: `${i * 0.05}s` }}>
              {/* Header */}
              <div role="button" onClick={() => toggle(level.id)}
                className="d-flex align-items-center gap-3 p-3 p-md-4 user-select-none"
                style={{ cursor: 'pointer' }}>
                <span className="level-num flex-shrink-0">{level.order}</span>
                <div className="flex-grow-1 min-w-0">
                  <h5 className="fw-bold text-white mb-0 text-truncate">{level.name}</h5>
                </div>
                <div className="d-flex align-items-center gap-2 text-secondary flex-shrink-0">
                  <span className="badge rounded-pill" style={{ background: '#1e293b', color: '#94a3b8' }}>{skills.length} skills</span>
                  <span className="badge rounded-pill" style={{ background: '#1e293b', color: '#94a3b8' }}>{level.exercises ? level.exercises.length : '...'} ex</span>
                  {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </div>
              </div>

              {/* Skills */}
              <div className="px-3 px-md-4 pb-3 border-bottom" style={{ borderColor: '#1e293b' }}>
                {skills.map((s, j) => (
                  <span key={j} className="skill-tag position-relative" style={{ paddingRight: '1.75rem' }}>
                    {s.trim()}
                    <span role="button" onClick={(e) => { e.stopPropagation(); removeSkill(level.id, s.trim()); }}
                      className="position-absolute top-50 translate-middle-y text-secondary hover-text-danger"
                      style={{ right: 4, fontSize: '0.8rem', lineHeight: 1, cursor: 'pointer' }}
                      title="Remove skill">×</span>
                  </span>
                ))}
                <span className="skill-tag d-inline-flex align-items-center gap-1" style={{ background: 'rgba(6,182,212,0.05)', border: '1px dashed rgba(6,182,212,0.25)' }}>
                  <input id={`add-skill-${level.id}`} placeholder="+ skill" className="border-0 bg-transparent text-white"
                    style={{ width: 80, fontSize: '0.75rem', outline: 'none' }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(level.id, e.target.value); e.target.value = ''; } }} />
                </span>
              </div>

              {/* Exercises */}
              {isOpen && (
                <div className="p-3 p-md-4" style={{ background: 'rgba(2,6,23,0.3)' }}>
                  <h6 className="text-uppercase text-secondary mb-3" style={{ fontSize: '0.7rem', letterSpacing: '0.1em' }}>Exercises</h6>
                  {level.exercises?.length ? (
                    <div className="space-y-2 mb-3">
                      {level.exercises.map(ex => (
                        <div key={ex.id} className="exercise-item card card-dark p-3">
                          <div className="d-flex justify-content-between align-items-start gap-2">
                            <div>
                              <div className="d-flex align-items-center gap-2 mb-1">
                                <strong className="text-white" style={{ fontSize: '0.9rem' }}>{ex.name}</strong>
                                <span className={`badge rounded-pill ${
                                  ex.difficulty === 'beginner' ? 'bg-success bg-opacity-10 text-success border border-success' :
                                  ex.difficulty === 'intermediate' ? 'bg-warning bg-opacity-10 text-warning border border-warning' :
                                  'bg-danger bg-opacity-10 text-danger border border-danger'
                                }`} style={{ fontSize: '0.65rem' }}>{ex.difficulty}</span>
                              </div>
                              <p className="text-secondary mb-2" style={{ fontSize: '0.8rem' }}>{ex.description}</p>
                              <div className="d-flex flex-wrap gap-2">
                                <small className="text-secondary"><Tag size={12} /> {ex.skill_category?.replace(/_/g, ' ')}</small>
                                {ex.duration_minutes > 0 && <small className="text-secondary"><Clock size={12} /> {ex.duration_minutes}m</small>}
                                {ex.equipment && <small className="text-secondary"><Dumbbell size={12} /> {ex.equipment}</small>}
                                {ex.youtube_url && <a href={ex.youtube_url} target="_blank" className="badge rounded-pill text-decoration-none" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', fontSize: '0.65rem' }}><Video size={10} /> Watch</a>}
                              </div>
                            </div>
                            <button onClick={() => del(ex.id, level.id)} className="btn btn-sm text-secondary hover-text-danger p-1" title="Delete"><Trash2 size={15} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-secondary border rounded-3" style={{ borderStyle: 'dashed', borderColor: '#334155' }}>
                      <Dumbbell size={28} className="mb-2 opacity-50" />
                      <p className="mb-0" style={{ fontSize: '0.85rem' }}>No exercises yet</p>
                    </div>
                  )}
                  <ExerciseForm levelId={level.id} levelName={level.name} onAdded={() => refresh(level.id)} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
