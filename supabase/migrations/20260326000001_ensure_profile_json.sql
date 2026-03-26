-- Ensure profile_json column exists on user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS profile_json jsonb NOT NULL DEFAULT '{}';
