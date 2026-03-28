# Architecture

## System Overview

Decoupled module architecture communicating via Supabase (shared DB + real-time subscriptions). Three independent modules enable 3-5 person team to work in parallel from day one.

```
+-------------------+       +-------------------+       +-------------------+
|    Frontend       |       |    Go Backend     |       |  Marble Pipeline  |
|  React/TS + R3F   |       |   API + Orchestr  |       |  Scan + Export    |
|  (Lovable start)  |       |   Gemini Calls    |       |  VLM Blueprint    |
+--------+----------+       +--------+----------+       +--------+----------+
         |                           |                           |
         |     Supabase Real-time    |                           |
         +----------+----------------+---------------------------+
                    |
         +----------+----------+
         |      Supabase       |
         |  Postgres + Realtime|
         |  + Storage + Auth   |
         +---------------------+
```

## Frontend-Backend Communication Strategy

### Two Communication Paths

**Path 1: Frontend → Go Backend (REST API)**
For *commands* that trigger work — adding evidence, requesting analysis, uploading scans, refining profiles.

```
Frontend --HTTP POST--> Go Backend :8080/api/...
                              |
                        (processes, calls Gemini, etc.)
                              |
                        Writes results to Supabase
```

**Path 2: Supabase → Frontend (Real-time Subscriptions)**
For *data updates* — new hypotheses, VLM annotations completing, scan status changes.

```
Go Backend writes to Supabase
         |
Supabase Realtime pushes to Frontend
         |
Frontend re-renders with new data
```

### Why This Split

- Frontend NEVER calls Gemini/Marble/NanoBanana directly
- Go backend is the single orchestrator for all AI/external APIs
- Supabase is the shared state — both sides read/write to the same tables
- Real-time subscriptions mean the frontend auto-updates without polling

### Connection Config

```
Frontend .env:
  VITE_SUPABASE_URL=https://wxafzdetynntbntiywtq.supabase.co
  VITE_SUPABASE_ANON_KEY=...
  VITE_API_URL=http://localhost:8080   (Go backend)

Backend .env:
  SUPABASE_URL=https://wxafzdetynntbntiywtq.supabase.co
  SUPABASE_SERVICE_ROLE_KEY=...
  GEMINI_API_KEY=...
  MARBLE_API_KEY=...
```

Frontend uses the **anon key** (row-level security, read-heavy).
Backend uses the **service_role key** (full access, write-heavy).

### Frontend HTTP Client Pattern

```typescript
// frontend/src/lib/api.ts
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
```

### Frontend Supabase Client Pattern

```typescript
// frontend/src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

### Which Path for Each Operation

| Operation | Path | Why |
|-----------|------|-----|
| Load case data | Supabase direct query | Read-only, frontend has anon key |
| List evidence | Supabase direct query | Read-only |
| Add evidence | REST POST → Go backend | Backend auto-annotates with VLM |
| Update evidence position | Supabase direct update | Simple field update, no processing needed |
| Trigger analysis | REST POST → Go backend | Backend calls Gemini reasoning |
| Get hypotheses | Supabase direct query + real-time | Read-only, auto-updates via subscription |
| Upload scan images | REST POST → Go backend | Backend orchestrates Marble pipeline |
| Check scan status | Supabase real-time subscription | Status field updates pushed automatically |
| Create suspect profile | REST POST → Go backend | Backend calls NanoBanana |
| Refine profile | REST POST → Go backend | Backend calls NanoBanana with previous image |
| Load profile data | Supabase direct query | Read-only |

### CORS Configuration (Go Backend)

The Go backend must allow requests from the frontend dev server:

```go
// Allow frontend origins
allowedOrigins := []string{
    "http://localhost:5173",  // Vite dev
    "http://localhost:4173",  // Vite preview
}
```

## Module Boundaries

### Frontend (React/TS)
**Owns:** All rendering, user interaction, 3D visualization, UI state
**Reads from Supabase:** Cases, evidence, hypotheses, suspect profiles, blueprint data
**Writes to Supabase:** Simple field updates (evidence position, UI preferences)
**Calls Go Backend:** Commands that need AI processing (add evidence, analyze, generate profile)
**Does NOT:** Call Gemini directly, process Marble exports, run reasoning

Key Libraries:
- React Three Fiber v8 (R3F) + Drei — 3D blueprint view, timeline playback
- Supabase JS client — real-time subscriptions, direct reads
- Three.js r183 — 3D rendering engine
- Marble iframe embed — realistic 3D view
- Zustand or React context — local UI state
- Tailwind + shadcn/ui — styling (dark tactical theme)
- JetBrains Mono + Inter — typography

### Go Backend
**Owns:** Business logic, Gemini API orchestration, reasoning pipeline, evidence processing
**Reads from Supabase:** Evidence submissions, analysis triggers
**Writes to Supabase:** Hypotheses, timeline data, VLM annotations, credibility scores, profile images
**Exposes:** REST API on :8080 for frontend commands

Key Responsibilities:
- Gemini VLM calls (scene analysis, evidence annotation)
- Gemini LLM calls (reasoning engine, timeline generation)
- Evidence credibility computation (future: Bayesian validation)
- NanoBanana/Gemini Image API calls for suspect profiling
- Blueprint generation orchestration (VLM → room description → LLM → scene JSON)

### Marble Pipeline
**Owns:** 3D scanning workflow, Marble API interaction, export management
**Writes to Supabase:** Marble world IDs, exported mesh URLs, rendered view images
**Can be:** Part of the Go backend (single service for hackathon simplicity)

## Tech Stack

| Layer | Technology | Version/Notes |
|-------|-----------|---------------|
| Frontend Framework | React + TypeScript | React 18, Vite 5 |
| 3D Rendering | React Three Fiber + Drei | R3F v8 (React 18 compatible) |
| 3D Engine | Three.js | r183 |
| Realistic 3D | Marble API iframe embed | Zero rendering effort |
| UI Framework | Tailwind CSS + shadcn/ui | Dark tactical theme |
| Typography | JetBrains Mono + Inter | Mono for system labels, Inter for body |
| Backend | Go | Concurrency for parallel Gemini calls |
| Database | Supabase (Postgres) | Real-time subscriptions, auth, storage |
| Real-time | Supabase Realtime | No custom WebSocket needed |
| File Storage | Supabase Storage | Evidence photos, Marble exports, composites |
| VLM | Gemini (vision) | Scene analysis, evidence annotation |
| Reasoning LLM | Gemini Pro | Crime timeline reasoning, hypothesis generation |
| Image Generation | NanoBanana (Gemini Flash 2.5 Image) | Iterative suspect composite editing |
| 3D Scan | Marble API (World Labs) | Realistic spatial reconstruction |

## Data Flow: Evidence to Timeline

```
1. User clicks "Add Evidence" in frontend
         |
