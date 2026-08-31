# Architecture Documentation — Index

> **Status: DRAFT — PENDING HUMAN APPROVAL**
> **Created:** 2026-08-30
> **Phase:** Architecture & Technology Discovery (read-only assessment)
> **Nothing in this directory is approved architecture.** No technology has been installed, no framework initialised, no database created, no physical schema designed, and no commits made.

---

> ## 🔄 ARCHITECTURE RECONCILED WITH DR-02 — 2026-08-31
>
> **Start here if you are new to this repository.** The product model was corrected on 2026-08-31 by [`DR-02_EXPERT_LED_DELIVERY_MODEL.md`](../../DR-02_EXPERT_LED_DELIVERY_MODEL.md), after the vision alignment audit found the specifications describing a self-paced course platform rather than the **expert-led professional training and certification organisation** being built. The three root specifications were corrected in three propagation stages, and this architecture layer was reconciled last.
>
> **What the correction did NOT change:** the modular monolith · PostgreSQL as sole source of truth · scoped RBAC at the data-access layer · append-only evidence · audit-in-transaction · the `jobs` table · the server-authoritative exam clock · requirements-as-data · permanent credential identity · all twelve principles `AP-01`…`AP-12` · **35 of 42 ADRs**. The architecture was built on generic shapes and survived a product-model correction largely intact.
>
> **What it did change:** the Track B slice (ADR-036/040) · the delivery model (**ADR-043**, new) · the live-session boundary (**ADR-044**, new, closing `OQ-13`) · deferral of the AI tutor (ADR-013, **with a corrected trigger**) and video (ADR-009) · `D3`/`D9`/`D10` in the data architecture · Tier 1 workflows 3 and 9 in testing.
>
> **Read in this order:** `DR-02` → `ARCHITECTURE_OVERVIEW.md` Part 1 → `DATA_ARCHITECTURE.md` §1.1 → ADR-043 and ADR-044 → `EXTERNAL_ARCHITECTURE_REVIEW_2026-08-30.md` for the review that started it.
>
> **No implementation followed.** No code, schema, migration, API or vendor exists. Physical data-model creation remains a RED gate.

---

## 1. Purpose of this documentation

Architecture decisions on this project must not exist only inside an AI conversation. This directory is the **persistent, version-controlled record** of:

- what the system is proposed to be,
- why each significant decision was recommended,
- what alternatives were considered and rejected,
- which decisions a human has actually approved,
- and what remains open.

Future AI sessions and human developers read these documents **before** significant work, as required by `CLAUDE.md` Rule 2 and `AI_DEVELOPMENT_GUARDRAILS.md` §4.

These documents are **derived from**, and subordinate to, the authoritative product specifications:

| Authority level | Document |
|---|---|
| 1 | Explicit current human instruction |
| 2 | **`DR-02_EXPERT_LED_DELIVERY_MODEL.md`** — the authoritative strategic correction of 2026-08-31. **Outranks the specifications** on organisation identity, delivery model, portal role, programme model, certification relationship, expert model and corporate model |
| 2 | `DATA_AI_ACADEMY_MVP_BUILD_SPEC.md` (authoritative for **what gets built first**) |
| 2 | `DATA_AI_ACADEMY_PORTAL_BLUEPRINT.md` (authoritative for **vision and architecture direction**) |
| 2 | `DATA_AI_ACADEMY_PORTAL_MOCKUP_SPECIFICATION.md` (authoritative for **design language and IA**) |
| 3 | **This directory** — architecture and technical documentation |
| 4 | Existing working implementation *(none yet)* |
| 5 | `Reference Material/` |

Where this directory and a specification conflict, **the specification wins** and this directory is wrong and must be corrected.

---

## 2. Document set

**Execution documents live in [`../execution/`](../execution/README.md), not here.** This folder holds architecture and decisions; that folder holds milestone plans, completion reports and verification records. The separation is deliberate — see `../execution/README.md` §2.

