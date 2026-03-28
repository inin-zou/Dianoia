package api

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"time"

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
// Accepts {"imageUrl": "..."} and triggers Marble world generation.
func (h *ScanHandler) StartScan(w http.ResponseWriter, r *http.Request) {
	caseID := chi.URLParam(r, "id")

	if h.marble == nil {
		writeError(w, http.StatusServiceUnavailable, "Marble client not initialized")
		return
	}

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

	// 1. Call Marble API to generate world from image
	operationID, err := h.marble.GenerateWorld(r.Context(), req.ImageURL, displayName)
	if err != nil {
		log.Printf("[Scan] Marble GenerateWorld failed: %v", err)
		writeError(w, http.StatusBadGateway, "failed to start Marble scan: "+err.Error())
		return
	}

	log.Printf("[Scan] Marble operation started: %s for case %s", operationID, caseID)

	// 2. Create marble_scans row with status "processing"
	scan := map[string]interface{}{
		"case_id":          caseID,
		"world_id":         nil,
		"status":           "processing",
		"embed_url":        nil,
		"mesh_export_url":  nil,
		"splat_export_url": nil,
		"rendered_views":   json.RawMessage("[]"),
	}

	result, err := h.db.Insert(r.Context(), "marble_scans", scan)
	if err != nil {
		log.Printf("[Scan] Failed to create scan record: %v", err)
		writeError(w, http.StatusInternalServerError, "failed to create scan record")
		return
	}

	var scanRecord types.MarbleScan
	if err := json.Unmarshal(result, &scanRecord); err != nil {
		log.Printf("[Scan] Failed to parse scan record: %v", err)
		writeError(w, http.StatusInternalServerError, "failed to parse scan record")
		return
	}

	log.Printf("[Scan] Created scan record %s for case %s", scanRecord.ID, caseID)

	// 3. Start background goroutine to poll for completion
	go h.pollScanCompletion(caseID, scanRecord.ID, operationID)

	// 4. Return scan ID and status
	writeJSON(w, http.StatusAccepted, map[string]interface{}{
		"scanId": scanRecord.ID,
		"status": "processing",
	})
}

// pollScanCompletion polls the Marble API until the operation is done or timeout.
func (h *ScanHandler) pollScanCompletion(caseID, scanID, operationID string) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	log.Printf("[Scan] Starting poll for operation %s (scan %s, case %s)", operationID, scanID, caseID)

	for {
		select {
		case <-ctx.Done():
			log.Printf("[Scan] Polling timed out for operation %s", operationID)
			h.updateScanStatus(scanID, "failed", nil)
			return
		case <-ticker.C:
			world, done, err := h.marble.PollOperation(ctx, operationID)
			if err != nil {
				log.Printf("[Scan] Poll error for operation %s: %v", operationID, err)
				h.updateScanStatus(scanID, "failed", nil)
				return
			}

			if !done {
				log.Printf("[Scan] Operation %s still processing...", operationID)
				continue
			}

			if world == nil {
				log.Printf("[Scan] Operation %s done but no world returned", operationID)
				h.updateScanStatus(scanID, "failed", nil)
				return
			}

			log.Printf("[Scan] Operation %s completed! World ID: %s", operationID, world.WorldID)

			// Update marble_scans with world data
			h.updateScanWithWorld(caseID, scanID, world)
			return
		}
	}
}

// updateScanWithWorld updates the marble_scans row and case with world data.
func (h *ScanHandler) updateScanWithWorld(caseID, scanID string, world *types.MarbleWorld) {
	ctx := context.Background()

	// Build update payload
	updates := map[string]interface{}{
		"status":   "ready",
		"world_id": world.WorldID,
	}

	// Set embed URL
	if world.EmbedURL != "" {
		updates["embed_url"] = world.EmbedURL
	}

	// Set mesh export URL
	if world.Assets.Mesh.ColliderMeshURL != "" {
		updates["mesh_export_url"] = world.Assets.Mesh.ColliderMeshURL
	}

	// Set splat export URL (use full_res if available)
	if fullRes, ok := world.Assets.Splats.SpzURLs["full_res"]; ok && fullRes != "" {
		updates["splat_export_url"] = fullRes
	}

	// Update marble_scans row
	_, err := h.db.Update(ctx, "marble_scans", map[string]string{
		"id": "eq." + scanID,
	}, updates)
	if err != nil {
		log.Printf("[Scan] Failed to update scan %s: %v", scanID, err)
		return
	}

	log.Printf("[Scan] Updated scan %s with world data", scanID)

	// Also update the case's marble_world_id
	_, err = h.db.Update(ctx, "cases", map[string]string{
		"id": "eq." + caseID,
	}, map[string]interface{}{
		"marble_world_id": world.WorldID,
	})
	if err != nil {
		log.Printf("[Scan] Failed to update case %s marble_world_id: %v", caseID, err)
		return
	}

	log.Printf("[Scan] Updated case %s marble_world_id to %s", caseID, world.WorldID)
}

