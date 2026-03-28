# Agentic Engineering

How to use Claude Code agent teams to implement this project efficiently, with quality gates after every task.

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

## Quality Gates

### Gate 1: Unit Tests (after every task)

Every new feature must have tests before being considered done:

- **Frontend components**: Test rendering, user interactions, state changes
- **Go API endpoints**: Test request/response, error cases, Supabase integration
- **Gemini pipeline**: Test prompt construction, response parsing, structured output validation
- **3D blueprint**: Test scene generation from room descriptions, coordinate transforms

Test naming convention: `<feature>_test.go` (Go), `<Component>.test.tsx` (React)

Run tests:
```bash
# Go
go test ./...

# Frontend
npm test
```

### Gate 2: Design Review (after each feature)

Code review agent checks:

1. **Interface reuse**: Does this feature reuse existing interfaces or does it duplicate?
2. **Pattern consistency**: Does it follow the same patterns as existing code?
3. **Module boundaries**: Does frontend code stay in frontend? Does it call Go backend, not Gemini directly?
4. **Type safety**: Are shared types from `interfaces.md` being used?
5. **Separation of concerns**: Is rendering separate from data fetching? Is business logic in Go, not frontend?
6. **YAGNI**: Is there unnecessary complexity, premature abstraction, or features not in the spec?

## Parallel Agent Strategy

For 48hr hackathon, maximize parallelism:

### Independent Tracks (can run simultaneously)

```
Track A (Frontend):
  Lovable scaffold -> Export -> R3F setup -> Blueprint viewer -> Timeline UI -> Evidence panel

Track B (Backend):
  Go project setup -> Supabase client -> REST API -> Gemini VLM integration -> Reasoning pipeline

Track C (Pipeline):
  Marble API integration -> Export handling -> VLM blueprint extraction -> Asset management
```

### Sync Points (tracks must converge)

- After Supabase schema is created (all tracks need it)
- After Go API endpoints are defined (frontend needs to call them)
- After blueprint data format is agreed (frontend renders what backend produces)
- After hypothesis JSON schema is finalized (backend writes, frontend reads)

## Agent Usage Patterns

### Starting a New Feature

```
You: "Implement the evidence placement UI component"

Claude Code should:
1. Read interfaces.md for Evidence type definition
2. Read architecture.md for module boundaries
3. Check existing components for patterns to follow
4. Implement the feature
5. Write tests
6. Self-review against design patterns
```

### Dispatching Parallel Work

When multiple independent tasks are available:

```
You: "Implement Go Gemini VLM endpoint and frontend evidence list component in parallel"

Claude Code dispatches:
- Agent 1: Go backend VLM endpoint (reads interfaces.md, writes Go code + tests)
- Agent 2: Frontend evidence list (reads interfaces.md, writes React component + tests)
- Both share the Evidence interface from interfaces.md
```

### After Major Milestone Review

After completing a major feature area (e.g., "all evidence management features done"):

```
You: "Review all evidence-related code"

Code Review Agent checks:
- Are Evidence, Witness, and related types used consistently?
- Is the credibility model implemented as specified in data-model.md?
- Do all components follow the same rendering patterns?
- Are Supabase subscriptions set up correctly?
- Are there any duplicated utilities that should be extracted?
```

## Design Pattern Enforcement

### Patterns to Enforce

1. **Shared interfaces first**: Before implementing, check `interfaces.md` for the types. If a new type is needed, add it to interfaces first, then implement.

2. **Supabase as communication layer**: Modules talk via Supabase, not direct calls. Frontend writes to Supabase, Go backend reacts. Go writes results to Supabase, frontend reacts via real-time.

3. **Component composition**: React components should be small, composable. A `TimelineTrack` is made of `TimelineSlot`s. A `BlueprintScene` contains `EvidenceMarker`s and `ActorFigure`s.

4. **Go service pattern**: Each domain (evidence, hypothesis, scan, profile) gets its own service struct with methods. Services share a Supabase client and Gemini client.

5. **Prompt templates**: Gemini prompts are stored as Go templates, not inline strings. This makes them reviewable and testable independently.

## File Structure Convention

```
frontend/
  src/
    components/
      blueprint/       -- 3D blueprint viewer components
      timeline/        -- timeline playback components
      evidence/        -- evidence management components
      profiling/       -- suspect profiling components
      shared/          -- reusable UI components
    hooks/             -- custom React hooks
    types/             -- TypeScript interfaces (mirrors interfaces.md)
    lib/               -- Supabase client, utilities
    pages/             -- route-level page components

backend/
  cmd/server/          -- main entry point
  internal/
    api/               -- HTTP handlers
    service/           -- business logic (evidence, hypothesis, scan, profile)
    gemini/            -- Gemini API client + prompt templates
    marble/            -- Marble API client
    supabase/          -- Supabase client wrapper
    types/             -- Go type definitions (mirrors interfaces.md)
  prompts/             -- Gemini prompt templates
```

## Continuous Quality Checklist

After every feature implementation, verify:

- [ ] Unit tests written and passing
- [ ] Shared types from interfaces.md used (no ad-hoc type definitions)
- [ ] Module boundaries respected (frontend doesn't call Gemini, backend doesn't render)
- [ ] Supabase real-time subscriptions used for cross-module communication
- [ ] No duplicated code -- check if a shared utility already exists
- [ ] Component is composable and follows existing patterns
- [ ] Go service follows the existing service struct pattern
- [ ] Gemini prompts are in template files, not inline
