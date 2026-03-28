# Interfaces

Shared types and contracts between frontend (TypeScript) and backend (Go). These are the source of truth -- both sides must implement from these definitions.

## Core Types

### TypeScript (Frontend)

```typescript
// === Case ===
interface Case {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'closed' | 'archived';
  marbleWorldId: string | null;
  blueprintData: BlueprintData | null;
  roomDescription: RoomDescription | null;
  scaleFactor: number;
  createdAt: string;
  updatedAt: string;
}

// === Blueprint ===
interface BlueprintData {
  dimensions: { width: number; depth: number; height: number };
  walls: Wall[];
  doors: Door[];
  windows: Window[];
  furniture: Furniture[];
}

interface Wall {
  start: Vec2;
  end: Vec2;
  height: number;
  hasWindow: boolean;
  hasDoor: boolean;
}

interface Door {
  position: Vec2;
  width: number;
  label: string;
}

interface Window {
  position: Vec2;
  width: number;
  height: number;
  wallIndex: number;
}

interface Furniture {
  type: string;
  position: Vec3;
  dimensions: { w: number; d: number; h: number };
  label?: string;
}

// === Evidence ===
interface Evidence {
  id: string;
  caseId: string;
  type: EvidenceType;
  subtype: string;
  title: string;
  description: string;
  credibilityScore: number;
  credibilityReason: string;
  position: Vec3 | null;
  rotation: Vec3 | null;
  assetType: EvidenceAssetType | null;
  imageUrl: string | null;
  vlmAnnotation: VLMAnnotation | null;
  metadata: Record<string, unknown>;
  stageOrder: number;
  createdAt: string;
}

type EvidenceType = 'physical' | 'forensic' | 'document' | 'image';

type EvidenceAssetType =
  | 'knife'
  | 'body_outline'
  | 'blood_marker'
  | 'fingerprint_marker'
  | 'generic_marker'
  | 'gun'
  | 'clothing'
  | 'document_marker';

interface VLMAnnotation {
  description: string;
  significance: string;
  suggestedPosition: Vec3 | null;
  relatedEvidence: string[];
  confidence: number;
}

// === Witness ===
interface Witness {
  id: string;
  caseId: string;
  name: string;
  role: 'witness' | 'victim_relative' | 'suspect' | 'officer';
  statement: string;
  credibilityScore: number;
  credibilityReason: string;
  positionDuringEvent: Vec3 | null;
  observationAngle: number | null;
  corroboratedBy: string[];
  contradictedBy: string[];
  stageOrder: number;
  createdAt: string;
}

// === Hypothesis ===
interface Hypothesis {
  id: string;
  caseId: string;
  rank: number;
  probability: number;
  title: string;
  reasoning: string;
  supportingEvidence: string[];
  contradictingEvidence: string[];
  timeline: TimelineEvent[];
  stageSnapshot: number;
  createdAt: string;
}

interface TimelineEvent {
  timestamp: string;          // "HH:mm" format
  actor: string;              // actor identifier
  action: TimelineAction;
  position: Vec3;
  description: string;
  evidenceRefs: string[];     // evidence/witness IDs
  confidence: number;
}

type TimelineAction =
  | 'enters_room'
  | 'exits_room'
  | 'moves_to'
  | 'interacts_with'
  | 'attacks'
  | 'picks_up'
  | 'drops'
  | 'waits'
  | 'flees';

// === Suspect Profile ===
interface SuspectProfile {
  id: string;
  caseId: string;
  name: string;
  description: string;
  currentImageUrl: string | null;
  revisionHistory: ProfileRevision[];
  sourceWitnessId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface ProfileRevision {
  instruction: string;
  imageUrl: string;
  timestamp: string;
}

// === Marble Scan ===
interface MarbleScan {
  id: string;
  caseId: string;
  worldId: string | null;
  status: 'processing' | 'ready' | 'failed';
  embedUrl: string | null;
  meshExportUrl: string | null;
  splatExportUrl: string | null;
  renderedViews: RenderedView[];
  createdAt: string;
}

interface RenderedView {
  angle: string;
  imageUrl: string;
}

// === Shared Primitives ===
interface Vec2 {
  x: number;
  z: number;
}

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

// === Actor (for timeline playback) ===
interface Actor {
  id: string;
  label: string;
  role: 'suspect' | 'victim' | 'witness' | 'officer';
  color: string;
}
```

### Go (Backend)

