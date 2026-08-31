# Architecture Overview

> **Status: PARTIALLY APPROVED — 2026-08-30** · Core architectural direction approved (ADR-001, 002, 003 *direction only*, 004, 005, 010, 020, 022, 023, 036, 039, 040). Vendor and implementation choices remain open. **No approval authorises implementation** — see `README.md` §10.
> **Created:** 2026-08-30 · **Version:** 0.1 · **Scope:** MVP (Phase 1A/1B/1C) with expansion shapes honoured
> Derived from `DATA_AI_ACADEMY_MVP_BUILD_SPEC.md`, `DATA_AI_ACADEMY_PORTAL_BLUEPRINT.md`, `DATA_AI_ACADEMY_PORTAL_MOCKUP_SPECIFICATION.md`.
> Provenance tags: **`[SPEC]`** explicit in an approved specification · **`[INFERENCE]`** technical consequence · **`[ASSUMPTION]`** requires confirmation.

---

# PART 1 — PRODUCT UNDERSTANDING

> ## ⚠ RECONCILED WITH DR-02 — 2026-08-31
>
> **[`DR-02_EXPERT_LED_DELIVERY_MODEL.md`](../../DR-02_EXPERT_LED_DELIVERY_MODEL.md) is the authoritative strategic correction and outranks this document.** Part 1 previously restated a self-paced product: a journey ending in a lesson player, an AI tutor as an MVP module, and corporate as a "thin slice". All three are superseded.
>
> **The organisation is an independent professional training and certification organisation. Its core value is expert-led delivery — face-to-face, live online, and tailored corporate engagements. The portal supports that ecosystem; it is not where learning happens.**
>
> **Part 2 (the recommended architecture) is materially unaffected** by the correction — the modular monolith, PostgreSQL, scoped RBAC, append-only evidence, audit-in-transaction, the jobs table and the exam clock all stand. The correction lands in *what the architecture serves*, not in *how it is built*. See `EXTERNAL_ARCHITECTURE_REVIEW_2026-08-30.md` for the review that preceded this, and ADR-043/ADR-044 for the two decisions it produced.

## 1.1 What is being built

**`[SPEC]`** A **single professional credential, earned through an expert-led programme in a single pilot domain, delivered end to end** (MVP Spec §1, as corrected by DR-02). A visitor discovers a programme — what they will be able to do, who delivers it, in what format, on what date — and registers for a scheduled offering, or an organisation engages us for a private cohort. **Delivery is expert-led: live online or face-to-face.** Supporting materials prepare, extend and reinforce that delivery without replacing it. The participant sits one knowledge assessment; produces a real applied artifact against a published brief, rubric and worked exemplars; **a qualified human reads that artifact, grades it against the rubric, and writes reasoned feedback**; on success a credential is issued with a permanent public verification page. A free capability assessment runs alongside — an individual readiness check, and the corporate land motion. **Corporate and private delivery is a first-class pathway, not a layer**: invite a cohort, capture attendance, track progress, generate the HRD Corp evidence pack.

**`[SPEC]`** **Programme count is deliberately not fixed** (DR-02 §4.1) — a deliberately small, credible portfolio. Launch inventory is a commercial and content decision and **is never encoded architecturally**.

**`[SPEC]`** The promise is three sentences (MVP Spec §14): *learn what you're actually missing · prove it by doing the work · carry the proof anywhere.* Any decision that does not make one of those more true is not a V1 decision.

