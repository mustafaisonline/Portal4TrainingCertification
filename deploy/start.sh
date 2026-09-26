#!/usr/bin/env bash
# =============================================================================
# deploy/start.sh   (run on: LAPTOP) — the single entry point.
#
#   deploy/start.sh --audit --env production [--tag vX]     read-only GO/NO-GO
#   deploy/start.sh --dry-run --env staging --tag vX         whole pipeline, no changes
#   deploy/start.sh --env staging --tag vX                   governed deploy (prompts)
#   deploy/start.sh --env production --tag vX --auto-approve no prompts
#
# Pipeline (K9 full governance, K11 blocking gate):
#   00 discovery → git source gate (clean tree, tag at HEAD, on origin/main)
#   → 04 release gate on HEAD → CI built the tag (release.yml success)
#   → issue signed token + manifest → 05 deploy (server: backup → sandbox →
#   migrate → switch → health, auto-rollback) → 06 validate → summary.
# There are no bypass flags. --no-gate is accepted ONLY with --dry-run, for
# rehearsing the framework itself (V2) without a ten-minute test run.
# =============================================================================
SCRIPT_NAME="start"
# shellcheck disable=SC1091
. "$(dirname "$0")/lib/common.sh"
# shellcheck disable=SC1091
. "$(dirname "$0")/lib/governance.sh"

