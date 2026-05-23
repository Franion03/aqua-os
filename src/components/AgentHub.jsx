import React, { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Flame, 
  HeartPulse, 
  Volume2, 
  Target, 
  Copy, 
  Check, 
  Users,
  Compass,
  ArrowRight,
  TrendingUp
} from 'lucide-react';

const AGENT_PROMPTS = {
  marketing: [
    { label: 'U14 Tournament Victory Post', prompt: 'Write a high-energy Instagram post celebrating our U14 team winning their latest friendly tournament, highlighting high team spirit, sportsmanship, and invite new kids to register for next season.' },
    { label: 'Summer Camp Enrollment Email', prompt: 'Draft a promotional email to send to all local parents advertising our Summer Water Polo Camp (ages 8-15) starting in July. Focus on learning eggbeater, water agility, and team camaraderie. Highlight our safety and certified coaching staff.' },
    { label: 'Parent Engagement Newsletter', prompt: 'Generate a short weekly club newsletter section thanking parents for driving the kids to early morning swim training and announcing the upcoming club BBQ and scrimmage match on Saturday.' }
  ],
  technical: [
    { label: 'Intermediate 90m Training Block', prompt: 'Generate a complete, structured 90-minute coaching session for Level 2 (Intermediate) swimmers focusing on the transition from head-up freestyle to defensive vertical posture. Include exact time splits and drill names.' },
    { label: 'Eggbeater Jump Progression', prompt: 'Provide a progressive set of 4 drills to help kids improve their vertical eggbeater kick elevation. Start with basic sculling and build up to explosive out-of-water gutter-touches.' },
    { label: '6v5 Man-Up Offense Setup', prompt: 'Explain the standard 4-2 perimeter layout for man-up (6v5) offensive play. List instructions for the main wings (positions 1 & 6) and the goal post players (positions 3 & 4) on how to fake shots and rotate the defense.' }
  ],
  physical: [
    { label: 'Dryland Shoulder Injury Prevention', prompt: 'Provide a 15-minute pre-training dryland mobility routine using light resistance bands, focusing strictly on rotator cuff health, shoulder stability, and thoracic mobility to prevent swimmer shoulder injuries.' },
    { label: 'Water Polo Lactate Swim Set', prompt: 'Create a high-intensity swim conditioning set designed to build rapid counter-attack recovery stamina. Include distance splits, rest intervals, and heart rate targets.' },
    { label: 'Core and Hips Stabilizer Set', prompt: 'Design a 20-minute bodyweight routine to build core strength and hip rotation mobility, which is necessary for stable one-handed ball passing and elevated eggbeater kicks.' }
  ],
  analyst: [
    { label: 'Press vs Zone Game Plan', prompt: 'Write a tactical briefing explaining when our coach should switch the team from a high-pressure press defense to a perimeter M-Drop zone defense, outlining key triggers based on opponent shooting accuracy.' },
    { label: 'Roster Starting Rotation Strategy', prompt: 'Draft a rotation spreadsheet plan for a 13-player squad. Show how to rotate players in blocks of 3 to maintain swimming intensity and keep our center defender fresh.' },
    { label: 'Goalkeeper Positioning Guide', prompt: 'Generate a guide for the goalkeeper positioning relative to the ball location. Detail how they should shift in their cage when the ball is at position 1 (right wing), position 3 (center-forward), and position 5 (left wing).' }
  ]
};

