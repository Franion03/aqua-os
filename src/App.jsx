import React, { useState } from 'react';
import { 
  Compass, 
  Users, 
  MessageSquare, 
  TrendingUp, 
  Volume2, 
  Activity, 
  Calendar, 
  ChevronRight, 
  Send, 
  Check, 
  UserCheck, 
  Award, 
  HelpCircle,
  Copy,
  Mail,
  ListCollapse,
  Anchor,
  AlertCircle
} from 'lucide-react';
import PlayerTracker, { LEVEL_GUIDES } from './components/PlayerTracker';
import AgentHub from './components/AgentHub';

// Initial Mock Swimmers Database
const INITIAL_PLAYERS = [
  {
    id: 1,
    name: 'Liam Alvarez',
    age: 11,
    level: 2,
    parentName: 'Roberto Alvarez',
    parentEmail: 'roberto@alvarez.com',
    skills: { swimming: 65, ballHandling: 58, shooting: 55, tactics: 48, stamina: 70 },
    progressLogs: [
      { date: '2026-05-10', note: 'Promoted to Level 2: Bronze. Showing stronger vertical eggbeater stability.' },
      { date: '2026-04-12', note: 'Completed U12 head-up freestyle speed test under threshold.' }
    ]
  },
  {
    id: 2,
    name: 'Mateo Rossi',
    age: 13,
    level: 3,
    parentName: 'Carla Rossi',
    parentEmail: 'carla@rossi.net',
    skills: { swimming: 80, ballHandling: 75, shooting: 72, tactics: 68, stamina: 78 },
    progressLogs: [
      { date: '2026-04-20', note: 'Promoted to Level 3: Silver. Wrist passing accuracy from 10m is excellent.' },
      { date: '2026-03-01', note: 'Scored 4 goals in training match. Tactical drives are very coordinated.' }
    ]
  },
  {
    id: 3,
    name: 'Sofia Dubois',
    age: 10,
    level: 1,
    parentName: 'Jean Dubois',
    parentEmail: 'jean@dubois.org',
    skills: { swimming: 45, ballHandling: 35, shooting: 40, tactics: 30, stamina: 50 },
    progressLogs: [
      { date: '2026-05-15', note: 'Roster initialized. Demonstrates good comfort in deep water.' }
    ]
  },
  {
    id: 4,
    name: 'Lucas Kovač',
    age: 14,
    level: 4,
    parentName: 'Ivan Kovač',
    parentEmail: 'ivan.kovac@croatia.hr',
    skills: { swimming: 92, ballHandling: 90, shooting: 95, tactics: 88, stamina: 94 },
    progressLogs: [
      { date: '2026-05-01', note: 'Promoted to Level 4: Gold. Holds physical CF positioning securely under load.' },
      { date: '2026-02-14', note: 'Lactate swim set benchmark achieved: 10x100m on 1:40.' }
    ]
  },
  {
    id: 5,
    name: 'Emma Santos',
    age: 12,
    level: 2,
    parentName: 'Isabella Santos',
    parentEmail: 'isabella@santos-family.com',
    skills: { swimming: 70, ballHandling: 62, shooting: 60, tactics: 52, stamina: 68 },
    progressLogs: [
      { date: '2026-05-18', note: 'Demonstrates improved layout-to-vertical body transition.' },
      { date: '2026-03-29', note: 'Completed 1-minute high vertical treading challenge.' }
    ]
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [players, setPlayers] = useState(INITIAL_PLAYERS);
  const [activePlayer, setActivePlayer] = useState(INITIAL_PLAYERS[0]);
  
  // Roster Management State
  const [rosterPlayers, setRosterPlayers] = useState([1, 2, 4, 5]);
  const [sendingRoster, setSendingRoster] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  
  // Custom Email variables
  const [emailSubject, setEmailSubject] = useState('🏊‍♂️ AquaOS Water Polo: Weekly Team Selection & Training Rubric');
  const [trainingObjective, setTrainingObjective] = useState('Horizontal-to-Vertical Defensive Transitions (Level 2/3 focus)');

  const handleSelectPlayer = (player) => {
    setActivePlayer(player);
  };

  const handleToggleRosterSwimmer = (id) => {
    if (rosterPlayers.includes(id)) {
      setRosterPlayers(prev => prev.filter(x => x !== id));
    } else {
      setRosterPlayers(prev => [...prev, id]);
    }
  };

  const handleSendProgrammaticEmail = (e) => {
    e.preventDefault();
    setSendingRoster(true);
    
    // Simulate programmatic sending to parent email addresses
    setTimeout(() => {
      setSendingRoster(false);
      setSentSuccess(true);
      setTimeout(() => setSentSuccess(false), 3500);
    }, 2000);
  };

  // Compute stats
  const totalKids = players.length;
  const avgLevel = (players.reduce((sum, p) => sum + p.level, 0) / totalKids).toFixed(1);
  const activeCoaches = 4; // Head Coach, Physical S&C, Analyst, Marketing Agent
  
  // Selected roster details
  const squadNames = players.filter(p => rosterPlayers.includes(p.id)).map(p => p.name);

  return (
    <div className="min-h-screen flex flex-col">
      
      {/* Premium Aquatic Header navigation */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-filter backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/10">
            <Anchor className="text-slate-950 animate-pulse" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <span className="text-gradient">AquaOS</span>
              <span className="text-xs uppercase bg-cyan-950 border border-cyan-800/40 text-cyan-400 font-extrabold tracking-wider px-2 py-0.5 rounded">
                President Suite
              </span>
            </h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mt-0.5">Water Polo Club Agentic Management Hub</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1.5">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`tab-link ${activeTab === 'dashboard' ? 'active' : ''}`}
          >
            <Activity size={16} />
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('players')}
            className={`tab-link ${activeTab === 'players' ? 'active' : ''}`}
          >
            <Users size={16} />
            Player Progress
          </button>
          <button 
            onClick={() => setActiveTab('sports')}
            className={`tab-link ${activeTab === 'sports' ? 'active' : ''}`}
          >
            <Compass size={16} />
            Sports Department
          </button>
          <button 
            onClick={() => setActiveTab('roster')}
            className={`tab-link ${activeTab === 'roster' ? 'active' : ''}`}
          >
            <Mail size={16} />
            Weekly Comms & Roster
          </button>
        </nav>

        {/* Active Player Mini Context indicator */}
        <div className="flex items-center gap-2">
          <div className="text-right hidden lg:block">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Focus Swimmer</span>
            <span className="text-slate-200 text-xs font-semibold">{activePlayer ? activePlayer.name : 'None Selected'}</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400 font-bold text-xs">
            {activePlayer ? activePlayer.name.split(' ').map(n=>n[0]).join('') : '?'}
          </div>
        </div>
      </header>

      {/* Main Body container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-6">
        
        {/* Mobile Navigation bar */}
        <div className="md:hidden flex justify-between bg-slate-950/60 p-2.5 rounded-2xl border border-slate-850">
          <button onClick={() => setActiveTab('dashboard')} className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-xl text-xs ${activeTab === 'dashboard' ? 'text-cyan-400 bg-cyan-950/20' : 'text-slate-400'}`}>
            <Activity size={16} /> Dashboard
          </button>
          <button onClick={() => setActiveTab('players')} className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-xl text-xs ${activeTab === 'players' ? 'text-cyan-400 bg-cyan-950/20' : 'text-slate-400'}`}>
            <Users size={16} /> Progress
          </button>
          <button onClick={() => setActiveTab('sports')} className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-xl text-xs ${activeTab === 'sports' ? 'text-cyan-400 bg-cyan-950/20' : 'text-slate-400'}`}>
            <Compass size={16} /> Agents
          </button>
          <button onClick={() => setActiveTab('roster')} className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-xl text-xs ${activeTab === 'roster' ? 'text-cyan-400 bg-cyan-950/20' : 'text-slate-400'}`}>
            <Mail size={16} /> Comms
          </button>
        </div>

        {/* Tab 1: Dashboard Home */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            
            {/* Top row: Premium Metric cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              
              <div className="glass-panel p-6 flex items-center justify-between relative overflow-hidden">
                <div className="space-y-2">
                  <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold block">Total Swimmers</span>
                  <h3 className="text-3xl font-extrabold text-white">{totalKids}</h3>
                  <span className="text-[10px] text-cyan-400/90 font-bold bg-cyan-950/60 border border-cyan-900/30 px-2 py-0.5 rounded-full uppercase">
                    Active Roster
                  </span>
                </div>
                <Users size={36} className="text-cyan-400/20" />
              </div>

              <div className="glass-panel p-6 flex items-center justify-between relative overflow-hidden">
                <div className="space-y-2">
                  <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold block">Average Squad Level</span>
                  <h3 className="text-3xl font-extrabold text-white">{avgLevel} <span className="text-xs font-normal text-slate-400">/ 4</span></h3>
                  <span className="text-[10px] text-purple-400/90 font-bold bg-purple-950/60 border border-purple-900/30 px-2 py-0.5 rounded-full uppercase">
                    Progressive
                  </span>
                </div>
                <Award size={36} className="text-purple-400/20" />
              </div>

              <div className="glass-panel p-6 flex items-center justify-between relative overflow-hidden">
                <div className="space-y-2">
                  <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold block">Active S&C/Coaches</span>
                  <h3 className="text-3xl font-extrabold text-white">{activeCoaches}</h3>
                  <span className="text-[10px] text-amber-400/90 font-bold bg-amber-950/60 border border-amber-900/30 px-2 py-0.5 rounded-full uppercase">
                    Agentic Officers
                  </span>
                </div>
                <Compass size={36} className="text-amber-400/20" />
              </div>

              <div className="glass-panel p-6 flex items-center justify-between relative overflow-hidden">
                <div className="space-y-2">
                  <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold block">Next Training Scrimmage</span>
                  <h3 className="text-xl font-extrabold text-white">Sat 09:00 AM</h3>
                  <span className="text-[10px] text-emerald-400/90 font-bold bg-emerald-950/60 border border-emerald-900/30 px-2 py-0.5 rounded-full uppercase">
                    U12 & U14 Squads
                  </span>
                </div>
                <Calendar size={36} className="text-emerald-400/20" />
              </div>

            </div>

            {/* Split layout: Notifications from agents & quick charts */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* AI Agent notifications stream */}
              <div className="lg:col-span-7 glass-panel p-6 flex flex-col h-[480px]">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <MessageSquare className="text-cyan-400" size={18} />
                  Agentic Department Briefing Alerts
                </h3>
                
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  
                  {/* Alert 1 */}
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex gap-3.5 items-start">
                    <div className="p-2 rounded-lg bg-amber-400/10 text-amber-400 border border-amber-500/20 shrink-0">
                      <Compass size={18} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <strong className="text-sm font-bold text-white">Technical & tactical coaching Agent</strong>
                        <span className="text-[10px] font-mono text-slate-500">2 Hours Ago</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Compiled U12 weekly progressive training block. Recommended focus: **Spider Slides lateral eggbeater** to correct spacing in zone press transitions.
                      </p>
                      <button onClick={() => { setActiveTab('sports'); }} className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5 mt-2">
                        Open coaching board <ChevronRight size={10} />
                      </button>
                    </div>
                  </div>

                  {/* Alert 2 */}
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex gap-3.5 items-start">
                    <div className="p-2 rounded-lg bg-emerald-400/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                      <Activity size={18} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <strong className="text-sm font-bold text-white">Physical & Conditioning Coach</strong>
                        <span className="text-[10px] font-mono text-slate-500">4 Hours Ago</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Added shoulder stability routine for U12 dryland sets using elastic light resistance bands. Target: rotator cuff warmups to limit swimmer fatigue.
                      </p>
                      <button onClick={() => { setActiveTab('sports'); }} className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5 mt-2">
                        View S&C workouts <ChevronRight size={10} />
                      </button>
                    </div>
                  </div>

                  {/* Alert 3 */}
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex gap-3.5 items-start">
                    <div className="p-2 rounded-lg bg-sky-400/10 text-sky-400 border border-sky-500/20 shrink-0">
                      <Volume2 size={18} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <strong className="text-sm font-bold text-white">Marketing & outreach Agent</strong>
                        <span className="text-[10px] font-mono text-slate-500">Yesterday</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Summer Water Polo Camp promotional newsletter draft finalized. Prepared parent enrollment templates with custom developmental criteria logs.
                      </p>
                      <button onClick={() => { setActiveTab('roster'); }} className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5 mt-2">
                        Draft parent updates <ChevronRight size={10} />
                      </button>
                    </div>
                  </div>

                </div>
              </div>

              {/* Progress Summary and coaching tips */}
              <div className="lg:col-span-5 glass-panel p-6 flex flex-col h-[480px]">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <TrendingUp className="text-purple-400" size={18} />
                  Squad Level Allocation Chart
                </h3>

                <div className="flex-1 flex flex-col justify-around">
                  {/* Skill level categories */}
                  <div className="space-y-3.5">
                    {/* Level 1 */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-300">Level 1: Pups (Beginners)</span>
                        <span className="font-bold text-sky-400">{players.filter(p=>p.level===1).length} Kids (20%)</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                        <div className="h-full bg-sky-400 rounded-full transition-all duration-500" style={{ width: '20%' }} />
                      </div>
                    </div>

                    {/* Level 2 */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-300">Level 2: Bronze (Intermediate)</span>
                        <span className="font-bold text-purple-400">{players.filter(p=>p.level===2).length} Kids (40%)</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                        <div className="h-full bg-purple-500 rounded-full transition-all duration-500" style={{ width: '40%' }} />
                      </div>
                    </div>

                    {/* Level 3 */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-300">Level 3: Silver (Advanced)</span>
                        <span className="font-bold text-yellow-400">{players.filter(p=>p.level===3).length} Kids (20%)</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                        <div className="h-full bg-yellow-500 rounded-full transition-all duration-500" style={{ width: '20%' }} />
                      </div>
                    </div>

                    {/* Level 4 */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-300">Level 4: Gold (Elite)</span>
                        <span className="font-bold text-red-400">{players.filter(p=>p.level===4).length} Kids (20%)</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                        <div className="h-full bg-red-500 rounded-full transition-all duration-500" style={{ width: '20%' }} />
                      </div>
                    </div>
                  </div>

                  {/* Coach Action Tip */}
                  <div className="bg-cyan-500/5 p-4 rounded-xl border border-cyan-500/20 flex gap-3 items-start mt-2">
                    <AlertCircle className="text-cyan-400 shrink-0 mt-0.5" size={16} />
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Presidential Action Advised</h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        3 of your 5 active swimmers are Level 2 and below. Utilize the **Technical Coach Agent** to generate U12 passing routines before Saturday scrimmage to elevate basic ball control metrics.
                      </p>
                    </div>
                  </div>

                </div>
              </div>

            </div>

          </div>
        )}

        {/* Tab 2: Player Tracker */}
        {activeTab === 'players' && (
          <PlayerTracker 
            players={players} 
            setPlayers={setPlayers}
            onSelectPlayer={handleSelectPlayer}
          />
        )}

        {/* Tab 3: Sports Department Agents */}
        {activeTab === 'sports' && (
          <AgentHub activePlayer={activePlayer} />
        )}

        {/* Tab 4: Programmatic Weekly Roster & Parental Comms */}
        {activeTab === 'roster' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Roster builder selection */}
            <div className="lg:col-span-5 glass-panel p-6 flex flex-col h-[740px]">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users className="text-cyan-400" size={18} />
                  Programmatic Game Selection
                </h3>
                <p className="text-xs text-slate-400 mt-1">Select swimmers to assign to the Saturday matchup roster.</p>
              </div>

              {/* Player Checkboxes Scroll list */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 mb-4">
                {players.map((player) => {
                  const isInRoster = rosterPlayers.includes(player.id);
                  return (
                    <div 
                      key={player.id}
                      onClick={() => handleToggleRosterSwimmer(player.id)}
                      className={`p-3.5 rounded-xl cursor-pointer transition-all duration-150 flex items-center justify-between border ${
                        isInRoster 
                          ? 'bg-cyan-500/10 border-cyan-400/40 text-white' 
                          : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:border-slate-700/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                          isInRoster ? 'bg-cyan-400 border-cyan-400 text-slate-950' : 'border-slate-700'
                        }`}>
                          {isInRoster && <Check size={14} strokeWidth={3} />}
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-slate-200">{player.name}</h4>
                          <span className="text-[10px] text-slate-500">Age {player.age} • Level {player.level}</span>
                        </div>
                      </div>
                      
                      <span className={`level-badge level-${player.level}`}>
                        Lvl {player.level}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Roster parameters inputs */}
              <div className="space-y-4 pt-4 border-t border-slate-800 shrink-0">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Active Training Goal</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                    value={trainingObjective}
                    onChange={e => setTrainingObjective(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Simulated interactive email output */}
            <div className="lg:col-span-7 glass-panel p-6 flex flex-col h-[740px] bg-slate-950/30">
              <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-4 shrink-0">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Mail size={18} className="text-purple-400" />
                    AquaOS Auto-Comms Engine
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Programmatic email compile & distribution to swimmer families.</p>
                </div>
              </div>

              {/* Simulated email window */}
              <form onSubmit={handleSendProgrammaticEmail} className="flex-1 flex flex-col gap-4 overflow-hidden">
                
                <div className="space-y-2 shrink-0">
                  <div className="flex items-center gap-2 bg-slate-900/60 px-4 py-2.5 rounded-lg border border-slate-800 text-xs">
                    <span className="text-slate-500 font-bold w-12">TO:</span>
                    <span className="text-cyan-400 truncate font-mono">
                      {players.filter(p => rosterPlayers.includes(p.id)).map(p => p.parentEmail).join(', ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-900/60 px-4 py-2.5 rounded-lg border border-slate-800 text-xs">
                    <span className="text-slate-500 font-bold w-12">SUBJECT:</span>
                    <input 
                      type="text" 
                      className="w-full bg-transparent border-none text-white focus:outline-none font-semibold"
                      value={emailSubject}
                      onChange={e => setEmailSubject(e.target.value)}
                    />
                  </div>
                </div>

                {/* Main compiled email template body */}
                <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-5 overflow-y-auto font-mono text-xs text-slate-300 space-y-4">
                  <p>Dear Water Polo Families,</p>
                  
                  <p>
                    Please find the roster selections and technical conditioning targets for our upcoming game on Saturday morning.
                  </p>

                  <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-850 space-y-2">
                    <strong className="text-white block uppercase tracking-wider text-[10px] text-cyan-400">🤽‍♂️ Selected Match Roster (Squad size: {rosterPlayers.length})</strong>
                    <ul className="list-disc pl-4 space-y-1 text-slate-200">
                      {squadNames.length === 0 ? (
                        <li className="text-red-400 italic">No swimmers selected. Select from the sidebar.</li>
                      ) : (
                        squadNames.map((name, index) => (
                          <li key={index}>{name}</li>
                        ))
                      )}
                    </ul>
                  </div>

                  <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-850 space-y-2">
                    <strong className="text-white block uppercase tracking-wider text-[10px] text-amber-400">🎯 Coaching & Progression Objective</strong>
                    <p className="text-slate-200 leading-relaxed font-sans text-xs">
                      This week, the coaching team is strictly observing: <strong>{trainingObjective}</strong>. 
                      Coaches will analyze each swimmer's vertical elevation stability, wrist passing posture, and hip-up press mechanics.
                    </p>
                  </div>

                  <p className="font-sans text-xs text-slate-400 leading-relaxed">
                    <strong>Administrative Note:</strong> Please ensure all kids arrive at the pool exactly at <strong>08:45 AM</strong> with their personal swimming caps and weight belts. Parent duties (table timing/score clock) are assigned to Roberto Alvarez.
                  </p>

                  <p className="pt-4 border-t border-slate-900">
                    Warm Regards,<br/>
                    <strong>AquaOS President Suite</strong><br/>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest">Water Polo Agentic Team</span>
                  </p>
                </div>

                {/* Action button */}
                <div className="pt-2 shrink-0 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {sentSuccess && (
                      <span className="text-xs text-emerald-400 font-bold bg-emerald-950/50 border border-emerald-900/40 px-3 py-1.5 rounded-lg flex items-center gap-1.5 animate-bounce">
                        <Check size={14} /> Programmatic Mail dispatched to parents!
                      </span>
                    )}
                  </div>
                  
                  <button
                    type="submit"
                    disabled={sendingRoster || rosterPlayers.length === 0}
                    className="btn btn-primary px-6"
                  >
                    {sendingRoster ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        Compiling distribution logs...
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        Dispatch Weekly Comms
                      </>
                    )}
                  </button>
                </div>

              </form>
            </div>

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 py-6 px-8 text-center text-xs text-slate-500">
        <p>© 2026 AquaOS Agentic Club Management System. Designed for local water polo club presidents & coaching departments.</p>
      </footer>
    </div>
  );
}
