<div align="center">

<img src="docs/logo.png" alt="GPX TrackPro" width="140" height="140" style="border-radius: 24px;" />

<br />

# GPX TrackPro

### Sports Activity Analysis Platform for GPX Files

<br />

[![Go](https://img.shields.io/badge/Go-1.25-00ADD8?style=for-the-badge&logo=go&logoColor=white)](https://go.dev/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docs.docker.com/compose/)
[![CI](https://img.shields.io/badge/CI-GitHub_Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white)](https://github.com/features/actions)

<br />

[![Tests Backend](https://img.shields.io/badge/Tests_Go-15%20passed-success?style=flat-square&logo=checkmarx&logoColor=white)](/)
[![Tests Frontend](https://img.shields.io/badge/Tests_Vitest-12%20passed-success?style=flat-square&logo=vitest&logoColor=white)](/)
[![PWA](https://img.shields.io/badge/PWA-Offline_Ready-blueviolet?style=flat-square&logo=pwa&logoColor=white)](/)
[![License](https://img.shields.io/badge/License-Academic-lightgrey?style=flat-square)](/)

<br />

A full-stack web application for uploading, parsing, and analyzing GPX 1.1 files<br />
with Garmin extension support (heart rate, cadence).<br />
Features an interactive dashboard with Leaflet maps, Recharts elevation profiles,<br />
advanced sport metrics, role-based user management, and offline-ready PWA mode.

<br />

[Quick Start](#-quick-start) &nbsp;&middot;&nbsp; [API Docs](#-api-reference) &nbsp;&middot;&nbsp; [Docker](#-docker-compose) &nbsp;&middot;&nbsp; [Tests](#-tests)

</div>

<br />

---

<br />

## Pages Overview

<table>
  <tr>
    <td width="50%">
      <strong>Landing Page</strong><br />
      <sub>Animated hero, stat counters, feature grid, "How it works" stepper, CTA section</sub>
    </td>
    <td width="50%">
      <strong>Authentication</strong><br />
      <sub>Split-layout (brand panel + form), password strength indicator, admin approval workflow</sub>
    </td>
  </tr>
  <tr>
    <td>
      <strong>User Dashboard</strong><br />
      <sub>4 real-time KPIs, recent activities with sport badges, quick actions</sub>
    </td>
    <td>
      <strong>Activity Detail</strong><br />
      <sub>10 metrics, Recharts elevation profile, interactive Leaflet/OSM map, JSON/CSV export</sub>
    </td>
  </tr>
  <tr>
    <td>
      <strong>Upload GPX</strong><br />
      <sub>Drag & drop zone, sport type selection, real-time progress bar</sub>
    </td>
    <td>
      <strong>Admin Dashboard</strong><br />
      <sub>User KPIs, approve/reject table, chronological audit log</sub>
    </td>
  </tr>
</table>

<br />

---

<br />

## Key Features

<table>
  <tr>
    <td width="33%" valign="top">
      <h3>Authentication & RBAC</h3>
      <ul>
        <li>Registration with admin approval workflow<br /><code>pending</code> &#8594; <code>approved</code> / <code>rejected</code></li>
        <li>JWT authentication (HMAC-SHA256)</li>
        <li>Role-based access: <code>admin</code> / <code>user</code></li>
        <li>Salted password hashing (SHA-256)</li>
        <li>Constant-time comparison (timing-attack safe)</li>
        <li>Admin action audit log</li>
      </ul>
    </td>
    <td width="33%" valign="top">
      <h3>GPX Parsing & Metrics</h3>
      <ul>
        <li>Full GPX 1.1 + multi-segment support</li>
        <li>Garmin extensions (HR, cadence)</li>
        <li>10 auto-computed metrics</li>
        <li>Haversine formula (distance)</li>
        <li>Performance &lt; 3s (2h activity)</li>
        <li>Graceful degradation without sensors</li>
      </ul>
    </td>
    <td width="33%" valign="top">
      <h3>Visualization & Export</h3>
      <ul>
        <li>Interactive elevation profile (Recharts)</li>
        <li>GPS route map on OpenStreetMap (Leaflet)</li>
        <li>Auto-fit bounds on route trace</li>
        <li>Smart downsampling for performance</li>
        <li>JSON & CSV export</li>
        <li>PWA with offline caching</li>
      </ul>
    </td>
  </tr>
</table>

<br />

### 10 Computed Metrics

| # | Metric | Unit | Algorithm |
|---|--------|------|-----------|
| 1 | **Distance** | km | Haversine formula (Earth radius = 6,371 km) |
| 2 | **Duration** | min | Delta between first and last GPS point |
| 3 | **Average Speed** | km/h | Total distance / duration |
| 4 | **Max Speed** | km/h | Max inter-point speed (capped at 120 km/h for noise filtering) |
| 5 | **Pace** | min/km | Inverse of average speed |
| 6 | **Elevation Gain (D+)** | m | Cumulative positive altitude changes |
| 7 | **Elevation Loss (D-)** | m | Cumulative negative altitude changes |
| 8 | **Average Heart Rate** | bpm | Mean of points with HR extension data |
| 9 | **Max Heart Rate** | bpm | Maximum HR value across all points |
| 10 | **Average Cadence** | rpm | Mean of points with cadence extension data |

<br />

---

<br />

## Architecture

```
                         +-----------------------+
                         |       Browser         |
                         |   React 18 SPA (PWA)  |
                         |   Tailwind + shadcn   |
                         +-----------+-----------+
                                     |
                                HTTPS / REST
                                     |
                         +-----------+-----------+
                         |        Nginx          |
                         |    Reverse Proxy      |
                         |  Static files + /api  |
                         +-----------+-----------+
                                     |
                                 /api/*
                                     |
              +----------------------+----------------------+
              |                                             |
   +----------+----------+                       +----------+----------+
   |   Go Backend API    |                       |    Service Worker   |
   |                     |                       |      (Workbox)      |
   |  +---------------+  |                       |                     |
   |  | api/handlers  |  |                       |  - Cache API calls  |
   |  +-------+-------+  |                       |  - Cache OSM tiles  |
   |          |          |                      |  - Offline support |
   |  +-------+-------+  |                       +---------------------+
   |  | auth (JWT)    |  |
   |  +-------+-------+  |
   |          |          |
   |  +-------+-------+  |
   |  | gpx/parser    |  |
   |  | metrics/calc  |  |
   |  +-------+-------+  |
   |          |          |
   |  +-------+-------+  |
   |  | store (pgx)   |  |
   |  +-------+-------+  |
   +----------+----------+
              |
         pgx/v5 pool
              |
   +----------+----------+
   |   PostgreSQL 16     |
   |                     |
   |  users              |
   |  activities (JSONB) |
   |  admin_actions      |
   +---------------------+
```

<br />

### Separation of Concerns

| Package | Responsibility | Dependencies |
|---------|---------------|--------------|
| `cmd/server` | HTTP entry point, graceful shutdown | api, store |
| `internal/api` | Routing, CORS/auth middleware, REST handlers | auth, gpx, metrics, store |
| `internal/auth` | JWT issue/validate, password hashing | stdlib only |
| `internal/gpx` | GPX 1.1 XML parsing, Garmin extension extraction | stdlib only |
| `internal/metrics` | Haversine, elevation, HR, cadence, pace | gpx (types) |
| `internal/store` | PostgreSQL connection pool, CRUD, entity mapping | pgx/v5 |

<br />

---

<br />

## Tech Stack

<table>
  <tr>
    <th width="20%">Layer</th>
    <th>Technologies</th>
  </tr>
  <tr>
    <td><strong>Backend</strong></td>
    <td>
      <img src="https://img.shields.io/badge/Go-1.25-00ADD8?style=flat-square&logo=go&logoColor=white" />
      <img src="https://img.shields.io/badge/net/http-stdlib-00ADD8?style=flat-square" />
      <img src="https://img.shields.io/badge/pgx/v5-PostgreSQL-4169E1?style=flat-square" />
      <img src="https://img.shields.io/badge/JWT-HMAC--SHA256-orange?style=flat-square" />
    </td>
  </tr>
  <tr>
    <td><strong>Frontend</strong></td>
    <td>
      <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=white" />
      <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white" />
      <img src="https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white" />
      <img src="https://img.shields.io/badge/Tailwind-3-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" />
    </td>
  </tr>
  <tr>
    <td><strong>UI</strong></td>
    <td>
      <img src="https://img.shields.io/badge/shadcn/ui-Components-000?style=flat-square" />
      <img src="https://img.shields.io/badge/Radix_UI-Primitives-161618?style=flat-square" />
      <img src="https://img.shields.io/badge/Framer_Motion-Animations-FF0050?style=flat-square" />
      <img src="https://img.shields.io/badge/Lucide-Icons-F56040?style=flat-square" />
    </td>
  </tr>
  <tr>
    <td><strong>Data Viz</strong></td>
    <td>
      <img src="https://img.shields.io/badge/Recharts-Charts-FF6384?style=flat-square" />
      <img src="https://img.shields.io/badge/Leaflet-Maps-199900?style=flat-square&logo=leaflet&logoColor=white" />
      <img src="https://img.shields.io/badge/OpenStreetMap-Tiles-7EBC6F?style=flat-square" />
    </td>
  </tr>
  <tr>
    <td><strong>Database</strong></td>
    <td>
      <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white" />
      <img src="https://img.shields.io/badge/Migrations-Versioned_SQL-4169E1?style=flat-square" />
      <img src="https://img.shields.io/badge/JSONB-Track_Points-4169E1?style=flat-square" />
    </td>
  </tr>
  <tr>
    <td><strong>DevOps</strong></td>
    <td>
      <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white" />
      <img src="https://img.shields.io/badge/Nginx-Reverse_Proxy-009639?style=flat-square&logo=nginx&logoColor=white" />
      <img src="https://img.shields.io/badge/GitHub_Actions-CI/CD-2088FF?style=flat-square&logo=githubactions&logoColor=white" />
    </td>
  </tr>
  <tr>
    <td><strong>Testing</strong></td>
    <td>
      <img src="https://img.shields.io/badge/Go_testing-15_tests-success?style=flat-square" />
      <img src="https://img.shields.io/badge/Vitest-12_tests-success?style=flat-square&logo=vitest&logoColor=white" />
      <img src="https://img.shields.io/badge/Testing_Library-React-E33332?style=flat-square" />
    </td>
  </tr>
  <tr>
    <td><strong>PWA</strong></td>
    <td>
      <img src="https://img.shields.io/badge/Workbox-Service_Worker-FF6D00?style=flat-square" />
      <img src="https://img.shields.io/badge/vite--plugin--pwa-Auto_Update-646CFF?style=flat-square" />
      <img src="https://img.shields.io/badge/Offline-Cache_First-blueviolet?style=flat-square" />
    </td>
  </tr>
</table>

<br />

---

<br />

## Quick Start

### Prerequisites

| Tool | Version | Installation |
|------|---------|-------------|
| **Go** | >= 1.25 | [go.dev/dl](https://go.dev/dl/) |
| **Node.js** | >= 20 | [nodejs.org](https://nodejs.org/) |
| **PostgreSQL** | >= 16 | `brew install postgresql@16` |
| **npm** | >= 10 | Included with Node.js |

<br />

### Setup in 6 Steps

<details>
<summary><strong>Step 1 &mdash; Clone the repository</strong></summary>

```bash
git clone <url>
cd GPX-Training-Analyzer
```

</details>

<details>
<summary><strong>Step 2 &mdash; Create the database</strong></summary>

```bash
# Create the PostgreSQL database
createdb gpx_training_analyzer

# Apply SQL migrations
cd backend && bash scripts/apply_migrations.sh
```

> Migrations are idempotent and versioned in `backend/migrations/`

</details>

<details>
<summary><strong>Step 3 &mdash; Create an admin account</strong></summary>

```bash
DATABASE_URL="postgres://<user>@localhost:5432/gpx_training_analyzer?sslmode=disable" \
ADMIN_EMAIL="admin@gpxtrackpro.com" \
ADMIN_PASSWORD="Admin123!" \
go run ./cmd/create_admin
```

> Replace `<user>` with your PostgreSQL username (e.g., `zakaria`, `postgres`)

</details>

<details>
<summary><strong>Step 4 &mdash; Start the backend</strong></summary>

```bash
DATABASE_URL="postgres://<user>@localhost:5432/gpx_training_analyzer?sslmode=disable" \
JWT_SECRET="your-secret-key" \
PORT=8083 \
go run ./cmd/server
```

```
2026/02/18 backend listening on http://localhost:8083
```

</details>

<details>
<summary><strong>Step 5 &mdash; Start the frontend</strong></summary>

```bash
cd frontend
npm install
npm run dev
```

```
VITE v5.4.19  ready in 500 ms
  -> Local: http://localhost:8081/
```

</details>

<details>
<summary><strong>Step 6 &mdash; Log in and test</strong></summary>

1. Open `http://localhost:8081`
2. Log in with the admin credentials from Step 3
3. Go to **Upload GPX** and upload `test-data/sample_run.gpx`
4. View the activity detail page: metrics, elevation profile, interactive map

</details>

<br />

---

<br />

## Docker Compose

Launch the entire stack with a single command:

```bash
# Start all services (build + start)
docker compose up --build -d

# Follow the logs
docker compose logs -f

# Stop all services
docker compose down

# Stop and remove volumes
docker compose down -v
```

<br />

| Service | URL | Internal Port | Description |
|---------|-----|:---:|-------------|
| **Frontend** | [`http://localhost:8081`](http://localhost:8081) | 80 | React SPA served by Nginx |
| **Backend** | [`http://localhost:8083`](http://localhost:8083) | 8080 | Go REST API |
| **PostgreSQL** | `localhost:5432` | 5432 | Database with persistent volume |

<br />

### Docker Architecture

```
docker compose up
      |
      +---> db (postgres:16-alpine)
      |       - Persistent pgdata volume
      |       - pg_isready healthcheck
      |       - Auto migrations (initdb.d)
      |
      +---> backend (Go multi-stage build)
      |       - Waits for db health
      |       - Statically compiled binary
      |       - Final image < 15 MB
      |
      +---> frontend (Node build + Nginx)
              - Optimized React build
              - Nginx reverse proxy /api -> backend
              - Gzip + static asset caching
```

<br />

---

<br />

## Tests

### Backend (Go) &mdash; 15 tests

```bash
cd backend
go test ./... -v
```

| Package | Tests | Coverage |
|---------|:-----:|----------|
| `internal/auth` | **9** | `IssueToken` / `ParseToken` (valid, expired, tampered, no secret, bad format) + `HashPassword` / `VerifyPassword` (hash, verify, unique salts, too short, invalid format) |
| `internal/gpx` | **4** | Full GPX parsing, Garmin HR/cadence extensions, default naming, no track error, < 2 points error |
| `internal/metrics` | **2** | Full computation (distance, speed, pace, D+, D-, HR, cadence, date) + graceful degradation without timestamps/sensors |

```
--- PASS: TestHashPassword_And_Verify (0.00s)
--- PASS: TestHashPassword_TooShort (0.00s)
--- PASS: TestHashPassword_UniqueSalts (0.00s)
--- PASS: TestVerifyPassword_InvalidFormat (0.00s)
--- PASS: TestIssueToken_And_Parse (0.00s)
--- PASS: TestParseToken_Expired (0.00s)
--- PASS: TestParseToken_InvalidSignature (0.00s)
--- PASS: TestParseToken_InvalidFormat (0.00s)
--- PASS: TestIssueToken_NoSecret (0.00s)
--- PASS: TestParse_WithGarminExtensions (0.00s)
--- PASS: TestParse_WithoutTrackName_UsesDefault (0.00s)
--- PASS: TestParse_NoTrack_ReturnsError (0.00s)
--- PASS: TestParse_LessThanTwoPoints_ReturnsError (0.00s)
--- PASS: TestCompute_WithTimeElevationAndSensors (0.00s)
--- PASS: TestCompute_WithoutTimeSensors (0.00s)
PASS - 15/15
```

<br />

### Frontend (Vitest) &mdash; 12 tests

```bash
cd frontend
npm test
```

| File | Tests | Coverage |
|------|:-----:|----------|
| `api.test.ts` | **4** | Token storage (get, set, clear, null) + ApiError class |
| `index.test.ts` | **4** | TypeScript contracts: Activity, ActivityStatistics, SportType, User |
| `KpiCard.test.tsx` | **3** | Render with value, render empty state ("No data yet"), trend display |
| `example.test.ts` | **1** | Smoke test |

```
 Test Files  4 passed (4)
      Tests  12 passed (12)
   Duration  2.95s
```

<br />

---

<br />

## API Reference

### Authentication

| Method | Endpoint | Auth | Description |
|:------:|----------|:----:|-------------|
| `POST` | `/api/auth/register` | &mdash; | Register a new user (status = `pending`) |
| `POST` | `/api/auth/login` | &mdash; | Log in &rarr; returns `{ token, user }` |
| `POST` | `/api/auth/logout` | Bearer | Log out |
| `GET` | `/api/auth/me` | Bearer | Get current user profile |

### Activities

| Method | Endpoint | Auth | Description |
|:------:|----------|:----:|-------------|
| `POST` | `/api/activities/upload` | Bearer | Upload GPX file (multipart, max 25 MB) |
| `GET` | `/api/activities` | Bearer | List user's activities |
| `GET` | `/api/activities/:id` | Bearer | Activity detail + GPS points + metrics |

### Administration

| Method | Endpoint | Auth | Description |
|:------:|----------|:----:|-------------|
| `GET` | `/api/admin/users` | Admin | List all users (filterable) |
| `PATCH` | `/api/admin/users/:id/approve` | Admin | Approve a user |
| `PATCH` | `/api/admin/users/:id/reject` | Admin | Reject a user |
| `GET` | `/api/admin/actions` | Admin | Admin action audit log |

### Monitoring

| Method | Endpoint | Auth | Description |
|:------:|----------|:----:|-------------|
| `GET` | `/api/health` | &mdash; | Health check &rarr; `{ "status": "ok" }` |

<br />

### Request Examples

<details>
<summary><strong>Login</strong></summary>

```bash
curl -X POST http://localhost:8083/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gpxtrackpro.com","password":"Admin123!"}'
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "firstName": "Admin",
    "lastName": "User",
    "email": "admin@gpxtrackpro.com",
    "role": "admin",
    "status": "approved"
  }
}
```

</details>

<details>
<summary><strong>Upload GPX</strong></summary>

```bash
curl -X POST http://localhost:8083/api/activities/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@test-data/sample_run.gpx" \
  -F "sportType=running"
```

**Response:**
```json
{
  "id": 1,
  "name": "Morning Run - Central Park",
  "sportType": "running",
  "activityDate": "2026-02-15T07:30:00Z",
  "metrics": {
    "distanceKm": 2.85,
    "durationSec": 870,
    "avgSpeedKmh": 11.79,
    "maxSpeedKmh": 14.2,
    "paceMinPerKm": 5.09,
    "elevGainM": 42,
    "elevLossM": 37,
    "avgHr": 147,
    "maxHr": 162,
    "avgCadence": 87
  }
}
```

</details>

<details>
<summary><strong>List Activities</strong></summary>

```bash
curl http://localhost:8083/api/activities \
  -H "Authorization: Bearer <token>"
```

</details>

<br />

---

<br />

## Environment Variables

| Variable | Description | Default | Context |
|----------|-------------|---------|---------|
| `DATABASE_URL` | PostgreSQL connection URL | `postgres://postgres:postgres@localhost:5432/gpx_training_analyzer?sslmode=disable` | Backend |
| `JWT_SECRET` | HMAC-SHA256 secret key for JWT tokens | `dev-only-change-me` | Backend |
| `PORT` | HTTP server listening port | `8080` | Backend |
| `VITE_API_BASE` | Backend URL for API requests | `http://localhost:8080` | Frontend |
| `DB_PASSWORD` | PostgreSQL password | `gpx_secret` | Docker |
| `ADMIN_EMAIL` | Admin account email to create | &mdash; | CLI |
| `ADMIN_PASSWORD` | Admin password (min 8 characters) | &mdash; | CLI |

> A [`.env.example`](.env.example) template is provided at the project root.

<br />

---

<br />

## Security

| Measure | Implementation |
|---------|---------------|
| **Password Hashing** | Random 16-byte salt (crypto/rand) + SHA-256, stored as `base64(salt):base64(hash)` |
| **Timing-Attack Prevention** | `crypto/subtle.ConstantTimeCompare` for password verification |
| **JWT Tokens** | HMAC-SHA256 signing, configurable expiration, signature + expiry validation |
| **CORS** | Enabled with configured headers |
| **File Upload** | 25 MB size limit, GPX XML format validation |
| **SQL Injection** | Parameterized queries via pgx (prepared statements) |
| **Password Policy** | Minimum 8 characters enforced server-side |

<br />

---

<br />

## Performance

| Operation | Target | Method |
|-----------|--------|--------|
| GPX parsing (2h activity, ~7,000 points) | < 3 seconds | Go XML streaming parser |
| Elevation profile rendering | Instant | Smart downsampling to 300 points max |
| GPS map rendering | Instant | Smart downsampling to 500 points max |
| Page load (Lighthouse) | > 90 | Vite code splitting, Nginx gzip, 30-day asset cache |
| Backend Docker image | < 15 MB | Multi-stage build, Alpine, static binary |

<br />

---

<br />

## Project Structure

```
GPX-Training-Analyzer/
|
+-- backend/                             # Go REST API
|   +-- cmd/
|   |   +-- server/main.go              # HTTP entry point + graceful shutdown
|   |   +-- create_admin/main.go        # Admin bootstrap CLI
|   +-- internal/
|   |   +-- api/handlers.go             # 14 REST endpoints + auth middleware
|   |   +-- auth/jwt.go                 # JWT HMAC-SHA256 issue/parse
|   |   +-- auth/password.go            # Salt + SHA-256 hash/verify
|   |   +-- auth/auth_test.go           # 9 unit tests
|   |   +-- gpx/parser.go               # GPX 1.1 parsing + Garmin extensions
|   |   +-- gpx/parser_test.go          # 4 unit tests
|   |   +-- metrics/compute.go          # 10 metrics computation engine
|   |   +-- metrics/compute_test.go     # 2 unit tests
|   |   +-- store/store.go              # Activity CRUD (pgx/v5)
|   |   +-- store/user_store.go         # User + admin CRUD
|   +-- migrations/
|   |   +-- 001_init.sql                # Initial schema (users, activities, admin_actions)
|   |   +-- 002_legacy_compat.sql       # Compatibility migration
|   +-- scripts/apply_migrations.sh     # SQL migration runner
|   +-- Dockerfile                       # Multi-stage Go build
|   +-- go.mod                           # Single dependency: pgx/v5
|
+-- frontend/                            # React + TypeScript SPA
|   +-- src/
|   |   +-- components/                  # 20+ UI components (shadcn/ui, KpiCard, etc.)
|   |   +-- hooks/useAuth.tsx           # Authentication context provider
|   |   +-- layouts/AppShell.tsx        # Sidebar + header + routing
|   |   +-- pages/                       # 11 pages (Home, Login, Register, Dashboard, etc.)
|   |   +-- services/                    # 4 API services (auth, activities, upload, api)
|   |   +-- types/index.ts             # Shared TypeScript definitions
|   |   +-- sw.ts                        # Workbox Service Worker
|   |   +-- test/setup.ts              # Vitest + jest-dom setup
|   +-- public/                          # Static assets (logo, PWA icons, manifest)
|   +-- Dockerfile                       # Node build + Nginx
|   +-- nginx.conf                       # Reverse proxy + gzip + caching
|   +-- vitest.config.ts                # Test configuration
|
+-- .github/workflows/ci.yml           # GitHub Actions CI/CD pipeline
+-- docker-compose.yml                   # 3 services: db + backend + frontend
+-- test-data/sample_run.gpx           # Sample GPX file (30 points, Strasbourg)
+-- docs/
|   +-- IMPLEMENTATION_PLAN_5_PARTS.md  # 5-part development plan
|   +-- logo.png                         # Project logo
+-- .env.example                         # Environment variables template
+-- README.md
```

<br />

---

<br />

## Database Schema

```sql
-- PostgreSQL enum types
CREATE TYPE user_role   AS ENUM ('admin', 'user');
CREATE TYPE user_status AS ENUM ('pending', 'approved', 'rejected');

-- Users table
CREATE TABLE users (
    id            BIGSERIAL    PRIMARY KEY,
    first_name    VARCHAR(100) NOT NULL,
    last_name     VARCHAR(100) NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT         NOT NULL,
    role          user_role    DEFAULT 'user',
    status        user_status  DEFAULT 'pending',
    created_at    TIMESTAMPTZ  DEFAULT now()
);

-- Sports activities with metrics and GPS data
CREATE TABLE activities (
    id            BIGSERIAL        PRIMARY KEY,
    user_id       BIGINT           REFERENCES users(id) ON DELETE CASCADE,
    file_name     TEXT             NOT NULL,
    sport_type    VARCHAR(50)      DEFAULT 'other',
    name          TEXT,
    activity_date TIMESTAMPTZ,
    distance_km   DOUBLE PRECISION,
    duration_sec  INTEGER,
    avg_speed     DOUBLE PRECISION,
    max_speed     DOUBLE PRECISION,
    pace          DOUBLE PRECISION,
    elev_gain     DOUBLE PRECISION,
    elev_loss     DOUBLE PRECISION,
    avg_hr        DOUBLE PRECISION,
    max_hr        INTEGER,
    avg_cadence   DOUBLE PRECISION,
    track_points  JSONB,           -- Full GPS points (lat, lon, ele, time, hr, cad)
    created_at    TIMESTAMPTZ      DEFAULT now()
);

-- Admin action audit log
CREATE TABLE admin_actions (
    id             BIGSERIAL   PRIMARY KEY,
    admin_id       BIGINT      REFERENCES users(id),
    action         VARCHAR(50) NOT NULL,    -- 'approve' | 'reject'
    target_user_id BIGINT      REFERENCES users(id),
    created_at     TIMESTAMPTZ DEFAULT now()
);

-- Performance indexes
CREATE INDEX idx_activities_user_date ON activities(user_id, activity_date DESC);
CREATE INDEX idx_users_status         ON users(status);
CREATE INDEX idx_admin_actions_date   ON admin_actions(created_at DESC);
```

<br />

---

<br />

## CI/CD Pipeline

The GitHub Actions pipeline runs automatically on every `push` and `pull_request` to `main`:

```
                          push / pull_request
                                  |
                 +----------------+----------------+
                 |                                 |
        backend-test                    frontend-lint-test
        (ubuntu-latest)                  (ubuntu-latest)
                 |                                 |
         Go 1.25 setup                    Node.js 20 setup
                 |                                 |
       go test ./... -v -race              npm ci
                 |                         npm run lint
                 |                         npm test
                 |                         npm run build
                 |                                 |
                 +----------------+----------------+
                                  |
                           docker-build
                          (ubuntu-latest)
                                  |
                    docker build ./backend
                    docker build ./frontend
```

<br />

---

<br />

## Development Plan

The project was built incrementally in **5 parts**:

| Part | Scope | Status |
|:----:|-------|:------:|
| **1** | Architecture + PostgreSQL + Versioned SQL Migrations | Complete |
| **2** | JWT Auth + RBAC + Admin Workflow (approve/reject) + Audit Log | Complete |
| **3** | GPX 1.1 Parsing + Garmin Extensions + 10 Metrics + Performance Optimization | Complete |
| **4** | Full Dashboard + Upload + Leaflet Map + Recharts Elevation + Export | Complete |
| **5** | PWA Workbox + Tests (Go 15 + Vitest 12) + Docker/Compose + CI/CD + Docs | Complete |

> See [`docs/IMPLEMENTATION_PLAN_5_PARTS.md`](docs/IMPLEMENTATION_PLAN_5_PARTS.md) for detailed breakdown.

<br />

---

<br />

<div align="center">

<img src="docs/logo.png" alt="GPX TrackPro" width="48" height="48" style="border-radius: 10px;" />

<br /><br />

**GPX TrackPro** &mdash; Sports Activity Analysis Platform

Academic Project &middot; IUT Computer Science

<br />

Built with Go, React & PostgreSQL

</div>
