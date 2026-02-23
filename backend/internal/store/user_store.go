package store

import (
	"context"
	"strings"
	"time"
)

type User struct {
	ID           int64     `json:"id"`
	FirstName    string    `json:"firstName"`
	LastName     string    `json:"lastName"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	Role         string    `json:"role"`
	Status       string    `json:"status"`
	AvatarURL    string    `json:"avatarUrl"`
	CreatedAt    time.Time `json:"createdAt"`
}

type AdminAction struct {
	ID           int64     `json:"id"`
	AdminID      int64     `json:"adminId"`
	TargetUserID int64     `json:"targetUserId"`
	Action       string    `json:"action"`
	CreatedAt    time.Time `json:"createdAt"`
	AdminEmail   string    `json:"adminEmail"`
	TargetEmail  string    `json:"targetEmail"`
}

func (s *Store) CreateUser(ctx context.Context, firstName, lastName, email, passwordHash string) (User, error) {
	query := `
		INSERT INTO users (first_name, last_name, email, password_hash, role, status)
		VALUES ($1,$2,LOWER($3),$4,'user','pending')
		RETURNING id, first_name, last_name, email, role::text, status::text, avatar_url, created_at
	`
	var u User
	err := s.pool.QueryRow(ctx, query, strings.TrimSpace(firstName), strings.TrimSpace(lastName), strings.TrimSpace(email), passwordHash).Scan(
		&u.ID, &u.FirstName, &u.LastName, &u.Email, &u.Role, &u.Status, &u.AvatarURL, &u.CreatedAt,
	)
	if err != nil {
		return User{}, err
	}
	return u, nil
}

func (s *Store) GetUserByEmail(ctx context.Context, email string) (User, error) {
	query := `
		SELECT id, first_name, last_name, email, password_hash, role::text, status::text, avatar_url, created_at
		FROM users WHERE email = LOWER($1)
	`
	var u User
	err := s.pool.QueryRow(ctx, query, strings.TrimSpace(email)).Scan(
		&u.ID, &u.FirstName, &u.LastName, &u.Email, &u.PasswordHash, &u.Role, &u.Status, &u.AvatarURL, &u.CreatedAt,
	)
	if err != nil {
		return User{}, err
	}
	return u, nil
}

func (s *Store) GetUserByID(ctx context.Context, id int64) (User, error) {
	query := `
		SELECT id, first_name, last_name, email, password_hash, role::text, status::text, avatar_url, created_at
		FROM users WHERE id = $1
	`
	var u User
	err := s.pool.QueryRow(ctx, query, id).Scan(
		&u.ID, &u.FirstName, &u.LastName, &u.Email, &u.PasswordHash, &u.Role, &u.Status, &u.AvatarURL, &u.CreatedAt,
	)
	if err != nil {
		return User{}, err
	}
	return u, nil
}

func (s *Store) ListUsers(ctx context.Context, search, status string) ([]User, error) {
	base := `
		SELECT id, first_name, last_name, email, role::text, status::text, avatar_url, created_at
		FROM users
	`
	conditions := make([]string, 0)
	args := make([]any, 0)
	argN := 1

	if strings.TrimSpace(search) != "" {
		conditions = append(conditions, "(LOWER(email) LIKE LOWER($"+itoa(argN)+") OR LOWER(first_name) LIKE LOWER($"+itoa(argN)+") OR LOWER(last_name) LIKE LOWER($"+itoa(argN)+"))")
		args = append(args, "%"+strings.TrimSpace(search)+"%")
		argN++
	}
	if strings.TrimSpace(status) != "" {
		conditions = append(conditions, "status::text = $"+itoa(argN))
		args = append(args, strings.TrimSpace(status))
		argN++
	}

	query := base
	if len(conditions) > 0 {
		query += " WHERE " + strings.Join(conditions, " AND ")
	}
	query += " ORDER BY created_at DESC LIMIT 200"

	rows, err := s.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	list := make([]User, 0)
	for rows.Next() {
		var u User
		if err := rows.Scan(&u.ID, &u.FirstName, &u.LastName, &u.Email, &u.Role, &u.Status, &u.AvatarURL, &u.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, u)
	}
	return list, rows.Err()
}

func (s *Store) UpdateUserAvatar(ctx context.Context, userID int64, avatarURL string) error {
	_, err := s.pool.Exec(ctx, `UPDATE users SET avatar_url = $1 WHERE id = $2`, avatarURL, userID)
	return err
}

func (s *Store) UpdateUserStatus(ctx context.Context, adminID, targetUserID int64, status string) error {
	action := "approve"
	if status == "rejected" {
		action = "reject"
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, `UPDATE users SET status = $1 WHERE id = $2`, status, targetUserID); err != nil {
		return err
	}
	if _, err := tx.Exec(ctx, `INSERT INTO admin_actions (admin_id, target_user_id, action) VALUES ($1,$2,$3)`, adminID, targetUserID, action); err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func (s *Store) ListAdminActions(ctx context.Context, limit int) ([]AdminAction, error) {
	if limit <= 0 || limit > 500 {
		limit = 100
	}
	query := `
		SELECT a.id, a.admin_id, a.target_user_id, a.action, a.created_at,
			u1.email AS admin_email,
			u2.email AS target_email
		FROM admin_actions a
		JOIN users u1 ON u1.id = a.admin_id
		JOIN users u2 ON u2.id = a.target_user_id
		ORDER BY a.created_at DESC
		LIMIT $1
	`
	rows, err := s.pool.Query(ctx, query, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]AdminAction, 0)
	for rows.Next() {
		var a AdminAction
		if err := rows.Scan(&a.ID, &a.AdminID, &a.TargetUserID, &a.Action, &a.CreatedAt, &a.AdminEmail, &a.TargetEmail); err != nil {
			return nil, err
		}
		items = append(items, a)
	}
	return items, rows.Err()
}

func (s *Store) DeleteUser(ctx context.Context, userID int64) error {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	_, _ = tx.Exec(ctx, `DELETE FROM admin_actions WHERE target_user_id = $1 OR admin_id = $1`, userID)
	_, _ = tx.Exec(ctx, `DELETE FROM activities WHERE user_id = $1`, userID)
	if _, err := tx.Exec(ctx, `DELETE FROM users WHERE id = $1`, userID); err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func (s *Store) ListApprovedUsers(ctx context.Context) ([]User, error) {
	query := `
		SELECT id, first_name, last_name, email, role::text, status::text, avatar_url, created_at
		FROM users
		WHERE status::text = 'approved'
		ORDER BY first_name, last_name
	`
	rows, err := s.pool.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	list := make([]User, 0)
	for rows.Next() {
		var u User
		if err := rows.Scan(&u.ID, &u.FirstName, &u.LastName, &u.Email, &u.Role, &u.Status, &u.AvatarURL, &u.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, u)
	}
	return list, rows.Err()
}

func itoa(v int) string {
	if v == 0 {
		return "0"
	}
	buf := [12]byte{}
	i := len(buf)
	for v > 0 {
		i--
		buf[i] = byte('0' + (v % 10))
		v /= 10
	}
	return string(buf[i:])
}
