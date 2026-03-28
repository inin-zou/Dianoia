package service

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"dianoia/internal/gemini"
	"dianoia/internal/supabase"
	"dianoia/internal/types"

	"github.com/google/uuid"
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
// 4. Writes hypotheses to Supabase (delete old, insert new)
func (s *ReasoningService) GenerateHypotheses(ctx context.Context, caseID string, upToStage int) ([]types.Hypothesis, error) {
	log.Printf("[Reasoning] Starting hypothesis generation for case %s (up to stage %d)", caseID, upToStage)

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
	log.Printf("[Reasoning] Fetched %d evidence items", len(evidence))

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
	log.Printf("[Reasoning] Fetched %d witnesses", len(witnesses))

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
	log.Printf("[Reasoning] Blueprint loaded (has data: %v)", caseData.BlueprintData != nil)

	// Call Gemini reasoning
	hypotheses, err := s.gemini.GenerateHypotheses(ctx, evidence, witnesses, blueprint)
	if err != nil {
		return nil, fmt.Errorf("gemini reasoning failed: %w", err)
	}

	// Delete old hypotheses for this case
	log.Printf("[Reasoning] Deleting old hypotheses for case %s", caseID)
	if err := s.db.Delete(ctx, "hypotheses", map[string]string{
		"case_id": "eq." + caseID,
	}); err != nil {
		log.Printf("[Reasoning] WARNING: Failed to delete old hypotheses: %v (continuing anyway)", err)
	}

	// Insert new hypotheses
	now := time.Now().UTC()
	for i := range hypotheses {
		hypotheses[i].ID = uuid.New().String()
		hypotheses[i].CaseID = caseID
		hypotheses[i].StageSnapshot = upToStage
		hypotheses[i].CreatedAt = now

		// Marshal timeline and evidence arrays for Supabase (JSONB columns)
		timelineJSON, err := json.Marshal(hypotheses[i].Timeline)
		if err != nil {
			log.Printf("[Reasoning] WARNING: Failed to marshal timeline for hypothesis %d: %v", i, err)
			timelineJSON = []byte("[]")
		}

		supportingJSON, err := json.Marshal(hypotheses[i].SupportingEvidence)
		if err != nil {
			supportingJSON = []byte("[]")
		}

		contradictingJSON, err := json.Marshal(hypotheses[i].ContradictingEvidence)
		if err != nil {
			contradictingJSON = []byte("[]")
		}

		// Build the row for Supabase (using snake_case column names)
		row := map[string]interface{}{
			"id":                     hypotheses[i].ID,
			"case_id":               hypotheses[i].CaseID,
			"rank":                  hypotheses[i].Rank,
			"probability":           hypotheses[i].Probability,
			"title":                 hypotheses[i].Title,
			"reasoning":             hypotheses[i].Reasoning,
			"supporting_evidence":   json.RawMessage(supportingJSON),
			"contradicting_evidence": json.RawMessage(contradictingJSON),
			"timeline":              json.RawMessage(timelineJSON),
			"stage_snapshot":        hypotheses[i].StageSnapshot,
			"created_at":            now.Format(time.RFC3339),
		}

		_, err = s.db.Insert(ctx, "hypotheses", row)
		if err != nil {
			log.Printf("[Reasoning] WARNING: Failed to insert hypothesis %d (%s): %v", i, hypotheses[i].Title, err)
			// Continue inserting remaining hypotheses
		} else {
			log.Printf("[Reasoning] Inserted hypothesis %d: %s (p=%.2f)", hypotheses[i].Rank, hypotheses[i].Title, hypotheses[i].Probability)
		}
	}

	log.Printf("[Reasoning] Pipeline complete: %d hypotheses generated and stored", len(hypotheses))

	return hypotheses, nil
}
