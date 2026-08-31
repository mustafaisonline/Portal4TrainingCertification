# Project Plan & Work Breakdown Structure

> # ⛔ PLANNING & ARCHITECTURE MODE — implementation NOT authorized
>
> **Created:** 2026-08-30 · **Version:** 1.0 · **Owner:** project owner
> **Status of this document:** DRAFT — execution navigation reference, pending human review
>
> **This document authorises nothing.** It records where the project stands, what is sequenced next, and what is blocked. It does not approve a decision, promote a status, resolve an open question, or grant execution authority. Every RED gate named in `CLAUDE.md`, `AI_DEVELOPMENT_GUARDRAILS.md` and `../architecture/ARCHITECTURE_APPROVAL_PACKAGE.md` still applies in full.

---

## 0. What this document is, and what it is not

`PROJECT_PLAN_WBS.md` is the **master execution navigation layer**: the hierarchical breakdown of the whole project, its phases, workstreams, milestones and work packages, with honest status, dependencies and approval gates.

| This document answers | Go elsewhere for |
|---|---|
| Where does the project stand right now? | *What is the system and why?* → [`../architecture/`](../architecture/README.md) |
| What is complete, active, ready, blocked, deferred? | *Which decision was made, on what basis?* → [`../architecture/ARCHITECTURE_DECISION_REGISTER.md`](../architecture/ARCHITECTURE_DECISION_REGISTER.md) |
| What must be decided before a workstream can proceed? | *How is a milestone implemented, step by step?* → the milestone's own execution plan, e.g. [`MILESTONE_1_EXECUTION_PLAN.md`](MILESTONE_1_EXECUTION_PLAN.md) |
| What comes next, and in what order? | *What is the product?* → the approved specifications in the repository root |
| What remains before MVP and before production readiness? | *What are the durable principles?* → [`../architecture/ARCHITECTURE_PRINCIPLES.md`](../architecture/ARCHITECTURE_PRINCIPLES.md) |

**Documentation boundary, restated.** If it would still be true after the current milestone ships, it belongs in `docs/architecture/`. If it describes delivery, sequencing, milestones, work packages, dependencies, progress or current status, it belongs here. **This document must never become a second architecture specification or decision register.** Where it names a decision, it names the ID and the status only — the reasoning lives in the ADR.

**Document hierarchy this document sits inside:**

```
Approved specifications (root)  ─┐
CLAUDE.md · AI_DEVELOPMENT_GUARDRAILS.md  ─┤ govern everything below
docs/architecture/ (frozen baseline) ─┘
                    ↓
        PROJECT_PLAN_WBS.md   ← this document: the master roadmap
                    ↓
              Major phases
                    ↓
                Milestones
                    ↓
   Detailed milestone execution plans (docs/execution/MILESTONE_n_*.md)
                    ↓
          Actual implementation tasks
```

---

## 1. CURRENT PROJECT POSITION

> **Orientation checkpoint — read this section first in every new session.**
> Verified against documented evidence on 2026-08-30. Do not act on it without confirming the source documents it cites still say what it reports.

### 1.1 Position at a glance

| Question | Answer as at 2026-08-30 |
|---|---|
| **Current overall phase** | **Pre-execution.** WBS Phases 1–3 (governance, specification, architecture baseline) are complete or substantially complete. **No implementation phase has begun.** |
| **Current milestone** | **None in execution.** The next milestone is **Milestone 1 — Walking Skeleton**: scope accepted, **execution not authorized** |
| **Last completed activity** | Architecture baseline **frozen** 2026-08-30; the 2026-08-30 approval round (24 ADR records approved in whole or in stated part); documentation separated into `docs/architecture/` and `docs/execution/` |
| **Current active work** | **Planning and documentation only.** No code, no framework, no packages, no database, no infrastructure, no external accounts |
| **Immediate blockers** | (a) **Execution authorization** — blocks all implementation; (b) **ADR-006 (B1/B2/B3)** — blocks Milestone 2 and Track B step 1; (c) **the six business decisions** in Mockup Spec §20.6 — see the sequencing conflict at §1.4; (d) **ADR-032 residency answer** — blocks production data infrastructure only |
| **Codebase state** | No application code exists. `.gitignore` deliberately technology-neutral |
| **Repository state** | ⚠️ **`docs/` is entirely untracked.** Every architecture and execution document is **drafted, partly approved, and NOT committed** — `D·A·—` at best. The frozen baseline exists only in the working tree. See §2.3, the register at §2.4, and WP **1.4** |

### 1.2 Next recommended actions, in order

Each is a **recommendation for the owner's decision**, not an action an AI session may take unprompted.

| # | Action | Why now | Gate |
|---|---|---|---|
| **1** | **Authorize committing the documentation baseline** (`docs/architecture/`, `docs/execution/`), staged file-by-file | The frozen baseline is not in version control. Guardrail Rule 9 (traceability) and AP-09 (persistent documentation) are not yet actually satisfied by git | 🔴 Repository operation |
| **2** | **Decide ADR-006 — B1 (specification deviation) · B2 (provider) · B3 (five binding conditions)** | The only architectural decision blocking Track B beyond Milestone 1. Can be settled in parallel with everything else | 🔴 Yours alone (B1) |
| **3** | **Decide the six business decisions** (Mockup Spec §20.6) **and rule on the unresolved Track A start-condition conflict (§1.4)** | Naming is stated as *"decide before step 0"* of design; pricing, corporate-vs-individual and assessor sourcing shape Track A and the authoring work. **Track A cannot be treated as ready until the §1.4 conflict is answered** | 🔴 Product decisions · 🔴 conflict ruling |
| **4** | **Start the expert authoring critical path (4.3)** | Requires no pending architecture decision and is unaffected by the §1.4 conflict; the specification names it the real critical path | 🟢 Owner's discretion |
| **5** | **Start Track A**, once #3 is answered | Validates the risk that nobody wants the product — the risk Track B cannot touch | ⏳ Gated by #3 |
| **6** | **Authorize Milestone 1 execution**, if Track B is to begin | Milestone 1 requires **no** decision that is not already approved | 🔴 Multiple RED gates, each requested at the moment it is performed |

### 1.3 Decisions required before the next execution phase

| Needed before | Decision | Where it lives | Status |
|---|---|---|---|
| **Milestone 1** | *(none architectural)* — only explicit execution authorization, then per-action RED-gate approval | `MILESTONE_1_EXECUTION_PLAN.md` §4, §5 | ⏳ Authorization pending |
| **Milestone 2 / Track B step 1** | **ADR-006** — B1 deviation · B2 provider · B3 conditions | `../architecture/DECISION_B_AUTHENTICATION.md` | ⏳ PENDING |
| **Track A design start** | The six business decisions, in particular **#1 naming** — **and** a ruling on the unresolved start-condition conflict | Mockup Spec §20.6; **§1.4 below** | ⏳ PENDING · 🔴 **conflict unresolved** |
| **Any production data infrastructure** | **ADR-032 residency answer** (seven inputs verified and classified) | `../architecture/SECURITY_ARCHITECTURE.md` §11.1 | 🕓 DEFERRED — trigger reached at first production provisioning |
| **First deployment** | **ADR-016** hosting · **ADR-005a** production database host | Register §1 | 🕓 DEFERRED — trigger: first deployment |
| **First credential issuance** | **OQ-5** verification domain (product/branding; identity itself settled by ADR-039) | `../architecture/README.md` §8 | ⏳ PENDING |

### 1.4 🔴 UNRESOLVED PROJECT-LEVEL CONFLICT — Track A start condition

> **Status: UNRESOLVED. Requires human direction. Track A sequencing must not be treated as confirmed until it is answered.**

Two documents in the approved baseline describe Track A's readiness differently, and the difference determines what a session is permitted to start:

| Source | What it states |
|---|---|
| `../architecture/ARCHITECTURE_APPROVAL_PACKAGE.md` §6 | *"Track A — product experience validation — **blocks on nothing** and may begin at your discretion."* |
| `DATA_AI_ACADEMY_PORTAL_MOCKUP_SPECIFICATION.md` §20.6 | Six business decisions are *"needed from you **before design begins**"*, with naming explicitly *"decide before step 0"* |

**This document does not interpret, reconcile, narrow, or decide between them.** Per `CLAUDE.md` Rule 8 and Guardrail §11, the conflict is surfaced and left open. No partial reading is offered here, because a partial reading is itself a decision — and this one determines whether design work may begin.

**Consequences while it remains unresolved:**

- **Track A is not "ready to start."** Its work packages (4.1.1 onward) are ⏳ **Pending decision**, not 🟢.
- **No session may begin Track A design work** on the basis of either document alone, or on the basis of an inference about which of the two is more authoritative.
- Track A's status in every other table in this document is derived from this section. If this conflict is answered, **§1.4, WP 4.1.0, §6.1, §11 and §12 all change together**.
- The expert authoring workstream (4.3) is **not** affected by this conflict — its readiness rests on the MVP Spec's own statement that it is the real critical path, not on either of the two documents above.

**What resolution requires:** an explicit human ruling on which condition governs Track A's start, recorded at WP **4.1.0**. If the ruling contradicts either source document, that document must be corrected in its own folder — never silently reinterpreted here.

### 1.5 Do not pull these forward

