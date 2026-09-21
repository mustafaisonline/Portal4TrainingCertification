# Wireframe → Production — Transition Strategy and Plan

> # ✅ ACCEPTED 2026-09-21 — execution authorised by founder direction
>
> **Status:** `D·A·–` (drafted; **accepted**; not yet committed)
> **Created:** 2026-09-21, on the founder's instruction *"let's plan to implement backend … share your complete strategy and plan to move from Wireframe to actual implementation and store it in our project management .md files."*
>
> **Accepted the same day.** Founder direction, 2026-09-21: *"1. [Will there be another folder like mockup?] — Yes keep it for comparison at later stage. Rest please go ahead and implement the production ready product."* Read as: (a) §3/§9 confirmed — the mockup stays in `project-artifacts/mockup/`, untouched, for comparison; (b) the plan's shape (§6–§7) accepted; (c) **execution authorised** — Milestone 1 and the milestones that follow, within the RED gates each milestone records, with the founder away until the evening and clarifications posted at the start (§0.1 below). The founder did not individually name ADR-006, hosting or the A/B/D business decisions; those remain open and are handled per §0.1's defaults, **not** treated as approved.

### 0.1 Defaults adopted on 2026-09-21 while the founder was unavailable

Posted at the start of execution as required; each stands until the founder changes it.

| # | Question | Default taken | Reversible? |
|---|---|---|---|
| 1 | Authentication provider (ADR-006, still PENDING) | **Better Auth** — self-hosted, users/sessions in our PostgreSQL, email + password only, admin MFA; the documented recommendation. Alternative: Clerk if the ~monthly patching commitment (condition 4) is unrealistic | Yes — the identity-mapping pattern (own UUID, provider subject confined to `auth_identities`) keeps the switch low-stakes |
| 2 | Local database | **The already-installed Homebrew PostgreSQL 16** (no container runtime on the machine; 7.9 GB free disk). `compose.yaml` provided for parity on any other machine. A recorded deviation from ADR-005a's *mechanism*, not its datastore | Yes |
| 3 | Node.js | The machine's Node 23.11 is non-LTS and **EOL (June 2026)**; Prisma 7 refuses to install on it. **Node 24 LTS installed alongside, not replacing the global default**; `.node-version` added | Yes |
| 4 | Commits | **Bounded commits on `feat/production-foundation`; no push; nothing on `main`** | Yes |
| 5 | Anything needing an account or key the founder holds (hosting, Stripe, email, domain) | **Built behind an interface with a local/test transport; marked "requires human validation"**. No account created on the founder's behalf | — |
| 6 | Legal text and business rules (B1–B5, A8, D5, hero claims) | **Not invented.** Configuration with the on-file recommendation as default, flagged in the completion report | — |
> **Authority:** Level 3 (execution navigation). It follows the approved baseline; it does not lead it.
>
> **This document creates no milestone, selects no technology, changes no ADR status and authorises no action.** Every milestone below is a *proposal* that becomes real only when its own execution plan is accepted and its execution is separately authorised (`README.md` §5). Every RED gate in `CLAUDE.md` stands.

---

## 0. The three questions this plan was asked to answer

| Question | Short answer | Where the detail is |
|---|---|---|
| **Will there be another folder like `project-artifacts/mockup` for the real implementation?** | **No — not as currently accepted.** The accepted Milestone 1 scope places the production application **at the repository root** (`MILESTONE_1_EXECUTION_PLAN.md` §2 item 1, §5.1; `PROJECT_PLAN_WBS.md` WP 4.2.1a). `project-artifacts/mockup/` stays where it is as a disposable artifact until it is retired. This plan proposes keeping that decision (§3) and asks you to confirm it once, in an ADR, because it has never been recorded as one. | §3 |
| **Did we create tech-stack `.md` files?** | **Yes — a full set, since 2026-08-30.** `docs/architecture/TECHNOLOGY_STACK.md` plus a 44-entry decision register and data/security/integration/deployment/testing architecture. 20 directions are approved; the vendor layer (hosting, DB host, email, storage, analytics) and **authentication** are still open. Nothing in them authorises installing anything. | §2 |
| **What is the strategy to move from wireframe to implementation?** | **Rebuild on the approved architecture, port the mockup deliberately rather than copy it, and deliver in ten milestones that each retire a named set of simulations** — with the decisions that gate each milestone put in front of you in order, batched, rather than one at a time. | §4–§8 |

