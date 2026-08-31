# Technology Decision Package — Phase 1

> **Status: RECOMMENDATION ONLY — PENDING HUMAN APPROVAL**
> **Created:** 2026-08-30 · **Version:** 0.2 — re-assessed against **AP-12 Zero-Cost Development and Free-First Technology** (ADR-042, 2026-08-30). See the AP-12 section at the end; **Decision B's recommendation is strengthened and the hosting outlook is materially changed.**
> **Prepared using:** [`TECHNOLOGY_DECISION_FRAMEWORK.md`](TECHNOLOGY_DECISION_FRAMEWORK.md)
> **Nothing here is approved. Nothing has been installed. No decision may be acted on without your explicit approval.**

Covers the four decisions blocking the Technical Vertical Slice (Track B):

| | Decision | ADR |
|---|---|---|
| **A** | ORM and database migration strategy | ADR-007 |
| **B** | Authentication strategy | ADR-006 |
| **C** | Testing technology stack | ADR-025 |
| **D** | Local PostgreSQL development strategy | ADR-005a (partial) |

---

## 0. Verified external facts

All figures below were checked on **2026-08-30**. Per the framework's precision rule, anything not in this table is `[ANALYSIS]`, not fact. **These expire** — re-verify before acting.

| Item | Verified value | Source |
|---|---|---|
| `next-auth` npm `latest` | **4.24.15** (ISC), published 2026-07-20 | npm registry |
| `next-auth` npm `beta` | **5.0.0-beta.32** — v5 has **never** been published to `latest` | npm registry |
| next-auth repo | 28,353 stars; last push **2026-07-22** | GitHub API |
| `better-auth` npm `latest` | **1.7.2** (MIT), published 2026-08-26 | npm registry |
| better-auth repo | 29,754 stars; created 2024-05-19; last push **2026-08-30** | GitHub API |
| Better Auth capabilities | Email/password, social, organizations with roles/permissions, teams, enterprise SSO, MFA, passkeys; **self-hosted — "your auth lives in your codebase"**; PostgreSQL supported directly; **generates and owns its own tables** via its CLI | better-auth.com docs |
| Clerk — Hobby | **Free**, 50,000 Monthly Retained Users per app | clerk.com/pricing |
| Clerk — Pro | **$25/mo** ($20/mo annual); MFA included; 1 enterprise SSO connection included | clerk.com/pricing |
| Clerk — Business | **$300/mo** ($250/mo annual) | clerk.com/pricing |
| Clerk — MRU overage | $0.02/MRU/mo (50,001–100,000), decreasing at higher volumes | clerk.com/pricing |
| Clerk — extra SSO connections | **$75/mo each** beyond the one included | clerk.com/pricing |
| `prisma` npm `latest` | **8.0.0-rc.12** ⚠️ — the `latest` tag currently points at a **release candidate**; `prev` = 7.10.0 | npm registry |
| Prisma stable line | **7.10.0**, released 2026-08-25; 47,572 stars; Apache-2.0; actively shipping | GitHub API |
| `drizzle-orm` npm `latest` | **0.45.2** (Apache-2.0), published **2026-03-27** — no stable release in ~5 months | npm registry |
| Drizzle 1.0 | In **release candidate** since 2026-04-30; rc.4 on 2026-06-27; all activity on the 1.0 line | GitHub API |
| `drizzle-kit` npm `latest` | 0.31.10 (MIT), published 2026-03-17 | npm registry |
| `kysely` | 0.29.5 (MIT), published 2026-08-10 | npm registry |
| `node-pg-migrate` | 9.0.0 (MIT), published 2026-07-17 | npm registry |
| `pg` | 8.23.0 (MIT), published 2026-08-08 | npm registry |
| `vitest` | **4.1.11** (MIT), published 2026-08-18 | npm registry |
| `@playwright/test` | **1.62.1** (Apache-2.0), published 2026-07-30 | npm registry |
| `testcontainers` / `@testcontainers/postgresql` | 12.1.0 (MIT), published 2026-08-04 | npm registry |
| `@electric-sql/pglite` | 0.5.8 (Apache-2.0), published 2026-08-26 | npm registry |
| `@axe-core/playwright` | 4.13.0 (MPL-2.0), published 2026-08-11 | npm registry |
| Docker Desktop licence | **Free** for small businesses: **fewer than 250 employees AND less than $10M annual revenue**. Paid tiers: Pro $11/mo, Team $16/mo, Business $24/mo | docs.docker.com/subscription/desktop-license, docker.com/pricing |

### Two facts that changed my earlier advice

1. **`[FACT]` Auth.js v5 has never shipped a stable release.** The npm `latest` tag is still v4; v5 remains on `beta` at beta.32. Earlier documents in this repository treated "Auth.js" as a mature, equal alternative to Clerk. On the evidence, that comparison was not accurate.
2. **`[FACT]` Drizzle's stable line has had no release since 2026-03-27**, while Prisma shipped stable 7.10.0 five days ago. `[ANALYSIS]` My earlier lean toward Drizzle rested partly on the claim that its plain-SQL migrations are easier to review under Rule 1. **Prisma Migrate also produces plain `.sql` migration files**, so that distinction was weaker than I presented it. I am correcting it below rather than carrying it forward.

---

# Decision A — ORM and database migration strategy

| Area | Details |
|---|---|
| **Decision ID** | ADR-007 |
| **Problem** | Typed, reviewable data access and schema migration against PostgreSQL, supporting shared authorization/tenancy guards, insert-only tables, and audit rows written in the same transaction as the mutation they describe |
| **Requirements** | PostgreSQL · TypeScript · human-readable migrations · explicit transactions · raw SQL escape hatch · works with a service/repository layer |
| **Non-negotiables** | 1. PostgreSQL (`[APPROVED]` ADR-005) · 2. Migrations a human can read and approve (`[SPEC]` Rule 1; `[APPROVED]` ADR-029) · 3. Must not require a paid service for core function · 4. Must support explicit transactions spanning several writes (`[APPROVED]` ADR-022) |
| **Options considered** | Prisma · Drizzle · Kysely + `node-pg-migrate` · raw `pg` + SQL migration runner (no query layer) |
| **Eliminated options** | **None at Step 2.** All four satisfy every non-negotiable. My own framework warns that a document with no eliminations is suspicious — here it is genuine: the constraint set is PostgreSQL + TypeScript + readable migrations + transactions, and every mature option in this space meets it. The decision is therefore made at Step 3, not Step 2 |

