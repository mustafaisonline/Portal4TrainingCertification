# Operational metadata

Procedures and runbooks, deployment and rollback, backup and restore, monitoring, incident handling, scheduled jobs.

**Written 2026-10-02 (CR-2026-10-02-2054):** runbooks, procedures, checklists and the reminders job from `docs/operations/` and `deploy/`. Gaps are stated inside the files.

**Index** (11 files):

| File | Item | Source | Status |
|---|---|---|---|
| [checklist-security.md](checklist-security.md) | checklist — Security (pre-launch review) | `docs/operations/SECURITY_CHECKLIST.md` (this file describes it; it does not replace it) | approved (source is a draft dated 2026-09-23) |
| [checklist-stripe-go-live.md](checklist-stripe-go-live.md) | checklist — Stripe live go-live | `docs/operations/STRIPE_GO_LIVE_CHECKLIST.md` (this file describes it; it does not replace it) | approved |
| [job-certificate-reminders.md](job-certificate-reminders.md) | job — Certificate renewal reminders | `app/api/jobs/certificate-reminders/route.ts`, `src/modules/certificates/reminders.service.ts`, `deploy/systemd/p4tc-reminders.service`, `deploy/systemd/p4tc-reminders.timer` (this file describes it; it does not replace it) | approved |
| [procedure-backup-and-restore.md](procedure-backup-and-restore.md) | procedure — Backup and restore | `docs/operations/BACKUP_AND_RESTORE.md`, `scripts/backup.sh`, `scripts/restore-rehearsal.sh`, `deploy/01-backup-serverscript.sh` (this file describes it; it does not replace it) | approved |
| [procedure-cr-change-control.md](procedure-cr-change-control.md) | procedure — CR change control | `CLAUDE.md` ("Change requisitions"), `CR/README.md`, `framework/initiate.md` (this file describes it; it does not replace it) | approved |
| [procedure-domain-setup.md](procedure-domain-setup.md) | procedure — Connect a domain (dataainexus.com) | `docs/operations/DOMAIN_SETUP.md` (this file describes it; it does not replace it) | approved |
| [procedure-governed-deploy.md](procedure-governed-deploy.md) | procedure — Governed deployment to production | `deploy/README.md` and the scripts under `deploy/` (this file describes them; it does not replace them) | approved |
| [procedure-local-development-and-testing.md](procedure-local-development-and-testing.md) | procedure — Local development and testing | `package.json` scripts, `.env.example`, `playwright.config.ts`, `deploy/README.md` (this file describes it; it does not replace it) | approved |
| [procedure-release-gate.md](procedure-release-gate.md) | procedure — Release gate | `docs/operations/RELEASE_GATE.md` and `deploy/04-release-gate.sh` (this file describes it; it does not replace it) | approved |
| [runbook-deployment.md](runbook-deployment.md) | runbook — Deployment runbook | `docs/operations/DEPLOYMENT_RUNBOOK.md` (this file describes it; it does not replace it) | approved (partly superseded, see Description) |
| [runbook-monitoring-and-incidents.md](runbook-monitoring-and-incidents.md) | runbook — Monitoring and incidents | `docs/operations/MONITORING_AND_INCIDENTS.md` (this file describes it; it does not replace it) | approved (draft source; no monitoring tooling configured) |
