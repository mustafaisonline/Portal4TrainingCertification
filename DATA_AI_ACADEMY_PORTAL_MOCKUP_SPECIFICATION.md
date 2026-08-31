# DATA & AI ACADEMY — PORTAL MOCKUP SPECIFICATION

**Document type:** Master UI/UX specification. Build-ready.
**Version:** 1.0
**Date:** 2026-08-29
**Owner:** Mustafa Qizilbash — Your Partner Technologies
**Companion document:** `DATA_AI_ACADEMY_PORTAL_BLUEPRINT.md` (strategy). This document does not repeat strategy; it translates it into screens.
**Intended consumer:** An AI UI/UX design agent or AI coding agent producing the first complete portal mockup.
**Corrected by:** [`DR-02_EXPERT_LED_DELIVERY_MODEL.md`](DR-02_EXPERT_LED_DELIVERY_MODEL.md), approved 2026-08-31 — see the reconciliation notice below.

---

> # ⚠ RECONCILIATION NOTICE — DR-02, 2026-08-31
>
> **This document was written for a product we are no longer building.** It specified a portal organised around browsing a catalogue, consuming lessons in a player, and community structures. [`DR-02`](DR-02_EXPERT_LED_DELIVERY_MODEL.md) is the authoritative strategic correction and **outranks this document**; [`DATA_AI_ACADEMY_MVP_BUILD_SPEC.md`](DATA_AI_ACADEMY_MVP_BUILD_SPEC.md) §6 is authoritative for the screen list and priorities; the [Blueprint](DATA_AI_ACADEMY_PORTAL_BLUEPRINT.md) has been reconciled in turn.
>
> **What the portal supports:**
>
> ```
> Expert-led learning  +  scheduled programmes  +  live / face-to-face delivery
>       +  corporate & private engagements  +  meaningful assessment
>       +  applied evidence      →      credible certification
> ```
>
> **The critical design principle for everyone using this document.** The portal is an important part of the experience, but **it is not the primary place where learning happens.** Learning happens in the room and in the live session. The portal supports discovery, scheduling, participation, preparation, evidence, assessment, progress and verification.
>
> **The model this document must never silently return to:** *browse course → watch content → complete lessons → take quiz → get certificate.* That is explicitly incompatible with the strategy. Any screen that reintroduces it is a defect regardless of how well it is designed.
>
> **How corrections are marked.** Superseded passages carry **`⊘ RETIRED`**, **`↻ REFRAMED`** or **`⏸ DEFERRED`** in place with a one-line reason. Surrounding analysis is deliberately left intact — much of the interaction and accessibility thinking here remains excellent and survives the correction untouched. Where a marker and the original text disagree, **the marker wins**, and DR-02 wins over both.
>
> **This notice authorises no design or implementation work.** The `P01` Homepage redesign is a separate, later, dedicated exercise; nothing here begins it.

---

## HOW TO USE THIS DOCUMENT

| If you are… | Read |
|---|---|
| A UI/UX design agent producing screens | §13 (inventory) → §14 (scope) → §15 (navigation) → §16 (design direction) → §4–§9 (screen specs) |
| A coding agent scaffolding the app | §3 (routes) → §18 (entities) → §13 (screens) → §19 (build sequence) |
| A human reviewing the design | §1 → §20 (critical review) → §14 |

**Screen ID convention.** Every screen has a stable ID used throughout. Never renumber.

> ## 🔒 BINDING RULE — screen identifiers are never reused
> *Approved 2026-08-31. This is a traceability rule, and it outranks tidiness.*
>
> ```
>   Allocated screen ID
>          ↓
>     Active   OR   Retired
>          ↓
>   NEVER reused for a different concept
> ```
>
> - Once an identifier has been allocated, it is **permanently bound to the screen it was allocated to** — including after that screen is retired.
> - A retired ID is **not** recycled for a new screen, however convenient the gap looks.
> - **Historical IDs are never renumbered to close gaps.** Gaps are evidence, not untidiness.
> - A genuinely new screen receives **the next identifier beyond the highest already allocated** in its prefix.
>
> **Currently affected by DR-02:**
>
> | ID | Historical screen | Status |
> |---|---|---|
> | `P03` | The Capability Standard | **⊘ RETIRED** — a standards-body surface; the organisation is not one. *(Credential transparency survives independently — see `P15`.)* |
> | `P11` | Course Catalogue | **⊘ RETIRED** — there is no catalogue. Discovery is `P10` + `P24`. |
> | `P12` | Course Landing | **⊘ RETIRED** — absorbed into `P10` Programme Detail. |
> | `P23` | **Expert Profile** | **Active — new.** |
> | `P24` | **Scheduled Offerings** | **Active — new.** |
>
> **`P03` and `P11` must not be reused for the expert profile, scheduled offerings, or anything else.** `P23` and `P24` were allocated beyond the previous high-water mark (`P22`) precisely to honour this rule. The highest allocated `P` identifier is now **`P24`** (excluding `P99` Legal, which is a reserved sentinel).

| Prefix | Area |
|---|---|
| `P` | Public website |
| `S` | Shared / system (auth, settings, errors) |
| `L` | Learner portal |
| `C` | Course experience |
| `K` | Certification journey |
| `N` | Knowledge & resource library |
| `M` | Community |
| `I` | Instructor portal |
| `A` | Assessor portal |
| `O` | Organisation (corporate) portal |
| `X` | Platform administration |

**Scope tags** used on every screen: `[MVP]` · `[P2]` (phase 2) · `[FUT]` (future).

---

# 1. PRODUCT OVERVIEW

## 1.1 What the platform is

*↻ REFRAMED (DR-02). "Data & AI Academy" remains a **temporary working name**, not a final one — it must not be allowed to imply a self-paced content library.*

**We are an independent professional training and certification organisation** for data and AI capability development. Our core value comes from **expert practitioners and expert-led delivery** — face-to-face programmes, live online programmes, and tailored corporate engagements.

**The portal is not the product.** It supports the ecosystem: discovery, scheduling, registration, participation, preparation, evidence, assessment, progress and verification. The learning itself happens in the room and in the live session.

It is deliberately **not** a generic LMS and **not** a course marketplace. An LMS answers *"did they complete the course?"*; a marketplace answers *"what can I buy?"* This organisation answers a harder and far more valuable question: **"can this person actually do the work, and can they prove it to an employer?"**

> **⊘ RETIRED — the "seven products in one" framing below.** It described a platform that *contains* everything, and two of its seven pillars (community/chapters, the AI layer) are retired or deferred by DR-02. **The skill spine survives and remains valuable** — reframed by DR-02 as the shared vocabulary linking programme outcomes, assessment, evidence, the credential and the team capability view, rather than as the engine of a personalised content platform. Read the diagram for the spine, not for the seven columns.

```
                          ┌─────────────────────┐
                          │    SKILL GRAPH      │
                          │  the shared spine   │
                          │ every object maps   │
                          │      to a skill     │
                          └──────────┬──────────┘
        ┌──────────┬──────────┬──────┴─────┬──────────┬──────────┐
        ▼          ▼          ▼            ▼          ▼          ▼
    LEARNING   PRACTICAL  CERTIFICATION  CORPORATE  COMMUNITY  AI LAYER
    courses    labs &     credentials    cohorts &  chapters   tutor,
    paths      artifacts  badges         analytics  events     paths,
    literacy   evidence   verification   compliance mentoring  feedback
```

The skill graph is what makes this an ecosystem rather than a bundle. A learner's diagnostic result, a course's outcomes, an exam item, an assignment rubric, a credential's requirements, and a corporate skills heatmap all reference the *same* skill nodes. Remove the graph and you have seven disconnected products.

## 1.2 Purpose

To make data and AI capability **legible** — provable by the individual who has it, assessable by the employer who needs it, and buildable by the institution that teaches it.

## 1.3 Core value proposition

> **Learn what you're actually missing. Prove it by doing the work. Carry the proof anywhere.**

Three claims, each with a visible product mechanism behind it. Every mockup screen should trace to one of these.

*↻ REFRAMED (DR-02) — the three claims stand; the mechanism behind the first is now expert-led delivery rather than a self-serve path.*

| Claim | Mechanism | Where it shows up in the UI |
|---|---|---|
| **Learn what you're actually missing** | Capability assessment names the gap → **an expert-led programme closes it**, on a real date, in a real format | `P05` Capability Assessment, `P06` Result, `P10` Programme Detail, `P24` Scheduled Offerings, `L05` Skills Profile |
| **Prove it by doing the work** | Knowledge assessment **plus** an assessed applied artifact, following programme participation | `K06` Artifact Workspace, `K08` Result & Feedback, `A03` Assessor Review |
| **Carry the proof anywhere** | Permanent public verification (OB 2.0 metadata in V1; cryptographic VCs deferred — see `MVP_BUILD_SPEC.md` M7) | `L09` My Credentials, `P16` Public Verification |

## 1.4 What makes it different — and what the mockup must communicate

The mockup is not just a layout exercise. It has to make the differentiators *visible on screen*, because these are the reasons someone chooses this over a course marketplace.

**D0 — Expert-led, live, and scheduled.** *(Added by DR-02 as the foundational differentiator.)* A practitioner who has built these systems teaches you, in the room or live, alongside peers from real organisations. *The mockup must show a named genuine expert, a real delivery format, and a real date — early and unmistakably.* A marketplace has none of these, and no amount of content can imitate presence.

**D1 — Evidence over recall.** No credential is awarded on a multiple-choice score alone. *The mockup must show the rubric, the exemplars, and the assessor's written reasoning as first-class UI.* A course marketplace cannot show these screens because it does not have them. **Nor is the credential earned by attendance** — participation is part of the pathway, never the whole of it.

**D2 — Living, versioned knowledge.** The knowledge base is a versioned product with a public changelog. *The mockup must show version stamps, "last reviewed" dates, and a changelog page.* This is a trust surface no competitor has.

**~~D3 — AI-native, not AI-flavoured.~~ ⏸ UNDER REASSESSMENT — not an active design requirement.** Its evidence was the AI tutor, which DR-02 defers. **Do not design for it, do not show it in the mockup, and do not invent a replacement.** DR-02 §9 holds the question open; any revised third differentiator will be evaluated later against the clarified strengths — expert-led delivery, practitioner expertise, live interaction, practical learning, applied evidence, meaningful assessment, credible certification. *(D0 above is the corrected foundational differentiator, not the D3 replacement; that decision remains open.)*

## 1.5 Primary users

Six user types the mockup must serve. Full role definitions in §2.

| | User | What they come to do |
|---|---|---|
| 1 | **Individual learner** — student, early-career, practitioner, leader | Build capability, earn a credential, change or advance role |
| 2 | **Corporate L&D / CDO office** | Raise team capability, prove uplift, satisfy funding and audit requirements |
| 3 | **Instructor / SME** | Author content, run cohorts, teach, earn |
| 4 | **Assessor** | Grade applied artifacts, conduct defences, uphold the standard |
| 5 | **Academic partner** | Embed industry-aligned modules into a semester |
| 6 | **Community participant** | Belong, contribute, build professional standing |

## 1.6 Main ecosystem components

| # | Component | One-line role | Primary screens |
|---|---|---|---|
| 1 | **Public site** | Persuade, segment, capture, rank in search | `P01`–`P22` |
| 2 | **Learner portal** | The learning workspace | `L01`–`L14` |
| 3 | **Course experience** | Content consumption and practice | `C01`–`C12` |
| 4 | **Certification journey** | The credential pipeline — the differentiator | `K01`–`K12` |
| 5 | **Knowledge library** | Living Body of Practice + resources | `N01`–`N10` |
| 6 | **Community** | Belonging and contribution | `M01`–`M09` |
| 7 | **Instructor portal** | Supply-side authoring and delivery | `I01`–`I11` |
| 8 | **Assessor portal** | Assessment integrity workbench | `A01`–`A06` |
| 9 | **Corporate portal** | Org management, skills intelligence, compliance | `O01`–`O12` |
| 10 | **Platform admin** | Governance, content lifecycle, integrity | `X01`–`X12` |
| 11 | **AI layer** | Cross-cutting; appears inside all of the above | Panel + inline, see §12 |

## 1.7 Domain and altitude model (needed to read every catalogue screen)

> **↻ SPLIT by DR-02 — read this before using either axis.**
>
> | | Status |
> |---|---|
> | **Domain** as **subject scope and capability structure** — what a programme is about, what a skill belongs to, how the knowledge library is organised | **✅ Preserved.** Also required as seeded data by the approved expansion shape (`ADR-023`) |
> | **Domain × altitude as a catalogue faceting device**, and **per-domain course counts** | **⊘ Retired.** The catalogue they faced no longer exists, and a course count is a marketplace credibility signal we do not use |
>
> The sentence below — *"every filter, chip, and badge in the mockup uses these"* — is **superseded**. Altitude remains a useful *data* field for describing depth of engagement; it is not a browsing mechanism, and it must not reappear as one.

Two orthogonal axes used consistently across the entire UI. Every filter, chip, and badge in the mockup uses these.

**Domains (5):** `DF` Data Foundations · `DE` Data Platforms & Engineering · `AI` AI & Machine Learning · `GA` Generative & Agentic AI · `GT` Governance, Trust & Risk

**Altitudes (4):** `A1` Aware (literacy) · `A2` Applied (practitioner) · `A3` Architect (design & decide) · `A4` Advisory (govern & invest)

Altitude is **not** difficulty. A4 executive content is short and dense, not easy. This decoupling is why a graduate and a CDO can share one catalogue without either feeling patronised — and it is the single most important IA idea to preserve in the mockup.

**Credential ladder (product vision):** `L1` Blueprint Foundation · `L2` Blueprint Practitioner · `L3` Blueprint Professional · `L4` Blueprint Fellow.

> **MVP scope override — `MVP_BUILD_SPEC.md` DR-01.** V1 ships **one credential with no levels and no score bands**, in one pilot domain. The ladder above is the long-term model; it is not built, not designed, not priced, and not described as available in V1. Wherever this document shows levels, bands, or a ladder graphic, treat it as Phase 2+ design. The `level` field exists in the schema and renders nothing.

---

# 2. USER ROLES

> **↻ RECONCILED (DR-02).** The scoped, combinable role model is sound and is preserved. Three corrections: **R6 Instructor is promoted** — the **Expert/Trainer** is core product value with a **public profile** (`P23`) from V1, not a back-office `[P2]` role; **R8 Mentor, R11 Training Partner Admin and R13 Chapter Lead are ⊘ retired as core**, with chapters and the accredited-partner model; and terminology moves from *learner* toward **participant** where a person is in a programme, because presence is the point. `MVP_BUILD_SPEC.md` §4 is authoritative for the V1 role set (six roles).
>
> **On experts, binding:** represent **only genuine experts**. No fabricated profiles, no invented biographies, no fake testimonials or credentials — not even as mockup fixture data. If one expert delivers at launch, show one. The model must support a growing network without assuming one exists.

Roles are **capability sets**, assignable in combination and scoped. One person is routinely a Learner *and* an Instructor *and* a Chapter Lead. The UI expresses this through a **workspace switcher**, never through duplicated navigation.

> **Design rule:** a user with multiple roles sees ONE account, ONE profile, ONE notification centre — and switches *workspace*, not identity. Never make someone log out to change role.

## 2.1 Role summary

| ID | Role | Scope | Workspace | Auth state |
|---|---|---|---|---|
| R1 | Guest / Visitor | — | Public site | Anonymous |
| R2 | Learner | global | Learner portal | Authenticated |
| R3 | Member | global | Learner portal (expanded) | Subscription |
| R4 | Candidate | per credential | Certification journey | Registered candidacy |
| R5 | Certified Professional | per credential | Learner portal + public profile | Credential held |
| R6 | Instructor | global / cohort | Instructor portal | Approved |
| R7 | Assessor | per credential | Assessor portal | Approved + calibrated |
| R8 | Mentor | community | Community | Vetted |
| R9 | Corporate Admin | org | Corporate portal | Org-scoped |
| R10 | Team Manager | org team | Corporate portal (limited) | Org-scoped |
| R11 | Training Partner Admin | partner org | Partner portal | Accredited |
| R12 | Academic Admin | institution | Corporate portal (academic mode) | Institution-scoped |
| R13 | Community Member / Chapter Lead | community / chapter | Community | Authenticated / appointed |
| R14 | Platform Administrator | global | Admin console | Staff |

## 2.2 Role definitions

### R1 — Guest / Visitor `[MVP]`
- **Goals:** work out if this is for them; understand what the credential means; find an answer to a question they searched for.
- **Permissions:** browse all public pages · read the knowledge library · take the free diagnostic (result held 30 days anonymously) · verify anyone's credential · view course and credential detail · view public community and event listings.
- **Cannot:** enrol · post · see prices in local currency without region selection · persist progress.
- **Primary actions:** Start free diagnostic (the single dominant CTA) · view a course · verify a credential · contact sales.
- **Dashboard:** none. The homepage `P01` *is* their dashboard, and it must segment them in under 30 seconds.

### R2 — Learner `[MVP]`
- **Goals:** close a specific capability gap; finish what they started; get to a credential; not waste time on things they already know.
- **Permissions:** enrol · consume content · take assessments · submit assignments · hold credentials · maintain a skills profile · read community.
- **Primary actions:** **Continue learning** (the dominant action on every screen) · take the next assessment · view path · ask the AI tutor.
- **Dashboard `L01`:** must answer exactly one question — *"what should I do next, and am I on track?"* Continue card first and largest; path milestone; credential progress; this week's commitments; largest skill gap with a direct action.

### R3 — Member `[P2]`
- Learner plus: full knowledge library · member pricing · directory listing · chapter membership · CPD ledger.
- **Degrades gracefully.** On lapse, reverts to Learner. **Earned credentials are never revoked for non-payment** — this must be explicit in the UI, because it is a trust statement.
- **Dashboard:** same as `L01` with an added membership/CPD strip.

### R4 — Candidate `[MVP]`
- **Goals:** pass without wasting the fee; understand exactly what is required; know where they stand at all times.
- **Permissions:** book exams · access practice pools · submit artifacts · schedule a defence · view rubric and exemplars · appeal.
- **Primary actions:** check readiness · book exam · open artifact brief · submit evidence.
- **Dashboard `K01` Candidacy Tracker:** a persistent stage tracker — *Registered → Prepared → Knowledge Assessed → Evidence Submitted → Under Review → Defence → Awarded*. This is the highest-anxiety journey on the platform; the tracker must be visible from everywhere, always show the next action, and always show expected timing.

### R5 — Certified Professional `[MVP]`
- **Goals:** display and share the credential; keep it valid; be found; step up to assessing or mentoring.
- **Permissions:** public verifiable profile · badge sharing · directory listing · CPD logging · eligibility to apply as assessor/mentor.
- **Primary actions:** share badge · log CPD · view renewal status · apply to assess.
- **Dashboard:** `L09` My Credentials, with a CPD progress ring and renewal countdown.

### R6 — Instructor `[MVP thin / P2 full]`
- **Goals:** get content published without fighting the tool; run cohorts with minimum admin; know who is struggling; get paid.
- **Permissions:** author and version content (publishing requires review) · manage own cohorts · capture attendance · mark formative work · view own analytics · view earnings.
- **Cannot:** mark credential-bearing evidence for learners in their own cohort (enforced in code) · access the live item bank.
- **Primary actions:** mark queue · start live session · take attendance · publish a draft.
- **Dashboard `I01`:** *"who needs me, and what am I behind on?"* Marking queue with SLA age first, then next session with one-click join, then at-risk learners.

### R7 — Assessor `[MVP]`
- **Goals:** assess fairly and fast; stay calibrated; not be given work they have a conflict on.
- **Permissions:** claim from a blind queue · grade against rubric · view AI pre-assessment as a suggestion · conduct defences · participate in calibration · escalate.
- **Constraints:** blind assignment by default · conflict-of-interest declaration · cannot see other assessors' scores before submitting their own · must be qualified to assess.
- **Qualification rule.** *Long-term:* must hold the credential one level above what they assess. **V1 (DR-01) has one level, so that rule is inoperative and is replaced by:** approval by the platform admin on verified professional experience in the pilot domain, plus a calibration exercise (independently grading the three published exemplars and matching the published outcome), plus a signed conflict-of-interest undertaking. See `MVP_BUILD_SPEC.md` §15.5.
- **Primary actions:** claim next · grade · submit decision · flag integrity concern.
- **Dashboard `A01`:** queue with SLA countdown; my calibration/agreement rate; completed and earnings; moderation overrides as a learning loop.

### R8 — Mentor `[P2]`
- Goals: give back, build standing. Permissions: mentee matching, session logs, feedback. Actions: accept request, log session. Dashboard: mentoring panel inside community.

### R9 — Corporate Administrator `[MVP]`
- **Goals:** get people activated; prove uplift to justify spend; produce audit and funding documentation without manual work; know where to intervene.
- **Permissions:** manage org · invite and provision people · create teams · assign paths · view aggregate and individual progress **for own org only** · manage cohorts · export reports · generate compliance packs · billing.
- **Primary actions:** invite people · assign a path · chase unactivated seats · generate HRD Corp claim pack · export report.
- **Dashboard `O01`:** *"is this investment working, and where do I act?"* Seats/activation/completion/credentials; **uplift vs baseline above the fold** (this is the renewal argument); skills heatmap; a "needs attention" panel where every item has a one-click action.

### R10 — Team Manager `[P2]`
- Aggregate-first view of own team only. Individual detail requires an intentional click — a privacy posture, not just IA. Can assign optional paths and approve requests. Cannot manage billing or org settings.

### R11 — Training Partner Administrator `[P2]`
- **Goals:** be listed and found; align courses to the credential standard; keep instructors compliant; track referrals.
- **Permissions:** manage partner profile and public listing · manage instructor roster and their credential status · submit courses for alignment review · view referral and enrolment attribution · access licensed teaching assets.
- **Constraints:** annual accreditation review; instructors must meet the credential standard; accreditation status is publicly visible.
- **Dashboard:** accreditation status and expiry · instructor compliance list (who is out of credential) · courses under review · referral funnel.

### R12 — Academic Administrator `[P2]`
- Cohort licences · LTI configuration · roster sync · gradebook writeback · graduate outcome reporting. Uses the corporate portal in *academic mode* — same shell, different vocabulary (students not employees, semester not quarter, programme not department).

### R13 — Community Member / Chapter Lead `[P2]`
- Member: profile, post, join groups, register for events, request mentoring.
- Chapter Lead adds: manage chapter page, create events, manage members, invite speakers. Chapter status is tiered and publicly visible (Forming → Active → Established) with published criteria.

