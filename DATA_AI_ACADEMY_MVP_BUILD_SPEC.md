# DATA & AI ACADEMY — MVP BUILD SPEC

**Document type:** Scope contract. Binding.
**Version:** 1.0
**Date:** 2026-08-29
**Owner:** Mustafa Qizilbash — Your Partner Technologies
**Supersedes for build purposes:** the scope sections of `DATA_AI_ACADEMY_PORTAL_BLUEPRINT.md` (§19–21) and `DATA_AI_ACADEMY_PORTAL_MOCKUP_SPECIFICATION.md` (§13–14). Those documents remain authoritative for **vision, architecture direction, and design language**. This document is authoritative for **what gets built first**.
**Corrected by:** [`DR-02_EXPERT_LED_DELIVERY_MODEL.md`](DR-02_EXPERT_LED_DELIVERY_MODEL.md), approved 2026-08-31. **DR-02 outranks this document** on organisation identity, delivery model, portal role, programme model, certification relationship, the expert model and the corporate model. This revision reconciles the specification with it.

---

## THE FOUR LAYERS — read this first

The two prior documents mix four different time horizons. Separating them is the whole point of this exercise.

| Layer | What it is | Where it lives | Status |
|---|---|---|---|
| **1. PRODUCT VISION** | Why this exists and what it becomes. The evidence-based credential; the living knowledge base; AI-native learning; a global professional ecosystem. | `BLUEPRINT.md` §1–5, §21 | **Frozen. Do not dilute. Do not build.** |
| **2. LONG-TERM ARCHITECTURE** | The shapes that are expensive to retrofit: scoped roles, append-only skill assertions, versioned content, requirements-as-data, multi-tenancy. | `BLUEPRINT.md` §26, `SPEC.md` §18 | **Honour the shape. Implement minimally.** |
| **3. MVP REQUIREMENTS** | The smallest system that proves the promise commercially. | This document, §2 | **Build.** |
| **4. FIRST MOCKUP** | The clickable prototype that sells the story before code. | This document, §7 | **Build first.** |

### The governing test — "The Retrofit Test"

Every scope argument resolves with one question:

> **Is this cheap to add later, or does adding it later mean a rewrite?**

- **Cheap later → cut it now.** Community, CPD, badges-as-verifiable-credentials, heatmap drill-through, proctoring, adaptive item selection, path generation, labs, LTI, SSO. All of these bolt on.
- **Expensive later → build the *shape* now, even if the feature is minimal.** Scoped roles, append-only skill assertions, content version fields, credential requirements as data rows, `organisation_id` on every org-scoped table, an audit log on credential and assessment actions, externalised UI strings.

This is the only architectural discipline the MVP needs. Everything else is scope theatre.

---

# DECISION RECORD DR-01 — ONE CREDENTIAL

**Status:** Accepted, 2026-08-30. Binding on all three documents.
**Supersedes:** every prior statement about MVP credential levels.

## The inconsistency being resolved

Three documents said three different things. This was a real defect, not a wording problem:

| Document | Location | What it said | Status |
|---|---|---|---|
| `BLUEPRINT.md` | §19.1 | one domain, **one credential level (L2 Practitioner)** | superseded |
| `BLUEPRINT.md` | §19.2 | **"L1 Foundation + L2 Practitioner definitions"** | superseded |
| `MVP_BUILD_SPEC.md` | §1 | "**no second credential level**" | ✔ correct |
| `MVP_BUILD_SPEC.md` | §3.3 | "**Ship L1 and L2 only**" | superseded |
| `MVP_BUILD_SPEC.md` | §13.1 | "Ship **two**: L1 Foundation, L2 Practitioner" | superseded |
| `MVP_BUILD_SPEC.md` | §14 | "1 domain, **2 levels**, 1 path" | superseded |
| `MOCKUP_SPEC.md` | §20.2 | "Launch with **two**: the ladder (L1, L2)" | superseded |

## The decision

**The functional MVP ships exactly one of each:**

| One | Meaning |
|---|---|
| **One pilot domain** | Data Foundations at launch — **as seeded data, never as a hardcoded value** |
| **One learning path** | The curated path through that domain |
| **One certification** | A single credential definition. No ladder, no levels, no tiers in the product |
| **One practical artifact** | One brief (with 3 industry variants), one deliverable specification |
| **One assessment rubric** | 5 criteria × 4 levels, published, with 3 real exemplars |
| **One digital credential** | One badge design, one verification page shape |

**L1 Foundation and L2 Practitioner are NOT shipped as separate functional offerings.** The four-level ladder (L1–L4) remains the product vision and stays in `BLUEPRINT.md` §12. It is not built, not designed, not priced, and not described as available anywhere in V1.

> **Note added by DR-02 (2026-08-31) — DR-01 itself is unchanged.** DR-01's discipline concerns the **credential**, and it stands. Its "one learning path" row must **not** be read as a fixed programme count: under DR-02 §4.1, programme count and credential count are separate concerns, and V1 supports a deliberately small and credible portfolio of programmes and scheduled offerings. The "path" in that row is now the expert-led programme.

## Why this is the right call — beyond simplification

The obvious argument is scope. The real argument is measurement integrity.

**L1 as specified is exam-only — it has no artifact requirement.** Shipping it alongside L2 would mean:

1. **Building a second end-to-end journey that does not exercise the differentiator.** The MVP exists to prove that an evidence-based credential works. An exam-only credential proves nothing about that thesis.
2. **Giving candidates a cheaper route to a credential that skips the evidence gate.** This directly corrupts **G1 — artifact submission rate (§12.1)**, the single number the MVP exists to measure. Candidates who buy L1 instead of L2 are not evidence that the gate is too hard, and not evidence that it is fine. They are noise in the one signal that matters.
3. **Putting an exam-only certificate into the market under the same brand as an evidence-based one** — exactly the conflation the entire strategy was built to avoid (`BLUEPRINT.md` §A6 weakness 2).

A single credential that always requires evidence is not just smaller. It is a **cleaner experiment.**

## The governing principle

> **Architect for expansion. Build only what needs validation.**

Applied concretely:
- **Schema** carries `domain_id`, `level`, and `sort_order` on day one. They are populated with a single value and read by nothing.
- **Code** contains no domain literal, no level branch, no `if (level === ...)`.
- **UI** renders domain and credential attributes from data, not from constants.
- **Product** presents one domain and one credential, with no switcher, no ladder graphic, and no "coming soon" tiles.

Adding domain #2 or credential #2 must be a **data operation plus content**, not a schema migration and not a redesign. That is the test. See **§16** for the specific rules, and **§15** for exactly what this decision removes from the build.

---

# DECISION RECORD DR-02 — EXPERT-LED DELIVERY MODEL

**Status:** Approved, 2026-08-31. Binding on all three documents. **Held in full at [`DR-02_EXPERT_LED_DELIVERY_MODEL.md`](DR-02_EXPERT_LED_DELIVERY_MODEL.md)** — deliberately standalone, because it is cross-cutting and is not bound to any single specification.

**Read DR-02 before using this document.** It is not summarised here, and its §12 lists every statement in this specification that it supersedes. In outline:

| DR-02 establishes | Consequence for this specification |
|---|---|
| An independent professional **training and certification organisation** | Not a course platform, not an association |
| **Expert-led delivery** — face-to-face, live online, corporate/private, international/on-site | Delivery is scheduled and human, not consumed |
| **The portal supports the ecosystem**; it is not where learning happens | Content delivery is the *fifth* of five portal priorities |
| The **programme** is the unit of the product | Programme → scheduled offering/cohort → session → supporting materials |
| Certification requires **participation + required learning activities + meaningful assessment + applied evidence** | Attendance alone never earns a credential; nor does content plus an exam |
| Experts shown **honestly today**, supported as a **network** tomorrow | No fabricated experts; no founder-bound design |

**What DR-02 did not change:** DR-01 · the artifact brief, rubric and exemplars · the assessor workbench · human judgement on every credential · the verification page · requirements-as-data · every Retrofit Test shape · every architecture decision.

---

# 1. MVP PRODUCT DEFINITION

**Version 1 is a single professional credential, earned through a single expert-led programme in a single pilot domain, delivered end-to-end.** A visitor discovers a programme — what they will be able to do afterwards, who delivers it, in what format, and on what date — and registers for a scheduled offering, or an organisation engages us for a private cohort. They take part in expert-led delivery: live online or face-to-face, with the interaction, questions, discussion and expert feedback that constitute the learning. Supporting materials prepare, extend and reinforce that experience without replacing it. They sit one knowledge assessment; they then produce a real applied artifact against a published brief, rubric, and worked exemplars; a qualified human being reads that artifact, grades it against the rubric, and writes reasoned feedback; and on success the participant receives a credential with a permanent public verification page they can put in front of any employer. A free diagnostic runs alongside as a capability assessment — for an individual deciding where they stand, and as the entry offer for an organisation. Corporate and private delivery is a **first-class pathway, not a layer**: invite a cohort, capture attendance, track progress, and generate the HRD Corp evidence pack in one click — because that is how the first customers actually buy. There is **one** of each thing that can be counted: one domain, one certification, one artifact brief, one rubric, one credential (see **DR-01**). **That is the entire product.** No credential ladder, no levels, no course catalogue, no self-paced route to the credential, no community, no chapters, no events, no marketplace, no badges standard, no proctoring vendor, no adaptive engine, no second domain, no CPD, no renewal, no mobile app.

**Programme count is deliberately not fixed** (DR-02 §4.1). V1 supports a deliberately small and credible portfolio of genuine flagship programmes and scheduled offerings. Launch inventory is a commercial and content decision, never an architectural constraint, and nothing in this document encodes a number.

---

# 2. WHAT WE ARE BUILDING

Nine module slots, of which **eight are built in V1** — `M8` is deferred by DR-02. Each is listed with the *minimum* implementation — not the specced one. Module identifiers are stable and are not renumbered.

### M1 — Identity & Accounts `must`
Email/password + Google sign-in. Email verification. Password reset. Profile (name, photo, headline, country, target role). **Scoped many-to-many roles from day one** (`user_roles` with `scope_type` / `scope_id`) — this is a Retrofit Test item; a single `role` column will cost you a rewrite. Roles needed at launch: `learner`, `assessor`, `instructor`, `org_admin`, `platform_admin`.

