-- PR5: Auto-expire ephemeral media when session ends (+24h buffer)
-- Triggered automatically on sessions.status → 'ended'

CREATE OR REPLACE FUNCTION expire_session_media()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status = 'ended' AND (OLD.status IS DISTINCT FROM 'ended') THEN
    -- Set expires_at to min(current expires_at, now + 24h)
    UPDATE ephemeral_media
    SET expires_at = LEAST(expires_at, now() + interval '24 hours')
    WHERE context_id = NEW.id
      AND expires_at > now();
  END IF;
  RETURN NEW;
END;
$$;

-- Drop trigger if it already exists (idempotent)
DROP TRIGGER IF EXISTS session_end_expire_media ON sessions;

CREATE TRIGGER session_end_expire_media
  AFTER UPDATE OF status ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION expire_session_media();

-- Also create a cleanup function for deleting expired media rows
-- (can be called by a pg_cron job or admin endpoint)
CREATE OR REPLACE FUNCTION cleanup_expired_media()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM ephemeral_media
  WHERE expires_at < now() - interval '1 hour';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;
