-- ═══ SESSION LIFECYCLE: ending_soon + review trigger ═══

-- 1. Allow ending_soon status
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_status_check;
ALTER TABLE sessions ADD CONSTRAINT sessions_status_check
  CHECK (status IN ('draft', 'open', 'ending_soon', 'ended'));

-- 2. Function to mark sessions as ending_soon 30min before end
CREATE OR REPLACE FUNCTION mark_sessions_ending_soon()
RETURNS integer AS $$
DECLARE
  updated_count integer;
  r record;
BEGIN
  -- Mark sessions ending within 30 min
  FOR r IN
    UPDATE sessions
    SET status = 'ending_soon'
    WHERE status = 'open'
      AND ends_at IS NOT NULL
      AND ends_at BETWEEN now() AND now() + interval '30 minutes'
    RETURNING id, host_id, title
  LOOP
    -- Create notification for host
    INSERT INTO notifications (user_id, session_id, type, title, body, href)
    VALUES (
      r.host_id, r.id, 'session_ending',
      'Session ending soon',
      r.title || ' ends in 30 min — extend or close?',
      '/session/' || r.id
    );
  END LOOP;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update auto_end to also handle ending_soon → ended
CREATE OR REPLACE FUNCTION auto_end_expired_sessions()
RETURNS integer AS $$
DECLARE
  updated_count integer;
  r record;
BEGIN
  -- End sessions that have passed their ends_at
  FOR r IN
    UPDATE sessions
    SET status = 'ended'
    WHERE status IN ('open', 'ending_soon')
      AND ends_at IS NOT NULL
      AND ends_at < now()
    RETURNING id, host_id
  LOOP
    -- Create review_queue entries for all accepted/checked_in members 15min after end
    INSERT INTO review_queue (session_id, user_id, created_at)
    SELECT r.id, a.applicant_id, now() + interval '15 minutes'
    FROM applications a
    WHERE a.session_id = r.id AND a.status IN ('accepted', 'checked_in')
    ON CONFLICT DO NOTHING;

    -- Also add host to review queue
    INSERT INTO review_queue (session_id, user_id, created_at)
    VALUES (r.id, r.host_id, now() + interval '15 minutes')
    ON CONFLICT DO NOTHING;
  END LOOP;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RPC: host extends session
CREATE OR REPLACE FUNCTION rpc_extend_session(
  p_session_id uuid,
  p_new_ends_at timestamptz
) RETURNS void AS $$
BEGIN
  UPDATE sessions
  SET ends_at = p_new_ends_at,
      status = CASE WHEN status = 'ending_soon' THEN 'open' ELSE status END
  WHERE id = p_session_id
    AND host_id = auth.uid()
    AND status IN ('open', 'ending_soon');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RPC: host manually ends session
CREATE OR REPLACE FUNCTION rpc_end_session(
  p_session_id uuid
) RETURNS void AS $$
DECLARE
  r record;
BEGIN
  SELECT id, host_id INTO r FROM sessions
  WHERE id = p_session_id AND host_id = auth.uid() AND status IN ('open', 'ending_soon');
  IF NOT FOUND THEN RAISE EXCEPTION 'Session not found or not host'; END IF;

  UPDATE sessions SET status = 'ended' WHERE id = p_session_id;

  -- Create review queue entries
  INSERT INTO review_queue (session_id, user_id, created_at)
  SELECT p_session_id, a.applicant_id, now() + interval '15 minutes'
  FROM applications a
  WHERE a.session_id = p_session_id AND a.status IN ('accepted', 'checked_in')
  ON CONFLICT DO NOTHING;

  INSERT INTO review_queue (session_id, user_id, created_at)
  VALUES (p_session_id, auth.uid(), now() + interval '15 minutes')
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Add notification type for ending session
-- (notifications.type is unconstrained text, no migration needed)
