# DATA & AI ACADEMY — PORTAL BLUEPRINT

**Document type:** Strategic + architectural blueprint, build-ready
**Version:** 1.0
**Date:** 2026-08-29
**Owner:** Mustafa Qizilbash — Your Partner Technologies
**Status:** Pre-design. Intended as the single input brief for a UI/UX design AI or an AI coding agent producing the first complete portal mockup.

---

## HOW TO READ THIS DOCUMENT

| Part | Sections | Purpose |
|---|---|---|
| **Part A** | A1–A6 | Reverse-engineered analysis of the reference ecosystem (DAMA International). Patterns and strategy only — no content, wording, branding, visual design, navigation or proprietary frameworks reproduced. |
| **Part B** | 1–26 | The original platform blueprint. This is the buildable deliverable. |

**Originality statement.** Part A extracts *structural and strategic patterns* — the kind of thing any competitive analyst would write on a whiteboard. No text, imagery, framework diagram, taxonomy, navigation tree, or brand element from the reference site is reproduced here or carried into Part B. Where the reference model is described, it is described in our own words and immediately critiqued. Part B is an independent design whose taxonomy, credential ladder, module set, journeys, and information architecture were derived from *our own* market position, existing course IP, and target segments — not from the reference site's structure. Two deliberate divergences are load-bearing: **evidence-based credentialing over exam-only credentialing**, and **a living versioned knowledge base over a multi-year static canon**.

---

# PART A — REFERENCE ECOSYSTEM ANALYSIS

## A1. What the reference ecosystem actually is

Stripped of branding, the reference organisation is not a training company. It is a **standards-and-trust body that happens to sell an exam**. That distinction explains almost every structural decision it makes.

It solves one fundamental problem: *in a discipline with no licensure, no accredited degree pathway, and no agreed vocabulary, nobody can tell who is actually competent.* Employers cannot filter candidates. Practitioners cannot prove seniority. Consultancies cannot differentiate. Universities cannot align curricula. The organisation inserted itself as the neutral referee — it defines the canon, sets the bar, and issues the proof.

Value delivered, by audience:

| Audience | Core problem | Value received |
|---|---|---|
| Individual practitioner | Career invisible, seniority unprovable | Portable, employer-recognised credential + vocabulary + peer network |
| Employer / data leader | Cannot assess or level candidates; team speaks different dialects | A hiring filter and a shared internal language |
| Training provider / consultancy | No credibility signal; must invent own curriculum | Licensed alignment to a recognised canon + demand funnel |
| Academic institution | Curriculum drifts from industry reality | An external reference standard and graduate differentiator |
| Volunteer / community leader | Wants professional standing and visibility | A platform, a title, and a stage |

## A2. The five interlocking economies

The most important architectural insight is that the ecosystem is **not one product**. It is five loosely-coupled economies that reinforce each other, each with its own revenue logic, and each survivable if another stalls.

```
        ┌──────────────────────────────────────────────────┐
        │   1. CANON      the body of knowledge / books    │
        │      ↓ defines what "competent" means            │
        ├──────────────────────────────────────────────────┤
        │   2. DELIVERY   training — mostly OUTSOURCED     │
        │      ↓ accredited third parties teach the canon  │
        ├──────────────────────────────────────────────────┤
        │   3. ASSESSMENT the exam — kept IN-HOUSE         │
        │      ↓ the trust asset; never delegated          │
        ├──────────────────────────────────────────────────┤
        │   4. CREDENTIAL badge, tier, renewal, ethics     │
        │      ↓ the portable proof + recurring obligation │
        ├──────────────────────────────────────────────────┤
        │   5. COMMUNITY  federated local chapters, events │
        │      ↺ feeds candidates back into 1–4            │
        └──────────────────────────────────────────────────┘
```

**The strategic move is #2.** The organisation deliberately does *not* monopolise teaching. It accredits independent providers under an annual licence, requires their instructors to hold the top-tier credential, requires their materials to track the current canon version, and lists them publicly. This is the highest-leverage decision in the entire model:

- Delivery capacity scales globally without central headcount.
- The exam stays credible precisely because the examiner is not the teacher.
- Every accredited provider becomes an unpaid demand-generation channel for the exam.
- Requiring instructors to hold the *top* credential creates a self-reinforcing loop: teaching pulls people up the ladder.

**#3 is the moat.** Assessment is the one thing never outsourced. Whoever controls the bar controls the meaning of the credential.

## A3. Credential design patterns worth stealing (the mechanics, not the content)

Six mechanics are genuinely elegant and generalise to any professional credential:

1. **One exam, three outcomes.** A single question bank is scored against three thresholds (roughly 60 / 70 / 80 percent). Candidates do not choose a difficulty tier and risk mis-selecting — they sit one exam and are *placed*. This collapses exam production cost by ~3×, removes tier-selection anxiety, gives every passing candidate an outcome instead of a binary fail, and creates a built-in upgrade motive ("retake to level up", with the highest score retained).

2. **Core + electives composition.** A mandatory foundations exam plus *two chosen from seven* specialisms. The credential is composed, not monolithic. This lets one credential describe many different careers while keeping the core comparable across all holders.

3. **Knowledge and experience assessed separately.** The top tier additionally requires an experience review. Knowledge is tested by exam; seniority is attested by evidence. Conflating the two is the classic certification failure mode.

4. **Time-boxed validity + annual obligation.** Credentials expire on a multi-year cycle and require an annual activity attestation plus a signed ethics undertaking. Three effects at once: recurring revenue, forced currency of skills, and a values-based membrane that gives the credential moral weight.

5. **Risk reversal at the point of purchase.** A "pay only if you pass" style programme running through local chapters removes the single biggest conversion blocker on a several-hundred-dollar exam.

6. **The badge as the distribution channel.** The credential is issued as a shareable digital badge. Every holder who posts it markets the ecosystem to their entire professional network for free. The badge is not a nice-to-have output; it is the growth engine.

## A4. Community architecture: federated, volunteer-led, low central cost

Local chapters are largely autonomous, independently constituted, run by volunteers, and coordinated by a light central council. Membership at the international level is deliberately cheap — an order of magnitude below the exam fee — because **membership sells identity and belonging, not content**. Content and the exam are monetised separately.

The contributor ladder is the quiet engine: committees, working groups, speaker rosters, special-interest groups, chapter leadership. Users are systematically converted into *supply* — into speakers, authors, mentors, and organisers. A platform that only consumes volunteers' attention dies; one that gives them status compounds.

## A5. Information architecture pattern

The navigation is organised by **intent verb**, not by content type — roughly: understand us / belong / get certified / learn / connect locally / attend / contribute. Underneath, the homepage forks immediately into audience-specific front doors (individual practitioner, organisation representative, community starter). This is the single most reusable IA idea: *a large professional ecosystem should be navigable by "what am I trying to do", with a segmentation fork placed as early as possible.*

## A6. Where the reference model is weak — and where our opportunity is

Critical assessment. Each weakness below is an explicit design input to Part B.

| # | Weakness observed | Consequence | Our design response |
|---|---|---|---|
| 1 | **Fragmented estate.** Marketing site, exam system, and learning system live on separate domains and separate logins. | No single learner record; every hand-off leaks conversion; no telemetry across learn → prove. | One identity, one learner record, one domain. Learning and assessment share a schema. |
| 2 | **Assessment is entirely multiple-choice recall.** | Measures whether you can find an answer in a book, not whether you can do the work. Increasingly meaningless in an AI-assisted world. | Every credential requires a **knowledge score + a defended applied artifact**. See §13. |
| 3 | **Canon updated on a multi-year cycle.** | Acceptable for slow-moving governance topics; fatal for AI, where practice half-life is months. | **Living, versioned Body of Practice** with per-module version stamps and change-log-driven recertification. See §16. |
| 4 | **Open-book rule anchored to a physical artefact.** | Unenforceable and philosophically confused in an AI era. | Explicit **AI-permitted vs AI-restricted assessment classes**, declared per assessment. See §13.6. |
| 5 | **No skill graph, no personalisation, no diagnostics.** | Everyone gets the same linear path; no way to skip what you know or find what you lack. | Skill graph as the spine of the entire product. See §10. |
| 6 | **Corporate offering is essentially bulk book sales.** | Leaves the highest-value buyer — the enterprise L&D and CDO budget — almost entirely unserved. | Full corporate console: skills-gap heatmaps, cohort management, benchmarking, ROI reporting. See §14. |
| 7 | **Membership value is diffuse.** | Low price, low perceived value, weak retention story. | Membership tied to a *continuously accruing* professional profile and learner record. See §15. |
| 8 | **No regional funding/compliance integration.** | Providers must reconcile the credential with local grant schemes by hand. | Native **HRD Corp (Malaysia) compliance pack**, generalised to a pluggable funding-scheme module. Genuine regional moat. See §18.12. |
| 9 | **Volunteer-led operations.** | Slow release cadence, inconsistent chapter quality. | Product-led with community layered on; chapter quality tiers with published standards. |
| 10 | **Governance-only scope.** | An entire generation is being hired for AI capability the canon does not address. | **AI and Generative AI are first-class tracks from day one, not bolt-ons.** |

**Positioning conclusion.** The reference model wins on *trust and neutrality* and loses on *product*. Legacy standards bodies are structurally unable to move at AI speed. The opening is a credential that is **evidence-based, AI-native, continuously versioned, and enterprise-instrumented** — trustworthy like a standards body, but built like a modern software product.

---

# PART B — THE ORIGINAL PLATFORM BLUEPRINT

> **Working name used throughout:** *Data & AI Academy* (platform) issuing the *Blueprint Credential* family. Both names are placeholders that deliberately extend an asset you already own — "The Data Blueprint" — rather than borrowing anyone else's equity. Substitute freely; the architecture does not depend on the name.

---

## 1. EXECUTIVE VISION

**The one-sentence vision.**
A global, AI-native academy where any professional — from a final-year student to a Chief Data Officer — can find exactly the data and AI capability they are missing, learn it in the shortest honest path, **prove it by doing the work rather than by recognising the answer**, and carry that proof as a portable, cryptographically verifiable credential that employers actually trust.

**Why now.** Three forces converge in 2026:

1. **A credential vacuum in AI.** Data management has a recognised credential ladder. AI and generative AI capability has almost none that employers respect — the field moved faster than any standards body could certify it. Whoever builds a *credible, evidence-based* AI credential in the next 24 months defines the category.
2. **Multiple-choice testing is collapsing as a signal.** When a model can pass any recall exam instantly, an exam that only tests recall proves nothing about the human. The entire assessment industry must move to *evidence of applied work*. This is a discontinuity, and discontinuities are where challengers win.
3. **Literacy demand has gone horizontal.** Organisations no longer want to train the data team; they want to raise the floor across finance, HR, operations, marketing, and the board. That is a volume market that legacy certification bodies, built for specialists, are not shaped to serve.

**The strategic bet.** We do not compete on "more courses". We compete on **the integrity and usefulness of the proof**. Content is commoditised; trusted, defensible evidence of capability is not. Every architectural decision in this document is downstream of that bet.

**Three non-negotiable differentiators.**

| | Differentiator | What it means concretely |
|---|---|---|
| **D1** | **Evidence over recall** | No credential is awarded on a multiple-choice score alone. Every credential above foundation level requires a submitted, assessed, and defended applied artifact. |
| **D2** | **Living knowledge, versioned** | The knowledge base is a semantically-versioned product with changelogs. Credentials reference the version they were earned against. Currency is visible, not assumed. |
| **D3** | **AI-native, not AI-flavoured** | An AI tutor grounded in our own corpus, adaptive path generation from a real skill graph, AI-assisted (human-moderated) assessment of artifacts, and explicit AI-use policy per assessment. |

**Twelve-month success definition.** Not revenue, at first. Success is: (a) 3+ employers publicly stating they use the credential as a hiring filter, (b) >70% of Level-2 candidates submitting an applied artifact rather than dropping at the evidence gate, (c) a corporate customer renewing a second cohort, and (d) the knowledge base shipping at least one substantive version update.

---

## 2. PLATFORM MISSION

**Mission.**
To make data and AI capability *legible* — for the individual who has it, for the employer who needs it, and for the institution that teaches it.

**Operating principles.** These are decision rules, not slogans. When two options conflict, resolve in this order:

1. **Truthful signal first.** We never issue a credential that overstates what the holder can do. If a shortcut increases enrolment but weakens the signal, we do not take it. The credential's meaning is the entire asset.
2. **Shortest honest path.** We assess what a learner already knows and let them skip it. Selling someone hours they do not need is a failure of the product, not a revenue win.
3. **Show the work.** Learners produce artifacts. Assessors leave reasoned feedback. Employers can inspect evidence. Nothing important is a black box.
4. **Learn in public, verify in private.** Community, discussion, and portfolios are open by default. Assessment integrity, personal data, and grading are locked down.
5. **Global by default, local where it matters.** One platform, one credential standard — with local language, local payment, local funding-scheme compliance, and local community.
6. **The learner owns the record.** Credentials are portable open standards. If the learner leaves, the proof still verifies. We earn retention; we do not trap it.
7. **AI is a tool of the learner and of the assessor, never a replacement for the judgement of either.** Every AI-generated grade is provisional until a qualified human confirms it at credential-bearing tiers.

**Explicit non-goals.** We are not a MOOC aggregator, not a university-degree substitute, not a job board, and not a consulting firm. We will resist all four, because each dilutes the trust asset.

---

## 3. TARGET USER PERSONAS

Nine personas. Each is written as: who → the pain → what they need from us → what they will pay for → the metric that proves we served them. The first five are drawn directly from your existing segment analysis; the last four are supply-side and institutional personas the platform needs to function.

### P1 — Aisha, Final-Year / Postgraduate Student
- **Who:** Computer science, data science, analytics, or MBA final year. Knows tools, has never seen an enterprise data estate.
- **Pain:** Every graduate CV looks identical. She cannot demonstrate anything beyond coursework.
- **Needs:** A picture of how data and AI actually work inside an organisation; something concrete on her CV; interview readiness.
- **Pays for:** Low-priced individual access, or is sponsored through a university cohort deal.
- **Success metric:** Credential appears on her profile before graduation; she can describe an end-to-end data flow in an interview.
- **Design implication:** Aggressive student pricing, university bulk enrolment, portfolio artifact that doubles as an interview talking point.

### P2 — Daniel, Early-Career Data Professional (0–3 yrs)
- **Who:** Analyst, BI developer, junior engineer. Competent in a tool, lost in the system.
- **Pain:** Knows *his* dashboard, not the ecosystem. Cannot see his next role or how to reach it.
- **Needs:** Systems thinking, role clarity (analyst vs engineer vs architect vs governance), a visible next step.
- **Pays for:** Self-funded practitioner path; often reimbursed.
- **Success metric:** Completes a track, earns Level 2, reports a role change or promotion within 18 months.
- **Design implication:** Career-path visualisation, skill-gap diagnostic, role-target selection at onboarding.

### P3 — Priya, Mid-Senior Practitioner Moving Into AI
- **Who:** 5–12 years in data engineering, architecture, or analytics. Now expected to deliver AI and GenAI outcomes.
- **Pain:** Enormous, noisy, fast-moving field. No idea what is durable versus hype. Cannot afford to learn the wrong thing.
- **Needs:** Curated, opinionated, current material; depth not novelty; credible proof for a pivot.
- **Pays for:** Premium individual, or employer-funded. Highest willingness-to-pay per individual.
- **Success metric:** Ships an assessed AI artifact; earns an AI-track credential.
- **Design implication:** This persona is the **beachhead**. The AI/GenAI track must be the strongest thing on the platform at launch.

