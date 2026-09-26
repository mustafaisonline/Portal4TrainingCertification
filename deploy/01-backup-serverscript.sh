#!/usr/bin/env bash
# =============================================================================
# 01-backup-serverscript.sh   (run on: SERVER — by the promote wrapper before
# every promotion and restore, by the nightly timer, or by hand as deploy)
#
# Logical backup of one environment's database on the managed cluster:
#   $REMOTE_BACKUP_ROOT/p4tc-<env>-<UTC stamp>[-<label>].dump   (pg_dump -Fc)
#   …dump.sha256   …dump.meta   (deployed tag/commit, newest migration, size)
# Verified with `pg_restore --list` (the archive TOC parses); the full
# restore proof is the migration sandbox (03), which restores the newest
# dump on every promotion. Retention: newest $BACKUP_KEEP per environment.
#
# The dump stays on this server (or in DO's managed backups). It is never
# copied to a laptop by this framework — "production data never leaves the
# server". The connection string is read from the env file and never
# printed. (eCard 01-production-backup-serverscript, adapted: no code/env
# archive — the image tag IS the code and the env file is root-owned.)
# =============================================================================
set -euo pipefail
DEPLOY_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck disable=SC1091
. "$DEPLOY_DIR/config.env"; [ -f "$DEPLOY_DIR/config.local.env" ] && . "$DEPLOY_DIR/config.local.env"
ETC="${P4TC_ETC:-/etc/p4tc}"; OPT="${P4TC_OPT:-/opt/p4tc}"
LOG="$OPT/logs/01-backup.log"; mkdir -p "$OPT/logs"
log() { printf '[%s] %s\n' "$(date -u '+%Y-%m-%d %H:%M:%SZ')" "$*" | tee -a "$LOG" >&2; }
fail() { log "ERROR: $*"; exit 1; }

ENV=""; TAG="unknown"; LABEL=""; DRY=0
while [ $# -gt 0 ]; do case "$1" in
  --env) ENV="$2"; shift 2 ;; --tag) TAG="$2"; shift 2 ;; --label) LABEL="-$2"; shift 2 ;; --dry-run) DRY=1; shift ;;
  *) fail "unknown argument $1" ;; esac; done
case "$ENV" in production|staging) : ;; *) fail "--env production|staging required" ;; esac
ENV_FILE="$ETC/$ENV.env"; [ -r "$ENV_FILE" ] || fail "$ENV_FILE not readable"
command -v pg_dump >/dev/null || fail "pg_dump missing (bootstrap installs postgresql-client-16)"

DB_URL="$(set -a; . "$ENV_FILE"; set +a; printf '%s' "${DATABASE_URL:-}")"
[ -n "$DB_URL" ] || fail "DATABASE_URL absent from $ENV_FILE"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
FILE="$REMOTE_BACKUP_ROOT/p4tc-$ENV-$STAMP$LABEL.dump"
mkdir -p "$REMOTE_BACKUP_ROOT"

# Disk: need ~2× the database size + 200 MB.
DB_MB="$(psql "$DB_URL" -At -c "SELECT pg_database_size(current_database())/1048576" 2>/dev/null || echo 200)"
NEED_MB=$((DB_MB * 2 + 200)); FREE_MB="$(df -Pm "$REMOTE_BACKUP_ROOT" | awk 'NR==2{print $4}')"
[ "$FREE_MB" -ge "$NEED_MB" ] || fail "only ${FREE_MB} MB free in $REMOTE_BACKUP_ROOT, need ${NEED_MB} MB"
log "backup $ENV (db ≈ ${DB_MB} MB) → $FILE"
[ "$DRY" -eq 1 ] && { log "(dry-run) would pg_dump, checksum, verify, prune"; exit 0; }

pg_dump --format=custom --no-owner --no-privileges --file="$FILE" "$DB_URL" || fail "pg_dump failed"
( cd "$REMOTE_BACKUP_ROOT" && sha256sum "$(basename "$FILE")" >"$(basename "$FILE").sha256" )
pg_restore --list "$FILE" >/dev/null 2>&1 || fail "pg_restore --list cannot read the archive"
MIG="$(psql "$DB_URL" -At -c "SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL ORDER BY finished_at DESC LIMIT 1" 2>/dev/null || echo unknown)"
cat >"$FILE.meta" <<EOF
environment=$ENV
taken_at=$STAMP
deployed_tag=$TAG
deployed_commit=$(cat "$OPT/markers/$ENV/.deployed-commit" 2>/dev/null || echo unknown)
newest_migration=$MIG
size_bytes=$(stat -c %s "$FILE")
pg_dump_version=$(pg_dump --version | awk '{print $3}')
EOF
unset DB_URL
if [ "$(id -u)" -eq 0 ]; then chown deploy:deploy "$FILE" "$FILE.sha256" "$FILE.meta" 2>/dev/null || true; fi
chmod 600 "$FILE"; chmod 644 "$FILE.sha256" "$FILE.meta"
log "OK: $(du -h "$FILE" | cut -f1) · migration $MIG · sha256 written"

# Retention — newest $BACKUP_KEEP per environment (plus their sidecars).
ls -t "$REMOTE_BACKUP_ROOT"/p4tc-"$ENV"-*.dump 2>/dev/null | tail -n +$((BACKUP_KEEP + 1)) | while IFS= read -r old; do
  rm -f "$old" "$old.sha256" "$old.meta"; log "pruned $(basename "$old")"
done
exit 0
