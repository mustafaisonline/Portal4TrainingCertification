# DECISION RECORD DR-02 — EXPERT-LED DELIVERY MODEL

**Status:** **APPROVED — 2026-08-31.** Binding on all three root specifications.
**Supersedes:** every prior statement positioning this product as a self-paced course platform, a browsable course catalogue, or a professional association / standards body.
**Companion to:** `DR-01 — ONE CREDENTIAL`, which this record does not disturb.
**Triggered by:** founder vision clarification of 2026-08-30 / 2026-08-31, and the Vision Alignment Audit of 2026-08-31.
**Location:** This record is deliberately **standalone at the repository root**. `DR-01` sits inside `DATA_AI_ACADEMY_MVP_BUILD_SPEC.md`; DR-02 does not, because it is cross-cutting — it affects organisation identity, product model, delivery model, portal role, certification relationship, corporate model, MVP scope and mockup direction. Binding a cross-cutting strategic decision to one downstream specification would misplace it. Downstream specifications reference and reconcile with this record; they do not contain it. *(Approved location, A-1. Changes only by an explicit documentation-governance decision.)*

---

## The misalignment being resolved

This is a real defect in the documented product model, not a wording problem. The specifications describe a business the founder is not building.

| Document | Location | What it says | Status |
|---|---|---|---|
| `MVP_BUILD_SPEC.md` | §5 | The primary journey is: visitor → diagnostic → account → dashboard → **lesson player (repeat)** → exam → artifact → credential | superseded |
| `MVP_BUILD_SPEC.md` | §4 | *"**Instructor** is deliberately not a distinct V1 role… do not build an instructor portal"* | superseded |
| `MVP_BUILD_SPEC.md` | §2 M9 | Corporate is a *"Thin Slice"* running alongside the product | superseded |
| `MVP_BUILD_SPEC.md` | whole document | **Zero** occurrences of "self-paced", "in-person", "face-to-face", "live session" or "workshop". Seven occurrences of "video" | the measurable form of the defect |
| `BLUEPRINT.md` | §4, §A2 | *"Accredited partners — independent providers licensed to teach toward our credentials… This is the scaling mechanism; do not attempt to teach the world yourself"* | superseded |
| `BLUEPRINT.md` | §21.1 | *"Become the reference standard for AI capability… governed by an independent standards council"* | superseded |
| `MOCKUP_SPEC.md` | §4 `P11`, §6 `C01`/`C05` | Faceted course catalogue sorted by "most enrolled"; course landing with rating and price; lesson player as ★ *"where learners spend most of their time"* | superseded |
| Built mockup | `PublicShell.tsx` footer | *"Accreditation — Governance & standards council"* | superseded |

**The two drifts, named.** The documentation drifted in two directions at once, and they pull against each other: toward a **professional association** (a standards body that examines while accredited partners teach) and toward a **course marketplace** (a catalogue of self-paced content consumed through a video player). Neither is the business. The business is expert-led training whose outcome is provable.

**Why this was not visible earlier.** The `P01` Homepage in `project-artifacts/mockup/` implements `MOCKUP_SPEC.md` §4 faithfully, section by section. The implementation was correct; the specification it implemented was not. Correcting the Homepage without correcting the specifications would have produced a better-looking version of the same misidentification.

---

## 1. The organisation — refined vision

> **We are an independent professional training and certification organisation focused on data and AI capability development.**
>
> **Our core value comes from expert practitioners and expert-led delivery — through live online sessions, face-to-face programmes, and tailored corporate engagements.**
>
> **We are not a mass online course marketplace or a library of pre-recorded content. Digital resources support the learning experience; expert-led learning is the core experience.**
>
> **The portal supports the ecosystem. It is not assumed to be the place where all learning happens.**
>
> **Our differentiation combines practitioner expertise, live learning, real enterprise context, applied evidence and meaningful certification into one coherent experience.**
>
> **We build our own independent identity and certification ecosystem. We are not replicating a professional association, and we are not competing as another online learning marketplace.**