Deferred with recorded triggers. Starting any of them without its trigger and its approval is scope expansion. Full list at §8.

> Video provider · object storage · payments · AI provider · analytics product · production hosting and database host · Testcontainers · Redis · queue service · graph database · event bus · dedicated vector store · service extraction · OpenSearch · SSO · SCIM · LTI · xAPI/LRS · Open Badges 3.0 / W3C VCs · proctoring vendor · badge signing infrastructure · second domain · credential ladder · CPD/renewal · mobile app.

---

## 2. WBS structure

### 2.1 Structure and numbering

```
0  Project — Data & AI Academy Training & Certification Portal
│
├── 1  Governance & Operating Baseline .................. ✅ Complete (one open work package)
├── 2  Product Specification Baseline ................... ✅ Complete (confirmations outstanding)
├── 3  Architecture & Technology Decision Baseline ...... 🟨 Frozen · partially approved
│
├── 4  Phase 1A — Dual-Track Validation & Development Foundation
│   ├── 4.1  Workstream A — Product experience validation (Track A)
│   ├── 4.2  Workstream B — Technical vertical slice (Track B)
│   │        ├── Milestone 1 — Walking Skeleton .......... ⏸ Scope accepted · not authorized
│   │        ├── Milestone 2 — Auth → authz → dashboard .. ⛔ Blocked (ADR-006)
│   │        └── (remaining slice steps — milestone structure NOT yet defined)
│   ├── 4.3  Workstream C — Expert authoring critical path
│   └── 4.4  Workstream D — Business & product decisions
│
├── 5  Phase 1B — Functional MVP (modules M1–M9 + cross-cutting) ... ◻ Future
├── 6  Phase 1C — Pilot Launch & MVP success validation ............ ◻ Future
├── 7  Production Readiness (cross-cutting, gates 5 exit and all of 6)
└── 8  Phase 2 — Post-MVP ......................................... 🚧 Out of scope boundary
```

**Phase names 4, 5 and 6 are the specification's own phase names** (`DATA_AI_ACADEMY_MVP_BUILD_SPEC.md` §10). Phases 1, 2, 3 and 7 are execution groupings introduced by this WBS to describe work that has already happened or that spans phases; they invent no scope.

### 2.2 Status vocabulary for work packages

Decision statuses (`APPROVED` · `PENDING` · `DEFERRED` · `SUPERSEDED`) belong to the architecture baseline and are **not** redefined here. These markers describe **work**, not decisions.

| Marker | Meaning | May a session start it? |
|---|---|---|
| ✅ **Complete** | Delivered and verifiable in the repository | — |
| ▶ **Active** | Explicitly authorized and in progress | Continue within its stated scope |
| ⏸ **Ready — authorization required** | No unresolved dependency; awaits explicit execution authorization | **No** — ask first |
| 🟢 **Ready — may proceed** | No dependency and no gate; owner's discretion | Yes, on instruction |
| ⛔ **Blocked** | A named prerequisite work package is not complete | No |
| ⏳ **Pending decision** | A named decision or open question must be answered first | No |
| 🕓 **Deferred** | Deliberately out of scope until a **recorded trigger** occurs | No — and do not pull forward |
| ◻ **Future** | Belongs to a later phase; scope known from the specifications | No |
| ❓ **Not planned in detail** | Scope exists in the specifications; **no execution plan has been written** | No — plan first, and get the plan accepted |

**Two things a session must never do:** treat ⏸ as 🟢, or treat 🕓 as ◻.

### 2.3 Documentation artifact states — drafted ≠ approved ≠ committed

A document can exist, be relied upon, and still not be safe. **Three independent states must never be collapsed into one**, and a work package that says "✅ Complete" for *authoring* says nothing about the other two.

| State | Marker | What it means | What it does **not** mean |
|---|---|---|---|
| **Drafted** | **D** | The document exists in the working tree and is readable | That anyone has agreed with it |
| **Approved** | **A** | A human explicitly approved it, or the part of it stated in its own approval record, on a stated date | That it is in version control, or that its contents may be implemented — see §5.3 |
| **Committed** | **C** | The content is in **git history** and is therefore recoverable, diffable and attributable | That it is approved, or current |

Notation used below: `D·—·—` means drafted only; `D·A·—` means drafted and approved but **not committed**; `D·A·C` means all three. A dash is a real gap, not a formatting choice.

**Why this is tracked here and not in `docs/architecture/`.** Approval status is an architecture-governance fact and lives in the register. **Whether a file is in git history is a delivery fact** — it is about the safety of the work product, not about what the work product says. It therefore belongs in the execution layer, and it is exactly the kind of gap that goes unnoticed when "the baseline is frozen" is read as "the baseline is safe".

### 2.4 Documentation baseline register

> **⚠️ Finding, 2026-08-30:** `git status` reports **`docs/` as entirely untracked**. Every architecture and execution document below is **drafted, partly approved, and not committed**. The architecture baseline was declared *frozen* on 2026-08-30; freezing is a governance act, and it did not place a single file in git history. A working-tree loss today would lose the whole baseline. This is tracked as WP **1.4** and requires the owner's authorization to resolve — **nothing has been staged or committed**.

| Artifact | D | A | C | Approval state (authoritative source) |
|---|---|---|---|---|
| `CLAUDE.md` | ✅ | ✅ | ✅ | In force — commit `690495c` |
| `AI_DEVELOPMENT_GUARDRAILS.md` | ✅ | ✅ | ✅ | In force — commit `690495c` |
| `DATA_AI_ACADEMY_MVP_BUILD_SPEC.md` | ✅ | ✅ | ✅ | Binding scope contract — commit `39177f2` |
| `DATA_AI_ACADEMY_PORTAL_BLUEPRINT.md` | ✅ | ✅ | ✅ | Authoritative for vision — commit `39177f2` |
| `DATA_AI_ACADEMY_PORTAL_MOCKUP_SPECIFICATION.md` | ✅ | ✅ | ✅ | Authoritative for design language and IA — commit `39177f2` |
| `docs/README.md` | ✅ | — | **❌** | Index; no approval record |
| `docs/architecture/README.md` | ✅ | — | **❌** | Index; marked DRAFT — PENDING HUMAN APPROVAL |
| `docs/architecture/ARCHITECTURE_PRINCIPLES.md` | ✅ | ✅ | **❌** | **APPROVED** 2026-08-30 (ADR-041, ADR-042) |
| `docs/architecture/ARCHITECTURE_DECISION_REGISTER.md` | ✅ | ◐ | **❌** | **PARTIALLY APPROVED** — per-ADR approval records |
| `docs/architecture/ARCHITECTURE_APPROVAL_PACKAGE.md` | ✅ | ◐ | **❌** | PARTIALLY APPROVED 2026-08-30 |
| `docs/architecture/ARCHITECTURE_OVERVIEW.md` | ✅ | ◐ | **❌** | DRAFT; §2.14 approved as ADR-040 |
| `docs/architecture/TESTING_ARCHITECTURE.md` | ✅ | ◐ | **❌** | Layers, tiers and Tier 1 set **APPROVED** (ADR-038) |
| `docs/architecture/TECHNOLOGY_STACK.md` | ✅ | — | **❌** | DRAFT — PENDING HUMAN APPROVAL |
| `docs/architecture/DATA_ARCHITECTURE.md` | ✅ | — | **❌** | DRAFT — PENDING HUMAN APPROVAL |
| `docs/architecture/SECURITY_ARCHITECTURE.md` | ✅ | — | **❌** | DRAFT — PENDING HUMAN APPROVAL |
| `docs/architecture/INTEGRATION_ARCHITECTURE.md` | ✅ | — | **❌** | DRAFT — PENDING HUMAN APPROVAL |
| `docs/architecture/DEPLOYMENT_ARCHITECTURE.md` | ✅ | — | **❌** | DRAFT — PENDING HUMAN APPROVAL |
| `docs/architecture/CONFLICT_RESOLUTION_REGISTER.md` | ✅ | — | **❌** | DRAFT — **no conflict is resolved** |
| `docs/architecture/TECHNOLOGY_DECISION_FRAMEWORK.md` | ✅ | — | **❌** | DRAFT — PENDING HUMAN APPROVAL |
| `docs/architecture/TECHNOLOGY_DECISION_PACKAGE_PHASE_1.md` | ✅ | ◐ | **❌** | Partly approved 2026-08-30 (A, C, D approved; **B pending**) |
| `docs/architecture/DECISION_B_AUTHENTICATION.md` | ✅ | — | **❌** | **RECOMMENDATION ONLY — PENDING HUMAN APPROVAL** |
| `docs/execution/README.md` | ✅ | — | **❌** | Index |
| `docs/execution/MILESTONE_1_EXECUTION_PLAN.md` | ✅ | ◐ | **❌** | **Scope accepted; execution NOT authorized** |
| `docs/execution/PROJECT_PLAN_WBS.md` *(this document)* | ✅ | — | **❌** | DRAFT — pending human review |

**Legend:** ✅ yes · ◐ partial, per the artifact's own approval records · — no · **❌ not in git history**.

**Rules this register imposes:**

