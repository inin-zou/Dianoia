-- =============================================================================
-- Dianoia: Seed Data — Riverside Park Homicide
-- =============================================================================

-- Fixed UUIDs (hex-only, valid format):
-- Case:     c0000000-0000-0000-0000-000000000001
-- Evidence: e0000000-0000-0000-0000-000000000001 .. 06
-- Witness:  a0000000-0000-0000-0000-000000000001 .. 03
-- Hypoth:   b0000000-0000-0000-0000-000000000001 .. 03
-- Profile:  d0000000-0000-0000-0000-000000000001

-- =============================================================================
-- 1. CASE
-- =============================================================================

INSERT INTO cases (id, title, description, status, blueprint_data, room_description, scale_factor)
VALUES (
  'c0000000-0000-0000-0000-000000000001',
  'Riverside Park Homicide',
  'Homicide investigation at 142 Riverside Drive, Apartment 3B. Victim found deceased in living room area.',
  'active',
  '{"dimensions":{"width":8.0,"depth":6.0,"height":3.0},"walls":[{"start":{"x":0,"z":0},"end":{"x":8,"z":0},"height":3.0,"hasWindow":false,"hasDoor":true},{"start":{"x":8,"z":0},"end":{"x":8,"z":6},"height":3.0,"hasWindow":true,"hasDoor":false},{"start":{"x":8,"z":6},"end":{"x":0,"z":6},"height":3.0,"hasWindow":false,"hasDoor":false},{"start":{"x":0,"z":6},"end":{"x":0,"z":0},"height":3.0,"hasWindow":true,"hasDoor":false}],"doors":[{"position":{"x":4,"z":0},"width":1.0,"label":"front_door"},{"position":{"x":8,"z":5},"width":0.8,"label":"back_exit"}],"windows":[{"position":{"x":8,"z":3},"width":1.5,"height":1.2,"wallIndex":1},{"position":{"x":0,"z":2},"width":1.2,"height":1.0,"wallIndex":3}],"furniture":[{"type":"desk","position":{"x":6,"y":0,"z":4},"dimensions":{"w":1.4,"d":0.7,"h":0.75},"label":"desk"},{"type":"sofa","position":{"x":2,"y":0,"z":4},"dimensions":{"w":2.0,"d":0.9,"h":0.8},"label":"sofa"},{"type":"table","position":{"x":4,"y":0,"z":2.5},"dimensions":{"w":1.0,"d":1.0,"h":0.45},"label":"coffee_table"},{"type":"bookshelf","position":{"x":1,"y":0,"z":0.5},"dimensions":{"w":1.5,"d":0.4,"h":1.8},"label":"bookshelf"}]}'::jsonb,
  '{"summary":"One-bedroom apartment, living room approximately 8m x 6m.","lighting":"Overhead light was on.","conditions":"No signs of forced entry at front door. Rear exit door shows scratch marks near lock."}'::jsonb,
  1.0
);

-- =============================================================================
-- 2. EVIDENCE
-- =============================================================================

