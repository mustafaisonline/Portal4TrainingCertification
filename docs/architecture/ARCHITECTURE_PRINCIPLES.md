# Architecture Principles

> **Status: APPROVED — 2026-08-30** (adoption recorded as **ADR-041**)
> **Created:** 2026-08-30 · **Version:** 1.0 · **Approved by:** the project owner, 2026-08-30
>
> **Scope of approval.** AP-01 through **AP-12** are approved as the project's architectural principles (AP-12 issued by human direction on 2026-08-30, recorded as ADR-042). They are binding on every session and on every subsequent decision.
>
> **What this approval does NOT authorize.** Nothing in this document authorises implementation, package installation, framework initialisation, database or schema creation, infrastructure provisioning, or the creation of external service accounts. Principles constrain *how* work is done; they never authorise *doing* it.
>
> **Amendment.** These principles change only by explicit human decision, recorded as a new ADR, with the superseded principle retained (AP-09).

---

## Purpose and scope

These principles are **durable and technology-independent**. They are written to remain valid if every framework, vendor and library in `TECHNOLOGY_STACK.md` were replaced.

The distinction matters:

| Layer | Lifetime | Where it lives |
|---|---|---|
| **Principles** (this document) | Years. Change only by deliberate decision | `ARCHITECTURE_PRINCIPLES.md` |
| **Decisions** (ADRs) | Until superseded, with history retained | `ARCHITECTURE_DECISION_REGISTER.md` |
| **Technologies** (vendors, libraries) | Replaceable | `TECHNOLOGY_STACK.md` |

A principle is not a preference. When a proposed change conflicts with a principle, the principle wins unless it is **explicitly amended** through the same governance path as any other architectural change.

**Naming note.** These principles are `AP-01`…`AP-10`. An earlier draft of `ARCHITECTURE_OVERVIEW.md` §2.1 used `AP-1`…`AP-10` for a different, MVP-specific list; to avoid two meanings for one identifier, that list has been renumbered to `AS-1`…`AS-8` ("architectural stances") and now defers to this document. The renumbering is recorded rather than silently applied.

---

## AP-01 — Modular Monolith First

**Principle.** Prefer a single, well-structured deployable with **enforced internal module boundaries** over distributed services. Distribute only when a specific, demonstrated requirement — security isolation, independent scaling, independent availability, or divergent audit obligations — cannot be met within one deployable.

**Rationale.** Distribution buys isolation and pays for it in deployment, observability, data consistency, local development and debugging cost. A small team pays that cost continuously and receives the benefit rarely. Crucially, **the expensive part of a service boundary is the boundary, not the network hop** — so a monolith with real boundaries retains the option to distribute later at low cost, while a monolith without them does not.

**Practical implications.**
- Module boundaries are enforced by import rules and reviewed as such. A boundary violation is a defect, not a style issue.
- A module reads another module's data through that module's interface, never by reaching into its storage.
- Modules whose eventual extraction is foreseeable — here, assessment and credentialing — carry no inbound dependencies from unrelated modules.
- "It would be cleaner as a service" is not a reason. A demonstrated requirement is.

**Exceptions.** Extraction is justified when a module has a genuinely different security posture, availability requirement, scaling profile, or regulatory obligation, **and** that difference cannot be accommodated in-process. The case must be written down, not asserted.

**Approval.** 🔴 Extracting a service, or introducing a second deployable, requires explicit approval and satisfies AP-10's nine questions.

---

## AP-02 — Backend and Persistent Storage as Source of Truth

**Principle.** The authoritative value of any business fact lives in backend persistent storage. Every other representation — client state, cache, search index, derived table, external provider record, exported document — is a **copy or a projection**, and must be reconstructible from the authoritative store.

**Rationale.** Multiple candidate sources of truth is the most reliable way to produce data that is quietly wrong. On a product whose entire proposition is that a credential means something, "quietly wrong" is the worst available failure mode.

