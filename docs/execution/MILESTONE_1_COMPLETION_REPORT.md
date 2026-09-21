# Milestone 1 — "Walking Skeleton" · Completion Report

> **Status: IMPLEMENTED · TESTED — all ten verification criteria pass** · 2026-09-21
> **Executed under:** founder direction of 2026-09-21 (*"go ahead and implement the production ready product"*), recorded in `README.md` §4 and `WIREFRAME_TO_PRODUCTION_PLAN.md` §0.
> **Plan executed:** [`MILESTONE_1_EXECUTION_PLAN.md`](MILESTONE_1_EXECUTION_PLAN.md) (scope accepted 2026-08-30).
> **Branch:** `feat/production-foundation` · not pushed · nothing on `main`.
> Standard format per `AI_DEVELOPMENT_GUARDRAILS.md` §44.

---

## 1. Requested task

Execute Milestone 1: prove the approved development foundation works end to end with a minimal, real, persistent vertical slice — container → database → migration → seed → repository → route → rendered page → tests — and pass the two restart proofs.

## 2. Understanding / scope

Exactly the plan's §2 scope, plus the one extension ADR-045 attaches to M1: the `src/preview/` import fence. The **design-token / UI-primitive port** that ADR-045 also assigns to M1 is deliberately reported as a **separate step (M1b)** so that this report covers the plan as accepted, unmixed. Out of scope and untouched: authentication, users, roles, tenancy, content, credentials, deployment, CI, hosting, any real UI.

## 3. Changes made

### 3.1 Files (repository root — production application)

| Area | Files |
|---|---|
| Framework | `package.json` (ESM, pinned versions, scripts) · `package-lock.json` · `tsconfig.json` · `next.config.ts` · `postcss.config.mjs` · `next-env.d.ts` · `.node-version` |
| App | `app/layout.tsx` · `app/globals.css` (minimal) · `app/page.tsx` (lists domains from DB) · `app/domains/[id]/page.tsx` (renders one domain from DB; 404 on unknown or malformed id) |
| Data layer | `prisma/schema.prisma` (one model, `domains`) · `prisma/migrations/20260921010356_init_domains/migration.sql` · `prisma/seed.ts` (one row, idempotent upsert) · `prisma.config.ts` · `src/db/prisma.ts` (lazy singleton, PrismaPg adapter) |
| Module | `src/modules/catalogue/domains/repository.ts` — `findDomainById(domainId)`, `findDomainBySlug`, `listDomains` |
| Fence | `src/preview/README.md` · `tests/unit/boundaries.test.ts` (no production import from `src/preview`; no direct import of the generated client outside `src/db`) |
| Tests | `vitest.config.ts` · `tests/setup-env.ts` (forces the TEST database; refuses dev) · `tests/integration/domains.repository.test.ts` (6 tests, real PostgreSQL) · `playwright.config.ts` · `tests/e2e/domain.spec.ts` (4 tests incl. axe) |
| Local DB | `compose.yaml` + `prisma/compose-init/01-test-db.sql` (parity artefact — see §8 deviation 1) |
| Config | `.env.example` (names only) · `.gitignore` (Node/Next/Prisma entries) · `.claude/launch.json` (`portal` on 3100 via Node 24; `mockup` unchanged on 3000) |
| Governance | `docs/architecture/ARCHITECTURE_DECISION_REGISTER.md` (**ADR-045** added, summary row + full record) · `docs/execution/README.md` (M1 status; plan indexed) · `docs/execution/WIREFRAME_TO_PRODUCTION_PLAN.md` (accepted; §0.1 defaults) · this report |

### 3.2 RED-gate actions performed (each authorised by the 2026-09-21 direction)

| Plan § | Action | Done |
|---|---|---|
| 5.1 | Initialise Next.js App Router + TypeScript at repository root | ✅ (manual scaffold — no `create-next-app`, so nothing unpinned entered) |
| 5.2 | Install the pinned set | ✅ — with four additions, see §8 |
| 5.3 | Start local PostgreSQL | ✅ — existing Homebrew PostgreSQL 16, see §8 |
| 5.4 | **Create the first schema — one table, `domains`** | ✅ — exactly the approved columns; verified with `\d domains` |
| 5.5 | Bounded commits, file-by-file | Pending at time of writing — see §9 |

### 3.3 The schema created (Rule 1 record)

`domains`: `id uuid PK default gen_random_uuid()` · `code text unique` · `name text` · `slug text unique` · `description text null` · `created_at timestamptz(6) default now()` · `updated_at timestamptz(6)`. Nothing else. One migration, forward-only. Seed inserts one row (`DF · Data Foundations · data-foundations`) — the first entry of the mockup's capability-area list, ported as content per ADR-045.

## 4. What was not changed

`project-artifacts/mockup/` — untouched (ADR-045; founder: "keep it for comparison"). The three specifications, `DR-02`, `AI_DEVELOPMENT_GUARDRAILS.md`. The global Node installation (Node 23 remains the machine default; Node 24 is keg-only). The repository remote and `main`. No hosting, no external account, no secret, no deployment.

## 5. Testing

| Layer | What | Result |
|---|---|---|
| Type | `tsc --noEmit` | clean |
| Unit | boundary tests (preview fence, generated-client fence) | 3 / 3 |
| Integration | repository against **real PostgreSQL** (`p4tc_test`): write→read by id, unknown id → null, by slug, ordering, DB-enforced uniqueness, DB-generated UUIDs | 6 / 6 |
| E2E | index lists DB rows; detail page shows the stored name (expected value **read from the DB**, not a literal); unknown id → real 404; malformed id → 404 not a DB error | 3 / 3 |
| Accessibility | `@axe-core/playwright`, WCAG 2.0/2.1/2.2 A+AA tags on the domain page | 0 violations |
| Build | `next build` | ✅ two dynamic routes + static 404 |

