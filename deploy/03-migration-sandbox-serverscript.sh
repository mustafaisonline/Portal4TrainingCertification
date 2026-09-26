#!/usr/bin/env bash
# =============================================================================
# 03-migration-sandbox-serverscript.sh   (run on: SERVER, by the promote
# wrapper before every migration; or by hand as deploy to preview)
#
# Proves the tag's pending migrations against a COPY of the environment's
# database before they touch the real one (eCard 03-data-migration-server-
# script, adapted to Prisma):
#   1. restore the newest dump of <env> into $SANDBOX_DB_NAME on the same
#      cluster (pg_restore --clean, so the sandbox is rebuilt every time)
#   2. `prisma migrate status` in the -migrate image → list of pending names
#   3. scan each pending migration.sql for destructive DDL; refuse unless
#      the name is on DESTRUCTIVE_MIGRATIONS_APPROVED in config.env
#      (an approved RED-gate destructive migration is recorded there, in git)
#   4. `prisma migrate deploy` against the sandbox → must succeed
#   5. `prisma migrate status` again → must report up to date
# Production data stays on the server; the sandbox lives on the cluster.
# =============================================================================
set -euo pipefail
DEPLOY_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck disable=SC1091
. "$DEPLOY_DIR/config.env"; [ -f "$DEPLOY_DIR/config.local.env" ] && . "$DEPLOY_DIR/config.local.env"
ETC="${P4TC_ETC:-/etc/p4tc}"; OPT="${P4TC_OPT:-/opt/p4tc}"
LOG="$OPT/logs/03-migration-sandbox.log"; mkdir -p "$OPT/logs"
log() { printf '[%s] %s\n' "$(date -u '+%Y-%m-%d %H:%M:%SZ')" "$*" | tee -a "$LOG" >&2; }
fail() { log "ERROR: $*"; exit 1; }

ENV=""; TAG=""; DRY=0
while [ $# -gt 0 ]; do case "$1" in
  --env) ENV="$2"; shift 2 ;; --tag) TAG="$2"; shift 2 ;; --dry-run) DRY=1; shift ;; *) fail "unknown argument $1" ;; esac; done
case "$ENV" in production|staging) : ;; *) fail "--env production|staging required" ;; esac
[ -n "$TAG" ] || fail "--tag required"
ENV_FILE="$ETC/$ENV.env"; [ -r "$ENV_FILE" ] || fail "$ENV_FILE not readable"
MIGRATE_IMAGE="$REGISTRY/$IMAGE_NAME-migrate:$TAG"

DB_URL="$(set -a; . "$ENV_FILE"; set +a; printf '%s' "${DATABASE_URL:-}")"
[ -n "$DB_URL" ] || fail "DATABASE_URL absent"
# Same cluster, different database: swap the path segment, keep the query.
SANDBOX_URL="$(printf '%s' "$DB_URL" | sed -E "s#(://[^/]+/)[^/?]+#\1${SANDBOX_DB_NAME}#")"
[ "$SANDBOX_URL" != "$DB_URL" ] || fail "could not derive the sandbox URL from DATABASE_URL"
ADMIN_URL="$(printf '%s' "$DB_URL" | sed -E "s#(://[^/]+/)[^/?]+#\1${ADMIN_DB_NAME:-defaultdb}#")"

DUMP="$(ls -t "$REMOTE_BACKUP_ROOT"/p4tc-"$ENV"-*.dump 2>/dev/null | head -1)"
[ -n "$DUMP" ] || fail "no dump for $ENV in $REMOTE_BACKUP_ROOT (01 runs first)"
log "sandbox for $ENV @ $TAG: restore $(basename "$DUMP") → $SANDBOX_DB_NAME"
[ "$DRY" -eq 1 ] && { log "(dry-run) would restore, status, scan, deploy, status"; exit 0; }

# 1. rebuild the sandbox database
if ! psql "$SANDBOX_URL" -At -c 'SELECT 1' >/dev/null 2>&1; then
  psql "$ADMIN_URL" -At -c "CREATE DATABASE \"$SANDBOX_DB_NAME\"" >>"$LOG" 2>&1 || fail "cannot create $SANDBOX_DB_NAME (create it once on the cluster: CREATE DATABASE $SANDBOX_DB_NAME)"
fi
psql "$SANDBOX_URL" -At -c "SET timezone TO 'UTC'" >/dev/null 2>&1 || true
pg_restore --clean --if-exists --no-owner --no-privileges --dbname="$SANDBOX_URL" "$DUMP" >>"$LOG" 2>&1 || log "pg_restore reported warnings (expected on a fresh sandbox: nothing to clean)"
psql "$SANDBOX_URL" -At -c 'SELECT count(*) FROM _prisma_migrations' >/dev/null 2>&1 || fail "restored sandbox has no _prisma_migrations table — dump is not a portal database"
log "restored; applied migrations in sandbox: $(psql "$SANDBOX_URL" -At -c 'SELECT count(*) FROM _prisma_migrations WHERE finished_at IS NOT NULL')"

run_prisma() { docker run --rm -e DATABASE_URL="$SANDBOX_URL" "$MIGRATE_IMAGE" npx prisma "$@"; }

# 2. pending migrations
STATUS="$(run_prisma migrate status 2>&1 || true)"
printf '%s\n' "$STATUS" >>"$LOG"
PENDING="$(printf '%s\n' "$STATUS" | sed -n '/have not yet been applied/,/^$/p' | grep -E '^[0-9]{14}_' || true)"
if [ -z "$PENDING" ]; then
  printf '%s' "$STATUS" | grep -q 'Database schema is up to date' && { log "no pending migrations for $TAG — sandbox PASS"; exit 0; }
  printf '%s' "$STATUS" | grep -qi 'failed migration\|not been applied' && fail "prisma migrate status reports a problem (see log)"
fi
log "pending: $(printf '%s' "$PENDING" | tr '\n' ' ')"

# 3. destructive DDL scan against the approved list
for m in $PENDING; do
  sql="$(docker run --rm --entrypoint cat "$MIGRATE_IMAGE" "prisma/migrations/$m/migration.sql" 2>/dev/null || true)"
  [ -n "$sql" ] || fail "cannot read prisma/migrations/$m/migration.sql from the image"
  if printf '%s' "$sql" | grep -Eiq '^\s*(DROP\s+(TABLE|COLUMN|INDEX|SCHEMA)|ALTER\s+TABLE\s+.*\s+DROP\s+(COLUMN|CONSTRAINT)|TRUNCATE)'; then
    case " ${DESTRUCTIVE_MIGRATIONS_APPROVED:-} " in
      *" $m "*) log "destructive DDL in $m — APPROVED by config.env (DESTRUCTIVE_MIGRATIONS_APPROVED)" ;;
      *) fail "destructive DDL in $m is not on DESTRUCTIVE_MIGRATIONS_APPROVED — RED gate (ADR-029): record the founder's approval in deploy/config.env, commit, re-tag" ;;
    esac
  else
    log "$m: no destructive DDL"
  fi
done

# 4. apply to the sandbox
run_prisma migrate deploy >>"$LOG" 2>&1 || fail "prisma migrate deploy FAILED in the sandbox — the real database was not touched"
# 5. confirm
run_prisma migrate status 2>&1 | tee -a "$LOG" | grep -q 'Database schema is up to date' || fail "sandbox not up to date after deploy"
unset DB_URL SANDBOX_URL ADMIN_URL
log "sandbox PASS for $TAG on a copy of $ENV"
exit 0