**Practical implications.**
- Caches are rebuildable by definition. Losing every cache costs latency or money — never correctness.
- External providers are sources of **events**, not of truth. A payment provider tells us a charge occurred; our record decides what a person is entitled to, and must be reconcilable after any provider outage.
- Derived values (scores, eligibility, aggregates) are recomputable from their inputs, and the inputs are retained.
- A document generated for an external party is a snapshot; the record of what it contained is retained alongside it.

**Exceptions.** Ephemeral values with no business meaning — a UI toggle, in-request memoisation, a rate-limit counter whose loss merely resets a window.

**Approval.** 🔴 Any design in which a cache, an external service, or client state is the only source of a business fact requires explicit approval with a written justification of restart behaviour, data-loss risk and recovery.

---

## AP-03 — Stateless Application Services Where Practical

**Principle.** Application instances hold no state that matters. Any instance can serve any request, and replacing every instance at any moment is a non-event.

**Rationale.** Statelessness is what makes deployment, scaling, recovery and restart ordinary rather than risky. It is also the precondition that makes AP-05 testable rather than merely asserted.

**Practical implications.**
- No business state in process memory, local disk, or an instance-local scheduler.
- Uploaded files go to shared object storage, never to an instance's filesystem.
- Timers with business meaning are derived from persisted timestamps, not from process clocks.
- Background work is claimed from a durable store, so an interrupted worker loses nothing.
- A deployment is a replacement, not a migration of running state.

**Exceptions.** "Where practical" is deliberate. A genuinely stateful component may be justified — but it becomes a *persistent service* (AP-05) with explicit backup, recovery and restart semantics, not an application instance that happens to remember things.

**Approval.** 🟡 Introducing instance-local state is reported explicitly. 🔴 If that state is business-critical.

---

## AP-04 — Explicit Authorization Boundaries

**Principle.** Every access decision is **explicit, centrally enforced, and enforced at the data-access layer** — not implied by navigation, not enforced only in the interface, and not re-implemented per screen.

**Rationale.** Interface-level restriction hides data; it does not protect it. Any path that bypasses the interface — an export, a report, a future API, a mistake — bypasses the protection with it. Authorization that is duplicated per screen is authorization that will eventually be forgotten on one.

**Practical implications.**
- Access rules are shared guards that a feature cannot bypass or forget, rather than checks a developer must remember to add.
- Tenant isolation is applied in the data-access layer, so cross-tenant leakage requires deliberately circumventing the mechanism rather than merely omitting a filter.
- Roles are **scoped and multi-valued**; one person legitimately holds several roles in different scopes. A single-role field on a person is prohibited.
- Conflict-of-interest and separation-of-duty rules are code, not policy documents.
- Sensitive content is restricted such that an unauthorised query returns nothing — not such that an unauthorised screen renders nothing.
- Negative cases are tested. "Can the wrong person reach this?" is the assertion that matters.

**Exceptions.** Deliberately public data — published knowledge content, and credential verification, which is public **by design** because its purpose is to be checked by a stranger.

**Approval.** 🔴 Any change to the authorization model, the role model, or the tenancy boundary.

---

## AP-05 — Persistent Business and Workflow State

**Principle.** Business records and workflow position survive a full restart with all caches cleared. The governing test:

> *"If all application services restart right now and all caches are cleared, will the product and its important data continue functioning correctly?"*

**Rationale.** Restarts are routine — deployments, scaling, crashes, provider maintenance. State that does not survive them is not lost occasionally; it is lost predictably, and usually at the worst moment. For this product that moment is a candidate mid-examination.

**Practical implications.**
- In-flight workflow position is persisted as it advances, not on completion.
- Long-running or high-stakes user activity is persisted incrementally, with the maximum acceptable loss window an **explicit, stated decision** rather than an implementation accident.
- Queued work is durable and re-executable; handlers are idempotent so a retry is harmless.
- Configuration and operational rules are stored data, never process state. Nothing important may exist only because the application was previously running.
- Restart resilience is **verified by an executable test**, not asserted in a document.

