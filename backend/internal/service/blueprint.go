package service

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"dianoia/internal/gemini"
	"dianoia/internal/marble"
	"dianoia/internal/supabase"
	"dianoia/internal/types"
)

// BlueprintService handles the Marble scan to blueprint generation pipeline.
type BlueprintService struct {
	db     *supabase.Client
	marble *marble.Client
	gemini *gemini.Client
}

// NewBlueprintService creates a new BlueprintService.
func NewBlueprintService(db *supabase.Client, marble *marble.Client, gemini *gemini.Client) *BlueprintService {
	return &BlueprintService{db: db, marble: marble, gemini: gemini}
}

// StartScan initiates a Marble world generation from an image.
// Returns the scan ID for status polling.
func (s *BlueprintService) StartScan(ctx context.Context, caseID string, imageURL string, displayName string) (string, error) {
	// 1. Call Marble API to generate world
	operationID, err := s.marble.GenerateWorld(ctx, imageURL, displayName)
	if err != nil {
		return "", fmt.Errorf("marble generation failed: %w", err)
	}

	log.Printf("[BlueprintService] Marble operation started: %s", operationID)

	// 2. Create marble_scans row with processing status
	scan := map[string]interface{}{
		"case_id":          caseID,
		"world_id":         nil,
		"status":           "processing",
		"embed_url":        nil,
		"mesh_export_url":  nil,
		"splat_export_url": nil,
		"rendered_views":   json.RawMessage("[]"),
	}

	result, err := s.db.Insert(ctx, "marble_scans", scan)
	if err != nil {
		return "", fmt.Errorf("failed to create scan record: %w", err)
	}

	var scanRecord types.MarbleScan
	if err := json.Unmarshal(result, &scanRecord); err != nil {
		return "", fmt.Errorf("failed to parse scan record: %w", err)
	}

	// 3. Start background polling goroutine
	go s.pollAndUpdate(caseID, scanRecord.ID, operationID)

	return scanRecord.ID, nil
}

// pollAndUpdate polls the Marble operation until complete, then updates the scan record.
func (s *BlueprintService) pollAndUpdate(caseID, scanID, operationID string) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			log.Printf("[BlueprintService] Polling timed out for operation %s", operationID)
			s.updateScanStatus(scanID, "failed")
			return
		case <-ticker.C:
			world, done, err := s.marble.PollOperation(ctx, operationID)
			if err != nil {
				log.Printf("[BlueprintService] Poll error: %v", err)
				s.updateScanStatus(scanID, "failed")
				return
			}

			if !done {
				continue
			}

			if world == nil {
				log.Printf("[BlueprintService] Operation done but no world returned")
				s.updateScanStatus(scanID, "failed")
				return
			}

			log.Printf("[BlueprintService] World ready: %s", world.WorldID)

			// Update scan with world data
			updates := map[string]interface{}{
				"status":   "ready",
				"world_id": world.WorldID,
			}
			if world.EmbedURL != "" {
				updates["embed_url"] = world.EmbedURL
			}
			if world.Assets.Mesh.ColliderMeshURL != "" {
				updates["mesh_export_url"] = world.Assets.Mesh.ColliderMeshURL
			}
			if fullRes, ok := world.Assets.Splats.SpzURLs["full_res"]; ok && fullRes != "" {
				updates["splat_export_url"] = fullRes
			}

			bgCtx := context.Background()
			_, err = s.db.Update(bgCtx, "marble_scans", map[string]string{
				"id": "eq." + scanID,
			}, updates)
			if err != nil {
				log.Printf("[BlueprintService] Failed to update scan: %v", err)
				return
			}

			// Update case marble_world_id
			_, err = s.db.Update(bgCtx, "cases", map[string]string{
				"id": "eq." + caseID,
			}, map[string]interface{}{
				"marble_world_id": world.WorldID,
			})
			if err != nil {
				log.Printf("[BlueprintService] Failed to update case marble_world_id: %v", err)
			}

			return
		}
	}
}

// updateScanStatus updates just the status field.
func (s *BlueprintService) updateScanStatus(scanID, status string) {
	ctx := context.Background()
	_, err := s.db.Update(ctx, "marble_scans", map[string]string{
		"id": "eq." + scanID,
	}, map[string]interface{}{
		"status": status,
	})
	if err != nil {
		log.Printf("[BlueprintService] Failed to update scan status: %v", err)
	}
}

// GenerateBlueprintFromScan takes a completed Marble scan and generates a BlueprintData.
func (s *BlueprintService) GenerateBlueprintFromScan(ctx context.Context, caseID string) (*types.BlueprintData, error) {
	// 1. Get the latest ready scan for this case
	scanRaw, err := s.db.QuerySingle(ctx, "marble_scans", map[string]string{
		"case_id": "eq." + caseID,
		"status":  "eq.ready",
		"order":   "created_at.desc",
		"limit":   "1",
	})
	if err != nil {
		return nil, fmt.Errorf("no ready scan found: %w", err)
	}

	var scan types.MarbleScan
	if err := json.Unmarshal(scanRaw, &scan); err != nil {
		return nil, fmt.Errorf("failed to parse scan: %w", err)
	}

	// 2. Get pano URL from Marble world
	var roomDescription string
	if scan.WorldID != nil && *scan.WorldID != "" {
		world, err := s.marble.GetWorld(ctx, *scan.WorldID)
		if err != nil {
			log.Printf("[BlueprintService] Failed to get world: %v", err)
		} else if world.Assets.Imagery.PanoURL != "" {
			// 3. Send pano to Gemini VLM for room description
			annotation, err := s.gemini.AnalyzeImage(ctx, world.Assets.Imagery.PanoURL,
				"Analyze this panoramic image of a room for architectural layout extraction. Describe the room dimensions, walls, doors, windows, and furniture in detail.")
			if err != nil {
				log.Printf("[BlueprintService] VLM analysis failed: %v", err)
			} else {
				roomDescription = annotation.Description
			}
		}
	}

	if roomDescription == "" {
		roomDescription = "A standard room approximately 5m x 4m with a door on one wall."
	}

	// 4. Send room description to Gemini LLM for BlueprintData
	blueprint, err := s.gemini.GenerateBlueprint(ctx, roomDescription)
	if err != nil {
		return nil, fmt.Errorf("blueprint generation failed: %w", err)
	}

	// 5. Update the case with blueprint data
	blueprintJSON, err := json.Marshal(blueprint)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal blueprint: %w", err)
	}

	_, err = s.db.Update(ctx, "cases", map[string]string{
		"id": "eq." + caseID,
	}, map[string]interface{}{
		"blueprint_data": json.RawMessage(blueprintJSON),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to update case with blueprint: %w", err)
	}

	return &blueprint, nil
}
