#!/usr/bin/env bash
# =============================================================================
# deploy/lib/governance.sh — the controls that make a deploy a governed act.
# Ported from eCard PLATFORM-GOVERNANCE-003/004 (lib/governance.sh):
#   - no bypass through environment variables or flags
#   - a deployment id, an HMAC-signed token with a TTL, and a manifest
#   - script 05 refuses to run unless start.sh issued the token
#   - the bundle (manifest + token) is uploaded; the server's root-owned
#     wrapper re-validates the HMAC with its own copy of the key before it
#     touches anything (deploy/lib/server-promote.sh)
# HMAC is computed with openssl on both sides — no python dependency.
# =============================================================================

[ -n "${P4TC_GOV_SOURCED:-}" ] && return 0
P4TC_GOV_SOURCED=1

CANONICAL_MANIFEST="$REPORTS_DIR/deployment-manifest.json"
DEPLOYMENT_ID=""
GOVERNANCE_TOKEN_FILE=""
GOVERNANCE_REMOTE_DIR=""

reject_governance_bypass_env() {
  local var val
  for var in BREAK_GLASS FORCE_DEPLOY SKIP_GIT_VALIDATION ALLOW_DIRTY SKIP_GATE SKIP_RELEASE_GATE \
             P4TC_BYPASS_GOVERNANCE P4TC_SKIP_ORCHESTRATOR GOVERNANCE_BYPASS DEPLOY_BYPASS; do
    val="$(eval "printf '%s' \"\${$var:-}\"")"
    [ -z "$val" ] || die "$var is prohibited" "Production governance cannot be bypassed through the environment." "unset $var; every deploy goes through deploy/start.sh."
  done
}

reject_prohibited_flags() {
  local a
  for a in "$@"; do
    case "$a" in
      --allow-dirty|--force|--force-deploy|--skip-git-validation|--skip-gate|--skip-backup|--skip-sandbox|--no-backup)
        die "$a is not supported" "The gate, the backup and the sandbox are not optional." "Fix the underlying problem and re-run." ;;
    esac
  done
}

generate_deployment_id() {
  if command -v uuidgen >/dev/null 2>&1; then uuidgen | tr '[:upper:]' '[:lower:]'
  else printf '%s-%s-%s' "$(whoami)" "$(hostname -s 2>/dev/null || hostname)" "$(date +%s)-$$"; fi
}

require_governance_hmac_key() {
  [ -s "$GOVERNANCE_HMAC_KEY_FILE" ] || die "Governance HMAC key missing or empty: $GOVERNANCE_HMAC_KEY_FILE" \
    "The laptop signs every deploy with the key the server generated at bootstrap." \
    "Once, as root on the server: cat /etc/p4tc/governance-hmac.key — paste into deploy/.governance-hmac.key (chmod 600). Never commit it."
}

# governance_hmac PAYLOAD → hex HMAC-SHA256 under the shared key
governance_hmac() {
  require_governance_hmac_key
  printf '%s' "$1" | openssl dgst -sha256 -hmac "$(tr -d '\n\r' <"$GOVERNANCE_HMAC_KEY_FILE")" | awk '{print $NF}'
}

# issue_deployment_credentials ENV TAG — called by start.sh before 05.
issue_deployment_credentials() {
  local env="$1" tag="$2"
  reject_governance_bypass_env
  capture_release_metadata
  DEPLOYMENT_ID="$(generate_deployment_id)"
  local epoch expires payload hmac
  epoch="$(date +%s)"; expires=$((epoch + GOVERNANCE_TOKEN_TTL_SECONDS))
  # Field order is the contract the server re-computes — change both or neither.
  payload="promote|${DEPLOYMENT_ID}|${epoch}|${env}|${tag}|${DEPLOY_COMMIT}|${expires}"
  if [ "$DRY_RUN" -eq 1 ] && [ ! -s "$GOVERNANCE_HMAC_KEY_FILE" ]; then
    hmac="dry-run-no-key"; log_dry "would sign the deployment token (no HMAC key on this machine)"
  else
    hmac="$(governance_hmac "$payload")"
  fi
  GOVERNANCE_TOKEN_FILE="$LOG_DIR/.token-${DEPLOYMENT_ID}.json"
  cat >"$GOVERNANCE_TOKEN_FILE" <<EOF
{
  "kind": "promote",
  "deploymentId": "$DEPLOYMENT_ID",
  "issuedAtEpoch": $epoch,
  "expiresAtEpoch": $expires,
  "environment": "$env",
  "tag": "$tag",
  "commit": "$DEPLOY_COMMIT",
  "operator": "$(whoami)@$(hostname -s 2>/dev/null || hostname)",
  "orchestrator": "start.sh",
  "hmac": "$hmac"
}
EOF
  chmod 600 "$GOVERNANCE_TOKEN_FILE"
  export P4TC_ORCHESTRATOR_ACTIVE=1 P4TC_TOKEN_FILE="$GOVERNANCE_TOKEN_FILE" P4TC_DEPLOYMENT_ID="$DEPLOYMENT_ID"
  write_deployment_manifest "$env" "$tag"
  log_ok "governance credentials issued (id=$DEPLOYMENT_ID, ttl=${GOVERNANCE_TOKEN_TTL_SECONDS}s)"
}