---

## 1. Purpose, and where this sits among the existing documents

The repository already holds the three things a transition needs, written at different times and never joined:

| Layer | Document | What it settles |
|---|---|---|
| Decisions | `docs/architecture/` (register, stack, principles) | *What* the system is — frozen baseline, partially approved |
| First step | `docs/execution/MILESTONE_1_EXECUTION_PLAN.md` | The Walking Skeleton — scope accepted, never executed |
| Requirements | `docs/execution/BACKEND_HANDOFF_INDEX.md` + the three requirements records | *Everything the wireframe implies*, every simulation to delete, every blocking decision |

What was missing is the bridge: **in what order those become a running product, what is carried over from 83 wireframe pages, and which decisions must land before which milestone.** This document is that bridge. It changes nothing above it; when it and the WBS disagree, the WBS is the register and this plan is a proposal to update it (§11).

**Read after:** `DR-02` → `docs/architecture/README.md` → `MILESTONE_1_EXECUTION_PLAN.md` → `BACKEND_HANDOFF_INDEX.md` → this file.

---

## 2. Where we actually are (verified 2026-09-21)

### 2.1 Approved — the foundation is decided

All approved 2026-08-30 as *direction* unless noted; none authorises installation (`ARCHITECTURE_APPROVAL_PACKAGE.md` §3.1).

| Area | Approved | ADR |
|---|---|---|
| Shape | Modular monolith, one deployable, module boundaries by import rules | ADR-001 |
| Framework | Next.js App Router + React + TypeScript | ADR-002 |
| Styling | Tailwind + reusable components + design tokens (**every UI package individually gated**) | ADR-003 |
| API | Server actions + typed route handlers; no separate API | ADR-004 |
| Database | PostgreSQL, sole source of truth; local dev in a Compose container (Colima) | ADR-005, 005a |
| ORM | Prisma 7.x pinned; paid Prisma products excluded | ADR-007 |
| Jobs | `jobs` table + scheduled route; no queue, no Redis | ADR-010 |
| AuthZ | Scoped `user_roles` RBAC enforced at the data layer; never a role column on users | ADR-020 |
| Audit | Insert-only assertions/responses; audit row in the same transaction | ADR-022 |
| Tests | Vitest · Playwright · @axe-core/playwright (scoped); five layers, Tier 1 workflow set | ADR-025, 038 |
| Environments | dev / staging / production; forward-only reviewed migrations | ADR-029 |
| Secrets / backup / observability | Principles only — no product named | ADR-030, 031, 017 |
| Payments | **Stripe approved 2026-09-02** (founder holds the account); Malaysian rail open; implementation deferred | ADR-014 |
| Delivery model | Programme / scheduled offering / session, conceptual; portal never runs conferencing | ADR-043, 044 |

### 2.2 Open — and which of them block code

| Decision | ADR / ID | Blocks |
|---|---|---|
| **Authentication provider** (B1 deviation · B2 provider · B3 conditions) | ADR-006 | **Milestone 2 and everything after it.** *The only architectural blocker.* |
| Hosting model (Vercel is paid from launch for a commercial product; vs one container) | ADR-016 | First staging deploy (M3) |
| Data residency (seven inputs to verify) | ADR-032 / OQ-6 | Any **production** infrastructure — not local work |
| Production PostgreSQL host | ADR-005a | Staging (M3) |
| Transactional email provider | ADR-015 | Real verification / reset (M2 exit) |
| Object storage | ADR-008 | Nothing until certificate PDFs / evidence packs |
| Analytics + error tracker vendors | ADR-017 | Launch readiness (M9) |
| Malaysian rail; individual online payment at all | OQ-2, HO-10 / A3, A4 | Payment milestone (M4) |
| The A / AD-D / D decision lists and the B legal documents | see §5 | Named per milestone in §7 |

