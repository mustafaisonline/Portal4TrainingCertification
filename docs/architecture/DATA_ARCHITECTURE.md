# Data Architecture — Conceptual

> **Status: DRAFT — conceptual only.** PostgreSQL as the primary relational datastore is approved as *direction* (ADR-005, 2026-08-30); the persistence, immutability and audit model is approved (ADR-022). **No physical schema is approved, and creating one remains a RED gate** (`CLAUDE.md` Rule 1).
> **Created:** 2026-08-30 · **Version:** 0.1
> **This document contains NO physical schema.** No tables, columns, types, keys, indexes or migrations are defined here, and none may be created without explicit human approval (`CLAUDE.md` Rule 1 — RED gate).
> It describes **business domains, likely persistent entities, conceptual relationships, ownership boundaries, data classification, persistence requirements and recovery considerations** only.

---

## 1. Business domains (bounded contexts)

Eleven conceptual domains. These are the module boundaries of ADR-001 — folders with enforced import rules inside one deployable, not services.

| # | Domain | Owns | Consumes from |
|---|---|---|---|
| D1 | **Identity & Access** | People, credentials-to-sign-in, scoped role assignments, consent | — |
| D2 | **Skills & Diagnostics** | The skill list, diagnostic instruments, skill assertions | D1 |
| D3 | **Programmes, Delivery & Supporting Materials** *(renamed by DR-02)* | **Programmes, scheduled offerings, sessions, registrations**, delivery modality and location context, expert association, capacity; supporting-materials hierarchy; participation state | D1, D2 (skill mappings), D9 (organisation scoping for private cohorts) |
| D4 | **Knowledge (Body of Practice)** | Articles, article versions, glossary terms, changelog | D2 (skill links) |
| D5 | **Knowledge Assessment** | Item bank, forms, attempts, responses, scoring | D1, D2 |
| D6 | **Evidence & Assessor Workflow** ★ | Assignments, brief variants, rubrics, submissions, evaluations | D1, D5 (readiness), D9 (cohort conflict check) |
| D7 | **Credentialing & Verification** | Credential definitions, requirements, candidacies, issued credentials, public verification | D5, D6 (requirement outcomes) |
| D8 | **Commerce & Payments** | Products/prices, orders, payment records, refunds | D1, D7 (candidacy fee), D9 (org invoices) |
| D9 | **Organisations & Compliance** | Organisations, memberships, seats, **private-cohort scoping**, attendance records, evidence packs | D1, D3, D5, D6, D7 (read-only) |
| D10 | **AI Services — ⏸ DEFERRED** | *(Not built in V1. Retained design: tutor sessions, retrieval context, prompt versions, eval runs.)* **No AI capability ships; none is substituted** | D4 (corpus only) — dormant |
| D11 | **Platform Administration** | Settings, feature configuration, jobs, notifications, **audit log**, data-subject requests | all (writes audit for) |