**Exceptions.** None for business-critical state. Genuinely temporary state requires explicit approval with a written justification.

**Approval.** 🔴 Any exception.

---

## AP-06 — Smallest Necessary Change

**Principle.** Implement exactly what is required: the requested work, plus supporting work genuinely necessary to make it function. Optional improvements and unrelated problems are **reported, not performed**.

**Rationale.** Scope expansion inflates blast radius and destroys traceability — the ability to say what changed, why, and how to reverse it. It also silently substitutes the implementer's judgement for the owner's on decisions the owner never saw.

**Practical implications.**
- Extend existing patterns rather than introducing a competing approach beside them.
- A request to modify one feature is never authority to redesign the surrounding area.
- Refactoring unrelated code, "while I was in there", is scope expansion.
- Improvements noticed in passing are recorded and offered, and the owner decides.
- Every change should be explainable as: what was asked, what was necessary, what was deliberately left alone.

**Exceptions.** A genuine blocker discovered mid-task is reported with options before the scope is widened — not absorbed silently.

**Approval.** 🟡 Any expansion beyond the requested scope is reported explicitly.

---

## AP-07 — No Hidden Mock, Placeholder, or Simulated Production Logic

**Principle.** Simulated, mocked, placeholder or hardcoded behaviour is **never presented as a completed production capability**. Where temporary behaviour is genuinely required, it is visibly identified as temporary, structurally isolated, and incapable of becoming the source of truth by default.

**Rationale.** A demonstration is not an implementation. The gap between them is invisible from outside — which is exactly why it must be visible from inside. On a product being sold on trust, a capability believed to exist but which does not is not a bug; it is a broken promise made to a customer.

**Practical implications.**
- Fake data, stubbed integrations and hardcoded outcomes are labelled at the point they exist, not only in a status report.
- Temporary code is isolated from production paths so it cannot be reached by accident.
- What remains to be implemented is documented alongside the stub.
- Errors are never suppressed to make something appear functional. No swallowed exceptions, no fabricated success responses, no disabled validation.
- Completion is reported honestly and distinguishes **Implemented · Tested · Partially tested · Blocked · Requires human validation**. *Implemented is not the same as complete.*

**Exceptions.** Test fixtures and explicitly-labelled prototypes, which by construction are never reachable from production paths.

**Approval.** 🔴 Any temporary mechanism in a production path.

---

## AP-08 — Auditability for Critical Business Actions

**Principle.** Actions that create, alter, or revoke business-critical outcomes produce a durable, immutable record of **who did what, to what, when, and what changed** — written as part of the action itself.

**Rationale.** Decisions with consequences must be defensible after the fact, often long after the people involved have forgotten, and sometimes to someone who is challenging them. An audit trail written separately from the action it describes develops gaps precisely when something has gone wrong, which is when it is needed.

**Practical implications.**
- Audit records are written in the **same transaction** as the change, so a gap is impossible rather than unlikely.
- Audit data is **business data**, not application telemetry. It lives with the business records, retained on the business's terms, and is not subject to log rotation.
- Records that constitute evidence are **append-only**. A correction is a new record, never an edit to an old one; the prior state remains visible.
- Retrospective corrections carry their own trail.
- Retention for audit data is deliberately long and deliberately decided.

**Exceptions.** Routine reads and non-consequential interactions. Note that a read of *sensitive* material may itself be consequential and warrant recording.

**Approval.** 🔴 Narrowing audit scope, or shortening audit retention.

---

## AP-09 — Significant Architecture Decisions Must Be Persistently Documented

**Principle.** A significant architectural decision does not exist until it is written down in version control, with its context, alternatives, rationale, consequences and approval status. Superseded decisions are **retained and linked to their replacement**, never deleted.

**Rationale.** Undocumented decisions are indistinguishable from accidents. The specific risk on this project is a future session — human or AI — encountering a boundary, seeing no reason for it, and "improving" it. History is what makes AP-10 enforceable: without the record, there is nothing to weigh a proposed change against.