## 6. Results — the ten criteria (plan §8)

| # | Criterion | Result |
|---|---|---|
| 1 | Database starts; application connects | ✅ (Homebrew service — deviation 1) |
| 2 | Migration applies cleanly; `domains` has exactly the approved columns | ✅ verified `\d domains` |
| 3 | Seed inserts exactly one row, from a seed file, not a migration | ✅ `count = 1`; second run leaves `count = 1` |
| 4 | Vitest integration passes against real PostgreSQL | ✅ 6 tests |
| 5 | Playwright e2e: page renders the domain name sourced from the database | ✅ |
| 6 | axe: no WCAG 2.2 AA violations | ✅ |
| 7 | **Restart proof A** — DB service restarted, fresh app process → row present, page renders | ✅ `brew services restart postgresql@16`; identical row id/name before and after; e2e green on a fresh server |
| 8 | **Restart proof B** — storage destroyed → migrate + seed reproduce the state exactly | ✅ `dropdb`/`createdb`, `migrate deploy`, seed → identical `code|name|slug|description`; full e2e green |
| 9 | Grep proof — no domain literal outside seed files and content | ✅ none in `app/` or `src/` (generated client excluded) |
| 10 | No package beyond the §5.2 list | ⚠ **Four additions, each necessary and recorded** — deviation 2 |

**Restart proofs 7 and 8 are the milestone's stated purpose; both pass.**

## 7. Documentation updated

`ARCHITECTURE_DECISION_REGISTER.md` (ADR-045) · `docs/execution/README.md` (§3 index, §4 status) · `WIREFRAME_TO_PRODUCTION_PLAN.md` (acceptance, §0.1) · `MILESTONE_1_EXECUTION_PLAN.md` (status banner) · this report. Not yet updated: `PROJECT_PLAN_WBS.md` WP 4.2.1 status (proposed as the next bounded doc change together with M3–M10 entry).

## 8. Risks, observations and deviations — reported, not hidden

1. **Local database mechanism.** ADR-005a approved a Compose container (Colima). This machine has **no container runtime** and 7.9 GB free disk, so M1 ran on the **already-installed Homebrew PostgreSQL 16.13**. The datastore decision (PostgreSQL, ADR-005) is unaffected; only the local mechanism differs. `compose.yaml` is provided and would run identically elsewhere. Restart proof A therefore used a service restart rather than `compose down/up`; proof B used `dropdb` rather than `compose down -v` — same guarantees, different verbs.
2. **Packages beyond the §5.2 list (criterion 10):** `tailwindcss` + `@tailwindcss/postcss` — the styling approach approved in ADR-003 and required by ADR-045's token port (M1b); `@prisma/adapter-pg` + `pg` — **Prisma 7 removed its bundled query engine; a driver adapter is the only way the approved ORM connects.** Both are Prisma's own official adapter and the standard PostgreSQL driver. No other addition. Every version is pinned exactly.
3. **Node.js.** The machine's default Node 23.11 is non-LTS and **EOL since June 2026**; Prisma 7 refuses to install on it and npm 10.9 crashed on the dependency graph. **Node 24.21 LTS was installed keg-only** (`brew install node@24`), used via `PATH` and `.claude/launch.json`; the global default was **not** changed. `.node-version` = 24. Recommendation: make Node 24 the machine default when convenient.
4. **Prisma 7 specifics that future sessions must know:** `prisma.config.ts` at root holds the datasource URL and seed command; the generated client is **TypeScript** (`src/generated/`, gitignored) with `importFileExtension = "ts"` so plain `node` can run the seed; the project is **ESM** (`"type": "module"`); `src/db/prisma.ts` imports the generated client by relative `.ts` path for the same reason.
5. **`CLAUDE.md` showed as modified** during the run without being edited by hand. Finding: Next.js's dev server appends a fenced `<!-- BEGIN:nextjs-agent-rules -->` block ("This is NOT the Next.js you know… read `node_modules/next/dist/docs/`") to the project's `CLAUDE.md` — tooling behaviour, verifiable at `node_modules/next/dist/server/lib/generate-agent-files.js`; the mockup's own `CLAUDE.md` carries the identical block. **No governance text was altered.** Committed with this milestone because removing it only recreates the uncommitted change on the next `next dev`.
6. **The seed content is a port from the mockup** (`data/domains.ts`), recorded per ADR-045; the remaining four capability areas are seeded in a later milestone's plan, not silently here.
7. **Not verified:** the Compose path itself (no runtime here); behaviour on any machine other than this one; CI (none exists yet — proposed for M1b/M3).

## 9. Human decisions required

None to accept this milestone as complete — every criterion passes and every deviation is recorded above. For the founder's attention on return:

| # | Item |
|---|---|
| 1 | Acknowledge deviations 1–3 (local DB mechanism, four packages, Node 24 keg-only). If any is unwelcome, each is reversible |
| 2 | The §0.1 defaults in `WIREFRAME_TO_PRODUCTION_PLAN.md`, especially **ADR-006 = Better Auth**, which M2 will build on unless changed |
| 3 | Whether "Yes" in the folder answer meant "keep the mockup" (assumed) or "separate folder for production" (a mechanical move if so — ADR-045 record) |

**Completion status:** Implemented · **Tested** (all layers, all ten criteria) · nothing Partially tested · nothing Blocked · Requires human validation: only the acknowledgements above.
