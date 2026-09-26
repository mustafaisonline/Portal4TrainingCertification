#!/usr/bin/env bash
# =============================================================================
# 06-validate.sh   (run on: LAPTOP)   — read-only
# Post-deployment validation of one environment, from outside and via SSH:
# traceability markers, /api/health (200, db up, newest migration), public
# pages, security headers, the Stripe webhook refuses an unsigned POST,
# container state, resources. PASS/FAIL with a rollback recommendation.
# (eCard 06-post-deployment-validation, adapted to a container + Caddy host)
# =============================================================================
SCRIPT_NAME="06-validate"
# shellcheck disable=SC1091
. "$(dirname "$0")/lib/common.sh"
print_help() { printf 'Usage: %s --env production|staging [--tag vX] [--dry-run]\n' "$SCRIPT_NAME" >&2; }
parse_common_args "$@"
resolve_env "$ENV_ARG"

banner "Validate $TARGET_ENV"
require_cmd curl; require_cmd ssh
capture_release_metadata
NEWEST_MIG="$(ls -1 "$PROJECT_ROOT/prisma/migrations" 2>/dev/null | grep -E '^[0-9]{14}_' | sort | tail -1)"

[ "$DRY_RUN" -eq 1 ] && check_ssh
if [ "$DRY_RUN" -eq 1 ] && [ "$REMOTE_AVAILABLE" -ne 1 ]; then
  step "Dry-run without a reachable server — listing the checks"
  for c in "markers: .deployed-tag/.deployed-commit/.deployed-at under $REMOTE_MARKERS_ROOT/$TARGET_ENV" \
           "GET $TARGET_URL/api/health → 200, db:up, migration=$NEWEST_MIG" \
           "GET $TARGET_URL/ → 200 · GET $TARGET_URL/verify → 200" \
           "headers: strict-transport-security · x-frame-options: DENY · x-content-type-options: nosniff" \
           "POST $TARGET_URL/api/stripe/webhook (unsigned) → 400" \
           "docker compose ps: app running, healthy" \
           "disk and memory snapshot"; do log_dry "$c"; done
  finish
fi

step "Deployed release traceability"
[ "$REMOTE_AVAILABLE" -eq 1 ] || check_ssh
markers="$(ssh_capture "cd '$REMOTE_MARKERS_ROOT/$TARGET_ENV' 2>/dev/null && for f in .deployed-tag .deployed-commit .deployed-at .deployed-previous-tag; do printf '%s=%s\n' \"\$f\" \"\$(cat \$f 2>/dev/null)\"; done")"
printf '%s\n' "$markers" >>"$LOG_FILE"
m() { printf '%s\n' "$markers" | sed -n "s/^$1=//p"; }
D_TAG="$(m .deployed-tag)"; D_COMMIT="$(m .deployed-commit)"; D_AT="$(m .deployed-at)"; D_PREV="$(m .deployed-previous-tag)"
if [ -n "$D_TAG" ]; then
  log_ok "server: tag $D_TAG · commit ${D_COMMIT:0:12} · at $D_AT · previous ${D_PREV:-none}"
  [ -n "$TAG_ARG" ] && [ "$TAG_ARG" != "$D_TAG" ] && soft_fail "deployed tag $D_TAG ≠ expected $TAG_ARG" "The promotion did not land or rolled back." "Read deploy/logs/05-deploy.log; consider 07-rollback.sh."
  [ "$DEPLOY_COMMIT" != "$D_COMMIT" ] && log_warn "local HEAD $DEPLOY_COMMIT_SHORT differs from the deployed commit (fine if you are validating an older release)"
else
  soft_fail "no traceability markers for $TARGET_ENV" "No governed deploy has completed on this environment." "Deploy through start.sh."
fi

