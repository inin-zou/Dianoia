# Implementation Plan

## Pre-Hackathon Status

| Task | Status | Notes |
|------|--------|-------|
| Lovable scaffold | DONE | Exported, restyled to dark tactical theme |
| Landing page | DONE | Three.js wireframe animation, system menu, routes to /app |
| Design system | DONE | Glass panels, JetBrains Mono, haze background, grid overlays |
| API keys | DONE | Supabase, Gemini, Marble — stored in `.env` |
| Frontend deps | DONE | React 18, R3F v8, Three.js r183, shadcn/ui, Tailwind |
| Supabase schema | TODO | Run CREATE TABLE from data-model.md |
| Go backend init | TODO | Module init, directory structure, Supabase client |
| Gemini prompt drafts | TODO | VLM annotation, reasoning, blueprint generation |
| Marble API test | TODO | Verify scan pipeline works |
| NanoBanana test | TODO | Verify image generation works |
| 3D assets | TODO | GLB files for evidence markers |

## Frontend-Backend Wiring Plan

### Step 1: Create shared client libraries (FIRST)

```
frontend/src/lib/supabase.ts   -- Supabase client (reads + real-time)
frontend/src/lib/api.ts        -- Go backend HTTP client (commands)
frontend/src/types/index.ts    -- TypeScript types from interfaces.md
```

### Step 2: Replace mock data with Supabase queries

Each module currently uses `mockData.ts`. Replace with:

| Module | Data Source | Real-time? |
|--------|------------|------------|
| SceneModule evidence list | `supabase.from('evidence').select()` | Yes — subscribe to INSERTs/UPDATEs |
| AnalysisModule hypotheses | `supabase.from('hypotheses').select()` | Yes — new hypotheses after analysis |
| TimelineModule actors | Derived from hypotheses timeline JSON | Yes — updates when hypotheses change |
| ProfilingModule profiles | `supabase.from('suspect_profiles').select()` | Yes — image URL updates |
| BottomBar hypotheses | Same as AnalysisModule | Yes |

### Step 3: Wire command actions to Go backend

| User Action | Frontend Call | Go Endpoint |
|-------------|-------------|-------------|
| Add evidence | `apiPost('/api/cases/:id/evidence', {...})` | POST creates row + triggers VLM |
| Trigger analysis | `apiPost('/api/cases/:id/analyze', {upToStage})` | POST runs Gemini reasoning |
| Upload scan | `apiPost('/api/cases/:id/scan', formData)` | POST triggers Marble pipeline |
| Create profile | `apiPost('/api/cases/:id/profiles', {description})` | POST generates composite |
| Refine profile | `apiPost('/api/profiles/:id/refine', {instruction})` | POST generates new image |

### Step 4: Real-time subscriptions

```typescript
// In each module component or a shared hook:
useEffect(() => {
  const channel = supabase
    .channel('evidence-changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'evidence',
      filter: `case_id=eq.${caseId}`,
    }, (payload) => {
      // Update local state with new/changed evidence
    })
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}, [caseId]);
```

## Supabase Setup

### Tables (run from data-model.md)
```sql
-- Run all 6 CREATE TABLE statements
-- cases, evidence, witnesses, hypotheses, suspect_profiles, marble_scans
```

### Storage Buckets
```
evidence-images/
marble-exports/
rendered-views/
suspect-composites/
```

### Enable Real-time
Enable real-time for: `evidence`, `hypotheses`, `suspect_profiles`, `marble_scans`

## Go Backend Init

```bash
mkdir backend && cd backend
go mod init dianoia
# Dependencies:
#   github.com/go-chi/chi/v5           -- HTTP router
#   github.com/go-chi/cors             -- CORS middleware
#   github.com/google/generative-ai-go -- Gemini SDK
#   github.com/supabase-community/supabase-go -- Supabase client
#   github.com/joho/godotenv           -- env loading
```

### Directory Structure
```
backend/
  cmd/server/main.go         -- entry point, router setup, CORS
  internal/
    api/
      cases.go               -- case CRUD handlers
      evidence.go             -- evidence handlers
      witnesses.go            -- witness handlers
      analysis.go             -- analyze endpoint
      scan.go                 -- marble scan handlers
      profiles.go             -- suspect profile handlers
    service/
      evidence.go             -- evidence business logic + VLM trigger
      reasoning.go            -- hypothesis generation pipeline
      profiling.go            -- NanoBanana orchestration
      blueprint.go            -- VLM → room desc → blueprint JSON
    gemini/
      client.go               -- Gemini API wrapper
      vlm.go                  -- vision analysis methods
      reasoning.go            -- hypothesis generation methods
      image.go                -- NanoBanana/image generation
    marble/
      client.go               -- Marble API wrapper
    supabase/
      client.go               -- Supabase client wrapper
    types/
      types.go                -- Go types mirroring interfaces.md
  prompts/
    vlm_scene.tmpl            -- room description prompt
    vlm_evidence.tmpl         -- evidence annotation prompt
    reasoning.tmpl            -- hypothesis generation prompt
    blueprint.tmpl            -- blueprint JSON generation prompt
```

