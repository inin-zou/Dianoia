package service

import (
	"context"
	"fmt"

	"dianoia/internal/gemini"
	"dianoia/internal/supabase"
)

// ProfilingService handles suspect composite generation and refinement.
type ProfilingService struct {
	db     *supabase.Client
	gemini *gemini.Client
}

// NewProfilingService creates a new ProfilingService.
func NewProfilingService(db *supabase.Client, gemini *gemini.Client) *ProfilingService {
	return &ProfilingService{db: db, gemini: gemini}
}

// GenerateComposite creates an initial suspect composite from a description.
func (s *ProfilingService) GenerateComposite(ctx context.Context, description string) (string, error) {
	// TODO: Implement NanoBanana / Gemini Image call
	// 1. Send description to image generation API
	// 2. Upload result to Supabase Storage
	// 3. Return the image URL
	return "", fmt.Errorf("composite generation not yet implemented")
}

// RefineComposite takes an existing composite and applies a modification instruction.
func (s *ProfilingService) RefineComposite(ctx context.Context, currentImageURL string, instruction string) (string, error) {
	newImageURL, err := s.gemini.RefineProfile(ctx, currentImageURL, instruction)
	if err != nil {
		return "", fmt.Errorf("profile refinement failed: %w", err)
	}
	return newImageURL, nil
}
