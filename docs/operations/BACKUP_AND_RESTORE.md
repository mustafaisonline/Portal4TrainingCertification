# Backup and Restore

> **Status: DRAFT 2026-09-23 (Milestone 9 §2 item 6; ADR-031 "an unrehearsed backup is an assumption, not a control").** The scripts exist and were rehearsed against the **development** database on 2026-09-23 (PASS, 33 tables, row counts equal). No production backup exists because no production database exists.

## 1. What must be protected

Exactly one persistent service holds state in V1: **PostgreSQL** (Deployment Arch §6). It contains every business record — users, profiles (with the encrypted ID-number column), consents, orders, payments, refunds, registrations, certificates and their renewals, the fee history, reviews, the Stripe event log, the email outbox and the insert-only audit log. There is no object storage yet (photos are stored in the database).

Two things a database restore **cannot** undo: an email that was sent, and a certificate whose verification URL was shared. That is why staging exists (ADR-029) and why a restore is the last resort, not a routine.

## 2. Targets (OQ-10 — J7, OPEN)

| Target | Placeholder until the founder decides | Rationale |
|---|---|---|
| **RPO** (data you may lose) | **24 h** with the daily dump; **≈ 0** once the managed host's point-in-time recovery (PITR) is enabled | A daily dump is the interim control; PITR is the real one |
| **RTO** (time to be back) | **4 h** | Restore of a small database is minutes; the hours are for decision, DNS and verification |
| Retention of dumps | 30 daily, 12 monthly — **assumption** aligned with Data Arch §7.1, which is itself undecided | Backups must not outlive the data-retention schedule once one exists |

## 3. Layers

### 3.1 Managed host (primary control once J3 is done)
- **Neon:** history retention / PITR is a project setting (paid tiers extend the window). Enable it on day one; record the window here.
- **Supabase:** daily backups on Pro; PITR as an add-on.
- Whatever the host, **the region of the backup is part of the residency answer** (ADR-032 input 7) — do not enable cross-region copies before J1 is decided.

### 3.2 Logical dumps — `scripts/backup.sh` (interim and belt-and-braces)
```bash
DATABASE_URL='<direct connection string>' scripts/backup.sh            # → backups/<db>-<UTC>.dump + .sha256
DATABASE_URL='<direct connection string>' scripts/backup.sh /secure/dir
```
- `pg_dump --format=custom --no-owner --no-privileges`; the file name carries the database and a UTC timestamp; a SHA-256 sits beside it (`shasum -a 256 -c <file>.sha256`).
- Refuses to run without `DATABASE_URL`; never prints the URL.
- `backups/` is gitignored. **A dump contains personal data** (names, emails, encrypted ID numbers, addresses): store it encrypted at rest, with the same access control as the database, and delete it on the retention schedule.

**Schedule (proposal):** daily at 02:00 UTC from a machine that is not the application host — the founder's machine via `launchd`/cron, or a CI schedule with the connection string as a secret — until PITR is on; weekly thereafter as an off-host copy.

Example crontab line:
```
0 2 * * * cd /path/to/repo && DATABASE_URL="$(cat ~/.p4tc/prod-db-url)" scripts/backup.sh ~/p4tc-backups >> ~/p4tc-backups/backup.log 2>&1
```

### 3.3 Restore rehearsal — `scripts/restore-rehearsal.sh`
```bash
DATABASE_URL='<connection string of the SOURCE>' scripts/restore-rehearsal.sh backups/<file>.dump [--keep]
```
What it does: verifies the checksum → creates `p4tc_restore_<UTC>` **on the same server** → `pg_restore --no-owner --exit-on-error` → `npx prisma migrate status` against the copy (must be "up to date") → compares row counts of every business table (read from the source's `information_schema`; that is the set of `@@map` names in `prisma/schema.prisma`) → prints **PASS / FAIL** → drops the scratch database unless `--keep`.

Rehearsal record — keep this table current:

| Date | Source | Dump | Result | Notes |
|---|---|---|---|---|
| 2026-09-23 | `p4tc_dev` (Homebrew PG 16, founder's machine) | `p4tc_dev-20260922T164040Z.dump` (192 KB) | **PASS** — 8 migrations applied, 33/33 tables equal | Scratch DB dropped; dump deleted after the run |
| *before pilot* | production | — | — | **Required by WBS 7.6 before the first cohort** |

On a managed host without `CREATE DATABASE` rights, point `DATABASE_URL` at a local PostgreSQL 16 for the rehearsal — the dump is portable.

## 4. Actual restore (incident)

Decide first (MONITORING_AND_INCIDENTS §4.2): a restore rewinds **every** table, including payments already reconciled with Stripe and emails already sent. Prefer PITR to a fixed time over a dump when available.

1. Put the site in a safe state: on Vercel, roll to a maintenance deployment or remove `DATABASE_URL` so `/api/health` reports degraded and every page fails closed; on a container, stop it.
2. Restore:
   - PITR: host console → restore to `<timestamp>` into a **new** branch/database. Never in place.
   - Dump: `createdb`-equivalent on the host → `pg_restore --no-owner --no-privileges --exit-on-error --dbname='<new db url>' <file>.dump`.
3. `DATABASE_URL='<new db>' npx prisma migrate status` → up to date. `psql '<new db>' -c "SHOW timezone"` → `UTC`.
4. Point `DATABASE_URL` at the new database; start; `/api/health` → 200.
5. **Reconcile** the window between the restore point and the incident: Stripe Dashboard → Events → replay each `checkout.session.completed` / `charge.*` / `refund.*` event newer than the restore point to `/api/stripe/webhook` (Stripe → the endpoint → event → "Resend"); the handler is idempotent. Check `outbound_emails` for rows that will now be re-queued and decide whether they must be suppressed. Check `certificates` issued in the window against any verification URL already shared (support case).
6. Write the incident record (MONITORING_AND_INCIDENTS §6).

## 5. Ownership

| Task | Owner |
|---|---|
| Enable PITR / host backups; record the window and region | Founder (J3) |
| Run the daily dump; keep the rehearsal table current | Founder (operator) until a second operator exists |
| Production rehearsal before the pilot cohort | Founder — WBS 7.6 exit criterion |
| Retention schedule | Founder decision (Data Arch §7.1) |
