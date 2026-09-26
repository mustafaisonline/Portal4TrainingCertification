#!/usr/bin/env bash
# =============================================================================
# deploy/lib/server-promote.sh   (run on: SERVER, as root — ONLY through
# /usr/local/bin/p4tc-deploy, the sudo entry point installed by script 10)
#
#   promote  --env E --tag T --governance-dir D
#     validate signed token + manifest → lock → backup gate (01) → pull
#     images → migration sandbox (03) → prisma migrate deploy → switch the
#     compose project to the new tag → wait for /api/health → on failure,
#     switch back to the previous tag automatically → markers
#   rollback --env E --tag T --governance-dir D [--restore-db FILE]
#     validate rollback token → lock → [safety snapshot → stop app →
#     pg_restore] → switch to tag T (no migrate) → health → markers
#
# Trust model (same as eCard's server-apply-release.sh): this file is synced
# from the laptop by 05 and executed by root. The wrapper guarantees that
# only the `deploy` user via sudo, with a token signed by the shared HMAC
# key and not yet expired, reaches this point. Secrets are read from the
# root-owned env file and never printed.
# =============================================================================
set -euo pipefail

ETC="${P4TC_ETC:-/etc/p4tc}"
OPT="${P4TC_OPT:-/opt/p4tc}"
DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HMAC_KEY="$ETC/governance-hmac.key"
COMPOSE_FILE="$DEPLOY_DIR/compose.production.yaml"
LOCK="/run/lock/p4tc-deploy.lock"
LOG="$OPT/logs/promote.log"
mkdir -p "$OPT/logs" "$OPT/markers"
# shellcheck disable=SC1091
. "$DEPLOY_DIR/config.env"
[ -f "$DEPLOY_DIR/config.local.env" ] && . "$DEPLOY_DIR/config.local.env"

log() { printf '[%s] %s\n' "$(date -u '+%Y-%m-%d %H:%M:%SZ')" "$*" | tee -a "$LOG" >&2; }
fail() { log "ERROR: $1"; [ -n "${2:-}" ] && log "  why: $2"; [ -n "${3:-}" ] && log "  fix: $3"; exit 1; }

[ "$(id -u)" -eq 0 ] || fail "must run as root (via p4tc-deploy)"
[ "${SUDO_USER:-}" = "deploy" ] || fail "only the deploy user may invoke this through sudo" "SUDO_USER=${SUDO_USER:-unset}" "ssh as deploy; run sudo -n $DEPLOY_WRAPPER …"

CMD="${1:-}"; shift || true
ENV=""; TAG=""; GOV_DIR=""; RESTORE_DB=""
while [ $# -gt 0 ]; do
  case "$1" in
    --env) ENV="$2"; shift 2 ;;
    --tag) TAG="$2"; shift 2 ;;
    --governance-dir) GOV_DIR="$2"; shift 2 ;;
    --restore-db) RESTORE_DB="$(basename "$2")"; shift 2 ;;
    *) fail "unknown argument: $1" ;;
  esac
done
case "$ENV" in production|staging) : ;; *) fail "--env must be production or staging" ;; esac
[ -n "$TAG" ] && [ -n "$GOV_DIR" ] || fail "--tag and --governance-dir are required"
case "$TAG" in *[!A-Za-z0-9._-]*|"") fail "tag has illegal characters" ;; esac
case "$GOV_DIR" in "$REMOTE_STAGING_INCOMING"/*) : ;; *) fail "governance dir must be under $REMOTE_STAGING_INCOMING" ;; esac

ENV_FILE="$ETC/$ENV.env"
RELEASE_FILE="$ETC/$ENV.release"
MARKERS="$OPT/markers/$ENV"
PROJECT="p4tc-$ENV"
case "$ENV" in production) PORT="$PRODUCTION_PORT" ;; staging) PORT="$STAGING_PORT" ;; esac
IMAGE="$REGISTRY/$IMAGE_NAME:$TAG"
MIGRATE_IMAGE="$REGISTRY/$IMAGE_NAME-migrate:$TAG"
[ -r "$ENV_FILE" ] || fail "$ENV_FILE missing" "The application cannot start without it." "Create it as root (names in .env.example), chown root:deploy, chmod 640."
[ -s "$HMAC_KEY" ] || fail "$HMAC_KEY missing" "" "Run 10-server-bootstrap-serverscript.sh."
[ -f "$COMPOSE_FILE" ] || fail "$COMPOSE_FILE missing" "" "05-deploy syncs deploy/ before promoting."

# --- JSON field reader (flat tokens only) -------------------------------------
jf() { sed -n "s/.*\"$2\": *\"\{0,1\}\([^\",}]*\)\"\{0,1\}.*/\1/p" "$1" | head -1; }
hmac_of() { printf '%s' "$1" | openssl dgst -sha256 -hmac "$(tr -d '\n\r' <"$HMAC_KEY")" | awk '{print $NF}'; }

