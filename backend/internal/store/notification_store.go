package store

import (
	"context"
	"time"
)

type Notification struct {
	ID        int64      `json:"id"`
	UserID    int64      `json:"userId"`
	Title     string     `json:"title"`
	Body      string     `json:"body"`
	ReadAt    *time.Time `json:"readAt"`
	CreatedAt time.Time  `json:"createdAt"`
}

func (s *Store) CreateNotification(ctx context.Context, userID int64, title, body string) error {
	_, err := s.pool.Exec(ctx,
		`INSERT INTO notifications (user_id, title, body) VALUES ($1, $2, $3)`,
		userID, title, body,
	)
	return err
}

func (s *Store) ListNotifications(ctx context.Context, userID int64, limit int) ([]Notification, error) {
	if limit <= 0 || limit > 50 {
		limit = 20
	}
	rows, err := s.pool.Query(ctx,
		`SELECT id, user_id, title, body, read_at, created_at
		 FROM notifications WHERE user_id = $1
		 ORDER BY created_at DESC LIMIT $2`,
		userID, limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]Notification, 0)
	for rows.Next() {
		var n Notification
		if err := rows.Scan(&n.ID, &n.UserID, &n.Title, &n.Body, &n.ReadAt, &n.CreatedAt); err != nil {
			return nil, err
		}
		items = append(items, n)
	}
	return items, rows.Err()
}

func (s *Store) MarkAllNotificationsRead(ctx context.Context, userID int64) error {
	_, err := s.pool.Exec(ctx,
		`UPDATE notifications SET read_at = now() WHERE user_id = $1 AND read_at IS NULL`,
		userID,
	)
	return err
}

func (s *Store) DeleteAllNotifications(ctx context.Context, userID int64) error {
	_, err := s.pool.Exec(ctx,
		`DELETE FROM notifications WHERE user_id = $1`,
		userID,
	)
	return err
}

func (s *Store) NotificationUnreadCount(ctx context.Context, userID int64) (int, error) {
	var count int
	err := s.pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read_at IS NULL`,
		userID,
	).Scan(&count)
	return count, err
}
