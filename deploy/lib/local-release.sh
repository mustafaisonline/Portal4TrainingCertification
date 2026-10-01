#!/usr/bin/env bash
# =============================================================================
# deploy/lib/local-release.sh   (sourced by start.sh — run on: LAPTOP)
#
# Builds, PROVES and packages the release for a tag ON THE LAPTOP, from the
# tagged commit alone. This replaces .github/workflows/release.yml as the
# source of the release (CR-2026-10-02-0030, founder instruction 2026-10-02:
# "remove the dependencies of GitHub and deploy directly from laptop"; ADR-046
# supersession note). The steps are the ones release.yml made, in the same order:
#
#   1  export the tag with `git archive` into a temp dir — tracked files only,
#      so no .env.local, no stale .next, no node_modules, no uncommitted file
#      can reach the build (the closest a laptop gets to a clean-room runner)
#   2  npm ci (exact lockfile) → prisma generate → next build
#   3  PROVE the exact built output against a THROWAWAY local PostgreSQL:
#      migrations apply cleanly and `migrate status` is up to date; `next start`
#      in production mode answers /api/health 200 with db:up and the newest
#      migration; the Stripe webhook refuses an unsigned POST (400);
#      X-Frame-Options: DENY is set
#   4  package the release in the SAME layout release.yml uploaded
#      (.next without its build cache, public, package.json/lock, next.config.ts,
#      prisma.config.ts, prisma/, src/ incl. the generated client, scripts/)
#
# The server still runs `npm ci` itself on unpack (native modules are built on
# the server's own platform), so a macOS-built .next ships to Linux exactly as
# release.yml's Linux-built one did. The result is a directory, not an
# artifact: LOCAL_RELEASE_STAGE/release, handed to 05-deploy.sh through
# P4TC_RELEASE_STAGE and removed by local_release_cleanup when start.sh exits.
#
# Needs: node (Node major from config.env), npm, git, tar, curl, rsync, and a
# local PostgreSQL whose role may CREATE DATABASE — the repository's own
# DATABASE_URL_TEST (env or .env.local), the same one the release gate uses.
# =============================================================================

LOCAL_RELEASE_STAGE=""
LOCAL_PROOF_DB=""
LOCAL_PROOF_ADMIN_URL=""
LOCAL_PROOF_PID=""
PROOF_PORT="${PROOF_PORT:-3102}"

# Idempotent: safe to call on every exit path.
local_release_cleanup() {
  if [ -n "$LOCAL_PROOF_PID" ]; then kill "$LOCAL_PROOF_PID" 2>/dev/null || true; LOCAL_PROOF_PID=""; fi
  lsof -tiTCP:"$PROOF_PORT" -sTCP:LISTEN 2>/dev/null | xargs kill 2>/dev/null || true
  if [ -n "$LOCAL_PROOF_DB" ] && [ -n "$LOCAL_PROOF_ADMIN_URL" ]; then
    ( cd "$PROJECT_ROOT" && node "$DEPLOY_DIR/lib/proof-db.mjs" drop "$LOCAL_PROOF_ADMIN_URL" "$LOCAL_PROOF_DB" ) >>"$LOG_FILE" 2>&1 || true
    LOCAL_PROOF_DB=""
  fi
  if [ -n "$LOCAL_RELEASE_STAGE" ] && [ -d "$LOCAL_RELEASE_STAGE" ]; then rm -rf "$LOCAL_RELEASE_STAGE"; fi
  LOCAL_RELEASE_STAGE=""
}

# The admin URL for the throwaway database: DATABASE_URL_TEST from the
# environment, else from .env.local (read in a subshell, never printed).
_proof_admin_url() {
  if [ -n "${DATABASE_URL_TEST:-}" ]; then printf '%s' "$DATABASE_URL_TEST"; return 0; fi
  ( set -a; . "$PROJECT_ROOT/.env.local" 2>/dev/null; set +a; printf '%s' "${DATABASE_URL_TEST:-}" )
}

_proof_fail() {  # _proof_fail WHAT WHY FIX — stop the proof process and the temp database first.
  local_release_cleanup
  die "$1" "$2" "$3"
}

