package store

import (
	"context"
	"time"
)

type DMConversation struct {
	ID              int64     `json:"id"`
	UserAID         int64     `json:"userAId"`
	UserBID         int64     `json:"userBId"`
	OtherUserID     int64     `json:"otherUserId"`
	OtherUserName   string    `json:"otherUserName"`
	OtherUserAvatar string    `json:"otherUserAvatar"`
	LastMessage     string    `json:"lastMessage"`
	LastMessageAt   time.Time `json:"lastMessageAt"`
	UnreadCount     int       `json:"unreadCount"`
}

type DMMessage struct {
	ID             int64      `json:"id"`
	ConversationID int64      `json:"conversationId"`
	SenderID       int64      `json:"senderId"`
	Content        string     `json:"content"`
	ReadAt         *time.Time `json:"readAt,omitempty"`
	CreatedAt      time.Time  `json:"createdAt"`
}

func (s *Store) GetOrCreateConversation(ctx context.Context, userA, userB int64) (DMConversation, error) {
	// Ensure canonical ordering
	if userA > userB {
		userA, userB = userB, userA
	}

	query := `
		INSERT INTO dm_conversations (user_a_id, user_b_id)
		VALUES ($1, $2)
		ON CONFLICT (user_a_id, user_b_id) DO UPDATE SET last_message_at = dm_conversations.last_message_at
		RETURNING id, user_a_id, user_b_id, last_message_at
	`
	var c DMConversation
	err := s.pool.QueryRow(ctx, query, userA, userB).Scan(
		&c.ID, &c.UserAID, &c.UserBID, &c.LastMessageAt,
	)
	return c, err
}

func (s *Store) ListConversations(ctx context.Context, userID int64) ([]DMConversation, error) {
	query := `
		SELECT c.id, c.user_a_id, c.user_b_id, c.last_message_at,
			CASE WHEN c.user_a_id = $1 THEN c.user_b_id ELSE c.user_a_id END AS other_user_id,
			CASE WHEN c.user_a_id = $1
				THEN CONCAT(ub.first_name, ' ', ub.last_name)
				ELSE CONCAT(ua.first_name, ' ', ua.last_name)
			END AS other_user_name,
			CASE WHEN c.user_a_id = $1
				THEN COALESCE(ub.avatar_url, '')
				ELSE COALESCE(ua.avatar_url, '')
			END AS other_user_avatar,
			COALESCE(lm.content, '') AS last_message,
			COALESCE(uc.unread_count, 0) AS unread_count
		FROM dm_conversations c
		JOIN users ua ON ua.id = c.user_a_id
		JOIN users ub ON ub.id = c.user_b_id
		LEFT JOIN LATERAL (
			SELECT content
			FROM dm_messages
			WHERE conversation_id = c.id
			  AND created_at > COALESCE(
			        CASE WHEN c.user_a_id = $1 THEN c.cleared_by_a_at
			             ELSE c.cleared_by_b_at END,
			        '-infinity'::timestamptz)
			ORDER BY created_at DESC
			LIMIT 1
		) lm ON true
		LEFT JOIN LATERAL (
			SELECT COUNT(*) AS unread_count
			FROM dm_messages
			WHERE conversation_id = c.id
			  AND sender_id != $1
			  AND read_at IS NULL
			  AND created_at > COALESCE(
			        CASE WHEN c.user_a_id = $1 THEN c.cleared_by_a_at
			             ELSE c.cleared_by_b_at END,
			        '-infinity'::timestamptz)
		) uc ON true
		WHERE (c.user_a_id = $1 AND NOT c.deleted_by_a)
		   OR (c.user_b_id = $1 AND NOT c.deleted_by_b)
		ORDER BY c.last_message_at DESC
	`
	rows, err := s.pool.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	convos := make([]DMConversation, 0)
	for rows.Next() {
		var c DMConversation
		if err := rows.Scan(
			&c.ID, &c.UserAID, &c.UserBID, &c.LastMessageAt,
			&c.OtherUserID, &c.OtherUserName, &c.OtherUserAvatar, &c.LastMessage, &c.UnreadCount,
		); err != nil {
			return nil, err
		}
		convos = append(convos, c)
	}
	return convos, rows.Err()
}

func (s *Store) SendMessage(ctx context.Context, conversationID, senderID int64, content string) (DMMessage, error) {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return DMMessage{}, err
	}
	defer tx.Rollback(ctx)

	var m DMMessage
	err = tx.QueryRow(ctx,
		`INSERT INTO dm_messages (conversation_id, sender_id, content)
		 VALUES ($1, $2, $3)
		 RETURNING id, conversation_id, sender_id, content, read_at, created_at`,
		conversationID, senderID, content,
	).Scan(&m.ID, &m.ConversationID, &m.SenderID, &m.Content, &m.ReadAt, &m.CreatedAt)
	if err != nil {
		return DMMessage{}, err
	}

	// Update timestamp and un-delete the conversation for both sides so the
	// recipient sees the new message even if they had previously deleted the chat.
	_, err = tx.Exec(ctx,
		`UPDATE dm_conversations
		 SET last_message_at = now(), deleted_by_a = FALSE, deleted_by_b = FALSE
		 WHERE id = $1`,
		conversationID,
	)
	if err != nil {
		return DMMessage{}, err
	}

	return m, tx.Commit(ctx)
}

type MessageListResult struct {
	Messages   []DMMessage `json:"messages"`
	NextCursor *int64      `json:"nextCursor"`
}