```go
// === Shared Primitives ===
type Vec2 struct {
    X float64 `json:"x"`
    Z float64 `json:"z"`
}

type Vec3 struct {
    X float64 `json:"x"`
    Y float64 `json:"y"`
    Z float64 `json:"z"`
}

// === Case ===
type Case struct {
    ID              string          `json:"id"`
    Title           string          `json:"title"`
    Description     string          `json:"description"`
    Status          string          `json:"status"`
    MarbleWorldID   *string         `json:"marbleWorldId"`
    BlueprintData   *BlueprintData  `json:"blueprintData"`
    RoomDescription json.RawMessage `json:"roomDescription"`
    ScaleFactor     float64         `json:"scaleFactor"`
    CreatedAt       time.Time       `json:"createdAt"`
    UpdatedAt       time.Time       `json:"updatedAt"`
}

// === Blueprint ===
type BlueprintData struct {
    Dimensions struct {
        Width  float64 `json:"width"`
        Depth  float64 `json:"depth"`
        Height float64 `json:"height"`
    } `json:"dimensions"`
    Walls     []Wall      `json:"walls"`
    Doors     []Door      `json:"doors"`
    Windows   []Window    `json:"windows"`
    Furniture []Furniture `json:"furniture"`
}

type Wall struct {
    Start     Vec2    `json:"start"`
    End       Vec2    `json:"end"`
    Height    float64 `json:"height"`
    HasWindow bool    `json:"hasWindow"`
    HasDoor   bool    `json:"hasDoor"`
}

type Door struct {
    Position Vec2    `json:"position"`
    Width    float64 `json:"width"`
    Label    string  `json:"label"`
}

type Window struct {
    Position  Vec2    `json:"position"`
    Width     float64 `json:"width"`
    Height    float64 `json:"height"`
    WallIndex int     `json:"wallIndex"`
}

type Furniture struct {
    Type       string `json:"type"`
    Position   Vec3   `json:"position"`
    Dimensions struct {
        W float64 `json:"w"`
        D float64 `json:"d"`
        H float64 `json:"h"`
    } `json:"dimensions"`
    Label string `json:"label,omitempty"`
}

// === Evidence ===
type Evidence struct {
    ID               string          `json:"id"`
    CaseID           string          `json:"caseId"`
    Type             string          `json:"type"`
    Subtype          string          `json:"subtype"`
    Title            string          `json:"title"`
    Description      string          `json:"description"`
    CredibilityScore float64         `json:"credibilityScore"`
    CredibilityReason string         `json:"credibilityReason"`
    Position         *Vec3           `json:"position"`
    Rotation         *Vec3           `json:"rotation"`
    AssetType        *string         `json:"assetType"`
    ImageURL         *string         `json:"imageUrl"`
    VLMAnnotation    json.RawMessage `json:"vlmAnnotation"`
    Metadata         json.RawMessage `json:"metadata"`
    StageOrder       int             `json:"stageOrder"`
    CreatedAt        time.Time       `json:"createdAt"`
}

// === Witness ===
type Witness struct {
    ID                  string   `json:"id"`
    CaseID              string   `json:"caseId"`
    Name                string   `json:"name"`
    Role                string   `json:"role"`
    Statement           string   `json:"statement"`
    CredibilityScore    float64  `json:"credibilityScore"`
    CredibilityReason   string   `json:"credibilityReason"`
    PositionDuringEvent *Vec3    `json:"positionDuringEvent"`
    ObservationAngle    *float64 `json:"observationAngle"`
    CorroboratedBy      []string `json:"corroboratedBy"`
    ContradictedBy      []string `json:"contradictedBy"`
    StageOrder          int      `json:"stageOrder"`
    CreatedAt           time.Time `json:"createdAt"`
}

// === Hypothesis ===
type Hypothesis struct {
    ID                   string          `json:"id"`
    CaseID               string          `json:"caseId"`
    Rank                 int             `json:"rank"`
    Probability          float64         `json:"probability"`
    Title                string          `json:"title"`
    Reasoning            string          `json:"reasoning"`
    SupportingEvidence   []string        `json:"supportingEvidence"`
    ContradictingEvidence []string       `json:"contradictingEvidence"`
    Timeline             []TimelineEvent `json:"timeline"`
    StageSnapshot        int             `json:"stageSnapshot"`
    CreatedAt            time.Time       `json:"createdAt"`
}

type TimelineEvent struct {
    Timestamp    string   `json:"timestamp"`
    Actor        string   `json:"actor"`
    Action       string   `json:"action"`
    Position     Vec3     `json:"position"`
    Description  string   `json:"description"`
    EvidenceRefs []string `json:"evidenceRefs"`
    Confidence   float64  `json:"confidence"`
}

// === Suspect Profile ===
type SuspectProfile struct {
    ID              string            `json:"id"`
    CaseID          string            `json:"caseId"`
    Name            string            `json:"name"`
    Description     string            `json:"description"`
    CurrentImageURL *string           `json:"currentImageUrl"`
    RevisionHistory []ProfileRevision `json:"revisionHistory"`
    SourceWitnessID *string           `json:"sourceWitnessId"`
    Metadata        json.RawMessage   `json:"metadata"`
    CreatedAt       time.Time         `json:"createdAt"`
    UpdatedAt       time.Time         `json:"updatedAt"`
}

type ProfileRevision struct {
    Instruction string `json:"instruction"`
    ImageURL    string `json:"imageUrl"`
    Timestamp   string `json:"timestamp"`
}

// === Marble Scan ===
type MarbleScan struct {
    ID             string         `json:"id"`
    CaseID         string         `json:"caseId"`
    WorldID        *string        `json:"worldId"`
    Status         string         `json:"status"`
    EmbedURL       *string        `json:"embedUrl"`
    MeshExportURL  *string        `json:"meshExportUrl"`
    SplatExportURL *string        `json:"splatExportUrl"`
    RenderedViews  []RenderedView `json:"renderedViews"`
    CreatedAt      time.Time      `json:"createdAt"`
}

type RenderedView struct {
    Angle    string `json:"angle"`
    ImageURL string `json:"imageUrl"`
}
```