### 2.3 The mockup, honestly

`project-artifacts/mockup/` is a Next.js **16.3.3** / React **19.2.8** / Tailwind **4.3.3** app with **no** ORM, auth, tests, server code or database — a **static export to GitHub Pages**, which cannot run a backend at all (`BACKEND_HANDOFF_INDEX.md` §8). Its own README: *"disposable, isolated … nothing in this folder carries forward automatically."* Its 83 pages include ~30 that are labelled simulations (demo sign-in, simulated payment, sample certificates, sample admin data — inventory in `BACKEND_HANDOFF_INDEX.md` §3).

It is, however, the **only place the product's design system, copy, information architecture and real content (7 courses, 17-module curriculum, trainer record, HRD Corp facts, FAQ) currently exist in working form.** Throwing that away and re-deriving it from the specifications would be waste; copying it wholesale would smuggle the simulations and the static-export assumptions into production. §4 resolves that tension.

---

## 3. Repository layout — proposal (needs one ADR)

**Proposed: production application at the repository root, as already accepted; the mockup untouched in `project-artifacts/mockup/` until retirement.**

```
Portal4TrainingCertification/
├── CLAUDE.md · AI_DEVELOPMENT_GUARDRAILS.md · DR-02 · the three specifications   (unchanged)
├── docs/                      architecture · execution · design               (unchanged)
├── project-artifacts/
│   └── mockup/                the wireframe — frozen, still buildable, retired at M10 (§9)
├── app/                       ← production Next.js App Router                 (M1 creates)
├── src/                       ← modules with enforced import boundaries (ADR-001):
│   ├── modules/{identity,catalogue,commerce,certificates,delivery,admin,…}
│   ├── shared/{ui,tokens,guards}     ← the ported design system (§4)
│   └── preview/                      ← fixture data + PROTOTYPE banner, lint-fenced (review I-3)
├── prisma/                    schema · migrations · seed                      (M1 creates)
├── tests/                     unit · integration · e2e                        (M1 creates)
├── compose.yaml · package.json · .env.example                                 (M1 creates)
└── .github/workflows/         Pages deploy (mockup, until M10) + CI (M1 adds)
```

Why root and not `project-artifacts/app` or `apps/portal`:

1. **It is the accepted scope** (`MILESTONE_1_EXECUTION_PLAN.md` §2/§5.1, WBS 4.2.1a) and the guardrails' illustrative tree (`AI_DEVELOPMENT_GUARDRAILS.md` §47.2: `src/`, `tests/` at root). Reopening it needs an AP-10 case, and question 1 — *what does root fail to solve?* — has no answer.
2. **One application, one `package.json`, one deploy** matches ADR-001. A monorepo tool would be new technology (Rule 5) for a single app.
3. Two `package.json` files in one repository (root + mockup) is unremarkable; the mockup already runs via `npm --prefix project-artifacts/mockup`, and `.claude/launch.json` keeps working.

What this needs from you: **confirm it as an ADR** (proposed ADR-045, "Repository layout and mockup relationship" — one paragraph). It also settles the external review's open finding **I-3**, which asked for exactly this ruling.

**What it does *not* do:** move, rename, or delete anything in `project-artifacts/mockup/` (destructive — separate approval, §9), or change the repository's remote or boundaries (`AI_DEVELOPMENT_GUARDRAILS.md` §47).

---

## 4. Reuse policy — port deliberately, never copy blindly (part of the same ADR)