### P4 — Rahman, Business Leader / Decision Maker
- **Who:** Head of department, director, product owner, C-suite adjacent. Non-technical, accountable for data-driven outcomes.
- **Pain:** Cannot challenge his data team, cannot judge an AI proposal, cannot tell a real opportunity from a vendor pitch.
- **Needs:** Literacy and judgement, not implementation. Short-form, high-density, executive framing.
- **Pays for:** Premium short workshops and executive briefings.
- **Success metric:** Completes the literacy track; asks materially better questions (measured by pre/post scenario judgement assessment).
- **Design implication:** A distinct **Literacy** product shape — hours not weeks, scenario-based, no coding, executive dashboard of team literacy.

### P5 — Sarah, Corporate L&D / CDO Office Buyer
- **Who:** Learning & development manager, HR business partner, or Chief Data Officer's chief of staff. Buys for 20–500 people.
- **Pain:** Must justify spend, prove uplift, satisfy internal audit, and — in Malaysia — satisfy the levy/grant scheme's documentation requirements.
- **Needs:** Cohort management, attendance and completion evidence, skills-gap heatmaps, benchmarking, before/after data, invoiceable and claimable paperwork.
- **Pays for:** The largest contracts on the platform. Per-cohort and per-seat annual licences.
- **Success metric:** Renews. Renewal is the only honest metric here.
- **Design implication:** The **Corporate Console** (§14, §18.9) is a first-class product, not an admin screen. The **funding-compliance pack** (§18.12) is a decisive differentiator in this segment.

### P6 — Dr. Lim, Academic Partner Lead
- **Who:** Dean, programme director, or head of department at a university or polytechnic.
- **Pain:** Curriculum lags industry; graduate employability is measured and published.
- **Needs:** Industry-aligned modules that slot into a semester, cohort licences, LMS interoperability, graduate outcome reporting.
- **Pays for:** Bulk per-student cohort pricing.
- **Success metric:** Renews the cohort next intake; cites credential in programme marketing.
- **Design implication:** LTI 1.3 integration so our content appears inside *their* LMS; an academic console with cohort analytics.

### P7 — Mustafa, Instructor / Subject-Matter Expert *(supply side)*
- **Who:** Practising expert who teaches — you, and eventually a roster of others.
- **Pain:** Content production is slow; scheduling, attendance, materials, and assessment admin consume the hours that should go into teaching.
- **Needs:** Authoring tools, cohort scheduling, live-session management, assessment queue, learner analytics, revenue share visibility.
- **Earns from:** Revenue share, delivery fees, reputation.
- **Success metric:** Instructor NPS and time-to-publish a new module.
- **Design implication:** **Instructor Studio** (§18.8). Without excellent supply-side tooling the platform cannot scale past one person.

### P8 — Wei, Assessor / Examiner *(supply side)*
- **Who:** Senior credential holder who reviews applied artifacts and conducts defence interviews.
- **Pain:** Grading is subjective, slow, and thankless without structure.
- **Needs:** Rubric-driven queues, AI pre-assessment to triage, calibration exercises, blind assignment, workload caps, recognition.
- **Earns from:** Per-assessment fee + standing in the community.
- **Success metric:** Inter-assessor agreement rate above threshold; turnaround SLA met.
- **Design implication:** The evidence-based credential model *lives or dies* on assessor supply and calibration. See §13.4.

### P9 — Nadia, Community Chapter Lead *(supply side)*
- **Who:** Regional professional who convenes local practitioners.
- **Pain:** Organising events is unpaid work with no tooling and no recognition.
- **Needs:** Event tooling, speaker roster, member directory, a co-branded page, and visible status.
- **Earns from:** Status, network, platform recognition, speaking opportunities.
- **Success metric:** Active chapters running recurring events without central staff involvement.

---

## 4. PLATFORM ECOSYSTEM

The platform is a **six-sided ecosystem**, deliberately designed so that each side produces something another side consumes. Growth comes from the loops, not from any single funnel.

```
                        ┌───────────────────────────┐
                        │      KNOWLEDGE BASE       │
                        │  (living Body of Practice)│
                        │   versioned · canonical   │
                        └─────────────┬─────────────┘
                    defines           │           grounds
              ┌───────────────────────┼───────────────────────┐
              ▼                       ▼                       ▼
     ┌────────────────┐      ┌────────────────┐      ┌────────────────┐
     │    LEARNERS    │      │  INSTRUCTORS   │      │   AI SERVICES  │
     │ individuals &  │◄────►│ authors, SMEs  │      │ tutor · adaptive│
     │    cohorts     │      │   assessors    │      │ path · pre-mark │
     └───────┬────────┘      └───────┬────────┘      └────────────────┘
             │ produce               │ assess
             ▼                       ▼
     ┌──────────────────────────────────────────┐
     │            EVIDENCE & CREDENTIALS         │
     │  artifacts · scores · badges · verifiable │
     └───────┬──────────────────────────┬────────┘
             │ proves capability to     │ shared publicly
             ▼                          ▼
     ┌────────────────┐        ┌────────────────────┐
     │ ORGANISATIONS  │        │     COMMUNITY      │
     │ corporate &    │◄──────►│ chapters · events  │
     │ academic       │ recruit│ forums · mentoring │
     └────────────────┘  from  └────────────────────┘
             │                          │
             └──────► both feed new learners back in ◄──────┘
```

**The four growth loops.** Name them, instrument them, and optimise them explicitly:

- **Loop 1 — Credential distribution.** Learner earns credential → shares verifiable badge on professional networks → peers see it → new learners arrive. *Instrument: badge shares, verification-page visits, attributed signups.*
- **Loop 2 — Expert conversion.** Learner becomes certified → qualifies as assessor or mentor → assessor capacity grows → more learners can be credentialed → assessors gain status and become instructors → they bring their own audience. *Instrument: % of Level-3 holders active as assessors.*
- **Loop 3 — Enterprise land-and-expand.** One team trained → skills-gap dashboard reveals adjacent gaps → L&D expands to another department → employees continue individually after the corporate programme ends. *Instrument: seats-per-account over time, individual conversions from corporate cohorts.*
- **Loop 4 — Knowledge compounding.** Learner questions and assessment failures reveal gaps in the knowledge base → gaps become authoring backlog → knowledge base improves → learning outcomes improve → better credentials → more trust. *Instrument: unanswered-question rate, per-topic failure clustering.*

**Content supply strategy.** Three tiers, deliberately: (1) **First-party** — your existing Data Blueprint modules and AI material, the quality benchmark and the credential-bearing core. (2) **Accredited partners** — independent providers licensed to teach toward our credentials under published standards, with instructor credential requirements. This is the scaling mechanism; do not attempt to teach the world yourself. (3) **Community** — articles, talks, and case studies, clearly labelled as non-canonical.

**Critically: we keep assessment in-house, permanently.** Delivery may be federated. The bar may not be. This is the single most important governance rule in the platform.

---

## 5. CORE PLATFORM PILLARS

Six pillars. Every feature in this document maps to exactly one. If a proposed feature maps to none, it does not get built.

### Pillar 1 — LEARN
Structured capability acquisition. Courses, modules, learning paths, cohort programmes, live sessions, labs, and micro-learning. Multiple modalities against one skill graph: self-paced, instructor-led virtual, in-person, blended, and drip-scheduled cohort.

### Pillar 2 — PROVE
Everything that produces trustworthy signal: diagnostics, quizzes, knowledge exams, practical assignments, portfolio artifacts, defence interviews, peer review, proctoring, and credential issuance. **This pillar is the product's core asset and receives the highest engineering and governance investment.**

### Pillar 3 — KNOW
The living Body of Practice: a semantically versioned, cross-linked, searchable knowledge base plus a glossary, a pattern and template library, case studies, and a curated external reading map. It is the ground truth for courses, for exam questions, and for the AI tutor's retrieval.

### Pillar 4 — BELONG
Community: profiles, discussion spaces, local and virtual chapters, events, mentoring, study groups, and interest circles. Converts a transactional purchase into an ongoing professional identity — and is the primary defence against one-and-done churn.

### Pillar 5 — GROW
The career layer: skills profile, skill graph position, gap analysis, role targets, recommended next steps, CPD tracking, credential renewal, and a public verifiable professional profile. This is what makes an annual membership rational rather than sentimental.

### Pillar 6 — ENABLE
The supply and institutional side: Instructor Studio, assessor workbench, authoring and content lifecycle, corporate console, academic console, partner-provider console, funding-compliance tooling, commerce, and platform administration.

**Pillar interlock (why the whole is more than the parts):**

| From → To | Interlock |
|---|---|
| KNOW → LEARN | Every course module cites knowledge-base nodes; a knowledge update flags affected courses for review. |
| LEARN → PROVE | Completing learning unlocks assessment eligibility; assessment results write back to the skill graph. |
| PROVE → GROW | Credentials and skill levels populate the professional profile and drive next-step recommendations. |
| GROW → BELONG | Skill and interest data route people to the right chapters, mentors, events, and study groups. |
| BELONG → KNOW | Community output feeds the authoring backlog; recurring questions become canonical content. |
| ENABLE → all | Supply-side tooling determines the throughput ceiling of every other pillar. |

---

## 6. ORIGINAL INFORMATION ARCHITECTURE

### 6.1 The organising principle

The IA is built on three orthogonal axes. Every piece of content and every credential is addressable by a coordinate on all three. This is the intellectual core of the platform and it is deliberately different from a flat course catalogue.

**Axis 1 — DOMAIN (what subject).** Five domains:

| Code | Domain | Scope |
|---|---|---|
| **DF** | Data Foundations | Data concepts, metadata, master/reference/transactional data, modelling, decision-support systems, warehousing and BI |
| **DE** | Data Platforms & Engineering | Storage, processing, pipelines, architecture, lakehouse, streaming, cloud data platforms |
| **AI** | AI & Machine Learning | ML fundamentals, model lifecycle, evaluation, MLOps, applied AI in the enterprise |
| **GA** | Generative & Agentic AI | LLMs, prompting, RAG, agents, tool use, evaluation, GenAI product patterns |
| **GT** | Governance, Trust & Risk | Data governance, quality, security, privacy, AI ethics, AI governance and regulation |

**Axis 2 — ALTITUDE (what depth of engagement).** Four altitudes:

| Code | Altitude | Question it answers | Typical audience |
|---|---|---|---|
| **A1** | **Aware** | *What is it and why does it matter?* | Everyone. Literacy. |
| **A2** | **Applied** | *How do I do it?* | Practitioners doing the work. |
| **A3** | **Architect** | *How do I design and decide?* | Seniors, architects, leads. |
| **A4** | **Advisory** | *How do I govern, direct, and invest?* | Executives, CDOs, board. |

Altitude is **not** the same as difficulty. A4 executive content is short and high-density, not "easy". This decoupling is what lets one platform serve a graduate and a CDO without either feeling patronised. It also solves the classic catalogue problem where "beginner/intermediate/advanced" collapses two different ideas into one useless slider.

**Axis 3 — MODALITY (how it is consumed).** Self-paced · Cohort (scheduled, instructor-led) · Live workshop (virtual or in-person) · Lab (hands-on environment) · Micro (under 15 minutes) · Reference (knowledge-base article, never "completed").

### 6.2 The skill graph underneath

Beneath the three axes sits a directed acyclic graph of **skills** (see §10.2). Domains and altitudes are *views* onto that graph. Courses, assessments, credentials, job roles, and knowledge articles all attach to skill nodes. This single decision is what makes personalisation, gap analysis, credit-for-prior-learning, and corporate heatmaps possible — and it must be built before the catalogue grows, because retrofitting a skill graph onto 200 existing courses is brutal.

### 6.3 Navigation model

Navigation is organised by **user intent**, and the primary navigation deliberately changes based on authentication state and role. Public visitors get a persuasion-oriented IA; authenticated learners get a workspace IA. Conflating the two is a common and costly mistake.

**Public (unauthenticated) primary navigation — intent-led, six items maximum:**

| Nav item | Intent served | Contains |
|---|---|---|
| **Learn** | "I want to build skill" | Domains, learning paths, catalogue, modalities, free diagnostic |
| **Get Certified** | "I want to prove skill" | Credential ladder, requirements, evidence model, exam logistics, verify-a-credential |
| **For Organisations** | "I'm buying for a team" | Corporate programmes, academic partnerships, funding/levy support, case evidence, contact sales |
| **Knowledge** | "I want to understand something now" | Body of Practice, glossary, articles, patterns, templates — the SEO and trust surface |
| **Community** | "I want to belong" | Chapters, events, mentoring, member directory, contributor programmes |
| **About** | "Can I trust you" | Standard, governance, instructors, accreditation, credential integrity policy |

Persistent global elements: search (with AI answer), a single primary CTA (**Start free diagnostic**), sign in, language and region selector.

**Authenticated learner navigation — workspace-led:**
`My Learning` · `My Path` · `My Credentials` · `Knowledge` · `Community` · `Profile`
plus a persistent "continue where you left off" resume affordance.

**Role-conditional navigation** appears as an additional workspace switcher, never as extra items in the learner nav: Instructor Studio · Assessor Workbench · Org Console · Academy Admin.

### 6.4 Content taxonomy and metadata contract

Every learning object carries this metadata. This contract is what makes search, personalisation, compliance, and analytics possible — define it before authoring anything.

```yaml
id, slug, title, summary
type: course | module | lesson | lab | assessment | article | pattern | template | event | path
domain: [DF | DE | AI | GA | GT]        # one or more
altitude: [A1 | A2 | A3 | A4]           # one or more
skills: [skill_node_ids]                # attaches to the skill graph
prerequisites: [skill_node_ids]
learning_outcomes: [outcome objects, each mapped to a skill and a Bloom verb]
modality, estimated_minutes, difficulty_calibration
knowledge_refs: [body_of_practice_node_ids @ version]
version, status (draft|review|published|deprecated), review_due_date
languages, locale_variants, accessibility_flags (captions, transcript, alt-text, WCAG level)
author_id, reviewer_id, last_reviewed_at
credential_relevance: [credential_ids]
pricing_scope: free | included | paid | corporate_only
funding_eligibility: [scheme codes, e.g. HRDCORP]        # see §18.12
ai_policy: permitted | disclosed | restricted             # see §13.6
```

---

## 7. PROPOSED SITEMAP

Routes are given as URL paths so a coding agent can scaffold directly. `[param]` denotes a dynamic segment.

### 7.1 Public / marketing surface

