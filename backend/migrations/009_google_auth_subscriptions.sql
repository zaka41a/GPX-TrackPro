-- Migration 009: Google OAuth support + Subscription system

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS google_id    TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS google_email TEXT;

CREATE TABLE IF NOT EXISTS subscriptions (
  id            BIGSERIAL PRIMARY KEY,
  user_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  status        TEXT NOT NULL DEFAULT 'inactive', -- trial | active | inactive | expired
  period_start  TIMESTAMPTZ,
  period_end    TIMESTAMPTZ,
  notes         TEXT,
  activated_by  TEXT,  -- 'admin' | 'trial' | 'migration'
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Give existing approved users an active subscription so they are not blocked
INSERT INTO subscriptions (user_id, status, period_start, period_end, activated_by)
SELECT id, 'active', now(), now() + interval '365 days', 'migration'
FROM users
WHERE status::text = 'approved'
ON CONFLICT (user_id) DO NOTHING;