print_help() {
  cat >&2 <<EOF
Usage: deploy/start.sh [--audit] [--dry-run] [--auto-approve] --env production|staging [--tag vX] [--no-gate (dry-run only)]

  --audit          run 09-audit.sh only (read-only GO/NO-GO) and exit
  --dry-run        run every step in dry-run mode: nothing is changed anywhere
  --auto-approve   no confirmation prompts (live deploy)
  --env            target environment (staging first, always)
  --tag            the git tag (v*) the release workflow has built
  --no-gate        skip 04 — accepted only together with --dry-run

Reports: deploy/reports/*.md   Logs: deploy/logs/*.log
EOF
}

AUDIT=0; AUTO=0; NO_GATE=0
for a in "$@"; do
  case "$a" in
    --audit) AUDIT=1 ;;
    --auto-approve) AUTO=1 ;;
    --no-gate) NO_GATE=1 ;;
    --dry-run|--yes|-y|--env|--env=*|--tag|--tag=*|--help|-h) : ;;
    --allow-dirty|--force|--force-deploy|--skip-git-validation|--skip-gate|--skip-backup|--skip-sandbox|--skip-tests)
      die "$a is not supported" "Production governance has no bypass flags." "Fix the underlying problem." ;;
    -*) die "Unknown flag: $a" "" "deploy/start.sh --help" ;;
  esac
done
reject_governance_bypass_env
parse_common_args "$@"
[ "$AUTO" -eq 1 ] && ASSUME_YES=1
[ "$NO_GATE" -eq 1 ] && [ "$DRY_RUN" -eq 0 ] && die "--no-gate requires --dry-run" "The release gate is mandatory for a real deploy (K11)." "Drop --no-gate."

banner "Orchestrator"
resolve_env "${ENV_ARG:-}"
SUMMARY="$REPORTS_DIR/deployment-summary.md"
record() { printf '| %s | %s | %s |\n' "$1" "$2" "$3" >>"$SUMMARY.rows"; }
: >"$SUMMARY.rows"

run_child() {  # run_child NAME SCRIPT ARGS...
  local name="$1" script="$2"; shift 2
  step "ORCHESTRATE: $name"
  local extra=""; [ "$DRY_RUN" -eq 1 ] && extra="--dry-run"; [ "$ASSUME_YES" -eq 1 ] && extra="$extra --yes"
  # shellcheck disable=SC2086
  if "$DEPLOY_DIR/$script" "$@" $extra; then record "$name" "PASS" "$REPORTS_DIR/$(basename "$script" .sh)-report.md"; return 0
  else local rc=$?; record "$name" "FAIL ($rc)" "$REPORTS_DIR/$(basename "$script" .sh)-report.md"; return $rc; fi
}

write_summary() {
  {
    printf '# Deployment summary — %s\n\n' "$1"
    printf '| Field | Value |\n|---|---|\n| Framework | %s |\n| Environment | %s |\n| Tag | %s |\n| Commit | %s |\n| Deployment id | %s |\n| Dry-run | %s |\n| Operator | %s@%s |\n| Finished (UTC) | %s |\n\n' \
      "$FRAMEWORK_VERSION" "$TARGET_ENV" "${TAG_ARG:-n/a}" "${DEPLOY_COMMIT:-n/a}" "${DEPLOYMENT_ID:-n/a}" "$([ "$DRY_RUN" -eq 1 ] && echo yes || echo no)" "$(whoami)" "$(hostname -s 2>/dev/null || hostname)" "$(ts)"
    printf '| Step | Result | Report |\n|---|---|---|\n'; cat "$SUMMARY.rows"
    printf '\n## Outcome\n**%s**\n' "$1"
  } >"$SUMMARY"; rm -f "$SUMMARY.rows"
  log_info "summary: $SUMMARY"
}
fail_out() { write_summary "$1"; _footer "$1"; exit 2; }

# ── Audit mode ────────────────────────────────────────────────────────────────
if [ "$AUDIT" -eq 1 ]; then
  if "$DEPLOY_DIR/09-audit.sh" --env "$TARGET_ENV" ${TAG_ARG:+--tag "$TAG_ARG"} $([ "$DRY_RUN" -eq 1 ] && echo --dry-run); then _footer "AUDIT: GO"; exit 0; else _footer "AUDIT: NO-GO — $REPORTS_DIR/09-audit-report.md"; exit 2; fi
fi

[ -n "$TAG_ARG" ] || die "--tag is required for a deploy" "A deploy promotes an image the release workflow built from a tag." "git tag vX && git push origin vX; wait for release.yml; re-run with --tag vX."

# ── 00 discovery ──────────────────────────────────────────────────────────────
run_child "00-discovery" "00-discovery.sh" || fail_out "ABORTED: discovery failed"

# ── Git source gate ───────────────────────────────────────────────────────────
step "GATE: git source"
if [ "$DRY_RUN" -eq 1 ] && ! git_working_tree_clean; then
  capture_release_metadata; log_warn "(dry-run) working tree dirty — a real deploy would refuse here"
  git -C "$PROJECT_ROOT" rev-list -n 1 "$TAG_ARG" >/dev/null 2>&1 && log_ok "(dry-run) tag $TAG_ARG exists" || log_warn "(dry-run) tag $TAG_ARG does not exist yet"
else
  validate_git_deploy_source "$TAG_ARG"
fi
record "git-source-gate" "PASS" "-"

# ── 04 release gate ───────────────────────────────────────────────────────────
if [ "$NO_GATE" -eq 1 ]; then step "ORCHESTRATE: 04-release-gate (skipped: --no-gate with --dry-run)"; record "04-release-gate" "SKIPPED (dry-run)" "-"
else
  # The gate runs for real even in dry-run: a rehearsal that fakes its tests is not a rehearsal.
  step "ORCHESTRATE: 04-release-gate (runs for real even under --dry-run)"
  if "$DEPLOY_DIR/04-release-gate.sh"; then record "04-release-gate" "PASS" "$REPORTS_DIR/04-release-gate-report.md"; else record "04-release-gate" "FAIL" "$REPORTS_DIR/04-release-gate-report.md"; fail_out "ABORTED: release gate failed"; fi
fi

# ── CI built the tag ──────────────────────────────────────────────────────────
step "GATE: release workflow built $TAG_ARG"
if gh_ready; then
  concl="$(release_workflow_conclusion "$TAG_ARG")"
  if [ "$concl" = "success" ]; then log_ok "release.yml: success for $TAG_ARG"; record "ci-image-gate" "PASS" "-"
  elif [ "$DRY_RUN" -eq 1 ]; then log_warn "(dry-run) release.yml for $TAG_ARG: $concl"; record "ci-image-gate" "WARN ($concl)" "-"
  else record "ci-image-gate" "FAIL ($concl)" "-"; fail_out "ABORTED: no successful release build for $TAG_ARG ($concl)"; fi
elif [ "$DRY_RUN" -eq 1 ]; then log_warn "(dry-run) gh not authenticated — cannot confirm the image exists"; record "ci-image-gate" "WARN (gh)" "-"
else record "ci-image-gate" "FAIL (gh)" "-"; fail_out "ABORTED: gh CLI must be authenticated to confirm the release build (gh auth login)"; fi

# ── Credentials + 05 ──────────────────────────────────────────────────────────
step "Issuing governed deployment credentials"
issue_deployment_credentials "$TARGET_ENV" "$TAG_ARG"
record "governance-token" "ISSUED ($DEPLOYMENT_ID)" "$CANONICAL_MANIFEST"

if [ "$DRY_RUN" -eq 0 ] && [ "$ASSUME_YES" -eq 0 ]; then
  confirm "Deploy $TAG_ARG to $TARGET_ENV now?" || { record "05-deploy" "ABORTED by operator" "-"; finalize_deployment_manifest "aborted"; fail_out "ABORTED by operator"; }
fi
run_child "05-deploy" "05-deploy.sh" --env "$TARGET_ENV" --tag "$TAG_ARG" || fail_out "FAILED: deploy (server may have auto-rolled back — run 06-validate)"

# ── 06 validate ───────────────────────────────────────────────────────────────
run_child "06-validate" "06-validate.sh" --env "$TARGET_ENV" --tag "$TAG_ARG" || { write_summary "DEPLOYED BUT VALIDATION FAILED — consider deploy/07-rollback.sh --env $TARGET_ENV"; _footer "VALIDATION FAILED"; exit 2; }

write_summary "$([ "$DRY_RUN" -eq 1 ] && echo 'DRY RUN COMPLETE' || echo "DEPLOYED $TAG_ARG → $TARGET_ENV")"
_footer "$([ "$DRY_RUN" -eq 1 ] && echo 'DRY RUN COMPLETE' || echo 'DEPLOYMENT COMPLETE')"
exit 0