**The organisation is a training and certification organisation** — not a consulting firm that also trains, and not an association. The word *practice* is deliberately not used to describe it.

### We are

Independent · focused on data and AI capability development · expert-led · practitioner-informed · live and human-centred · practical and applied · capable of face-to-face delivery · capable of live online delivery · capable of corporate and private cohort engagements · capable of international and on-site delivery · focused on meaningful assessment and demonstrated capability · building our own identity and ecosystem.

### We are not

Another DAMA · a professional association replica · a standards body as our primary strategic destination · a chapter-first organisation · a mass online course marketplace · a Udemy / Coursera / Edureka-style business · a video-first learning platform · a generic LMS · a self-paced content consumption platform.

---

## 2. The expert-led delivery model

Four delivery forms. All are first-class; none is a variant of a self-paced default.

| Form | Description |
|---|---|
| **Face-to-face programmes** | Professional instructor-led training delivered physically — public programmes, private cohorts, workshops, and organisational training. |
| **Live online programmes** | Real-time instructor-led online sessions. The value is direct interaction, questions, discussion, practical examples, guided learning, expert feedback, and peer interaction where appropriate. **This is not watching video online, and must never be represented as such.** |
| **Corporate / private engagements** | Organisations engage us for private cohorts, team capability development, customised programmes, dedicated workshops, on-site delivery, and live online delivery. |
| **International / on-site delivery** | Expert-led delivery at a client's location, including internationally. |

**Commercial policy is deliberately not defined here.** Travel, accommodation, per diem, visa and venue arrangements are agreed with the client under the engagement model. The requirement DR-02 establishes is structural only:

> The business model and the product must be **capable of supporting** expert-led training delivered at client locations internationally. Delivery format and location must be representable; the commercial terms are not invented in advance.

---

## 3. The role of the portal

```
        LIVE / PHYSICAL LEARNING EXPERIENCE          ← where learning happens
                        +
              DIGITAL PORTAL SUPPORT                 ← what the portal does
```

**The portal makes the organisation discoverable, bookable, operable and provable. It is not a content-consumption destination.**

| The portal is responsible for | Happens outside the portal |
|---|---|
| Discovering programmes, formats, outcomes, dates and locations | **The teaching itself** — the room, the live session, the discussion |
| Exploring the experts who deliver | Expert judgement applied to a participant's own situation |
| Registration and booking; corporate enquiry | Commercial negotiation for private and international engagements |
| Joining information, schedule, roster, attendance | Delivery logistics, travel, venue |
| Supporting materials (§5) | |
| **Applied-work submission, assessment, credential, verification** | |
| The participant's professional record and progress | |
| Corporate cohort management, progress view, evidence pack | |

**Priority order for the MVP portal:** (1) discovery and credibility → (2) scheduling and commercial entry → (3) evidence and certification → (4) cohort operations → (5) supporting materials.

Content delivery is fifth. That ordering is the decision.

---

## 4. The programme model

The unit of the product is a **programme**, not a course.

```
    FROM                                  TO
    Course                                Programme               a designed, expert-led
      ↓                                     ↓                     learning experience with
    Lessons                               Scheduled offering      stated outcomes
      ↓                                     ↓                     (format · date · location ·
    Self-paced consumption                Live delivery            capacity)
                                            ↓
                                          Supporting materials    (§5)
                                            ↓
                                          Applied work
```

**Vocabulary established by this record** (concepts only — no physical schema is defined or authorised here; schema creation remains a RED gate under `CLAUDE.md` Rule 1):

| Concept | Meaning |
|---|---|
| **Programme** | A designed, expert-led learning experience with stated outcomes. The thing a participant chooses. |
| **Scheduled offering / cohort** | A specific instance of a programme: format, dates, location or platform, capacity, assigned expert. The thing a participant registers for. |
| **Session** | A single delivery occasion within a cohort. The unit attendance is captured against. |
| **Supporting materials** | See §5. Attached to a programme; never a standalone catalogue. |

