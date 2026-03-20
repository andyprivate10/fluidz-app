-- Ghost Sessions 24h
-- Table pour stocker les profils ghost temporaires (24h)
CREATE TABLE IF NOT EXISTS ghost_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_code text NOT NULL UNIQUE,  -- 6 chars alphanumeric (ex: X7K9M2)
  secret_pin text NOT NULL,           -- 4 digits choisis par le ghost (ex: 1337)
  display_name text NOT NULL DEFAULT 'Invité',
  profile_json jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  claimed_user_id uuid REFERENCES auth.users(id),  -- set when ghost converts to account
  is_expired boolean NOT NULL DEFAULT false
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_ghost_sessions_code ON ghost_sessions(session_code);
CREATE INDEX IF NOT EXISTS idx_ghost_sessions_expires ON ghost_sessions(expires_at) WHERE NOT is_expired;

-- RLS policies
ALTER TABLE ghost_sessions ENABLE ROW LEVEL SECURITY;

-- Anyone can create a ghost session (no auth required)
do $$ begin
CREATE POLICY "Anyone can create ghost session" ON ghost_sessions
  FOR INSERT WITH CHECK (true);
exception when duplicate_object then null; end $$;

-- Anyone can read a ghost session by code (for recovery)
do $$ begin
CREATE POLICY "Anyone can read ghost session by code" ON ghost_sessions
  FOR SELECT USING (true);
exception when duplicate_object then null; end $$;

-- Ghost can update their own session (for profile updates)
do $$ begin
CREATE POLICY "Anyone can update ghost session" ON ghost_sessions
  FOR UPDATE USING (true) WITH CHECK (true);
exception when duplicate_object then null; end $$;

-- Add ghost_session_id to applications for ghost candidates
ALTER TABLE applications ADD COLUMN IF NOT EXISTS ghost_session_id uuid REFERENCES ghost_sessions(id);
