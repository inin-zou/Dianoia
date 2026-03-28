# Design Guide

## UI/UX System

### Layout Structure

```
+---------------------------------------------------------------+
|  Top Bar: Case Title | Status | Module Tabs                   |
+-------+-------------------------------------------------------+
|       |                                                       |
| Side  |                  Main Viewport                        |
| Panel |                                                       |
|       |  (3D Blueprint / Realistic 3D / 2D Floor Plan)        |
| Evidence                                                      |
| List  |                                                       |
|       |                                                       |
+-------+-------------------------------------------------------+
|  Timeline Scrubber + Playback Controls                        |
+---------------------------------------------------------------+
|  Hypothesis Ranking Bar (H1: 72% | H2: 18% | H3: 10%)       |
+---------------------------------------------------------------+
```

### Module Tabs

1. **Scene** -- 3D blueprint + realistic view, evidence placement
2. **Analysis** -- reasoning results, hypothesis comparison, evidence relationships
3. **Timeline** -- full timeline playback with track editor
4. **Profiling** -- suspect composite generation (NanoBanana)
5. **Report** -- case summary, exported findings (stretch goal)

### Color System

**Evidence Types:**
| Type | Color | Hex |
|------|-------|-----|
| Physical (weapon) | Red | `#EF4444` |
| Body/victim | Dark Red | `#991B1B` |
| Blood/biological | Crimson | `#DC2626` |
| Forensic | Purple | `#8B5CF6` |
| Document | Blue | `#3B82F6` |
| Witness position | Amber | `#F59E0B` |

**Credibility Indicators:**
| Score Range | Color | Label |
|-------------|-------|-------|
| 0.8 - 1.0 | Green `#22C55E` | High confidence |
| 0.5 - 0.79 | Yellow `#EAB308` | Moderate |
| 0.2 - 0.49 | Orange `#F97316` | Low confidence |
| 0.0 - 0.19 | Red `#EF4444` | Unreliable / Contradicted |

**Actor Colors (in timeline playback):**
| Actor | Color | Hex |
|-------|-------|-----|
| Suspect 1 | Red | `#EF4444` |
| Suspect 2 | Orange | `#F97316` |
| Victim | White/Gray | `#D1D5DB` |
| Witness 1 | Blue | `#3B82F6` |
| Witness 2 | Cyan | `#06B6D4` |
| Officer | Green | `#22C55E` |

### 3D Blueprint Conventions

**Coordinate System:**
- 1 unit = 1 meter (real-world scale)
- Y-axis = up
- X-axis = east/west
- Z-axis = north/south
- Origin (0,0,0) = southwest corner of room at floor level

**Geometry:**
- Walls: `BoxGeometry` with 0.15m thickness, semi-transparent `#94A3B8` with wireframe overlay
- Floor: `PlaneGeometry`, light gray `#F1F5F9`
- Doors: gap in wall with thin frame outline
- Windows: semi-transparent blue tint in wall
- Furniture: simplified `BoxGeometry` in `#CBD5E1`

**Human Figures:**
- Capsule body (radius 0.25m, height 1.5m) + sphere head (radius 0.15m)
- Colored by actor role (see Actor Colors above)
- Slight glow/outline for selected actor
- Movement shown as path line on floor (dashed, same color as actor)

**Evidence Markers:**
- Pre-made assets at real-world scale
- Floating label above each marker with evidence title
- Click to expand: shows description, credibility badge, VLM annotation
- Pulse animation for newly added evidence

### 2D SVG Floor Plan

- Top-down orthographic projection of blueprint data
- Black walls, white interior
- Evidence as colored dots with labels
- Movement paths as colored lines with timestamps
- Scale bar in corner
- Legend for colors

## Component Hierarchy

