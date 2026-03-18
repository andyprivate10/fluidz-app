-- Add public visibility toggle for session discovery
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS approx_lat double precision;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS approx_lng double precision;
CREATE INDEX IF NOT EXISTS idx_sessions_public ON sessions(is_public, status) WHERE is_public = true AND status = 'open';
