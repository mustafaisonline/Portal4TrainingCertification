# script — deploy/lib/common.sh

| Field | Value |
|---|---|
| Category | technical |
| Kind | script |
| Source of truth | `deploy/lib/common.sh` |
| Owner | founder |
| Version / date | 2026-10-02 |
| Status | approved |
| Related | deploy/README.md; procedure-governed-deploy.md; CR-2026-10-02-0030; script-deploy-lib-governance-sh.md |

## Purpose
Shared primitives sourced by every framework script on the laptop (and by config consumers): logging, errors, bounded execution, locks, SSH/HTTP helpers, git gates, reports.

## Description
- **Runs on:** laptop (sourced, not executed). Bash 3.2 compatible (no `timeout`, `mapfile`). Each caller sets `SCRIPT_NAME` first.
- **Inputs:** `deploy/config.env` and optional `deploy/config.local.env`; arguments `--dry-run`, `--yes/-y`, `--help/-h`, `--env X`, `--tag X` via `parse_common_args`.
- **Provides:** paths (DEPLOY_DIR, PROJECT_ROOT, LOG_DIR, REPORTS_DIR); logging `log_info/ok/warn/error/dry`, `banner`, `step`; `error_block` (what/why/fix), `die` (hard stop, writes report), `soft_fail` (recorded, continue); `_run_with_timeout`, `run_blocking`, `run_advisory`, `run`, `run_sh` (all honour `--dry-run`); `confirm`; `require_cmd/file/dir`; `config_has_placeholders` (SERVER_HOST, DOMAIN); `ssh_target`, `check_ssh`, `ssh_run`, `ssh_capture`; `http_code`, `http_body`; `acquire_lock/release_lock` (mkdir lock at `deploy/logs/.deploy.lock`); `git_working_tree_clean`, `capture_release_metadata`, `validate_git_deploy_source` (tag exists, at HEAD, tree clean; GitHub not consulted); `resolve_env` (only production); `write_report`, `finish`.
- **Outputs:** per-script log `deploy/logs/<name>.log` and report `deploy/reports/<name>-report.md`; temp capture files removed on exit.
- **What it changes:** local log/report files, the lock directory and temp files only. **Idempotent:** yes. **Destructive:** no.
- **Safety notes:** reports never contain env-file values; unknown environments are refused.

## Change history
- 2026-10-02 — metadata file created from a full read of the source (no behaviour change).
