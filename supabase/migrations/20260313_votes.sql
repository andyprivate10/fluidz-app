CREATE TABLE IF NOT EXISTS votes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid REFERENCES sessions(id),
  application_id uuid REFERENCES applications(id),
  voter_id uuid REFERENCES user_profiles(id),
  vote text CHECK (vote IN ('yes', 'no')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(application_id, voter_id)
);

ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members can vote" ON votes
  FOR ALL USING (auth.uid() = voter_id);

CREATE POLICY "members can read votes" ON votes
  FOR SELECT USING (true);