```
/                                       Home — segmented entry, three front doors
/learn                                  Learning overview
  /learn/domains/[domain]               DF | DE | AI | GA | GT landing
  /learn/paths                          All learning paths
  /learn/paths/[path]                   Path detail — modules, outcomes, credential target
  /learn/catalog                        Full catalogue, faceted (domain × altitude × modality)
  /learn/courses/[course]               Course detail — outcomes, syllabus, instructor, reviews
  /learn/literacy                       Data & AI Literacy (A1) — separate product shape
  /learn/diagnostic                     Free skill diagnostic — the primary top-of-funnel asset
/certify                                Credential overview + the ladder
  /certify/credentials/[credential]     Credential detail — requirements, evidence, fees, validity
  /certify/how-it-works                 The evidence model explained (differentiator page)
  /certify/exams                        Exam catalogue, format, pricing, scheduling, integrity policy
  /certify/renewal                      CPD and renewal rules
  /certify/verify                       Public credential verification (no login)
  /certify/verify/[credential_uid]      Public verification result page — the badge landing target
  /certify/directory                    Searchable directory of credential holders (opt-in)
/organisations                          Corporate overview
  /organisations/corporate              Team & enterprise programmes
  /organisations/academic               University & institution partnerships
  /organisations/funding                Funding & levy support (HRD Corp Malaysia + generalised)
  /organisations/case-studies
  /organisations/contact                Qualified lead capture
/knowledge                              Body of Practice home
  /knowledge/[domain]                   Domain index
  /knowledge/[domain]/[topic]           Article — versioned, cited, cross-linked
  /knowledge/glossary                   Glossary
  /knowledge/glossary/[term]            Term page (high SEO value)
  /knowledge/patterns                   Reusable patterns & reference architectures
  /knowledge/templates                  Downloadable artifacts and canvases
  /knowledge/reading-map                Curated external reading, mapped to skills
/community                              Community home
  /community/chapters                   Chapter map + directory
  /community/chapters/[chapter]         Chapter page — events, leads, join
  /community/events                     Event calendar
  /community/events/[event]             Event detail + registration
  /community/mentoring                  Mentoring programme
  /community/contribute                 Speaker roster, authoring, assessor, volunteer routes
  /community/forums                     Discussion spaces (auth to post)
/about                                  About the academy
  /about/standard                       The capability standard & how it is governed
  /about/instructors                    Instructor roster
  /about/accreditation                  Accredited provider programme + directory
  /about/integrity                      Credential integrity & AI-use policy
  /about/governance                     Standards council, appeals, code of conduct
/pricing        /membership       /blog       /contact
/legal/terms    /legal/privacy    /legal/accessibility     /legal/cookies
```

### 7.2 Authenticated learner workspace

```
/app                                    Dashboard (learner home)
/app/learning                           Enrolled courses & progress
/app/learning/[course]                  Course player shell
/app/learning/[course]/[lesson]         Lesson / video / reading / lab
/app/path                               My learning path — skill graph view
/app/path/planner                       Adjust goals, target role, pace, deadlines
/app/skills                             Skill profile & gap analysis
/app/assessments                        Upcoming, in-progress, results
/app/assessments/[assessment]           Assessment runner (locked-down shell)
/app/assignments                        Practical assignments & submissions
/app/assignments/[assignment]           Brief, workspace, submission, rubric, feedback
/app/portfolio                          Evidence portfolio
/app/credentials                        Earned credentials, badges, wallet, renewal status
/app/credentials/[credential_uid]       Detail, share, download, verification link
/app/cpd                                CPD log & renewal progress
/app/calendar                           Sessions, cohort schedule, exam bookings
/app/tutor                              AI learning assistant (also a persistent side panel)
/app/community                          Feed, my chapters, my groups, my mentors
/app/notifications      /app/profile      /app/billing      /app/settings
```

### 7.3 Role workspaces

```
/instructor                             Instructor Studio home
  /instructor/courses                   My courses, versions, review status
  /instructor/authoring/[course]        Authoring & content editor
  /instructor/cohorts                   Cohort scheduling & rosters
  /instructor/cohorts/[cohort]          Roster, attendance, sessions, progress
  /instructor/sessions/[session]        Live session console + attendance capture
  /instructor/assessment-queue          Items awaiting my marking
  /instructor/analytics                 Learner outcomes, drop-off, item analysis
  /instructor/earnings                  Revenue share & payouts

/assessor                               Assessor Workbench home
  /assessor/queue                       Blind-assigned artifacts to assess
  /assessor/review/[submission]         Rubric grading + AI pre-assessment + defence notes
  /assessor/calibration                 Calibration exercises & agreement stats
  /assessor/appeals                     Escalated / disputed assessments

/org                                    Corporate console home
  /org/dashboard                        Adoption, completion, skills, ROI
  /org/people                           Members, invites, groups, managers
  /org/teams/[team]                     Team detail & manager view
  /org/programs                         Assigned paths & required training
  /org/cohorts                          Cohorts, schedules, instructors
  /org/skills                           Skills-gap heatmap & benchmarking
  /org/compliance                       Attendance registers, evidence, funding packs
  /org/reports                          Exports, scheduled reports, audit trail
  /org/billing      /org/settings       /org/integrations (SSO, HRIS, LMS)

/academy                                Platform administration
  /academy/content                      Content lifecycle & publishing
  /academy/skills                       Skill graph editor
  /academy/knowledge                    Body of Practice versioning & changelog
  /academy/credentials                  Credential definitions & rules engine
  /academy/item-bank                    Assessment item bank & psychometrics
  /academy/users        /academy/orgs       /academy/partners
  /academy/community    /academy/finance    /academy/integrity   /academy/settings
```

---

## 8. USER ROLES

Roles are **capability sets**, assignable in combination. A person is routinely a Learner *and* an Instructor *and* a Chapter Lead. Model roles as many-to-many with scope (`global`, `org:{id}`, `chapter:{id}`, `cohort:{id}`), not as a single enum on the user record — this is the most common and most expensive early data-model mistake.

| # | Role | Scope | Core capabilities | Key constraints |
|---|---|---|---|---|
| R1 | **Guest** | global | Browse public content, free diagnostic, read knowledge base, view credential verification | No progress persistence beyond an anonymous diagnostic result held for 30 days |
| R2 | **Learner** | global | Enrol, learn, take assessments, submit assignments, hold credentials, post in community | Base authenticated role; everyone has it |
| R3 | **Member** | global | Learner + full knowledge base, member pricing, directory listing, chapter membership, CPD ledger | Subscription state; degrades gracefully to Learner on lapse — never revoke earned credentials |
| R4 | **Candidate** | credential | Registered against a specific credential; exam booking, evidence submission, defence scheduling | Time-boxed eligibility window; integrity undertaking signed |
| R5 | **Credential Holder** | credential | Verified public profile, badge, directory, eligibility for assessor/mentor roles | Must maintain CPD and re-attest annually |
| R6 | **Instructor** | global / cohort | Author, publish (with review), run cohorts, capture attendance, mark within own cohorts | Cannot mark credential-bearing evidence for their own learners — see integrity rule below |
| R7 | **Assessor** | credential | Grade credential-bearing artifacts, conduct defences, participate in calibration | Blind assignment; must hold the credential one level above what they assess; conflict-of-interest declaration |
| R8 | **Mentor** | community | Mentoring relationships, session logs, feedback | Vetted; code of conduct; safeguarding rules |
| R9 | **Content Author** | content | Draft and edit knowledge and course content | Publishing requires reviewer approval |
| R10 | **Reviewer / Editor** | content | Approve, version, and publish content; own review-due queue | Cannot approve own authorship |
| R11 | **Chapter Lead** | chapter | Manage chapter page, events, members, speakers | Bound by chapter standards; reviewed annually |
| R12 | **Org Admin** | org | Full corporate console, billing, SSO, member lifecycle, compliance exports | Sees aggregate + individual progress for own org only |
| R13 | **Team Manager** | org team | Team dashboards, assign paths, approve requests | Aggregate-first; individual detail only for direct reports |
| R14 | **Academic Admin** | org (academic) | Cohort licences, LTI config, student rosters, outcome reporting | Student data handled under education-privacy rules |
| R15 | **Partner Provider Admin** | partner | Manage accredited provider profile, instructor roster, course alignment, referrals | Annual accreditation review; must meet instructor credential standard |
| R16 | **Proctor** | exam session | Launch, monitor, and flag exam sessions | Typically an external integration rather than a human platform role |
| R17 | **Community Moderator** | community | Moderate posts, enforce code of conduct, escalate | Audit-logged actions |
| R18 | **Integrity Officer** | global | Investigate misconduct, revoke credentials, handle appeals | Segregated duty; two-person rule for revocation |
| R19 | **Platform Admin** | global | Full configuration | Break-glass, MFA-mandatory, fully audit-logged |
| R20 | **Finance / Ops** | global | Billing, refunds, payouts, invoicing, reconciliation | No access to assessment content or grades |

**Three integrity rules that must be enforced in code, not policy:**
1. **Separation of teaching and credentialing.** An instructor may mark formative work for their own learners. They may never be the deciding assessor on a credential-bearing artifact submitted by someone in their own cohort.
2. **Assessor blindness.** Credential submissions are assigned to assessors with learner identity masked by default.
3. **Two-person revocation.** No single account can revoke an issued credential.

---

## 9. DETAILED USER JOURNEYS

Each journey is specified as: trigger → stages → the emotional state we must manage → the failure mode that kills conversion → the design response. These are written to be directly translatable into screens.

### J1 — New Visitor → Engaged Learner
**Trigger:** Search result, badge on a colleague's profile, LinkedIn post, or a corporate mandate.

1. **Land** — arrives on a knowledge article or credential page, not the homepage. *Design implication: every deep page must be a valid entry point with its own orientation and CTA.*
2. **Orient (under 30 seconds)** — a single question: "Is this for someone like me?" Answered by a three-door segmentation fork: *I'm building my own career* / *I'm training a team* / *I'm teaching or partnering*.
3. **Diagnose (free, no payment)** — a 10–15 minute adaptive diagnostic. This is the most important conversion asset on the platform. It costs the visitor nothing and it produces something they cannot get elsewhere: a **map of what they don't know**, positioned against a target role.
4. **Receive a personalised result** — skill profile, gaps, a recommended path, an honest time estimate, and the credential it leads to. Partial result shown anonymously; **the full report requires account creation.** This is the account-creation trade, and it is a fair one.
5. **Commit** — free tier: first module, glossary, community read access. Paid: full path.

- **Emotional state:** sceptical, time-poor, slightly defensive about gaps.
- **Failure mode:** the diagnostic feels like a test they can fail. People abandon.
- **Design response:** frame it as calibration, never as an exam. No pass/fail language. Show partial results progressively during the diagnostic so value arrives before completion. Allow "I don't know" as a first-class, non-penalised answer — it is the most informative response a diagnostic can receive.

### J2 — Learner → Course Completion
**Trigger:** Enrolment.

1. **Onboard** — set goal, target role, weekly time budget, and target date. The system generates a realistic schedule. *Commitment devices beat willpower.*
2. **First session within 24 hours** — the strongest single predictor of completion. Drive it with a scheduled calendar block and a reminder, not a nag.
3. **Learn in a rhythm** — module → practice → check → apply. Every module ends with a low-stakes knowledge check and one applied micro-task.
4. **Recover from lapses** — the platform detects a stalled learner (no activity for N days against their own declared pace) and responds with a *re-entry ramp*: a 5-minute recap and a shortened next step, not a guilt-trip email.
5. **Complete** — module completion certificate (non-credential), skill graph updates, next step surfaced immediately.

- **Failure mode:** the classic 8–13% MOOC completion rate. Caused by no accountability, no schedule, no consequence.
- **Design response:** cohort options with real dates; public-to-your-team progress in corporate context; streaks that are forgiving (weekly not daily); the AI tutor proactively offering help at detected struggle points; and *shortest honest path* — let them test out of what they already know so the path is short enough to finish.

### J3 — Learner → Certified Professional *(the flagship journey)*
**Trigger:** Learner decides the credential is worth the effort.

| Stage | What happens | Screen |
|---|---|---|
| 1. Understand | Credential page: requirements, evidence expectations, fees, time, validity, sample artifact and sample rubric published openly | `/certify/credentials/[id]` |
| 2. Check readiness | Free readiness check: skill graph coverage + a mock knowledge assessment. Returns a **percentage readiness with named gaps** | `/app/skills` |
| 3. Close gaps | Recommended modules for the specific gaps only | `/app/path` |
| 4. Register as candidate | Pay, accept integrity undertaking and code of ethics, eligibility window opens (12 months) | `/certify/exams` |
| 5. Practice | Full-length practice assessment drawn from a separate item pool, with per-domain feedback | `/app/assessments` |
| 6. Knowledge assessment | Proctored, timed, scored against banded thresholds | `/app/assessments/[id]` |
| 7. Evidence submission | **The differentiator.** Submit an applied artifact against a published brief and rubric | `/app/assignments/[id]` |
| 8. AI pre-assessment | Automated rubric-aligned first pass; triages and drafts feedback. Never decisive | internal |
| 9. Human assessment | Blind-assigned qualified assessor confirms or overrides, writes reasoned feedback | `/assessor/review/[id]` |
| 10. Defence *(L3/L4 only)* | 20–30 minute live oral defence of the artifact — the strongest anti-fraud control available | scheduled session |
| 11. Award | Credential issued, verifiable badge minted, public verification page live, share prompts | `/app/credentials` |
| 12. Maintain | Annual CPD log + ethics re-attestation; renewal at 3 years | `/app/cpd` |

- **Emotional state:** high investment, high anxiety, fear of wasting money on failure.
- **Failure modes:** (a) candidates drop at stage 7 because "produce an artifact" is vague and frightening; (b) assessment turnaround is slow and candidates lose faith.
- **Design responses:** publish worked exemplar artifacts at pass, merit, and distinction; publish the rubric before submission; provide a scaffolded submission workspace with checkpoints rather than a single terrifying upload; **guarantee an assessment SLA (10 working days) and show a live countdown**; on shortfall, give a specific remediation plan and one free resubmission within 90 days rather than a bare fail.

### J4 — Professional → Community Member → Contributor
1. Joins to consume: reads knowledge base, attends a webinar.
2. Joins a local or virtual chapter; attends an event.
3. Asks a question; answers one; is thanked.
4. **Recognition trigger** — reputation, a contributor badge, a visible profile.
5. Escalates to supply: speaks at a chapter event → mentors → becomes an assessor → authors content → leads a chapter.

- **Failure mode:** a dead forum. Nothing kills community faster than an unanswered question.
- **Design response:** seed with staff and instructor presence for the first 6–12 months; guarantee a response SLA on questions; make contribution *count* — CPD credit for verified contribution, contributor status on the public profile, and a formal path from contributor to assessor. **Deliberate: this is how we solve assessor supply, which is the binding constraint on the whole evidence-based model.**

### J5 — Organisation → Corporate Customer
1. **Trigger** — a capability gap, a transformation programme, a regulatory driver, or an expiring training levy.
2. **Evaluate** — buyer needs proof of outcomes, not a course list. Provide sample skills-gap reports, case evidence, and a benchmark of what "good" looks like in their industry.
3. **Pilot** — a small cohort (10–25) with a pre/post skills assessment. **Insist on the pre-assessment**; without a baseline there is no provable uplift and therefore no renewal argument.
4. **Onboard** — SSO, HRIS sync, org structure import, admin training, programme assignment.
5. **Run** — cohorts, live sessions, attendance capture, nudges, manager dashboards.
6. **Prove** — completion, skill uplift, credential count, heatmap movement, benchmark comparison, and a board-ready quarterly report generated automatically.
7. **Claim / comply** — generate the funding-scheme documentation pack (attendance registers, trainer profile, course outline, learning outcomes, evaluation forms). See §18.12.
8. **Expand** — heatmap reveals adjacent gaps; expand to another function.

- **Failure mode:** low seat utilisation. The buyer cannot justify renewal and blames the platform.
- **Design response:** utilisation alerts to the org admin from week two; automated nudges; manager accountability views; a contractual "activation" success plan for the first 60 days.

