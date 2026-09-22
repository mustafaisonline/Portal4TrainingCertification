#!/usr/bin/env bash
#
# scripts/restore-rehearsal.sh — prove a dump restores (Milestone 9 §2 item 6;
# ADR-031: "an unrehearsed backup is an assumption, not a control").
#
# What it does, against the SAME PostgreSQL server that DATABASE_URL points at:
#   1. creates a scratch database  p4tc_restore_<UTC timestamp>
#   2. pg_restore --no-owner the dump into it
#   3. `npx prisma migrate status` against the scratch database
#      (every migration in prisma/migrations must be recorded as applied)
#   4. compares the row count of EVERY business table between the source
#      database and the restored copy. The table list is read from the live
#      source schema (information_schema, public schema, minus
#      _prisma_migrations) — which is exactly the set of @@map names in
#      prisma/schema.prisma, without keeping a second copy of that list here.
#   5. prints PASS or FAIL and drops the scratch database (unless --keep)
#
# Usage:
#   DATABASE_URL=postgresql://… scripts/restore-rehearsal.sh backups/<file>.dump [--keep]
#
# Notes:
#   - Row counts are compared at the moment of the rehearsal; on a busy
#     source (production) small drifts are expected between the dump time and
#     now — run it against a quiet source, or read the report with that in
#     mind. The migration check is the hard gate; the count check is the
#     sanity check that the dump was not partial.
#   - Nothing is printed that contains the connection string.
#   - The scratch database is created on the source server for convenience.
#     On a managed host without CREATE DATABASE rights, point DATABASE_URL at
#     a local PostgreSQL instead — the dump is portable.
set -euo pipefail

usage() { echo "usage: DATABASE_URL=… $0 <dump-file> [--keep]" >&2; exit 2; }

DUMP="${1:-}"; [[ -n "$DUMP" ]] || usage
KEEP="no"; [[ "${2:-}" == "--keep" ]] && KEEP="yes"
[[ -f "$DUMP" ]] || { echo "restore-rehearsal.sh: no such file: $DUMP" >&2; exit 2; }
[[ -n "${DATABASE_URL:-}" ]] || { echo "restore-rehearsal.sh: DATABASE_URL is not set." >&2; exit 2; }
for tool in psql pg_restore npx; do
  command -v "$tool" >/dev/null || { echo "restore-rehearsal.sh: $tool not found on PATH." >&2; exit 2; }
done

# Verify the checksum when one sits beside the dump.
if [[ -f "$DUMP.sha256" ]]; then
  ( cd "$(dirname "$DUMP")" && shasum -a 256 -c "$(basename "$DUMP").sha256" >/dev/null ) \
    && echo "checksum: OK" || { echo "checksum: MISMATCH — the dump is not the file that was written." >&2; exit 1; }
else
  echo "checksum: no .sha256 beside the dump — skipped"
fi

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
SCRATCH_DB="p4tc_restore_${STAMP}"

# Same server, different database: swap the path component of the URL, keep
# any query string (sslmode=…) intact.
BASE="${DATABASE_URL%%\?*}"
QUERY=""; [[ "$DATABASE_URL" == *\?* ]] && QUERY="?${DATABASE_URL#*\?}"
SCRATCH_URL="${BASE%/*}/${SCRATCH_DB}${QUERY}"

cleanup() {
  if [[ "$KEEP" == "yes" ]]; then
    echo "scratch database kept: ${SCRATCH_DB} (drop it with: psql \"\$DATABASE_URL\" -c 'DROP DATABASE \"${SCRATCH_DB}\"')"
  else
    psql "$DATABASE_URL" -q -c "DROP DATABASE IF EXISTS \"${SCRATCH_DB}\"" >/dev/null 2>&1 || true
    echo "scratch database dropped: ${SCRATCH_DB}"
  fi
}
trap cleanup EXIT

echo "1/4 creating scratch database ${SCRATCH_DB}"
psql "$DATABASE_URL" -q -v ON_ERROR_STOP=1 -c "CREATE DATABASE \"${SCRATCH_DB}\""
# The application requires a UTC session timezone (tests/integration/timestamps.test.ts).
psql "$DATABASE_URL" -q -v ON_ERROR_STOP=1 -c "ALTER DATABASE \"${SCRATCH_DB}\" SET timezone TO 'UTC'"

echo "2/4 restoring ${DUMP}"
# --no-owner/--no-privileges: roles differ between hosts. --exit-on-error so a
# partial restore cannot masquerade as a success.
pg_restore --no-owner --no-privileges --exit-on-error --dbname="$SCRATCH_URL" "$DUMP"

echo "3/4 prisma migrate status against the restored copy"
STATUS_OK="yes"
if ! DATABASE_URL="$SCRATCH_URL" npx prisma migrate status; then
  STATUS_OK="no"
fi

echo "4/4 comparing row counts per business table"
TABLES="$(psql "$DATABASE_URL" -At -v ON_ERROR_STOP=1 -c \
  "SELECT table_name FROM information_schema.tables
    WHERE table_schema='public' AND table_type='BASE TABLE' AND table_name <> '_prisma_migrations'
    ORDER BY table_name")"
[[ -n "$TABLES" ]] || { echo "no business tables found in the source database" >&2; exit 1; }

COUNTS_OK="yes"
printf '%-32s %12s %12s  %s\n' "table" "source" "restored" ""
while IFS= read -r table; do
  src="$(psql "$DATABASE_URL" -At -c "SELECT count(*) FROM \"${table}\"")"
  dst="$(psql "$SCRATCH_URL" -At -c "SELECT count(*) FROM \"${table}\"" 2>/dev/null || echo "MISSING")"
  mark="ok"
  if [[ "$src" != "$dst" ]]; then mark="DIFF"; COUNTS_OK="no"; fi
  printf '%-32s %12s %12s  %s\n' "$table" "$src" "$dst" "$mark"
done <<< "$TABLES"

echo
if [[ "$STATUS_OK" == "yes" && "$COUNTS_OK" == "yes" ]]; then
  echo "RESTORE REHEARSAL: PASS — ${DUMP} restores completely (migrations applied, row counts match)."
  exit 0
fi
echo "RESTORE REHEARSAL: FAIL — migrate status ok=${STATUS_OK}, row counts ok=${COUNTS_OK}." >&2
exit 1
