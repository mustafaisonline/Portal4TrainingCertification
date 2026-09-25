# Project Status — START HERE when returning

> **As at 2026-09-26.** Maintained as the single resume point. If this file and any completion report disagree, the completion report is more detailed; if this file and `git log` disagree, `git log` wins — update this file.
> **Branch:** `feat/production-foundation` · **never pushed** (the founder pushes or opens the PR to `main` on request) · working tree clean (see `git log`).
> **Read next, in order:** `CLAUDE.md` (constitution) → this file → the plan and completion report of whatever you are about to touch → the specifications only as needed.

## 1. What the product is (one paragraph)
An independent expert-led **training and certification organisation** (DR-02). The portal supports that ecosystem: public programme pages, scheduled offerings, Stripe registration, participant accounts and profiles, learner Reviews, a **Certificate of Completion** with public verification and yearly renewal, and administrator operations. The **earned credential** (DR-01: one credential, evidence-based) is a separate, later product surface — nothing here is it, and every certificate page says so.

## 2. Where the build stands
All ten roadmap milestones of [`WIREFRAME_TO_PRODUCTION_PLAN.md`](WIREFRAME_TO_PRODUCTION_PLAN.md) §7 have been executed as far as the founder's approvals allow.

| Milestone | State | Commits | Report |
|---|---|---|---|
| M1 Walking skeleton · M1b | done | early history | M1 report |
| M2 Identity & access (Better Auth; no email verification; password ≥ 8; MFA removed for MVP 1) | done | | [`MILESTONE_2_COMPLETION_REPORT.md`](MILESTONE_2_COMPLETION_REPORT.md) |
| M3 Catalogue & public portal | done | | [`MILESTONE_3_COMPLETION_REPORT.md`](MILESTONE_3_COMPLETION_REPORT.md) |
| M4 Registration & payment (Stripe cards; refund tiers 100/50/0 net of Stripe fee; one free transfer; price by profile country; legal DRAFTS) | done, real test-mode payment and refund verified | | [`MILESTONE_4_COMPLETION_REPORT.md`](MILESTONE_4_COMPLETION_REPORT.md) |
| M5a User profile (email immutable login; ID encrypted; photo; checkout gate) | done | `3dd0e60` `4266481` | [`MILESTONE_5A_COMPLETION_REPORT.md`](MILESTONE_5A_COMPLETION_REPORT.md) |
| M5b Reviews (mandatory per certificate; moderation; consent-default-private) | done | `8cc5856` `bd94a97` `8a05493` | [`MILESTONE_5B_COMPLETION_REPORT.md`](MILESTONE_5B_COMPLETION_REPORT.md) |
| M6 Certificate of Completion & verification (E1–E14 approved) | done | `5c05236` `dd44e32` `2100f32` | [`MILESTONE_6_COMPLETION_REPORT.md`](MILESTONE_6_COMPLETION_REPORT.md) |
| M7 Renewal reminders | done (no schema change) | `9bacb37` | [`MILESTONE_7_COMPLETION_REPORT.md`](MILESTONE_7_COMPLETION_REPORT.md) |
| M8 Admin operations | done on the existing schema · **§5 awaits approval** | `a2b820d` | [`MILESTONE_8_COMPLETION_REPORT.md`](MILESTONE_8_COMPLETION_REPORT.md) |
| M9 Production readiness | code + runbooks done · **nothing provisioned** | `83edf36` | [`MILESTONE_9_COMPLETION_REPORT.md`](MILESTONE_9_COMPLETION_REPORT.md) · [`../operations/`](../operations/README.md) |
| M10 Launch cutover | readiness audit done · **cutover is the founder's** | `83edf36` | [`MILESTONE_10_COMPLETION_REPORT.md`](MILESTONE_10_COMPLETION_REPORT.md) · [`LAUNCH_READINESS_CHECKLIST.md`](LAUNCH_READINESS_CHECKLIST.md) |

