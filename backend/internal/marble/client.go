package marble

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"

	"dianoia/internal/types"
)

const (
	baseURL   = "https://api.worldlabs.ai"
	modelName = "Marble 0.1-mini"
)

// Client wraps the Marble (World Labs) API for 3D world generation.
type Client struct {
	apiKey     string
	httpClient *http.Client
}

// NewClient creates a new Marble client from environment variables.
func NewClient() (*Client, error) {
	apiKey := os.Getenv("MARBLE_API_KEY")
	if apiKey == "" {
		return nil, fmt.Errorf("MARBLE_API_KEY not set")
	}
	return &Client{
		apiKey:     apiKey,
		httpClient: &http.Client{},
	}, nil
}

// generateRequest is the body for POST /marble/v1/worlds:generate.
type generateRequest struct {
	DisplayName string      `json:"display_name"`
	Model       string      `json:"model"`
	WorldPrompt worldPrompt `json:"world_prompt"`
}

type worldPrompt struct {
	Type        string      `json:"type"`
	ImagePrompt imagePrompt `json:"image_prompt"`
	TextPrompt  string      `json:"text_prompt"`
}

type imagePrompt struct {
	Source string `json:"source"`
	URI    string `json:"uri"`
}

// generateResponse is the response from POST /marble/v1/worlds:generate.
type generateResponse struct {
	OperationID string `json:"operation_id"`
}

// operationResponse is the response from GET /marble/v1/operations/{operation_id}.
type operationResponse struct {
	Done   bool              `json:"done"`
	Result *types.MarbleWorld `json:"result,omitempty"`
	Error  *operationError   `json:"error,omitempty"`
}

type operationError struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

// GenerateWorld creates a new 3D world from an image URL.
// Returns the operation ID to poll for completion.
func (c *Client) GenerateWorld(ctx context.Context, imageURL string, displayName string) (string, error) {
	body := generateRequest{
		DisplayName: displayName,
		Model:       modelName,
		WorldPrompt: worldPrompt{
			Type: "image",
			ImagePrompt: imagePrompt{
				Source: "uri",
				URI:    imageURL,
			},
			TextPrompt: "Interior room crime scene",
		},
	}

	jsonBody, err := json.Marshal(body)
	if err != nil {
		return "", fmt.Errorf("marshaling request: %w", err)
	}

	url := baseURL + "/marble/v1/worlds:generate"
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(jsonBody))
	if err != nil {
		return "", fmt.Errorf("creating request: %w", err)
	}
	c.setHeaders(req)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("executing request: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("reading response: %w", err)
	}

	if resp.StatusCode >= 400 {
		return "", fmt.Errorf("marble API error (status %d): %s", resp.StatusCode, string(respBody))
	}

	var genResp generateResponse
	if err := json.Unmarshal(respBody, &genResp); err != nil {
		return "", fmt.Errorf("parsing response: %w", err)
	}

	return genResp.OperationID, nil
}

// PollOperation checks the status of a world generation operation.
// Returns the MarbleWorld if done, or (nil, false, nil) if still processing.
func (c *Client) PollOperation(ctx context.Context, operationID string) (*types.MarbleWorld, bool, error) {
	url := fmt.Sprintf("%s/marble/v1/operations/%s", baseURL, operationID)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, false, fmt.Errorf("creating request: %w", err)
	}
	c.setHeaders(req)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, false, fmt.Errorf("executing request: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, false, fmt.Errorf("reading response: %w", err)
	}

	if resp.StatusCode >= 400 {
		return nil, false, fmt.Errorf("marble API error (status %d): %s", resp.StatusCode, string(respBody))
	}

	var opResp operationResponse
	if err := json.Unmarshal(respBody, &opResp); err != nil {
		return nil, false, fmt.Errorf("parsing response: %w", err)
	}

	if opResp.Error != nil {
		return nil, true, fmt.Errorf("marble operation error: %s", opResp.Error.Message)
	}

	if !opResp.Done {
		return nil, false, nil
	}

	return opResp.Result, true, nil
}

// GetWorld retrieves a world by its ID.
func (c *Client) GetWorld(ctx context.Context, worldID string) (*types.MarbleWorld, error) {
	url := fmt.Sprintf("%s/marble/v1/worlds/%s", baseURL, worldID)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("creating request: %w", err)
	}
	c.setHeaders(req)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("executing request: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("reading response: %w", err)
	}

	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("marble API error (status %d): %s", resp.StatusCode, string(respBody))
	}

	var world types.MarbleWorld
	if err := json.Unmarshal(respBody, &world); err != nil {
		return nil, fmt.Errorf("parsing response: %w", err)
	}

	return &world, nil
}

// setHeaders adds the Marble API auth header.
func (c *Client) setHeaders(req *http.Request) {
	req.Header.Set("WLT-Api-Key", c.apiKey)
	req.Header.Set("Content-Type", "application/json")
}
