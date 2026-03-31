-- ═══ SOCIAL INTERACTIONS: interest_requests + naughtybook_requests ═══

-- 1. Add mutual + request_status to contacts
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS mutual boolean DEFAULT false;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS request_status text DEFAULT 'direct'
  CHECK (request_status IN ('direct', 'pending', 'accepted', 'rejected'));

-- 2. interest_requests table
CREATE TABLE IF NOT EXISTS interest_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id),
  receiver_id uuid NOT NULL REFERENCES auth.users(id),
  shared_sections jsonb NOT NULL DEFAULT '[]',
  profile_snapshot jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(sender_id, receiver_id)
);

CREATE INDEX IF NOT EXISTS idx_interest_requests_sender ON interest_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_interest_requests_receiver ON interest_requests(receiver_id);
ALTER TABLE interest_requests ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
CREATE POLICY "interest_requests_select" ON interest_requests
  FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE POLICY "interest_requests_insert" ON interest_requests
  FOR INSERT WITH CHECK (sender_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE POLICY "interest_requests_update" ON interest_requests
  FOR UPDATE USING (receiver_id = auth.uid() OR sender_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. naughtybook_requests table
CREATE TABLE IF NOT EXISTS naughtybook_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id),
  receiver_id uuid NOT NULL REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(sender_id, receiver_id)
);

