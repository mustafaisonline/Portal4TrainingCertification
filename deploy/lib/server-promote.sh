#!/usr/bin/env bash
# =============================================================================
# deploy/lib/server-promote.sh   (run on: SERVER, as root — ONLY through
# /usr/local/bin/p4tc-deploy, the sudo entry point installed by script 10)
#
#   promote  --env E --tag T --governance-dir D
#     validate signed token + manifest → lock → backup gate (01) → unpack the
#     release (rsync from the uploaded bundle into /opt/p4tc/releases/T,
#     root-owned) → npm ci → migration sandbox (03) → prisma migrate deploy
#     → switch the `current` symlink to T → pm2 reload → wait /api/health →
#     on failure, switch back to the previous tag automatically → markers →
#     prune old releases beyond RELEASES_KEEP
#   rollback --env E --tag T --governance-dir D [--restore-db FILE]
#     validate rollback token → lock → [safety snapshot → stop app →
#     pg_restore] → switch to a release T already on disk (no migrate,
#     no reinstall) → health → markers
#
# Trust model (same as eCard's server-apply-release.sh): this file is synced
# from the laptop by 05 and executed by root. The wrapper guarantees that
# only the `deploy` user via sudo, with a token signed by the shared HMAC
# key and not yet expired, reaches this point. Secrets are read from the
# root-owned env file and never printed.
#
# 2026-09-27: rewritten from Docker/compose to rsync + PM2 (ADR-046 K2/K6/K9
# supersession — see ARCHITECTURE_DECISION_REGISTER.md). Releases are kept as
# directories under $RELEASES_ROOT, not image tags, so `current` is a symlink
# and a rollback to a release still on disk needs no rebuild or reinstall.
# =============================================================================
set -euo pipefail

