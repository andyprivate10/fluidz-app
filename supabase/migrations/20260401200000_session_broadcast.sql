-- ═══ SESSION BROADCAST ANNOUNCEMENT ═══
-- Short live text that the host can edit during session
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS broadcast text DEFAULT '';