1. **Never report a document as "complete" without stating which of the three states it has reached.** A completion report that says the baseline is documented, when none of it is committed, is inaccurate under Guardrail Rule 7.
2. **Approval never implies commitment, and commitment never implies approval.** The two travel independently and are recorded independently.
3. **This register records state; it does not confer it.** Approval state is owned by `docs/architecture/`; commit state is owned by git. If either disagrees with this table, **this table is wrong** and must be corrected from the source.
4. **Re-verify the `C` column against `git status` / `git ls-files` before relying on it.** It is a snapshot of 2026-08-30, not a standing fact.

---

## 3. Phase 1 — Governance & Operating Baseline

**Objective.** Establish binding operating rules for all human and AI work on the project.
**Status: ✅ Complete**, with one open work package (1.4).

| WBS | Work package | Status | Depends on | Blocking decision | Reference | Exit criterion |
|---|---|---|---|---|---|---|
| **1.1** | Operating constitution — 10 non-negotiable rules, approval gates, pre-flight assessment, completion report format | ✅ Complete | — | — | `CLAUDE.md` | Committed and binding on every session |
| **1.2** | Full governance reference — 50 sections covering persistence, security, testing, git, destructive actions, mock discipline | ✅ Complete | 1.1 | — | `AI_DEVELOPMENT_GUARDRAILS.md` | Committed; referenced by `CLAUDE.md` |
| **1.3** | Repository hygiene — technology-neutral `.gitignore`, repository boundary protection, intended remote confirmed | ✅ Complete | — | — | commit `690495c`; Guardrails §47 | `.gitignore` present; remote is `Portal4TrainingCertification` |
| **1.4** | **Persist the documentation baseline in version control** — stage `docs/architecture/` and `docs/execution/` file-by-file, in bounded commits | ⏸ **Ready — authorization required** | 1.3 | — | `MILESTONE_1_EXECUTION_PLAN.md` §5.5(a); AP-09 | Both folders tracked; **no `git add .`**; `Reference Material/` untouched |

**Observation, not an action (WP 1.4).** `git status` reports `docs/` as untracked. The architecture baseline was declared *frozen* on 2026-08-30 but is not yet in git history — **freezing is a governance act and placed nothing in version control**. Until it is committed, the traceability that Rule 9 and AP-09 require rests on the working tree alone, and an accidental loss would take the entire baseline with it. Per-document state is tracked in the **documentation baseline register (§2.4)** under the three-state model in §2.3. `Reference Material/` is also untracked and, per `MILESTONE_1_EXECUTION_PLAN.md` §9 and `README.md` §6, **must not be modified, staged, committed, or added to `.gitignore`**.

---

## 4. Phase 2 — Product Specification Baseline

**Objective.** A stable, authoritative definition of the product to build.
**Status: ✅ Complete** as a baseline. Confirmations remain outstanding (4.4, 4.5).

| WBS | Work package | Status | Depends on | Blocking decision | Reference | Exit criterion |
|---|---|---|---|---|---|---|
| **2.1** | Vision and architecture direction | ✅ Complete | — | — | `DATA_AI_ACADEMY_PORTAL_BLUEPRINT.md` | Authoritative for vision and direction |
| **2.2** | Binding build-scope contract — 9 modules, 15-screen mockup scope, data model, phases, success criteria, DR-01 single credential | ✅ Complete | 2.1 | — | `DATA_AI_ACADEMY_MVP_BUILD_SPEC.md` | Declared *"Scope contract. Binding."*; supersedes Blueprint §19–21 for build purposes |
| **2.3** | Design language and information architecture | ✅ Complete | 2.1 | — | `DATA_AI_ACADEMY_PORTAL_MOCKUP_SPECIFICATION.md` | Authoritative for design language and IA |
| **2.4** | **Confirm the ten specification conflicts** CONF-1…CONF-10 | ⏳ **Pending decision** | 2.1–2.3 | Owner confirmation | `../architecture/CONFLICT_RESOLUTION_REGISTER.md` | Each conflict confirmed or overridden; Blueprint position retained as the recorded future destination |
| **2.5** | **The six business decisions** — naming · launch domain scope · individual-vs-corporate first · pricing and exam/artifact split · assessor sourcing · HRD Corp programme scope | ⏳ **Pending decision** | 2.3 | Owner decision | Mockup Spec §20.6 | Six answers recorded; naming and pricing consequences reflected where they touch architecture (ADR-039, commerce model) |

**Note on 2.4.** CONF-1, CONF-3 and CONF-8 are *implicitly* settled by the approvals of ADR-010, ADR-004 and ADR-001. The approval package asks that they be confirmed explicitly so the Blueprint's positions are recorded as **deliberately deferred rather than overlooked**. CONF-2 and CONF-5 additionally carry a correctness/honesty dimension.

---

## 5. Phase 3 — Architecture & Technology Decision Baseline

**Objective.** A frozen, documented, partially approved architecture baseline sufficient to begin implementation.
**Status: 🟨 Frozen · partially approved.** Architecture exploration is **closed** — see the freeze notice in the register. Do not restart discovery.

### 5.1 Architecture documentation work packages

| WBS | Work package | Status | Depends on | Reference | Exit criterion |
|---|---|---|---|---|---|
| **3.1** | Architecture principles **AP-01…AP-12** | ✅ Complete — **APPROVED** (ADR-041, ADR-042) | 2.1–2.3 | `../architecture/ARCHITECTURE_PRINCIPLES.md` | Twelve principles adopted as durable project principles |
| **3.2** | System architecture overview, component model, module dependency order, dual-track model | ✅ Complete — DRAFT status | 3.1 | `../architecture/ARCHITECTURE_OVERVIEW.md` | Documented; §2.14 dual track approved as ADR-040 |
| **3.3** | Architecture Decision Register — ADR-001…ADR-042 | ✅ Complete — **partially approved** | 3.1, 3.2 | `../architecture/ARCHITECTURE_DECISION_REGISTER.md` | Every decision carries a state and, where approved, an approval record with scope |
| **3.4** | Conceptual data architecture — domains, entities, ownership, classification, Service Restart Test analysis | ✅ Complete — DRAFT | 3.3 | `../architecture/DATA_ARCHITECTURE.md` | Conceptual only. **No physical schema exists and none may be created there** |
| **3.5** | Security & compliance architecture | ✅ Complete — DRAFT | 3.3 | `../architecture/SECURITY_ARCHITECTURE.md` | Documented; residency inputs enumerated for verification |
| **3.6** | Integration architecture — I-1…I-20, boundaries, failure handling | ✅ Complete — DRAFT | 3.3 | `../architecture/INTEGRATION_ARCHITECTURE.md` | Documented; providers deliberately open |
| **3.7** | Deployment architecture — model, environments, infrastructure, scalability, backup, monitoring | ✅ Complete — DRAFT | 3.3 | `../architecture/DEPLOYMENT_ARCHITECTURE.md` | Documented; hosting open |
| **3.8** | Testing architecture — five layers, risk tiers, **Tier 1 critical workflows**, restart resilience as an executable test | ✅ Complete — **APPROVED** (ADR-038) | 3.3 | `../architecture/TESTING_ARCHITECTURE.md` | Layers, tiers and the Tier 1 set approved; frameworks approved separately (ADR-025) |
| **3.9** | Technology Decision Framework — repeatable 8-step process and comparison template | ✅ Complete — **PENDING approval** | 3.1 | `../architecture/TECHNOLOGY_DECISION_FRAMEWORK.md` | Process documented; the process itself awaits approval |
| **3.10** | Phase 1 technology decision package — ORM · authentication · testing · local PostgreSQL | ✅ Complete — **3 of 4 approved** | 3.9 | `../architecture/TECHNOLOGY_DECISION_PACKAGE_PHASE_1.md` | A, C, D approved; **B pending** |
| **3.11** | Authentication full analysis — cost/AP-12 fit, identity architecture, portability, maturity, complexity | ✅ Complete — **RECOMMENDATION ONLY** | 3.10 | `../architecture/DECISION_B_AUTHENTICATION.md` | Analysis complete; **B1/B2/B3 pending** |
| **3.12** | Conflict resolution register | ✅ Complete — PENDING confirmation | 2.4 | `../architecture/CONFLICT_RESOLUTION_REGISTER.md` | Ten conflicts recorded with recommended resolutions |
| **3.13** | Consolidated approval package and decision state | ✅ Complete — **PARTIALLY APPROVED** | 3.1–3.12 | `../architecture/ARCHITECTURE_APPROVAL_PACKAGE.md` | Approved / pending / proposed / deferred / excluded, each enumerated |
| **3.14** | Documentation separation — `architecture/` vs `execution/`, with indexes | ✅ Complete | 3.13 | `../README.md`, `../architecture/README.md`, `README.md` | Boundary test documented and applied |

### 5.2 Decision-state summary — execution view only

**Authoritative status lives in the register.** This table exists so a session can see *what it means for sequencing*, not to restate the decisions.

