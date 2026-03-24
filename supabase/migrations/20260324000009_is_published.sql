ALTER TABLE sessions ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT true;
