# Technology Decision Framework

> **Status: DRAFT — PENDING HUMAN APPROVAL**
> **Created:** 2026-08-30 · **Version:** 0.2 — Step 4A added 2026-08-30 to implement **AP-12** (ADR-042)
> **Applies to:** every significant technology, library, service or vendor selection on this project.
> This document defines *how* decisions are made. It approves no technology and authorises no action.

---

## 0. Why this exists

Technology selection is where an AI assistant is most likely to do quiet damage: comparing options nobody asked about, importing a preference as a conclusion, presenting a plausible recommendation without disclosing what it would cost to reverse, or treating a remembered fact as a current one.

This framework exists to make each of those failures visible. It is deliberately biased toward **not** adopting things.

### The four kinds of statement, kept separate

Every decision document must label its claims. This is not presentation polish — it determines what a reader is entitled to rely on.

| Label | Meaning | Reliability |
|---|---|---|
| **`[SPEC]`** | Stated in an authoritative project specification | Binding unless the specification is changed |
| **`[APPROVED]`** | An approved architecture decision or principle, with ADR reference | Binding; changing it invokes AP-10 |
| **`[FACT verified <date>]`** | A current external fact, with its source | Reliable **as at that date only** |
| **`[ANALYSIS]`** | The AI's reasoning, inference, opinion or recommendation | **Not authoritative.** Read sceptically |

An unverified recollection is never `[FACT]`. If a fact matters and cannot be verified, the document says so and the decision waits.

---

## Step 1 — Define the actual requirement

Before any option is named, establish:

1. **What problem needs solving** — stated as a requirement of this product, not as a category of tool.
2. **Required capabilities** — what the solution must actually do here.
3. **Non-negotiable constraints** — from specifications, approved architecture, principles, law or contract.
4. **What is explicitly out of scope** — the adjacent problems this decision is *not* solving.
5. **Whether a new technology is genuinely required at all.**

> **Prohibition.** Options are not compared because popular alternatives exist, because a category is conventional, or because a comparison would be interesting. A decision document opens only when a *requirement* opens it.

If Step 1 concludes that the existing approved architecture already meets the requirement, **the decision closes here** and the document records that outcome. That is a successful use of this framework, not a failed one.

---

## Step 2 — Non-negotiable filter

**Applied before any scoring.** Each candidate is tested against the mandatory requirements from Step 1. A candidate failing a genuine non-negotiable is **eliminated regardless of how well it would otherwise score.**

Typical non-negotiables:

| Category | Example on this project |
|---|---|
| Security capability | Cannot enforce authorisation beyond the UI layer (AP-04) |
| Data residency | Cannot operate in a required region (ADR-032, once answered) |
| Required integration | Cannot work with PostgreSQL (ADR-005) |
| Licensing | Licence incompatible with commercial use, or imposes unacceptable obligations |
| Critical functional requirement | Cannot satisfy an explicit specification requirement |
| Governance | Prevents compliance with an approved principle |

**Both parts must be recorded:** the eliminated option **and** the specific requirement it failed. An option dismissed on preference has not been eliminated — it has been skipped, which is not the same thing and must not be presented as if it were.

**A weighted score must never resurrect an eliminated option.** That is the entire purpose of applying this filter first.

---

## Step 3 — Compare remaining options

Twelve criteria. **For every criterion, give the reasoning — not a number.** A numeric score without reasoning transfers no understanding and cannot be challenged.

| # | Criterion | The question it answers |
|---|---|---|
| 1 | **Functional fit** | Does it do what Step 1 requires, without contortion? |
| 2 | **Simplicity for a small development team** | Can 1–2 developers hold it in their heads and operate it? |
| 3 | **AI development compatibility** | Is it well represented in training data and documentation, so AI-assisted work is accurate rather than confidently wrong? |
| 4 | **Maintainability** | Upgrade cadence, breaking-change history, how much ongoing attention it demands |
| 5 | **Vendor lock-in** | How much of the system becomes shaped by it, and how visible is that? |
| 6 | **Cost** | See Step 4 |
| 7 | **Security** | Its own posture, and what it makes easy or hard to do securely |
| 8 | **Compliance readiness** | Data handling, residency options, processing terms, auditability |
| 9 | **Testing compatibility** | Can the approved testing philosophy (ADR-038) actually be applied to it? |
| 10 | **Operational complexity** | What must be run, monitored, patched and recovered |
| 11 | **Ecosystem maturity** | Release history, maintenance activity, community, longevity signals |
| 12 | **Future flexibility** | Does it foreclose options the roadmap needs? |

