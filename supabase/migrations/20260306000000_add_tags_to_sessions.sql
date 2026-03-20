-- Add tags column to sessions table
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