## REST API Endpoints

### Cases
```
POST   /api/cases                    -- Create a new case
GET    /api/cases/:id                -- Get case details
PUT    /api/cases/:id                -- Update case
GET    /api/cases                    -- List all cases
```

### Evidence
```
POST   /api/cases/:id/evidence       -- Add evidence to case
GET    /api/cases/:id/evidence       -- List evidence for case
PUT    /api/evidence/:id             -- Update evidence (position, credibility)
DELETE /api/evidence/:id             -- Remove evidence
```

### Witnesses
```
POST   /api/cases/:id/witnesses      -- Add witness testimony
GET    /api/cases/:id/witnesses      -- List witnesses for case
PUT    /api/witnesses/:id            -- Update witness (credibility, corroboration)
```

### Analysis
```
POST   /api/cases/:id/analyze        -- Trigger reasoning pipeline for current evidence stage
GET    /api/cases/:id/hypotheses     -- Get ranked hypotheses
GET    /api/hypotheses/:id           -- Get single hypothesis with full timeline
```

### Marble / Blueprint
```
POST   /api/cases/:id/scan           -- Upload images, trigger Marble scan
GET    /api/cases/:id/scan/status    -- Check scan status
POST   /api/cases/:id/blueprint      -- Trigger blueprint generation from scan
```

### Suspect Profiling
```
POST   /api/cases/:id/profiles       -- Create suspect profile from description
POST   /api/profiles/:id/refine      -- Refine profile (send instruction, get new image)
GET    /api/cases/:id/profiles       -- List profiles for case
GET    /api/profiles/:id             -- Get profile with revision history
```

### Request/Response Examples

**POST /api/cases/:id/evidence**
```json
// Request
{
  "type": "physical",
  "subtype": "weapon",
  "title": "Kitchen knife",
  "description": "12-inch kitchen knife found near the body",
  "position": {"x": 3.2, "y": 0, "z": 1.5},
  "assetType": "knife",
  "imageUrl": "https://supabase.../evidence-images/knife.jpg"
}

// Response
{
  "id": "uuid",
  "caseId": "uuid",
  "type": "physical",
  "subtype": "weapon",
  "title": "Kitchen knife",
  "credibilityScore": 0.9,
  "credibilityReason": "Physical evidence - high default credibility",
  "vlmAnnotation": null,
  "stageOrder": 1,
  "createdAt": "2026-03-28T10:00:00Z"
}
```

