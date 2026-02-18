package main

import (
	"context"
	"fmt"
	"os"
	"strings"

	"gpx-training-analyzer/backend/internal/auth"

	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	email := strings.TrimSpace(os.Getenv("ADMIN_EMAIL"))
	password := strings.TrimSpace(os.Getenv("ADMIN_PASSWORD"))
	firstName := strings.TrimSpace(os.Getenv("ADMIN_FIRST_NAME"))
	lastName := strings.TrimSpace(os.Getenv("ADMIN_LAST_NAME"))

	if email == "" || password == "" {
		fmt.Fprintln(os.Stderr, "ADMIN_EMAIL and ADMIN_PASSWORD are required")
		os.Exit(1)
	}
	if firstName == "" {
		firstName = "Admin"
	}
	if lastName == "" {
		lastName = "User"
	}

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "postgres://postgres:postgres@localhost:5432/gpx_training_analyzer?sslmode=disable"
	}

	hash, err := auth.HashPassword(password)
	if err != nil {
		fmt.Fprintf(os.Stderr, "password error: %v\n", err)
		os.Exit(1)
	}

	ctx := context.Background()
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		fmt.Fprintf(os.Stderr, "db connect error: %v\n", err)
		os.Exit(1)
	}
	defer pool.Close()

	_, err = pool.Exec(ctx, `
		INSERT INTO users (first_name, last_name, email, password_hash, role, status)
		VALUES ($1,$2,LOWER($3),$4,'admin','approved')
		ON CONFLICT (email) DO UPDATE
		SET role = 'admin', status = 'approved', password_hash = EXCLUDED.password_hash
	`, firstName, lastName, email, hash)
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to create/update admin: %v\n", err)
		os.Exit(1)
	}

	fmt.Println("admin user ready:", strings.ToLower(email))
}
