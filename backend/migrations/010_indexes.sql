-- 010_indexes.sql
-- Composite and partial indexes to speed up common query patterns.

-- Activities: composite (user_id, activity_date DESC) covers the paginated list
-- query "WHERE user_id = $1 ORDER BY activity_date DESC" without a separate sort step.
CREATE INDEX IF NOT EXISTS idx_activities_user_date
    ON activities(user_id, activity_date DESC);

-- DM messages: ensure descending order is indexed so ORDER BY created_at DESC is efficient.
CREATE INDEX IF NOT EXISTS idx_dm_messages_conv_date_desc
    ON dm_messages(conversation_id, created_at DESC);

-- Notifications: partial index for unread rows (read_at IS NULL) so the unread-count
-- query "WHERE user_id = $1 AND read_at IS NULL" hits only unread rows.
CREATE INDEX IF NOT EXISTS idx_notifications_unread
    ON notifications(user_id)
    WHERE read_at IS NULL;

-- Community posts: composite (pinned DESC, created_at DESC) matches the default sort
-- used when listing posts (pinned first, then newest).
CREATE INDEX IF NOT EXISTS idx_community_posts_pinned_date
    ON community_posts(pinned DESC, created_at DESC);

-- Community posts by author for profile / moderation queries.
CREATE INDEX IF NOT EXISTS idx_community_posts_author
    ON community_posts(author_id);

-- DM conversations: sort by last_message_at DESC for conversation list.
CREATE INDEX IF NOT EXISTS idx_dm_conversations_last_msg
    ON dm_conversations(last_message_at DESC);