### J6 — Academic Institution → Programme Partner
Curriculum-fit review → module mapping to their syllabus → cohort licence → LTI 1.3 integration into their LMS → student enrolment via roster sync → delivery within the semester → student credentials at completion → graduate outcome report to the department → renewal at next intake.
- **Design response:** LTI 1.3 with Names & Role Provisioning and Assignment & Grade Services is non-negotiable — grades must flow back to their gradebook, or academic partnerships will not scale.

### J7 — Expert → Instructor / Assessor / Author
Discovered via community or credential holding → applies → credential and experience verified → calibration and onboarding → shadow-assesses or co-teaches → certified as instructor/assessor → publishes or marks independently → earns revenue share and status → contributes to the standard itself.
- **Design response:** make the entry ramp explicit and visible on the public site (`/community/contribute`). Treat supply acquisition as a funnel with its own conversion metrics.

### J8 — Lapsed Learner → Reactivation
Detect inactivity against declared pace → send a value-carrying re-entry message (what changed in their domain since they left, from the knowledge changelog — not "we miss you") → offer a shortened resume path with a 5-minute recap → re-diagnose if the gap is long, because their skills and the field have both moved.

---

## 10. LEARNING FRAMEWORK

### 10.1 Pedagogical stance

Four commitments, chosen for defensibility and for what they imply about the software:

1. **Outcome-first design.** Every learning object begins with an observable outcome expressed with a Bloom-aligned verb and mapped to a skill node. Content is written backwards from the assessment. *Software implication: outcomes are structured data, not prose.*
2. **Spaced retrieval over passive review.** Knowledge checks recur at increasing intervals rather than only at module end. *Software implication: a scheduling service and a per-learner item-recency model.*
3. **Worked example → faded scaffold → independent performance.** Learners see it done, then do it with support, then do it alone. This is the sequence the applied assignments follow. *Software implication: assignments have staged briefs, not one brief.*
4. **Contextual authenticity.** Every applied task is set in a plausible enterprise scenario — a bank, a telco, a hospital, a regulator — because transfer to the workplace is the only outcome that matters. Reuse the case-study patterns from your existing industry material.

### 10.2 The skill graph

The structural core. Model it explicitly and build it first.

```
SkillNode {
  id, code, name, description
  domain: DF|DE|AI|GA|GT
  altitude_range: [A1..A4]
  parent_id                      # hierarchy: domain → cluster → skill → sub-skill
  prerequisites: [skill_ids]     # DAG edges; cycle detection enforced at write time
  proficiency_scale: 1..5        # Novice · Advanced Beginner · Competent · Proficient · Expert
  evidence_types: [quiz | exam | assignment | artifact | attestation | observation]
  decay_months                   # how fast this skill goes stale — GenAI ~12, data modelling ~60
  role_relevance: {role_id: weight}
  version, last_reviewed_at
}
```

**Four things the graph unlocks that a flat catalogue cannot:**
- **Gap analysis** — target role skill vector minus current learner vector.
- **Path generation** — topological sort over the gap sub-graph, respecting prerequisites and the learner's time budget.
- **Credit for prior learning** — demonstrate a skill by assessment and skip all the content that teaches it.
- **Organisational heatmaps** — aggregate learner vectors across a team, department, or whole company.

**Skill decay is a deliberate design feature, not a gimmick.** A GenAI skill demonstrated in 2024 should not read as current in 2026. Proficiency displays with a confidence that decays over time and can be refreshed by re-assessment or by logged CPD. This makes the professional profile *honest*, which is the entire brand promise — and it creates a legitimate, non-cynical reason for recurring engagement.

### 10.3 Learning path architecture

Three kinds of path, in increasing order of personalisation:

| Type | Description | When used |
|---|---|---|
| **Curated** | Editorially designed, fixed sequence, credential-aligned | Default for credential preparation; the marketable "Learning Paths" |
| **Role-targeted** | Generated from a role's skill vector minus the learner's | "I want to become a Data Architect" |
| **Adaptive** | Continuously re-sequenced from diagnostic results, performance, and pace | Power feature; the AI-native differentiator |

All three render into the same **Path** object so the UI and progress model are identical:
```
Path { id, type, target (credential|role|goal), milestones[], estimated_hours,
       deadline, pace_per_week, progress%, next_action, generated_from, revision }
```

**Milestones matter more than percentages.** A 4% progress bar is demoralising. "Milestone 2 of 7: Model an enterprise data domain" is motivating and tells the learner what they are becoming.

### 10.4 Course architecture at the learning-design level

Standard module rhythm, applied consistently so learners build muscle memory for the format:

```
MODULE
 ├─ Orientation      why this matters + the outcome (≤ 2 min)
 ├─ Core content     3–7 lessons, 6–12 min each; video, reading, or interactive
 ├─ Worked example   an expert doing it, narrated with reasoning made visible
 ├─ Guided practice  scaffolded task with hints and immediate feedback
 ├─ Knowledge check  5–10 items, formative, unlimited attempts, explanations shown
 ├─ Applied task     one realistic mini-deliverable
 └─ Consolidation    summary, knowledge-base links, spaced-review scheduling
```

**Design constraints:** no single video over 12 minutes; every lesson standalone-comprehensible (learners do not consume linearly); transcripts and captions mandatory; every technical claim cites a Body of Practice node so content and canon cannot silently drift apart.

### 10.5 Modalities and the blended model

| Modality | Shape | Best for | Commercial note |
|---|---|---|---|
| Self-paced | On-demand, async | Scale, individuals, literacy | Highest margin, lowest completion |
| Cohort | Fixed start, weekly live sessions, peer group | Practitioner depth, accountability | Best completion rates; premium price |
| Live workshop | 1–3 days, virtual or in-person | Corporate, executive, funding-scheme claims | Highest price; matches your existing 2-day format |
| Blended | Pre-work → live → post-work → assessment | Corporate flagship | **Recommended default for corporate** |
| Lab | Hands-on sandbox environment | Engineering and GenAI skills | Highest build cost; phase carefully |
| Micro | Under 15 min, single concept | Literacy, reinforcement, mobile | Excellent top-of-funnel and retention |

**Recommendation:** lead commercially with **blended corporate** (it matches your proven 2-day workshop delivery and satisfies funding-scheme attendance requirements) while building self-paced as the scalable asset underneath. Use the live sessions as the accountability layer that self-paced learning lacks.

---

## 11. COURSE ARCHITECTURE

### 11.1 Content object model

```
Program                  # e.g. an academic semester or corporate curriculum
 └─ Path                 # credential- or role-aligned sequence
     └─ Course           # coherent subject, 4–20 hours
         └─ Module       # 45–120 minutes, one outcome cluster
             └─ Lesson   # 6–12 minutes, atomic
                 └─ Block  # video | text | code | diagram | quiz | lab | download | embed
```
Cross-cutting objects attachable at any level: `Assessment`, `Assignment`, `Resource`, `Discussion`, `LiveSession`, `KnowledgeRef`.

**Rule: every level is independently addressable, versioned, and reusable.** A lesson on data lineage should be reusable in the Foundations course, the Governance course, and the AI Governance course without duplication. Build for reuse from day one — content duplication is the reason most academies become unmaintainable at around 40 courses.

### 11.2 Versioning and lifecycle

```
draft → internal review → SME review → published → (revision) → deprecated → archived
```
Semantic versioning on content: **major** = outcomes changed (learners must be notified; credential mapping re-checked); **minor** = material added; **patch** = corrections. Every published object carries `review_due_date`; AI/GenAI content defaults to a **6-month** review cycle, foundations to **24 months**. An overdue-review queue is a first-class admin screen — stale content is the slow death of a credential's reputation.

### 11.3 The launch catalogue

Concrete and buildable, mapped onto your existing assets. Modules marked ✅ already exist in some form in your material.

**Domain DF — Data Foundations** *(your Data Blueprint, restructured)*
1. ✅ Decision Support Systems: OLTP, OLAP, and why organisations need them
2. ✅ What Data Is: entities, attributes, records, structured/semi/unstructured, DIKW
3. ✅ Metadata: business, technical, operational; lineage; catalogs
4. ✅ Building Blocks: master, reference, transactional data and their interplay
5. ✅ Data Modelling: conceptual/logical/physical, normalisation, relational and dimensional
6. ✅ Data Processing & Storage: relational, NoSQL, warehouse, lake, lakehouse
7. ✅ Data Architecture: enterprise patterns and reference architecture
8. ✅ Governance, Security, Privacy & Quality *(bridges into GT)*

**Domain GA — Generative & Agentic AI** *(your Agentic AI material, expanded — the beachhead)*
1. LLM fundamentals for professionals: what they are, what they cannot do
2. Prompting as an engineering discipline
3. Retrieval-augmented generation: architecture, chunking, evaluation, failure modes
4. ✅ Agentic systems: tools, planning, memory, orchestration, human-in-the-loop
5. Evaluating GenAI systems: metrics, eval sets, regression, hallucination measurement
6. GenAI product patterns and the build-vs-buy decision
7. Cost, latency, and model selection economics

**Domain AI — AI & Machine Learning:** ML for decision makers · lifecycle and MLOps · model evaluation and validity · feature and data readiness for ML · applied ML case patterns.

**Domain DE — Data Platforms & Engineering:** modern platform architecture · pipelines and orchestration · streaming and real-time · lakehouse in practice · platform cost and performance.

**Domain GT — Governance, Trust & Risk:** data governance operating models · data quality frameworks and measurement · security and privacy by design · **AI governance, ethics, and the emerging regulatory landscape** · risk and control design for AI systems.

**Cross-domain Literacy (A1) — the volume product:** Data Literacy for Everyone (~4 hrs) · AI Literacy for Everyone (~4 hrs) · GenAI at Work: safe and effective use (~3 hrs) · Data & AI for Leaders (~6 hrs, A4).

### 11.3.1 Launch sequencing recommendation
Do **not** build all five domains at once. Build **DF (exists) + GA (differentiator) + Literacy (volume)** first. DF gives you immediate credibility and revenue with material you already own; GA is where the market gap and the highest willingness-to-pay are; Literacy is the horizontal corporate volume play. DE, AI, and GT follow in phase 2.

---

## 12. CERTIFICATION FRAMEWORK

### 12.1 Design principles

1. **Composed, not monolithic** — a core plus chosen specialisms describes many careers with one comparable standard.
2. **Banded outcomes, not pass/fail** — a single assessment places the candidate into a band. Everyone who performs gets an outcome; nobody wastes a fee on a binary rejection.
3. **Knowledge and capability assessed separately** — an exam measures knowing; an artifact measures doing. Never let one stand in for the other.
4. **Experience attested, not assumed** — senior credentials require verified professional evidence.
5. **Time-bounded with an annual obligation** — validity plus CPD plus ethics re-attestation.
6. **Portable and verifiable by open standard** — Open Badges 3.0 / W3C Verifiable Credentials. The learner's proof must outlive our platform. This is both an ethical position and a trust argument.

### 12.2 The credential ladder

Four levels. Naming extends *The Data Blueprint*, an asset you already own.

| Level | Credential | Proves | Requirements | Validity |
|---|---|---|---|---|
| **L1** | **Blueprint Foundation — Data & AI Literacy** | Informed participation: understands concepts, asks the right questions, uses AI safely | Complete a literacy path + scenario-based knowledge assessment ≥65% | 2 years |
| **L2** | **Blueprint Practitioner — [Domain]** | Can do the work in one domain, under supervision to independently | Domain core exam ≥70% **+ one assessed applied artifact** at Competent | 3 years |
| **L3** | **Blueprint Professional — [Domain] / Multi-domain** | Designs, decides, and leads; owns outcomes | Core exam ≥75% + **two** specialism exams ≥75% + substantial portfolio artifact at Proficient + **live defence** + 5 yrs verified experience | 3 years |
| **L4** | **Blueprint Fellow** | Shapes the discipline | L3 held ≥2 yrs + significant contribution (authored content, taught cohorts, assessed, spoke, published) + peer panel review | 3 years, renewable by continued contribution |

**Specialisms available at L2/L3** (choose per domain): Data Architecture & Modelling · Data Governance & Quality · Data Platforms & Engineering · Analytics & BI · Applied AI / ML · Generative & Agentic AI · AI Governance, Risk & Ethics.

**Micro-credentials** sit beneath the ladder: single-skill badges from individual course completion plus assessment. They are *not* professional certifications and must be visually and semantically distinguished — conflating the two is how credential systems lose credibility. They serve as motivational waypoints and as evidence contributing to a full credential.

### 12.3 The banded scoring model

> **Not in V1.** Banded scoring places a candidate onto a ladder. `MVP_BUILD_SPEC.md` DR-01 ships one credential with no ladder, so V1 uses a **single pass threshold** and moves all grade differentiation into the artifact rubric. The model below applies from Phase 2, when a second credential level exists.

One exam per domain core, scored into bands:

| Score band | Outcome |
|---|---|
| < 60% | Not yet — detailed per-skill gap report, targeted remediation, retake at reduced fee |
| 60–69% | **Foundation band** — L1-equivalent recognition for that domain |
| 70–74% | **Practitioner band** — satisfies the L2 knowledge requirement |
| ≥ 75% | **Professional band** — satisfies the L3 knowledge requirement |

Highest score is always retained. A candidate may retake to improve their band. **Crucially, the knowledge band alone never awards L2 or L3** — the applied artifact gate is mandatory. This is the structural difference between our credential and an exam certificate, and it must be communicated relentlessly, because it is the entire basis of the trust claim.

### 12.4 Experience verification

L3 and L4 require verified professional experience: structured CV submission, two professional referees contacted independently, and role/duration attestation. Verification is a human process supported by tooling, sampled and audited. **Do not automate away the human check at senior levels** — it is precisely where the credential's value concentrates.

### 12.5 Renewal, CPD, and revocation

- **Annual:** log ≥20 CPD points and re-attest to the code of ethics. Lapse → grace period (90 days) → `suspended` state, publicly visible as suspended rather than silently expiring.
- **CPD point sources:** platform learning (1 pt/hr) · external training (self-declared, sampled for audit) · conference attendance · **contribution** — speaking, mentoring, assessing, authoring (weighted highest, deliberately, to feed the supply side).
- **Triennial renewal:** re-attest, meet cumulative CPD, plus a short currency assessment on what has *changed* in the domain — drawn directly from the Body of Practice changelog. This is the mechanism that makes "living knowledge" a real credential property rather than marketing.
- **Revocation:** for proven misconduct or fraud, via the Integrity Officer with a two-person rule and a published appeals process. Revoked credentials fail public verification with a neutral, non-defamatory status.

### 12.6 Digital credentials and badges

- **Standard:** Open Badges 3.0, aligned to the W3C Verifiable Credentials data model — cryptographically signed, tamper-evident, and verifiable independently of our platform's continued existence.
- **Embedded metadata:** issuer, recipient (privacy-preserving identifier), credential type and level, skills asserted with proficiency, criteria met, **evidence references**, knowledge-base version, issue and expiry dates, and verification endpoint.
- **Public verification page** at `/certify/verify/[uid]` — no login, mobile-first, shows credential, skills, criteria, status (valid / expired / suspended / revoked) and — with holder consent — links to the evidence artifact. **This page is a growth surface, not a utility page**: it is where a hiring manager first meets the brand. Design it accordingly.
- **Sharing:** one-click to professional networks with pre-composed text, plus a wallet-compatible export.

---

## 13. ASSESSMENT FRAMEWORK

### 13.1 Assessment types and what each is actually for

