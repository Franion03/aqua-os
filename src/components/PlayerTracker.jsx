import React, { useState } from 'react';
import { 
  User, 
  Search, 
  Plus, 
  Award, 
  TrendingUp, 
  Flame, 
  Sliders, 
  Compass, 
  ChevronRight, 
  UserCheck, 
  ShieldAlert, 
  Mail, 
  HeartHandshake
} from 'lucide-react';

// Structured Levels Guide for Coaches
export const LEVEL_GUIDES = {
  1: {
    name: 'Level 1: Pups / Beginners',
    badgeClass: 'level-1',
    description: 'Focuses on fundamental water comfort, basic swim mechanics, and simple ball handling.',
    benchmarks: [
      '100m Continuous Head-Up Freestyle without touching lanes',
      '30 seconds vertical eggbeater with hands touching chest',
      'Catching and throwing the ball using two hands reliably',
      'Basic underwater swimming (10m stretch)',
      'Understanding of basic pool zones (shallow end, deep end, goal line)'
    ],
    drills: [
      { name: 'Chop and Scull', desc: 'Tread using simple breaststroke kick while sculling hands wide to find neutral buoyancy.' },
      { name: 'Puppy Dribble', desc: 'Dribble the ball between arms using head-up freestyle at slow speeds.' },
      { name: 'Two-Hand Wall Launch', desc: 'Hold onto the gutter with one hand, catch ball with two hands, and toss it back.' }
    ]
  },
  2: {
    name: 'Level 2: Bronze / Intermediate',
    badgeClass: 'level-2',
    description: 'Transitioning to full one-handed play, elevated eggbeater, and team positioning.',
    benchmarks: [
      '200m Head-Up Dribble with a water polo ball under 4:30',
      '2 minutes eggbeater with hands completely out of the water',
      'Receiving dry passes with one hand and shifting body direction',
      'Basic press defense (arm-length distance, hip-up body posture)',
      'Executing a layout-to-vertical shift under pressure'
    ],
    drills: [
      { name: 'Hip-Up Pressing', desc: 'Swim defense with hips high on the water, chest facing the attacker, one hand up.' },
      { name: 'Passing Cycles', desc: 'Groups of three pass in a triangle. Receiving hand controls ball, shifts body, passes next.' },
      { name: 'Gutter Jumps', desc: 'Eggbeater near goal, explosive pop-ups using vertical breaststroke kicks to touch the crossbar.' }
    ]
  },
  3: {
    name: 'Level 3: Silver / Advanced',
    badgeClass: 'level-3',
    description: 'Introduction to tactical team systems, heavy defensive press, and shot placement.',
    benchmarks: [
      '400m Swim under 7:00 (pool swim)',
      '1-minute eggbeater holding a 2kg weight belt out of water',
      'Perimeter passing (high-speed wrist passes across 10-15 meters)',
      'Executing zone defense transitions (U-shape slide or M-drop)',
      'Accurate perimeter shooting (hitting top-left/top-right corners from 5m)'
    ],
    drills: [
      { name: 'Spider Slides', desc: 'Lateral moving eggbeater defense along the 5m line, changing directions on whistle.' },
      { name: '6v5 Defensive M-Drop', desc: 'Simulated man-down layout where perimeter players drop to block passing lanes.' },
      { name: 'Dry-to-Wet Attack', desc: 'Receiving dry pass at 2m, quick roll to wet-shot under direct defensive press.' }
    ]
  },
  4: {
    name: 'Level 4: Gold / Elite',
    badgeClass: 'level-4',
    description: 'Position-specific mastery, advanced offensive structures, and peak conditioning.',
    benchmarks: [
      '10x100m Swim sets on a 1:45 send-off interval',
      'Eggbeater high jump (elbows clear out of water on explosive kick)',
      'Center-Forward (Hole Set) hold-up play or Center-Back lockdown defense',
      'Man-up offensive plays (quick perimeter rotations and 4-2 transitions)',
      'Elite shot selection, fake rolls, and high-velocity pop-up shots'
    ],
    drills: [
      { name: 'Hole-Set Wrestling', desc: '1v1 physical positioning at the 2m line. Defender tries to step-front, attacker holds seal.' },
      { name: 'Shot Faking Grid', desc: 'Attacker takes vertical position, performs three aggressive shoulder fakes, then picks corner.' },
      { name: 'Shuttle Scuttle', desc: 'Full pool counter-attack sprints, instant layout transitions, and back-checking defense.' }
    ]
  }
};

