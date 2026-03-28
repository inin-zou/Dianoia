package service

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"time"

	"dianoia/internal/gemini"
	"dianoia/internal/supabase"
	"dianoia/internal/types"

	"github.com/google/uuid"
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

// mimeToExtension returns a file extension for the given MIME type.
func mimeToExtension(mimeType string) string {
	switch {
	case strings.Contains(mimeType, "png"):
		return "png"
	case strings.Contains(mimeType, "jpeg"), strings.Contains(mimeType, "jpg"):
		return "jpg"
	case strings.Contains(mimeType, "webp"):
		return "webp"
	default:
		return "png"
	}
}

// GenerateComposite creates an initial suspect composite from a description.
// It generates the image via Gemini, uploads to Supabase Storage, creates a
// suspect_profiles row, and returns the full profile.
func (s *ProfilingService) GenerateComposite(ctx context.Context, caseID string, name string, description string, sourceWitnessID *string) (*types.SuspectProfile, error) {
	if s.gemini == nil {
		return nil, fmt.Errorf("gemini client not initialized")
	}

	// 1. Generate composite image from description
	log.Printf("[Profiling] Generating composite for case=%s name=%q", caseID, name)
	imageBytes, mimeType, err := s.gemini.GenerateComposite(ctx, description)
	if err != nil {
		return nil, fmt.Errorf("generating composite image: %w", err)
	}

	// 2. Upload to Supabase Storage
	profileID := uuid.New().String()
	ext := mimeToExtension(mimeType)
	storagePath := fmt.Sprintf("%s/%s-v1.%s", caseID, profileID, ext)

	log.Printf("[Profiling] Uploading composite to storage: %s (%d bytes)", storagePath, len(imageBytes))
	publicURL, err := s.db.UploadFile(ctx, "suspect-composites", storagePath, imageBytes, mimeType)
	if err != nil {
		return nil, fmt.Errorf("uploading composite to storage: %w", err)
	}

	// 3. Create the profile row in Supabase
	now := time.Now().UTC()
	revision := types.ProfileRevision{
		Instruction: "Initial composite from witness description",
		ImageURL:    publicURL,
		Timestamp:   now.Format(time.RFC3339),
	}

	revisionJSON, err := json.Marshal([]types.ProfileRevision{revision})
	if err != nil {
		return nil, fmt.Errorf("marshaling revision history: %w", err)
	}

	profileRow := map[string]interface{}{
		"id":                profileID,
		"case_id":           caseID,
		"name":              name,
		"description":       description,
		"current_image_url": publicURL,
		"revision_history":  json.RawMessage(revisionJSON),
		"source_witness_id": sourceWitnessID,
		"metadata":          json.RawMessage("{}"),
		"created_at":        now.Format(time.RFC3339),
		"updated_at":        now.Format(time.RFC3339),
	}

	result, err := s.db.Insert(ctx, "suspect_profiles", profileRow)
	if err != nil {
		return nil, fmt.Errorf("inserting profile into database: %w", err)
	}

	// 4. Parse the result back into a SuspectProfile
	var profile types.SuspectProfile
	if err := json.Unmarshal(result, &profile); err != nil {
		return nil, fmt.Errorf("parsing created profile: %w", err)
	}

	log.Printf("[Profiling] Created profile %s with image at %s", profileID, publicURL)
	return &profile, nil
}

// RefineComposite takes an existing profile and applies a modification instruction.
// It fetches the current profile, generates a refined image, uploads it, and
// updates the profile row with the new image URL and revision history entry.
func (s *ProfilingService) RefineComposite(ctx context.Context, profileID string, instruction string) (*types.SuspectProfile, error) {
	if s.gemini == nil {
		return nil, fmt.Errorf("gemini client not initialized")
	}

	// 1. Fetch the current profile from Supabase
	log.Printf("[Profiling] Refining profile %s with instruction: %q", profileID, instruction)
	result, err := s.db.QuerySingle(ctx, "suspect_profiles", map[string]string{
		"id": "eq." + profileID,
	})
	if err != nil {
		return nil, fmt.Errorf("fetching profile %s: %w", profileID, err)
	}

	var profile types.SuspectProfile
	if err := json.Unmarshal(result, &profile); err != nil {
		return nil, fmt.Errorf("parsing profile %s: %w", profileID, err)
	}

	// 2. Generate refined composite image
	// We pass the original description as the "current image description" since
	// we can't send the actual image back with the legacy SDK text-only approach.
	imageBytes, mimeType, err := s.gemini.RefineComposite(ctx, profile.Description, instruction)
	if err != nil {
		return nil, fmt.Errorf("refining composite image: %w", err)
	}

	// 3. Upload new image to Supabase Storage
	revisionNum := len(profile.RevisionHistory) + 1
	ext := mimeToExtension(mimeType)
	storagePath := fmt.Sprintf("%s/%s-v%d.%s", profile.CaseID, profileID, revisionNum, ext)

	log.Printf("[Profiling] Uploading refined composite to storage: %s (%d bytes)", storagePath, len(imageBytes))
	publicURL, err := s.db.UploadFile(ctx, "suspect-composites", storagePath, imageBytes, mimeType)
	if err != nil {
		return nil, fmt.Errorf("uploading refined composite to storage: %w", err)
	}

	// 4. Append to revision history
	now := time.Now().UTC()
	newRevision := types.ProfileRevision{
		Instruction: instruction,
		ImageURL:    publicURL,
		Timestamp:   now.Format(time.RFC3339),
	}
	updatedHistory := append(profile.RevisionHistory, newRevision)

	revisionJSON, err := json.Marshal(updatedHistory)
	if err != nil {
		return nil, fmt.Errorf("marshaling updated revision history: %w", err)
	}

	// 5. Update the profile in Supabase
	updates := map[string]interface{}{
		"current_image_url": publicURL,
		"revision_history":  json.RawMessage(revisionJSON),
		"updated_at":        now.Format(time.RFC3339),
	}

	updatedResult, err := s.db.Update(ctx, "suspect_profiles", map[string]string{
		"id": "eq." + profileID,
	}, updates)
	if err != nil {
		return nil, fmt.Errorf("updating profile %s: %w", profileID, err)
	}

	var updatedProfile types.SuspectProfile
	if err := json.Unmarshal(updatedResult, &updatedProfile); err != nil {
		return nil, fmt.Errorf("parsing updated profile: %w", err)
	}

	log.Printf("[Profiling] Refined profile %s (revision %d) with image at %s", profileID, revisionNum, publicURL)
	return &updatedProfile, nil
}