| Type | Stakes | Purpose | Design notes |
|---|---|---|---|
| **Diagnostic** | None | Locate the learner on the skill graph | Adaptive; "I don't know" is a valid, unpenalised answer |
| **Knowledge check** | Formative | Retrieval practice | Unlimited attempts; explanation always shown; feeds spaced repetition |
| **Practice exam** | None | Readiness and calibration | Separate item pool from the live exam — never reuse live items |
| **Knowledge exam** | Summative | Certifies knowledge | Proctored, timed, banded, randomised from a calibrated bank |
| **Practical assignment** | Formative→Summative | Builds capability | Rubric-graded, scaffolded, resubmission allowed |
| **Portfolio artifact** | Summative | **Certifies capability** | The credential gate; human-assessed |
| **Defence interview** | Summative | Confirms authorship and depth | L3/L4; strongest anti-fraud control that exists |
| **Peer review** | Formative | Develops critical judgement | Structured rubric; contributes CPD; never credential-deciding |
| **Attestation** | Verification | Experience and CPD | Sampled and audited |

### 13.2 Item bank and psychometrics

- Item metadata: skill node, altitude, cognitive level (recall / application / analysis / evaluation), difficulty (calibrated from response data), discrimination index, exposure count, last-used, status.
- **Continuous item analysis.** Retire items with poor discrimination or an anomalous pass rate. Flag items where high scorers fail more often than low scorers — that is a broken item, not a hard one.
- **Exposure control.** Randomised forms drawn from a pool at least 5× the exam length, with per-item exposure caps. Rotate at least 20% of the bank annually.
- **Scenario items over recall items.** Target ≥60% of items presenting a situation and asking for a judgement. Recall items are cheap to write and nearly worthless as signal.

### 13.3 Practical assignment design

Every credential-bearing assignment ships with five published components:
1. **Brief** — a realistic enterprise scenario with genuine constraints and ambiguity.
2. **Deliverable specification** — exact expected outputs (e.g. a conceptual model + a governance decision memo + a stated risk register).
3. **Rubric** — published *before* submission, with criteria × four levels (Not yet / Competent / Proficient / Distinguished) and explicit descriptors.
4. **Exemplars** — at least one anonymised artifact at each of Competent, Proficient, and Distinguished. *This single asset does more for completion rates than any nudge campaign.*
5. **Time expectation** — an honest estimate.

**Anti-plagiarism through variation:** each candidate receives a parameterised variant of the brief (different industry, different constraint set, different data profile) generated from a template. Combined with the defence interview, this makes wholesale copying impractical.

### 13.4 Human + AI assessment pipeline

```
Submission
   ↓
1. Automated checks        completeness, format, similarity, submission integrity
   ↓
2. AI pre-assessment       rubric-aligned draft scores + evidence citations + draft feedback
   ↓                        → produces a CONFIDENCE score and flags ambiguity
3. Human assessor          blind-assigned, reviews artifact AND AI draft, confirms or overrides
   ↓                        → override rate is tracked as an AI quality metric
4. Defence (L3/L4)         live oral defence, structured question set
   ↓
5. Moderation sample       10% second-marked blind; disagreements → calibration
   ↓
6. Outcome                 award | remediate-and-resubmit | not-yet, always with reasoned feedback
```

**Governance rules, non-negotiable:** AI never issues a credential-bearing decision alone. Assessors must record a reason for any override. Inter-assessor agreement is measured continuously; assessors below threshold return to calibration. Candidates may appeal to a different assessor.

### 13.5 Integrity controls, layered

No single control is sufficient; the stack is the defence.

| Layer | Control |
|---|---|
| Identity | ID verification at first credential-bearing assessment; biometric or photo match at exam start |
| Environment | Online proctoring: room scan, screen recording, browser lockdown, secondary camera for high-stakes |
| Item security | Randomised forms, exposure caps, no item reuse across practice and live, watermarked screens |
| Behavioural | Response-time anomaly detection, answer-pattern similarity across candidates, tab-focus telemetry |
| Artifact | Parameterised brief variants, similarity checking, style-consistency analysis across a candidate's submissions |
| Human | **Defence interview** — the single most effective control against outsourced or AI-generated work |
| Post-hoc | Credential audit sampling; revocation with due process |

### 13.6 AI-use policy — declared per assessment

This is a **required field** on every assessment object and must be visible to the candidate before they begin. Getting this right is a positioning advantage: it signals we have thought seriously about what the credential means in an AI world, where most incumbents are still pretending the question does not exist.

| Policy | Meaning | Applies to |
|---|---|---|
| **AI-Permitted** | Use any tools; you are assessed on the outcome and your judgement | Most practical assignments — this reflects real work |
| **AI-Disclosed** | Use permitted; you must document what you used, how, and what you changed. Your critique of the AI output is itself assessed | Portfolio artifacts at L2/L3 — *the default and the most defensible position* |
| **AI-Restricted** | No AI assistance; proctored and locked down | Knowledge exams only |

**The stance, stated publicly:** we do not pretend AI is absent from professional work. We assess whether the candidate can direct it, evaluate its output, and be accountable for the result. The defence interview is what makes this credible — you cannot delegate a defence.

---

## 14. CORPORATE TRAINING MODEL

### 14.1 Why this is a distinct product, not a discount

The corporate buyer is not buying learning. They are buying **provable capability change, defensible spend, and reduced risk.** The individual learner is buying career advancement. Different job-to-be-done, different value proposition, different UI, different pricing, different sales motion. Building corporate as "the same platform with seats" is the most common way academies leave money on the table.

### 14.2 Offer structure

| Offer | Shape | Target | Indicative pricing logic |
|---|---|---|---|
| **Team Licence** | Per-seat annual, self-serve, full catalogue | 5–50 people | Per seat/year, volume-tiered |
| **Enterprise Licence** | Per-seat annual + SSO + HRIS + custom paths + CSM | 50–5,000 | Negotiated, floor + per seat |
| **Cohort Programme** | Blended: pre-work → live workshop → post-work → assessment → credential | 15–40 per cohort | Fixed per cohort — matches your existing 2-day model |
| **Executive Briefing** | A4 altitude, half-day or full-day, leadership team | 8–20 | Premium fixed fee |
| **Capability Assessment** | Diagnostic-only engagement producing a skills-gap report | Any size | Fixed fee; **the best land motion — sell the diagnosis first** |
| **Academic Cohort** | Semester-aligned, LTI-integrated | 30–200 students | Low per-student, high volume |

**Strategic note on the Capability Assessment:** selling a diagnostic first inverts the usual sales problem. Instead of arguing that the buyer needs training, you show them their own gap data. It is a low-friction, low-price entry that creates the evidence base for the larger programme — and it produces the pre-assessment baseline that makes renewal provable.

### 14.3 Corporate console capabilities

**Adoption & engagement:** seats assigned vs activated vs active; activation funnel; utilisation alerts from week two; at-risk learner list with one-click nudge.

**Skills intelligence — the differentiating feature:**
- **Skills-gap heatmap:** teams × skills, colour-coded by average proficiency vs the target profile for their roles. One screen that a CDO can take to a board meeting.
- **Coverage risk:** skills where only one or two people in the organisation are proficient — a single-point-of-failure view that reframes training as risk management. This is a strong, underused executive argument.
- **Benchmarking:** anonymised comparison against industry and company-size cohorts. Only viable once there is sufficient data; anonymise with a k-anonymity floor.
- **Before/after uplift:** requires the baseline diagnostic. Enforce it in the onboarding flow.

**Programme management:** assign paths to individuals, teams, or dynamic groups (by role, department, or HRIS attribute); mandatory vs recommended; deadlines and escalation; cohort scheduling; instructor assignment; waitlists.

**Compliance & evidence:** attendance registers per session; completion certificates; assessment evidence; exportable audit trail; **funding-scheme documentation pack** (§18.12).

**Reporting:** executive summary (auto-generated quarterly, board-ready); operational detail; scheduled email reports; CSV/API export; white-labelled PDF.

**Integrations:** SAML/OIDC SSO · SCIM provisioning · HRIS sync (org structure, roles, departments) · calendar · Slack/Teams notifications · LMS interop (LTI 1.3, SCORM/xAPI export for customers who must host in their own LMS).

### 14.4 Manager and learner experience inside a corporate account
The **team manager** sees an aggregate-first view — team progress, at-risk members, skills coverage — with individual detail only for direct reports. The **corporate learner** sees the normal learner experience plus assigned programmes, deadlines, and their organisation's branding. Their personal credentials remain **personally owned and portable**: they leave with the employee. State this explicitly in the product and the contract; it is both ethically correct and a strong differentiator with learners.

### 14.5 Success and renewal engineering
A structured 60-day activation plan (kickoff, baseline diagnostic, path assignment, first cohort session, week-2 utilisation review, day-30 checkpoint, day-60 report). Renewal risk is scored from utilisation, completion, credential count, and admin engagement; low scores trigger intervention before the renewal conversation, not during it.

---

## 15. COMMUNITY MODEL

### 15.1 Purpose
Community is not a feature; it is the **retention and supply engine**. It converts a transaction into an identity, and consumers into contributors. Without it, every learner is a one-time purchase and every assessor must be hired.

### 15.2 Structure

| Layer | Description | Governance |
|---|---|---|
| **Global commons** | Platform-wide discussion, announcements, AMAs, knowledge Q&A | Platform-moderated |
| **Domain circles** | Five interest circles matching the domains | Volunteer moderators + staff presence |
| **Regional chapters** | Geographic, locally led, local language, in-person and virtual events | Chapter Lead under published standards |
| **Cohort groups** | Private, time-boxed, tied to a specific cohort | Instructor-facilitated |
| **Study groups** | Self-organised, credential-focused, peer accountability | Self-governed with light tooling |
| **Alumni network** | Credential holders by level and domain | Directory + private space |

**Chapter model, learning from the reference ecosystem but improving on it:** local autonomy over programming, but **published quality standards and tiered status** (Forming → Active → Established) with visible criteria — minimum event cadence, member count, code-of-conduct compliance. The reference model's chapters vary wildly in quality because there is no visible standard. Tiering fixes this without central control, because status is motivating.

### 15.3 Contribution ladder — designed to solve assessor supply

```
Consumer → Participant → Contributor → Recognised Expert → Steward
 reads      asks/answers   speaks,        assessor,          chapter lead,
            attends        writes,        instructor,        standards council,
                           mentors        author             Fellow
```

Each step has explicit criteria, a visible profile marker, and real benefits (CPD points weighted highest for contribution, revenue share where applicable, fee waivers, early access, and standing). **This ladder is how the evidence-based credential model becomes economically viable** — the binding constraint on credential throughput is qualified assessor hours, and the ladder is the machine that manufactures assessors from credential holders.

### 15.4 Events
Types: webinars · virtual and in-person chapter meetups · workshops · study sessions · an annual online summit · office hours with instructors · exam-prep clinics.
Platform capabilities: listings, registration and capacity, calendar sync, reminders, virtual meeting integration, **attendance capture** (which feeds both CPD and funding-scheme compliance), recording library, speaker roster and call-for-speakers, post-event feedback, and CPD credit issuance.

### 15.5 Mentoring
Structured matching on skill gaps, target role, domain, region, and language. Mentee requests → mentor accepts → time-boxed relationship (e.g. 6 sessions over 3 months) → structured session logs → feedback → CPD credit for the mentor. Vetted mentors, code of conduct, and a clear reporting route.

### 15.6 Health metrics and the cold-start problem
Track: % of members who post within 30 days · question response rate and median time-to-first-response · active chapters (an event in the last 90 days) · contributor conversion rate · mentoring relationships completed.

**Cold start is the real risk.** A visibly empty community is worse than no community. Mitigations: launch community *only* alongside the first cohort, not before; guarantee staff and instructor response within 24 hours for the first year; seed with genuinely useful content; start with a small number of active spaces rather than a full taxonomy of empty ones; and gate the public "join the community" message until the space is demonstrably alive.

---

## 16. CONTENT & KNOWLEDGE ARCHITECTURE

### 16.1 The Body of Practice
The canonical, living reference layer. Named "Body of **Practice**" deliberately: the emphasis is on what practitioners *do*, and the name signals difference from static bodies of knowledge.

**Structure:**
```
Domain (5)
 └─ Area              e.g. "Metadata Management"
     └─ Topic         e.g. "Data Lineage"
         └─ Node      atomic, citable, versioned unit of knowledge
```
Each node carries: definition · why it matters · how it is done in practice · common failure modes · related patterns · maturity indicators · linked skills · linked courses · external references · **version and changelog** · review status and owner.

### 16.2 Living versioning — the D2 differentiator made real

The knowledge base is a **semantically versioned product**:
- Every node has a version and a human-readable changelog entry.
- Every course lesson cites nodes *at a version*. When a node changes materially, all citing lessons are flagged for review automatically. Content and canon cannot silently drift.
- Every credential records the knowledge-base version it was earned against.
- The public **`/knowledge/changelog`** shows what changed and when. This is a trust artifact and a genuinely differentiating public surface — no incumbent has one.
- Renewal currency assessments are generated from the changelog delta since the holder's last assessment. *This closes the loop: living knowledge becomes a real, testable credential property rather than a marketing claim.*

Review cadence by volatility: GenAI/Agentic **6 months** · AI/ML **12 months** · Platforms/Engineering **12 months** · Governance **18 months** · Data Foundations **24 months**.

### 16.3 Managing scale without overwhelm

A professional knowledge ecosystem fails not from having too little content but from being unnavigable. Nine mechanisms, each addressing a specific failure mode:

1. **Progressive disclosure.** Three depths on every topic — a one-paragraph answer, a 5-minute explainer, and the full treatment. Most visitors want depth 1 and are driven away by depth 3.
2. **Faceted rather than hierarchical browsing.** Filter by domain × altitude × modality × duration × language, instead of drilling a deep tree. Hierarchies break down past ~50 items.
3. **Altitude filtering as the primary noise reducer.** An executive filtering to A4 sees a small, relevant, respectful set. This is the single highest-leverage IA decision in the document.
4. **Personalised surfacing.** The authenticated home shows *your next action*, not the catalogue. Browsing is a deliberate act, not the default state.
5. **Search that answers.** Hybrid semantic + keyword search with an AI-composed answer, always with citations to specific nodes so the user can verify and go deeper.
6. **Curated entry points.** Editorial collections ("Starting in data governance", "GenAI for the enterprise") that give a human-curated route into a large corpus.
7. **Consistent, predictable object shapes.** Every node and module looks structurally the same. Predictable structure massively reduces perceived complexity.
8. **Explicit "you are here".** Breadcrumbs plus the learner's position on the skill graph — orientation is what large systems destroy first.
9. **Ruthless deprecation.** An archive with a visible policy. Growth without pruning is how knowledge bases rot; make deletion a normal, celebrated operation.

### 16.4 Content operations
Pipeline: backlog (sourced from learner questions, assessment failure clusters, community gaps, market changes) → outline with outcomes → draft → SME review → editorial review → accessibility check → publish → measure → review at due date.
Quality bar for every published object: outcomes stated · skills mapped · knowledge nodes cited · accessible (WCAG 2.2 AA, captions, transcripts, alt text) · reviewed by a second qualified person · localisation-ready (externalised strings, no text baked into images).

### 16.5 Localisation
Priority sequence: English → Bahasa Malaysia → Arabic → Mandarin → Spanish. Localise in this order: UI strings → credential and assessment materials → literacy content (the widest audience) → practitioner content. Note RTL support for Arabic must be designed into the component library from the start, not retrofitted.

---

## 17. AI FEATURES

