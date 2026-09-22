# Execution Documentation — Index

> # ⛔ PLANNING & ARCHITECTURE MODE — implementation NOT authorized
>
> **Status as at 2026-08-30.** Nothing in this folder may be performed. Execution begins only on an explicit instruction such as *"Proceed with Milestone 1"* or *"You may start implementation."*
>
> **Approval of a direction is not approval to execute it.** A decision may be `APPROVED` while implementation remains `NOT AUTHORIZED`.

---

## 1. Purpose

This folder holds the **delivery record**: what is planned to be built, in what order, what was actually built, and how it was verified.

It is deliberately separate from [`../architecture/`](../architecture/README.md), which holds **decisions** — what the system is and why.

## 2. What belongs where

| Question the document answers | Folder |
|---|---|
| *What is the system, and why was it decided that way?* | `docs/architecture/` |
| *What are we building next, in what order, and how will we know it worked?* | `docs/execution/` |

| Belongs in `execution/` | Belongs in `architecture/` |
|---|---|
| Milestone plans and their scope | Architecture principles (AP-01…AP-12) |
| RED-gate action lists awaiting authorization | Architecture Decision Records |
| Verification criteria and results | Technology decisions and comparisons |
| Completion reports | Data, security, integration, deployment architecture |
| Proposed commit plans | Conflict resolution register |

**The test:** if it would still be true after this milestone ships, it is architecture. If it describes *this* piece of work, it is execution.

`[ANALYSIS]` The separation exists because the two have different lifetimes. Architecture documents are long-lived and change slowly under governance; execution documents are consumed, completed and superseded as work proceeds. Mixing them makes the frozen baseline look busier than it is, and makes it harder to see at a glance what is actually decided.

## 3. Documents