// updateScanStatus updates just the status of a marble_scans row.
func (h *ScanHandler) updateScanStatus(scanID, status string, errMsg *string) {
	ctx := context.Background()
	updates := map[string]interface{}{
		"status": status,
	}
	_, err := h.db.Update(ctx, "marble_scans", map[string]string{
		"id": "eq." + scanID,
	}, updates)
	if err != nil {
		log.Printf("[Scan] Failed to update scan status for %s: %v", scanID, err)
	}
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
// Fetches the Marble scan pano, sends to Gemini VLM for room description,
// then generates BlueprintData JSON.
func (h *ScanHandler) GenerateBlueprint(w http.ResponseWriter, r *http.Request) {
	caseID := chi.URLParam(r, "id")

	if h.gemini == nil {
		writeError(w, http.StatusServiceUnavailable, "Gemini client not initialized")
		return
	}

	// 1. Get the latest ready marble_scan for this case
	scanRaw, err := h.db.QuerySingle(r.Context(), "marble_scans", map[string]string{
		"case_id": "eq." + caseID,
		"status":  "eq.ready",
		"order":   "created_at.desc",
		"limit":   "1",
	})
	if err != nil {
		writeError(w, http.StatusNotFound, "no ready scan found for case: "+err.Error())
		return
	}

	var scan types.MarbleScan
	if err := json.Unmarshal(scanRaw, &scan); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to parse scan: "+err.Error())
		return
	}

	// 2. Get the world from Marble to retrieve pano_url
	if scan.WorldID == nil || *scan.WorldID == "" {
		writeError(w, http.StatusBadRequest, "scan has no world ID")
		return
	}

	var panoURL string

	if h.marble != nil {
		world, err := h.marble.GetWorld(r.Context(), *scan.WorldID)
		if err != nil {
			log.Printf("[Blueprint] Failed to get world %s: %v", *scan.WorldID, err)
			// Fallback: proceed without pano, use a generic description
		} else {
			panoURL = world.Assets.Imagery.PanoURL
		}
	}

	// 3. Send pano to Gemini VLM for room description
	var roomDescription string
	if panoURL != "" {
		annotation, err := h.gemini.AnalyzeImage(r.Context(), panoURL, "Analyze this panoramic image of a room for architectural layout extraction. Describe the room dimensions, walls, doors, windows, and furniture in detail.")
		if err != nil {
			log.Printf("[Blueprint] VLM analysis failed: %v, using fallback description", err)
			roomDescription = "A standard room approximately 5m x 4m with a door on one wall."
		} else {
			roomDescription = annotation.Description
		}
	} else {
		roomDescription = "A standard room approximately 5m x 4m with a door on one wall."
	}

	log.Printf("[Blueprint] Room description: %.200s...", roomDescription)

	// 4. Send room description to Gemini LLM for BlueprintData JSON
	blueprint, err := h.gemini.GenerateBlueprint(r.Context(), roomDescription)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "blueprint generation failed: "+err.Error())
		return
	}

	// 5. Update the case with blueprint data
	blueprintJSON, err := json.Marshal(blueprint)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to marshal blueprint")
		return
	}

	_, err = h.db.Update(r.Context(), "cases", map[string]string{
		"id": "eq." + caseID,
	}, map[string]interface{}{
		"blueprint_data": json.RawMessage(blueprintJSON),
	})
	if err != nil {
		log.Printf("[Blueprint] Failed to update case: %v", err)
		writeError(w, http.StatusInternalServerError, "failed to save blueprint to case")
		return
	}

	log.Printf("[Blueprint] Blueprint generated and saved for case %s", caseID)

	writeJSON(w, http.StatusOK, blueprint)
}
