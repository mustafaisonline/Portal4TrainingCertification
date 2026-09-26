#!/usr/bin/env bash
# =============================================================================
# 09-audit.sh   (run on: LAPTOP)   — read-only GO / NO-GO
# Everything a deploy of --tag to --env will require, checked without doing
# any of it. Exit 0 = GO, 2 = NO-GO. (eCard 09-deployment-audit)
# =============================================================================
SCRIPT_NAME="09-audit"
# shellcheck disable=SC1091
. "$(dirname "$0")/lib/common.sh"
print_help() { printf 'Usage: %s --env production|staging [--tag vX] [--dry-run]\n' "$SCRIPT_NAME" >&2; }
parse_common_args "$@"
resolve_env "${ENV_ARG:-production}"
GO=1
nogo() { soft_fail "$@"; GO=0; }

banner "Deployment audit — $TARGET_ENV${TAG_ARG:+ · $TAG_ARG}"
log_info "Read-only. No deployment, no production change."

step "A. Laptop"
for c in git ssh scp rsync curl openssl; do command -v "$c" >/dev/null 2>&1 && log_ok "$c" || nogo "missing $c" "Required by the framework." "Install it."; done
gh_ready && log_ok "gh authenticated" || nogo "gh not authenticated" "The audit must confirm CI built the tag (K6)." "gh auth login"
[ -s "$GOVERNANCE_HMAC_KEY_FILE" ] && log_ok "HMAC key present" || nogo "HMAC key absent ($GOVERNANCE_HMAC_KEY_FILE)" "Deploys are signed." "Copy /etc/p4tc/governance-hmac.key from the server once (chmod 600)."
config_has_placeholders && nogo "config.env has placeholders" "SERVER_HOST / DOMAIN / REGISTRY unset." "Fill deploy/config.env or config.local.env." || log_ok "config complete"

step "B. Source"
capture_release_metadata
git_working_tree_clean && log_ok "working tree clean" || nogo "working tree dirty ($DEPLOY_DIRTY_COUNT)" "Deploys are reproducible commits." "Commit or stash."
if [ -n "$TAG_ARG" ]; then
  tc="$(git -C "$PROJECT_ROOT" rev-list -n 1 "$TAG_ARG" 2>/dev/null || true)"
  [ -n "$tc" ] && log_ok "tag $TAG_ARG exists (${tc:0:12})" || nogo "tag $TAG_ARG not found" "A deploy is a tag." "git tag $TAG_ARG && git push origin $TAG_ARG"
  [ "$tc" = "$DEPLOY_COMMIT" ] && log_ok "tag is at HEAD" || nogo "tag not at HEAD" "Gate runs on HEAD; image built from the tag." "git checkout $TAG_ARG"
  if gh_ready; then
    concl="$(release_workflow_conclusion "$TAG_ARG")"
    case "$concl" in
      success) log_ok "release workflow for $TAG_ARG: success (images pushed)" ;;
      in_progress) nogo "release workflow for $TAG_ARG still running" "Images not yet pushed." "Wait, then re-audit." ;;
      none) nogo "no release workflow run for $TAG_ARG" "The tag was not pushed or does not match v*." "git push origin $TAG_ARG" ;;
      *) nogo "release workflow for $TAG_ARG: $concl" "The gate failed in CI." "Open the run; fix; re-tag." ;;
    esac
  fi
else
  log_warn "no --tag given: the tag-specific checks (existence, at HEAD, CI build) were not run"
fi
if ! config_has_placeholders && [ "$DRY_RUN" -eq 0 ]; then
  git -C "$PROJECT_ROOT" fetch --quiet "$DEPLOY_GIT_REMOTE" "$DEPLOY_GIT_REMOTE_BRANCH" >>"$LOG_FILE" 2>&1 || true
  git -C "$PROJECT_ROOT" merge-base --is-ancestor "$DEPLOY_COMMIT" "$DEPLOY_GIT_REMOTE/$DEPLOY_GIT_REMOTE_BRANCH" 2>/dev/null && log_ok "HEAD is on $DEPLOY_GIT_REMOTE/$DEPLOY_GIT_REMOTE_BRANCH" || nogo "HEAD not on $DEPLOY_GIT_REMOTE/$DEPLOY_GIT_REMOTE_BRANCH" "Only the production branch deploys." "Merge first."