### R14 — Platform Administrator `[MVP thin]`
- Full configuration, content publishing, credential rules, user and org management, integrity cases, finance. MFA mandatory. Every action audit-logged.
- **Segregation of duty enforced in the UI:** finance roles cannot open assessment content; no single account can revoke a credential (two-person confirmation).

## 2.3 Permission matrix (abbreviated — the ones that matter)

| Capability | Guest | Learner | Instructor | Assessor | Corp Admin | Platform Admin |
|---|---|---|---|---|---|---|
| Browse public content | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| Take free diagnostic | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| Enrol / learn | — | ✔ | ✔ | ✔ | ✔ | ✔ |
| Submit artifact | — | ✔ | ✔ | ✔ | ✔ | ✔ |
| Author content | — | — | ✔ (draft) | — | — | ✔ |
| Publish content | — | — | — | — | — | ✔ (reviewer) |
| Mark formative work | — | — | ✔ (own cohort) | ✔ | — | ✔ |
| **Decide credential outcome** | — | — | **—** | **✔** | — | — |
| View org member progress | — | — | ✔ (own cohort) | — | ✔ (own org) | ✔ |
| Generate compliance pack | — | — | ✔ (own cohort) | — | ✔ | ✔ |
| Revoke a credential | — | — | — | — | — | ✔ (two-person) |

The two bolded cells are the integrity core of the product: **instructors never decide credential outcomes for their own learners, and no administrator can quietly revoke a credential alone.** Both must be visible in the UI as explicit states, not hidden business logic.

---

# 3. COMPLETE INFORMATION ARCHITECTURE

> **↻ REFRAMED (DR-02) — the route tree below is the pre-correction IA and is not authoritative.** `MVP_BUILD_SPEC.md` §6 holds the corrected screen list and priorities.
>
> **Routes retired:** `/learn/catalog` (the faceted catalogue) · `/learn/courses/[course]` as a course page · `/about/standard` (`P03`) · the entire `/community/*` tree · `/partners/*` · `/app/tutor` (`L14`).
> **Routes required by the corrected model and absent below:** programme detail · **scheduled offerings** (`P24`) · **expert profile** (`P23`) · a participant view of their programme and next session.
> **Routes that stand:** `/certify/verify/[uid]`, the knowledge library, `/organisations/*`, the assessor and org portals, auth and settings.
>
> **A note for whoever scaffolds this later:** route *shapes* are not being redesigned here, and no naming is fixed. The parameterised-route discipline in `ADR-023` still applies. **This stage corrects what the IA must express, not what the URLs will be.**

Routes given as URL paths so a coding agent can scaffold directly.

## 3.A Public website

```
/                                     P01  Home
/diagnostic                           P05  Free skill diagnostic
/diagnostic/result                    P06  Diagnostic result
/about                                P02  About the academy
  /about/standard                     P03  The capability standard
  /about/integrity                    P04  Credential integrity & AI-use policy
  /about/instructors                       Instructor roster
  /about/governance                        Standards council & appeals
/learn                                P07  Learning overview
  /learn/domains/[domain]             P08  Domain landing (DF|DE|AI|GA|GT)
  /learn/paths                        P09  Learning paths index
  /learn/paths/[path]                 P10  Path detail
  /learn/catalog                      P11  Course catalogue (faceted)
  /learn/courses/[course]             P12  Course landing  → also C01
  /learn/literacy                     P13  Data & AI Literacy (A1 product)
/certify                              P14  Certification overview & ladder
  /certify/credentials/[credential]   P15  Credential detail
  /certify/how-it-works                    The evidence model explained
  /certify/exams                           Exam catalogue & logistics
  /certify/renewal                         CPD & renewal rules
  /certify/verify                          Verification entry
  /certify/verify/[uid]               P16  Public credential verification
  /certify/directory                       Credential holder directory (opt-in)
/organisations                        P17  Corporate overview
  /organisations/corporate                 Team & enterprise programmes
  /organisations/academic                  University partnerships
  /organisations/funding              P18  Funding & HRD Corp support
  /organisations/case-studies              Evidence & outcomes
  /organisations/contact              P19  Book a capability assessment
/knowledge                            N01  Knowledge library home
  /knowledge/[domain]                 N02  Domain index
  /knowledge/[domain]/[topic]         N03  Knowledge article
  /knowledge/glossary                 N04  Glossary
  /knowledge/glossary/[term]          N05  Term page
  /knowledge/frameworks               N06  Frameworks & patterns
  /knowledge/templates                N07  Templates & canvases
  /knowledge/case-studies             N08  Case studies
  /knowledge/prompts                  N09  Prompt & AI resource library
  /knowledge/changelog                N10  Knowledge changelog  ← trust surface
/community                            M01  Community home
  /community/chapters                 M02  Chapter directory & map
  /community/chapters/[chapter]       M03  Chapter page
  /community/events                   M04  Events calendar
  /community/events/[event]           M05  Event detail
  /community/discussions              M06  Discussion index
  /community/members/[handle]         M08  Public member profile
  /community/mentoring                     Mentoring programme
  /community/contribute               P20  Become a contributor
/teach                                P21  Become an instructor
/partners                             P22  Become a training partner
/partners/directory                        Accredited provider directory
/pricing                                   Pricing
/blog        /contact
/legal/terms /legal/privacy /legal/accessibility /legal/cookies
```

## 3.B Learner portal

```
/app                        L01  Dashboard
/app/learning               L02  My Learning
/app/learning/[course]      C02  Course home (enrolled)
  …/[course]/[lesson]       C05  Lesson player
/app/path                   L04  My Path
/app/path/planner           L04b Path planner
/app/skills                 L05  Skills Profile
/app/assessments            L06  Assessments hub
/app/assignments            L07  Assignments hub
/app/certifications         K01  Certification journeys
/app/portfolio              L08  Evidence portfolio
/app/credentials            L09  My Credentials
/app/credentials/[uid]      L10  Credential detail
/app/cpd                    L11  CPD & renewal
/app/calendar               L12  Calendar & sessions
/app/history                L13  Learning history & transcript
/app/tutor                  L14  AI Learning Assistant (also a global side panel)
/app/community              M07  My community feed
/app/notifications          S05  Notifications
/app/profile                S06  Profile & public profile settings
/app/billing                S07  Billing
/app/settings               S08  Settings
```

## 3.C Instructor portal

```
/instructor                       I01  Dashboard
/instructor/courses               I02  My courses
/instructor/courses/[id]/edit     I03  Course builder
/instructor/lessons/[id]/edit     I04  Lesson editor
/instructor/cohorts               I05  Cohorts
/instructor/cohorts/[id]          I06  Cohort detail (roster, progress)
/instructor/sessions/[id]         I07  Live session console + attendance
/instructor/marking               I08  Marking queue
/instructor/marking/[id]          I09  Mark a submission
/instructor/analytics             I10  Learner outcomes & content analytics
/instructor/earnings              I11  Earnings & payouts
```

## 3.D Assessor portal

```
/assessor              A01  Dashboard
/assessor/queue        A02  Assessment queue
/assessor/review/[id]  A03  Assessment review workbench
/assessor/defence/[id] A04  Defence session console
/assessor/calibration  A05  Calibration & agreement
/assessor/appeals      A06  Appeals & escalations
```

## 3.E Corporate portal

```
/org                     O01  Dashboard
/org/people              O02  People & seats
/org/people/[id]         O03  Individual learner view
/org/teams               O04  Teams
/org/programs            O05  Programmes & assignments
/org/cohorts             O06  Cohorts
/org/cohorts/[id]        O07  Cohort detail
/org/skills              O08  Skills heatmap & gap analysis
/org/certifications      O09  Certification status board
/org/compliance          O10  Compliance & HRD Corp documentation
/org/reports             O11  Reports & exports
/org/settings            O12  Org settings, SSO, branding, billing
```

## 3.F Platform administration

```
/admin                 X01  Platform dashboard
/admin/content         X02  Content lifecycle & publishing
/admin/skills          X03  Skill graph editor
/admin/knowledge       X04  Knowledge base & versioning
/admin/credentials     X05  Credential definitions & rules
/admin/item-bank       X06  Assessment item bank & psychometrics
/admin/users           X07  Users & roles
/admin/organisations   X08  Organisations
/admin/partners        X09  Training partners & accreditation
/admin/integrity       X10  Integrity cases & credential revocation
/admin/community       X11  Community moderation
/admin/finance         X12  Finance, refunds, payouts
```

## 3.G Shared / system

```
/login                 S01  Sign in
/signup                S02  Create account
/onboarding            S03  Onboarding wizard
/verify-email          S04  Email verification
/app/notifications     S05  Notification centre
/app/profile           S06  Profile
/app/billing           S07  Billing
/app/settings          S08  Settings
/search                S09  Global search results
/404 /500 /offline     S10  Error & empty states
```

---

# 4. PUBLIC WEBSITE

**Job of the public site:** segment the visitor fast, make the differentiator legible, and convert to a **diagnostic start** — not to a purchase. The diagnostic is the conversion event, because it produces something valuable to the visitor before it asks for anything.

**Global public shell.** Every public page shares: slim top bar (region + language) · header (logo · primary nav · search · Sign in · **Start free diagnostic**) · footer (sitemap, accreditation, legal, social, verification link). Sticky header on scroll, collapsing to logo + nav + CTA.

---

### P01 — Homepage `[MVP]`

> # ↻ REWRITTEN BRIEF — DR-02
>
> **This specification is replaced by the brief below.** The original section — retained beneath it for reference — produced a homepage that reads as a self-serve assessment-and-credential product: no human, no date, no format, five domain tiles with course counts, and a diagnostic CTA repeated four times. **The implementation was faithful to it; the specification was the defect.**
>
> **Scope of this correction:** *what the Homepage must communicate and enable.* **Not** what it should look like. Visual identity, typography, layout, imagery and interaction design are deliberately **out of scope here** and belong to the dedicated Homepage redesign exercise that follows the corrected documentation baseline. **Nothing in this brief authorises design or implementation work.**
>
> ## What it must communicate
>
> | # | The visitor must understand | Why it matters |
> |---|---|---|
> | 1 | **This is an independent professional training and certification organisation** — not a course platform, not an association | The identity problem this correction exists to fix |
> | 2 | **Real experts teach this, and they are named and shown** | `D0`. Presence is the differentiator a marketplace cannot copy. **Genuine experts only** |
> | 3 | **Programmes run live — face-to-face and online — on real dates** | A page with no time and no place silently announces asynchronous content |
> | 4 | **Organisations can engage us for private and on-site delivery** | Corporate is a first-class pathway, not a feature |
> | 5 | **The credential has to be earned** — assessed applied work, judged by a qualified human | `D1`, and the proof that outcome is real |
> | 6 | **Selective, not overwhelming** | Quality and credibility over breadth. Scarcity here is honest, not a tactic |
>
> ## What it must enable — the three pathways
>
> | Priority | Pathway | Intent served |
> |---|---|---|
> | **Primary** | **Explore upcoming programmes** | *"What can I attend, and when?"* → `P10` / `P24` |
> | **Major secondary** | **Train your team** | *"Can you deliver this for my organisation?"* → `P17` / `P19` |
> | **Supporting** | **Assess your capability** | *"Where do I actually stand?"* → `P05` / `P06` |
>
> The diagnostic **remains valuable and is not removed** — it moves from dominant CTA to a supporting entry point, and doubles as the corporate land motion.
>
> ## Trust signals — all must be genuine
>
> Named experts with real delivery history · real programme dates and formats · the published rubric and exemplars as evidence the credential is earned · an honest position on what exists today. **Do not fabricate experts, testimonials, employer logos, participant numbers or dates** — including in fixture data. On a trust product, a padded proof band is worse than an empty one, and the original specification was right about that.
>
> ## What must not appear
>
> Course counts or catalogue depth as a credibility signal · "browse our courses" framing · a video-first or lesson-progression narrative · standards-council, accreditation-body or membership signalling *(including in the footer — the current implementation carries exactly this)* · community or chapter promotion · any AI feature presented as a product differentiator.
>
> ## Deliberately left open
>
> Which pathway leads visually · the working name *"Data & AI Academy"* · launch programme inventory · pricing presentation. **Do not resolve these here.**

---

*Original specification, retained for reference. Superseded by the brief above.*

**Purpose.** Answer "is this for someone like me?" in under 30 seconds, then route to the right door.

**Key sections, in order:**

1. **Hero.** One claim, not three. Headline states the differentiator: *learn what you're missing, prove it by doing the work, carry the proof anywhere*. Sub-line names the audience. Single primary CTA **Start free diagnostic (10 min)** + secondary text link *See how certification works*. Supporting visual: an abstracted skill-graph / capability map — **never** a stock photo of people at laptops.
2. **The three doors.** The most important block on the page. Three large cards, equal weight, each with icon, one-line description, and its own CTA:
   - *Build my career* → `/learn`
   - *Train my team* → `/organisations`
   - *Teach or partner* → `/teach`
3. **Why this is different.** Three columns mapping to D1/D2/D3, each with a concrete proof element rather than a claim: a rubric fragment, a version stamp, a cited AI answer. **Show, don't assert.**
4. **The credential.** *Phase 2+: a horizontal L1→L4 ladder visual.* **In V1 (DR-01) there is no ladder** — this block instead states what the single credential proves and what it requires (knowledge + evidence), linking to `P15`. Do not design a ladder graphic for the first mockup.
5. **Domains.** Five tiles (DF, DE, AI, GA, GT) with course counts and a one-line scope. GA tile visually emphasised — it is the beachhead.
6. **Proof band.** Credential holders, cohorts delivered, employers recognising, chapters. Numbers only when they are real; otherwise use named case evidence. Empty-state honesty matters here at launch — an obviously padded stat band destroys trust on a trust product.
7. **For organisations teaser.** A cropped, anonymised skills heatmap. This single visual does more corporate lead-gen than any amount of copy.
8. **From the knowledge library.** Three recent or cornerstone articles with version stamps. Signals living knowledge and feeds SEO.
9. **Closing CTA.** Repeat the diagnostic CTA with a one-line reassurance ("no payment, no commitment, results in 10 minutes").

**Primary CTA:** Start free diagnostic. **Secondary:** the three doors.

**States:** signed-out (as above) · signed-in (hero replaced by a "continue learning" strip; three doors demoted).

---

### P02 — About `[MVP]`

**Purpose.** Establish that a real, credible, accountable organisation stands behind the credential.

**Sections:** what the academy exists to do · the founder/instructor story with genuine credentials and delivery history (this is a strength — real practitioner delivery to real enterprises) · how the standard is governed · the standards council and advisory board · accreditation and recognitions · where we operate · contact.

**CTA:** Explore certification. **Note:** on a trust product, this page is read more than teams expect. Do not treat it as filler.

---

### P03 — The Capability Standard `⊘ RETIRED (DR-02)`

> **Retired.** A published, governed "capability standard" is a standards-body surface, and the organisation is not one. **`P03` remains permanently allocated to this retired screen and must never be reused.**
>
> **What survives, and must not be lost with it: credential transparency.** Participants and employers should still be able to understand what a credential represents, what it requires, what evidence is expected, how assessment works, and how to verify it. That is a trust practice, and it lives on **`P15`** Credential Detail and **`P16`** Public Verification — not in a standards-council apparatus.

*Original specification, retained for reference:*

**Purpose.** Publish the standard openly. Open standard, proprietary assessment — this is the structural moat.

**Sections:** the five domains and four altitudes explained · the skill graph browsable in read-only form · proficiency scale definitions (1–5, with observable descriptors) · how the standard is governed and revised · how to propose a change · downloadable standard PDF · version history.

**CTA:** Browse the skill graph.

---

### P04 — Credential Integrity & AI-Use Policy `[MVP]`

**Purpose.** A genuine differentiator page. Most incumbents avoid the AI question entirely; publishing a clear position is a positioning advantage.

**Sections:** what our credentials assert and what they do not · the evidence model · the three AI-use policies (Permitted / Disclosed / Restricted) with the reasoning · integrity controls (proctoring, brief variants, defence interview) · appeals process · revocation policy · how to report a concern.

**CTA:** See how certification works.

---

### P05 — Free Skill Diagnostic `[MVP]`

**Purpose.** The single highest-leverage conversion asset. Give real value before asking for anything.

**Layout:** full-screen focus mode. No global nav — a minimal bar with logo, honest progress ("Question 6 of ~15"), and Save & exit.

**Per-question canvas:** one question per screen · scenario-based framing · 3–5 options · **"I'm not sure" always present as an equal-weight, unpenalised option** · Back permitted · no timer, no score shown.

**Mid-flow value drops:** after roughly every 5 questions, a brief insight card — *"You're reading strongly on data modelling. Let's check governance."* This is what stops abandonment: value arrives before completion.

**Micro-copy rule:** never use test language. No "correct", "wrong", "score", "pass". Use "calibrating", "locating you", "checking".

**Primary CTA:** Continue → at the end, **See my results**, which requires account creation (`S02`) to unlock the full report.

**States:** anonymous in-progress (localStorage, 30 days) · resumed · complete-anonymous (partial result) · complete-authenticated (full result).

---

### P06 — Diagnostic Result `[MVP]`

**Purpose.** The highest-conversion screen on the platform. Convert insight into an enrolment.

**Sections:**
1. **Your capability profile.** Radar or horizontal bar across the five domains with proficiency 1–5. Named, not just numeric.
2. **Compared to your target role.** Role selector; overlay of target profile vs current. The gap is the product.
3. **Your named gaps.** Ranked list, each in plain language — *"You can describe what metadata is, but not how to design a lineage capability"*. Specificity is what makes this feel like insight rather than a quiz result.
4. **Your recommended path.** Milestones, honest hour estimate, target credential, price.
5. **What you already have.** Explicitly list what they can skip. This is the *shortest honest path* promise made visible, and it builds enormous trust.
6. **Optional comparison.** Anonymised peer benchmark for similar roles.

**Primary CTA:** Start this path. **Secondary:** Save results · Email me the report · Explore other paths.

**Anonymous variant:** show sections 1 and 3 partially blurred with a clear "create a free account to unlock" — no dark patterns, no fake blur over nothing.

---

### P07 — Learning Overview `[MVP]`

**Purpose.** Orient someone who knows they want to learn but not what.

**Sections:** three ways in (by domain / by role / by credential) · the five domain tiles · featured paths · the literacy product called out separately (different buyer, different shape) · modality explainer (self-paced vs cohort vs workshop) · "not sure where to start" → diagnostic.

**CTA:** Take the diagnostic · Browse catalogue.

---

### P08 — Domain Landing `[MVP]`

**Purpose.** The SEO and authority page per domain. One per DF/DE/AI/GA/GT.

**Sections:** what this domain covers and why it matters now · the skills in this domain (from the graph) with altitude bands · paths in this domain · courses grouped by altitude · credentials available · knowledge articles in this domain · instructors · FAQ.

**CTA:** See the path for this domain.

---

### P09 / P10 — Learning Paths Index & Detail `[MVP]`

**P09 Index:** faceted by domain × altitude × duration × credential target. Cards show: title, domain chip, altitude chip, milestone count, hours, credential target, modality options, price.

**P10 Path Detail — key sections:**
1. **Outcome statement** — what you will be able to *do*, expressed as capabilities not topics.
2. **Milestone timeline** — the signature component. 5–8 named milestones, each stating the capability gained. Never a raw list of course titles.
3. **Courses within** — expandable per milestone.
4. **Skills gained** — chips linked to the skill graph; "check which of these I already have" → diagnostic.
5. **Credential target** — what this path prepares you for, with the evidence requirement stated honestly up front.
6. **Prerequisites** with a self-check.
7. **Modality & dates** — self-paced always available; next cohort dates highlighted.
8. **Instructor.**
9. **Honest time commitment** — hours/week × weeks, not just total hours.
10. **Price, funding eligibility (HRD Corp chip), enrol.**

**CTA:** Start path / Join next cohort.

---

### P11 — Course Catalogue `⊘ RETIRED (DR-02)`

> **Retired outright — not merged, not deferred.** A faceted catalogue sorted by "most enrolled", with course cards and ratings, is the defining surface of a course marketplace. It is incompatible with a selective, expert-led organisation, and it invites the one question we lose: *"how many courses do you have?"*
>
> **Replaced by:** `P10` Programme Detail and `P24` Scheduled Offerings — a short, honest list of what runs and when.
> **`P11` remains permanently allocated to this retired screen and must never be reused.**

*Original specification, retained for reference:*

**Purpose.** Browse and filter the full library.

**Layout:** left filter rail (desktop) / filter sheet (mobile). Facets: **Domain** · **Altitude** · Modality · Duration · Language · Credential-relevant · Funding-eligible · Price. Sort: relevance, newest, most enrolled, duration.

**Course card (reusable component `CourseCard`):** title · domain chip · altitude chip · duration · modality icon(s) · short outcome line · instructor avatar · rating (only once real) · price or "included" · funding chip if eligible.

**Empty state:** never a dead end. Show "nothing matches — here are the closest three" plus a clear filter reset.

---

### P12 — Course Landing (public) `[MVP]`
Identical to `C01` — see §6.1. The public course page and the pre-enrolment view are the same screen with different CTAs.

---

### P13 — Data & AI Literacy `[MVP]`

**Purpose.** A distinct product shape for a distinct buyer (A1 altitude, whole-organisation volume). Do not bury it in the catalogue.

**Sections:** who this is for (explicitly non-technical) · what changes after 4 hours · the three literacy tracks (Data Literacy · AI Literacy · GenAI at Work) · a "for leaders" A4 variant · team/organisation pricing · sample lesson (open, ungated) · L1 credential.

**CTA:** Start free lesson · Get team pricing.

---

### P14 — Certification Overview `[MVP]`

**Purpose.** Explain the ladder and — critically — why the evidence requirement makes this credential worth more, not just harder.

**Sections:**
1. **The ladder** — L1→L4 visual with what each proves, who it's for, and effort.
2. **How it works** — a 6-step visual: Check readiness → Prepare → Knowledge assessment → Applied artifact → Assessor review → Credential.
3. **What makes it different** — side-by-side comparison of *exam-only certificate* vs *evidence-based credential*. Be direct; this is the sales argument.
4. **What employers see** — an embedded live example of the public verification page `P16`.
5. **Domains & specialisms.**
6. **Fees, timelines, validity.**
7. **Integrity & AI policy** teaser → `P04`.
8. **FAQ.**