**The existing content hierarchy is subordinated, not destroyed.** `Path → Course → Module → Lesson → Block` survives as the **curriculum structure of a programme and the materials that support it**, governed by the boundary in §5. It stops being the product a participant consumes.

### 4.1 Launch portfolio — a principle, not an inventory

**No fixed programme count is encoded anywhere.** `DR-01`'s "one learning path" discipline concerned the **credential**; programme count and credential count are separate concerns and must not be conflated.

> **V1 should support a deliberately small and credible portfolio of genuine flagship programmes and scheduled offerings. Launch inventory is a commercial and content decision, not an architectural constraint.**

Consequently:

- **No artificial large catalogue**, and no catalogue depth presented as a value signal.
- **No fabricated programme inventory** — programmes and dates shown must be genuine.
- **No fixed programme count encoded into architecture, schema or specification.** The model must accommodate one programme or several without redesign.
- Mockups may use a **small, realistic set** for demonstration purposes, clearly identified as fixture data.

**Retired by this record:** the browsable course catalogue as an identity and as a value signal; catalogue depth as a claim; course counts as a credibility signal; self-paced consumption as the primary journey; the lesson player as the screen where participants spend most of their time; video-first content as the delivery mechanism. *(Decision A-2.)*

---

## 5. Supporting materials — the boundary

Digital resources are **not** banned. This section exists to prevent the self-paced course-marketplace model returning through the back door.

**Supporting materials may include, where appropriate:** presentation materials · reading resources · templates · exercises · case studies · reference resources · practice activities · session preparation material · post-session reinforcement material · **selected recordings of live sessions where appropriate**.

**The binding principle:**

> **Supporting materials may prepare for, extend, reinforce, or document expert-led learning. They must not silently replace expert-led delivery as the primary programme experience.**

Applied concretely:

- A recording of a live session **documents** delivery that happened. It is not a pre-recorded course, and it must never be presented, priced or navigated as one.
- Materials attach to a programme. They do not form a browsable library that can be consumed on its own path to a credential.
- The test for any proposed material: *does this prepare for, extend, reinforce or document expert-led learning — or does it substitute for it?* Substitution requires an explicit decision, not an implementation choice.

*(Decision A-4.)*

---

## 6. Certification relationship

```
    EXPERT-LED PROGRAMME PARTICIPATION
              +
    REQUIRED LEARNING ACTIVITIES
              +
    MEANINGFUL ASSESSMENT
              +
    APPLIED EVIDENCE / ARTIFACT
              ↓
    CREDENTIAL / CERTIFICATION
```

**Confirmed:** there is **no purely self-paced route to the core credential in V1.** The V1 credential pathway is meaningfully connected to an expert-led programme and to demonstrated capability.

**Equally confirmed — the counterweight:**

> **Successful participation in the relevant expert-led programme is part of the V1 credential pathway. Participation or attendance alone does not earn the credential.**

We do not build a weak certification model in which *"you attended the training, therefore you are certified."* That failure mode is as damaging as the one this record corrects.

**Explicitly rejected models:** `watch videos → take exam → receive certificate`, and `attend training → receive certificate`.

**Implementation boundary — deliberately held open.** This record captures the **policy principle only**. It does **not** introduce a schema change, and it does **not** add a third technical requirement row beside the existing assessment requirements. How programme participation is represented in the credential model — and whether it is enrolment, attendance, or completion of required activities — is assessed later, during controlled downstream architecture and specification reconciliation. *(Decision A-3.)*

**Unchanged by this record:** the assessment machinery itself — the published brief and its variants, the published rubric, the three real exemplars, the applied-artifact workspace, the qualified human assessor, per-criterion written reasoning, the credential, and the permanent public verification page. `DR-01`'s single credential stands. Requirements-as-data stands.

---

## 7. The expert model

**Expert-led is a principle, not a person.** The organisation is designed to grow through a network of lead trainers, expert facilitators, subject-matter specialists, associate trainers and guest experts.

