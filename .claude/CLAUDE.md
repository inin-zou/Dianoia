# Dianoia - The Reasoning Mind

Open-Source Palantir for Crime Scene Investigation.

## Project Context

Hackathon project for TechEurope Stockholm. ~6.5hrs build time, 3-5 person team.

**Full design docs:** `.claude/docs/overview.md` (index linking all 9 docs)

## Tech Stack

- **Frontend:** React/TypeScript (scaffolded from Lovable) + React Three Fiber (3D)
- **Backend:** Go (API orchestrator, Gemini calls)
- **Database:** Supabase (Postgres + Realtime + Storage)
- **AI:** Gemini (VLM scene analysis + reasoning engine + NanoBanana image gen)
- **3D Scan:** Marble API (World Labs)

## Architecture

Three decoupled modules communicating via Supabase:
1. **Frontend** -- React/R3F, all rendering and UI
2. **Go Backend** -- REST API, Gemini orchestration, reasoning pipeline
3. **Marble Pipeline** -- scan, export, VLM blueprint extraction

Frontend does NOT call Gemini directly. Go backend writes results to Supabase, frontend reacts via real-time subscriptions.

## Design Docs Usage Guide

All docs live in `.claude/docs/`. Read `overview.md` for the full index. Here's when to use each:

| Doc | When to Read |
|-----|-------------|
| `product-design.md` | Starting the project, understanding features, writing demo script, checking user flows |
| `architecture.md` | Before building any module -- understand boundaries, data flows, what each module owns vs doesn't |
| `data-model.md` | Setting up Supabase, writing queries, adding new tables, understanding real-time subscriptions and credibility model |
| `interfaces.md` | **Before writing ANY code** -- source of truth for all shared types (TS + Go), REST API endpoints, reusable abstractions. Add new types here first, then implement. |
| `design-guide.md` | Building UI components, choosing colors, rendering 3D assets, setting up R3F scene. Contains the **Lovable prompt** and full component hierarchy. |
| `agentic-engineering.md` | Running agent teams for implementation. Defines the Implement -> Test -> Review cycle, parallel agent strategy, and quality gates. |
| `implementation-plan.md` | Picking what to work on next. Has the hourly task breakdown, dependency graph, and critical path. |
| `roadmap.md` | Checking hackathon schedule, what's MVP vs nice-to-have, the 3-min demo script. |

**Quick reference by task:**
- "What API endpoint should I use?" -> `interfaces.md`
- "What type should this field be?" -> `interfaces.md`
- "Can frontend call Gemini directly?" -> `architecture.md` (no -- Go backend only)
- "What color for witness markers?" -> `design-guide.md`
- "What Supabase table stores hypotheses?" -> `data-model.md`
- "What should I build next?" -> `implementation-plan.md`
- "Is this feature MVP or stretch?" -> `roadmap.md`
- "How do I run agents in parallel?" -> `agentic-engineering.md`
- "What's the demo storyline?" -> `product-design.md` + `roadmap.md` (demo script)

## Development Rules

1. **Interfaces first** -- check `interfaces.md` for types before implementing. Add new types there first if needed.
2. **Module boundaries** -- frontend stays in frontend, backend stays in backend. Communication via Supabase only.
3. **Test after every feature** -- write and run unit tests before marking any task complete.
4. **Design review after each feature** -- check for pattern consistency, interface reuse, no duplication.
5. **Gemini prompts in template files** -- not inline strings. Store in `backend/prompts/`.
6. **Pre-made 3D assets** at real-world scale (1 unit = 1 meter) in `frontend/public/assets/3d/`.

## File Structure

```
frontend/
  src/
    components/{blueprint,timeline,evidence,profiling,shared}/
    hooks/
    types/          -- mirrors interfaces.md
    lib/            -- supabase client, utils
    pages/

backend/
  cmd/server/       -- main entry
  internal/
    api/            -- HTTP handlers
    service/        -- business logic
    gemini/         -- Gemini client + prompts
    marble/         -- Marble client
    supabase/       -- Supabase client
    types/          -- mirrors interfaces.md
  prompts/          -- Gemini prompt templates
```

## Critical Path

```
Supabase schema -> Go API -> Gemini Reasoning -> Frontend Timeline Playback
```

If this chain works, we have a demo. Everything else enhances it.

## Two Main Modules

1. **Crime Scene Reconstruction & Reasoning** -- scan scene, generate 3D blueprint, place evidence, progressive LLM reasoning, timeline playback with ranked hypotheses
2. **Suspect Profiling** -- NanoBanana iterative composite generation (separate module)