export default function PlayerTracker({ players, setPlayers, onSelectPlayer }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState(players[0]?.id || null);
  const [filterLevel, setFilterLevel] = useState('All');
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form State for New Player
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerAge, setNewPlayerAge] = useState('');
  const [newPlayerLevel, setNewPlayerLevel] = useState(1);
  const [newPlayerSwimming, setNewPlayerSwimming] = useState(60);
  const [newPlayerBall, setNewPlayerBall] = useState(60);
  const [newPlayerShooting, setNewPlayerShooting] = useState(60);
  const [newPlayerTactics, setNewPlayerTactics] = useState(60);
  const [newPlayerStamina, setNewPlayerStamina] = useState(60);
  const [newPlayerParent, setNewPlayerParent] = useState('');
  const [newPlayerEmail, setNewPlayerEmail] = useState('');

  const selectedPlayer = players.find(p => p.id === selectedPlayerId);

  const filteredPlayers = players.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = filterLevel === 'All' || player.level === parseInt(filterLevel);
    return matchesSearch && matchesLevel;
  });

  const handleLevelChange = (playerId, newLevel) => {
    setPlayers(prev => prev.map(p => {
      if (p.id === playerId) {
        const logEntry = {
          date: new Date().toISOString().split('T')[0],
          note: `Promoted to ${LEVEL_GUIDES[newLevel].name}`
        };
        return { 
          ...p, 
          level: newLevel,
          progressLogs: [logEntry, ...p.progressLogs]
        };
      }
      return p;
    }));
  };

  const handleUpdateStat = (playerId, statKey, val) => {
    setPlayers(prev => prev.map(p => {
      if (p.id === playerId) {
        return {
          ...p,
          skills: {
            ...p.skills,
            [statKey]: parseInt(val)
          }
        };
      }
      return p;
    }));
  };

  const handleAddPlayer = (e) => {
    e.preventDefault();
    if (!newPlayerName || !newPlayerAge) return;

    const newId = Math.max(...players.map(p => p.id), 0) + 1;
    const playerObj = {
      id: newId,
      name: newPlayerName,
      age: parseInt(newPlayerAge),
      level: parseInt(newPlayerLevel),
      parentName: newPlayerParent || 'N/A',
      parentEmail: newPlayerEmail || 'info@waterpolo.com',
      skills: {
        swimming: parseInt(newPlayerSwimming),
        ballHandling: parseInt(newPlayerBall),
        shooting: parseInt(newPlayerShooting),
        tactics: parseInt(newPlayerTactics),
        stamina: parseInt(newPlayerStamina)
      },
      progressLogs: [
        { date: new Date().toISOString().split('T')[0], note: 'Roster initialized in the database.' }
      ]
    };

    setPlayers(prev => [...prev, playerObj]);
    setSelectedPlayerId(newId);
    setShowAddForm(false);
    
    // Reset Form
    setNewPlayerName('');
    setNewPlayerAge('');
    setNewPlayerLevel(1);
    setNewPlayerSwimming(60);
    setNewPlayerBall(60);
    setNewPlayerShooting(60);
    setNewPlayerTactics(60);
    setNewPlayerStamina(60);
    setNewPlayerParent('');
    setNewPlayerEmail('');
  };

  const currentLevelGuide = selectedPlayer ? LEVEL_GUIDES[selectedPlayer.level] : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Player List Panel */}
      <div className="lg:col-span-4 glass-panel p-6 flex flex-col h-[780px]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <User className="text-cyan-400" size={20} />
            Player Roster ({players.length})
          </h3>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn btn-primary p-2 rounded-lg flex items-center justify-center"
            title="Add New Player"
          >
            <Plus size={18} />
          </button>
        </div>

        {/* Search & Filter */}
        <div className="space-y-3 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search kids..."
              className="w-full pl-10 pr-4 py-2 bg-slate-900/60 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/60"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Filter Level:</span>
            <select
              className="bg-slate-900 border border-slate-700/50 text-slate-300 text-xs rounded-lg px-2 py-1 focus:outline-none"
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
            >
              <option value="All">All Levels</option>
              <option value="1">Level 1 - Pups</option>
              <option value="2">Level 2 - Bronze</option>
              <option value="3">Level 3 - Silver</option>
              <option value="4">Level 4 - Gold</option>
            </select>
          </div>
        </div>

        {/* Players List Scroll Area */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {filteredPlayers.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              No players found matching filters.
            </div>
          ) : (
            filteredPlayers.map((player) => (
              <div 
                key={player.id}
                onClick={() => {
                  setSelectedPlayerId(player.id);
                  if (onSelectPlayer) onSelectPlayer(player);
                }}
                className={`p-3 rounded-xl cursor-pointer transition-all duration-200 flex items-center justify-between border ${
                  selectedPlayerId === player.id 
                    ? 'bg-cyan-500/10 border-cyan-400/40 text-white' 
                    : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700/60 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center font-bold text-sm text-cyan-400 border border-slate-800">
                    {player.name.split(' ').map(n=>n[0]).join('')}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">{player.name}</h4>
                    <span className="text-xs text-slate-400">Age: {player.age}</span>
                  </div>
                </div>
                
                <span className={`level-badge level-${player.level}`}>
                  Lvl {player.level}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Focus Detail / Form Panel */}
      <div className="lg:col-span-8 space-y-6">
        
        {showAddForm ? (
          /* Add Player Form */
          <div className="glass-panel p-6">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Plus className="text-cyan-400" size={20} />
              Register New Swimmer
            </h3>
            
            <form onSubmit={handleAddPlayer} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2">FULL NAME</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Liam Alvarez" 
                    className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-400"
                    value={newPlayerName}
                    onChange={e => setNewPlayerName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2">AGE (YEARS)</label>
                  <input 
                    type="number" 
                    required 
                    min="6" 
                    max="18" 
                    placeholder="e.g. 11" 
                    className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-400"
                    value={newPlayerAge}
                    onChange={e => setNewPlayerAge(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2">INITIAL SKILL LEVEL</label>
                  <select
                    className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-400"
                    value={newPlayerLevel}
                    onChange={e => setNewPlayerLevel(e.target.value)}
                  >
                    <option value={1}>Level 1 - Pups (Beginner)</option>
                    <option value={2}>Level 2 - Bronze (Intermediate)</option>
                    <option value={3}>Level 3 - Silver (Advanced)</option>
                    <option value={4}>Level 4 - Gold (Elite)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2">PARENT/GUARDIAN NAME</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Roberto Alvarez" 
                    className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-400"
                    value={newPlayerParent}
                    onChange={e => setNewPlayerParent(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2">PARENT EMAIL ADDRESS</label>
                  <input 
                    type="email" 
                    placeholder="e.g. roberto@alvarez.com" 
                    className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-400"
                    value={newPlayerEmail}
                    onChange={e => setNewPlayerEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Slider Metrics */}
              <div>
                <h4 className="text-sm font-semibold text-slate-400 mb-4 flex items-center gap-2">
                  <Sliders size={16} className="text-cyan-400" />
                  Estimated Skill Metrics (0 - 100)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Swimming Proficiency</span>
                      <span className="text-cyan-400 font-semibold">{newPlayerSwimming}</span>
                    </div>
                    <input 
                      type="range" min="10" max="100" className="w-full accent-cyan-400"
                      value={newPlayerSwimming} onChange={e => setNewPlayerSwimming(e.target.value)}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Ball Control & Catching</span>
                      <span className="text-purple-400 font-semibold">{newPlayerBall}</span>
                    </div>
                    <input 
                      type="range" min="10" max="100" className="w-full accent-purple-400"
                      value={newPlayerBall} onChange={e => setNewPlayerBall(e.target.value)}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Shooting Power & Aim</span>
                      <span className="text-emerald-400 font-semibold">{newPlayerShooting}</span>
                    </div>
                    <input 
                      type="range" min="10" max="100" className="w-full accent-emerald-400"
                      value={newPlayerShooting} onChange={e => setNewPlayerShooting(e.target.value)}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Tactics & Positioning</span>
                      <span className="text-amber-400 font-semibold">{newPlayerTactics}</span>
                    </div>
                    <input 
                      type="range" min="10" max="100" className="w-full accent-amber-400"
                      value={newPlayerTactics} onChange={e => setNewPlayerTactics(e.target.value)}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Cardiovascular Stamina</span>
                      <span className="text-sky-400 font-semibold">{newPlayerStamina}</span>
                    </div>
                    <input 
                      type="range" min="10" max="100" className="w-full accent-sky-400"
                      value={newPlayerStamina} onChange={e => setNewPlayerStamina(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setShowAddForm(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                >
                  Create Player Profile
                </button>
              </div>
            </form>
          </div>
        ) : selectedPlayer ? (
          /* Detailed Player Visualizer */
          <div className="space-y-6">
            
            {/* Header card with name, age, level adjustments */}
            <div className="glass-panel p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-2xl">
                  {selectedPlayer.name.split(' ').map(n=>n[0]).join('')}
                </div>
                <div>
                  <h3 className="text-2xl font-bold flex items-center gap-2">
                    {selectedPlayer.name}
                  </h3>
                  <p className="text-sm text-slate-400 flex items-center gap-4">
                    <span>Age: <strong>{selectedPlayer.age}</strong></span>
                    <span>•</span>
                    <span>Parent: <strong>{selectedPlayer.parentName}</strong></span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Mail size={12}/>{selectedPlayer.parentEmail}</span>
                  </p>
                </div>
              </div>

              {/* Development Level Toggle */}
              <div className="flex items-center gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                <Award size={16} className="text-amber-400" />
                <span className="text-xs text-slate-400 mr-2">Level:</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => handleLevelChange(selectedPlayer.id, lvl)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                        selectedPlayer.level === lvl
                          ? lvl === 1 ? 'bg-sky-500 text-white font-extrabold shadow-md'
                            : lvl === 2 ? 'bg-purple-500 text-white font-extrabold shadow-md'
                            : lvl === 3 ? 'bg-yellow-500 text-slate-950 font-extrabold shadow-md'
                            : 'bg-red-500 text-white font-extrabold shadow-md'
                          : 'bg-slate-900 text-slate-500 hover:text-slate-300'
                      }`}
                      title={LEVEL_GUIDES[lvl].name}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Custom Interactive SVG Skill Radar/Meter Block */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Development metrics editor */}
              <div className="glass-panel p-6 space-y-4">
                <h4 className="text-base font-bold flex items-center gap-2 text-cyan-400">
                  <Sliders size={18} />
                  Performance Diagnostics
                </h4>
                
                <div className="space-y-4">
                  {/* Swimmer proficiency */}
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-300 font-medium">Head-up Swim Speed / Aerobic Set</span>
                      <span className="text-cyan-400 font-semibold">{selectedPlayer.skills.swimming}%</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input 
                        type="range" min="10" max="100" className="w-full accent-cyan-400"
                        value={selectedPlayer.skills.swimming}
                        onChange={e => handleUpdateStat(selectedPlayer.id, 'swimming', e.target.value)}
                      />
                      <span className="text-[10px] uppercase text-cyan-500/80 px-2 py-0.5 rounded bg-cyan-950/50 border border-cyan-800/30">
                        {selectedPlayer.skills.swimming >= 80 ? 'Elite' : selectedPlayer.skills.swimming >= 60 ? 'Good' : 'Basic'}
                      </span>
                    </div>
                  </div>

                  {/* Ball handling */}
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-300 font-medium">One-Hand Ball Catch & Dribble</span>
                      <span className="text-purple-400 font-semibold">{selectedPlayer.skills.ballHandling}%</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input 
                        type="range" min="10" max="100" className="w-full accent-purple-400"
                        value={selectedPlayer.skills.ballHandling}
                        onChange={e => handleUpdateStat(selectedPlayer.id, 'ballHandling', e.target.value)}
                      />
                      <span className="text-[10px] uppercase text-purple-500/80 px-2 py-0.5 rounded bg-purple-950/50 border border-purple-800/30">
                        {selectedPlayer.skills.ballHandling >= 80 ? 'Master' : selectedPlayer.skills.ballHandling >= 60 ? 'Strong' : 'Dev'}
                      </span>
                    </div>
                  </div>

                  {/* Shooting power */}
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-300 font-medium">Vertical Elev. & Shooting Corner Placement</span>
                      <span className="text-emerald-400 font-semibold">{selectedPlayer.skills.shooting}%</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input 
                        type="range" min="10" max="100" className="w-full accent-emerald-400"
                        value={selectedPlayer.skills.shooting}
                        onChange={e => handleUpdateStat(selectedPlayer.id, 'shooting', e.target.value)}
                      />
                      <span className="text-[10px] uppercase text-emerald-500/80 px-2 py-0.5 rounded bg-emerald-950/50 border border-emerald-800/30">
                        {selectedPlayer.skills.shooting >= 80 ? 'Sniper' : selectedPlayer.skills.shooting >= 60 ? 'Solid' : 'Trainer'}
                      </span>
                    </div>
                  </div>

                  {/* Tactics and positioning */}
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-300 font-medium">Tactical Plays (Zone Defense, Man-Up, Drives)</span>
                      <span className="text-amber-400 font-semibold">{selectedPlayer.skills.tactics}%</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input 
                        type="range" min="10" max="100" className="w-full accent-amber-400"
                        value={selectedPlayer.skills.tactics}
                        onChange={e => handleUpdateStat(selectedPlayer.id, 'tactics', e.target.value)}
                      />
                      <span className="text-[10px] uppercase text-amber-500/80 px-2 py-0.5 rounded bg-amber-950/50 border border-amber-800/30">
                        {selectedPlayer.skills.tactics >= 80 ? 'Director' : selectedPlayer.skills.tactics >= 60 ? 'Coordinated' : 'Learning'}
                      </span>
                    </div>
                  </div>

                  {/* Stamina */}
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-300 font-medium">Eggbeater Endurance (Vertical stamina)</span>
                      <span className="text-sky-400 font-semibold">{selectedPlayer.skills.stamina}%</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input 
                        type="range" min="10" max="100" className="w-full accent-sky-400"
                        value={selectedPlayer.skills.stamina}
                        onChange={e => handleUpdateStat(selectedPlayer.id, 'stamina', e.target.value)}
                      />
                      <span className="text-[10px] uppercase text-sky-500/80 px-2 py-0.5 rounded bg-sky-950/50 border border-sky-800/30">
                        {selectedPlayer.skills.stamina >= 80 ? 'Engine' : selectedPlayer.skills.stamina >= 60 ? 'Tough' : 'Build Lvl'}
                      </span>
                    </div>
                  </div>

                </div>
              </div>

              {/* SVG-based beautiful radar/polygon display chart */}
              <div className="glass-panel p-6 flex flex-col items-center justify-center">
                <h4 className="text-sm font-semibold text-slate-400 self-start mb-2 flex items-center gap-2">
                  <TrendingUp size={16} className="text-cyan-400" />
                  Skill Polygon Grid
                </h4>
                
                {/* Visual SVG chart representing skills */}
                <div className="relative w-56 h-56 flex items-center justify-center">
                  <svg width="220" height="220" viewBox="0 0 220 220" className="overflow-visible">
                    {/* Backing circles */}
                    <circle cx="110" cy="110" r="100" fill="none" stroke="hsl(var(--border-light))" strokeDasharray="3,3" />
                    <circle cx="110" cy="110" r="75" fill="none" stroke="hsl(var(--border-light))" strokeDasharray="3,3" />
                    <circle cx="110" cy="110" r="50" fill="none" stroke="hsl(var(--border-light))" strokeDasharray="3,3" />
                    <circle cx="110" cy="110" r="25" fill="none" stroke="hsl(var(--border-light))" strokeDasharray="3,3" />
                    
                    {/* Dynamic coordinates based on 5 skills */}
                    {(() => {
                      const center = 110;
                      const maxR = 100;
                      
                      const s = selectedPlayer.skills.swimming / 100;
                      const b = selectedPlayer.skills.ballHandling / 100;
                      const sh = selectedPlayer.skills.shooting / 100;
                      const t = selectedPlayer.skills.tactics / 100;
                      const st = selectedPlayer.skills.stamina / 100;

                      const angle0 = -Math.PI / 2;
                      const angle72 = angle0 + (2 * Math.PI) / 5;
                      const angle144 = angle0 + (4 * Math.PI) / 5;
                      const angle216 = angle0 + (6 * Math.PI) / 5;
                      const angle288 = angle0 + (8 * Math.PI) / 5;

                      const p1 = { x: center + Math.cos(angle0) * maxR * s, y: center + Math.sin(angle0) * maxR * s };
                      const p2 = { x: center + Math.cos(angle72) * maxR * b, y: center + Math.sin(angle72) * maxR * b };
                      const p3 = { x: center + Math.cos(angle144) * maxR * sh, y: center + Math.sin(angle144) * maxR * sh };
                      const p4 = { x: center + Math.cos(angle216) * maxR * t, y: center + Math.sin(angle216) * maxR * t };
                      const p5 = { x: center + Math.cos(angle288) * maxR * st, y: center + Math.sin(angle288) * maxR * st };

                      const pointsStr = `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y} ${p5.x},${p5.y}`;

                      return (
                        <>
                          {/* Radial axis lines */}
                          <line x1={center} y1={center} x2={center + Math.cos(angle0) * maxR} y2={center + Math.sin(angle0) * maxR} stroke="hsl(var(--border-light))" />
                          <line x1={center} y1={center} x2={center + Math.cos(angle72) * maxR} y2={center + Math.sin(angle72) * maxR} stroke="hsl(var(--border-light))" />
                          <line x1={center} y1={center} x2={center + Math.cos(angle144) * maxR} y2={center + Math.sin(angle144) * maxR} stroke="hsl(var(--border-light))" />
                          <line x1={center} y1={center} x2={center + Math.cos(angle216) * maxR} y2={center + Math.sin(angle216) * maxR} stroke="hsl(var(--border-light))" />
                          <line x1={center} y1={center} x2={center + Math.cos(angle288) * maxR} y2={center + Math.sin(angle288) * maxR} stroke="hsl(var(--border-light))" />

                          {/* Skill area overlay */}
                          <polygon 
                            points={pointsStr} 
                            fill="rgba(0, 242, 254, 0.25)" 
                            stroke="hsl(var(--primary))" 
                            strokeWidth="2.5" 
                            className="transition-all duration-300"
                          />

                          {/* Dots on corners */}
                          <circle cx={p1.x} cy={p1.y} r="4.5" fill="hsl(var(--primary))" stroke="#000" strokeWidth="1" />
                          <circle cx={p2.x} cy={p2.y} r="4.5" fill="hsl(var(--primary))" stroke="#000" strokeWidth="1" />
                          <circle cx={p3.x} cy={p3.y} r="4.5" fill="hsl(var(--primary))" stroke="#000" strokeWidth="1" />
                          <circle cx={p4.x} cy={p4.y} r="4.5" fill="hsl(var(--primary))" stroke="#000" strokeWidth="1" />
                          <circle cx={p5.x} cy={p5.y} r="4.5" fill="hsl(var(--primary))" stroke="#000" strokeWidth="1" />

                          {/* Labels */}
                          <text x={center} y={center - maxR - 10} fill="hsl(var(--text-secondary))" fontSize="9" fontWeight="bold" textAnchor="middle">SWIM</text>
                          <text x={center + maxR + 10} y={center + Math.sin(angle72) * maxR} fill="hsl(var(--text-secondary))" fontSize="9" fontWeight="bold" textAnchor="start">BALL</text>
                          <text x={center + Math.cos(angle144) * maxR + 15} y={center + Math.sin(angle144) * maxR + 12} fill="hsl(var(--text-secondary))" fontSize="9" fontWeight="bold" textAnchor="middle">SHOOT</text>
                          <text x={center + Math.cos(angle216) * maxR - 15} y={center + Math.sin(angle216) * maxR + 12} fill="hsl(var(--text-secondary))" fontSize="9" fontWeight="bold" textAnchor="middle">TACTICS</text>
                          <text x={center - maxR - 10} y={center + Math.sin(angle288) * maxR} fill="hsl(var(--text-secondary))" fontSize="9" fontWeight="bold" textAnchor="end">STAMINA</text>
                        </>
                      );
                    })()}
                  </svg>
                </div>
              </div>

            </div>

            {/* Level Rubric and coaching tasks */}
            <div className="glass-panel p-6 space-y-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 pb-3 border-b border-slate-800">
                <div>
                  <h4 className="text-lg font-bold text-white flex items-center gap-2">
                    <Compass size={20} className="text-cyan-400" />
                    Level Rubric & Drills
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">{currentLevelGuide.description}</p>
                </div>
                <span className={`level-badge ${currentLevelGuide.badgeClass}`}>
                  Active Rubric
                </span>
              </div>

              {/* Benchmarks grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="text-sm font-bold text-cyan-400 mb-3 flex items-center gap-1.5">
                    <UserCheck size={16} /> Needed Benchmarks for Leveling
                  </h5>
                  <ul className="space-y-2 text-xs">
                    {currentLevelGuide.benchmarks.map((b, i) => (
                      <li key={i} className="flex items-start gap-2 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80 text-slate-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h5 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-1.5">
                    <Flame size={16} /> Key Targeted Drills
                  </h5>
                  <div className="space-y-2 text-xs">
                    {currentLevelGuide.drills.map((d, i) => (
                      <div key={i} className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80">
                        <strong className="text-white block mb-0.5">{d.name}</strong>
                        <span className="text-slate-400">{d.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Advancement / History Progress log */}
            <div className="glass-panel p-6 space-y-4">
              <h4 className="text-base font-bold flex items-center gap-2 text-purple-400">
                <Sliders size={18} />
                Progression History Log
              </h4>
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {selectedPlayer.progressLogs.map((log, index) => (
                  <div key={index} className="flex justify-between items-center bg-slate-950/50 p-2.5 rounded-lg border border-slate-850 text-xs text-slate-300">
                    <span className="font-mono text-cyan-500">{log.date}</span>
                    <span className="font-semibold text-slate-200">{log.note}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        ) : (
          <div className="glass-panel p-12 text-center text-slate-500 h-[600px] flex flex-col items-center justify-center">
            <User size={48} className="text-slate-700 mb-4 animate-pulse" />
            <p className="text-lg font-semibold">Select a swimmer from the roster</p>
            <p className="text-xs text-slate-600 mt-1">Or click the Plus button to register a new child.</p>
          </div>
        )}
      </div>

    </div>
  );
}
