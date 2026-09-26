#!/usr/bin/env bash
# =============================================================================
# 00-discovery.sh   (run on: LAPTOP)   — read-only
# Local toolchain, configuration sanity, remote reachability and the state of
# the server bootstrap. Never changes anything. (eCard 00-environment-discovery)
# =============================================================================
SCRIPT_NAME="00-discovery"
# shellcheck disable=SC1091
. "$(dirname "$0")/lib/common.sh"
print_help() { printf 'Usage: %s [--skip-remote] [--dry-run]\n  Read-only discovery of laptop, config and server.\n' "$SCRIPT_NAME" >&2; }
SKIP_REMOTE=0; for a in "$@"; do [ "$a" = "--skip-remote" ] && SKIP_REMOTE=1; done
parse_common_args "$@"

banner "Discovery"

step "Local toolchain"
for c in git ssh scp rsync curl openssl node npm; do
  if command -v "$c" >/dev/null 2>&1; then log_ok "command '$c' available ($(command -v "$c"))"; else soft_fail "Missing local command: $c" "Framework scripts need it." "Install it (Homebrew) and re-run."; fi
done
log_info "bash $BASH_VERSION · node $(node --version 2>/dev/null || echo n/a) · npm $(npm --version 2>/dev/null || echo n/a)"
if gh_ready; then log_ok "gh CLI authenticated (release-workflow status checks available)"; else log_warn "gh CLI absent or not signed in — the audit cannot confirm the release workflow built the tag (gh auth login)"; fi
[ "$(node --version 2>/dev/null | cut -c2-3)" = "24" ] || log_warn "Node 24 expected on PATH (export PATH=\"/opt/homebrew/opt/node@24/bin:\$PATH\")"

step "Configuration (deploy/config.env + config.local.env)"
log_info "FRAMEWORK:   $FRAMEWORK_VERSION"
log_info "SERVER:      $SERVER_USER@$SERVER_HOST"
log_info "DOMAIN:      $DOMAIN  → $PRODUCTION_URL · $STAGING_URL"
log_info "REGISTRY:    $REGISTRY/$IMAGE_NAME[:tag] and -migrate"
log_info "GIT SOURCE:  $DEPLOY_GIT_REMOTE/$DEPLOY_GIT_REMOTE_BRANCH"
if config_has_placeholders; then
  soft_fail "config.env still has <placeholders> (SERVER_HOST, DOMAIN or REGISTRY)" "Phase B values (K5, K13) are not filled in." "Fill deploy/config.env (names only) or deploy/config.local.env, then re-run."
else
  log_ok "no placeholders in configuration"
fi
if [ -s "$GOVERNANCE_HMAC_KEY_FILE" ]; then
  log_ok "governance HMAC key present ($(stat -f '%Lp' "$GOVERNANCE_HMAC_KEY_FILE" 2>/dev/null || stat -c '%a' "$GOVERNANCE_HMAC_KEY_FILE" 2>/dev/null) perms)"
else
  log_warn "governance HMAC key absent at $GOVERNANCE_HMAC_KEY_FILE — required before any real deploy (copied once from the server after bootstrap)"
fi

step "Repository"
capture_release_metadata
log_info "branch $DEPLOY_BRANCH · commit $DEPLOY_COMMIT_SHORT · dirty files: $DEPLOY_DIRTY_COUNT"
git_working_tree_clean && log_ok "working tree clean" || log_warn "working tree has $DEPLOY_DIRTY_COUNT uncommitted change(s) — a deploy will refuse"
[ -f "$PROJECT_ROOT/Dockerfile" ] && log_ok "Dockerfile present" || soft_fail "Dockerfile missing" "The release workflow builds it." "Restore it."
[ -f "$PROJECT_ROOT/.github/workflows/$RELEASE_WORKFLOW" ] && log_ok "release workflow present" || soft_fail "release workflow missing" "Images are built only by CI (K6)." "Restore .github/workflows/$RELEASE_WORKFLOW."
NEWEST_MIG="$(ls -1 "$PROJECT_ROOT/prisma/migrations" 2>/dev/null | grep -E '^[0-9]{14}_' | sort | tail -1)"
log_info "newest migration in repo: ${NEWEST_MIG:-none}"

step "Governance notice"
log_ok "Production data never leaves the server: dumps stay on the Droplet or in the managed backup service; the sandbox runs there."
log_ok "Secrets never enter this framework: env files are typed on the server; scripts read variable NAMES only."

if [ "$SKIP_REMOTE" -eq 1 ] || config_has_placeholders; then
  step "Remote discovery skipped ($([ "$SKIP_REMOTE" -eq 1 ] && echo '--skip-remote' || echo 'placeholders in config'))"