Two obligations, held together:

| Obligation | Meaning |
|---|---|
| **Honest representation** | If one genuine lead expert is delivering at launch, the product represents that truthfully. **No fabricated expert profiles**, ever — not for visual balance, not for marketing, not to appear larger. |
| **Expandable model** | The product model and architecture must support an expert network over time. **No founder-bound design.** Adding an expert must be a data operation plus content, never a redesign. |

```
    Current reality  →  show genuine available experts
    Future model     →  support an expandable expert network
```

**The expert / trainer role exists in the product from V1** — as a real role, with a public expert profile and minimal delivery operations (roster and attendance). The earlier instruction not to model an instructor role is superseded.

### 7.1 Credible assessment, and assessor capacity — two different things

These must not be conflated, and today's operating constraint must not become tomorrow's architectural doctrine.

| | Statement | Durability |
|---|---|---|
| **The principle** | Meaningful credentials continue to involve credible, qualified assessment. Certification must not collapse into automated content consumption plus certificate generation. | **Strategically durable.** Not weakened. |
| **The operating model** | How qualified assessor capacity is supplied, scaled and governed. | **Evolvable.** Explicitly not fixed by this record. |

> **The requirement for credible qualified assessment remains strategically important. The operating model for supplying and scaling assessor capacity remains evolvable.**

**What DR-02 changes here.** Business rule `BR-1` — an assessor may not evaluate a submission from a cohort they instructed — is a conflict-of-interest rule and is **not weakened**. Under DR-02 its practical consequence becomes more visible, because experts now teach the cohorts: an expert who delivers a cohort does not assess that cohort. That is a real operating consequence to plan around. It is **not** a permanent constraint on the business, and it must not be recorded as one.

### 7.2 Assessor supply after retiring chapters

`BLUEPRINT.md` §15.3 named the community contribution ladder as *"how the evidence-based credential model becomes economically viable."* With chapters and the contribution ladder retired as core assumptions (§1), that mechanism is withdrawn — and **must not remain silently embedded as the assumed long-term solution.**

**Directional hypothesis — not a finalised solution:**

```
    Initial state   →  qualified lead expert / assessor capacity
    Growth          →  qualified expert network
    Future scale    →  approved assessors governed by credential quality standards
```

**Deliberately not invented at this stage:** assessor economics · assessor compensation policies · accreditation processes · detailed governance workflows.

**Assessor scalability is recorded as an explicitly tracked strategic and operational issue requiring future resolution.** It is open, it is known, and it is not solved by this record. *(Decision A-6.)*

---

## 8. The corporate model

**Corporate training is a significant part of the business model, not an optional feature.** The description of it as a "thin slice" is superseded.

Both pathways are strategically first-class; their transactional complexity is not required to be equal.

| Pathway | MVP expectation |
|---|---|
| **Individual** | Discover programmes · understand outcomes · view dates and formats · register or book participation. Whether full online payment ships immediately remains dependent on the separate payment and commercial decision. |
| **Corporate** | Discover the corporate capability offering · understand engagement formats · initiate an enquiry · discuss requirements · progress toward a private cohort or tailored engagement. |

**Explicit scope boundary.** The MVP establishes a **credible corporate entry path**. It does **not** attempt to automate a B2B sales and engagement lifecycle. A complex corporate self-service workflow requires separate justification.

**Unchanged:** cohort management, attendance capture with a correction audit trail, the team progress view, and the HRD Corp evidence pack. These become *more* coherent under DR-02 — attendance registers, trainer profiles, course outlines and learning outcomes are inherently live-training artifacts.

---

## 9. Differentiation — D1 and D2 stand, D3 requires reassessment

`MOCKUP_SPEC.md` §1.4 and `BLUEPRINT.md` §1 state three differentiators. DR-02 changes their standing unevenly.

