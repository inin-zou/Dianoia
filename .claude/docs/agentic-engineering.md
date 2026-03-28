# Agentic Engineering

How to use Claude Code agent teams to implement this project efficiently, with quality gates after every task.

## Current State (Pre-Hackathon)

**Done:**
- Frontend scaffold with dark tactical theme (Landing + App with 4 modules)
- API keys stored in `.env` (Supabase, Gemini, Marble)
- Design docs aligned with actual code
- R3F v8 + Three.js r183 installed

**Not done:**
- Supabase schema (tables + storage buckets)
- Go backend (not scaffolded yet)
- Gemini prompt templates
- Marble 0.1-mini integration
- Frontend ↔ Backend wiring (lib/supabase.ts, lib/api.ts)

## Core Principle

Every feature implementation follows this cycle:

```
Implement -> Unit Test -> Design Review -> Next Task
```

No task is "done" until tests pass and the design review confirms patterns are followed.

## Agent Team Structure

### Agent Roles

| Role | Responsibility | When to Use |
|------|---------------|-------------|
| **Feature Dev Agent** | Implements a specific feature end-to-end | Each task in the implementation plan |
| **Test Agent** | Creates and runs unit tests after each feature | Automatically after every feature task |
| **Code Review Agent** | Reviews for design patterns, reusable interfaces, code quality | After each feature passes tests |
| **Explore Agent** | Researches codebase before implementation | When starting work on an unfamiliar area |
| **Plan Agent** | Breaks down complex features into subtasks | When a feature is too large for one pass |

### Workflow Per Task

```
1. [Plan Agent] Break feature into subtasks if needed
         |
2. [Explore Agent] Understand existing patterns in codebase
         |
3. [Feature Dev Agent] Implement the feature
         |
4. [Test Agent] Write + run unit tests
         |  GATE: All tests must pass
         |
5. [Code Review Agent] Review against design patterns
         |  GATE: No pattern violations
         |
6. Mark task complete, move to next
```

## Parallel Agent Strategy

### Independent Tracks (can run simultaneously)

```
Track A (Frontend — wiring):
  lib/supabase.ts + lib/api.ts → Replace mock data → R3F BlueprintView3D
  → Evidence placement → Timeline playback → Profiling chat wiring

Track B (Backend — Go API + Gemini):
  Go project init → chi router + CORS → Supabase client
  → CRUD endpoints → Gemini VLM integration → Reasoning pipeline
  → NanoBanana profiling

Track C (Pipeline — Marble 0.1-mini):
  Marble client (Go) → Test with sample image → Upload + generate world
  → Poll status → Extract assets (mesh, splat, embed URL)
  → Blueprint generation (Gemini VLM on rendered views)
```

### Sync Points (tracks must converge)

1. **After Supabase schema is created** — all tracks need it
2. **After Go API is running with CORS** — frontend can call it
3. **After BlueprintData format is validated** — backend produces, frontend renders
4. **After hypothesis JSON is working** — backend writes, frontend reads via real-time

## Frontend-Backend Communication

### Two Paths

| Path | Use For | Library |
|------|---------|---------|
| Frontend → Go Backend (REST) | Commands: add evidence, trigger analysis, upload scan, refine profile | `lib/api.ts` using `fetch()` |
| Supabase → Frontend (Real-time) | Data updates: new hypotheses, VLM annotations, scan status | `lib/supabase.ts` using `@supabase/supabase-js` |

### Frontend File Conventions

```
frontend/src/
  lib/
    supabase.ts          -- createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
    api.ts               -- apiPost/apiGet to VITE_API_URL (Go :8080)
  types/
    index.ts             -- All TS types from interfaces.md
  hooks/
    useRealtimeTable.ts  -- Generic real-time subscription hook
  components/
    landing/             -- Landing page 3D (WireframePlane.tsx)
    ui/                  -- shadcn/ui components
    SceneModule.tsx      -- Evidence sidebar + 3D viewport
    AnalysisModule.tsx   -- Hypothesis list + evidence graph
    TimelineModule.tsx   -- Viewport + track editor
    ProfilingModule.tsx  -- Profile list + composite editor
    TopNavbar.tsx        -- Brand, tabs, case title
    BottomBar.tsx        -- Scrubber, hypothesis ranking
  pages/
    Landing.tsx          -- / route — Three.js hero + system menu
    Index.tsx            -- /app route — main app shell
```

