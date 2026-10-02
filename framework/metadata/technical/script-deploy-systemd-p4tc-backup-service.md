# config — deploy/systemd/p4tc-backup.service

| Field | Value |
|---|---|
| Category | technical |
| Kind | config |
| Source of truth | `deploy/systemd/p4tc-backup.service` |
| Owner | founder |
| Version / date | 2026-10-02 |
| Status | approved |
| Related | deploy/README.md; procedure-governed-deploy.md; CR-2026-10-02-0030; script-deploy-systemd-p4tc-backup-timer.md; script-deploy-01-backup-serverscript-sh.md |

## Purpose
systemd oneshot unit that runs the nightly production database backup.

## Description
- **Runs on:** server; installed by the bootstrap script to `/etc/systemd/system/` with `{{OPT}}` replaced by `/opt/p4tc`.
- **Behaviour:** Type=oneshot as user and group `deploy`, after `network-online.target`; `ExecStart` is `{{OPT}}/deploy/01-backup-serverscript.sh --env production --tag nightly`.
- **Triggered by:** `p4tc-backup.timer`. **Secrets:** none in the unit (the script reads the env file itself).
- **Note:** the unit's header comment still says "second layer beside the managed cluster's own backups + PITR", which is out of date since managed PostgreSQL was dropped; the nightly dump is now the sole recovery mechanism (per README and the backup script).
- **Idempotent:** each run adds a dump and prunes beyond BACKUP_KEEP. **Destructive:** only via retention pruning.

## Change history
- 2026-10-02 — metadata file created from a full read of the source (no behaviour change).