**CTA:** Check my readiness (free).

---

### P15 — Credential Detail `[MVP]`

**Purpose.** Everything a candidate needs to commit — with nothing hidden.

**Key sections:**
1. Credential name, level, domain, badge visual.
2. **What this proves** — capability statements from the skill graph.
3. **Who it's for** — experience and role guidance.
4. **Requirements** rendered generically from the `requirements` rows — in V1 two blocks: **Knowledge** (exam, format, pass threshold) · **Evidence** (artifact type, effort, rubric). *Experience appears only when a credential definition carries that requirement type — Phase 2+.* Never hardcode the block list.
5. **The published rubric** — visible before purchase. Radical transparency, and a strong differentiator.
6. **Exemplar artifacts** — at Competent / Proficient / Distinguished. *This is the single most conversion-critical asset on the page*: it removes the fear that makes candidates drop at the evidence gate.
7. **Fees & what's included** (attempts, resubmission policy).
8. **Timeline** — realistic weeks from registration to award.
9. **Validity & renewal.**
10. **AI-use policy chip** for each assessment component.
11. **Recognition** — employers, partners.

**CTA:** Check readiness (free) → Register as candidate.

---

### P16 — Public Credential Verification `[MVP]`

**Purpose.** Where a hiring manager first meets the brand. Treat it as a growth surface, not a utility page.

**Layout:** clean, fast, mobile-first, no app chrome, no login.

**Sections:** verification seal + status chip (**Valid** / Expired / Suspended / Revoked) · holder name and photo (consent-gated) · credential name, level, domain, badge · **skills asserted with proficiency levels** · criteria met · issued and expires dates · knowledge-base version earned against · evidence link (holder-consented) · issuer statement and how to verify independently · "what does this credential mean?" → `P15`.

**Design note:** the status chip must be unmistakable at a glance and readable without colour. A revoked credential shows a neutral, non-defamatory status — never editorialise.

**CTA (for the visiting employer):** Learn what this credential requires · Hire-with-confidence / talk to us.

---

### P17 — Corporate Overview `[MVP]`

**Purpose.** Sell outcomes, not a course list.

**Sections:**
1. **Hero** — the buyer's problem in their words: prove capability uplift, satisfy audit, use the levy before it expires.
2. **Start with the diagnosis** — the Capability Assessment entry offer. *Selling the diagnosis first is the land motion; make it the most prominent CTA on the page.*
3. **Sample skills heatmap** — realistic, anonymised, interactive if possible.
4. **The programme model** — blended: pre-work → live workshop → post-work → assessment → credential. Matches proven 2-day delivery.
5. **What you get** — cohort management, dashboards, attendance evidence, uplift reporting, compliance packs.
6. **Funding** → `P18`.
7. **Case evidence.**
8. **Pricing logic** — ranges, not a quote form only. Buyers self-qualify better with ranges.

**CTA:** Book a capability assessment.

---

### P18 — Funding & HRD Corp Support `[MVP]`

**Purpose.** Remove the single largest administrative objection in the Malaysian corporate market. Small page, disproportionate commercial value.

**Sections:** how HRD Corp claimable training works, plainly · which of our programmes are registered/claimable · **what documentation we generate automatically** (attendance registers, trainer profile, course outline, learning outcomes, evaluation forms, certificates) · the claim process step by step with our part clearly marked · downloadable sample evidence pack · other regional schemes (extensible) · FAQ.

**CTA:** Talk to us about a claimable programme.

---

### P19 — Contact / Book a Capability Assessment `[MVP]`

Qualifying form: organisation, size, sector, team(s) to assess, timeline, funding scheme, contact. Shows what happens next and when. Calendar booking option. **Do not use a generic "contact us" form** — a qualifying form doubles as lead scoring.

---

### P20 — Become a Contributor `[P2]`
Routes into the contribution ladder: speak · write · mentor · **assess**. Each with criteria, benefits (CPD weighting, fee waivers, revenue share, standing), and an application. Assessor recruitment is the binding constraint on the whole model — give it top billing.

### P21 — Become an Instructor `[P2]`
Who we look for · credential requirements · what we provide (studio, audience, assessment infrastructure, revenue share) · the process · current openings by domain · apply.

### P22 — Become a Training Partner `[P2]`
The delivery-scaling mechanism. Accreditation requirements · instructor credential standard · what partners may use and must maintain · annual review · fees · benefits (directory listing, referrals, licensed assets, discounted exams) · apply. Plus the public **partner directory**.

---

# 5. LEARNER PORTAL

**Global learner shell.** Persistent left sidebar (collapsible to icons) · top bar with global search, AI tutor toggle, notifications, avatar/workspace switcher · main content · optional right rail (AI tutor / contextual help). On mobile: bottom tab bar + hamburger for secondary items.

---

### L01 — Learner Dashboard `[MVP]` ★ priority screen

**Purpose.** Answer one question: *"what should I do next, and am I on track?"* Not "here is everything about your account".

```
┌────────────────────────────────────────────────────────────────────────────┐
│ ☰  Data & AI Academy        [ 🔍 search ]      [✨ Tutor] [🔔 3] [MQ ▾]     │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  Good morning, Daniel                              Thursday, 29 August     │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │  CONTINUE                                                    12 min  │ │
│  │  Data Modelling · Lesson 4 — Normalisation in practice                │ │
│  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░  Milestone 3 of 7 · Model an enterprise domain  │ │
│  │                                              [  Continue  →  ]        │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
├─────────────────────────────────────┬──────────────────────────────────────┤
│  MY PATH                            │  CREDENTIAL PROGRESS                 │
│  Blueprint Practitioner · Data      │  Blueprint Practitioner — DF         │
│  Foundations                        │                                      │
│                                     │  ✔ Knowledge exam    74% Practitioner│
│  ●━━●━━●━━◉━━○━━○━━○                │  ◐ Applied artifact  draft saved     │
│  M1  M2  M3  M4  M5  M6  M7         │  ○ Experience        not required    │
│                                     │                                      │
│  On track · ~14 hrs remaining       │  Est. award: 12 October              │
│  Target date: 12 October            │        [ Open artifact brief → ]     │
├─────────────────────────────────────┼──────────────────────────────────────┤
│  THIS WEEK                          │  YOUR SKILLS                         │
│  ☑ Mon — Lesson 3 complete          │  Data Foundations  ████████░░  4.1   │
│  ▸ Wed 20:00 — Live: Modelling Q&A  │  Governance        █████░░░░░  2.6   │
│  ▸ Fri — Knowledge check due        │  AI & GenAI        ███░░░░░░░  1.8 ⚠ │
│  ☐ 2 of 3 sessions this week        │                                      │
│                                     │  ⚠ Largest gap vs Data Architect     │
│                        [ Calendar ] │            [ Close this gap → ]      │
├─────────────────────────────────────┴──────────────────────────────────────┤
│  FROM YOUR COMMUNITY          3 replies to your question · KL chapter 14 Sep│
└────────────────────────────────────────────────────────────────────────────┘
```

**Widget inventory (in priority order):**

| # | Widget | Content | Action |
|---|---|---|---|
| 1 | **Continue card** | Exact next lesson, duration, milestone context | Continue → `C05` |
| 2 | **My Path** | Milestone timeline, position marker, pace status, target date | → `L04` |
| 3 | **Credential progress** | Requirement checklist with per-item state, estimated award date | → `K01` |
| 4 | **This week** | Commitments, live sessions, due items | → `L12` |
| 5 | **Your skills** | Top 3 domains + the largest gap called out | → `L05` |
| 6 | **Community strip** | Replies to me, next chapter event | → `M07` |

**States:** brand-new (no enrolment → "take the diagnostic" hero) · enrolled-not-started · active · **stalled** (behind own declared pace → a *re-entry ramp* card offering a 5-minute recap and a shortened next step, never a guilt message) · path complete · credential awarded (celebratory strip).

**Corporate variant:** adds an "Assigned by [Org]" section with deadlines above This Week, and org branding in the header.

**Design rules:** the Continue card is always first and always visually dominant. Milestone naming beats percentage everywhere. Never show more than 6 widgets. Mobile collapses to a single column in exactly this priority order.

---

### L02 — My Learning `[MVP]`

**Purpose.** Manage everything enrolled.

**Layout:** tabs — **In progress** · Not started · Completed · Archived. Course rows (not cards — this is a management view) showing: title, domain/altitude chips, progress bar with last-activity date, next lesson, time remaining, cohort badge if applicable, overflow menu (archive, unenrol, certificate, notes).

**Empty state:** "Nothing in progress. Here's what your path suggests next."

---

### L03 — Learning Paths (mine) `[MVP]`
Enrolled paths with progress, plus discoverable recommended paths. Folded into `L02` in MVP if screen budget is tight.

---

### L04 — My Path `[MVP]` ★ signature screen

**Purpose.** Make the journey feel like becoming something, not completing a list. This is the screen that expresses the product's philosophy.

**Layout:** vertical (mobile) / horizontal (desktop) **milestone timeline** as the hero element.

**Per milestone node:** state (complete ✔ · current ◉ · locked ○) · milestone name expressed as a **capability** ("Model an enterprise data domain", not "Module 5") · courses inside (expandable) · skills unlocked as chips · estimated hours · assessment or artifact gate marker where one exists.

**Side panel:** target credential · pace status (ahead / on track / behind, against *their own* declared pace) · target date · hours/week actual vs planned · **Re-plan** button.

**Explain-the-recommendation:** every generated item carries a "why this is here" expandable line. Unexplained personalisation reads as manipulation.

**`L04b` Path Planner `[P2]`:** adjust target role, credential goal, weekly hours, target date; preview the regenerated path *before* committing; option to test out of a milestone via assessment.

---

### L05 — Skills Profile `[MVP]` ★ signature screen

**Purpose.** The learner's capability truth. Where "learn what you're actually missing" is delivered.

**Sections:**
1. **Capability radar** across five domains, with an overlay toggle for target role.
2. **Skill list by domain** — each row: skill name · proficiency meter (1–5) · **confidence indicator showing decay** · evidence source (diagnostic / assessment / artifact / attestation) · last demonstrated date.
3. **Gap analysis** — ranked by impact against the selected target role, each with a "close this gap" action.
4. **Role explorer** — switch target role, see the profile shift. Great for career exploration and for the P2/P3 personas.
5. **Evidence trail** — click any skill to see exactly what backs the assertion. This is what makes the profile defensible rather than self-declared.

**Design note on decay:** proficiency is shown with a confidence that fades over time — a GenAI skill demonstrated 18 months ago should not read as current. Present this as *honesty*, never as punishment, with a clear "refresh this skill" action. It is simultaneously the honesty promise and the legitimate reason for recurring engagement.

---

### L06 — Assessments Hub `[MVP]`

Tabs: **Available** · Scheduled · Completed · Practice.
Each row: assessment name · type (knowledge check / practice / exam) · linked course or credential · duration · **AI-use policy chip** · attempts used/allowed · status · action.
Result rows show the outcome, per-skill breakdown, and retake options. *(Under DR-01, V1 shows a pass/not-yet outcome against a single threshold plus the raw score — not a band.)*

---

### L07 — Assignments Hub `[MVP]`

Tabs: **To do** · Submitted · Assessed · Resubmit.
Rows: assignment title · type (practice / credential-bearing) · linked credential · due date · **rubric link** · status chip · action.
Credential-bearing assignments are visually distinguished from practice ones — the stakes must be unambiguous.

---

### L08 — Evidence Portfolio `[MVP]`

**Purpose.** The learner's body of work — a genuine asset they can show an employer.

Grid of artifact cards: title · type · domain · date · assessment outcome · **visibility toggle (private / link / public)**. Detail view shows the artifact, the brief it answered, the rubric outcome, and the assessor's feedback. Optional public portfolio page linked from the profile and from `P16`.

---

### L09 — My Credentials `[MVP]` ★ priority screen

**Sections:**
- **Earned** — `CredentialCard` grid: badge visual · name · level · domain · issued/expires · status chip · CPD ring · actions (Share · Download · Verify link · Add to LinkedIn).
- **In progress** — active candidacies with the stage tracker → `K01`.
- **Available to you** — credentials the learner is close to, with readiness %.

**Award moment:** when a credential is first issued, a full-screen celebratory state — specific about what was demonstrated, not generic confetti — with immediate share actions. This screen earns real design and motion investment (the one deliberate exception to functional-motion-only).

---

### L10 — Credential Detail `[MVP]`
Full badge, skills asserted, criteria met, evidence links, verification URL with copy button, share composer with pre-written text, download (PNG/PDF/wallet), renewal status and CPD requirement, revocation/appeal info.

---

### L11 — CPD & Renewal `[P2]`
CPD ledger with points by category · progress ring toward annual requirement · renewal countdown · log activity (platform activity auto-logged; external self-declared and sampled) · **contribution weighted highest** (speaking, mentoring, assessing, authoring) · annual ethics re-attestation · renewal currency assessment generated from the knowledge changelog.

### L12 — Calendar & Sessions `[MVP]`
Month/week/agenda views. Live sessions, cohort schedule, exam bookings, assignment deadlines, events. Calendar sync (ICS/Google/Outlook). Join links appear 15 minutes before.

### L13 — Learning History & Transcript `[P2]`
Full chronological record; filter by type; official transcript export (PDF) for employers, universities, and funding claims — corporate learners need this for reimbursement.

### L14 — AI Learning Assistant `[MVP]` ★ differentiator
See §12.1. Exists as both a full page and a persistent right-rail panel.

**Panel layout:** context chip showing what it can see (*"Reading: Lesson 4 — Normalisation"*) · conversation · **every answer carries citations to knowledge nodes with version stamps** · suggested prompts contextual to the lesson · "explain differently" / "explain at a different altitude" quick actions · escalate to community.

**Guardrail states the UI must show explicitly:**
- *In assessment context:* panel is visibly locked — "The tutor is unavailable during assessments." Do not hide it; show it disabled with the reason.
- *Out of corpus:* "I don't have a sourced answer for that — ask the community" with a one-click post action. **Never confabulate.**
- *Coaching an artifact:* a persistent banner — "I can help with structure and completeness. I won't write your submission. This conversation is disclosed to your assessor."

---

# 6. COURSE EXPERIENCE

**Design stance.** The course experience is where learners spend the most time, so it must be fast, calm, and predictable. **Consistent structure is the main tool against overwhelm** — every module looks the same, so the learner builds muscle memory for the format and spends cognitive effort on the content, not the interface.

**Standard module rhythm** (every module, without exception):
`Orientation → Core lessons → Worked example → Guided practice → Knowledge check → Applied task → Consolidation`

---

### C01 — Course Landing Page `[MVP]`
*(Same screen as `P12`; CTA differs by enrolment state.)*

**Purpose.** Let someone decide honestly whether to invest the hours.

**Layout — two column (desktop), stacked (mobile):**

```
┌───────────────────────────────────────────┬───────────────────────────┐
│  [DF] [A2 Applied]        ★ 4.8 · 214     │  ┌─────────────────────┐  │
│                                            │  │   preview video     │  │
│  Data Modelling for Enterprise Systems     │  └─────────────────────┘  │
│                                            │  8h 20m · 6 modules       │
│  Design conceptual, logical and physical   │  Self-paced + cohort      │
│  models for real enterprise domains.       │  Certificate on completion│
│                                            │  Counts toward: L2 — DF   │
│  👤 Mustafa Qizilbash · 20 yrs practice    │                           │
│                                            │  ✅ HRD Corp claimable    │
│  ── WHAT YOU'LL BE ABLE TO DO ─────────    │                           │
│  • Produce a conceptual model from a       │        RM 1,200           │
│    business scenario                       │  [   Enrol now   ]        │
│  • Normalise to 3NF and justify when not   │  [ Join Oct cohort ]      │
│  • Choose relational vs dimensional …      │                           │
│                                            │  ▸ Add to path            │
│  ── CURRICULUM ────────────────────────    │  ▸ Gift / team purchase   │
│  ▸ 1. Why models exist          45m        │                           │
│  ▸ 2. Conceptual modelling      1h 10m     │  ── PREREQUISITES ──      │
│  ▸ 3. Logical & normalisation   1h 40m     │  DF-102 Data basics ✔ you │
│  ▸ 4. Physical design           1h 15m     │      already have this    │
│  ▸ 5. Dimensional modelling     1h 30m     │                           │
│  ▸ 6. Applied: model a bank     2h  ⚑      │  ── SKILLS GAINED ──      │
│                                            │  Conceptual modelling +2  │
│  ── INSTRUCTOR · REVIEWS · FAQ ────────    │  Normalisation      +2    │
└───────────────────────────────────────────┴───────────────────────────┘
```

**Required blocks:** outcomes as observable capabilities (never "you will learn about…") · full curriculum with durations, expandable to lesson level · **free preview lesson, ungated** · skills gained with delta values · prerequisites with a personalised "you already have this" check · instructor credibility · modality and cohort dates · credential relevance · funding chip · price · reviews · FAQ.

**States:** not enrolled (Enrol) · enrolled (Continue) · completed (Certificate + Review) · in a corporate assignment (Assigned by [Org], due date, no price shown).

---

### C02 — Course Home (enrolled) `[MVP]`

**Purpose.** The learner's base inside a course.

**Layout:** left rail = curriculum tree with per-item state; main = continue card + module cards + course-level resources + cohort/announcements if applicable; right = progress summary, certificate status, discussion.

**Module card:** number, title, duration, progress ring, state (locked / available / in progress / complete), and the module's one-line outcome.

---

### C03 — Curriculum View `[MVP]`
Full expandable tree: Course → Module → Lesson → Block-type icons (video · reading · diagram · quiz · lab · download · assignment). Shows duration per item, completion ticks, and gates. Also serves as the syllabus for corporate and funding documentation — exportable to PDF, which the HRD Corp course-outline requirement needs.

---

### C04 — Module View `[MVP]`
Module orientation screen. Why this module matters · the outcome · the lesson list in rhythm order · estimated time · what unlocks at the end (a skill, a gate, an assignment). Small screen, high value: it gives the learner a mental map before they start consuming.

---

### C05 — ~~Lesson Player~~ → **Materials Viewer** `↻ DEMOTED (DR-02)`

> **No longer a ★ priority screen, and no longer "where learners spend most of their time."** Participants spend most of their time **in the session with an expert**. This screen becomes a **supporting-materials surface** governed by the DR-02 §5 boundary: materials **prepare, extend, reinforce or document** expert-led learning and must never silently replace it.
>
> **What it carries:** preparation material, readings, templates, exercises, case studies, references, practice activities, post-session reinforcement, and **recordings of live sessions where appropriate**. *A recording documents a session that happened — it is not a pre-recorded course, and must never be presented, priced or navigated as one.*
>
> **What goes:** the video-first framing, sequential lesson progression, completion-by-watching, "62% · 3h left" progress-through-content, auto-advance, and the AI tutor panel (deferred with `M8`).
>
> **What survives and should be kept:** the accessibility work — captions, transcripts, keyboard completeness — and the knowledge-base references with version stamps, which remain a genuine trust surface.
>
> Priority is now `P1` per `MVP_BUILD_SPEC.md` §6.

*Original specification, retained for reference:*

**Purpose.** Distraction-free consumption with everything needed one click away.

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ← Data Modelling          Module 3 · Lesson 4 of 6      [✨] [🔖] [⋯]    │
├────────────┬─────────────────────────────────────────────┬───────────────┤
│ CURRICULUM │                                             │  AI TUTOR     │
│            │   ┌───────────────────────────────────┐     │  ───────────  │
│ ▾ M1 ✔     │   │                                   │     │ Reading:      │
│ ▾ M2 ✔     │   │        video / diagram /          │     │ Normalisation │
│ ▾ M3       │   │        rich content area          │     │ in practice   │
│   ✔ L1     │   │                                   │     │               │
│   ✔ L2     │   └───────────────────────────────────┘     │ Try asking:   │
│   ✔ L3     │   ▶ ━━━━━━━━━●────────  8:14 / 12:02  ⚙ CC  │ • Why stop at │
│   ◉ L4     │                                             │   3NF?        │
│   ○ L5     │   ## Normalisation in practice              │ • Show me a   │
│   ○ L6     │                                             │   worked eg.  │
│ ▸ M4 🔒    │   Body content, diagrams, code, callouts…   │               │
│ ▸ M5 🔒    │                                             │ ┌───────────┐ │
│ ▸ M6 🔒    │   ── REFERENCES ──                          │ │ Ask…      │ │
│            │   📖 Normalisation (Body of Practice v2.3)  │ └───────────┘ │
│ ─────────  │   📄 Worked example — retail schema         │               │
│ 62% · 3h   │                                             │ Answers cite  │
│ left       │   [ Transcript ] [ Notes ] [ Discussion ]   │ sources ✓     │
│            │                                             │               │
│            │           [ ← Previous ]  [ Complete → ]    │               │
└────────────┴─────────────────────────────────────────────┴───────────────┘
```

**Required behaviours:** autosave position (resume to the second) · keyboard shortcuts (space, ←/→, F, C) · playback speed and captions always available · transcript searchable and clickable to seek · notes timestamped to video position · **knowledge-base references with version stamps** on every lesson (this is D2 made visible) · mark complete (manual, not auto — respect the learner's judgement) · next-lesson auto-advance as a preference, off by default.

**Constraints:** no video over 12 minutes · every lesson standalone-comprehensible (learners do not consume linearly) · captions and transcripts mandatory · left rail collapsible · right rail collapsible · mobile hides both rails behind sheets.

---

### C06 — Video Content `[MVP]`
Adaptive streaming, captions (multi-language), transcript with search and seek, speed control, chapter markers, resume, picture-in-picture, download for offline `[P2]`, and **no autoplay of the next video**.

### C07 — Reading Material `[MVP]`
Long-form layout: 720px measure, 16px+ body, 1.6 line height. Sticky section nav. Inline diagrams (SVG, theme-aware, zoomable). Callout components: definition · example · warning · practice tip · from-the-field. Glossary terms underlined with hover definitions linking to `N05`. Reading progress indicator. Highlight-and-note.

### C08 — Downloadable Resources `[MVP]`
Per-course and per-lesson resource lists: templates, worksheets, slide decks, datasets, checklists. Each with type icon, size, and a one-line "what this is for". Downloads logged for corporate evidence packs. Also surfaced globally in `N07`.

### C09 — Practical Exercises / Labs `[P2]`
Brief · starting materials · workspace (embedded notebook or sandbox for GA/DE domains) · hints (progressive, learner-triggered) · model solution released after attempt · self-check against a simple rubric. Start with GenAI notebooks — highest value, lowest infrastructure cost.

### C10 — Quiz / Knowledge Check `[MVP]`
Formative. Unlimited attempts. One question per screen or a short scrolling set. **Explanation always shown after answering, including for correct answers** (retrieval practice, not gatekeeping). Result feeds spaced repetition and updates the skill graph with low weight. Never blocks progress — it informs, it does not gate.

### C11 — Assignment (in-course) `[MVP]`
Practice assignments inside a course. Brief · deliverable spec · rubric (visible) · workspace · submit · instructor or peer feedback · resubmit. Structurally identical to `K06` but lower stakes and clearly labelled as practice, so learners build familiarity with the format *before* the credential-bearing one.

### C12 — Course Completion `[MVP]`
Completion state: what you can now do (capability statements) · skills gained with graph deltas · course certificate (distinct from a credential — visually and semantically different, this distinction matters enormously) · **next step surfaced immediately** (next course, or "you're now eligible to start the credential") · leave a review · share.

---

# 7. CERTIFICATION EXPERIENCE

> This is the differentiating journey and the highest-anxiety one on the platform. Every screen must reduce uncertainty: always show where the candidate is, what happens next, and when.

**The pipeline:**
```
Discover → Readiness → Register → Prepare → Knowledge Assessment
   → Artifact Brief → Build & Submit → AI pre-assessment → Assessor Review
   → [Defence, L3/L4] → Result → Credential Issued → Maintain
