-- Migration 010: Subscription plan tracking
-- Add plan_name column (may already exist if added manually) and requested_plan for upgrade requests.

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS plan_name      TEXT NOT NULL DEFAULT 'starter',  -- starter | pro | premium
  ADD COLUMN IF NOT EXISTS requested_plan TEXT;                              -- pro | premium | NULL = no pending request