The rule: **a file crosses from the mockup to production only by a reviewed port, with a provenance comment, and only if it is on the PORT list.** Nothing crosses by `cp -r`.

| PORT — reviewed copy into `src/shared` or the owning module | Why it is safe |
|---|---|
| `app/globals.css` design tokens (light/dark/night, radii, type scale) | Pure CSS custom properties; the token contract Blueprint §25.7 requires; already dark-mode-correct |
| `components/ui/{Button,Card,Chip}.tsx` | Token-driven primitives, no state |
| `PublicShell` header/footer/mobile menu, `ThemeToggle` | Chrome — minus the "Wireframe index" and mockup footer strip |
| Page structure and **copy** of the public pages (home, programme, trainers, HRD Corp, about, FAQ, contact, for-organisations) | Founder-reviewed content; copied as content, re-rendered on real data |
| `data/courses.ts`, `practitioners.ts`, `hrdCorp.ts`, `faq.ts`, `questions.ts` | **Become seed files** (ADR-023/029: seed data outside migrations). The catalogue is data from day one |
| `lib/certificates.ts` (42-assertion rule set), `StatusChip`, the certificate document + print stylesheet | Pure, tested rules and a design — explicitly "reusable as-is" (`BACKEND_HANDOFF_INDEX.md` §3.3) |
| Screen structure of account, checkout, verify and admin | Layout and IA only — every data source and action replaced |

| NEVER PORT — deleted with the mockup | Because |
|---|---|
| `lib/demo*.ts`, `demoCredentials`, `SignInForm`, `SignInGate`, the `sessionStorage` keys | Simulated identity and simulated payment success — F6: *"the real product must never do this"* |
| `data/demoParticipant.ts`, `adminSamples.ts`, `certificates.ts` (sample registry), `certificateConfig.ts` | Invented records and code-constant fees |
| `generateStaticParams` on `/verify/[id]`, `/admin/*/[id]`, `output: "export"`, `basePath`, `lib/basePath.ts` | Static-hosting workarounds; production has a server |
| `SampleTag`, `SampleBanner`, `WireframeNote`, the SAMPLE watermark, the orange demo banner | Honesty labels for a simulation — meaningless on real data |
| `lib/youtube.ts` browser-side API key pattern | Re-evaluate server-side under ADR-030 |

**Enforcement, as the review recommended (A-2):** fixture data lives only under `src/preview/`, and a lint rule forbids any production module importing from it. That rule is written in M1 and is a Tier 1 boundary test thereafter.

---

## 5. Decision Gate 0 — what needs a human answer, grouped by when it bites

Nothing here is new; every item already exists as an ADR, OQ, A/B/D/AD-D item or audit finding. This is the ordering. **Batching these into three sittings** is the single largest schedule lever the project has (external review A-1: *"batch the ceremony"*).

### Sitting 1 — before any code (blocks M1/M2)

| # | Decision | Recommendation on file | Needed by |
|---|---|---|---|
| G0-1 | **Authorise Milestone 1 execution** | Scope already accepted; blocked by nothing | M1 |
| G0-2 | **ADR-006 authentication** — B1 accept spec deviation · B2 provider · B3 the five conditions | Better Auth (self-hosted, data in our Postgres) **if** you can commit to condition 4 (~monthly security patching); otherwise **Clerk**. Answer condition 4 as a *capacity* question first | M2 |
| G0-3 | **ADR-045 repository layout + reuse policy** (§3, §4) | Root; port list; `/preview` fence | M1 |
| G0-4 | **MFA for admin in V1** (OQ-14) | Yes — one admin holds every privilege | M2 |
| G0-5 | Confirm AP-12 was a direction, not a proposal (ADR-042 note) | Confirm | — |

### Sitting 2 — before the first deploy and the payment milestone (blocks M3/M4)

