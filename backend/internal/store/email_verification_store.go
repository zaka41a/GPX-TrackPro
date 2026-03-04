package store

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"time"
)

func (s *Store) CreateEmailVerificationToken(ctx context.Context, userID int64) (string, error) {
	_, _ = s.pool.Exec(ctx,
		`DELETE FROM email_verification_tokens WHERE user_id = $1 AND used_at IS NULL`,
		userID,
	)

	raw := make([]byte, 32)
	if _, err := rand.Read(raw); err != nil {
		return "", err
	}
	token := hex.EncodeToString(raw)

	_, err := s.pool.Exec(ctx,
		`INSERT INTO email_verification_tokens (user_id, token, expires_at)
		 VALUES ($1, $2, NOW() + INTERVAL '24 hours')`,
		userID, token,
	)
	if err != nil {
		return "", err
	}
	return token, nil
}

func (s *Store) VerifyEmailToken(ctx context.Context, token string) (int64, error) {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback(ctx)

	var userID int64
	var expiresAt time.Time
	var usedAt *time.Time

	err = tx.QueryRow(ctx,
		`SELECT user_id, expires_at, used_at FROM email_verification_tokens WHERE token = $1`,
		token,
	).Scan(&userID, &expiresAt, &usedAt)
	if err != nil {
		return 0, err
	}
	if usedAt != nil {
		return 0, errTokenAlreadyUsed
	}
	if time.Now().After(expiresAt) {
		return 0, errTokenExpired
	}

	if _, err := tx.Exec(ctx,
		`UPDATE email_verification_tokens SET used_at = NOW() WHERE token = $1`, token,
	); err != nil {
		return 0, err
	}
	if _, err := tx.Exec(ctx,
		`UPDATE users SET email_verified = TRUE WHERE id = $1`, userID,
	); err != nil {
		return 0, err
	}

	return userID, tx.Commit(ctx)
}

func (s *Store) IsEmailVerified(ctx context.Context, userID int64) (bool, error) {
	var verified bool
	err := s.pool.QueryRow(ctx,
		`SELECT email_verified FROM users WHERE id = $1`, userID,
	).Scan(&verified)
	return verified, err
}
