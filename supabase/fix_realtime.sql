-- Supabase Realtime needs REPLICA IDENTITY FULL to send ALL columns in change events.
-- Without this, UPDATE payloads only contain the primary key + changed columns.
ALTER TABLE suspect_profiles REPLICA IDENTITY FULL;
ALTER TABLE evidence REPLICA IDENTITY FULL;
ALTER TABLE hypotheses REPLICA IDENTITY FULL;
ALTER TABLE marble_scans REPLICA IDENTITY FULL;
ALTER TABLE witnesses REPLICA IDENTITY FULL;
ALTER TABLE cases REPLICA IDENTITY FULL;
