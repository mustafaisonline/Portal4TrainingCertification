#!/usr/bin/env bash
# =============================================================================
# 07-rollback.sh   (run on: LAPTOP)
# Governed rollback of one environment to a previous image TAG, optionally
# restoring the database from a backup package the server holds.
#   deploy/07-rollback.sh --env production                 → previous tag (marker)
#   deploy/07-rollback.sh --env production --tag v1.2.0    → that tag
#   deploy/07-rollback.sh --env production --restore-db p4tc-production-<stamp>.dump
# A database restore is a RED-gate destructive operation (ADR-029): the server
# takes a safety snapshot first, and the founder must confirm at the prompt.
# Migrations are never "un-run" — restoring a dump is the only way back.
# =============================================================================
SCRIPT_NAME="07-rollback"
# shellcheck disable=SC1091
. "$(dirname "$0")/lib/common.sh"
# shellcheck disable=SC1091
. "$(dirname "$0")/lib/governance.sh"
print_help() { printf 'Usage: %s --env production|staging [--tag vX] [--restore-db <dump-file-name>] [--dry-run] [--yes]\n' "$SCRIPT_NAME" >&2; }
reject_prohibited_flags "$@"
RESTORE_DB=""; prev=""
for a in "$@"; do
  if [ "$prev" = "--restore-db" ]; then RESTORE_DB="$(basename "$a")"; prev=""; continue; fi
  case "$a" in --restore-db) prev="$a" ;; --restore-db=*) RESTORE_DB="$(basename "${a#--restore-db=}")" ;; esac
done
parse_common_args "$@"
resolve_env "$ENV_ARG"

banner "Rollback $TARGET_ENV"
require_cmd ssh; require_cmd scp
[ "$DRY_RUN" -eq 1 ] || require_governance_hmac_key
check_ssh

step "Resolving target tag"
if [ -z "$TAG_ARG" ]; then
  TAG_ARG="$(ssh_capture "cat '$REMOTE_MARKERS_ROOT/$TARGET_ENV/.deployed-previous-tag' 2>/dev/null")"
  [ -n "$TAG_ARG" ] || { [ "$DRY_RUN" -eq 1 ] && TAG_ARG="previous-tag-marker"; }
  [ -n "$TAG_ARG" ] || die "No previous tag recorded for $TARGET_ENV" "Only one governed deploy has happened, or markers are missing." "Pass --tag explicitly."
fi
current="$(ssh_capture "cat '$REMOTE_MARKERS_ROOT/$TARGET_ENV/.deployed-tag' 2>/dev/null")"
log_info "current: ${current:-unknown} → rollback to: $TAG_ARG${RESTORE_DB:+ · restore DB from $RESTORE_DB}"
if [ -n "$RESTORE_DB" ] && [ "$DRY_RUN" -eq 0 ]; then
  ssh_capture "test -f '$REMOTE_BACKUP_ROOT/$RESTORE_DB' && echo yes" | grep -q yes || die "Backup $RESTORE_DB not found in $REMOTE_BACKUP_ROOT" "Only packages the server holds can be restored." "ssh and ls $REMOTE_BACKUP_ROOT"
  log_warn "DATABASE RESTORE requested: every row written after that dump will be lost (a safety snapshot is taken first)."
fi

confirm "Proceed with governed rollback of $TARGET_ENV to $TAG_ARG${RESTORE_DB:+ WITH DATABASE RESTORE}?" || { log_warn "Aborted by operator."; finish; }
acquire_lock
issue_rollback_credentials "$TARGET_ENV" "$TAG_ARG" "$RESTORE_DB"
upload_rollback_bundle

step "Rolling back on server ($DEPLOY_WRAPPER rollback)"
cmd="sudo -n $DEPLOY_WRAPPER rollback --env '$TARGET_ENV' --tag '$TAG_ARG' --governance-dir '$GOVERNANCE_REMOTE_DIR'${RESTORE_DB:+ --restore-db '$RESTORE_DB'}"
if [ "$DRY_RUN" -eq 1 ]; then log_dry "would run: $cmd"
else
  # shellcheck disable=SC2086
  _run_with_timeout "$DEPLOY_PROMOTE_TIMEOUT_SEC" ssh $SSH_OPTS "$(ssh_target)" "$cmd" && log_ok "rollback applied" \
    || die "Rollback failed on server" "See the end of $LOG_FILE." "The safety snapshot (if a restore ran) is in $REMOTE_BACKUP_ROOT."
fi

step "Next"
log_info "deploy/06-validate.sh --env $TARGET_ENV --tag $TAG_ARG"
finish
