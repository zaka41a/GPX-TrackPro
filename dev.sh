#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────
#  GPX TrackPro — single-command dev launcher
#  Usage: ./dev.sh
# ─────────────────────────────────────────────────────────────────
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"
ENV_FILE="$ROOT/.env"

# ── Colours ──────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

info()    { echo -e "${CYAN}[dev]${NC} $*"; }
success() { echo -e "${GREEN}[dev]${NC} $*"; }
warn()    { echo -e "${YELLOW}[dev]${NC} $*"; }
error()   { echo -e "${RED}[dev]${NC} $*" >&2; }

# ── Load .env ────────────────────────────────────────────────────
if [[ -f "$ENV_FILE" ]]; then
  info "Loading $ENV_FILE"
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
else
  warn ".env not found — using shell environment variables"
fi

# ── Validate required vars ────────────────────────────────────────
if [[ -z "${DATABASE_URL:-}" ]]; then
  error "DATABASE_URL is not set. Edit .env and try again."
  exit 1
fi

# ── Check postgres is reachable ───────────────────────────────────
info "Checking database connection…"
if ! psql "$DATABASE_URL" -c "SELECT 1" > /dev/null 2>&1; then
  error "Cannot connect to Postgres at: $DATABASE_URL"
  error "Make sure Postgres is running:  brew services start postgresql@14"
  exit 1
fi
success "Database OK"

# ── Apply migrations ──────────────────────────────────────────────
info "Applying migrations…"
MIGRATIONS_DIR="$BACKEND/migrations"
for sql in "$MIGRATIONS_DIR"/*.sql; do
  fname="$(basename "$sql")"
  psql "$DATABASE_URL" -f "$sql" > /dev/null 2>&1 && true
  echo -e "  ${GREEN}✓${NC} $fname"
done
success "Migrations done"

# ── Build backend ─────────────────────────────────────────────────
info "Building backend…"
cd "$BACKEND"
if go build -o server ./cmd/server; then
  success "Backend built"
else
  error "Backend build failed — fix errors above and retry"
  exit 1
fi
cd "$ROOT"

# ── Cleanup on exit ───────────────────────────────────────────────
BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  echo ""
  info "Shutting down…"
  [[ -n "$BACKEND_PID" ]]  && kill "$BACKEND_PID"  2>/dev/null || true
  [[ -n "$FRONTEND_PID" ]] && kill "$FRONTEND_PID" 2>/dev/null || true
  wait 2>/dev/null || true
  success "All processes stopped. Goodbye!"
}
trap cleanup EXIT INT TERM

# ── Free ports if already in use ─────────────────────────────────
for port in "${PORT:-8080}" 5173; do
  pid=$(lsof -ti tcp:"$port" 2>/dev/null || true)
  if [[ -n "$pid" ]]; then
    warn "Port $port in use (PID $pid) — killing…"
    kill -9 $pid 2>/dev/null || true
    sleep 0.3
  fi
done

# ── Start backend ─────────────────────────────────────────────────
info "Starting backend on :${PORT:-8080}…"
"$BACKEND/server" 2>&1 | sed "s/^/${CYAN}[backend]${NC} /" &
BACKEND_PID=$!

# Wait a moment to make sure backend is up
sleep 1
if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
  error "Backend crashed at startup — check logs above"
  exit 1
fi
success "Backend running (PID $BACKEND_PID)"

# ── Start frontend ────────────────────────────────────────────────
info "Starting frontend dev server…"
cd "$FRONTEND"
npm run dev 2>&1 | sed "s/^/${YELLOW}[frontend]${NC} /" &
FRONTEND_PID=$!
cd "$ROOT"

echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}  GPX TrackPro is running${NC}"
echo -e "  Frontend  →  ${GREEN}http://localhost:5173${NC}"
echo -e "  Backend   →  ${GREEN}http://localhost:${PORT:-8080}${NC}"
echo -e "${BOLD}  Press Ctrl+C to stop all servers${NC}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# ── Wait for both processes ───────────────────────────────────────
wait "$BACKEND_PID" "$FRONTEND_PID"
