-- Ephemeral Media (time + view limited content)
CREATE TABLE IF NOT EXISTS ephemeral_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id),
  media_url text NOT NULL,
  max_views smallint NOT NULL DEFAULT 3,
  max_duration_sec smallint NOT NULL DEFAULT 30,
  views_count smallint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  -- Context: where this media was shared
  context_type text NOT NULL DEFAULT 'dm' CHECK (context_type IN ('dm', 'group', 'candidate_pack', 'profile')),
  context_id uuid, -- session_id or null
  target_user_id uuid -- who can see it (null = anyone in context)
);

CREATE INDEX IF NOT EXISTS idx_ephemeral_media_owner ON ephemeral_media(owner_id);
CREATE INDEX IF NOT EXISTS idx_ephemeral_media_context ON ephemeral_media(context_type, context_id);
ALTER TABLE ephemeral_media ENABLE ROW LEVEL SECURITY;

-- Owner can manage their media
CREATE POLICY "Owner manages ephemeral media" ON ephemeral_media
  FOR ALL USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- Target user can view if views remaining
CREATE POLICY "Target can view ephemeral media" ON ephemeral_media
  FOR SELECT USING (target_user_id = auth.uid() OR target_user_id IS NULL);

-- Anyone can increment view count
CREATE POLICY "Anyone can increment views" ON ephemeral_media
  FOR UPDATE USING (true) WITH CHECK (true);
