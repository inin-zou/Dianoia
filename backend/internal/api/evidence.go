package api

import (
	"encoding/json"
	"net/http"
	"time"

	"dianoia/internal/supabase"
	"dianoia/internal/types"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

// EvidenceHandler handles all evidence-related endpoints.
type EvidenceHandler struct {
	db *supabase.Client
}

// NewEvidenceHandler creates a new EvidenceHandler.
func NewEvidenceHandler(db *supabase.Client) *EvidenceHandler {
	return &EvidenceHandler{db: db}
}

// CaseRoutes returns the chi router for /api/cases/{id}/evidence endpoints.
func (h *EvidenceHandler) CaseRoutes() chi.Router {
	r := chi.NewRouter()
	r.Post("/", h.CreateEvidence)
	r.Get("/", h.ListEvidence)
	return r
}

// ItemRoutes returns the chi router for /api/evidence/{id} endpoints.
func (h *EvidenceHandler) ItemRoutes() chi.Router {
	r := chi.NewRouter()
	r.Put("/{id}", h.UpdateEvidence)
	r.Delete("/{id}", h.DeleteEvidence)
	return r
}

// CreateEvidence handles POST /api/cases/{id}/evidence.
func (h *EvidenceHandler) CreateEvidence(w http.ResponseWriter, r *http.Request) {
	caseID := chi.URLParam(r, "id")

	var req types.CreateEvidenceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.Title == "" {
		writeError(w, http.StatusBadRequest, "title is required")
		return
	}

	// Assign default credibility based on evidence type
	credScore, credReason := defaultCredibility(req.Type)

	now := time.Now().UTC()
	evidence := map[string]interface{}{
		"id":                 uuid.New().String(),
		"case_id":            caseID,
		"type":               req.Type,
		"subtype":            req.Subtype,
		"title":              req.Title,
		"description":        req.Description,
		"credibility_score":  credScore,
		"credibility_reason": credReason,
		"position":           req.Position,
		"rotation":           req.Rotation,
		"asset_type":         req.AssetType,
		"image_url":          req.ImageURL,
		"vlm_annotation":     nil,
		"metadata":           json.RawMessage("{}"),
		"stage_order":        1,
		"created_at":         now.Format(time.RFC3339),
	}

	result, err := h.db.Insert(r.Context(), "evidence", evidence)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create evidence: "+err.Error())
		return
	}

	// TODO: If imageURL is provided, trigger async VLM annotation via Gemini

	writeJSON(w, http.StatusCreated, result)
}

// ListEvidence handles GET /api/cases/{id}/evidence.
func (h *EvidenceHandler) ListEvidence(w http.ResponseWriter, r *http.Request) {
	caseID := chi.URLParam(r, "id")

	result, err := h.db.Query(r.Context(), "evidence", map[string]string{
		"case_id": "eq." + caseID,
		"order":   "stage_order.asc,created_at.asc",
	})
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list evidence: "+err.Error())
		return
	}

	writeJSON(w, http.StatusOK, result)
}

// UpdateEvidence handles PUT /api/evidence/{id}.
func (h *EvidenceHandler) UpdateEvidence(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var updates map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&updates); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	result, err := h.db.Update(r.Context(), "evidence", map[string]string{
		"id": "eq." + id,
	}, updates)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to update evidence: "+err.Error())
		return
	}

	writeJSON(w, http.StatusOK, result)
}

// DeleteEvidence handles DELETE /api/evidence/{id}.
func (h *EvidenceHandler) DeleteEvidence(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	err := h.db.Delete(r.Context(), "evidence", map[string]string{
		"id": "eq." + id,
	})
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to delete evidence: "+err.Error())
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// defaultCredibility returns a default credibility score and reason based on evidence type.
func defaultCredibility(evidenceType string) (float64, string) {
	switch evidenceType {
	case "physical":
		return 0.9, "Physical evidence - high default credibility"
	case "forensic":
		return 0.95, "Forensic evidence - very high default credibility"
	case "document":
		return 0.7, "Documentary evidence - moderate default credibility"
	case "image":
		return 0.6, "Image evidence - moderate default credibility, pending VLM analysis"
	default:
		return 0.5, "Unknown evidence type - neutral default credibility"
	}
}
