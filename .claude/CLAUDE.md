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

## Key Design Docs (read these before coding)

- `interfaces.md` -- shared TypeScript/Go types, REST API endpoints. Source of truth for all types.
- `architecture.md` -- module boundaries, data flow diagrams
- `agentic-engineering.md` -- how to use agent teams, quality gates (test + review after every feature)
- `design-guide.md` -- UI layout, color system, 3D conventions, Lovable prompt, component hierarchy

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