**2026-09-26 — Trainings catalogue (founder request, data + UI, no schema change):** the header item is now **Trainings** at `/programs` (was "Programme" at `/DataBlueprint-AIVibeCoding`; old paths redirect permanently). Two published trainings, each at `/programs/<slug>`: **Learn Vibe Coding** (`learn-vibe-coding`, half-day masterclass — curriculum in [`CURRICULUM_LEARN_VIBE_CODING.md`](CURRICULUM_LEARN_VIBE_CODING.md), prices as given by the founder: USD 1,000 · RM 100 · Rs 5,000, no discount) and **Data Blueprint & AI/Vibe Coding** (`data-blueprint-ai-vibe-coding`, renamed from `ai-powered-product-development`, same row id, its bespoke landing kept). Verified 2026-09-26: tsc clean · Vitest 377/377 · Playwright 66/66 · build clean.

**Last verified state (2026-09-23, superseded above):** `tsc` clean · `next build` clean · Vitest **375 / 375** · Playwright **62 / 62** (WCAG 2.2 AA via axe on every screen).

## 3. Waiting on the founder — answer by number when you return
| # | Decision | Where the recommendation is |
|---|---|---|
| 1 | **M8 §5 A1–A7**: organisations & private cohorts, refund on behalf of a participant, invoices, attendance, account deletion policy, two-person revocation, trainer role | [`MILESTONE_8_EXECUTION_PLAN.md`](MILESTONE_8_EXECUTION_PLAN.md) §5 (A1, A3, A4 are Rule 1 schema items) |
| 2 | **M9 §4 J1–J9**: data residency, hosting, production PostgreSQL, domain + email domain, email provider, release gate, RPO/RTO + retention, Content-Security-Policy, Stripe live | [`MILESTONE_9_EXECUTION_PLAN.md`](MILESTONE_9_EXECUTION_PLAN.md) §4 · [`../operations/DEPLOYMENT_RUNBOOK.md`](../operations/DEPLOYMENT_RUNBOOK.md) |
| 3 | **Legal**: lawyer review of Terms / Privacy / Refund drafts (`src/content/legal/*`); Terms §11 lacks certificate validity, fee and "not the earned credential" wording; placeholders such as the SSM number render on the legal pages; then set `LEGAL_DOCUMENT_VERSIONS` to publish | [`LAUNCH_READINESS_CHECKLIST.md`](LAUNCH_READINESS_CHECKLIST.md) §1 · [`MILESTONE_4_COMPLETION_REPORT.md`](MILESTONE_4_COMPLETION_REPORT.md) |
| 4 | **Public copy findings** (no copy was changed): "brought to Malaysia" promise, "25 → 5" claim, three stale "no online payment / policy not published" sentences, "certificate of participation" wording, offers with no end date, dead links to `/certifications` and `/courses` | [`LAUNCH_READINESS_CHECKLIST.md`](LAUNCH_READINESS_CHECKLIST.md) §2, esp. §2.8–2.9 |
| 5 | **Ratifications** still open from earlier milestones: ADR-006 (Better Auth) B1–B3, ADR-015 (email provider), M2/M3 scope acceptance, `WIREFRAME_TO_PRODUCTION_PLAN.md` itself (followed since M3, still "proposed") | [`README.md`](README.md) status column · [`../architecture/ARCHITECTURE_DECISION_REGISTER.md`](../architecture/ARCHITECTURE_DECISION_REGISTER.md) |
| 6 | **Rotate the Stripe test key** that was pasted in chat on 2026-09-21 (Stripe Dashboard → API keys → roll), then update `.env.local` | [`../operations/MONITORING_AND_INCIDENTS.md`](../operations/MONITORING_AND_INCIDENTS.md) key rotation |
| 8 | **Learn Vibe Coding prices**: USD 1,000 vs RM 100 vs Rs 5,000 — the USD figure is ~45× the others at market rates; confirm or correct one figure (seed `prisma/seed-data/courses.ts`, then `npm run db:seed`) | this file; checklist C10a |
| 9 | **Learn Vibe Coding curriculum decisions C1–C5** (certificate for a half-day, hands-on option, credit toward the 2-day fee, demo repository) and the 2-day **Data Blueprint & AI/Vibe Coding** curriculum still to be drafted so its day 2 reuses the same module titles | [`CURRICULUM_LEARN_VIBE_CODING.md`](CURRICULUM_LEARN_VIBE_CODING.md) §7 |
| 7 | Small UX calls noted in reports: certificate listing toggle needs a Save click; "Certificate: Revoked" shows no date; Notifications lists every outbox message incl. sign-in emails; CSV has no Excel byte-order mark; two-decimal money for USD | M6, M7, M8 reports "Observations" |