### Step 3 — Comparison

| Criterion | Prisma | Drizzle | Kysely + node-pg-migrate | Raw `pg` + SQL |
|---|---|---|---|---|
| **1. Functional fit** | Full ORM; relations, transactions, raw SQL escape hatch | Full ORM; SQL-shaped API, transactions, raw SQL | Typed query builder — **not** an ORM; migrations are a separate tool | Everything by hand |
| **2. Simplicity (1–2 devs)** | High — one tool covers schema, client, migrations, studio | High, but schema is TS and migrations are generated by a second package | Medium — two tools to learn and keep aligned | Low — every query and type hand-maintained |
| **3. AI development compatibility** | **Strongest.** Longest history, largest documentation corpus | Good, but the 1.0 API changes mean AI-generated code may target the wrong version | Moderate | High (plain SQL), but no type safety to catch AI errors |
| **4. Maintainability** | ⚠️ Mid-transition: stable 7.10.0 shipping, **8.0 in RC**, and npm `latest` currently resolves to an RC | ⚠️ **More concerning**: stable frozen since March 2026; all work on a 1.0 RC line since April | Stable, small, unopinionated | Nothing to maintain but your own code |
| **5. Vendor lock-in** | Moderate — own schema language; models and client calls spread through the data layer | Moderate — schema and queries are TS, closer to SQL | Low — queries are close to SQL | **None** |
| **6. Cost** | Free, Apache-2.0 (paid cloud add-ons exist and are **not required**) | Free, Apache-2.0 / MIT | Free, MIT | Free, MIT |
| **7. Security** | Parameterised by default | Parameterised by default | Parameterised by default | Depends entirely on discipline |
| **8. Compliance readiness** | Neutral — self-hosted, no data leaves | Neutral | Neutral | Neutral |
| **9. Testing compatibility** | Good; works against a real test database | Good | Good | Good |
| **10. Operational complexity** | A generate step in the build | Minimal | Minimal | Minimal |
| **11. Ecosystem maturity** | 47.6k stars; longest track record | 35.6k stars; younger; **stable line dormant** | Smaller, stable, well-regarded | n/a |
| **12. Future flexibility** | Migrations are plain SQL, so the schema survives a change of tool | Same | Same | Maximum |

**`[ANALYSIS]` The decisive observation.** Both leading options are mid-major-version. The difference is what that means *today*: **Prisma is shipping stable releases while its next major is in RC. Drizzle's stable line has been dormant for five months while its next major is in RC.** A new project starting on Drizzle today must choose between a five-month-stale 0.x and a release candidate. Under a governance regime that requires reversibility and human-approved change, adopting an RC on the data layer is the harder position to defend.

### Step 4 — Cost
MVP/development: **zero** for all options. Ongoing fixed: **zero** — Prisma's paid cloud products are optional and not part of this recommendation. Variable/scaling: **zero**. Migration: `[ANALYSIS]` moderate between ORMs (the data-access layer is rewritten; the schema itself is not, because migrations are SQL).

### Step 5 — Exit strategy
**Data dependent on it:** none — the data lives in PostgreSQL in ordinary tables. **Portability:** total; the schema is standard SQL and readable by anything. **Migration complexity:** rewrite the repository layer; the schema, data and migration history all survive. **Dependency replacement difficulty:** **low if the repository-layer discipline required by AP-04 is honoured** — ORM calls confined to repositories mean replacement touches one layer. High if ORM calls leak into route and component code, which is a code-review matter, not a tooling one. **Identity implications:** none. **Architectural disruption:** low-to-moderate; days-to-weeks, not a rewrite.

> **`[ANALYSIS]` This is the lowest-lock-in decision of the four.** The repository-layer discipline is doing most of the protective work, and that discipline is already approved under ADR-020 and AP-04.

### Step 6 — Complexity test (AP-11)
*Can the approved architecture solve this without the technology?* **Partly** — raw `pg` with SQL files would work. **Justification for adding a query layer: AP-11 criterion 4 (security) and criterion 1 (functional requirement).** The approved architecture requires tenancy filters, insert-only enforcement and transactional audit writes to be applied through shared guards that a feature cannot forget (AP-04, ADR-022). Hand-written SQL makes those guarantees a matter of developer memory. Type-checked, centralised data access converts several of them into compile-time and structural properties. That is a security argument, not a convenience one.

### Summary

| Option | Key Strength | Key Weakness | Lock-in | Complexity | Recommendation |
|---|---|---|---|---|---|
| **Prisma** | Most mature; **stable line actively shipping**; strongest AI-assist accuracy | 8.0 in RC; ⚠️ npm `latest` currently resolves to an RC — **must pin** | Moderate | Low | ✅ **Recommended** — pinned to the 7.x stable line |
| **Drizzle** | SQL-shaped, lightweight, excellent TS ergonomics | **Stable line dormant ~5 months**; 1.0 only in RC | Moderate | Low | 🥈 Runner-up |
| **Kysely + node-pg-migrate** | Lowest lock-in; SQL-first; both stable | Two tools; less automation; no schema-driven types | Low | Medium | Viable; not recommended |
| **Raw `pg` + SQL** | Zero dependency, total control | Guard rules become developer memory — the AP-04 risk | None | High ongoing | Not recommended |

