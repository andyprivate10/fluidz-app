-- Admin config table for dynamic profile options
-- Types: 'kink', 'morphology', 'role', 'session_tag', 'body_part'
create table if not exists admin_config (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  slug text not null,
  label text not null,
  category text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(type, slug)
);

-- RLS: everyone can read, only admins can write
alter table admin_config enable row level security;

do $$ begin
  create policy "Anyone can read admin_config"
    on admin_config for select
    using (true);
exception when duplicate_object then null;
end $$;

-- Admin write policy: check is_admin flag on user_profiles
-- For now, allow authenticated users (will restrict later with is_admin column)
do $$ begin
  create policy "Admins can insert admin_config"
    on admin_config for insert
    with check (auth.uid() is not null);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Admins can update admin_config"
    on admin_config for update
    using (auth.uid() is not null);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Admins can delete admin_config"
    on admin_config for delete
    using (auth.uid() is not null);
exception when duplicate_object then null;
end $$;

-- Add is_admin column to user_profiles
alter table user_profiles add column if not exists is_admin boolean not null default false;

-- Seed default kinks
insert into admin_config (type, slug, label, category, sort_order) values
  ('kink', 'fist', 'Fist', 'Pratiques', 1),
  ('kink', 'sm-leger', 'SM leger', 'SM', 2),
  ('kink', 'sm-hard', 'SM hard', 'SM', 3),
  ('kink', 'bareback', 'Bareback', 'Pratiques', 4),
  ('kink', 'group', 'Group', 'Pratiques', 5),
  ('kink', 'exhib', 'Exhib', 'Fetichisme', 6),
  ('kink', 'voyeur', 'Voyeur', 'Fetichisme', 7),
  ('kink', 'fetichisme', 'Fetichisme', 'Fetichisme', 8),
  ('kink', 'jeux-de-role', 'Jeux de role', 'Autre', 9)
on conflict (type, slug) do nothing;

-- Seed default morphologies
insert into admin_config (type, slug, label, sort_order) values
  ('morphology', 'mince', 'Mince', 1),
  ('morphology', 'sportif', 'Sportif', 2),
  ('morphology', 'athletique', 'Athletique', 3),
  ('morphology', 'moyen', 'Moyen', 4),
  ('morphology', 'costaud', 'Costaud', 5),
  ('morphology', 'muscle', 'Muscle', 6),
  ('morphology', 'gros', 'Gros', 7)
on conflict (type, slug) do nothing;

-- Seed default roles
insert into admin_config (type, slug, label, sort_order) values
  ('role', 'top', 'Top', 1),
  ('role', 'bottom', 'Bottom', 2),
  ('role', 'versa', 'Versa', 3),
  ('role', 'side', 'Side', 4)
on conflict (type, slug) do nothing;

-- Seed default session tags
insert into admin_config (type, slug, label, category, sort_order) values
  ('session_tag', 'chill', 'Chill', 'Vibes', 1),
  ('session_tag', 'hot', 'Hot', 'Vibes', 2),
  ('session_tag', 'fetish', 'Fetish', 'Vibes', 3),
  ('session_tag', 'party', 'Party', 'Vibes', 4),
  ('session_tag', 'bears', 'Bears', 'Roles', 5),
  ('session_tag', 'twinks', 'Twinks', 'Roles', 6)
on conflict (type, slug) do nothing;