const AGENT_PROFILES = {
  marketing: {
    title: 'Marketing & Comms Agent',
    subtitle: 'Public Relations & Enrollment Campaigns',
    icon: Volume2,
    color: 'text-sky-400',
    borderColor: 'border-sky-500/30',
    bgColor: 'bg-sky-500/5',
    pillColor: 'bg-sky-400/10 text-sky-400',
    initialText: 'Hello President! Ready to promote your water polo club. I can draft high-impact social media posts, newsletter blurbs, and enrollment outreach emails.',
    systemPrompt: 'You are a professional Sports Club Marketing Director. You generate engaging copy with aquatic energy.'
  },
  technical: {
    title: 'Technical & Drills Coach',
    subtitle: 'Tactical Playbooks & Session Planner',
    icon: Target,
    color: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    bgColor: 'bg-amber-500/5',
    pillColor: 'bg-amber-400/10 text-amber-400',
    initialText: 'Coach reporting for duty. Choose a tactical scheme or player level, and I will output professional, timed, and progressive training structures.',
    systemPrompt: 'You are a Level-4 certified Water Polo Technical Head Coach. You format drills with clean warming sets, skill segments, and detailed tactical setups.'
  },
  physical: {
    title: 'Physical Conditioning Coach',
    subtitle: 'S&C, Stamina & Injury Prevention',
    icon: HeartPulse,
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    bgColor: 'bg-emerald-500/5',
    pillColor: 'bg-emerald-400/10 text-emerald-400',
    initialText: 'Let\'s build powerful, injury-resistant water athletes. Ask me for dryland bands routines, aerobic swim ladders, or core stabilization grids.',
    systemPrompt: 'You are a Sports Physiotherapist and Water Polo Strength & Conditioning Coach. You write safe, progressive workouts focusing on shoulder cuff health.'
  },
  analyst: {
    title: 'Tactical Match Analyst',
    subtitle: 'Match Logistics, Formations & Statistics',
    icon: Flame,
    color: 'text-purple-400',
    borderColor: 'border-purple-500/30',
    bgColor: 'bg-purple-500/5',
    pillColor: 'bg-purple-400/10 text-purple-400',
    initialText: 'Ready to study the opposition. I analyze lineups, defensive triggers, counter-attack lanes, and perimeter coverage rotations.',
    systemPrompt: 'You are a Water Polo Match Analyst. You specialize in mathematical rotations, counter-attack statistics, and strategic board plays.'
  }
};

