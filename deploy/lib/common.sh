#!/usr/bin/env bash
# =============================================================================
# deploy/lib/common.sh — shared primitives for every framework script.
# Ported (in spirit, not by copy) from eCard Deployement-Steps/lib/common.sh:
# logging with captured PASS/WARN/FAIL lines, a three-line error block, hard
# and soft failures, bounded execution (blocking vs advisory), a lock, SSH
# helpers, per-script Markdown reports, and --dry-run / --yes / --help parsing.
#
# Portability: runs under Bash 3.2 (macOS) and Bash 5 (Ubuntu). No arrays of
# arrays, no `mapfile`, no `timeout`(1) — the watchdog below replaces it.
#
# Every script sets SCRIPT_NAME before sourcing this file.
# =============================================================================

[ -n "${P4TC_COMMON_SOURCED:-}" ] && return 0
P4TC_COMMON_SOURCED=1

set -u
set -o pipefail

# --- Paths -------------------------------------------------------------------
DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_ROOT="$(cd "$DEPLOY_DIR/.." && pwd)"
LOG_DIR="$DEPLOY_DIR/logs"
REPORTS_DIR="$DEPLOY_DIR/reports"
SCRIPT_NAME="${SCRIPT_NAME:-$(basename "${BASH_SOURCE[1]:-$0}" .sh)}"
mkdir -p "$LOG_DIR" "$REPORTS_DIR" 2>/dev/null || true
LOG_FILE="$LOG_DIR/${SCRIPT_NAME}.log"
REPORT_FILE="$REPORTS_DIR/${SCRIPT_NAME}-report.md"

# --- Configuration -----------------------------------------------------------
# shellcheck disable=SC1091
. "$DEPLOY_DIR/config.env"
if [ -f "$DEPLOY_DIR/config.local.env" ]; then
  # shellcheck disable=SC1091
  . "$DEPLOY_DIR/config.local.env"
