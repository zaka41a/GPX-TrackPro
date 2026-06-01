#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is not set"
  exit 1
fi

# Resolve the migrations directory relative to this script so it works from
# any working directory.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATIONS_DIR="$SCRIPT_DIR/../migrations"

shopt -s nullglob
migrations=("$MIGRATIONS_DIR"/*.sql)
if (( ${#migrations[@]} == 0 )); then
  echo "No migration files found in $MIGRATIONS_DIR"
  exit 1
fi

# Migrations are named NNN_*.sql and applied in lexical (= numeric) order. They
# are written to be idempotent (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS).
for sql in $(printf '%s\n' "${migrations[@]}" | sort); do
  echo "→ applying $(basename "$sql")"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$sql"
done

echo "Migrations applied successfully"
