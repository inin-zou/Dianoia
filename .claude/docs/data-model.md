# Data Model

## Supabase Schema

### Core Entities

```sql
-- Cases: top-level container for an investigation
CREATE TABLE cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active', -- active, closed, archived
  marble_world_id TEXT, -- Marble iframe embed ID
  blueprint_data JSONB, -- 3D blueprint scene definition (Three.js compatible)
  room_description JSONB, -- VLM-generated room layout
  scale_factor FLOAT DEFAULT 1.0, -- Marble space -> blueprint space conversion
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Evidence: physical evidence, documents, images
CREATE TABLE evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- physical, forensic, document, image
  subtype TEXT, -- weapon, body, blood, fingerprint, clothing, etc.
  title TEXT NOT NULL,
  description TEXT,
  credibility_score FLOAT DEFAULT 0.8, -- 0.0 to 1.0
  credibility_reason TEXT, -- why this score
  position JSONB, -- {x, y, z} in blueprint space
  rotation JSONB, -- {x, y, z} euler angles
  asset_type TEXT, -- which pre-made 3D asset to render
  image_url TEXT, -- photo of evidence in Supabase Storage
  vlm_annotation JSONB, -- Gemini VLM analysis result
  metadata JSONB, -- flexible extra data
  stage_order INT DEFAULT 0, -- order in progressive reveal
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Witnesses: testimony from people
CREATE TABLE witnesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT, -- witness, victim_relative, suspect, officer
  statement TEXT NOT NULL,
  credibility_score FLOAT DEFAULT 0.5, -- lower default than physical evidence
  credibility_reason TEXT,
  position_during_event JSONB, -- where they claim to have been {x, y, z}
  observation_angle FLOAT, -- their viewing angle (affects reliability)
  corroborated_by UUID[], -- array of other witness IDs who confirm
  contradicted_by UUID[], -- array of evidence/witness IDs that contradict
  stage_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Hypotheses: ranked timeline theories
CREATE TABLE hypotheses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  rank INT NOT NULL, -- 1 = most probable
  probability FLOAT NOT NULL, -- 0.0 to 1.0
  title TEXT NOT NULL, -- short summary
  reasoning TEXT NOT NULL, -- LLM-generated explanation
  supporting_evidence UUID[], -- evidence IDs that support this
  contradicting_evidence UUID[], -- evidence IDs that weaken this
  timeline JSONB NOT NULL, -- array of timeline events (see below)
  stage_snapshot INT, -- which evidence stage produced this hypothesis
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Suspect Profiles: iterative composite images
CREATE TABLE suspect_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  name TEXT DEFAULT 'Unknown Suspect',
  description TEXT, -- verbal description from witness
  current_image_url TEXT, -- latest composite in Supabase Storage
  revision_history JSONB DEFAULT '[]', -- [{instruction, image_url, timestamp}]
  source_witness_id UUID REFERENCES witnesses(id),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Marble Scans: tracking scan assets
CREATE TABLE marble_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  world_id TEXT, -- Marble world identifier
  status TEXT DEFAULT 'processing', -- processing, ready, failed
  embed_url TEXT, -- iframe URL
  mesh_export_url TEXT, -- exported collider mesh
  splat_export_url TEXT, -- exported Gaussian splat
  rendered_views JSONB DEFAULT '[]', -- [{angle, image_url}]
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Timeline Event Schema (JSONB in hypotheses.timeline)

```json
[
  {
    "timestamp": "23:00",
    "actor": "suspect_1",
    "action": "enters_room",
    "position": {"x": 2.0, "y": 0, "z": 1.5},
    "description": "Suspect enters through east door",
    "evidence_refs": ["evidence_uuid_1"],
    "confidence": 0.85
  },
  {
    "timestamp": "23:02",
    "actor": "suspect_1",
    "action": "moves_to",
    "position": {"x": 5.0, "y": 0, "z": 3.0},
    "description": "Suspect approaches victim near the desk",
    "evidence_refs": ["evidence_uuid_2", "witness_uuid_1"],
    "confidence": 0.70
  }
]
```

### Blueprint Data Schema (JSONB in cases.blueprint_data)

```json
{
  "dimensions": {"width": 8.0, "depth": 5.0, "height": 3.0},
  "walls": [
    {"start": {"x": 0, "z": 0}, "end": {"x": 8, "z": 0}, "height": 3.0, "hasWindow": false},
    {"start": {"x": 8, "z": 0}, "end": {"x": 8, "z": 5}, "height": 3.0, "hasWindow": true}
  ],
  "doors": [
    {"position": {"x": 4, "z": 0}, "width": 1.0, "label": "east_door"}
  ],
  "furniture": [
    {"type": "desk", "position": {"x": 5, "y": 0, "z": 3}, "dimensions": {"w": 1.2, "d": 0.6, "h": 0.75}}
  ]
}
```

## Real-time Subscription Design

### Frontend subscribes to:

```typescript
// New/updated hypotheses for active case
supabase
  .channel('hypotheses')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'hypotheses',
    filter: `case_id=eq.${caseId}`
  }, handleHypothesisUpdate)

// Evidence VLM annotations completing
supabase
  .channel('evidence')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'evidence',
    filter: `case_id=eq.${caseId}`
  }, handleEvidenceUpdate)

// Marble scan status changes
supabase
  .channel('scans')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'marble_scans',
    filter: `case_id=eq.${caseId}`
  }, handleScanUpdate)

// Suspect profile image updates
supabase
  .channel('profiles')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'suspect_profiles',
    filter: `case_id=eq.${caseId}`
  }, handleProfileUpdate)
```

### Go backend triggers on:

- New row in `evidence` table -> run VLM annotation -> update evidence row
- `stage_order` change or manual trigger -> run reasoning pipeline -> write hypotheses
- New `suspect_profiles` row with description -> call NanoBanana -> update image_url
- New `marble_scans` row -> poll Marble API -> update status and export URLs

## Supabase Storage Buckets

```
evidence-images/     -- uploaded crime scene photos
marble-exports/      -- exported meshes, splats
rendered-views/      -- Marble scene renders for VLM
suspect-composites/  -- NanoBanana generated images
case-reports/        -- generated PDF reports (future)
```

## Credibility Model

Default credibility scores by evidence type:

| Type | Default Score | Rationale |
|------|--------------|-----------|
| Physical evidence (weapon, blood, body) | 0.9 | Most reliable, objective |
| Forensic report | 0.85 | Expert analysis, but can have errors |
| Document/record | 0.8 | Verifiable but may be incomplete |
| Video/photo evidence | 0.75 | Can be misleading without context |
| Single witness testimony | 0.5 | Subjective, influenced by perspective |
| Corroborated witness (2+) | 0.65 | Multiple sources increase reliability |
| Contradicted witness | 0.2 | Flagged for review |

Credibility adjustments:
- Witness corroboration: +0.15 per corroborating witness (cap at 0.75)
- Physical evidence contradiction: -0.3 to conflicting testimony
- Witness angle/distance penalty: -0.1 if poor observation conditions
- These are initial heuristics; Gemini reasoning considers them as context, not hard rules
