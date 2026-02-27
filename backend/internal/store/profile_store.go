package store

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
)

// AthleteProfile holds the extended athlete data for a user.
type AthleteProfile struct {
	UserID          int64     `json:"userId"`
	Bio             string    `json:"bio"`
	Phone           string    `json:"phone"`
	DateOfBirth     string    `json:"dateOfBirth"` // "YYYY-MM-DD" or ""
	Gender          string    `json:"gender"`
	Country         string    `json:"country"`
	City            string    `json:"city"`
	Height          *float64  `json:"height"`
	Weight          *float64  `json:"weight"`
	PrimarySport    string    `json:"primarySport"`
	SecondarySports []string  `json:"secondarySports"`
	ExperienceLevel string    `json:"experienceLevel"`
	WeeklyGoalHours *float64  `json:"weeklyGoalHours"`
	AvatarURL       string    `json:"avatarUrl"`
	SportPhotoURL   string    `json:"sportPhotoUrl"`
	CreatedAt       time.Time `json:"createdAt"`
	UpdatedAt       time.Time `json:"updatedAt"`
}

// GetProfile returns the athlete profile for the given user. If no profile row
// exists yet, a default is returned populated from the users table.
func (s *Store) GetProfile(ctx context.Context, userID int64) (AthleteProfile, error) {
	query := `
		SELECT ap.user_id,
			COALESCE(ap.bio, ''),
			COALESCE(ap.phone, ''),
			to_char(ap.date_of_birth, 'YYYY-MM-DD'),
			COALESCE(ap.gender, ''),
			COALESCE(ap.country, ''),
			COALESCE(ap.city, ''),
			ap.height_cm,
			ap.weight_kg,
			COALESCE(ap.primary_sport, 'cycling'),
			COALESCE(ap.secondary_sports, '{}'),
			COALESCE(ap.experience_level, 'intermediate'),
			ap.weekly_goal_hours,
			COALESCE(u.avatar_url, ''),
			COALESCE(ap.sport_photo_url, ''),
			ap.created_at,
			ap.updated_at
		FROM athlete_profiles ap
		JOIN users u ON u.id = ap.user_id
		WHERE ap.user_id = $1
	`
	var p AthleteProfile
	var dob *string
	err := s.pool.QueryRow(ctx, query, userID).Scan(
		&p.UserID, &p.Bio, &p.Phone,
		&dob, &p.Gender, &p.Country, &p.City,
		&p.Height, &p.Weight,
		&p.PrimarySport, &p.SecondarySports,
		&p.ExperienceLevel, &p.WeeklyGoalHours,
		&p.AvatarURL, &p.SportPhotoURL,
		&p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			// Return default profile with avatar from users table
			return s.defaultProfile(ctx, userID)
		}
		return AthleteProfile{}, err
	}
	if dob != nil {
		p.DateOfBirth = *dob
	}
	if p.SecondarySports == nil {
		p.SecondarySports = []string{}
	}
	return p, nil
}

func (s *Store) defaultProfile(ctx context.Context, userID int64) (AthleteProfile, error) {
	var avatarURL string
	_ = s.pool.QueryRow(ctx, `SELECT COALESCE(avatar_url, '') FROM users WHERE id = $1`, userID).Scan(&avatarURL)
	return AthleteProfile{
		UserID:          userID,
		PrimarySport:    "cycling",
		ExperienceLevel: "intermediate",
		SecondarySports: []string{},
		AvatarURL:       avatarURL,
	}, nil
}

// UpsertProfile creates or updates the athlete profile for a user.
func (s *Store) UpsertProfile(ctx context.Context, userID int64, p AthleteProfile) (AthleteProfile, error) {
	// Normalise empty date → NULL
	var dob *string
	if strings.TrimSpace(p.DateOfBirth) != "" {
		dob = &p.DateOfBirth
	}
	if p.SecondarySports == nil {
		p.SecondarySports = []string{}
	}
	if p.PrimarySport == "" {
		p.PrimarySport = "cycling"
	}
	if p.ExperienceLevel == "" {
		p.ExperienceLevel = "intermediate"
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return AthleteProfile{}, err
	}
	defer tx.Rollback(ctx)

	_, err = tx.Exec(ctx, `
		INSERT INTO athlete_profiles (
			user_id, bio, phone, date_of_birth, gender, country, city,
			height_cm, weight_kg, primary_sport, secondary_sports,
			experience_level, weekly_goal_hours, sport_photo_url
		) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
		ON CONFLICT (user_id) DO UPDATE SET
			bio              = EXCLUDED.bio,
			phone            = EXCLUDED.phone,
			date_of_birth    = EXCLUDED.date_of_birth,
			gender           = EXCLUDED.gender,
			country          = EXCLUDED.country,
			city             = EXCLUDED.city,
			height_cm        = EXCLUDED.height_cm,
			weight_kg        = EXCLUDED.weight_kg,
			primary_sport    = EXCLUDED.primary_sport,
			secondary_sports = EXCLUDED.secondary_sports,
			experience_level = EXCLUDED.experience_level,
			weekly_goal_hours = EXCLUDED.weekly_goal_hours,
			sport_photo_url  = EXCLUDED.sport_photo_url,
			updated_at       = now()
	`,
		userID, p.Bio, p.Phone, dob, p.Gender, p.Country, p.City,
		p.Height, p.Weight, p.PrimarySport, p.SecondarySports,
		p.ExperienceLevel, p.WeeklyGoalHours, p.SportPhotoURL,
	)
	if err != nil {
		return AthleteProfile{}, err
	}

	// Sync avatar to users table if provided
	if strings.TrimSpace(p.AvatarURL) != "" {
		_, _ = tx.Exec(ctx, `UPDATE users SET avatar_url = $1 WHERE id = $2`, p.AvatarURL, userID)
	}

	if err := tx.Commit(ctx); err != nil {
		return AthleteProfile{}, err
	}

	return s.GetProfile(ctx, userID)
}