2. Frontend POSTs to Go backend: POST /api/cases/:id/evidence
         |
3. Go backend saves evidence to Supabase
         |
4. If evidence has image:
   → Go calls Gemini VLM for annotation
   → Updates evidence row with vlm_annotation
         |
5. Frontend receives real-time update (evidence row changed)
   → Shows VLM annotation on evidence card
         |
6. User clicks "Analyze" in frontend
         |
7. Frontend POSTs to Go backend: POST /api/cases/:id/analyze
         |
8. Go collects ALL evidence + witnesses + blueprint from Supabase
         |
9. Go calls Gemini reasoning:
   Input: evidence list, credibility scores, blueprint, existing hypotheses
   Output: ranked timeline hypotheses (JSON)
         |
10. Go writes hypotheses to Supabase
         |
11. Frontend receives real-time update (new hypotheses rows)
    → Renders timeline, updates rankings, highlights contradictions
```

## Data Flow: Scene Scan to Blueprint

```
1. User uploads photos (frontend → Go backend: POST /api/cases/:id/scan)
         |
2. Go backend:
   a. Stores images in Supabase Storage
   b. Calls Marble API with images → generates 3D world
   c. Writes world ID + status to marble_scans table
         |
3. Frontend gets real-time update → shows "Processing" status
         |
4. Go backend (polls Marble):
   a. World ready → exports mesh, renders views
   b. Sends views to Gemini VLM → room description
   c. Sends description to Gemini LLM → BlueprintData JSON
   d. Updates cases.blueprint_data + marble_scans.embed_url
         |
5. Frontend receives updates:
   a. Renders 3D blueprint in R3F
   b. Shows Marble iframe in "Realistic 3D" view
```

## Data Flow: Suspect Profiling

```
1. User enters description in profiling chat (frontend)
         |
2. Frontend POSTs to Go backend: POST /api/cases/:id/profiles
         |
3. Go calls NanoBanana/Gemini Image → composite image
   → Stores image in Supabase Storage
   → Writes profile to suspect_profiles table
         |
4. Frontend receives real-time update → displays composite
         |
5. User types refinement ("add beard") → POST /api/profiles/:id/refine
         |
6. Go calls NanoBanana with previous image + instruction
   → New image stored, revision_history updated
         |
7. Frontend receives update → displays new composite
```

## Scale Normalization

Marble meshes use arbitrary units. Blueprint space uses 1 unit = 1 meter.

- VLM estimates real-world dimensions when describing the room
- Blueprint generated at real-world scale
- Pre-made 3D assets authored at real-world scale:
  - Human figure: 1.75m tall
  - Knife: 0.3m
  - Evidence marker: 0.15m
  - Body outline: 1.8m x 0.5m
- Single scale factor stored per case maps Marble space ↔ blueprint space
