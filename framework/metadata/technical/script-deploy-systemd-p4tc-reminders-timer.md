# config — deploy/systemd/p4tc-reminders.timer

| Field | Value |
|---|---|
| Category | technical |
| Kind | config |
| Source of truth | `deploy/systemd/p4tc-reminders.timer` |
| Owner | founder |
| Version / date | 2026-10-02 |
| Status | approved |
| Related | deploy/README.md; procedure-governed-deploy.md; CR-2026-10-02-0030; script-deploy-systemd-p4tc-reminders-service.md |

## Purpose
systemd timer that fires the renewal reminders service daily.

## Description
- **Runs on:** server; copied by the bootstrap script and enabled.
- **Schedule:** `OnCalendar=*-*-* 01:00:00 UTC` (09:00 MYT), `Persistent=true`, `RandomizedDelaySec=300`; `WantedBy=timers.target`.
- **Activates:** `p4tc-reminders.service`. **Secrets:** none. **Destructive:** no.

## Change history
- 2026-10-02 — metadata file created from a full read of the source (no behaviour change).
