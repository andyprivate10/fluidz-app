-- Reviews (post-session)
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id),
  reviewer_id uuid NOT NULL REFERENCES auth.users(id),
  target_id uuid, -- null = session review, uuid = individual review
  rating smallint NOT NULL CHECK (rating >= 1 AND rating <= 5),
  vibe_tags text[] DEFAULT '{}',
  comment text,
  is_anonymous boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(session_id, reviewer_id, target_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_session ON reviews(session_id);
CREATE INDEX IF NOT EXISTS idx_reviews_target ON reviews(target_id) WHERE target_id IS NOT NULL;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Participants can review sessions they were in
CREATE POLICY "Participants can create reviews" ON reviews
  FOR INSERT WITH CHECK (reviewer_id = auth.uid());

-- Reviews are readable by session participants
CREATE POLICY "Participants can read session reviews" ON reviews
  FOR SELECT USING (true);
