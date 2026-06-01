package store

import (
	"context"
	"time"
)

type Subscription struct {
	ID            int64      `json:"id"`
	UserID        int64      `json:"userId"`
	Status        string     `json:"status"`
	PlanName      string     `json:"planName"`
	RequestedPlan string     `json:"requestedPlan"`
	PeriodStart   *time.Time `json:"periodStart"`
	PeriodEnd     *time.Time `json:"periodEnd"`
	Notes         string     `json:"notes"`
	ActivatedBy   string     `json:"activatedBy"`
	CreatedAt     time.Time  `json:"createdAt"`
	UpdatedAt     time.Time  `json:"updatedAt"`
}

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
		SELECT id, user_id, status,
		       COALESCE(plan_name, 'starter'),
		       COALESCE(requested_plan, ''),
		       period_start, period_end,
		       COALESCE(notes, ''), COALESCE(activated_by, ''), created_at, updated_at
		FROM subscriptions WHERE user_id = $1
	`
	var sub Subscription
	err := s.pool.QueryRow(ctx, query, userID).Scan(
		&sub.ID, &sub.UserID, &sub.Status, &sub.PlanName, &sub.RequestedPlan,
		&sub.PeriodStart, &sub.PeriodEnd,
		&sub.Notes, &sub.ActivatedBy, &sub.CreatedAt, &sub.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &sub, nil
}

func (s *Store) SetRequestedPlan(ctx context.Context, userID int64, planName string) error {
	_, err := s.pool.Exec(ctx,
		`UPDATE subscriptions SET requested_plan = $1, updated_at = NOW() WHERE user_id = $2`,
		planName, userID,
	)
	return err
}

func (s *Store) ClearRequestedPlan(ctx context.Context, userID int64) error {
	_, err := s.pool.Exec(ctx,
		`UPDATE subscriptions SET requested_plan = NULL, updated_at = NOW() WHERE user_id = $1`,
		userID,
	)
	return err
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

// RenewSubscription extends an existing subscription's period end (and marks it
// active) without touching period_start — used for recurring Stripe renewals.
func (s *Store) RenewSubscription(ctx context.Context, userID int64, periodEnd time.Time, notes string) error {
	_, err := s.pool.Exec(ctx,
		`UPDATE subscriptions
		 SET status = 'active', period_end = $2, notes = $3, updated_at = NOW()
		 WHERE user_id = $1`,
		userID, periodEnd, notes,
	)
	return err
}

// TryClaimStripeEvent atomically records a Stripe webhook event id and returns
// true only the first time a given id is seen. Used for webhook idempotency so
// retried/duplicate deliveries are skipped.
func (s *Store) TryClaimStripeEvent(ctx context.Context, eventID, eventType string) (bool, error) {
	tag, err := s.pool.Exec(ctx,
		`INSERT INTO processed_stripe_events (event_id, type) VALUES ($1, $2)
		 ON CONFLICT (event_id) DO NOTHING`,
		eventID, eventType,
	)
	if err != nil {
		return false, err
	}
	return tag.RowsAffected() == 1, nil
}

func (s *Store) UpdateSubscriptionPlan(ctx context.Context, userID int64, planName string) error {
	_, err := s.pool.Exec(ctx,
		`UPDATE subscriptions SET plan_name = $1, updated_at = NOW() WHERE user_id = $2`,
		planName, userID,
	)
	return err
}

func (s *Store) UpdateStripeIDs(ctx context.Context, userID int64, customerID, subscriptionID string) error {
	_, err := s.pool.Exec(ctx,
		`UPDATE subscriptions SET stripe_customer_id = $1, stripe_subscription_id = $2, updated_at = NOW() WHERE user_id = $3`,
		customerID, subscriptionID, userID,
	)
	return err
}

func (s *Store) GetUserIDByStripeCustomer(ctx context.Context, customerID string) (int64, error) {
	var userID int64
	err := s.pool.QueryRow(ctx,
		`SELECT user_id FROM subscriptions WHERE stripe_customer_id = $1`,
		customerID,
	).Scan(&userID)
	return userID, err
}

func (s *Store) ListSubscriptions(ctx context.Context) ([]SubscriptionWithUser, error) {
	query := `
		SELECT
			COALESCE(s.id, 0),
			u.id,
			COALESCE(s.status, 'none'),
			COALESCE(s.plan_name, 'starter'),
			COALESCE(s.requested_plan, ''),
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
		ORDER BY
			(s.requested_plan IS NOT NULL AND s.requested_plan != '') DESC,
			COALESCE(s.updated_at, u.created_at) DESC
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
			&sw.ID, &sw.UserID, &sw.Status, &sw.PlanName, &sw.RequestedPlan,
			&sw.PeriodStart, &sw.PeriodEnd,
			&sw.Notes, &sw.ActivatedBy, &sw.CreatedAt, &sw.UpdatedAt,
			&sw.UserFirstName, &sw.UserLastName, &sw.UserEmail,
		); err != nil {
			return nil, err
		}
		items = append(items, sw)
	}
	return items, rows.Err()
}
