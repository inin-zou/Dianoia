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

## Module Boundaries

### Frontend (React/TS)
**Owns:** All rendering, user interaction, 3D visualization, UI state
**Reads from Supabase:** Cases, evidence, hypotheses, suspect profiles, blueprint data
**Writes to Supabase:** User actions (add evidence, trigger analysis, adjust timeline)
**Does NOT:** Call Gemini directly, process Marble exports, run reasoning

Key Libraries:
- React Three Fiber (R3F) + Drei -- 3D blueprint view, timeline playback
- Supabase JS client -- real-time subscriptions, CRUD
- Marble iframe embed -- realistic 3D view
- React state management (Zustand or context) -- local UI state

### Go Backend
**Owns:** Business logic, Gemini API orchestration, reasoning pipeline, evidence processing
**Reads from Supabase:** Evidence submissions, analysis triggers
**Writes to Supabase:** Hypotheses, timeline data, VLM annotations, credibility scores
**Listens:** Supabase real-time or polling for new evidence/triggers

Key Responsibilities:
- Gemini VLM calls (scene analysis, evidence annotation)
- Gemini LLM calls (reasoning engine, timeline generation)
- Evidence credibility computation (future: Bayesian validation)
- NanoBanana/Gemini Image API calls for suspect profiling
- Blueprint generation orchestration (VLM -> room description -> LLM -> scene JSON)

### Marble Pipeline
**Owns:** 3D scanning workflow, Marble API interaction, export management
**Writes to Supabase:** Marble world IDs, exported mesh URLs, rendered view images
**Can be:** A separate Go service, a script, or part of the Go backend

Key Responsibilities:
- Trigger Marble world generation from uploaded photos/video
- Poll for completion, store world ID
- Export collider mesh / Gaussian splat
- Render multiple views (top-down, front, sides) for VLM consumption
- Store exported assets in Supabase Storage

## Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend Framework | React + TypeScript | Lovable outputs React/TS |
| 3D Rendering | React Three Fiber + Drei | Native React integration, declarative 3D |
| Realistic 3D | Marble API iframe embed | Zero rendering effort |
| UI Scaffolding | Lovable | Fast bootstrap of all non-3D UI |
| Backend | Go | Concurrency for parallel Gemini calls, future simulation engine |
| Database | Supabase (Postgres) | Real-time subscriptions, auth, storage built-in |
| Real-time | Supabase Realtime | No custom WebSocket needed |
| File Storage | Supabase Storage | Evidence photos, Marble exports, suspect composites |
| VLM | Gemini (vision) | Scene analysis, evidence annotation |
| Reasoning LLM | Gemini Pro | Crime timeline reasoning, hypothesis generation |
| Image Generation | NanoBanana (Gemini Flash 2.5 Image) | Iterative suspect composite editing |
| 3D Scan | Marble API (World Labs) | Realistic spatial reconstruction |

## Data Flow: Evidence to Timeline

```
1. Evidence Added (frontend -> Supabase)
         |
2. Go backend detects new evidence (Supabase listener)
         |
3. If physical evidence with image:
   -> Gemini VLM annotates (what is it, condition, position significance)
   -> Annotations stored in Supabase
         |
4. Go collects ALL case evidence + credibility weights
         |
5. Go calls Gemini reasoning:
   - Input: evidence list, credibility scores, room blueprint, existing hypotheses
   - Output: ranked timeline hypotheses (JSON)
         |
6. Go writes hypotheses to Supabase
         |
7. Frontend receives real-time update
   -> Renders new/updated timelines in blueprint view
   -> Updates probability rankings
   -> Highlights contradictions
```

## Data Flow: Scene Scan to Blueprint

```
1. User uploads photos/video (frontend -> Supabase Storage)
         |
2. Marble Pipeline:
   a. Calls Marble API with images -> generates 3D world
   b. Stores world ID in Supabase (for iframe embed)
   c. Exports collider mesh
   d. Renders multiple views of the scene
         |
3. Go backend:
   a. Sends rendered views to Gemini VLM
   b. VLM describes room: dimensions, walls, doors, furniture positions
   c. Structured room description (JSON) stored in Supabase
         |
4. Go backend:
   a. Sends room description to Gemini LLM
   b. LLM generates 3D blueprint scene definition (JSON/Three.js compatible)
   c. Blueprint data stored in Supabase
         |
5. Frontend:
   a. Loads blueprint data
   b. Renders 3D blueprint in R3F (box walls, flat floors, geometric furniture)
   c. Also generates 2D SVG floor plan from same data
   d. Marble iframe shows realistic 3D alongside
```

## Data Flow: Suspect Profiling

```
1. User initiates suspect profile (frontend)
         |
2. Witness description input (text: "male, 30s, short dark hair, thin face")
         |
3. Go backend calls NanoBanana/Gemini Image
   -> Generates initial composite
   -> Stores image in Supabase Storage
         |
4. Frontend displays composite
         |
5. User requests refinement ("add beard", "wider nose")
         |
6. Go backend calls NanoBanana with previous image + edit instruction
   -> New composite generated (maintains face consistency)
   -> Stored in Supabase Storage
         |
7. Repeat until user confirms
   -> Final composite saved as suspect profile card
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
- Single scale factor stored per case maps Marble space <-> blueprint space

## API Communication Pattern

Frontend <-> Go Backend: REST API for commands (trigger analysis, add evidence)
Go Backend -> Frontend: Supabase real-time (hypothesis updates, VLM annotations)
Marble Pipeline -> System: Writes to Supabase, other modules react via real-time

This means Go backend needs REST endpoints, but push updates go through Supabase -- no custom WebSocket implementation needed.
