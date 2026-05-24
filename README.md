# 🤽 AquaOS — Agentic Water Polo Club Manager

Club operations platform for water polo teams. Combines a React dashboard, a FastAPI backend, and CrewAI agents to automate scheduling, training plans, lineups, availability, and social media publishing.

**Current PoC** → live at `https://d2g5jw5n3lwmjc.cloudfront.net`

---

## Architecture

```
Browser ──→ CloudFront CDN ──→ S3 (React app)
                │
                └── /api/* ──→ EC2 (FastAPI + CrewAI)
                                  │
                                  ├── OpenRouter (DeepSeek V3, Claude Haiku, Gemini Flash)
                                  └── ChromaDB (vector memory) / SQLite (state)
```

| Layer | Tech | Purpose |
|---|---|---|
| Frontend | React 19 + Vite | Dashboard, player management, crew triggers |
| Backend | FastAPI + CrewAI | Agent orchestration, planning, lineups |
| LLM Router | OpenRouter | Per-agent model selection (tactical → DeepSeek, copy → Claude, etc.) |
| Infra | AWS (EC2, S3, CloudFront) | Hosting + CDN |

---

## Roadmap

### Phase 1 — Foundation ✅ (current)

- [x] EC2 backend with FastAPI + CrewAI agents
- [x] Per-agent LLM routing via OpenRouter
- [x] S3 + CloudFront frontend hosting
- [x] Player database (SQLite, seed data)
- [x] Crew triggers: match prep, enrollment, progress review, season plan, injury response

### Phase 2 — Training System

**Level system (defined — see below)**
- 7-level development system from Water Competency → Competition Mastery
- Each level maps to a database table with exercises, progression gates, and skill focus
- Players advance via structured assessments: skills test, match performance, attendance

**Exercise library**
- Catalog of exercises per level with descriptions, difficulty, equipment, duration
- YouTube-hosted videos linked to each exercise for visual explanation
- Filterable by level, skill category (passing, shooting, defense, conditioning, goalkeeping)

**Year / season planner**
- Auto-generated weekly plans based on level curriculum and season phase (pre-season, competition, off-season)
- Macro-cycle planning: season goals → monthly blocks → weekly sessions → daily drills

---

## SKB Waterpolo School — 7-Level Development System

### Level 1 — Water Competency & Basic Ball Handling

Fundamental water confidence and comfort.

- Proper freestyle swimming technique with correct body alignment and breathing
- Strong basic eggbeater kick for stationary stability
- Vertical positioning and controlled vertical jumps
- Basic ball handling (catching, gripping, and two-handed throwing)
- Head-up swimming and simple dribbling
- Safe water entries, gliding, and streamline position

### Level 2 — Controlled Passing & Continuous Movement

Consistent passing and catching technique while moving with the ball.

- Proper passing technique (wrist snap, ball spin, and accurate release)
- Reliable catching with one and two hands while stationary and moving
- Core stability and balance during ball handling
- Continuous movement while dribbling with head up
- Moving catch-and-release in one fluid motion
- Basic eggbeater while performing arm actions (passing/sculling)

### Level 3 — Handling Pressure & Basic Tactics

Light defensive pressure introduced. Refining passing and shooting accuracy.

- Passing and catching under light pressure
- Basic faking (short and medium fakes)
- Ball shielding and protection with the body
- Proper shooting technique (wrist shot and push shot)
- Simple tactical concepts: man-up positioning and basic zone defense
- Swim-through movements to create space
- Maintaining verticality and stability when contested

### Level 4 — Individual Dominance & Defensive Fundamentals

Individual 1v1 skills on both offense and defense.

- Winning the outside lane in 1v1 situations
- Strong defensive positioning, footwork, and press defense
- Contact shooting (shooting while defended)
- Effective ball protection in physical duels
- Basic transition play (offense to defense and vice versa)
- Proper defensive posture (hand up, hips low, controlled distance)
- Advanced eggbeater for explosive vertical jumps under pressure

### Level 5 — Collective Play & Tactical Versatility

Team structure and coordinated play.