### M2 — Skills & Diagnostic `must` — *proves clause 1*
- **A flat skill list, not a graph.** ~35 skills in the pilot domain, grouped by area. **No prerequisite DAG. No decay. No altitude matrix.** A `skills` table with `domain_id`, `area` and `display_order` is sufficient and does not block the graph later. `domain_id` comes from the `domains` table, never from a constant.
- **A fixed diagnostic**: 20 scenario questions, each mapped to 1–2 skills, with "I'm not sure" as an equal-weight unpenalised option. Branching allowed at two points (by self-declared experience) — that is enough to feel personal. **No item-response-theory, no adaptive selection.**
- **Gap report**: per-skill proficiency 1–5, ranked named gaps in plain language, and an explicit "here is what you already have" list. The report resolves to **a programme that closes the named gaps, and when it next runs** — not to a self-serve enrolment.
- **Append-only `skill_assertions`** with `source`, `evidence_ref`, `asserted_at`. Retrofit Test item.

### M3 — Programmes, Scheduling & Supporting Materials `must` — *reframed by DR-02*
- **The programme is the unit of the product.** Programme → scheduled offering / cohort → session → supporting materials (DR-02 §4). A programme states what a participant will be able to do; a scheduled offering states format, dates, location or platform, capacity, and the expert delivering it; sessions are what attendance is captured against (`M9`).
- **Public programme discovery and scheduling.** Programme detail, and a listing of upcoming scheduled offerings with real dates and formats. This is the primary public pathway and it did not previously exist. **No catalogue, no faceted browse, no course counts, no depth-as-value-signal.**
- **Registration** into a scheduled offering — individually, or by invitation into a private cohort (`M9`).
- **Supporting materials**, bounded by DR-02 §5: presentation materials, reading resources, templates, exercises, case studies, reference resources, practice activities, session preparation, post-session reinforcement, and selected recordings of live sessions where appropriate. They **prepare, extend, reinforce or document** expert-led learning. **They must not silently replace it.** A recording documents a session that happened; it is never presented, priced or navigated as a pre-recorded course.
- Knowledge checks where they serve a programme: unlimited attempts, explanation always shown, non-blocking. Never a gate, never a substitute for delivery.
- **Retired from V1:** the browsable course catalogue · the lesson player as the screen where participants spend most of their time · sequential video consumption · completion-by-watching · any self-paced route to the credential. *Retired from the MVP and from the current product identity — not declared permanently impossible. Supplementary pre-recorded material may return later under the DR-02 §5 boundary, with separate justification.*
- **Content authored by the team through a simple admin CRUD or MDX files in the repo.** No authoring studio. No WYSIWYG. No review workflow — one person publishes.
- **Version fields on content records** (`version`, `status`, `reviewed_at`) even though nothing reads them yet. Retrofit Test item — unchanged.