-- Stage 0
INSERT INTO evidence (id, case_id, type, subtype, title, description, credibility_score, credibility_reason, position, rotation, asset_type, metadata, stage_order) VALUES
('e0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', 'physical', 'body', 'Victim Body Position', 'Victim found face-down near the coffee table. Estimated TOD: 20:30-21:30.', 0.9, 'Physical evidence - direct observation', '{"x":3.8,"y":0,"z":2.8}'::jsonb, '{"x":0,"y":45,"z":0}'::jsonb, 'body_outline', '{"estimatedTOD":"20:30-21:30"}'::jsonb, 0),
('e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'physical', 'weapon', 'Kitchen Knife', '8-inch serrated kitchen knife found 0.5m from victim. Partial fingerprint on handle.', 0.9, 'Physical evidence - weapon recovered at scene', '{"x":3.2,"y":0,"z":2.2}'::jsonb, '{"x":0,"y":120,"z":0}'::jsonb, 'knife', '{"length":"8 inches","fingerprint":"partial, right thumb"}'::jsonb, 0);

-- Stage 1
INSERT INTO evidence (id, case_id, type, subtype, title, description, credibility_score, credibility_reason, position, asset_type, metadata, stage_order) VALUES
('e0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'forensic', 'blood', 'Blood Spatter Analysis', 'Medium velocity spatter on east wall. Directional analysis indicates victim struck while facing desk area.', 0.85, 'Forensic expert analysis', '{"x":6.5,"y":1.2,"z":4.2}'::jsonb, 'blood_marker', '{"pattern":"medium velocity","direction":"east wall"}'::jsonb, 1),
('e0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000001', 'forensic', 'fingerprint', 'Fingerprint on Back Door Knob', 'Latent fingerprint on interior knob of back exit. Does not match victim.', 0.85, 'Forensic evidence - pending AFIS', '{"x":7.9,"y":1.0,"z":5.0}'::jsonb, 'fingerprint_marker', '{"location":"back exit interior knob","matchStatus":"pending"}'::jsonb, 1);

-- Stage 2
INSERT INTO evidence (id, case_id, type, subtype, title, description, credibility_score, credibility_reason, position, asset_type, metadata, stage_order) VALUES
('e0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'image', NULL, 'Security Camera Still', 'Frame capture from parking lot camera at 22:47. Figure in dark hoodie exiting via rear.', 0.75, 'Video evidence - face not visible', NULL, NULL, '{"cameraId":"LOT-CAM-03","timestamp":"22:47"}'::jsonb, 2),
('e0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 'document', NULL, 'Anonymous Tip Note', 'Handwritten note: "Ask about the argument last Tuesday. There was a third person. Check the back door."', 0.6, 'Anonymous unverified tip', NULL, 'document_marker', '{"receivedAt":"2026-03-28T08:15:00Z"}'::jsonb, 2);

-- =============================================================================
-- 3. WITNESSES
-- =============================================================================

INSERT INTO witnesses (id, case_id, name, role, statement, credibility_score, credibility_reason, position_during_event, observation_angle, corroborated_by, contradicted_by, stage_order) VALUES
('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Maria Chen', 'witness', 'I live next door in 3A. Around 8:30 PM I heard raised voices, two men arguing. Shouting lasted 10-15 minutes then a loud crash. I called 911 at about 9 PM. I saw an unfamiliar man in the hallway around 7 PM - tall, dark hoodie, scar on left cheek.', 0.65, 'Direct neighbor, corroborated by James Rodriguez', '{"x":-2.0,"y":0,"z":3.0}'::jsonb, NULL, ARRAY['a0000000-0000-0000-0000-000000000002']::uuid[], '{}'::uuid[], 1),
('a0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'James Rodriguez', 'witness', 'Walking my dog past the building around 8:45 PM. Heard a struggle from upper floor. Saw someone leave quickly through the back in a dark hoodie. Could not see face.', 0.65, 'Outside witness, corroborates Maria Chen timeline', '{"x":10.0,"y":0,"z":-5.0}'::jsonb, 35.0, ARRAY['a0000000-0000-0000-0000-000000000001']::uuid[], '{}'::uuid[], 1),
('a0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'Officer Davis', 'officer', 'Responded to 911 at 21:15. Arrived 21:22. Front door unlocked. Victim face-down near coffee table. No pulse. Back exit door ajar. No suspect on premises.', 0.8, 'Responding officer - trained observer', '{"x":4.0,"y":0,"z":-1.0}'::jsonb, 0.0, '{}'::uuid[], '{}'::uuid[], 0);

-- =============================================================================
-- 4. HYPOTHESES
-- =============================================================================

INSERT INTO hypotheses (id, case_id, rank, probability, title, reasoning, supporting_evidence, contradicting_evidence, timeline, stage_snapshot) VALUES
('b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 1, 0.65, 'Domestic dispute escalation', 'Evidence suggests an interpersonal conflict that escalated to fatal violence. Household knife indicates unplanned escalation. Neighbor confirms loud arguments. Blood spatter shows reactive confrontation near desk.', ARRAY['e0000000-0000-0000-0000-000000000001','e0000000-0000-0000-0000-000000000004','e0000000-0000-0000-0000-000000000002']::uuid[], ARRAY['e0000000-0000-0000-0000-000000000003']::uuid[], '[{"timestamp":"20:15","actor":"suspect_1","action":"enters_room","position":{"x":4,"y":0,"z":0},"description":"Suspect enters through front door","evidenceRefs":[],"confidence":0.7},{"timestamp":"20:30","actor":"suspect_1","action":"moves_to","position":{"x":6,"y":0,"z":4},"description":"Argument escalates near desk","evidenceRefs":["a0000000-0000-0000-0000-000000000001"],"confidence":0.75},{"timestamp":"20:40","actor":"suspect_1","action":"attacks","position":{"x":5,"y":0,"z":3.5},"description":"Physical confrontation, blunt force then stabbing","evidenceRefs":["e0000000-0000-0000-0000-000000000002","e0000000-0000-0000-0000-000000000001"],"confidence":0.8},{"timestamp":"20:45","actor":"suspect_1","action":"drops","position":{"x":3.2,"y":0,"z":2.2},"description":"Drops knife, moves toward rear exit","evidenceRefs":["e0000000-0000-0000-0000-000000000001"],"confidence":0.85},{"timestamp":"20:50","actor":"suspect_1","action":"flees","position":{"x":8,"y":0,"z":5},"description":"Flees through back exit","evidenceRefs":["e0000000-0000-0000-0000-000000000006","e0000000-0000-0000-0000-000000000003"],"confidence":0.7}]'::jsonb, 2),
('b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 2, 0.25, 'Robbery gone wrong', 'Fingerprint on back door and rear exit ajar suggest outsider entry. However no valuables missing and household knife inconsistent with prepared burglar.', ARRAY['e0000000-0000-0000-0000-000000000003','e0000000-0000-0000-0000-000000000006']::uuid[], ARRAY['e0000000-0000-0000-0000-000000000001','e0000000-0000-0000-0000-000000000004']::uuid[], '[{"timestamp":"20:20","actor":"suspect_1","action":"enters_room","position":{"x":8,"y":0,"z":5},"description":"Intruder enters through back exit","evidenceRefs":["e0000000-0000-0000-0000-000000000006"],"confidence":0.5},{"timestamp":"20:35","actor":"suspect_1","action":"interacts_with","position":{"x":5,"y":0,"z":3},"description":"Victim confronts intruder, struggle ensues","evidenceRefs":["e0000000-0000-0000-0000-000000000005"],"confidence":0.55},{"timestamp":"20:45","actor":"suspect_1","action":"flees","position":{"x":8,"y":0,"z":5},"description":"Intruder flees through rear exit","evidenceRefs":["e0000000-0000-0000-0000-000000000003"],"confidence":0.6}]'::jsonb, 2),
('b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 3, 0.10, 'Premeditated attack by third party', 'Limited evidence for premeditation. Anonymous tip mentions third person but improvised weapon and reactive spatter pattern make this least likely.', ARRAY['e0000000-0000-0000-0000-000000000004']::uuid[], ARRAY['e0000000-0000-0000-0000-000000000001','e0000000-0000-0000-0000-000000000002']::uuid[], '[{"timestamp":"20:30","actor":"suspect_1","action":"enters_room","position":{"x":8,"y":0,"z":5},"description":"Attacker enters through back door","evidenceRefs":["e0000000-0000-0000-0000-000000000006"],"confidence":0.35},{"timestamp":"20:40","actor":"suspect_1","action":"attacks","position":{"x":4,"y":0,"z":2.5},"description":"Strikes victim at coffee table","evidenceRefs":["e0000000-0000-0000-0000-000000000005"],"confidence":0.3}]'::jsonb, 2);

-- =============================================================================
-- 5. SUSPECT PROFILE
-- =============================================================================

INSERT INTO suspect_profiles (id, case_id, name, description, current_image_url, revision_history, source_witness_id, metadata) VALUES
('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Suspect Alpha', 'Male, 35-40, approximately 5''11". Dark hoodie. Scar on left cheek. Known associate of victim.', NULL, '[{"instruction":"Initial composite from Maria Chen description","imageUrl":"","timestamp":"2026-03-28T09:00:00Z"},{"instruction":"Refine with camera build estimate","imageUrl":"","timestamp":"2026-03-28T14:30:00Z"}]'::jsonb, 'a0000000-0000-0000-0000-000000000001', '{"priorRecord":"Misdemeanor assault (2019)","relationship":"Known associate"}'::jsonb);
