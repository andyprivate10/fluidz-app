-- Fix: allow all authenticated users to read profiles
-- (needed for lineup display, host dashboard, public profile)
drop policy if exists "Users can read own profile" on user_profiles;

create policy "Authenticated users can read profiles"
  on user_profiles for select
  using (auth.role() = 'authenticated');

-- Allow host to insert notifications for applicants (accept/reject)
create policy "Host can insert notifications"
  on notifications for insert
  with check (
    auth.role() = 'authenticated'
    and (
      -- Either notifying yourself
      auth.uid() = user_id
      -- Or you're the host of the session
      or exists (
        select 1 from sessions
        where sessions.id = session_id
          and sessions.host_id = auth.uid()
      )
    )
  );
