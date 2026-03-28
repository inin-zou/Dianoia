# Design Guide

## UI/UX System — Dark Tactical Theme

### Design Language

Inspired by operational/forensic interfaces. Deep navy background with glass panels, JetBrains Mono system labels, grid overlays, and a haze/frosted atmospheric background. Feels like a military-grade analysis tool.

### Layout Structure

```
+---------------------------------------------------------------+
|  Top Bar: DIANOIA™ | // CASE_TITLE | [ACTIVE] | Module Tabs   |
+-------+-------------------------------------------------------+
|       |                                                       |
| Glass |                  Main Viewport                        |
| Side  |                                                       |
| Panel |  (3D Blueprint / Realistic 3D / Floor Plan 2D)        |
|       |                                                       |
| EVID  |  grid-bg-fine + viewport-gradient + crosshair cursor  |
| LOG   |                                                       |
+-------+-------------------------------------------------------+
|  Timeline Scrubber // 00:00 ——————————— 23:59 // [▶] [1.0x]  |
|  // HYPOTHESIS_RANKING: #1 65% | #2 25% | #3 10%             |
+---------------------------------------------------------------+
```

### Pages

| Page | Route | Purpose |
|------|-------|---------|
| Landing | `/` | Hero page with Three.js wireframe animation, system menu, enter button |
| App | `/app` | Main investigation interface with 4 module tabs |

### Module Tabs

1. **Scene** — 3D blueprint + realistic view, evidence placement
2. **Analysis** — reasoning results, hypothesis comparison, evidence graph
3. **Timeline** — full timeline playback with track editor
4. **Profiling** — suspect composite generation (NanoBanana)

### Color System

**Core Palette (CSS custom properties):**
| Token | Value | Use |
|-------|-------|-----|
| `--background` | `#0F172A` | Page background |
| `--surface / --card` | `#162032` | Panel backgrounds |
| `--surface-elevated` | `#1C2A40` | Modals, dropdowns |
| `--foreground` | `#F8FAFC` | Primary text |
| `--muted-foreground` | `#6B7F9E` | Secondary/label text |
| `--border` | `#253249` | Borders |
| `--primary` | `#3B82F6` | Accent blue |
| `--danger` | `#EF4444` | Red — physical evidence, suspects |
| `--success` | `#22C55E` | Green — high credibility |
| `--warning` | `#F59E0B` | Amber — witnesses |
| `--purple` | `#8B5CF6` | Purple — forensic evidence |

**Evidence Type Colors:**
| Type | Color | Badge Label |
|------|-------|-------------|
| Physical (weapon) | Red `#EF4444` | `PHYS` |
| Forensic | Purple `#8B5CF6` | `FRNSC` |
| Document | Blue `#3B82F6` | `DOC` |
| Image | Amber `#F59E0B` | `IMG` |

**Credibility Indicators:**
| Score | Color | Meaning |
|-------|-------|---------|
| 0.8-1.0 | Green `#22C55E` | High confidence |
| 0.6-0.79 | Amber `#F59E0B` | Moderate |
| 0.4-0.59 | Orange `#F97316` | Low confidence |
| 0.0-0.39 | Red `#EF4444` | Unreliable |

**Actor Colors (timeline):**
| Actor | Color | Hex |
|-------|-------|-----|
| Suspect | Red | `#EF4444` |
| Victim | Gray | `#64748B` |
| Witness | Blue | `#3B82F6` |
| Officer | Green | `#22C55E` |

### Typography

**Fonts:**
- **JetBrains Mono** — headings, labels, system text, data readouts, badges
- **Inter** — body text, descriptions, reasoning text

**Hierarchy:**
| Use | Font | Size | Weight | Style |
|-----|------|------|--------|-------|
| Brand "DIANOIA" | JetBrains Mono | 14px | 800 | uppercase, tracking-wider, glow-brand |
| Panel headers | JetBrains Mono | 10px | 700 | uppercase, tracking-wider, `// PREFIX` |
| Tab labels | JetBrains Mono | 11px | 500 | uppercase, tracking-wider |
| Evidence titles | Inter | 12-13px | 500 | normal |
| Body/reasoning | Inter | 12-13px | 400 | normal |
| Data values | JetBrains Mono | 12px | 700 | tabular-nums |
| Badge labels | JetBrains Mono | 8-9px | 700 | uppercase |
| Status text | JetBrains Mono | 9px | 700 | uppercase, tracking-wider |

### Glass Panel System

All panels use a consistent glassmorphism style:

