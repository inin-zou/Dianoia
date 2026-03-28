package api

import (
	"encoding/json"
	"net/http"

	"dianoia/internal/gemini"
	"dianoia/internal/marble"
	"dianoia/internal/supabase"
	"dianoia/internal/types"

	"github.com/go-chi/chi/v5"
)

// ScanHandler handles Marble scan and blueprint endpoints.
type ScanHandler struct {
	db     *supabase.Client
	marble *marble.Client
	gemini *gemini.Client
}

// NewScanHandler creates a new ScanHandler.
func NewScanHandler(db *supabase.Client, marble *marble.Client, gemini *gemini.Client) *ScanHandler {
	return &ScanHandler{db: db, marble: marble, gemini: gemini}
}

// CaseRoutes returns the chi router for /api/cases/{id}/scan and /api/cases/{id}/blueprint.
func (h *ScanHandler) CaseRoutes() chi.Router {
	r := chi.NewRouter()
	r.Post("/scan", h.StartScan)
	r.Get("/scan/status", h.ScanStatus)
	r.Post("/blueprint", h.GenerateBlueprint)
	return r
}

// StartScan handles POST /api/cases/{id}/scan.
// Uploads images and triggers Marble world generation.
func (h *ScanHandler) StartScan(w http.ResponseWriter, r *http.Request) {
	caseID := chi.URLParam(r, "id")

	var req types.ScanRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.ImageURL == "" {
		writeError(w, http.StatusBadRequest, "imageUrl is required")
		return
	}

	displayName := req.DisplayName
	if displayName == "" {
		displayName = "Crime Scene Scan"
	}

	// TODO: Implement full scan pipeline:
	// 1. Call Marble API to generate world from image
	// 2. Create marble_scans row with status "processing"
	// 3. Start background goroutine to poll for completion
	// 4. On completion, update marble_scans with world data

	_ = caseID      // Will be used when pipeline is implemented
	_ = displayName // Will be used when pipeline is implemented

	writeError(w, http.StatusNotImplemented, "scan pipeline not yet implemented - Marble integration pending")
}

// ScanStatus handles GET /api/cases/{id}/scan/status.
func (h *ScanHandler) ScanStatus(w http.ResponseWriter, r *http.Request) {
	caseID := chi.URLParam(r, "id")

	result, err := h.db.QuerySingle(r.Context(), "marble_scans", map[string]string{
		"case_id": "eq." + caseID,
		"order":   "created_at.desc",
		"limit":   "1",
	})
	if err != nil {
		writeError(w, http.StatusNotFound, "no scan found for case: "+err.Error())
		return
	}

	writeJSON(w, http.StatusOK, result)
}

// GenerateBlueprint handles POST /api/cases/{id}/blueprint.
// Triggers blueprint generation from the Marble scan.
func (h *ScanHandler) GenerateBlueprint(w http.ResponseWriter, r *http.Request) {
	caseID := chi.URLParam(r, "id")

	// TODO: Implement blueprint generation pipeline:
	// 1. Get the latest marble_scan for this case
	// 2. Get the panorama URL from the scan
	// 3. Send panorama to Gemini VLM for room description
	// 4. Send room description to Gemini LLM for BlueprintData JSON
	// 5. Update the case with blueprint_data

	_ = caseID // Will be used when pipeline is implemented

	writeError(w, http.StatusNotImplemented, "blueprint generation not yet implemented - Gemini integration pending")
}