# require_governed_orchestrator — 05-deploy.sh runs only under start.sh.
require_governed_orchestrator() {
  reject_governance_bypass_env
  [ "${P4TC_ORCHESTRATOR_ACTIVE:-0}" = "1" ] || die "Direct execution of 05-deploy.sh is prohibited" "Deploys go through the orchestrator, which issues the signed token." "Run deploy/start.sh --env <env> --tag <tag>."
  [ -n "${P4TC_TOKEN_FILE:-}" ] && [ -f "$P4TC_TOKEN_FILE" ] || die "Governance token missing" "start.sh did not issue one." "Re-run deploy/start.sh."
  local expires now
  expires="$(sed -n 's/.*"expiresAtEpoch": *\([0-9]*\).*/\1/p' "$P4TC_TOKEN_FILE")"; now="$(date +%s)"
  [ -n "$expires" ] && [ "$now" -le "$expires" ] || die "Governance token expired or malformed" "Tokens live ${GOVERNANCE_TOKEN_TTL_SECONDS}s." "Re-run deploy/start.sh."
  DEPLOYMENT_ID="${P4TC_DEPLOYMENT_ID:-}"; GOVERNANCE_TOKEN_FILE="$P4TC_TOKEN_FILE"
  log_ok "orchestrator gate passed (token valid for $((expires - now))s)"
}

write_deployment_manifest() {
  local env="$1" tag="$2"
  local newest_migration
  newest_migration="$(ls -1 "$PROJECT_ROOT/prisma/migrations" 2>/dev/null | grep -E '^[0-9]{14}_' | sort | tail -1)"
  cat >"$CANONICAL_MANIFEST" <<EOF
{
  "framework": "$FRAMEWORK_VERSION",
  "deploymentId": "$DEPLOYMENT_ID",
  "environment": "$env",
  "tag": "$tag",
  "image": "${REGISTRY}/${IMAGE_NAME}:${tag}",
  "migrateImage": "${REGISTRY}/${IMAGE_NAME}-migrate:${tag}",
  "git": { "branch": "$DEPLOY_BRANCH", "commit": "$DEPLOY_COMMIT", "dirtyFileCount": ${DEPLOY_DIRTY_COUNT:-0}, "remote": "$DEPLOY_GIT_REMOTE/$DEPLOY_GIT_REMOTE_BRANCH" },
  "newestMigration": "${newest_migration:-}",
  "operator": "$(whoami)@$(hostname -s 2>/dev/null || hostname)",
  "issuedAt": "$(ts)",
  "orchestrator": "start.sh",
  "result": "pending"
}
EOF
  log_ok "deployment manifest: $CANONICAL_MANIFEST"
}

finalize_deployment_manifest() {
  local result="$1"
  [ -f "$CANONICAL_MANIFEST" ] || return 0
  sed -i.bak "s/\"result\": \"pending\"/\"result\": \"$result\", \"completedAt\": \"$(ts)\"/" "$CANONICAL_MANIFEST" && rm -f "$CANONICAL_MANIFEST.bak"
  log_ok "manifest finalized: result=$result"
}

