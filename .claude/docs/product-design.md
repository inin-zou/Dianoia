# Product Design: Dianoia

## Vision

Open-Source Palantir for crime scene investigation. An AI-powered platform that reconstructs crime scenes in 3D, reasons about evidence with credibility weighting, generates ranked timeline hypotheses, and enables iterative suspect profiling.

## User Personas

### Primary: Detective / Investigator
- Arrives at crime scene, uses phone to scan the environment
- Needs to reconstruct what happened from physical evidence + witness statements
- Wants AI to help "think like Sherlock" -- surface non-obvious connections

### Secondary: Analyst
- Back at the station reviewing evidence that's already been collected
- Pieces together timelines, compares hypotheses, identifies contradictions
- Needs to see the full picture evolve as evidence layers in

## Demo Scenario: Murder Case Walkthrough

A staged murder case at the hackathon venue. Progressive evidence reveal:

1. **Scene scan** -- venue scanned with Marble, reconstructed in 3D
2. **Body discovered** -- evidence placed in blueprint space (body position, blood)
3. **Weapon found** -- knife placed, VLM annotates distance/angle from body
4. **First witness** -- "I heard shouting at 11pm from the east corridor"
5. **Forensic report** -- blood spatter angle contradicts witness position
6. **Second witness** -- corroborates shouting, but adds "saw someone running"
7. **System reveals** -- credibility shifts, timeline hypotheses re-rank

## Two Main Modules

### Module 1: Crime Scene Reconstruction & Reasoning Engine

**Subflows:**

1. **Scene Capture & 3D Reconstruction**
   - User scans real space with phone camera/video
   - Marble API generates realistic 3D world
   - Marble iframe embed shows realistic view for reference

2. **Blueprint Space Generation**
   - VLM (Gemini) analyzes rendered views of Marble scene
   - Describes room layout: walls, doors, windows, dimensions, key furniture
   - LLM generates 3D blueprint (Three.js scene via R3F) from description
   - Clean geometric space: box walls, flat floors, 1 unit = 1 meter

3. **Evidence Placement**
   - Evidence placed in 3D blueprint space with coordinates
   - Pre-made 3D assets for common evidence types (weapon, body outline, blood markers)
   - Assets normalized to real-world scale (knife = 0.3m, human = 1.75m)
   - VLM can suggest evidence placement based on scene analysis

4. **Progressive Reasoning**
   - Evidence fed in stages (physical first, then witnesses, then forensics)
   - After each stage, Gemini produces ranked timeline hypotheses
   - Each hypothesis includes:
     - Probability score
     - Supporting evidence with credibility weights
     - Contradictions flagged
     - Suspect movement path (sequence of coordinates + timestamps)
   - Credibility model:
     - Physical evidence: highest default credibility
     - Multiple witness corroboration: increases credibility
     - Contradiction with physical evidence: decreases witness credibility
     - Witness perspective/angle considered for reliability

5. **Timeline Playback**
   - Track-based system (inspired by Criminator / video editing)
   - One track per person/suspect
   - Time slots with start/end times and positions
   - Color-coded humanoid figures move through blueprint space
   - Timeline scrubber to replay/pause/rewind
   - Multiple hypotheses viewable -- switch between ranked timelines
   - 3D blueprint view (primary, detailed) + 2D SVG floor plan (analytical companion)

### Module 2: Suspect Profiling

- Separate module/tab from crime scene reconstruction
- NanoBanana (Gemini Flash 2.5 Image) as the engine
- Witness describes suspect verbally or via structured input
- System generates initial composite image
- Iterative refinement through conversation:
  - "Add a beard"
  - "Make the face thinner"
  - "Darker hair"
  - "Add glasses"
- Each iteration builds on the previous image (95% face consistency)
- Produces a "suspect profile card" for the case file
- Up to 14 reference images for compositing

## User Flow: Complete Demo

```
Scan Venue -> Marble 3D -> VLM Blueprint -> Place Evidence
     |                                          |
     v                                          v
Realistic 3D View (iframe)          Blueprint Space (R3F)
                                          |
                                          v
                              Add Evidence Stage by Stage
                                          |
                                          v
                              Gemini Reasoning (per stage)
                                          |
                                          v
                              Ranked Timeline Hypotheses
                                          |
                                          v
                              Timeline Playback in Blueprint
                                          |
                                          v
                              Suspect Profiling (NanoBanana)
                                          |
                                          v
                              Complete Case Report
```

## Key Design Principles

1. **AI leads, human validates** -- LLM generates timelines, user reviews and adjusts
2. **Progressive revelation** -- evidence layers in, picture evolves, audience sees reasoning unfold
3. **Dual-space visualization** -- realistic 3D for immersion, blueprint for analysis
4. **Credibility as first-class concept** -- every piece of evidence has a weight, weights shift dynamically
5. **Accessibility** -- web-based, no VR headset required (unlike Criminator)
