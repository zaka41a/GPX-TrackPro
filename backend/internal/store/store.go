package store

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"time"

	"gpx-training-analyzer/backend/internal/gpx"
	"gpx-training-analyzer/backend/internal/metrics"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Activity struct {
	ID           int64          `json:"id"`
	UserID       *int64         `json:"userId,omitempty"`
	FileName     string         `json:"fileName"`
	SportType    string         `json:"sportType"`
	Name         string         `json:"name"`
	ActivityDate time.Time      `json:"activityDate"`
	Metrics      metrics.Result `json:"metrics"`
	Points       []gpx.Point    `json:"points"`
	CreatedAt    time.Time      `json:"createdAt"`
}

type Store struct {
	pool *pgxpool.Pool
}

func New(ctx context.Context) (*Store, error) {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "postgres://postgres:postgres@localhost:5432/gpx_training_analyzer?sslmode=disable"
	}
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to connect db: %w", err)
	}
	if err := pool.Ping(ctx); err != nil {
		return nil, fmt.Errorf("failed to ping db: %w", err)
	}
	return &Store{pool: pool}, nil
}

func (s *Store) Close() {
	s.pool.Close()
}

func (s *Store) CreateActivity(ctx context.Context, userID int64, fileName, sportType string, parsed gpx.ParsedActivity, m metrics.Result) (Activity, error) {
	pointsJSON, err := json.Marshal(parsed.Points)
	if err != nil {
		return Activity{}, err
	}

	query := `
		INSERT INTO activities (
			user_id,
			file_name, sport_type, activity_name, activity_date,
			distance_km, duration_sec, avg_speed_kmh, max_speed_kmh, pace_min_km,
			elev_gain_m, elev_loss_m, max_elev_m, min_elev_m,
			avg_hr, max_hr, avg_cadence, track_points
		) VALUES (
			$1,$2,$3,$4,$5,
			$6,$7,$8,$9,$10,
			$11,$12,$13,$14,
			$15,$16,$17,$18
		)
		RETURNING id, created_at
	`

	var id int64
	var createdAt time.Time
	err = s.pool.QueryRow(ctx, query,
		userID, fileName, sportType, parsed.Name, m.ActivityDate,
		m.DistanceKM, m.DurationSec, m.AvgSpeedKMH, m.MaxSpeedKMH, m.PaceMinPerKM,
		m.ElevGainM, m.ElevLossM, m.MaxElevM, m.MinElevM,
		m.AvgHR, m.MaxHR, m.AvgCadence, pointsJSON,
	).Scan(&id, &createdAt)
	if err != nil {
		return Activity{}, err
	}

	return Activity{
		ID:           id,
		UserID:       &userID,
		FileName:     fileName,
		SportType:    sportType,
		Name:         parsed.Name,
		ActivityDate: m.ActivityDate,
		Metrics:      m,
		Points:       parsed.Points,
		CreatedAt:    createdAt,
	}, nil
}

func (s *Store) GetActivity(ctx context.Context, id, userID int64) (Activity, error) {
	query := `
		SELECT id, user_id, file_name, sport_type, activity_name, activity_date,
			distance_km, duration_sec, avg_speed_kmh, max_speed_kmh, pace_min_km,
			elev_gain_m, elev_loss_m, max_elev_m, min_elev_m,
			avg_hr, max_hr, avg_cadence, track_points, created_at
		FROM activities
		WHERE id = $1 AND user_id = $2
	`

	var activity Activity
	var trackJSON []byte
	err := s.pool.QueryRow(ctx, query, id, userID).Scan(
		&activity.ID,
		&activity.UserID,
		&activity.FileName,
		&activity.SportType,
		&activity.Name,
		&activity.ActivityDate,
		&activity.Metrics.DistanceKM,
		&activity.Metrics.DurationSec,
		&activity.Metrics.AvgSpeedKMH,
		&activity.Metrics.MaxSpeedKMH,
		&activity.Metrics.PaceMinPerKM,
		&activity.Metrics.ElevGainM,
		&activity.Metrics.ElevLossM,
		&activity.Metrics.MaxElevM,
		&activity.Metrics.MinElevM,
		&activity.Metrics.AvgHR,
		&activity.Metrics.MaxHR,
		&activity.Metrics.AvgCadence,
		&trackJSON,
		&activity.CreatedAt,
	)
	if err != nil {
		return Activity{}, err
	}
	activity.Metrics.ActivityDate = activity.ActivityDate

	if err := json.Unmarshal(trackJSON, &activity.Points); err != nil {
		return Activity{}, err
	}

	return activity, nil
}

func (s *Store) ListActivities(ctx context.Context, userID int64) ([]Activity, error) {
	query := `
		SELECT id, user_id, file_name, sport_type, activity_name, activity_date,
			distance_km, duration_sec, avg_speed_kmh, max_speed_kmh, pace_min_km,
			elev_gain_m, elev_loss_m, max_elev_m, min_elev_m,
			avg_hr, max_hr, avg_cadence, created_at
		FROM activities
		WHERE user_id = $1
		ORDER BY activity_date DESC
		LIMIT 100
	`

	rows, err := s.pool.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	activities := make([]Activity, 0)
	for rows.Next() {
		var a Activity
		err := rows.Scan(
			&a.ID,
			&a.UserID,
			&a.FileName,
			&a.SportType,
			&a.Name,
			&a.ActivityDate,
			&a.Metrics.DistanceKM,
			&a.Metrics.DurationSec,
			&a.Metrics.AvgSpeedKMH,
			&a.Metrics.MaxSpeedKMH,
			&a.Metrics.PaceMinPerKM,
			&a.Metrics.ElevGainM,
			&a.Metrics.ElevLossM,
			&a.Metrics.MaxElevM,
			&a.Metrics.MinElevM,
			&a.Metrics.AvgHR,
			&a.Metrics.MaxHR,
			&a.Metrics.AvgCadence,
			&a.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		a.Metrics.ActivityDate = a.ActivityDate
		activities = append(activities, a)
	}
	return activities, rows.Err()
}
