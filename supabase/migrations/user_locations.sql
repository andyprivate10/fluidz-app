-- User Locations (for "Autour de moi" gallery)
-- Stores approximate location (rounded to ~500m for privacy)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS approx_lat double precision;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS approx_lng double precision;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS location_visible boolean NOT NULL DEFAULT false;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS location_updated_at timestamptz;

-- Index for geospatial queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_location ON user_profiles(approx_lat, approx_lng) WHERE location_visible = true;
