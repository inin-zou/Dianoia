# Dianoia - The Reasoning Mind

Open-Source Palantir for Crime Scene Investigation.

## Project Context

Hackathon project for TechEurope Stockholm. ~6.5hrs build time, 3-5 person team.

**Full design docs:** `.claude/docs/overview.md` (index linking all 9 docs)

## Current State

**Frontend (DONE — dark tactical theme):**
- Landing page at `/` with Three.js wireframe animation + system menu → navigates to `/app`
- Main app at `/app` with 4 module tabs: Scene, Analysis, Timeline, Profiling
- Design: glass panels, JetBrains Mono labels, haze/frosted background, grid overlays
- Mock data in place — ready to wire to real backend
- React 18, R3F v8, Three.js r183, Vite 5, Tailwind, shadcn/ui

**Backend (TODO):**
- Go project not yet scaffolded
- Supabase tables not yet created
- Gemini integration not yet built

## Tech Stack

- **Frontend:** React 18/TypeScript + React Three Fiber v8 + Three.js r183
- **Backend:** Go (REST API on :8080, Gemini orchestration)
- **Database:** Supabase (Postgres + Realtime + Storage)
- **AI:** Gemini (VLM + reasoning + NanoBanana image gen)
- **3D Scan:** Marble API (World Labs)
- **Styling:** Tailwind CSS + shadcn/ui (dark tactical theme)
- **Typography:** JetBrains Mono (system) + Inter (body)

## Architecture — Frontend-Backend Connection

**Two communication paths:**

1. **Frontend → Go Backend (REST):** For commands that trigger AI work (add evidence, analyze, generate profile)
2. **Supabase → Frontend (Real-time):** For data updates (new hypotheses, VLM annotations, scan status)

Frontend NEVER calls Gemini/Marble/NanoBanana directly. Go backend is the orchestrator.

```
Frontend ——REST POST——> Go Backend :8080 ——> Gemini/Marble/NanoBanana
                              |
                        Writes results to Supabase
                              |
Supabase Realtime ——push——> Frontend re-renders
```

**Frontend uses:**
- `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` — for reads + real-time subscriptions
- `VITE_API_URL` (default `http://localhost:8080`) — for commands to Go backend

**Backend uses:**
- `SUPABASE_SERVICE_ROLE_KEY` — full DB access
- `GEMINI_API_KEY`, `MARBLE_API_KEY` — external AI services

**See `architecture.md` for the full table of which operations use which path.**

## Design Docs Usage Guide

All docs live in `.claude/docs/`. Read `overview.md` for the full index.

| Doc | When to Read |
|-----|-------------|
| `product-design.md` | Understanding features, user flows, demo scenario |
| `architecture.md` | **Module boundaries, frontend-backend wiring, data flow diagrams** |
| `data-model.md` | Supabase schema, real-time subscriptions, credibility model |
| `interfaces.md` | **Source of truth** for all shared types (TS + Go), REST API endpoints |
| `design-guide.md` | UI components, colors, typography, glass panel system, component hierarchy |
| `agentic-engineering.md` | Agent teams, Implement → Test → Review cycle, parallel strategy |
| `implementation-plan.md` | **Pre-hackathon status, what's next, wiring plan, dependency graph** |
| `roadmap.md` | Hackathon schedule, MVP vs nice-to-have, 3-min demo script |

**Quick reference:**
- "How does frontend talk to backend?" → `architecture.md` (Frontend-Backend Communication Strategy)
- "What API endpoint should I use?" → `interfaces.md`
- "What type should this field be?" → `interfaces.md`
- "Can frontend call Gemini directly?" → NO. Go backend only. See `architecture.md`
- "What color for witness markers?" → `design-guide.md`
- "What Supabase table stores hypotheses?" → `data-model.md`
- "What should I build next?" → `implementation-plan.md`
- "Is this feature MVP or stretch?" → `roadmap.md`

## Development Rules

1. **Interfaces first** — check `interfaces.md` for types before implementing. Add new types there first if needed.
2. **Module boundaries** — frontend calls Go backend for commands, reads Supabase directly for queries.
3. **Frontend reads via Supabase, commands via Go API** — see architecture.md for the full routing table.
4. **Test after every feature** — write and run unit tests before marking any task complete.
5. **Design review after each feature** — check for pattern consistency, interface reuse, no duplication.
6. **Gemini prompts in template files** — not inline strings. Store in `backend/prompts/`.
7. **Pre-made 3D assets** at real-world scale (1 unit = 1 meter) in `frontend/public/assets/3d/`.
8. **Dark tactical theme** — glass panels, JetBrains Mono labels, `// SYSTEM_STYLE` headers.

## File Structure

```
frontend/                       # React 18 + Vite 5
  src/
    components/
      landing/                  # WireframePlane.tsx (Three.js shader)
      ui/                       # shadcn/ui components
      TopNavbar.tsx             # DIANOIA brand, tabs, case title
      BottomBar.tsx             # Scrubber, hypothesis ranking
      SceneModule.tsx           # Evidence sidebar + 3D viewport
      AnalysisModule.tsx        # Hypothesis list + evidence graph
      TimelineModule.tsx        # Viewport + track editor
      ProfilingModule.tsx       # Profile list + composite editor
    data/mockData.ts            # Placeholder data (to be replaced with Supabase)
    hooks/
    lib/                        # TODO: supabase.ts, api.ts
    types/                      # TODO: mirrors interfaces.md
    pages/
      Landing.tsx               # Three.js hero + system menu → /app
      Index.tsx                 # Main app shell with module tabs
  .env                          # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_URL

backend/                        # TODO: Go
  cmd/server/main.go
  internal/
    api/                        # HTTP handlers
    service/                    # Business logic
    gemini/                     # Gemini client
    marble/                     # Marble client
    supabase/                   # Supabase client
    types/                      # Go types from interfaces.md
  prompts/                      # Gemini prompt templates

.env                            # All keys (root level, gitignored)
.env.example                    # Template without values
```

## Critical Path

```
Supabase schema → Go API → Gemini Reasoning → Frontend Timeline Playback
```

If this chain works, we have a demo. Everything else enhances it.

## Two Main Modules

1. **Crime Scene Reconstruction & Reasoning** — scan scene, 3D blueprint, evidence placement, progressive LLM reasoning, timeline playback with ranked hypotheses
2. **Suspect Profiling** — NanoBanana iterative composite generation (separate module)
