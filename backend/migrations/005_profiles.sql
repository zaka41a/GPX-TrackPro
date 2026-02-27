-- Migration 005: athlete profiles table
CREATE TABLE IF NOT EXISTS athlete_profiles (
    user_id           BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    bio               TEXT,
    phone             TEXT,
    date_of_birth     DATE,
    gender            TEXT,
    country           TEXT,
    city              TEXT,
    height_cm         NUMERIC(5,1),
    weight_kg         NUMERIC(5,1),
    primary_sport     TEXT NOT NULL DEFAULT 'cycling',
    secondary_sports  TEXT[] NOT NULL DEFAULT '{}',
    experience_level  TEXT NOT NULL DEFAULT 'intermediate',
    weekly_goal_hours NUMERIC(4,1),
    sport_photo_url   TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