# build_and_prove_local_release TAG — on success exports P4TC_RELEASE_STAGE.
build_and_prove_local_release() {
  local tag="$1" src rel pidfile newest body code i status_out
  step "BUILD: release built from $tag and PROVEN locally (replaces release.yml)"
  # Like the release gate, the build and proof run for real even under --dry-run:
  # a rehearsal that fakes its build is not a rehearsal. Nothing here touches the server.
  local saved_dry="$DRY_RUN"; DRY_RUN=0

  for c in node npm git tar curl rsync lsof; do require_cmd "$c"; done
  [ "$(node --version 2>/dev/null | cut -c2-3)" = "$NODE_MAJOR" ] \
    || die "Node $NODE_MAJOR is required to build" "The server runs Node $NODE_MAJOR; the release must be built with the same major." "export PATH=\"/opt/homebrew/opt/node@${NODE_MAJOR}/bin:\$PATH\""

  LOCAL_PROOF_ADMIN_URL="$(_proof_admin_url)"
  [ -n "$LOCAL_PROOF_ADMIN_URL" ] || die "DATABASE_URL_TEST not set" "The release proof runs migrations and the app against a throwaway database on your local PostgreSQL." "Set DATABASE_URL_TEST in .env.local (see .env.example)."
  if lsof -nP -iTCP:"$PROOF_PORT" -sTCP:LISTEN >/dev/null 2>&1; then
    die "Port $PROOF_PORT is in use" "The proof starts the built app on that port." "Stop whatever uses it, or set PROOF_PORT=<free port>."
  fi

  LOCAL_RELEASE_STAGE="$(mktemp -d "${TMPDIR:-/tmp}/p4tc-release-$tag.XXXXXX")"
  src="$LOCAL_RELEASE_STAGE/src"; rel="$LOCAL_RELEASE_STAGE/release"
  mkdir -p "$src" "$rel"

  # 1 — the tagged commit and nothing else
  git -C "$PROJECT_ROOT" archive "$tag" | tar -x -C "$src" \
    || _proof_fail "git archive of $tag failed" "The release is built from the tagged commit only." "Check the tag exists: git rev-list -n 1 $tag"
  log_ok "exported $tag ($(find "$src" -type f | wc -l | tr -d ' ') tracked files — no .env, no node_modules, no .next)"

  # the throwaway database
  LOCAL_PROOF_DB="p4tc_release_proof_$$"
  PROOF_DB_URL="$( cd "$PROJECT_ROOT" && node "$DEPLOY_DIR/lib/proof-db.mjs" create "$LOCAL_PROOF_ADMIN_URL" "$LOCAL_PROOF_DB" 2>>"$LOG_FILE" )" \
    || { LOCAL_PROOF_DB=""; _proof_fail "Could not create the throwaway proof database" "The role in DATABASE_URL_TEST must be allowed to CREATE DATABASE on the local server." "Check PostgreSQL is running and see $LOG_FILE."; }
  log_ok "throwaway database $LOCAL_PROOF_DB created (UTC)"

  # 2 — install, generate, build
  run_blocking "npm ci (exact lockfile)" "$GATE_BUILD_TIMEOUT_SEC" bash -c 'cd "$1" && npm ci' _ "$src"
  run_blocking "prisma generate" 300 bash -c 'cd "$1" && npm run db:generate' _ "$src"
  # BETTER_AUTH_SECRET is a throwaway build-time value, exactly as in release.yml:
  # the auth module reads it at import time, which `next build` triggers. Never
  # the value the server uses — run.sh sources the real env file at start.
  run_blocking "next build (from the tagged commit)" "$GATE_BUILD_TIMEOUT_SEC" \
    env DATABASE_URL="$PROOF_DB_URL" BETTER_AUTH_SECRET="build-time-placeholder-not-used-at-runtime" \
    bash -c 'cd "$1" && npm run build' _ "$src"

  # 3 — prove the migrations
  run_blocking "prisma migrate deploy (throwaway database)" 300 env DATABASE_URL="$PROOF_DB_URL" bash -c 'cd "$1" && npx prisma migrate deploy' _ "$src"
  status_out="$( cd "$src" && DATABASE_URL="$PROOF_DB_URL" npx prisma migrate status 2>&1 || true )"
  printf '%s\n' "$status_out" >>"$LOG_FILE"
  printf '%s' "$status_out" | grep -q "Database schema is up to date" \
    || _proof_fail "migrations did not apply cleanly to an empty database" "prisma migrate status is not up to date." "See $LOG_FILE."
  log_ok "migrations apply cleanly to an empty database and status is up to date"

  # 3 — prove the build: production mode, health, webhook, headers
  pidfile="$LOCAL_RELEASE_STAGE/proof.pid"
  ( cd "$src" && env NODE_ENV=production DATABASE_URL="$PROOF_DB_URL" APP_BASE_URL="https://ci.invalid" \
      BETTER_AUTH_SECRET="ci-only-secret-not-for-any-real-environment-0123456789" \
      PROFILE_ENCRYPTION_KEY="KioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKio=" EMAIL_TRANSPORT=log \
      JOBS_SECRET="ci-only-jobs-secret-0123456789" STRIPE_SECRET_KEY="rk_test_ci_only_not_a_real_key" \
      STRIPE_WEBHOOK_SECRET="whsec_ci_only_not_a_real_secret" \
      node_modules/.bin/next start -p "$PROOF_PORT" >>"$LOG_FILE" 2>&1 & echo $! >"$pidfile" )
  LOCAL_PROOF_PID="$(cat "$pidfile" 2>/dev/null || true)"
  body=""
  for i in $(seq 1 30); do
    body="$(curl -s "http://127.0.0.1:$PROOF_PORT/api/health" 2>/dev/null || true)"
    printf '%s' "$body" | grep -q '"db":"up"' && break
    sleep 2
  done
  printf '%s' "$body" | grep -q '"status":"ok"' || _proof_fail "the built app did not report healthy in production mode" "GET /api/health → ${body:-no answer}" "See $LOG_FILE (the app's own output is in it)."
  newest="$(ls -1 "$src/prisma/migrations" | grep -E '^[0-9]{14}_' | sort | tail -1)"
  printf '%s' "$body" | grep -q "\"migration\":\"$newest\"" || _proof_fail "health reports a different migration than the repository's newest ($newest)" "$body" "See $LOG_FILE."
  code="$(curl -s -o /dev/null -w '%{http_code}' -X POST -H 'Content-Type: application/json' -d '{}' "http://127.0.0.1:$PROOF_PORT/api/stripe/webhook")"
  [ "$code" = "400" ] || _proof_fail "an unsigned Stripe webhook POST returned $code, expected 400" "The webhook must refuse unsigned requests." "See $LOG_FILE."
  curl -sI "http://127.0.0.1:$PROOF_PORT/" | grep -qi 'x-frame-options: deny' || _proof_fail "X-Frame-Options: DENY is missing" "Security headers must ship." "See next.config.ts."
  log_ok "built app proven: /api/health 200 db up at $newest · unsigned webhook → 400 · X-Frame-Options: DENY"
  kill "$LOCAL_PROOF_PID" 2>/dev/null || true; LOCAL_PROOF_PID=""

  # 4 — package, same layout release.yml uploaded. rsync -a keeps symlinks as symlinks.
  rsync -a --exclude 'cache/' "$src/.next/" "$rel/.next/"
  rsync -a "$src/public/" "$rel/public/"
  cp "$src/package.json" "$src/package-lock.json" "$src/next.config.ts" "$src/prisma.config.ts" "$rel/"
  rsync -a "$src/prisma/" "$rel/prisma/"
  rsync -a "$src/src/" "$rel/src/"
  rsync -a "$src/scripts/" "$rel/scripts/"
  # Guard: a symlink pointing into this laptop's temp build dir would dangle on the server.
  if find "$rel" -type l -exec readlink {} \; 2>/dev/null | grep -q "^$LOCAL_RELEASE_STAGE"; then
    _proof_fail "the build contains symlinks into this laptop's temp directory" "They would dangle on the server." "Report this: the packaging layout needs a fix."
  fi
  local_proof_stop_db
  log_ok "release packaged: $(du -sh "$rel" | cut -f1) → $rel"
  DRY_RUN="$saved_dry"
  export P4TC_RELEASE_STAGE="$LOCAL_RELEASE_STAGE"
}

# Drop the throwaway database as soon as the proof is done (the stage stays until exit).
local_proof_stop_db() {
  if [ -n "$LOCAL_PROOF_DB" ]; then
    ( cd "$PROJECT_ROOT" && node "$DEPLOY_DIR/lib/proof-db.mjs" drop "$LOCAL_PROOF_ADMIN_URL" "$LOCAL_PROOF_DB" ) >>"$LOG_FILE" 2>&1 || true
    LOCAL_PROOF_DB=""
  fi
}
