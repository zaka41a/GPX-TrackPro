-- Idempotency log for Stripe webhook events.
-- Each delivered event id is recorded once so retried/duplicate webhook
-- deliveries are not processed twice.
CREATE TABLE IF NOT EXISTS processed_stripe_events (
    event_id   TEXT PRIMARY KEY,
    type       TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
