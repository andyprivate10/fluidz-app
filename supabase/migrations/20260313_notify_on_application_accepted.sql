-- Add trigger to notify applicants when their application is accepted
-- This fixes the E2E test: Marcus accepts Yann → Yann should receive notification

create or replace function notify_applicant_on_status_change()
returns trigger as $$
begin
  -- Only notify when status changes to 'accepted'
  if new.status = 'accepted' and (old.status is null or old.status != 'accepted') then
    -- Send notification to applicant
    insert into notifications (user_id, session_id, type, message, title, body, href)
    select new.applicant_id, new.session_id, 'application_accepted',
           'Ta candidature a été acceptée pour "' || s.title || '"',
           'Candidature acceptée ✓',
           'Ta candidature a été acceptée pour "' || s.title || '". L''adresse exacte est maintenant débloquée.',
           '/session/' || new.session_id
    from sessions s where s.id = new.session_id;
    
    -- Create initial DM message from host to welcome the new member
    insert into messages (session_id, sender_id, text, sender_name)
    select new.session_id, s.host_id,
           'Bienvenue ! Ta candidature a été acceptée. L''adresse exacte est maintenant visible dans la session.',
           coalesce(hp.display_name, 'Host')
    from sessions s
    left join user_profiles hp on hp.id = s.host_id
    where s.id = new.session_id;
  end if;
  
  return new;
end;
$$ language plpgsql security definer;

create trigger on_application_status_change
  after update on applications
  for each row execute function notify_applicant_on_status_change();