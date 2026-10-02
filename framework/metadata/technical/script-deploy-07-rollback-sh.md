# script — deploy/07-rollback.sh

| Field | Value |
|---|---|
| Category | technical |
| Kind | script |
| Source of truth | `deploy/07-rollback.sh` |
| Owner | founder |
| Version / date | 2026-10-02 |
| Status | approved |
| Related | deploy/README.md; procedure-governed-deploy.md; CR-2026-10-02-0030; script-deploy-lib-governance-sh.md; script-deploy-lib-server-promote-sh.md |

## Purpose
Governed rollback of production to a previous release tag, optionally restoring the database from a server-held backup dump.

## Description
- **Runs on:** laptop (the work is done on the server by the root wrapper).
- **Pipeline position:** recovery step 07; invoked by hand (recommended by 06 on failure).
- **Invocation:** `deploy/07-rollback.sh --env production [--tag vX] [--restore-db <dump-file-name>] [--dry-run] [--yes]`. Prohibited bypass flags are rejected. The dump argument is reduced to its basename.
- **Inputs:** target tag (defaults to the server's `.deployed-previous-tag` marker); the HMAC key file (real runs); config.env values; a dump name that must exist in `/opt/p4tc/backups` when `--restore-db` is used.
- **Flow:** resolve tag; show current vs target; warn if DB restore requested (every row written after that dump is lost); confirm prompt; take deployment lock; issue an HMAC-signed rollback token and upload `rollback-token.json`; run `sudo -n p4tc-deploy rollback --env --tag --governance-dir [--restore-db]` bounded by DEPLOY_PROMOTE_TIMEOUT_SEC; then suggests `06-validate.sh`.
- **Server effect (via `server-promote.sh rollback`):** with a restore — checksum check, safety snapshot (label `pre-restore`), stop the app, `pg_restore --clean`; then switch `current` to a release still on disk (last RELEASES_KEEP releases), health wait, markers. Migrations are never un-run; restoring a dump is the only way back.
- **Idempotent:** switching to a tag is repeatable. **Destructive:** only with `--restore-db` (RED gate, ADR-029; explicit confirmation plus safety snapshot).

## Change history
- 2026-10-02 — metadata file created from a full read of the source (no behaviour change).
