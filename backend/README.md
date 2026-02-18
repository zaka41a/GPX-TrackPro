# Backend (Go + PostgreSQL)

## Environment

- `DATABASE_URL` (default: `postgres://postgres:postgres@localhost:5432/gpx_training_analyzer?sslmode=disable`)
- `PORT` (default: `8080`)
- `JWT_SECRET` (used in Part 2 for auth)

## Database setup

```sql
CREATE DATABASE gpx_training_analyzer;
```

```bash
export DATABASE_URL='postgres://postgres:postgres@localhost:5432/gpx_training_analyzer?sslmode=disable'
./scripts/apply_migrations.sh
```

## Start API

```bash
go mod tidy
go run ./cmd/server
```

## Bootstrap admin

```bash
export ADMIN_EMAIL='admin@gpx.local'
export ADMIN_PASSWORD='Admin12345!'
export ADMIN_FIRST_NAME='Platform'
export ADMIN_LAST_NAME='Admin'
go run ./cmd/create_admin
```

## Current endpoints

Public:
- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`

Authenticated:
- `GET /api/auth/me`
- `POST /api/activities/upload`
- `GET /api/activities`
- `GET /api/activities/{id}`

Admin:
- `GET /api/admin/users`
- `PATCH /api/admin/users/{id}/approve`
- `PATCH /api/admin/users/{id}/reject`
- `GET /api/admin/actions`