fi

step "C. Server"
if config_has_placeholders; then
  nogo "server checks skipped (placeholders)" "No server configured." "Phase B."
elif check_ssh; [ "$REMOTE_AVAILABLE" -ne 1 ]; then
  nogo "server unreachable (dry-run: listed only)" "No server answered at $SERVER_USER@$SERVER_HOST." "Phase B: provision, bootstrap, then re-audit."
  log_dry "would check: wrapper, docker, caddy, env file presence/ownership/variable names, registry login, newest backup age, free space, timer, deployed tag, DNS → server IP"
else
  st="$(ssh_capture "
    printf 'wrapper=%s\n' \"\$(test -x '$DEPLOY_WRAPPER' && echo yes || echo no)\"
    printf 'docker=%s\n' \"\$(docker info >/dev/null 2>&1 && echo yes || echo no)\"
    printf 'caddy=%s\n' \"\$(systemctl is-active caddy 2>/dev/null)\"
    printf 'env=%s\n' \"\$(test -r '$REMOTE_ETC/$TARGET_ENV.env' && echo yes || echo no)\"
    printf 'envw=%s\n' \"\$(test -w '$REMOTE_ETC/$TARGET_ENV.env' && echo yes || echo no)\"
    printf 'envnames=%s\n' \"\$(grep -E '^[A-Z_]+=' '$REMOTE_ETC/$TARGET_ENV.env' 2>/dev/null | cut -d= -f1 | tr '\n' ' ')\"
    printf 'registry=%s\n' \"\$(test -s /root/.docker/config.json -o -s \$HOME/.docker/config.json && echo yes || echo unknown)\"
    printf 'backup=%s\n' \"\$(ls -t '$REMOTE_BACKUP_ROOT'/p4tc-$TARGET_ENV-*.dump 2>/dev/null | head -1)\"
    printf 'backup_age_h=%s\n' \"\$(f=\$(ls -t '$REMOTE_BACKUP_ROOT'/p4tc-$TARGET_ENV-*.dump 2>/dev/null | head -1); [ -n \"\$f\" ] && echo \$(( (\$(date +%s) - \$(stat -c %Y \"\$f\")) / 3600 )) || echo none)\"
    printf 'free_mb=%s\n' \"\$(df -Pm '$REMOTE_OPT' | awk 'NR==2{print \$4}')\"
    printf 'timer=%s\n' \"\$(systemctl is-enabled p4tc-reminders.timer 2>/dev/null)\"
    printf 'tag=%s\n' \"\$(cat '$REMOTE_MARKERS_ROOT/$TARGET_ENV/.deployed-tag' 2>/dev/null)\"
    printf 'ip=%s\n' \"\$(curl -s -m 5 https://api.ipify.org 2>/dev/null || hostname -I 2>/dev/null | awk '{print \$1}')\"
  ")"
  printf '%s\n' "$st" >>"$LOG_FILE"
  g() { printf '%s\n' "$st" | sed -n "s/^$1=//p"; }
  [ "$(g wrapper)" = "yes" ] && log_ok "$DEPLOY_WRAPPER present" || nogo "wrapper missing" "Server not bootstrapped." "Run 10-server-bootstrap-serverscript.sh as root."
  [ "$(g docker)" = "yes" ] && log_ok "docker daemon reachable by $SERVER_USER" || nogo "docker not usable by $SERVER_USER" "Promote needs it." "Bootstrap adds deploy to the docker group."
  [ "$(g caddy)" = "active" ] && log_ok "caddy active" || nogo "caddy not active" "No TLS/routing." "systemctl status caddy"
  [ "$(g env)" = "yes" ] && log_ok "$TARGET_ENV.env readable" || nogo "$REMOTE_ETC/$TARGET_ENV.env missing" "The app refuses to start without it." "Type it on the server (names in .env.example)."
  [ "$(g envw)" = "no" ] && log_ok "$TARGET_ENV.env root-owned" || nogo "$TARGET_ENV.env writable by $SERVER_USER" "Governance." "chown root:deploy; chmod 640"
  missing=""
  for n in DATABASE_URL BETTER_AUTH_SECRET APP_BASE_URL PROFILE_ENCRYPTION_KEY EMAIL_TRANSPORT JOBS_SECRET STRIPE_SECRET_KEY STRIPE_WEBHOOK_SECRET; do
    printf ' %s ' "$(g envnames)" | grep -q " $n " || missing="$missing $n"
  done
  [ -z "$missing" ] && log_ok "every production-required variable NAME present in $TARGET_ENV.env" || nogo "variables absent from $TARGET_ENV.env:$missing" "instrumentation.ts refuses to start in production." "Add them (values typed on the server)."
  printf ' %s ' "$(g envnames)" | grep -q " APP_ENV " && nogo "APP_ENV set in $TARGET_ENV.env" "Downgrades fail-fast validation." "Remove it."
  printf ' %s ' "$(g envnames)" | grep -q " DATABASE_URL_TEST " && nogo "DATABASE_URL_TEST set in $TARGET_ENV.env" "Never on a deployed environment." "Remove it."
  [ "$(g registry)" = "yes" ] && log_ok "registry login present on server" || log_warn "no docker registry credentials found on server (pull will fail unless the registry is public)"
  if [ -n "$(g backup)" ]; then
    age="$(g backup_age_h)"
    if [ "$age" != "none" ] && [ "$age" -le "$BACKUP_MAX_AGE_HOURS" ]; then log_ok "newest backup $(basename "$(g backup)") is ${age}h old"; else log_warn "newest backup is ${age}h old (> ${BACKUP_MAX_AGE_HOURS}h) — promote takes a fresh one anyway"; fi
  else
    log_warn "no backup package for $TARGET_ENV yet (first deploy, or bootstrap incomplete)"
  fi
  fm="$(g free_mb)"; [ -n "$fm" ] && { [ "$fm" -ge 1500 ] && log_ok "free space ${fm} MB" || nogo "free space ${fm} MB < 1500" "Pull + backup need headroom." "docker image prune; prune backups."; }
  [ "$(g timer)" = "enabled" ] && log_ok "reminders timer enabled" || log_warn "p4tc-reminders.timer not enabled (K12)"
  log_info "currently deployed on $TARGET_ENV: $(g tag)"
  host="$(printf '%s' "$TARGET_URL" | sed -E 's#https?://##')"
  dns="$(dig +short "$host" 2>/dev/null | tail -1 || nslookup "$host" 2>/dev/null | awk '/^Address/ {print $2}' | tail -1)"
  if [ -n "$dns" ] && [ "$dns" = "$(g ip)" ]; then log_ok "DNS $host → $dns (this server)"; elif [ -n "$dns" ]; then nogo "DNS $host → $dns, server is $(g ip)" "Traffic would go elsewhere." "Fix the A record (K13)."; else log_warn "DNS for $host does not resolve yet"; fi