**Practical implications.**
- Every significant decision receives an identifier and a record.
- The record states what was **rejected** and why — the rejected option is usually the one someone proposes again.
- Status is explicit and honest: proposed, pending approval, approved, rejected, superseded. Nothing is approved by implication or by silence.
- Approval is recorded with its date and the instruction that granted it.
- When a decision changes, the old record is marked superseded with a forward reference. The register is append-only for the same reason evidence is.
- Documentation, decisions and implementation are kept consistent; drift between them is reported as a defect rather than resolved by quietly rewriting the record.

**Exceptions.** Reversible, low-impact choices within an already-approved boundary.

**Approval.** 🟡 Governance obligation; it applies to every decision rather than being approved per decision.

---

## AP-10 — Architecture Stability

**Principle.** Once an architectural boundary has been approved and implemented, it is not replaced merely because another technology, framework, pattern, or trend becomes available.

> **Stability and maintainability are preferred over unnecessary architectural novelty.**

**Rationale.** Replacement carries migration cost, regression risk, data-migration risk, operational disruption and opportunity cost — all certain, and all paid immediately. The benefit is usually speculative and frequently unmeasured. Half-completed migrations are worse than either endpoint, and they are the normal outcome when the motivation was preference rather than need.

**Practical implications.** A proposed architectural change must answer **all nine** of the following in writing:

| # | Question |
|---|---|
| 1 | **What problem does the existing architecture fail to solve?** |
| 2 | Why can that problem not reasonably be solved *within* the existing architecture? |
| 3 | What alternatives were considered? |
| 4 | What is the migration complexity and cost? |
| 5 | What existing functionality is affected? |
| 6 | What are the data migration implications? |
| 7 | What is the operational risk? |
| 8 | What is the rollback or recovery approach? |
| 9 | Why does the benefit justify the disruption? |

**Question 1 is a gate.** If the honest answer is "nothing — the alternative is simply newer, faster, more popular, or more pleasant to work with", the proposal is closed there and the remaining eight are not reached.

This principle is directed **primarily at AI sessions**. The likeliest source of unnecessary churn here is not the owner; it is a session lacking the memory of why a boundary exists, proposing a cleaner alternative in good faith. An AI session encountering an approved architecture it would not have chosen **implements the approved architecture**, and records its disagreement as an observation or a proposal answering the nine questions — never as a unilateral change.

**Exceptions — not covered by this principle.** Security patches and vulnerability remediation · minor and patch upgrades within an approved technology · adding features using the existing architecture · refactoring within a module that preserves its boundary · reversing a decision that has **not yet been implemented**, which is simply deciding.

**Approval.** 🔴 Any change satisfying the nine questions still requires the approval gate applicable to the boundary being changed.

---

## AP-11 — Simplicity Before Scale

**Principle.** Prefer the simplest architecture capable of meeting **current approved requirements**. Do not introduce distributed systems, additional infrastructure, services, databases, queues, caches, orchestration platforms, or operational complexity on the basis of hypothetical future scale.

New architectural infrastructure must be justified by **at least one** of:

| # | Justification |
|---|---|
| 1 | A current functional requirement |
| 2 | A demonstrated performance limitation |
| 3 | A reliability requirement |
| 4 | A security requirement |
| 5 | A regulatory requirement |
| 6 | A measurable operational need |

**Future scalability alone is not sufficient justification.**

> **Earn complexity through demonstrated need.**

**Preferred evolution.**

```
simple architecture → measure → identify the ACTUAL constraint
                   → introduce TARGETED complexity → validate the improvement
```

Each arrow matters. *Measure* precedes *identify*, because the bottleneck is routinely not where it is assumed to be. *Targeted* means the complexity addresses the measured constraint and nothing else. *Validate* closes the loop — complexity introduced and never confirmed to have helped is complexity that must still be maintained forever.

