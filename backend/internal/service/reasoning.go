package service

import (
	"context"
	"encoding/json"
	"fmt"

	"dianoia/internal/gemini"
	"dianoia/internal/supabase"
	"dianoia/internal/types"
)

// ReasoningService handles the hypothesis generation pipeline.
type ReasoningService struct {
	db     *supabase.Client
	gemini *gemini.Client
}

// NewReasoningService creates a new ReasoningService.
func NewReasoningService(db *supabase.Client, gemini *gemini.Client) *ReasoningService {
	return &ReasoningService{db: db, gemini: gemini}
}

// GenerateHypotheses runs the full reasoning pipeline for a case.
// 1. Fetches all evidence and witnesses up to the given stage
// 2. Fetches the blueprint data
// 3. Calls Gemini reasoning
// 4. Writes hypotheses to Supabase
func (s *ReasoningService) GenerateHypotheses(ctx context.Context, caseID string, upToStage int) ([]types.Hypothesis, error) {
	// Fetch evidence
	evidenceRaw, err := s.db.Query(ctx, "evidence", map[string]string{
		"case_id":     "eq." + caseID,
		"stage_order": "lte." + fmt.Sprintf("%d", upToStage),
		"order":       "stage_order.asc",
	})
	if err != nil {
		return nil, fmt.Errorf("failed to fetch evidence: %w", err)
	}

	var evidence []types.Evidence
	if err := json.Unmarshal(evidenceRaw, &evidence); err != nil {
		return nil, fmt.Errorf("failed to parse evidence: %w", err)
	}

	// Fetch witnesses
	witnessRaw, err := s.db.Query(ctx, "witnesses", map[string]string{
		"case_id":     "eq." + caseID,
		"stage_order": "lte." + fmt.Sprintf("%d", upToStage),
		"order":       "stage_order.asc",
	})
	if err != nil {
		return nil, fmt.Errorf("failed to fetch witnesses: %w", err)
	}

	var witnesses []types.Witness
	if err := json.Unmarshal(witnessRaw, &witnesses); err != nil {
		return nil, fmt.Errorf("failed to parse witnesses: %w", err)
	}

	// Fetch case blueprint
	caseRaw, err := s.db.QuerySingle(ctx, "cases", map[string]string{
		"id": "eq." + caseID,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to fetch case: %w", err)
	}

	var caseData types.Case
	if err := json.Unmarshal(caseRaw, &caseData); err != nil {
		return nil, fmt.Errorf("failed to parse case: %w", err)
	}

	blueprint := types.BlueprintData{}
	if caseData.BlueprintData != nil {
		blueprint = *caseData.BlueprintData
	}

	// Call Gemini reasoning
	hypotheses, err := s.gemini.GenerateHypotheses(ctx, evidence, witnesses, blueprint)
	if err != nil {
		return nil, fmt.Errorf("gemini reasoning failed: %w", err)
	}

	// TODO: Write hypotheses to Supabase
	// For each hypothesis, insert into hypotheses table

	return hypotheses, nil
}
