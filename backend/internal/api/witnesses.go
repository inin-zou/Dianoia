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

// WitnessesHandler handles all witness-related endpoints.
type WitnessesHandler struct {
	db *supabase.Client
}

// NewWitnessesHandler creates a new WitnessesHandler.
func NewWitnessesHandler(db *supabase.Client) *WitnessesHandler {
	return &WitnessesHandler{db: db}
}

// CaseRoutes returns the chi router for /api/cases/{id}/witnesses endpoints.
func (h *WitnessesHandler) CaseRoutes() chi.Router {
	r := chi.NewRouter()
	r.Post("/", h.CreateWitness)
	r.Get("/", h.ListWitnesses)
	return r
}

// ItemRoutes returns the chi router for /api/witnesses/{id} endpoints.
func (h *WitnessesHandler) ItemRoutes() chi.Router {
	r := chi.NewRouter()
	r.Put("/{id}", h.UpdateWitness)
	return r
}

// CreateWitness handles POST /api/cases/{id}/witnesses.
func (h *WitnessesHandler) CreateWitness(w http.ResponseWriter, r *http.Request) {
	caseID := chi.URLParam(r, "id")

	var req types.CreateWitnessRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.Name == "" {
		writeError(w, http.StatusBadRequest, "name is required")
		return
	}

	// Default credibility based on role
	credScore, credReason := witnessCredibility(req.Role)

	now := time.Now().UTC()
	witness := map[string]interface{}{
		"id":                    uuid.New().String(),
		"case_id":               caseID,
		"name":                  req.Name,
		"role":                  req.Role,
		"statement":             req.Statement,
		"credibility_score":     credScore,
		"credibility_reason":    credReason,
		"position_during_event": req.PositionDuringEvent,
		"observation_angle":     req.ObservationAngle,
		"corroborated_by":       []string{},
		"contradicted_by":       []string{},
		"stage_order":           1,
		"created_at":            now.Format(time.RFC3339),
	}

	result, err := h.db.Insert(r.Context(), "witnesses", witness)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create witness: "+err.Error())
		return
	}

	writeJSON(w, http.StatusCreated, result)
}

// ListWitnesses handles GET /api/cases/{id}/witnesses.
func (h *WitnessesHandler) ListWitnesses(w http.ResponseWriter, r *http.Request) {
	caseID := chi.URLParam(r, "id")

	result, err := h.db.Query(r.Context(), "witnesses", map[string]string{
		"case_id": "eq." + caseID,
		"order":   "stage_order.asc,created_at.asc",
	})
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list witnesses: "+err.Error())
		return
	}

	writeJSON(w, http.StatusOK, result)
}

// UpdateWitness handles PUT /api/witnesses/{id}.
func (h *WitnessesHandler) UpdateWitness(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var updates map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&updates); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	result, err := h.db.Update(r.Context(), "witnesses", map[string]string{
		"id": "eq." + id,
	}, updates)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to update witness: "+err.Error())
		return
	}

	writeJSON(w, http.StatusOK, result)
}

// witnessCredibility returns a default credibility score based on witness role.
func witnessCredibility(role string) (float64, string) {
	switch role {
	case "officer":
		return 0.85, "Law enforcement officer - high default credibility"
	case "witness":
		return 0.6, "Civilian witness - moderate default credibility"
	case "victim_relative":
		return 0.5, "Victim relative - moderate credibility, potential emotional bias"
	case "suspect":
		return 0.3, "Suspect testimony - low default credibility"
	default:
		return 0.5, "Unknown role - neutral default credibility"
	}
}
