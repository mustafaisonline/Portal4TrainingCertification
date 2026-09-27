#!/usr/bin/env bash
# =============================================================================
# 05-deploy.sh   (run on: LAPTOP — ONLY via start.sh)
# Governed promotion of an already-built, already-PROVEN release to
# production:
#   verify the orchestrator token → fetch the tag's release artifact from
#   the release workflow run (gh run download) → verify server bootstrap →
#   sync the framework to the server → upload the bundle (governance +
#   release) → `p4tc-deploy promote` (root wrapper: backup gate → unpack +
#   npm ci → migration sandbox → migrate → switch `current` → pm2 reload →
#   health wait, auto-rollback on failure) → confirm health from outside.
#
# 2026-09-27: nothing is built here, on the server, or in Docker — the
# release was built and PROVEN by release.yml on GitHub's runners; this
# script only fetches that exact artifact and ships it (ADR-046 K2/K6/K9
# supersession).
# =============================================================================
SCRIPT_NAME="05-deploy"
# shellcheck disable=SC1091
. "$(dirname "$0")/lib/common.sh"
# shellcheck disable=SC1091
. "$(dirname "$0")/lib/governance.sh"
print_help() { printf 'Usage (via start.sh only): %s --env production --tag vX [--dry-run] [--yes]\n' "$SCRIPT_NAME" >&2; }
reject_prohibited_flags "$@"
parse_common_args "$@"
require_governed_orchestrator
resolve_env "$ENV_ARG"
[ -n "$TAG_ARG" ] || die "--tag is required" "A deploy is a tag." "start.sh passes it."

banner "Deploy $TAG_ARG → $TARGET_ENV"
capture_release_metadata

step "Local requirements"
for c in ssh scp rsync curl gh tar; do require_cmd "$c"; done
require_file "$CANONICAL_MANIFEST"
[ "$DRY_RUN" -eq 1 ] || require_governance_hmac_key
check_ssh

step "Fetching the tag's proven release artifact"
RELEASE_STAGE="$(mktemp -d "${TMPDIR:-/tmp}/p4tc-release-$TAG_ARG.XXXXXX")"
mkdir -p "$RELEASE_STAGE/release"
cleanup_release_stage() { rm -rf "$RELEASE_STAGE"; }
trap cleanup_release_stage EXIT
# Every failure here is a log_dry, not a die, under --dry-run: rehearsing the
# pipeline (V2) must work with no tag ever pushed and no run to download.
fetch_fail() { if [ "$DRY_RUN" -eq 1 ]; then log_dry "would fail here for real: $1"; else die "$1" "${2:-}" "${3:-}"; fi; }
if [ "$DRY_RUN" -eq 1 ] && ! gh_ready; then
  log_dry "would download the release.yml artifact p4tc-release-$TAG_ARG for $TAG_ARG into $RELEASE_STAGE"
elif ! gh_ready; then
  fetch_fail "gh CLI not authenticated" "The release artifact is fetched through gh, not a registry." "gh auth login"
else
  RUN_ID="$(gh run list --repo "$GITHUB_REPO" --workflow "$RELEASE_WORKFLOW" --branch "$TAG_ARG" --limit 1 --json databaseId --jq '.[0].databaseId' 2>>"$LOG_FILE" || true)"
  if [ -z "$RUN_ID" ]; then
    fetch_fail "no $RELEASE_WORKFLOW run found for $TAG_ARG" "The tag was not pushed, or the workflow has not run." "git push origin $TAG_ARG; wait for it to finish."
    [ "$DRY_RUN" -eq 1 ] && log_dry "would download the release.yml artifact p4tc-release-$TAG_ARG for $TAG_ARG into $RELEASE_STAGE"
  elif ! gh run download "$RUN_ID" --repo "$GITHUB_REPO" --name "p4tc-release-$TAG_ARG" --dir "$RELEASE_STAGE" >>"$LOG_FILE" 2>&1; then
    fetch_fail "artifact download failed" "run $RUN_ID may not have uploaded p4tc-release-$TAG_ARG (check it succeeded)." "Open the run in GitHub Actions."
  else
    RELEASE_TARBALL="$(find "$RELEASE_STAGE" -maxdepth 1 -name '*.tar.gz' | head -1)"
    if [ -z "$RELEASE_TARBALL" ]; then
      fetch_fail "no .tar.gz found in the downloaded artifact" "" ""
    else
      tar -xzf "$RELEASE_TARBALL" -C "$RELEASE_STAGE/release" && rm -f "$RELEASE_TARBALL"
      log_ok "release artifact for $TAG_ARG extracted: $(du -sh "$RELEASE_STAGE/release" 2>/dev/null | cut -f1)"
    fi
  fi