ETC="${P4TC_ETC:-/etc/p4tc}"
OPT="${P4TC_OPT:-/opt/p4tc}"
DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HMAC_KEY="$ETC/governance-hmac.key"
RELEASES_ROOT="${P4TC_RELEASES_ROOT:-$OPT/releases}"
LOCK="/run/lock/p4tc-deploy.lock"
LOG="$OPT/logs/promote.log"
mkdir -p "$OPT/logs" "$RELEASES_ROOT"
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
case "$ENV" in production) : ;; *) fail "--env must be production (staging dropped 2026-09-27)" ;; esac
[ -n "$TAG" ] && [ -n "$GOV_DIR" ] || fail "--tag and --governance-dir are required"
case "$TAG" in *[!A-Za-z0-9._-]*|"") fail "tag has illegal characters" ;; esac
case "$GOV_DIR" in "$REMOTE_STAGING_INCOMING"/*) : ;; *) fail "governance dir must be under $REMOTE_STAGING_INCOMING" ;; esac

ENV_FILE="$ETC/$ENV.env"
MARKERS="$OPT/markers/$ENV"
RELEASE_DIR="$RELEASES_ROOT/$TAG"
CURRENT_LINK="$RELEASES_ROOT/current"
PORT="$PRODUCTION_PORT"
[ -r "$ENV_FILE" ] || fail "$ENV_FILE missing" "The application cannot start without it." "Create it as root (names in .env.example), chown root:deploy, chmod 640."
[ -s "$HMAC_KEY" ] || fail "$HMAC_KEY missing" "" "Run 10-server-bootstrap-serverscript.sh."

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

current_tag() { [ -L "$CURRENT_LINK" ] && basename "$(readlink "$CURRENT_LINK")" || printf ''; }

# Root (via the wrapper) drops privilege to deploy for every pm2 call, so the
# app process itself is always owned by deploy, never root — a plain `sudo
# -u deploy` needs no sudoers grant (root may always sudo to any user);
# `-H` points pm2 at deploy's own $PM2_HOME (/home/deploy/.pm2), same daemon
# 00-discovery/06-validate/09-audit already talk to when connected as deploy.
pm2() { sudo -u deploy -H /usr/bin/pm2 "$@"; }

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
  pm2 logs "$PM2_APP_NAME" --lines 60 --nostream 2>&1 | grep -v 'GET /api/health' | tail -30 | tee -a "$LOG" >&2 || true
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

# switch_to TAG — flip the `current` symlink and (re)start PM2 against it.
# Idempotent: pm2 startOrReload starts the app if it isn't running yet (first
# deploy) or reloads it in place if it already is.
switch_to() {
  [ -d "$RELEASES_ROOT/$1" ] || fail "release $1 not on disk" "Rollback beyond the kept releases needs a redeploy of that tag." "deploy/start.sh --env production --tag $1 (re-fetches the tag's build artifact)."
  ln -sfn "$RELEASES_ROOT/$1" "$CURRENT_LINK"
  pm2 startOrReload "$DEPLOY_DIR/ecosystem.production.config.js" >>"$LOG" 2>&1
}

# unpack_release TAG — root-owned rsync of the uploaded release bundle into
# releases/TAG, then npm ci as root (eCard's "install as root, chown after").
# .next/cache is the one subtree the running (deploy-owned) process needs to
# write to at runtime (next/image's on-disk optimisation cache) — everything
# else in the release is read-only to the deploy group, same separation
# eCard's server-apply-release.sh uses for its live tree.
unpack_release() {
  local tag="$1" commit="$2"
  mkdir -p "$RELEASE_DIR"
  rsync -a --delete "$GOV_DIR/release/" "$RELEASE_DIR/" >>"$LOG" 2>&1 || fail "release unpack failed" "rsync from the uploaded bundle." "Re-run the laptop deploy."
  ( cd "$RELEASE_DIR" && npm ci >>"$LOG" 2>&1 ) || fail "npm ci failed in $RELEASE_DIR" "package-lock.json mismatch or a registry problem." "See $LOG."
  sed -e "s#{{ENV_FILE}}#$ENV_FILE#g" -e "s#{{PORT}}#$PORT#g" "$DEPLOY_DIR/run.sh.template" >"$RELEASE_DIR/run.sh"
  chmod 750 "$RELEASE_DIR/run.sh"
  printf '%s\n' "$commit" >"$RELEASE_DIR/.release-commit"
  mkdir -p "$RELEASE_DIR/.next/cache"
  chown -R root:deploy "$RELEASE_DIR"
  chmod -R u=rwX,g=rX,o= "$RELEASE_DIR"
  chown -R deploy:deploy "$RELEASE_DIR/.next/cache"
  chmod -R u=rwX,g=rwX,o= "$RELEASE_DIR/.next/cache"
  log "release $tag unpacked and installed: $(du -sh "$RELEASE_DIR" 2>/dev/null | cut -f1)"
}

prune_old_releases() {
  ls -1dt "$RELEASES_ROOT"/*/ 2>/dev/null | while IFS= read -r d; do basename "${d%/}"; done \
    | grep -v '^current$' | tail -n +$((RELEASES_KEEP + 1)) | while IFS= read -r old; do
      [ "$old" = "$(current_tag)" ] && continue
      rm -rf "${RELEASES_ROOT:?}/$old" && log "pruned release $old"
    done
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
  log "PROMOTE $ENV: ${PREVIOUS:-<none>} → $TAG"

  log "gate: backup"
  "$DEPLOY_DIR/01-backup-serverscript.sh" --env "$ENV" --tag "${PREVIOUS:-none}" >>"$LOG" 2>&1 || fail "backup failed — promotion refused" "see $OPT/logs/01-backup.log" "fix the backup before deploying"

  log "unpack + install: $TAG"
  [ -d "$GOV_DIR/release" ] || fail "no release payload in $GOV_DIR" "05-deploy.sh uploads the built release alongside the governance bundle." "Re-run the laptop deploy."
  unpack_release "$TAG" "$TOKEN_COMMIT"

  log "gate: migration sandbox"
  "$DEPLOY_DIR/03-migration-sandbox-serverscript.sh" --env "$ENV" --tag "$TAG" >>"$LOG" 2>&1 || fail "migration sandbox failed — promotion refused" "the pending migrations did not apply cleanly to a copy of the $ENV database, or contain unapproved destructive DDL" "see $OPT/logs/03-migration-sandbox.log"

  log "migrate: prisma migrate deploy against $ENV (ADR-029: forward-only, before the code switch)"
  ( set -a; . "$ENV_FILE"; set +a; cd "$RELEASE_DIR" && node_modules/.bin/prisma migrate deploy ) >>"$LOG" 2>&1 \
    || fail "prisma migrate deploy failed" "the database may be partially migrated — the sandbox passed, so this is likely connectivity" "inspect $LOG; re-run promote (migrate deploy is idempotent)"

  log "switch: $ENV → $TAG"
  switch_to "$TAG"
  if wait_healthy; then
    write_markers "$TAG" "$PREVIOUS" "$TOKEN_COMMIT" promote
    sed -i 's/"result": "pending"/"result": "success (server)"/' "$MANIFEST" 2>/dev/null || true
    prune_old_releases
    rm -rf "$GOV_DIR"
    log "OK: $ENV is on $TAG"
    exit 0
  fi
  if [ -n "$PREVIOUS" ]; then
    log "AUTO-ROLLBACK: switching $ENV back to $PREVIOUS (migrations from $TAG remain applied — forward-compatible by ADR-029)"
    switch_to "$PREVIOUS"
    wait_healthy && log "auto-rollback healthy on $PREVIOUS" || log "auto-rollback NOT healthy — manual intervention required"
    write_markers "$PREVIOUS" "$PREVIOUS" "$(cat "$MARKERS/.deployed-commit" 2>/dev/null || echo unknown)" "auto-rollback-from-$TAG"
  fi
  sed -i 's/"result": "pending"/"result": "failed (health)"/' "$MANIFEST" 2>/dev/null || true
  fail "$TAG did not become healthy on $ENV" "see the pm2 log above" "fix, re-tag, redeploy; or 07-rollback.sh --restore-db if the migration must be undone"
  ;;
