-- RLS policy: allow session hosts to update applications (accept/reject)
create policy "Host can update applications"
  on applications for update
  using (
    exists (
      select 1 from sessions
      where sessions.id = applications.session_id
        and sessions.host_id = auth.uid()
    )
  );

-- Notifications table
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  session_id uuid references sessions(id) on delete cascade not null,
  type text not null default 'new_application',
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table notifications enable row level security;

create policy "Users can read own notifications"
  on notifications for select
  using (auth.uid() = user_id);

create policy "Users can update own notifications"
  on notifications for update
  using (auth.uid() = user_id);

-- Auto-create notification when a new application is inserted
create or replace function notify_host_on_application()
returns trigger as $$
begin
  insert into notifications (user_id, session_id, type, message)
  select s.host_id, new.session_id, 'new_application',
         'Nouvelle candidature pour "' || s.title || '"'
  from sessions s where s.id = new.session_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_new_application
  after insert on applications
  for each row execute function notify_host_on_application();