| Document | Purpose | Status |
|---|---|---|
| [`README.md`](README.md) | This index; how architecture is approved and updated | DRAFT |
| [`ARCHITECTURE_PRINCIPLES.md`](ARCHITECTURE_PRINCIPLES.md) | **AP-01…AP-12** — durable, technology-independent principles that outlive any framework or vendor | ✅ **APPROVED 2026-08-30** |
| [`ARCHITECTURE_OVERVIEW.md`](ARCHITECTURE_OVERVIEW.md) | System architecture, components, responsibilities, data flows, principles | DRAFT — PENDING HUMAN APPROVAL |
| [`TECHNOLOGY_STACK.md`](TECHNOLOGY_STACK.md) | Proposed technologies, purpose, alternatives, rationale, approval status | DRAFT — PENDING HUMAN APPROVAL |
| [`ARCHITECTURE_DECISION_REGISTER.md`](ARCHITECTURE_DECISION_REGISTER.md) | The central register — ADR-001 onwards | DRAFT — PENDING HUMAN APPROVAL |
| [`DATA_ARCHITECTURE.md`](DATA_ARCHITECTURE.md) | **Conceptual** data architecture: domains, entities, ownership, classification, persistence | DRAFT — PENDING HUMAN APPROVAL |
| [`INTEGRATION_ARCHITECTURE.md`](INTEGRATION_ARCHITECTURE.md) | External integration categories, candidate providers, boundaries, failure handling | DRAFT — PENDING HUMAN APPROVAL |
| [`SECURITY_ARCHITECTURE.md`](SECURITY_ARCHITECTURE.md) | Authentication, authorisation, data protection, secrets, audit, open questions | DRAFT — PENDING HUMAN APPROVAL |
| [`DEPLOYMENT_ARCHITECTURE.md`](DEPLOYMENT_ARCHITECTURE.md) | Deployment model, environments, infrastructure, scalability, backup, monitoring | DRAFT — PENDING HUMAN APPROVAL |
| [`TESTING_ARCHITECTURE.md`](TESTING_ARCHITECTURE.md) | Testing philosophy, required layers, risk tiers, critical workflows | DRAFT — PENDING HUMAN APPROVAL |
| [`CONFLICT_RESOLUTION_REGISTER.md`](CONFLICT_RESOLUTION_REGISTER.md) | The 10 Blueprint vs MVP Spec conflicts and their recommended resolutions | DRAFT — PENDING HUMAN APPROVAL |
| [`ARCHITECTURE_APPROVAL_PACKAGE.md`](ARCHITECTURE_APPROVAL_PACKAGE.md) | Consolidated decision state — approved directions and what remains open | PARTIALLY APPROVED 2026-08-30 |
| [`TECHNOLOGY_DECISION_FRAMEWORK.md`](TECHNOLOGY_DECISION_FRAMEWORK.md) | The repeatable 8-step process and comparison template for **all** significant technology and vendor selections | DRAFT — PENDING HUMAN APPROVAL |
| [`TECHNOLOGY_DECISION_PACKAGE_PHASE_1.md`](TECHNOLOGY_DECISION_PACKAGE_PHASE_1.md) | The four Track B prerequisites evaluated under the framework: ORM · authentication · testing · local PostgreSQL | Partly approved 2026-08-30 |
| [`DECISION_B_AUTHENTICATION.md`](DECISION_B_AUTHENTICATION.md) | Full authentication analysis — cost/AP-12 fit · identity architecture · portability and exit · maturity and security history · complexity | **RECOMMENDATION ONLY — PENDING HUMAN APPROVAL** |
| [`EXTERNAL_ARCHITECTURE_REVIEW_2026-08-30.md`](EXTERNAL_ARCHITECTURE_REVIEW_2026-08-30.md) | Independent pre-implementation review. **Advisory record — never rewritten.** The review that led to the vision alignment audit and `DR-02` | Record |

**No physical database schema exists in this directory and none may be created here.** Schema creation is a RED-gate decision (`CLAUDE.md` Rule 1).

---

## 3. Status vocabulary

