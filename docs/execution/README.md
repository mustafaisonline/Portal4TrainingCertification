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
| [`PROJECT_PLAN_WBS.md`](PROJECT_PLAN_WBS.md) | The master execution navigation layer: phases, workstreams, milestones, work packages, dependencies and status. **Reconciled with `DR-02` on 2026-08-31** | DRAFT — pending review |

## 4. Milestone status

| # | Milestone | Objective | Blocked by | Status |
|---|---|---|---|---|
| **1** | Walking Skeleton | Prove the approved development foundation works end to end with a minimal, real, persistent vertical slice | **Nothing architectural** — only execution authorization | ⛔ Not authorized |
| **2** | Authentication → authorization → dashboard | The first real steps of the Track B vertical slice | **ADR-006** — B1 deviation · B2 provider · B3 conditions | Not planned in detail |

**Milestone 1 requires no decision that is not already approved.** The authentication decision (ADR-006) blocks Milestone 2 and can be settled in parallel.

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
