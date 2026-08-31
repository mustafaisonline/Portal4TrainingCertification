# Testing Architecture

> **Status: APPROVED — 2026-08-30** (philosophy and required layers, ADR-038)
> **Created:** 2026-08-30 · **Version:** 1.0
> **Approved:** the five required layers, risk-based proportionality, the Tier 1 critical-workflow set, and the governing principle.
> **NOT approved:** any testing framework or library. **ADR-025 remains PENDING HUMAN APPROVAL and no testing dependency may be installed.** Framework selection is a blocking decision for Track B, whose final step is automated testing.

---

## 1. Why this document exists

**None of the three authoritative specifications names a testing approach.** They describe what must be true of the product — a credential decision defensible years later, an exam that survives a network loss, an assessor who cannot mark their own cohort — but never how any of it is verified.

Meanwhile `CLAUDE.md` Rule 7 states: *"Never claim completion without validation."* Guardrails §30–§32 require a testing decision for business logic, API changes, authentication, authorisation, workflow changes, data processing, payment, examination and certification functionality, and forbid fake completion.

This is the single largest gap between the governance documents and the specifications. This document closes it at the level of **philosophy and required layers**. It deliberately does **not** choose libraries.

---

## 2. The governing principle

> **A feature is not considered complete merely because it renders successfully. Completion requires validation appropriate to the feature's business and technical risk.**

Two corollaries that follow directly, and that this project should treat as binding:

- **"It renders" is evidence about a screen, not about a rule.** The rules that carry this product — conflict of interest, tenancy isolation, threshold scoring, requirement evaluation, append-only writes — are invisible on screen and are exactly the ones that fail silently.
- **A silent failure in a trust product is worse than a loud one.** An exam that loses answers, a credential issued without a human decision, or an org admin who can see another organisation's roster are not bugs that degrade the product — they end the argument the product is making.

---

## 3. Required testing layers

The project must support all five. What is *applied to a given change* is decided by risk (§4), not by habit.

### Layer 1 — Unit testing
**Purpose:** verify a single rule, calculation or transformation in isolation.
**Where it earns its keep here:** threshold scoring and highest-score-retained; credential requirement evaluation over requirement rows; per-skill gap computation; rubric aggregation; date and SLA arithmetic; string externalisation and formatting.
**Characteristic:** fast, numerous, no database, no network.

### Layer 2 — Integration testing
**Purpose:** verify that a rule holds **through the real data-access path**, because several of this project's non-negotiables are only meaningful against a real database.
**Where it earns its keep here:** append-only enforcement on skill assertions and exam responses; audit row written in the same transaction as the mutation it describes; tenancy filtering by `organisation_id`; assessor conflict-of-interest rejection; assessment content unreadable by non-assessor roles **at the query layer**; job handler idempotency; webhook replay safety.
**Characteristic:** runs against a real database instance; slower; the highest-value layer in this product.

> **Note.** Guardrails require that assessment content is not readable at the query layer "not just hidden in the UI". That requirement is *unverifiable* by unit or end-to-end tests alone — it is specifically an integration-layer assertion. This layer is not optional here.

### Layer 3 — End-to-end testing
**Purpose:** verify that a complete workflow works as a user experiences it, across screens, sessions and persistence.
**Where it earns its keep here:** the §5 journey and the critical workflows in §5 below.
**Characteristic:** slow, brittle if overused, irreplaceable for workflows that span many steps and a restart.

### Layer 4 — Critical business workflow testing
**Purpose:** a named, explicitly maintained set covering the workflows whose failure is commercially or reputationally unacceptable. This is not a separate technology — it is a **designated subset** that is never allowed to be skipped, disabled or left failing, and that gates a release.
**Characteristic:** the list in §5 is the list. It changes only by deliberate decision.

### Layer 5 — Regression testing for resolved defects
**Purpose:** every fixed defect acquires a test that fails on the old behaviour.
**Rationale:** Guardrails §27 requires root-cause fixes and §31 requires regression protection. A fix without a test is an assumption that it stays fixed.
**Characteristic:** grows organically; is the cheapest insurance the project can buy.

---

## 4. Risk-based proportionality

Testing effort is allocated by consequence of failure, not uniformly.

| Risk tier | Characteristics | Expected validation |
|---|---|---|
| **Tier 1 — Critical** | Money, credentials, assessment integrity, access control, irreversible actions, published SLA | Unit + integration + **end-to-end**, plus explicit negative cases. Never shipped on manual verification alone |
| **Tier 2 — Important** | Learner-visible workflow, persistence, corporate reporting, evidence pack contents | Unit + integration; end-to-end where the workflow spans several steps |
| **Tier 3 — Standard** | Business logic with contained blast radius, admin CRUD | Unit, plus integration where it touches the database |
| **Tier 4 — Presentation** | Layout, copy, styling, isolated presentational components | Component-level and accessibility checks; end-to-end is disproportionate |

**Explicitly stated so it is not misread as laxity:** Tier 4 receives lighter validation because its failures are visible and cheap to correct. Tier 1 failures are frequently *invisible* — which is precisely why they need the most.

**Accessibility** (WCAG 2.2 AA, NFR-3) is a product requirement, not a tier: it is verified per component regardless of tier.

---

## 5. Critical workflows requiring end-to-end validation