Every significant statement in these documents carries one of the following markers. They are not decorative — they determine what an AI session is permitted to act on.

> # ⛔ PLANNING & ARCHITECTURE MODE — implementation NOT authorized (2026-08-30)
>
> Approval of an architectural direction is **not** approval to execute it. No framework may be initialised, no package installed, no container started, no schema created, no file staged or committed, until the user explicitly authorises execution. A decision may be `APPROVED` while implementation remains `NOT AUTHORIZED`.
>
> **🔒 Baseline frozen, 2026-08-30.** The baseline is frozen. Four states only — `APPROVED` · `PENDING` · `DEFERRED` · `SUPERSEDED`. `PROPOSED` is retired; anything not yet reviewed is `PENDING`, and anything not needed for the current milestone is `DEFERRED` **with a recorded trigger**. Scope qualifiers (*direction only*, *principles only*, *policy only*) remain inside approval records — they describe what an approval covers, not its state.

| Marker | Meaning | May an AI implement it? |
|---|---|---|
| **APPROVED** | A human explicitly approved this decision, on a stated date. The record must state the **approval date**, the **approval scope**, **what is approved**, and **what the approval does NOT authorize** | Yes — **strictly within the stated scope, and only for actions the record does not exclude** |
| **PENDING HUMAN APPROVAL** | Recommended; crosses a protected boundary; awaiting explicit approval | **No** |
| **PROPOSED** | Recommended by analysis; not yet reviewed by a human | **No** |
| **REJECTED** | A human considered and declined it | No — and it stays recorded |
| **SUPERSEDED** | Replaced by a later decision, which must be named | No — retained for history |
| **ASSUMPTION** | Not stated in any specification; inferred to make analysis possible | No — must be confirmed first |
| **OPEN QUESTION** | Cannot reasonably be inferred; needs a human answer | No |

Additionally, every requirement-level statement is tagged for provenance:

- **`[SPEC]`** — explicitly stated in an approved specification, with a citation.
- **`[INFERENCE]`** — a reasonable technical consequence of something in `[SPEC]`.
- **`[ASSUMPTION]`** — not derivable from the specifications; requires confirmation.

An `[ASSUMPTION]` never silently becomes a `[SPEC]`.

---

## 4. How architecture decisions are approved

1. A decision is proposed here with context, alternatives, rationale, consequences and an approval requirement.
2. The human reviews it. Approval must be **explicit** and must name the ADR ID.
3. On approval, the AI updates the ADR: `Status: APPROVED`, with the approval date and the instruction that granted it.
4. Only then may the decision be implemented — and implementation still obeys every other guardrail (smallest necessary change, testing, no bulk commits, no unapproved dependencies).

**An approved ADR is not itself permission to install software, initialise a framework, or create a database.** Those remain separate RED-gate actions requiring their own approval at the moment they are performed.

---

## 5. How architecture decisions change

When an approved decision must change, the AI must, in order:

1. Identify the existing approved decision by ADR ID.
2. Explain why the change is needed and what triggered it.
3. Present the alternatives considered.
4. Obtain human approval if the change crosses a protected boundary.
5. Create a **new ADR** with the new decision, referencing the old one.
6. Mark the old ADR `SUPERSEDED`, with a `Superseded-by: ADR-NNN` reference. **Never delete it.**
7. Update every affected architecture document, and note the ADR ID in the change.

Architecture history is append-only for the same reason `skill_assertions` are: the ability to explain, years later, why a decision was made.

---

## 6. Consistency obligation

The AI must keep these four things consistent, and must report any drift it discovers:

- approved architecture (this directory),
- the technology stack document,
- the Architecture Decision Register,
- the actual implementation.

If the implementation diverges from an approved ADR, that is a defect to be reported — not a reason to silently rewrite the ADR.

---

## 7. Current state of the repository (2026-08-30)

- **No application code exists.** The repository contains specifications, governance documents and reference material only.
- **No technology has been selected as an implementation decision.** `.gitignore` is deliberately technology-neutral.
- `Reference Material/` is present and **untracked**; it contains a `.venv/` directory and Office lock files. It has been read for product understanding only and has not been modified.

