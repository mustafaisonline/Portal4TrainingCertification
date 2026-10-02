# config — deploy/systemd/p4tc-backup.timer

| Field | Value |
|---|---|
| Category | technical |
| Kind | config |
| Source of truth | `deploy/systemd/p4tc-backup.timer` |
| Owner | founder |
| Version / date | 2026-10-02 |
| Status | approved |
| Related | deploy/README.md; procedure-governed-deploy.md; CR-2026-10-02-0030; script-deploy-systemd-p4tc-backup-service.md |

## Purpose
systemd timer that fires the nightly backup service.

## Description
- **Runs on:** server; copied by the bootstrap script and enabled with `systemctl enable --now`.
- **Schedule:** `OnCalendar=*-*-* 02:00:00 UTC`, `Persistent=true` (runs a missed run after downtime), `RandomizedDelaySec=600`; `WantedBy=timers.target`.
- **Activates:** `p4tc-backup.service` (same unit name). **Secrets:** none. **Destructive:** no.

## Change history
- 2026-10-02 — metadata file created from a full read of the source (no behaviour change).
