package types

import (
	"encoding/json"
	"time"
)

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
	ID                string          `json:"id"`
	CaseID            string          `json:"caseId"`
	Type              string          `json:"type"`
	Subtype           string          `json:"subtype"`
	Title             string          `json:"title"`
	Description       string          `json:"description"`
	CredibilityScore  float64         `json:"credibilityScore"`
	CredibilityReason string          `json:"credibilityReason"`
	Position          *Vec3           `json:"position"`
	Rotation          *Vec3           `json:"rotation"`
	AssetType         *string         `json:"assetType"`
	ImageURL          *string         `json:"imageUrl"`
	VLMAnnotation     json.RawMessage `json:"vlmAnnotation"`
	Metadata          json.RawMessage `json:"metadata"`
	StageOrder        int             `json:"stageOrder"`
	CreatedAt         time.Time       `json:"createdAt"`
}

type VLMAnnotation struct {
	Description       string   `json:"description"`
	Significance      string   `json:"significance"`
	SuggestedPosition *Vec3    `json:"suggestedPosition"`
	RelatedEvidence   []string `json:"relatedEvidence"`
	Confidence        float64  `json:"confidence"`
}

// === Witness ===

type Witness struct {
	ID                  string    `json:"id"`
	CaseID              string    `json:"caseId"`
	Name                string    `json:"name"`
	Role                string    `json:"role"`
	Statement           string    `json:"statement"`
	CredibilityScore    float64   `json:"credibilityScore"`
	CredibilityReason   string    `json:"credibilityReason"`
	PositionDuringEvent *Vec3     `json:"positionDuringEvent"`
	ObservationAngle    *float64  `json:"observationAngle"`
	CorroboratedBy      []string  `json:"corroboratedBy"`
	ContradictedBy      []string  `json:"contradictedBy"`
	StageOrder          int       `json:"stageOrder"`
	CreatedAt           time.Time `json:"createdAt"`
}

// === Hypothesis ===

type Hypothesis struct {
	ID                    string          `json:"id"`
	CaseID                string          `json:"caseId"`
	Rank                  int             `json:"rank"`
	Probability           float64         `json:"probability"`
	Title                 string          `json:"title"`
	Reasoning             string          `json:"reasoning"`
	SupportingEvidence    []string        `json:"supportingEvidence"`
	ContradictingEvidence []string        `json:"contradictingEvidence"`
	Timeline              []TimelineEvent `json:"timeline"`
	StageSnapshot         int             `json:"stageSnapshot"`
	CreatedAt             time.Time       `json:"createdAt"`
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

// === Actor (for timeline playback) ===

type Actor struct {
	ID    string `json:"id"`
	Label string `json:"label"`
	Role  string `json:"role"`
	Color string `json:"color"`
}

// === Marble API Types ===

type MarbleWorld struct {
	WorldID     string       `json:"world_id"`
	DisplayName string       `json:"display_name"`
	EmbedURL    string       `json:"world_marble_url"`
	Assets      MarbleAssets `json:"assets"`
}

type MarbleAssets struct {
	Caption           string          `json:"caption"`
	ThumbnailURL      string          `json:"thumbnail_url"`
	Splats            MarbleSplats    `json:"splats"`
	Mesh              MarbleMesh      `json:"mesh"`
	Imagery           MarbleImagery   `json:"imagery"`
	SemanticsMetadata MarbleSemantics `json:"semantics_metadata"`
}

type MarbleSplats struct {
	SpzURLs map[string]string `json:"spz_urls"`
}

type MarbleMesh struct {
	ColliderMeshURL string `json:"collider_mesh_url"`
}

type MarbleImagery struct {
	PanoURL string `json:"pano_url"`
}

type MarbleSemantics struct {
	GroundPlaneOffset float64 `json:"ground_plane_offset"`
	MetricScaleFactor float64 `json:"metric_scale_factor"`
}

// === API Request/Response types ===

type CreateCaseRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
}

type CreateEvidenceRequest struct {
	Type        string  `json:"type"`
	Subtype     string  `json:"subtype"`
	Title       string  `json:"title"`
	Description string  `json:"description"`
	Position    *Vec3   `json:"position"`
	Rotation    *Vec3   `json:"rotation"`
	AssetType   *string `json:"assetType"`
	ImageURL    *string `json:"imageUrl"`
}

type CreateWitnessRequest struct {
	Name                string   `json:"name"`
	Role                string   `json:"role"`
	Statement           string   `json:"statement"`
	PositionDuringEvent *Vec3    `json:"positionDuringEvent"`
	ObservationAngle    *float64 `json:"observationAngle"`
}

type AnalyzeRequest struct {
	UpToStage int `json:"upToStage"`
}

type AnalyzeResponse struct {
	Hypotheses []Hypothesis `json:"hypotheses"`
}

type ScanRequest struct {
	ImageURL    string `json:"imageUrl"`
	DisplayName string `json:"displayName"`
}

type ScanStatusResponse struct {
	Status    string  `json:"status"`
	WorldID   *string `json:"worldId"`
	EmbedURL  *string `json:"embedUrl"`
	MeshURL   *string `json:"meshUrl"`
	SplatURL  *string `json:"splatUrl"`
}

type CreateProfileRequest struct {
	Name            string  `json:"name"`
	Description     string  `json:"description"`
	SourceWitnessID *string `json:"sourceWitnessId"`
}

type RefineProfileRequest struct {
	Instruction string `json:"instruction"`
}

type RefineProfileResponse struct {
	CurrentImageURL string            `json:"currentImageUrl"`
	RevisionHistory []ProfileRevision `json:"revisionHistory"`
}

type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message"`
}