| | Differentiator | Standing under DR-02 |
|---|---|---|
| **D1** | Evidence over recall | **Stands, and is strengthened.** Expert-led delivery plus assessed applied work is a stronger form of the same claim. |
| **D2** | Living, versioned knowledge | **Stands.** The knowledge library, version stamps and changelog are retained. |
| **D3** | AI-native, not AI-flavoured | **Marked for reassessment. Does not survive unchanged.** |

**Why D3 cannot simply be preserved.** Its V1 evidence was the AI tutor, which is deferred (Decision 2). A differentiation strategy must not rest on functionality that is not in the product. Preserving D3 unchanged for documentation continuity would be exactly the kind of silent stale assumption this record exists to remove.

**Not designed here.** The replacement is **not** invented now. During downstream documentation correction, the revised differentiation is evaluated against the clarified strategic strengths: expert-led delivery · practitioner expertise · live interaction · practical learning · applied evidence · meaningful assessment · credible certification.

**Immediate consequence:** D3 must not be presented as a live differentiator in any specification, mockup or public surface until it has been reassessed. *(Decision A-5.)*

---

## 10. Confirmed founder decisions carried by this record

| # | Decision | Ruling |
|---|---|---|
| **1** | Purely self-paced route to the credential in V1 | **No.** Programme-anchored — and attendance alone is not sufficient (§6). |
| **2** | AI Tutor (M8) | **Deferred from MVP.** Not retired. Its original rationale — supporting an isolated, self-paced learner — no longer describes the product model. Returning it requires **separate strategic justification against the expert-led delivery model**. *"AI" being part of the subject domain is explicitly not a reason to force an AI tutor into the product.* |
| **3** | Individual vs corporate | **Both first-class**, with proportionate MVP transaction complexity. |
| **4** | Programmes and dates at launch | **Small, confident, deliberate** — as a principle, with no fixed count encoded (§4.1). |
| **5** | Expert network at MVP | **Design for a network; do not fabricate one.** |
| **6** | The "Academy" working name | **Retained as a temporary working placeholder. Not final.** It does not define the product model, must not imply a self-paced content library, and must not pull the organisation toward a marketplace identity. **Naming is not a prerequisite for this correction** and remains tracked as WBS work package 4.4.1. |

---

## 11. Applied concretely

The test for every downstream decision:

> **Learning is expert-led and scheduled. The portal makes it discoverable, bookable, operable and provable. Digital content supports it and never replaces it.**

- **Product** presents programmes with formats, dates and the experts who deliver them — never a catalogue, never a course count.
- **Journey** places live participation at the centre of the line, not a lesson player.
- **Roles** include the expert as a real, publicly visible role from V1.
- **Corporate** is a first-class pathway with an entry path, not an automated sales lifecycle.
- **Certification** requires programme participation *and* required learning activities *and* meaningful assessment *and* applied evidence. Never attendance alone.
- **Experts** are shown honestly today and supported as a network tomorrow.
- **Materials** prepare, extend, reinforce or document. They never substitute.
- **Language** never describes live online delivery as watching video. Terminology shifts from *learner* toward *participant* where a person is in a programme — presence is the point, and the vocabulary should carry it.

---

## 12. Supersession list — explicit and traceable

Every statement below is superseded or reframed by this record. Downstream correction work is scoped to this list.

### `DATA_AI_ACADEMY_MVP_BUILD_SPEC.md`

