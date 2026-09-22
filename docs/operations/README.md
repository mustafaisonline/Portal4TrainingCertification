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
| [`RELEASE_GATE.md`](RELEASE_GATE.md) | Deciding OQ-18 (what must pass before a production deploy); the proposed gate and the exact commands |

## Founder decisions these documents depend on (all OPEN)

From `docs/execution/MILESTONE_9_EXECUTION_PLAN.md` §4. Each document marks where a decision changes the procedure.

| # | Decision | Recommendation (AP-12, free-first) | State |
|---|---|---|---|
| J1 | Data residency (ADR-032) | Verify the seven inputs; if none binds, Singapore region | **OPEN** |
| J2 | Hosting (ADR-016) | Vercel Pro (Hobby is non-commercial) or one container on Fly.io / Railway / VPS via `Dockerfile` | **OPEN** |
| J3 | Production PostgreSQL (ADR-005a) | Neon (Singapore; pooled connection string) | **OPEN** |
| J4 | Domain and email sending domain | One apex domain; `/verify` on it (ADR-039); SPF/DKIM/DMARC before the first real email | **OPEN** |
| J5 | Email provider (ADR-015) | Resend free tier; `EMAIL_TRANSPORT=resend` once the transport is implemented | **OPEN** |
| J6 | Release gate (OQ-18) | Full Vitest + Playwright + build before every production deploy | **OPEN** — proposal in `RELEASE_GATE.md` |
| J7 | RPO / RTO (OQ-10), retention | RPO 24 h until PITR, RTO 4 h; retention per Data Arch §7.1 assumptions | **OPEN** |
| J8 | Content-Security-Policy | Report-only on staging first; enforce after a clean week | **OPEN** |
| J9 | Stripe production | Activate live mode; add the production webhook; rotate the test key pasted in chat | **OPEN** |

## Conventions

- Commands assume the repository root, Node 24 on `PATH` (`export PATH="/opt/homebrew/opt/node@24/bin:$PATH"` on the founder's machine), and PostgreSQL 16 client tools (`psql`, `pg_dump`, `pg_restore`).
- `<…>` is a value the operator supplies. **No document in this folder contains a secret, and none should ever be edited to contain one** (ADR-030).
- "Production" means `NODE_ENV=production`, which `next build` / `next start` and the Dockerfile set. In that mode `instrumentation.ts` refuses to start the server when required configuration is missing — see the runbook §2.
