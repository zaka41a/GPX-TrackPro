# Backend (Go + PostgreSQL)

## Environment

- `DATABASE_URL` (default: `postgres://postgres:postgres@localhost:5432/gpx_training_analyzer?sslmode=disable`)
- `PORT` (default: `8080`)
- `JWT_SECRET` (used for auth token signing)

## Database setup

```sql
CREATE DATABASE gpx_training_analyzer;
```

```bash
export DATABASE_URL='postgres://postgres:postgres@localhost:5432/gpx_training_analyzer?sslmode=disable'
./scripts/apply_migrations.sh
```

### Migrations

| File | Description |
|------|-------------|
| `001_init.sql` | Users, activities, admin_actions, contact_messages |
| `002_legacy_compat.sql` | Add user_id to activities (backwards compat) |
| `003_community.sql` | Community posts, comments, reactions, DMs, bans |

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

## API Endpoints

### Public
- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`

### Authenticated (approved user)
- `GET /api/auth/me`
- `POST /api/activities/upload`
- `GET /api/activities`
- `GET /api/activities/{id}`
- `GET /api/users/approved` — list all approved users

### Community (approved user)
- `GET /api/community/posts?cursor=&limit=` — list posts (cursor-based pagination)
- `POST /api/community/posts` — create post `{content, activityId?}`
- `GET /api/community/posts/{id}` — get post with comments & reactions
- `DELETE /api/community/posts/{id}` — delete post (author or admin)
- `POST /api/community/posts/{id}/comments` — add comment `{content}`
- `DELETE /api/community/comments/{id}` — delete comment (author or admin)
- `POST /api/community/posts/{id}/reactions` — toggle reaction `{emoji}`
- `PUT /api/community/posts/{id}/pin` — pin/unpin post (admin only) `{pinned}`

### Messaging (approved user)
- `GET /api/messages/conversations` — list conversations with last message & unread count
- `POST /api/messages/conversations` — start/get conversation `{userId}`
- `GET /api/messages/conversations/{id}/messages?cursor=&limit=` — list messages
- `POST /api/messages/conversations/{id}/messages` — send message `{content}`
- `POST /api/messages/conversations/{id}/read` — mark messages as read
- `GET /api/messages/unread-count` — unread message count (for badge)

### Moderation (admin only)
- `POST /api/community/bans` — ban user `{userId, reason}`
- `DELETE /api/community/bans/{userId}` — unban user
- `GET /api/community/bans` — list banned users

### Admin
- `GET /api/admin/users` — list all users (search & filter)
- `PATCH /api/admin/users/{id}/approve`
- `PATCH /api/admin/users/{id}/reject`
- `DELETE /api/admin/users/{id}` — delete user
- `GET /api/admin/actions` — admin action timeline
