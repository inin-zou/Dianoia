package api

import (
	"encoding/json"
	"net/http"

	"dianoia/internal/service"
	"dianoia/internal/supabase"
	"dianoia/internal/types"

	"github.com/go-chi/chi/v5"
)

// ProfilesHandler handles suspect profile endpoints.
type ProfilesHandler struct {
	db               *supabase.Client
	profilingService *service.ProfilingService
}

// NewProfilesHandler creates a new ProfilesHandler.
func NewProfilesHandler(db *supabase.Client, profilingService *service.ProfilingService) *ProfilesHandler {
	return &ProfilesHandler{db: db, profilingService: profilingService}
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
// It generates an initial composite image from the description and creates
// a new suspect profile record.
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

	if req.Description == "" {
		writeError(w, http.StatusBadRequest, "description is required")
		return
	}

	// Generate composite and create profile via the profiling service
	profile, err := h.profilingService.GenerateComposite(r.Context(), caseID, req.Name, req.Description, req.SourceWitnessID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to generate composite: "+err.Error())
		return
	}

	writeJSON(w, http.StatusCreated, profile)
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
// It applies a modification instruction to the existing composite and
// updates the profile with the new image.
func (h *ProfilesHandler) RefineProfile(w http.ResponseWriter, r *http.Request) {
	profileID := chi.URLParam(r, "id")

	var req types.RefineProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.Instruction == "" {
		writeError(w, http.StatusBadRequest, "instruction is required")
		return
	}

	// Refine the composite via the profiling service
	profile, err := h.profilingService.RefineComposite(r.Context(), profileID, req.Instruction)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to refine composite: "+err.Error())
		return
	}

	writeJSON(w, http.StatusOK, profile)
}