These are Tier 1. Each is listed with what makes it critical, so the list can be defended rather than merely obeyed.

| # | Workflow | Why it is critical |
|---|---|---|
| 1 | **Registration and authentication** | The entry to everything; account integrity underpins credential attribution |
| 2 | **Role and authorisation enforcement** | Includes tenancy isolation and the assessor conflict-of-interest rule (BR-1). A failure here is a credibility crisis, not a bug |
| 3 | **Enrolment** | The commercial and learning path both begin here |
| 4 | **Payment flow** | Money, plus entitlement. Our records must remain authoritative and reconcilable after any provider outage |
| 5 | **Examination submission** | "A lost exam is a refund, a support case, and a reputational hit." Must be verified **across a simulated interruption**, not only on the happy path |
| 6 | **Examination result processing** | Threshold evaluation, per-skill breakdown, highest-score retention — the gate into the evidence stage |
| 7 | **Certificate / credential issuance** | Irreversible and public. Must verify that issuance cannot occur without a human decision (BR-2) |
| 8 | **Certificate verification** | The permanent public URL; the first brand impression for every employer and the growth loop (NFR-2) |
| 9 | **Progress persistence and recovery** | Resume-to-the-second, and the Service Restart Test made executable |

**Additions recommended by this analysis** (`[INFERENCE]`, for your consideration):

| # | Workflow | Why |
|---|---|---|
| 10 | **Artifact submission and assessor evaluation** | `K06`/`A03` are *the product*. G1 (artifact submission rate) is the single most important business metric; a defect here corrupts the one signal the MVP exists to measure |
| 11 | **Evidence pack generation** | Its output goes to a funding authority. Wrong contents in front of a corporate buyer is worse than not offering the feature |

---

## 6. Service restart resilience as an executable test

The Service Restart Test is currently a design question answered on paper in `DATA_ARCHITECTURE.md` §6. It should also be **executable**, because that is the difference between a claim and a control.

Proposed shape `[INFERENCE]`:

1. Drive a workflow to a partial state — mid-lesson, mid-exam, mid-artifact-draft, job queued but not run.
2. Restart the application and clear every cache.
3. Assert the user resumes correctly, no data is lost beyond the stated autosave window (OQ-11), and queued work still executes.

This is the final step of **Track B**, the technical vertical slice (ADR-036, scoped by ADR-040), and it validates AP-02, AP-03 and AP-05. It is the test most likely to catch an accidental violation of `CLAUDE.md` Rule 6 — and it is the reason Track B exists at all, since a restart is the one thing a design prototype can never be asked to survive.

---

## 7. What testing must never be used for

| Prohibited | Source |
|---|---|
| Suppressing errors so code appears functional; empty catch blocks; fake success responses; disabled validation | `CLAUDE.md` — Testing & Validation |
| Presenting mocked, simulated or hardcoded behaviour as a completed production feature | `CLAUDE.md` §49 / Guardrails §49 |
| Using real production personal data in a test environment | `[BEST PRACTICE]`; PDPA exposure |
| Placing real assessment items in test fixtures that live in the repository | `[INFERENCE]` — item leakage destroys the item bank |
| Reporting "implemented" as "complete" | `CLAUDE.md` — *Implemented is not the same as complete* |

Completion status must always distinguish: **Implemented · Tested · Partially tested · Blocked · Requires human validation.**

---

## 8. Test data and environments

| Concern | Position |
|---|---|
| Test database | Integration tests require a real PostgreSQL instance, isolated per run, seeded from seed files — never a copy of production |
| Fixtures | Synthetic learners, organisations, cohorts. **Fixture assessment items must be synthetic**, never real bank items |
| External providers | Provider sandbox/test modes in development and staging; never live credentials outside production |
| Irreversible actions | Credential issuance and email dispatch are exercised in staging, never in production. This is the primary justification for the third environment (ADR-029) |
| Seed data | Lives in seed files, not migrations (`[SPEC]` MVP §16.2 rule 5), which also makes it usable for tests |

---

## 9. Framework selection — deliberately deferred

Specific libraries are **PENDING HUMAN APPROVAL under ADR-025** and are recorded there, not here. For comparison purposes only, the candidate shape is: a unit/integration runner, a real test database, a browser-driving end-to-end tool, and an accessibility assertion library. Adopting any of them is a RED-gate action (Guardrails §17 — no new testing frameworks without approval).

**What is being asked for approval in this document is the philosophy and the five required layers — not the tools.**

---

## 10. Open questions

| ID | Question |
|---|---|
| **OQ-18** | What is the release gate? Must the Tier 1 critical-workflow set pass before every production deploy, or only before phase milestones? |
| **OQ-19** | Is there a coverage expectation, or is coverage deliberately not a target? *(Recommendation: risk-based judgement over a coverage percentage — a number invites gaming and misallocates effort toward Tier 4.)* |
| **OQ-11** | The acceptable autosave loss window, which §6 needs in order to assert anything precise |

**Track note.** Automated testing is an explicit step of **Track B** (`ARCHITECTURE_OVERVIEW.md` §2.14). **Track A — product experience validation — is validated by users, not by test suites**, and its exit criteria are the MVP Spec §10 reaction criteria. Neither form of validation substitutes for the other (ADR-040).
