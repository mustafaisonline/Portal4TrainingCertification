# Milestone 11 — "DigitalOcean deployment framework & Stripe go-live" · Execution Plan

> **Status: K1–K16 APPROVED 2026-09-26 as recommended (founder: "K1 = yes, all recommendations accepted, start Phase A"; recorded as ADR-046). Phase A BUILT 2026-09-26 — see the completion note at the end (§8). Phases B and C are NOT started: nothing is provisioned, no account, server, database, registry, domain or live Stripe endpoint exists.**
> **Founder request (chat, 2026-09-26):** *"implement Stripe as Payment Gateway for this portal … refer to [the eCard repo] … implement it as production ready. Once we test everything in dev, then … implement our portal on DigitalOcean server"* and *"build deployment framework in our this workspace … [like] eCard"*.
> **Reference material read:** `mustafaisonline/eCard` (cloned read-only into this session's scratchpad, not into this repository): `Deployement-Steps/` (scripts 00–11, `start.sh`, `lib/`, `config.env`, `nginx/`), `reports/DEPLOYMENT-FRAMEWORK-BASELINE-2026.06.md`, `reports/DEPLOYMENT-FRAMEWORK-019-report.md`, `docs/pricing/IMPLEMENTATION.md` (its Stripe report), `backend/services/billingService.js`, `backend/config/env.js`.

---

## 0. ⚠ Security incident — act before anything else

A **live-mode Stripe restricted key** (`rk_live_…`, account `acct_1UJsJSRBlhlUfSh7`) was pasted into the chat transcript on 2026-09-26. It is not stored anywhere in this repository, this plan, or any file — and it must not be. But a chat transcript is a log, and a live key can move real money.

1. **Roll it now:** Stripe Dashboard → Developers → API keys → that restricted key → *Roll key* (or delete it and create a fresh one when §5 K1 is decided).
2. This is the **second** pasted-key incident (a *test* secret key on 2026-09-21 — `PROJECT_STATUS.md` §3 item 6 — is still un-rotated). Rotate both.
3. Going forward, keys reach a machine only through the paths in §4.5: `.env.local` on the laptop (test mode only) and the Droplet's root-owned env file (live mode only). Never chat, never a document, never a commit.

---

## 1. What exists (the premise correction)

**Stripe is already implemented in this portal** — Milestone 4, 2026-09-21, verified with a real test-mode payment and refund ([`MILESTONE_4_COMPLETION_REPORT.md`](MILESTONE_4_COMPLETION_REPORT.md)). Nothing about the *integration* needs building. What the request actually needs is (a) one small compatibility change for the key type the founder is now using, (b) production configuration, and (c) a place to run it.

### 1.1 The portal's Stripe integration vs. eCard's — honest comparison

| Concern | This portal (`src/modules/commerce/`) | eCard (`backend/services/billingService.js`) | Verdict |
|---|---|---|---|
| Product shape | One-off registration payment per scheduled offering; refund tiers 100/50/0 net of Stripe's fee; one free transfer | SaaS packages, per-feature entitlements, subscriptions (`invoice.paid`, `customer.subscription.deleted`), donations | Different products — eCard's subscription handling is not needed here |
| Boundary | `PaymentGateway` interface; the SDK is behind it; tests use a fake and Stripe's official signature helper | SDK called directly in the service | Portal is stronger |
| Idempotency | Idempotency keys on Checkout Session and Refund creation (one order → one session even if retried) | None seen | Portal is stronger |
| Webhooks | Raw-body signature verification; **every event stored first** in `stripe_events` (PK = Stripe event id, replay = no-op); order row locked and re-checked; 9 event types handled, others stored as `ignored` | Raw-body verification; `billing_webhook_event` table; 4 event types | Equivalent discipline; portal handles more |
| Fees | Records the provider fee from the balance transaction (with exchange-rate conversion) so refunds are net of it — founder decision 2026-09-22 | Not handled | Portal only |
| Configuration | Fail-fast at start-up (`src/config/env.ts`): both Stripe values together or neither; **key must match `sk_(live|test)_`**; test key in production = loud warning | `.env.local` override; live-mode detection by `startsWith("sk_live_")` | **Both assume a standard secret key — see §1.2** |
| Local testing | Stripe CLI `stripe listen` forwarding to `localhost:3100/api/stripe/webhook` | Same approach ("test with `sk_test_` first") | Same |

**Conclusion:** there is nothing to port *from* eCard for payments. eCard's own Stripe report reaches the same operational conclusions this portal already documents: test keys first, live keys only on the server, webhook registered after the domain exists.

### 1.2 The one real incompatibility — restricted keys

The founder supplied a **restricted key** (`rk_live_…`). Two facts:

- `src/config/env.ts` line 143 rejects anything that isn't `sk_live_`/`sk_test_` → **in production the server would refuse to start** with the founder's key.
- Stripe's current documentation ([docs.stripe.com/keys](https://docs.stripe.com/keys), read 2026-09-26) says: *"Because you can't limit their permissions, we don't recommend using secret keys for new use cases, and for existing integrations, we recommend migrating secret key usage to RAKs [restricted API keys]."*

So the founder's key type is the **better** practice and our validator is what's behind. The fix is a code change to payment configuration — a RED item, so it is **decision K1**, not something done here. If approved, the restricted key needs exactly these permissions for what `StripeGateway` calls (nothing more):

| Stripe permission | Why (`src/modules/commerce/stripe.ts`) |
|---|---|
| **Checkout Sessions — Write** | `checkout.sessions.create` |
| **Refunds — Write** | `refunds.create` |
| **PaymentIntents — Read** | `paymentIntents.retrieve(…, { expand: ["latest_charge.balance_transaction"] })` |
| **Charges — Read** · **Balance transactions — Read** | the `expand` above (the fee for net-of-fee refunds) |
| *(none)* | Webhook signature verification is local (`Stripe.webhooks.constructEvent`) — needs the endpoint's `whsec_`, not a key permission |

### 1.3 Deployment — what the portal already has vs. eCard's framework

| | This portal (M9, 2026-09-23) | eCard `Deployement-Steps/` (framework 2.0-governed-2026.06) |
|---|---|---|
| Runtime model | `Dockerfile` (multi-stage, non-root, `HEALTHCHECK /api/health`, `next start`) — **written, never built**; runbook Option B = container on a VPS behind Caddy | Node + **PM2** + **nginx**, source rsync'd to the server, `npm install` on the server, PostgreSQL on the same box |
| Health, headers, fail-fast config, robots/sitemap, error pages | ✅ built and tested | (n/a — Express app) |
| Migrations | Prisma, forward-only, `npm run db:deploy` as a deliberate operator step (ADR-029) | Numbered SQL, `GOVERNED_MIGRATION_MAX` ceiling, **server-side sandbox validation** (restore latest backup → apply → scan for destructive DDL) |
| Backups | `scripts/backup.sh` (pg_dump custom + SHA-256) and `scripts/restore-rehearsal.sh` — rehearsed on the dev DB | Script 01: DB + code + `.env` + nginx/PM2 + git ref → one verified `.tar.gz`; retention `BACKUP_KEEP` |
| Release gate | `RELEASE_GATE.md` **proposed** (tsc → Vitest → Playwright → build) — CI (`.github/workflows/ci.yml`) already runs exactly this on every push, deploys nothing | Step 04 local smoke + platform-baseline certification (blocking), Playwright (advisory) |
| Governance | Runbooks + ADR-030 (secrets only in the host's store) | Clean-git gate, prohibited bypass flags, **HMAC-signed deployment token**, root-owned `ecard-deploy` sudo wrapper (deploy user cannot write live trees), deployment lock, manifest + reports per step, timeouts on every task, *"production data never leaves the server"* |
| Rollback | "redeploy the previous build" (runbook §5) | Script 07: safety snapshot, then restore DB + code + config from a chosen backup package |
| Post-deploy | first-deploy checklist (runbook §8) | Script 06: traceability markers (`.deployed-commit/-branch/-at/-baseline`), health, DB, migration status, PASS/FAIL with rollback recommendation |
| Audit / dry-run | — | `start.sh --audit` (GO/NO-GO), `--dry-run` |

**What is worth porting from eCard:** the *controls* (clean-tree gate, backup-before-deploy, lock, signed token + root wrapper, sandbox migration validation, post-deploy validation, traceability markers, per-step reports, bounded timeouts, GO/NO-GO audit, dry-run). **What should not be ported:** its runtime model (PM2 + source rsync + on-server `npm install` + on-box PostgreSQL). This portal is a Next.js build with Prisma; its M9 design — an immutable container image and a managed database — is the better fit and is already half-built. §3 reconciles the two.

---

## 2. Scope (what this milestone builds, once §5 is answered)

Three phases, deliberately separable so the founder can stop after any of them.

### Phase A — no accounts, no provisioning (buildable the day K1–K12 are answered)
1. **Restricted-key support** (K1): `src/config/env.ts` accepts `rk_live_`/`rk_test_` alongside `sk_`; live/test-mode detection reads the `_live_`/`_test_` segment; `.env.example`, `DEPLOYMENT_RUNBOOK.md` §2 and MONITORING §4.6 updated; the required permission set documented; Vitest cases for accepted/rejected prefixes and the test-key-in-production warning.
2. **`deploy/` — the framework** (new folder at the repository root, the analogue of eCard's `Deployement-Steps/`):

   | File | Run on | Purpose (ported control in *italics*) |
   |---|---|---|
   | `deploy/config.env` | — | Server host/user, paths, image name and registry, staging/production URLs, timeouts, `BACKUP_KEEP` (*config.env*) |
   | `deploy/lib/common.sh` | both | Logging, `die`/`soft_fail`, `run_blocking`/`run_advisory` with timeouts, deployment lock, SSH helpers, per-step Markdown reports (*common.sh*) |
   | `deploy/lib/governance.sh` | both | Clean-git gate, pushed-commit gate, deployment manifest, HMAC-signed token with TTL (*governance.sh*) |
   | `deploy/start.sh` | laptop | Single entry point: `--audit`, `--dry-run`, `--auto-approve` (*start.sh*) |
   | `deploy/00-discovery.sh` | laptop | Local toolchain + remote reachability (*00*) |
   | `deploy/01-backup-serverscript.sh` | server | `pg_dump` of the managed DB + Caddy config + env-file *names* (not values) + deployed-tag markers → verified package; retention (*01*) |
   | `deploy/03-migration-sandbox-serverscript.sh` | server | Restore the latest dump into `p4tc_migration` on the same cluster, `prisma migrate deploy` there, scan the pending migrations for destructive DDL, report (*03*) |
   | `deploy/04-release-gate.sh` | laptop | `RELEASE_GATE.md` as code: tsc, Vitest, build (blocking); Playwright (blocking by default, K11); `npm audit --omit=dev` (advisory) (*04*) |
   | `deploy/05-deploy.sh` | laptop → server | Verify the tag's image exists in the registry and CI is green for that commit → SSH → `p4tc-deploy promote <tag>` (wrapper: backup gate, migrate, pull, restart, health) (*05*) |
   | `deploy/06-validate.sh` | laptop | Traceability markers, `/api/health` (200, `db: up`, newest migration), `/`, `/verify`, security headers, webhook endpoint answers 400 to an unsigned POST, PASS/FAIL (*06*) |
   | `deploy/07-rollback.sh` + `-serverscript.sh` | both | Promote the previous image tag; optional DB restore from a chosen package after a safety snapshot; needs a token (*07*) |
   | `deploy/09-audit.sh` | laptop | Read-only GO/NO-GO (*09*) |
   | `deploy/10-server-bootstrap-serverscript.sh` | server (root, once) | Docker Engine, Caddy, `deploy` user, `/etc/p4tc/` (HMAC key, env file `600`), root-owned `/usr/local/bin/p4tc-deploy` + least-privilege sudoers, `ufw` (22/80/443), unattended security upgrades, systemd timer for the reminders job (*10 + 11*) |
   | `deploy/compose.production.yaml` · `deploy/Caddyfile.example` · `deploy/systemd/` | server | App container (+ staging container, K7) behind Caddy with automatic TLS; reminders timer |
   | `deploy/README.md` | — | The runbook for this framework (the eCard `ReadMe.rtf` equivalent), and `DEPLOYMENT_RUNBOOK.md` gains **"Option C — DigitalOcean Droplet (chosen)"** |
3. **Image build in CI** (K6): `.github/workflows/release.yml` — on a `release/*` tag, run the same verify job as `ci.yml`, then build the `Dockerfile` and push `<registry>/p4tc-portal:<tag>` (+ `:<commit>`). The founder's Mac needs no container runtime; an image exists **only** for a commit that passed the gate — the release gate becomes structural, not procedural.
4. **Dry-run everything locally**: every script supports `--dry-run` (as eCard's do) and the whole pipeline is exercised in dry-run against a throwaway config before any server exists.

### Phase B — provisioning (each step is a RED action taken only on the founder's explicit go, after Phase A and K5/K13–K15)
5. DigitalOcean: project, **Droplet** (K4) in **SGP1** (K5), **Managed PostgreSQL** (K3) in the same VPC with `timezone = 'UTC'`, firewall; bootstrap via script 10; DNS for the domain (K13); Caddy issues TLS.
6. Databases: `p4tc_production`, `p4tc_staging` (K7), `p4tc_migration` (sandbox); `npm run db:deploy` + `db:seed` from the laptop (ADR-029; **no test users**); `admin:grant` for the founder.
7. **Staging first**, with **test-mode** Stripe keys and a test-mode webhook endpoint at `https://staging.<domain>/api/stripe/webhook`; one full registration + refund on staging through Stripe's hosted page (`4242 …`).
8. **Production Stripe (J9/K15):** live restricted key with the §1.2 permissions → Droplet env file only; live webhook endpoint at `https://<domain>/api/stripe/webhook` for the nine events in runbook §6 → its `whsec_` to the env file; "Send test webhook" → `stripe_events` row + `200`.

### Phase C — cutover
9. Milestone 10's checklist: legal versions, robots `noindex` lifted, first real payment (K16), uptime checks, backup restore rehearsal against production.

**Out of scope:** any change to checkout, pricing, refund or webhook *logic*; FPX/GrabPay enablement (M4 §9 item 2 — a Dashboard setting); the eCard-style on-box PostgreSQL; an email provider (J5 — separate decision; `EMAIL_TRANSPORT=log` keeps working); Kubernetes or multi-server anything (ADR-016 rejected it as oversized).

---

## 3. Design decisions this plan reconciles (why not just copy eCard)

| eCard does | This plan does | Because |
|---|---|---|
| rsync source to the server, `npm install` there, PM2 restarts Node | CI builds an **immutable image** per tag; the server only pulls and restarts | A Next.js production build wants > 2 GiB RAM and dev dependencies; building on a $12–18 Droplet is slow and non-reproducible. An image tag is also a perfect rollback unit |
| PostgreSQL on the Droplet; backups by script only | **Managed PostgreSQL** with daily backups + point-in-time recovery, in the same VPC; `scripts/backup.sh` as the off-host second layer | BACKUP_AND_RESTORE §3.1 already names PITR as "the real control"; one Droplet holding both app and data is a single point of failure for the records that money and certificates depend on |
| nginx + certbot | **Caddy** (automatic TLS, ~10-line config) — nginx accepted as an alternative (K8) | Fewer moving parts to keep correct; nothing the portal needs is nginx-specific |
| No staging; `--dry-run` instead | A **staging** container + database on the same Droplet (K7) | ADR-029 requires staging: payments, emails and issuance must be exercised without touching real credentials or sending real email |
| Migration ceiling by number (`GOVERNED_MIGRATION_MAX`) | Prisma's own ledger (`prisma migrate status`) + the ported sandbox validation | Prisma already refuses to run out-of-order or edited migrations |
| Root wrapper `ecard-deploy` promotes rsync'd trees | Root wrapper `p4tc-deploy promote <tag>` runs backup gate → `prisma migrate deploy` → `docker compose pull/up` → health check; the `deploy` user has no other sudo | Same control, smaller surface: the wrapper's inputs are a tag and a token |
| Production data never leaves the server | Same rule, kept: sandbox validation runs on the server against a fresh dump; dumps stay on the Droplet or the managed backup service; no production dump is ever downloaded to a laptop | Personal data (names, emails, encrypted ID numbers) is in every dump |

---

## 4. Defaults taken (change any of these by number)

| # | Default | Why |
|---|---|---|
| D1 | `deploy/` is a new top-level folder, scripts in Bash (as eCard), no new npm dependency | Same tooling the founder already operates; `shellcheck` is an optional local check, not a required tool (AP-12) |
| D2 | Deploys are **operator-initiated from the laptop** via `deploy/start.sh`; CI verifies and builds but never deploys | eCard's model; keeps a human on every production change |
| D3 | The Droplet env file is `/etc/p4tc/portal.env`, `root:deploy 0640`, read by `docker compose --env-file`; values are typed in over SSH by the founder, never transmitted through the framework | ADR-030; MONITORING §4.6 rotation is "edit the file, restart" |
| D4 | Staging shares the Droplet and the managed cluster (separate database), under `staging.<domain>`, with test-mode Stripe | Cheapest faithful staging; can move to its own Droplet later |
| D5 | Image registry: **DigitalOcean Container Registry** (starter tier) unless the founder prefers GHCR | Same account, same region, private by default |

---

## 5. ⛔ Founder decisions — answer by number ("K1 = yes …")

| # | Decision | Recommendation |
|---|---|---|
| **K1** | Accept **restricted keys** (`rk_`) in `src/config/env.ts` (code change to payment configuration) — or keep `sk_` only and create a standard secret key instead? | **Accept `rk_`** — Stripe recommends it; create the live key with exactly the §1.2 permissions |
| **K2** | Hosting model on DigitalOcean: **(a)** Droplet + Docker image (the existing `Dockerfile`) behind Caddy · (b) Droplet + PM2 + nginx (eCard parity) · (c) DO App Platform (PaaS, no server) | **(a)** — §3 |
| **K3** | Database: **Managed PostgreSQL** (Basic 1 GiB / 1 vCPU, **$15.15/mo**, backups + PITR, VPC) · or PostgreSQL on the Droplet ($0, eCard style) | **Managed** |
| **K4** | Droplet size: Basic **2 GiB / 2 vCPU $18/mo** (recommended headroom) · 2 GiB / 1 vCPU $12 · 4 GiB / 2 vCPU $24 (if staging shares it and traffic grows) | **$18** |
| **K5** | Region **SGP1 (Singapore)** — and J1: is Malaysian data residency required by law, contract or preference? ADR-032's sequencing rule blocks *provisioning production data infrastructure* (Phase B step 5) until this is answered; Phase A is unaffected | SGP1 if nothing binds |
| **K6** | Image built and pushed by **CI on a `release/*` tag** (no container runtime on the Mac) · or install Colima locally and build from the laptop | **CI** |
| **K7** | Staging on the same Droplet (D4) · separate Droplet · no staging (dry-run only, like eCard — conflicts with ADR-029) | **Same Droplet** |
| **K8** | Reverse proxy: **Caddy** · nginx | **Caddy** |
| **K9** | Governance depth: port the full HMAC token + root wrapper + lock + manifest set · or the lighter "SSH + compose" without a token | **Full port** — it is proven, and the cost is one bootstrap script |
| **K10** | Backups: managed PITR primary + `scripts/backup.sh` **weekly** off-host copy to the founder's machine · or nightly to **DO Spaces** ($5/mo, a new service) | **PITR + weekly off-host** |
| **K11** | Release gate (J6): adopt `RELEASE_GATE.md` as written, with Playwright **blocking** in `deploy/04` · or advisory locally when CI is green for the commit | **Adopt; blocking** |
| **K12** | Reminders scheduler: systemd timer on the Droplet (`POST /api/jobs/certificate-reminders`, 01:00 UTC) | **Yes** |
| **K13** | Domain (J4): the apex the portal will live on — needed before the webhook endpoint, `APP_BASE_URL`, TLS and staging can exist | Founder's choice |
| **K14** | Email provider (J5): stays `EMAIL_TRANSPORT=log` at go-live (no real emails) · or decide Resend/Postmark now | Can defer; note that receipts and verification emails are then *recorded but not delivered* |
| **K15** | Stripe live webhook events: the nine in `DEPLOYMENT_RUNBOOK.md` §6 as-is | **As-is** |
| **K16** | Go-live payment check: one **real** registration by the founder, refunded at once (100 % tier, net of Stripe's fee — a few ringgit are not returned) · or trust the staging test-mode run | Real, once — it is the only proof live mode works end to end |

**Monthly cost of the recommended set:** Droplet $18 + Managed PostgreSQL $15.15 + registry starter tier (free–$5) ≈ **$33–38/mo** plus the domain. Prices from digitalocean.com/pricing on 2026-09-26 (per-second billing from 2026-01-01). No other new external service.

---

## 6. Verification criteria (pass/fail)

| # | Criterion |
|---|---|
| V1 | `src/config/env.ts` accepts `rk_live_`/`rk_test_`, still rejects anything else, still warns on a test key in production — Vitest cases for each; full suite green |
| V2 | Every `deploy/*.sh` runs end to end in `--dry-run` against a throwaway `config.env` with no server, producing its Markdown report; `start.sh --audit` returns NO-GO with the reasons listed |
| V3 | `release.yml` on a `release/*` tag: verify job green → image pushed → `docker run --env-file … p4tc-portal:<tag>` answers `/api/health` 200 in a CI step (the image is built and **run** in CI, so the "written, never built" Dockerfile is finally proven) |
| V4 | Staging (Phase B): one registration paid on Stripe's hosted page in test mode → `checkout.session.completed` processed once → order paid, registration confirmed; one cancellation → refund at Stripe; `06-validate.sh` PASS |
| V5 | Rollback rehearsal on staging: promote tag N, then `07-rollback.sh` to N-1 → health 200, traceability markers show N-1 |
| V6 | Migration sandbox on staging: a real pending migration validates in `p4tc_migration` before it is applied to staging |
| V7 | Production first deploy: `DEPLOYMENT_RUNBOOK.md` §8 checklist every box ticked; `06-validate.sh` PASS; Stripe "Send test webhook" → 200 and a `stripe_events` row |
| V8 | K16 real payment and refund both visible in Stripe (live mode) and in admin → Orders |
| V9 | No live key appears in the repository, CI logs, reports or chat: `git log -p`, `grep -r "rk_live\|sk_live"` on the repo and on `deploy/` reports are all empty |

---

## 7. How to proceed

Answer §5 by number. Phase A starts on K1–K12; Phase B needs K5 (with J1), K13 and the DigitalOcean account; Phase C is Milestone 10's cutover. Each phase ends with a completion report in the standard format, and `PROJECT_STATUS.md` is updated at each verified state.

## 8. Phase A — completion note (2026-09-26)

| Item | Delivered | Verified |
|---|---|---|
| §2.1 restricted keys | `src/config/env.ts`: `STRIPE_API_KEY_RE = /^(sk\|rk)_(live\|test)_/`, `stripeKeyMode()`; `.env.example`, runbook §2 and §6, MONITORING §4.6 carry the permission set | **V1** ✅ `tests/unit/env-config.test.ts` +18 cases (accept `rk_live_`/`rk_test_`, warn on test in production, reject `pk_`, unknown mode, case, whitespace; values never echoed) — 22/22; full Vitest 399/399; tsc clean |
| §2.2 `deploy/` framework | 13 scripts + `config.env`, `compose.production.yaml`, `Caddyfile.example`, `systemd/`, `README.md` — see [`deploy/README.md`](../../deploy/README.md) §2 | **V2** ✅ every laptop script and both server scripts ran end to end in `--dry-run` against a throwaway `config.local.env` and a fake server layout; `start.sh --audit` returned NO-GO listing exactly the four missing preconditions (gh, HMAC key, dirty tree, no server); the whole pipeline (`start.sh --dry-run --no-gate`) produced the summary and manifest; refusals proven for a direct `05` call, `FORCE_DEPLOY=1`, `--no-gate` without `--dry-run`, `--skip-gate`. Token round trip proven: a token signed by `lib/governance.sh` verifies with `lib/server-promote.sh`'s verbatim `jf`/`hmac_of` code; a tampered tag and a wrong key are rejected (promote and rollback tokens, with and without a backup name) |
| §2.3 release workflow | `.github/workflows/release.yml` (`v*` tags; `workflow_dispatch` proves without pushing); `ci.yml` gains `workflow_call`; `Dockerfile` gains the `migrate` target and OCI revision labels | **V3** ⏳ **not yet run** — it needs a tag push (or a manual dispatch from GitHub). This is the first thing to do after this commit: it is the first time the Dockerfile is built anywhere. Until it is green, the alpine base and Prisma 7's schema engine on musl are an assumption |
| §2.4 gate rehearsed | `deploy/04-release-gate.sh` ran for real: tsc → Vitest → build → Playwright against the production build → `npm audit` | ✅ **PASSED 2026-09-26**: tsc clean · Vitest 399/399 · `next build` · Playwright 67/67 (`next start -p 3101`) · `npm audit` advisory: 4 high in transitive production deps (`deepmerge-ts` via `prisma`, `mysql2` via `better-auth`/`prisma`) — reported in PROJECT_STATUS §3 item 11, not changed. First attempt failed on the Next 16 one-`next dev`-per-directory lock; the gate now runs Playwright against the build it just made (`PLAYWRIGHT_SERVER=start`), which is also the more honest gate |
| K11 | `RELEASE_GATE.md` status ADOPTED | — |
| Records | ADR-046; ops README J-table; runbook Option C; execution README; PROJECT_STATUS | — |

**Not done, by design:** nothing under Phase B (§2 items 5–8) or C. **Deviations from the plan text:** tags are `v*` (a `/` is not a valid image tag), the reminders job also gets a nightly backup timer, and the migration step runs on the server from the tag's `migrate` image rather than "from the laptop" — so the production `DATABASE_URL` never has to be on a laptop (the stricter reading of "production data never on laptops").
