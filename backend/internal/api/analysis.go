package api

import (
	"encoding/json"
	"log"
	"net/http"

	"dianoia/internal/gemini"
	"dianoia/internal/service"
	"dianoia/internal/supabase"
	"dianoia/internal/types"

	"github.com/go-chi/chi/v5"
)

// AnalysisHandler handles reasoning/analysis endpoints.
type AnalysisHandler struct {
	db               *supabase.Client
	gemini           *gemini.Client
	reasoningService *service.ReasoningService
}

// NewAnalysisHandler creates a new AnalysisHandler.
func NewAnalysisHandler(db *supabase.Client, geminiClient *gemini.Client) *AnalysisHandler {
	var rs *service.ReasoningService
	if geminiClient != nil {
		rs = service.NewReasoningService(db, geminiClient)
	}
	return &AnalysisHandler{
		db:               db,
		gemini:           geminiClient,
		reasoningService: rs,
	}
}

// CaseRoutes returns the chi router for /api/cases/{id}/analyze and /api/cases/{id}/hypotheses.
func (h *AnalysisHandler) CaseRoutes() chi.Router {
	r := chi.NewRouter()
	r.Post("/analyze", h.Analyze)
	r.Get("/hypotheses", h.ListHypotheses)
	r.Delete("/hypotheses", h.ClearHypotheses)
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

	if h.reasoningService == nil {
		writeError(w, http.StatusServiceUnavailable, "Gemini client not configured -- analysis pipeline unavailable")
		return
	}

	// Parse request body; default upToStage to 999 (all stages)
	var req types.AnalyzeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		// If body is empty or malformed, use defaults
		req.UpToStage = 999
	}
	if req.UpToStage <= 0 {
		req.UpToStage = 999
	}

	log.Printf("[Analysis] Triggering reasoning pipeline for case %s (upToStage=%d)", caseID, req.UpToStage)

	// Run the reasoning pipeline
	hypotheses, err := h.reasoningService.GenerateHypotheses(r.Context(), caseID, req.UpToStage)
	if err != nil {
		log.Printf("[Analysis] Reasoning pipeline failed for case %s: %v", caseID, err)
		writeError(w, http.StatusInternalServerError, "reasoning pipeline failed: "+err.Error())
		return
	}

	log.Printf("[Analysis] Successfully generated %d hypotheses for case %s", len(hypotheses), caseID)

	// Return the hypotheses
	response := types.AnalyzeResponse{
		Hypotheses: hypotheses,
	}
	writeJSON(w, http.StatusOK, response)
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

// ClearHypotheses handles DELETE /api/cases/{id}/hypotheses.
// Deletes all hypotheses for a given case.
func (h *AnalysisHandler) ClearHypotheses(w http.ResponseWriter, r *http.Request) {
	caseID := chi.URLParam(r, "id")

	err := h.db.Delete(r.Context(), "hypotheses", map[string]string{
		"case_id": "eq." + caseID,
	})
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to clear hypotheses: "+err.Error())
		return
	}

	log.Printf("[Analysis] Cleared all hypotheses for case %s", caseID)
	w.WriteHeader(http.StatusNoContent)
}