---

## 8. Open questions register

Questions that **cannot reasonably be inferred from the specifications** and require a human answer. Referenced by ID throughout the other documents. None of these may be resolved by AI assumption.

| ID | Question | Blocks | Raised in |
|---|---|---|---|
| ~~OQ-1~~ | ~~Is the Phase 1A prototype built in a design tool or in the production stack?~~ | — | **CLOSED 2026-08-30** by human direction: a production-grade vertical slice. See ADR-036 |
| **OQ-2** | Which Malaysian payment rail, under which legal entity — and do corporate cohorts actually buy on **invoice and bank transfer** rather than an online rail? Also: service-tax treatment | ADR-014; possibly deprioritises the rail entirely | `TECHNOLOGY_STACK.md` §4.2 |
| **OQ-3** | Which sending domain will carry transactional email, with SPF/DKIM/DMARC? | ADR-015 | `TECHNOLOGY_STACK.md` §5 |
| **OQ-4** | Is a data-processing agreement in place with the AI provider, including a "no training on learner data" term? | ADR-013; Blueprint §17.4 compliance | `SECURITY_ARCHITECTURE.md` §12 |
| **OQ-5** | What domain will serve credential verification? *(Refined 2026-08-30.)* **Permanent credential identity is an architectural requirement and is settled by ADR-039. The domain is a product and branding decision** with an engineered redirect/migration path — important and early, but it **does not block foundational architecture**. It does block the first real credential issuance | First credential issuance; branding | ADR-039, `DEPLOYMENT_ARCHITECTURE.md` §4 |
| **OQ-6** | What **data residency** obligations actually apply? *(Refined 2026-08-30 — no residency requirement is assumed in either direction; the earlier Malaysia-leaning framing is withdrawn.)* Seven inputs need independent verification, each classified as legal/regulatory, contractual/customer, or risk-management | Region choice for hosting, database, storage **and backups** | ADR-032, `SECURITY_ARCHITECTURE.md` §11 |
| **OQ-7** | Does the first corporate pilot need **SSO** sooner than the specifications assume? | ADR-006 provider choice | `TECHNOLOGY_STACK.md` §3 |
| **OQ-8** | What are the **current, verified HRD Corp / e-TRIS** submission requirements? | The `O10` evidence pack; the specification warns this is currently written from general knowledge, not a verified checklist | `SECURITY_ARCHITECTURE.md` §11 M-4 |
| **OQ-9** | What is the **refund, cancellation and withdrawal policy** per product type (course, path, exam, candidacy, corporate seat)? | Commerce design; legally required and entirely absent from the specifications | `SECURITY_ARCHITECTURE.md` §5 |
| **OQ-10** | What are the **RPO and RTO** targets? | ADR-031 | `DATA_ARCHITECTURE.md` §7.2 |
| **OQ-11** | What is the acceptable **maximum loss window** for unsaved exam and artifact keystrokes (the autosave interval)? | ADR-021; a real user consequence | `DATA_ARCHITECTURE.md` §6.1 |
| **OQ-12** | On **account deletion**, exactly what survives on the public verification page? | PDPA obligation vs the permanence promise | `DATA_ARCHITECTURE.md` §7.1 |
| ~~OQ-13~~ | ~~Are **live cohort sessions** run on tooling outside the platform?~~ | — | **CLOSED 2026-08-31** by founder decision, recorded as **ADR-044**: the portal does not build or operate conferencing; sessions are delivered externally; the portal holds joining details, session information and attendance; provider-neutral, no vendor selected |
| **OQ-14** | Is **MFA** in scope for V1 admin accounts? | ADR-006 configuration | `SECURITY_ARCHITECTURE.md` §12 |
| **OQ-15** | Who owns the **accommodations approval** decision, and what is the published policy? | `K03`; called "the most serious omission" in the specifications | `SECURITY_ARCHITECTURE.md` §12 |
| **OQ-16** | Should the V1 **audit log** extend beyond credential and assessment actions to payments, seat changes and data-subject requests? | ADR-022 scope | `SECURITY_ARCHITECTURE.md` §8 |
| **OQ-17** | Is a **penetration test** required before the first corporate sale, and when is it budgeted? | Launch readiness | `SECURITY_ARCHITECTURE.md` §12 |
| **OQ-18** | What is the release gate — must the Tier 1 critical-workflow set pass before **every** production deploy, or only at phase milestones? | Definition of Done | `TESTING_ARCHITECTURE.md` §10 |
| **OQ-19** | Is there a coverage expectation, or is coverage deliberately not a target? *(Recommendation: risk-based judgement, not a percentage)* | Testing policy | `TESTING_ARCHITECTURE.md` §10 |
| ~~OQ-20~~ | ~~Does the technical slice defer, replace, or run separately from the MVP Spec's product-validation criteria?~~ | — | **CLOSED 2026-08-30** by human direction: **two parallel tracks, neither replaces the other.** See ADR-040 and `ARCHITECTURE_OVERVIEW.md` §2.14 |

