package api

import (
	"encoding/json"
	"net/http"
	"time"

	"dianoia/internal/gemini"
	"dianoia/internal/supabase"
	"dianoia/internal/types"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

// ProfilesHandler handles suspect profile endpoints.
type ProfilesHandler struct {
	db     *supabase.Client
	gemini *gemini.Client
}

// NewProfilesHandler creates a new ProfilesHandler.
func NewProfilesHandler(db *supabase.Client, gemini *gemini.Client) *ProfilesHandler {
	return &ProfilesHandler{db: db, gemini: gemini}
}

// CaseRoutes returns the chi router for /api/cases/{id}/profiles endpoints.
func (h *ProfilesHandler) CaseRoutes() chi.Router {
	r := chi.NewRouter()
	r.Post("/", h.CreateProfile)
	r.Get("/", h.ListProfiles)
	return r
}

// ItemRoutes returns the chi router for /api/profiles/{id} endpoints.
func (h *ProfilesHandler) ItemRoutes() chi.Router {
	r := chi.NewRouter()
	r.Get("/{id}", h.GetProfile)
	r.Post("/{id}/refine", h.RefineProfile)
	return r
}

// CreateProfile handles POST /api/cases/{id}/profiles.
func (h *ProfilesHandler) CreateProfile(w http.ResponseWriter, r *http.Request) {
	caseID := chi.URLParam(r, "id")

	var req types.CreateProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.Name == "" {
		writeError(w, http.StatusBadRequest, "name is required")
		return
	}

	now := time.Now().UTC()
	profile := map[string]interface{}{
		"id":                uuid.New().String(),
		"case_id":           caseID,
		"name":              req.Name,
		"description":       req.Description,
		"current_image_url": nil,
		"revision_history":  json.RawMessage("[]"),
		"source_witness_id": req.SourceWitnessID,
		"metadata":          json.RawMessage("{}"),
		"created_at":        now.Format(time.RFC3339),
		"updated_at":        now.Format(time.RFC3339),
	}

	// TODO: When Gemini/NanoBanana is implemented:
	// 1. Generate initial composite image from description
	// 2. Upload to Supabase Storage
	// 3. Set current_image_url and revision_history

	result, err := h.db.Insert(r.Context(), "suspect_profiles", profile)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create profile: "+err.Error())
		return
	}

	writeJSON(w, http.StatusCreated, result)
}

// ListProfiles handles GET /api/cases/{id}/profiles.
func (h *ProfilesHandler) ListProfiles(w http.ResponseWriter, r *http.Request) {
	caseID := chi.URLParam(r, "id")

	result, err := h.db.Query(r.Context(), "suspect_profiles", map[string]string{
		"case_id": "eq." + caseID,
		"order":   "created_at.desc",
	})
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list profiles: "+err.Error())
		return
	}

	writeJSON(w, http.StatusOK, result)
}

// GetProfile handles GET /api/profiles/{id}.
func (h *ProfilesHandler) GetProfile(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	result, err := h.db.QuerySingle(r.Context(), "suspect_profiles", map[string]string{
		"id": "eq." + id,
	})
	if err != nil {
		writeError(w, http.StatusNotFound, "profile not found: "+err.Error())
		return
	}

	writeJSON(w, http.StatusOK, result)
}

// RefineProfile handles POST /api/profiles/{id}/refine.
func (h *ProfilesHandler) RefineProfile(w http.ResponseWriter, r *http.Request) {
	_ = chi.URLParam(r, "id")

	var req types.RefineProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.Instruction == "" {
		writeError(w, http.StatusBadRequest, "instruction is required")
		return
	}

	// TODO: Implement profile refinement pipeline:
	// 1. Get current profile from Supabase
	// 2. Call Gemini/NanoBanana with current image + instruction
	// 3. Upload new image to Supabase Storage
	// 4. Update profile with new image URL and revision history

	writeError(w, http.StatusNotImplemented, "profile refinement not yet implemented - NanoBanana integration pending")
}
