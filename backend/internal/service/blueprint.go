package service

import (
	"context"
	"encoding/json"
	"fmt"

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

	// 3. Start background polling (in production, use goroutine or job queue)
	// For now, store the operation ID for manual polling
	_ = operationID

	return scanRecord.ID, nil
}

// GenerateBlueprintFromScan takes a completed Marble scan and generates a BlueprintData.
func (s *BlueprintService) GenerateBlueprintFromScan(ctx context.Context, caseID string) (*types.BlueprintData, error) {
	// 1. Get the latest scan for this case
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

	// 2. TODO: Get panorama URL from Marble world assets
	// 3. Send to Gemini VLM for room description
	// 4. Send room description to Gemini LLM for BlueprintData

	blueprint, err := s.gemini.GenerateBlueprint(ctx, "Room description from VLM")
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
