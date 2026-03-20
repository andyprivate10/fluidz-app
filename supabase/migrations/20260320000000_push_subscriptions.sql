-- Push notification subscriptions
alter table user_profiles add column if not exists push_subscription jsonb;

-- Index for finding users with push subscriptions
create index if not exists idx_user_profiles_push
  on user_profiles ((push_subscription is not null))
  where push_subscription is not null;