**`[SPEC]` DR-01 — one of each countable thing:** one pilot domain (Data Foundations, **as seeded data, never hardcoded**), one certification, one artifact brief (3 industry variants), one rubric (5 criteria × 4 levels), one credential. *(DR-01's "one learning path" concerned the **credential**; under DR-02 §4.1 it is not a fixed programme count.)*

**`[SPEC]`** Deliberately **not** built in V1: credential ladder/levels/bands, **course catalogue**, **self-paced route to the credential**, **AI tutor** (deferred, DR-02 Decision 2), **video-first content**, community, chapters, events, marketplace, W3C Verifiable Credentials, proctoring vendor, adaptive engine, second domain, CPD, renewal, native mobile apps, SSO/SCIM/HRIS, LTI/SCORM/LRS, benchmarking, heatmaps. **Additionally retired as strategic destinations** (DR-02 §1): standards council, chapter-based structure, accredited-partner delivery.

**Architectural consequence — the governing principle (`[SPEC]` MVP Spec §16):**
> **Architect for expansion. Build only what needs validation.** Adding domain #2 or credential #2 must be a *data operation plus content* — never a schema migration and never a redesign.

## 1.2 Primary user groups

**`[SPEC]`** Six, not fourteen (MVP Spec §4, as corrected by DR-02 — five previously; the expert is restored as a real role):

| Code | User group | Why it exists in V1 | Architectural weight |
|---|---|---|---|
| U1 | **Visitor** (anonymous) | Funnel entry; programme discovery, the capability assessment and credential verification are all anonymous | Public, SEO-indexed, cacheable, no session required |
| U2 | **Participant / Candidate** | The whole promise. *Candidate is a **state**, not a role* — one account, a `candidacy` record. *("Participant" replaces "learner" where a person is in a programme — DR-02 terminology)* | Authenticated workspace; the bulk of transactional state |
| U3 | **Expert / Trainer** *(promoted by DR-02)* | **Expert-led delivery is the product.** Publicly visible via a real, honest profile; operationally needs roster and attendance only | Association to a scheduled offering is what makes **BR-1** computable for public offerings `[INFERENCE]`. **No instructor portal** |
| U4 | **Assessor** | Without a human judging artifacts the differentiator does not exist. **A launch dependency, not a feature** | Elevated, conflict-of-interest-constrained access; separate integrity rules |
| U5 | **Corporate Admin** | How V1 gets paid | Tenant-scoped access; must never see other organisations |
| U6 | **Platform Admin** | Content, programmes, users, orgs, credentials, packs. Internal-only; **may be an ugly CRUD** | Break-glass, fully audit-logged |

**`[SPEC]`** The earlier position — *"Instructor is modelled in `user_roles` but has no portal in V1"* — is **superseded on the role, not on the portal**. The expert is a real role with a **public profile**; there is still **no instructor portal**, only roster and attendance. **Honest representation is binding: no fabricated expert profiles, ever**, and the model must accommodate a growing expert network without redesign (DR-02 §7).

**`[INFERENCE]`** The authorisation model itself is **unchanged and sufficient** — scoped many-to-many RBAC (ADR-020) already accommodates the new role. Only the role *set* grows.

**`[INFERENCE]`** Because a person is routinely a learner *and* an assessor *and* an org admin, **roles must be scoped many-to-many from the first commit** — this is stated as a Retrofit Test item in `[SPEC]` and is the single most expensive identity mistake available to this project.

## 1.3 Major functional modules

**`[SPEC]`** Nine module slots, of which **eight are built in V1** — `M8` is deferred by DR-02. Identifiers are stable and are not renumbered. Each is listed with a *minimum* implementation:

| ID | Module | Minimum V1 responsibility |
|---|---|---|
| **M1** | Identity & Accounts | Email/password + Google sign-in, verification, reset, profile, **scoped many-to-many roles** |
| **M2** | Skills & Diagnostic | ~35 **flat** skills (no DAG), 20-question fixed diagnostic with 2 branches, gap report, **append-only skill assertions** |
| **M3** | **Programmes, Scheduling & Supporting Materials** *(renamed by DR-02)* | Programme → scheduled offering/cohort → session → supporting materials; **public programme discovery and scheduled offerings**; registration; materials that prepare, extend, reinforce or document delivery; non-blocking knowledge checks; **version fields present but unread**. **No catalogue, no lesson player, no video-first content** |
| **M4** | Knowledge Library | 20–30 public SEO articles + ~60-term glossary + changelog. Credibility surface and participant reference. *(Its former second job — the AI tutor's retrieval corpus — lapses with M8's deferral)* |
| **M5** | Assessment | One fixed 60-item / 60-minute form, randomised order, **one pass threshold (70%)**, highest score retained, no proctoring vendor |
| **M6** | **Evidence & Assessor Workflow ★** | Brief + 3 variants, published rubric, 3 real exemplars, submission workspace with autosave and AI-use disclosure, **assessor workbench**, result with per-criterion reasoning |
| **M7** | Credentials | One `credential_def` with **requirements as data rows**, issuance, **permanent public verification page**, OB 2.0 PNG + PDF, LinkedIn share |
| **M8** | **AI Tutor — ⏸ DEFERRED FROM MVP** *(DR-02 Decision 2)* | **Not built in V1; not retired; not replaced by another AI feature.** Retained design: RAG over M4 only, citations with version stamps, refuses out-of-corpus, visibly disabled during assessment. **Returning it requires separate strategic justification against the expert-led model** — that AI is our subject matter is explicitly not such a justification |
| **M9** | **Corporate & Private Delivery** *(promoted from "Thin Slice")* | Corporate entry path (offering, engagement formats, qualifying enquiry), org account, seat invites (single + CSV), private cohorts, **attendance grid with correction audit trail**, progress table, **HRD Corp evidence pack generator**. **Strategic status raised; MVP workflow complexity unchanged — no CRM, no proposal automation, no contract workflow** |
| — | Cross-cutting | Payments (Stripe + FPX/DuitNow, MYR + USD), transactional email, admin CRUD, **audit log on credential and assessment actions**, error tracking, funnel analytics, **externalised UI strings** |

## 1.4 Core business workflows

**`[SPEC]`** **Two journeys, both first-class** (MVP Spec §5, as corrected by DR-02). They converge at delivery and share every module — no separate product. *The previous single journey — `diagnostic → account → dashboard → lesson player (repeat) → exam → artifact` — was a self-serve digital funnel and is superseded.*

**Journey A — the individual professional:**

```
Visitor → [P10] Programme  (what you'll be able to do · who delivers it · format)
        → optional: [P05] Capability assessment → [P06] Gap report
                    ── resolves to a programme and when it next runs
        → [P24] Scheduled offerings — choose format and date
        → [K03] Register · integrity undertaking · pay
        → ★ EXPERT-LED PROGRAMME — live online or face-to-face
             THE PRODUCT. The portal supports it (schedule, joining details,
             roster, attendance, materials) and does not replace it.
        → [K05b] Knowledge assessment ── <70% → score + per-skill gaps + retake ↺
        → [K06] ★★ Applied artifact ── THE CRITICAL DROP-OFF (instrument from candidate one)
        → [A03] Qualified assessor grades against rubric, writes reasoning · 10 working day SLA
        → [K08] Result ── NOT YET → feedback + remediation + one free resubmission ↺
                       └─ AWARDED
        → [K10] Credential awarded → [P16] Permanent public verification page
        → shared → a stranger clicks the badge → Visitor ↺   (growth loop)
```

**Journey B — the corporate client:**

```
[P17] Corporate offering → [P19] Qualifying enquiry
        → [P05]/[P06] Team capability assessment — the land motion
        → AGREEMENT — programme, format, dates, location.  OUTSIDE THE PORTAL.
                      No CRM, no proposal automation, no contract workflow in V1.
        → [O07] Private cohort created · roster invited · seats activated
        → ★ DELIVER — on-site or live online, attendance captured
        → participants assessed → credentials issued
        → [O01] progress · [O10] HRD Corp evidence pack
```

**`[INFERENCE]`** The architectural consequence of both journeys is the same: **expert-led participation sits between registration and assessment**, and the portal's obligation across that span is to hold schedule, joining details, roster, attendance and materials — not to deliver content.

**`[SPEC]`** The **corporate journey is not a separate product** — the same modules with a different entry point: invited into a private cohort rather than registering individually, expert-led sessions with attendance captured, and an org admin who generates the evidence pack at the end. *(Corporate is now a **first-class pathway**, not a variant — DR-02 §8.)*

**Secondary workflows that are still first-class:**

| Workflow | Source | Note |
|---|---|---|
| Assessor queue → review → decision | `[SPEC]` M6 | Manual assignment in V1; 2–4 assessors |
| Candidate registration → payment → integrity undertaking → window opens | `[SPEC]` K03 | Level selection **does not exist** (DR-01) |
| Unsuccessful candidate landing | `[SPEC]` §15.5 | Exam score + per-skill breakdown + **Path Completion Record** (semantically distinct from a credential) + retained skills + full feedback + remediation + **one free resubmission within 90 days** |
| Attendance capture and retrospective correction | `[SPEC]` M9 | Correction **requires an audit trail** |
| Evidence pack generation | `[SPEC]` M9 / O10 | Templating + zip over real cohort data |
| Data export / account deletion | `[SPEC]` S06 | PDPA obligation; issued credentials must remain verifiable |

## 1.5 Important business rules

Rules that must be enforced **in code, not policy**:

| # | Rule | Source | Enforcement point |
|---|---|---|---|
| BR-1 | **An assessor cannot evaluate a submission from a cohort they instructed** | `[SPEC]` MVP §4, §9 rule 5, Blueprint §8 | Database check + service-layer guard, from day one |
| BR-2 | **No credential is ever awarded by an automated decision** | `[SPEC]` MVP §3.4, Mockup §21 | Issuance requires a human `evaluation` decision |
| BR-3 | **Two-person rule for credential revocation** | `[SPEC]` Blueprint §8, Mockup §2.3 | *Revocation UI deferred in V1;* the rule must not be violated by any manual path |
| BR-4 | **Credential requirements are data rows, never code branches** | `[SPEC]` MVP §7, §16.2 | Rules evaluated by iterating `requirements` |
| BR-5 | **No domain literal and no level branch anywhere in application code** | `[SPEC]` MVP §16.2 | A grep for the pilot domain slug outside seed files and content returns zero |
| BR-6 | **`skill_assertions` and assessment `responses` are insert-only. No UPDATE. Ever.** | `[SPEC]` MVP §9 rule 2 | Enforced in code; recommended additionally at the database privilege level `[INFERENCE]` |
| BR-7 | **Every credential and assessment mutation writes an `audit_log` row** | `[SPEC]` MVP §9 rule 3 | Same transaction as the mutation `[INFERENCE]` |
| BR-8 | **Assessment content is not readable by non-assessor, non-admin roles at the query layer** — not merely hidden in the UI | `[SPEC]` MVP §9 rule 7 | Repository/service layer, not the component layer |
| BR-9 | **`organisation_id` on every org-scoped table from commit one** | `[SPEC]` MVP §9 rule 1 | Schema + every query path |
| BR-10 | **One pass threshold (70%), no bands, no levels**; highest score across attempts retained | `[SPEC]` MVP §M5, DR-01 | Single comparison; `MAX()` across attempts |
| BR-11 | **⏸ DORMANT — no learner-facing AI feature ships in V1.** Retained governance requirement: any AI answering capability answers only from the corpus, always cites with a version stamp, and is disabled during assessment with the reason shown | `[SPEC]` M8, Blueprint §17.4 · deferred by DR-02 Decision 2 | AI service layer + assessment-context check — **when and if an AI capability is separately authorised.** This rule remaining documented is **not** a reason to build one |
| BR-12 | **Assessor approval requires verified experience + a calibration exercise + a signed conflict-of-interest undertaking**, recorded as an `assessor` role scoped to `credential_def` | `[SPEC]` MVP §15.5 | Replaces the unimplementable "one level above" rule |
| BR-13 | **Every assessment declares its AI-use policy**, visible before starting. V1 ships two tiers: `Restricted` (exam) and `Disclosed` (artifact) | `[SPEC]` MVP §3.3, Blueprint §13.6 | Required field on the assessment object |
| BR-14 | **Credentials are personally owned and portable** — they leave with the employee | `[SPEC]` Blueprint §14.4 | Credential ownership is the user, never the organisation |
| BR-15 | **Never the word "failed"** — "not yet", with remediation | `[SPEC]` MVP §5, Blueprint §25.6 | Content/UI layer |

## 1.6 Important non-functional requirements

| # | NFR | Requirement | Source |
|---|---|---|---|
| NFR-1 | **Assessment durability** | An assessment session must survive a page refresh and a brief network loss **without data loss**. "A lost exam is a refund, a support case, and a reputational hit" | `[SPEC]` Blueprint §26.5 |
| NFR-2 | **Verification permanence** | An issued credential must **remain verifiable indefinitely**. *(Refined 2026-08-30, ADR-039: the architectural requirement is a **permanent credential identifier**; the URL is served from a deliberately chosen domain with a redirect-based migration path, not treated as literally immutable.)* Links are printed on CVs and shared publicly, so a retired domain is retained and redirecting | `[SPEC]` M7, §16.3 |
| NFR-3 | **Accessibility** | WCAG 2.2 AA minimum, keyboard-complete, captions and transcripts on video, **never colour alone** to convey meaning | `[SPEC]` Blueprint §22.11, §25.2 |
| NFR-4 | **SEO** | Knowledge articles, glossary and the verification page are server-rendered and indexable — they are the acquisition surface and the growth loop | `[SPEC]` MVP §9, N03/N04/P16 |
| NFR-5 | **Measurability** | The funnel must be measurable from day one; **artifact submission rate** is the single most important number in the business | `[SPEC]` MVP §12.1, Blueprint App. A |
| NFR-6 | **Assessment SLA** | 10 working days, ≥90% compliance — publicly displayed, therefore operationally real and **must be instrumented** | `[SPEC]` MVP §12.1 G3, Mockup §21 |
| NFR-7 | **Multi-tenancy** | Org isolation from commit one; an org admin sees only their own organisation | `[SPEC]` MVP §9 rule 1, Mockup §2.3 |
| NFR-8 | **Localisation readiness** | UI strings externalised in V1 (not localised) so extraction later does not touch every file | `[SPEC]` MVP §2 cross-cutting |
| NFR-9 | **Concurrency shape** | Read-heavy overall; **assessment is the spiky, latency-sensitive workload** because cohort exams concentrate load into narrow windows | `[SPEC]` Blueprint §26.6 |
| NFR-10 | **Restart resilience** | Guardrails Service Restart Test: all services restart, all caches cleared — the product and its data continue functioning | `[SPEC]` `CLAUDE.md` / Guardrails §13 |
| NFR-11 | **Team reality** | Buildable by **1–2 developers plus a designer, AI-assisted, in ~14–18 weeks**. Architecture must be sized for that team, not for a platform organisation | `[SPEC]` MVP §9 |
| NFR-12 | **Low-bandwidth tolerance** | A real and large regional segment. *(Its former anchor `C05` is demoted by DR-02; the requirement stands and now applies to programme, session and materials surfaces — and, `[INFERENCE]`, matters more for live online delivery than it did for pre-recorded content)* | `[SPEC]` Mockup §20.1 #10 (tagged P2, *design for it now*) |

## 1.7 Dependencies between major modules

```
                       ┌───────────────────────────┐
                       │ M1 Identity & Accounts    │  (scoped roles — everything depends on this)
                       └────────────┬──────────────┘
        ┌───────────────────────────┼────────────────────────────┐
        ▼                           ▼                            ▼
┌───────────────┐          ┌─────────────────┐          ┌──────────────────┐
│ M2 Skills &   │◀────────▶│ M3 Content &    │◀────────▶│ M4 Knowledge     │
│    Diagnostic │  skill   │    Learning     │  cites   │    Library       │
└───────┬───────┘ mappings └────────┬────────┘          └────────┬─────────┘
        │                           │                            │ corpus
        │ assertions                │ progress                   ▼
        │                           │                   ┌──────────────────┐
        │                           │                   │ M8 AI Tutor ⏸ DEF│
        │                           │                   └──────────────────┘
        ▼                           ▼
┌────────────────────────────────────────────┐
│ M5 Assessment (exam)                       │──┐
└────────────────────────────────────────────┘  │  requirement results
┌────────────────────────────────────────────┐  │
│ M6 Evidence & Assessor Workflow ★          │──┤
└────────────────────────────────────────────┘  │
                                                ▼
                                   ┌──────────────────────────┐
                                   │ M7 Credentials           │
                                   │ requirements-as-data →   │
                                   │ issuance → verification  │
                                   └──────────────────────────┘
┌────────────────────────────────────────────────────────────────┐
│ M9 Corporate: orgs · cohorts · attendance · progress · packs    │
│   reads from M1, M3, M5, M6, M7 — writes attendance & seats     │
└────────────────────────────────────────────────────────────────┘
```

**Hard build-order dependencies `[INFERENCE]` from `[SPEC]` MVP §10:**

1. **M1 before everything** — scoped roles and tenancy are foundational.
2. ~~**M4 before M8**~~ — **⏸ moot while M8 is deferred.** The dependency was real and would return with any future tutor; it constrains nothing today.
3. **M2 skill list before M3 programme mapping** — skills are the spine that programmes, items and requirements all attach to (`[SPEC]` Mockup §18.3).
4. **M5 and M6 before M7** — credential issuance evaluates their outputs as requirement rows.
5. **M9 depends on all of the above** for its progress table and evidence pack, but on none of them for orgs/seats/cohorts/attendance, which can be built in parallel.
6. **`[INFERENCE]` M3's programme and scheduled-offering concepts precede registration, and registration precedes attendance capture.** This ordering did not exist before DR-02 and is now the spine of both journeys — see ADR-043.
6. **The real critical path is not engineering** — the skill list, diagnostic questions, item bank, brief + 3 variants, the rubric, and the 3 exemplars are expert authoring work that must run *in parallel*, not after (`[SPEC]` MVP §10).

---

# PART 2 — RECOMMENDED SYSTEM ARCHITECTURE

> Everything in Part 2 is **PROPOSED**. See `ARCHITECTURE_DECISION_REGISTER.md` for the decision IDs, alternatives and approval requirements.

## 2.1 Architectural stances for the MVP

> **Renumbered 2026-08-30.** These were previously `AP-1`…`AP-10`. The `AP-` prefix now belongs exclusively to the durable, technology-independent principles in [`ARCHITECTURE_PRINCIPLES.md`](ARCHITECTURE_PRINCIPLES.md) (**AP-01…AP-10**, adopted as ADR-041). To avoid one identifier carrying two meanings, the MVP-specific list below is renumbered **`AS-1`…`AS-8`** ("architectural stances"). The renumbering is recorded rather than silently applied, per AP-09.
>
> **The relationship:** AP-01…AP-10 are durable and survive any technology change. AS-1…AS-8 are how those principles are applied *to this MVP, with this stack, at this stage* — and they are expected to evolve as the product does.

| # | Stance | Why | Derives from |
|---|---|---|---|
| AS-1 | **One deployable application, one database** | `[SPEC]` MVP §9. Sized for 1–2 developers. Module boundaries are folders with enforced import rules, not network hops | AP-01 |
| AS-2 | **Module boundaries are real even inside the monolith** | Assessment logic imports nothing from marketing code; extracting a service later is then a day's work, not a rewrite `[SPEC]` MVP §9 | AP-01 |
| AS-3 | **The database is the only source of truth** | Cache is rebuildable, never authoritative (Guardrails §13) | AP-02, AP-05 |
| AS-4 | **Append-only where defensibility matters** | Skill assertions, exam responses, audit log. These must be defensible years later `[SPEC]` | AP-08 |
| AS-5 | **Rules as data, not branches** | Credential requirements, AI-use policy, domain — all read from rows `[SPEC]` §16 | AP-06 |
| AS-6 | **Parameterise now, populate with one value** | `domainId` parameters and `/learn/[domain]/…` routes exist from day one even with one value `[SPEC]` §16.2–16.3 | AP-06 |
| AS-7 | **Buy undifferentiated infrastructure; build the trust asset** | Never build auth, video, payments, email. Do build the assessment engine, the credential rules engine, the artifact/assessor workflow `[SPEC]` Blueprint §26.7 | AP-01, AP-06 |
| AS-8 | **Public surface is server-rendered and cacheable; the app is authenticated and dynamic** | SEO and the growth loop depend on it `[SPEC]` | AP-02, AP-04 |

*(The former `AP-9` "honest capability" and `AP-10` "architecture stability" are not stances specific to this MVP — they are durable project principles, and now live as **AP-07** and **AP-10** in [`ARCHITECTURE_PRINCIPLES.md`](ARCHITECTURE_PRINCIPLES.md).)*

## 2.2 High-level component model

```
┌────────────────────────────────────────────────────────────────────────────┐
│                     ONE DEPLOYABLE WEB APPLICATION                          │
│                                                                             │
│  ┌───────────────────────┐   ┌──────────────────────────────────────────┐  │
│  │ PUBLIC SURFACE        │   │ AUTHENTICATED APPLICATION                │  │
│  │ SSR/SSG · cacheable   │   │ Learner · Assessor · Corp · Admin        │  │
│  │ home · diagnostic ·   │   │ dashboard · programme · session view ·   │  │
│  │ knowledge · glossary ·│   │ candidacy · artifact workspace ·         │  │
│  │ credential detail ·   │   │ assessor workbench · org console ·       │  │
│  │ VERIFICATION PAGE     │   │ admin console                            │  │
│  └───────────────────────┘   └──────────────────────────────────────────┘  │
│  ─────────────────────── server actions / typed route handlers ──────────── │
│                                                                             │
│  ┌──────────┬──────────┬──────────┬───────────┬──────────┬───────────────┐ │
│  │ identity │ skills & │ content  │ assessment│ evidence │ credentialing │ │
│  │ & access │ diagnos. │ &learning│  (exam)   │ &assessor│ & verification│ │
│  ├──────────┼──────────┼──────────┼───────────┼──────────┼───────────────┤ │
│  │ knowledge│ ai svc   │ corporate│ commerce  │ platform admin · audit ·  │ │
│  │ library  │ (RAG)    │&compliance│& payments│ jobs · notifications      │ │
│  └──────────┴──────────┴──────────┴───────────┴──────────┴───────────────┘ │
│         module boundaries enforced by import rules, not by network          │
└───────────┬──────────────────────────┬───────────────────┬─────────────────┘
            │                          │                   │
     ┌──────▼───────┐        ┌─────────▼────────┐   ┌──────▼──────────────┐
     │ PostgreSQL   │        │ Object storage   │   │ External services   │
     │ + pgvector   │        │ (S3-compatible)  │   │ auth · email ·      │
     │ + full-text  │        │ artifacts ·      │   │ payments · video ·  │
     │ SOURCE OF    │        │ evidence packs · │   │ Claude · errors ·   │
     │ TRUTH        │        │ badges · uploads │   │ analytics           │
     └──────────────┘        └──────────────────┘   └─────────────────────┘
            ▲
     ┌──────┴────────────────────────────────────┐
     │ scheduled invocation → `jobs` table drain  │  (email · evidence pack · article indexing)
     └───────────────────────────────────────────┘
```

## 2.3 Frontend architecture

**Recommendation `[SPEC]`-aligned:** Next.js App Router + TypeScript + React, Tailwind with Radix/shadcn primitives, driven by design tokens.

| Aspect | Recommendation | Rationale |
|---|---|---|
| Rendering | **Server components by default**; client components only where interaction requires it | The knowledge library, glossary, credential detail and verification page are the SEO and growth surface `[SPEC]` NFR-4 |
| Public pages | Static or incrementally revalidated | Read-heavy; cheap; fast `[SPEC]` Blueprint §26.6 |
| Authenticated pages | Dynamic, server-rendered with server actions for mutations | Avoids a second API surface for a 1–2 person team |
| Design system | **Tokens first** — colour, type, space, radius, motion — exported to code; light **and** dark first-class; RTL-capable structure | `[SPEC]` Blueprint §25.7. Learners read for long stretches |
| Signature components | `CredentialCard`, `SkillMeter`, `MilestoneTimeline`, `RubricPanel`, diagnostic canvas — built **before any screen** | `[SPEC]` MVP §10 Phase 1A week 1 |
| Strings | **Externalised from the first commit**; no user-visible string literal in a component | `[SPEC]` NFR-8 |
| Assessment runner | Client state for the current item, **server-persisted responses on every answer**; autosave, resumable | `[SPEC]` NFR-1. See ADR-021 |
| Artifact workspace | Rich text + file upload with **autosave to the server**, never browser-only draft state | `[SPEC]` M6; Guardrails §13 |
| Accessibility | WCAG 2.2 AA verified per component; value labels alongside colour; `prefers-reduced-motion` respected | `[SPEC]` NFR-3 |
| Low bandwidth | Transcript-first fallback and aggressive image optimisation designed in, even if the toggle ships later | `[SPEC]` Mockup §20.1 #10 |

**Phase 1A direction — RESOLVED 2026-08-30 (was OQ-1).** By human direction, Phase 1A is **a production-grade vertical slice built on this architecture**, not a design-only prototype. The frontend work in Phase 1A is therefore real: real routes, real server components, real persistence. See §2.14 and **ADR-036**.

## 2.4 Backend architecture

| Aspect | Recommendation | Rationale |
|---|---|---|
| Shape | **Modular monolith** — one deploy, module folders with enforced boundaries | `[SPEC]` MVP §9; Blueprint §26.1 agrees this is correct for phase 1 |
| Language | TypeScript end to end | One language for a 1–2 person team `[SPEC]` |
| Layering | route/action → **service (business rules)** → repository (data access) → database | `[INFERENCE]`. BR-1, BR-8 and BR-11 must live in the service/repository layers so the UI cannot be the enforcement point |
| Integrity guards | Conflict-of-interest (BR-1), assessment-content visibility (BR-8), append-only writes (BR-6), audit emission (BR-7) implemented as **shared, unavoidable guards**, not per-screen checks | `[INFERENCE]` from `[SPEC]` non-negotiables |
| Module extraction readiness | Assessment and credentialing modules must have **no inbound imports from marketing/content code** | `[SPEC]` MVP §9; Blueprint §26.1 names these as the eventual separate services |
| Idempotency | Payment webhooks, credential issuance, evidence-pack generation and job execution must be **safely re-executable** | `[INFERENCE]` from Guardrails §23 |

## 2.5 API approach

**Recommendation:** **Server actions for in-app mutations + typed route handlers for everything with an external caller.** No separate API service in V1.

| Consumer | Interface |
|---|---|
| The app's own UI | Server actions (typed, colocated) |
| Payment provider webhooks | Route handler, signature-verified, idempotent |
| Scheduled job invocation | Route handler, authenticated by a shared secret |
| Public credential verification | A **server-rendered page** at a permanent URL. A JSON representation is `[INFERENCE]` desirable but **not required in V1**; the verification API is explicitly a future item `[SPEC]` Blueprint §21 |
| CSV import/export (seats, roster, reports) | Route handlers |

**Conflict to resolve — CONF-3:** Blueprint §26.2 recommends "tRPC or typed REST"; MVP Spec §9 states "Server actions + typed route handlers. No separate API service. tRPC optional, not required." **The MVP Spec is authoritative for what gets built first**, so server actions are recommended. Recorded as ADR-004.

## 2.6 Database approach

**Recommendation:** **A single managed PostgreSQL instance** as the sole source of truth, with `pgvector` for RAG embeddings and Postgres full-text search for the ~30-article corpus.

- `[SPEC]` "One database. No microservices, no graph database, no event bus, no message broker, no LRS, no vector store until the tutor needs one" (MVP §9).
- `[SPEC]` "No graph database. 35 skills in a flat table" — even the full DAG later is a recursive CTE.
- `[SPEC]` Relational integrity matters for credentials and assessments; this is the reason Postgres is chosen over anything document-shaped.
- **`[INFERENCE]`** Migrations must be reviewable, forward-only in production, and separate from seed data (`[SPEC]` §16.2 rule 5: seed data lives in seed files, not migrations).

**No physical schema is proposed here.** Conceptual entities are in `DATA_ARCHITECTURE.md`. **Creating the physical schema is a RED-gate action requiring explicit approval** (`CLAUDE.md` Rule 1).

## 2.7 Authentication and authorisation

| Aspect | Recommendation | Status |
|---|---|---|
| Authentication | **Do not build auth.** Use a managed library or provider supporting email/password + Google, email verification, password reset | `[SPEC]` MVP §9 · provider choice **PENDING** (ADR-006) |
| Session storage | Server-verifiable sessions; **session loss must never lose business state** | `[INFERENCE]` NFR-10 |
| Authorisation model | **Scoped many-to-many RBAC**: `user_roles(user_id, role, scope_type, scope_id)`. Never a `role` column on `users` | `[SPEC]` — non-negotiable |
| Enforcement | At the **service/repository layer**, not the UI. Tenancy filter (`organisation_id`) applied in the data-access layer so it cannot be forgotten | `[INFERENCE]` from BR-8, BR-9 |
| Integrity constraints | BR-1 (assessor conflict of interest), BR-2 (no automated award), BR-3 (two-person revocation) | `[SPEC]` |
| Privileged access | MFA for platform admin; all admin actions audit-logged | `[SPEC]` Blueprint §26.5 — **`[ASSUMPTION]`** that MFA is in scope for V1 given only internal admins exist; requires confirmation |
| SSO / SCIM | **Explicitly deferred**; the chosen provider should make it a later configuration, not a rewrite | `[SPEC]` M9 deferred list |

## 2.8 File and document storage

**Recommendation:** S3-compatible object storage with **signed, short-lived URLs**; no file content in the database; database holds metadata and object keys only.

| Content | Sensitivity | Notes |
|---|---|---|
| Candidate artifact submissions | **Restricted** — assessed evidence | Signed URLs only; access limited to the candidate, the assigned assessor, platform admin |
| Evidence packs (HRD Corp zip) | Confidential — contains cohort PII | Generated by a background job; retained for the funding claim period |
| Badge PNG / PDF certificate | Public by design | Referenced from the public verification page |
| Lesson downloads, diagrams | Public / enrolled | Cacheable |
| Profile photos | Personal data | |
| Video | **Not stored here** — managed provider `[SPEC]` "Never build video" | |

**`[INFERENCE]`** Uploads must be virus/type-validated and size-capped, and the object store must never be publicly listable.

## 2.9 Background jobs

**Recommendation `[SPEC]`:** **A `jobs` table plus a scheduled invocation route. Not a queue service.**

> "Only three jobs exist: send email, generate evidence pack, index article." — MVP Spec §9

| Property | Requirement | Source |
|---|---|---|
| Durability | Job state lives in Postgres, so **a restart loses nothing** and an in-flight job is retried | `[INFERENCE]` NFR-10, Guardrails §25 |
| Idempotency | Every job handler must be safely re-executable | `[INFERENCE]` Guardrails §23 |
| Failure handling | Attempt counter, last error, dead-letter state, admin visibility | `[INFERENCE]` Guardrails §24 |
| Observability | Job outcomes are logged and monitorable — the SLA depends on emails actually being sent | `[INFERENCE]` NFR-6 |

**Conflict to resolve — CONF-1:** Blueprint §26.2 recommends "Redis + a durable job queue"; MVP Spec §9 explicitly rejects a queue service for V1. **MVP Spec wins.** Recorded as ADR-010, with the Blueprint position retained as the Phase 2 destination.

## 2.10 Caching

**Recommendation:** **No Redis in V1.** Caching is limited to layers that are provably rebuildable:

| Layer | Use | Safe because |
|---|---|---|
| Static/ISR page cache | Public marketing, knowledge articles, glossary, credential detail | Regenerated from the database on demand; loss costs latency only |
| HTTP/CDN cache | Public assets, badge images | Immutable or revalidated |
| In-request memoisation | Repeated reads inside one request | Lifetime is one request |
| RAG retrieval results | Cost control on the tutor | Recomputable from `pgvector`; loss costs money, not correctness |

**Prohibited by Guardrails §13 and `CLAUDE.md` Rule 6:** exam timers, assessment answers, submission drafts, progress, seat/roster state, feature configuration, or job state held only in memory, browser storage, or cache. Every one of these is business-critical state and must be database-backed. See `DATA_ARCHITECTURE.md` §6 for the full Service Restart Test.

**Conflict CONF-2:** Blueprint §26.2 lists Redis for "sessions, rate limits, background jobs, **assessment timers**". Assessment timers in a cache would fail the Service Restart Test. **Recommendation: the authoritative exam clock is a server-side `started_at` timestamp in Postgres**, with the client showing a derived countdown. Recorded as ADR-011/ADR-021.

## 2.11 Notifications

**Recommendation:** V1 ships **transactional email only**, driven through the `jobs` table.

`[SPEC]` MVP §3.2 defers the notifications centre; §2 cross-cutting requires transactional email. In-app, push and Slack/Teams are Blueprint §18.21 scope, deferred.

Minimum V1 email set `[INFERENCE]` from the journey: email verification · password reset · purchase receipt · candidacy window opened · submission received · **assessor assignment** · **decision issued** · credential awarded · seat invitation.

**Added by DR-02 `[INFERENCE]`** — scheduled delivery makes several messages operationally load-bearing rather than optional: **registration confirmation** · **joining details for a scheduled offering** *(the participant cannot attend without them — see ADR-044)* · **session reminder** · **schedule change or cancellation notice**. These are a genuine consequence of the corrected model and are recorded here rather than discovered during implementation. **No provider is selected** (ADR-015 remains deferred), and **`[ASSUMPTION]`** the exact message set is confirmed when the notification work is scoped.

**`[INFERENCE]`** Because the 10-working-day SLA is publicly displayed (NFR-6), assessor-facing notification is not cosmetic — it is part of the SLA mechanism and must be reliable and observable.

## 2.12 Deployment architecture

Summarised here; full detail in `DEPLOYMENT_ARCHITECTURE.md`.

- **One application deployment** + **one managed PostgreSQL** + **one object store** + external services.
- **Stateless application instances** — all state in Postgres or object storage, so any instance can be replaced at any time (`[SPEC]` Guardrails §15).
- **Three environments** proposed: development, staging, production `[INFERENCE]` — staging matters because payment, email and credential issuance must be exercised without touching real credentials.
- **Region selection is an open question** with PDPA and corporate-buyer implications (OQ-6).

## 2.13 Observability and monitoring

| Concern | Recommendation | Rationale |
|---|---|---|
| Error tracking | A hosted error tracker on both server and client | `[SPEC]` MVP §9 cross-cutting |
| Product analytics | Funnel instrumentation on the §5 journey, with **artifact submission rate as the headline metric** | `[SPEC]` NFR-5, G1 |
| SLA instrumentation | Time from submission to decision, measured and reportable — the SLA is published, so it must be measured, not estimated | `[SPEC]` NFR-6 |
| Structured logs | Request-scoped, with actor and entity, excluding assessment content and PII | `[INFERENCE]` |
| Audit trail | **Not observability** — `audit_log` is business data in Postgres, separate from logging | `[SPEC]` BR-7 |
| Uptime | External check on the public verification page and the app | `[INFERENCE]` NFR-2 |
| Job health | Queue depth, failure count, oldest pending job | `[INFERENCE]` §2.9 |
| AI cost | Per-feature spend visibility with alerting | `[SPEC]` Blueprint §26.6 |

## 2.14 Phase 1 — dual-track validation

**Human direction, 2026-08-30 (ADR-040).** Phase 1 runs **two tracks in parallel**. They validate different risks, and **neither replaces the other**.

| | **Track A — Product Experience Validation** | **Track B — Technical Vertical Slice** |
|---|---|---|
| **Purpose** | Validate whether users understand, value and can successfully navigate the key product proposition and the critical user experiences defined in the authoritative specifications | Validate the production architecture through the smallest meaningful real end-to-end workflow |
| **Risk addressed** | *Building something nobody wants, or nobody understands* | *Building it on foundations that do not hold* |
| **Centre of gravity** | `P06` gap report · `K06` artifact workspace · `K08` result and feedback · `P16` public verification — the four screens MVP Spec §7 says carry the entire argument | Authentication, authorization, persistence, restart behaviour |
| **Exit criteria** | MVP Spec §10, **preserved unchanged**: strangers articulate the difference from a course marketplace unprompted · target-persona learners say the gap report told them something new · a corporate buyer asks the price · the owner is willing to be judged on `K06` | The workflow below runs end to end on real infrastructure, survives a full restart, and is covered by appropriate automated tests |
| **Depends on** | Nothing pending — **can start immediately** | Approval of the foundational, quality and implementation decisions (Groups 2–4) |
| **ADR** | ADR-040 | ADR-036, scoped by ADR-040 |

### Track B — the slice

*Restated 2026-08-31 by founder decision (ADR-036). The superseded wording — "…enrolment → access to a real lesson → progress persistence…" — came from the self-paced model retired by `DR-02`.*

```
authentication → authorisation → programme discovery
  → scheduled offering selection → registration
  → access to programme and session details
  → participation / state persistence → supporting materials access
  → SERVICE RESTART / RECOVERY → APPROPRIATE AUTOMATED TESTING
```

**Boundaries (binding, per ADR-036):** no lesson-player journey · no video-progress semantics · no self-paced assumption · **"participation / state persistence" is deliberately neutral** and means only that workflow position survives a restart · **nothing here infers attendance, completion or enrolment as a certification requirement** — that remains open (`OQ-21`).

**What each step actually proves about the architecture:**

| Step | Architectural claim under test |
|---|---|
| Authentication | ADR-006 — the bought provider works, and **identity attributes and roles live in our database, not the vendor's** |
| Authorization | ADR-020 / AP-04 — scoped RBAC enforced at the service and data-access layer, not in the UI. The first real test of the model both specifications call the most expensive thing to get wrong |
| Dashboard | ADR-002/003 — server rendering, design tokens, light and dark, accessible primitives |
| Programme discovery | ADR-023 / AS-6 — programmes read through a **`domainId` parameter**, rendered from data, **no domain literal anywhere**. Directly verifiable by grep |
| Scheduled offering selection | ADR-043 — the conceptual delivery model holds: a programme has dated, formatted instances, and they are readable |
| Registration | ADR-005 / AP-02 — a real transactional write; the first business record. **Capacity is a recognised business concern**, not an implementation detail *(mechanism deliberately undesigned — ADR-043)* |
| Access to programme and session details | ADR-002 / ADR-044 — session information and joining details are held and presented by the portal; **live delivery infrastructure is external and no vendor is chosen** |
| Participation / state persistence | AP-05 — the participant's workflow position resumes from the database, never from browser storage. **Deliberately neutral: it proves durability, and defines no certification requirement** (`OQ-21`) |
| Supporting materials access | ADR-026 / `DR-02` §5 — materials attach to a programme and **prepare, extend, reinforce or document** delivery. **No video pipeline, no lesson progression, no completion-by-watching** |
| **Service restart resilience** | **AP-02, AP-03, AP-05 made executable rather than asserted** (`TESTING_ARCHITECTURE.md` §6) |
| **Automated testing** | ADR-038 — the Tier 1 rules are covered at the layer that can actually prove them |

### Two things this model makes explicit

1. **Neither track may be reported as satisfying the other's criteria.** A working slice is not evidence that anyone wants the product; enthusiastic user feedback is not evidence that exam responses survive a restart. Completion reports state each track separately.
2. **Scope discipline is Track B's main risk.** A vertical slice that grows sideways stops being a slice. The line above is the boundary.

### What neither track changes

The specification's real critical path is unaffected by both: the skill list, diagnostic questions, item bank, the brief and its three variants, **the rubric** and **the three exemplars** are expert authoring work that must run in parallel — not after either track. MVP Spec §10 is explicit that this, not engineering, is what actually gates the pilot.

---

# PART 3 — SPECIFICATION CONFLICTS IDENTIFIED

Per `CLAUDE.md` ("If specifications conflict, identify the conflict and request clarification"), these are surfaced rather than silently resolved. In each case the MVP Build Spec is authoritative for build scope, but the human should confirm.

**The full register — with reasons and approval requirements — is now maintained in [`CONFLICT_RESOLUTION_REGISTER.md`](CONFLICT_RESOLUTION_REGISTER.md).** The table below is the summary; the register is authoritative.

| ID | Conflict | Blueprint says | MVP Spec says | Recommended resolution |
|---|---|---|---|---|
| CONF-1 | Background work | Redis + durable job queue (§26.2) | `jobs` table + cron route, **not** a queue service (§9) | MVP Spec — ADR-010 |
| CONF-2 | Cache / assessment timers | Redis for sessions, rate limits, jobs, **assessment timers** (§26.2) | No cache service named (§9) | No Redis in V1; server-side timestamp is the authoritative clock — ADR-011, ADR-021 |
| CONF-3 | API style | tRPC or typed REST (§26.2) | Server actions + typed route handlers (§9) | MVP Spec — ADR-004 |
| CONF-4 | Auth capability | Managed provider with OIDC/SAML/SCIM (§26.2) | Auth.js or Clerk; SSO later (§9) | MVP Spec, but **choose a provider whose SSO path is configuration, not migration** — ADR-006 |
| CONF-5 | Badging standard | Open Badges 3.0 / W3C VC as **MVP** (§26.3) | `public_uid` + verification page + OB **2.0** metadata; VCs deferred to 1C/Phase 2 (§13.1, M7) | MVP Spec. **Do not claim OB3.0 conformance before it is true** — ADR-018 |
| CONF-6 | Proctoring | Third-party integration, "never build proctoring" (§26.2) | **No proctoring vendor in V1** (M5, §13.1) | MVP Spec — ADR-019 |
| CONF-7 | xAPI / LRS | xAPI emit at MVP (§26.3) | No LRS/xAPI; an `events` table, emit xAPI-shaped payloads later (§9) | MVP Spec — ADR-024 |
| CONF-8 | Service decomposition | Three independent services from day one (§26.1) | One deployable, three folders with clean boundaries (§9) | MVP Spec, with boundaries enforced so extraction stays cheap — ADR-001 |
| CONF-9 | Skill count | 40–60 skill nodes (§next-steps 3, Mockup §20.3 #5) | ~35 skills (M2) | Low impact; content decision, not architectural. Flag only |
| CONF-10 | Search | Postgres FTS **+ pgvector hybrid** (§26.2) | Postgres full-text (§9) | Compatible — pgvector is present for RAG regardless; hybrid search is an enhancement, not a new dependency — ADR-013 |

---

*End of overview. Companion documents: `TECHNOLOGY_STACK.md`, `ARCHITECTURE_DECISION_REGISTER.md`, `DATA_ARCHITECTURE.md`, `INTEGRATION_ARCHITECTURE.md`, `SECURITY_ARCHITECTURE.md`, `DEPLOYMENT_ARCHITECTURE.md`.*
