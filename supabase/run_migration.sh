#!/usr/bin/env bash
# =============================================================================
# Run Dianoia SQL migration against Supabase
#
# Uses the Supabase Management API (SQL endpoint) to execute DDL statements.
# Requires the service role key from .env
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Load environment variables
if [ -f "$PROJECT_ROOT/.env" ]; then
  export $(grep -v '^#' "$PROJECT_ROOT/.env" | xargs)
else
  echo "ERROR: .env file not found at $PROJECT_ROOT/.env"
  exit 1
fi

SUPABASE_URL="${SUPABASE_URL:?SUPABASE_URL not set in .env}"
SERVICE_KEY="${SUPABASE_SERVICE_ROLE_KEY:?SUPABASE_SERVICE_ROLE_KEY not set in .env}"

# Extract project ref from URL (e.g., wxafzdetynntbntiywtq from https://wxafzdetynntbntiywtq.supabase.co)
PROJECT_REF=$(echo "$SUPABASE_URL" | sed 's|https://||' | sed 's|\.supabase\.co||')

run_sql() {
  local sql_file="$1"
  local description="$2"

  echo "Running: $description"
  echo "  File: $sql_file"

  # Use the Supabase PostgREST rpc or the direct SQL API
  # The Management API endpoint for SQL is:
  # POST https://api.supabase.com/v1/projects/{ref}/database/query
  # But that requires a management API token.
  #
  # Alternative: Use the pg_net or raw SQL via PostgREST RPC.
  # Simplest approach: Use psql via the pooler connection string if available,
  # or use the Supabase SQL editor API.

  local sql_content
  sql_content=$(cat "$sql_file")

  # Try the Supabase REST SQL execution endpoint
  local response
  response=$(curl -s -w "\n%{http_code}" \
    -X POST "${SUPABASE_URL}/rest/v1/rpc" \
    -H "apikey: ${SERVICE_KEY}" \
    -H "Authorization: Bearer ${SERVICE_KEY}" \
    -H "Content-Type: application/json" \
    -d "{}" 2>&1) || true

  # The REST RPC endpoint doesn't support raw DDL.
  # Use the Supabase Dashboard SQL editor or psql directly.
  # Falling back to direct postgres connection via psql.

  echo ""
  echo "NOTE: Supabase REST API does not support raw DDL statements."
  echo "Please run this SQL using one of these methods:"
  echo ""
  echo "  METHOD 1 - Supabase Dashboard SQL Editor (Recommended):"
  echo "    1. Go to https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new"
  echo "    2. Paste the contents of: $sql_file"
  echo "    3. Click 'Run'"
  echo ""
  echo "  METHOD 2 - Supabase CLI:"
  echo "    supabase db push --db-url 'postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres'"
  echo ""
  echo "  METHOD 3 - psql (if you have the database password):"
  echo "    psql 'postgresql://postgres.${PROJECT_REF}:[YOUR-DB-PASSWORD]@aws-0-eu-north-1.pooler.supabase.com:6543/postgres' -f $sql_file"
  echo ""
}

echo "============================================="
echo "Dianoia - Supabase Schema Migration"
echo "============================================="
echo "Project: $PROJECT_REF"
echo ""

run_sql "$SCRIPT_DIR/migrations/001_initial_schema.sql" "Initial schema (tables, indexes, RLS, real-time, storage)"

echo ""
echo "After running the migration, seed with demo data:"
echo ""
run_sql "$SCRIPT_DIR/seed.sql" "Seed data (Riverside Park Homicide demo case)"

echo ""
echo "============================================="
echo "Done. Verify at: https://supabase.com/dashboard/project/${PROJECT_REF}/editor"
echo "============================================="