| # | Decision | Recommendation on file | Needed by |
|---|---|---|---|
| G0-6 | **ADR-032 residency** — verify and classify the seven inputs | Then, not before: | M3 |
| G0-7 | **ADR-016 hosting** + **ADR-005a production DB host** | Decide together with G0-6; Vercel is paid from launch | M3 |
| G0-8 | **ADR-015 email provider** + **OQ-3 sending domain** | Resend or Postmark | M2 exit |
| G0-9 | **A4 / HO-10** — is individual online payment offered at all? **A3** Malaysian rail. **A5** corporate invoice path | The wireframe assumes yes; unconfirmed | M4 |
| G0-10 | **A8** who may pay the Pakistan scholarship price · **A9** methods × currency · **A10** launch-price durability · **A11** tax basis · **A12** cancellation | — | M4 |
| G0-11 | **A6** what a seat is; capacity; waitlist | — | M3 |
| G0-12 | **B3 Refund & cancellation policy** · **B4 invoicing entity** · **B5 tax** | Founder + counsel; **prerequisite for taking any payment** | M4 |
| G0-13 | **B2 Privacy policy (PDPA)** · **B1 Terms** | Founder + counsel; B2 is required the moment a form stores a name | M2 (accounts store PII) |

### Sitting 3 — before certificates and launch (blocks M6–M10)

| # | Decision | Needed by |
|---|---|---|
| G0-14 | **D1** certificate naming vs the earned credential · **D2** what "completed" means and who records it · **D3** listing consent (recommended default: opt-in) · **D5** fee economics | M6 |
| G0-15 | D4, D6–D13 (search rules, renewal window/arithmetic, expired display, timezone, auto-renew, revocation, corrections, corporate visibility) · **D14** issuer identity / brand name (`HO-4`) | M6–M7 |
| G0-16 | **AD-D1** who holds which role at launch · AD-D2 attendance rule · AD-D3 manual issuance · AD-D5 enquiry SLA | M8 |
| G0-17 | ADR-017 vendors (error tracker, analytics — replay disabled on assessment screens) · ADR-008 storage · OQ-10 RPO/RTO · OQ-16 audit scope · OQ-18/19 release gate and coverage | M9 |
| G0-18 | **Launch content** (from the 2026-09-21 readiness audit): a monitored business contact channel · the hero job/freelance claims substantiated or softened · programme naming reconciled across hub and detail pages · the "25 → 5" benefit detail | M10 |

---

## 6. Strategy in one page

1. **Do not extend the mockup into production.** It is static, has no server, and every signed-in screen is a simulation. Attempting to "connect" it would violate F6 and AP-07 and inherit `output: "export"`.
2. **Build on the approved architecture at the root**, starting with the already-accepted Walking Skeleton — it exists precisely to prove the foundation (restart proofs) before any feature.
3. **Port the design system and content once, deliberately** (§4), so the production app looks like the reviewed wireframe from its first real page, without carrying a single simulation across.
4. **Deliver in vertical milestones that each retire a named set of simulations** (§7). A milestone is complete when its Tier 1 workflows pass, its restart test passes, and the wireframe screens it replaces are deleted from the port list. Nothing is ever "connected later".
5. **Schema grows one approved migration at a time** — each milestone's execution plan carries its proposed tables, and each is a Rule 1 approval at the moment it is applied. There is no big-bang schema.
6. **Put decisions in front of you in three sittings, not thirty.** Each milestone plan lists the decisions it consumes; a milestone is not planned in detail until its decisions exist.
7. **Production readiness is a chain, not a milestone at the end** — residency → hosting → environments → secrets → backups (rehearsed restore) → observability run in parallel from M3 and gate M9/M10 (WBS Phase 7).
8. **Retire the mockup on cutover, don't delete it** (§9).

---

## 7. Milestone roadmap — PROPOSED (Track B, extended)