| **OQ-21** | **How is programme participation represented in the credential requirement model** — and is it enrolment, attendance, or completion of required activities? *Policy before schema.* **Attendance alone must never earn a credential** (DR-02 §6) | `D7` reconciliation; any future requirement-type work. **Blocks nothing else** | `DR-02` §6, §14.2; `DATA_ARCHITECTURE.md` §1.1 |
| **OQ-22** | **What is the assessor supply and scaling operating model?** The chapter-based contributor ladder that previously answered this was retired by DR-02, and **nothing replaces it**. Directional hypothesis only: lead expert capacity → qualified expert network → approved assessors under credential quality standards | **A high-priority tracked strategic risk requiring a dedicated future decision.** No architectural coupling found — it is an operating-model question first | `DR-02` §7.2; Blueprint §15.3, Appendix B; `EXTERNAL_ARCHITECTURE_REVIEW_2026-08-30.md` |

> **Do not resolve OQ-21 or OQ-22 by assumption.** Neither may be answered by adding a requirement type, restoring the contributor ladder, or introducing AI assessment. Both need a deliberate human decision.

**Also outstanding — the six business decisions the specifications themselves flag** (`DATA_AI_ACADEMY_PORTAL_MOCKUP_SPECIFICATION.md` §20.6): platform and credential naming · launch domain scope · individual-vs-corporate-first · credential pricing and the exam/artifact fee split · assessor sourcing · HRD Corp programme scope. These are product decisions, not architecture, but **naming and pricing both have architectural consequences** (permanent verification URLs, commerce model), so they are tracked here as dependencies rather than restated as new questions.


---

## 9. Architecture Stability Principle