| Group | ADRs | What it unblocks | Execution consequence |
|---|---|---|---|
| **Approved — foundational direction** | 001 · 002 · 004 · 005 · 020 · 022 · 023 · 036 · 039 · 040 | The shape of Milestone 1 and the whole slice | Sufficient to plan; **never sufficient to install, initialise, provision or commit** |
| **Approved — implementation prerequisites** | 007 (Prisma 7.x, direction only) · 025 (Vitest · Playwright · axe, scoped) · 005a **local dev only** | Milestone 1 in full | Package installation remains a separate RED gate per package |
| **Approved — principles / policy only** | 010 · 017 · 029 · 030 · 031 · 035 · 037 · 038 · 041 · 042 · 003 (direction only) | Design and planning | **No vendor, product, platform or infrastructure is approved by any of these** |
| **Approved — sequencing rule** | 032 (rule only) | Local dev, local and automated testing, non-production prototypes | The **residency answer itself remains open** and blocks production data infrastructure |
| **Pending human decision** | **006 (B1/B2/B3)** · 005a production host · 016 hosting · 032 residency answer | Milestone 2 · deployment · production data | Blocked work must not be presented as ready |
| **Analysed, not yet reviewed** | 011 · 012 · 018 · 019 · **021** · 024 · 026 · 027 · 033 · 034 | Later modules | ADR-021 (server-authoritative exam clock) warrants early attention — it governs exam durability |
| **Deferred with triggers** | 008 · 009 · 013 · 014 · 015 · 016 · 018 · 019 · 021 · 024 · 026 · 033 · 034 · 011 · 012 | — | See §8. Triggers, not schedules |
| **Superseded** | 028 → superseded by **036** | — | Retained for history; never deleted |
| **Explicitly excluded** | Paid Prisma products · paid testing platforms/grids/visual-regression SaaS · Vercel Hobby for this product · any auth provider's org/roles as the authorization source · building authentication in-house · Redis · graph DB · event bus · dedicated vector store · microservices · LRS/xAPI/SCORM · proctoring vendor · badge signing infrastructure · automated credential decisions · currencies beyond MYR/USD | — | Each requires separate approval to revisit, with an AP-11 justification |

### 5.3 Standing rule that overrides every approval above

> **No approval on this project authorises:** initialising a framework · installing a package · creating a database · creating a schema · provisioning hosting or cloud services · creating external service accounts · configuring production infrastructure · deploying · committing · pushing.
>
> Each is a separate action requiring approval **at the moment it is performed**.
> — `../architecture/ARCHITECTURE_APPROVAL_PACKAGE.md`; `../architecture/README.md` §10.1

---

## 6. Phase 4 — Phase 1A · Dual-Track Validation & Development Foundation

**Objective (ADR-040).** Validate **two different risks in parallel**: *does anyone want this* (Track A) and *do the foundations hold* (Track B). **Neither track may be reported as satisfying the other's criteria.** Alongside both runs the specification's stated real critical path — expert authoring (Workstream C).

**Indicative duration:** ~5–7 weeks for the Track A mockup scope (MVP Spec §10). **No duration is documented for Track B** and none is invented here.

**Phase 4 status: ⏸ Not started — no work in this phase is authorized.**

### 6.1 Workstream 4.1 — Track A · Product experience validation

**Purpose.** Validate whether users understand, value and can navigate the key proposition and the critical experiences. Centre of gravity: `P06` · `K06` · `K08` · `P16` — the four screens the specification says carry the entire argument.

| WBS | Work package | Status | Depends on | Blocking decision | Reference | Exit criterion |
|---|---|---|---|---|---|---|
| **4.1.0** | 🔴 **Resolve the unresolved Track A start-condition conflict** — the approval package's *"blocks on nothing"* against Mockup Spec §20.6's *"before design begins"*. **Not to be resolved by AI interpretation** | ⏳ **Pending decision — conflict UNRESOLVED** | — | **Human direction required** | **§1.4** | An explicit recorded human ruling on which condition governs Track A's start; the losing source document corrected in its own folder |
| **4.1.1** | Design tokens + the five signature components — `CredentialCard`, `SkillMeter`, `MilestoneTimeline`, `RubricPanel`, diagnostic question canvas; light + dark | ⏳ Pending decision | 4.1.0 | 2.5 #1 naming | MVP Spec §10 wk1; ADR-003 (direction only) | The five exist before any screen. **Any UI package remains individually gated** |
| **4.1.2** | Screens `P01` · `P05` · `P06` — the promise and the gap | ◻ Future | 4.1.1 | — | MVP Spec §10 wk2 | Screens produced to the §7 scope |
| **4.1.3** | Screens `L01` · `C05` · `L05` — workspace and learning | ◻ Future | 4.1.1 | — | MVP Spec §10 wk3 | As above |
| **4.1.4** | Screens `P15` · `K05b` · `K06` — the offer and the evidence gate. **`K06` gets the most iteration of any screen** | ◻ Future | 4.1.1, 4.3.4, 4.3.5 | — | MVP Spec §10 wk4 | `K06` iterated against the **real** brief and rubric |
| **4.1.5** | Screens `K08` · `K10` · `P16` · `A03` — judgement, award, verification | ◻ Future | 4.1.1 | — | MVP Spec §10 wk5 | As above |
| **4.1.6** | Screens `O01` · `O10` · responsive passes · modal states | ◻ Future | 4.1.1 | 2.5 #6 HRD scope | MVP Spec §10 wk6 | `O10` reflects the real evidence-pack contents |
| **4.1.7** | Prototype wiring · **test with 8–10 real people** · revise | ◻ Future | 4.1.2–4.1.6 | — | MVP Spec §10 wk7 | The §7 clickable path runs end to end |
| **4.1.8** | **Track A exit gate** | ◻ Future | 4.1.7 | — | MVP Spec §10; ADR-040 | All four hold: 5 strangers articulate the difference unprompted · 3 target-persona learners say `P06` told them something new · 1 corporate buyer asks the price · **the owner is willing to be judged on `K06`** |

**Faking discipline (AP-07, MVP Spec §11).** In Phase 1A, fake the *machinery* — tutor responses, adaptivity, proficiency numbers, path generation, corporate fixtures, AI pre-assessment, video, search, payments, badge verification, exam timer. **Never fake the judgement** — the artifact brief, the rubric, the three exemplars, the assessor's written feedback, the `P06` gap statements, article content, HRD Corp pack contents. Anything stubbed is visibly labelled and structurally isolated.

### 6.2 Workstream 4.2 — Track B · Technical vertical slice

**Purpose (ADR-036, scoped by ADR-040).** Prove the production architecture through the smallest meaningful real end-to-end workflow, ending in **verified restart resilience** and **automated tests**.

**The documented slice** (`../architecture/ARCHITECTURE_OVERVIEW.md` §2.14):

```
authentication → authorization → dashboard → training discovery / selection
  → enrolment → access to a real lesson → progress persistence
  → SERVICE RESTART RESILIENCE → APPROPRIATE AUTOMATED TESTING
```

> **Scope discipline is Track B's main risk.** A vertical slice that grows sideways stops being a slice. The line above is the boundary. Scope expansion **stops work** and returns to planning.

#### Milestone 1 — Walking Skeleton

| WBS | Work package | Status | Depends on | Blocking decision | Reference | Exit criterion |
|---|---|---|---|---|---|---|
| **4.2.1** | **Milestone 1 — Walking Skeleton.** One thin path through every approved layer: container → database → migration → seed → repository → route → rendered page → test | ⏸ **Ready — authorization required** · scope accepted | 3.x approvals (001, 002, 004, 005, 005a-local, 007, 023, 025, 029, 038) | **None architectural** — execution authorization only | [`MILESTONE_1_EXECUTION_PLAN.md`](MILESTONE_1_EXECUTION_PLAN.md) | Its §8 — all ten pass/fail criteria, **especially 7 and 8, the restart proofs** |
| 4.2.1a | RED gate — initialise Next.js App Router + TypeScript at the repository root | ⏸ Authorization required | 4.2.1 authorized | — | Plan §5.1 | Framework present; nothing beyond the plan's scope |
| 4.2.1b | RED gate — install **only** the §5.2 pinned set | ⏸ Authorization required | 4.2.1a | — | Plan §5.2 | Criterion 10: no package installed beyond the list |
| 4.2.1c | RED gate — start a local PostgreSQL container (non-production, synthetic data only) | ⏸ Authorization required | 4.2.1b | Permitted under the ADR-032 **sequencing rule** | Plan §5.3 | Criterion 1 |
| 4.2.1d | 🔴 **RED gate — create the first schema: one table, `domains`** | ⏸ Authorization required | 4.2.1c | **`CLAUDE.md` Rule 1** | Plan §5.4 | Criterion 2: exactly the approved columns, nothing more |
| 4.2.1e | Migration · seed file · repository function · route · three tests · npm scripts · `.gitignore` additions | ⏸ Proceeds once 4.2.1 is authorized | 4.2.1d | — | Plan §6, §7 | Criteria 3–6, 9 |
| 4.2.1f | RED gate — two bounded commits, staged file-by-file | ⏸ Authorization required | 4.2.1e, 1.4 | — | Plan §5.5 | **No `git add .`**; every staged file verified as belonging to this project |
| 4.2.1g | Completion report in the standard format | ⏸ Follows execution | 4.2.1e | — | `CLAUDE.md`; `README.md` §5 | Status distinguishes Implemented · Tested · Partially tested · Blocked · Requires human validation |

#### Milestone 2 — Authentication → authorization → dashboard

