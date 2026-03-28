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

// CasesHandler handles all /api/cases endpoints.
type CasesHandler struct {
	db *supabase.Client
}

// NewCasesHandler creates a new CasesHandler.
func NewCasesHandler(db *supabase.Client) *CasesHandler {
	return &CasesHandler{db: db}
}

// Routes returns the chi router for case endpoints.
func (h *CasesHandler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Post("/", h.CreateCase)
	r.Get("/", h.ListCases)
	r.Get("/{id}", h.GetCase)
	r.Put("/{id}", h.UpdateCase)
	return r
}

// CreateCase handles POST /api/cases.
func (h *CasesHandler) CreateCase(w http.ResponseWriter, r *http.Request) {
	var req types.CreateCaseRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.Title == "" {
		writeError(w, http.StatusBadRequest, "title is required")
		return
	}

	now := time.Now().UTC()
	c := map[string]interface{}{
		"id":              uuid.New().String(),
		"title":           req.Title,
		"description":     req.Description,
		"status":          "active",
		"marble_world_id": nil,
		"blueprint_data":  nil,
		"room_description": nil,
		"scale_factor":    1.0,
		"created_at":      now.Format(time.RFC3339),
		"updated_at":      now.Format(time.RFC3339),
	}

	result, err := h.db.Insert(r.Context(), "cases", c)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create case: "+err.Error())
		return
	}

	writeJSON(w, http.StatusCreated, result)
}

// ListCases handles GET /api/cases.
func (h *CasesHandler) ListCases(w http.ResponseWriter, r *http.Request) {
	result, err := h.db.Query(r.Context(), "cases", map[string]string{
		"order": "created_at.desc",
	})
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list cases: "+err.Error())
		return
	}

	writeJSON(w, http.StatusOK, result)
}

// GetCase handles GET /api/cases/{id}.
func (h *CasesHandler) GetCase(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	result, err := h.db.QuerySingle(r.Context(), "cases", map[string]string{
		"id": "eq." + id,
	})
	if err != nil {
		writeError(w, http.StatusNotFound, "case not found: "+err.Error())
		return
	}

	writeJSON(w, http.StatusOK, result)
}

// UpdateCase handles PUT /api/cases/{id}.
func (h *CasesHandler) UpdateCase(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var updates map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&updates); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	updates["updated_at"] = time.Now().UTC().Format(time.RFC3339)

	result, err := h.db.Update(r.Context(), "cases", map[string]string{
		"id": "eq." + id,
	}, updates)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to update case: "+err.Error())
		return
	}

	writeJSON(w, http.StatusOK, result)
}