Every AI feature below is justified by a specific learner or operator problem. Features that exist only to say "AI-powered" are excluded deliberately — that noise is itself a differentiator when everyone else is adding it.

### 17.1 Learner-facing

| Feature | Problem solved | Mechanism | Guardrails |
|---|---|---|---|
| **AI Tutor** | Learners get stuck at 11pm with nobody to ask | RAG over the Body of Practice + current lesson context; Socratic by default | Answers only from our corpus; cites nodes; says "I don't know" and routes to community rather than confabulating; **never gives assessment answers** and knows when a user is in an assessment context |
| **Adaptive diagnostic** | Fixed tests waste time and mis-measure | Item-response-theory-style adaptive selection over the skill graph | Bounded length; transparent about what it measured |
| **Path generation** | Learners don't know what to learn or in what order | Skill-gap sub-graph + prerequisites + time budget + role target | Always explains *why* each item is included; fully overridable by the learner |
| **Concept explainer** | One explanation doesn't fit everyone | Re-explains a concept at a different altitude, with a different analogy, or in the learner's language | Grounded in the same source node so the substance never drifts |
| **Practice generator** | Not enough practice items | Generates formative practice from a node + rubric | **Formative only.** Generated items never enter the credential-bearing bank without human calibration |
| **Artifact coach** | The evidence gate is intimidating | Reviews a draft against the published rubric and gives structural feedback | Coaches on structure and completeness; explicitly refuses to write the substance; all coaching interactions are logged and disclosed to the assessor |
| **Study scheduler** | Life interrupts learning | Spaced-repetition scheduling and calendar-aware planning | Forgiving; re-plans rather than shames |
| **Semantic search with answers** | Large corpora are unnavigable | Hybrid retrieval + composed answer with citations | Citations always; never presents an answer without a verifiable source |

### 17.2 Assessor and instructor-facing

- **AI pre-assessment** — rubric-aligned draft scoring with evidence citations from the artifact, plus a confidence score. Cuts assessor time substantially while the human retains the decision. Override rate is monitored as the core quality metric.
- **Feedback drafting** — composes reasoned feedback from the assessor's rubric selections; the assessor edits and owns it. Solves the real bottleneck, which is writing feedback, not deciding a grade.
- **Item quality analysis** — flags items with poor discrimination, ambiguous wording, or implausible distractors.
- **Content gap detection** — clusters learner questions and assessment failures to produce a ranked authoring backlog. Closes growth Loop 4.
- **Authoring assistance** — outline generation, outcome drafting, accessibility checking, reading-level analysis. Human authorship remains mandatory for canonical content.

### 17.3 Organisation-facing
- **Skills-gap narrative** — turns a heatmap into a written executive summary with prioritised recommendations.
- **Role profile inference** — proposes a target skill vector from job descriptions the customer uploads.
- **Cohort risk prediction** — flags learners likely not to complete, early enough to intervene.

### 17.4 AI governance — we must model what we teach

This section is a product feature, not compliance overhead. We are selling AI governance credentials; our own AI use is a demonstration and will be scrutinised.

1. **Disclosure** — any AI-generated or AI-assisted content is labelled, always.
2. **Grounding** — learner-facing AI answers only from the versioned corpus, with citations. No open-domain generation on substantive questions.
3. **Human decision authority** — no AI system issues a credential, revokes one, or makes a final assessment decision.
4. **Evaluation** — a maintained eval set for tutor accuracy, refusal correctness, and citation validity; regression-tested on every model or prompt change.
5. **Privacy** — learner data is not used to train third-party models; explicit contractual terms with providers; data residency options for enterprise.
6. **Bias monitoring** — assessment outcomes analysed for disparate impact across demographic and linguistic groups; AI pre-assessment override rates analysed by candidate first language, which is where bias most plausibly enters.
7. **Published AI policy** — at `/about/integrity`, in plain language. Transparency here is a competitive asset.

---

## 18. PORTAL MODULES

Each module is a bounded functional area with an owner, a data domain, and defined interfaces. Suitable as a service decomposition or as modules within a modular monolith (recommended for phase 1 — see §26).

| # | Module | Responsibility | Key entities |
|---|---|---|---|
| **18.1** | **Identity & Access** | Auth, MFA, SSO/SAML/OIDC, SCIM, RBAC/ABAC with scopes, sessions, consent | User, Identity, Role, Scope, Consent, AuditEvent |
| **18.2** | **Profile & Skills** | Learner profile, skill vector, proficiency + decay, role targets, public profile | Profile, SkillAssertion, RoleTarget, Endorsement |
| **18.3** | **Skill Graph** | Graph CRUD, prerequisites, cycle detection, versioning, gap computation | SkillNode, SkillEdge, RoleProfile |
| **18.4** | **Catalog & Content** | Content object model, authoring, versioning, publishing, review queue, media, i18n | Program, Path, Course, Module, Lesson, Block, Version |
| **18.5** | **Learning Delivery** | Enrolment, player, progress, resume, notes, bookmarks, offline, xAPI statements | Enrolment, Progress, Activity, Note |
| **18.6** | **Path Engine** | Curated/role/adaptive path generation, milestones, scheduling, re-planning | Path, Milestone, Schedule, Recommendation |
| **18.7** | **Assessment Engine** | Item bank, forms, delivery, timing, scoring, psychometrics, practice, diagnostics | Item, Form, AssessmentSession, Response, Score |
| **18.8** | **Assignment & Portfolio** | Briefs, variant generation, submission workspace, files, rubrics, feedback, resubmission | Assignment, Brief, Submission, Rubric, Evaluation, Artifact |
| **18.9** | **Assessor Workbench** | Blind queues, grading UI, AI pre-assessment surface, calibration, moderation, appeals | AssessorProfile, Queue, Calibration, Appeal |
| **18.10** | **Credentialing** | Credential definitions, eligibility rules engine, issuance, Open Badges 3.0/VC minting, verification, renewal, CPD, revocation | CredentialDef, Candidacy, Credential, Badge, CPDEntry, Renewal |
| **18.11** | **Proctoring & Integrity** | Proctor integration, identity checks, lockdown, anomaly detection, incident case management | ProctorSession, IntegrityFlag, Case |
| **18.12** | **Compliance & Funding** | Attendance registers, session evidence, evaluation forms, trainer/course documentation packs, scheme-specific exports (**HRD Corp Malaysia first**), retention policy | Session, AttendanceRecord, EvidencePack, SchemeProfile, ClaimBundle |
| **18.13** | **Corporate Console** | Org model, teams, seats, assignment, heatmaps, benchmarking, reporting, integrations | Organisation, Team, Seat, Assignment, Report |
| **18.14** | **Academic Console** | Cohort licences, LTI 1.3 (NRPS + AGS), roster sync, gradebook writeback, outcome reporting | Institution, AcademicCohort, LtiRegistration, GradeSync |
| **18.15** | **Instructor Studio** | Authoring, cohort management, live sessions, attendance, marking queue, analytics, earnings | InstructorProfile, Cohort, LiveSession, Payout |
| **18.16** | **Knowledge Base** | Body of Practice CRUD, versioning, changelog, glossary, patterns, templates, cross-linking | Node, NodeVersion, ChangelogEntry, Term, Pattern |
| **18.17** | **Search & Discovery** | Hybrid semantic + keyword index, facets, AI answers with citations, recommendations | Index, Query, Facet |
| **18.18** | **Community** | Feeds, forums, chapters, groups, mentoring, reputation, moderation, code of conduct | Post, Thread, Chapter, Group, MentorMatch, Reputation |
| **18.19** | **Events** | Listings, registration, capacity, waitlists, reminders, virtual integration, attendance, recordings, feedback | Event, Registration, Attendance, Recording |
| **18.20** | **Commerce & Billing** | Catalogue pricing, carts, subscriptions, invoicing, vouchers, multi-currency, local payment rails, refunds, revenue share, tax | Product, Price, Order, Subscription, Invoice, Voucher, Payout |
| **18.21** | **Notifications** | Multi-channel (email, in-app, push, Slack/Teams), preferences, templates, digests, quiet hours | Notification, Template, Preference |
| **18.22** | **Analytics & LRS** | Event pipeline, xAPI learning record store, dashboards, cohort analytics, funnels, exports | Event, LRSStatement, Metric, Dashboard |
| **18.23** | **AI Services** | Model routing, RAG orchestration, prompt/version registry, evals, cost controls, guardrails, logging | AiSession, RetrievalContext, EvalRun, PromptVersion |
| **18.24** | **Admin & Governance** | Feature flags, config, standards council workflows, integrity cases, audit log, data retention, GDPR/PDPA request handling | Setting, FeatureFlag, AuditLog, DataRequest |

---

## 19. MVP FEATURES

### 19.1 MVP thesis
The MVP must prove exactly one thing: **that an evidence-based credential can be delivered end-to-end and that people will pay for it and employers will respect it.** Everything not required to prove that is deferred. Target: **4–6 months** to a paying first cohort.

Concretely, the MVP delivers *one pilot domain* (Data Foundations — which you already own — held as seeded data, never hardcoded), *one credential* (no levels, no bands — see `MVP_BUILD_SPEC.md` **DR-01**), *one modality* (blended cohort — which you already deliver), and *one buyer* (corporate, plus individual self-serve). Depth over breadth: a narrow, complete, excellent vertical slice beats a broad shallow platform every time in a trust business.

> **Scope authority.** `MVP_BUILD_SPEC.md` supersedes this section (§19–21) for what actually gets built. This section is retained as the original reasoning.

### 19.2 In scope

**Foundation**
- Auth (email + Google/LinkedIn), profile, roles with scopes, basic RBAC
- Responsive marketing site: home, learn, certify, organisations, knowledge, about, pricing, contact
- Payments: card + at least one local rail (Malaysia: FPX/DuitNow), invoicing, vouchers, multi-currency display

**Learn**
- Catalogue with domain × altitude × modality faceting
- Course player: video, rich text, downloads, embedded diagrams; progress tracking and resume
- **Data Foundations path** — your 8 existing modules, restructured to the standard module rhythm
- **Literacy path (A1)** — data + AI literacy, the corporate volume product
- Cohort scheduling, live-session links, and attendance capture
- Knowledge checks with explanations

**Prove**
- Free adaptive-lite diagnostic (fixed adaptive rules; full IRT deferred)
- Item bank with basic authoring and randomised forms
- Proctored knowledge exam via a third-party proctoring integration (**buy, do not build**)
- Single pass threshold on the knowledge assessment *(originally banded scoring; superseded by DR-01 — bands existed to place candidates onto a ladder, and V1 has no ladder)*
- **One practical assignment per credential** with published brief, rubric, and exemplars
- Submission workspace, assessor queue, rubric grading UI, structured feedback, resubmission
- Manual moderation sample

**Credential**
- **One** credential definition and its eligibility rules *(originally L1 Foundation + L2 Practitioner; superseded by DR-01)*
- Open Badges 3.0 issuance via an established issuing platform (**integrate, do not build a minting stack**)
- Public verification page
- CPD log (manual entry) and renewal state machine

**Know**
- Body of Practice v1 for Data Foundations: ~80–120 nodes + glossary
- Keyword + basic semantic search
- Public knowledge articles for SEO

**Corporate (thin but real)**
- Org accounts, seat assignment, invite flows
- Team dashboard: progress, completion, assessment results
- Attendance registers and completion certificates
- **HRD Corp evidence pack export** — this is a small feature with disproportionate commercial value in your primary market; it directly removes the buyer's biggest administrative objection

**AI (one feature, done well)**
- **AI Tutor** grounded in the Body of Practice with citations and assessment-context awareness. One excellent AI feature beats five mediocre ones, and this is the one learners feel every day.

**Instructor (minimum viable)**
- Cohort roster, attendance marking, marking queue, basic learner analytics
- Authoring via structured forms (a full WYSIWYG studio is phase 2)

**Ops**
- Admin console for users, content publishing, credential rules, integrity flags
- Core analytics: funnel, activation, completion, assessment outcomes
- Email notifications and a transactional template set

### 19.3 Explicitly OUT of MVP
Community forums and chapters (launch with the first cohort, not before — see §15.6) · mentoring · events module · adaptive path generation (curated paths only) · L3/L4 credentials and defence interviews · academic/LTI · SCIM and HRIS sync · labs and sandboxes · mobile apps · localisation beyond English · benchmarking · AI pre-assessment (humans mark everything in MVP — this is how you learn what the rubric should actually be) · partner-provider console · revenue share and payouts.

### 19.4 MVP success criteria
One corporate cohort delivered end-to-end and paid · ≥25 individual paying learners · ≥60% of L2 candidates submitting an artifact · assessment SLA met ≥90% of the time · ≥1 employer stating publicly they recognise the credential · qualitative evidence that the artifact requirement is seen as a strength, not a barrier.

---

## 20. PHASE 2 FEATURES

Roughly months 7–18. Sequenced by dependency and by commercial return.

**Scale delivery**
- Domains GA (Generative & Agentic AI — **highest priority**, it is the market gap), then GT, AI, DE
- L3 Professional credential: multi-exam composition, portfolio artifact, **defence interview scheduling and conduct tooling**, experience verification workflow
- Specialism exams and modular credential composition
- Instructor Studio: full authoring environment, versioning workflow, revenue share and payouts
- Accredited Partner Provider programme + public directory (the delivery-scaling mechanism from §A2)

**Deepen the product**
- Full adaptive path generation and IRT-based adaptive diagnostics
- Skill decay modelling and confidence display
- Labs / hands-on sandbox environments (start with GenAI notebooks — highest value, lowest infrastructure cost)
- AI pre-assessment pipeline with calibration and override tracking
- Artifact coach
- Spaced repetition scheduler

**Community**
- Forums, domain circles, reputation
- Chapters with tiered status, chapter pages, chapter events
- Events module with registration and CPD credit
- Mentoring matching
- Contribution ladder with visible status and CPD weighting

**Enterprise**
- SSO, SCIM, HRIS sync
- Skills-gap heatmap, coverage-risk view, benchmarking
- Custom learning paths and org-specific content
- Executive auto-generated quarterly reporting
- Slack/Teams integration
- SCORM/xAPI export for customers hosting in their own LMS

**Academic**
- LTI 1.3 with NRPS and AGS, roster sync, gradebook writeback
- Academic console and graduate outcome reporting

**Global**
- Bahasa Malaysia and Arabic localisation, including RTL
- Regional pricing and additional payment rails
- Data residency options

---

## 21. FUTURE VISION

Years 2–5. Directional, deliberately fewer commitments, ordered by strategic weight rather than by ease.

1. **Become the reference standard for AI capability.** Publish the capability standard openly, governed by an independent standards council with practitioner, employer, and academic representation. **Open standard, proprietary assessment** — this is the correct structural position, and it is exactly how the reference ecosystem built its moat.
2. **Employer-side verification API.** Let ATS and HR systems verify credentials and query skill assertions programmatically, with holder consent. When the credential becomes machine-readable to hiring systems, it becomes infrastructure rather than a certificate.
3. **Continuous credentialing.** Move from a three-year cycle to a *continuously refreshed* proficiency signal driven by ongoing micro-assessment, verified work evidence, and contribution. The credential becomes a live signal rather than a snapshot — this is the natural endpoint of skill decay modelling and nobody in the market is close to it.
4. **Simulation-based assessment.** Realistic environments where candidates operate on a synthetic enterprise data estate under time and constraint pressure — the strongest possible evidence of capability, and effectively impossible to fake.
5. **AI capability observatory.** Publish anonymised, aggregated skills data as an industry benchmark report. A powerful trust, PR, and enterprise-sales asset, and it compounds with scale.
6. **Federated regional academies.** Licensed regional operators delivering in local language under the global standard. Scales delivery without scaling headcount; assessment stays central. Directly reuses the pattern identified in §A2.
7. **Adjacent standards.** Extend the capability standard into AI governance and AI safety roles as regulation matures — regulatory pressure will manufacture demand for exactly this credential.
8. **Employer-embedded learning.** Meet learners inside the tools where they work rather than requiring them to visit a portal.