| WBS | Work package | Status | Depends on | Blocking decision | Reference | Exit criterion |
|---|---|---|---|---|---|---|
| **4.2.2** | **Milestone 2 — the first real steps of the slice.** Authentication, scoped RBAC enforced at the service and data-access layer, dashboard | ⛔ **Blocked** · ❓ not planned in detail | 4.2.1 complete | **ADR-006 — B1 · B2 · B3** | `README.md` §4; `../architecture/DECISION_B_AUTHENTICATION.md` | To be defined in a Milestone 2 execution plan **before** any execution |
| 4.2.2a | Write the Milestone 2 execution plan (scope · approved decisions relied on · RED gates · deliverables · pass/fail criteria) | ⏳ Pending decision | ADR-006 decided | ADR-006 | `README.md` §5 | Plan reviewed; **scope acceptance recorded separately from execution authorization** |
| 4.2.2b | Identity mapping pattern — our own immutable UUID as business identity; provider subjects confined to `auth_identities`; no business table references a provider ID | ⏳ Pending decision | 4.2.2a | ADR-006 B3 condition 3 | Decision B §B; ADR-020; AP-04 | Enforced in code and covered by tests |
| 4.2.2c | Authorization enforcement — `user_roles` in our PostgreSQL as the **only** authorization source of truth, with negative cases tested | ⏳ Pending decision | 4.2.2a | ADR-006 B3 condition 2 | ADR-020; AP-04; Testing Arch Tier 1 #2 | Tier 1 workflow #2 covered end to end, negative cases included |

#### Remaining Track B slice steps — **future milestone structure to be defined**

> **No milestone is defined here, and this document does not create one.**
>
> The *work* below is documented: it is the remainder of the ADR-040 slice, listed in the order `../architecture/ARCHITECTURE_OVERVIEW.md` §2.14 states it. **No approved document defines any milestone beyond Milestone 2**, and the WBS is not authoritative for creating one.
>
> The rows are therefore **tracked work packages showing a documented sequencing relationship** — not a milestone, not a delivery commitment, and not a scope definition. How this work is grouped into one or more milestones is **an open planning question for the owner**, to be answered after Milestone 2, and then written up as an accepted execution plan in the same way Milestone 1 was.

| WBS | Work package | Status | Depends on | Blocking decision | Reference | Exit criterion |
|---|---|---|---|---|---|---|
| **4.2.3** | Training discovery / selection — content read through a `domainId` parameter, rendered from data, **no domain literal anywhere** | ❓ Not planned in detail | 4.2.2 | — | ADR-023; Overview §2.14 | Grep proof returns zero hits outside seed files and content |
| **4.2.4** | Enrolment — a real transactional write; the first business record | ❓ Not planned in detail | 4.2.3 | — | ADR-005; AP-02 | Record persists and is reconcilable |
| **4.2.5** | Access to a real lesson — content model with a **provider-neutral video reference**, degrading transcript-first | ❓ Not planned in detail | 4.2.4 | ADR-009 stays **deferred** — no provider is selected here | ADR-002; ADR-009 | A lesson renders without any video provider being chosen |
| **4.2.6** | Progress persistence — resume from the database, never from browser storage | ❓ Not planned in detail | 4.2.5 | — | AP-05 | Resume verified from a cold client |
| **4.2.7** | **Service restart resilience** — drive to a partial state, restart with caches cleared, assert correct resumption and that queued work still executes | ❓ Not planned in detail | 4.2.6 | Autosave tolerance **OQ-11** informs the assertion | Testing Arch §6; AP-02/03/05 | The Service Restart Test is **executable**, not asserted |
| **4.2.8** | Automated testing across the slice at the layer that can prove each rule | ❓ Not planned in detail | 4.2.7 | — | ADR-038; ADR-025 | Tier 1 rules touched by the slice are covered |
| **4.2.9** | **Track B exit gate** | ❓ Not planned in detail | 4.2.8 | — | ADR-040 | The workflow runs end to end on real infrastructure, survives a full restart, and is covered by appropriate automated tests |

### 6.3 Workstream 4.3 — Expert authoring critical path

> **The specification is explicit: this, not engineering, is what actually gates the pilot** (MVP Spec §9 team reality check, §10). It must run **in parallel** with both tracks, not after them. Three of these are the owner's to write.

| WBS | Work package | Status | Depends on | Blocking decision | Reference | Exit criterion |
|---|---|---|---|---|---|---|
| **4.3.1** | **Skill list** — ~35 skills in the pilot domain, grouped by area, flat (no DAG, no decay, no altitude matrix) | 🟢 Ready — may proceed | — | CONF-9 notes a 40–60 vs ~35 count difference; low impact | MVP Spec M2; CONF-9 | ~35 skills authored and grouped |
| **4.3.2** | **Diagnostic questions** — 20 scenario questions, each mapped to 1–2 skills, "I'm not sure" as an equal-weight unpenalised option, two branch points | 🟢 Ready — may proceed | 4.3.1 | — | MVP Spec M2 | 20 authored and mapped |
| **4.3.3** | **Item bank** — 60 fixed items for the knowledge assessment | 🟢 Ready — may proceed | 4.3.1 | — | MVP Spec M5 | 60 items authored against skills |
| **4.3.4** | **Artifact brief + 3 hand-written industry variants** | 🟢 Ready — may proceed | 4.3.1 | — | MVP Spec M6, §11.2 | Real, not lorem ipsum. **Never faked** |
| **4.3.5** | **The rubric** — 5 criteria × 4 achievement levels; carries all grade differentiation in V1 | 🟢 Ready — may proceed | 4.3.4 | — | MVP Spec M6, §11.2 | Real descriptors. *"The hardest product work in the project and it cannot be deferred"* |
| **4.3.6** | **Three real exemplar artifacts** at Competent / Proficient / Distinguished | 🟢 Ready — may proceed | 4.3.5 | — | MVP Spec M6, §11.2 | *Non-negotiable. Cannot be faked and cannot be deferred* |
| **4.3.7** | **20–30 knowledge articles** — the Data Foundations canon; also the tutor's corpus and the SEO surface | 🟢 Ready — may proceed | 4.3.1 | — | MVP Spec M4, §11.2 | Written once, properly. **Must exist before M8 can** |
| **4.3.8** | Glossary — ~60 terms | 🟢 Ready — may proceed | 4.3.7 | — | MVP Spec M4 | Authored |
| **4.3.9** | **Restructure the 8 Data Blueprint modules** into the curated path — 6–8 courses → modules → lessons → blocks | 🟢 Ready — may proceed | 4.3.1 | — | MVP Spec M3, §10 | Path structure defined against existing material |
| **4.3.10** | **Recruit and onboard 3–5 assessors** — *"the launch dependency, started in 1A, not here"* | ⏳ Pending decision | — | 2.5 #5 assessor sourcing | MVP Spec §10 Phase 1C item 1 | 3–5 identified; ≥2 other than the founder calibrated by 1C exit (§12.4) |

### 6.4 Workstream 4.4 — Business & product decisions

| WBS | Work package | Status | Depends on | Blocking decision | Reference | Blocks |
|---|---|---|---|---|---|---|
| **4.4.1** | Platform and credential naming | ⏳ Pending | — | Owner | Mockup §20.6 #1 | 4.1.1 design start · permanent verification identity presentation (ADR-039) |
| **4.4.2** | Launch domain scope | ⏳ Pending | — | Owner | Mockup §20.6 #2 | Homepage, catalogue, navigation |
| **4.4.3** | Individual vs corporate first | ⏳ Pending | — | Owner | Mockup §20.6 #3 | Track A screen emphasis; commercial sequencing |
| **4.4.4** | Credential pricing and the exam/artifact fee split | ⏳ Pending | — | Owner | Mockup §20.6 #4 | `P15`, `K03`; commerce model; the §12.2 assessor-cost ratio |
| **4.4.5** | Assessor sourcing | ⏳ Pending | — | Owner | Mockup §20.6 #5 | 4.3.10; whether the 10-day SLA is a promise or a liability |
| **4.4.6** | HRD Corp programme scope | ⏳ Pending | — | Owner | Mockup §20.6 #6 | `O10`, `P18`; interacts with **OQ-8** (verified e-TRIS requirements) |
| **4.4.7** | Refund, cancellation and withdrawal policy per product type | ⏳ Pending | — | Owner | **OQ-9** | Commerce design. *Legally required and entirely absent from the specifications* |
| **4.4.8** | Accommodations approval ownership and published policy | ⏳ Pending | — | Owner | **OQ-15** | `K03`. Called *"the most serious omission"* in the specifications |

### 6.5 Phase 4 exit

Phase 4 is complete when **both** gates are recorded **separately**: **4.1.8** (Track A) and **4.2.9** (Track B). Per ADR-040, a working slice is not evidence that anyone wants the product, and enthusiastic user feedback is not evidence that anything survives a restart.

---

## 7. Phase 5 — Phase 1B · Functional MVP

**Objective.** Build the 30 `P0` screens against real data, sequenced **by dependency, not by screen glamour**.
**Indicative duration:** ~10–12 weeks (MVP Spec §10).
**Status: ◻ Future — not planned in detail.** Each block below needs its own milestone execution plan before any work begins.

### 7.1 Module work packages

Sequencing follows `../architecture/ARCHITECTURE_OVERVIEW.md` §1.7 and MVP Spec §10.

