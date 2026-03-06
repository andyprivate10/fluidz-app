-- Add lineup_json for directions and other session lineup data
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS lineup_json jsonb DEFAULT '{}';
