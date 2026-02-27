package store

import (
	"context"
	"time"
)

type Subscription struct {
	ID          int64      `json:"id"`
	UserID      int64      `json:"userId"`
	Status      string     `json:"status"`
	PeriodStart *time.Time `json:"periodStart"`
	PeriodEnd   *time.Time `json:"periodEnd"`
	Notes       string     `json:"notes"`
	ActivatedBy string     `json:"activatedBy"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
}

// IsActive returns true when the subscription status is active or trial and not yet expired.
func (sub *Subscription) IsActive() bool {
	if sub.Status != "active" && sub.Status != "trial" {
		return false
	}
	if sub.PeriodEnd == nil {
		return false
	}
	return sub.PeriodEnd.After(time.Now())
}

type SubscriptionWithUser struct {
	Subscription
	UserFirstName string `json:"userFirstName"`
	UserLastName  string `json:"userLastName"`
	UserEmail     string `json:"userEmail"`
}

func (s *Store) GetSubscription(ctx context.Context, userID int64) (*Subscription, error) {
	query := `
		SELECT id, user_id, status, period_start, period_end,
		       COALESCE(notes, ''), COALESCE(activated_by, ''), created_at, updated_at
		FROM subscriptions WHERE user_id = $1
	`
	var sub Subscription
	err := s.pool.QueryRow(ctx, query, userID).Scan(
		&sub.ID, &sub.UserID, &sub.Status, &sub.PeriodStart, &sub.PeriodEnd,
		&sub.Notes, &sub.ActivatedBy, &sub.CreatedAt, &sub.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &sub, nil
}

func (s *Store) UpsertSubscription(ctx context.Context, userID int64, status string, periodStart, periodEnd *time.Time, activatedBy, notes string) error {
	query := `
		INSERT INTO subscriptions (user_id, status, period_start, period_end, activated_by, notes, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, NOW())
		ON CONFLICT (user_id) DO UPDATE SET
			status       = EXCLUDED.status,
			period_start = EXCLUDED.period_start,
			period_end   = EXCLUDED.period_end,
			activated_by = EXCLUDED.activated_by,
			notes        = EXCLUDED.notes,
			updated_at   = NOW()
	`
	_, err := s.pool.Exec(ctx, query, userID, status, periodStart, periodEnd, activatedBy, notes)
	return err
}

func (s *Store) ListSubscriptions(ctx context.Context) ([]SubscriptionWithUser, error) {
	// LEFT JOIN so approved users without a subscription row still appear.
	query := `
		SELECT
			COALESCE(s.id, 0),
			u.id,
			COALESCE(s.status, 'none'),
			s.period_start,
			s.period_end,
			COALESCE(s.notes, ''),
			COALESCE(s.activated_by, ''),
			COALESCE(s.created_at, u.created_at),
			COALESCE(s.updated_at, u.created_at),
			u.first_name, u.last_name, u.email
		FROM users u
		LEFT JOIN subscriptions s ON s.user_id = u.id
		WHERE u.role = 'user' AND u.status = 'approved'
		ORDER BY COALESCE(s.updated_at, u.created_at) DESC
	`
	rows, err := s.pool.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]SubscriptionWithUser, 0)
	for rows.Next() {
		var sw SubscriptionWithUser
		if err := rows.Scan(
			&sw.ID, &sw.UserID, &sw.Status, &sw.PeriodStart, &sw.PeriodEnd,
			&sw.Notes, &sw.ActivatedBy, &sw.CreatedAt, &sw.UpdatedAt,
			&sw.UserFirstName, &sw.UserLastName, &sw.UserEmail,
		); err != nil {
			return nil, err
		}
		items = append(items, sw)
	}
	return items, rows.Err()
}