# -----------------------------------------------------------------------------
rollback)
  TOKEN="$GOV_DIR/rollback-token.json"
  validate_token "$TOKEN" rollback
  acquire_lock
  PREVIOUS="$(current_tag)"
  log "ROLLBACK $ENV: ${PREVIOUS:-<none>} → $TAG${RESTORE_DB:+ with DB restore from $RESTORE_DB}"
  [ -d "$RELEASES_ROOT/$TAG" ] || fail "release $TAG not on disk in $RELEASES_ROOT" "Only the last $RELEASES_KEEP releases are kept for instant rollback." "deploy/start.sh --env production --tag $TAG to redeploy it first."
  if [ -n "$RESTORE_DB" ]; then
    DUMP="$REMOTE_BACKUP_ROOT/$RESTORE_DB"
    [ -f "$DUMP" ] || fail "dump not found: $DUMP"
    ( cd "$REMOTE_BACKUP_ROOT" && sha256sum -c "$RESTORE_DB.sha256" >>"$LOG" 2>&1 ) || fail "checksum mismatch for $RESTORE_DB" "the package is corrupt" "choose another backup"
    log "safety snapshot before restore"
    "$DEPLOY_DIR/01-backup-serverscript.sh" --env "$ENV" --tag "${PREVIOUS:-none}" --label pre-restore >>"$LOG" 2>&1 || fail "safety snapshot failed — restore refused"
    log "stopping $PM2_APP_NAME"
    pm2 stop "$PM2_APP_NAME" >>"$LOG" 2>&1 || true
    DB_URL="$(set -a; . "$ENV_FILE"; set +a; printf '%s' "${DATABASE_URL:-}")"
    [ -n "$DB_URL" ] || fail "DATABASE_URL absent from $ENV_FILE"
    log "pg_restore --clean --if-exists into the $ENV database"
    pg_restore --clean --if-exists --no-owner --no-privileges --dbname="$DB_URL" "$DUMP" >>"$LOG" 2>&1 || fail "pg_restore reported errors" "the database may be inconsistent" "inspect $LOG; the pre-restore snapshot is in $REMOTE_BACKUP_ROOT"
    unset DB_URL
  fi
  switch_to "$TAG"
  wait_healthy || fail "$TAG not healthy after rollback" "" "pm2 logs $PM2_APP_NAME --lines 100 --nostream"
  write_markers "$TAG" "$PREVIOUS" "$(cat "$RELEASES_ROOT/$TAG/.release-commit" 2>/dev/null || echo unknown)" "rollback${RESTORE_DB:+-with-db-restore}"
  rm -rf "$GOV_DIR"
  log "OK: $ENV rolled back to $TAG"
  ;;
*) fail "usage: promote|rollback --env E --tag T --governance-dir D [--restore-db F]" ;;
esac