| Location | Current statement | Disposition |
|---|---|---|
| §1 | *"they enrol in one curated learning path… they work through it with an AI tutor grounded in a small knowledge library"* | **Superseded** — enrolment is into an expert-led programme; the tutor is deferred |
| §2 M3 | *"One curated path → 6–8 courses → modules → lessons → blocks… lesson player with resume, notes, transcript"* | **Reframed** — becomes programme curriculum and supporting materials, governed by §5 |
| §2 M4 | Knowledge library as SEO surface **and the tutor's corpus** | **Reframed** — retained as credibility, SEO and participant reference; the corpus dependency lapses with the tutor |
| §2 M8 | AI Tutor, scoped `must (one feature only)` | **Superseded** — deferred from MVP (Decision 2) |
| §2 M9 | *"Corporate **Thin Slice**"* | **Superseded** — corporate is strategically first-class; MVP workflow stays proportionate |
| §4 | *"**Instructor** is deliberately not a distinct V1 role… do not build an instructor portal"* | **Superseded** — the expert/trainer is a real role with a public profile |
| §5 | The user journey diagram, in full | **Superseded** — replaced by a programme-anchored individual journey and a corporate journey |
| §6 | Screen list and P0/P1 priorities — `C05` Lesson Player `P0`, `L14` AI Tutor `P0`, `P10`/`P12` course-shaped, no scheduling or expert screens | **Superseded** — re-derived from the corrected journeys |
| §8 | The 17-table conceptual model — no programme, scheduled offering, format, location or individual registration | **Extended** — conceptually only; physical schema remains a RED gate |
| §9 | Managed video provider as a named stack decision | **Deferred further** — no V1 dependency |
| §12.3 | *"Diagnostic → account conversion ≥ 25%"*, *"Path completion among enrolled learners ≥ 50%"* | **Superseded** — replaced by programme and cohort measures |
| §3.2, §3.3 | Chapters, partner programme, community listed as deferred | **Escalated** — retired as strategic destinations, not merely deferred |

### `DATA_AI_ACADEMY_PORTAL_BLUEPRINT.md`

| Location | Current statement | Disposition |
|---|---|---|
| Part A (framing) | The reference ecosystem analysed as a model to displace | **Reframed** — retained as a study of **credentialing mechanics only**; explicitly not an organisational template |
| §A2 | *"The strategic move is #2. The organisation deliberately does not monopolise teaching"* | **Superseded as strategy** — retained only as analysis of the reference ecosystem |
| §1 | *"A global, AI-native academy where any professional… can find… learn it in the shortest honest path"* | **Reframed** — replaced by §1 of this record |
| §1 | Differentiator **D3 — AI-native, not AI-flavoured** | **Marked for reassessment** — see §9 |
| §4 | *"Accredited partners — independent providers licensed to teach toward our credentials… the scaling mechanism"* | **Superseded** — inverts the confirmed model; reframed as a curated expert / associate-trainer network |
| §5 | Pillar 1 LEARN — modality list | **Reordered** — live-first |
| §10.5 | Modality table listing self-paced first, *"highest margin, lowest completion"* | **Reordered** — face-to-face, live online and blended corporate lead |
| §11.1 | Content object model `Program → Path → Course → Module → Lesson → Block` | **Subordinated** under programme and scheduled delivery |
| §14 | Corporate training model | **Retained and promoted** |
| §15 | Community — chapters, tiered chapter status, the contributor ladder as the assessor-supply engine | **Retired as a core assumption.** The assessor-supply consequence is addressed in §7.2 and remains an open tracked issue |
| §17.1 | AI Tutor as a learner-facing feature | **Deferred** (Decision 2) |
| §21.1 | *"Become the reference standard for AI capability… independent standards council… open standard, proprietary assessment"* | **Retired as strategic destination** |
| §21.6 | Federated regional academies — *"licensed regional operators"* | **Retired as strategic destination** |
| §26.2 | Managed video provider | **Deferred further** |

### `DATA_AI_ACADEMY_PORTAL_MOCKUP_SPECIFICATION.md`