M1 and M2 already exist in the WBS. M3–M10 are proposed here and **do not exist until the WBS is updated and each has an accepted execution plan** (WBS §14: *no milestone is executed without an accepted plan*). Sequence follows `BACKEND_HANDOFF_INDEX.md` §7 and the WBS §11.2 dependency order. **No dates.** No duration for Track B is documented and none is invented (WBS §6 rule).

Every milestone inherits the standing exit criteria in §8; the rows below list only what is specific.

| # | Milestone | Scope (one slice, end to end) | Consumes decisions | RED gates it will request | Retires from the mockup | Exit — pass/fail, in its own plan |
|---|---|---|---|---|---|---|
| **M1** | **Walking Skeleton** *(accepted)* | Framework at root · Compose Postgres · Prisma · `domains` table · seed · one route · Vitest + Playwright + axe · CI | G0-1, G0-3 | Init framework · install pinned set · start container · **first schema** · two commits | — (adds `/preview` fence + ported tokens/primitives as its only extension, if G0-3 approves) | Its §8 criteria 1–10, esp. restart proofs 7–8 |
| **M2** | **Identity & access** | Auth provider per ADR-006 · `users`, `auth_identities`, `user_roles`, sessions · register / verify email / sign-in / reset / sign-out · admin MFA · server-side gate on `/account/*` and `/admin/*` · audit log table | G0-2, G0-4, G0-8, **G0-13 (B2)** | Auth dependency · email service · schema | `lib/demo*`, `SignInForm`, `SignInGate`, `AccountFrame` gate, `mockup:demo-session`, `mockup:demo-return-to` | Tier 1 #1 and #2; MFA enforced; enumeration-safe errors; PDPA consent captured at registration |
| **M3** | **Catalogue & staging** | `programmes`, `delivery_formats`, `scheduled_offerings` (capacity, status), `prices` per currency · public pages on real data · `/schedule` real · **first staging environment** | G0-6, G0-7, G0-11 | Hosting account · production-shaped DB · secrets store · schema | `data/demoParticipant.ts` offerings, sample schedule, placeholder programme title (real curriculum lands here) | Public pages byte-equivalent in content to the reviewed wireframe; staging up; backups configured; restore rehearsed once |
| **M4** | **Registration & payment** | Server-priced checkout · Stripe (hosted Checkout vs Payment Element decided in the plan) · signature-verified idempotent webhooks · raw webhook event log · `orders`, `payments`, `registrations`, `consents` · capacity hold · receipts · refund path | G0-9, G0-10, **G0-12** | Stripe SDK · schema · **payment logic** | `demoRegistrations`, `CheckoutFlow.pay()`, `ConfirmationView`, `BlockedConsent` | Tier 1 #3 and #4; replayed webhook is harmless; confirmation reads server truth; **no registration exists without a confirmed payment** |
| **M5** | **Participant account** | Dashboard, registrations, participation, orders/receipts, profile, PDPA export/delete, notifications | A7, C20 | Schema | Sample orders, notifications, help samples, `results.ts` skills fixture (skills page ships as "not yet available" unless the diagnostic engine is separately scoped) | Tier 1 #9 state persistence; export produces every record; deletion honours OQ-12 policy |
| **M6** | **Certificate of Completion & verification** | Completion recording → issuance (unique ID, real alphabet) · `/verify` server search with rate limit · `/verify/[id]` dynamic, `noindex`, short cache · holder page · listing consent | **G0-14**, D4, D8, D9 | Schema; QR/PDF only if D15 approves a dependency | `data/certificates.ts`, `demoCertificate`, demo tools panel, static `verify/[id]` params, SAMPLE watermark | Tier 1 #7 and #8; unknown ID → real 404; unlisted holder invisible to name search |
| **M7** | **Renewal & fees** | Effective-dated fee config · renewal payment (reuses M4) · reminders via `jobs` · expiry status arithmetic | D5–D7, D10 | Schema | `certificateConfig.ts`, `RenewFlow.pay()` | Renewal never extends a revoked certificate; reminder job survives restart |
| **M8** | **Trainer / admin operations** | RBAC-scoped admin: offerings & seats, attendance & completion, orders/refunds/invoices, enquiries, organisations, certificate admin (correct / reissue / **revoke**, two-person if BR-3 stands), fees & settings, users & roles, audit log, reports | **G0-16**, AD-1…21, D11, D12 | Schema | `adminSamples.ts`, every `Disabled` action, `AdminFrame` label-gate | Every action writes an audit row in-transaction; a participant cannot reach `/admin` server-side |
| **M9** | **Production readiness** *(WBS Phase 7, runs from M3)* | Production environment · observability · uptime · rehearsed restore in production · security review & rate limiting · accessibility pass · release-gate policy · retention implemented | G0-17 | Production infra · vendor accounts | — | Every Phase 7 WP recorded; restart-resilience test (Testing §6) passes in staging |
| **M10** | **Launch cutover** | Legal pages published · contact channel live · claims reconciled · robots/sitemap/404/error pages · domain · Pages workflow retired · redirects from old mockup URLs where the domain allows · **mockup archived** (§9) | **G0-18**, B1–B5 published | Domain · deploy | The footer "Mockup/Wireframe" strip, the wireframe index, every remaining `WireframeNote` | The 2026-09-21 readiness audit's blocker list is empty; Tier 1 set green on the production build |