```

**Persistent element:** the **Candidacy Stage Tracker** appears on every `K` screen and in `L01`. Seven stages, current one highlighted, each showing state and expected timing.

```
 ●━━━━━●━━━━━●━━━━━◉━━━━━○━━━━━○━━━━━○
 Reg   Prep  Exam  Evidence Review Defence Award
  ✔     ✔     ✔    in prog   —      —      —
                   due 12 Sep
```

---

### K01 — Certification Journeys / Candidacy Tracker `[MVP]` ★ priority screen
Hub for all active and past candidacies. Per candidacy: credential, stage tracker, next action (one, unambiguous), deadlines, eligibility window countdown, fees paid, documents. Past candidacies show outcome and evidence.

### K02 — Readiness Check `[MVP]`
**Purpose.** Convert intent into a realistic plan, and prevent people paying for an exam they will fail.

Shows: **overall readiness %** · per-requirement breakdown (knowledge / evidence / experience) · **named gaps** with a recommended closing path and hours · estimated ready-by date · honest guidance ("you're ~14 hours from a comfortable attempt"). Free, repeatable.
**CTA:** Close gaps first · or Register anyway (never block a determined adult; just inform them).

### K03 — Register as Candidate `[MVP]`
Steps: choose credential and level → confirm eligibility → review requirements → **accept the integrity undertaking and code of ethics** (real reading, real checkbox, recorded) → review AI-use policy per component → pay → confirmation with the eligibility window start/end and what to do first.

### K04 — Prepare `[MVP]`
Preparation workspace: recommended modules for *your specific gaps only* · practice assessment access (separate item pool) · exemplar artifacts · the rubric · study plan against your target date · cohort/study-group option · exam booking entry point.

### K05 — Knowledge Assessment `[MVP]`
**Three screens:**

**K05a Pre-flight.** Rules, duration, question count, **AI-use policy: Restricted** stated unmissably, proctoring requirements, system check (camera, mic, bandwidth, browser), ID verification, environment scan, what happens if disconnected. Nothing about the exam should be a surprise.

**K05b Runner.** Deliberately minimal chrome.
```
┌────────────────────────────────────────────────────────────────┐
│  Question 34 of 100          ⏱ 52:18 remaining     ● Saved     │
├────────────────────────────────────────────────────────────────┤
│  A retail organisation stores customer records in three        │
│  operational systems with conflicting addresses…               │
│                                                                │
│  ○ A.  …                                                       │
│  ◉ B.  …                                                       │
│  ○ C.  …                                                       │
│  ○ D.  …                                                       │
│                                                                │
│  [ ⚑ Flag for review ]                                         │
├────────────────────────────────────────────────────────────────┤
│  [ ← Previous ]   [1][2][3]…[34]…[100]  ⚑3   [ Next → ]        │
│                                        [ Review & submit ]     │
└────────────────────────────────────────────────────────────────┘
```
Design rules for anxiety reduction: **time shown calmly** — no red, no pulsing, warning only at 10 and 5 minutes · visible saved-state indicator · item navigator with flags · no surprise auto-submit without a 60-second warning · full keyboard navigation.

**K05c Submitted.** Confirmation, what happens next, when results arrive, and an explanation that **passing this does not award the credential** — the artifact is still required. *(Under DR-01 there are no bands in V1; this screen states a threshold outcome, not a placement. The band explanation returns only with the ladder.)*

### K06 — Artifact Brief & Workspace `[MVP]` ★★ the differentiating screen

**Purpose.** Make "produce professional evidence" feel achievable rather than terrifying. This is where candidates drop; the design must carry them.

```
┌──────────────────────────────────────────────────┬─────────────────────┐
│ ← Blueprint Practitioner — Data Foundations      │  RUBRIC             │
│   Applied artifact                Due 12 Sep     │  ─────────────      │
├──────────────────────────────────────────────────┤  1. Model quality   │
│  YOUR BRIEF  (variant B — regional bank)         │     ○ Not yet       │
│                                                  │     ◉ Competent     │
│  MidCity Bank operates three core systems with   │     ○ Proficient    │
│  overlapping customer data. You have been asked  │     ○ Distinguished │
│  to propose a conceptual model and a governance  │                     │
│  approach for a single customer view…            │  2. Justification   │
│                          [ Read full brief ▾ ]   │  3. Governance fit  │
│                                                  │  4. Communication   │
│  ── DELIVERABLES ──────────────────────────      │  5. Risk awareness  │
│  ☑ 1. Conceptual data model (diagram + notes)    │                     │
│  ☑ 2. Decision memo (max 1,200 words)            │  [ See exemplars ]  │
│  ☐ 3. Risk & assumption register                 │   Competent         │
│  ☐ 4. AI-use disclosure                          │   Proficient        │
│                                                  │   Distinguished     │
│  ── YOUR WORK ───────────────────────────────    │                     │
│  📎 midcity-conceptual-model.png    2.1 MB  ✎ ✕  │  ── AI POLICY ──    │
│  📎 decision-memo.pdf               340 KB  ✎ ✕  │  🟡 AI-DISCLOSED    │
│  [ + Add file ]  or  [ Write in workspace ]      │  Use of AI is       │
│                                                  │  allowed. You must  │
│  ── SELF-CHECK ──────────────────────────────    │  document what you  │
│  Before submitting, check your work against      │  used and how you   │
│  each rubric criterion.        [ Run self-check ]│  evaluated it.      │
│                                                  │  Your critique is   │
│  Draft saved 2 min ago      [ Submit for review ]│  itself assessed.   │
└──────────────────────────────────────────────────┴─────────────────────┘
```

**Required elements:**
- **Parameterised brief variant** — each candidate gets a different industry/constraint set from a template. Anti-plagiarism by design, and it should be visible ("variant B") so candidates know copying is pointless.
- **Deliverable checklist** with live completion state.
- **Rubric permanently visible** in the side panel — not behind a link.
- **Exemplars** at Competent / Proficient / Distinguished, one click away. *The single highest-impact asset for completion rate.*
- **Staged checkpoints** — optional milestones (outline → draft → final) with AI coach feedback available at each. Never a single terrifying upload box.
- **AI-use disclosure field** as a required deliverable, with the policy chip explaining why.
- **Self-check** — the candidate rates themselves against each rubric criterion before submitting. Improves quality, reduces assessor load, and builds evaluative judgement.
- **Autosave**, always visible.

**States:** not started · draft · self-check incomplete · ready · submitted (locked) · returned for resubmission (assessor feedback shown inline against the rubric) · assessed.

### K07 — Submission Confirmation & Under Review `[MVP]`
What was submitted (manifest) · **assessment SLA with a live countdown** ("assessed within 10 working days — day 3 of 10") · what the assessor will do · what happens for each outcome · withdraw window · notification preferences. The countdown is a promise; showing it publicly forces operational discipline.

### K08 — Result & Feedback `[MVP]` ★ priority screen

**Purpose.** Deliver a decision the candidate can accept as fair — whichever way it goes.

**Layout:** outcome banner (Awarded / Not yet / Resubmit) → **rubric table showing the assessor's selection and written reasoning per criterion** → overall assessor comment → evidence citations linking rubric judgements to specific parts of the artifact → next step.

**"Not yet" is designed with as much care as "Awarded":** a specific remediation plan (which skills, which modules, roughly how long), the resubmission window and fee position (one free resubmission within 90 days), and a visible appeal route to a different assessor. **Never the word "failed".**

### K09 — Defence Session `[P2]`
L3/L4 only. Booking, pre-brief (what will be asked, how long, how it's judged), the live session (video + artifact side by side, structured question set), recording consent, post-session status.

### K10 — Credential Awarded `[MVP]`
Full-screen celebratory moment. Badge reveal with real motion. Specific about what was demonstrated ("you demonstrated Proficient conceptual modelling and Competent governance design"). Immediate actions: share to LinkedIn (pre-composed), copy verification link, download badge and certificate, add to profile. Then: what this unlocks — next level, assessor eligibility, directory listing.

### K11 — Appeals `[P2]`
Grounds for appeal, submission form, what happens (different assessor, timeline), status tracking, outcome. Publishing a real appeals process is a trust signal that costs little and matters a lot.

### K12 — Renewal & Currency `[P2]`
Renewal countdown · CPD requirement progress · annual ethics re-attestation · **currency assessment generated from the knowledge changelog since last award** (this is what makes "living knowledge" a real credential property) · suspended-state handling with a 90-day grace period, publicly visible as suspended rather than silently expiring.

---

# 8. DASHBOARD DESIGN

**Universal dashboard rule.** Every dashboard answers **one** question. If you cannot state it in a sentence, the dashboard is a data dump. Metrics that do not lead to an action are decoration — every number should either confirm "you're fine" or offer a click that changes something.

| Dashboard | The one question |
|---|---|
| Learner `L01` | What should I do next, and am I on track? |
| Instructor `I01` | Who needs me, and what am I behind on? |
| Assessor `A01` | What's assigned to me, and am I judging consistently? |
| Corporate Admin `O01` | Is this investment working, and where do I act? |
| Platform Admin `X01` | Is the trust asset healthy? |

---

## 8.1 Learner Dashboard — `L01`
Specified in full in §5. Summary:

| Element | Detail |
|---|---|
| **Widgets** | Continue card · My Path milestones · Credential progress · This week · Your skills + largest gap · Community strip |
| **Metrics** | Milestone n of N · hours remaining · pace vs own plan · skill proficiency 1–5 · credential requirement states |
| **Quick actions** | Continue lesson · Open artifact brief · Close this gap · Join live session |
| **Notifications** | Assessment result ready · assignment due · session starting · reply to my question · credential issued |
| **Progress indicators** | Milestone timeline (primary) · progress ring on continue card · credential requirement checklist |

---

## 8.2 Instructor Dashboard — `I01` `[MVP thin]`

**Question:** *Who needs me, and what am I behind on?*

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Instructor Studio                              [ + New course ] [ MQ ▾ ]│
├──────────────────────────────────────────────────────────────────────────┤
│  ⚠ MARKING QUEUE                                                    12   │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ Oldest item: 6 days   ·  SLA: 10 working days   ·  🟡 2 at risk    │ │
│  │ DF Cohort 2026-C3 · Applied task 4          [ Start marking → ]    │ │
│  └────────────────────────────────────────────────────────────────────┘ │
├────────────────────────────────┬─────────────────────────────────────────┤
│  NEXT SESSION                  │  LEARNERS NEEDING ATTENTION        7    │
│  Wed 20:00 · Modelling Q&A     │  • 4 stalled >10 days                   │
│  Cohort 2026-C3 · 24 enrolled  │  • 2 failed knowledge check twice       │
│  19 confirmed                  │  • 1 artifact overdue                   │
│  [ Join ] [ Take attendance ]  │                    [ Nudge all → ]      │
├────────────────────────────────┼─────────────────────────────────────────┤
│  MY COHORTS                    │  CONTENT                                │
│  2026-C3  DF  24 pax  62% ▓▓▓░ │  ⚠ 2 lessons past review date           │
│  2026-C4  GA  18 pax  start 14 │  1 draft awaiting reviewer              │
│                                │  Course rating 4.8 (214)                │
├────────────────────────────────┴─────────────────────────────────────────┤
│  EARNINGS  This quarter RM 18,400 · next payout 30 Sep    [ Details → ]  │
└──────────────────────────────────────────────────────────────────────────┘
```

| Element | Detail |
|---|---|
| **Widgets** | Marking queue (first, always) · Next session · Learners needing attention · My cohorts · Content health · Earnings |
| **Metrics** | Queue depth & oldest age vs SLA · session attendance rate · cohort completion % · stalled learner count · content review-due count · revenue |
| **Quick actions** | Start marking · Join session · Take attendance · Nudge stalled learners · Publish draft |
| **Notifications** | New submission · SLA at risk · learner question · review approved/rejected · cohort starting |
| **Design note** | Instructors are time-poor and context-switch constantly. **Everything must be actionable from this screen without navigating.** Queue age drives the visual hierarchy. |

---

## 8.3 Assessor Dashboard — `A01` `[MVP]`

**Question:** *What's assigned to me, and am I judging consistently?*

| Element | Detail |
|---|---|
| **Widgets** | My queue with SLA countdown per item · **Claim next** (single button — prevents cherry-picking) · **My calibration status** (inter-assessor agreement %) · Completed this period + earnings · **Moderation overrides on my assessments** (a learning loop, framed neutrally) · Open appeals |
| **Metrics** | Items in queue · oldest item age · median turnaround · agreement rate vs threshold · assessments completed · override rate |
| **Quick actions** | Claim next · Resume in-progress · Enter calibration · Declare conflict of interest |
| **Notifications** | New assignment · SLA breach imminent · calibration due · appeal filed on my assessment |
| **Design note** | Showing assessors their own agreement statistics turns calibration into a **professional norm** rather than an imposition. Frame overrides as insight, never as failure — assessor goodwill is the scarce resource. |

**Critical UI rule:** the queue is **blind** — candidate identity masked by default. Show cohort, credential, and submission date only. Unmasking requires an explicit action and is logged.

---

## 8.4 Corporate Admin Dashboard — `O01` `[MVP]` ★ priority screen

