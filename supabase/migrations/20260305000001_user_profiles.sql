-- User profiles table for display name persistence
create table if not exists user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now()
);

alter table user_profiles enable row level security;

do $$ begin
  create policy "Users can read own profile"
    on user_profiles for select
    using (auth.uid() = id);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Users can upsert own profile"
    on user_profiles for insert
    with check (auth.uid() = id);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Users can update own profile"
    on user_profiles for update
    using (auth.uid() = id);
exception when duplicate_object then null;
end $$;