**Criterion 3 deserves comment**, because it is unusual and easy to misread. It is not "what does the AI prefer". It is a real risk factor on a project built with AI assistance: a technology that is poorly represented, recently changed, or documented mainly in blog posts produces confident, wrong code — and the cost lands on the human reviewing it. It is a maintainability consideration wearing an unfamiliar name.

---

## Step 4 — Cost analysis

Distinguish, where applicable:

| Cost type | Question |
|---|---|
| **MVP / development cost** | What does it cost to get to a working slice? |
| **Ongoing fixed cost** | What is paid regardless of usage? |
| **Variable cost** | What scales with users, storage, requests, minutes? |
| **Scaling cost** | What does the bill look like if the product succeeds? Is the curve linear or cliff-shaped? |
| **Migration cost** | What would it cost to leave? *(Overlaps Step 5 deliberately — leaving is a cost, and it is the one most often omitted.)* |

**Precision rule.** Figures are given **only** where taken from current official pricing, cited with the date checked. Otherwise state the *shape* of the cost — "per monthly active user, free below a threshold" — and say the number was not verified. **A confidently wrong price is worse than an acknowledged gap**, because it gets built into a plan.

---

## Step 4A — Cost tier and free-alternative analysis (AP-12)

**Mandatory for every option, before any recommendation.** Classify each candidate:

| Tier | Definition | Treatment |
|---|---|---|
| **Tier 1 — Preferred** | Free, open source, operates independently, runs locally | Default choice |
| **Tier 2 — Acceptable** | Managed service with a **genuine** free tier sufficient to build, test, prototype and validate the MVP | Permitted after verification |
| **Tier 3 — Requires explicit human approval** | Requires payment before the project can build, develop, test, run locally or validate | **Stop and ask** |

**Tier 2 is never accepted on the word "free".** The **Free Tier Qualification Test** (AP-12) is mandatory — all eight checks, each recorded with source and date:

| # | Check |
|---|---|
| 1 | Commercial use is permitted |
| 2 | The intended product use complies with the Terms of Service |
| 3 | Whether a credit card is required |
| 4 | Whether the free tier supports normal development |
| 5 | Whether the free tier supports MVP validation |
| 6 | Whether free-tier restrictions create a hidden mandatory paid dependency |
| 7 | Whether data can be exported, where relevant |
| 8 | What event triggers mandatory payment |

> **"Free" means viable for the intended stage of the product, not merely that a free signup button exists.**

### The No Paid Surprise lifecycle table — mandatory for every managed service

| Stage | Cost status | Notes |
|---|---|---|
| Local development | Free / Paid | |
| Automated testing | Free / Paid | Including CI |
| Preview / testing environment | Free / Paid | |
| MVP validation | Free / Paid | |
| **Initial commercial production** | Free / Paid | Where non-commercial restrictions bite |
| Growth / scale | Trigger and expected cost model | |

**A technology is never presented as "free" if a normal expected next stage immediately requires mandatory payment, unless that fact is disclosed at the same time.**

> **`[ANALYSIS]` The commercial-use restriction is the trap.** Several well-known free tiers are licensed for personal, non-commercial projects only. A paid credential product does not qualify — for this project such a tier is **Tier 3 in disguise**, not free but merely not yet billed.

**Before recommending any paid technology, evaluate and document:** a free open-source alternative · a self-hostable alternative · a free-tier managed alternative · **the operational complexity of each**.

A paid product is never recommended because it is popular, easier to integrate, commonly used, better documented, or saves modest development effort. **Convenience alone is never sufficient.** A paid recommendation must explain why the suitable free alternatives are insufficient.

### Mandatory technology cost assessment

Every recommended option carries this table. A recommendation without it is incomplete.

| Criterion | Assessment |
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

**Development cost and production cost are assessed separately.** Domain registration, payment transaction fees, production infrastructure beyond free capacity, high-volume email and video, and AI consumption may be unavoidable later. They are not development costs and must not be introduced prematurely.

**The counterweight.** Cost avoidance must not produce unnecessary engineering complexity. Never build custom authentication cryptography, a database engine, a payment processor, or a re-implementation of mature open-source software. Where the only zero-cost option is to build something the project has no business building, **that is a Tier 3 conversation, not a licence to build it.**

---

## Step 5 — Exit strategy

> **Vendor lock-in is not automatically bad. Unknown or unmanaged lock-in is bad.**

Every significant recommendation states:

