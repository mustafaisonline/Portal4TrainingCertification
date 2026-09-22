#!/usr/bin/env bash
#
# scripts/backup.sh — logical backup of the portal database (Milestone 9 §2
# item 6; ADR-031). Plain `pg_dump` in custom format (-Fc: compressed,
# restorable table-by-table with pg_restore), written to backups/ with a UTC
# timestamp and a SHA-256 checksum next to it.
#
# Usage:
#   DATABASE_URL=postgresql://… scripts/backup.sh [output-dir]
#   set -a; source .env.local; set +a; scripts/backup.sh      # local dev
#
# Output:
#   <dir>/<database>-<YYYYMMDDTHHMMSSZ>.dump
#   <dir>/<database>-<YYYYMMDDTHHMMSSZ>.dump.sha256
#
# This script is the interim control until the production host's automated
# backups and point-in-time recovery are on (docs/operations/BACKUP_AND_
# RESTORE.md). It never prints the connection string. Requires pg_dump 16
# (matches the PostgreSQL version in compose.yaml and on the Homebrew service).
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "backup.sh: DATABASE_URL is not set — refusing to guess a database." >&2
  exit 2
fi
command -v pg_dump >/dev/null || { echo "backup.sh: pg_dump not found on PATH (install PostgreSQL client tools)." >&2; exit 2; }

OUT_DIR="${1:-backups}"
mkdir -p "$OUT_DIR"

# Database name from the URL path, for the file name only (never the URL).
DB_NAME="$(printf '%s' "$DATABASE_URL" | sed -E 's#^[a-z]+://[^/]+/([^?]+).*$#\1#')"
if [[ -z "$DB_NAME" || "$DB_NAME" == "$DATABASE_URL" ]]; then DB_NAME="database"; fi

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
FILE="$OUT_DIR/${DB_NAME}-${STAMP}.dump"

echo "backup.sh: dumping database '${DB_NAME}' → ${FILE}"
# --no-owner/--no-privileges: the restore target's role is rarely the source's.
pg_dump --format=custom --no-owner --no-privileges --file="$FILE" "$DATABASE_URL"

# Checksum beside the dump; `shasum -a 256 -c <file>.sha256` verifies it later.
( cd "$OUT_DIR" && shasum -a 256 "$(basename "$FILE")" > "$(basename "$FILE").sha256" )

SIZE="$(du -h "$FILE" | cut -f1)"
echo "backup.sh: done — ${FILE} (${SIZE}); checksum in ${FILE}.sha256"