| WBS | Block / module | Indicative weeks | Status | Depends on | Blocking decisions | Reference |
|---|---|---|---|---|---|---|
| **5.1** | **Foundations** — M1 identity, scoped roles from day one, schema, admin CRUD, payments | 1–2 | ◻ Future | 4.2 (slice proves the foundation) | **ADR-006** · **ADR-014 payments (deferred, trigger reached here)** · **OQ-2** payment rail · **OQ-9** refunds | MVP Spec M1, §10 |
| **5.2** | **Content & learning** — M3 content model, `C02`, `C05`, progress, `P10`, `P12` | 3–5 | ◻ Future | 5.1, 4.3.9 | **ADR-009 video (trigger: real lesson content exists)** · ADR-026 content versioning | MVP Spec M3 |
| **5.3** | **Skills & diagnostic** — M2 skills, `P05`, `P06`, `skill_assertions` (insert-only), `L05`, `L01`, `L04` | 5–6 | ◻ Future | 5.1, 4.3.1, 4.3.2 | — | MVP Spec M2; ADR-022 |
| **5.4** | **Assessment** — M5 items, forms, `K05a/b`, threshold scoring at 70%, `K01`, `K03` | 7–8 | ◻ Future | 5.3, 4.3.3 | **ADR-021 server-authoritative exam clock — analysed, not yet reviewed** · ADR-019 integrity model · **OQ-11** autosave tolerance | MVP Spec M5 |
| **5.5** | **Evidence** ★ — M6 `K06`, `A01`, `A03`, `K08`. **The core — do not compress this** | 8–10 | ◻ Future | 5.4, 4.3.4, 4.3.5, 4.3.6 | **ADR-008 object storage (trigger: artifact submission is built)** | MVP Spec M6 |
| **5.6** | **Credentials** — M7 `credential_defs`, requirements-as-data, issuance, `K10`, `L09`, **`P16`** | 10–11 | ◻ Future | 5.4, 5.5 | **ADR-018 verification model** · **OQ-5** verification domain · **OQ-12** deletion vs permanence | MVP Spec M7; ADR-039 |
| **5.7** | **Corporate** — M9 `O01`, `O02`, `O07`, **`O10`** evidence pack | 11–12 | ◻ Future | 5.1, 5.2, 5.4, 5.5, 5.6 | **ADR-033 evidence pack as a job** · **OQ-8** verified HRD Corp / e-TRIS requirements · 4.4.6 | MVP Spec M9 |
| **5.8** | **Knowledge library + AI tutor** — M4 `N03` corpus and changelog, then the RAG tutor `L14` | throughout | ◻ Future | 4.3.7, 4.3.8; **M4 before M8** | **ADR-012 search** · **ADR-013 AI provider (trigger: the corpus exists)** · **OQ-4** data-processing agreement | MVP Spec M4, M8 |
| **5.9** | **Cross-cutting** — transactional email · basic admin CRUD · **audit log on credential and assessment actions** · error tracking · funnel analytics · **externalised UI strings** | throughout | ◻ Future | 5.1 | **ADR-015 email** · **ADR-034 notifications** · **ADR-017 vendors** · ADR-035 · ADR-027 · **OQ-3** sending domain · **OQ-16** audit scope | MVP Spec §2 cross-cutting |
| **5.10** | **Non-negotiable engineering rules** enforced from commit one — `organisation_id` on every org-scoped table · insert-only `skill_assertions` and `responses` · audit row per credential/assessment mutation · single home for UI strings · assessor conflict-of-interest check in code · **no domain or credential-level literal anywhere** · assessment content unreadable at the query layer by non-assessor roles | throughout | ◻ Future | 5.1 | — | MVP Spec §9; ADR-020, 022, 023 |
| **5.11** | **Tier 1 critical-workflow test coverage** — the nine named workflows plus the two recommended additions (artifact submission and assessor evaluation; evidence pack generation) | throughout | ◻ Future | each owning block | **OQ-18** release gate · **OQ-19** coverage expectation | Testing Arch §5; ADR-038 |

### 7.2 Phase 5 exit criteria

**From MVP Spec §10:** one person can complete the §5 user journey end to end **on production**, and one internal cohort has run through it fully.

**Therefore Phase 5 cannot exit without Phase 7 (Production Readiness).** The word *production* in that criterion pulls in the residency answer, hosting, the production database host, backups and the rehearsed restore.

---

## 8. Phase 6 — Phase 1C · Pilot Launch & MVP success validation

**Objective.** **Not a public launch. One real paying cohort.**
**Indicative duration:** ~8–10 weeks (MVP Spec §10).
**Status: ◻ Future — not planned in detail.**

| WBS | Work package | Status | Depends on | Blocking decision | Reference |
|---|---|---|---|---|---|
| **6.1** | 3–5 assessors recruited, onboarded and calibrated | ◻ Future | 4.3.10 (**started in 1A, not here**) | 4.4.5 | MVP Spec §10 |
| **6.2** | Deliver one corporate cohort (15–25 people) end to end, ideally HRD Corp claimable | ◻ Future | Phase 5 complete, 6.1, Phase 7 | 4.4.6, **OQ-8** | MVP Spec §10 |
| **6.3** | Run the full evidence cycle — exam → artifact → assessment → credential → verification → claim pack | ◻ Future | 6.2 | — | MVP Spec §10 |
| **6.4** | Add `P1` screens **only as the pilot proves they are needed** | ◻ Future | 6.3 | — | MVP Spec §10 — *"not before"* |
| **6.5** | Instrument everything in §12 from day one of the cohort | ◻ Future | Phase 5 §5.9 | ADR-017 vendors · ADR-035 constraint | MVP Spec §10, §12 |
| **6.6** | Re-evaluate the authentication provider before public launch, if Better Auth was selected | ◻ Future | ADR-006 B2 = Better Auth | ADR-006 B3 condition 5 | Decision B §Recommendation |
| **6.7** | Penetration test, if required before the first corporate sale | ⏳ Pending decision | — | **OQ-17** | Security Arch §12 |
| **6.8** | Optional if cheap — Open Badges 3.0 issuance via a third-party issuer | 🕓 Deferred | 5.6 | ADR-018; **do not claim OB3.0 conformance before it is true** | MVP Spec §10, CONF-5 |

### 8.1 MVP success criteria — the completion definition

**Phase 2 begins only when these are met** (MVP Spec §12). They are business and operational outcomes, not engineering deliverables — the software can be complete while these remain unmet.

| Gate | Criterion | Target |
|---|---|---|
| **G1** | **Artifact submission rate** — registered candidates who actually submit | **≥ 60%** — *"the single most important number in the business"* |
| **G2** | **Employer recognition** — named employers who would treat the credential as a hiring signal | **≥ 3** |
| **G3** | **Assessment SLA** — credential-bearing artifacts assessed within 10 working days | **≥ 90%** |

| Category | Criteria |
|---|---|
| **Commercial** | ≥1 paying corporate cohort delivered end to end (2 is better) · ≥25 individual paying learners · 1 HRD Corp claim submitted **and accepted** using a generated pack · 1 customer commits to a second cohort · assessor cost **< 25%** of credential fee |
| **Product** | Diagnostic→account ≥25% · path completion ≥50% · first lesson within 24h ≥60% · ≥70% rate the artifact requirement a strength · ≥3 verification page views per issued credential |
| **Trust** | **≥2 assessors other than the founder**, calibrated and active · ≥95% decisions accepted without dispute · 0 unresolved integrity incidents |

**Honest failure conditions (§12.5) — if any occurs, stop and redesign rather than adding features:** G1 below 40% · G3 below 70% · zero employer recognition after six months · assessor cost above 40% of fee.

---

## 9. Phase 7 — Production Readiness *(cross-cutting)*

**Why this is its own phase.** Production readiness is not a stage that happens after Phase 5; it is a set of gates that must be cleared **before Phase 5 can exit** (its exit criterion says *"on production"*) and before any of Phase 6 can run. Grouping it here keeps it from being discovered late.

**Status: ⛔ Blocked at the top of the chain by the ADR-032 residency answer.**