**Parallel, non-engineering critical path (WBS Workstream C/D):** the real curriculum, the legal documents, the employer/HRD Corp verification and the assessor question (OQ-22) do not wait for any milestone and gate several. The external review's closing line stands: *the constraint is not code.*

---

## 8. Standing rules for every milestone

These apply to M1–M10 and are not restated in each plan:

1. **Its own execution plan first** — scope · decisions consumed · RED-gate actions · proposed tables (columns listed, Rule 1) · deliverables · pass/fail criteria · the mockup files it retires. Scope acceptance and execution authorisation are recorded separately.
2. **One authorisation per accepted plan** covers that plan's listed RED-gate actions, requested individually at the moment each is performed (the register's standing rule), so the ceremony is batched but the gates are intact.
3. **Schema:** every table appears in a plan before a migration; migrations are forward-only and reviewed; seeds never live in migrations; **no destructive migration without separate approval.**
4. **Tests before "done":** Tier 1 workflows get unit + integration (real Postgres) + e2e + negative cases; every fixed defect gets a regression test; axe per component. Status is reported as *Implemented · Tested · Partially tested · Blocked · Requires human validation.*
5. **Restart test at every milestone:** drive the slice to a partial state → restart the app, clear caches → nothing lost beyond the stated window.
6. **No simulation survives into a real path.** If a stub is needed it lives under `src/preview/`, is lint-fenced, carries a visible PROTOTYPE banner, and is listed for deletion in the next plan (AP-07).
7. **Provenance on every port:** a header comment naming the mockup file and date; the mockup file is then added to the retirement list.
8. **Documentation in the same change:** `BACKEND_HANDOFF_INDEX.md` §3 (simulations retired), `MOCK_DATA_REGISTER.md`, the WBS status column, and a completion report in the standard format.
9. **Commits:** file-by-file staging, bounded commits per plan, never `git add .`, push only to the confirmed remote, and only when asked.

---

## 9. Retiring the mockup — at M10, never before, never by deletion

| Step | Action | Gate |
|---|---|---|
| 1 | Production build passes the M10 exit criteria on the real domain | — |
| 2 | Disable `.github/workflows/deploy-pages.yml`; the GitHub Pages site is replaced by (or redirected to) production | Deploy authorisation |
| 3 | Mark `project-artifacts/mockup/README.md` **RETIRED — superseded by the root application on <date>**; leave the folder buildable for reference | Documentation |
| 4 | **Only on a separate, explicit instruction:** remove `project-artifacts/mockup/` from the working tree (it stays in git history) | 🔴 Destructive — `CLAUDE.md` Destructive Action Protection |

