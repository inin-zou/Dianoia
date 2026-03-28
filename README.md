# Dianoia

**The Reasoning Mind.** Open-Source Palantir for Crime Scene Investigation.

Named after the ancient Greek concept of *dianoia* -- discursive reasoning, the faculty of stepping through evidence logically to reach conclusions.

## What is Dianoia?

An AI-powered platform that reconstructs crime scenes in 3D, reasons about evidence with credibility weighting, generates ranked timeline hypotheses of how a crime unfolded, and enables iterative suspect profiling.

### Module 1: Crime Scene Reconstruction & Reasoning

- **3D Scene Scan** -- Scan a real space with Marble API, get a photorealistic 3D reconstruction
- **AI Blueprint Generation** -- VLM analyzes the scene, LLM generates a clean 3D blueprint space
- **Evidence Placement** -- Place physical evidence, forensic reports, and witness statements in the blueprint
- **Progressive Reasoning** -- Feed evidence in stages; Gemini generates ranked timeline hypotheses with credibility weighting
- **Timeline Playback** -- Scrub through time, watch suspect movement paths in 3D, compare hypotheses

### Module 2: Suspect Profiling

- **Composite Generation** -- Witness describes suspect, NanoBanana generates initial composite
- **Iterative Refinement** -- "Add a beard", "thinner face", "darker hair" -- each edit preserves face consistency
- **Profile Cards** -- Final composites saved to the case file

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React/TypeScript + React Three Fiber |
| 3D Scan | Marble API (World Labs) |
| Backend | Go |
| Database | Supabase (Postgres + Realtime + Storage) |
| AI Reasoning | Gemini |
| Image Generation | NanoBanana (Gemini Image) |

## Architecture

Decoupled modules communicating via Supabase real-time:

```
Frontend (React/R3F) <---> Supabase <---> Go Backend (Gemini orchestration)
                              ^
                              |
                       Marble Pipeline
```

## Documentation

Full design docs in [`.claude/docs/overview.md`](.claude/docs/overview.md).

## License

MIT
