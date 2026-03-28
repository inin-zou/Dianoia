# Roadmap

## Hackathon Schedule

**Event Date:** One-day format
**Submission Deadline:** 17:30
**Live Demos:** 18:30
**Award Ceremony:** 19:00

```
10:00  Doors Open & Networking
10:45  Opening & Matchmaking
~11:00 START BUILDING (approx 6.5 hours of build time)
12:30  Lunch (keep working)
17:30  Submission Deadline & Dinner
18:30  Live Demos
19:00  Award Ceremony
```

**Effective build time: ~6.5 hours** (11:00 - 17:30, minus lunch overlap)

This is tight. Prioritization is everything.

## Phase Breakdown

### Phase 0: Pre-Hackathon (Before Event Day)
**Do as much as possible before 10:00**

- [ ] Lovable: Run the Lovable prompt, export the scaffolded frontend
- [ ] Supabase: Set up project, create all tables from data-model.md
- [ ] Go: Init project, set up directory structure, Supabase client
- [ ] Marble: Get API key, test scan pipeline with a sample image
- [ ] NanoBanana: Test Gemini Image API with a sample composite
- [ ] Pre-scan: If possible, scan the venue or a similar room in advance
- [ ] 3D assets: Prepare pre-made evidence assets (knife, body outline, blood markers, human capsules)
- [ ] Gemini prompts: Draft initial prompt templates for VLM annotation and reasoning
- [ ] Team: Assign roles (frontend x2, backend x1-2, pipeline x1)

### Phase 1: Foundation (11:00 - 12:30, ~1.5 hrs)
**Goal: All modules connected, data flowing**

| Person | Task |
|--------|------|
| Frontend 1 | Wire Lovable export to Supabase, real-time subscriptions working |
| Frontend 2 | Set up R3F canvas, render a basic room from hardcoded BlueprintData |
| Backend 1 | Go REST API skeleton, all CRUD endpoints for evidence + witnesses |
| Backend 2 | Gemini VLM integration -- evidence image analysis working |
| Pipeline | Marble scan -> export -> render views pipeline working |

**Milestone check:** Can add evidence via UI, see it in Supabase, basic 3D room renders.

### Phase 2: Core Features (12:30 - 15:00, ~2.5 hrs)
**Goal: The "wow" demo path works end-to-end**

| Person | Task |
|--------|------|
| Frontend 1 | Evidence placement in 3D blueprint, marker rendering, side panel wired |
| Frontend 2 | Timeline playback: actor figures, movement paths, scrubber controls |
| Backend 1 | Gemini reasoning pipeline: evidence -> hypotheses with ranked timelines |
| Backend 2 | Blueprint generation: VLM room description -> LLM blueprint JSON |
| Pipeline | Venue scan complete, blueprint generated, Marble iframe embed working |

**Milestone check:** Full flow: evidence in -> reasoning -> timeline playback in 3D.

### Phase 3: Polish & Second Module (15:00 - 16:30, ~1.5 hrs)
**Goal: Suspect profiling working, progressive evidence demo refined**

| Person | Task |
|--------|------|
| Frontend 1 | Suspect profiling UI wired to NanoBanana, iterative editing working |
| Frontend 2 | Hypothesis comparison view, credibility badges, 2D floor plan SVG |
| Backend 1 | NanoBanana integration for suspect composite generation |
| Backend 2 | Progressive evidence staging, credibility score updates |
| Pipeline | Pre-load demo scenario data (murder case with staged evidence) |

**Milestone check:** Both modules functional. Demo scenario data loaded.

### Phase 4: Demo Prep (16:30 - 17:30, ~1 hr)
**Goal: Demo is rehearsed, submission ready**

- [ ] Load demo murder case scenario into Supabase
- [ ] Pre-scan venue is loaded with Marble iframe + blueprint
- [ ] Walk through the progressive evidence reveal (stages 1-7 from product-design.md)
- [ ] Test suspect profiling flow with live NanoBanana calls
- [ ] Record backup video in case live demo fails
- [ ] Prepare 3-minute demo script
- [ ] Submit project by 17:30

## MVP vs Nice-to-Have

### MVP (Must ship at hackathon)

| Feature | Priority |
|---------|----------|
| Marble 3D scan + iframe embed | P0 |
| 3D blueprint space with room geometry | P0 |
| Evidence placement in blueprint | P0 |
| Gemini reasoning -> ranked hypotheses | P0 |
| Timeline playback with actor movement | P0 |
| Progressive evidence reveal (staged) | P0 |
| Suspect profiling with NanoBanana | P0 |
| Basic credibility scoring | P0 |

### Nice-to-Have (if time permits)

| Feature | Priority |
|---------|----------|
| 2D SVG floor plan view | P1 |
| Evidence relationship graph visualization | P1 |
| Live venue scan during demo | P1 |
| Multiple hypothesis side-by-side comparison | P1 |
| Witness credibility auto-adjustment on contradiction | P2 |
| Case export/report generation | P2 |
| Multiple case management | P3 |
| User auth | P3 |

### Post-Hackathon (Production Roadmap)

| Feature | Description |
|---------|-------------|
| Go math validation | Bayesian credibility engine, physical constraint validation |
| Multi-user collaboration | Real-time multi-investigator on same case |
| Advanced VLM | Blood spatter analysis, trajectory modeling, distance estimation |
| Evidence chain of custody | Timestamped evidence logging with immutable audit trail |
| Report generation | Auto-generated PDF case reports with evidence, reasoning, timelines |
| Mobile scanning app | Dedicated iOS/Android app for guided scene scanning |
| VR mode | Optional VR viewing of 3D blueprint (like Criminator) |
| Integration APIs | Connect to police databases, forensic lab systems |
| Self-hosted option | On-premise deployment for sensitive case data |

## Demo Script (3 minutes)

**Intro (30s):**
"Dianoia is an open-source Palantir for crime scene investigation. We combine 3D scene reconstruction, AI-powered evidence reasoning, and iterative suspect profiling."

**Scene Scan (30s):**
"We scanned this venue using Marble. Here's the realistic 3D reconstruction. And here's our AI-generated blueprint space -- clean geometry optimized for investigation."

**Evidence Reveal - Stage 1 (30s):**
"A body is found. A knife nearby. Our VLM automatically annotates the evidence. With just physical evidence, Gemini generates 3 possible timelines for how this happened."

**Evidence Reveal - Stage 2 (30s):**
"A witness comes forward -- heard shouting at 11pm. Watch how our hypothesis rankings shift. Timeline 2 gains probability."

**Evidence Reveal - Stage 3 (30s):**
"But forensics shows the blood spatter angle contradicts where the witness claims to have been. Witness credibility drops. Timeline 1 resurfaces. Watch the 3D playback update."

**Suspect Profiling (20s):**
"Meanwhile, another witness describes the suspect. We generate a composite with NanoBanana, then iteratively refine -- add a beard, thinner face, darker hair."

**Closing (10s):**
"Dianoia: Think like Sherlock, powered by AI. Open source. Built in 6 hours."