1. **What data becomes dependent on the technology** — and where that data physically lives.
2. **Whether data formats remain portable** — can it be exported in a form something else can read?
3. **Migration complexity** — what a realistic replacement would involve.
4. **Dependency replacement difficulty** — how much code changes; is it behind one interface or spread across the codebase?
5. **Identity implications** — for anything touching accounts: can users be migrated without forcing every one of them to reset a credential? *(This is the lock-in most often discovered too late.)*
6. **Estimated architectural disruption** — a plain-language assessment, expressed as a range.

**Accepting lock-in is a legitimate decision.** The requirement is that it is *chosen*, written down, and re-readable years later by someone who was not in the room.

---

## Step 6 — Complexity test (AP-11)

> **Can the current approved architecture solve this requirement without introducing this technology?**

If **yes**, the document must explain why adding it is still justified — naming at least one of the AP-11 criteria, with evidence:

| # | AP-11 justification |
|---|---|
| 1 | A current functional requirement |
| 2 | A demonstrated performance limitation |
| 3 | A reliability requirement |
| 4 | A security requirement |
| 5 | A regulatory requirement |
| 6 | A measurable operational need |

**Future scalability alone is never sufficient.** Neither is developer convenience, familiarity, or that the alternative is "cleaner".

If **no** — the architecture genuinely cannot meet the requirement — say so plainly and proceed. That is the ordinary case for a genuinely needed capability.

---

## Step 7 — Recommendation

State, in this order:

1. **Recommended option**
2. **Why** — reasoning tied to Step 3 criteria and this product's actual constraints, not general merit
3. **Runner-up**
4. **Why the runner-up was not selected** — and honestly: if the decision is close, say it is close. A manufactured margin misleads
5. **Conditions that could change the recommendation** — the specific facts or events that would reopen it

Point 5 is what makes a decision durable rather than merely made. It converts a future re-argument into a check against a recorded trigger.

**Where the AI has no genuine preference, it says so.** A forced recommendation on a real judgement call is worse than an honest "these are close, and here is the criterion you should decide on."

---

## Step 8 — Human approval

No technology decision becomes `APPROVED` automatically, by strong argument, or by silence.

Every completed comparison ends with the line:

> **Recommendation only — pending human approval.**

On approval, an ADR is created or updated with the approval date, scope, what is approved, and **what the approval does not authorize**. Approving a *selection* never authorises *installation* — that remains a separate action requiring approval at the moment it is performed.

---

## Decision comparison template

Copy this for every significant technology decision.

| Area | Details |
|---|---|
| **Decision ID** | |
| **Problem** | The requirement, stated as a product need (Step 1) |
| **Requirements** | Capabilities the solution must provide |
| **Non-negotiables** | Mandatory constraints, each with its source |
| **Options considered** | Including "do nothing / use what we have" |
| **Eliminated options** | Each with the specific non-negotiable it failed (Step 2) |
| **Evaluation criteria** | The twelve criteria, with reasoning (Step 3) |
| **Recommendation** | |
| **Runner-up** | |
| **Key trade-offs** | What is genuinely given up by choosing this |
| **Cost considerations** | By type; figures only where verified and dated (Step 4) |
| **Cost tier (AP-12)** | Tier 1 / 2 / 3 per option, with free-tier terms verified (Step 4A) |
| **Technology cost assessment** | The twelve-row table, per recommended option (Step 4A) |
| **Free alternatives evaluated** | Open-source · self-hostable · free-tier managed — and why any paid option is still justified |
| **Operational impact** | What must be run, monitored, patched, recovered |
| **Security considerations** | Posture, data exposure, what it makes easy or hard |
| **Exit strategy** | All six elements (Step 5) |
| **What could change this decision** | Specific triggers |
| **Approval required** | Gate, and what approval would and would not authorise |

---

## Standing rules

1. **The framework is not optional for significant decisions**, and it is disproportionate for trivial ones. Significant means: it shapes the architecture, creates a dependency that is hard to remove, holds business data, costs money on a recurring basis, or touches identity, payments, assessment integrity or credentials.
2. **A decision document with no eliminated options is suspicious.** It usually means Step 2 was skipped, or the requirement was written to fit a preferred answer.
3. **Facts expire.** A recommendation resting on pricing, licensing or product capability carries the date it was checked. Re-verify before acting on an old document.
4. **A recommendation with a mandatory development-time cost stops work.** It is not presented as a conclusion but as an approval request carrying: the exact reason payment is required · the free alternatives evaluated · why they are insufficient · the expected cost · whether it recurs · lock-in implications · the exit strategy. **Never proceed on an assumption that a small cost is acceptable.**
5. **The recommendation is the least important part.** The requirement definition, the eliminations, and the exit strategy are what a future reader needs.
