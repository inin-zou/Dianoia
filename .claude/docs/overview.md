# Dianoia - Documentation Overview

Open-Source Palantir for Crime Scene Investigation. *The Reasoning Mind.*

AI-powered platform combining 3D crime scene reconstruction, evidence reasoning with credibility weighting, timeline hypothesis generation, and iterative suspect profiling.

## Documents

| Doc | Description |
|-----|-------------|
| [Product Design](./product-design.md) | Vision, user personas, feature breakdown, user flows, demo scenario |
| [Architecture](./architecture.md) | System diagram, module boundaries, tech stack, data flow pipelines |
| [Data Model](./data-model.md) | Supabase schema, entity relationships, real-time subscriptions, credibility model |
| [Interfaces](./interfaces.md) | Shared TypeScript/Go types, REST API endpoints, reusable abstractions |
| [Design Guide](./design-guide.md) | UI layout, color system, 3D conventions, component hierarchy, Lovable prompt |
| [Agentic Engineering](./agentic-engineering.md) | Agent team workflow, quality gates (test + review), parallel strategy, file structure |
| [Implementation Plan](./implementation-plan.md) | Pre-hackathon prep, hourly task breakdown, dependency graph, critical path |
| [Roadmap](./roadmap.md) | Hackathon schedule, phase breakdown, MVP vs nice-to-have, demo script |

## Tech Stack Quick Reference

| Layer | Technology |
|-------|-----------|
| Frontend | React/TS (Lovable scaffold) + React Three Fiber |
| 3D Scan | Marble API (World Labs) |
| Backend | Go |
| Database | Supabase (Postgres + Realtime + Storage) |
| VLM + Reasoning | Gemini |
| Suspect Profiling | NanoBanana (Gemini Image) |

## Team Split

| Role | Count | Scope |
|------|-------|-------|
| Frontend | 2 | Lovable export, R3F 3D, timeline UI, profiling UI |
| Backend | 1-2 | Go API, Gemini integration, reasoning pipeline |
| Pipeline | 1 | Marble scanning, blueprint generation, demo data |

## Critical Path

```
Supabase -> Go API -> Gemini Reasoning -> Timeline Playback
```

If this chain works, you have a demo. Everything else enhances it.
