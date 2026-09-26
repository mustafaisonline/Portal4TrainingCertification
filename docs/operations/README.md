# Operations — Index

> **Status: DRAFTED 2026-09-23 by Milestone 9 · NOTHING IS PROVISIONED.** No hosting account, database, domain, email provider, scheduler, uptime monitor or Stripe live endpoint exists. Every one of those is a founder action behind a RED gate (ADR-005a, ADR-015, ADR-016, ADR-032; `CLAUDE.md` "changing production infrastructure", "introducing new external services"). These documents say **how** to do each step once the founder decides; they do not record that any step has been done.

## What this folder is

The **operator's manual** for the portal: how to deploy it, keep it up, back it up, restore it, watch it, and respond when something goes wrong. Written for the founder as the operator of record, with concrete commands. It sits beside `docs/architecture/` (why the system is shaped this way) and `docs/execution/` (what was built and when).

## Documents

| Document | Read it when |
|---|---|
| [`DEPLOYMENT_RUNBOOK.md`](DEPLOYMENT_RUNBOOK.md) | Standing up staging or production for the first time; every subsequent deploy; adding an environment variable; running a migration; wiring Stripe's production webhook and the reminders scheduler |
| [`BACKUP_AND_RESTORE.md`](BACKUP_AND_RESTORE.md) | Setting the backup schedule; running the restore rehearsal (`scripts/backup.sh`, `scripts/restore-rehearsal.sh`); an actual restore |
| [`MONITORING_AND_INCIDENTS.md`](MONITORING_AND_INCIDENTS.md) | Configuring uptime checks on `/api/health` and `/verify`; what log lines mean an alert; step-by-step incident runbooks (webhook failing, database unreachable, Stripe degraded, key rotation) |
| [`SECURITY_CHECKLIST.md`](SECURITY_CHECKLIST.md) | Before the first production deploy and after any security-relevant change; mapped section by section to `SECURITY_ARCHITECTURE.md` |
| [`RELEASE_GATE.md`](RELEASE_GATE.md) | The gate that must pass before every production deploy — **adopted 2026-09-26 (K11)**; implemented as `deploy/04-release-gate.sh` and as the `verify` job of `release.yml` |
| [`../../deploy/README.md`](../../deploy/README.md) | **The governed deployment framework (Milestone 11).** Provisioning checklist for the DigitalOcean Droplet + Managed PostgreSQL, server bootstrap, `deploy/start.sh` for every deploy (audit → gate → signed token → backup → sandbox → migrate → switch → validate), rollback and restore, how to rehearse with no server |

## Founder decisions these documents depend on (all OPEN)

From `docs/execution/MILESTONE_9_EXECUTION_PLAN.md` §4. Each document marks where a decision changes the procedure.

| # | Decision | Recommendation (AP-12, free-first) | State |
|---|---|---|---|
| J1 | Data residency (ADR-032) | Verify the seven inputs; if none binds, Singapore region | **SGP1 accepted 2026-09-26 (K5)** — the residency *question* (law/contract/preference) is still to be confirmed before production data is provisioned (ADR-032 sequencing rule) |
| J2 | Hosting (ADR-016) | ~~Vercel Pro or one container on Fly.io / Railway / VPS~~ | **DECIDED 2026-09-26 (K2, ADR-046): one DigitalOcean Droplet, container image behind Caddy** — `deploy/` |
| J3 | Production PostgreSQL (ADR-005a) | ~~Neon~~ | **DECIDED 2026-09-26 (K3, ADR-046): DigitalOcean Managed PostgreSQL 16, same VPC** — not yet provisioned |
| J4 | Domain and email sending domain | One apex domain; `/verify` on it (ADR-039); SPF/DKIM/DMARC before the first real email | **OPEN (K13)** — blocks Phase B |
| J5 | Email provider (ADR-015) | Resend free tier; `EMAIL_TRANSPORT=resend` once the transport is implemented | **DEFERRED at go-live (K14)** — `EMAIL_TRANSPORT=log` |
| J6 | Release gate (OQ-18) | Full Vitest + Playwright + build before every production deploy | **ADOPTED 2026-09-26 (K11)** — Playwright blocking; `deploy/04-release-gate.sh` |
| J7 | RPO / RTO (OQ-10), retention | RPO 24 h until PITR, RTO 4 h; retention per Data Arch §7.1 assumptions | **Backups decided (K10)**: managed PITR primary + nightly on-server dump (`BACKUP_KEEP=7`) + weekly off-host copy; RPO/RTO figures themselves still to be recorded |
| J8 | Content-Security-Policy | Report-only on staging first; enforce after a clean week | **OPEN** |
| J9 | Stripe production | Activate live mode; add the production webhook; rotate the pasted keys | **Partly decided (K1, K15, K16)**: restricted key accepted; the nine webhook events as-is; one real payment + refund at go-live. **Both pasted keys still to be rolled** |

## Conventions

- Commands assume the repository root, Node 24 on `PATH` (`export PATH="/opt/homebrew/opt/node@24/bin:$PATH"` on the founder's machine), and PostgreSQL 16 client tools (`psql`, `pg_dump`, `pg_restore`).
- `<…>` is a value the operator supplies. **No document in this folder contains a secret, and none should ever be edited to contain one** (ADR-030).
- "Production" means `NODE_ENV=production`, which `next build` / `next start` and the Dockerfile set. In that mode `instrumentation.ts` refuses to start the server when required configuration is missing — see the runbook §2.
