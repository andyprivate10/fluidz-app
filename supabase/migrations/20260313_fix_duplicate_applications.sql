-- Fix duplicate applications by adding unique constraint
-- This ensures one application per user per session

-- First, remove any existing duplicates (keep the latest one)
WITH ranked_applications AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY session_id, applicant_id ORDER BY created_at DESC) as rn
  FROM applications
)
DELETE FROM applications 
WHERE id IN (
  SELECT id FROM ranked_applications WHERE rn > 1
);

-- Add unique constraint on (session_id, applicant_id)
ALTER TABLE applications 
ADD CONSTRAINT unique_application_per_session 
UNIQUE (session_id, applicant_id);

-- Update notification trigger to only fire on INSERT, not UPDATE
-- This prevents duplicate notifications when users re-apply
DROP TRIGGER IF EXISTS on_new_application ON applications;

CREATE OR REPLACE FUNCTION notify_host_on_application()
RETURNS trigger as $$
BEGIN
  -- Only notify on new applications (INSERT), not updates
  IF TG_OP = 'INSERT' THEN
    INSERT INTO notifications (user_id, session_id, type, message)
    SELECT s.host_id, NEW.session_id, 'new_application',
           'Nouvelle candidature pour "' || s.title || '"'
    FROM sessions s WHERE s.id = NEW.session_id;
  END IF;
  RETURN NEW;
END;
$$ language plpgsql security definer;

CREATE TRIGGER on_new_application
  AFTER INSERT OR UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION notify_host_on_application();