else
  step "Remote reachability"
  check_ssh
  step "Server bootstrap state"
  if [ "$REMOTE_AVAILABLE" -ne 1 ]; then
    log_dry "would read: wrapper, docker, compose, caddy, pg_dump, bundle/backup dir permissions, env file ownership, reminders timer, deployed tags, free disk"
    finish
  fi
  remote_state="$(ssh_capture "
    printf 'wrapper=%s\n' \"\$(test -x '$DEPLOY_WRAPPER' && echo yes || echo no)\"
    printf 'docker=%s\n' \"\$(command -v docker >/dev/null && docker --version 2>/dev/null | cut -d, -f1 || echo no)\"
    printf 'compose=%s\n' \"\$(docker compose version 2>/dev/null | head -1 || echo no)\"
    printf 'caddy=%s\n' \"\$(systemctl is-active caddy 2>/dev/null || echo no)\"
    printf 'pg_dump=%s\n' \"\$(command -v pg_dump >/dev/null && pg_dump --version | awk '{print \$3}' || echo no)\"
    printf 'staging_writable=%s\n' \"\$(test -w '$REMOTE_STAGING_INCOMING' && echo yes || echo no)\"
    printf 'backups_writable=%s\n' \"\$(test -w '$REMOTE_BACKUP_ROOT' && echo yes || echo no)\"
    printf 'etc_readable=%s\n' \"\$(test -r '$REMOTE_ETC/production.env' && echo yes || echo no)\"
    printf 'etc_writable=%s\n' \"\$(test -w '$REMOTE_ETC/production.env' && echo yes || echo no)\"
    printf 'timer=%s\n' \"\$(systemctl is-enabled p4tc-reminders.timer 2>/dev/null || echo no)\"
    printf 'deployed_production=%s\n' \"\$(cat '$REMOTE_MARKERS_ROOT/production/.deployed-tag' 2>/dev/null || echo none)\"
    printf 'deployed_staging=%s\n' \"\$(cat '$REMOTE_MARKERS_ROOT/staging/.deployed-tag' 2>/dev/null || echo none)\"
    printf 'disk_free_mb=%s\n' \"\$(df -Pm '$REMOTE_OPT' 2>/dev/null | awk 'NR==2{print \$4}')\"
  ")"
  printf '%s\n' "$remote_state" >>"$LOG_FILE"
  get() { printf '%s\n' "$remote_state" | sed -n "s/^$1=//p"; }
  [ "$(get wrapper)" = "yes" ] && log_ok "$DEPLOY_WRAPPER installed" || soft_fail "$DEPLOY_WRAPPER missing" "Server not bootstrapped." "As root on the server: $REMOTE_DEPLOY_DIR/10-server-bootstrap-serverscript.sh"
  [ "$(get docker)" != "no" ] && log_ok "docker: $(get docker) · compose: $(get compose)" || soft_fail "Docker not installed on server" "The app runs as a container." "Run the server bootstrap."
  [ "$(get caddy)" = "active" ] && log_ok "caddy active" || soft_fail "caddy not active" "TLS and routing depend on it." "Run the server bootstrap; check /etc/caddy/Caddyfile."
  [ "$(get pg_dump)" != "no" ] && log_ok "pg_dump $(get pg_dump) on server" || soft_fail "pg_dump missing on server" "Backups and the sandbox need PostgreSQL 16 client tools." "Run the server bootstrap."
  [ "$(get staging_writable)" = "yes" ] && log_ok "bundle directory writable by $SERVER_USER" || soft_fail "$REMOTE_STAGING_INCOMING not writable" "Bundles cannot be uploaded." "Run the server bootstrap."
  [ "$(get backups_writable)" = "yes" ] && log_ok "backup directory writable" || log_warn "$REMOTE_BACKUP_ROOT not writable by $SERVER_USER"
  [ "$(get etc_readable)" = "yes" ] && log_ok "production env file readable by $SERVER_USER (group)" || log_warn "$REMOTE_ETC/production.env absent or unreadable — the founder types it on the server before the first deploy"
  [ "$(get etc_writable)" = "no" ] && log_ok "production env file NOT writable by $SERVER_USER (root-owned — correct)" || soft_fail "production env file writable by $SERVER_USER" "Governance requires root ownership." "chown root:deploy; chmod 640"
  [ "$(get timer)" = "enabled" ] && log_ok "reminders timer enabled" || log_warn "p4tc-reminders.timer not enabled (K12)"
  log_info "deployed: production=$(get deployed_production) · staging=$(get deployed_staging) · free $(get disk_free_mb) MB on $REMOTE_OPT"
fi

finish