**Rationale.** Anticipatory complexity is paid for immediately and with certainty — in build time, deployment surface, failure modes, debugging difficulty, onboarding cost and operational burden. Its benefit is speculative, frequently arrives later than expected, and sometimes never arrives at all because the anticipated growth took a different shape. For a team of 1–2 developers, every additional moving part consumes capacity that would otherwise go into the thing nobody else has.

The specifications already reason this way and should be read as evidence for the principle: a graph database was rejected for 35 skills; a queue was rejected for three jobs; a dedicated vector store was rejected for 30 articles; three services were rejected for a two-person team. In each case the rejected option was not wrong in general — it was **unearned here**.

**Practical implications.**
- "We will need it eventually" is not a justification. **"We need it now, and here is the measurement"** is.
- Prefer a capability inside an existing component over a new component providing the same capability.
- When complexity is genuinely earned, introduce the **smallest** increment that resolves the measured constraint — not the increment that also anticipates the next three.
- Record the trigger that would justify each deferred option, so a future decision is evidence-driven rather than a fresh argument. The register already does this: a queue at real job volume, a graph database at ~200 skills, an event bus at ~10k users, distributed services when profiles genuinely diverge.
- Simplicity is measured by **operational and cognitive burden**, not by line count. A clever abstraction that reduces code while making failure harder to diagnose is not simpler.
- This principle governs additions. Removing unnecessary complexity is always in scope, subject to AP-06 and AP-10.

**Relationship to AP-10.** AP-10 protects what exists from unnecessary replacement. **AP-11 protects the system from unnecessary addition.** Together they mean the architecture changes when there is a reason, in the direction the reason points, and not otherwise.

**Exceptions.** Complexity that is genuinely cheaper to build in than to retrofit — the shapes the specifications identify as Retrofit Test items: scoped roles, append-only evidence, tenancy identifiers, content version fields, requirements-as-data. These are **not** violations: they are *structural* decisions costing almost nothing now and a rewrite later, which is exactly the measured trade-off AP-11 asks for. A structural shape is not the same as an added component.

**Approval.** 🔴 Introducing any new infrastructure component, service, datastore, queue, cache or orchestration layer requires explicit approval **and** a written justification naming which of the six criteria it meets, with evidence.

---

## AP-12 — Zero-Cost Development and Free-First Technology

**Principle.** The portal must be capable of being designed, developed, tested and validated **without purchasing** software licences, development tools, SaaS subscriptions, infrastructure subscriptions or proprietary technology services.

> **The project should incur zero mandatory technology cost during development and MVP validation.**

Preferred technologies are those that are: free to use · open source where practical · self-hostable where practical · usable locally during development · available through genuinely sustainable free tiers where self-hosting is unnecessary · portable and not dependent on proprietary vendor infrastructure.

**Rationale.** The absence of a tooling budget is a **design constraint, not a compromise**. Treated as a constraint it produces an architecture that is locally runnable, portable, and cheap to reverse — which is what this project needs anyway. Treated as an inconvenience it produces a system that cannot be built, tested or demonstrated without someone's card on file, and whose costs begin before its revenue does.

It also removes a specific failure mode: paid services are disproportionately easy to adopt for **convenience**, and convenience is the one justification that does not survive contact with a cost that recurs forever.

### The three tiers

| Tier | Definition | Treatment |
|---|---|---|
| **Tier 1 — Preferred** | Free and open source; operates independently; runs locally | Default choice |
| **Tier 2 — Acceptable** | Managed service with a **genuine** free tier sufficient to build, test, prototype and validate the MVP | Permitted after verification (below) |
| **Tier 3 — Requires explicit human approval** | Anything requiring payment before the project can build, develop, test, run locally or validate the MVP | **Stop and ask** |

Tier 3 includes paid SaaS subscriptions, authentication services, databases, hosting, development tools, testing platforms, analytics, monitoring platforms, UI libraries and APIs.

**Tier 2 is not accepted on the word "free".** Before a managed service is proposed, verify and record: the free-tier limits · expiry conditions · usage restrictions (**including whether commercial use is permitted**) · whether a credit card is mandatory · whether the service can later be migrated away from.