# upload_governance_bundle — manifest + token → $REMOTE_STAGING_INCOMING/<id>/
upload_governance_bundle() {
  GOVERNANCE_REMOTE_DIR="$REMOTE_STAGING_INCOMING/$DEPLOYMENT_ID"
  step "Uploading governance bundle"
  if [ "$DRY_RUN" -eq 1 ]; then log_dry "would upload manifest + token to $GOVERNANCE_REMOTE_DIR"; return 0; fi
  ssh_run "prepare $GOVERNANCE_REMOTE_DIR" "mkdir -p '$GOVERNANCE_REMOTE_DIR' && chmod 700 '$GOVERNANCE_REMOTE_DIR'" \
    || die "Could not create the remote bundle directory" "SSH or permissions." "Re-run 10-server-bootstrap-serverscript.sh on the server."
  # shellcheck disable=SC2086
  scp $SSH_OPTS "$CANONICAL_MANIFEST" "$(ssh_target):$GOVERNANCE_REMOTE_DIR/deployment-manifest.json" >>"$LOG_FILE" 2>&1 \
    && scp $SSH_OPTS "$GOVERNANCE_TOKEN_FILE" "$(ssh_target):$GOVERNANCE_REMOTE_DIR/deployment-token.json" >>"$LOG_FILE" 2>&1 \
    || die "Bundle upload failed" "scp returned an error." "Check SSH and $REMOTE_STAGING_INCOMING permissions."
  log_ok "bundle uploaded: $GOVERNANCE_REMOTE_DIR"
}

# remote_promote ENV TAG — the one privileged call: root wrapper on the server.
remote_promote() {
  local env="$1" tag="$2"
  local cmd="sudo -n $DEPLOY_WRAPPER promote --env '$env' --tag '$tag' --governance-dir '$GOVERNANCE_REMOTE_DIR'"
  step "Promoting on server ($DEPLOY_WRAPPER promote)"
  if [ "$DRY_RUN" -eq 1 ]; then log_dry "would run: $cmd"; return 0; fi
  # shellcheck disable=SC2086
  if _run_with_timeout "$DEPLOY_PROMOTE_TIMEOUT_SEC" ssh $SSH_OPTS "$(ssh_target)" "$cmd"; then
    log_ok "release promoted on server"
  else
    die "Promotion failed or timed out" "The server wrapper rejected the bundle, a gate failed, or the health wait expired (it rolls back to the previous tag on its own)." "Read the end of $LOG_FILE, then deploy/06-validate.sh --env $env."
  fi
}

# issue_rollback_credentials ENV TAG BACKUP — token for a governed rollback.
issue_rollback_credentials() {
  local env="$1" tag="$2" backup="${3:-}"
  reject_governance_bypass_env
  DEPLOYMENT_ID="$(generate_deployment_id)"
  local epoch expires payload hmac
  epoch="$(date +%s)"; expires=$((epoch + GOVERNANCE_TOKEN_TTL_SECONDS))
  payload="rollback|${DEPLOYMENT_ID}|${epoch}|${env}|${tag}|${backup}|${expires}"
  if [ "$DRY_RUN" -eq 1 ] && [ ! -s "$GOVERNANCE_HMAC_KEY_FILE" ]; then hmac="dry-run-no-key"; else hmac="$(governance_hmac "$payload")"; fi
  GOVERNANCE_TOKEN_FILE="$LOG_DIR/.rollback-token-${DEPLOYMENT_ID}.json"
  cat >"$GOVERNANCE_TOKEN_FILE" <<EOF
{
  "kind": "rollback",
  "deploymentId": "$DEPLOYMENT_ID",
  "issuedAtEpoch": $epoch,
  "expiresAtEpoch": $expires,
  "environment": "$env",
  "tag": "$tag",
  "backup": "$backup",
  "operator": "$(whoami)@$(hostname -s 2>/dev/null || hostname)",
  "orchestrator": "07-rollback.sh",
  "hmac": "$hmac"
}
EOF
  chmod 600 "$GOVERNANCE_TOKEN_FILE"
  log_ok "rollback credentials issued (id=$DEPLOYMENT_ID)"
}

upload_rollback_bundle() {
  GOVERNANCE_REMOTE_DIR="$REMOTE_STAGING_INCOMING/$DEPLOYMENT_ID"
  if [ "$DRY_RUN" -eq 1 ]; then log_dry "would upload rollback token to $GOVERNANCE_REMOTE_DIR"; return 0; fi
  ssh_run "prepare $GOVERNANCE_REMOTE_DIR" "mkdir -p '$GOVERNANCE_REMOTE_DIR' && chmod 700 '$GOVERNANCE_REMOTE_DIR'" || die "Could not create the remote bundle directory" "SSH or permissions." "Re-run the server bootstrap."
  # shellcheck disable=SC2086
  scp $SSH_OPTS "$GOVERNANCE_TOKEN_FILE" "$(ssh_target):$GOVERNANCE_REMOTE_DIR/rollback-token.json" >>"$LOG_FILE" 2>&1 || die "Rollback token upload failed" "scp returned an error." "Check SSH."
  log_ok "rollback bundle uploaded"
}