**1. Recommended:** **Prisma, pinned to the 7.x stable line** (do not install from the `latest` tag while it resolves to an RC).
**2. Runner-up:** Drizzle.
**3. Why:** `[ANALYSIS]` Both are good tools mid-transition; Prisma is the one currently shipping stable releases, has the deepest documentation corpus (which materially affects AI-assisted accuracy on a project built this way), and produces plain SQL migrations that satisfy the Rule 1 review requirement just as Drizzle's do. The reviewability argument I previously used to favour Drizzle does not survive checking. Drizzle was not selected because starting a governed, long-lived project on either a dormant 0.x or a release candidate is a harder position to defend than pinning a maintained stable line — and **the margin is narrow enough that a stated preference from you should override this.**
**4. Exit strategy:** above — low lock-in, provided ORM calls stay inside repositories.
**5. What would change it:** Drizzle 1.0 reaching GA with a demonstrated stable cadence · Prisma 8 reaching GA (re-evaluate then) · a preference from you for SQL-first authoring, which would favour Drizzle or Kysely · discovery that Prisma 7.x will not be maintained alongside 8.x.
**6. Approval required:** 🔴 Selection of the ORM. **This approval would not authorise installing it** — that remains a separate action.

> **Recommendation only — pending human approval.**

---

# Decision B — Authentication strategy

| Area | Details |
|---|---|
| **Decision ID** | ADR-006 |
| **Problem** | Authenticate users with email/password and Google, with email verification and password reset, without building authentication ourselves — while authorization remains ours and enforced at the data layer |
| **Requirements** | Email/password · Google social login · email verification · password reset · session management · a path to enterprise SSO later · identity data we can migrate |
| **Non-negotiables** | 1. **"Do not build auth"** (`[SPEC]` MVP §9) · 2. Email/password + Google at launch (`[SPEC]` M1) · 3. **Authorization stays ours**, enforced at the service/data layer (`[APPROVED]` ADR-020, AP-04) · 4. Later SSO must be configuration, not migration (`[APPROVED]` ADR-006 framing) · 5. Users must be migratable to another provider |
| **Options considered** | Clerk · Auth.js v5 · Auth.js v4 · Better Auth · build our own |
| **Eliminated options** | **Build our own** — fails non-negotiable 1 (`[SPEC]`, explicit). **Auth.js v4** — fails functional fit: it is the legacy line superseded by v5, and starting new work on a superseded major would be a knowingly short-lived choice |

### The specification problem, stated plainly

`[SPEC]` MVP Spec §9 names exactly two options: **"Auth.js or Clerk."** `[FACT]` One of those two has never shipped a stable release — v5 sits at `5.0.0-beta.32` while npm `latest` still points at v4. Reported characterisations of Auth.js as being in maintenance mode `[ANALYSIS — reported, not independently verified; one source was a competitor]` are consistent with the repository's slower push cadence, but the beta-tag fact stands on its own.

`[ANALYSIS]` **This means the specification's option set was written against an assumption that no longer holds.** I can either recommend within a two-option set where one option is weaker than the specification assumed, or recommend outside it. Both are legitimate; only you can choose, because recommending outside an approved specification is a Rule 5 and Rule 8 boundary. **I am not treating my analysis as authority to substitute a technology the specification does not name.**

### Step 3 — Comparison