fi
case "$GOVERNANCE_HMAC_KEY_FILE" in /*) : ;; *) GOVERNANCE_HMAC_KEY_FILE="$DEPLOY_DIR/$GOVERNANCE_HMAC_KEY_FILE" ;; esac

# --- Run state ----------------------------------------------------------------
DRY_RUN=0
ASSUME_YES=0
FAILED_STEPS=0
WARNED_STEPS=0
RUN_STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
RUN_OK="$(mktemp "${TMPDIR:-/tmp}/p4tc-ok.XXXXXX")"
RUN_WARN="$(mktemp "${TMPDIR:-/tmp}/p4tc-warn.XXXXXX")"
RUN_ERR="$(mktemp "${TMPDIR:-/tmp}/p4tc-err.XXXXXX")"
RUN_STEPS="$(mktemp "${TMPDIR:-/tmp}/p4tc-steps.XXXXXX")"
trap 'rm -f "$RUN_OK" "$RUN_WARN" "$RUN_ERR" "$RUN_STEPS"' EXIT

# --- Output -------------------------------------------------------------------
if [ -t 2 ]; then
  C_RESET=$'\033[0m'; C_RED=$'\033[31m'; C_GREEN=$'\033[32m'; C_YELLOW=$'\033[33m'; C_BLUE=$'\033[34m'; C_BOLD=$'\033[1m'
else
  C_RESET=""; C_RED=""; C_GREEN=""; C_YELLOW=""; C_BLUE=""; C_BOLD=""
fi

ts() { date -u '+%Y-%m-%d %H:%M:%SZ'; }

_log_raw() {
  local level="$1" colour="$2"; shift 2
  local line="[$(ts)] [$level] $*"
  printf '%s\n' "$line" >>"$LOG_FILE" 2>/dev/null || true
  printf '%s%s%s\n' "$colour" "$line" "$C_RESET" >&2
}
_cap() { printf '%s\n' "$2" >>"$1" 2>/dev/null || true; }

log_info()  { _log_raw "INFO"  "$C_BLUE"   "$@"; }
log_ok()    { _log_raw "OK"    "$C_GREEN"  "$@"; _cap "$RUN_OK" "$*"; }
log_warn()  { _log_raw "WARN"  "$C_YELLOW" "$@"; _cap "$RUN_WARN" "$*"; WARNED_STEPS=$((WARNED_STEPS + 1)); }
log_error() { _log_raw "ERROR" "$C_RED"    "$@"; }
log_dry()   { _log_raw "DRY"   "$C_YELLOW" "$@"; _cap "$RUN_OK" "(dry-run) $*"; }

banner() {
  printf '\n%s%s══ %s ══%s\n' "$C_BOLD" "$C_BLUE" "$*" "$C_RESET" >&2
  printf '%s   %s · %s · log: %s%s\n\n' "$C_BLUE" "$FRAMEWORK_VERSION" "$(ts)" "$LOG_FILE" "$C_RESET" >&2
  printf '\n===== %s — %s =====\n' "$*" "$(ts)" >>"$LOG_FILE" 2>/dev/null || true
}

step() { printf '\n' >&2; log_info "STEP: $*"; _cap "$RUN_STEPS" "$*"; }

# error_block WHAT WHY FIX — the three lines every failure prints.
error_block() {
  log_error "$1"
  [ -n "${2:-}" ] && printf '%s   why: %s%s\n' "$C_RED" "$2" "$C_RESET" >&2
  [ -n "${3:-}" ] && printf '%s   fix: %s%s\n' "$C_RED" "$3" "$C_RESET" >&2
  printf '   why: %s\n   fix: %s\n' "${2:-}" "${3:-}" >>"$LOG_FILE" 2>/dev/null || true
}

# die WHAT WHY FIX — hard stop. The report is still written.
die() {
  error_block "$@"
  _cap "$RUN_ERR" "$1"
  FAILED_STEPS=$((FAILED_STEPS + 1))
  write_report "FAILED"
  exit 1
}

# soft_fail WHAT WHY FIX — recorded; the script continues; finish() exits 1.
soft_fail() {
  error_block "$@"
  _cap "$RUN_ERR" "$1"
  FAILED_STEPS=$((FAILED_STEPS + 1))
}

# --- Bounded execution --------------------------------------------------------
# _run_with_timeout SECONDS CMD... — runs CMD, kills it after SECONDS.
# Exit 124 on timeout (the same code GNU timeout uses). Output goes to the log.
_run_with_timeout() {
  local secs="$1"; shift
  if [ "$DRY_RUN" -eq 1 ]; then log_dry "would run (≤${secs}s): $*"; return 0; fi
  "$@" >>"$LOG_FILE" 2>&1 &
  local pid=$!
  local waited=0
  while kill -0 "$pid" 2>/dev/null; do
    if [ "$waited" -ge "$secs" ]; then
      kill "$pid" 2>/dev/null; sleep 1; kill -9 "$pid" 2>/dev/null
      wait "$pid" 2>/dev/null
      return 124
    fi
    sleep 1; waited=$((waited + 1))
  done
  wait "$pid"
}

# run_blocking LABEL SECONDS CMD... — failure or timeout is a hard stop.
run_blocking() {
  local label="$1" secs="$2"; shift 2
  local rc=0
  _run_with_timeout "$secs" "$@" || rc=$?
  case "$rc" in
    0)   log_ok "$label" ;;
    124) die "$label TIMED OUT after ${secs}s" "Blocking task exceeded its budget." "Inspect $LOG_FILE; raise the timeout in config.env only if the task is legitimately slower." ;;
    *)   die "$label FAILED (exit $rc)" "Blocking task returned an error." "Inspect $LOG_FILE." ;;
  esac
}

# run_advisory LABEL SECONDS CMD... — failure or timeout is a warning.
run_advisory() {
  local label="$1" secs="$2"; shift 2
  local rc=0
  _run_with_timeout "$secs" "$@" || rc=$?
  case "$rc" in
    0)   log_ok "$label" ;;
    124) log_warn "$label timed out after ${secs}s (advisory)" ;;
    *)   log_warn "$label failed with exit $rc (advisory) — see $LOG_FILE" ;;
  esac
}

# run LABEL -- CMD... — plain execution honouring --dry-run; failure is hard.
run() {
  local label="$1"; shift; [ "${1:-}" = "--" ] && shift
  if [ "$DRY_RUN" -eq 1 ]; then log_dry "would run: $*"; return 0; fi
  if "$@" >>"$LOG_FILE" 2>&1; then log_ok "$label"; else die "$label failed" "Command: $*" "See $LOG_FILE."; fi
}

# run_sh LABEL 'shell string' [WHY] [FIX]
run_sh() {
  local label="$1" cmd="$2" why="${3:-Command failed.}" fix="${4:-See $LOG_FILE.}"
  if [ "$DRY_RUN" -eq 1 ]; then log_dry "would run: $cmd"; return 0; fi
  if bash -c "$cmd" >>"$LOG_FILE" 2>&1; then log_ok "$label"; else die "$label failed" "$why" "$fix"; fi
}

confirm() {
  local prompt="$1"
  if [ "$ASSUME_YES" -eq 1 ] || [ "$DRY_RUN" -eq 1 ]; then return 0; fi
  printf '%s%s [y/N] %s' "$C_BOLD" "$prompt" "$C_RESET" >&2
  local answer; read -r answer
  case "$answer" in y|Y|yes|YES) return 0 ;; *) return 1 ;; esac
}

# --- Requirements -------------------------------------------------------------
require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Missing command: $1" "${2:-A framework step needs it.}" "${3:-Install $1 and re-run.}"
}
require_file() { [ -f "$1" ] || die "Missing file: $1" "${2:-A framework step needs it.}" "${3:-Create it and re-run.}"; }
require_dir()  { [ -d "$1" ] || die "Missing directory: $1" "${2:-A framework step needs it.}" "${3:-Create it and re-run.}"; }

# config_has_placeholders — true when any config value still reads <…>.
config_has_placeholders() {
  local v
  for v in SERVER_HOST DOMAIN REGISTRY; do
    case "$(eval "printf '%s' \"\${$v}\"")" in *"<"*">"*) return 0 ;; esac
  done
  return 1
}

# --- SSH ----------------------------------------------------------------------
ssh_target() { printf '%s@%s' "$SERVER_USER" "$SERVER_HOST"; }

# REMOTE_AVAILABLE: 1 after check_ssh succeeds. Under --dry-run an
# unreachable or unconfigured server is a WARNING and every later remote read
# returns empty — so the whole pipeline can be rehearsed with no server at
# all (V2). Outside dry-run it is a hard stop.
REMOTE_AVAILABLE=0
check_ssh() {
  if [ "$DRY_RUN" -eq 1 ] && config_has_placeholders; then log_dry "would verify SSH to $(ssh_target) (config has placeholders)"; return 0; fi
  # shellcheck disable=SC2086
  if ssh $SSH_OPTS -o ConnectTimeout="$SSH_CONNECT_TIMEOUT_SEC" "$(ssh_target)" 'echo ok' >>"$LOG_FILE" 2>&1; then
    REMOTE_AVAILABLE=1; log_ok "SSH to $(ssh_target)"
  elif [ "$DRY_RUN" -eq 1 ]; then
    log_warn "(dry-run) SSH to $(ssh_target) unavailable — remote checks will be listed, not performed"
  else
    die "SSH to $(ssh_target) failed" "Key-based, non-interactive SSH is required (BatchMode)." "Check SERVER_HOST/SERVER_USER in config.env, your ssh-agent, and the server's authorized_keys."
  fi
}

# ssh_run LABEL 'remote command' — honours --dry-run; returns the remote exit code.
ssh_run() {
  local label="$1" cmd="$2"
  if [ "$DRY_RUN" -eq 1 ]; then log_dry "would ssh: $cmd"; return 0; fi
  # shellcheck disable=SC2086
  if ssh $SSH_OPTS "$(ssh_target)" "$cmd" >>"$LOG_FILE" 2>&1; then log_ok "$label"; return 0; else log_error "$label failed (remote)"; return 1; fi
}

# ssh_capture 'remote command' — stdout of the remote command; empty when the
# server is unavailable in dry-run.
ssh_capture() {
  if [ "$REMOTE_AVAILABLE" -ne 1 ] && [ "$DRY_RUN" -eq 1 ]; then printf ''; return 0; fi
  # shellcheck disable=SC2086
  ssh $SSH_OPTS "$(ssh_target)" "$1" 2>>"$LOG_FILE"
}

# --- HTTP ---------------------------------------------------------------------
http_code() { curl -s -m "$CURL_TIMEOUT_SEC" -o /dev/null -w '%{http_code}' "$@" 2>/dev/null || printf '000'; }
http_body() { curl -s -m "$CURL_TIMEOUT_SEC" "$@" 2>/dev/null || true; }

# --- Lock ---------------------------------------------------------------------
LOCK_DIR="$LOG_DIR/.deploy.lock"
acquire_lock() {
  if mkdir "$LOCK_DIR" 2>/dev/null; then
    printf '%s %s %s\n' "$$" "$SCRIPT_NAME" "$(ts)" >"$LOCK_DIR/owner"
    trap 'release_lock; rm -f "$RUN_OK" "$RUN_WARN" "$RUN_ERR" "$RUN_STEPS"' EXIT
    log_ok "deployment lock acquired"
  else
    die "Another deployment is running (lock held)" "Owner: $(cat "$LOCK_DIR/owner" 2>/dev/null || echo unknown)" "Wait for it to finish, or remove $LOCK_DIR if that process is dead."
  fi
}
release_lock() { rm -rf "$LOCK_DIR" 2>/dev/null || true; }

# --- Git ----------------------------------------------------------------------
git_working_tree_clean() { [ -z "$(git -C "$PROJECT_ROOT" status --porcelain 2>/dev/null)" ]; }

capture_release_metadata() {
  DEPLOY_COMMIT="$(git -C "$PROJECT_ROOT" rev-parse HEAD 2>/dev/null || echo unknown)"
  DEPLOY_COMMIT_SHORT="$(printf '%s' "$DEPLOY_COMMIT" | cut -c1-12)"
  DEPLOY_BRANCH="$(git -C "$PROJECT_ROOT" branch --show-current 2>/dev/null || echo unknown)"
  DEPLOY_DIRTY_COUNT="$(git -C "$PROJECT_ROOT" status --porcelain 2>/dev/null | wc -l | tr -d ' ')"
  export DEPLOY_COMMIT DEPLOY_COMMIT_SHORT DEPLOY_BRANCH DEPLOY_DIRTY_COUNT
}

# validate_git_deploy_source TAG — the tag exists, points at HEAD, HEAD is on
# the configured remote branch, and the tree is clean. Hard stop otherwise.
validate_git_deploy_source() {
  local tag="$1"
  capture_release_metadata
  git_working_tree_clean || die "Working tree is not clean (${DEPLOY_DIRTY_COUNT} changed files)" "A deploy must be reproducible from a commit." "Commit or stash every change; never deploy from a dirty tree."
  local tag_commit
  tag_commit="$(git -C "$PROJECT_ROOT" rev-list -n 1 "$tag" 2>/dev/null || true)"
  [ -n "$tag_commit" ] || die "Tag '$tag' does not exist locally" "A deploy is a tag the release workflow has built." "git tag $tag && git push origin $tag — then wait for release.yml to finish."
  [ "$tag_commit" = "$DEPLOY_COMMIT" ] || die "Tag '$tag' is not at HEAD (${tag_commit:0:12} ≠ $DEPLOY_COMMIT_SHORT)" "The gate runs on HEAD; the image was built from the tag. They must be the same commit." "git checkout $tag (detached) or move the tag, then re-run."
  if [ "$DRY_RUN" -eq 1 ] && config_has_placeholders; then log_dry "would verify $tag is on $DEPLOY_GIT_REMOTE/$DEPLOY_GIT_REMOTE_BRANCH"; return 0; fi
  git -C "$PROJECT_ROOT" fetch --quiet "$DEPLOY_GIT_REMOTE" "$DEPLOY_GIT_REMOTE_BRANCH" "refs/tags/$tag:refs/tags/$tag" >>"$LOG_FILE" 2>&1 \
    || die "Could not fetch $DEPLOY_GIT_REMOTE" "The remote or the tag is unreachable." "Check network and that the tag was pushed."
  git -C "$PROJECT_ROOT" merge-base --is-ancestor "$DEPLOY_COMMIT" "$DEPLOY_GIT_REMOTE/$DEPLOY_GIT_REMOTE_BRANCH" \
    || die "HEAD is not on $DEPLOY_GIT_REMOTE/$DEPLOY_GIT_REMOTE_BRANCH" "Only commits merged to the production branch are deployable." "Merge to $DEPLOY_GIT_REMOTE_BRANCH, tag there, push the tag."
  log_ok "git source valid: $tag @ $DEPLOY_COMMIT_SHORT on $DEPLOY_GIT_REMOTE/$DEPLOY_GIT_REMOTE_BRANCH, tree clean"
}

# --- GitHub (release workflow status for a tag) --------------------------------
gh_ready() { command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; }

# release_workflow_conclusion TAG → success|failure|in_progress|none
release_workflow_conclusion() {
  local tag="$1"
  gh run list --repo "$GITHUB_REPO" --workflow "$RELEASE_WORKFLOW" --branch "$tag" --limit 1 \
    --json status,conclusion --jq 'if length==0 then "none" elif .[0].status!="completed" then "in_progress" else .[0].conclusion end' 2>>"$LOG_FILE" || printf 'none'
}

# --- Environment selection -------------------------------------------------------
# resolve_env NAME — sets TARGET_ENV, TARGET_URL, TARGET_PORT.
resolve_env() {
  case "${1:-}" in
    production) TARGET_ENV=production; TARGET_URL="$PRODUCTION_URL"; TARGET_PORT="$PRODUCTION_PORT" ;;
    staging)    TARGET_ENV=staging;    TARGET_URL="$STAGING_URL";    TARGET_PORT="$STAGING_PORT" ;;
    *) die "Unknown environment '${1:-}'" "Every server-facing script needs --env production|staging." "Pass --env staging (deploy there first) or --env production." ;;
  esac
  export TARGET_ENV TARGET_URL TARGET_PORT
}

# --- Arguments ----------------------------------------------------------------
# parse_common_args "$@" — handles --dry-run, --yes/-y, --help/-h, --env X.
# Scripts read other flags themselves before calling this.
ENV_ARG=""
TAG_ARG=""
parse_common_args() {
  local prev=""
  for a in "$@"; do
    case "$prev" in
      --env) ENV_ARG="$a"; prev=""; continue ;;
      --tag) TAG_ARG="$a"; prev=""; continue ;;
    esac
    case "$a" in
      --dry-run) DRY_RUN=1 ;;
      --yes|-y) ASSUME_YES=1 ;;
      --help|-h) print_help; exit 0 ;;
      --env|--tag) prev="$a" ;;
      --env=*) ENV_ARG="${a#--env=}" ;;
      --tag=*) TAG_ARG="${a#--tag=}" ;;
    esac
  done
}
print_help() { printf 'Usage: %s [--env production|staging] [--tag vX] [--dry-run] [--yes]\n' "$SCRIPT_NAME" >&2; }

# --- Reports ------------------------------------------------------------------
# write_report VERDICT — Markdown report for this run; never contains a value
# from an env file (the scripts never read values, only names).
write_report() {
  local verdict="${1:-}"
  mkdir -p "$REPORTS_DIR" 2>/dev/null || true
  {
    printf '# %s — report\n\n' "$SCRIPT_NAME"
    printf '| Field | Value |\n|---|---|\n'
    printf '| Framework | %s |\n' "$FRAMEWORK_VERSION"
    printf '| Run (UTC) | %s |\n' "$(ts)"
    printf '| Operator | %s@%s |\n' "$(whoami)" "$(hostname -s 2>/dev/null || hostname)"
    printf '| Environment | %s |\n' "${TARGET_ENV:-n/a}"
    printf '| Tag | %s |\n' "${TAG_ARG:-n/a}"
    printf '| Commit | %s |\n' "${DEPLOY_COMMIT:-$(git -C "$PROJECT_ROOT" rev-parse --short=12 HEAD 2>/dev/null || echo n/a)}"
    printf '| Dry-run | %s |\n' "$([ "$DRY_RUN" -eq 1 ] && echo yes || echo no)"
    printf '| Verdict | **%s** |\n' "$verdict"
    printf '| OK / Warn / Fail | %s / %s / %s |\n' "$(wc -l <"$RUN_OK" | tr -d ' ')" "$(wc -l <"$RUN_WARN" | tr -d ' ')" "$(wc -l <"$RUN_ERR" | tr -d ' ')"
    printf '| Log | `%s` |\n\n' "$LOG_FILE"
    printf '## Steps\n%s\n\n' "$( [ -s "$RUN_STEPS" ] && sed 's/^/- /' "$RUN_STEPS" || echo '- (none)')"
    printf '## Passed\n%s\n\n' "$( [ -s "$RUN_OK" ] && sed 's/^/- PASS: /' "$RUN_OK" || echo '- (none)')"
    printf '## Warnings\n%s\n\n' "$( [ -s "$RUN_WARN" ] && sed 's/^/- WARN: /' "$RUN_WARN" || echo '- (none)')"
    printf '## Failures\n%s\n' "$( [ -s "$RUN_ERR" ] && sed 's/^/- FAIL: /' "$RUN_ERR" || echo '- (none)')"
  } >"$REPORT_FILE" 2>/dev/null || true
}

_footer() {
  printf '\n%s%s── %s ──%s\n' "$C_BOLD" "$([ "$FAILED_STEPS" -gt 0 ] && printf '%s' "$C_RED" || printf '%s' "$C_GREEN")" "$*" "$C_RESET" >&2
}

# finish — write the report and exit 0 (no failures) or 1.
finish() {
  if [ "$FAILED_STEPS" -gt 0 ]; then
    write_report "FAILED ($FAILED_STEPS)"
    _footer "$SCRIPT_NAME: FAILED ($FAILED_STEPS failure(s), $WARNED_STEPS warning(s)) — report: $REPORT_FILE"
    exit 1
  fi
  write_report "PASSED"
  _footer "$SCRIPT_NAME: PASSED ($WARNED_STEPS warning(s)) — report: $REPORT_FILE"
  exit 0
}