step "Health endpoint"
body="$(http_body "$TARGET_URL/api/health")"; code="$(http_code "$TARGET_URL/api/health")"
printf 'health: %s %s\n' "$code" "$body" >>"$LOG_FILE"
if [ "$code" = "200" ]; then log_ok "/api/health → 200"; else soft_fail "/api/health → $code" "Application or database is down." "ssh in: docker compose -p p4tc-$TARGET_ENV logs app; consider rollback."; fi
printf '%s' "$body" | grep -q '"db":"up"' && log_ok "db: up" || soft_fail "db not up in health body" "DATABASE_URL, the managed cluster or the firewall." "Check the cluster's trusted sources and the env file (names only)."
mig="$(printf '%s' "$body" | sed -n 's/.*"migration":"\([^"]*\)".*/\1/p')"
if [ -n "$NEWEST_MIG" ] && [ "$mig" = "$NEWEST_MIG" ]; then log_ok "newest migration applied: $mig"; else soft_fail "migration on server '$mig' ≠ newest in repo '$NEWEST_MIG'" "Migrate step did not run or the repo is ahead." "Promote the tag that carries the migration."; fi
printf '%s' "$body" | grep -q '"mode":"test"\|(test)' && soft_fail "APP_ENV=test detected" "Fail-fast validation is downgraded to warnings." "Remove APP_ENV from the env file; restart."

step "Public surface"
for path in / /verify /programs; do
  c="$(http_code -L "$TARGET_URL$path")"
  [ "$c" = "200" ] && log_ok "GET $path → 200" || soft_fail "GET $path → $c" "Public page not served." "Check Caddy and the app log."
done

step "Security headers"
hdrs="$(curl -sI -m "$CURL_TIMEOUT_SEC" "$TARGET_URL/" 2>/dev/null | tr -d '\r' | tr 'A-Z' 'a-z')"
printf '%s\n' "$hdrs" >>"$LOG_FILE"
for h in "strict-transport-security" "x-frame-options: deny" "x-content-type-options: nosniff" "referrer-policy"; do
  printf '%s' "$hdrs" | grep -q "$h" && log_ok "header: $h" || soft_fail "header missing: $h" "next.config.ts sets it in production." "Confirm NODE_ENV=production in the container; Caddy must not strip it."
done
printf '%s' "$hdrs" | grep -q "x-powered-by" && soft_fail "x-powered-by present" "poweredByHeader:false should hide it." "Check the image is the production build."

step "Stripe webhook rejects unsigned requests"
wc="$(http_code -X POST -H 'Content-Type: application/json' -d '{}' "$TARGET_URL/api/stripe/webhook")"
case "$wc" in
  400) log_ok "POST /api/stripe/webhook (unsigned) → 400" ;;
  503) log_warn "webhook → 503: Stripe not configured on $TARGET_ENV (STRIPE_* absent)" ;;
  *)   soft_fail "webhook (unsigned) → $wc" "Expected 400 from signature verification." "Check STRIPE_WEBHOOK_SECRET is set (names only) and the route is reachable." ;;
esac

step "Container state"
ps_out="$(ssh_capture "docker ps --filter 'name=p4tc-$TARGET_ENV' --format '{{.Names}} {{.Status}} {{.Image}}'")"
printf '%s\n' "$ps_out" >>"$LOG_FILE"
if printf '%s' "$ps_out" | grep -q 'Up'; then log_ok "container: $ps_out"; else soft_fail "no running p4tc-$TARGET_ENV container" "The promote did not switch or the container exited." "docker compose -p p4tc-$TARGET_ENV logs app"; fi
printf '%s' "$ps_out" | grep -q 'unhealthy' && soft_fail "container reports unhealthy" "HEALTHCHECK failing." "docker inspect --format '{{json .State.Health}}'"
printf '%s' "$ps_out" | grep -q ":$D_TAG" || log_warn "running image tag does not match marker $D_TAG"

step "Resources"
res="$(ssh_capture "df -Ph / | awk 'NR==2{print \"disk \" \$5 \" used, \" \$4 \" free\"}'; free -m 2>/dev/null | awk 'NR==2{print \"mem \" \$3 \"/\" \$2 \" MB\"}'; docker system df --format '{{.Type}} {{.Size}} ({{.Reclaimable}} reclaimable)' 2>/dev/null")"
printf '%s\n' "$res" | while IFS= read -r l; do [ -n "$l" ] && log_info "$l"; done
disk_pct="$(ssh_capture "df -P / | awk 'NR==2{print \$5}' | tr -d '%'")"
[ -n "$disk_pct" ] && [ "$disk_pct" -ge 85 ] && log_warn "root disk ${disk_pct}% used — docker image prune / backup retention"

step "Recent application log (diagnostics)"
ssh_capture "docker logs --tail 40 p4tc-$TARGET_ENV-app-1 2>&1 | grep -v 'GET /api/health'" >>"$LOG_FILE" 2>&1 || true
log_info "last 40 app log lines appended to $LOG_FILE"
ssh_capture "docker logs --tail 200 p4tc-$TARGET_ENV-app-1 2>&1 | grep -c '\[config\] refusing' " | grep -qv '^0$' && soft_fail "'[config] refusing to start' seen in the app log" "A required variable is missing or malformed." "Fix $REMOTE_ETC/$TARGET_ENV.env (names in .env.example); restart."

step "Verdict"
if [ "$FAILED_STEPS" -gt 0 ]; then log_error "$FAILED_STEPS check(s) failed — if $TARGET_ENV is degraded: deploy/07-rollback.sh --env $TARGET_ENV${D_PREV:+ --tag $D_PREV}"; else log_ok "post-deployment validation PASSED for $TARGET_ENV ($D_TAG)"; fi
finish