### Backend File Conventions

```
backend/
  cmd/server/main.go           -- entry point, chi router, CORS, env loading
  internal/
    api/
      cases.go                 -- case CRUD handlers
      evidence.go              -- evidence handlers (POST triggers VLM)
      witnesses.go             -- witness handlers
      analysis.go              -- POST /analyze triggers reasoning
      scan.go                  -- Marble scan handlers
      profiles.go              -- suspect profile handlers
    service/
      evidence.go              -- evidence business logic + VLM trigger
      reasoning.go             -- hypothesis generation pipeline
      profiling.go             -- NanoBanana orchestration
      blueprint.go             -- VLM → room desc → blueprint JSON
    gemini/
      client.go                -- Gemini API wrapper
      vlm.go                   -- vision analysis methods
      reasoning.go             -- hypothesis generation methods
      image.go                 -- NanoBanana/image generation
    marble/
      client.go                -- Marble 0.1-mini API wrapper
    supabase/
      client.go                -- Supabase REST client wrapper
    types/
      types.go                 -- Go types from interfaces.md
  prompts/
    vlm_scene.tmpl             -- room description prompt
    vlm_evidence.tmpl          -- evidence annotation prompt
    reasoning.tmpl             -- hypothesis generation prompt
    blueprint.tmpl             -- blueprint JSON generation prompt
```

## Marble 0.1-mini Integration

Use **Marble 0.1-mini** for all development and demo (fast: 30-45s, cheap: 230 credits).

### API Reference

| Detail | Value |
|--------|-------|
| Base URL | `https://api.worldlabs.ai` |
| Auth header | `WLT-Api-Key: <MARBLE_API_KEY>` |
| Model | `Marble 0.1-mini` |
| Generate endpoint | `POST /marble/v1/worlds:generate` |
| Poll status | `GET /marble/v1/operations/{operation_id}` |
| Get world | `GET /marble/v1/worlds/{world_id}` |
| Upload media | `POST /marble/v1/media-assets:prepare_upload` |
| Generation time | ~30-45 seconds |
| Cost | ~230 credits per generation |

### Generate Request (image input)

```json
POST /marble/v1/worlds:generate
{
  "display_name": "Crime Scene Scan",
  "model": "Marble 0.1-mini",
  "world_prompt": {
    "type": "image",
    "image_prompt": {
      "source": "uri",
      "uri": "https://supabase.../evidence-images/scene.jpg"
    },
    "text_prompt": "Interior room crime scene"
  }
}
```

Response returns `operation_id`. Poll until `done: true`.

### World Object Assets (when ready)

```json
{
  "world_id": "uuid",
  "world_marble_url": "https://marble.worldlabs.ai/world/{world_id}",
  "assets": {
    "caption": "AI-generated scene description",
    "thumbnail_url": "https://...",
    "splats": {
      "spz_urls": {
        "100k": "https://...100k.spz",
        "500k": "https://...500k.spz",
        "full_res": "https://...full.spz"
      }
    },
    "mesh": {
      "collider_mesh_url": "https://...collider.glb"
    },
    "imagery": {
      "pano_url": "https://...pano.jpg"
    },
    "semantics_metadata": {
      "ground_plane_offset": 0.0,
      "metric_scale_factor": 1.0
    }
  }
}
```

### What We Use

| Asset | Use |
|-------|-----|
| `world_marble_url` | Iframe embed in "Realistic 3D" view |
| `collider_mesh_url` | GLB mesh for physics/collision |
| `pano_url` | Panorama image → send to Gemini VLM for room description |
| `spz_urls` | Gaussian splats for high-quality rendering (optional, via SparkJS) |
| `metric_scale_factor` | Maps Marble units to real-world meters |

### Go Marble Client Interface

```go
type MarbleClient struct {
    apiKey  string
    baseURL string // https://api.worldlabs.ai
}

func (c *MarbleClient) GenerateWorld(ctx context.Context, imageURL, displayName string) (operationID string, err error)
func (c *MarbleClient) PollOperation(ctx context.Context, operationID string) (world *World, done bool, err error)
func (c *MarbleClient) GetWorld(ctx context.Context, worldID string) (*World, error)
```

