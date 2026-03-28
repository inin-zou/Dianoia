package gemini

import (
	"context"
	"fmt"
	"os"

	"dianoia/internal/types"
)

// Client wraps the Gemini API for VLM analysis, reasoning, blueprint generation, and profile refinement.
type Client struct {
	apiKey string
}

// NewClient creates a new Gemini client from environment variables.
func NewClient() (*Client, error) {
	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		return nil, fmt.Errorf("GEMINI_API_KEY not set")
	}
	return &Client{
		apiKey: apiKey,
	}, nil
}

// AnalyzeImage sends an image to Gemini VLM for evidence annotation.
// Returns a VLMAnnotation describing the image contents and forensic significance.
func (c *Client) AnalyzeImage(ctx context.Context, imageURL string, prompt string) (types.VLMAnnotation, error) {
	// TODO: Implement Gemini VLM call
	// 1. Load prompt template from prompts/vlm_evidence.tmpl
	// 2. Send image + prompt to Gemini vision endpoint
	// 3. Parse structured JSON response into VLMAnnotation
	return types.VLMAnnotation{}, fmt.Errorf("gemini AnalyzeImage not yet implemented")
}

// GenerateHypotheses sends evidence, witnesses, and blueprint data to Gemini for reasoning.
// Returns a ranked list of hypotheses with timelines.
func (c *Client) GenerateHypotheses(ctx context.Context, evidence []types.Evidence, witnesses []types.Witness, blueprint types.BlueprintData) ([]types.Hypothesis, error) {
	// TODO: Implement Gemini reasoning call
	// 1. Load prompt template from prompts/reasoning.tmpl
	// 2. Format evidence and witness data into prompt context
	// 3. Send to Gemini Pro for hypothesis generation
	// 4. Parse structured JSON response into []Hypothesis
	return nil, fmt.Errorf("gemini GenerateHypotheses not yet implemented")
}

// GenerateBlueprint takes a room description and generates structured BlueprintData.
func (c *Client) GenerateBlueprint(ctx context.Context, roomDescription string) (types.BlueprintData, error) {
	// TODO: Implement Gemini blueprint generation
	// 1. Load prompt template from prompts/blueprint.tmpl
	// 2. Send room description to Gemini
	// 3. Parse structured JSON response into BlueprintData
	return types.BlueprintData{}, fmt.Errorf("gemini GenerateBlueprint not yet implemented")
}

// RefineProfile takes a current composite image URL and a refinement instruction,
// returning the URL of the new composite image (via NanoBanana / Gemini Image API).
func (c *Client) RefineProfile(ctx context.Context, currentImageURL string, instruction string) (string, error) {
	// TODO: Implement NanoBanana / Gemini Flash 2.5 Image call
	// 1. Send current image + instruction
	// 2. Get refined composite image
	// 3. Upload to Supabase Storage
	// 4. Return new image URL
	return "", fmt.Errorf("gemini RefineProfile not yet implemented")
}
