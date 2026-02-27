package store

import (
	"context"
	"time"
)

func (s *Store) CreatePasswordResetToken(ctx context.Context, userID int64, token string, expiresAt time.Time) error {
	// Delete any existing tokens for this user first
	_, _ = s.pool.Exec(ctx, `DELETE FROM password_reset_tokens WHERE user_id = $1`, userID)
	_, err := s.pool.Exec(ctx,
		`INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
		userID, token, expiresAt,
	)
	return err
}

// GetPasswordResetUserID returns the userID for a valid (non-expired) token.
func (s *Store) GetPasswordResetUserID(ctx context.Context, token string) (int64, error) {
	var userID int64
	err := s.pool.QueryRow(ctx,
		`SELECT user_id FROM password_reset_tokens WHERE token = $1 AND expires_at > now()`,
		token,
	).Scan(&userID)
	return userID, err
}

func (s *Store) DeletePasswordResetToken(ctx context.Context, token string) error {
	_, err := s.pool.Exec(ctx, `DELETE FROM password_reset_tokens WHERE token = $1`, token)
	return err
}