**This principle is now maintained as [`AP-10` in `ARCHITECTURE_PRINCIPLES.md`](ARCHITECTURE_PRINCIPLES.md#ap-10--architecture-stability)**, so that it has one home rather than two. Adoption is recorded as **ADR-037**; the principles set as a whole is **ADR-041**.

In summary:

> Once an architectural boundary has been approved and implemented, it must not be casually replaced merely because another technology, framework, pattern, or trend becomes available.
>
> **Stability and maintainability are preferred over unnecessary architectural novelty.**

A proposed architectural change must answer **nine questions** in writing — what the existing architecture fails to solve · why it cannot reasonably be solved within it · alternatives considered · migration complexity and cost · existing functionality affected · data migration implications · operational risk · rollback or recovery approach · why the benefit justifies the disruption.

**Question 1 is a gate.** If the honest answer is "nothing — the alternative is simply newer", the proposal is closed there.

Significant architectural changes remain subject to the applicable approval gate. AP-10 states in full what is covered (framework, database, ORM, auth, hosting, API approach, module boundaries, persistence/tenancy/authorization/audit models, reversing an implemented ADR) and what is not (security patches, minor upgrades within an approved technology, features built on the existing architecture, refactoring inside a module boundary, reversing a decision not yet implemented).


---

## 10. Approval log

| Date | Approved | Scope | Recorded in |
|---|---|---|---|
| 2026-08-30 | **Architecture principles AP-01…AP-11** | Adopted as project principles, including AP-11 Simplicity Before Scale added on the same instruction | ADR-041, ADR-037, `ARCHITECTURE_PRINCIPLES.md` |
| 2026-08-30 | **AP-12 Zero-Cost Development and Free-First Technology** | Issued as human direction. Zero mandatory technology cost during development and MVP validation; three-tier preference; mandatory free-alternative analysis and cost assessment on every recommendation. **Flagged in ADR-042: recorded as APPROVED because it was issued as a direction — say so if it was intended as a proposal** | ADR-042, `ARCHITECTURE_PRINCIPLES.md` |
| 2026-08-30 | **Core architectural direction** — ADR-001, 002, 004, 005, 010, 020, 022, 023, 036, 039, 040 | Architectural direction only | Register §2 |
| 2026-08-30 | **UI architecture direction** — ADR-003 | **Partial:** Tailwind styling approach + reusable component architecture + design tokens. **Component libraries and UI packages remain individually gated** | ADR-003 |
| 2026-08-30 | **Engineering quality and operations principles** — ADR-017, 029, 030, 031, 035, 038 | **Principles and required capabilities only — not vendors, SaaS products, cloud providers, or infrastructure** | Register §2 |
| 2026-08-30 | *(pending)* Technology Decision Framework and the four Phase 1 technology recommendations | Prepared, **not approved**. See `TECHNOLOGY_DECISION_PACKAGE_PHASE_1.md` | ADR-006, 007, 025, 005a |
| 2026-08-30 | **ADR-007 Prisma ORM + Migrate** (7.x) | **Direction only.** All paid Prisma products explicitly excluded | ADR-007 |
| 2026-08-30 | **ADR-025 Vitest · Playwright · @axe-core/playwright** | **Scoped.** Paid platforms, hosted grids, visual-regression SaaS and Testcontainers excluded | ADR-025 |
| 2026-08-30 | **ADR-005a local development** — Compose-compatible PostgreSQL container, Colima runtime | **Local development only.** Production host still open | ADR-005 record |
| 2026-08-30 | **Data residency sequencing rule** | Residency blocks **production data infrastructure only**; design, local development, local and automated testing, and non-production prototypes proceed. **The residency answer itself remains open** | ADR-032 |

### 10.1 What no approval on this project has authorised

As of 2026-08-30, **nothing in this repository authorises**: initialising a framework · installing a package · creating a database · creating a schema · provisioning hosting or cloud services · creating external service accounts · configuring production infrastructure · deploying · committing · pushing.

Each of those remains a separate action requiring its own approval **at the moment it is performed**, regardless of how many architectural decisions have been approved. An approved decision settles *what* will be built; it never settles *that it may now be built*.

### 10.2 Reading an approved ADR

An `APPROVED` record grants exactly what its **"What is approved"** line states and nothing adjacent to it. Where a record carries a qualifier — `(direction only)`, `(principles only)`, `(policy only)` — that qualifier is load-bearing:

| Qualifier | Means |
|---|---|
| **(direction only)** | The architectural shape is settled. Implementation and any dependency it implies are not. |
| **(principles only)** | The required capability and its constraints are settled. The vendor, product or platform that provides it is not. |
| **(policy only)** | The rule that will govern something is settled. Provisioning the thing it governs is not. |


---

## 11. External facts have expiry dates

Technology recommendations rest on pricing, licensing, version and maintenance facts that change. Every such fact in this repository carries **the date it was verified and its source** (see `TECHNOLOGY_DECISION_PACKAGE_PHASE_1.md` §0).

**Before acting on any technology recommendation, re-verify the facts it rests on.** A recommendation is a snapshot of a judgement made against a state of the world; it is not a standing conclusion. This applies with particular force to vendor pricing, free-tier thresholds, licence terms, and whether a library has reached a stable release.