fi

step "Server governance state"
if [ "$REMOTE_AVAILABLE" -ne 1 ]; then
  log_dry "would verify wrapper, protected env file, writable bundle dir and free space on the server"
else
  st="$(ssh_capture "printf '%s %s %s\n' \"\$(test -x '$DEPLOY_WRAPPER' && echo yes || echo no)\" \"\$(test -w '$REMOTE_STAGING_INCOMING' && echo yes || echo no)\" \"\$(test -w '$REMOTE_ETC/$TARGET_ENV.env' && echo yes || echo no)\"")"
  set -- $st
  [ "${1:-no}" = "yes" ] || die "$DEPLOY_WRAPPER missing on server" "Server not bootstrapped." "Run 10-server-bootstrap-serverscript.sh as root."
  [ "${2:-no}" = "yes" ] || die "$REMOTE_STAGING_INCOMING not writable" "Bundle cannot be uploaded." "Re-run the server bootstrap."
  [ "${3:-yes}" = "no" ] || die "$REMOTE_ETC/$TARGET_ENV.env is writable by $SERVER_USER" "Env files must be root-owned." "chown root:deploy; chmod 640 on the server."
  log_ok "wrapper present · bundle dir writable · env file protected"
  free_mb="$(ssh_capture "df -Pm '$REMOTE_OPT' | awk 'NR==2{print \$4}'")"
  [ -n "$free_mb" ] && [ "$free_mb" -lt 1500 ] && die "Only ${free_mb} MB free on the server" "Unpacking a release plus a backup needs headroom." "Prune old releases or backups."
  log_ok "server free space: ${free_mb:-?} MB"
fi

step "Deployment target"
log_info "environment: $TARGET_ENV ($TARGET_URL, port $TARGET_PORT)"
log_info "tag:         $TAG_ARG · commit $DEPLOY_COMMIT_SHORT"
log_info "deployment:  $DEPLOYMENT_ID"
confirm "Proceed with governed deployment to $TARGET_ENV?" || { log_warn "Aborted by operator."; finalize_deployment_manifest "aborted"; finish; }

acquire_lock

step "Syncing framework to server ($REMOTE_DEPLOY_DIR)"
if [ "$DRY_RUN" -eq 1 ]; then
  log_dry "would rsync deploy/ (scripts, lib, ecosystem config, run.sh.template, Caddyfile, systemd — never logs, reports, keys or local config) to $REMOTE_DEPLOY_DIR"
else
  # shellcheck disable=SC2086
  rsync -az --delete -e "ssh $SSH_OPTS" \
    --exclude 'logs/' --exclude 'reports/' --exclude '.governance-hmac.key' --exclude 'config.local.env' \
    "$DEPLOY_DIR/" "$(ssh_target):$REMOTE_DEPLOY_DIR/" >>"$LOG_FILE" 2>&1 || die "Framework sync failed" "rsync error." "See $LOG_FILE."
  ssh_run "chmod +x server scripts" "chmod +x '$REMOTE_DEPLOY_DIR'/*.sh '$REMOTE_DEPLOY_DIR'/lib/*.sh" || true
fi

upload_governance_bundle

step "Uploading the release payload"
if [ "$DRY_RUN" -eq 1 ]; then
  log_dry "would rsync the extracted release to $GOVERNANCE_REMOTE_DIR/release/"
else
  rsync -az -e "ssh $SSH_OPTS" "$RELEASE_STAGE/release/" "$(ssh_target):$GOVERNANCE_REMOTE_DIR/release/" >>"$LOG_FILE" 2>&1 \
    || die "release payload upload failed" "rsync error." "See $LOG_FILE."
  log_ok "release payload uploaded"
fi

remote_promote "$TARGET_ENV" "$TAG_ARG"

step "External health check"
if [ "$DRY_RUN" -eq 1 ]; then
  log_dry "would GET $TARGET_URL/api/health and expect 200 with db:up"
else
  sleep 3
  body="$(http_body "$TARGET_URL/api/health")"; code="$(http_code "$TARGET_URL/api/health")"
  if [ "$code" = "200" ] && printf '%s' "$body" | grep -q '"db":"up"'; then log_ok "$TARGET_URL/api/health → 200, db up"
  else soft_fail "$TARGET_URL/api/health → $code" "The container is up on the server but not healthy from outside (Caddy, DNS or TLS)." "deploy/06-validate.sh --env $TARGET_ENV; if unhealthy, deploy/07-rollback.sh."; fi
fi

if [ "$FAILED_STEPS" -gt 0 ]; then finalize_deployment_manifest "failed"; else finalize_deployment_manifest "success"; fi
finish
