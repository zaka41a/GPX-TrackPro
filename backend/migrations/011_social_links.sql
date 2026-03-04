-- 011_social_links.sql
-- Adds social/professional link fields to athlete_profiles.
ALTER TABLE athlete_profiles
    ADD COLUMN IF NOT EXISTS website_url   TEXT,
    ADD COLUMN IF NOT EXISTS strava_url    TEXT,
    ADD COLUMN IF NOT EXISTS instagram_url TEXT,
    ADD COLUMN IF NOT EXISTS twitter_url   TEXT,
    ADD COLUMN IF NOT EXISTS youtube_url   TEXT,
    ADD COLUMN IF NOT EXISTS linkedin_url  TEXT;