// Extracted Mock Response Generator for fallback
const getMockResponse = (agent, queryText, pName, pLvl, activePlayer) => {
  if (agent === 'marketing') {
    return `### 📣 DEPARTMENT BRIEFING: MARKETING OUTREACH
**Target Audience:** Club Parents & Local Community
**Contextualized for:** ${pName} (development progression updates included)

---

#### 📧 Parent Newsletter Draft: Weekly Highlights
> **Subject:** AquaOS Splash Updates: Roster Advancement & Pool Action! 🤽‍♂️
>
> Dear Water Polo Families,
>
> What a tremendous week of training we have had at the club! Our swimmers are putting in outstanding effort during morning swim sessions. 
> 
> A special congratulations to **${pName}**, who has been showing remarkable dedication to refining their ${pLvl === 1 ? 'basic head-up freestyle and introductory eggbeater skills' : pLvl === 2 ? 'one-handed ball control and Press defense positioning' : pLvl === 3 ? 'high-speed perimeter passes and corner shooting accuracy' : 'elite center-forward wrestling and high-velocity pop-up shots'}! Watching this growth is what makes our club community so special.
>
> 🗓️ **Saturday Match Schedule:**
> - U12/U14 Scrimmage: Warm-up starts at **09:00 AM** at Lane 4-6.
> - Parent Coffee & Club BBQ: **11:15 AM** near the grassy area. Come support the team!
>
> See you at the pool,
> **Your Club President & Agentic Team**

---

#### 📸 Instagram Social Media Copy
* **Visual Suggestion:** High-contrast photo of a swimmer in a yellow cap, ball held high out of the water, splashing in deep blue water.
* **Caption:**
  "Water polo isn't just a sport—it's a commitment to strength, precision, and family. 🤽‍♂️ Our young athletes are pushing their boundaries this week, leveling up their technical skills from eggbeater endurance to precision shooting! 
  
  Shoutout to stars like **${activePlayer ? activePlayer.name.split(' ')[0] : 'our U12 crew'}** for showing elite leadership in the lanes today! ⚡️ 
  
  Interested in joining the squad? We are open for summer trial memberships! Click the link in our bio to book a free assessment. 🌊
  
  #WaterPoloFamily #AquaOS #WaterPoloClub #SwimStamina #YouthSports"`;
  } 
  
  else if (agent === 'technical') {
    return `### 📋 HEAD COACH TACTICAL PRACTICE BOARD
**Topic:** Technical Development Plan
**Skill Set Level:** ${pLvl} (${pLvl === 1 ? 'Pups' : pLvl === 2 ? 'Bronze' : pLvl === 3 ? 'Silver' : 'Gold'})
**Target focus swimmer:** ${pName}

---

#### ⏱️ 90-Minute Practice Layout (Level ${pLvl})

| Phase | Duration | Objective / Description | Focus Drills |
| :--- | :--- | :--- | :--- |
| **1. Warm-Up** | 20 Min | Elevate heart rate, shoulder activation | - 200m Head-up crawl<br>- 4x50m IM order (no breaststroke, substitute sculling) |
| **2. Eggbeater Power** | 20 Min | Leg endurance, explosive vertical pop | - 8x 30s vertical tread (15s hand up, 15s elbow up)<br>- ${pLvl >= 3 ? '2kg Weight belt scull' : 'Gutter jump high touches'} |
| **3. Ball Control** | 25 Min | Dry catching & fast redirection | - 3-Player triangle dry passes<br>- ${pLvl === 1 ? '2-handed wall tosses' : 'Layout-to-vertical wet-catch turns'} |
| **4. Tactical Scrimmage**| 20 Min | Game positioning implementation | - 5v5 Half-court press-to-zone transitions<br>- Counter-attack shuttle drills |
| **5. Cool-Down** | 5 Min | Active recovery | - 100m easy backstroke / breaststroke kick |

---

#### 🎯 Custom Focus Drill for ${pName.split(' ')[0]}
* **Drill Name:** **The Directional Hip-Pivot**
* **Instructions:** Starting in a horizontal layout position dribbling a ball, on coach's whistle, the swimmer must drop their hips immediately, pop their head up high using eggbeater, secure the ball with one hand, pivot 180-degrees defensively, and execute a high-speed perimeter pass. Repeat 6 times on each side.`;
  } 
  
  else if (agent === 'physical') {
    return `### 🏋️‍♂️ SPORTS MEDICINE & S&C CONDITIONING CARD
**Focus Area:** Aquatic Power, Core & Injury Prevention
**Target Program for:** ${pName} (Current Level ${pLvl})

---

#### 1. Rotator Cuff & Thoracic Shoulder Warm-Up (15 Min - Dryland)
*Perform before entering the pool with medium-to-light resistance bands:*

1. **Band Pull-Aparts (Rotator Cuff Stability):**
   - 3 Sets x 15 Reps. Keep shoulder blades squeezed together, arms straight out.
2. **"W" Shoulder Swings (Scapular recruitment):**
   - 3 Sets x 12 Reps. Stand against wall, slide elbows and backs of hands up and down in a 'W' shape.
3. **Thoracic Rotations (Spinal mobility):**
   - 2 Sets x 10 Reps per side. Half-kneeling, rotate arm wide backwards following with eyes to open up the chest.

---

#### 2. Wet Conditioning Set: Lactate Recovery Stamina (30 Min)
*Designed to mimic high-speed counter-attack sprint loads:*

* **Set:** \`4 x 100m\` Sprints at 90% effort with specific rules:
  - **First 25m:** Head-up freestyle sprinting (dribbling simulated ball).
  - **Middle 50m:** Eggbeater treading sideways (defensive slide), hands out of water.
  - **Last 25m:** Head-down sprint to finish wall.
  - **Rest Interval:** 45 seconds between reps.
  - **Goal:** Maintain consistent heart rate treading while heavily fatigued.

---

#### 💡 Safety Recommendation for ${pName.split(' ')[0]}:
Since ${pName.split(' ')[0]} is treading at a Level ${pLvl} progression, monitor shoulder fatigue closely during dry passes. Ensure their elbow is elevated above water level on the ball wind-up to avoid excessive shoulder impingement.`;
  } 
  
  else {
    return `### 📊 TACTICAL SCRIMMAGE SCRAPBOOK & MATCH PREPARATION
**Topic:** Tactical Analysis & Starting Lineup Grid
**Squad Composition Level:** ${pLvl === 1 ? 'Introductory Play' : pLvl === 2 ? 'Intermediate Press' : pLvl === 3 ? 'Advanced Perimeter' : 'Elite Championship'}
**Coaching Consultation For:** ${pName}

---

#### 🛡️ Defensive Scheme Strategy: Press vs Drop
* **Default Defense:** **Tight Press (Man-to-Man)**
  - *Instruction:* Force opponents to dribble by denying the passing lane. Hips high, head-up, one hand touching attacker's hip.
* **Transition Trigger:** When the opponent has a strong center-forward (Hole-Set) and our center-back is getting excluded (kicked out).
* **Adaptation Scheme: The 'M-Drop' Zone:**
  \`\`\`
     [ Opponent Goal ]
        X1       X5     (Perimeter Wingers)
           X2  X4       (Drop defenders to block passing lanes)
             X3         (Locking down the center-forward)
  \`\`\`
  - *Execution:* Our wing defenders (Positions 2 & 4) sag off their attackers towards the 2-meter line. This creates an 'M' block pattern that clogs the pass to the Hole Set, forcing lower-risk long shots.

---

#### 📋 Tactical Match Note for ${pName.split(' ')[0]}:
In next scrimmage, instruct **${pName.split(' ')[0]}** to focus on back-checking immediately during a turnover. When swimming back, they must stay *between* their defender and the goal line (retaining defensive inside position) rather than swimming directly next to them.`;
  }
};