**Ownership rule `[INFERENCE]`:** a domain reads another domain's data **through that domain's interface**, never by reaching into its tables. This is what makes the eventual extraction of D5/D6/D7 (Blueprint §26.1's "assessment & credentialing service") a day's work rather than a rewrite.

### 1.1 The delivery model — conceptual, added by DR-02 (ADR-043)

> **⚠ Conceptual only. No physical schema exists, none is proposed here, and creating one remains a RED gate under `CLAUDE.md` Rule 1.** No table, column, type, key, index or migration is defined anywhere in this section. The concepts below name *what the business is about*; how they are stored is a separate, separately-approved act.

Before DR-02 the architecture had no representation of scheduled, expert-led delivery. Cohorts, sessions and attendance existed **only inside D9**, scoped to organisations — appropriate when corporate was a "thin slice", misleading now that delivery is the product.

```
    PROGRAMME                    a designed, expert-led learning experience with stated
        │                        outcomes. The thing a person chooses.
        │                        Domain-scoped. Count is NOT fixed (DR-02 §4.1).
        ▼
    SCHEDULED OFFERING           a specific dated instance of a programme.
        │                        Carries: delivery modality · location or online
        │                        delivery context · capacity · assigned expert(s) ·
        │                        organisation scope where private.
        │                        The thing a person registers for.
        ├──< REGISTRATION >──── a person's place in a specific offering
        │                        (individually, or by invitation into a private cohort)
        ▼
    SESSION                      a single delivery occasion within an offering.
        │                        The unit ATTENDANCE is captured against.
        └──< ATTENDANCE >────── existing concept; unchanged; correction trail required

    SUPPORTING MATERIALS         attach to a programme (and optionally to a session).
                                 Prepare · extend · reinforce · document.
                                 They never replace delivery (DR-02 §5).
```

**The nine concepts this establishes, and nothing more:** programme · scheduled offering · session · delivery modality · location or online delivery context · expert association · participant registration · **capacity as a recognised business concern** · participation/attendance. Supporting materials attach to the first.

**Deliberately NOT designed here, per AP-11 (simplicity before scale):** no scheduling engine · no calendar system · no booking workflow · no seat-allocation algorithm · no optimisation · no recurrence rules · no waitlist mechanics · no logistics or travel model. **Capacity is named as a business concern; the mechanism for enforcing it is not designed.**

**Relationship to existing concepts:**

| Existing | Disposition |
|---|---|
| `cohorts`, `sessions`, `attendance` (D9) | **Already exist.** A private cohort is a scheduled offering scoped to an organisation — not a separate concept. Re-homed to D3 as delivery objects; organisation scoping stays a D9 concern |
| `enrolments` (D3) | **Insufficient alone.** It binds a person to a path/course, not to a *dated instance with capacity*. Registration is the missing relationship `[INFERENCE]` |
| Content hierarchy (path/course/module/lesson/block) | **Subordinated, not destroyed.** Becomes programme curriculum and supporting materials |
| `organisation_id` tenancy | **Unchanged and sufficient.** Private cohorts are already covered by the approved tenancy model |
| `BR-1` assessor conflict of interest | **Unchanged.** `D6 → D9 (cohort conflict check)` already existed; expert-to-offering association is what makes it computable for public offerings `[INFERENCE]` |

**`[OPEN — OQ-21]` Participation and certification.** Whether, and how, programme participation forms part of the credential requirement model is **deliberately unresolved** (DR-02 §6). Nothing in this section resolves it: **participation is modelled here as a delivery fact, not as a certification input.** No third requirement type is proposed, requirements-as-data is untouched, and **attendance, completion and enrolment must not be inferred as certification requirements** from anything above.

**Critical boundary `[SPEC]`:** D5's item content and D6's evaluations-in-progress are **not readable** by D3, D9 or D10 at the query layer — not merely hidden in the UI (BR-8). D10 (AI) may retrieve **only** from D4, and must be inert during an active D5 session (BR-11).

---

## 2. The conceptual spine

**`[SPEC]`** Mockup §18.3: *everything hangs off the skill.* Course outcomes, exam items, credential requirements, knowledge articles and learner assertions all point at the same skills — which is why gap analysis, the skills profile and (later) the corporate heatmap are one query at different aggregations rather than four features.

```
                          ┌───────────┐
                          │   SKILL   │  ← the spine (flat list in V1, ~35 rows, domain-scoped)
                          └─────┬─────┘
   ┌───────────┬───────────┬────┴────┬────────────┬──────────────┐
   ▼           ▼           ▼         ▼            ▼              ▼
CONTENT     EXAM ITEM   REQUIREMENT  KNOWLEDGE  DIAGNOSTIC   SKILL ASSERTION
mapping                              ARTICLE     question       (append-only,
                                                                with provenance)
                                                                      ▲
   ┌──────┐                                                           │
   │ USER │──< role assignment (scoped) >── role                      │
   └──┬───┘──< skill assertion >───────────────────────────────────────┘
      ├──< registration >── SCHEDULED OFFERING ──< session >──< attendance >
      │                          └── of a PROGRAMME ──< supporting materials >
      ├──< progress >── lesson
      ├──< candidacy >── credential definition ──< requirement >
      │        └──▶ CREDENTIAL (issued) ──▶ public verification (permanent uid)
      ├──< assessment attempt >── form ──< response >── item
      ├──< submission >── assignment ── brief variant
      │        └──< evaluation >── assessor + rubric
      ├──< organisation membership >── ORGANISATION ──< cohort >──< session >──< attendance >
      └──< order / payment >
```

**`[SPEC]` Domain is data, never a constant.** A `domains` table exists with one seeded row; skills, paths, courses, articles, forms, diagnostics and credential definitions all reference it. No application code contains the pilot domain slug.

---

## 3. Entity classification

Conceptual entity families, classified as requested. **Names are indicative of concepts, not proposed table names.**

### 3.1 Core entities
The things the business is *about*. Long-lived, referenced everywhere, and their loss would end the product.

| Entity | Domain | Notes |
|---|---|---|
| **Person / user account** | D1 | `[SPEC]` One person, one account, always. Candidate is a *state*, not a separate account |
| **Organisation** | D9 | The tenant boundary. `organisation_id` appears on every org-scoped entity from commit one |
| **Knowledge domain** | D2 | One seeded row in V1; everything domain-scoped references it |
| **Skill** | D2 | ~35 flat rows, grouped by area. No prerequisites, no decay, no altitude in V1 |
| **Credential definition** | D7 | Exactly one in V1; carries inert `level`, `sort_order`, `version` |
| **Issued credential** | D7 | The product's output. Carries a **globally unique, persistent identifier that never changes for the life of the credential** (ADR-039) — independent of any URL, domain or presentation format. Personally owned and portable; never owned by an organisation (BR-14) |
| **Content hierarchy** (path → course → module → lesson → block) | D3 | Five levels, one hierarchy; each independently addressable and versioned |
| **Knowledge article** | D4 | Public SEO surface, credibility surface and participant reference. *(Its former role as the AI tutor's corpus lapses while `M8` is deferred)* |

### 3.2 Supporting entities
Structure and definition around the core. Change rarely; authored rather than generated.

| Entity | Domain | Notes |
|---|---|---|
| Scoped role assignment | D1 | `(user, role, scope_type, scope_id)` — **never a role column on the person** |
| Skill-to-content mapping | D2/D3 | What teaches what |
| Diagnostic instrument + questions | D2 | 20 fixed questions, two branch points, "I'm not sure" unpenalised |
| Assessment form definition | D5 | One fixed form in V1 |
| Item (exam question) | D5 | **Restricted content class** |
| Assignment / brief variant | D6 | One brief, three hand-written industry variants, assigned round-robin |
| Rubric (criteria × levels) | D6 | 5 × 4, published *before* purchase; carries all grade differentiation in V1 |
| Exemplar artifact | D6 | Three real exemplars — un-fakeable, per `[SPEC]` §11.2 |
| Credential requirement | D7 | **Rows, not code.** `exam_threshold` \| `artifact` |
| **Programme** | D3 | Added by DR-02. Domain-scoped. **Count deliberately not fixed** (DR-02 §4.1) |
| **Scheduled offering / cohort** | D3 | Added by DR-02. Dated instance: modality · location or online context · capacity · assigned expert · organisation scope where private. *A private cohort is an offering scoped to an organisation, not a separate concept* |
| Session | D3 *(was D9)* | A single delivery occasion; the unit attendance is captured against |
| **Expert association** | D1/D3 | Which expert delivers which offering. Makes `BR-1` computable for public offerings `[INFERENCE]` |
| Seat / invitation | D9 | Single and CSV invite |
| Product / price | D8 | MYR + USD only |
| Glossary term | D4 | ~60 terms |
| Notification template | D11 | Externalised alongside UI strings |

### 3.3 Transactional entities
Generated by user activity; the highest-volume and most operationally critical data.

| Entity | Domain | Volume shape | Special property |
|---|---|---|---|
| Enrolment | D3 | Low | |
| **Registration** | D3 | Low | Added by DR-02. A person's place in a specific scheduled offering. **Capacity is a recognised business concern; no allocation mechanism is designed** (ADR-043) |
| **Participation state** | D3 | Medium | Added by DR-02. The participant's position in the programme workflow. **Deliberately neutral — a delivery fact, not a certification input** (`OQ-21`) |
| Progress record | D3 | High | Resume-to-the-second `[SPEC]` |
| **Skill assertion** | D2 | Medium | **Append-only with provenance** (source, evidence reference, asserted_at). Never updated |
| Diagnostic result | D2 | Medium | Anonymous results held for a limited period `[SPEC]` Blueprint §8 R1 (30 days) |
| **Assessment attempt** | D5 | Spiky — cohort exams concentrate load | Server-authoritative `started_at` is the clock (ADR-021) |
| **Assessment response** | D5 | Spiky, high | **Immutable.** Written as answered, never at the end |
| **Submission** (artifact) | D6 | Low volume, **highest value** | Autosaved server-side; files in object storage |
| **Evaluation** | D6 | Low | The trust record: per-criterion level **and written reasoning**, plus the decision |
| Candidacy | D7 | Low | A state machine; the entity the whole journey turns on |
| Order / payment record | D8 | Low | Our record is authoritative for entitlement, not the provider's |
| Attendance record | D9 | Medium | **Retrospective correction requires an audit trail** `[SPEC]` |
| Evidence pack | D9 | Low | Generated artifact + a record of what it contained |
| ~~Tutor session / message~~ | D10 | ⏸ **Not in V1** | Deferred with `M8`; retained as the design |
| Job | D11 | Medium | State in the database so restarts lose nothing |
| Learning event | D11 | High | The `events` table; xAPI-shaped payloads derivable later (ADR-024) |

### 3.4 Reference / configuration entities
Values the product reads to decide behaviour. **All must be persistent — configuration that exists only because the application was previously running is forbidden** (`CLAUDE.md` Rule 6).

| Entity | Domain | Notes |
|---|---|---|
| Knowledge domain rows | D2 | Seeded, not constants |
| Role definitions | D1 | Roles at launch (DR-02): **participant** *(was learner)*, **expert** *(the trainer role, promoted to a real role with a public profile)*, assessor, org_admin, platform_admin |
| Requirement type values | D7 | `exam_threshold`, `artifact` |
| AI-use policy values | D5/D6 | Two tiers in V1: `Restricted` (exam), `Disclosed` (artifact) `[SPEC]` |
| Pass threshold (70%) | D5 | **`[INFERENCE]` Should be configuration data, not a constant** — the specification treats banding as removable and thresholds as product policy |
| Funding scheme profile (HRD Corp) | D9 | Defines pack contents; **must be verifiable against current e-TRIS rules** (OQ-8) |
| Platform settings / feature configuration | D11 | Database-backed, survives restart |
| ~~Prompt version registry~~ | D10 | ⏸ **Not in V1** — deferred with `M8` |

### 3.5 Audit and history entities
Existence is the point; they are written once and never edited.

| Entity | Domain | Requirement |
|---|---|---|
| **Audit log** | D11 | `[SPEC]` Every credential and assessment mutation writes a row — actor, action, entity, before/after — **in the same transaction as the mutation** (ADR-022) |
| Article version + changelog entry | D4 | Powers the version stamp, the public changelog, and version-pinned citations |
| Content version fields | D3 | Present from day one, read by nothing beyond display in V1 |
| Skill assertion history | D2 | The append-only assertion sequence *is* the history — no separate table |
| Assessment response record | D5 | Immutable by construction |
| Attendance correction trail | D9 | `[SPEC]` explicitly required |
| Evaluation record | D6 | Immutable once issued; a changed decision is a new record |
| Data-subject request log | D11 | PDPA export/delete handling |

---

## 4. Data ownership boundaries

| Boundary | Rule | Source |
|---|---|---|
| **Tenant** | Every org-scoped entity carries `organisation_id`; an org admin can read only their own organisation's rows. The filter is applied in the data-access layer so it cannot be forgotten | `[SPEC]` BR-9, NFR-7 |
| **Person vs employer** | Issued credentials, skill assertions and the learning record belong to the **person**. They survive the employment relationship ending | `[SPEC]` Blueprint §14.4 |
| **Manager visibility** | An org admin sees progress and status for their own organisation, with an explicit privacy boundary on the individual view (`O03`) | `[SPEC]` MVP §6 |
| **Assessment content** | Item content is owned by D5 and readable only by assessor and platform-admin roles at the query layer | `[SPEC]` BR-8 |
| **Assessor conflict of interest** | An assessor may not evaluate a submission from a cohort they instructed — a database-backed check, enforced in code from day one | `[SPEC]` BR-1 |
| **Candidate artifact** | The candidate's own professional work. Visible to the candidate, the assigned assessor and platform admin. Publicly linked from a verification page **only with holder consent** | `[SPEC]` Blueprint §12.6 (consent), `[INFERENCE]` for V1 scope |
| **Payment instrument data** | **Never stored.** Tokenised at the processor | `[SPEC]` Blueprint §26.5 |
| **AI corpus** | The tutor retrieves **only** from D4 published articles — never from items, submissions or evaluations | `[SPEC]` BR-11 |

---

## 5. Data classification

| Class | Contents | Handling |
|---|---|---|
| **Public** | Knowledge articles, glossary, changelog, credential definition and rubric, exemplars (anonymised), issued-credential verification page | Cacheable, indexable, no authentication |
| **Internal** | Content drafts, skill mappings, aggregate progress, platform settings | Authenticated, role-scoped |
| **Confidential — personal** | Name, email, photo, country, target role, enrolments, progress, skill assertions, attendance, order history | PDPA/GDPR data-subject rights apply: export and delete (`S06`) |
| **Confidential — commercial** | Organisation records, seats, cohort rosters, evidence packs, pricing | Tenant-isolated |
| **Restricted — assessment integrity** | Item content, correct answers, unreleased forms, responses, in-progress evaluations | `[SPEC]` "leakage destroys the item bank". Query-layer restriction; no analytics content capture (ADR-035); excluded from logs |
| **Restricted — candidate evidence** | Artifact submissions and files, assessor reasoning before release | Signed URLs, narrow access, retained for defensibility |
| **Never stored** | Card numbers, bank credentials | Tokenised at the processor |
| **Not present in V1** | Proctoring recordings, biometric data, identity documents | A direct consequence of ADR-019 — a meaningful privacy simplification |

---

## 6. Persistence requirements — the Service Restart Test

> **"If all application services restart right now and all caches are cleared, will the product and its important data continue functioning correctly?"**

Applied to every category of state the product holds. **Every row below must answer YES.**

| # | State category | Where it must live | Survives restart | Notes |
|---|---|---|---|---|
| 1 | Business records (users, orgs, content, credential definitions) | PostgreSQL | ✅ | |
| 2 | **Participation state** (position in the programme workflow; resume point) | PostgreSQL, written as it changes | ✅ | *Reframed by DR-02: this was "lesson position, resume-to-the-second", a media concept. The durability requirement is unchanged; what is persisted is programme/session position, not playback position* |
| 3 | Enrolments | PostgreSQL | ✅ | |
| 4 | **Examination attempts, including the clock** | PostgreSQL — `started_at` is the authoritative clock | ✅ | ADR-021. A client or cache timer would fail this test |
| 5 | **Examination responses** | PostgreSQL, insert-only, written per answer | ✅ | Never batched to the end of the session (NFR-1) |
| 6 | Examination results and per-skill breakdown | PostgreSQL; derived values recomputable from responses | ✅ | Highest score across attempts retained |
| 7 | **Artifact submission drafts** | PostgreSQL (text) + object storage (files), autosaved | ✅ | **Browser-only draft state is forbidden** — Rule 6 |
| 8 | Evaluations and assessor reasoning | PostgreSQL, immutable once issued | ✅ | |
| 9 | **Certificates / issued credentials** | PostgreSQL (record) + object storage (badge PNG, PDF) | ✅ | Verification page must be regenerable from the record alone |
| 10 | Payments and entitlement | PostgreSQL, reconciled against the provider | ✅ | Provider is a source of *events*, not of truth |
| 11 | Workflow state (candidacy state machine, submission state, cohort state) | PostgreSQL | ✅ | No workflow state in memory |
| 12 | Configuration (thresholds, scheme profiles, role definitions, domain rows) | PostgreSQL, seeded from seed files | ✅ | "No important configuration may exist only because the application was previously running" |
| 13 | User preferences (theme, notification settings, accommodations flag) | PostgreSQL | ✅ | Client storage may *mirror* theme for first paint only |
| 14 | Notifications (queued email) | `jobs` table in PostgreSQL | ✅ | An unsent SLA email must not be lost on restart |
| 15 | **Background job state** | `jobs` table with attempts, last error, terminal state | ✅ | ADR-010 |
| 16 | **Audit records** | PostgreSQL, same transaction as the mutation | ✅ | ADR-022 |
| 17 | Feature configuration / flags | PostgreSQL | ✅ | |
| 18 | Attendance and corrections | PostgreSQL with a correction trail | ✅ | |
| 19 | Evidence packs | Object storage + a database record of contents | ✅ | Reproducible (ADR-033) |
| 20 | ~~AI tutor conversation and citations given~~ | ⏸ **N/A in V1** | — | Deferred with `M8`. Retained as the design if an AI capability is ever separately authorised |
| 21 | Sessions (sign-in) | Provider- or database-backed | ✅ for business state | **`[INFERENCE]`** Losing sessions logs users out — an inconvenience, not data loss. Acceptable, and must be *stated* rather than assumed |

### 6.1 Proposed use of cache and temporary memory — and why each is safe

| Use | Contents | Why it is safe |
|---|---|---|
| Static / ISR page cache | Public marketing, knowledge articles, glossary, credential detail | Regenerated from PostgreSQL on demand. Loss costs latency only |
| CDN / HTTP cache | Static assets, badge images | Immutable or revalidated; the origin object is authoritative |
| In-request memoisation | Repeated reads within one request | Lifetime is a single request; nothing survives it by design |
| ~~RAG retrieval cache~~ | ⏸ **N/A in V1** — deferred with `M8`. Retained: recomputable from `pgvector`; loss would cost money and latency, never correctness |
| Client component state | Current exam item on screen, unsaved keystrokes between autosaves | **Bounded by the autosave interval**, which must be short. This is the only place where a small loss window exists, and it must be an explicit, stated design parameter |
| Browser storage | Theme preference for first paint | A mirror of a database value, never the source |

**Explicitly forbidden**, per `CLAUDE.md` Rule 6 and Guardrails §13: exam timers, exam answers, submission content, progress, seat or roster state, workflow state, feature configuration, or job state held **only** in memory, browser storage or cache.

**`[OPEN QUESTION] OQ-11:** what is the acceptable maximum loss window for unsaved exam and artifact keystrokes (the autosave interval)? This is a product decision with a real user consequence and should not be inferred.

---

## 7. Retention, backup and recovery considerations

### 7.1 Retention `[ASSUMPTION]` — every duration below requires human decision

The specifications require documented retention schedules (Blueprint §26.5, §18.24) but **do not state durations**. These are proposed as a starting point for discussion, **not as requirements**:

| Data | Proposed retention | Rationale |
|---|---|---|
| Anonymous diagnostic results | 30 days | The only duration the specifications actually state (Blueprint §8 R1) |
| Assessment responses | Life of the credential + defence period | Needed to defend a credential decision years later |
| Artifact submissions and evaluations | Life of the credential + defence period | The evidence behind the credential |
| Issued credential records | **Indefinite** | The verification URL is permanent (NFR-2); deletion of the account must not break verification |
| Audit log | Indefinite, or a stated long period | Its purpose is retrospective defensibility |
| Attendance and evidence packs | The funding-claim audit period | **Requires verification against HRD Corp rules** (OQ-8) |
| Personal profile data | Until deletion is requested | PDPA data-subject right |
| ~~Tutor conversations~~ | ⏸ **N/A in V1** | Deferred with `M8`; the retention position stands if an AI capability is ever authorised |

**`[SPEC]` tension to resolve:** account deletion must be honoured (PDPA) **while issued credentials remain verifiable** (Mockup §20.1 #7 proposes anonymised survival). The conceptual answer is that a verification page can present a credential without exposing a deleted person's full profile — but **the exact policy is a human decision (OQ-12)**, not an AI inference, because it sits between a legal obligation and a public trust claim.

### 7.2 Backup and recovery (see also ADR-031)

| Concern | Requirement |
|---|---|
| Database backup | Managed automated backups with point-in-time recovery |
| Object storage | Versioning enabled on artifact and evidence-pack buckets; deletion protection on issued-credential assets |
| **Restore rehearsal** | A restore must be **performed and documented**, not assumed. An untested backup is an assumption |
| RPO / RTO | **`[OPEN QUESTION] OQ-10`** — not stated anywhere. Assessment windows and the published SLA make this a real business question |
| Cross-domain consistency | A database restore and an object-store rollback can diverge; the recovery procedure must state how a submission record without its file (or vice versa) is detected and reconciled `[INFERENCE]` |
| Irreversibility | Issued credentials and sent emails cannot be un-issued or un-sent by a restore. This is the strongest argument for a staging environment (ADR-029) |

---

## 8. What this document deliberately does not do

- It does **not** define tables, columns, types, keys, indexes or constraints.
- It does **not** propose a migration.
- It does **not** authorise creating a database.
- It does **not** convert the MVP Spec §8 table sketch into a physical design — that sketch is the specification's own conceptual guidance, and turning it into a schema is a separate, approval-gated act.

**Physical schema creation remains a RED-gate decision requiring explicit human approval.**
