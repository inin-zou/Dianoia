package gemini

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"regexp"
	"runtime"
	"strings"
	"text/template"

	"dianoia/internal/types"

	"github.com/google/generative-ai-go/genai"
	"google.golang.org/api/option"
)

// Client wraps the Gemini API for VLM analysis, reasoning, blueprint generation, and profile refinement.
type Client struct {
	apiKey    string
	genClient *genai.Client
}

// NewClient creates a new Gemini client from environment variables.
func NewClient() (*Client, error) {
	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		return nil, fmt.Errorf("GEMINI_API_KEY not set")
	}

	ctx := context.Background()
	genClient, err := genai.NewClient(ctx, option.WithAPIKey(apiKey))
	if err != nil {
		return nil, fmt.Errorf("failed to create Gemini client: %w", err)
	}

	return &Client{
		apiKey:    apiKey,
		genClient: genClient,
	}, nil
}

// Close closes the underlying Gemini client.
func (c *Client) Close() error {
	if c.genClient != nil {
		return c.genClient.Close()
	}
	return nil
}

// promptsDir returns the absolute path to the prompts directory.
func promptsDir() string {
	// Get the directory of this source file at compile time
	_, filename, _, ok := runtime.Caller(0)
	if ok {
		// Go from internal/gemini/client.go -> ../../prompts/
		dir := filepath.Join(filepath.Dir(filename), "..", "..", "prompts")
		if _, err := os.Stat(dir); err == nil {
			return dir
		}
	}
	// Fallback: try relative paths from working directory
	candidates := []string{
		"prompts",
		"backend/prompts",
		"../prompts",
		"../../prompts",
	}
	for _, c := range candidates {
		if _, err := os.Stat(c); err == nil {
			abs, _ := filepath.Abs(c)
			return abs
		}
	}
	return "prompts"
}

// loadTemplate loads and parses a prompt template file.
func loadTemplate(name string) (*template.Template, error) {
	path := filepath.Join(promptsDir(), name)
	tmpl, err := template.ParseFiles(path)
	if err != nil {
		return nil, fmt.Errorf("failed to load template %s: %w", path, err)
	}
	return tmpl, nil
}

// stripMarkdownJSON removes ```json ... ``` fences from Gemini responses.
func stripMarkdownJSON(s string) string {
	// Remove ```json ... ``` wrapping
	re := regexp.MustCompile("(?s)^\\s*```(?:json)?\\s*\n?(.*?)\\s*```\\s*$")
	if matches := re.FindStringSubmatch(s); len(matches) > 1 {
		return strings.TrimSpace(matches[1])
	}
	return strings.TrimSpace(s)
}

// extractResponseText extracts text content from a Gemini response.
func extractResponseText(resp *genai.GenerateContentResponse) (string, error) {
	if resp == nil || len(resp.Candidates) == 0 {
		return "", fmt.Errorf("empty response from Gemini")
	}

	candidate := resp.Candidates[0]
	if candidate.Content == nil || len(candidate.Content.Parts) == 0 {
		return "", fmt.Errorf("no content parts in Gemini response")
	}

	var textParts []string
	for _, part := range candidate.Content.Parts {
		if text, ok := part.(genai.Text); ok {
			textParts = append(textParts, string(text))
		}
	}

	if len(textParts) == 0 {
		return "", fmt.Errorf("no text parts in Gemini response")
	}

	return strings.Join(textParts, ""), nil
}