**Question:** *Is this investment working, and where do I act?*

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Acme Bank · Data & AI Capability      Q3 2026 ▾  All teams ▾  [Export ▾]│
├─────────────┬─────────────┬─────────────┬────────────────────────────────┤
│ SEATS       │ ACTIVATION  │ COMPLETION  │ CREDENTIALS                    │
│ 184 / 200   │ 87%   ▲6    │ 62%   ▲11   │ 41  (L1 29 · L2 12)            │
│ 16 unused   │ vs Q2       │ vs Q2       │ target 60 by Dec               │
├─────────────┴─────────────┴─────────────┴────────────────────────────────┤
│  CAPABILITY UPLIFT — baseline → now                      ← renewal case  │
│  Data Foundations    2.1 ──────────▶ 3.4   ▲1.3                         │
│  Governance          1.8 ──────▶     2.7   ▲0.9                         │
│  AI & GenAI          1.2 ────▶       2.1   ▲0.9                         │
│  Benchmark · banking · 1000+ staff:  2.9  ·  2.4  ·  1.9                │
├──────────────────────────────────────────┬───────────────────────────────┤
│  SKILLS HEATMAP                          │  NEEDS ATTENTION              │
│            Found  Gov  Plat   AI  GenAI  │  ⚠ 16 seats never activated   │
│  Data Eng   4.2   3.1   4.0  2.2   1.9   │      [ Send reminder ]        │
│  Analytics  3.8   2.4   2.1  2.0   1.7   │  ⚠ Risk & Compliance lowest   │
│  Risk/Comp  2.2   3.9   1.4  1.1   0.8   │    AI literacy in the org     │
│  Business   2.6   1.9   1.2  1.4   1.2   │      [ Assign literacy path ] │
│                            [ Full view ] │  ⚠ Data Architecture:         │
│                                          │    only 2 people proficient   │
│                                          │    — single point of failure  │
│                                          │      [ View coverage risk ]   │
├──────────────────────────────────────────┴───────────────────────────────┤
│  COMPLIANCE & FUNDING                                                    │
│  Cohort 2026-C3 · 24 attendees · attendance 94% · evidence complete ✔    │
│                                    [ Generate HRD Corp claim pack ▾ ]    │
└──────────────────────────────────────────────────────────────────────────┘
```

| Element | Detail |
|---|---|
| **Widgets** | Seat/activation/completion/credential tiles · **Uplift vs baseline (above the fold)** · Skills heatmap · Needs attention (every item has a one-click action) · Compliance & funding |
| **Metrics** | Seats assigned/activated/active · activation & completion % with QoQ delta · credentials by level · proficiency uplift vs baseline · benchmark comparison · attendance % · coverage risk |
| **Quick actions** | Send activation reminder · Assign a path · Generate compliance pack · Export board report · Add people |
| **Notifications** | Low utilisation alert (from week 2) · cohort starting · credential earned · report ready · renewal approaching |
| **Design notes** | Uplift sits above the fold because **it is the renewal argument** — which is why the baseline diagnostic must be enforced at onboarding. "Needs attention" converts data into action. **Coverage risk reframes training as risk management**, which unlocks a different and larger budget than L&D. |

---

## 8.5 Platform Admin Dashboard — `X01` `[MVP thin]`

**Question:** *Is the trust asset healthy?*

| Element | Detail |
|---|---|
| **Widgets** | **Assessment SLA compliance** · **Open integrity cases** · Credentials issued & pending · Active learners & enrolments · Content review-due backlog · Knowledge base version & pending changes · Assessor capacity vs demand · Revenue & refunds · AI cost & eval scores · Support backlog |
| **Metrics** | % assessments within SLA · integrity cases open/aged · inter-assessor agreement distribution · item discrimination outliers · content overdue count · assessor utilisation |
| **Quick actions** | Publish content · Approve a credential rule change · Open an integrity case · Rotate item bank · Feature flag toggle |
| **Design note** | **Assessment SLA and open integrity cases must never be buried.** They are the leading indicators of the trust asset degrading, and by the time they show up in revenue it is too late. |

---

# 9. CORPORATE TRAINING PORTAL

The corporate portal is a **first-class product**, not an admin area with seats. The corporate buyer is purchasing provable capability change, defensible spend, and reduced administrative risk — a different job from the individual learner's.

**Shell:** org switcher (for multi-org admins) · left nav (Dashboard · People · Teams · Programmes · Cohorts · Skills · Certifications · Compliance · Reports · Settings) · org branding in the header · global period selector.

---

### O01 — Corporate Dashboard `[MVP]`
Specified in §8.4.

### O02 — People & Seats `[MVP]`

**Purpose.** Get people in, activated, and assigned with minimum friction.

**Layout:** table with bulk selection. Columns: name · email · team · role/job title · seat status (invited / activated / active / dormant) · assigned programmes · progress · credentials · last active.

**Filters:** team, status, programme, completion band, credential held, **never activated** (a saved default filter — this is the admin's most frequent task).

**Bulk actions:** invite (paste emails or CSV) · assign programme · move to team · send reminder · deactivate seat · export.

**Add people flows:** single invite · CSV import with column mapping and validation preview · SSO/SCIM auto-provisioning `[P2]` · self-registration via a domain-restricted invite link.

**Design note:** the **"never activated"** cohort is where corporate value leaks. Surface it as a permanent, unmissable element with one-click remediation.

### O03 — Individual Learner View `[MVP]`
Progress across assigned programmes · skills profile · credentials · attendance record · assessment history · notes. **Privacy boundary made explicit in the UI:** a banner stating what the org can and cannot see. Managers see direct reports only; they cannot see diagnostic detail from before the person joined the org account, and personal credentials remain personally owned and portable.

### O04 — Teams `[MVP]`
Team list with size, average proficiency, completion, credential count. Team detail: members, assigned programmes, team skills profile, gap vs target role profile, manager assignment. Teams can mirror an HRIS org structure `[P2]` or be created manually `[MVP]`.

### O05 — Programmes & Assignments `[MVP]`

**Purpose.** Assign the right learning to the right people at scale.

Create a programme: name · select paths/courses · **mandatory vs recommended** · deadline · target audience (individuals, teams, or a dynamic rule such as "role = Data Analyst") · notification schedule · manager visibility.
Programme detail: assigned count, started, completed, overdue, at-risk; per-person status; extend deadline; remind; unassign.

### O06 / O07 — Cohorts `[MVP]`

**Purpose.** Run instructor-led delivery — the core of the proven 2-day corporate model.

Cohort list: name, programme, dates, instructor, enrolled/capacity, status, completion, attendance %.
Cohort detail: roster · session schedule · **attendance grid (sessions × attendees)** with bulk marking · materials · announcements · pre/post assessment results · evidence completeness indicator · export register.

**Design note:** the attendance grid is the single most-used screen for a funding-claimable programme. Make bulk marking fast, allow retrospective correction with an audit trail, and show evidence completeness as a live checklist.

### O08 — Skills Heatmap & Gap Analysis `[MVP]` ★ priority screen

**Purpose.** The screen a CDO takes to a board meeting.

**Layout:** matrix — rows = teams (or roles, or individuals on drill-down), columns = skills or domains. Cells show proficiency **as both colour and a numeric value** (accessibility requirement, and essential for the printed reports these buyers produce).

**Controls:** group by team / role / department · granularity domain ↔ individual skill · overlay target profile (shows deficit as a signed delta) · filter by altitude · compare to benchmark · compare to a previous period.

**Views:**
- **Proficiency view** — where are we now.
- **Gap view** — deficit against target role profiles.
- **Coverage risk view** — skills where fewer than N people are proficient. *Reframes training as risk management; commercially the most powerful view on the platform.*
- **Trend view** — movement over time.

**Interactions:** click a cell → drill to team → to individuals → to a person's skills profile. Every view exports to PNG/PDF/CSV for board decks.

### O09 — Certification Status Board `[MVP]`
Who is certified, at what level, in what domain; who is in progress and at which stage; who is expiring within 90 days; credential count vs target. Filter by team, level, domain, status. Export for compliance and capability reporting.

### O10 — Compliance & HRD Corp Documentation `[MVP]` ★ differentiator

**Purpose.** Remove the largest administrative burden in the Malaysian corporate market and make the platform structurally hard to leave.

**Sections:**
1. **Scheme profile** — which funding scheme applies (HRD Corp Malaysia at launch; the module is scheme-pluggable), registration numbers, employer details.
2. **Programme registration status** — which programmes are registered/claimable, with reference numbers.
3. **Evidence completeness board** — per cohort, a live checklist:
   `☑ Attendance register  ☑ Trainer profile  ☑ Course outline  ☑ Learning outcomes  ☑ Training materials  ☐ Evaluation forms (18/24)  ☑ Certificates`
4. **Generate claim pack** — one action produces a zipped, indexed bundle: signed attendance registers per session · trainer profile and credentials · course outline and duration breakdown · learning outcomes document · participant list with IC/passport reference · completion certificates · evaluation form summary · invoice.
5. **Audit trail** — every document generation logged with timestamp and generating user.
6. **Retention policy** — how long evidence is kept, exportable before deletion.

**Design note:** you already produce every one of these documents manually today (trainer profile, course outline, learning outcomes, training material, brochure). This screen turns hours of recurring administration into one click — which is why it belongs in the MVP despite looking like a back-office feature.

### O11 — Reports & Exports `[MVP]`
Report library: Executive summary (auto-generated quarterly, board-ready PDF) · Adoption & utilisation · Completion · Skills & uplift · Certification · Attendance & compliance · Custom.
Scheduling: email a report to named recipients on a cadence. Formats: PDF (branded), CSV, XLSX, API `[P2]`.

### O12 — Org Settings `[MVP thin / P2 full]`
Profile & branding (logo, colours applied to learner header) · seat management & billing · admins and permissions · SSO/SAML `[P2]` · SCIM `[P2]` · HRIS sync `[P2]` · notification defaults · data retention & privacy settings · integrations (Slack/Teams `[P2]`, calendar, LMS export `[P2]`).

---

# 10. KNOWLEDGE & RESOURCE LIBRARY

**Strategic role.** Three jobs at once: (1) the **canonical reference** that courses, exam items, and the AI tutor all cite; (2) the **SEO and trust surface** that brings strangers to the platform; (3) the **living-knowledge proof** that makes D2 real rather than a claim.

**Core structural rule:** `Domain → Area → Topic → Node`. A **node** is atomic, citable, and versioned. Everything else in the platform references nodes *at a version*.

---

### N01 — Knowledge Library Home `[MVP]`
Entry points: search with AI answer · five domain tiles · curated collections ("Starting in data governance", "GenAI for the enterprise") · resource types (articles · frameworks · templates · case studies · prompts · glossary) · **recently updated** feed with version stamps · link to `N10` changelog.

### N02 — Domain Index `[MVP]`
All areas and topics in a domain, with a coverage map showing what exists and what is coming. Filter by altitude. Links to courses and credentials in the same domain.

### N03 — Knowledge Article (Node) `[MVP]` ★ priority screen

**Purpose.** The SEO landing page and the citation target. Must serve both a stranger from a search engine and a learner following a citation.

**Layout:**
```
┌──────────────────────────────────────────────────┬────────────────────┐
│  Knowledge / Data Foundations / Metadata /       │  ON THIS PAGE      │
│  Data Lineage                                    │  • Quick answer    │
│                                                  │  • Why it matters  │
│  [DF] [A2·A3]   v2.3 · reviewed 12 Jun 2026 ✓    │  • In practice     │
│                                                  │  • Failure modes   │
│  # Data Lineage                                  │  • Maturity        │
│                                                  │                    │
│  ▸ QUICK ANSWER                                  │  RELATED           │
│  Two sentences. Complete. For the 70% who        │  → Metadata mgmt   │
│  only need this.                                 │  → Impact analysis │
│                                                  │  → Data catalogs   │
│  ▸ WHY IT MATTERS  ────────────────────────      │                    │
│  ~5 minute explainer.                            │  LEARN THIS        │
│                                                  │  📘 DF-203 Metadata│
│  ▸ IN PRACTICE  ───────────────────────────      │     & Lineage      │
│  Full treatment: approaches, trade-offs,         │     1h 20m         │
│  worked example, diagram.                        │  [ Start lesson ]  │
│                                                  │                    │
│  ▸ COMMON FAILURE MODES                          │  SKILLS            │
│  ▸ MATURITY INDICATORS                           │  Lineage design    │
│                                                  │  Metadata mgmt     │
│  ── VERSION HISTORY ──                           │                    │
│  v2.3 Jun 2026 — added column-level lineage      │  [ ✨ Ask tutor ]  │
│  v2.2 Nov 2025 — …          [ Full changelog ]   │                    │
└──────────────────────────────────────────────────┴────────────────────┘
```

**Required elements:** **progressive disclosure in three depths** (quick answer → explainer → full) · **version stamp and last-reviewed date, prominent** · glossary terms with hover definitions · cross-links to related nodes · linked skills · "learn this properly" CTA into the relevant lesson · version history with changelog entries · AI tutor entry point scoped to this node · citation block ("how to cite this").

**Access model:** most articles fully public (SEO). A minority — deep frameworks, templates — member-gated with a clear, honest preview, never a blur-tease.

### N04 / N05 — Glossary & Term Pages `[MVP]`
Alphabetical and domain-filtered glossary. Each term page: concise definition · disambiguation where the industry disagrees on usage (genuinely valuable and rarely done well) · related terms · where it appears in the standard · linked skills and courses. **High SEO value per unit of effort** — glossary terms are the most searched content in any professional domain.

### N06 — Frameworks & Patterns `[P2]`
Reusable patterns and reference architectures: context, problem, approach, trade-offs, when not to use, diagram, related nodes. **All original** — never reproduce another organisation's proprietary framework or diagram.

### N07 — Templates & Canvases `[MVP thin]`
Downloadable working artifacts: data governance charter, data quality scorecard, model canvas, AI use-case evaluation canvas, RAG evaluation checklist, AI risk register. Each with a "what this is for", a completed example, and format options (XLSX/DOCX/PDF/Miro). Downloads tracked; some member-gated.

### N08 — Case Studies `[P2]`
Anonymised real scenarios: situation, constraints, approach, outcome, what would be done differently. Reuse the industry case patterns already in your material (banking, telco). Feed directly into artifact brief variants.

### N09 — Prompt & AI Resource Library `[MVP]`
A genuinely differentiating asset for the GA domain and a strong acquisition magnet.
Contents: production-grade prompt patterns by task (analysis, extraction, evaluation, code review) · **evaluation prompts and rubrics** · RAG configuration recipes · agent design patterns · model selection guidance with cost/latency trade-offs · safety and guardrail patterns.
Each entry: purpose · the pattern · a worked example · when it fails · variations · copy button · version stamp.
**Must be aggressively maintained** — a stale prompt library is worse than none, because it actively signals the platform is not current.

### N10 — Knowledge Changelog `[MVP]` ★ differentiator
A public, reverse-chronological feed of what changed in the Body of Practice: node, version, what changed, why, who reviewed, date. Filterable by domain. Subscribable.
**This page is the proof of D2.** No incumbent has one; it costs little to build and it makes "living knowledge" verifiable rather than assertable. It also feeds the renewal currency assessment (`K12`).

---

# 11. COMMUNITY

> # ⊘ RETIRED AS A CORE MODEL — DR-02
>
> **Chapters, the contribution ladder, and a federated community structure are not part of this organisation's model.** They are association machinery. `M01`–`M09` are **not** MVP, **not** the strategic destination, and — critically — **no longer the mechanism for assessor supply**, which DR-02 §7.2 records as a **high-priority tracked strategic issue requiring a dedicated future decision**. It is deliberately unsolved here, and must not be answered by quietly restoring this section.
>
> **What may still emerge, organically:** a cohort-private group during a programme, and programme alumni afterwards. Both arise **from** real delivery. Neither may be assumed as a dependency for MVP viability, and neither justifies building community infrastructure in advance.
>
> **Community is not prohibited — it is simply not the model.** The cold-start analysis in §11.6 remains sound and should be read by anyone who ever proposes community features.

**Design stance: lightweight but scalable.** The failure mode is a graveyard — an over-built community with empty rooms, which damages trust more than having no community at all. Therefore: **launch few spaces, launch late, seed heavily, guarantee responses.**

**Sequencing rule:** do not launch community before the first cohort exists. Ship it *with* cohort one, so there are real people in it on day one.

---

### M01 — Community Home `[P2]`
A single unified feed rather than a directory of empty rooms: recent discussions, upcoming events, new member introductions, expert contributions, chapter activity. Right rail: my groups, my chapters, contribution status, "answer a question" prompt.

### M02 / M03 — Chapters `[P2]`
Directory with map and list; filter by region and language; status tier chip (**Forming / Active / Established**) with published criteria — visible tiers drive quality without central control.
Chapter page: about, leads, upcoming and past events, members, join, contact, co-branded header.

### M04 / M05 — Events `[P2]`
Calendar and list views; filter by type (webinar, meetup, workshop, study session, office hours), region, domain, format. Event detail: description, speakers, agenda, date/time in local timezone, capacity and waitlist, registration, calendar sync, join link, recording after, **CPD credit indicator**, feedback form.

### M06 — Discussions `[P2]`
Structured spaces: five **domain circles** (one per domain), Certification support, Career, Show your work. Threads with accepted answers, code and diagram support, tagging by skill node, and a **link-to-knowledge action** so good answers can be promoted into the Body of Practice (closing the content-improvement loop).
**Non-negotiable:** a guaranteed first-response SLA in year one, staffed by instructors and staff. Nothing kills a community faster than an unanswered question.

### M07 — My Community Feed `[P2]`
Personalised: replies to me, my groups, my chapters, questions matching my skills (a gentle contribution nudge), upcoming events I'm registered for.

### M08 — Member Profile `[MVP thin / P2 full]`
Public professional profile — the community's core object and a genuine reason to keep the account.
Sections: name, photo, headline, location, languages · **verified credentials with badges** · skills with proficiency and evidence · public portfolio artifacts (opt-in) · contributions (answers, talks, articles, mentoring) · contribution ladder status · chapters · contact/connect (privacy-controlled).
Privacy: granular per-section visibility (public / members / private).

### M09 — Contribution Centre `[P2]`
The supply engine made visible. Routes: speak · write · mentor · **assess**.
Each shows criteria, what you get (CPD weighting — highest for contribution, fee waivers, revenue share, standing, profile markers), and an application flow. Shows the user's current ladder position and the next step.
**Assessor recruitment is the binding constraint on the entire credential model** — give it the most prominent placement here.

---

# 12. AI-FIRST FEATURES

> # ⏸ DEFERRED — DR-02, Decision 2
>
> **V1 ships no learner-facing AI feature.** `AI-1` the AI Learning Assistant and `L14` are deferred; the rationale — *"learners get stuck at 11pm with nobody to ask"* — describes an isolated self-paced learner, and under expert-led delivery the participant has an expert, a cohort and a scheduled session.
>
> **Nothing replaces it.** Do not restore it as a signature feature, do not substitute another AI capability, and do not add AI to the interface because AI is one of our subject domains:
>
> ```
>          AI is something we teach
>                    ≠
>     AI must dominate the product experience
> ```
>
> **Retained without change:** the AI *governance* surfaces in §12.4 that are not features — the **AI-use policy chip on every assessment** (`Restricted` for the exam, `Disclosed` for the artifact) and the **AI-use disclosure field** as a required artifact deliverable, whose critique is itself assessed. Those belong to assessment integrity, not to an AI product layer, and they stay.
>
> The rest of this section is the deferred specification, retained for the record.

**Governing rule.** Every AI feature must solve a named user problem. Features that exist to say "AI-powered" are excluded deliberately — restraint is itself a differentiator in 2026, when every competitor is adding an "Ask AI" button to everything.

**Three UI conventions applied to every AI surface:**
1. **Citations, always.** Substantive answers show their sources with version stamps. No citation, no answer.
2. **Explain the recommendation.** Every AI or algorithmic suggestion carries an expandable "why this", and is overridable.
3. **Disclose and label.** AI-generated or AI-assisted content is visibly labelled. AI-use policy is shown per assessment.

---

## 12.1 MVP AI features

| # | Feature | Problem solved | Where it appears | Guardrails the UI must show |
|---|---|---|---|---|
| **AI-1** | **AI Learning Assistant (tutor)** | Learners get stuck at 11pm with nobody to ask | `L14` full page + right-rail panel in `C05`, `N03` | Grounded in the Body of Practice only · citations with versions · **visibly disabled during assessments, with the reason shown** · "I don't have a sourced answer — ask the community" rather than confabulation |
| **AI-2** | **Adaptive diagnostic** | Fixed tests waste time and mis-measure | `P05` | Bounded length · transparent about what it measured · "I'm not sure" never penalised |
| **AI-3** | **Skill gap analysis** | Learners don't know what they're missing | `P06`, `L05` | Shows evidence behind every assertion · confidence and decay visible |
| **AI-4** | **Path recommendation** | Learners don't know what to learn or in what order | `P06`, `L04` | "Why this is here" on every item · fully overridable · shows what you can skip |
| **AI-5** | **Concept explainer** | One explanation doesn't fit everyone | Inline in `C05`, `N03` | Re-explains at a different altitude / with a different analogy / in another language, from the **same source node** so substance never drifts |
| **AI-6** | **Semantic search with answers** | Large corpora are unnavigable | `S09`, `N01` | Composed answer + citations; never an answer without a verifiable source |

**Why these six:** each directly serves a differentiator (D1/D2/D3) or the core conversion path. AI-1 and AI-6 are the ones learners feel daily. **One excellent AI feature beats five mediocre ones** — if scope must be cut, keep AI-1 and AI-3.

## 12.2 Phase 2 AI features

| # | Feature | Problem solved | Where |
|---|---|---|---|
| AI-7 | **AI Study Coach** | Life interrupts learning; plans break | `L04`, `L12` — spaced repetition, calendar-aware re-planning, forgiving re-entry ramps |
| AI-8 | **AI Quiz / Practice Generator** | Never enough practice items | `C10` — **formative only**; generated items never enter the credential-bearing bank without human calibration |
| AI-9 | **AI Artifact Coach** | The evidence gate is intimidating and candidates drop | `K06` — reviews a draft against the published rubric; coaches on structure and completeness; **explicitly refuses to write substance**; all interactions logged and disclosed to the assessor |
| AI-10 | **AI Pre-Assessment** | Assessor capacity is the binding constraint | `A03` — rubric-aligned draft scores with evidence citations and a confidence score; shown as a **collapsible suggestion, never pre-filled into the human's fields**; override rate tracked as the AI quality metric |
| AI-11 | **AI Feedback Drafting** | Writing feedback is the real bottleneck, not deciding a grade | `A03`, `I09` — composes feedback from the assessor's rubric selections; assessor edits and owns it |
| AI-12 | **Content Gap Detection** | We don't know what's missing | `X02` — clusters learner questions and assessment failures into a ranked authoring backlog |
| AI-13 | **Skills Narrative for Orgs** | A heatmap isn't an argument | `O01`, `O11` — turns the heatmap into a written executive summary with prioritised recommendations |
| AI-14 | **Cohort Risk Prediction** | Interventions come too late | `I01`, `O06` — flags likely non-completers early enough to act |
| AI-15 | **Role Profile Inference** | Defining target profiles is laborious | `O08` — proposes a target skill vector from uploaded job descriptions |

## 12.3 Future AI features

| # | Feature |
|---|---|
| AI-16 | **Simulation-based assessment** — a synthetic enterprise data estate the candidate operates on under constraint; the strongest possible capability evidence and effectively impossible to fake |
| AI-17 | **Continuous credentialing** — a live proficiency signal from ongoing micro-assessment and verified work evidence, replacing the periodic snapshot |
| AI-18 | **Conversational course authoring** — instructor describes a module; the system drafts outcomes, structure, and assessment items for human refinement |
| AI-19 | **Multilingual real-time delivery** — live session translation and localised content generation |
| AI-20 | **Employer capability matching** — match verified skill profiles to role requirements, with holder consent |

## 12.4 AI governance surfaces (we must model what we teach)

We are selling AI governance credentials; our own AI use will be scrutinised. These are product features, not compliance overhead:
- **`P04` public AI-use policy** in plain language.
- **AI-use policy chip** on every assessment (`Permitted` / `Disclosed` / `Restricted`).
- **Disclosure labels** on AI-assisted content.
- **AI-use disclosure field** as a required artifact deliverable, with the candidate's critique of the AI output itself assessed.
- **Assessor override rate** displayed in `A01` and `X01` as an AI quality metric.
- **Bias monitoring** in `X01` — assessment outcomes analysed for disparate impact, with AI override rates broken down by candidate first language (where bias most plausibly enters).

---

# 13. COMPLETE SCREEN INVENTORY

> **↻ RE-DERIVED (DR-02) — `MVP_BUILD_SPEC.md` §6 is authoritative for MVP scope and priorities.** The inventory below is retained as the long-term catalogue of screen concepts; its `[MVP]` tags are **superseded** wherever they conflict. Changes, by disposition:
>
> | Disposition | Screens |
> |---|---|
> | **⊘ Retired** | `P03` Capability Standard · `P11` Course Catalogue · `P12` Course Landing · `M01`–`M09` community and chapters · `P22` training partners · `P20`/`P21` contributor and instructor recruitment *(as association-shaped surfaces; genuine expert recruitment is a business process, not a portal feature at MVP)* |
> | **⏸ Deferred** | `L14` AI Learning Assistant · `C06` Video Content · `C07` Reading Material as separate screens · `C09` Labs |
> | **↻ Reframed** | `P10` → **Programme Detail** · `C01` → absorbed into `P10` · `C02` → **Programme Home** · `C05` → **Materials Viewer** (`P1`) · `L01` → led by the next session · `L02`/`L04` → programme participation · `P05`/`P06` → capability assessment resolving to a programme · `I06`/`I07` → the expert's delivery surfaces |
> | **➕ Added** | **`P23` Expert Profile** · **`P24` Scheduled Offerings** — both allocated beyond `P22`, per the binding never-reuse rule |
> | **↑ Promoted** | `P17` Corporate & Funding and `P19` Corporate Enquiry to `P0` — Journey B begins there |
> | **✅ Preserved unchanged** | The whole certification and assessment spine: `K01`–`K10`, `A01`–`A03`, `P15`, `P16`, `L05`, `L09` · knowledge library `N01`–`N10` · corporate `O01`–`O10` · auth and settings `S01`–`S10` · admin `X00` |
>
> **Net effect: fewer screens, not more.** The correction retires more than it adds — deliberately, and scope must not be allowed to grow simply because the strategy changed.

**133 screens total.** Scope tags mark the **product** phase a screen belongs to: `[MVP]` = MVP product scope (71) · `[P2]` = phase 2 (53) · `[FUT]` = future (9).

> **Note on two different "MVP" numbers.** The 71 screens tagged `[MVP]` here are what the MVP *product* eventually needs. §14.2 selects a **30-screen subset of those** to design first in the mockup — the smallest set that tells the complete ecosystem story. A screen can be MVP-product scope without being in the first mockup (e.g. `S04` email verification: needed to ship, pointless to design early).

## PUBLIC — 22 screens
| ID | Screen | Scope |
|---|---|---|
| P01 | Homepage | **MVP** |
| P02 | About the Academy | MVP |
| P03 | The Capability Standard | P2 |
| P04 | Credential Integrity & AI-Use Policy | MVP |
| P05 | Free Skill Diagnostic | **MVP** |
| P06 | Diagnostic Result | **MVP** |
| P07 | Learning Overview | MVP |
| P08 | Domain Landing (×5 variants) | MVP |
| P09 | Learning Paths Index | MVP |
| P10 | Learning Path Detail | **MVP** |
| P11 | Course Catalogue | **MVP** |
| P12 | Course Landing *(= C01)* | **MVP** |
| P13 | Data & AI Literacy | P2 |
| P14 | Certification Overview | **MVP** |
| P15 | Credential Detail | **MVP** |
| P16 | Public Credential Verification | **MVP** |
| P17 | Corporate Overview | **MVP** |
| P18 | Funding & HRD Corp Support | P2 |
| P19 | Contact / Book Capability Assessment | MVP |
| P20 | Become a Contributor | P2 |
| P21 | Become an Instructor | P2 |
| P22 | Become a Training Partner | P2 |

## SHARED / SYSTEM — 10 screens
| ID | Screen | Scope |
|---|---|---|
| S01 | Sign in | **MVP** |
| S02 | Create account | **MVP** |
| S03 | Onboarding wizard | **MVP** |
| S04 | Email verification | MVP |
| S05 | Notification centre | P2 |
| S06 | Profile settings | MVP |
| S07 | Billing | P2 |
| S08 | Settings & preferences | P2 |
| S09 | Global search results | P2 |
| S10 | Error & empty states | MVP |

## LEARNER PORTAL — 15 screens
| ID | Screen | Scope |
|---|---|---|
| L01 | Learner Dashboard | **MVP ★** |
| L02 | My Learning | **MVP** |
| L03 | My Learning Paths | P2 |
| L04 | My Path (milestone timeline) | **MVP ★** |
| L04b | Path Planner | P2 |
| L05 | Skills Profile & Gaps | **MVP ★** |
| L06 | Assessments Hub | MVP |
| L07 | Assignments Hub | MVP |
| L08 | Evidence Portfolio | P2 |
| L09 | My Credentials | **MVP** |
| L10 | Credential Detail | MVP |
| L11 | CPD & Renewal | P2 |
| L12 | Calendar & Sessions | P2 |
| L13 | Learning History & Transcript | P2 |
| L14 | AI Learning Assistant | **MVP ★** |

## COURSE EXPERIENCE — 12 screens
| ID | Screen | Scope |
|---|---|---|
| C01 | Course Landing *(= P12)* | **MVP** |
| C02 | Course Home (enrolled) | **MVP** |
| C03 | Curriculum View | MVP |
| C04 | Module View | MVP |
| C05 | Lesson Player | **MVP ★** |
| C06 | Video Content *(state of C05)* | MVP |
| C07 | Reading Material *(state of C05)* | MVP |
| C08 | Downloadable Resources | MVP |
| C09 | Practical Exercises / Labs | P2 |
| C10 | Quiz / Knowledge Check | **MVP** |
| C11 | In-Course Assignment | P2 |
| C12 | Course Completion | MVP |

## CERTIFICATION — 14 screens
| ID | Screen | Scope |
|---|---|---|
| K01 | Certification Journeys / Candidacy Tracker | **MVP ★** |
| K02 | Readiness Check | **MVP** |
| K03 | Register as Candidate | MVP |
| K04 | Prepare | P2 |
| K05a | Assessment Pre-flight | MVP |
| K05b | Assessment Runner | **MVP ★** |
| K05c | Assessment Submitted | MVP |
| K06 | Artifact Brief & Workspace | **MVP ★★** |
| K07 | Submission Confirmation / Under Review | **MVP** |
| K08 | Result & Feedback | **MVP ★** |
| K09 | Defence Session | FUT |
| K10 | Credential Awarded | **MVP** |
| K11 | Appeals | P2 |
| K12 | Renewal & Currency | FUT |

## KNOWLEDGE LIBRARY — 10 screens
| ID | Screen | Scope |
|---|---|---|
| N01 | Knowledge Library Home | MVP |
| N02 | Domain Index | P2 |
| N03 | Knowledge Article (Node) | **MVP ★** |
| N04 | Glossary Index | P2 |
| N05 | Term Page | P2 |
| N06 | Frameworks & Patterns | P2 |
| N07 | Templates & Canvases | P2 |
| N08 | Case Studies | P2 |
| N09 | Prompt & AI Resource Library | P2 |
| N10 | Knowledge Changelog | **MVP** |

## COMMUNITY — 9 screens
| ID | Screen | Scope |
|---|---|---|
| M01 | Community Home | P2 |
| M02 | Chapter Directory & Map | P2 |
| M03 | Chapter Page | P2 |
| M04 | Events Calendar | P2 |
| M05 | Event Detail | P2 |
| M06 | Discussions | P2 |
| M07 | My Community Feed | P2 |
| M08 | Member Profile | MVP thin |
| M09 | Contribution Centre | P2 |

## INSTRUCTOR — 11 screens
| ID | Screen | Scope |
|---|---|---|
| I01 | Instructor Dashboard | **MVP** |
| I02 | My Courses | P2 |
| I03 | Course Builder | P2 |
| I04 | Lesson Editor | P2 |
| I05 | Cohorts | MVP |
| I06 | Cohort Detail (roster & progress) | **MVP** |
| I07 | Live Session Console + Attendance | **MVP** |
| I08 | Marking Queue | MVP |
| I09 | Mark a Submission | P2 |
| I10 | Analytics | P2 |
| I11 | Earnings & Payouts | FUT |

## ASSESSOR — 6 screens
| ID | Screen | Scope |
|---|---|---|
| A01 | Assessor Dashboard | MVP |
| A02 | Assessment Queue | MVP |
| A03 | Assessment Review Workbench | **MVP ★** |
| A04 | Defence Session Console | FUT |
| A05 | Calibration & Agreement | P2 |
| A06 | Appeals & Escalations | FUT |

## CORPORATE — 12 screens
| ID | Screen | Scope |
|---|---|---|
| O01 | Corporate Dashboard | **MVP ★** |
| O02 | People & Seats | **MVP** |
| O03 | Individual Learner View | MVP |
| O04 | Teams | P2 |
| O05 | Programmes & Assignments | **MVP** |
| O06 | Cohorts | MVP |
| O07 | Cohort Detail + Attendance Grid | **MVP** |
| O08 | Skills Heatmap & Gap Analysis | **MVP ★** |
| O09 | Certification Status Board | P2 |
| O10 | Compliance & HRD Corp Documentation | **MVP ★** |
| O11 | Reports & Exports | P2 |
| O12 | Org Settings | P2 |

## PLATFORM ADMIN — 12 screens
| ID | Screen | Scope |
|---|---|---|
| X01 | Platform Dashboard | P2 |
| X02 | Content Lifecycle & Publishing | P2 |
| X03 | Skill Graph Editor | P2 |
| X04 | Knowledge Base & Versioning | P2 |
| X05 | Credential Definitions & Rules | P2 |
| X06 | Item Bank & Psychometrics | P2 |
| X07 | Users & Roles | P2 |
| X08 | Organisations | P2 |
| X09 | Partners & Accreditation | FUT |
| X10 | Integrity Cases & Revocation | FUT |
| X11 | Community Moderation | FUT |
| X12 | Finance, Refunds & Payouts | FUT |

---

# 14. MVP MOCKUP SCOPE

> **↻ RE-DERIVED (DR-02) — and the scope does not grow.** `MVP_BUILD_SPEC.md` §7 is authoritative: **16 screens**, one more than before, because the lesson player leaves and programme detail plus scheduled offerings arrive.
>
> **What the prototype must now prove**, unprompted and without narration: *this is expert-led professional training, delivered live by named practitioners on real dates, with a credential that has to be earned.* If a viewer comes away thinking "online course platform", the prototype has failed regardless of how good it looks.
>
> **Changes to the 30-screen mockup set:** `C05` Lesson Player and `L14` AI Tutor **out** · `P10` Programme Detail and `P24` Scheduled Offerings **in** · `P11` Catalogue and `P12` Course Landing **out** · `P17`/`P19` corporate pathway **in** · the certification spine (`K05b`, `K06`, `K08`, `K10`, `A03`, `P15`, `P16`) and the corporate story (`O01`, `O10`) **unchanged**.
>
> **Discipline:** add only screens the corrected `MVP_BUILD_SPEC.md` already justifies. **Do not begin implementing any of them** — this document specifies; it does not authorise.

## 14.1 Selection principle

The first mockup must **demonstrate the complete ecosystem, not the complete feature set**. It has to prove to a viewer — an investor, a corporate buyer, a design partner, a developer — that this is a coherent professional **training and certification** organisation and not a course marketplace.

Selection test applied to every screen: *does removing this screen make the ecosystem story incomplete?* If a screen is merely useful, it waits.

**Deliberate consequence:** we include the corporate dashboard, the assessor workbench, and the artifact workspace — screens most MVPs defer — because **without them the differentiator is invisible.** We defer community, labs, CPD, and most of admin, because their absence does not break the story.

## 14.2 MVP Mockup — 30 screens

> **⚠ The Act lists below are the PRE-CORRECTION set and are NOT the current mockup scope.** `MVP_BUILD_SPEC.md` §7 is authoritative — **16 screens**, re-derived by `DR-02`.
>
> **A screen appearing in an Act list below is not thereby active.** Several are retired or deferred, and the lists were deliberately left unedited so the change remains traceable. Before treating any screen here as in scope, check it against §13's disposition table and `MVP_BUILD_SPEC.md` §7. In particular: **`P11` Course Catalogue and `P12`/`C01` Course Landing are ⊘ RETIRED** (see §4), and **`C05` Lesson Player and `L14` AI Tutor have left the mockup set**. `P10` Programme Detail and `P24` Scheduled Offerings replace them.

Grouped by the ecosystem story they tell.

**Act 1 — Discovery & the promise (6)** *(pre-correction — contains retired screens; see the notice above)*
`P01` Homepage · `P05` Diagnostic · `P06` Diagnostic Result · `P11` Course Catalogue · `P10` Path Detail · `P12/C01` Course Landing

**Act 2 — Learning (6)**
`S02` Create Account · `S03` Onboarding · `L01` Learner Dashboard ★ · `L04` My Path ★ · `C02` Course Home · `C05` Lesson Player ★

**Act 3 — Capability made visible (3)**
`L05` Skills Profile ★ · `C10` Knowledge Check · `L14` AI Learning Assistant ★

**Act 4 — Proving it (7) — the differentiator**
`P14` Certification Overview · `P15` Credential Detail · `K01` Candidacy Tracker ★ · `K02` Readiness Check · `K05b` Assessment Runner ★ · `K06` Artifact Workspace ★★ · `K08` Result & Feedback ★

**Act 5 — The credential lives in the world (2)**
`K10` Credential Awarded · `P16` Public Verification

**Act 6 — The other sides of the ecosystem (6)**
`A03` Assessor Review Workbench ★ · `O01` Corporate Dashboard ★ · `O08` Skills Heatmap ★ · `O10` HRD Corp Compliance ★ · `I06` Cohort Detail · `N03` Knowledge Article ★

> **The eight most important screens**, if the budget allows only eight: `P01`, `P06`, `L01`, `C05`, `K06`, `K08`, `O01`, `P16`. These alone tell the whole story: *we find your gap → you learn → you prove it by doing → someone qualified judges it → an employer can verify it → and an organisation can manage it at scale.*

## 14.3 Phase 2 — 53 screens
Everything needed to actually operate at scale: full community (M01–M09) · full instructor authoring (I02–I04, I08–I10) · corporate depth (O04, O09, O11, O12) · knowledge library breadth (N02, N04–N09) · CPD, portfolio, calendar, transcript (L03, L04b, L08, L11–L13) · labs and in-course assignments (C09, C11) · candidate preparation and appeals (K04, K11) · assessor calibration (A05) · public supply-side pages (P03, P13, P18, P20–P22) · most of platform admin (X01–X08) · account and settings depth (S05, S07–S09).

## 14.4 Future — 9 screens in the inventory, plus unbuilt concepts
Defence sessions (K09, A04) · renewal & currency (K12) · appeals workbench (A06) · instructor earnings (I11) · partner accreditation (X09) · integrity casework (X10) · moderation (X11) · finance (X12) · simulation assessment · continuous credentialing · employer matching · mobile apps · LTI/academic console.

## 14.5 Explicitly NOT in the first mockup — and why

| Excluded | Why |
|---|---|
| Community forums, chapters, events | An empty community damages a trust product. Launch it *with* cohort one, not before. |
| Full course authoring studio | Authoring can be done by structured forms or by the team directly for the first courses. Building a WYSIWYG studio before you have 10 courses is premature. |
| Labs / sandboxes | Highest build cost per screen; not needed to prove the model. |
| CPD, renewal, appeals | Nobody needs renewal in year one. Do not design a screen no user will open for 36 months. |
| SSO, SCIM, HRIS | Enterprise gates, not mockup material. |
| Most of platform admin | Internal-only; can be operated from a basic CRUD interface initially. |
| Mobile apps | Responsive web first. A native app before product-market fit is a distraction. |
| Localisation | Design must be *localisation-ready* (externalised strings, RTL-capable components), but the mockup ships English only. |
| Instructor earnings / payouts | Meaningless until there is a second instructor. |

---

# 15. NAVIGATION DESIGN

## 15.1 Principle

**Public navigation persuades; authenticated navigation gets work done.** These are different jobs and must be different systems. The most common mistake in platforms like this is bolting the app onto the marketing header, producing a nav that serves neither.

**Second principle:** role does not create new top-level items. A user with five roles still sees one clean nav plus a **workspace switcher**.

## 15.2 Primary navigation — public

Six items maximum, **intent-led** (what am I trying to do), not content-type-led.

> **↻ REFRAMED (DR-02).** The **intent-led principle stands** — it is one of the better ideas in this document. Its *contents* change: **Community is retired** as a destination; **Learn** becomes programme discovery rather than a catalogue and mega-menu of domains; the header CTA is no longer the diagnostic, because the primary pathway is now **explore upcoming programmes** (`MVP_BUILD_SPEC.md` §6, and the `P01` brief in §4).
>
> **The single-CTA rule survives and should be defended** — competing calls to action reduce total conversion, and that was true before the correction and remains true after it. **Which** CTA leads is deliberately left open for the Homepage redesign.

```
[ logo ]   Learn   Get Certified   For Organisations   Knowledge   Community   About
                                         [ 🔍 ]  [ Sign in ]  [ Start free diagnostic ]
