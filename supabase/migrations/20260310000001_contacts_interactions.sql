-- Contacts (Naughty Book)
CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  contact_user_id uuid NOT NULL,
  relation_level text NOT NULL DEFAULT 'connaissance' CHECK (relation_level IN ('connaissance', 'close', 'favori')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, contact_user_id)
);

CREATE INDEX IF NOT EXISTS idx_contacts_user ON contacts(user_id);
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

do $$ begin
CREATE POLICY "Users can manage own contacts" ON contacts
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
exception when duplicate_object then null; end $$;

-- Interaction Log (automatic tracking)
CREATE TABLE IF NOT EXISTS interaction_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  target_user_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('co_event', 'dm', 'added_contact', 'relation_change', 'voted')),
  meta jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_interaction_log_user ON interaction_log(user_id, target_user_id);
ALTER TABLE interaction_log ENABLE ROW LEVEL SECURITY;

do $$ begin
CREATE POLICY "Users can read own interactions" ON interaction_log
  FOR SELECT USING (user_id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
CREATE POLICY "Users can insert own interactions" ON interaction_log
  FOR INSERT WITH CHECK (user_id = auth.uid());
exception when duplicate_object then null; end $$;