- Pick and roll execution (timing and spacing)
- Advanced man-up patterns and rotations
- Defensive player switching and communication
- Positional role fundamentals (Center, Center-Back, Wing, Goalie)
- M-Zone defensive structure and rotation timing
- Tactical patience and structured team attacks
- Understanding of basic counterattack timing

### Level 6 — High-Level Skills & Adaptive Teamplay

Advanced technical skills and game intelligence.

- Advanced faking (long fakes, shoulder fakes, double fakes, fake-and-drive)
- Advanced defensive techniques (steals, shot blocking, fronting the center)
- Center position mastery (seal & roll, backhand shots)
- Reading opponent defenses and adapting in real time
- Complex transition play (counter, reset, or press decisions)
- High-level ball control under heavy pressure
- Fluid combination of fakes, drives, and shots

### Level 7 — High Performance & Competition Mastery

Competitive performance at the highest level.

- Tactical leadership and play-calling on the field
- Full game system execution (complex man-up, double picks, drive rotations)
- Elite decision-making under fatigue and high pressure
- Reading complex game situations and opponent tendencies
- Maintaining technical precision and speed at competition intensity
- Advanced pressing variations and defensive adjustments
- Complete transition mastery in all game phases

---

### Phase 3 — Team & Schedule Management

**Trainer assignment**
- Assign a specific trainer to each training session, match, or event
- Trainer profiles: certifications, specialties, availability calendar
- Automatic conflict warnings when double-booking a trainer

**Availability tracking**
- Pre-season availability form for players and trainers
- Players/trainers mark days they are unavailable for the full season
- Recurring unavailability patterns (e.g., "never on Tuesday evenings")
- Dashboard view: who's available for next session

**Calendar & automations**
- Central calendar synced with training sessions, matches, tournaments, and team events
- Automated lineup generation based on confirmed availability + level
- Travel planning: auto-generate travel sheet with meeting point, departure time, pool address
- Automated reminders (email/push) for upcoming sessions and unconfirmed attendance

### Phase 4 — Social Media Automation

**Game announcements**
- Post to Instagram and Facebook automatically when a game is added
- Generic game-day photo template with:
  - Team name / logo
  - Opponent
  - Date, time, venue
  - Score placeholder (updated post-game)
- Configurable posting schedule (e.g., 2 days before, game day, post-match result)
- Integration via Meta Graph API (Instagram + Facebook pages)

### Phase 5 — Responsive UI

**Current state**: desktop-first layout, needs mobile adaptation.

- [ ] Mobile-responsive layout (gestión from phone on pool deck)
- [ ] Offline-capable PWA for training sessions (no signal at some pools)
- [ ] Dark theme consolidation (already partially styled)
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Touch-friendly drag-and-drop for calendar and lineup builder
- [ ] Player attendance check-in directly from mobile

---

## Local Development

```bash
# Frontend
npm install
npm run dev           # http://localhost:5173

# Backend (needs Python 3.12)
cd backend
pip install -r requirements.txt
cp ../.env.example ../.env      # fill in your API keys
uvicorn main:app --reload       # http://localhost:8000
```

### Environment

```env
OPENROUTER_API_KEY=sk-or-v1-...   # preferred — per-agent model routing
GEMINI_API_KEY=AIza...           # fallback — single model
```

If both are set, OpenRouter takes priority.

---

## Deployment

```bash
# Build frontend
npm run build

# Deploy to S3 + invalidate CloudFront
aws s3 sync dist/ s3://aquaos-frontend-poc-799517508276/ --delete
aws cloudfront create-invalidation --distribution-id E31NH89AWHMHS6 --paths "/*"

# Or use the CloudFormation deploy script
cd cloudformation
cp parameters.example.json parameters.json  # fill in keys
./deploy.sh update
```

---

## Agent Crews (CrewAI)

| Crew | Purpose | Trigger |
|---|---|---|
| `match_prep` | Opponent analysis, lineup suggestions, tactical plan | Before each game |
| `enrollment` | New player campaigns, recruitment copy | Monthly / seasonal |
| `progress_review` | Per-player progress reports, level advancement | Weekly / on demand |
| `season_plan` | Full-season macro-cycle planning | Pre-season |
| `injury_response` | Injury assessment, recovery plan, lineup adjustments | On report |