## 4. Working agreements that have held since M1 (keep them)
- **Plan first.** Every milestone: execution plan `.md` with decisions numbered → founder answers by number ("1 = Yes …") → build → completion report → README index row. Rule 1: a schema change is listed column by column in the plan before any migration.
- **Never push, never `git add .`**, stage files by name, bounded commits per milestone, commit messages end with the Claude co-author line.
- **`project-artifacts/mockup` stays untouched** (founder, 2026-09-21) — design reference only; a Vitest boundary test forbids importing it.
- **No sample data in production paths**; the first certificate appears when the first completion is recorded.
- **Business rules are the founder's** — recommend, number, wait. Defaults taken overnight are listed in each plan's "Defaults taken" table for review.
- Reference material at `/Users/mustafaqizilbash/Documents/GitHub/ReferenceMaterial` is read-only and confidential (`docs/REFERENCE_MATERIAL_ACCESS.md`).

## 5. Running it locally (macOS, this machine)
```bash
export PATH="/opt/homebrew/opt/node@24/bin:$PATH"   # Node 24 — required for every command
```
- **Databases:** Homebrew PostgreSQL 16, `p4tc_dev` (the portal) and `p4tc_test` (Vitest/Playwright only). Both must have session timezone UTC (`ALTER DATABASE … SET timezone TO 'UTC'`). `.env.local` holds `DATABASE_URL`, `DATABASE_URL_TEST`, `BETTER_AUTH_SECRET`, `PROFILE_ENCRYPTION_KEY`, `JOBS_SECRET`, Stripe test keys, `LEGAL_DOCUMENT_VERSIONS` (dummy for local). Names in `.env.example`.
- **Migrations:** `npm run db:migrate` (dev) · `DATABASE_URL="$DATABASE_URL_TEST" npx prisma migrate deploy` (test) · `npm run db:seed` on both. Migrations are forward-only and never automatic.
- **Dev server:** `npm run dev` → http://localhost:3100 (Claude's browser pane uses the `portal` entry in `.claude/launch.json`). **Only one `next dev` per directory** — Next 16 holds a lock.
- **Administrator:** `npm run admin:grant -- <email>` after registering through the UI.
- **Stripe locally:** `stripe listen --forward-to localhost:3100/api/stripe/webhook --events checkout.session.completed,checkout.session.expired,charge.refunded,charge.updated,refund.updated` (the `--events` list is required; see `webhook.service.ts` for the exact set).
- **Reminders locally:** `curl -X POST -H "Authorization: Bearer $JOBS_SECRET" localhost:3100/api/jobs/certificate-reminders`.
- **Tests:** `npx tsc --noEmit --incremental false` · `npx vitest run` · `npm run test:e2e` (starts its own server on 3101; stop the preview first). If another `next dev` holds the lock: `npx next build && PLAYWRIGHT_SERVER=start npm run test:e2e`.
- **Housekeeping:** `rm -rf .next/types` if `tsc` reports stale route types; keep ≥ 10 GB free on disk (Turbopack caches and Playwright traces have filled it before).

## 6. Map of the code (where to look)
`app/(public)` public pages · `app/(auth)` sign-in/register · `app/account` participant area · `app/admin` administrator area (gate in `layout.tsx`) · `app/api` webhooks, photo, export, health, jobs · `src/modules/{identity,catalogue,commerce,reviews,certificates,reports,notifications,platform}` business logic (repositories take `Db`/`Tx`, audit in the same transaction) · `src/shared/chrome` navigation sources (`site-nav`, `account-nav`, `admin-nav`) · `src/content/legal` legal DRAFTS · `src/config` env validation and health · `prisma/` schema, migrations, seed · `tests/{unit,integration,e2e,helpers}` · `scripts/` admin grant, backup, restore rehearsal · `docs/{architecture,execution,operations,design}`.

## 7. How to resume with Claude
Say what you want and, for anything in §3, give the numbers. A good opening: *"Read docs/execution/PROJECT_STATUS.md. Here are my answers to §3 items 1 and 2: …"* Claude will write or update the plan, wait for approval on any schema item, build, test, report, and update this file.