| Document | Purpose | Status |
|---|---|---|
| [`MILESTONE_1_EXECUTION_PLAN.md`](MILESTONE_1_EXECUTION_PLAN.md) | The "Walking Skeleton" — the proposed first executable milestone: scope, approved decisions relied on, RED-gate actions, deliverables, verification criteria. **Unaffected by the `DR-02` correction** | ⛔ **SCOPE ACCEPTED — EXECUTION NOT AUTHORIZED** |
| [`MILESTONE_2_EXECUTION_PLAN.md`](MILESTONE_2_EXECUTION_PLAN.md) | **Identity & access** — Better Auth on the ADR-006 recommendation, identity-mapping pattern, scoped RBAC, admin MFA, audit, email behind an interface, consent gate; every table listed (§5); 13 pass/fail criteria (§8); six defaults for ratification (§10) | ▶ **EXECUTED 2026-09-21 — scope acceptance and ADR-006 B1/B2/B3 pending founder ratification** — [`MILESTONE_2_COMPLETION_REPORT.md`](MILESTONE_2_COMPLETION_REPORT.md) |
| [`MILESTONE_3_EXECUTION_PLAN.md`](MILESTONE_3_EXECUTION_PLAN.md) | **Catalogue & public portal** — programmes, modules, formats, prices, experts, scheduled offerings (zero rows until a real date), FAQ, diagnostic questions and enquiries as data; every public page ported from the wireframe and rendered from the database; staging deferred to M9 (needs founder accounts) | ▶ **EXECUTED 2026-09-21 — scope acceptance pending founder ratification** — [`MILESTONE_3_COMPLETION_REPORT.md`](MILESTONE_3_COMPLETION_REPORT.md) |
| [`MILESTONE_4_EXECUTION_PLAN.md`](MILESTONE_4_EXECUTION_PLAN.md) | **Registration & payment** — Stripe Checkout (cards), server-side pricing by profile country, refund tiers enforced and published, capacity hold, idempotent webhooks, participant cancel/transfer, admin offerings screen, Malaysian-law legal DRAFTS; founder decisions recorded in §3 | ✅ **EXECUTED 2026-09-21** (evening) — real test-mode payment + refund verified — [`MILESTONE_4_COMPLETION_REPORT.md`](MILESTONE_4_COMPLETION_REPORT.md) |
| [`USER_PROFILE_REQUIREMENTS.md`](USER_PROFILE_REQUIREMENTS.md) · [`MILESTONE_5A_EXECUTION_PLAN.md`](MILESTONE_5A_EXECUTION_PLAN.md) | **User profile** — email as the immutable login identifier; progressive profile (address, organisation, ID document encrypted, date of birth, photo); checkout gate; founder decisions recorded in the requirements §8 | ✅ **EXECUTED 2026-09-22** — [`MILESTONE_5A_COMPLETION_REPORT.md`](MILESTONE_5A_COMPLETION_REPORT.md) |
| [`LEARNER_FEEDBACK_REQUIREMENTS.md`](LEARNER_FEEDBACK_REQUIREMENTS.md) · [`MILESTONE_5B_EXECUTION_PLAN.md`](MILESTONE_5B_EXECUTION_PLAN.md) | **Reviews** — one review per completed registration (= per certificate when M6 lands); pending → approve moderation; consent defaults private, photo consent separate; public `/reviews`; admin `/admin/reviews`; dashboard status; `reviewRequirement()` for the M6 certificate gate; founder decisions recorded in the requirements §13 | ✅ **EXECUTED 2026-09-22** — [`MILESTONE_5B_COMPLETION_REPORT.md`](MILESTONE_5B_COMPLETION_REPORT.md) |
| [`MILESTONE_6_EXECUTION_PLAN.md`](MILESTONE_6_EXECUTION_PLAN.md) | **Certificate of Completion & verification** — admin-recorded completion → idempotent issuance (unique ID), holder page with the reviews gate on the document, public `/verify` search and `/verify/[id]`, renewal by Stripe with an effective-dated fee, revocation, listing consent; 14 decisions (§3) and the Rule 1 schema (§4) for the founder | ▶ **EXECUTING 2026-09-22 — founder approved E1–E14** |
| [`PROJECT_PLAN_WBS.md`](PROJECT_PLAN_WBS.md) | The master execution navigation layer: phases, workstreams, milestones, work packages, dependencies and status. **Reconciled with `DR-02` on 2026-08-31** | DRAFT — pending review |
| [`COMPLETION_CERTIFICATE_REQUIREMENTS.md`](COMPLETION_CERTIFICATE_REQUIREMENTS.md) | The 2026-09-20 **Certificate of Completion** requirement (unique ID, yearly expiry, USD 10 renewal, public search, unique URL) polished to best practice: proposed requirements with priorities, verified logic, privacy/search design, **15 open decisions with recommendations**, architecture implications, demo files to replace, and a test checklist. **A record only; authorises nothing** | REQUIREMENTS RECORD |
| [`BACKEND_HANDOFF_INDEX.md`](BACKEND_HANDOFF_INDEX.md) | **Start here for backend work.** The master map of the 2026-09-20 wireframe: every screen ↔ what is simulated ↔ real-build requirements ↔ blocking decisions; the full list of demo files and storage keys to delete/replace; entities implied; consolidated open decisions; suggested build order; hosting constraint; what is not built; what was and was not verified. **A record only; authorises nothing** | REQUIREMENTS RECORD |
| [`ADMIN_REQUIREMENTS.md`](ADMIN_REQUIREMENTS.md) | The 2026-09-20 **trainer/admin side** wireframe (`/admin`, 15 screens, second demo persona): what it implies for roles, delivery operations, commerce, certificate administration, configuration, audit and reporting; decisions AD-D1..5; delete-list; test checklist. **A record only; authorises nothing** | REQUIREMENTS RECORD |
| [`ACCOUNT_AND_PAYMENT_REQUIREMENTS.md`](ACCOUNT_AND_PAYMENT_REQUIREMENTS.md) | What the 2026-09-20 account, signed-in, registration and checkout wireframes need before they can be real — founder decisions log, open decisions, legal documents, backend engineering, an inventory of every demo file to delete/replace, and a test checklist. **A record only; authorises nothing** | REQUIREMENTS RECORD |
| [`WIREFRAME_TO_PRODUCTION_PLAN.md`](WIREFRAME_TO_PRODUCTION_PLAN.md) | **The transition strategy, 2026-09-21** — where the production code lives (root, per the accepted Milestone 1 scope; proposed ADR-045), what is ported from the mockup and what is never ported, the decisions that gate backend work grouped into three sittings, a proposed M3–M10 roadmap extending Track B, standing rules per milestone, and how the mockup is retired. **Proposes; authorises nothing; creates no milestone until the WBS is updated on acceptance** | ⛔ **PROPOSED — pending founder review** |

## 4. Milestone status