**What we will not do:** become a general-purpose MOOC, a job board, a consultancy, or a degree-granting institution. Each would dilute the trust asset that is the entire business.

---

## 22. UI/UX DESIGN PRINCIPLES

Twelve principles, each with a testable implication. These are written so a design AI can act on them and so a reviewer can judge whether a mockup complies.

| # | Principle | Implication a designer can act on |
|---|---|---|
| **1** | **One question per screen.** Each screen answers a single question the user is holding. | If you cannot state the screen's one question in a sentence, split it. Dashboard = "what should I do next?" Not "here is everything." |
| **2** | **Progress must be meaningful, not numeric.** | Lead with the named milestone and what it makes the learner capable of. Percentages are secondary and never the largest element. |
| **3** | **Always show the next action.** | Every authenticated screen has exactly one primary action, visually unambiguous. Never leave a learner asking "now what?" |
| **4** | **Reduce by altitude, not by hiding.** | Filtering to A4 shows a small, respectful set — not a truncated version of the practitioner catalogue with a "show more" link. |
| **5** | **Credentials must feel earned.** | Award moments get real design investment: full-screen, specific about what was demonstrated, immediately shareable. A toast notification for a professional credential is a failure of respect. |
| **6** | **Assessment UI must lower anxiety, not raise it.** | Calm palette, clear time remaining without a red countdown, visible saved state, obvious navigation between items, no surprises. Publish rules before entry. Anxiety costs marks and generates support tickets. |
| **7** | **Evidence gates need scaffolding, not warnings.** | The artifact submission flow is a guided workspace with checkpoints, a visible rubric, and exemplars — never a single file-upload box with a deadline. |
| **8** | **Trust is designed, not asserted.** | Show the rubric, the assessor's reasoning, the knowledge version, the changelog, the verification. Transparency *is* the brand. |
| **9** | **Aggregate first for managers, detail on demand.** | Corporate views open on the team, not on a list of individuals. Individual detail requires an intentional click — it is a privacy posture as much as an IA one. |
| **10** | **Mobile is for consuming and checking; desktop is for producing.** | Reading, video, knowledge checks, community, and credential viewing must be excellent on mobile. Authoring, artifact submission, grading, and org dashboards are desktop-first and may simply say so. |
| **11** | **Accessibility is a requirement, not a phase.** | WCAG 2.2 AA minimum. Keyboard-complete. Captions and transcripts on all video. Never colour alone to convey meaning — critical for the skills heatmap, which must also encode value as text or pattern. |
| **12** | **Speed is a feature of learning.** | Sub-second navigation, instant resume, optimistic UI on progress. Every second of latency between intent and content is attrition. |

**Three interaction patterns worth specifying explicitly:**
- **Resume-first.** The authenticated home always leads with a single "continue" card containing the exact next lesson, its duration, and a one-click start.
- **Explain-the-recommendation.** Every AI or algorithmic suggestion carries a plain-language "why this" that the learner can expand and override. Unexplained personalisation reads as manipulation.
- **Honest empty states.** Empty community spaces, empty portfolios, and empty dashboards get designed states that say what will appear here and how to make it appear — not a spinner or a shrug.

---

## 23. RECOMMENDED KEY SCREENS

Twenty screens for the first mockup, in build order. Each specifies purpose, key elements, and the primary action.

### Public

**S1 — Home.** *Purpose:* segment the visitor in under 30 seconds.
Hero with a single clear value claim (the evidence-based credential) · **three front doors** — build my career / train my team / teach & partner · the credential ladder visualised · what makes this different (the three differentiators, D1–D3) · social proof (employers, credential holders, cohorts delivered) · domain tiles.
*Primary action:* **Start the free diagnostic.**

**S2 — Diagnostic (multi-step).** Progress indicator with honest remaining count · one question per screen · scenario-based items · **"I'm not sure" always available and never penalised** · encouraging micro-copy · partial insight surfaced mid-flow ("you're strong on modelling — let's check governance").
*Primary action:* continue → then create account to unlock the full report.

**S3 — Diagnostic Result.** The highest-conversion screen on the site. Skill radar or bar profile across the five domains · **named gaps with plain-language descriptions** · target-role comparison · recommended path with honest hours and a credential target · a comparison to peers in similar roles.
*Primary action:* start the recommended path.

**S4 — Credential Detail.** What it proves · who it's for · the ladder position · **requirements broken into knowledge + evidence + experience** · a sample brief and the full rubric · exemplar artifacts · fees, timeline, validity · verification example · FAQ.
*Primary action:* check my readiness (free) → register as candidate.

**S5 — Course / Path Detail.** Outcomes as observable capabilities · syllabus by module with durations · skills gained mapped to the graph · instructor · modality options with dates · prerequisites with a "do I have these?" check · price and funding eligibility.
*Primary action:* enrol or join the next cohort.

**S6 — Knowledge Article.** The SEO and trust surface. Progressive disclosure (quick answer → explainer → depth) · **version and last-reviewed stamp** · cross-links · related skills and courses · glossary hover definitions · AI-search entry point.
*Primary action:* contextual — "learn this properly" linking to the relevant module.

**S7 — Public Credential Verification.** Reached from a badge. Holder name and photo · credential, level, domain · **skills asserted with proficiency** · criteria met · issue and expiry dates · status chip (valid / expired / suspended / revoked) · evidence link if the holder consents · issuer statement.
Mobile-first, fast, unambiguous. *This screen is where a hiring manager forms their first impression of the entire brand.*

**S8 — For Organisations.** Outcome-led, not feature-led. The capability-assessment entry offer · sample skills heatmap · cohort model · funding/levy support (HRD Corp) · case evidence · pricing logic.
*Primary action:* book a capability assessment.

### Learner workspace

**S9 — Learner Dashboard.** See §24.1.

**S10 — Course Player.** Content pane · collapsible module navigation with progress · notes · transcript · **AI tutor side panel with lesson context** · knowledge-base references · next/previous with autosave and resume.
*Primary action:* continue.

**S11 — My Path (skill graph view).** The signature visual. Path as a milestone journey with the learner's current position clearly marked · completed / current / locked states · **skills unlocked shown as capabilities, not topic names** · time to credential · re-plan control.
*Primary action:* next milestone.

**S12 — Skill Profile & Gaps.** Skill vector across domains with proficiency and **confidence decay** · target role comparison · gap list ordered by impact · credential readiness percentages · evidence backing each assertion.
*Primary action:* close the highest-impact gap.

**S13 — Assessment Runner.** Deliberately minimal chrome. Item · options · flag-for-review · item navigator · **calm time display** · saved-state indicator · proctoring status · pre-start rules and AI-policy screen · post-submission confirmation with expected result timing.

