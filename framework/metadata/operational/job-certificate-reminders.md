# job — Certificate renewal reminders

| Field | Value |
|---|---|
| Category | operational |
| Kind | job |
| Source of truth | `app/api/jobs/certificate-reminders/route.ts`, `src/modules/certificates/reminders.service.ts`, `deploy/systemd/p4tc-reminders.service`, `deploy/systemd/p4tc-reminders.timer` (this file describes it; it does not replace it) |
| Owner | founder |
| Version / date | 2026-10-02 |
| Status | approved |
| Related | M7 plan; `docs/operations/DEPLOYMENT_RUNBOOK.md` section 7; `framework/metadata/technical/script-deploy-systemd-p4tc-reminders-service.md`; [runbook-monitoring-and-incidents.md](runbook-monitoring-and-incidents.md) |

## Purpose
Once a day, queue renewal reminder emails for certificates close to or just past expiry.

## Description
- **Trigger:** systemd timer `p4tc-reminders.timer`, `OnCalendar=*-*-* 01:00:00 UTC` (09:00 MYT), `Persistent=true`, `RandomizedDelaySec=300`. It starts `p4tc-reminders.service` (oneshot), which runs `curl -fsS -m 120 -X POST` with `Authorization: Bearer ${JOBS_SECRET}` against `https://{{DOMAIN}}/api/jobs/certificate-reminders`. JOBS_SECRET comes from `EnvironmentFile=/etc/p4tc/production.env`; systemd expands it without a shell. The unit file still lists `After=docker.service`, which looks stale (Docker not used); this is an observation, not changed.
- **Endpoint:** `POST /api/jobs/certificate-reminders` (route handler, Node runtime, force-dynamic). Only POST exists. Responses: 503 `jobs_disabled` if JOBS_SECRET is unset; 401 `unauthorised` if the bearer token is missing or differs (constant-time comparison); 200 with counts; 500 with counts if any certificate failed (retried next run); 500 `run_failed` on an unexpected error. The token is never logged.
- **What it does** (`runCertificateReminders`): reads the current fee setting, selects non-revoked certificates whose expiry is within 30 days either side of today (MYT date), works out the due stage for each (`before_30`, `before_7`, `lapsed_1`), and for each due stage writes an outbound email row (status queued) and an audit row `certificate.reminder_queued` in one transaction. Returns `considered`, `queued`, `skipped`, `failed`, per-stage counts, today and run time. A `job.run` audit row records each run. With the `log` email transport no real email is sent (see the email provider deferral in PROJECT_STATUS).
- **Idempotence:** stateless and safe to repeat. A stage is skipped if an audit row already exists for that certificate and that expiry date; a renewal moves the expiry so the next cycle is new. A crash leaves either both writes or neither.
- **Monitoring:** newest `job.run` audit row older than 26 h means it did not run ([runbook-monitoring-and-incidents.md](runbook-monitoring-and-incidents.md)). Manual check per the runbook: response `{"considered":n,"queued":m,"skipped":k}` and a `job.run` row in Admin, Audit.
- **Rotation:** change JOBS_SECRET in the env file; because the timer reads that same file, no separate scheduler secret exists on the server.

## Preconditions
JOBS_SECRET set (16 characters or more) in `/etc/p4tc/production.env`; timer enabled (the bootstrap installs it per the runbook); DOMAIN resolved in the unit.

## Safety notes
Do not put the secret inline in a command line or crontab. Stage rules and windows are certificate business rules; do not change them without a CR.

## Change history
- 2026-10-02 — created from the route, service and systemd units.