validate_token() {  # validate_token FILE KIND
  local f="$1" kind="$2"
  [ -f "$f" ] || fail "token missing: $f"
  local t_kind t_id t_issued t_exp t_env t_tag t_commit t_backup t_hmac t_orch now payload expected
  t_kind="$(jf "$f" kind)"; t_id="$(jf "$f" deploymentId)"; t_issued="$(jf "$f" issuedAtEpoch)"; t_exp="$(jf "$f" expiresAtEpoch)"
  t_env="$(jf "$f" environment)"; t_tag="$(jf "$f" tag)"; t_commit="$(jf "$f" commit)"; t_backup="$(jf "$f" backup)"; t_hmac="$(jf "$f" hmac)"; t_orch="$(jf "$f" orchestrator)"
  now="$(date +%s)"
  [ "$t_kind" = "$kind" ] || fail "token kind '$t_kind' ≠ '$kind'"
  [ "$t_env" = "$ENV" ] || fail "token environment '$t_env' ≠ '$ENV'"
  [ "$t_tag" = "$TAG" ] || fail "token tag '$t_tag' ≠ '$TAG'"
  [ -n "$t_exp" ] && [ "$now" -le "$t_exp" ] || fail "token expired" "issued for ${GOVERNANCE_TOKEN_TTL_SECONDS}s" "re-run the laptop script"
  [ "$(basename "$GOV_DIR")" = "$t_id" ] || fail "token id does not match the bundle directory"
  case "$kind" in
    promote)  [ "$t_orch" = "start.sh" ] || fail "token not issued by start.sh"; payload="promote|${t_id}|${t_issued}|${t_env}|${t_tag}|${t_commit}|${t_exp}" ;;
    rollback) [ "$t_backup" = "$RESTORE_DB" ] || fail "token backup '$t_backup' ≠ '--restore-db $RESTORE_DB'"; payload="rollback|${t_id}|${t_issued}|${t_env}|${t_tag}|${t_backup}|${t_exp}" ;;
  esac
  expected="$(hmac_of "$payload")"
  [ "$expected" = "$t_hmac" ] || fail "token HMAC invalid" "The laptop's key differs from $HMAC_KEY, or the token was altered." "Copy the server key to deploy/.governance-hmac.key again."
  DEPLOY_ID="$t_id"; TOKEN_COMMIT="$t_commit"
  log "token OK: kind=$kind id=$t_id env=$ENV tag=$TAG (expires in $((t_exp - now))s)"
}

acquire_lock() { exec 9>"$LOCK"; flock -n 9 || fail "another p4tc-deploy is running" "lock $LOCK held" "wait for it"; }

current_tag() { [ -f "$RELEASE_FILE" ] && sed -n 's/^TAG=//p' "$RELEASE_FILE" || printf ''; }

write_release_file() {  # write_release_file TAG PREVIOUS
  umask 022
  cat >"$RELEASE_FILE.tmp" <<EOF
# written by p4tc-deploy $(date -u '+%Y-%m-%dT%H:%M:%SZ') — do not edit
TAG=$1
PREVIOUS_TAG=$2
REGISTRY=$REGISTRY
IMAGE_NAME=$IMAGE_NAME
P4TC_ENV=$ENV
P4TC_ENV_FILE=$ENV_FILE
P4TC_PORT=$PORT
COMPOSE_PROJECT_NAME=$PROJECT
EOF
  mv "$RELEASE_FILE.tmp" "$RELEASE_FILE"
}

compose() { docker compose -p "$PROJECT" --env-file "$RELEASE_FILE" -f "$COMPOSE_FILE" "$@"; }