```
*(⊘ The nav bar above is superseded — retained to show what changed.)*

| Item | Intent | Mega-menu contents |
|---|---|---|
| **Learn** | I want to build skill | 5 domains · Learning paths · Full catalogue · Literacy · *Not sure? Take the diagnostic* |
| **Get Certified** | I want to prove skill | The ladder (L1–L4) · How it works · Credentials by domain · Exams & fees · **Verify a credential** |
| **For Organisations** | I'm buying for a team | Corporate training · Academic partnerships · Funding & HRD Corp · Case studies · Book a capability assessment |
| **Knowledge** | I want to understand something now | By domain · Glossary · Frameworks · Templates · Prompt library · **Changelog** |
| **Community** | I want to belong | Chapters · Events · Discussions · Mentoring · Become a contributor |
| **About** | Can I trust you | The standard · Integrity & AI policy · Instructors · Partners · Governance |

**Persistent elements:** region/language selector (slim top bar) · global search · Sign in · one primary CTA. **Only one CTA in the header, ever** — competing CTAs reduce total conversion.

## 15.3 Primary navigation — authenticated (learner)

Persistent **left sidebar**, collapsible to icons. Ordered by frequency of use, not by org chart.

```
┌──────────────────┐
│ ⌂  Dashboard     │   ← default landing
│ ▤  My Learning   │
│ ◈  My Path       │
│ ◎  Skills        │
│ ✓  Assessments   │
│ ⬢  Credentials   │
│ ──────────────── │
│ ⌕  Knowledge     │
│ ☺  Community     │
│ ▤  Calendar      │
│ ──────────────── │
│ ✨ AI Tutor      │   ← toggles right panel, not a page nav
└──────────────────┘
```

**Top bar (authenticated):** global search · AI tutor toggle · notifications · avatar menu (Profile · Billing · Settings · **Switch workspace** · Sign out).

## 15.4 Workspace switcher

The mechanism that keeps multi-role users sane. Lives in the avatar menu and, when more than one workspace exists, as a compact switcher at the top of the sidebar.

```
SWITCH WORKSPACE
 ● Learning            (always present)
 ○ Instructor Studio   (if R6)
 ○ Assessor Workbench  (if R7)
 ○ Acme Bank           (if R9/R10 — org name, not "Corporate")
 ○ Platform Admin      (if R14)
```
Each workspace has its **own sidebar**, its own accent treatment in the header (a subtle top border colour), and its own notification scope — so a user always knows which hat they are wearing. Never duplicate learner items inside a role workspace.

## 15.5 Secondary navigation

Contextual, appearing inside a section — never in the global chrome.

| Context | Pattern |
|---|---|
| Course | Left curriculum rail (`C05`), collapsible |
| Catalogue | Left filter rail / mobile filter sheet |
| Corporate portal | Its own left nav (Dashboard · People · Teams · Programmes · Cohorts · Skills · Certifications · Compliance · Reports · Settings) |
| Settings | Left sub-nav |
| Knowledge article | Right "on this page" anchor rail |
| Multi-state hubs | Tabs (`L02` In progress / Not started / Completed) |
| Credential journey | The **candidacy stage tracker** — a persistent horizontal progress element, not a nav |

## 15.6 Sidebar behaviour
Expanded ~240px, collapsed ~64px icons-only with tooltips. State persists per user. Auto-collapses below 1280px. Hidden entirely in focus modes: lesson player (optional), assessment runner (always), diagnostic (always). Active state on the item; nested items only one level deep — deeper nesting means the IA is wrong.

## 15.7 Mobile navigation

**Bottom tab bar — 5 items maximum** (thumb-reachable, the only nav most learners will use):
```
   ⌂          ▤          ◈         ⬢         ☰
Dashboard  Learning    Path    Credentials  More
```
`More` opens a sheet with Skills, Assessments, Knowledge, Community, Calendar, Profile, Settings.

**Mobile-specific rules:**
- **Lesson player:** full-bleed video, curriculum in a bottom sheet, AI tutor in a full-screen sheet.
- **Assessment runner:** full-screen focus, one question per screen, large touch targets (48px minimum), sticky next/previous.
- **Artifact workspace:** functional but honest — show a "this is easier on a desktop" note. Do not pretend a 6-inch screen is a good place to produce professional evidence.
- **Corporate dashboards & heatmaps:** desktop-first. On mobile, show summary tiles and a "view full heatmap on desktop" affordance rather than an unusable pinch-zoom matrix.
- **Public site:** hamburger → full-screen menu with the six intent items as large touch targets; the diagnostic CTA stays visible in a sticky footer bar.

**Mobile philosophy:** *consume and check on mobile; produce on desktop.* Learners read, watch, do knowledge checks, check progress, and view credentials on phones. They author, submit evidence, grade, and analyse on desktop. Design honestly for both rather than badly for one.

---

# 16. DESIGN DIRECTION

## 16.1 Design philosophy — "Precision, not decoration"

The visual language draws on the **technical drawing / architectural blueprint** tradition: measured, annotated, precise, confident, and quietly beautiful because everything on the page is load-bearing. It is an original direction that ties directly to the product's own heritage — *The Data Blueprint* — and it solves a real positioning problem.

**The positioning problem:** two aesthetics dominate this space and both are wrong for us.
- **Legacy certification bodies** look institutional, dated, and bureaucratic — trustworthy but not credible on AI.
- **AI startups** look like neon gradients, glowing orbs, and dark-mode marketing — current but not trustworthy enough to certify anyone.

We need the intersection: **the credibility of a standards body with the clarity of a modern software product.** Precision-drawing is that intersection.

**Character keywords:** precise · clear · confident · warm · substantive · **human** · **expert-led**.
**Anti-keywords:** playful · corporate-generic · futuristic · gamified · glossy · **marketplace-generic**.

> **✅ PRESERVED (DR-02) — §16 survives the correction almost intact**, and that is a genuine finding rather than a courtesy. "Precision, not decoration" already resolves toward premium, credible and professional, and the existing anti-keywords already exclude the marketplace aesthetic. **Two keywords are added** — *human* and *expert-led* — because the design must now carry people, not only systems. The visual direction itself is **not** decided here; that belongs to the dedicated Homepage redesign exercise.

**What this means concretely:**
- Hairline rules and measured spacing instead of heavy shadows and cards-on-cards.
- Annotation-style labels — small caps, letterspaced, quiet — where a lesser design would use a coloured pill.
- Monospace for anything measured: scores, versions, IDs, metrics, timestamps. Data reads as data.
- Generous whitespace as a *confidence signal* — a page that isn't fighting for attention.
- Warm neutral ground rather than clinical white, so long reading sessions stay comfortable.

## 16.2 Layout principles

1. **Content max 1280px; reading measure 640–720px.** Long-form reading is a core use case, not an afterthought.
2. **8px base grid**, 4px for fine adjustment. Everything aligns; nothing is "about right".
3. **Two-rail maximum.** Left navigation/context + main + optional right rail. Never three rails plus a drawer.
4. **Vertical rhythm.** Consistent section spacing so scanning is effortless.
5. **One primary action per screen.** Visually unambiguous. If two things compete, one of them is secondary.
6. **Progressive disclosure by default.** Depth on demand, not depth by default.
7. **Focus modes.** Assessment, diagnostic, and (optionally) lesson strip all chrome. The interface gets out of the way when the stakes are high.

## 16.3 Card system

Three card types only. More than three and the system stops communicating hierarchy.

| Type | Treatment | Used for |
|---|---|---|
| **Plate** | 1px hairline border, subtle radius (8px), no shadow, flat ground | Default: course cards, list items, dashboard widgets |
| **Panel** | Filled with a slightly raised surface tone, hairline border, 12px radius | Grouped content: dashboard sections, rubric panel, AI tutor |
| **Feature** | Larger radius (16px), accent border or tinted ground, generous padding | The single most important element on a screen: Continue card, credential award |

**Rules:** never nest a card inside a card of the same type · shadows only for genuinely floating elements (modals, popovers, dropdowns) · hover states use border-colour and subtle ground change, never lift-and-shadow · the "Feature" treatment appears **at most once per screen**.

**Signature component — the CredentialCard.** The most important visual object on the platform. It should look like a certificate document, not a gamified badge sticker: precise border treatment, monospace credential ID, issue/expiry dates set like a legal instrument, the domain and level clearly stated, a verification seal mark, and restrained use of the accent colour. It must look equally correct at 400px in a dashboard grid and at 1200px on a verification page.

## 16.4 Dashboard style

- **Hierarchy over density.** One dominant element, then supporting widgets. Never a uniform grid of equal tiles — that forces the user to do the prioritisation the design should have done.
- **Numbers are typographic.** Large monospace figures with quiet labels. A metric plus a delta plus a comparison baseline; never a naked number.
- **Every metric earns its place** by either reassuring or offering an action.
- **Charts are restrained:** thin strokes, no gradients, no 3D, no drop shadows, direct labelling instead of legends wherever possible.
- **Widgets are Plate or Panel cards** with a small-caps annotation header and an optional action link on the right.
- **Empty and loading states are designed**, not spinners — say what will appear here and how to make it appear.

## 16.5 Typography direction

Two families plus one mono. Do not exceed three.

| Role | Direction | Notes |
|---|---|---|
| **Display / headings** | A precise, slightly condensed grotesque with real character | Gives the brand a voice; used at large sizes only |
| **UI / body** | A highly legible humanist or neo-grotesque sans, large x-height | The workhorse; must be excellent at 16px |
| **Data / mono** | A clear monospace | Scores, versions, IDs, metrics, code, timestamps — the "measured" voice of the design |

**Non-negotiable settings:** body ≥16px · line-height ≥1.6 for body, 1.2–1.3 for display · measure 65–75 characters · tabular figures for all metrics (columns must align) · **small-caps letterspaced labels as the signature annotation style** · a defined scale with named roles (display-lg, display, h1–h4, body-lg, body, body-sm, label, mono) rather than arbitrary sizes.

## 16.6 Colour direction

**Palette structure — neutral-dominant. 85%+ of every screen is neutral; colour carries meaning only.**

| Token group | Direction |
|---|---|
| **Ground** | Warm off-white (light) / deep desaturated ink (dark). Never pure #FFF or #000 — both fatigue the eye in long sessions |
| **Ink** | A near-black with a slight blue-grey cast; 3–4 steps for hierarchy |
| **Line** | Hairline rules and borders; 2–3 steps. **This is a primary design element, not an afterthought** |
| **Primary** | A deep, serious blue-teal. Actions, links, active states, brand presence. Reads as trust and precision without being a cliché |
| **Accent** | A warm ember/amber. **Reserved almost entirely for credential and achievement moments** — its scarcity is what makes the award moment feel significant |
| **Semantic** | Success / warning / danger / info — muted, never fluorescent |
| **Proficiency scale** | A dedicated 5-step sequential scale used on *every* skill visualisation platform-wide. Must be perceptually ordered and colour-blind safe |

**Rules:**
- **Never colour alone.** Heatmap cells carry numeric values; status chips carry text; charts use direct labels. Required for accessibility *and* for the printed board decks corporate buyers produce.
- **Full light and dark themes, both first-class.** Learners read for hours.
- The proficiency scale is a **separate token family** from the semantic palette — low proficiency is not an error state, and colouring it red is both wrong and demoralising.

## 16.7 Visual hierarchy

Established in this order of preference: **size → weight → colour → position → ornament.** Reach for ornament last.

Per-screen hierarchy discipline: exactly one primary action · one dominant content element · supporting elements clearly subordinate · metadata quiet (small, low-contrast, small-caps) · destructive actions never visually prominent.

**Hierarchy in practice:**
- `L01`: Continue card dominates; everything else is clearly secondary.
- `K06`: the brief and workspace dominate; the rubric panel is persistent but visually quieter.
- `O01`: the uplift chart is the hero, because it is the renewal argument.
- `P16`: the verification seal and status dominate; everything else supports.

## 16.8 AI & data visualisation language

**AI surfaces** get a consistent, restrained visual signature so users always know when they are talking to a model:
- A distinct but quiet surface treatment (subtle tinted ground, not a glow).
- A **source citation block** under every substantive answer — small, monospace reference IDs with version stamps. This *is* the AI visual identity: **citations, not sparkles.**
- A "why this" disclosure affordance on every recommendation.
- Policy chips (`Permitted` / `Disclosed` / `Restricted`) as small-caps annotation labels.
- **No** glowing orbs, animated gradients, "thinking" brain imagery, or purple-to-pink gradients. In 2026 that visual language reads as unserious — precisely the wrong signal for a body that certifies AI competence.

**Data visualisation principles:**
- Thin strokes, generous whitespace, direct labelling over legends.
- The **skill radar** and **milestone timeline** are the two signature visualisations — invest real design effort in both; they carry the product's meaning.
- Heatmaps: value + colour, always.
- No pie charts. No 3D. No gradients on data.
- Every chart works in greyscale — test it.
- Charts are theme-aware SVG, not raster images.

## 16.9 Motion & imagery

**Motion:** functional only. 150–250ms, ease-out. Meaningful state changes, not decoration. Respect `prefers-reduced-motion` throughout.
**The one deliberate exception:** the credential award moment (`K10`) earns real, celebratory, choreographed motion. Scarcity is what makes it land.

**Imagery:** real people in real work contexts, regionally diverse (Southeast Asia, Middle East, and beyond — reflecting the actual audience). Diagrams over photographs wherever a diagram can carry the meaning. Original technical illustration in the blueprint idiom. **Banned:** stock photos of diverse people pointing at laptops, glowing brains, humanoid robots, binary-code backgrounds, and handshake imagery.

## 16.10 Accessibility as a design constraint
WCAG 2.2 AA minimum, verified per component. Keyboard-complete — the assessment runner and lesson player especially. Visible focus states designed, not browser-default. Captions and transcripts on all video. Colour never the sole carrier of meaning. Minimum 4.5:1 body contrast, 3:1 for large text and UI boundaries. Touch targets ≥44×44px. RTL support built into the component library from day one for Arabic, not retrofitted.

---

# 17. USER FLOWS

> **↻ REFRAMED (DR-02) — `MVP_BUILD_SPEC.md` §5 holds the two authoritative journeys.** The flows below describe the self-serve funnel and are superseded on their spine, though their **drop-off analysis remains valuable and should be carried forward**.
>
> **What changes.** Flow 1's `diagnostic → account → catalogue → enrol` becomes **programme → format and date → register**, with the capability assessment as an optional accelerator rather than the gateway. Flow 2's `lesson → knowledge check → module complete` is replaced by **participation in scheduled sessions**, supported by materials. Flow 5's authoring flow is reframed around programme and session design. Flow 3 (certification) and Flow 6 (assessor) **stand essentially unchanged** — they were always about evidence and judgement.
>
> **What survives and must not be lost:** the identification of the **evidence gate as the critical drop-off** (`⚑⚑` in Flow 3) with its mitigations — exemplars, the visible rubric, staged checkpoints, self-check — and the **re-entry ramp** principle for a stalled participant, which applies just as well to someone who misses a session as to one who abandons a lesson.
>
> **Deliberately not redesigned here.** These flows are marked, not rewritten; a full flow redesign belongs with the screens they describe.

Notation: `→` next step · `⟨ ⟩` decision · `[ID]` screen · `↺` loop back · `⚑` critical drop-off point.

---

## Flow 1 — Visitor → Register → Explore → Enrol `[MVP]`

```
Entry (search / badge / referral / ad)
  │
  ├─▶ Knowledge article [N03] ──┐   (most common real entry — not the homepage)
  ├─▶ Credential verify [P16] ──┤
  └─▶ Homepage [P01] ───────────┤
                                ▼
                     ⟨ which door? ⟩
       ┌────────────────┬───────────────┬────────────────┐
       ▼                ▼               ▼                │
  Build career    Train a team     Teach/partner         │
       │                │               │                │
       │           [P17] → [P19]   [P21]/[P22]           │
       ▼                                                 │
  Start diagnostic [P05]  ◀────────────────────────────────
       │
       │  ⚑ DROP-OFF 1: abandons mid-diagnostic
       │     mitigation → value-drop insight cards every ~5 questions,
       │                  honest progress count, save & resume
       ▼
  Partial result shown (anonymous)
       │
       │  ⚑ DROP-OFF 2: won't create an account
       │     mitigation → show real partial value first; the ask is a
       │                  fair trade, not a paywall; social sign-in
       ▼
  Create account [S02] → Verify email [S04] → Onboarding [S03]
       │                                        │
       │                                        ├─ goal & target role
       │                                        ├─ weekly time budget
       │                                        └─ target date
       ▼
  Full diagnostic result [P06]
       │
       ├─▶ Explore path [P10] ─┬─▶ Course landing [P12/C01]
       │                        └─▶ Catalogue [P11] ↺
       ▼
  ⟨ enrol? ⟩ ── no ──▶ Free tier: first module + knowledge library
       │                        (nurture sequence; re-engage on new content)
      yes
       ▼
  Checkout ─ ⟨ funding? ⟩ ─ yes ─▶ Corporate/HRD Corp route [P18] → [P19]
       │
       ▼
  Enrolled → Dashboard [L01] → first lesson within 24h  ← ⊘ RETIRED metric (see below)
