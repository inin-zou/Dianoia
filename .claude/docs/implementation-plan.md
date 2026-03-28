# Implementation Plan

## Pre-Hackathon Preparation

These tasks MUST be done before the event to maximize the 6.5 hours of build time.

### 1. Lovable Scaffold
- Run the Lovable prompt from design-guide.md
- Export the React/TS project
- Verify it builds and runs locally
- Push to GitHub repo

### 2. Supabase Setup
- Create Supabase project
- Run all CREATE TABLE statements from data-model.md
- Create storage buckets: evidence-images, marble-exports, rendered-views, suspect-composites
- Enable real-time for all tables
- Get connection string and anon key
- Test basic CRUD from a script

### 3. Go Backend Init
```bash
mkdir backend && cd backend
go mod init dianoia
# Install dependencies:
# - chi or gin (HTTP router)
# - supabase-go or postgrest-go (Supabase client)
# - google/generative-ai-go (Gemini SDK)
```
- Set up directory structure from agentic-engineering.md
- Create basic health check endpoint
- Verify Supabase connection works
- Verify Gemini API key works

### 4. API Keys & Access
- [ ] Marble API key (World Labs)
- [ ] Gemini API key (Google AI Studio)
- [ ] Supabase project URL + anon key + service role key
- [ ] Store all in `.env` files (backend + frontend)

### 5. Pre-made 3D Assets
Create or download simple GLB/GLTF files:
- Human capsule figure (1.75m, parameterized color)
- Knife (0.3m)
- Body outline (1.8m x 0.5m, flat on ground)
- Blood marker (0.1m, red disc)
- Generic evidence marker (0.15m, yellow cone)
- Fingerprint marker (0.1m, purple disc)

Store in `frontend/public/assets/3d/`

### 6. Gemini Prompt Drafts
Draft and test these prompts:

**VLM Scene Analysis:**
```
Analyze this image of a room. Describe:
- Room dimensions (estimated in meters)
- Wall positions and orientations
- Door and window locations
- Major furniture items and their positions
- Any notable features

Output as structured JSON matching the BlueprintData schema.
```

**VLM Evidence Annotation:**
```
Analyze this image of evidence found at a crime scene.
Describe: what the object is, its condition, forensic significance,
and any observations about its positioning.
Output as JSON: {description, significance, relatedEvidence[], confidence}
```

**Reasoning Engine:**
```
You are a forensic analyst. Given the following evidence and witness statements
for a crime scene, generate ranked hypotheses for how the crime unfolded.

Room layout: {blueprint}
Evidence: {evidence_list_with_credibility}
Witness statements: {witness_list_with_credibility}

For each hypothesis, provide:
1. A title (one sentence)
2. Probability (0-1, all hypotheses must sum to 1)
3. Detailed reasoning
4. Supporting evidence IDs
5. Contradicting evidence IDs
6. A timeline of events as JSON array with: timestamp, actor, action, position {x,y,z}, description, evidence_refs[], confidence

Credibility rules:
- Physical evidence is the strongest basis for reasoning
- Multiple corroborating witnesses increase testimony credibility
- Contradictions between witnesses and physical evidence should favor physical evidence
- Consider witness position/angle when evaluating observation reliability

Generate 2-4 hypotheses, ranked by probability.
```

---

## Hackathon Day Build Order

### Hour 0-1.5: Foundation (11:00 - 12:30)

**Task F1: Frontend - Supabase Integration**
```
- Install @supabase/supabase-js
- Create lib/supabase.ts client
- Create useRealtimeTable hook
- Wire evidence list to real Supabase data
- Wire case loading
- Test: evidence shows up in sidebar when added to DB manually
```

**Task F2: Frontend - R3F Blueprint Viewer**
```
- Install @react-three/fiber, @react-three/drei
- Create BlueprintView3D component
- Create Room component (renders walls, floor, doors from BlueprintData)
- Add OrbitControls for camera
- Test with hardcoded room data
- Test: 3D room renders with walls and floor
```

**Task B1: Backend - REST API Skeleton**
```
- Set up HTTP router (chi or gin)
- Implement all CRUD endpoints from interfaces.md
- Wire to Supabase
- Test: POST evidence -> appears in Supabase
- Test: GET evidence -> returns list
```

**Task B2: Backend - Gemini VLM Integration**
```
- Set up Gemini client
- Implement AnalyzeImage method
- Create evidence annotation prompt template
- Wire to POST evidence endpoint (auto-annotate if image provided)
- Test: upload evidence image -> VLM annotation returned
```

**Task P1: Pipeline - Marble Scan**
```
- Implement Marble API client (create world, poll status, export)
- Test with pre-captured venue photos
- Store world ID and export URLs in Supabase
- Render multiple views for VLM consumption
- Test: photos in -> Marble world created -> mesh exported
```

### Hour 1.5-4: Core Features (12:30 - 15:00)

**Task F3: Frontend - Evidence Placement**
```
- Create EvidenceMarker component (3D asset at position)
- Load pre-made GLB assets based on assetType
- Create AddEvidenceForm with position picker (click on floor plane)
- Wire form submission to Go API
- Show VLM annotations on marker hover/click
- Test: click floor -> place evidence -> appears in 3D and sidebar
```