export default function AgentHub({ activePlayer }) {
  const [selectedAgent, setSelectedAgent] = useState('technical');
  const [inputText, setInputText] = useState('');
  const [chatLog, setChatLog] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [contextualize, setContextualize] = useState(true);

  const profile = AGENT_PROFILES[selectedAgent];
  const Icon = profile.icon;

  const currentChatOutput = chatLog[selectedAgent] || profile.initialText;

  const handleQuery = async (queryText) => {
    if (!queryText) return;
    setIsGenerating(true);
    setInputText('');

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const pName = activePlayer ? activePlayer.name : 'entire squad';
    const pLvl = activePlayer ? activePlayer.level : 2;

    if (apiKey && apiKey !== 'your_actual_gemini_api_key_here' && apiKey.trim() !== '') {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const pAge = activePlayer ? activePlayer.age : 'N/A';
        const pSkills = activePlayer ? activePlayer.skills : null;

        // Structured player data context wrapping
        const playerContext = contextualize && activePlayer
          ? `Active Focused Swimmer details:
- Name: ${pName}
- Age: ${pAge}
- Current Skill Progression Level: Level ${pLvl} (out of 4)
- Skill Scores (out of 100):
  * Swimming: ${pSkills.swimming}
  * Ball Handling: ${pSkills.ballHandling}
  * Shooting: ${pSkills.shooting}
  * Tactics: ${pSkills.tactics}
  * Stamina: ${pSkills.stamina}`
          : `No active focused swimmer is selected. Provide generic U12/U14 age-appropriate instructions for the general squads.`;

        const systemInstruction = `${profile.systemPrompt}
You are operating within the AquaOS Club President Dashboard.
Keep your output structured, using professional formatting, tables, lists, or blockquotes where appropriate.
${playerContext}
Output should be formatted as clean Markdown. Make sure to adapt suggestions, drills, or copy specifically to this target audience and context.`;

        const promptText = `${systemInstruction}\n\nUser Command / Prompt: ${queryText}`;
        const result = await model.generateContent(promptText);
        const responseText = result.response.text();

        setChatLog(prev => ({
          ...prev,
          [selectedAgent]: responseText
        }));
      } catch (err) {
        console.error('Gemini API Error:', err);
        const fallbackResponse = getMockResponse(selectedAgent, queryText, pName, pLvl, activePlayer);
        setChatLog(prev => ({
          ...prev,
          [selectedAgent]: `### ❌ Gemini API Error
An error occurred while connecting to Google Gemini. Please verify your API Key in the \`.env\` file.

**Technical Details:**
\`\`\`
${err.message || err}
\`\`\`

---
*Falling back to local simulation below:*

${fallbackResponse}`
        }));
      } finally {
        setIsGenerating(false);
      }
    } else {
      // Local Simulation Fallback
      setTimeout(() => {
        const response = getMockResponse(selectedAgent, queryText, pName, pLvl, activePlayer);
        setChatLog(prev => ({
          ...prev,
          [selectedAgent]: response
        }));
        setIsGenerating(false);
      }, 1200);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(currentChatOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[780px]">
      
      {/* Sidebar: Agent Selector & Presets */}
      <div className="lg:col-span-4 flex flex-col gap-4">
        
        {/* Active Swimmer Context Badge */}
        <div className="glass-panel p-4 flex items-center justify-between border-slate-700/60 bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20">
              <Users size={18} />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Active Context Focus</span>
              <strong className="text-white text-sm">
                {activePlayer ? activePlayer.name : 'Entire Swimmers Squad'}
              </strong>
            </div>
          </div>
          
          {activePlayer && (
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={contextualize} 
                onChange={() => setContextualize(!contextualize)} 
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500 peer-checked:after:bg-slate-950"></div>
            </label>
          )}
        </div>

        {/* Agent Cards Selection Container */}
        <div className="glass-panel p-4 flex-1 space-y-2 overflow-y-auto">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2 mb-3">
            Select Department
          </h4>

          {Object.entries(AGENT_PROFILES).map(([key, data]) => {
            const AgentIcon = data.icon;
            const isSelected = selectedAgent === key;
            return (
              <div
                key={key}
                onClick={() => setSelectedAgent(key)}
                className={`p-3.5 rounded-xl cursor-pointer transition-all border flex items-start gap-3.5 ${
                  isSelected 
                    ? `bg-slate-950/60 ${data.borderColor} ${data.bgColor}` 
                    : 'bg-transparent border-transparent hover:bg-slate-950/30'
                }`}
              >
                <div className={`p-2.5 rounded-lg border ${
                  isSelected 
                    ? `bg-slate-950 ${data.borderColor} ${data.color}` 
                    : 'bg-slate-900/60 border-slate-800 text-slate-500'
                }`}>
                  <AgentIcon size={20} />
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className={`text-sm font-bold transition-all ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                      {data.title}
                    </span>
                    {isSelected && (
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${data.pillColor}`}>
                        Active
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 block mt-0.5">
                    {data.subtitle}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Panel: Interactive Terminal Console */}
      <div className="lg:col-span-8 glass-panel p-6 flex flex-col h-full bg-slate-950/40 relative overflow-hidden">
        
        {/* Terminal Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-800 mb-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-slate-900 border ${profile.borderColor} ${profile.color}`}>
              <Bot size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                {profile.title}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">{profile.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={handleCopy}
              className="btn btn-secondary p-2 rounded-lg flex items-center justify-center text-slate-400 hover:text-white"
              title="Copy Output"
            >
              {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
            </button>
          </div>
        </div>

        {/* Chat / Result Panel */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 mb-6 text-sm text-slate-200 font-sans">
          
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3">
              <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
              <p className="text-xs font-mono tracking-wider uppercase text-cyan-400/80 animate-pulse">
                Agent drafting briefing logs...
              </p>
            </div>
          ) : (
            <div className="space-y-4 font-sans leading-relaxed text-slate-300">
              {/* Output Content */}
              <div className="bg-slate-900/30 p-5 rounded-2xl border border-slate-800/80 space-y-4 shadow-inner">
                {currentChatOutput.split('\n\n').map((paragraph, pIdx) => {
                  
                  // Check if it's a heading
                  if (paragraph.startsWith('### ')) {
                    return <h3 key={pIdx} className="text-lg font-bold text-white border-b border-slate-800 pb-2 mt-4">{paragraph.replace('### ', '')}</h3>;
                  }
                  if (paragraph.startsWith('#### ')) {
                    return <h4 key={pIdx} className="text-base font-bold text-cyan-400 mt-3">{paragraph.replace('#### ', '')}</h4>;
                  }
                  // Check if it's a blockquote
                  if (paragraph.startsWith('> ')) {
                    return (
                      <blockquote key={pIdx} className="border-l-4 border-cyan-400 bg-slate-950/60 p-4 rounded-r-xl font-mono text-xs text-slate-300 whitespace-pre-line leading-loose">
                        {paragraph.replaceAll('> ', '')}
                      </blockquote>
                    );
                  }
                  // Check if it's a list
                  if (paragraph.startsWith('* ') || paragraph.startsWith('- ')) {
                    return (
                      <ul key={pIdx} className="list-disc pl-5 space-y-1.5 text-xs text-slate-300">
                        {paragraph.split('\n').map((li, liIdx) => (
                          <li key={liIdx}>{li.replace(/^(\*\s|-\s)/, '')}</li>
                        ))}
                      </ul>
                    );
                  }
                  
                  // Simple text paragraphs
                  return <p key={pIdx} className="whitespace-pre-line leading-relaxed">{paragraph}</p>;
                })}
              </div>
            </div>
          )}
        </div>

        {/* Input & Prompt Presets */}
        <div className="shrink-0 space-y-4">
          
          {/* Quick Presets Slider */}
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2 px-1">
              Quick Action Presets
            </span>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {AGENT_PROMPTS[selectedAgent].map((preset, pIdx) => (
                <button
                  key={pIdx}
                  onClick={() => handleQuery(preset.prompt)}
                  className="bg-slate-900 border border-slate-800/80 hover:border-cyan-400/40 text-slate-300 hover:text-white rounded-lg px-3 py-1.5 text-xs whitespace-nowrap transition-all duration-200"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Form Command Bar */}
          <div className="relative">
            <input 
              type="text" 
              placeholder={`Send instruction to ${profile.title}...`}
              className="w-full pl-4 pr-12 py-3.5 bg-slate-900 border border-slate-700/60 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/80"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleQuery(inputText)}
            />
            <button 
              onClick={() => handleQuery(inputText)}
              className="absolute right-2 top-2 p-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 transition-all cursor-pointer"
            >
              <Send size={16} />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
