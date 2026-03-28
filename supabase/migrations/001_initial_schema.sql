-- =============================================================================
-- Dianoia: Initial Schema Migration
-- Crime Scene Investigation Platform
-- =============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1. TABLES
-- =============================================================================

-- Cases: top-level container for an investigation
CREATE TABLE IF NOT EXISTS cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
  marble_world_id TEXT,
  blueprint_data JSONB,
  room_description JSONB,
  scale_factor FLOAT DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Evidence: physical evidence, documents, images
CREATE TABLE IF NOT EXISTS evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('physical', 'forensic', 'document', 'image')),
  subtype TEXT,
  title TEXT NOT NULL,
  description TEXT,
  credibility_score FLOAT DEFAULT 0.8 CHECK (credibility_score >= 0.0 AND credibility_score <= 1.0),
  credibility_reason TEXT,
  position JSONB,
  rotation JSONB,
  asset_type TEXT,
  image_url TEXT,
  vlm_annotation JSONB,
  metadata JSONB DEFAULT '{}',
  stage_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Witnesses: testimony from people
CREATE TABLE IF NOT EXISTS witnesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  role TEXT CHECK (role IN ('witness', 'victim_relative', 'suspect', 'officer')),
  statement TEXT NOT NULL,
  credibility_score FLOAT DEFAULT 0.5 CHECK (credibility_score >= 0.0 AND credibility_score <= 1.0),
  credibility_reason TEXT,
  position_during_event JSONB,
  observation_angle FLOAT,
  corroborated_by UUID[] DEFAULT '{}',
  contradicted_by UUID[] DEFAULT '{}',
  stage_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Hypotheses: ranked timeline theories
CREATE TABLE IF NOT EXISTS hypotheses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE NOT NULL,
  rank INT NOT NULL,
  probability FLOAT NOT NULL CHECK (probability >= 0.0 AND probability <= 1.0),
  title TEXT NOT NULL,
  reasoning TEXT NOT NULL,
  supporting_evidence UUID[] DEFAULT '{}',
  contradicting_evidence UUID[] DEFAULT '{}',
  timeline JSONB NOT NULL DEFAULT '[]',
  stage_snapshot INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Suspect Profiles: iterative composite images
CREATE TABLE IF NOT EXISTS suspect_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE NOT NULL,
  name TEXT DEFAULT 'Unknown Suspect',
  description TEXT,
  current_image_url TEXT,
  revision_history JSONB DEFAULT '[]',
  source_witness_id UUID REFERENCES witnesses(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Marble Scans: tracking scan assets
CREATE TABLE IF NOT EXISTS marble_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE NOT NULL,
  world_id TEXT,
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'failed')),
  embed_url TEXT,
  mesh_export_url TEXT,
  splat_export_url TEXT,
  rendered_views JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- 2. INDEXES for common queries
-- =============================================================================

-- Case ID lookups (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_evidence_case_id ON evidence(case_id);
CREATE INDEX IF NOT EXISTS idx_witnesses_case_id ON witnesses(case_id);
CREATE INDEX IF NOT EXISTS idx_hypotheses_case_id ON hypotheses(case_id);
CREATE INDEX IF NOT EXISTS idx_suspect_profiles_case_id ON suspect_profiles(case_id);
CREATE INDEX IF NOT EXISTS idx_marble_scans_case_id ON marble_scans(case_id);

-- Stage order for progressive reveal
CREATE INDEX IF NOT EXISTS idx_evidence_stage_order ON evidence(case_id, stage_order);
CREATE INDEX IF NOT EXISTS idx_witnesses_stage_order ON witnesses(case_id, stage_order);

-- Hypothesis ranking
CREATE INDEX IF NOT EXISTS idx_hypotheses_rank ON hypotheses(case_id, rank);
CREATE INDEX IF NOT EXISTS idx_hypotheses_stage ON hypotheses(case_id, stage_snapshot);

-- Marble scan status polling
CREATE INDEX IF NOT EXISTS idx_marble_scans_status ON marble_scans(case_id, status);

-- Cases by status
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);

-- =============================================================================
-- 3. UPDATED_AT TRIGGER
-- =============================================================================