// ListMessages returns messages for a conversation visible to userID (respects cleared_at).
func (s *Store) ListMessages(ctx context.Context, conversationID, userID int64, cursor *int64, limit int) (MessageListResult, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}

	// Only show messages after the user's personal clear timestamp.
	query := `
		SELECT m.id, m.conversation_id, m.sender_id, m.content, m.read_at, m.created_at
		FROM dm_messages m
		JOIN dm_conversations c ON c.id = m.conversation_id
		WHERE m.conversation_id = $1
		  AND m.created_at > COALESCE(
		        CASE WHEN c.user_a_id = $2 THEN c.cleared_by_a_at
		             ELSE c.cleared_by_b_at END,
		        '-infinity'::timestamptz)
	`
	args := []any{conversationID, userID}
	argN := 3

	if cursor != nil {
		query += " AND m.id < $" + itoa(argN)
		args = append(args, *cursor)
		argN++
	}

	query += " ORDER BY m.created_at DESC LIMIT $" + itoa(argN)
	args = append(args, limit+1)

	rows, err := s.pool.Query(ctx, query, args...)
	if err != nil {
		return MessageListResult{}, err
	}
	defer rows.Close()

	messages := make([]DMMessage, 0)
	for rows.Next() {
		var m DMMessage
		if err := rows.Scan(&m.ID, &m.ConversationID, &m.SenderID, &m.Content, &m.ReadAt, &m.CreatedAt); err != nil {
			return MessageListResult{}, err
		}
		messages = append(messages, m)
	}
	if err := rows.Err(); err != nil {
		return MessageListResult{}, err
	}

	var nextCursor *int64
	if len(messages) > limit {
		nextCursor = &messages[limit-1].ID
		messages = messages[:limit]
	}

	return MessageListResult{Messages: messages, NextCursor: nextCursor}, nil
}

func (s *Store) MarkRead(ctx context.Context, conversationID, userID int64) error {
	_, err := s.pool.Exec(ctx,
		`UPDATE dm_messages SET read_at = now()
		 WHERE conversation_id = $1 AND sender_id != $2 AND read_at IS NULL`,
		conversationID, userID,
	)
	return err
}

func (s *Store) UnreadCount(ctx context.Context, userID int64) (int, error) {
	query := `
		SELECT COUNT(*)
		FROM dm_messages m
		JOIN dm_conversations c ON c.id = m.conversation_id
		WHERE (c.user_a_id = $1 OR c.user_b_id = $1)
			AND m.sender_id != $1
			AND m.read_at IS NULL
			AND m.created_at > COALESCE(
			      CASE WHEN c.user_a_id = $1 THEN c.cleared_by_a_at
			           ELSE c.cleared_by_b_at END,
			      '-infinity'::timestamptz)
	`
	var count int
	err := s.pool.QueryRow(ctx, query, userID).Scan(&count)
	return count, err
}

// ClearConversation records a per-user clear timestamp. Messages before it
// become invisible to userID only; the other participant is unaffected.
func (s *Store) ClearConversation(ctx context.Context, conversationID, userID int64) error {
	_, err := s.pool.Exec(ctx, `
		UPDATE dm_conversations SET
			cleared_by_a_at = CASE WHEN user_a_id = $2 THEN now() ELSE cleared_by_a_at END,
			cleared_by_b_at = CASE WHEN user_b_id = $2 THEN now() ELSE cleared_by_b_at END
		WHERE id = $1
	`, conversationID, userID)
	return err
}

// DeleteConversation hides the conversation for userID. When both participants
// have deleted it, the row and all messages are physically removed.
func (s *Store) DeleteConversation(ctx context.Context, conversationID, userID int64) error {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// Mark as deleted + set cleared_at so old messages won't show if the
	// conversation is ever restored by a new incoming message.
	var bothDeleted bool
	err = tx.QueryRow(ctx, `
		UPDATE dm_conversations SET
			deleted_by_a    = CASE WHEN user_a_id = $2 THEN TRUE ELSE deleted_by_a END,
			deleted_by_b    = CASE WHEN user_b_id = $2 THEN TRUE ELSE deleted_by_b END,
			cleared_by_a_at = CASE WHEN user_a_id = $2 THEN now() ELSE cleared_by_a_at END,
			cleared_by_b_at = CASE WHEN user_b_id = $2 THEN now() ELSE cleared_by_b_at END
		WHERE id = $1
		RETURNING deleted_by_a AND deleted_by_b
	`, conversationID, userID).Scan(&bothDeleted)
	if err != nil {
		return err
	}

	// Physical cleanup only when both sides have deleted.
	if bothDeleted {
		if _, err := tx.Exec(ctx, `DELETE FROM dm_messages WHERE conversation_id = $1`, conversationID); err != nil {
			return err
		}
		if _, err := tx.Exec(ctx, `DELETE FROM dm_conversations WHERE id = $1`, conversationID); err != nil {
			return err
		}
	}

	return tx.Commit(ctx)
}

// GetConversationOtherUserID returns the ID of the other participant in a conversation.
func (s *Store) GetConversationOtherUserID(ctx context.Context, conversationID, senderID int64) (int64, error) {
	var otherID int64
	err := s.pool.QueryRow(ctx,
		`SELECT CASE WHEN user_a_id = $2 THEN user_b_id ELSE user_a_id END
		 FROM dm_conversations WHERE id = $1`,
		conversationID, senderID,
	).Scan(&otherID)
	return otherID, err
}

func (s *Store) IsConversationParticipant(ctx context.Context, conversationID, userID int64) (bool, error) {
	var exists bool
	err := s.pool.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM dm_conversations WHERE id = $1 AND (user_a_id = $2 OR user_b_id = $2))`,
		conversationID, userID,
	).Scan(&exists)
	return exists, err
}
