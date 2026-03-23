-- Add cover_url and template_slug to sessions
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS cover_url TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS template_slug TEXT;