Until step 3, the mockup remains the reference for design and copy and must keep building; changes to it after M3 should be rare and mirrored into the production port.

---

## 10. Working cadence — proposal

- **Decision sittings** (§5): three, scheduled before M1, M3 and M6. Each produces dated approval records naming ADR/decision IDs; the AI updates the registers the same day.
- **Per milestone:** plan → founder accepts scope → founder authorises execution → build with individual gate requests → completion report → registers updated → next plan.
- **Reporting:** completion status only ever in the five states; a milestone whose Tier 1 tests are not green is *not complete*, whatever renders.

---

## 11. Documentation drift to correct (found 2026-09-21 — reported, not silently fixed)

Per AP-09 drift is a defect to report. Proposed as WP **1.x "Register hygiene"**, one bounded change after review:

| Where | Drift |
|---|---|
| `ARCHITECTURE_DECISION_REGISTER.md` | §1 summary vs §2 record headers disagree on status for ADR-008/009/011/012/015/016/018/019/021/024/026/027/033/034 (DEFERRED vs PROPOSED/PENDING); ADR-038 says ADR-025 "remains PENDING" while ADR-025 reads APPROVED (scoped); ADR-041 body lists AP-01…10, approval says AP-01…11 |
| `TESTING_ARCHITECTURE.md` header vs `EXTERNAL_ARCHITECTURE_REVIEW` §9 | ADR-025 pending vs "approved" |
| `INTEGRATION_ARCHITECTURE.md` §2/§3 | Stripe still "PENDING" though approved 2026-09-02; AI provider prose still says "MVP required" (deferred by DR-02) |
| `PROJECT_PLAN_WBS.md` §1.1 vs §2.4/§3 | WP 1.4 recorded complete in one place, "authorization required" in another |
| `docs/execution/README.md` §4 | Milestone table predates M3–M10 (this plan proposes the update) |
| `MILESTONE_1_EXECUTION_PLAN.md` | Written before the mockup existed; needs a one-line note that G0-3 may add the `/preview` fence and ported tokens to its scope, or a follow-on M1b |

---

## 12. What this plan deliberately does not do

- Select a host, region, auth provider, email provider, storage or analytics vendor — each is an existing open ADR with its own recommendation.
- Define any table — each milestone plan does, one approval at a time.
- Set dates or durations — none exist for Track B and none may be invented.
- Resolve any business rule (A/AD-D/D lists), legal document (B) or product decision (naming, pricing eligibility, job-placement claims).
- Move, modify or delete anything in `project-artifacts/mockup/`.
- Update the WBS or the ADR register — those edits follow acceptance of this plan, as bounded changes.

---

## 13. Human decisions required to act on this plan

| # | Decision | Effect |
|---|---|---|
| 1 | Accept this plan's **shape** (§6–§7) as the Track B extension to be written into the WBS | Unlocks WP-level updates to `PROJECT_PLAN_WBS.md` and `README.md` §4 |
| 2 | **ADR-045** — root layout + reuse policy (§3–§4) | Unlocks M1's port of tokens/primitives and the `/preview` fence |
| 3 | **Sitting 1** decisions (G0-1…G0-5), especially **ADR-006** | Unlocks M1 execution now and M2 planning |
| 4 | Whether to run the **register-hygiene** change (§11) | Housekeeping |

**Recommended immediate next action:** hold Sitting 1. With G0-1 and G0-3 answered, Milestone 1 can start the same day — it is blocked by nothing else and has been ready since 30 August.

---

*Document control — Version 0.1 · Created 2026-09-21 · Status DRAFT `D·–·–` · Authorises: nothing · Supersedes: nothing · Companion to `MILESTONE_1_EXECUTION_PLAN.md`, `BACKEND_HANDOFF_INDEX.md`, `PROJECT_PLAN_WBS.md`.*