### M4 — Knowledge Library `must (thin)`
20–30 articles covering the Data Foundations canon. Public, SEO-indexed, three-depth progressive disclosure, version stamp displayed. A glossary of ~60 terms. **A simple changelog page** (a list — an afternoon's work, and it is a visible differentiator). No frameworks library, no templates library, no case studies, no prompt library, no cross-link graph.
**Second job:** it is a credibility surface and a reference for participants during and after a programme. *(Its former second job — serving as the AI tutor's retrieval corpus — lapses with `M8`. The library stands on its own for SEO, credibility and participant reference, and would be the corpus again if a tutor were ever justified.)*

### M5 — Assessment `must` — *proves clause 2, part one*
- One knowledge assessment: 60 fixed items, 60 minutes, randomised order, **one pass threshold** (70%). Not banded — bands existed only to place candidates onto a ladder, and there is no ladder in V1. The score and a per-skill breakdown are always shown; the threshold is a gate, not a placement. Highest score across attempts is retained.
- **No proctoring vendor.** Integrity at MVP = honour undertaking + time limit + randomised order + **in-room invigilation for corporate cohorts, which is how the first customers buy anyway**. Say this openly on the credential page. The artifact is the real integrity control.
- One fixed form. No item bank rotation, no psychometrics dashboard, no exposure control. Track per-item pass rates in a table and review by eye.

### M6 — Evidence & Assessment Workflow `must` ★ — *proves clause 2, part two; this is the product*
- **Artifact brief with 3 hand-written variants** (different industries). Not generated — written once, assigned round-robin.
- **One published rubric**: 5 criteria × 4 achievement levels (Not yet / Competent / Proficient / Distinguished), visible before purchase and permanently visible during work. **The rubric carries all grade differentiation in V1** — it is what replaces the removed score bands.
- **Three real exemplar artifacts** at Competent / Proficient / Distinguished. *Non-negotiable. These cannot be faked and cannot be deferred — they are the single highest-impact asset for getting candidates through the evidence gate.*
- Submission workspace: file upload + rich text, autosave, deliverable checklist, AI-use disclosure field, self-check against rubric.
- **Assessor workbench**: queue, artifact viewer, rubric grader, written reasoning per criterion, decision (Award / Resubmit / Not yet).
- Result screen showing the rubric with the assessor's selections and reasoning.
- **No AI pre-assessment. No blind-assignment automation. No moderation sampling. No calibration. No appeals workflow.** With 2–4 assessors, assignment is manual and disagreements are a conversation.

### M7 — Credentials `must` — *proves clause 3*
- **One** credential definition, with **requirements as data rows** (`type: exam_threshold | artifact`) and `domain_id` / `level` / `sort_order` columns populated but unread. Retrofit Test item — credential #2 is then a row plus content, not a migration.
- Issuance when all requirements are met.
- **Permanent public verification page** at a stable URL: status, holder, credential, skills asserted, criteria met, dates, issuer statement.
- Downloadable badge image (PNG with embedded Open Badges 2.0 metadata — a JSON blob in a PNG chunk, genuinely trivial) and a PDF certificate.
- LinkedIn share with pre-composed text.
- **Deferred:** cryptographic W3C Verifiable Credentials, wallet export, third-party issuer integration, revocation UI, renewal, CPD.
- **Be honest publicly:** V1 delivers *practical* portability — a permanent URL anyone can check. Cryptographic verifiability ships in Phase 1C or Phase 2. Do not claim OB3.0 conformance before it is true; on a trust product that is the one lie you cannot afford.

### M8 — AI Tutor `DEFERRED FROM MVP` — *DR-02, Decision 2*

**Not built in V1. Not retired.**

Its original rationale was to unblock an isolated, self-paced learner with nobody to ask. Under the expert-led model the participant has an expert, a cohort and a session, so that rationale no longer describes the product. A differentiator or a feature must not survive on documentation continuity alone.

**Retained for the record, as the deferred design:** RAG over the `M4` library; answers only from the corpus; citations with version stamps on every substantive answer; "I don't have a sourced answer for that" when out of corpus; visibly disabled during assessment with the reason shown.

**Returning it requires separate strategic justification against the expert-led delivery model.** That "AI" is part of this organisation's subject domain is explicitly **not** a reason to force an AI tutor into the product. **It is not replaced by another AI feature**; V1 ships no learner-facing AI feature.

**Scope released by this deferral:** the embeddings provider, the AI data-processing agreement, RAG cost control and tutor rate-limiting all leave the MVP.

### M9 — Corporate & Private Delivery `must` — *a first-class pathway; this is how V1 gets paid*

*Reframed by DR-02 §8. Corporate training is a significant part of the business model, not an optional feature, and the earlier description of this module as a "thin slice running alongside" is superseded. **Strategic status changes; MVP workflow complexity does not.***

- **A credible corporate entry path**: the corporate offering explained, engagement formats, and a qualifying enquiry. **Not** a B2B sales lifecycle — no CRM, no proposal automation, no contract management, no complex self-service corporate portal. Any of those requires separate justification.
- Organisation account, seat invites (single + CSV), private cohort creation, roster.
- **Attendance capture** per session — bulk marking grid, retrospective correction with an audit trail.
- **Simple team progress table**: person × (diagnostic done / path % / assessment result / artifact status / credential). A sortable table, **not an interactive heatmap with drill-through**.
- **HRD Corp evidence pack generator**: one button producing a zipped, indexed bundle (attendance registers, participant list, trainer profile, course outline, learning outcomes, certificates, evaluation summary). This is templating plus a zip — low build cost, disproportionate commercial value, and it makes the platform structurally hard to leave.
- **Deferred:** SSO, SCIM, HRIS, heatmaps, benchmarking, uplift-vs-baseline charts, coverage risk, teams hierarchy, dynamic assignment rules, scheduled reports, org branding.

### Cross-cutting `must`
Payments (Stripe + FPX/DuitNow, MYR + USD only) · transactional email · basic admin CRUD · audit log on credential and assessment actions (Retrofit Test item) · error tracking · product analytics on the funnel · **externalised UI strings** so localisation is possible later without a rewrite.

---

# 3. WHAT WE ARE NOT BUILDING

Grouped by *why* it is cut, because the reason determines when it comes back.

> **Escalated by DR-02.** Three entries below were previously *deferred* — cut on timing. They are now **retired as strategic destinations**: the standards council, chapters and the accredited-partner programme. They may hold legitimate future value, but they no longer define the MVP identity, the primary strategic destination, or the product model. The organisation builds its own independent identity (DR-02 §1). Rows are marked **⊘ retired as destination** where this applies.

## 3.1 Cut because it needs people and process we do not have
These are **not engineering problems**. Building the screens would not make them work. This is the most important category in the document and the one most often missed.

| Deferred | The missing operational reality |
|---|---|
| Moderation sampling & inter-assessor calibration | Requires 6+ assessors to be meaningful. With 3, it is a conversation. |
| Appeals workflow | Requires an independent second assessor and a published policy. |
| Defence interviews (L3/L4) | Requires senior assessor availability and scheduling ops. |
| Standards council / governance workflows **⊘ retired as destination** | Requires an actual council — and DR-02 removes a standards body as the strategic destination. Independent, credible assessment integrity is retained as an operating principle; becoming a standards authority is not the goal. |
| Integrity casework & credential revocation UI | Requires an Integrity Officer and a two-person process. |
| Content review board & approval workflow | One author, one publisher. A workflow with one person in it is bureaucracy. |
| Benchmarking & industry comparison | Requires data from many organisations. Fabricating it is fraud. |
| Ratings & reviews | Requires ~50 reviews per course to be credible; 3 reviews reads as fabricated. |
| Chapters, events, mentoring, forums **⊘ retired as destination** | Requires a population. **An empty community damages a trust product more than no community.** DR-02 additionally retires chapters as a *core structural assumption* — including their documented role as the assessor-supply engine (see `M6` and DR-02 §7.2). Cohort-private groups and alumni may emerge from real delivery. |
| Accredited training partner programme **⊘ retired as destination** | Requires the credential to have market value first — and DR-02 inverts the model it belonged to. We deliver; we do not license others to teach toward our credential while we examine. Reframed as a curated expert / associate-trainer network (DR-02 §7). |
| Live chat support | Creates a response SLA a small team cannot meet. |

## 3.2 Cut because it is cheap to add later (fails the Retrofit Test in our favour)
Skill graph DAG with prerequisites · skill decay display · adaptive/IRT diagnostic · path generation engine · path planner · learning history & transcript · evidence portfolio (public) · calendar & sessions module · notifications centre · global search · CPD ledger · renewal & currency assessment · digital wallet export · bulk verification · credential directory · labs & sandboxes · in-course assignments · SCORM/xAPI/LRS · LTI & academic console · SSO/SCIM/HRIS · Slack/Teams · scheduled reports · multi-currency beyond MYR/USD · localisation · native mobile apps · instructor earnings & payouts · authoring studio.

## 3.3 Cut because it is too early conceptually
| Deferred | Why |
|---|---|
| **The credential ladder as distinct offerings (L1, L2, L3, L4)** | L4 requires holding L3 for 2 years — nobody qualifies before 2029. L3 requires defences and experience verification. L1 is exam-only, and shipping it would let candidates buy a credential while skipping the evidence gate — corrupting the one metric the MVP exists to measure. **Ship ONE credential — see DR-01.** |
| **Specialism / elective composition** | Requires ≥4 specialism exams to exist. |
| **Micro-credentials** | Actively harmful now: they dilute the credential's meaning at exactly the moment it must be sharp. |
| **Domains DE, AI, GT** | Ship DF (owned) + Literacy. GA (GenAI) is the highest-value second domain — Phase 2, not MVP. |
| **The 4-altitude matrix in the UI** | *Superseded in its reasoning by DR-02, same outcome.* The catalogue this entry was arguing about is itself retired. **Domain survives** as subject scope, capability structure, and seeded data required by the approved expansion shape (`ADR-023`, §16). **Domain × altitude as a catalogue faceting device, and per-domain course counts, do not survive** — there is no browsable catalogue for them to face. Keep altitude as a data field; do not render it. |
| **Three AI-use policy tiers** | Only two are used at launch. Ship `Restricted` (exam) and `Disclosed` (artifact). |
| **Workspace switcher with 5 workspaces** | Four of five would have one user. Ship Learning + one role workspace. |

## 3.4 Cut deliberately and permanently — these are stances, not schedules
- **Gamification** — streaks, points, XP, leaderboards. A credential's value comes from being taken seriously. Leaderboards make it feel like a language app.
- **Social feed, follows, likes.**
- **Third-party course marketplace** — dilutes the quality control that *is* the trust proposition.
- **Automated credential decisions** — never. Not for L1, not "just the exam part". The moment a machine issues a credential unsupervised, the only argument the product has is gone.
- **Generous free tier on courses** — free knowledge library and free diagnostic are strategic; free courses train the market to expect free.

---

# 4. CORE USER TYPES

**Six. Not fourteen.** *(Five previously — DR-02 §7 restores the expert as a real role.)*

| # | Role | Why it exists in V1 | Screens |
|---|---|---|---|
| **U1** | **Visitor** | The funnel starts here. Programme discovery, the diagnostic, and credential verification are all anonymous. | Public + `P05`/`P06` |
| **U2** | **Participant / Candidate** | The whole promise. **Candidate is a *state*, not a separate role** — one person, one account, a `candidacy` record. *"Participant" replaces "learner" where a person is in a programme: presence is the point, and the vocabulary should carry it.* | Participant portal |
| **U3** | **Expert / Trainer** | **Expert-led delivery is the product.** The expert is publicly visible — a real, honest profile — and operationally needs exactly two screens: roster and attendance. | `P23`, `O07` |
| **U4** | **Assessor** | Without a human judging artifacts, the differentiator does not exist. **The single hardest role to staff — treat it as a launch dependency, not a feature.** | `A01`, `A03` |
| **U5** | **Corporate Admin** | How V1 gets paid. Runs private cohorts, needs attendance and the HRD Corp pack. | `O01`, `O02`, `O07`, `O10` |
| **U6** | **Platform Admin** | Publishes content and programmes, manages users, issues credentials manually if needed, generates packs. Internal-only; may be an ugly CRUD. | `X00` |

**On the expert role — the earlier instruction is superseded.** This document previously read: *"Instructor is deliberately not a distinct V1 role… do not build an instructor portal."* Under DR-02 the expert is a real role with a **public profile**, because expert practitioners and expert-led delivery are core product value. Two obligations hold together:

- **Honest representation.** If one genuine expert delivers at launch, the product shows one. **No fabricated expert profiles, ever** — not for visual balance, not for marketing, not to appear larger.
- **Expandable model.** Adding a lead trainer, associate trainer, facilitator or guest expert must be **a data operation plus content, never a redesign**. No founder-bound design.

There is still **no instructor portal** in V1 — the role needs a public profile plus roster and attendance, nothing more.

**Enforce in code from day one**, even with three users: an assessor cannot decide on an artifact submitted by a participant in a cohort they taught (`BR-1`). It is a one-line check now and a credibility crisis later.

> **Two things DR-02 §7.1 requires be kept apart here.** The **principle** — that meaningful credentials involve credible, qualified assessment and never collapse into content consumption plus certificate generation — is strategically durable and is not weakened. The **operating model** for supplying and scaling assessor capacity is **evolvable**. Under expert-led delivery the practical consequence of `BR-1` becomes more visible, because experts teach the cohorts: an expert who delivers a cohort does not assess it. Plan around it. **Do not record it as a permanent constraint on the business** — and note that the chapter-based contributor ladder that previously answered assessor supply has been retired (§3.1), leaving this an openly tracked issue (DR-02 §7.2).

---

# 5. MVP USER JOURNEY

**Two journeys, both first-class.** Journey A is the individual professional; Journey B is the corporate client. They converge at delivery and share every module — **no separate product**. If a proposed feature does not appear on one of these lines, it is not in V1.

**What changed.** The previous single journey ran `diagnostic → account → dashboard → lesson player (repeat) → exam → artifact`. That is a self-serve digital funnel, and it is superseded by DR-02. **Expert-led participation now sits at the centre of the line** — it is the step the portal exists to support, not one it replaces. The diagnostic moves from mandatory gateway to optional accelerator and capability-assessment entry offer.

### Journey A — the individual professional

```
 VISITOR
    │  arrives (search · a colleague's credential · knowledge article · referral)
    ▼
 [P10] PROGRAMME — what you'll be able to do · who delivers it · format · duration
    │
    ├── optional ──▶ [P05] CAPABILITY ASSESSMENT · 20 questions · ~10 min
    │                   ▼
    │                [P06] GAP REPORT — "You can explain what metadata is.
    │                   │   You cannot yet design a lineage capability."
    │                   │   → resolves to a programme, and when it next runs
    │                   ◀───┘
    ▼
 [P24] SCHEDULED OFFERINGS — choose format and date
    │   face-to-face · live online       ⚑ a real, populated calendar is required;
    │                                      an empty calendar fails the same way an
    │                                      empty catalogue would
    ▼
 [K03] REGISTER — confirm · accept the integrity undertaking · pay
    │
    ▼
 ★ EXPERT-LED PROGRAMME — live online or face-to-face
    │   interaction · questions · discussion · practical examples ·
    │   expert feedback · peers from real organisations
    │
    │   THIS IS THE PRODUCT. The portal supports it — schedule, joining
    │   details, roster, attendance, materials — and does not replace it.
    │
    │   [L01] shows the participant their next session and what is due.
    │   Supporting materials prepare, extend and reinforce (DR-02 §5).
    ▼                                                    "prove it by doing
 [K05] KNOWLEDGE ASSESSMENT · 60 items · 60 min · one threshold      the work"
    │        < 70 → score + per-skill gap report + retake  ↺
    │        ≥ 70 → knowledge requirement met ✔
    ▼
 [K06] ★★ APPLIED ARTIFACT — the evidence gate
    │   real brief (1 of 3 variants) · rubric always visible ·
    │   3 exemplars · deliverable checklist · AI-use disclosure ·
    │   self-check · submit
    │
    │   ⚑ THE CRITICAL DROP-OFF. Everything above exists to get
    │     someone to this point; everything below only matters if
    │     they submit. Instrument it from candidate one.
    ▼
 [A03] QUALIFIED ASSESSOR reads it, grades against the rubric,
    │   writes reasoned feedback per criterion · 10 working day SLA
    ▼
 [K08] RESULT
    │      ├─ NOT YET → rubric + reasoning + specific remediation +
    │      │            one free resubmission. Never the word "failed".  ↺
    │      └─ AWARDED
    ▼                                                          "carry the proof
 [K10] CREDENTIAL AWARDED — full-screen moment                       anywhere"
    ▼
 [P16] PUBLIC VERIFICATION PAGE — permanent URL
    │   an employer checks it without an account
    │
    └──▶ shared to LinkedIn ──▶ a stranger clicks the badge ──▶ VISITOR ↺
                                                          (the growth loop)
```

### Journey B — the corporate client

```
 DISCOVER  [P17] the corporate offering · engagement formats · funding
    │
    ▼
 ENQUIRE   [P19] qualifying enquiry — team, size, sector, timeline, funding
    │
    ▼
 DIAGNOSE  [P05]/[P06] team capability assessment → the gap picture
    │        ⚑ the land motion: sell the diagnosis first
    ▼
 AGREE     programme, format, dates, location          ← OUTSIDE the portal.
    │                                                    No CRM, no proposal
    │                                                    automation, no contract
    │                                                    management in V1.
    ▼
 SCHEDULE  [O07] private cohort created · roster invited · seats activated
    │
    ▼
 ★ DELIVER — on-site or live online, expert-led, attendance captured
    │
    ▼
 EVIDENCE  participants sit the assessment, produce artifacts → assessed →
    │      credentials issued
    ▼
 PROVE     [O01] progress · [O10] HRD Corp evidence pack in one click
    │
    ▼
 EXPAND    next team, next programme
```

**Both journeys run on the same eight modules.** The corporate participant's experience from delivery onward is identical to Journey A; only the entry, the scheduling and the reporting differ.

---

# 6. MVP SCREEN LIST

**44 screens** for the functional MVP — re-derived from the corrected journeys in §5, and still well below the 71 MVP-tagged in the mockup specification and the 133 in the full inventory. The count is unchanged; its composition is not.

> **Re-derived by DR-02.** Net scope is **lower**, not higher: the catalogue, the AI tutor and video-first content leave; programme scheduling, an expert profile and a corporate entry path arrive. Two new identifiers are introduced — **`P23`** expert profile and **`P24`** scheduled offerings — chosen beyond the existing `P01`–`P22` range so that nothing is renumbered. **The Mockup Specification must adopt these in propagation Stage 3**; until then its inventory is stale on this point.

**Priority key:** `P0` = a journey in §5 breaks without it · `P1` = required to operate commercially, can land in Phase 1C.

**Merges already applied** (each saves design *and* build time):
`P14`+`P15` → one page (there is only one credential) · `P17`+`P18` → one corporate page · `P04` → a section of `P15` · `C06`/`C07`/`C10` → block states of `C05` · `K05c`/`K07` → states of `K01` · `K02` → a card on `K01` · `K03b` accommodations → a field in `K03` + an admin flag · `L02`+`L03` → `L04` · `L06`+`L07`+`L08` → one **My Work** screen · `A01`+`A02` → one queue screen · `C12` → a state of `C02` · all `X` screens → one tabbed admin console.

## Public — 12
| ID | Screen | Purpose | Pri |
|---|---|---|---|
| P01 | Homepage | Establish an expert-led training and certification organisation; route to the three pathways — **explore upcoming programmes** (primary) · **train your team** (major secondary) · **assess your capability** (supporting) | **P0** |
| P02 | About | Establish a real, accountable organisation stands behind the credential | P1 |
| P05 | Capability Assessment *(diagnostic)* | Deliver value before asking for anything; the individual readiness check **and** the corporate land motion | **P0** |
| P06 | Assessment Result | Name the gap specifically → **resolve to a programme and when it next runs** | **P0** |
| P10 | **Programme Detail** | The offer: outcomes as capabilities, **who delivers it**, formats, duration, what happens in the room, fees | **P0** |
| P24 | **Scheduled Offerings** *(new)* | Upcoming cohorts with real dates, formats and locations. **The primary public pathway; did not previously exist** | **P0** |
| P23 | **Expert Profile** *(new)* | Who teaches, and what they have actually built. **Honest — genuine experts only, never fabricated** | **P0** |
| P15 | Credential Detail *(incl. integrity & AI policy)* | Requirements, **rubric, exemplars**, fees, timeline | **P0** |
| P16 | Public Credential Verification | Where an employer first meets the brand; the growth loop | **P0** |
| P17 | Corporate & Funding | The corporate offering, engagement formats, the HRD Corp evidence pack. **Promoted to `P0` — Journey B starts here** | **P0** |
| P19 | Corporate Enquiry | Qualifying enquiry. **Promoted to `P0` — the corporate entry path, and the boundary: an enquiry, not a sales lifecycle** | **P0** |
| P99 | Legal *(terms, privacy, accessibility)* | Required to transact | P1 |

**Retired from the public surface:** `P12` Course Landing — there is no course to land on. Its useful content (outcomes, what you will be able to do, who teaches it) is absorbed into `P10` Programme Detail. Any faceted course catalogue is retired outright (§3.3).

## Shared / System — 5
| ID | Screen | Purpose | Pri |
|---|---|---|---|
| S01 | Sign in | Access | **P0** |
| S02 | Sign up *(modal over P06)* | Unlock the full gap report | **P0** |
| S04 | Email verification | Account integrity | **P0** |
| S06 | Profile & Settings *(incl. refund request, data export/delete)* | Self-service; PDPA obligation | P1 |
| S10 | Error, empty & loading states | Never a dead end | P1 |

## Participant — 5
| ID | Screen | Purpose | Pri |
|---|---|---|---|
| L01 | Dashboard | *What is my next session, and what is due?* — led by the next scheduled session, **not** by a "continue your lesson" card | **P0** |
| L04 | **My Programme** | Where the participant is in the programme: sessions, attendance, materials, what comes next | **P0** |
| L05 | Skills Profile | Capability truth + the evidence behind every claim | **P0** |
| L06 | My Work *(assessments · artifacts)* | One place for everything submitted or due | P1 |
| L09 | My Credentials | Hold, view, share the proof | **P0** |

**Retired:** `L14` AI Tutor — deferred with `M8`. **V1 ships no learner-facing AI feature and does not substitute another.**

## Programme materials — 3
| ID | Screen | Purpose | Pri |
|---|---|---|---|
| C02 | **Programme Home** *(incl. completion state)* | Base inside a programme: sessions, materials, progress | **P0** |
| C03 | Curriculum / Syllabus *(printable)* | Participant orientation **and** the HRD Corp course-outline document | P1 |
| C05 | **Materials Viewer** *(reading · downloads · knowledge check · session recording where appropriate)* | **Demoted from ★ `P0`.** Supporting materials under the DR-02 §5 boundary — it prepares, extends, reinforces or documents. It is **not** where participants spend most of their time, and it is not a video-first lesson player | P1 |

## Certification — 7
| ID | Screen | Purpose | Pri |
|---|---|---|---|
| K01 | Candidacy Tracker *(incl. readiness, under-review states)* | Always show stage, next action, expected timing | **P0** |
| K03 | Register as Candidate *(incl. accommodations request)* | Pay, accept integrity undertaking, open the window | **P0** |
| K05a | Assessment Pre-flight | Rules, AI policy: Restricted, no surprises | **P0** |
| K05b | Assessment Runner | Calm, focused, autosaving | **P0** |
| K06 | **Artifact Brief & Workspace** ★★ | **The product.** Brief variant, rubric, exemplars, submit | **P0** |
| K08 | Result & Feedback | A decision the candidate accepts as fair, either way | **P0** |
| K10 | Credential Awarded | The moment that earns the price and drives the share | **P0** |

## Knowledge — 4
| ID | Screen | Purpose | Pri |
|---|---|---|---|
| N01 | Library Home | Entry to the corpus; SEO surface | P1 |
| N03 | Knowledge Article | SEO landing · credibility surface · participant reference | **P0** |
| N04 | Glossary *(index + term)* | Highest SEO return per unit of effort | P1 |
| N10 | Changelog | Proof that the knowledge is living, not static | P1 |

## Assessor — 2
| ID | Screen | Purpose | Pri |
|---|---|---|---|
| A01 | Assessor Queue & Dashboard | What is assigned to me, and what is aging | **P0** |
| A03 | **Assessment Review Workbench** ★ | Read the artifact, grade the rubric, write the reasoning | **P0** |

## Corporate — 5
| ID | Screen | Purpose | Pri |
|---|---|---|---|
| O01 | Org Dashboard *(simple table, not a heatmap)* | Is my cohort progressing, and who is stuck | **P0** |
| O02 | People & Seats | Invite, activate, chase | **P0** |
| O03 | Individual Learner View | Manager detail with an explicit privacy boundary | P1 |
| O07 | Cohort Detail + Attendance Grid | The most-used screen in a claimable programme; also the expert's delivery surface (`U3`) | **P0** |
| O10 | Compliance & HRD Corp Evidence Pack | One click replaces hours of admin; hard to leave | **P0** |

## Admin — 1
| ID | Screen | Purpose | Pri |
|---|---|---|---|
| X00 | Admin Console *(tabs: content · users · orgs · credentials · items · packs)* | Internal operations. **May be ugly. Nobody outside the team sees it.** | P1 |

**Totals: 44 screens · 32 at `P0` · 12 at `P1`.**

**Net effect of the DR-02 re-derivation:** out go `P12` Course Landing, `L14` AI Tutor and the faceted catalogue; in come `P23` Expert Profile and `P24` Scheduled Offerings; `P17` and `P19` rise to `P0` because Journey B begins there; `C05` falls to `P1` as a materials surface. **Same screen count, materially less build** — a scheduling listing and an expert profile cost far less than a lesson player, a video pipeline and a RAG tutor.

---

# 7. FIRST MOCKUP SCOPE

**Exactly 16 screens.** These must form a complete clickable prototype that tells the entire product story with no narration.

> **Re-derived by DR-02.** The lesson player is out; scheduled offerings and programme detail are in. The story the prototype must now tell is *expert-led training whose outcome is provable* — if a viewer comes away thinking "online course platform", the prototype has failed no matter how good it looks.

**Selection test:** *would removing this screen break the story?* Not "is it useful" — every screen is useful.

| # | ID | Screen | What the story needs it for |
|---|---|---|---|
| 1 | `P01` | Homepage | The promise, stated once, with three doors |
| 2 | `P05` | Diagnostic *(one question state)* | We ask before we sell |
| 3 | `P06` | **Diagnostic Result** ★ | **Clause 1 delivered.** The "how did you know that?" moment |
| 4 | `P10` | **Programme Detail** | The offer — outcomes as capabilities, **who delivers it**, formats, what happens in the room |
| 4b | `P15` | Credential Detail | The proof of outcome — with the **rubric and exemplars visible before purchase**. This is D1 on the public site |
| 5 | `L01` | **Participant Dashboard** ★ | The workspace. Led by the next session; contains the programme strip and candidacy tracker as *components* |
| 6 | `P24` | **Scheduled Offerings** ★ | *Replaces the lesson player in the mockup.* Real dates, formats and locations — the moment the product reads as expert-led rather than self-paced |
| 7 | `L05` | **Skills Profile** ★ | Capability made visible; evidence behind every claim |
| 8 | `K05b` | Assessment Runner | The knowledge half of proving |
| 9 | `K06` | **Artifact Workspace** ★★ | **Clause 2 delivered.** The single most important screen in the product |
| 10 | `K08` | **Result & Feedback** ★ | A human judged this, and showed their reasoning |
| 11 | `K10` | Credential Awarded | The payoff moment |
| 12 | `P16` | **Public Verification** ★ | **Clause 3 delivered.** An employer checks it without an account |
| 13 | `A03` | **Assessor Review Workbench** ★ | Proves a qualified human really does the judging |
| 14 | `O01` | Org Dashboard | The commercial story — this is how it gets bought |
| 15 | `O10` | HRD Corp Evidence Pack | The Malaysian closer; removes the buyer's biggest objection |

**Shown as modal or inline states, not as separate screens:** sign-up, checkout, candidate registration, knowledge check, submission confirmation. This keeps the count honest without hiding the flow.

**The clickable path through the prototype:**
```
P01 → P10 → P24 → [register modal] → L01 → L05 → L01
    → P05 → P06 → P15 → K05b → K06 → K08 → K10 → P16
    → [switch persona] → A03 → [switch persona] → O01 → O10
```

**Done means:** a viewer who has never heard of this organisation clicks that path and, unprompted, can say that this is **expert-led professional training with a credential that has to be earned** — and can say what makes it different from a course marketplace. If they cannot, the prototype has failed regardless of how good it looks — go back to `P01`, `P10`/`P24`, `K06`, `K08` and `P16`, because those carry the entire argument.

---

# 8. MVP DATA MODEL

**17 tables.** Deliberately boring. Retrofit Test decisions are marked ⚑ — those shapes cost nothing now and a rewrite later. Expansion columns required by **DR-01** are marked ⊕: present, populated with a single value, and read by nothing in V1. See §16.1.

> **⚠ Reconciliation deferred — read before using this section.** DR-02 introduces **programme**, **scheduled offering**, **delivery format**, **location** and **individual registration** as product concepts (DR-02 §4). Some of what they need already exists below — `cohorts`, `sessions` and `attendance` are in row 16 — but the model as written is still course-shaped and has no public, individually-registerable scheduled offering.
>
> **This section is deliberately left unchanged.** No table, column, type or relationship is added, altered or removed here. Physical data-model change is a RED gate under `CLAUDE.md` Rule 1, and DR-02 §6 explicitly holds the implementation question open — including how programme participation is represented in the credential model, which is a *policy* decision (§6 below) before it is a schema one.
>
> **The reconciliation belongs to controlled downstream architecture work, not to this propagation stage.** Until then, treat this section as accurate for everything it lists and **incomplete** for the DR-02 concepts. It must not be read as evidence that those concepts are out of scope.

```
users ──< user_roles >── (role, scope_type, scope_id)          ⚑ scoped RBAC
  │
  ├──< enrolments >── paths / courses
  ├──< progress >── lessons
  ├──< skill_assertions >── skills                             ⚑ append-only
  ├──< candidacies >── credential_defs ──< requirements >      ⚑ requirements as data
  │        └──< credentials >── (public verification uid)
  ├──< assessment_attempts >── assessment_forms ──< items >
  ├──< submissions >── assignments ──< evaluations >── rubrics
  └──< org_memberships >── organisations ──< cohorts >──< attendance >
                                                              ⚑ organisation_id everywhere
content: paths → courses → modules → lessons → blocks          ⚑ version fields
knowledge_articles (+ version, changelog entries)
audit_log                                                      ⚑ credential & assessment actions
```

| # | Table | Essential columns beyond id/timestamps | Note |
|---|---|---|---|
| 1 | `users` | email, name, photo, country, target_role | One account per person, always |
| 2 | `user_roles` | user_id, role, **scope_type**, **scope_id** | ⚑ Never a `role` column on `users` |
| 0 | `domains` | code, name, slug, description | ⊕ One seeded row. **The pilot domain is data, never a constant** |
| 3 | `skills` | **domain_id**, code, name, area, description | **Flat list.** No prerequisites, no decay, no altitude |
| 4 | `skill_assertions` | user_id, skill_id, proficiency 1–5, **source**, **evidence_ref**, asserted_at | ⚑ Append-only. Never update — insert |
| 5 | `paths` / `courses` / `modules` / `lessons` / `blocks` | **domain_id** (paths, courses), title, slug, order, **version**, **status** | Five tables, one hierarchy. ⚑ version fields even though unread · ⊕ domain_id |
| 6 | `skill_mappings` | content_id, content_type, skill_id, weight | What teaches what |
| 7 | `enrolments` | user_id, path_id/course_id, status, started_at | |
| 8 | `progress` | user_id, lesson_id, state, position, completed_at | Resume-to-the-second |
| 9 | `items` | stem, options, correct, skill_id, type | One bank, no psychometrics |
| 10 | `assessment_forms` / `attempts` / `responses` | **domain_id**, form, user, started, submitted, **score, passed** | Responses immutable. No `band` column — DR-01 · ⊕ domain_id |
| 11 | `assignments` / `brief_variants` / `rubrics` | brief, deliverables, criteria × levels | 3 hand-written variants |
| 12 | `submissions` | candidacy_id, files, text, ai_disclosure, self_check, state | |
| 13 | `evaluations` | submission_id, assessor_id, per-criterion level + reasoning, decision | The trust record |
| 14 | `credential_defs` / `requirements` | **domain_id, level, sort_order, version**; requirement type: `exam_threshold` \| `artifact`, threshold | ⚑ Requirements as rows → credential #2 needs no new screens · ⊕ `level` and `sort_order` are **two integer columns nothing reads** — the entire cost of keeping the ladder possible |
| 15 | `candidacies` / `credentials` | state machine; **public_uid**, issued_at, expires_at, status | `public_uid` is the verification URL |
| 16 | `organisations` / `org_memberships` / `cohorts` / `sessions` / `attendance` | **organisation_id** on all | ⚑ Multi-tenancy from commit one |
| + | `knowledge_articles` + `article_versions` | **domain_id**, body, version, reviewed_at, changelog_note | Feeds SEO, tutor, changelog · ⊕ domain_id |
| + | `audit_log` | actor, action, entity, before/after | ⚑ Credential + assessment actions only |

**Explicitly NOT in the MVP data model:** credential level hierarchies or band-mapping tables (DR-01) · skill prerequisites/DAG · skill decay parameters · role profiles · path generation state · item psychometrics · exposure counts · moderation records · calibration scores · appeals · CPD entries · renewals · badges/VC signing keys · community tables · event tables · LRS statements · partner tables · funding scheme profiles (the HRD Corp pack reads from `cohorts`/`attendance` directly).

---

# 9. MVP TECHNICAL ARCHITECTURE

**One deployable application. One database. No microservices, no graph database, no event bus, no message broker, no LRS, no vector store until the tutor needs one.**

### Stack

| Layer | Choice | Why |
|---|---|---|
| App | **Next.js (App Router) + TypeScript**, one repo, one deploy | SSR/SSG for the SEO surface (`N03`, `N04`, `P16`) and the app in the same codebase. One language end to end |
| UI | Tailwind + Radix/shadcn primitives + design tokens | Accessible primitives free; tokens map to the design system |
| API | Server actions + typed route handlers | No separate API service. tRPC optional, not required |
| DB | **PostgreSQL** (managed — Neon/Supabase/RDS) | Relational integrity matters for credentials and assessments |
| ORM | Prisma or Drizzle | Migrations you can read |
| Auth | Auth.js or Clerk | **Do not build auth.** SSO comes later via the same provider |
| Files | S3-compatible (R2/S3) + signed URLs | Artifacts, evidence packs, badge images |
| Video | **Not required in V1** — deferred with the lesson player (DR-02). If session recordings are offered later as supporting material (DR-02 §5), use a managed provider | **Never build video** — and in V1, do not buy one either |
| Email | Resend / Postmark | |
| Payments | **Stripe + a Malaysian rail (FPX/DuitNow)**, MYR + USD only | Local payment materially affects conversion in the primary market |
| Background work | **A `jobs` table + a cron route.** Not a queue service | Only three jobs exist: send email, generate evidence pack, index article |
| AI | **None in V1** — deferred with `M8`. Retained as the design if a tutor is ever justified: Claude via a thin server-side service, **pgvector in the same Postgres**, model routing behind one function | Releases the embeddings provider, the data-processing agreement, RAG cost control and rate-limiting from MVP scope |
| Search | Postgres full-text | ~30 articles. OpenSearch would be absurd |
| Hosting | Vercel (or a single container on any managed host) | |
| Observability | Sentry + a product analytics tool | The funnel must be measurable from day one |

### Deliberate non-decisions
- **No graph database.** 35 skills in a flat table. Even the full DAG later is a Postgres recursive CTE — the graph DB is a Phase 3 conversation at the earliest, probably never.
- **No microservices.** The blueprint's three-service split (assessment / AI / analytics) is correct *eventually*. In V1 it is three folders with clean boundaries. Keep assessment logic in its own module with no imports from marketing code, and extracting it later is a day's work.
- **No event bus.** Direct function calls plus the `jobs` table. Revisit at ~10k users.
- **No LRS / xAPI.** An `events` table. Emit xAPI-shaped payloads later from the same rows.
- **No proctoring vendor.** See §2/M5. This removes an integration, a cost centre, an accessibility problem, and a conversion killer.
- **No badge signing infrastructure.** A `public_uid` and a page. Open Badges 2.0 metadata baked into the PNG is ~50 lines.

### Non-negotiable engineering rules
1. `organisation_id` on every org-scoped table **from commit one.** Retrofitting multi-tenancy is a rewrite.
2. `skill_assertions` and `responses` are **insert-only.** No `UPDATE`. Ever.
3. Every credential and assessment mutation writes an `audit_log` row.
4. UI strings live in one place. Not because we localise in V1 — because extracting them later touches every file.
5. An assessor cannot evaluate a submission from a cohort they instructed. **One database check, enforced in code, from day one.**
6. **No domain or credential-level literal anywhere in application code.** A grep for the pilot domain slug outside seed files and content must return zero hits. Domain-scoped queries take a `domainId` parameter even though only one value is ever passed. See §16.2.
7. Assessment content is not readable by non-assessor, non-admin roles at the query layer. Not just hidden in the UI.

### Team and timeline reality check
This is buildable by **1–2 developers plus a designer, AI-assisted, in roughly 14–18 weeks** to a pilot-ready state — *provided* content, the skill list, the item bank, the rubric, and the three exemplars are produced **in parallel**, not after. Those are the real critical path, and they are not engineering work. Three of the four are yours to write.

---

# 10. BUILD PHASES

## Phase 1A — First Mockup · ~5–7 weeks

**Goal:** a clickable prototype that sells the story, tested on real people, before any production code.

| Week | Work |
|---|---|
| 1 | **Design tokens + the five signature components**: `CredentialCard`, `SkillMeter`, `MilestoneTimeline`, `RubricPanel`, plus the diagnostic question canvas. Light + dark. Nothing else starts until these exist |
| 2 | `P01` · `P10` · `P24` — the organisation, the programme, and when it runs |
| 3 | `L01` · `L05` · `P05`/`P06` — the participant workspace and the capability assessment |
| 4 | `P15` · `K05b` · `K06` — the credential and the evidence gate. **`K06` gets the most iteration of any screen** |
| 5 | `K08` · `K10` · `P16` · `A03` — judgement, award, verification |
| 6 | `O01` · `O10` — the commercial story · responsive passes · modal states |
| 7 | Prototype wiring · **test with 8–10 real people** · revise |

**Exit criteria — all four must hold:**
1. Five strangers click the path unprompted and articulate that this is **expert-led professional training with an earned credential** — and the difference from a course marketplace.
2. Three target-persona learners say the gap report in `P06` told them something they did not know.
3. One corporate buyer looks at `O01` + `O10` and asks what it costs.
4. **You are willing to be judged on `K06`.** If it still feels intimidating rather than achievable, do not proceed — fix it here, where fixing is free.

**Run in parallel (not engineering work, and it is the real critical path):**
skill list (~35) · diagnostic questions (20) · item bank (60) · **the artifact brief + 3 variants** · **the rubric** · **the 3 exemplars** · 20 knowledge articles · restructure the 8 Data Blueprint modules.

## Phase 1B — Functional MVP · ~10–12 weeks

Build the 30 `P0` screens against real data. Sequence by dependency, not by screen glamour:

| Block | Weeks | Contents |
|---|---|---|
| Foundations | 1–2 | Auth, scoped roles, schema, admin CRUD, payments |
| **Programmes & scheduling** | 3–5 | Programme model, scheduled offerings, registration, `P10`, `P24`, `P23`, `C02`, materials |
| Skills & capability assessment | 5–6 | Skills, `P05`, `P06`, `skill_assertions`, `L05`, `L01`, `L04` |
| Assessment | 7–8 | Items, forms, `K05a/b`, threshold scoring, `K01`, `K03` |
| **Evidence** | 8–10 | **`K06`, `A01`, `A03`, `K08`** — the core; do not compress this |
| Credentials | 10–11 | `credential_defs`, requirement rules, issuance, `K10`, `L09`, **`P16`** |
| **Corporate & delivery** | 11–12 | `P17`, `P19`, `O01`, `O02`, `O07`, **`O10`** |
| Knowledge library | throughout | `N03`, article corpus, glossary, changelog. **No tutor — `M8` is deferred** |

**Exit criteria:** one person can complete §5 end to end on production, and one internal cohort has run through it fully.

## Phase 1C — Pilot Launch · ~8–10 weeks

**Not a public launch. One real paying cohort.**

1. Recruit and onboard **3–5 assessors** — the launch dependency, started in 1A, not here.
2. Deliver one corporate cohort (15–25 people) end to end, ideally HRD Corp claimable.
3. Run the full evidence cycle: exam → artifact → assessment → credential → verification → claim pack.
4. Add `P1` screens as the pilot proves they are needed — **not before**.
5. Instrument everything in §12 from day one of the cohort.
6. Optional if cheap: Open Badges 3.0 issuance via a third-party issuer.

**Exit criteria:** §12 met. **Do not start Phase 2 until they are.**

---

# 11. FEATURES TO FAKE IN THE MOCKUP

Faking is not cheating — it is how you test an expensive idea cheaply. The rule: **fake anything whose value is in how it feels; never fake anything whose value is in whether it is true.**

## 11.1 Fake these — Phase 1A

| Feature | How to fake it | Why faking is safe |
|---|---|---|
| **Diagnostic adaptivity** | 20 fixed questions, one visible branch | Participants cannot perceive adaptivity anyway; they perceive relevance |
| **Scheduled offerings** | A small, realistic set of dates and formats, **clearly identified as fixture data** | Testing whether "this is expert-led and it runs on a date" reads. **Never publish fabricated dates outside the prototype** (DR-02 §4.1) |
| **Skill proficiency numbers** | Hand-authored persona fixture | We're testing whether the *gap statement* lands, not the scoring maths |
| **Programme recommendation** | The gap report resolving to one real programme and its next date, presented as personalised | The specificity of the gap statement is the perceived personalisation, not any generation engine |
| **Corporate dashboard & progress table** | Seeded fixture data for one fictional org, 24 people | Testing whether a buyer reacts, not whether aggregation works |
| **AI pre-assessment on `A03`** | A static collapsed suggestion block with a confidence score | Tests the interaction pattern — where it sits, whether assessors ignore or over-trust it |
| ~~Video~~ | **Removed.** There is no lesson player to prove | Deferred with `M8` and the lesson player |
| **Search, notifications, calendar** | Static populated states | Pure chrome |
| **Payments** | Fake checkout → success | |
| **Badge cryptographic verification** | `P16` shows a verification seal; nothing is signed | Testing the *employer's* reaction to the page |
| **Assessment timer & proctoring chrome** | Counts down, saves nothing | |

## 11.2 NEVER fake these — even in the mockup

These carry the argument. Faking them means testing nothing.

| Must be real | Why |
|---|---|
| **The artifact brief** | If it is lorem ipsum, you learn nothing about whether the task feels achievable — the single biggest MVP risk |
| **The rubric** | The five criteria and four level descriptors must be the real ones. Writing them is the hardest product work in the project and it cannot be deferred |
| **The three exemplars** | The highest-impact asset for getting candidates through the evidence gate. A fake exemplar tests nothing |
| **The assessor's written feedback on `K08`** | Real reasoning against real criteria. This is what makes the credential feel judged rather than scored |
| **The gap statements in `P06`** | Real, specific, plain-language sentences. "You scored 2.4 on Metadata" is worthless; "You can explain what metadata is but not design a lineage capability" is the product |
| **Knowledge article content on `N03`** | It is the SEO surface, the credibility surface and a participant reference. Write it once, properly |
| **The HRD Corp evidence pack contents** | You already produce these documents by hand. Use the real ones |
| **The experts on `P23` and `P10`** | **No fabricated expert profiles, ever** — not in the prototype, not for visual balance, not to appear larger. If one genuine expert delivers, show one. Expert-led is the claim; a fake expert falsifies the claim itself (DR-02 §7) |
| **What actually happens in the room on `P10`** | The programme's real shape — the sessions, the discussion, the practical work. This is what a participant is buying |

**The pattern:** fake the *machinery*, never the *judgement*. Every item in 11.1 is plumbing. Every item in 11.2 is the thing being sold.

---

# 12. MVP SUCCESS CRITERIA

Phase 2 begins only when these are met. Ordered by how decisively each would kill or confirm the thesis.

## 12.1 The three gates — all must pass

| # | Criterion | Target | Why it is decisive |
|---|---|---|---|
| **G1** | **Artifact submission rate** — registered candidates who actually submit | **≥ 60%** | **The single most important number in the business.** If candidates pay, sit the exam, then never submit, the evidence-based premise has failed *silently*. Everything else is noise until this passes |
| **G2** | **Employer recognition** — named employers stating publicly they would treat the credential as a hiring signal | **≥ 3** | A credential nobody recognises is worthless regardless of how well it is built. This is business development, not product, and it cannot be deferred |
| **G3** | **Assessment SLA** — credential-bearing artifacts assessed within 10 working days | **≥ 90%** | Tests the operational model, not the software. Missing this proves the evidence model does not scale past the founder |

## 12.2 Commercial validation

| Criterion | Target |
|---|---|
| Paying corporate cohorts delivered end to end | ≥ 1 (2 is better — one is an anecdote) |
| Individual paying learners | ≥ 25 |
| HRD Corp claim submitted using a generated evidence pack, and accepted | 1 |
| Corporate customer commits to a second cohort | 1 |
| Assessor cost per credential as % of credential fee | **< 25%** — if a human assessment costs more than a quarter of the fee, the unit economics do not work and either price or process must change |

## 12.3 Product validation

*Re-derived by DR-02: the previous measures — diagnostic-to-account conversion, path completion, first lesson within 24h — were self-serve funnel metrics for a product we are no longer building.*

| Criterion | Target |
|---|---|
| Scheduled offerings that fill to a viable cohort size | ≥ 70% — an unfilled cohort is the expert-led equivalent of an abandoned funnel |
| Programme **attendance** across scheduled sessions | ≥ 85% — the participant showed up, which is the whole premise |
| Programme completion among registered participants | ≥ 80% (vs the 8–13% MOOC baseline the old target was benchmarked against — presence and a fixed date are the mechanism) |
| Participants proceeding from programme completion to candidacy | ≥ 50% |
| Capability assessment → programme enquiry or registration | ≥ 20% |
| Candidates rating the artifact requirement a *strength* rather than a barrier | ≥ 70% |
| Verification page views per issued credential | ≥ 3 (proves the growth loop works) |

**Targets are indicative and unvalidated.** No cohort has run. They exist so the first cohort is measured rather than felt, and they should be re-baselined against real delivery.

## 12.4 Trust validation

| Criterion | Target |
|---|---|
| Assessors other than the founder, calibrated and actively assessing | **≥ 2** — the key-person test |
| Assessment decisions the candidate accepts without dispute | ≥ 95% |
| Integrity incidents | 0 unresolved |

## 12.5 The honest failure conditions

State these now, before there is emotional investment. If any occurs, **stop and redesign rather than adding features**:

- **G1 below 40%** → the evidence gate is too hard or too vague. Lighten the artifact, add scaffolding within the programme, or reconsider the model. Do not build a second domain. **Do not resolve it by lowering the credential to attendance** — that is the failure mode DR-02 §6 exists to prevent.
- **G3 below 70%** → the assessment model does not scale. Cap intake, recruit assessors, or reduce artifact complexity. Do not launch publicly.
- **Zero employer recognition after 6 months of trying** → the credential thesis is wrong for this market. Pivot toward corporate capability-building where *you* are the recognised authority, and drop the external credential claim.
- **Assessor cost > 40% of fee** → the unit economics are broken. Raise price, shorten the artifact, or move to AI-assisted pre-assessment sooner than planned.

---

# 13. RUTHLESS SIMPLIFICATION REVIEW

A line-by-line audit of `DATA_AI_ACADEMY_PORTAL_MOCKUP_SPECIFICATION.md`. The spec is strategically sound; it is scoped for a company that already exists.

## 13.1 Over-engineered — cut or reduce

| Spec feature | Verdict | What to do instead |
|---|---|---|
| **Skill graph as a DAG** with prerequisites, cycle detection, decay parameters, role weights (§18.2 blueprint) | **Over-engineered by 3×** | A flat `skills` table with an `area` column. 35 rows. The DAG earns its complexity at ~200 skills across 5 domains, not at 35 in one |
| **Skill decay & confidence display** (§5 `L05`) | **Too early, and actively harmful now** | Every learner's skills are new in year one. A decay bar on a freshly-earned skill is demoralising and dishonest. Keep the `asserted_at` column; show nothing until a skill is 12+ months old |
| **4 altitudes × 5 domains as a UI filter** (§1.7, §4 `P11`) | **Superseded — the catalogue itself is retired (DR-02)** | The filter's host no longer exists. **Domain survives** as subject scope and seeded data (`ADR-023`); domain × altitude as a faceting device, and per-domain course counts, do not |
| **4-level credential ladder + bands + specialisms + micro-credentials** (§12 blueprint) | **Four parallel concepts; a genuine conversion risk** | Ship **one credential, no levels, no bands** (DR-01). The ladder becomes a single forward-looking paragraph on `P15`. All grade differentiation lives in the artifact rubric |
| **Open Badges 3.0 / W3C Verifiable Credentials** (§12.6 blueprint) | **Right destination, wrong phase** | A `public_uid` + a verification page + OB 2.0 metadata baked into a PNG. Cryptographic VCs in 1C or Phase 2. **Do not claim OB3.0 conformance before it is true** |
| **Online proctoring vendor** (§13.5 blueprint) | **Wrong for V1 on four counts** | Cost per exam, conversion friction, accessibility hostility, and integration burden — for a control that is *not the real one*. The artifact is. Use honour undertaking + randomised order + in-room invigilation for cohorts, and say so openly |
| **Adaptive / IRT diagnostic** (§17 blueprint) | **Impossible without a calibrated bank you won't have** | 20 fixed questions, one branch. Learners perceive *relevance*, not adaptivity |
| **AI pre-assessment, moderation sampling, calibration scoring** (§13.4 blueprint) | **Solving a scale problem you do not have** | With 3 assessors and 25 candidates, humans mark everything. **This is also how you discover what the rubric should actually be** — automating before you know that is backwards |
| **Item bank psychometrics, exposure control, bank rotation** (§13.2 blueprint) | **Enterprise assessment tooling** | One fixed form. A SQL query for per-item pass rates. Review by eye |
| **Corporate heatmap with drill-through, benchmarking, coverage risk, uplift-vs-baseline** (§9 `O08`) | **The heatmap is a *sales asset*, not an MVP feature** | A sortable table of person × status. Keep the heatmap as a designed mockup screen for selling; build it when a customer has enough people for it to mean anything. **Benchmarking is impossible with one customer and fabricating it is fraud** |
| **Workspace switcher, 5 workspaces** (§15.4) | **Four workspaces with one user each** | Learning + one role workspace. The pattern is right; the scale is not there |
| **Knowledge versioning UI + changelog + review-due queues** (§16 blueprint) | **Keep the changelog, cut the machinery** | The changelog page is an afternoon and a real differentiator. The review-due queue and automated flag-affected-lessons pipeline are for a 200-article corpus, not 20 |
| **xAPI / LRS / SCORM export** (§26.3 blueprint) | **Zero MVP value** | An `events` table. Emit xAPI-shaped payloads later from the same rows |
| **Three separate services** (assessment / AI / analytics) (§26.1 blueprint) | **Correct eventually, premature now** | Three folders with clean boundaries in one deploy. Extraction later is a day |

## 13.2 Screens that can be merged

| Merge | From → To | Saving |
|---|---|---|
| `P14` Certification Overview + `P15` Credential Detail | 2 → 1 | **There is only one credential.** An overview page of one item is a landing page for nothing |
| `P04` Integrity & AI Policy → a section of `P15` | 2 → 1 | Important content, does not need its own route until there is more than one credential |
| `P17` Corporate + `P18` Funding | 2 → 1 | The funding argument *is* the corporate argument in Malaysia |
| ~~`P09` Paths Index + `P11` Catalogue~~ | **Both retired** | *Superseded by DR-02 — this was a merge argument for a catalogue that no longer exists.* Replaced by `P10` Programme Detail + `P24` Scheduled Offerings |
| `L06` Assessments + `L07` Assignments + `L08` Portfolio → **My Work** | 3 → 1 | Three hubs fragment one mental model. The learner thinks "my work", not "my assignment objects" |
| `L02` My Learning + `L03` Paths → `L04` My Path | 3 → 1 | With one path, "my learning" and "my path" are the same screen |
| `C06` Video + `C07` Reading + `C10` Quiz → states of `C05` | 4 → 1 | These are **block types**, not screens. Counting them inflated the inventory and invites redundant design |
| `C12` Course Completion → a state of `C02` | 2 → 1 | |
| `K02` Readiness + `K05c` Submitted + `K07` Under Review → states of `K01` | 4 → 1 | The candidacy tracker already shows stage and next action. These are states of it |
| `A01` Dashboard + `A02` Queue | 2 → 1 | An assessor dashboard whose only content is the queue *is* the queue |
| `X01`–`X12` → one tabbed admin console | 12 → 1 | Internal-only. **It may be ugly.** Twelve designed admin screens for a team of three is pure vanity |
| `S11` Refund + data export/delete → tabs in `S06` Settings | 3 → 1 | |

**Net: 41 spec screens collapse to 12.** Combined with the deferrals, the inventory drops from 133 → 44.

## 13.3 Concepts that are too early

| Concept | Earliest sensible point |
|---|---|
| **L4 Fellow** | 2029. Requires L3 held for 2 years. Remove from the product entirely; keep in the narrative |
| **L3 Professional** | Phase 2. Requires defence interviews, experience verification, and senior assessor capacity |
| **Specialism / elective composition** | When ≥4 specialism exams exist |
| **Micro-credentials** | Possibly never. They dilute the credential's meaning at the exact moment it must be sharp |
| ~~**Accredited training partner programme**~~ | **⊘ Not "too early" — retired as a destination (DR-02).** We deliver; we do not license others to teach toward our credential while we examine. A curated expert / associate-trainer network replaces it |
| **Chapters, events, mentoring, forums** | **⊘ Retired as a core structural assumption (DR-02).** If anything emerges, it emerges from real delivery — a cohort-private group or programme alumni. **A visibly empty community is worse than none on a trust product** |
| **CPD, renewal, currency assessment** | Year 3. The first credential expires in 2029. Designing a screen no user opens for 36 months is waste |
| **Appeals workflow** | When there is a second independent assessor to appeal *to* |
| **Skill decay display** | Month 13 |
| **Benchmarking** | ~20 corporate customers |
| **Ratings & reviews** | ~50 reviews per course. "4.8 from 3 reviews" reads as fabricated and one bad review is catastrophic |
| **Academic / LTI** | Phase 2. Gates university sales, but no university buys before the credential has industry recognition |

## 13.4 Features requiring operational infrastructure we do not have

**This is the sharpest category, and the one most often missed.** These are not engineering problems — shipping the screens would not make them work, because the missing ingredient is people and process.

| Feature | Missing ingredient | Consequence of shipping it anyway |
|---|---|---|
| **Assessment SLA (10 working days)** | **Assessor capacity.** One qualified person; a cohort of 25 can generate 25 artifacts in one week | A publicly displayed SLA you miss is worse than no SLA. **Cap intake to match capacity and market the cap as scarcity** |
| **Moderation & calibration** | 6+ assessors | Statistics on 3 people are noise |
| **Appeals** | An independent second assessor + published policy | An appeal route that leads back to the same person is not an appeal |
| **Credential revocation (two-person rule)** | Two authorised people + an integrity policy | |
| **Content review board** | A second qualified reviewer | A one-person approval workflow is bureaucracy |
| **Benchmarking** | Data from ~20 organisations | Fabricated benchmarks are fraud on a trust product |
| **Employer recognition claims on `P01`** | **Actual employers who have said yes** | The fastest way to destroy a credential's credibility is to overstate its recognition. Ship the proof band empty rather than padded |
| **Community** | A population | An empty forum signals a dead product |
| **Live chat** | Staffed hours | A slow live-chat is worse than an honest contact form with a stated SLA |
| **Partner programme** | Accreditation review capacity + market value | |
| **24/7 exam availability** | Support coverage across timezones | Schedule exam windows around your actual working hours |

**The operational lesson:** the evidence-based model's constraint is **not code — it is qualified assessor hours.** Every scoping decision in this document flows from that. Build `A03` well, recruit assessors early, cap intake honestly, and the model works. Get it wrong and the best-built platform in the category still fails.

## 13.5 What must be preserved — do not simplify these away

Under schedule pressure these will be the first things suggested for cutting. Refuse.

| Preserve | Why |
|---|---|
| **The artifact requirement itself** | It *is* the product. Without it this is a course marketplace with an exam |
| **The published rubric and the three exemplars** | The highest-impact assets for getting candidates through the evidence gate, and the proof that assessment is fair |
| **Human assessment of every credential-bearing artifact** | The trust asset. Automate it and there is no argument left |
| **The public verification page** | Clause 3 of the promise and the growth loop |
| **Citations on every AI answer** | The difference between an AI-native product and an AI-flavoured one |
| **Append-only skill assertions with provenance** | Retrofit Test: cheap now, a rewrite later, and it is what makes `L05` defensible |
| **Scoped many-to-many roles** | Retrofit Test |
| **`organisation_id` from commit one** | Retrofit Test |
| **Credential requirements as data rows** | Credential #2 then needs zero new screens |
| **The HRD Corp evidence pack** | Small build, disproportionate commercial value, and it makes the platform hard to leave |
| **Specific plain-language gap statements** | "You can explain X but cannot design Y" *is* clause 1. A numeric score is not |

---

# 14. THE BRIDGE — vision to first product, on one page

| | Vision (2030) | Long-term architecture | **MVP (V1)** | **First mockup** |
|---|---|---|---|---|
| **Scope** | 5 domains, 4 credential levels, global | Modular services, event-driven | **1 domain, 1 credential, a small deliberate programme portfolio** | 16 screens |
| **Learn** | Adaptive paths on a skill DAG | Graph traversal, IRT | **Expert-led programmes on scheduled dates · 35 flat skills · fixed capability assessment** | `P10` `P24` `P05` `P06` `L01` `L05` |
| **Prove** | Simulation assessment, continuous credentialing | Item bank + psychometrics + AI pre-assessment | **1 exam (one threshold), 1 artifact, 1 rubric, human assessor, 3 exemplars** | `K05b` `K06` `K08` `A03` |
| **Carry** | W3C VCs, employer verification API | Signing infrastructure, wallets | **Permanent verification URL + PNG badge + PDF** | `K10` `P16` |
| **Corporate** | Skills intelligence, benchmarking, SSO | Multi-tenant analytics | **A first-class pathway: entry path + private cohort + attendance + progress + HRD Corp pack** | `P17` `P19` `O01` `O10` |
| **Community** | Chapters, events, contributor ladder | Federated | **None — and retired as a strategic destination (DR-02)** | — |
| **AI** | 20 features across 3 surfaces | Model routing, evals, guardrails | **None. `M8` deferred; not replaced** | — |
| **Screens** | 133 | — | **44 (32 P0)** | **16** |
| **Team** | — | — | **1–2 devs + designer, 14–18 weeks** | 5–7 weeks |

**What survives every cut, because it is the promise:**

> **Learn what you're actually missing** → a diagnostic that names the gap in a sentence you could say out loud.
> **Prove it by doing the work** → an artifact a qualified human reads, grades against a published rubric, and writes reasoning about.
> **Carry the proof anywhere** → a permanent URL an employer can open without an account.

Three sentences. Everything else in three documents and 5,000 lines is scaffolding around them. **If a decision does not make one of those three sentences more true, it is not a V1 decision.**

---

# 15. WHAT THE SINGLE-CREDENTIAL DECISION REMOVES

Exactly what leaves the build when the second credential level goes. Grouped by cost type, because the content and explanation costs are larger than the engineering cost — and less obvious.

## 15.1 Logic and data removed

| Removed | Detail |
|---|---|
| **Band → level mapping** | The 60/70/75 resolution table, its computation, and every consumer of it. Replaced by one threshold comparison |
| **"Highest band retained" across attempts** | Becomes "highest score retained" — a `MAX()`, not a band-precedence rule |
| **Second `credential_def` + its requirement rows** | One definition, two requirement rows (`exam_threshold`, `artifact`) |
| **Level-based eligibility resolution** | No "which level am I eligible for?" query. Eligibility is one boolean |
| **Upgrade recomputation** | No "you now qualify for the next level" recalculation on each new assertion or attempt |
| **Level-based assessor qualification** | The specced rule *"assessors must hold the credential one level above what they assess"* is **unimplementable with one level**. Replaced — see §15.5 |
| **Cross-level credit rules** | Whether an L1 exam pass counts toward L2; whether an L1 fee credits against an L2 fee; whether L1 holders re-sit. All gone |

## 15.2 UI removed or simplified

| Screen | What goes |
|---|---|
| `P01` Homepage | **The entire credential-ladder block** (L1→L4 horizontal visual) — one of the larger custom components on the page |
| `P15` Credential Detail | The ladder position indicator · the **level comparison table** · "which level is right for me?" guidance · two fee structures |
| `K01` Candidacy Tracker | Level indicator; "eligible to upgrade" state |
| `K03` Register as Candidate | **The level-selection step disappears entirely.** Registration becomes: confirm → accept undertaking → pay |
| `K05c` / result states | Band explanation copy ("this determines your band, not your credential") — a genuinely confusing message that no longer needs writing |
| `K08` Result & Feedback | Band chip; "retake to reach the next band" |
| `K10` / `L09` / `P16` | Level chip on `CredentialCard`, on the badge artwork, and on the verification page. **One badge design instead of two** |
| `L01` Dashboard | "Upgrade to L2" prompts and their eligibility logic |
| `O01` Org table | Band column → a simple result column |
| Readiness check | Level branching ("ready for which level?") → a single readiness percentage |

**Design saving: roughly 4 bespoke components and 6 screen states.** The homepage ladder and the `P15` comparison table were both non-trivial custom design work.

## 15.3 Content removed — the largest saving

This is where the real cost was, and it is expert time, not developer time:

| Removed | Effort avoided |
|---|---|
| **A second rubric** | 5 criteria × 4 level descriptors = ~20 carefully-worded statements that must be defensible under appeal |
| **A second exemplar set** | 3 more artifacts written at Competent / Proficient / Distinguished. §11.2 marks exemplars as un-fakeable — each is real professional work |
| **A second artifact brief + 3 variants** | 4 more scenario documents |
| **A second item pool** | L1 and L2 need different difficulty targets from the same domain |
| **Two sets of marketing copy, FAQ, pricing and fee policy** | Plus the ladder explanation itself |

**Estimated saving: 2–3 weeks of expert authoring time** — from the one person whose time is the binding constraint on the whole project. This alone justifies the decision.

## 15.4 Explanation burden removed

`P15` previously had to convey four ideas at once: a ladder, score bands, which level the reader should target, and the evidence requirement. A candidate had to hold all four to understand what they were buying — flagged as a real conversion risk in `MOCKUP_SPEC.md` §20.2.

It now conveys **one**: *here is the credential, here is what it requires, here is the rubric, here are three exemplars.*

**The evidence requirement becomes the headline instead of the fourth thing on the page.** That is a positioning gain, not just a simplification.

## 15.5 One thing this decision *adds* — and it must not be missed

Two rules in the existing specs depended on having multiple levels. Both need explicit replacements, or they silently become no-ops:

**1. Assessor qualification.** `MOCKUP_SPEC.md` §2.2 R7 says assessors *"must hold the credential one level above what they assess"*. With one credential this is meaningless. **Replacement rule for V1:**

> An assessor is approved by the platform admin on the basis of (a) verified professional experience in the pilot domain, (b) completion of a calibration exercise — independently grading the three exemplars and matching the published outcome, and (c) a signed conflict-of-interest and confidentiality undertaking. Approval is recorded as an `assessor` role with `scope_type = credential_def`. The one-level-above rule returns when the ladder does.

**2. The graceful landing for unsuccessful candidates.** `MOCKUP_SPEC.md` §20.1 item 4 proposed *"award the band they did achieve (Foundation-level recognition)"*. There is no lower band to award. **Replacement for V1:**

> A candidate who does not meet the bar receives: their exam score with a per-skill breakdown, a **Path Completion Record** (explicitly not a credential, visually and semantically distinct), a retained skills profile, the assessor's full written feedback, a specific remediation plan, and **one free resubmission within 90 days**. Nobody who pays leaves with nothing — but nobody receives a credential they did not earn.

Both replacements are cheaper than what they replace. Neither is optional.

---

# 16. ARCHITECTING FOR EXPANSION WITHOUT BUILDING IT

> **Architect for expansion. Build only what needs validation.**

The test for every rule below: **adding domain #2 or credential #2 must be a data operation plus content — never a schema migration, never a redesign.**

## 16.1 Schema: present on day one, read by nothing

| Table | Expansion column | Populated with | Read by V1? |
|---|---|---|---|
| `domains` | *(the table itself)* | one seeded row | Yes — everything FKs to it |
| `skills` | `domain_id` | the pilot domain | For filtering only |
| `paths`, `courses` | `domain_id` | the pilot domain | For filtering only |
| `knowledge_articles` | `domain_id` | the pilot domain | For filtering only |
| `assessment_forms` | `domain_id`, `credential_def_id` | the pilot values | Yes |
| `credential_defs` | `domain_id`, `level`, `sort_order`, `version` | pilot domain, level 1, sort 1, v1 | **No** — present and inert |
| `assignments`, `rubrics` | `credential_def_id` | the one definition | Yes |
| `diagnostics` | `domain_id` | the pilot domain | Yes |

The `level` and `sort_order` columns on `credential_defs` are the entire cost of keeping the ladder possible: **two integer columns nothing reads.** That is what "architect for expansion" should cost.

## 16.2 Code rules — enforceable in review

1. **No domain literal anywhere.** No `'data-foundations'`, no `DOMAIN_DF`, no enum of domains in TypeScript. The pilot domain is resolved from the database at request time. A grep for the domain slug outside seed files and content must return zero hits.
2. **No level branching.** No `if (credential.level === 1)`. Requirements are read from rows and rendered generically.
3. **Requirements render generically.** `P15`, `K01`, and readiness all iterate the same `requirements` list. Adding a `requirement.type` later means one new renderer, not new screens.
4. **Domain-scoped queries take a parameter**, even though only one value is ever passed. `getPathsForDomain(domainId)` — not `getPaths()`.
5. **Seed data lives in seed files, not migrations.** Content and domain rows must be replaceable without touching schema history.
6. **The credential's display name comes from the row**, not from a template literal. This is what lets credential #2 exist without a code change.

## 16.3 UI rules

- **Domain chips, credential names, and level labels render from data.** If `level` is null or 1, the label renders nothing — not "Level 1".
- **No domain switcher, no domain tiles, no "more domains coming soon".** Architect it; do not surface it. Empty promises on a trust product cost more than they gain.
- **No ladder graphic anywhere in V1.** The ladder appears once, as a sentence about the future, on `P15`.
- **Routes are parameterised now** — `/learn/[domain]/...`, `/certify/[credential]` — even with one value each. Retrofitting URL structure breaks every earned inbound link and every shared verification URL.

## 16.4 What expansion then actually costs

| Adding | Engineering | Content & expert time |
|---|---|---|
| **Domain #2** (e.g. Generative & Agentic AI) | Effectively zero — insert rows | Skills, path, courses, articles, item pool, brief, rubric, exemplars. **This is the real cost, and it is unavoidable** |
| **Credential #2 at a second level** | Small — one `credential_def` row, its requirement rows, and the level label finally rendering | A second rubric and exemplar set |
| **The full L1–L4 ladder** | Moderate — the ladder graphic, comparison table, upgrade flow, cross-level credit rules, and the one-level-above assessor rule return | Substantial |

**The honest conclusion:** expansion was never blocked by architecture. It is blocked by expert authoring time. Which is precisely why V1 should spend that time making **one** credential excellent rather than two credentials adequate.


---

*End of build spec. Companion to `DATA_AI_ACADEMY_PORTAL_BLUEPRINT.md` (vision) and `DATA_AI_ACADEMY_PORTAL_MOCKUP_SPECIFICATION.md` (design). Where they conflict on scope, this document wins.*