| Criterion | Clerk | Auth.js v5 | Better Auth |
|---|---|---|---|
| **1. Functional fit** | Complete: email/password, social, MFA, SSO, hosted UI | Complete for V1 needs; SSO requires more work | Complete: email/password, social, MFA, passkeys, organizations, **SSO plugin** |
| **2. Simplicity** | **Highest** — flows are configuration | Moderate — we operate verification, reset, sessions | Moderate — self-hosted, but a coherent single library |
| **3. AI dev compatibility** | Good — widely documented | Good, but **beta churn** means generated code often targets the wrong API | `[ANALYSIS]` Weakest of the three — newest, so more risk of confidently wrong AI-generated code |
| **4. Maintainability** | Vendor-maintained | ⚠️ **Perpetual beta**; slower cadence | ✅ Actively developed — 1.7.2 published four days ago |
| **5. Vendor lock-in** | ⚠️ **Highest — identity lives at the vendor** | None — data in our PostgreSQL | None — data in our PostgreSQL |
| **6. Cost** | Free ≤50k MRU; Pro $25/mo; **+$75/mo per extra SSO connection** | Free (MIT/ISC) | Free (MIT) |
| **7. Security** | Vendor-hardened; a serious advantage for a small team | We own more surface | We own more surface; actively maintained |
| **8. Compliance readiness** | ⚠️ Adds a **processor and residency dependency** (ADR-032 input #6) | No third-party processor | No third-party processor |
| **9. Testing compatibility** | ⚠️ E2E against a hosted provider needs test-mode handling | Local; easy to test | Local; easy to test |
| **10. Operational complexity** | Lowest — nothing to run | Low | Low |
| **11. Ecosystem maturity** | Established commercial product | 28.4k stars, but no stable v5 | 29.8k stars, created 2024, ships frequently |
| **12. Future flexibility** | SSO is configuration — **at $75/mo per connection** | SSO is real work | SSO plugin available in-repo |

### Step 5 — Exit strategy (the decisive criterion here)

| | Clerk | Auth.js v5 | Better Auth |
|---|---|---|---|
| **Data dependent on it** | **User identities, credentials and sessions live at the vendor** | Users and sessions in **our** PostgreSQL | Users and sessions in **our** PostgreSQL (it creates and owns its tables) |
| **Format portability** | Export available; `[UNVERIFIED]` **whether password hashes are exportable in a re-usable form is the critical question and I have not verified it** | Ours; fully portable | Ours; fully portable |
| **Migration complexity** | Moderate-to-high | Low | Low-to-moderate (its table shapes are its own) |
| **Identity implications** | ⚠️ **If password hashes cannot be exported, every user must reset their password to leave.** On a credential product whose promise is portability, that is a poor look | None | None |
| **Architectural disruption** | Moderate | Low | Low |

> **`[ANALYSIS]`** This row is why authentication is not an ordinary vendor decision. Lock-in here is not measured in engineering days — it is measured in **whether your users have to be inconvenienced for you to change your mind.** Under the framework's principle, that lock-in is acceptable **if chosen knowingly**. The unverified hash-export question should be answered before choosing Clerk.

### Step 6 — Complexity test (AP-11)
Authentication cannot be met by the approved architecture without *some* solution, and `[SPEC]` forbids building it. All three add a dependency; none adds infrastructure. **Better Auth and Auth.js add no new runtime component** (they use the PostgreSQL already approved); **Clerk adds an external service on the sign-in path** — a genuine AP-11 consideration, justified by criterion 4 (security) if chosen.

### Boundary that applies whichever option is chosen

`[APPROVED]` ADR-020 and AP-04 make **authorization ours**. Better Auth's organization plugin and Clerk's organization features both offer roles and permissions. **Neither may become the authorization source of truth without a separate decision.** The approved model is `user_roles (user, role, scope_type, scope_id)` in our database, enforced at the data-access layer. Authentication is bought; authorization is not.

### Summary

| Option | Key Strength | Key Weakness | Lock-in | Complexity | Recommendation |
|---|---|---|---|---|---|
| **Better Auth** | Self-hosted, MIT, actively shipping, orgs/SSO/MFA available, identity stays in our database | **Not named in the approved specification**; newest of the three | **Low** | Medium | ✅ **Recommended — conditional on your approval of a specification deviation** |
| **Clerk** | Fastest, vendor-hardened, MFA and SSO as configuration | Identity at vendor; per-MRU cost; residency dependency; **hash portability unverified** | **High** | Low | ✅ **Recommended if you prefer to stay strictly within the specification** |
| **Auth.js v5** | Named in the spec; free; identity in our database | **Never released stable — beta.32 after years**, on the authentication path of a trust product | Low | Medium | 🥈 Not recommended |
| **Auth.js v4** | Stable | Superseded line | Low | Medium | ❌ Eliminated |
| **Build our own** | — | — | — | — | ❌ Eliminated by `[SPEC]` |

**1. Recommended:** **Better Auth — conditional on your explicit approval of a deviation from `[SPEC]` MVP §9.**
**2. Runner-up:** **Clerk**, which is also my recommendation if you would rather not deviate from the specification.
**3. Why:** `[ANALYSIS]` Better Auth satisfies every non-negotiable, keeps identity in the PostgreSQL we already approved, is MIT-licensed and actively shipping, and has the lowest exit cost — which on the authentication path is the criterion that matters most. Auth.js v5 was not selected because a dependency that has not reached a stable release in years is a poor foundation for the sign-in path of a product whose entire proposition is trustworthiness. Clerk was not selected as first choice **only** because of identity lock-in and the unverified password-hash question; on every other axis it is excellent, and for a two-person team its security posture is a real argument. **If you would rather not deviate from the specification, choose Clerk — do not choose Auth.js v5 on the strength of it being named.**
**4. Exit strategy:** above. Better Auth and Auth.js: low. Clerk: moderate-to-high, hinging on hash portability.
**5. What would change it:** Auth.js v5 reaching a stable release · verification that Clerk exports password hashes in a re-usable form (which would materially narrow the gap) · a corporate pilot needing SSO immediately (favours Clerk) · Better Auth's release cadence slowing · a residency answer that constrains where identity data may live (favours self-hosted).
**6. Approval required:** 🔴 **Two separate decisions.** (a) Whether to deviate from `[SPEC]` MVP §9's two-option set. (b) The provider. Neither authorises installation.

> **Recommendation only — pending human approval.**

---

# Decision C — Testing technology stack

| Area | Details |
|---|---|
| **Decision ID** | ADR-025 |
| **Problem** | The minimum toolset capable of supporting the approved testing philosophy — five layers, risk-based, with Tier 1 workflows validated end to end |
| **Requirements** | Unit · integration **against real PostgreSQL** · end-to-end browser · accessibility assertions · runs locally and in CI |
| **Non-negotiables** | 1. Integration tests must run against **real PostgreSQL** (`[APPROVED]` ADR-038: query-layer guarantees cannot be proven otherwise) · 2. Must support the Tier 1 workflow set including a **simulated restart** · 3. No duplicate tools for one job (AP-11) · 4. Permissive licensing |
| **Options considered** | Vitest · Jest · node:test · Playwright · Cypress · Testcontainers · docker-compose test database · PGlite · axe-core |
| **Eliminated options** | **Jest** — duplicates Vitest with no advantage in a TS/ESM project (non-negotiable 3). **Cypress** — duplicates Playwright (non-negotiable 3). **Playwright component testing** — duplicates Vitest for component work (non-negotiable 3). **PGlite** — fails non-negotiable 1: `[ANALYSIS]` an embedded WASM Postgres is not the same engine and extension surface as the production database, and these tests exist precisely to verify behaviour at the real query layer. Excellent for other purposes; wrong for this one |

### The recommended minimum toolset

| Layer | Tool | Version `[FACT 2026-08-30]` | Licence | Why this and nothing more |
|---|---|---|---|---|
| Unit + integration | **Vitest** | 4.1.11 | MIT | One runner for both; native TS/ESM; built-in assertions and mocking, so no separate assertion library |
| Integration database | **A dedicated PostgreSQL database from the same local Compose stack** (Decision D) | — | — | Same engine and version as production; no new dependency |
| End-to-end | **Playwright** | 1.62.1 | Apache-2.0 | Real browsers, resilient waiting, trace on failure; covers every Tier 1 workflow |
| Accessibility | **`@axe-core/playwright`** | 4.13.0 | MPL-2.0 | WCAG 2.2 AA is NFR-3; runs inside existing Playwright tests rather than as a separate suite |

**Four tools. `[ANALYSIS]`** Vitest and Playwright each own one job; the test database is the one already being run for development; axe rides inside Playwright.

### The deliberate omission — Testcontainers

`[FACT]` `@testcontainers/postgresql` 12.1.0 (MIT) is mature and well suited to per-test database isolation.

**`[ANALYSIS]` Not recommended initially, under AP-11.** A dedicated database in the existing Compose stack, with each test wrapped in a transaction that rolls back, provides isolation without a new dependency. Testcontainers earns its place when there is a *demonstrated* need — parallel suites contending on one database, or tests that cannot run inside a transaction. **Recorded trigger:** adopt it when test isolation becomes a measured problem, not in anticipation of one.

### Steps 4–6
**Cost:** zero — all open-source; CI compute only. **Exit strategy:** unit and integration tests are ordinary TS functions, largely portable between runners; Playwright specs are tool-specific and would need rewriting, `[ANALYSIS]` a contained cost since Tier 1 is a bounded set. No data dependency; no identity implications; disruption low. **Complexity test:** the architecture cannot self-test; ADR-038 requires these layers. Justified by AP-11 criterion 1 (a current functional requirement — Track B's final step *is* automated testing).

### Summary

| Option | Key Strength | Key Weakness | Lock-in | Complexity | Recommendation |
|---|---|---|---|---|---|
| **Vitest** | One runner for unit + integration; native TS/ESM; batteries included | Younger than Jest | Low | Low | ✅ **Recommended** |
| **Playwright** | Real browsers; excellent failure diagnostics; a11y integration | Specs are tool-specific | Medium | Low | ✅ **Recommended** |
| **`@axe-core/playwright`** | WCAG assertions inside existing tests | MPL-2.0 (fine as a dev dependency) | Low | Low | ✅ **Recommended** |
| **Jest** | Ubiquitous | Duplicates Vitest | Low | Low | ❌ Eliminated |
| **Cypress** | Strong DX | Duplicates Playwright | Medium | Medium | ❌ Eliminated |
| **Testcontainers** | Real per-test isolation | A dependency solving a problem not yet demonstrated | Low | Medium | ⏸ Deferred with a recorded trigger |
| **PGlite** | Fast, embedded | Not the production engine | Low | Low | ❌ Eliminated |

**1. Recommended:** Vitest + Playwright + `@axe-core/playwright`, against a real PostgreSQL from the local stack.
**2. Runner-up:** The same, plus Testcontainers for database isolation.
**3. Why:** `[ANALYSIS]` It is the smallest toolset that can actually support ADR-038's five layers. Testcontainers was not selected initially because transaction-rollback isolation meets the need today, and AP-11 asks complexity to be earned.
**4. Exit strategy:** low lock-in on unit and integration; Playwright specs are the only tool-shaped asset.
**5. What would change it:** measured test-isolation contention (adopt Testcontainers) · a decision to run tests against a managed database instead of a local one · component-level visual testing becoming a requirement.
**6. Approval required:** 🔴 Selection of the testing stack (ADR-025). Does **not** authorise installing anything.

> **Recommendation only — pending human approval.**

---

# Decision D — Local PostgreSQL development strategy

| Area | Details |
|---|---|
| **Decision ID** | ADR-005a (local development portion only) |
| **Problem** | How PostgreSQL is run for local development and automated testing, before any production host is chosen |
| **Requirements** | Same major version and extension surface as the eventual production database · reproducible across machines · quick onboarding · supports a separate test database · supports backup/restore rehearsal (`[APPROVED]` ADR-031) · **no real customer data** (`[APPROVED]` ADR-032 sequencing) |
| **Non-negotiables** | 1. Real PostgreSQL, matching the intended production major version · 2. Must support the extensions the architecture assumes, including `pgvector` (`[APPROVED]` ADR-005, ADR-013) · 3. Must not require the unresolved residency decision (`[APPROVED]` ADR-032) · 4. Must be reproducible, not machine-specific |
| **Options considered** | Docker Compose · native install (Postgres.app / Homebrew) · managed cloud dev instance · PGlite |
| **Eliminated options** | **Managed cloud dev instance** — fails non-negotiable 3: provisioning managed infrastructure is precisely what the residency sequencing rule defers, and it would place development data with a provider before that question is answered. **PGlite** — fails non-negotiables 1 and 2: it is not the production engine, and extension fidelity cannot be assumed |

### Step 3 — Comparison

| Criterion | Docker Compose | Native install |
|---|---|---|
| **1. Functional fit** | Exact version pinned; `pgvector` via a prepared image | Real PostgreSQL; extensions installed per machine |
| **2. Simplicity** | One file, one command | Fewer moving parts once installed |
| **3. Reproducibility** | ✅ **Identical on every machine, version pinned in the repository** | ⚠️ Drifts — whatever each developer's package manager installed |
| **4. Onboarding** | ✅ Clone, one command | Multi-step, OS-specific, error-prone |
| **5. Testing compatibility** | ✅ A second database in the same stack; disposable | Workable; manual setup |
| **6. Backup/restore rehearsal (ADR-031)** | ✅ **Excellent** — destroy and restore a volume freely; rehearsal is cheap and repeatable | Possible, but destructive rehearsal on a machine-wide install is unattractive |
| **7. Alignment with production** | ✅ Pin the same major version the managed host will run | Whatever was installed |
| **8. Operational complexity** | A container runtime | An always-running service |
| **9. Cost** | `[FACT]` Docker Desktop is **free** for businesses with **<250 employees AND <$10M revenue** — this project qualifies. Alternatives avoid the question entirely | Free |
| **10. Lock-in** | None — it is stock PostgreSQL in a container | None |

**`[ANALYSIS]` On the Docker Desktop licence.** It is free at this project's size today, and the recommendation does not depend on it: Compose runs on Docker Engine, Colima, Podman or OrbStack. The dependency is on *a* container runtime, not on Docker Desktop specifically — worth recording now so that a future licence change is a swap rather than a surprise.

### Steps 4–6
**Cost:** zero at current size; a runtime alternative exists if terms change. **Exit strategy:** none of consequence — it is stock PostgreSQL, data exports with `pg_dump`, and moving to a managed host is a connection-string change plus a restore. No lock-in, no identity implications. **Complexity test:** a database is a `[APPROVED]` requirement (ADR-005), so this is not new infrastructure but *where the approved database runs locally*. Compose satisfies AP-11 criterion 6 (measurable operational need: reproducibility and onboarding) and criterion 3 (reliability: it makes the ADR-031 restore rehearsal genuinely repeatable).

### Summary

| Option | Key Strength | Key Weakness | Lock-in | Complexity | Recommendation |
|---|---|---|---|---|---|
| **Docker Compose** | Reproducible, version-pinned, disposable; makes restore rehearsal cheap | Requires a container runtime | None | Low | ✅ **Recommended** |
| **Native install** | Simplest once working | Drifts per machine; unpleasant to destroy and rebuild | None | Low | 🥈 Runner-up |
| **Managed cloud dev instance** | Matches production exactly | Provisioning ahead of the residency decision | Medium | Medium | ❌ Eliminated |
| **PGlite** | Fast, embedded, no runtime | Not the production engine | Low | Low | ❌ Eliminated |

**1. Recommended:** **Docker Compose**, pinning the PostgreSQL major version intended for production, with `pgvector` available and a **separate database for automated tests** in the same stack.
**2. Runner-up:** Native install via Homebrew or Postgres.app.
**3. Why:** `[ANALYSIS]` Reproducibility and disposability are the deciding criteria. The approved architecture requires a **rehearsed** restore (ADR-031) and integration tests against real PostgreSQL (ADR-038) — both are routine when the database is a disposable container and awkward when it is a machine-wide service. Native install was not selected because per-machine drift is exactly the class of problem that produces "works on my machine" failures in the layer where this product's guarantees live.
**4. Exit strategy:** essentially none — stock PostgreSQL, `pg_dump`-portable, migration to a managed host is a connection string and a restore.
**5. What would change it:** a container runtime being unavailable or licence-encumbered for this team · a decision to develop against a managed database, which would first require the residency answer · a production host with meaningful behavioural differences from stock PostgreSQL.
**6. Approval required:** 🟡 Local development approach. **This does not authorise installing a runtime, creating a database, or creating any schema** — each remains a separate action. **It also does not choose the production database host (ADR-005a), which stays open.**

> **Recommendation only — pending human approval.**

---

# Consolidated approval request

| # | Decision | Recommendation | Runner-up | Gate |
|---|---|---|---|---|
| **A** | ORM and migrations | **Prisma**, pinned to the 7.x stable line | Drizzle | 🔴 |
| **B1** | Whether to deviate from `[SPEC]` MVP §9's "Auth.js or Clerk" | **A decision only you can make** | — | 🔴 |
| **B2** | Authentication provider | **Better Auth** if B1 is approved; **Clerk** if not | The other of the two | 🔴 |
| **C** | Testing stack | **Vitest + Playwright + `@axe-core/playwright`**, real PostgreSQL, Testcontainers deferred | Same plus Testcontainers | 🔴 |
| **D** | Local PostgreSQL | **Docker Compose**, version-pinned, separate test database | Native install | 🟡 |

**One item I could not verify and that should be answered before choosing Clerk:** whether Clerk exports password hashes in a form another provider can accept. If it does not, leaving Clerk means every user resets their password — which on a product whose promise is portability is worth knowing in advance rather than discovering later.

**None of these approvals would authorise installing anything.** Installation, framework initialisation, database creation and schema creation each remain separate actions requiring approval at the moment they are performed.

> **Recommendations only — pending human approval.**

---

# AP-12 re-assessment — added 2026-08-30

`[APPROVED]` **AP-12 (ADR-042)** requires zero mandatory technology cost during development and MVP validation, a three-tier preference order, verified free-tier terms, and a twelve-row cost assessment on every recommendation. The four decisions above were re-assessed against it.

## New verified facts (2026-08-30)

| Item | Verified value | Source | Why it matters |
|---|---|---|---|
| **Vercel Hobby plan** | "As stated in the fair use guidelines, the Hobby plan **restricts users to non-commercial, personal use only**" | vercel.com/docs/plans/hobby | ⚠️ **A paid credential product does not qualify.** Vercel is **Tier 3 from launch**, not free-then-paid. Pro developer seats are $20/user/month |
| **Resend free tier** | 3,000 emails/month, **100/day cap**, 3 domains. Pro from $20/mo (50k) | resend.com/pricing | Tier 2 — comfortably covers MVP volumes |
| **Postmark free tier** | **100 emails/month**, perpetual, **no credit card required**. Basic from $15/mo (10k) | postmarkapp.com/pricing | Tier 2, but ~30× smaller free allowance than Resend |
| **Clerk Hobby** | Free ≤50,000 MRU; credit-card requirement **`[UNVERIFIED]`** — the billing FAQ URL returned 404 | clerk.com/pricing | Tier 2 status cannot be fully confirmed until verified |

## Cost tier classification — all Phase 1 options

| Decision | Option | Tier | Basis |
|---|---|---|---|
| **A** | Prisma | **1** | Apache-2.0, free, local. Paid cloud add-ons optional and excluded |
| **A** | Drizzle | **1** | Apache-2.0 / MIT, free, local |
| **A** | Kysely + node-pg-migrate | **1** | MIT, free, local |
| **B** | **Better Auth** | **1** | MIT, self-hosted, runs entirely locally, no vendor account |
| **B** | Auth.js v5 | **1** | ISC, self-hosted — but perpetual beta |
| **B** | **Clerk** | **2** *(→ 3 for SSO)* | Free ≤50k MRU; enterprise SSO needs Pro $25/mo **+ $75/mo per connection** |
| **C** | Vitest · Playwright · axe-core | **1** | MIT / Apache-2.0 / MPL-2.0, all local |
| **C** | Testcontainers | **1** | MIT — deferred on AP-11 grounds, not cost |
| **D** | Docker Compose + open-source runtime | **1** | Podman, Colima and Docker Engine are open source |
| **D** | Docker Desktop | **2** | Free <250 employees **and** <$10M revenue — proprietary, licence-conditional |

## Mandatory cost assessment — recommended options

| Criterion | **Prisma** (A) | **Better Auth** (B) | **Clerk** (B alt) | **Vitest+Playwright+axe** (C) | **Compose + OSS runtime** (D) |
|---|---|---|---|---|---|
| Open source | Yes | Yes (MIT) | **No** | Yes | Yes |
| Free to develop with | Yes | Yes | Yes (≤50k MRU) | Yes | Yes |
| Self-hostable | Yes | **Yes** | **No** | Yes | Yes |
| Local development possible | Yes | **Yes** | ⚠️ Needs a vendor account and network | Yes | Yes |
| Free tier available | n/a | n/a | Yes | n/a | n/a |
| Credit card required | No | No | **`[UNVERIFIED]`** | No | No |
| Mandatory recurring cost | **No** | **No** | No at MVP; **yes for SSO** | **No** | **No** |
| Expected scale cost | None | None | $0.02/MRU above 50k; +$75/mo per SSO connection | None | None |
| Vendor lock-in | Medium | **Low** | **High** | Low–Medium | **None** |
| Data portability | High | **High** | Medium — **hash export unverified** | High | High |
| Exit complexity | Low | Low | **Medium–High** | Low | None |
| Free alternative evaluated | Yes | Yes | **Yes — Better Auth and Auth.js** | Yes | Yes |

## Effect on each decision

### Decision A — ORM · **UNCHANGED**
All candidates are Tier 1. **Prisma remains recommended**, with one AP-12 guardrail added: **Prisma's paid cloud products are excluded from this recommendation** and adopting one later would be a Tier 3 decision requiring approval.

### Decision B — Authentication · **STRENGTHENED**
AP-12 does not create a new answer; it **removes the tension I flagged**. My earlier framing was: Better Auth is technically better but outside the specification, while Clerk is safer for a small team. AP-12 addresses Clerk's principal advantage directly — *"Not paid authentication because setup is easier… Convenience alone is not sufficient justification."*

| | Better Auth | Clerk | Auth.js v5 |
|---|---|---|---|
| AP-12 tier | **1** | 2 → **3** for SSO | 1 |
| Zero cost at MVP | ✅ | ✅ | ✅ |
| Zero cost at scale | ✅ | ❌ per-MRU + per-SSO-connection | ✅ |
| Runs fully locally | ✅ | ⚠️ vendor dependency in dev **and** test | ✅ |
| Identity portability | ✅ ours | ⚠️ hash export unverified | ✅ ours |
| Stable release | ✅ 1.7.2 | ✅ | ❌ **beta.32** |

**`[ANALYSIS]` The shape of the decision is now clear.** Of the three, **only Better Auth is both Tier 1 and stable.** Auth.js v5 is Tier 1 but has never shipped stable; Clerk is stable but is the only option carrying vendor cost, vendor-held identity, and a network dependency in local development and testing.

**Recommendation: Better Auth**, unchanged in substance but no longer finely balanced. **B1 — whether to deviate from `[SPEC]` MVP §9's two-option set — remains entirely yours**; AP-12 does not grant authority to override an approved specification. What has changed is that the within-specification fallback is now weaker: **Clerk is the fallback that conflicts with AP-12, and Auth.js v5 is the fallback that conflicts with the stability requirement.** Neither specified option satisfies both.

**`[ANALYSIS]` One caution against over-reading AP-12 here.** AP-12's complexity counterweight and `[SPEC]` "do not build auth" both still hold. Self-hosting an authentication *library* is not building authentication; writing credential handling ourselves would be, and remains prohibited.

### Decision C — Testing · **UNCHANGED**
Entirely Tier 1, local, zero cost. AP-12 adds one standing exclusion: **paid testing platforms** — hosted browser grids, visual-regression SaaS, cloud device farms — are Tier 3 and require approval. Playwright runs browsers locally and in GitHub Actions at no cost.

### Decision D — Local PostgreSQL · **REFINED**
The recommendation stands, with the runtime clarified under AP-12's open-source preference:

> **Recommended: Docker Compose, run on an open-source container runtime (Podman, Colima or Docker Engine), with Docker Desktop as an acceptable Tier 2 option** while the project remains under 250 employees and $10M revenue.

`[ANALYSIS]` The dependency is on the **Compose specification**, not on Docker Desktop. Naming the open-source runtimes as the default makes the project independent of a proprietary licence whose terms are outside our control — which is precisely AP-12's portability clause.

## Downstream consequences for decisions not yet made

**These are flagged now because AP-12 changes their starting position, not resolved here.**

| Decision | AP-12 consequence |
|---|---|
| **ADR-016 — hosting** | ⚠️ **The significant one.** `[FACT]` Vercel Hobby is non-commercial only, so Vercel is **Tier 3 from launch** — my earlier framing of it as "zero-ops and free to start" does not hold for a commercial product. Free-tier and self-hostable alternatives must be evaluated first: a container on a free-tier host, or self-hosting. **This materially strengthens the container option in ADR-016** |
| **ADR-015 — email** | Both are Tier 2. **Resend's 3,000/month free tier is ~30× Postmark's 100/month**, which under AP-12 outweighs the deliverability-reputation argument I made earlier for the MVP period |
| **ADR-017 — analytics and error tracking** | Self-hostable options must be evaluated before any paid product. PostHog and Sentry both offer self-hosted and free-tier paths; a paid tier is Tier 3 |
| **ADR-005a — database host** | Local PostgreSQL is Tier 1 and needs no host at all. A managed host becomes a question only at production, alongside ADR-032 |
| **ADR-013 / ADR-009 / ADR-014** | AI consumption, video delivery and payment transaction fees are **production costs**, explicitly separated from development cost. None is required for Track B |
| **Domain registration** | A genuine unavoidable cost, but a *product* cost, not a technology-tooling one — and under ADR-039 it is no longer an architectural blocker |
| **GitHub** | Free tier covers private repositories and CI minutes at this scale. `[UNVERIFIED]` current Actions free-minute allowance for private repositories — verify before relying on CI volume |

## Revised consolidated request

| # | Decision | Recommendation after AP-12 | Change |
|---|---|---|---|
| **A** | ORM | **Prisma**, pinned to 7.x; paid Prisma cloud products excluded | Guardrail added |
| **B1** | Deviate from `[SPEC]` MVP §9? | **Yours alone.** Neither specified option satisfies both AP-12 and the stability requirement | Sharpened |
| **B2** | Auth provider | **Better Auth** — the only Tier 1 **and** stable option | Strengthened |
| **C** | Testing | **Vitest + Playwright + `@axe-core/playwright`**; paid testing platforms are Tier 3 | Exclusion added |
| **D** | Local PostgreSQL | **Compose on an open-source runtime**; Docker Desktop acceptable Tier 2 | Refined |

**One fact still to verify before Clerk could be chosen:** whether the Hobby plan requires a credit card, and whether password hashes are exportable in a re-usable form. Both bear directly on AP-12 Tier 2 qualification and on identity portability.

> **Recommendations only — pending human approval.**

---

# Addenda — 2026-08-30 (second revision)

## Decision B — superseded by the full analysis

The Decision B section above is superseded by **[`DECISION_B_AUTHENTICATION.md`](DECISION_B_AUTHENTICATION.md)**, which completes sections A–E as directed. Two findings changed the picture materially:

1. `[FACT]` **Clerk exports users including hashed passwords** (dashboard CSV or `getUserList()` API). The portability objection I raised earlier is largely answered; Clerk's exit complexity drops from *medium-high* to *medium*.
2. `[FACT]` **Better Auth has 20 published security advisories** (2 critical, ~11 high, 2025-02 → 2026-07), against 14 for next-auth over five years. Read carefully — advisory counts are not a risk ranking, Clerk's absence is a disclosure-model artifact, and most of Better Auth's cluster in plugins this project would not enable — **but its density is high for a two-year-old library on a sign-in path.**

**Recommendation remains Better Auth, now with five binding conditions**, and Clerk is a genuinely defensible alternative rather than a distant runner-up.

## Decision A — Prisma verification under AP-12

`[FACT verified 2026-08-30, prisma.io/pricing]`

| Question | Answer |
|---|---|
| Licence | **Apache-2.0** (npm registry) |
| Is Prisma ORM free? | **"Prisma ORM is free and always will be" · "Prisma ORM (always free)"** |
| Is Migrate free? | **Yes** — included with the ORM at no cost |
| Is Studio free? | Yes — available on all plans including free |
| **Does the approved ORM/migration workflow require any paid Prisma product?** | **No.** *"Using Prisma ORM and Migrate requires no paid product or account. Developers can work locally without any Prisma service subscription"* |
| Which Prisma products are paid? | **Prisma Postgres** (from $10/mo), **Prisma Compute**, **Accelerate** (per-operation). All have free tiers; none is required |
| Account required? | **No** — local development needs no Prisma account |

**Explicitly outside the approved scope:** Prisma Postgres · Prisma Compute · Prisma Accelerate · Prisma Optimize · any Prisma Data Platform product. **Adopting any of them later would be a Tier 3 decision requiring separate approval** under AP-12.

### No Paid Surprise lifecycle — Prisma ORM + Migrate

| Stage | Cost | Notes |
|---|---|---|
| Local development | **Free** | No account |
| Automated testing | **Free** | |
| Preview environment | **Free** | |
| MVP validation | **Free** | |
| Initial commercial production | **Free** | The ORM is not usage-billed |
| Growth / scale | **Free** | Cost would arise only by opting into a separate Prisma product |

⚠️ **Installation caveat carried forward:** npm's `latest` tag for `prisma` currently resolves to **8.0.0-rc.12**. The approved direction is the **7.x stable line** — pin explicitly.

## Decision D — local container runtime for macOS

**`[APPROVED]`** The Compose-compatible local PostgreSQL direction is approved. This selects the runtime only, on the five criteria specified.

| | **Colima** | **Podman** | **Docker Desktop** |
|---|---|---|---|
| **Free commercial use** | ✅ **MIT — unrestricted** | ✅ **Apache-2.0 — unrestricted** | ⚠️ Free only under **250 employees AND $10M revenue**; proprietary, terms outside our control |
| **macOS compatibility** | ✅ Purpose-built for macOS (Lima VM) | ✅ Supported via `podman machine` | ✅ Native |
| **Compose compatibility** | ✅ **Runs the real Docker engine — `docker compose` works unmodified** | ⚠️ Works, but via `podman compose`/shim; some features need extra setup | ✅ Native |
| **PostgreSQL reliability** | ✅ Standard container | ✅ Standard container | ✅ Standard container |
| **Developer simplicity** | ✅ `brew install colima && colima start` | ⚠️ Extra concepts: machine, rootless model, pods | ✅ Simplest GUI, but an account and licence check |
| Activity `[FACT]` | 30,564 stars; pushed 2026-08-24; v0.10.3 | 32,727 stars; pushed 2026-08-30; v5.8.6 | Commercial |

**Recommended: Colima.** `[ANALYSIS]` On the five stated criteria it is the simplest reliable free option: MIT-licensed with no commercial restriction, macOS-native by design, and — decisively — it runs the actual Docker engine, so the Compose file and every `docker` command work unchanged. Podman is an excellent runtime with a stronger rootless security model, but its Compose path requires extra setup, which is complexity this decision does not need. Docker Desktop is free at our size and remains acceptable, but it is the only option whose licence terms could change against us.

**`[ANALYSIS]` The dependency is on the Compose specification, not on any runtime.** Colima, Podman and Docker Desktop are interchangeable behind the same `compose.yaml`. Choosing Colima is therefore a low-consequence, easily reversed decision — which is why it should not be over-engineered.

### No Paid Surprise lifecycle — Colima

| Stage | Cost |
|---|---|
| Local development · testing · preview · MVP validation · commercial production · scale | **Free at every stage.** MIT-licensed local tooling; no vendor relationship, no usage billing, no trigger for payment |

## Decision C — testing scope confirmation

**`[APPROVED]` ADR-025** for **Vitest**, **Playwright** and **`@axe-core/playwright`**. All three are Tier 1: free, open source, run locally and in CI at no cost.

**Explicitly excluded, each requiring separate approval as Tier 3:**

| Excluded | Reason |
|---|---|
| Paid testing platforms | AP-12 Tier 3 |
| Hosted browser testing grids (BrowserStack, Sauce Labs, Playwright cloud grids) | AP-12 Tier 3 — Playwright runs browsers locally and in CI free |
| Visual-regression SaaS (Percy, Chromatic, Applitools) | AP-12 Tier 3 |
| **Testcontainers** | **Excluded until a documented trigger is reached** — not on cost (it is MIT and free) but on **AP-11**: transaction-rollback isolation against the Compose test database meets the need today. **Trigger: measured test-isolation contention**, such as parallel suites conflicting on one database, or tests that cannot run inside a transaction |