| Location | Current statement | Disposition |
|---|---|---|
| §1.1 | *"seven things that normally live in seven separate products, into one coherent system"* | **Reframed** |
| §1.4 | Differentiator **D3 — AI-native, not AI-flavoured** | **Marked for reassessment** — see §9. D1 and D2 stand |
| §1.7 | Domain × altitude model — *"every filter, chip, and badge in the mockup uses these"* | **Split.** Domain survives as **subject scope and as seeded data** (required by `ADR-023`). Domain × altitude as a **catalogue faceting device**, and per-domain course counts, are **superseded** |
| §2 R6 | Instructor `[MVP thin / P2 full]` | **Promoted** — real role, public expert profile |
| §3.A | Routes `/learn/catalog`, `/learn/courses/[course]` | **Superseded** — programme-shaped routes |
| §4 `P01` | Hero, three doors, domain tiles with course counts, *"Start free diagnostic"* as the single dominant CTA | **Superseded** — pathway order becomes Explore Upcoming Programmes → Train Your Team → Assess Your Capability |
| §4 `P11` | Course Catalogue — faceted, sort by *"most enrolled"* | **Retired** — replaced by a short programme listing with dates |
| §6 `C01`/`P12` | Course landing — rating *"★ 4.8 · 214"*, price, *"Enrol now"* | **Reframed** — becomes programme detail: outcomes, formats, dates, locations, who teaches it |
| §6 `C05` | Lesson Player, ★ *"where learners spend most of their time"* | **Demoted** — supporting materials surface, governed by §5 |
| §6 `C06`, `C07` | Video Content, Reading Material as screens | **Deferred** |
| §5 `L01` | Dashboard led by a *"Continue"* (resume-your-lesson) card | **Reframed** — led by the participant's next session |
| §5 `L02` | My Learning — In progress / Not started / Completed / Archived | **Reframed** — programme participation |
| §11 `M01`–`M09` | Community, chapters, contribution centre | **Retired as core** |
| §12.1 `AI-1` | AI Learning Assistant as an MVP AI feature | **Deferred** |
| §13, §14 | 133-screen inventory; the 30-screen mockup scope | **Re-derived** from the corrected journeys |
| §15.2 | Public navigation — *Learn · Get Certified · For Organisations · Knowledge · Community · About* | **Re-derived** |
| §16 | Design direction — "precision, not decoration" | **Retained.** Add *human* and *expert-led* to the character keywords; otherwise unchanged |

### `project-artifacts/mockup/`

| Location | Current state | Disposition |
|---|---|---|
| `app/page.tsx` | `P01` implementing the pre-correction specification | **Redesign** — only after the specifications are corrected |
| `components/PublicShell.tsx` | Footer: *"Accreditation — Governance & standards council"*; nav *Learn · Certification · For organisations · Knowledge library* | **Superseded** |
| `docs/FINDINGS.md` F3 | Five domain tiles vs the three recommended for launch | **Superseded** by the programme model and §4.1 |
| Design tokens, `Button`/`Card`/`Chip`, `SkillMeter`, diagnostic canvas | Built and sound | **Retained unchanged** |

---

## 13. What DR-02 does **not** change

Recorded explicitly to prevent the correction being read as permission for a general rewrite.

**Product:** `DR-01` — one credential, no ladder, no bands · the artifact brief and its variants · the published rubric · the three real exemplars · `K06` artifact workspace · `A01`/`A03` assessor queue and workbench · `K08` result and per-criterion written reasoning · `K10` award · `P16` public verification and permanent credential identity · `L09` credentials · requirements-as-data · the diagnostic instrument itself · the knowledge library and changelog · the HRD Corp evidence pack · the "fake the machinery, never the judgement" discipline · the skill list, retained and reframed as the shared vocabulary linking programme outcomes, assessment, evidence and the team capability view.

**Architecture — no decision is reversed.** All twelve principles `AP-01`…`AP-12` · all forty-two records `ADR-001`…`ADR-042` · the modular monolith · PostgreSQL as sole source of truth · scoped many-to-many RBAC enforced at the data-access layer · append-only skill assertions and assessment responses · audit rows in the same transaction · `organisation_id` from commit one · the `jobs` table · the server-authoritative exam clock · the five testing layers and the Tier 1 workflow set · the security, deployment and integration architecture · `ADR-023`'s expansion shape, including `domains` as seeded data and never a constant.

**Governance:** `CLAUDE.md` · `AI_DEVELOPMENT_GUARDRAILS.md` · the approval gates · the RED-gate boundaries · the conflict resolution register (none of `CONF-1`…`CONF-10` is invalidated).