```

**~~Success metric:~~ ⊘ RETIRED (DR-02) — no longer authoritative.** *"First lesson started within 24 hours"* measured activation into a self-paced product that is no longer being built, and it is one of the funnel metrics `MVP_BUILD_SPEC.md` §12.3 explicitly retires — alongside diagnostic→account conversion and path completion. **Do not use it, cite it, or instrument it.** `MVP_BUILD_SPEC.md` §12.3 is authoritative for success metrics; **no replacement metric is introduced here.**

---

## Flow 2 — Learner → Complete Course → Take Assessment `[MVP]`

```
Dashboard [L01] ──▶ Continue card ──▶ Lesson player [C05]
       │
       ▼
  Consume lesson ──▶ Mark complete ──▶ ⟨ end of module? ⟩
       │                                     │
       │  ↺ next lesson                     yes
       │                                     ▼
       │                          Knowledge check [C10]
       │                                     │
       │                          ⟨ score ⟩  ├─ low ─▶ explanations shown
       │                                     │         → targeted review ↺
       │                                     └─ ok ──▶ skill graph updated
       │                                                (low weight)
       ▼
  ⚑ DROP-OFF: learner stalls (no activity vs own declared pace)
     detection → N days silent
     response  → RE-ENTRY RAMP on [L01]:
                 5-min recap + a shortened next step
                 NEVER a guilt message; never a streak-broken shame state
       │
       ▼
  Module complete ──▶ ↺ next module ──▶ Course complete [C12]
       │
       ├─ capability statements ("you can now…")
       ├─ skills gained (graph deltas)
       ├─ course certificate  ← visually DISTINCT from a credential
       └─ next step surfaced immediately
       ▼
  ⟨ path complete? ⟩ ── no ──▶ next course ↺
       │
      yes
       ▼
  "You're ready to attempt the credential" ──▶ Readiness check [K02]
```

---

## Flow 3 — Learner → Certification → Submit Artifact `[MVP]` ★ the flagship

```
Trigger: path complete · dashboard prompt · employer requirement · [P15]
       │
       ▼
  Credential detail [P15]
       │  reads: requirements · rubric · exemplars · fees · timeline
       ▼
  Readiness check [K02] ──▶ readiness % + named gaps
       │
       ├─ not ready ─▶ recommended gap-closing modules ─▶ [L04] ↺
       │
       ▼ ready
  Register as candidate [K03]
       │  choose level → confirm eligibility → accept integrity
       │  undertaking + code of ethics → review AI policy → pay
       ▼
  Candidacy created → Stage tracker live on [K01] and [L01]
       │
       ├──▶ PREPARE [K04]: practice exam (separate pool) · exemplars · rubric
       │
       ▼
  KNOWLEDGE ASSESSMENT
  Pre-flight [K05a] ── system check · ID verify · rules · AI policy: RESTRICTED
       │
       ▼
  Runner [K05b] ── 100 items · 90 min · proctored · calm timer · autosave
       │
       ▼
  Submitted [K05c] → result
       │   ── V1 (DR-01): ONE threshold, no bands ──
       ├─ < 70%      ─▶ score + per-skill gap report → remediation → retake ↺
       └─ ≥ 70%      ─▶ knowledge requirement met ✔ → proceed to the artifact
       │   ── Phase 2+, once the ladder exists: banded placement ──
       │      60–69 Foundation · 70–74 Practitioner · ≥75 Professional
       │
       ▼
  EVIDENCE GATE  ⚑⚑ THE CRITICAL DROP-OFF POINT OF THE ENTIRE PRODUCT
       │
       │  Why people drop: "produce professional evidence" is vague and
       │  frightening; they don't know what good looks like.
       │
       │  Mitigations, all in [K06]:
       │   • parameterised brief variant (specific, concrete, theirs)
       │   • deliverable checklist with live state
       │   • rubric permanently visible, never behind a link
       │   • EXEMPLARS at Competent/Proficient/Distinguished  ← highest impact
       │   • staged checkpoints (outline → draft → final)
       │   • AI artifact coach on structure (never substance) [P2]
       │   • self-check against rubric before submitting
       │   • autosave, always visible
       ▼
  Artifact workspace [K06] ──▶ self-check ──▶ Submit
       │
       ▼
  Under review [K07] ── SLA countdown live: "day 3 of 10 working days"
       │
       ▼
  ▸ AI pre-assessment (draft, non-decisive) [P2]
  ▸ Assessor review [A03] ── blind-assigned · rubric · written reasoning
  ▸ Defence [K09] (L3/L4 only) [FUT]
  ▸ Moderation sample (10% blind second-marked)
       │
       ▼
  Result [K08]
       │
       ├─ NOT YET ─▶ rubric with reasoning · specific remediation plan
       │             · 1 free resubmission within 90 days · appeal route
       │             ── never the word "failed" ──  ↺ back to [K06]
       │
       └─ AWARDED ─▶ [K10] Credential Awarded (full-screen moment)
                        │
                        ├─ badge minted (Open Badges 3.0 / W3C VC)
                        ├─ public verification page live [P16]
                        ├─ share to LinkedIn (pre-composed)
                        ├─ skills profile updated [L05]
                        └─ unlocks: next level · assessor eligibility ·
                                    directory listing
```

---

## Flow 4 — Corporate Admin → Add Employees → Assign Learning `[MVP]`

```
Sales: Capability Assessment engagement ──▶ org account provisioned
       │
       ▼
  Corporate dashboard [O01] ── first-run state: guided activation checklist
       │
       ▼
  ① ADD PEOPLE [O02]
       ├─ CSV import (column mapping → validation preview → confirm)
       ├─ single invites
       └─ SSO/SCIM auto-provision [P2]
       │
       ▼
  ② CREATE TEAMS [O04] ── manual, or mirror HRIS structure [P2]
       │
       ▼
  ③ BASELINE DIAGNOSTIC  ⚑ MUST BE ENFORCED IN ONBOARDING
       │  Without a baseline there is NO provable uplift,
       │  and therefore no renewal argument. This is the single
       │  most important step in the corporate flow.
       │  → assign diagnostic to all seats, deadline, reminders
       ▼
  ④ REVIEW THE GAP [O08] skills heatmap
       ├─ proficiency view · gap view · coverage-risk view
       └─ AI skills narrative [P2] → prioritised recommendations
       ▼
  ⑤ ASSIGN PROGRAMMES [O05]
       ├─ select paths/courses
       ├─ mandatory vs recommended
       ├─ target: individuals · teams · dynamic rule (role = X)
       ├─ deadline + notification schedule
       └─ manager visibility settings
       ▼
  ⑥ SCHEDULE COHORTS [O06/O07] ── dates, instructor, capacity, sessions
       │
       ▼
  ⑦ MONITOR
       ├─ ⚑ activation alert from WEEK 2: "16 seats never activated"
       │    → one-click reminder → escalate to managers
       ├─ at-risk learners → nudge
       └─ attendance capture per session [I07]
       ▼
  ⑧ PROVE  [O01] uplift vs baseline · [O09] credential status · [O11] reports
       │
       ▼
  ⑨ CLAIM  [O10] evidence completeness → Generate HRD Corp claim pack
       │
       ▼
  ⑩ EXPAND ── heatmap reveals adjacent gaps → next department → renewal
```

---

## Flow 5 — Instructor → Create Course → Publish `[P2]`

```
Instructor Studio [I01] ──▶ New course [I02]
       │
       ▼
  ① DEFINE
       ├─ title, domain, altitude, modality
       ├─ LEARNING OUTCOMES  ← structured data, Bloom verb + skill node
       └─ MAP TO SKILL GRAPH  ⚑ mandatory, not optional
            (an unmapped course cannot be recommended, cannot appear in a
             gap analysis, cannot count toward a credential — it is invisible
             to the entire product)
       ▼
  ② STRUCTURE [I03] ── modules → lessons, following the standard rhythm
       ▼
  ③ AUTHOR [I04] ── blocks: video · reading · diagram · quiz · download · lab
       ├─ cite knowledge nodes @ version  ⚑ mandatory for technical claims
       └─ accessibility check (captions · transcript · alt text · contrast)
       ▼
  ④ ASSESS ── knowledge check items · applied task · rubric
       ▼
  ⑤ SUBMIT FOR REVIEW ──▶ reviewer queue [X02]
       │
       ├─ changes requested ─▶ ↺ author
       └─ approved
       ▼
  ⑥ PUBLISH ── version stamped · review_due_date set by domain volatility
       │        (GA/AI: 6 months · DF: 24 months)
       ▼
  ⑦ DELIVER ── cohorts [I05/I06] · live sessions + attendance [I07]
       ▼
  ⑧ IMPROVE ── analytics [I10]: drop-off points · item discrimination ·
                  learner questions clustered → revision backlog ↺
```

---

## Flow 6 — Assessor → Review Submission → Award Credential `[MVP]`

```
Assessor dashboard [A01] ──▶ [ Claim next ]  (single button; no cherry-picking)
       │
       ▼
  Blind assignment ── candidate identity MASKED by default
       │              unmask requires explicit action + is logged
       ├─ conflict of interest? ─▶ declare → returns to pool, reassigned
       │
       ▼
  Review workbench [A03]
  ┌────────────────────────────┬──────────────────────────────┐
  │  ARTIFACT VIEWER           │  RUBRIC GRADER               │
  │  · submitted files         │  1. Model quality  ○◉○○      │
  │  · the brief variant used  │  2. Justification  ○○◉○      │
  │  · AI-use disclosure       │  3. Governance fit ◉○○○      │
  │  · candidate self-check    │  4. Communication  ○◉○○      │
  │  · similarity check result │  5. Risk awareness ○◉○○      │
  │                            │                              │
  │  ▸ AI PRE-ASSESSMENT [P2]  │  Written reasoning per        │
  │    collapsed suggestion    │  criterion (required)         │
  │    + confidence score      │                              │
  │    NEVER pre-filled into   │  [ AI draft feedback ] [P2]  │
  │    the human's fields      │  assessor edits & owns it     │
  └────────────────────────────┴──────────────────────────────┘
       │
       ▼
  ⟨ decision ⟩
       ├─ AWARD          ─▶ outcome recorded
       ├─ RESUBMIT       ─▶ specific remediation written → [K08] → ↺ [K06]
       ├─ NOT YET        ─▶ gap report + remediation plan → [K08]
       └─ INTEGRITY FLAG ─▶ escalate to Integrity Officer [X10]
       │
       ▼
  10% MODERATION SAMPLE ── blind second-marking
       ├─ agree     ─▶ proceed
       └─ disagree  ─▶ third assessor + both enter calibration [A05]
       │
       ▼
  ⟨ all credential requirements met? ⟩
       ├─ no  ─▶ candidate returns to [K01], remaining requirements shown
       └─ yes ─▶ CREDENTIAL ISSUED
                  ├─ badge minted (Open Badges 3.0 / W3C VC)
                  ├─ verification page live [P16]
                  ├─ skill assertions written (append-only, with provenance)
                  ├─ candidate notified → [K10]
                  └─ org notified if corporate [O09]
       │
       ▼
  Assessor stats updated [A01] ── agreement rate · turnaround · earnings
```

---

# 18. DATA MODEL CONSIDERATIONS

Conceptual, not physical. The relationships below drive the UI more than any schema detail.

## 18.1 Entity map

```
                      ┌──────────────┐
                      │  SKILL NODE  │◀─── the spine; everything references it
                      └──────┬───────┘
      ┌──────────┬───────────┼───────────┬────────────┬──────────┐
      │          │           │           │            │          │
  COURSE     ASSESSMENT   CREDENTIAL   ROLE       KNOWLEDGE   SKILL
  outcomes     items      requirements profile      node     ASSERTION
                                                                 │
┌────────────────────────────────────────────────────────────────┘
│
│   ┌──────┐                                    ┌──────────────┐
└──▶│ USER │──< RoleAssignment >───────────────▶│     ROLE     │
    └───┬──┘         (scoped)                   └──────────────┘
        │
        ├──< Enrolment >──────▶ COURSE / PATH ──< contains >──▶ MODULE ──▶ LESSON
        │                          │
        │                          └──< SkillMapping >──▶ SKILL NODE
        │
        ├──< SkillAssertion >─▶ SKILL NODE      (append-only, with provenance)
        │
        ├──< Candidacy >──────▶ CREDENTIAL DEF ──< Requirement >
        │        │                                    │
        │        │                              type: exam_band | artifact
        │        │                                  | experience | cpd | defence
        │        ▼
        │    CREDENTIAL (issued) ──▶ BADGE ──▶ VERIFICATION PAGE
        │
        ├──< AssessmentSession >─▶ FORM ──< drawn from >──▶ ITEM BANK
        │            └──< Response >
        │
        ├──< Submission >─▶ ASSIGNMENT ──▶ BRIEF VARIANT
        │        └──< Evaluation >──▶ ASSESSOR + RUBRIC
        │
        ├──< OrgMembership >──▶ ORGANISATION ──< Team >
        │                            │
        │                            ├──< Programme >──< Assignment >
        │                            └──< Cohort >──< Session >──< Attendance >
        │
        ├──< CPDEntry >
        └──< CommunityProfile >──< Post / Contribution / MentorMatch >
