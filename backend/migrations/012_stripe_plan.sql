-- 012_stripe_plan.sql
-- Adds subscription plan tier + Stripe payment fields to subscriptions.
ALTER TABLE subscriptions
    ADD COLUMN IF NOT EXISTS plan_name             TEXT NOT NULL DEFAULT 'starter',
    ADD COLUMN IF NOT EXISTS stripe_customer_id     TEXT,
    ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Backfill: users with active/trial status get 'pro' plan
UPDATE subscriptions SET plan_name = 'pro' WHERE status IN ('active', 'trial');