## Gemini Prompt Templates

### VLM Scene Analysis
```
Analyze this image of a room. Describe:
- Room dimensions (estimated in meters)
- Wall positions and orientations
- Door and window locations
- Major furniture items and their positions

Output as structured JSON matching the BlueprintData schema.
```

### VLM Evidence Annotation
```
Analyze this image of evidence found at a crime scene.
Describe: what the object is, its condition, forensic significance,
and any observations about its positioning.
Output as JSON: {description, significance, relatedEvidence[], confidence}
```

### Reasoning Engine
```
You are a forensic analyst. Given the following evidence and witness statements
for a crime scene, generate ranked hypotheses for how the crime unfolded.

Room layout: {{.Blueprint}}
Evidence: {{.EvidenceJSON}}
Witness statements: {{.WitnessJSON}}

For each hypothesis, provide:
1. Title (one sentence)
2. Probability (0-1, all must sum to 1)
3. Detailed reasoning
4. Supporting evidence IDs
5. Contradicting evidence IDs
6. Timeline events as JSON array

Generate 2-4 hypotheses, ranked by probability.
Output as JSON array of Hypothesis objects.
```

---

## Hackathon Day Build Order

### Hour 0-1.5: Foundation (11:00 - 12:30)

**F1: Supabase Integration**
- Install `@supabase/supabase-js`, create `lib/supabase.ts`
- Create `lib/api.ts` for Go backend calls
- Create `useRealtimeTable` hook
- Wire evidence list to Supabase (replace mockData imports)

**F2: R3F Blueprint Viewer**
- Create `BlueprintView3D` component in R3F Canvas
- Create `Room` component (renders walls/floor from BlueprintData)
- Add OrbitControls, test with hardcoded room

**B1: Go REST API Skeleton**
- Set up chi router + CORS middleware
- Implement all CRUD endpoints from interfaces.md
- Wire to Supabase via service_role key

**B2: Gemini VLM Integration**
- Set up Gemini client with prompt templates
- Implement evidence auto-annotation on POST
- Test: upload image → VLM annotation returned

**P1: Marble Scan Pipeline**
- Implement Marble API client
- Test scan with sample images
- Store results in Supabase

### Hour 1.5-4: Core Features (12:30 - 15:00)

**F3: Evidence Placement in 3D**
- EvidenceMarker component, GLB asset loading
- Click floor to set position, wire to Go backend POST
- Show VLM annotations on hover

**F4: Timeline Playback**
- ActorFigure + MovementPath components
- Animation: interpolate positions from hypothesis timeline
- HypothesisSelector to switch timelines

**B3: Reasoning Pipeline**
- GenerateHypotheses from evidence + witnesses + blueprint
- Parse Gemini JSON → Hypothesis objects → write to Supabase

**B4: Blueprint Generation**
- Rendered views → Gemini VLM → room description
- Room description → Gemini LLM → BlueprintData JSON

### Hour 4-5.5: Polish & Module 2 (15:00 - 16:30)

**F5: Suspect Profiling** — Wire chat to Go backend refine endpoint
**F6: Analysis Polish** — Credibility badges, hypothesis comparison
**B5: NanoBanana Integration** — Profile generation + refinement
**B6: Progressive Evidence** — Stage-based retrieval, auto re-analysis

### Hour 5.5-6.5: Demo Prep (16:30 - 17:30)

Load demo data, rehearse 3-min demo, record backup video, submit.

## Dependency Graph

```
Supabase Schema (pre-hackathon)
     |
     +→ F1 (Supabase + API client) → F3 (Evidence 3D) → F4 (Timeline)
     |                                                         |
     +→ F2 (R3F setup) → F3                                   +→ F6 (Polish)
     |
     +→ B1 (API skeleton) → B2 (VLM) → B3 (Reasoning) → B6 (Progressive)
     |                                       |
     +→ B4 (Blueprint gen)                   +→ F4 (needs hypotheses)
     |
     +→ P1 (Marble scan) → P2 (Venue) → P3 (Demo data)
     |
     +→ B5 (NanoBanana) → F5 (Profiling UI)
```

## Critical Path

```
Supabase → B1 (API) → B3 (Reasoning) → F4 (Timeline playback)
```

If this chain works, we have a demo. Everything else enhances it.