wait_healthy() {
  local waited=0 body
  while [ "$waited" -lt "$HEALTH_WAIT_TIMEOUT_SEC" ]; do
    body="$(curl -s -m 5 "http://127.0.0.1:$PORT/api/health" 2>/dev/null || true)"
    if printf '%s' "$body" | grep -q '"status":"ok"' && printf '%s' "$body" | grep -q '"db":"up"'; then
      log "healthy after ${waited}s: $(printf '%s' "$body" | sed -n 's/.*"migration":"\([^"]*\)".*/migration=\1/p')"; return 0
    fi
    sleep 3; waited=$((waited + 3))
  done
  log "NOT healthy after ${HEALTH_WAIT_TIMEOUT_SEC}s; last body: ${body:-<none>}"
  docker logs --tail 60 "$PROJECT-app-1" 2>&1 | grep -v 'GET /api/health' | tail -30 | tee -a "$LOG" >&2 || true
  return 1
}

write_markers() {  # write_markers TAG PREVIOUS COMMIT KIND
  mkdir -p "$MARKERS"; umask 022
  printf '%s\n' "$1" >"$MARKERS/.deployed-tag"
  printf '%s\n' "$2" >"$MARKERS/.deployed-previous-tag"
  printf '%s\n' "$3" >"$MARKERS/.deployed-commit"
  date -u '+%Y-%m-%dT%H:%M:%SZ' >"$MARKERS/.deployed-at"
  printf '%s %s by %s (%s)\n' "$4" "$1" "${SUDO_USER}" "$DEPLOY_ID" >>"$MARKERS/history.log"
  chmod 644 "$MARKERS"/.deployed-* "$MARKERS/history.log"
}

switch_to() {  # switch_to TAG PREVIOUS
  write_release_file "$1" "$2"
  compose up -d --remove-orphans --no-build app >>"$LOG" 2>&1
}

# =============================================================================
case "$CMD" in
# -----------------------------------------------------------------------------
promote)
  MANIFEST="$GOV_DIR/deployment-manifest.json"; TOKEN="$GOV_DIR/deployment-token.json"
  [ -f "$MANIFEST" ] || fail "manifest missing: $MANIFEST"
  validate_token "$TOKEN" promote
  [ "$(jf "$MANIFEST" deploymentId)" = "$DEPLOY_ID" ] || fail "manifest id ≠ token id"
  [ "$(jf "$MANIFEST" tag)" = "$TAG" ] || fail "manifest tag ≠ --tag"
  [ "$(jf "$MANIFEST" commit)" = "$TOKEN_COMMIT" ] || fail "manifest commit ≠ token commit"
  acquire_lock
  PREVIOUS="$(current_tag)"
  log "PROMOTE $ENV: ${PREVIOUS:-<none>} → $TAG ($IMAGE)"

  log "gate: backup"
  "$DEPLOY_DIR/01-backup-serverscript.sh" --env "$ENV" --tag "${PREVIOUS:-none}" >>"$LOG" 2>&1 || fail "backup failed — promotion refused" "see $OPT/logs/01-backup.log" "fix the backup before deploying"

  log "pull: $IMAGE and $MIGRATE_IMAGE"
  docker pull -q "$IMAGE" >>"$LOG" 2>&1 || fail "cannot pull $IMAGE" "not built, or the server is not logged in to $REGISTRY" "check release.yml for the tag; docker login on the server (bootstrap)"
  docker pull -q "$MIGRATE_IMAGE" >>"$LOG" 2>&1 || fail "cannot pull $MIGRATE_IMAGE" "" ""

  log "gate: migration sandbox"
  "$DEPLOY_DIR/03-migration-sandbox-serverscript.sh" --env "$ENV" --tag "$TAG" >>"$LOG" 2>&1 || fail "migration sandbox failed — promotion refused" "the pending migrations did not apply cleanly to a copy of the $ENV database, or contain unapproved destructive DDL" "see $OPT/logs/03-migration-sandbox.log"

  log "migrate: prisma migrate deploy against $ENV (ADR-029: forward-only, before the code switch)"
  docker run --rm --env-file "$ENV_FILE" "$MIGRATE_IMAGE" npx prisma migrate deploy >>"$LOG" 2>&1 || fail "prisma migrate deploy failed" "the database may be partially migrated — the sandbox passed, so this is likely connectivity" "inspect $LOG; re-run promote (migrate deploy is idempotent)"

  log "switch: $PROJECT → $TAG"
  switch_to "$TAG" "$PREVIOUS"
  if wait_healthy; then
    write_markers "$TAG" "$PREVIOUS" "$TOKEN_COMMIT" promote
    sed -i 's/"result": "pending"/"result": "success (server)"/' "$MANIFEST" 2>/dev/null || true
    docker image prune -f >>"$LOG" 2>&1 || true
    rm -rf "$GOV_DIR"
    log "OK: $ENV is on $TAG"
    exit 0
  fi
  if [ -n "$PREVIOUS" ]; then
    log "AUTO-ROLLBACK: switching $ENV back to $PREVIOUS (migrations from $TAG remain applied — forward-compatible by ADR-029)"
    switch_to "$PREVIOUS" "$PREVIOUS"
    wait_healthy && log "auto-rollback healthy on $PREVIOUS" || log "auto-rollback NOT healthy — manual intervention required"
    write_markers "$PREVIOUS" "$PREVIOUS" "$(cat "$MARKERS/.deployed-commit" 2>/dev/null || echo unknown)" "auto-rollback-from-$TAG"
  fi
  sed -i 's/"result": "pending"/"result": "failed (health)"/' "$MANIFEST" 2>/dev/null || true
  fail "$TAG did not become healthy on $ENV" "see the container log above" "fix, re-tag, redeploy; or 07-rollback.sh --restore-db if the migration must be undone"
  ;;
# -----------------------------------------------------------------------------
rollback)
  TOKEN="$GOV_DIR/rollback-token.json"
  validate_token "$TOKEN" rollback
  acquire_lock
  PREVIOUS="$(current_tag)"
  log "ROLLBACK $ENV: ${PREVIOUS:-<none>} → $TAG${RESTORE_DB:+ with DB restore from $RESTORE_DB}"
  docker pull -q "$IMAGE" >>"$LOG" 2>&1 || fail "cannot pull $IMAGE" "the rollback target must exist in the registry" ""
  if [ -n "$RESTORE_DB" ]; then
    DUMP="$REMOTE_BACKUP_ROOT/$RESTORE_DB"
    [ -f "$DUMP" ] || fail "dump not found: $DUMP"
    ( cd "$REMOTE_BACKUP_ROOT" && sha256sum -c "$RESTORE_DB.sha256" >>"$LOG" 2>&1 ) || fail "checksum mismatch for $RESTORE_DB" "the package is corrupt" "choose another backup"
    log "safety snapshot before restore"
    "$DEPLOY_DIR/01-backup-serverscript.sh" --env "$ENV" --tag "${PREVIOUS:-none}" --label pre-restore >>"$LOG" 2>&1 || fail "safety snapshot failed — restore refused"
    log "stopping $PROJECT app"
    compose stop app >>"$LOG" 2>&1 || true
    DB_URL="$(set -a; . "$ENV_FILE"; set +a; printf '%s' "${DATABASE_URL:-}")"
    [ -n "$DB_URL" ] || fail "DATABASE_URL absent from $ENV_FILE"
    log "pg_restore --clean --if-exists into the $ENV database"
    pg_restore --clean --if-exists --no-owner --no-privileges --dbname="$DB_URL" "$DUMP" >>"$LOG" 2>&1 || fail "pg_restore reported errors" "the database may be inconsistent" "inspect $LOG; the pre-restore snapshot is in $REMOTE_BACKUP_ROOT"
    unset DB_URL
  fi
  switch_to "$TAG" "$PREVIOUS"
  wait_healthy || fail "$TAG not healthy after rollback" "" "docker compose -p $PROJECT logs app"
  write_markers "$TAG" "$PREVIOUS" "$(docker inspect --format '{{index .Config.Labels "org.opencontainers.image.revision"}}' "$IMAGE" 2>/dev/null || echo unknown)" "rollback${RESTORE_DB:+-with-db-restore}"
  rm -rf "$GOV_DIR"
  log "OK: $ENV rolled back to $TAG"
  ;;
*) fail "usage: promote|rollback --env E --tag T --governance-dir D [--restore-db F]" ;;
esac