### Marble → Blueprint Pipeline

```
1. User uploads crime scene photo
2. Go backend → Marble 0.1-mini: generate world from image
3. Poll until done (~30-45s)
4. Extract: embed URL, pano_url, mesh_url, scale_factor
5. Store in marble_scans table
6. Send pano_url to Gemini VLM → room description JSON
7. Send room description to Gemini LLM → BlueprintData JSON
8. Store blueprint in cases.blueprint_data
9. Frontend renders both:
   - "Realistic 3D" tab: iframe to world_marble_url
   - "Blueprint 3D" tab: R3F scene from BlueprintData
```

## Quality Gates

### Gate 1: Unit Tests (after every task)

- **Frontend components**: Test rendering, user interactions, state changes
- **Go API endpoints**: Test request/response, error cases, Supabase integration
- **Gemini pipeline**: Test prompt construction, response parsing, structured output validation
- **Marble pipeline**: Test world generation request/poll/asset extraction

Test naming: `<feature>_test.go` (Go), `<Component>.test.tsx` (React)

```bash
# Go
go test ./...

# Frontend
npm test
```

### Gate 2: Design Review (after each feature)

Code review agent checks:

1. **Interface reuse**: Types from `interfaces.md` used, not duplicated
2. **Pattern consistency**: Same patterns as existing code
3. **Module boundaries**: Frontend → Go backend for commands, Supabase for reads
4. **Type safety**: Shared types used correctly
5. **Separation of concerns**: Rendering separate from data fetching, business logic in Go
6. **YAGNI**: No unnecessary complexity

## Design Pattern Enforcement

### Patterns to Enforce

1. **Shared interfaces first**: Check `interfaces.md` before implementing. New types go there first.

2. **Two-path communication**: Frontend reads Supabase directly for data. Frontend POSTs to Go backend for commands that trigger AI processing. Go backend writes results to Supabase. Frontend reacts via real-time subscriptions.

3. **Component composition**: React components are small, composable. SceneModule contains EvidenceList + ViewportArea. BlueprintView3D contains Room + EvidenceMarkers + ActorFigures.

4. **Go service pattern**: Each domain (evidence, hypothesis, scan, profile) gets its own service struct. Services share Supabase client and Gemini client.

5. **Prompt templates**: Gemini prompts stored as Go templates in `backend/prompts/`, not inline strings.

6. **Marble 0.1-mini first**: Always use `Marble 0.1-mini` model for development and demo. Only switch to `0.1-plus` if quality is insufficient for the demo.

7. **Dark tactical theme**: All new UI follows glass panel system, JetBrains Mono labels, `// SYSTEM_STYLE` headers. See `design-guide.md`.

## Dispatching Parallel Work

When multiple independent tasks are available:

```
You: "Set up Supabase schema, scaffold Go backend, and draft Gemini prompts"

Claude Code dispatches:
- Agent 1: Supabase schema (runs SQL, creates buckets, enables real-time)
- Agent 2: Go backend scaffold (module init, router, Supabase client, health check)
- Agent 3: Gemini prompt templates (VLM + reasoning + blueprint)
All share types from interfaces.md
```

### After Major Milestone Review

After completing a major feature area:

```
You: "Review all evidence-related code"

Code Review Agent checks:
- Are Evidence/Witness types used consistently across Go + TS?
- Is credibility model implemented per data-model.md?
- Does frontend call Go backend for add/analyze, Supabase for reads?
- Are real-time subscriptions set up correctly?
- Are Marble assets (embed URL, mesh) stored and used properly?
```

## Continuous Quality Checklist

After every feature implementation, verify:

- [ ] Unit tests written and passing
- [ ] Shared types from interfaces.md used (no ad-hoc type definitions)
- [ ] Module boundaries respected (frontend reads Supabase, commands Go backend)
- [ ] Supabase real-time subscriptions for cross-module updates
- [ ] No duplicated code — check for shared utilities
- [ ] Component follows existing dark tactical theme patterns
- [ ] Go service follows existing struct pattern
- [ ] Gemini prompts in template files, not inline
- [ ] Marble calls use `Marble 0.1-mini` model
- [ ] CORS allows frontend origin