**Task F4: Frontend - Timeline Playback**
```
- Create ActorFigure component (capsule + sphere, colored by role)
- Create MovementPath component (dashed line on floor)
- Create TimelineScrubber component (range slider)
- Create PlaybackControls (play/pause/speed)
- Implement animation: interpolate actor positions based on timeline events and scrubber time
- Create HypothesisSelector to switch between hypothesis timelines
- Test: select hypothesis -> actors move through positions as scrubber advances
```

**Task B3: Backend - Reasoning Pipeline**
```
- Implement GenerateHypotheses method on Gemini client
- Build prompt from evidence list + witnesses + blueprint
- Parse structured JSON response into Hypothesis objects
- Write hypotheses to Supabase
- Create POST /api/cases/:id/analyze endpoint
- Test: trigger analysis -> hypotheses appear in DB with timelines
```

**Task B4: Backend - Blueprint Generation**
```
- Implement room description extraction (send rendered views to Gemini VLM)
- Implement blueprint generation (send description to Gemini LLM -> BlueprintData JSON)
- Wire to POST /api/cases/:id/blueprint endpoint
- Store blueprint in cases.blueprint_data
- Test: rendered views in -> BlueprintData JSON out -> frontend renders room
```

**Task P2: Pipeline - Venue Integration**
```
- Complete venue scan with Marble
- Generate and store rendered views
- Trigger blueprint generation
- Verify Marble iframe embed works in frontend
- Set up ViewportSwitcher to toggle between Blueprint 3D / Realistic 3D
- Test: both views working, blueprint matches venue layout
```

### Hour 4-5.5: Polish & Module 2 (15:00 - 16:30)

**Task F5: Frontend - Suspect Profiling**
```
- Wire profiling module to Go API
- Implement CompositeEditor: display current image, chat input for refinements
- Implement RevisionHistory: thumbnail strip of iterations
- Wire refinement submissions to POST /api/profiles/:id/refine
- Test: enter description -> composite appears -> refine -> new image with consistency
```

**Task F6: Frontend - Analysis Polish**
```
- Hypothesis comparison view with probability bars
- Credibility badges on evidence (color-coded)
- 2D SVG floor plan (if time permits)
- Supporting/contradicting evidence highlighted per hypothesis
- Test: switch hypotheses -> relevant evidence highlights change
```

**Task B5: Backend - NanoBanana Integration**
```
- Implement Gemini Image API client for NanoBanana
- Create profile from text description -> initial composite
- Refine profile (previous image + instruction -> new image)
- Store images in Supabase Storage
- Wire to profile API endpoints
- Test: description in -> composite out -> refinement maintains consistency
```

**Task B6: Backend - Progressive Evidence**
```
- Implement stage-based evidence retrieval (filter by stageOrder <= current stage)
- Auto-update credibility when contradictions detected
- Re-trigger reasoning when new evidence stage is added
- Test: add stage 2 evidence -> credibility shifts -> new hypotheses generated
```

**Task P3: Pipeline - Demo Data**
```
- Create murder case scenario in Supabase
- Stage 1: body + knife (physical evidence)
- Stage 2: witness 1 statement
- Stage 3: forensic report (contradicts witness)
- Stage 4: witness 2 (corroborates witness 1)
- Pre-generate hypotheses for each stage for backup
- Test: walk through all stages, verify reasoning makes sense
```

### Hour 5.5-6.5: Demo Prep (16:30 - 17:30)

**Task D1: Demo Flow**
```
- Load demo case
- Walk through all 4 evidence stages
- Verify timeline playback works for each hypothesis set
- Verify suspect profiling flow
- Time the demo (target: 3 minutes)
```

**Task D2: Backup**
```
- Screen record a successful demo run
- Take screenshots of key moments
- Prepare slides if needed
- Write submission description
```

**Task D3: Submit**
```
- Final git push
- Submit project by 17:30
- Deploy if required (Vercel for frontend, Railway/Fly.io for Go backend)
```

## Dependency Graph

```
Supabase Schema (pre-hackathon)
     |
     +---> F1 (Supabase integration) ---> F3 (Evidence placement) ---> F4 (Timeline)
     |                                                                      |
     +---> F2 (R3F setup) ---------> F3                                     +---> F6 (Polish)
     |                                                                      |
     +---> B1 (API skeleton) ---> B2 (VLM) ---> B3 (Reasoning) ---> B6 (Progressive)
     |                                              |
     +---> B4 (Blueprint gen) --------+             +---> F4 (Timeline needs hypotheses)
     |                                |
     +---> P1 (Marble scan) ---> P2 (Venue) ---> P3 (Demo data)
     |
     +---> B5 (NanoBanana) ---> F5 (Profiling UI)
```

## Critical Path

The demo depends on this chain completing:
```
Supabase -> B1 -> B3 (Reasoning) -> F4 (Timeline playback)
```

If this chain works, you have a demo. Everything else enhances it.