**Execution:** the Milestone 1 walking skeleton is unaffected. The expert authoring workstream remains the real critical path — its **outputs** shift toward programme design and session plans, but its priority and its status do not change.

**Two decisions become easier, not harder:** the video provider (`ADR-009`) loses its V1 relevance, and — with the tutor deferred — the embeddings provider, the AI data-processing agreement, RAG cost control and tutor rate-limiting all leave MVP scope.

---

## 14. Ambiguity decisions, and what remains open

### 14.1 Resolved by the founder, 2026-08-31

| # | Ambiguity | Resolution | Recorded in |
|---|---|---|---|
| **A-1** | This record's permanent location | Standalone root-level authoritative record. Not merged into the MVP Build Spec | Header |
| **A-2** | How many programmes in V1 | No fixed count encoded. A deliberately small, credible portfolio; launch inventory is a commercial/content decision | §4.1 |
| **A-3** | Is programme participation a formal credential requirement | Yes — but attendance alone is never sufficient. Policy captured; **no schema change and no third requirement row introduced yet** | §6 |
| **A-4** | What "supporting materials" means | Defined list plus a binding boundary: materials prepare, extend, reinforce or document — they must not silently replace expert-led delivery | §5 |
| **A-5** | Does differentiator D3 survive | No, not unchanged. Marked for reassessment; replacement not designed now; must not be presented as live until reassessed | §9 |
| **A-6** | Assessor supply after retiring chapters | Chapters retired as the assumed mechanism. Qualified expert networks recorded as the likely direction. Assessor scalability remains an explicitly tracked open issue | §7.2 |

### 14.2 Intentionally unresolved — tracked, not decided

| Item | Why it stays open |
|---|---|
| **Launch inventory** — which programmes, how many, on what dates | Commercial and content decision. The principle is set (§4.1); the inventory is not invented. |
| **How programme participation is represented in the credential model** | Requires controlled downstream architecture reconciliation. Schema creation remains a RED gate. |
| **The replacement for differentiator D3** | To be evaluated against the clarified strengths during downstream correction, not designed here. |
| **The assessor supply and scaling operating model** | A directional hypothesis only. Economics, compensation, accreditation and governance workflows are deliberately not invented. |
| **Online payment for individual registration** | Depends on the separate payment and commercial implementation decision (`ADR-014`, `OQ-2`). |
| **The precise corporate MVP workflow boundary** | The principle is set (§8); the specific screens follow downstream. |
| **Naming** | *"Data & AI Academy"* is a working placeholder. Tracked as WBS work package 4.4.1. Not a prerequisite for this correction. |

---

## 15. Status and downstream propagation

**This record is approved and authoritative. Nothing downstream has yet been corrected.** At the time of this commit, `DATA_AI_ACADEMY_MVP_BUILD_SPEC.md`, `DATA_AI_ACADEMY_PORTAL_BLUEPRINT.md`, `DATA_AI_ACADEMY_PORTAL_MOCKUP_SPECIFICATION.md`, `docs/architecture/`, `docs/execution/` and `project-artifacts/mockup/` all remain in their pre-correction state and continue to contain the superseded statements listed in §12.

Propagation is a separate, explicitly authorised stage, in this controlled sequence:

```
    MVP Build Specification          the binding scope contract — corrected first
              ↓
    Mockup Specification             IA, screen inventory, priorities, navigation
              ↓
    Blueprint                        vision layer and the strategic retirements
              ↓
    Architecture reconciliation      overview · data · integration
              ↓
    Consistency sweep                catalogue · self-paced · lesson player ·
                                     standards council · chapters · partners
              ↓
    Project plan / WBS               Track A sequence · authoring outputs
              ↓
    P01 Homepage redesign            only after the specifications are corrected
```

Until each stage is authorised, the superseded statements remain physically present in those documents. **This record, not their current text, is authoritative on every point listed in §12.**

---

*Decision record DR-02. Companion to DR-01. Approved 2026-08-31.*