```

## 18.2 Core entities

| Entity | Purpose | Key relationships |
|---|---|---|
| **User** | One person, one account, many roles | → RoleAssignment, Enrolment, SkillAssertion, Candidacy, Credential |
| **RoleAssignment** | A role **with scope** (global / org / chapter / cohort / credential) | User ↔ Role |
| **Organisation** | Corporate or academic tenant | → Team, Seat, Programme, Cohort, Report |
| **Team** | Grouping within an org | → User, Programme assignment |
| **SkillNode** | Atomic capability; the spine | → prerequisites (DAG), Course, Item, Requirement, KnowledgeNode, RoleProfile |
| **RoleProfile** | Target skill vector for a job role | → SkillNode (weighted) |
| **SkillAssertion** | A claim that a user has a skill at a level, **with provenance** | User → SkillNode; source = diagnostic / assessment / artifact / attestation |
| **Path** | Ordered milestones toward a credential or role | → Course, Milestone, CredentialDef |
| **Course → Module → Lesson → Block** | Content hierarchy, each independently versioned and reusable | → SkillMapping, KnowledgeRef |
| **KnowledgeNode + NodeVersion** | Body of Practice; the citation target | ← Lesson, Item, AI retrieval |
| **Item / Form / AssessmentSession / Response** | Knowledge assessment | Item → SkillNode; Form drawn from bank |
| **Assignment / BriefVariant / Submission / Evaluation** | Evidence assessment | Submission → Assessor, Rubric |
| **Rubric** | Criteria × levels with descriptors | ← Assignment, Evaluation |
| **CredentialDef + Requirement** | What a credential demands — **as data, not code** | → SkillNode, Assignment, Form |
| **Candidacy** | A user's attempt at a credential; a state machine | User → CredentialDef |
| **Credential + Badge** | Issued, verifiable, time-bounded | → VerificationPage, SkillAssertion |
| **CPDEntry / Renewal** | Ongoing obligation | User → Credential |
| **Cohort / Session / AttendanceRecord** | Instructor-led delivery | → Organisation, Instructor, EvidencePack |
| **EvidencePack / ClaimBundle / SchemeProfile** | Funding compliance (HRD Corp) | → Cohort, Session, Attendance |
| **Chapter / Event / Post / MentorMatch** | Community | → User |

## 18.3 The five relationships that matter most for the UI

1. **Everything hangs off SkillNode.** Course outcomes, exam items, credential requirements, knowledge nodes, role profiles, and learner assertions all point at the same nodes. *UI consequence:* gap analysis, path generation, credit-for-prior-learning, and the corporate heatmap are all the same query at different aggregations. Break this and each becomes a separate bespoke feature.

2. **SkillAssertion is append-only with provenance.** Never overwrite a proficiency value; write a new assertion. *UI consequence:* the evidence trail in `L05`, the decay/confidence display, and the defensibility of any credential decision years later all depend on this. It is the single most expensive thing to retrofit.

3. **Credential requirements are data.** A `Requirement` row typed `exam_band | artifact | experience | cpd | defence`. *UI consequence:* `P15`, `K01`, and `K02` all render from the same requirement list, so a new credential needs no new screens.

4. **Content is versioned; references are version-pinned.** A lesson cites `KnowledgeNode@v2.3`. *UI consequence:* version stamps on `N03` and `C05`, the changelog `N10`, the content review queue, and the renewal currency assessment all become possible. Retrofitting versioning is a rewrite.

5. **Roles are scoped and many-to-many.** *UI consequence:* the workspace switcher works, one person can be learner + instructor + chapter lead, and org admins see only their own org. A single `role` column on `users` is the most common and most expensive early mistake in platforms of this shape.

## 18.4 Cross-cutting concerns
Every entity carries: `id · created_at · updated_at · created_by`. Assessment, credential, and admin actions additionally carry immutable **audit log** entries. Content entities carry `version · status · review_due_date · reviewed_by`. Org-scoped entities carry `organisation_id` for tenancy isolation from day one — retrofitting multi-tenancy is a rewrite.

---

# 19. RECOMMENDED MOCKUP BUILD SEQUENCE

**Principle:** build in the order that lets you *show the story* earliest. After each step you should be able to demo something meaningful, get feedback, and change direction cheaply.

### Step 0 — Foundations (before any screen)
Design tokens (colour, type, space, radius, motion) · the three card types · core components (button, input, chip, table, tabs, modal) · **the five signature components: `CredentialCard`, `SkillMeter`, `MilestoneTimeline`, `RubricPanel`, `HeatmapGrid`**. Light and dark themes from the start.
*Why first:* these five components carry the product's meaning. Designing screens before them produces inconsistency you then have to unpick.

### Step 1 — The promise
`P01` Homepage → `P05` Diagnostic → `P06` Diagnostic Result
*Demo value:* the acquisition story and the core value proposition. **Test with real strangers before going further** — if `P06` doesn't produce a "how did you know that?" reaction, the rest of the platform is built on sand.

### Step 2 — The learner core
`S02` Sign up → `S03` Onboarding → `L01` Dashboard → `L04` My Path
*Demo value:* the workspace and the personalisation story. `L01` and `L04` set the visual language for every authenticated screen.

### Step 3 — Learning
`P12/C01` Course Landing → `C02` Course Home → `C05` Lesson Player → `C10` Knowledge Check
*Demo value:* the actual learning experience. `C05` is where learners spend most of their time; get it right early.

### Step 4 — Capability made visible
`L05` Skills Profile → `L14` AI Tutor
*Demo value:* the two features that distinguish this from an LMS. `L05` is the payoff of the skill graph; `L14` is the daily-felt AI value.

### Step 5 — The differentiator ★ the most important step
`P14` Certification Overview → `P15` Credential Detail → `K01` Candidacy Tracker → `K02` Readiness Check → `K05b` Assessment Runner → **`K06` Artifact Workspace** → `K08` Result & Feedback → `K10` Credential Awarded
*Demo value:* the entire evidence-based credential story — the reason this platform exists. `K06` is the single highest-stakes screen in the whole design; give it the most iteration.

### Step 6 — The credential in the world
`P16` Public Verification
*Demo value:* closes the loop and shows the growth mechanism. Small screen, disproportionate strategic weight.

### Step 7 — The other side of assessment
`A03` Assessor Review Workbench
*Demo value:* proves the credential is genuinely assessed by qualified humans, not automated. This screen is what makes the trust claim credible to a sceptical buyer.

### Step 8 — The commercial engine
`O01` Corporate Dashboard → `O08` Skills Heatmap → `O10` HRD Corp Compliance → `O02` People & Seats → `O05` Programmes
*Demo value:* the revenue story. `O01` + `O08` are what you show a CDO; `O10` is what closes the deal in Malaysia.

### Step 9 — Delivery & knowledge
`I06` Cohort Detail → `I01` Instructor Dashboard → `N03` Knowledge Article → `N10` Changelog
*Demo value:* completes the ecosystem — supply side and the living-knowledge proof.

### Step 10 — Fill and polish
`P02`, `P04`, `P07`, `P10`, `P11`, `P17`, `P19`, `L02`, `L09`, `C12`, `K03`, `K05a/c`, `K07`, `M08`, `S10` error/empty states · responsive passes · accessibility audit · dark theme verification.

### Sequencing rationale
Steps 1–4 could describe any good learning platform. **Steps 5–8 are what make this a professional development ecosystem.** If time runs short, cut from step 10 and step 3 depth — never from step 5. A mockup that shows a beautiful course player and no artifact workspace demonstrates an LMS, which is explicitly not what we are building.

---

# 20. CRITICAL REVIEW

A design review of this specification, conducted against it rather than in defence of it. Everything below is a real gap or a real risk in the design as written above.

---

## 20.1 Missing user journeys

Thirteen journeys the specification does not currently cover. The first four are the serious ones.

| # | Missing journey | Why it matters | Recommendation |
|---|---|---|---|
| **1** | **Exam accommodations & accessibility needs** | A certification body has a **legal and ethical obligation** to provide reasonable adjustments — extra time, screen reader compatibility, rest breaks, alternative formats. Nothing in §7 addresses this, and proctoring software is notoriously hostile to assistive technology. This is the most serious omission in the document. | Add `K03b` **Request Accommodations** to the candidate registration flow, and an admin review queue. Publish the accommodations policy on `P04`. Verify the proctoring vendor's assistive-tech support **before** signing. Treat as MVP, not phase 2. |
| **2** | **Learner leaves the employer mid-programme** | Corporate seat is revoked. What happens to their progress, their in-flight candidacy, their submitted artifact, their earned credentials? This will happen in the first cohort and there is no designed answer. It is also a promise we make publicly ("credentials are personally owned and portable"). | Design `O02b` **Seat Offboarding**: earned credentials always stay with the person; in-flight progress converts to a personal account; the artifact and candidacy transfer with an option to self-fund completion. Make the policy explicit in `O03`'s privacy banner and in the contract. |
| **3** | **Refund, cancellation & withdrawal** | Entirely absent. Legally required in most jurisdictions, and unavoidable in practice: someone will want out mid-path, mid-candidacy, or after a failed exam. Undesigned refund flows become support chaos and reputational damage. | Add `S11` **Refund & Withdrawal Request** with clear published policy per product type (course, path, exam, candidacy, corporate seat). Exam and candidacy fees need a distinct policy from course fees — the cost structure differs. MVP. |
| **4** | **Candidate who does not succeed and gives up** | §7 handles "not yet" well but assumes they retry. Some will not. Right now they simply disappear, having paid and having nothing. | Design a **graceful landing**. *Original proposal — award the band achieved — is void under DR-01: there are no bands and no lower credential.* **V1 replacement:** exam score with per-skill breakdown, a **Path Completion Record** (visually and semantically distinct from a credential), retained skills profile, the assessor's full written feedback, a specific remediation plan, and one free resubmission within 90 days. Nobody who pays leaves with nothing — and nobody receives a credential they did not earn. |
| 5 | **Bulk / employer-side verification** | `P16` verifies one credential. An employer with 40 applicants needs to verify in bulk or via API. | `P16b` bulk verification (paste a list of IDs) in P2; verification API in future. Low effort, high strategic value — it makes the credential *infrastructure*. |
| 6 | **Account recovery & lost access** | Password reset, MFA recovery, email change, "I earned a credential under an old employer email". The last one is common and currently unhandled. | Standard recovery in `S01` (MVP) + credential email reassociation with identity re-verification (P2). |
| 7 | **Data export & account deletion** | PDPA/GDPR obligation. Also a trust statement for a platform that says "the learner owns the record". | `S08b` **Data & Privacy**: export everything, delete account with a clear explanation of what survives (issued credentials remain verifiable, anonymised). MVP-thin. |
| 8 | **Disputing a skill assertion** | The profile claims something wrong, or a decayed skill misrepresents the person. No route to challenge it. | Add a "this isn't right" affordance on `L05` skill rows → re-assess or flag. P2. |
| 9 | **Instructor offboarding** | An instructor leaves. Who owns the course? Who runs the live cohort mid-delivery? Who marks the queue? | Content licensing terms + cohort reassignment flow. Matters more than it looks given key-person risk. P2. |
| 10 | **Low-bandwidth / mobile-only learner** | A real and large segment across Malaysia, Indonesia, and the wider region. The spec assumes desktop-plus-good-video. | Audio-only mode, transcript-first fallback, downloadable lessons, aggressive image optimisation, and a data-saver setting. Design `C05` to degrade well, not just to look good on fibre. P2, but design for it now. |
| 11 | **Corporate pilot / trial before purchase** | Flow 4 begins after the sale. The buyer needs to try before committing — and the Capability Assessment offer implies exactly this. | `O00` **Pilot mode**: time-boxed org account, limited seats, converts to paid with data intact. P2. |
| 12 | **Returning after long absence** | Credential expired, skills decayed, content changed. Currently they land on a stale dashboard. | Re-onboarding: "here's what changed in your domain since 2026" from the knowledge changelog, plus an optional re-diagnostic. Reuses `N10` — cheap to build, high reactivation value. P2. |
| 13 | **Peer / study-group learning** | Cohort learners want a study buddy. The design has cohorts but no peer interaction inside them. | Cohort-private group in `I06`/`C02`. P2, and cheap — it materially improves completion. |

## 20.2 Unnecessary complexity in this specification

Self-critique. Nine places where the design is more elaborate than the launch reality justifies.

| # | Over-complexity | The problem | Simplification |
|---|---|---|---|
| **1** | **5 domains × 4 altitudes = 20 catalogue cells** | At launch there will be roughly 15 courses. Most cells will be empty, and **an IA that advertises emptiness is worse than a smaller IA that looks complete.** Filters returning nothing damage credibility. | **Launch showing 3 domains** (DF, GA, plus Literacy as its own product). Add DE, AI, GT to the navigation only when each has real content. Keep the 5-domain model in the data layer — just don't render empty rooms. |
| **2** | **Five workspaces in the switcher** | With one instructor and no assessor pool at launch, four of the five workspaces have one user each. | Ship the switcher with **Learning + one role workspace**. The pattern is right; the scale is not there yet. |
| **3** | **Four parallel credential concepts** — ladder (L1–L4), bands (60/70/75), specialisms, micro-credentials | Genuinely hard to explain on one page. A prospective candidate has to hold four ideas simultaneously to understand what they're buying. This is a real conversion risk on `P14`. | **Resolved by DR-01: launch with ONE credential, no levels, no bands.** The exam becomes a single pass threshold; all grade differentiation moves into the artifact rubric. The ladder becomes one forward-looking sentence on `P15`. Specialisms and micro-credentials deferred. |
| **4** | **Skill decay in MVP** | Intellectually elegant, and one of the better ideas in the blueprint — but hard to calibrate honestly with no longitudinal data, and potentially demoralising on day one when a learner's brand-new skill already shows a confidence bar. | Ship the data model with decay parameters; **do not surface decay in the UI until a skill is 12+ months old**. Nobody's skills are stale in year one. |
| **5** | **Adaptive diagnostic in MVP** | True adaptive item selection needs a calibrated item bank you will not have. | A **fixed-branch diagnostic** (branching on domain and altitude, not per-item IRT) delivers 90% of the perceived value at 20% of the cost. Call it adaptive when it is. |
| **6** | **Three separate hubs — `L06` Assessments, `L07` Assignments, `L08` Portfolio** | They overlap heavily and fragment the learner's mental model of "my work". | Merge into one **"My Work"** screen with tabs. Saves a screen and reduces navigation confusion. |
| **7** | **`P09` Paths Index + `P11` Catalogue as separate screens** | With ~15 courses and 3 paths, these are the same page with different filters. | One faceted catalogue with a "paths" facet. Split later when volume justifies it. |
| **8** | **Three AI-use policy tiers** | Three tiers to explain, when only two are actually used at launch (Restricted for exams, Disclosed for artifacts). | Ship **two tiers**. Add "Permitted" when a use case genuinely needs it. |
| **9** | **`C06` and `C07` as separate screens** | They are content-block states of `C05`, not screens. Counting them inflates the inventory and invites redundant design work. | Treat as states. (Already noted in §13, but worth acting on when scoping design hours.) |

**Net effect of these nine simplifications: roughly 4 fewer screens to design and materially less to explain on the marketing site — with no loss to the ecosystem story.**

## 20.3 MVP risks

Ordered by severity. The first three are the ones that can actually kill the launch.

| # | Risk | Severity | Why | Mitigation |
|---|---|---|---|---|
| **1** | **Assessor supply** | **Critical** | The evidence model requires qualified humans to grade artifacts within a 10-day SLA. At launch there is essentially one qualified person. A single cohort of 25 candidates could generate 25 artifacts in the same week. Miss the SLA once and the credibility argument collapses. | **Cap candidate intake to match assessor capacity** — deliberately, and say so publicly ("limited places per cohort" is a positioning asset, not an apology). Recruit 3–5 founding assessors *before* the first cohort. Build `A03` in the MVP so assessors have a real tool. Consider paying above market initially. |
| **2** | **The evidence gate suppresses conversion** | **Critical** | The entire differentiation rests on candidates actually submitting artifacts. If they register, sit the exam, and then quietly never submit, the model has failed — and it will fail *silently* unless instrumented. | Instrument **artifact submission rate** from candidate one. Ship exemplars and the visible rubric on day one (not as a later improvement). Watch the drop-off point precisely. Be prepared to lighten the L2 artifact — while holding the line at L3. |
| **3** | **Content thinness vs the "academy" claim** | **High** | One domain, ~8 modules, one credential. The marketing promises an ecosystem; the catalogue shows a course. The gap between the mockup and the reality is a credibility risk in the exact segment (corporate buyers) you most need to convince. | **Do not launch a browsable catalogue that looks empty.** Lead with the *path* and the *credential*, not the course count. Position as "one deep credential done properly" rather than "an academy" until breadth exists. Honest scarcity beats padded abundance. |
| **4** | **Key-person dependency** | **High** | Author, instructor, assessor, subject-matter authority, and brand are currently one person. Illness or overload stops everything. | Treat the instructor roster and partner-provider programme as **launch-adjacent priorities, not phase 2**. Document authoring standards early. Record content so delivery is not always live. |
| **5** | **Skill graph authoring burden** | **High** | 40–60 nodes with prerequisites, mapped to every lesson, item, and requirement. This is real, unglamorous work and it **blocks** the diagnostic, paths, gap analysis, and the heatmap — i.e. most of the differentiation. It is also easy to underestimate. | Do it **before** content migration (blueprint next-step 3). Budget 2–3 focused weeks. Start deliberately coarse (40 nodes, shallow prerequisites) and refine — an imperfect graph beats no graph. |
| **6** | **Proctoring cost and friction** | Medium-High | Adds per-exam cost and a meaningful drop-off (system checks, ID verification, camera anxiety). At individual price points it can invert the unit economics. | Proctor only credential-bearing exams. Consider record-and-review rather than live proctoring at L1/L2. Publish the requirements on `P15` so nobody is ambushed at `K05a`. |
| **7** | **Compliance module built on assumptions** | Medium-High | `O10` is specified from general knowledge of the scheme, not from a current, verified e-TRIS submission checklist. Rules change. Getting this wrong in front of a corporate buyer is worse than not offering it. | **Verify against current HRD Corp requirements before design** (blueprint next-step 6). You already hold most of the source documents — use them as the specification. |
| **8** | **Two-sided cold start** | Medium-High | Learners want a credential employers recognise; employers recognise credentials learners hold. Neither exists at t=0. | Solve the employer side **first and manually**: an advisory board of 5–8 named employers pre-launch, with public recognition statements. This is a business-development task, not a product task, and it cannot be deferred. |
| **9** | **30 screens is still a large first mockup** | Medium | Realistically 6–10 weeks of design work before a line of production code. Long enough for scope to drift and for the design to be reviewed in the abstract rather than against user reaction. | Follow the §19 build sequence and **review after step 5** (the differentiator). If the credential journey does not feel compelling at that point, stop and fix it before designing the corporate portal. |
| **10** | **Mockup over-promises in sales conversations** | Medium | A polished mockup showing a heatmap, an assessor workbench, and a compliance module will be shown to buyers. If it is sold before it is built, the first customer relationship starts with a broken promise. | Watermark or label the mockup clearly. Maintain an explicit "available now / in build / planned" list for every sales conversation. |

## 20.4 Features that should NOT be included initially

Beyond the deferrals in §14.5, these are things to actively **avoid**, not merely postpone. Several would be actively harmful.

| Feature | Why not — and this is a stance, not a scheduling decision |
|---|---|
| **Gamification: streaks, points, leaderboards, XP** | Actively wrong for this product. A credential's value comes from being taken seriously by employers. Leaderboards and streak-shaming make it feel like a language app and undermine the exact seriousness the credential is selling. **Milestones and credentials are the motivation system** — they are intrinsic to the domain and they scale with the brand rather than against it. |
| **Social feed / following / likes** | Attention mechanics for a professional audience with no time. Costs a lot to build, damages tone, and competes with the learning action. Structured discussion (P2) serves the real need. |
| **Course ratings & reviews at launch** | With 15 learners, "4.8 from 3 reviews" reads as fabricated and a single bad review is catastrophic. **Hold until ~50 reviews per course.** Use named case evidence and instructor credibility instead — both are stronger signals early anyway. |
| **Certificates of attendance for everything** | Issuing a certificate for every module devalues the credential by association. Course completion records should be visibly, deliberately *lesser* than credentials — different name, different visual treatment, different vocabulary. Guard this distinction carefully; it erodes easily. |
| **The L4 Fellow credential** | Requires holding L3 for 2+ years. Literally nobody can qualify before 2029. Designing screens for it now is pure waste. Keep it in the strategy narrative, remove it from the product. |
| **Third-party course marketplace** | Dilutes quality control, which is the entire trust proposition. The accredited-partner model achieves scale *without* surrendering the standard. Do not confuse the two. |
| **Native mobile apps** | Responsive web covers every MVP journey. A native app before product-market fit is a second codebase and a second release process funded by hope. |
| **Live chat support widget** | Creates a response-time expectation you cannot meet with a small team, and a slow live-chat is worse than an honest contact form with a stated SLA. |
| **Multi-currency and multi-region at launch** | Ship MYR and USD. Every additional currency adds tax, pricing, and reconciliation complexity for revenue you do not yet have. |
| **A generous free tier** | Free knowledge library and free diagnostic are strategic. Free *courses* are not — they train the market to expect free and undermine the premium positioning the credential depends on. One free preview lesson per course is the right line. |
| **Recommendation engine beyond the path** | "Learners like you also took…" needs data you do not have and will produce embarrassing recommendations at low volume. The path *is* the recommendation until there is real behavioural data. |
| **Automated credential decisions** | Never. Not as an optimisation, not for L1, not "just for the exam component". The moment a machine issues a credential unsupervised, the trust argument is gone — and it is the only argument. |

## 20.5 Where this specification is strongest

Worth stating so it is preserved under scope pressure:

1. **`K06` Artifact Workspace** is the design's centre of gravity and the hardest thing for a competitor to copy. It should receive the most iteration.
2. **The skill graph as the shared spine** is what makes the diagnostic, paths, gap analysis, and corporate heatmap one system rather than four features. Preserve it even if it delays the catalogue.
3. **`O10` Compliance & HRD Corp** is a small, unglamorous screen with disproportionate commercial power in your primary market, and it makes the platform structurally hard to leave.
4. **`P16` Public Verification** is the growth loop and the first brand impression for every employer. Do not treat it as a utility page.
5. **The precision-drawing design direction** solves a genuine positioning problem — credible on AI without looking like an AI startup, trustworthy without looking like a legacy institution.

## 20.6 Decisions needed from you before design begins

Six open questions that materially change the mockup. Each is a business decision, not a design one.

1. **Platform and credential naming.** "Data & AI Academy" and "Blueprint Credential" are placeholders. Naming affects the logo, the badge, the verification page, and every header. **Decide before step 0.**
2. **Launch domain scope.** §20.2 recommends showing 3 domains, not 5. Confirm — it changes the homepage, catalogue, and navigation.
3. **Individual vs corporate first.** The spec serves both. If corporate is the launch motion (it matches your delivery history and the funding-scheme advantage), the mockup should lead with `O01`/`O08`/`O10` and treat individual self-serve as secondary.
4. **Credential pricing and the exam/artifact fee split.** Affects `P15`, `K03`, and the whole readiness-to-registration conversion design.
5. **Assessor sourcing.** Who are the first 3–5? This determines whether the 10-day SLA in `K07` is a promise or a liability.
6. **HRD Corp scope.** Which of your programmes are registered and claimable today? `O10` and `P18` cannot be specified accurately without this.

---

# 21. HANDOFF NOTES

**For a UI/UX design agent.** Start at §19 step 0 — build the design tokens and the five signature components before any screen. Then follow steps 1→10. Use §16 as the visual brief and §22 (design direction) constraints as hard rules, not suggestions. The wireframes in §5, §6, §7, and §8 are *layout intent*, not visual specification: honour the hierarchy and the element priority; design the surface yourself.

**For a coding agent.** Scaffold routes from §3. Model entities from §18, paying particular attention to the five relationships in §18.3 — those are the expensive-to-reverse decisions. Build the skill graph before the catalogue. Implement `SkillAssertion` as append-only from the first commit.

**Non-negotiables that must survive any scope cut:**
1. No credential is awarded without human judgement.
2. Experts never decide credential outcomes for participants in a cohort they delivered (`BR-1`).
3. ~~Every AI answer carries citations.~~ *(⏸ Moot in V1 — no learner-facing AI feature ships. Reinstate with any future AI capability.)*
4. Every assessment declares its AI-use policy.
5. Credentials are portable and remain verifiable if the participant leaves.
6. Colour is never the sole carrier of meaning.
7. Assessment SLA is displayed publicly to candidates — which means it must be operationally real.
8. **Attendance alone never earns a credential** — participation is part of the pathway, not the whole of it *(DR-02 §6)*.
9. **Only genuine experts are ever shown** — no fabricated profiles, biographies, testimonials or credentials, including in fixture data *(DR-02 §7)*.

> **⚠ Reading this document after the correction.** Start with `DR-02_EXPERT_LED_DELIVERY_MODEL.md`, then `MVP_BUILD_SPEC.md` §5–§7 for the authoritative journeys, screen list and mockup scope. **This document is authoritative for design language, interaction patterns and accessibility — not for scope or product model.** Where it and the corrected specifications disagree, they win.

**What "done" looks like for the first mockup:** a viewer who has never heard of the platform can click through steps 1→8 of §19 and, without narration, articulate what makes this different from a course marketplace. If they cannot, the mockup has not succeeded regardless of how good it looks.

---

*End of specification. Companion to `DATA_AI_ACADEMY_PORTAL_BLUEPRINT.md`. Section 20 should be read before design begins, not after.*