**POST /api/cases/:id/analyze**
```json
// Request
{
  "upToStage": 2
}

// Response
{
  "hypotheses": [
    {
      "rank": 1,
      "probability": 0.65,
      "title": "Suspect entered from east, confrontation at desk",
      "reasoning": "The knife position and blood spatter angle suggest...",
      "timeline": [
        {"timestamp": "23:00", "actor": "suspect_1", "action": "enters_room", "position": {"x": 4, "y": 0, "z": 0}},
        {"timestamp": "23:02", "actor": "suspect_1", "action": "moves_to", "position": {"x": 5, "y": 0, "z": 3}}
      ]
    }
  ]
}
```

**POST /api/profiles/:id/refine**
```json
// Request
{
  "instruction": "Add a short beard and make the nose slightly wider"
}

// Response
{
  "currentImageUrl": "https://supabase.../suspect-composites/profile-v3.png",
  "revisionHistory": [
    {"instruction": "Initial composite from witness description", "imageUrl": "...", "timestamp": "..."},
    {"instruction": "Make face thinner", "imageUrl": "...", "timestamp": "..."},
    {"instruction": "Add a short beard and make the nose slightly wider", "imageUrl": "...", "timestamp": "..."}
  ]
}
```

## Reusable Abstractions

### Frontend

```typescript
// Generic Supabase real-time hook
function useRealtimeTable<T>(table: string, filter: Record<string, string>): T[]

// Generic Supabase CRUD hook
function useSupabaseQuery<T>(table: string, query: SupabaseQuery): { data: T[], loading: boolean, error: Error | null }

// 3D position helper
function worldToBlueprint(worldPos: Vec3, scaleFactor: number): Vec3
function blueprintToScreen(pos: Vec3, camera: Camera): Vec2

// Credibility color mapper
function credibilityColor(score: number): string

// Evidence asset loader
function useEvidenceAsset(assetType: EvidenceAssetType): THREE.Object3D
```

### Backend (Go)

```go
// Generic Supabase service interface
type Repository[T any] interface {
    Create(ctx context.Context, item T) (T, error)
    GetByID(ctx context.Context, id string) (T, error)
    ListByCase(ctx context.Context, caseID string) ([]T, error)
    Update(ctx context.Context, id string, updates map[string]interface{}) (T, error)
    Delete(ctx context.Context, id string) error
}

// Gemini client interface
type GeminiClient interface {
    AnalyzeImage(ctx context.Context, imageURL string, prompt string) (VLMAnnotation, error)
    GenerateHypotheses(ctx context.Context, evidence []Evidence, witnesses []Witness, blueprint BlueprintData) ([]Hypothesis, error)
    GenerateBlueprint(ctx context.Context, roomDescription string) (BlueprintData, error)
    RefineProfile(ctx context.Context, currentImageURL string, instruction string) (string, error)
}

// Marble client interface (World Labs API, using Marble 0.1-mini)
// Base URL: https://api.worldlabs.ai
// Auth: WLT-Api-Key header
type MarbleClient interface {
    // POST /marble/v1/worlds:generate — returns operation_id
    GenerateWorld(ctx context.Context, imageURL string, displayName string) (operationID string, err error)
    // GET /marble/v1/operations/{operation_id} — poll until done
    PollOperation(ctx context.Context, operationID string) (world *MarbleWorld, done bool, err error)
    // GET /marble/v1/worlds/{world_id}
    GetWorld(ctx context.Context, worldID string) (*MarbleWorld, error)
}

// MarbleWorld represents the response from Marble API
type MarbleWorld struct {
    WorldID       string       `json:"world_id"`
    DisplayName   string       `json:"display_name"`
    EmbedURL      string       `json:"world_marble_url"` // iframe embed
    Assets        MarbleAssets `json:"assets"`
}

type MarbleAssets struct {
    Caption          string            `json:"caption"`
    ThumbnailURL     string            `json:"thumbnail_url"`
    Splats           MarbleSplats      `json:"splats"`
    Mesh             MarbleMesh        `json:"mesh"`
    Imagery          MarbleImagery     `json:"imagery"`
    SemanticsMetadata MarbleSemantics  `json:"semantics_metadata"`
}

type MarbleSplats struct {
    SpzURLs map[string]string `json:"spz_urls"` // "100k", "500k", "full_res"
}

type MarbleMesh struct {
    ColliderMeshURL string `json:"collider_mesh_url"` // GLB format
}

type MarbleImagery struct {
    PanoURL string `json:"pano_url"` // panorama for VLM input
}

type MarbleSemantics struct {
    GroundPlaneOffset float64 `json:"ground_plane_offset"`
    MetricScaleFactor float64 `json:"metric_scale_factor"`
}
```