// GenerateHypotheses sends evidence, witnesses, and blueprint data to Gemini for reasoning.
// Returns a ranked list of hypotheses with timelines.
func (c *Client) GenerateHypotheses(ctx context.Context, evidence []types.Evidence, witnesses []types.Witness, blueprint types.BlueprintData) ([]types.Hypothesis, error) {
	// 1. Load the reasoning prompt template
	tmpl, err := loadTemplate("reasoning.tmpl")
	if err != nil {
		return nil, fmt.Errorf("loading reasoning template: %w", err)
	}

	// 2. Marshal data to JSON for template variables
	blueprintJSON, err := json.MarshalIndent(blueprint, "", "  ")
	if err != nil {
		return nil, fmt.Errorf("marshaling blueprint: %w", err)
	}

	evidenceJSON, err := json.MarshalIndent(evidence, "", "  ")
	if err != nil {
		return nil, fmt.Errorf("marshaling evidence: %w", err)
	}

	witnessesJSON, err := json.MarshalIndent(witnesses, "", "  ")
	if err != nil {
		return nil, fmt.Errorf("marshaling witnesses: %w", err)
	}

	// 3. Fill in template
	var promptBuf bytes.Buffer
	err = tmpl.Execute(&promptBuf, map[string]string{
		"Blueprint":          string(blueprintJSON),
		"Evidence":           string(evidenceJSON),
		"Witnesses":          string(witnessesJSON),
		"ExistingHypotheses": "", // empty on first run
	})
	if err != nil {
		return nil, fmt.Errorf("executing reasoning template: %w", err)
	}

	// 4. Send to Gemini
	model := c.genClient.GenerativeModel("gemini-2.0-flash")
	model.SystemInstruction = genai.NewUserContent(genai.Text("You are a forensic analyst. Output ONLY valid JSON. No markdown fences, no explanations, no extra text."))
	model.SetTemperature(0.7)
	model.SetTopP(0.9)

	log.Printf("[Gemini] Sending reasoning prompt (%d bytes) for %d evidence items, %d witnesses",
		promptBuf.Len(), len(evidence), len(witnesses))

	resp, err := model.GenerateContent(ctx, genai.Text(promptBuf.String()))
	if err != nil {
		return nil, fmt.Errorf("gemini GenerateContent failed: %w", err)
	}

	// 5. Extract and parse the response
	responseText, err := extractResponseText(resp)
	if err != nil {
		return nil, fmt.Errorf("extracting Gemini response: %w", err)
	}

	// Strip markdown JSON fences if present
	cleanJSON := stripMarkdownJSON(responseText)

	log.Printf("[Gemini] Received reasoning response (%d bytes)", len(cleanJSON))

	// 6. Parse JSON into hypotheses
	var hypotheses []types.Hypothesis
	if err := json.Unmarshal([]byte(cleanJSON), &hypotheses); err != nil {
		// Log the raw response for debugging
		log.Printf("[Gemini] Failed to parse response as []Hypothesis. Raw response:\n%s", cleanJSON)
		return nil, fmt.Errorf("parsing Gemini hypothesis response: %w", err)
	}

	if len(hypotheses) == 0 {
		return nil, fmt.Errorf("Gemini returned zero hypotheses")
	}

	log.Printf("[Gemini] Generated %d hypotheses", len(hypotheses))

	return hypotheses, nil
}

// AnalyzeImage sends an image (or text description) to Gemini VLM for evidence annotation.
// Returns a VLMAnnotation describing the contents and forensic significance.
func (c *Client) AnalyzeImage(ctx context.Context, imageURL string, prompt string) (types.VLMAnnotation, error) {
	model := c.genClient.GenerativeModel("gemini-2.0-flash")
	model.SystemInstruction = genai.NewUserContent(genai.Text("You are a forensic evidence analyst. Analyze the provided evidence and output ONLY valid JSON. No markdown fences."))
	model.SetTemperature(0.3)

	vlmPrompt := fmt.Sprintf(`Analyze this piece of evidence for a crime scene investigation.

Evidence description: %s

Output a JSON object with exactly these fields:
{
  "description": "<detailed description of the evidence>",
  "significance": "<forensic significance and what this might indicate>",
  "suggestedPosition": null,
  "relatedEvidence": [],
  "confidence": <number 0.0-1.0 indicating how confident you are in your analysis>
}`, prompt)

	log.Printf("[Gemini] Sending VLM annotation request for evidence: %.80s...", prompt)

	resp, err := model.GenerateContent(ctx, genai.Text(vlmPrompt))
	if err != nil {
		return types.VLMAnnotation{}, fmt.Errorf("gemini AnalyzeImage failed: %w", err)
	}

	responseText, err := extractResponseText(resp)
	if err != nil {
		return types.VLMAnnotation{}, fmt.Errorf("extracting VLM response: %w", err)
	}

	cleanJSON := stripMarkdownJSON(responseText)

	var annotation types.VLMAnnotation
	if err := json.Unmarshal([]byte(cleanJSON), &annotation); err != nil {
		log.Printf("[Gemini] Failed to parse VLM response. Raw:\n%s", cleanJSON)
		return types.VLMAnnotation{}, fmt.Errorf("parsing VLM annotation response: %w", err)
	}

	log.Printf("[Gemini] VLM annotation generated with confidence %.2f", annotation.Confidence)

	return annotation, nil
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
