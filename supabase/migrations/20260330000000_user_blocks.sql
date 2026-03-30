-- User blocks (SO4: invisible mutuellement)
CREATE TABLE IF NOT EXISTS user_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker ON user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON user_blocks(blocked_id);

ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;

do $$ begin
CREATE POLICY "Users manage own blocks" ON user_blocks
  FOR ALL USING (blocker_id = auth.uid()) WITH CHECK (blocker_id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
CREATE POLICY "Users can see if they are blocked" ON user_blocks
  FOR SELECT USING (blocked_id = auth.uid());
exception when duplicate_object then null; end $$;
