-- Add title, body, href, read_at to notifications (spec batch 8)
alter table notifications
  add column if not exists title text,
  add column if not exists body text,
  add column if not exists href text,
  add column if not exists read_at timestamptz;

-- Backfill from existing message/read (skip if columns no longer exist)
do $$ begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='notifications' and column_name='message') then
    execute 'update notifications set title=coalesce(title,message), body=coalesce(body,''''), href=coalesce(href,''/session/''||session_id||''/host'') where title is null';
  end if;
end $$;

-- Trigger: set title, body, href on insert
create or replace function notify_host_on_application()
returns trigger as $$
begin
  insert into notifications (user_id, session_id, type, message, title, body, href)
  select s.host_id, new.session_id, 'new_application',
         'Nouvelle candidature pour "' || s.title || '"',
         'Nouvelle candidature pour "' || s.title || '"',
         '',
         '/session/' || new.session_id || '/host'
  from sessions s where s.id = new.session_id;
  return new;
end;
$$ language plpgsql security definer;