CREATE INDEX IF NOT EXISTS idx_nb_requests_sender ON naughtybook_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_nb_requests_receiver ON naughtybook_requests(receiver_id);
ALTER TABLE naughtybook_requests ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
CREATE POLICY "nb_requests_select" ON naughtybook_requests
  FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE POLICY "nb_requests_insert" ON naughtybook_requests
  FOR INSERT WITH CHECK (sender_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE POLICY "nb_requests_update" ON naughtybook_requests
  FOR UPDATE USING (receiver_id = auth.uid() OR sender_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4. Add locked column to messages for interest flow
ALTER TABLE messages ADD COLUMN IF NOT EXISTS locked boolean DEFAULT false;

-- 5. Add new interaction_log types
ALTER TABLE interaction_log DROP CONSTRAINT IF EXISTS interaction_log_type_check;
ALTER TABLE interaction_log ADD CONSTRAINT interaction_log_type_check
  CHECK (type IN ('co_event', 'dm', 'added_contact', 'relation_change', 'voted',
                  'profile_view', 'contact_request', 'interest_sent', 'interest_accepted',
                  'interest_rejected', 'nb_request_sent', 'nb_accepted', 'nb_rejected', 'nb_removed'));

-- 6. Add new notification types (no constraint change needed, notifications.type is text)

-- 7. RPC: send interest request
CREATE OR REPLACE FUNCTION rpc_send_interest(
  p_receiver_id uuid,
  p_shared_sections jsonb,
  p_profile_snapshot jsonb
) RETURNS uuid AS $$
DECLARE
  v_id uuid;
  v_sender_name text;
BEGIN
  -- Upsert interest request
  INSERT INTO interest_requests (sender_id, receiver_id, shared_sections, profile_snapshot, status)
  VALUES (auth.uid(), p_receiver_id, p_shared_sections, p_profile_snapshot, 'pending')
  ON CONFLICT (sender_id, receiver_id) DO UPDATE SET
    shared_sections = EXCLUDED.shared_sections,
    profile_snapshot = EXCLUDED.profile_snapshot,
    status = 'pending',
    created_at = now()
  RETURNING id INTO v_id;

  -- Get sender name
  SELECT display_name INTO v_sender_name FROM user_profiles WHERE id = auth.uid();

  -- Create notification
  INSERT INTO notifications (user_id, type, title, body, href)
  VALUES (
    p_receiver_id,
    'interest_received',
    COALESCE(v_sender_name, 'Someone'),
    'wants to show you their profile',
    '/profile/' || auth.uid()
  );

  -- Log interaction
  INSERT INTO interaction_log (user_id, target_user_id, type, meta)
  VALUES (auth.uid(), p_receiver_id, 'interest_sent', jsonb_build_object('sections', p_shared_sections));

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. RPC: respond to interest
CREATE OR REPLACE FUNCTION rpc_respond_interest(
  p_request_id uuid,
  p_action text -- 'accepted', 'rejected', 'blocked'
) RETURNS void AS $$
DECLARE
  v_req record;
  v_name text;
BEGIN
  SELECT * INTO v_req FROM interest_requests WHERE id = p_request_id AND receiver_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'Request not found'; END IF;

  UPDATE interest_requests SET status = p_action WHERE id = p_request_id;

  IF p_action = 'accepted' THEN
    -- Unlock: set locked=false on DM messages between them
    UPDATE messages SET locked = false
    WHERE room_type = 'dm'
      AND ((sender_id = v_req.sender_id AND dm_peer_id = auth.uid())
        OR (sender_id = auth.uid() AND dm_peer_id = v_req.sender_id));

    -- Notify sender
    SELECT display_name INTO v_name FROM user_profiles WHERE id = auth.uid();
    INSERT INTO notifications (user_id, type, title, body, href)
    VALUES (v_req.sender_id, 'interest_accepted', COALESCE(v_name, 'Someone'), 'accepted your interest', '/dm/' || auth.uid());

    INSERT INTO interaction_log (user_id, target_user_id, type, meta)
    VALUES (auth.uid(), v_req.sender_id, 'interest_accepted', '{}');

  ELSIF p_action = 'blocked' THEN
    -- Add block to contacts
    INSERT INTO contacts (user_id, contact_user_id, relation_level)
    VALUES (auth.uid(), v_req.sender_id, 'connaissance')
    ON CONFLICT (user_id, contact_user_id) DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. RPC: request naughtybook
CREATE OR REPLACE FUNCTION rpc_request_naughtybook(
  p_receiver_id uuid
) RETURNS uuid AS $$
DECLARE
  v_id uuid;
  v_sender_name text;
  v_existing record;
BEGIN
  -- Check cooldown (reject within last 7 days)
  SELECT * INTO v_existing FROM naughtybook_requests
  WHERE sender_id = auth.uid() AND receiver_id = p_receiver_id
    AND status = 'rejected' AND created_at > now() - interval '7 days';
  IF FOUND THEN RAISE EXCEPTION 'Cooldown active'; END IF;

  INSERT INTO naughtybook_requests (sender_id, receiver_id, status)
  VALUES (auth.uid(), p_receiver_id, 'pending')
  ON CONFLICT (sender_id, receiver_id) DO UPDATE SET status = 'pending', created_at = now()
  RETURNING id INTO v_id;

  SELECT display_name INTO v_sender_name FROM user_profiles WHERE id = auth.uid();

  INSERT INTO notifications (user_id, type, title, body, href)
  VALUES (
    p_receiver_id,
    'naughtybook_request',
    COALESCE(v_sender_name, 'Someone'),
    'wants to add you to their NaughtyBook',
    '/profile/' || auth.uid()
  );

  INSERT INTO interaction_log (user_id, target_user_id, type, meta)
  VALUES (auth.uid(), p_receiver_id, 'nb_request_sent', '{}');

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. RPC: respond to naughtybook request
CREATE OR REPLACE FUNCTION rpc_respond_naughtybook(
  p_request_id uuid,
  p_action text -- 'accepted' or 'rejected'
) RETURNS void AS $$
DECLARE
  v_req record;
  v_name text;
BEGIN
  SELECT * INTO v_req FROM naughtybook_requests WHERE id = p_request_id AND receiver_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'Request not found'; END IF;

  UPDATE naughtybook_requests SET status = p_action WHERE id = p_request_id;

  IF p_action = 'accepted' THEN
    -- Add mutual contacts both directions
    INSERT INTO contacts (user_id, contact_user_id, relation_level, mutual, request_status)
    VALUES (auth.uid(), v_req.sender_id, 'connaissance', true, 'accepted')
    ON CONFLICT (user_id, contact_user_id) DO UPDATE SET mutual = true, request_status = 'accepted';

    INSERT INTO contacts (user_id, contact_user_id, relation_level, mutual, request_status)
    VALUES (v_req.sender_id, auth.uid(), 'connaissance', true, 'accepted')
    ON CONFLICT (user_id, contact_user_id) DO UPDATE SET mutual = true, request_status = 'accepted';

    -- Notify sender
    SELECT display_name INTO v_name FROM user_profiles WHERE id = auth.uid();
    INSERT INTO notifications (user_id, type, title, body, href)
    VALUES (v_req.sender_id, 'naughtybook_accepted', COALESCE(v_name, 'Someone'), 'accepted your NaughtyBook request', '/contacts/' || auth.uid());

    INSERT INTO interaction_log (user_id, target_user_id, type, meta)
    VALUES (auth.uid(), v_req.sender_id, 'nb_accepted', '{}');
  ELSE
    INSERT INTO interaction_log (user_id, target_user_id, type, meta)
    VALUES (auth.uid(), v_req.sender_id, 'nb_rejected', '{}');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. RPC: remove from naughtybook (unilateral)
CREATE OR REPLACE FUNCTION rpc_remove_naughtybook(
  p_target_id uuid
) RETURNS void AS $$
BEGIN
  -- Remove mutual flag from both directions
  UPDATE contacts SET mutual = false, request_status = 'direct'
  WHERE user_id = auth.uid() AND contact_user_id = p_target_id;

  UPDATE contacts SET mutual = false, request_status = 'direct'
  WHERE user_id = p_target_id AND contact_user_id = auth.uid();

  -- Remove the naughtybook request records
  DELETE FROM naughtybook_requests
  WHERE (sender_id = auth.uid() AND receiver_id = p_target_id)
     OR (sender_id = p_target_id AND receiver_id = auth.uid());

  INSERT INTO interaction_log (user_id, target_user_id, type, meta)
  VALUES (auth.uid(), p_target_id, 'nb_removed', '{}');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