**S14 — Assignment Workspace.** The differentiating screen. Brief (with the candidate's parameterised variant) · deliverable checklist · **rubric always visible in a side panel** · exemplar viewer · draft workspace with autosave · file uploads · AI-use disclosure field · self-check against rubric before submission · submit with confirmation.
*Primary action:* submit for assessment.

**S15 — Assessment Feedback.** Rubric with the assessor's selections and written reasoning per criterion · overall outcome · **specific remediation plan if "not yet"** · resubmission window and CTA · appeal route.

**S16 — My Credentials.** Earned credentials as designed badge cards · status and expiry · CPD progress ring toward renewal · share controls · download and wallet export · verification link · in-progress candidacies with stage tracker.

### Role workspaces

**S17 — Assessor Review.** Two-pane: artifact viewer left, rubric grader right · **AI pre-assessment draft shown as a collapsible suggestion with confidence, never pre-filled into the human's fields** · evidence citations linking rubric criteria to artifact locations · feedback composer · decision · time tracker · escalate/appeal.

**S18 — Instructor Cohort View.** Roster with progress · session schedule · **attendance marking (bulk and individual)** · at-risk learners flagged · marking queue count · materials · announcements · export for compliance.

**S19 — Corporate Dashboard.** See §24.2.

**S20 — Skills Heatmap.** Teams × skills matrix with proficiency colour **and** a text/numeric value (accessibility) · filters by team, role, domain, altitude · target-profile overlay · **coverage-risk view highlighting single points of failure** · drill-through to team then individual · export and share.

---

## 24. RECOMMENDED DASHBOARD DESIGNS

### 24.1 Learner Dashboard
Answers exactly one question: **"What should I do next, and am I on track?"**

```
┌────────────────────────────────────────────────────────────────────────┐
│  Good morning, Daniel          [🔍 search]  [🔔]  [avatar ▾]          │
├────────────────────────────────────────────────────────────────────────┤
│  ▶ CONTINUE                                                            │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Data Modelling · Lesson 4: Normalisation in practice   12 min    │  │
│  │ Milestone 3 of 7 — "Model an enterprise data domain"             │  │
│  │                                            [ Continue → ]         │  │
│  └──────────────────────────────────────────────────────────────────┘  │
├──────────────────────────────────┬─────────────────────────────────────┤
│  MY PATH                         │  CREDENTIAL PROGRESS                │
│  Blueprint Practitioner —        │  ● Knowledge exam    ✔ 74% (Prac.)  │
│  Data Foundations                │  ● Applied artifact  ◐ in progress  │
│  ●━━●━━●━━◉━━○━━○━━○             │  ○ Experience        — not required │
│  On track · ~14 hrs remaining    │  Est. credential date: 12 Oct       │
│  Target: 12 October              │            [ Open artifact brief ]  │
├──────────────────────────────────┼─────────────────────────────────────┤
│  THIS WEEK                       │  YOUR SKILLS                        │
│  ☑ 2 of 3 sessions done          │  Data Foundations   ████████░░ 4.1  │
│  ▸ Wed 8pm — Live: Modelling Q&A │  Governance         █████░░░░░ 2.6  │
│  ▸ Fri — Knowledge check due     │  AI & GenAI         ███░░░░░░░ 1.8 ⚠│
│                                  │  ⚠ Largest gap vs your target role  │
│                                  │            [ Close this gap → ]     │
├──────────────────────────────────┴─────────────────────────────────────┤
│  FROM YOUR COMMUNITY        3 replies · Chapter KL event 14 Sep         │
└────────────────────────────────────────────────────────────────────────┘
```
**Design notes:** the continue card is always first and always largest. Milestone naming beats percentage. The skill gap is framed as an opportunity with a direct action. Community is present but subordinate — it must not compete with the learning action. On mobile this collapses to a single column in exactly this priority order.

### 24.2 Corporate / L&D Dashboard
Answers: **"Is this investment working, and where do I act?"**

```
┌────────────────────────────────────────────────────────────────────────┐
│  Acme Bank · Data & AI Capability          Q3 2026 ▾   [Export ▾]      │
├─────────────┬─────────────┬─────────────┬──────────────────────────────┤
│ SEATS       │ ACTIVATION  │ COMPLETION  │ CREDENTIALS EARNED           │
│ 184 / 200   │ 87%   ▲6    │ 62%   ▲11   │ 41   (L1 29 · L2 12)         │
│ 16 unused   │ vs last qtr │ vs last qtr │ target 60 by Dec             │
├─────────────┴─────────────┴─────────────┴──────────────────────────────┤
│  CAPABILITY UPLIFT (baseline → now)                                    │
│  Data Foundations   2.1 ──────────▶ 3.4   ▲1.3                        │
│  Governance         1.8 ──────▶     2.7   ▲0.9                        │
│  AI & GenAI         1.2 ────▶       2.1   ▲0.9                        │
│  Industry benchmark (banking, 1000+):  2.9 · 2.4 · 1.9                │
├────────────────────────────────────────┬───────────────────────────────┤
│  SKILLS GAP HEATMAP                    │  NEEDS ATTENTION              │
│           Found. Gov. Plat. AI  GenAI  │  ⚠ 16 seats never activated   │
│  Data Eng   4.2   3.1   4.0  2.2  1.9  │    [ Send reminder ]          │
│  Analytics  3.8   2.4   2.1  2.0  1.7  │  ⚠ Risk & Compliance team     │
│  Risk/Comp  2.2   3.9   1.4  1.1  0.8  │    lowest AI literacy         │
│  Business   2.6   1.9   1.2  1.4  1.2  │    [ Assign literacy path ]   │
│                          [ Full view ] │  ⚠ Data Architecture:         │
│                                        │    only 2 people proficient   │
│                                        │    — coverage risk            │
├────────────────────────────────────────┴───────────────────────────────┤
│  COMPLIANCE & FUNDING                                                  │
│  Cohort 2026-C3 · 24 attendees · attendance 94% · evidence complete    │
│                              [ Generate HRD Corp claim pack ▾ ]        │
└────────────────────────────────────────────────────────────────────────┘
```
**Design notes:** uplift against baseline is the renewal argument and therefore sits above the fold — this is why the baseline diagnostic is enforced at onboarding. "Needs attention" converts data into actions with one-click responses. Coverage risk reframes training as risk management, which unlocks a different and larger budget. The compliance pack sits on the same screen because it is the buyer's most frequent recurring task.

### 24.3 Instructor Dashboard
Answers: **"Who needs me, and what am I behind on?"**
Priority order: (1) marking queue with oldest item age and **SLA countdown**; (2) next live session with roster and one-click join; (3) at-risk learners in my cohorts, with a nudge action; (4) cohort progress summary; (5) content review-due items; (6) earnings summary. Instructors are time-poor and context-switch constantly — everything must be actionable from the dashboard without navigation.

### 24.4 Assessor Workbench
Answers: **"What is assigned to me and how am I performing as an assessor?"**
Queue with SLA age and difficulty · claim-next control (prevents cherry-picking) · **my calibration status and inter-assessor agreement rate** · assessments completed this period and earnings · items where I was overridden on moderation, as a learning loop. Showing assessors their own agreement statistics is what makes calibration a professional norm rather than an imposition.

### 24.5 Academy Admin Dashboard
Platform health at a glance: active learners · enrolments · credentials issued and pending · **assessment SLA compliance** · integrity flags open · content review-due count · knowledge base version and pending changes · revenue and refunds · support backlog · AI cost and eval scores. Assessment SLA and integrity flags are the two numbers that must never be buried — they are the leading indicators of the trust asset degrading.

---

## 25. DESIGN SYSTEM DIRECTION

Direction, not prescription — the design AI should have room, but these constraints exist for defensible reasons.

### 25.1 Brand and visual character
The brand must feel **credible, current, and human** — the intersection of a professional standards body (trust, precision, restraint) and a modern software product (clarity, speed, warmth). Explicitly avoid: the sterile institutional look of legacy certification bodies, and the neon-gradient aesthetic of AI startups. Both are wrong for a product whose entire proposition is *trustworthy proof*.

Character keywords: **precise · clear · confident · warm · substantive.**

### 25.2 Colour
- **Neutral-dominant palette.** 80%+ of every screen is neutral. Colour is reserved for meaning.
- **One primary** for actions and brand presence — a deep, serious hue (deep blue or teal reads as trust and reliability without being a cliché).
- **One accent** for achievement and credential moments — warmer, used sparingly so it stays special.
- **Semantic set:** success, warning, error, info — and a distinct **proficiency scale** (5 steps) used consistently on every skill visualisation across the whole platform.
- **Never colour alone.** Heatmaps carry numeric values; status carries text labels; charts use pattern or label as well as hue. Non-negotiable for accessibility and for the printed board reports corporate buyers will produce.
- Full light and dark themes, both first-class. Learners read for long stretches.

### 25.3 Typography
- Two families maximum: a highly legible sans for UI and body; optionally a distinctive face for headings and credential artifacts only.
- Body text minimum 16px, line height 1.6+, measure capped at 65–75 characters. Long-form reading is a core use case; this is not a detail.
- A clear type scale with defined roles. Code and data content uses a monospace face with generous spacing.

### 25.4 Layout and spacing
8px base grid · 12-column responsive · content max-width ~1280px with a narrower ~720px reading column for articles and lessons · generous whitespace, which signals confidence and reduces the sense of overwhelm in a large corpus · consistent card, panel, and section rhythm.

### 25.5 Core component inventory
Design these once and reuse everywhere:

*Foundations:* button (primary/secondary/tertiary/destructive), input set, select, checkbox/radio, toggle, date/time picker, file upload, badge/chip, avatar, tooltip, popover, modal, drawer, tabs, accordion, breadcrumb, pagination, toast, banner, skeleton, empty state, error state.

*Domain-specific — the ones that carry the product's meaning:*
- **CredentialCard** — the badge artifact; the most important single component on the platform
- **SkillMeter** — 5-step proficiency with confidence/decay indication
- **SkillRadar** — multi-domain profile visualisation
- **PathTimeline** — milestone journey with position marker
- **ProgressRing / MilestoneBar**
- **RubricPanel** — criteria × levels, both read-only and grading modes
- **AssessmentItem** — question shell with flag and navigation
- **HeatmapGrid** — accessible, value-labelled, drill-through
- **KnowledgeNodeCard** — with version and review stamp
- **CohortRoster**, **AttendanceGrid**
- **AiTutorPanel** — with citation display and an explicit "grounded in" indicator
- **VerificationSeal** — the trust mark on verification pages
- **StatTile**, **UpliftBar**, **TrendIndicator** for dashboards

### 25.6 Motion, tone, and imagery
- **Motion:** functional only — 150–250ms transitions, meaningful state changes. **One deliberate exception:** the credential award moment earns real, celebratory motion. Respect `prefers-reduced-motion` everywhere.
- **Tone of voice:** direct, expert, encouraging, never condescending and never hype. Say "not yet" rather than "failed". Say "you're 3 skills from this credential" rather than "62% complete". Assessment copy is calm and precise.
- **Imagery:** real people, real work contexts, regionally diverse — reflecting the actual audience across Southeast Asia, the Middle East, and beyond. Diagrams and data visualisation over stock photography. Abstract "glowing brain" AI imagery is banned; it undermines the credibility the brand depends on.

### 25.7 Technical foundations
Design tokens (colour, type, space, radius, shadow, motion) as the single source of truth, exported to both design tool and code · component library with documented props and states · WCAG 2.2 AA verified per component · RTL support built in from the start for Arabic · full documentation of usage rules, not just visual specs.

---

## 26. TECHNICAL ARCHITECTURE CONSIDERATIONS

### 26.1 Architectural stance
**Start as a well-structured modular monolith with clean module boundaries** (the §18 modules as internal bounded contexts), plus a small number of genuinely separate services where the isolation requirement is real. Premature microservices would kill velocity at this stage; but three things should be independent from day one because their failure, security, or scaling profiles differ fundamentally:

1. **Assessment & Credentialing service** — different security posture, different availability requirement, different audit obligations. Must remain available and correct even if the marketing site is down.
2. **AI services layer** — different scaling and cost profile, different dependency volatility, must be swappable as models change.
3. **Analytics / LRS pipeline** — write-heavy, eventually consistent, must never affect transactional performance.

### 26.2 Recommended stack

| Layer | Recommendation | Rationale |
|---|---|---|
| Frontend | Next.js (App Router) + TypeScript + React | SSR/SSG for SEO on the knowledge base and marketing surface; excellent for the authenticated app; one language across the stack |
| Styling | Tailwind + a token-driven component library (Radix or shadcn primitives) | Accessible primitives out of the box; tokens map cleanly to §25.7 |
| API | tRPC or typed REST; GraphQL only if third-party consumers demand it | Type safety end-to-end matters more than protocol elegance here |
| Backend | Node/TypeScript (or Python where ML tooling dominates) | Team consistency; Python only for the AI service if needed |
| Primary DB | PostgreSQL | Relational integrity matters enormously for credentials and assessments |
| Graph | Postgres recursive CTEs initially; dedicated graph DB only if traversal complexity demands it | Do not add a graph database prematurely — the skill graph is small |
| Vector | pgvector | Avoids a second datastore for RAG at this scale |
| Cache/queue | Redis + a durable job queue | Sessions, rate limits, background jobs, assessment timers |
| Object storage | S3-compatible, with signed URLs | Video, artifacts, evidence packs |
| Video | Managed provider (Mux or similar) with adaptive streaming, captions, DRM where needed | Never build video infrastructure |
| Search | Postgres FTS + pgvector hybrid; OpenSearch/Typesense at scale | Start simple |
| Auth | Managed provider supporting OIDC/SAML/SCIM | SSO is an enterprise gate; do not build it |
| Payments | Stripe + local rails (FPX/DuitNow for Malaysia), multi-currency, tax handling | Local payment methods materially affect conversion in your primary market |
| Email/notifications | Transactional provider + in-app + Slack/Teams webhooks | |
| AI | Claude (latest models) via a routing layer; RAG over pgvector; prompt/version registry with evals | Model-agnostic routing so models can be upgraded without rewrites |
| Proctoring | Third-party integration | **Never build proctoring.** Regulatory and reliability burden is enormous |
| Badging | Open Badges 3.0 / W3C VC issuing platform, or a compliant issuing library | Standards conformance matters more than control here |
| Hosting | Vercel or a managed cloud; region selection for data residency | |
| Observability | Structured logs, tracing, error tracking, product analytics, uptime | Assessment SLA is a contractual promise; you must be able to measure it |

### 26.3 Interoperability standards — non-negotiable
| Standard | Purpose | Priority |
|---|---|---|
| **Open Badges 3.0 / W3C Verifiable Credentials** | Portable, cryptographically verifiable credentials | MVP |
| **xAPI (Tin Can)** | Learning activity records into an LRS | MVP (emit), phase 2 (full LRS) |
| **LTI 1.3 + NRPS + AGS** | Deep integration with institutional LMSs | Phase 2 — gates academic sales |
| **SCORM 1.2 / 2004 export** | Enterprise customers hosting in their own LMS | Phase 2 — frequently requested in enterprise deals |
| **SAML 2.0 / OIDC / SCIM** | Enterprise SSO and provisioning | Phase 2 — gates enterprise sales |
| **CSV / REST / webhooks** | General data exchange | MVP |

### 26.4 Data model — core entities and the relationships that matter
```
User ─┬─< RoleAssignment >─ Role (scoped: global | org | chapter | cohort | credential)
      ├─< Enrolment >─ Course/Path
      ├─< SkillAssertion >─ SkillNode        (source, evidence_ref, proficiency, confidence, asserted_at)
      ├─< Candidacy >─ CredentialDef         (state machine: registered→assessed→awarded|remediation)
      ├─< Credential >                        (issued, badge_uid, version_ref, expiry, status)
      ├─< CPDEntry >
      ├─< Submission >─ Assignment ──< Evaluation >─ Assessor
      ├─< AssessmentSession >─ Form ──< Response >─ Item
      └─< OrgMembership >─ Organisation ──< Team >

Course ──< Module ──< Lesson ──< Block
Course ──< SkillMapping >─ SkillNode
Lesson ──< KnowledgeRef >─ KnowledgeNode@version
CredentialDef ──< Requirement >  (type: exam_band | artifact | experience | cpd | defence)
```

**Five data-model decisions that are expensive to reverse — get them right at the start:**
1. **Roles are scoped and many-to-many.** Never a single `role` column on `users`.
2. **Skill assertions are append-only with provenance.** Never overwrite a proficiency value; write a new assertion. This gives you history, decay, auditability, and the ability to defend any credential decision years later.
3. **All content is versioned; references are version-pinned.** Retrofitting versioning is a rewrite.
4. **Credential requirements are data, not code.** A rules engine reading `Requirement` rows lets you add credentials without deploying.
5. **Assessment responses are immutable and fully audit-logged.** Non-negotiable for appeals and for credential defensibility.

### 26.5 Security, privacy, and compliance
- **Data protection:** PDPA (Malaysia) and GDPR alignment as the baseline; explicit consent, data-subject request tooling (§18.24), documented retention schedules, regional data residency for enterprise.
- **Sensitive data classes:** assessment content (commercially critical — leakage destroys the item bank), assessment responses and grades, proctoring recordings (highly sensitive; short retention, strict access, explicit consent), identity verification documents (minimum retention, encrypted, access-logged), payment data (never stored — tokenised via the processor).
- **Controls:** encryption at rest and in transit · least privilege with scoped RBAC · MFA mandatory for all privileged roles · comprehensive audit logging of every credential, grade, and admin action · secrets management · dependency scanning · annual penetration test before enterprise sales conversations.
- **Segregation of duty:** finance roles cannot access assessment content; instructors cannot access the live item bank; credential revocation requires two people.
- **Business continuity:** assessment sessions must survive a page refresh and a brief network loss without data loss — a lost exam is a refund, a support case, and a reputational hit.

### 26.6 Scalability and cost posture
Read-heavy workload; cache aggressively (knowledge base, catalogue, public pages fully static or ISR). Assessment is the spiky, latency-sensitive workload — isolate it and load-test to 10× expected concurrency, since cohort exams concentrate load into narrow windows. Video is the largest variable cost: offload entirely to a managed provider with adaptive bitrate. AI cost is controlled by routing (small models for classification and search, larger for tutoring and pre-assessment), aggressive caching of retrieval results, per-user rate limits, and per-feature cost budgets with alerting. Build the multi-tenant org model into the schema from day one; retrofitting tenancy is a rewrite.

### 26.7 Build vs buy — explicit recommendations
| Buy / integrate | Build |
|---|---|
| Proctoring · video hosting and streaming · payments and tax · auth/SSO/SCIM · email delivery · badge issuance and verification infrastructure · virtual meetings · error tracking and observability | **The skill graph** · **the assessment engine and item bank** · **the credential rules engine** · **the artifact/assessor workflow** · **the Body of Practice and versioning** · **the corporate skills intelligence layer** |

The rule: **build what constitutes the trust asset and the differentiation; buy everything that is undifferentiated infrastructure.** Every hour spent building a video player is an hour not spent on the thing nobody else has.

---

# APPENDICES

## Appendix A — Metrics framework

| Layer | Metric | Why it matters |
|---|---|---|
| **Acquisition** | Diagnostic starts · diagnostic → account conversion · organic knowledge-base traffic · badge-referred signups | Loop 1 health |
| **Activation** | First lesson within 24h · first-week active days · path started | Strongest completion predictors |
| **Engagement** | Weekly active learners · sessions/week · median session length · resume rate | Habit formation |
| **Learning** | Module completion · path completion · knowledge-check accuracy trend · time-to-milestone | Product efficacy |
| **Proving** | Candidate registration rate · **artifact submission rate** · first-attempt award rate · assessment SLA compliance · appeal rate | The evidence gate is the critical funnel step |
| **Credential value** | Verification-page views per credential · badge shares · employer recognition statements · holder-reported career outcomes | Is the credential actually worth anything |
| **Community** | Contributor conversion · question response time · active chapters · assessor supply vs demand | Loop 2 — and the throughput constraint |
| **Corporate** | Seat activation · utilisation · uplift vs baseline · renewal rate · seats per account over time | Loop 3 |
| **Content** | Review-due backlog · knowledge coverage vs assessment failure clusters · content NPS | Loop 4 |
| **Quality/trust** | Inter-assessor agreement · AI override rate · integrity incidents · item discrimination distribution | Leading indicators of trust-asset degradation |

**The single most important number:** *artifact submission rate among registered candidates.* If candidates register and then never submit evidence, the entire differentiating premise has failed and must be redesigned. Watch it from the first cohort.

## Appendix B — Principal risks and mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| **Assessor supply cannot meet credential demand** | **Critical** — this is the binding constraint on the whole model | Contribution ladder (§15.3) as a deliberate supply machine; AI pre-assessment to cut assessor time; cap credential intake to protect the SLA rather than degrading quality; pay assessors properly |
| **Evidence gate suppresses conversion** | High | Exemplars, published rubrics, scaffolded workspace, artifact coach, free resubmission; measure submission rate obsessively; be willing to lighten the L2 artifact while holding the line at L3 |
| **Credential has no employer recognition** | **Critical** — a credential nobody recognises is worthless | Employer advisory board *before* launch; publish the standard openly; case studies; free verification API; target 3 named employers pre-launch |
| **Content goes stale in AI domains** | High | 6-month review cycle for GA/AI; changelog-driven; review-due backlog as a tracked admin metric |
| **Incumbent standards body adds AI content** | Medium | They will, and slowly. Our defensibility is the evidence-based model and the living knowledge base — structurally hard for a volunteer-led standards body to replicate |
| **Assessment content leaks** | High | Exposure control, form randomisation, bank rotation, watermarking, monitoring for leaked items |
| **Founder-key-person dependency** | **High and immediate** | Instructor roster and accredited-provider programme are strategic priorities, not phase-2 nice-to-haves; document content authoring standards early |
| **AI feature cost overruns** | Medium | Model routing, caching, per-feature budgets with alerts |
| **Regulatory change in AI training/credentialing** | Medium | Track EU AI Act and regional equivalents; our AI governance track turns regulation into demand rather than threat |

## Appendix C — Immediate next steps

1. **Validate the evidence-based premise with 8–10 employer interviews.** Ask directly: would an assessed, defended artifact change your hiring confidence versus an exam certificate? This one question determines whether the core thesis holds. Do it before writing code.
2. **Draft the L2 Data Foundations credential specification** — brief, rubric, and three exemplar artifacts. This is the hardest and most valuable artifact in the whole plan, and everything else can be designed around it.
3. **Build the skill graph v1 for Data Foundations** (~40–60 nodes) from your existing 8 modules. Do this before any content is migrated.
4. **Restructure the existing Data Blueprint material** into the §10.4 module rhythm with explicit outcomes mapped to skill nodes.
5. **Commission the design system and the 20 key screens** using §22–§25 as the brief.
6. **Confirm the HRD Corp evidence-pack requirements** precisely against current e-TRIS submission rules, and specify §18.12 from the actual required documents — you already hold most of them (trainer profile, course outline, learning outcomes, training material, brochure).
7. **Recruit 3–5 founding assessors** from your professional network. Assessor supply is the constraint; start early.
8. **Run the MVP as a single paid cohort** end-to-end before building the self-serve funnel. Learn what the rubric should be from real submissions, not from theory.

---

*End of blueprint. This document is intended as the complete input brief for a UI/UX design AI or an AI coding agent producing the first portal mockup. Sections 6–8 define the structure, 22–25 define the visual and interaction language, 23–24 define the specific screens to produce first, and 19 defines the scope boundary.*
