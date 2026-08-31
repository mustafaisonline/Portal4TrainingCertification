# Milestone 1 — "Walking Skeleton" · Execution Plan

> # ⛔ NOT AUTHORIZED FOR EXECUTION
>
> **Status:** PLANNING & ARCHITECTURE MODE · **Scope accepted; execution NOT authorized**
> **Created:** 2026-08-30 · Preserved per the execution-status directive of 2026-08-30 §6 · **Relocated to `docs/execution/` on 2026-08-30**
>
> **No action in this document may be performed.** It exists so the plan is not held only in conversation.
> Execution begins only on an explicit instruction such as *"Proceed with Milestone 1"* or *"You may start implementation."*
> **Approval of a direction is not approval to execute it.**

---

## 1. Objective

> Prove that the approved development foundation works end-to-end using a minimal, real, persistent vertical slice.

One thin path through every approved layer: container → database → migration → seed → repository → route → rendered page → test. No feature, no authentication, no design system. The foundation is *proven*, not merely assembled.

## 2. Scope

**In scope**

| # | Item |
|---|---|
| 1 | Next.js (App Router) + TypeScript at repository root — one deployable (ADR-001) |
| 2 | `compose.yaml` — PostgreSQL pinned to a specific major, plus a separate test database |
| 3 | Prisma 7.x pinned; **one migration creating one table: `domains`** |
| 4 | Seed file inserting one domain row — seed files, never migrations (ADR-023) |
| 5 | One repository function taking a `domainId` parameter |
| 6 | One route rendering that domain's name from the database |
| 7 | Vitest — one integration test against real PostgreSQL |
| 8 | Playwright — one end-to-end test, with `@axe-core/playwright` |
| 9 | `.gitignore` additions for Node; npm scripts |

**Explicitly out of scope:** authentication · users · roles · tenancy · design tokens or component library · content model · skills · assessment · credentials · deployment · CI/CD · hosting · any UI beyond plain markup.

## 3. Approved decisions this milestone relies on

| Need | Decision | ADR |
|---|---|---|
| Architecture shape | Modular monolith, one deployable | ADR-001 |
| Framework and language | Next.js App Router + TypeScript | ADR-002 |
| API approach | Server actions + typed route handlers | ADR-004 |
| Datastore | PostgreSQL | ADR-005 |
| Local database | Compose container; Colima runtime | ADR-005a (local portion) |
| ORM and migrations | Prisma 7.x — paid Prisma products excluded | ADR-007 |
| Expansion shape | No domain literals; parameterised queries | ADR-023 |
| Testing tools | Vitest · Playwright · `@axe-core/playwright` | ADR-025 |
| Migration policy | Forward-only, reviewed; seed separate | ADR-029 |
| Testing philosophy | Five layers, risk-based | ADR-038 |

**No DEFERRED decision is required.** No hosting, object storage, email, payments, AI, analytics, or production database.

## 4. Decisions that block execution

**Milestone 1: none.**

**Milestone 2** (authentication → authorization → dashboard) is blocked by **ADR-006** — B1 specification deviation · B2 provider · B3 conditions. See [`DECISION_B_AUTHENTICATION.md`](../architecture/DECISION_B_AUTHENTICATION.md). It can be decided in parallel; it does not gate Milestone 1.

## 5. Actions requiring explicit execution authorization

Each is a RED-gate action. **None may be performed until authorized.**

| # | Action | Gate |
|---|---|---|
| **5.1** | Initialise a Next.js App Router + TypeScript project at the repository root | Framework initialisation |
| **5.2** | Install this exact pinned set, nothing more: `next` · `react` · `react-dom` · `typescript` · `@types/*` · `prisma` + `@prisma/client` **pinned to 7.x** · `vitest` · `@playwright/test` · `@axe-core/playwright` | Package installation |
| **5.3** | Start a local PostgreSQL container — non-production, synthetic data only, permitted under the ADR-032 sequencing rule. The current stable PostgreSQL major to be confirmed and pinned at the time of writing `compose.yaml` | Infrastructure |
| **5.4** | **Create the first schema — one table, `domains`** | **`CLAUDE.md` Rule 1** |
| **5.5** | Two bounded commits, staged file-by-file: (a) `docs/architecture/`; (b) the Milestone 1 foundation | Repository operation |

### 5.4 — proposed `domains` table

Matches the conceptual model already documented (MVP Spec §8 row 0; `DATA_ARCHITECTURE.md` §3.4). Nothing invented.

| Column | Type | Note |
|---|---|---|
| `id` | uuid, primary key | Our own immutable identifier |
| `code` | text, unique | e.g. `DF` |
| `name` | text | |
| `slug` | text, unique | |
| `description` | text, nullable | |
| `created_at` / `updated_at` | timestamptz | |

**Why `domains` rather than a throwaway table:** it is the smallest *real* entity in the approved model, it is required by ADR-023 (*the pilot domain is data, never a constant*), and it lets the milestone **prove** the no-literal rule rather than assert it.

## 6. Proceeds without further approval cycles, once execution is authorized

Repository structure and module folders · `compose.yaml` · Prisma client setup · the repository function · the route and page · all three tests · npm scripts · `.gitignore` additions for Node · running tests · restart verification.

## 7. Deliverables

`compose.yaml` · Next.js app skeleton · Prisma schema, one migration, one seed file · one repository function · one route · three passing tests · npm scripts · updated `.gitignore` · a completion report in the standard format.

## 8. Verification criteria

Each is pass/fail. No interpretation.

| # | Criterion |
|---|---|
| 1 | `docker compose up` starts PostgreSQL; the application connects |
| 2 | The migration applies cleanly; `domains` has exactly the approved columns and nothing more |
| 3 | The seed inserts exactly one row, from a seed file, not a migration |
| 4 | **Vitest integration test passes against real PostgreSQL** — not a mock |
| 5 | **Playwright end-to-end test passes**: the page renders the domain name sourced from the database |
| 6 | **axe reports no WCAG 2.2 AA violations** on that page |
| 7 | **Restart proof A:** `compose down` → `up` → application restart → row still present, page still renders |
| 8 | **Restart proof B:** `compose down -v` (volume destroyed) → `up` → migration and seed reproduce the state exactly |
| 9 | **Grep proof:** no domain literal outside seed files and content — ADR-023 / BR-5, checkable in one command |
| 10 | No package installed beyond the 5.2 list |

**Criteria 7 and 8 are the milestone's real purpose.** They make AP-02, AP-03 and AP-05 executable rather than asserted, at the smallest possible scale.

## 9. Correction — withdrawn recommendation

An earlier proposal in conversation suggested adding `Reference Material/` to `.gitignore`. **That recommendation is withdrawn.** The execution-status directive §9 states the AI must not modify, move, rename, delete, stage, commit, or add `Reference Material/` to `.gitignore`, and that observations about its contents do not authorise acting on them.

Observations are therefore recorded and not acted upon: the directory is untracked, approximately 1.1 GB, and contains a `.venv` directory and Office lock files. **No action proposed.**

## 10. When execution is authorized

1. Review this scope.
2. Verify no approved decision has changed.
3. Identify the exact actions to perform.
4. Confirm the RED-gate items in §5.
5. Request clarification **only** if a genuine conflict exists.
6. Execute within this scope.
7. **Stop immediately** if scope expansion becomes necessary.

**Do not restart architecture discovery merely because execution begins.**
