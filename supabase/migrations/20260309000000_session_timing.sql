-- Phase 9: Session timing — starts_at, ends_at, max_capacity
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS starts_at timestamptz;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS ends_at timestamptz;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS max_capacity integer;