-- Auto-update updated_at on cases
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_cases_updated_at
  BEFORE UPDATE ON cases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_suspect_profiles_updated_at
  BEFORE UPDATE ON suspect_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 4. ROW-LEVEL SECURITY (permissive for hackathon)
-- =============================================================================

-- Enable RLS on all tables but allow all operations via service role
-- For the hackathon, we use permissive policies so the anon key can read
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE witnesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE hypotheses ENABLE ROW LEVEL SECURITY;
ALTER TABLE suspect_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE marble_scans ENABLE ROW LEVEL SECURITY;

-- Allow all reads for anon (frontend reads via Supabase client)
CREATE POLICY "Allow public read on cases" ON cases FOR SELECT USING (true);
CREATE POLICY "Allow public read on evidence" ON evidence FOR SELECT USING (true);
CREATE POLICY "Allow public read on witnesses" ON witnesses FOR SELECT USING (true);
CREATE POLICY "Allow public read on hypotheses" ON hypotheses FOR SELECT USING (true);
CREATE POLICY "Allow public read on suspect_profiles" ON suspect_profiles FOR SELECT USING (true);
CREATE POLICY "Allow public read on marble_scans" ON marble_scans FOR SELECT USING (true);

-- Allow all writes for service_role (backend writes via service role key)
-- service_role bypasses RLS by default, but explicit policies for clarity
CREATE POLICY "Allow service insert on cases" ON cases FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service update on cases" ON cases FOR UPDATE USING (true);
CREATE POLICY "Allow service delete on cases" ON cases FOR DELETE USING (true);

CREATE POLICY "Allow service insert on evidence" ON evidence FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service update on evidence" ON evidence FOR UPDATE USING (true);
CREATE POLICY "Allow service delete on evidence" ON evidence FOR DELETE USING (true);

CREATE POLICY "Allow service insert on witnesses" ON witnesses FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service update on witnesses" ON witnesses FOR UPDATE USING (true);

CREATE POLICY "Allow service insert on hypotheses" ON hypotheses FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service update on hypotheses" ON hypotheses FOR UPDATE USING (true);

CREATE POLICY "Allow service insert on suspect_profiles" ON suspect_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service update on suspect_profiles" ON suspect_profiles FOR UPDATE USING (true);

CREATE POLICY "Allow service insert on marble_scans" ON marble_scans FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service update on marble_scans" ON marble_scans FOR UPDATE USING (true);

-- =============================================================================
-- 5. REAL-TIME PUBLICATION
-- =============================================================================

-- Enable real-time for tables the frontend subscribes to
-- (evidence, hypotheses, suspect_profiles, marble_scans)
ALTER PUBLICATION supabase_realtime ADD TABLE evidence;
ALTER PUBLICATION supabase_realtime ADD TABLE hypotheses;
ALTER PUBLICATION supabase_realtime ADD TABLE suspect_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE marble_scans;

-- =============================================================================
-- 6. STORAGE BUCKETS
-- =============================================================================

-- Create storage buckets for file uploads
-- Note: These use the Supabase storage API, which requires INSERT into storage.buckets
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('evidence-images', 'evidence-images', true),
  ('marble-exports', 'marble-exports', true),
  ('rendered-views', 'rendered-views', true),
  ('suspect-composites', 'suspect-composites', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to all storage buckets
CREATE POLICY "Public read evidence-images" ON storage.objects
  FOR SELECT USING (bucket_id = 'evidence-images');

CREATE POLICY "Public read marble-exports" ON storage.objects
  FOR SELECT USING (bucket_id = 'marble-exports');

CREATE POLICY "Public read rendered-views" ON storage.objects
  FOR SELECT USING (bucket_id = 'rendered-views');

CREATE POLICY "Public read suspect-composites" ON storage.objects
  FOR SELECT USING (bucket_id = 'suspect-composites');

-- Allow service role uploads (service_role bypasses RLS anyway,
-- but these policies allow anon uploads during hackathon if needed)
CREATE POLICY "Allow upload evidence-images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'evidence-images');

CREATE POLICY "Allow upload marble-exports" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'marble-exports');

CREATE POLICY "Allow upload rendered-views" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'rendered-views');

CREATE POLICY "Allow upload suspect-composites" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'suspect-composites');