| WBS | Work package | Status | Depends on | Blocking decision | Reference | Exit criterion |
|---|---|---|---|---|---|---|
| **7.1** | **Resolve data residency** — verify and classify the seven inputs as legal/regulatory, contractual/customer, or risk-management. **No residency requirement may be assumed in either direction** | ⏳ **Pending decision** | — | **ADR-032 · OQ-6** | Security Arch §11.1 | A recorded, evidence-based answer |
| **7.2** | **Select the hosting model** — ⚠️ Vercel Hobby is non-commercial only and is Tier 3 in disguise; free-tier and self-hostable options evaluated first under AP-12 | ⏳ Pending decision | 7.1 | **ADR-016** | Register; AP-12 | Decision made under the Technology Decision Framework, with all five mandatory elements |
| **7.3** | **Select the production PostgreSQL host** — Neon vs Supabase vs RDS | ⏳ Pending decision | 7.1, 7.2 | **ADR-005a production portion** | Register | As above |
| **7.4** | Provision dev / staging / production environments; forward-only reviewed migrations; seed data outside migrations | ⛔ Blocked | 7.1–7.3 | ADR-029 is **policy only — no provisioning approved** | ADR-029 | Three environments exist; payments, email and issuance exercisable without touching real credentials |
| **7.5** | Secret management — per-environment store, `.env.example` names only, rotation without code change, never in logs or bundles | ⛔ Blocked | 7.4 | ADR-030 is **principles only — the store is open** | ADR-030 | Store selected and in use |
| **7.6** | **Backups, PITR, object versioning and a REHEARSED restore**; DB/object reconciliation procedure | ⛔ Blocked | 7.3, 7.4 | ADR-031 **principles only**; **OQ-10** RPO/RTO targets | ADR-031 | *An unrehearsed backup is an assumption, not a control* — the restore is actually performed |
| **7.7** | Observability — error tracking · funnel analytics including artifact submission rate · **SLA instrumentation** · job health · uptime **including the verification page** | ⛔ Blocked | 7.4 | ADR-017 **all vendors open**; constrained by **ADR-035** | ADR-017, ADR-035 | NFR-5/NFR-6 measurable; no session replay on assessment, artifact or evaluation screens |
| **7.8** | **Credential verification domain** — with an engineered redirect/migration path | ⏳ Pending decision | 4.4.1 | **OQ-5** | ADR-039; Deployment Arch §4 | Domain chosen **before the first real credential issuance** |
| **7.9** | Transactional email sending domain with SPF/DKIM/DMARC | ⏳ Pending decision | — | **ADR-015 · OQ-3** | Technology Stack §5 | Domain and provider chosen; deliverability is on the SLA path |
| **7.10** | Release gate policy — must the Tier 1 set pass before **every** production deploy, or only at phase milestones? | ⏳ Pending decision | — | **OQ-18** | Testing Arch §10 | Recorded policy; folded into the Definition of Done |
| **7.11** | Retention periods for each data class | ⏳ Pending decision | — | Data Arch §7.1 — every duration is an **`[ASSUMPTION]` requiring human decision** | Data Arch §7.1 | Durations decided and recorded |
| **7.12** | Account deletion vs credential permanence — exactly what survives on the public verification page | ⏳ Pending decision | — | **OQ-12** | Data Arch §7.1 | PDPA obligation reconciled with the permanence promise |
| **7.13** | Re-verify every external fact a technology recommendation rests on — pricing, licensing, versions, free-tier thresholds, stable-release status | ⛔ Blocked until acted on | any of 7.2, 7.3, 7.9 | — | `../architecture/README.md` §11 | *A recommendation is a snapshot, not a standing conclusion* |

---

## 10. Phase 8 — Post-MVP boundary

**Not planned. Recorded so it is not accidentally started.** Phase 2 begins **only** when the §12 MVP success criteria are met.

Everything the specifications defer sits behind this boundary: a second domain · a credential ladder or levels · CPD and renewal · community, chapters, events, marketplace · mobile app · SSO/SCIM/HRIS · LTI · xAPI/LRS/SCORM · Open Badges 3.0 / W3C Verifiable Credentials · proctoring · adaptive engine · service extraction · notification centre · heatmaps and benchmarking. **Each remains governed by AP-10 and AP-11: it returns only with a current functional requirement, a demonstrated limitation, or a measurable operational need — never because it is next on a list.**

---

## 11. Dependency map and critical path

### 11.1 Phase-level dependencies

```
1 Governance ✅ ──▶ 2 Specification ✅ ──▶ 3 Architecture baseline 🟨
                                                     │
                          ┌──────────────────────────┼──────────────────────────┐
                          ▼                          ▼                          ▼
              4.1 Track A (validation)     4.2 Track B (slice)       4.3 Expert authoring
              🔴 §1.4 conflict UNRESOLVED     ⏸ M1 authorization         🟢 may proceed
                 + ⏳ 2.5 decisions           ⛔ M2 = ADR-006                  │
                          │              ❓ beyond M2: no milestone defined    │
                          └──────────┬───────────────┴──────────────────────────┘
                                     ▼
                          5 Phase 1B — Functional MVP ◻
                                     │
                                     ├────────▶ 7 Production Readiness ⛔ (ADR-032 → 016 → 005a)
                                     ▼                    │
                          6 Phase 1C — Pilot Launch ◻ ◀───┘
                                     ▼
                          §12 MVP success criteria met
                                     ▼
                          8 Phase 2 — post-MVP boundary 🚧
```

### 11.2 Hard build-order dependencies

From `../architecture/ARCHITECTURE_OVERVIEW.md` §1.7 (`[INFERENCE]` from MVP Spec §10):

1. **M1 before everything** — scoped roles and tenancy are foundational.
2. **M4 before M8** — the tutor cannot retrieve from a corpus that does not exist.
3. **M2 skill list before M3 content mapping** — skills are the spine content, items and requirements attach to.
4. **M5 and M6 before M7** — issuance evaluates their outputs as requirement rows.
5. **M9 depends on all of the above** for its progress table and evidence pack, but on **none** of them for orgs, seats, cohorts and attendance — which can be built in parallel.
6. **The real critical path is not engineering** — Workstream 4.3.

### 11.3 The two things most likely to determine the schedule

| Critical path | Why | Where |
|---|---|---|
| **Expert authoring (4.3)** | The specification states plainly that content, the skill list, the item bank, the rubric and the three exemplars are the real critical path and must run in parallel, not after. Three of them are the owner's to write | MVP Spec §9, §10; Overview §1.7 item 6 |
| **Assessor recruitment (4.3.10 → 6.1)** | Called *"the launch dependency, started in 1A, not here."* G3 (SLA) and the §12.4 key-person test both depend on it | MVP Spec §10, §12.4 |

### 11.4 Decision→work dependency chains

| Chain | Effect |
|---|---|
| **ADR-006** → Milestone 2 → rest of Track B → Phase 1B foundations | The single decision with the longest downstream reach in engineering |
| **ADR-032 residency** → ADR-016 hosting → ADR-005a production host → 7.4 environments → 7.6 backups → Phase 5 exit → Phase 1C | Residency is no longer the *first* blocker, but it is the *head* of the production chain |
| **Mockup §20.6 #1 naming** → Track A design → every header, badge, verification page | Stated as *"decide before step 0"* |
| **§20.6 #5 assessor sourcing** → 4.3.10 → 6.1 → G3 SLA → §12.4 trust validation | Determines whether the published 10-day SLA is a promise or a liability |
| **4.3.7 knowledge articles** → 5.8 corpus → ADR-013 trigger → M8 tutor | The corpus must precede the tutor; the AI provider decision has no trigger until it exists |

---

## 12. Blocked and pending index

Everything that cannot proceed today, in one place. **Nothing in this table may be presented as ready to execute.**

| Item | WBS | Blocked by | Type |
|---|---|---|---|
| Documentation baseline commit | 1.4 | Execution authorization (repository operation) | ⏸ Gate |
| Conflict confirmations CONF-1…10 | 2.4 | Owner confirmation | ⏳ Decision |
| Six business decisions | 2.5 / 4.4 | Owner decision | ⏳ Decision |
| 🔴 **Track A start condition — UNRESOLVED CONFLICT** | 4.1.0 | Two baseline documents disagree; **human direction required**; must not be resolved by interpretation | 🔴 **Conflict** (§1.4) |
| Track A design start | 4.1.1 | 4.1.0 above, **and** 2.5 #1 naming | ⏳ Decision |
| Milestone 1 execution | 4.2.1 | Execution authorization **only** — no architectural decision outstanding | ⏸ Gate |
| Milestone 2 (auth → authz → dashboard) | 4.2.2 | **ADR-006 — B1 · B2 · B3** | ⏳ Decision |
| Milestone 2 execution plan | 4.2.2a | ADR-006 decided | ⏳ Decision |
| Remaining Track B slice steps (discovery → restart proof) | 4.2.3–4.2.9 | Milestone 2; **no milestone defined and no execution plan exists** | ❓ Define milestone structure, then plan |
| Assessor recruitment | 4.3.10 | 2.5 #5 | ⏳ Decision |
| Refund / cancellation / withdrawal policy | 4.4.7 | **OQ-9** — legally required, absent from the specifications | ⏳ Decision |
| Accommodations policy and ownership | 4.4.8 | **OQ-15** — *"the most serious omission"* | ⏳ Decision |
| Payment rail and tax treatment | 5.1 | **ADR-014 · OQ-2** | 🕓 Deferred + ⏳ |
| Exam clock model review | 5.4 | **ADR-021** analysed, not yet reviewed; **OQ-11** | ⏳ Decision |
| Verification domain | 7.8 | **OQ-5** — blocks first credential issuance | ⏳ Decision |
| Sending domain / SPF-DKIM-DMARC | 7.9 | **ADR-015 · OQ-3** | ⏳ Decision |
| HRD Corp / e-TRIS submission requirements | 5.7, 6.2 | **OQ-8** — the specification warns the current text is general knowledge, **not a verified checklist** | ⏳ Decision |
| AI data-processing agreement | 5.8 | **OQ-4** — including a "no training on learner data" term | ⏳ Decision |
| Audit log scope beyond credential/assessment | 5.9 | **OQ-16** | ⏳ Decision |
| Release gate / coverage policy | 7.10 | **OQ-18 · OQ-19** | ⏳ Decision |
| Retention durations | 7.11 | Data Arch §7.1 `[ASSUMPTION]`s | ⏳ Decision |
| Deletion vs credential permanence | 7.12 | **OQ-12** | ⏳ Decision |
| RPO / RTO targets | 7.6 | **OQ-10** | ⏳ Decision |
| Penetration test | 6.7 | **OQ-17** | ⏳ Decision |
| MFA for V1 admin accounts | 5.1 | **OQ-14** | ⏳ Decision |
| Corporate SSO timing | 5.1 | **OQ-7** — may change ADR-006's provider weighting | ⏳ Decision |
| Live session tooling in scope? | 5.7 | **OQ-13** | ⏳ Decision |
| All production infrastructure | 7.1–7.7 | **ADR-032 residency answer**, then ADR-016 and ADR-005a | ⛔ Chain |

