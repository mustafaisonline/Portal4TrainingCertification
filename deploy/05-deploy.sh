#!/usr/bin/env bash
# =============================================================================
# 05-deploy.sh   (run on: LAPTOP — ONLY via start.sh)
# Governed promotion of an already-built image tag to one environment:
#   verify the orchestrator token → verify server bootstrap → sync the
#   framework to the server → upload the bundle → `p4tc-deploy promote`
#   (root wrapper: backup gate → migration sandbox → pull → migrate → switch
#   → health wait, auto-rollback on failure) → confirm health from outside.
# Nothing is built here; nothing is rsync'd but this deploy/ folder.
# =============================================================================
SCRIPT_NAME="05-deploy"
# shellcheck disable=SC1091
. "$(dirname "$0")/lib/common.sh"
# shellcheck disable=SC1091
. "$(dirname "$0")/lib/governance.sh"
print_help() { printf 'Usage (via start.sh only): %s --env production|staging --tag vX [--dry-run] [--yes]\n' "$SCRIPT_NAME" >&2; }
reject_prohibited_flags "$@"
parse_common_args "$@"
require_governed_orchestrator
resolve_env "$ENV_ARG"
[ -n "$TAG_ARG" ] || die "--tag is required" "A deploy is a tag." "start.sh passes it."

banner "Deploy $TAG_ARG → $TARGET_ENV"
capture_release_metadata

step "Local requirements"
for c in ssh scp rsync curl; do require_cmd "$c"; done
require_file "$CANONICAL_MANIFEST"
[ "$DRY_RUN" -eq 1 ] || require_governance_hmac_key
check_ssh

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
  [ -n "$free_mb" ] && [ "$free_mb" -lt 1500 ] && die "Only ${free_mb} MB free on the server" "An image pull plus a backup needs headroom." "Prune old images (docker image prune) or backups."
  log_ok "server free space: ${free_mb:-?} MB"
fi

step "Deployment target"
log_info "environment: $TARGET_ENV ($TARGET_URL, port $TARGET_PORT)"
log_info "tag:         $TAG_ARG · commit $DEPLOY_COMMIT_SHORT"
log_info "image:       $REGISTRY/$IMAGE_NAME:$TAG_ARG (+ -migrate)"
log_info "deployment:  $DEPLOYMENT_ID"
confirm "Proceed with governed deployment to $TARGET_ENV?" || { log_warn "Aborted by operator."; finalize_deployment_manifest "aborted"; finish; }

acquire_lock

step "Syncing framework to server ($REMOTE_DEPLOY_DIR)"
if [ "$DRY_RUN" -eq 1 ]; then
  log_dry "would rsync deploy/ (scripts, lib, compose, Caddyfile, systemd — never logs, reports, keys or local config) to $REMOTE_DEPLOY_DIR"
else
  # shellcheck disable=SC2086
  rsync -az --delete -e "ssh $SSH_OPTS" \
    --exclude 'logs/' --exclude 'reports/' --exclude '.governance-hmac.key' --exclude 'config.local.env' \
    "$DEPLOY_DIR/" "$(ssh_target):$REMOTE_DEPLOY_DIR/" >>"$LOG_FILE" 2>&1 || die "Framework sync failed" "rsync error." "See $LOG_FILE."
  ssh_run "chmod +x server scripts" "chmod +x '$REMOTE_DEPLOY_DIR'/*.sh '$REMOTE_DEPLOY_DIR'/lib/*.sh" || true
fi

upload_governance_bundle
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
