-- Favorites table
CREATE TABLE IF NOT EXISTS public.favorites (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, target_user_id)
);

-- Intents table
CREATE TABLE IF NOT EXISTS public.intents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.sessions(id),
  intents text[] NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, target_user_id)
);

-- Intent matches table
CREATE TABLE IF NOT EXISTS public.intent_matches (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_a uuid NOT NULL REFERENCES auth.users(id),
  user_b uuid NOT NULL REFERENCES auth.users(id),
  matched_intents text[] NOT NULL,
  notified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT canonical_order CHECK (user_a < user_b),
  UNIQUE(user_a, user_b)
);

-- Review queue table
CREATE TABLE IF NOT EXISTS public.review_queue (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  session_id uuid NOT NULL REFERENCES public.sessions(id),
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT now() + interval '7 days',
  UNIQUE(user_id, session_id)
);

-- RLS
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own_favorites" ON public.favorites;
CREATE POLICY "own_favorites" ON public.favorites FOR ALL USING (user_id = auth.uid());

ALTER TABLE public.intents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own_intents" ON public.intents;
CREATE POLICY "own_intents" ON public.intents FOR ALL USING (user_id = auth.uid());

ALTER TABLE public.intent_matches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own_matches" ON public.intent_matches;
CREATE POLICY "own_matches" ON public.intent_matches FOR SELECT USING (user_a = auth.uid() OR user_b = auth.uid());

ALTER TABLE public.review_queue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own_review_queue" ON public.review_queue;
CREATE POLICY "own_review_queue" ON public.review_queue FOR ALL USING (user_id = auth.uid());

-- Intent match function
CREATE OR REPLACE FUNCTION check_intent_match() RETURNS TRIGGER AS $$
DECLARE
  reverse_intents text[];
  overlap text[];
  canonical_a uuid;
  canonical_b uuid;
BEGIN
  SELECT intents INTO reverse_intents FROM public.intents
    WHERE user_id = NEW.target_user_id AND target_user_id = NEW.user_id;

  IF reverse_intents IS NULL THEN RETURN NEW; END IF;

  SELECT array_agg(x) INTO overlap FROM (
    SELECT unnest(NEW.intents) INTERSECT SELECT unnest(reverse_intents)
  ) sub(x) WHERE x != 'not_interested';

  IF NEW.user_id < NEW.target_user_id THEN
    canonical_a := NEW.user_id; canonical_b := NEW.target_user_id;
  ELSE
    canonical_a := NEW.target_user_id; canonical_b := NEW.user_id;
  END IF;

  IF overlap IS NOT NULL AND array_length(overlap, 1) > 0 THEN
    INSERT INTO public.intent_matches (user_a, user_b, matched_intents)
      VALUES (canonical_a, canonical_b, overlap)
      ON CONFLICT (user_a, user_b) DO UPDATE SET matched_intents = EXCLUDED.matched_intents, notified = false;

    IF NOT FOUND OR (SELECT notified FROM public.intent_matches WHERE user_a = canonical_a AND user_b = canonical_b) = false THEN
      INSERT INTO public.notifications (user_id, type, title, body, href)
        VALUES (NEW.user_id, 'intent_match', 'Mutual interest!', array_to_string(overlap, ', '), '/contacts/' || NEW.target_user_id);
      INSERT INTO public.notifications (user_id, type, title, body, href)
        VALUES (NEW.target_user_id, 'intent_match', 'Mutual interest!', array_to_string(overlap, ', '), '/contacts/' || NEW.user_id);
      UPDATE public.intent_matches SET notified = true WHERE user_a = canonical_a AND user_b = canonical_b;
    END IF;
  ELSE
    DELETE FROM public.intent_matches WHERE user_a = canonical_a AND user_b = canonical_b;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_check_intent_match ON public.intents;
CREATE TRIGGER trg_check_intent_match
  AFTER INSERT OR UPDATE ON public.intents
  FOR EACH ROW EXECUTE FUNCTION check_intent_match();