fi

step "D. Framework"
for f in start.sh 00-discovery.sh 04-release-gate.sh 05-deploy.sh 06-validate.sh 07-rollback.sh lib/common.sh lib/governance.sh lib/server-promote.sh 01-backup-serverscript.sh 03-migration-sandbox-serverscript.sh 10-server-bootstrap-serverscript.sh compose.production.yaml; do
  [ -f "$DEPLOY_DIR/$f" ] && log_ok "deploy/$f" || nogo "deploy/$f missing" "Framework incomplete." "Restore from git."
done
grep -q '^deploy/reports/' "$PROJECT_ROOT/.gitignore" && grep -q '^deploy/.governance-hmac.key' "$PROJECT_ROOT/.gitignore" && log_ok ".gitignore protects reports, logs, key and local config" || nogo ".gitignore missing deploy entries" "Reports or the key could be committed." "Add deploy/logs/, deploy/reports/, deploy/.governance-hmac.key, deploy/config.local.env."

step "Verdict"
if [ "$GO" -eq 1 ] && [ "$FAILED_STEPS" -eq 0 ]; then
  log_ok "AUDIT RESULT: GO ($WARNED_STEPS warning(s))"; write_report "GO"; _footer "AUDIT: GO — $REPORT_FILE"; exit 0
fi
log_error "AUDIT RESULT: NO-GO ($FAILED_STEPS blocking item(s), $WARNED_STEPS warning(s))"; write_report "NO-GO"; _footer "AUDIT: NO-GO — $REPORT_FILE"; exit 2
