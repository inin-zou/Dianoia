package supabase

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
)

// Client wraps the Supabase PostgREST API using net/http.
type Client struct {
	baseURL    string
	serviceKey string
	httpClient *http.Client
}

// NewClient creates a new Supabase client from environment variables.
func NewClient() (*Client, error) {
	baseURL := os.Getenv("SUPABASE_URL")
	if baseURL == "" {
		return nil, fmt.Errorf("SUPABASE_URL not set")
	}
	serviceKey := os.Getenv("SUPABASE_SERVICE_ROLE_KEY")
	if serviceKey == "" {
		return nil, fmt.Errorf("SUPABASE_SERVICE_ROLE_KEY not set")
	}
	return &Client{
		baseURL:    strings.TrimRight(baseURL, "/"),
		serviceKey: serviceKey,
		httpClient: &http.Client{},
	}, nil
}

// restURL returns the PostgREST URL for a given table.
func (c *Client) restURL(table string) string {
	return fmt.Sprintf("%s/rest/v1/%s", c.baseURL, table)
}

// setHeaders adds standard Supabase headers to a request.
func (c *Client) setHeaders(req *http.Request) {
	req.Header.Set("apikey", c.serviceKey)
	req.Header.Set("Authorization", "Bearer "+c.serviceKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Prefer", "return=representation")
}

// Query performs a GET request against the PostgREST API.
// filters is a map of column=value pairs appended as query params.
// Use PostgREST operators in the value, e.g. "eq.some-id".
func (c *Client) Query(ctx context.Context, table string, filters map[string]string) (json.RawMessage, error) {
	url := c.restURL(table)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("creating request: %w", err)
	}
	c.setHeaders(req)

	q := req.URL.Query()
	for k, v := range filters {
		q.Set(k, v)
	}
	req.URL.RawQuery = q.Encode()

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("executing request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("reading response: %w", err)
	}

	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("supabase error (status %d): %s", resp.StatusCode, string(body))
	}

	return json.RawMessage(body), nil
}

// QuerySingle performs a GET request and returns a single row.
// It adds the "Accept: application/vnd.pgrst.object+json" header.
func (c *Client) QuerySingle(ctx context.Context, table string, filters map[string]string) (json.RawMessage, error) {
	url := c.restURL(table)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("creating request: %w", err)
	}
	c.setHeaders(req)
	req.Header.Set("Accept", "application/vnd.pgrst.object+json")

	q := req.URL.Query()
	for k, v := range filters {
		q.Set(k, v)
	}
	req.URL.RawQuery = q.Encode()

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("executing request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("reading response: %w", err)
	}

	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("supabase error (status %d): %s", resp.StatusCode, string(body))
	}

	return json.RawMessage(body), nil
}

// Insert performs a POST request to insert a row.
func (c *Client) Insert(ctx context.Context, table string, data interface{}) (json.RawMessage, error) {
	jsonData, err := json.Marshal(data)
	if err != nil {
		return nil, fmt.Errorf("marshaling data: %w", err)
	}

	url := c.restURL(table)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(jsonData))
	if err != nil {
		return nil, fmt.Errorf("creating request: %w", err)
	}
	c.setHeaders(req)
	req.Header.Set("Accept", "application/vnd.pgrst.object+json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("executing request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("reading response: %w", err)
	}

	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("supabase error (status %d): %s", resp.StatusCode, string(body))
	}

	return json.RawMessage(body), nil
}

// Update performs a PATCH request to update rows matching filters.
func (c *Client) Update(ctx context.Context, table string, filters map[string]string, data interface{}) (json.RawMessage, error) {
	jsonData, err := json.Marshal(data)
	if err != nil {
		return nil, fmt.Errorf("marshaling data: %w", err)
	}

	url := c.restURL(table)
	req, err := http.NewRequestWithContext(ctx, http.MethodPatch, url, bytes.NewReader(jsonData))
	if err != nil {
		return nil, fmt.Errorf("creating request: %w", err)
	}
	c.setHeaders(req)
	req.Header.Set("Accept", "application/vnd.pgrst.object+json")

	q := req.URL.Query()
	for k, v := range filters {
		q.Set(k, v)
	}
	req.URL.RawQuery = q.Encode()

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("executing request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("reading response: %w", err)
	}

	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("supabase error (status %d): %s", resp.StatusCode, string(body))
	}

	return json.RawMessage(body), nil
}

// Delete performs a DELETE request on rows matching filters.
func (c *Client) Delete(ctx context.Context, table string, filters map[string]string) error {
	url := c.restURL(table)
	req, err := http.NewRequestWithContext(ctx, http.MethodDelete, url, nil)
	if err != nil {
		return fmt.Errorf("creating request: %w", err)
	}
	c.setHeaders(req)

	q := req.URL.Query()
	for k, v := range filters {
		q.Set(k, v)
	}
	req.URL.RawQuery = q.Encode()

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("executing request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("supabase error (status %d): %s", resp.StatusCode, string(body))
	}

	return nil
}