> **`[ANALYSIS]` The commercial-use restriction is the trap.** Several well-known free tiers are licensed for personal, non-commercial projects only. A paid credential product does not qualify, so for this project such a tier is **Tier 3 in disguise** — it is not free, it is merely not yet billed.

### The Free Tier Qualification Test

> **"Free" means viable for the intended stage of the product, not merely that a free signup button exists.**

Before a managed service may be classified **Tier 1 or Tier 2**, verify and record all eight:

| # | Check | Failing it means |
|---|---|---|
| 1 | **Commercial use is permitted** | The tier is Tier 3 in disguise — not free, merely not yet billed |
| 2 | **The intended product use complies with its Terms of Service** | We would be operating outside the licence from day one |
| 3 | **Whether a credit card is required** | A card on file is a payment relationship, however small |
| 4 | **Whether the free tier supports normal development** | Development stalls or forces a purchase |
| 5 | **Whether the free tier supports MVP validation** | The tier expires exactly when the product needs to be shown |
| 6 | **Whether free-tier restrictions create a hidden mandatory paid dependency** | The "free" choice drags a paid one behind it |
| 7 | **Whether data can be exported** where relevant | Free to enter, expensive to leave |
| 8 | **What event triggers mandatory payment** | The bill arrives as a surprise rather than a decision |

**Each answer is recorded with its source and the date verified.** An unverified assumption is not an answer.

#### Worked example — why this test exists

`[FACT verified 2026-08-30]` Vercel's Hobby plan is free, requires no card, and is the conventional default for a Next.js application. It fails **check 1**: its documentation states that *"the Hobby plan restricts users to non-commercial, personal use only."*

`[ANALYSIS]` This project is a **paid credential product**. It does not qualify. Vercel is therefore **Tier 3 from launch** — not a free option that becomes paid at scale, but a paid option throughout. Earlier drafts of this repository described Vercel as the "zero-ops, free to start" choice, which was wrong for this product and would have been discovered only at launch, with the architecture already built around it.

**Nothing about the free tier's headline terms revealed this.** It was found only by reading the usage restriction. That is the entire purpose of check 1, and the reason this test is mandatory rather than advisory.

### The No Paid Surprise rule

Every managed technology or external service recommendation must document cost across the **whole lifecycle**, not just today:

| Stage | Cost status | Notes |
|---|---|---|
| Local development | Free / Paid | |
| Automated testing | Free / Paid | Including CI |
| Preview / testing environment | Free / Paid | |
| MVP validation | Free / Paid | |
| **Initial commercial production** | Free / Paid | **Where non-commercial restrictions bite** |
| Growth / scale | Trigger and expected cost model | What event starts the bill, and how it grows |

> **A technology must never be presented as "free" if a normal expected next stage immediately requires mandatory payment, unless that fact is disclosed plainly at the same time.**

`[ANALYSIS]` The failure this prevents is not dishonesty — it is *sequencing*. A service that is free through development and validation, and billed the moment the product takes its first payment, is a legitimate choice. It is only a problem when the architecture is committed before anyone notices the cliff.

### Mandatory free-alternative analysis

Before recommending any paid technology, first identify and evaluate: a free open-source alternative · a self-hostable alternative · a free-tier managed alternative · **and the operational complexity of each**.

A paid product must never be recommended because it is popular, easier to integrate, commonly used, better documented, or saves a modest amount of development effort. **A paid recommendation requires a clear explanation of why the suitable free alternatives are insufficient.**

### Practical implications

