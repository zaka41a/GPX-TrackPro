-- Per-user soft-delete and clear timestamps for DM conversations.
-- deleted_by_a / deleted_by_b: conversation hidden for that user.
-- cleared_by_a_at / cleared_by_b_at: messages before this time hidden for that user.
ALTER TABLE dm_conversations
  ADD COLUMN IF NOT EXISTS deleted_by_a    BOOLEAN     NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deleted_by_b    BOOLEAN     NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS cleared_by_a_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cleared_by_b_at TIMESTAMPTZ;