| # | Milestone | Objective | Blocked by | Status |
|---|---|---|---|---|
| **1** | Walking Skeleton | Prove the approved development foundation works end to end with a minimal, real, persistent vertical slice | **Nothing architectural** — only execution authorization | ✅ **COMPLETE 2026-09-21** — all ten criteria pass; [`MILESTONE_1_COMPLETION_REPORT.md`](MILESTONE_1_COMPLETION_REPORT.md). Authorised by founder direction the same day; branch `feat/production-foundation`. **M1b** (ADR-045 extension: tokens, primitives, chrome, CI) executed the same day — report §3.4 |
| **2** | Identity & access (authentication → authorisation → signed-in landing) | The first real steps of the Track B vertical slice | **ADR-006** — B1 deviation · B2 provider · B3 conditions → **executed on the recommendation (Better Auth); ratification pending** | ✅ **EXECUTED 2026-09-21** — 13 / 13 criteria; [`MILESTONE_2_COMPLETION_REPORT.md`](MILESTONE_2_COMPLETION_REPORT.md) |

**Milestone 1 required no decision that was not already approved.** Milestone 2 was executed on the ADR-006 *recommendation* under the founder's 2026-09-21 direction; the six defaults it took are listed in its plan §10 for ratification.

| **4** | Registration & payment | Real registrations only after a verified Stripe event; refund rule enforced; admin offerings | Founder decisions (received 2026-09-21 evening) | ✅ **EXECUTED 2026-09-21** — [`MILESTONE_4_COMPLETION_REPORT.md`](MILESTONE_4_COMPLETION_REPORT.md) |
| **3** | Catalogue & public portal | The catalogue as data (ADR-043) and the public pages on it; the header navigation resolves | Staging half needs G0-6/G0-7 (founder accounts) → carried to M9 | ✅ **EXECUTED 2026-09-21** (catalogue + portal half) — [`MILESTONE_3_COMPLETION_REPORT.md`](MILESTONE_3_COMPLETION_REPORT.md) |

> **2026-09-21:** Milestones **4–10** (registration & payment → participant account → certificate & verification → renewal → admin operations → production readiness → launch cutover) remain **proposed** in [`WIREFRAME_TO_PRODUCTION_PLAN.md`](WIREFRAME_TO_PRODUCTION_PLAN.md) §7. M2 and M3 were executed under the founder's 2026-09-21 blanket direction with their own plans; their scope acceptance is pending ratification. Each later milestone needs its own execution plan under §5 below.

> **Reconciled with `DR-02`, 2026-08-31.** The Track B vertical slice these milestones belong to was **restated** away from the retired lesson-consumption model — see `PROJECT_PLAN_WBS.md` §6.2 and ADR-036/ADR-040. **Milestone 1 is unaffected**: a `domains`-table walking skeleton is delivery-model-agnostic, and its plan needed no change. Milestone 2 (authentication → authorisation → dashboard) is likewise unaffected in substance; the steps *after* it are what changed.

## 5. How execution documents are used

1. A milestone is planned here, with explicit scope, RED-gate actions and pass/fail verification criteria.
2. The plan is reviewed. **Scope acceptance is recorded separately from execution authorization.**
3. On explicit authorization, the milestone is executed **within its stated scope**. Scope expansion stops work and returns here.
4. Results are recorded — honestly, including failures — against the verification criteria.
5. A completion report is produced in the standard format, distinguishing **Implemented · Tested · Partially tested · Blocked · Requires human validation**.
6. The next milestone is planned.

**Architecture discovery does not restart when execution begins.** Approved decisions are reopened only on an implementation conflict, a security issue, a technical impossibility, a RED-gate boundary, a new cost, or necessary scope expansion.

## 6. Standing constraints

These apply to every milestone in this folder and are not restated in each plan:

- **No RED-gate action** — framework initialisation, package installation, container start, database or schema creation, migration, infrastructure provisioning, external account creation, staging, committing, pushing — without explicit authorization at the moment it is performed.
- **No `git add .`** or bulk staging. Files are staged individually and verified.
- **`Reference Material/`** ↻ **relocated by the founder 2026-09-02** to `/Users/mustafaqizilbash/Documents/GitHub/ReferenceMaterial`, outside this repository. The out-of-scope rule stands and is now enforced technically: the `reference-material` MCP server is **read-only by permission deny rules**, so it cannot be modified, renamed or deleted, and being outside the repo it cannot be staged or committed. Observations may be reported; they authorise nothing. See [`../REFERENCE_MATERIAL_ACCESS.md`](../REFERENCE_MATERIAL_ACCESS.md).
- **AP-07** — anything stubbed is visibly identified as temporary and structurally isolated. Nothing simulated is reported as complete.
- **AP-12** — no technology introducing a mandatory development-time cost without approval.
