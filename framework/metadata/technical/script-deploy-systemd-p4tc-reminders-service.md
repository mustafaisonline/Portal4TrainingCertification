# config — deploy/systemd/p4tc-reminders.service

| Field | Value |
|---|---|
| Category | technical |
| Kind | config |
| Source of truth | `deploy/systemd/p4tc-reminders.service` |
| Owner | founder |
| Version / date | 2026-10-02 |
| Status | approved |
| Related | deploy/README.md; procedure-governed-deploy.md; CR-2026-10-02-0030; script-deploy-systemd-p4tc-reminders-timer.md |

## Purpose
systemd oneshot unit that triggers the daily certificate renewal reminders job.

## Description
- **Runs on:** server; installed by the bootstrap script with `{{DOMAIN}}` replaced by the apex domain.
- **Behaviour:** after `network-online.target` and `docker.service` (a leftover; Docker is no longer used); loads `/etc/p4tc/production.env` as `EnvironmentFile`; `ExecStart` is `/usr/bin/curl -fsS -m 120 -X POST` with header `Authorization: Bearer ${JOBS_SECRET}` to `https://{{DOMAIN}}/api/jobs/certificate-reminders`.
- **Variable used:** `JOBS_SECRET` (name only; value stays in the root-owned env file and is expanded by systemd, so it does not appear in a process list).
- **Triggered by:** `p4tc-reminders.timer`. **What it changes:** causes the application to run its reminders job (effects not determined from this file). **Idempotent:** not determined from the file (depends on the endpoint).

## Change history
- 2026-10-02 — metadata file created from a full read of the source (no behaviour change).
