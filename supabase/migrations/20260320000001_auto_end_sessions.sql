-- Auto-end sessions when ends_at has passed
-- This function is called by a cron job or can be invoked manually
create or replace function auto_end_expired_sessions()
returns integer as $$
declare
  updated_count integer;
begin
  update sessions
  set status = 'ended'
  where status = 'open'
    and ends_at is not null
    and ends_at < now();

  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$ language plpgsql security definer;

-- Also add a check on session page load: if session is open but ends_at passed,
-- the frontend will show it as ended. This trigger auto-closes on any query.
create or replace function check_session_expired()
returns trigger as $$
begin
  if NEW.status = 'open' and NEW.ends_at is not null and NEW.ends_at < now() then
    NEW.status := 'ended';
  end if;
  return NEW;
end;
$$ language plpgsql;

-- Apply trigger on SELECT (via a before update trigger that runs on any touch)
-- Actually, triggers can't run on SELECT. Instead, we'll use the function approach.
-- The frontend will call auto_end_expired_sessions() periodically.
-- For now, create a simple RPC that the app can call.