**Closed, recorded so they are not reopened:** ~~OQ-1~~ (prototype medium — closed by human direction; a production-grade vertical slice; ADR-036) · ~~OQ-20~~ (does the slice replace the product-validation criteria — closed: **two parallel tracks, neither replaces the other**; ADR-040).

---

## 13. Deferred register — do not pull forward

**Deferral here means "there is a recorded trigger", not "it is next".** Under AP-11 each also carries a justification burden: a current functional requirement, a demonstrated limitation, or a measurable operational need.

| Deferred | ADR | Trigger that reopens it | Cost of deferring |
|---|---|---|---|
| Video provider | 009 | Real lesson video content exists | None, given a provider-neutral video reference. Largest variable cost in the platform |
| Object storage (R2 vs S3) | 008 | Artifact submission or evidence packs are built | None — Track B stores no files |
| Payments (Stripe + Malaysian rail) | 014 | Candidacy registration is built — **answer OQ-2 first** | None. Corporate may buy on invoice |
| AI provider | 013 | The knowledge library corpus exists | None — the corpus must precede the tutor |
| Transactional email | 015 | Real email verification is required (Milestone 2+) | None yet |
| Analytics product | 017 | Real users exist | Low — design the instrumentation points now |
| Production hosting · production DB host | 016 · 005a | First deployment | None — local development needs neither |
| Search (Postgres FTS) | 012 | The knowledge library is built | None |
| Caching / Redis | 011 | A **measured** need for rate limiting or shared cache | None. Never a source of truth |
| Testcontainers | — | **Measured** test-isolation contention | None — transaction rollback suffices today |
| Credential verification model / OB 2.0 | 018 | The credential module is built | None. **Do not claim OB3.0 conformance before it is true** |
| Exam integrity model | 019 | The assessment module is built | None |
| Exam durability implementation | 021 | The assessment module is built | Worth early attention — it governs exam correctness |
| Learning-records `events` table | 024 | Learning-event capture is built | None — xAPI stays a later projection, not a re-instrumentation |
| Content version fields in use | 026 | The content model is built | Fields present from the first schema regardless |
| Evidence pack as a background job | 033 | The evidence-pack feature is built | None |
| Notifications beyond transactional email | 034 | Transactional email is required | None |
| SSO · SCIM · LTI · xAPI · OB 3.0 · proctoring | — | Phase 2, or a customer requirement | None — deferred by specification **and** governed by AP-11 |
| Service extraction · graph DB · event bus · dedicated vector store · OpenSearch · queue service | 001 · 010 · 011 · 012 · 013 | An AP-11 justification with evidence | None |

---

## 14. Milestones and their detailed plans

**This document is the master roadmap. It does not carry implementation steps.**

| Milestone | Phase / WBS | Detailed plan | Status |
|---|---|---|---|
| **Milestone 1 — Walking Skeleton** | 4.2.1 | [`MILESTONE_1_EXECUTION_PLAN.md`](MILESTONE_1_EXECUTION_PLAN.md) | ⏸ Scope accepted · execution **not authorized** |
| **Milestone 2 — Auth → authz → dashboard** | 4.2.2 | **Does not exist yet** — WP 4.2.2a | ⛔ Blocked by ADR-006 |
| *(remaining Track B slice steps — **milestone structure not yet defined**)* | 4.2.3–4.2.9 | **No milestone defined; no plan exists** | ❓ Milestone structure is an open planning question for the owner |
| **Phase 1B blocks** (5.1–5.11) | 5.x | **Do not exist yet** | ◻ Future |
| **Phase 1C** (6.1–6.8) | 6.x | **Does not exist yet** | ◻ Future |

**The rule.** A milestone is planned in its own execution plan — scope, approved decisions relied on, RED-gate actions, deliverables, **pass/fail verification criteria**. Scope acceptance is recorded **separately** from execution authorization. Results are recorded honestly, including failures, and a completion report follows in the standard format. **No milestone is executed without an accepted plan.**

---

## 15. How to maintain this document

### 15.1 When to update it

Update **only** when something has actually changed in reality:

| Trigger | Update |
|---|---|
| A work package is genuinely completed **and verified** | Its status, and §1 Current Project Position |
| A decision is approved, deferred, or superseded **by explicit human instruction** | The execution-view reference and any status that depended on it |
| An open question is answered | §12, and any work package it unblocked |
| A milestone execution plan is written and accepted | §14, and the milestone's WBS row |
| A milestone completes | Its status, the completion report reference, and §1 |
| A new dependency or blocker is discovered | §11 and §12, with its source |

### 15.2 Rules for updating

1. **Never promote a status without evidence.** "Implemented" is not "tested"; "planned" is not "complete"; a scope acceptance is not an execution authorization.
2. **Never convert** a proposed decision into an approved one, a deferred decision into active work, or a pending decision into an implementation assumption. Only an explicit human instruction changes a decision state, and it changes it **in the register first**.
3. **Never restate architecture reasoning here.** Name the ADR and its status; the reasoning lives in `docs/architecture/`.
4. **Never invent a milestone, work package, technology, vendor or date** that the project documentation does not support. Where the future is genuinely unplanned, leave it ❓ and say so.
   - **This document does not create milestones.** A milestone exists only when an approved document defines it. Identifying a sequencing relationship between work packages is permitted; naming that sequence a milestone is not. Milestone structure beyond Milestone 2 is an open planning question for the owner.
   - **This document does not create product scope.** Every work package must trace to an approved specification, an ADR, or a milestone plan. If it traces to nothing, it does not belong here.
   - **This document does not resolve conflicts.** A conflict between source documents is recorded as unresolved and escalated — never reconciled here, and never resolved by choosing the more convenient reading.
5. **Record uncertainty as uncertainty.** A dependency you suspect but cannot source is an observation, not a WBS row.
6. **This document follows the baseline, it does not lead it.** If it disagrees with `docs/architecture/` or a root specification, **this document is wrong** and must be corrected.

### 15.3 Provenance markers used here

Consistent with `../architecture/README.md` §3: **`[SPEC]`** explicitly stated in an approved specification · **`[INFERENCE]`** a reasonable technical consequence of a `[SPEC]` item · **`[ASSUMPTION]`** not derivable from the specifications, requires confirmation. Where this document sequences work that the specifications describe but do not group — notably the remaining Track B slice steps (4.2.3–4.2.9) and **Phase 7** — the sequencing is `[INFERENCE]`, is labelled in place, and **creates no milestone**. **An `[ASSUMPTION]` never silently becomes a `[SPEC]`.**

---

## 16. Recommended future reference mechanism *(recommendation only — `CLAUDE.md` is NOT modified)*

This document is designed to be the persistent orientation layer for future sessions. The recommendation below is **for the owner's decision** and has not been applied.

**Recommended: a short pointer in `CLAUDE.md`, not an expansion of it.** `CLAUDE.md` is the operating constitution; adding execution detail to it would violate its own separation of governance from delivery. A block of roughly the following weight, placed after *"Always read project knowledge before significant work"*, would be sufficient:

> **Before beginning significant work, read [`docs/execution/PROJECT_PLAN_WBS.md`](docs/execution/PROJECT_PLAN_WBS.md) §1 Current Project Position.** Identify the current phase and milestone. Confirm what is complete, active, blocked, pending decision and deferred. Confirm the dependencies and approval gates that apply to the work being requested. **Do not start work that belongs to a future, blocked or deferred phase.** Detailed implementation steps live in the relevant milestone execution plan, never in this file. Update the WBS **only** when work has actually been completed and verified.

**Why this shape:**

1. It preserves the documentation boundary — `CLAUDE.md` governs, the WBS navigates, milestone plans implement.
2. It gives the WBS one job in the session lifecycle — orientation — rather than making it a second constitution.
3. It reinforces the rule that already causes the most drift: **planning completion is not implementation completion**.
4. It keeps `CLAUDE.md` short, which is what makes it read every session.

**Also worth considering, if the owner wants it:** a line in `docs/execution/README.md` §3 listing this document, and a line in `docs/README.md` naming it as the execution entry point. Both are one-line additions and neither changes any governance rule. **Neither has been made.**

---

## 17. Document control

| Field | Value |
|---|---|
| **Document** | `docs/execution/PROJECT_PLAN_WBS.md` |
| **Version** | 1.0 |
| **Created** | 2026-08-30 |
| **Status** | DRAFT — pending human review |
| **Scope** | Execution and project management only. Not architecture, not a decision register, not a specification |
| **Authority** | Level 3 (subordinate to human instruction, the approved specifications, and `docs/architecture/`) |
| **Sources** | `CLAUDE.md` · `AI_DEVELOPMENT_GUARDRAILS.md` · the three root specifications · every document in `docs/architecture/` · `docs/execution/README.md` · `MILESTONE_1_EXECUTION_PLAN.md` · `git status` and `git log` as at 2026-08-30 |
| **Authorises** | **Nothing** |