```css
.glass {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.glass-strong {  /* modals, dialogs */
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.glass-subtle {  /* cards within panels */
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

### Background Effects

**Haze/Frosted atmosphere:** Layered radial gradients with `blur(40px)` filter creating foggy depth behind the grid.

**Grid overlay:** Subtle white grid lines at 40px intervals (`grid-bg`) on the main app, 20px intervals (`grid-bg-fine`) on viewports.

**Viewport gradient:** Radial gradient from subtle blue center to dark edge (`viewport-gradient`).

### Interaction Patterns

- **Hover states:** `bg-white/5` → `bg-white/10` transition 200ms
- **Selected state:** `bg-white/10` with `border border-primary/30`
- **Active tab:** `bg-white/15` with subtle blue glow shadow
- **Status dots:** Green blinking dots (`animate-status-blink`) for live status
- **Crosshair cursor:** On viewport areas
- **System paths:** Display current context as `/case/viewport/blueprint_3d`

### 3D Blueprint Conventions

**Coordinate System:**
- 1 unit = 1 meter (real-world scale)
- Y-axis = up, X = east/west, Z = north/south
- Origin (0,0,0) = southwest corner at floor level

**Geometry:**
- Walls: `BoxGeometry` 0.15m thick, semi-transparent white with wireframe
- Floor: `PlaneGeometry`, dark with grid overlay
- Doors: gap in wall with thin frame
- Furniture: simplified `BoxGeometry` in muted colors

**Human Figures:**
- Capsule body (radius 0.25m, height 1.5m) + sphere head (0.15m)
- Colored by actor role
- Movement paths as dashed floor lines

## Component Hierarchy (Current)

```
<App>
  <BrowserRouter>
    <Routes>
      <Route "/" → <Landing />            -- Three.js wireframe + system menu
      <Route "/app" → <Index />           -- Main app shell
        <TopNavbar />                     -- DIANOIA brand, case title, module tabs
        <ModuleTabs>
          <SceneModule>
            <SidePanel glass>             -- // EVIDENCE_LOG
              <EvidenceList />
              <AddEvidenceDialog />
            </SidePanel>
            <ViewportArea>                -- grid-bg-fine, viewport-gradient
              <ViewSwitcher />            -- tactical-segmented
              <BlueprintView3D />         -- R3F Canvas (TODO)
              <RealisticView />           -- Marble iframe (TODO)
              <FloorPlanView2D />         -- SVG (TODO)
            </ViewportArea>
          </SceneModule>
          <AnalysisModule>
            <HypothesisList />            -- ranked, expandable glass cards
            <EvidenceGraph />             -- placeholder, grid-bg-fine
          </AnalysisModule>
          <TimelineModule>
            <ViewportArea />              -- reused 3D view
            <TrackEditor>
              <ActorList glass />         -- // ACTORS panel
              <TimelineTracks />          -- alternating dark rows
              <Playhead />               -- blue line with triangle
            </TrackEditor>
          </TimelineModule>
          <ProfilingModule>
            <ProfileList glass />         -- // SUSPECT_PROFILES
            <CompositeEditor>
              <ImageDisplay />            -- grid-bg-fine placeholder
              <RefinementChat />          -- // REFINEMENT_LOG
              <RevisionStrip />           -- vertical thumbnails
            </CompositeEditor>
          </ProfilingModule>
        </ModuleTabs>
        <BottomBar glass>
          <TimelineScrubber />
          <HypothesisRankingBar />       -- // HYPOTHESIS_RANKING
        </BottomBar>
      </Route>
    </Routes>
  </BrowserRouter>
</App>
```

## Landing Page Design

Full-viewport page with the variant's operational aesthetic:
- Deep navy frame (`#051433`) with radial gradient viewport (white center → blue edge)
- Grid overlay at `100vw / 24` intervals
- Structural background typography "DN01" in 20% opacity white
- Glass meta panel (top-left): DIANOIA™ branding + system info
- SVG logo (top-right): DN01 letterforms
- System modules menu (center-left): 6 items, hover descriptions, click to navigate
- Three.js wireframe plane (center-right): animated wave distortion shader
- Enter button (bottom-right): `ENTER_INVESTIGATION →` with blinking dot
- Build info (bottom-left): version + hackathon credit

## Post-Scaffold Customization Checklist

The Lovable export has been restyled to the dark tactical theme. Remaining work:

1. [ ] Replace viewport placeholder with R3F Canvas + BlueprintView3D
2. [ ] Add Marble iframe embed in realistic view tab
3. [ ] Wire Supabase client for real-time data (replace mock data)
4. [ ] Create `lib/api.ts` for Go backend HTTP calls
5. [ ] Create `lib/supabase.ts` for direct Supabase queries + real-time
6. [ ] Add R3F 3D components (Room, EvidenceMarkers, ActorFigures, MovementPaths)
7. [ ] Implement SVG floor plan generator for 2D view
8. [ ] Wire NanoBanana API to profiling chat interface (via Go backend)
9. [ ] Add timeline animation system (interpolate positions from hypothesis data)
10. [ ] Connect hypothesis selector to timeline playback
