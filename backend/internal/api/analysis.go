package api

import (
	"encoding/json"
	"net/http"

	"dianoia/internal/gemini"
	"dianoia/internal/supabase"
	"dianoia/internal/types"

	"github.com/go-chi/chi/v5"
)

// AnalysisHandler handles reasoning/analysis endpoints.
type AnalysisHandler struct {
	db     *supabase.Client
	gemini *gemini.Client
}

// NewAnalysisHandler creates a new AnalysisHandler.
func NewAnalysisHandler(db *supabase.Client, gemini *gemini.Client) *AnalysisHandler {
	return &AnalysisHandler{db: db, gemini: gemini}
}

// CaseRoutes returns the chi router for /api/cases/{id}/analyze and /api/cases/{id}/hypotheses.
func (h *AnalysisHandler) CaseRoutes() chi.Router {
	r := chi.NewRouter()
	r.Post("/analyze", h.Analyze)
	r.Get("/hypotheses", h.ListHypotheses)
	return r
}

// ItemRoutes returns the chi router for /api/hypotheses/{id}.
func (h *AnalysisHandler) ItemRoutes() chi.Router {
	r := chi.NewRouter()
	r.Get("/{id}", h.GetHypothesis)
	return r
}

// Analyze handles POST /api/cases/{id}/analyze.
// Triggers the reasoning pipeline for the current evidence stage.
func (h *AnalysisHandler) Analyze(w http.ResponseWriter, r *http.Request) {
	caseID := chi.URLParam(r, "id")

	var req types.AnalyzeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	// TODO: Implement full reasoning pipeline:
	// 1. Fetch all evidence and witnesses for this case from Supabase
	// 2. Fetch the blueprint data for this case
	// 3. Call Gemini reasoning to generate hypotheses
	// 4. Write hypotheses to Supabase
	// 5. Return the ranked hypotheses

	_ = caseID // Will be used when pipeline is implemented

	writeError(w, http.StatusNotImplemented, "analysis pipeline not yet implemented - Gemini integration pending")
}

// ListHypotheses handles GET /api/cases/{id}/hypotheses.
func (h *AnalysisHandler) ListHypotheses(w http.ResponseWriter, r *http.Request) {
	caseID := chi.URLParam(r, "id")

	result, err := h.db.Query(r.Context(), "hypotheses", map[string]string{
		"case_id": "eq." + caseID,
		"order":   "rank.asc",
	})
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list hypotheses: "+err.Error())
		return
	}

	writeJSON(w, http.StatusOK, result)
}

// GetHypothesis handles GET /api/hypotheses/{id}.
func (h *AnalysisHandler) GetHypothesis(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	result, err := h.db.QuerySingle(r.Context(), "hypotheses", map[string]string{
		"id": "eq." + id,
	})
	if err != nil {
		writeError(w, http.StatusNotFound, "hypothesis not found: "+err.Error())
		return
	}

	writeJSON(w, http.StatusOK, result)
}
