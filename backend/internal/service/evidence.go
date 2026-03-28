package service

import (
	"context"
	"fmt"

	"dianoia/internal/gemini"
	"dianoia/internal/supabase"
	"dianoia/internal/types"
)

// EvidenceService handles evidence business logic including VLM annotation.
type EvidenceService struct {
	db     *supabase.Client
	gemini *gemini.Client
}

// NewEvidenceService creates a new EvidenceService.
func NewEvidenceService(db *supabase.Client, gemini *gemini.Client) *EvidenceService {
	return &EvidenceService{db: db, gemini: gemini}
}

// AnnotateEvidence triggers VLM analysis on an evidence image.
// This is called asynchronously after evidence with an image is created.
func (s *EvidenceService) AnnotateEvidence(ctx context.Context, evidenceID string, imageURL string) error {
	annotation, err := s.gemini.AnalyzeImage(ctx, imageURL, "Analyze this crime scene evidence image")
	if err != nil {
		return fmt.Errorf("VLM analysis failed: %w", err)
	}

	_, err = s.db.Update(ctx, "evidence", map[string]string{
		"id": "eq." + evidenceID,
	}, map[string]interface{}{
		"vlm_annotation": annotation,
	})
	if err != nil {
		return fmt.Errorf("failed to update evidence with annotation: %w", err)
	}

	return nil
}

// ComputeCredibility recalculates credibility for evidence based on corroboration.
func (s *EvidenceService) ComputeCredibility(ctx context.Context, evidence types.Evidence, allEvidence []types.Evidence) (float64, string) {
	// TODO: Implement Bayesian credibility model
	// For now, return the existing score
	return evidence.CredibilityScore, evidence.CredibilityReason
}