```
<App>
  <TopBar />
  <ModuleTabs>
    <SceneModule>
      <SidePanel>
        <EvidenceList />
        <AddEvidenceForm />
      </SidePanel>
      <ViewportSwitcher>
        <BlueprintView3D>          -- R3F Canvas
          <Room walls={} doors={} />
          <EvidenceMarkers evidence={} />
          <ActorFigures actors={} />
          <MovementPaths paths={} />
          <CameraControls />
        </BlueprintView3D>
        <RealisticView>            -- Marble iframe
          <MarbleEmbed worldId={} />
        </RealisticView>
        <FloorPlanView2D>          -- SVG
          <FloorPlanSVG blueprint={} />
        </FloorPlanView2D>
      </ViewportSwitcher>
    </SceneModule>
    <AnalysisModule>
      <HypothesisList hypotheses={} />
      <EvidenceGraph />
      <CredibilityMatrix />
    </AnalysisModule>
    <TimelineModule>
      <TimelinePlayback>
        <BlueprintView3D />        -- reused
        <TimelineScrubber />
        <PlaybackControls />
        <TrackEditor tracks={} />
      </TimelinePlayback>
      <HypothesisSelector />
    </TimelineModule>
    <ProfilingModule>
      <SuspectProfileList />
      <CompositeEditor>
        <CurrentComposite imageUrl={} />
        <RefinementChat />
        <RevisionHistory />
      </CompositeEditor>
    </ProfilingModule>
  </ModuleTabs>
  <BottomBar>
    <TimelineScrubber />
    <HypothesisRankingBar />
  </BottomBar>
</App>
```

## Lovable Prompt

Use this prompt to scaffold the initial UI in Lovable:

---

**Lovable Prompt:**

```
Build a crime scene investigation platform called "Dianoia" with a dark professional theme (dark navy/slate background, clean typography).

Pages/Layout:
- Single-page app with a top navigation bar showing: app logo "Dianoia", case title (editable), case status badge, and module tabs: "Scene", "Analysis", "Timeline", "Profiling"
- Persistent bottom bar with a timeline scrubber slider (time range 00:00 to 23:59) and playback controls (play, pause, rewind, speed selector)
- Below the scrubber, a hypothesis ranking bar showing 3 hypothesis cards side by side with title, probability percentage, and a colored confidence bar

Scene Module:
- Left sidebar (280px) with:
  - Evidence list: scrollable cards showing evidence title, type badge (physical/forensic/witness), credibility score as colored dot (green/yellow/orange/red), and a small thumbnail
  - "Add Evidence" button that opens a modal with: title, type dropdown, description textarea, image upload, position coordinates (x, y, z)
- Main area: a large viewport placeholder (will be replaced with 3D later) with a view switcher in the top-right corner: "Blueprint 3D", "Realistic 3D", "Floor Plan 2D"
- The viewport placeholder should show a centered message "3D Blueprint View" with a subtle grid background

Analysis Module:
- Split view: left side shows ranked hypothesis cards (expandable) with title, probability bar, supporting evidence tags (green), contradicting evidence tags (red), and LLM reasoning text
- Right side shows an evidence relationship diagram placeholder (will be a graph visualization)

Timeline Module:
- Top area: same viewport as Scene module (reuse the component)
- Bottom area: track-based editor like a video editor
  - Each track is a horizontal row labeled with an actor name and colored dot
  - Tracks contain time slots (colored rectangles) that can be visualized on the timeline
  - Track controls on the left: visibility toggle, lock toggle, color indicator

Profiling Module:
- Split layout
- Left: list of suspect profiles (cards with thumbnail, name, description snippet)
- Right: active profile editor with:
  - Large image display area (square, 400px) showing current composite
  - Below: chat-style interface for refinement instructions
  - User types "add a beard" -> shows as a chat bubble -> new image appears
  - Revision history sidebar showing thumbnail strip of previous iterations

Design tokens:
- Background: #0F172A (dark navy)
- Surface: #1E293B (slate)
- Border: #334155
- Text primary: #F8FAFC
- Text secondary: #94A3B8
- Accent: #3B82F6 (blue)
- Danger: #EF4444 (red)
- Success: #22C55E (green)
- Warning: #F59E0B (amber)
- Font: Inter or system sans-serif
- Border radius: 8px for cards, 6px for buttons
- Use Tailwind CSS
- Use shadcn/ui components where possible
- Use Lucide icons

Make all components responsive. Use TypeScript. Include placeholder data to demonstrate the UI (3 mock evidence items, 3 mock hypotheses, 2 mock timeline tracks, 1 mock suspect profile).
```

---

## Post-Lovable Customization Checklist

After exporting from Lovable, these customizations are needed:

1. [ ] Replace viewport placeholder with R3F Canvas + BlueprintView3D
2. [ ] Add Marble iframe embed in realistic view tab
3. [ ] Wire Supabase client for real-time data
4. [ ] Replace mock data with Supabase queries
5. [ ] Add R3F 3D components (Room, EvidenceMarkers, ActorFigures, MovementPaths)
6. [ ] Implement SVG floor plan generator for 2D view
7. [ ] Wire NanoBanana API to profiling chat interface
8. [ ] Add timeline animation system (AnimationMixer)
9. [ ] Connect hypothesis selector to timeline playback
