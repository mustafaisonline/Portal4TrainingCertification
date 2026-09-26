#!/usr/bin/env bash
# =============================================================================
# 04-release-gate.sh   (run on: LAPTOP)
# docs/operations/RELEASE_GATE.md as code — adopted under M11 decision K11
# (2026-09-26): before every production deploy, on the exact commit:
#   typecheck → Vitest → build → Playwright   (blocking)
#   npm audit --omit=dev                        (advisory: triage in the PR)
# Every task is bounded by a timeout from config.env. Needs DATABASE_URL_TEST
# in .env.local (Vitest refuses to run otherwise) and a free port 3101.
# =============================================================================
SCRIPT_NAME="04-release-gate"
# shellcheck disable=SC1091
. "$(dirname "$0")/lib/common.sh"
print_help() { printf 'Usage: %s [--dry-run]\n  Runs the release gate on HEAD. No flags skip any blocking step.\n' "$SCRIPT_NAME" >&2; }
for a in "$@"; do case "$a" in --skip-*|--no-*) die "$a is not supported" "The gate has no skip flags (K11)." "Fix the failing step." ;; esac; done
parse_common_args "$@"

banner "Release gate"
cd "$PROJECT_ROOT" || die "cannot cd to $PROJECT_ROOT" "" ""
capture_release_metadata
log_info "commit $DEPLOY_COMMIT_SHORT on $DEPLOY_BRANCH · dirty files: $DEPLOY_DIRTY_COUNT"

step "Preconditions"
require_cmd npx
[ -d node_modules ] || die "node_modules missing" "The gate runs the repository's own tools." "npm ci"
if [ "$DRY_RUN" -eq 0 ]; then
  grep -q '^DATABASE_URL_TEST=' .env.local 2>/dev/null || [ -n "${DATABASE_URL_TEST:-}" ] || die "DATABASE_URL_TEST not set" "Vitest and Playwright run against the dedicated test database." "Set it in .env.local (see .env.example)."
fi
git_working_tree_clean && log_ok "working tree clean" || log_warn "working tree dirty — the gate result applies to the working copy, not to a commit"

step "1/5 Typecheck (blocking)"
run_blocking "tsc --noEmit" "$GATE_TYPECHECK_TIMEOUT_SEC" npx tsc --noEmit --incremental false

step "2/5 Unit + integration — Vitest (blocking)"
run_blocking "vitest run" "$GATE_VITEST_TIMEOUT_SEC" npx vitest run

step "3/5 Production build (blocking)"
run_blocking "next build" "$GATE_BUILD_TIMEOUT_SEC" npx next build

step "4/5 End-to-end + accessibility — Playwright against the PRODUCTION build (blocking, K11)"
# PLAYWRIGHT_SERVER=start: the suite runs `next start` on the build step 3
# just produced — the gate tests the artifact that ships, and it does not
# collide with a `next dev` holding the directory lock (Next 16 allows one).
export PLAYWRIGHT_SERVER=start
run_blocking "playwright test (next start -p 3101)" "$GATE_PLAYWRIGHT_TIMEOUT_SEC" npx playwright test

step "5/5 Dependency audit (advisory)"
run_advisory "npm audit --omit=dev --audit-level=high" "$GATE_AUDIT_TIMEOUT_SEC" npm audit --omit=dev --audit-level=high

finish