- **Local-first.** Local PostgreSQL, local application execution, local seed data, local unit, integration and end-to-end testing. Cloud services do not become mandatory for ordinary development without a demonstrated technical reason.
- **The zero-cost baseline** the project must remain able to run on: a free IDE · Node.js · TypeScript · Next.js · PostgreSQL · Docker Compose · an ORM · an authentication library · Vitest · Playwright · axe-core · Git and GitHub Free.
- **No paid convenience dependency.** Not paid authentication because setup is easier; not a paid database because local PostgreSQL needs configuring; not a paid testing platform, analytics or monitoring because the open-source equivalent needs setup. Convenience alone is never sufficient.
- **Free to start is not free of lock-in.** Evaluate data portability, export capability, migration difficulty, proprietary and API dependencies, identity portability, and cost-escalation risk. **A free service that becomes impossible or extremely expensive to leave is not a low-cost architecture.**
- **Development cost and production cost are assessed separately.** Domain registration, payment transaction fees, production infrastructure beyond free capacity, high-volume email and video, and AI API consumption may become unavoidable later. They must not be introduced prematurely.

### Complexity balance — the counterweight

Cost avoidance must not produce unnecessary engineering complexity. **Never** build custom authentication cryptography, a custom database engine, a custom payment processor, unnecessary infrastructure, or a re-implementation of mature open-source software.

> **Use existing free and mature technology before building custom infrastructure.**

**`[ANALYSIS]` AP-12 and AP-01/AP-11 can pull in opposite directions and the resolution must be stated:** avoiding a cost by writing bespoke infrastructure trades a small recurring bill for a permanent maintenance liability and, in security-sensitive areas, for real risk. Where the only free option is to build something the project has no business building, **that is a Tier 3 conversation, not a licence to build it.** This is also why `[SPEC]` "do not build auth" survives AP-12 intact.

### Mandatory technology cost assessment

Every technology recommendation must include this table:

| Criterion | Required assessment |
|---|---|
| Open source | Yes / No |
| Free to develop with | Yes / No |
| Self-hostable | Yes / No |
| Local development possible | Yes / No |
| Free tier available | Yes / No |
| Credit card required | Yes / No |
| Mandatory recurring cost | Yes / No |
| Expected scale cost | Describe |
| Vendor lock-in | Low / Medium / High |
| Data portability | Low / Medium / High |
| Exit complexity | Low / Medium / High |
| Free alternative evaluated | Yes / No |

**Exceptions.** None during development and MVP validation. Post-validation production costs are a separate assessment, justified by demonstrated usage or revenue.

**Approval.** 🔴 Any technology introducing a **mandatory payment requirement during development** stops work and requires explicit human approval, supported by: the exact reason payment is required · the free alternatives evaluated · why they are insufficient · the expected cost · whether it recurs · lock-in implications · the migration and exit strategy. **The AI must never proceed on an assumption that a small cost is acceptable.**

> **Start free. Stay simple. Remain portable. Pay only when real product value or demonstrated scale justifies the cost.**

---

## Relationship to the governance documents

These principles restate, at an architectural level, obligations already binding through `CLAUDE.md` and `AI_DEVELOPMENT_GUARDRAILS.md`. Where the governance documents and these principles appear to differ, **the governance documents prevail** and this document is defective and must be corrected.

| Principle | Primary governance basis |
|---|---|
| AP-01 | Existing architecture over novelty; MVP Spec §9 |
| AP-02 | Rule 6 — persistent data must not depend solely on cache or memory |
| AP-03 | Guardrails §15 — stateless service preference |
| AP-04 | Rule 10 — protected boundaries; MVP Spec §9 engineering rules |
| AP-05 | Rule 6 + the Service Restart Test |
| AP-06 | Rule 4 — smallest necessary change |
| AP-07 | Rule 7 + Guardrails §49 — no hidden mock or simulated production logic |
| AP-08 | Rule 9 — traceability; MVP Spec §9 audit rule |
| AP-09 | Rule 9 + the architecture governance instruction of 2026-08-30 |
| AP-10 | "Existing architecture over novelty"; human direction of 2026-08-30 |
| AP-11 | Rule 5 — no unapproved technology · Guardrails §18 dependency discipline; human direction of 2026-08-30 |
| AP-12 | Rule 5 · Guardrails §18 — dependency discipline and proportionality; human direction of 2026-08-30 |
