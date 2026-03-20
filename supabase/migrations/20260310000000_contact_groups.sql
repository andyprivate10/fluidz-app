-- Contact Groups (Listes de contacts)
CREATE TABLE IF NOT EXISTS contact_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id),
  name text NOT NULL,
  description text,
  color text DEFAULT '#F9A8A8',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_groups_owner ON contact_groups(owner_id);
ALTER TABLE contact_groups ENABLE ROW LEVEL SECURITY;

do $$ begin
CREATE POLICY "Owner manages groups" ON contact_groups
  FOR ALL USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
exception when duplicate_object then null; end $$;

-- Group members (link contacts to groups)
CREATE TABLE IF NOT EXISTS contact_group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES contact_groups(id) ON DELETE CASCADE,
  contact_user_id uuid NOT NULL,
  added_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(group_id, contact_user_id)
);

CREATE INDEX IF NOT EXISTS idx_contact_group_members_group ON contact_group_members(group_id);
ALTER TABLE contact_group_members ENABLE ROW LEVEL SECURITY;

-- Members readable/writable only by group owner
do $$ begin
CREATE POLICY "Group owner manages members" ON contact_group_members
  FOR ALL USING (
    group_id IN (SELECT id FROM contact_groups WHERE owner_id = auth.uid())
  ) WITH CHECK (
    group_id IN (SELECT id FROM contact_groups WHERE owner_id = auth.uid())
  );
exception when duplicate_object then null; end $$;
