# Technology Stack — Proposed

> **Status: PARTIALLY APPROVED — 2026-08-30**
> **Created:** 2026-08-30 · **Version:** 0.2
> **Nothing here is installed or initialised.** Several *architectural directions* were approved on 2026-08-30 (see `README.md` §10); **no approval on this project authorises installing a package, initialising a framework, creating a database, or provisioning anything.**
>
> | Approved as direction (2026-08-30) | Still entirely open |
> |---|---|
> | Next.js + TypeScript (ADR-002) · PostgreSQL as the primary relational datastore (ADR-005) · server actions + route handlers (ADR-004) · `jobs` table not a queue (ADR-010) · **Tailwind styling + reusable components + design tokens** (ADR-003, *direction only*) | ORM · auth provider · database host · object storage · video · payments · email · hosting · analytics · error tracker · AI provider · **testing frameworks** · region |
>
> **AP-12 applies to every row in this document (ADR-042, 2026-08-30).** No technology may introduce a mandatory cost to build, develop, test, run locally or validate the MVP without explicit approval. Every future recommendation carries the twelve-row cost assessment. ⚠️ `[FACT verified 2026-08-30]` **Vercel's Hobby plan is restricted to non-commercial, personal use**, so for this product Vercel is a paid option from launch — see `TECHNOLOGY_DECISION_PACKAGE_PHASE_1.md`.
>
> **ADR-003 is explicitly partial.** The styling approach and the component/token architecture are approved. **Radix, shadcn and every other UI package remain individually gated** under the normal dependency approval process — see ADR-003's approval record.

---

## 0. How to read this document

### 0.1 The distinction that matters

The MVP Build Spec §9 and the Blueprint §26.2 already *name* a stack. That means the technologies below are **documented in an approved specification** — it does **not** mean they are **approved as implementation decisions**.

`CLAUDE.md` Rule 5 and Guardrails §17 require explicit human approval before introducing any framework, database, dependency, external service, authentication mechanism, testing framework or build tool. Therefore:

> **Specification-documented ≠ approved for installation.**
> Every row below requires a human "yes" before it is added to the project, regardless of whether a specification mentions it.

### 0.2 Column meanings

- **Provenance** — `[SPEC]` named in an approved specification · `[INFERENCE]` implied · `[ASSUMPTION]` neither, needs confirmation.
- **Decision state** — `SPEC-NAMED, SINGLE OPTION` (the specs name exactly one) · `SPEC-NAMED, CHOICE OPEN` (the specs name two or more and do not choose) · `NOT SPECIFIED` (no guidance exists).
- **Gate** — 🔴 RED requires explicit approval before implementation · 🟡 YELLOW proceed carefully and report · 🟢 GREEN routine within an approved stack.

### 0.3 Classification — what is actually settled, and by whom

**Correction to the earlier framing.** An earlier version of this document described part of the stack as "settled by spec". On review that phrasing was too loose: it conflated *technologies the specifications actually mandate* with *technologies this architecture analysis recommends because they follow strongly from the specifications*. The second group is **not settled**, and treating it as settled would be exactly the silent technology selection the guardrails forbid. The three categories below replace that framing.

---

#### Category A — Explicitly required by an authoritative specification

Technologies and constraints stated as a **single value or an imperative** in an approved specification. These are not this analysis's opinions; changing them is a change to the specification, not to the architecture.

| Item | Exact specification basis |
|---|---|
| **One deployable application, one database** | MVP §9: *"One deployable application. One database. No microservices…"* |
| **Next.js (App Router) + TypeScript** | MVP §9 stack table, single value; Blueprint §26.2 concurs |
| **PostgreSQL** as the primary database | MVP §9; Blueprint §26.2 |
| **Tailwind + Radix/shadcn primitives + design tokens** | MVP §9, single value; Blueprint §25.7 requires tokens as the single source of truth |
| **Server actions + typed route handlers**; no separate API service | MVP §9: *"tRPC optional, not required"* — see CONF-3 |
| **pgvector, in the same PostgreSQL** | MVP §9: *"pgvector in the same Postgres"* |
| **PostgreSQL full-text search** | MVP §9: *"~30 articles. OpenSearch would be absurd"* |
| **`jobs` table + a scheduled route — not a queue service** | MVP §9, explicit prohibition — see CONF-1 |
| **S3-compatible object storage with signed URLs** | MVP §9 (provider left open) |
| **Managed video — "Never build video"** | MVP §9; Blueprint §26.2 (provider left open) |
| **Do not build auth** | MVP §9, imperative (provider left open) |
| **Stripe**, plus a Malaysian rail; **MYR + USD only** | MVP §9 (rail provider left open); Mockup §20.4 on currencies |
| **Claude behind a swappable routing function** | MVP §9: *"Model routing behind one function so models are swappable"* |
| **An error tracker and a product analytics capability** | MVP §9 cross-cutting: *"error tracking · product analytics on the funnel"* |
| **Externalised UI strings** | MVP §2 cross-cutting |
| **Prohibited in V1:** graph database · microservices · event bus / message broker · LRS / xAPI / SCORM · dedicated vector store · proctoring vendor · badge signing infrastructure · automated credential decisions · additional currencies | MVP §9 "Deliberate non-decisions", §3, §13.1 |
| **The seven non-negotiable engineering rules** (tenancy from commit one · insert-only assertions and responses · audit on every credential/assessment mutation · externalised strings · assessor conflict-of-interest check · no domain or level literals · assessment content restricted at the query layer) | MVP §9 |

> **Category A still requires your approval to *install*.** A specification naming a technology is not authority to add it to the project. `CLAUDE.md` Rule 5 and Guardrails §17 gate the act of introduction separately from the choice.

---

#### Category B — Recommended architecture decisions (inferred, **not** approved)

Positions this analysis reached because they follow from the specifications, the guardrails, or ordinary engineering judgement — but which **no specification states**. These are the ones most at risk of being mistaken for settled, so they are listed explicitly.

| Recommendation | Derived from | Where |
|---|---|---|
| Layered route → service → repository structure, with authorisation, tenancy and integrity rules as **unavoidable shared guards** | MVP §9 rule 7 requires query-layer enforcement; the *mechanism* is inferred | ADR-020 |
| **Server-side `started_at` as the authoritative exam clock** | NFR-1 requires durability; the mechanism is inferred (and rejects Blueprint's cache-held timer) | ADR-021 |
| Audit row written **in the same transaction** as the mutation | The requirement is explicit; atomicity is inferred | ADR-022 |
| **Three environments including staging** | Nowhere specified; inferred from the irreversibility of credential issuance and email | ADR-029 |
| Forward-only reviewed migrations; seed data outside migrations | Second half is explicit (§16.2 rule 5); migration policy is inferred | ADR-029 |
| **Backup, PITR, and a rehearsed restore** | Nowhere specified; inferred from a single-datastore design | ADR-031 |
| Idempotency on all webhooks and job handlers | Guardrails §23, not the product specs | IP-3 |
| Direct-to-object-storage uploads; upload validation | Inferred | ADR-008 |
| **Deferring the video provider to Phase 1B**; provider-neutral video reference | Inferred from cost and Phase 1A's single real video | ADR-009 |
| **No session replay on assessment / artifact / evaluation screens** | Inferred from item-bank leakage risk | ADR-035 |
| Evidence pack as an asynchronous job producing a stored, reproducible artifact | Inferred from execution limits and auditability | ADR-033 |
| Row-level security evaluated as an *additional* layer | Inferred | ADR-020 |
| **The entire testing philosophy and required layers** | No specification mentions testing at all | ADR-038 |
| Uptime monitoring; job-health monitoring; SLA instrumentation as a first-class query | Inferred from NFR-6 | ADR-017 |
| Secret handling discipline | Inferred; `.gitignore` anticipates it | ADR-030 |

> **Nothing in Category B is approved by implication.** Each is a PROPOSED or PENDING record in the register and needs the same explicit decision as Category A.

---

#### Category C — Open vendor and implementation decisions

No specification chooses these; they are yours.

| Decision | Options | ADR |
|---|---|---|
| **ORM / migration tool** | Prisma vs Drizzle | ADR-007 |
| **Authentication provider** | Auth.js vs Clerk | ADR-006 |
| **PostgreSQL host** | Neon vs Supabase vs AWS RDS | ADR-005a |
| **Object storage provider** | Cloudflare R2 vs AWS S3 | ADR-008 |
| **Video provider** | Mux vs Cloudflare Stream vs Bunny *(recommend deferring)* | ADR-009 |
| **Malaysian payment rail provider** | Stripe local methods vs Billplz vs iPay88 vs Razer MS vs bank FPX — or invoice-only | ADR-014 |
| **Transactional email provider** | Resend vs Postmark | ADR-015 |
| **Hosting model** | Vercel vs a container on a managed host | ADR-016 |
| **Error tracker and analytics product** | Sentry or equivalent; PostHog / Plausible / Amplitude / Mixpanel | ADR-017 |
| **Region and data residency** | Driven by OQ-6; constrains host, storage and hosting simultaneously | ADR-032 |
| **Testing framework and libraries** | Deliberately closed; philosophy is separate | ADR-025 |

---

#### Why this distinction matters for governance

Category A tells you what the specifications committed you to. Category B tells you what **I** am recommending on top of them — and is therefore where you should read most sceptically, because it is where an AI's judgement, not your approved documentation, is doing the work. Category C is where the decisions are simply not made yet.

Collapsing B into A would let a chain of reasonable-sounding inferences harden into "the architecture" without anyone deciding it. That is the specific failure this classification exists to prevent.

---

## 1. Application framework

### 1.1 Next.js (App Router) + React + TypeScript — **PROPOSED** 🔴

| Field | Detail |
|---|---|
| **Purpose** | The single deployable application: public SEO surface, authenticated portal, and server-side business logic in one codebase |
| **Provenance / state** | `[SPEC]` MVP §9 and Blueprint §26.2 both name it · SPEC-NAMED, SINGLE OPTION |
| **Why recommended** | The product needs **server-rendered, indexable public pages** (knowledge articles, glossary, credential detail, and the verification page that is the growth loop) *and* a rich authenticated app, in one codebase, maintained by 1–2 developers. Server components plus server actions remove the need for a separate API service. TypeScript end to end means one language for schema types, business rules and UI |
| **Alternatives considered** | **Remix / React Router** — comparable SSR story, smaller ecosystem for this team's likely AI-assisted workflow. **Astro + a separate API** — excellent for the content surface, weaker for the heavily interactive artifact workspace and assessor workbench; adds a second deployable. **SPA (Vite/React) + separate Node API** — loses SSR/SEO, which NFR-4 makes non-negotiable, and doubles the deployment surface. **Django / Rails** — strong admin and ORM story, but splits the language and weakens the React component system the design specification assumes |
| **Trade-offs** | Framework-level coupling: App Router conventions, caching semantics and server actions are Next-specific and non-trivial to migrate away from. Server actions are less explicit than a typed API layer and need discipline to keep business rules out of the UI layer |
| **Maintenance** | Frequent major releases; upgrade cadence must be budgeted. Mitigated by keeping business logic in framework-agnostic service modules |
| **Complexity** | Medium. The rendering model (server vs client components, caching) is the main learning cost |
| **Cost** | Free/open source. Hosting cost is separate (§9) |
| **Approval note** | 🔴 Framework initialisation is a RED-gate action. Approval of this row is not approval to run a scaffolding command |

### 1.2 Tailwind CSS + Radix/shadcn primitives + design tokens — **PROPOSED** 🔴

| Field | Detail |
|---|---|
| **Purpose** | Styling system and accessible component primitives for the design system |
| **Provenance / state** | `[SPEC]` MVP §9, Blueprint §26.2, §25.7 · SPEC-NAMED, SINGLE OPTION |
| **Why recommended** | Blueprint §25 requires design tokens as the single source of truth, first-class light **and** dark themes, WCAG 2.2 AA verified per component, and RTL readiness. Radix/shadcn provide accessible, unstyled primitives (dialog, tabs, popover, etc.) that would otherwise be built by hand — and accessibility is NFR-3, not a nicety. shadcn's copy-in model means no runtime dependency lock-in |
| **Alternatives considered** | **CSS Modules / vanilla-extract** — more explicit, no accessible primitives, more hand-written a11y risk. **MUI / Mantine / Chakra** — faster to a generic look, but the Blueprint explicitly rejects both the "sterile institutional" and the generic-component aesthetic; heavy theme override work. **Headless UI** — narrower primitive set than Radix |
| **Trade-offs** | Utility classes in markup reduce readability for newcomers; shadcn components become project-owned code that the team maintains |
| **Maintenance** | Low-moderate. Tokens must be the only place colours and spacing are defined, or the system decays |
| **Complexity** | Low-medium |
| **Cost** | Free |

---

## 2. Data layer

### 2.1 PostgreSQL (managed) — **PROPOSED** 🔴

| Field | Detail |
|---|---|
| **Purpose** | The single source of truth for all business state |
| **Provenance / state** | `[SPEC]` MVP §9, Blueprint §26.2 · SPEC-NAMED, SINGLE OPTION (host is open — §2.2) |
| **Why recommended** | Credentials and assessments require **relational integrity, transactions and defensibility**. Append-only assertions, immutable responses, requirements-as-data, multi-tenancy filters and an audit log are all naturally relational. It additionally carries `pgvector` (RAG) and full-text search, which is precisely why no second datastore is needed at this scale |
| **Alternatives considered** | **MySQL/MariaDB** — viable, but no pgvector equivalent in-tree, weaker JSON and CTE story. **MongoDB / document stores** — wrong shape; the specs' expensive-to-reverse decisions are all relational. **A graph database for the skill graph** — `[SPEC]` explicitly rejected: 35 flat skills; even the eventual DAG is a recursive CTE. **A separate vector database (Pinecone/Weaviate/Qdrant)** — `[SPEC]` explicitly rejected: "one datastore" |
| **Trade-offs** | A single database is a single failure domain; mitigated by managed backups and PITR (see `DEPLOYMENT_ARCHITECTURE.md`). Vertical scaling limits are far beyond MVP volumes |
| **Maintenance** | Low if managed. Version upgrades, backup verification and connection-limit management are the ongoing tasks |
| **Complexity** | Low |
| **Cost** | Typically USD ~20–70/month at MVP scale, host-dependent |
| **Approval note** | 🔴 **Creating the database and any schema is a separate RED-gate action** (`CLAUDE.md` Rule 1) |

### 2.2 PostgreSQL hosting — **OPEN, PENDING HUMAN APPROVAL** 🔴

`[SPEC]` names "Neon/Supabase/RDS" without choosing.

| Option | Strengths | Weaknesses | Notes |
|---|---|---|---|
| **Neon** | Serverless, branch-per-preview, low idle cost, fast provisioning | Connection pooling needs care with serverless functions; region list narrower | Good fit if hosting is serverless |
| **Supabase** | Postgres + storage + auth in one product; could collapse three vendors into one | Bundling auth and storage here is a larger architectural commitment than the spec requires; opinionated auth model | Worth evaluating **only** if it also resolves ADR-006 and ADR-008 |
| **AWS RDS / Aurora** | Mature, region choice including Malaysia/Singapore, strongest data-residency answer | More operational surface; higher baseline cost; no preview branching | Strongest option if data residency (OQ-6) becomes a hard requirement |
| **Cost implication** | All three are affordable at MVP scale; RDS has the highest floor |

**This decision interacts with OQ-6 (data residency) and should not be made before it is answered.**

### 2.3 ORM / query layer — **OPEN, PENDING HUMAN APPROVAL** 🔴

`[SPEC]` says "Prisma or Drizzle — migrations you can read". The specs do not choose.

| Option | Strengths | Weaknesses |
|---|---|---|
| **Prisma** | Excellent DX, mature migrations, strong tooling, very widely known (helps AI-assisted development and future hires) | Its own schema language; generated client adds a build step; historically heavier runtime; less direct SQL control |
| **Drizzle** | TypeScript-native schema, SQL-first and transparent, lightweight, migrations are plain SQL — easy to review under a change-control regime | Smaller ecosystem; more manual work for complex queries; less mature tooling |

**Recommendation `[INFERENCE]`:** either satisfies the specification. Given `CLAUDE.md` Rule 1 (no physical data-model change without approval) and Rule 9 (traceable, reversible changes), the deciding criterion should be **how reviewable the generated migrations are by a human approving a schema change**. On that criterion **Drizzle** is marginally stronger (plain SQL migrations); on **ecosystem maturity and speed of delivery for a 1–2 person team**, **Prisma** is stronger. This is a genuine judgement call for the human.

### 2.4 pgvector — **PROPOSED** 🟡

| Field | Detail |
|---|---|
| **Purpose** | Embedding storage and similarity search for the AI tutor's retrieval over the knowledge library |
| **Provenance / state** | `[SPEC]` MVP §9, Blueprint §26.2 · SPEC-NAMED, SINGLE OPTION |
| **Why recommended** | Keeps RAG inside the one datastore, which is an explicit specification requirement. At 20–30 articles the index is trivially small |
| **Alternatives** | Dedicated vector DB — explicitly rejected by `[SPEC]`. In-memory index — would fail the Service Restart Test if treated as authoritative |
| **Trade-offs / cost** | A Postgres extension; must be supported by the chosen host (all three candidates do). Negligible cost |

---

## 3. Authentication — **OPEN, PENDING HUMAN APPROVAL** 🔴

`[SPEC]`: "Auth.js or Clerk. **Do not build auth.** SSO comes later via the same provider."

| Option | Strengths | Weaknesses | Cost |
|---|---|---|---|
| **Auth.js (NextAuth)** | Library, not a vendor; data stays in our Postgres; no per-user cost; full control of the user record | We operate the flows (verification, reset, MFA); enterprise SSO/SCIM later is real work; more security surface owned by us | Free |
| **Clerk** | Hosted UI, MFA, verification, reset and later SSO/SCIM largely configuration; fastest path; strong security defaults | Per-MAU cost that grows with success; user identity lives with a vendor; adds a hard external dependency to sign-in availability | Free tier, then per-MAU |

**Decision criteria `[INFERENCE]`:** (a) does the corporate pilot need SSO sooner than the spec assumes (OQ-7)? (b) is a per-MAU cost acceptable against the credential fee? (c) does data residency (OQ-6) constrain where identity data may live?

🔴 **Authentication architecture is explicitly a RED gate** (`CLAUDE.md` approval gates).

---

## 4. Payments — **PARTIALLY OPEN, PENDING HUMAN APPROVAL** 🔴

### 4.1 Stripe — **PROPOSED** 🔴
`[SPEC]` MVP §9, Blueprint §26.2. Purpose: card payments, MYR + USD, receipts, refunds, tax handling. Alternatives (Paddle as merchant-of-record, Adyen, Braintree) are heavier or less suited to a small operator; Paddle is worth a look **only** if the human wants tax/VAT handled as a merchant of record. Trade-off: transaction fees; webhook-driven state that must be idempotent and reconciled against our own `orders` records — **the payment provider is never the source of truth for entitlement**.

### 4.2 Malaysian local rail (FPX / DuitNow) — **OPEN** 🔴
`[SPEC]` requires "a Malaysian rail (FPX/DuitNow)" because local payment materially affects conversion in the primary market. The specifications **do not name a provider**. Options include Stripe's own Malaysian methods where available, or a local gateway (for example Billplz, iPay88, Razer Merchant Services, or a bank-provided FPX facility). Each differs on settlement, fees, onboarding requirements and corporate invoicing support.

**`[OPEN QUESTION] OQ-2:** which Malaysian rail, under which legal entity, and does the corporate motion actually need **invoice + bank transfer** rather than an online rail at all? Corporate cohorts are typically bought on invoice; if so, the local online rail may be a *conversion* feature for individuals only, which changes its priority.

---

## 5. Email — **OPEN** 🟡

`[SPEC]` names "Resend / Postmark" without choosing. Purpose: transactional email only in V1.

| Option | Strengths | Weaknesses |
|---|---|---|
| **Postmark** | Best-in-class transactional deliverability and reputation separation | Slightly higher cost; fewer developer-experience niceties |
| **Resend** | Excellent DX, simple API, good templating story | Younger product; smaller deliverability track record |

**`[INFERENCE]`** Deliverability is not cosmetic here: verification, candidacy windows, assessor assignment and decision notices are on the SLA path (NFR-6). A sending domain with SPF/DKIM/DMARC must be configured either way — that is an **OQ-3** (which domain sends mail).

---

## 6. Video — **OPEN, DEFERRABLE** 🟡

`[SPEC]` "Managed (Mux / Cloudflare Stream / Bunny). **Never build video.**"

| Option | Strengths | Weaknesses | Cost shape |
|---|---|---|---|
| **Mux** | Best analytics and developer experience; strong captions workflow | Highest cost per minute |
| **Cloudflare Stream** | Simple flat pricing; good regional delivery | Fewer analytics features |
| **Bunny Stream** | Cheapest at volume | Least mature tooling |

**`[INFERENCE]` Deferral opportunity:** Phase 1A needs **one real 3-minute lesson** (`[SPEC]` §11.1); Phase 1B needs a working player. Video is the **largest variable cost** in the platform (`[SPEC]` Blueprint §26.6) and the decision can be made late without architectural consequence, provided the content model stores a provider-agnostic video reference. **Recommend deferring provider selection to Phase 1B and designing the block model to be provider-neutral.**

---

## 7. AI — **PROPOSED** 🔴

| Field | Detail |
|---|---|
| **Purpose** | The grounded AI tutor (M8) — the only AI feature in the functional MVP |
| **Provenance / state** | `[SPEC]` MVP §9: "Claude via a thin server-side service; pgvector in the same Postgres. Model routing behind one function so models are swappable" |
| **Why recommended** | The specification names it, and the routing constraint matters more than the vendor: one function boundary means a model change is not a rewrite |
| **Alternatives considered** | Other hosted LLM providers — same architecture, different vendor; the abstraction makes this reversible. Self-hosted open models — rejected `[INFERENCE]`: operational burden far beyond a 1–2 person team, and quality risk on a product whose credibility depends on citation accuracy |
| **Trade-offs** | Per-token cost that scales with usage; an external dependency on the tutor path (must degrade gracefully, never block learning); a **data-processing question** — Blueprint §17.4 requires that learner data is not used to train third-party models, with explicit contractual terms. That is an **OQ-4** to verify before launch |
| **Governance `[SPEC]`** | Answers only from the corpus · citations with version stamps always · "I don't have a sourced answer" instead of confabulation · **visibly disabled during assessment** · a maintained eval set for accuracy, refusal correctness and citation validity |
| **Cost control `[SPEC]`** | Model routing, retrieval caching, per-user rate limits, per-feature budgets with alerting |
| **Approval note** | 🔴 A new external service and a new dependency |

---

## 8. Storage, search, jobs, observability

| # | Technology | Purpose | Provenance | State | Gate | Notes |
|---|---|---|---|---|---|---|
| 8.1 | **S3-compatible object storage (Cloudflare R2 or AWS S3)** | Artifacts, evidence packs, badge images, downloads | `[SPEC]` MVP §9 | CHOICE OPEN | 🔴 | R2: no egress fees, simpler pricing. S3: region choice incl. Southeast Asia, deepest tooling. **Choose alongside the Postgres host and the residency answer** |
| 8.2 | **Postgres full-text search** | Knowledge library and glossary search | `[SPEC]` MVP §9 | SINGLE OPTION | 🟢 | "~30 articles. OpenSearch would be absurd." Alternatives (OpenSearch, Typesense, Algolia) are Phase 2 at the earliest |
| 8.3 | **`jobs` table + scheduled invocation** | Email dispatch, evidence-pack generation, article indexing | `[SPEC]` MVP §9 | SINGLE OPTION | 🟡 | Explicitly **not** a queue service. Conflicts with Blueprint §26.2 — see CONF-1 / ADR-010 |
| 8.4 | **Error tracking (Sentry or equivalent)** | Server + client exception capture | `[SPEC]` MVP §9 | CHOICE OPEN | 🟡 | Must be configured to scrub PII and assessment content |
| 8.5 | **Product analytics** | Funnel measurement; **artifact submission rate** | `[SPEC]` MVP §9 ("a product analytics tool" — unnamed) | NOT SPECIFIED | 🔴 | Candidates: PostHog (self-host option, session replay — replay must be **disabled on assessment and artifact screens** `[INFERENCE]`), Plausible/Fathom (privacy-first, thin), Amplitude/Mixpanel (deep funnels, higher cost). **A privacy review is required before any client-side analytics touches candidate journeys** |
| 8.6 | **Uptime monitoring** | Availability of the app and the verification page | `[INFERENCE]` NFR-2 | NOT SPECIFIED | 🟢 | Low cost, high value |

---

## 9. Hosting — **OPEN, PENDING HUMAN APPROVAL** 🔴

`[SPEC]` "Vercel (or a single container on any managed host)"; Blueprint adds "region selection for data residency".

| Option | Strengths | Weaknesses |
|---|---|---|
| **Vercel** | Zero-ops, preview deployments, best Next.js integration, fastest for a 1–2 person team | Cost grows with usage; region and residency constraints; function timeouts affect long-running work such as evidence-pack generation `[INFERENCE]` |
| **Single container on a managed host** (Fly.io, Render, Railway, AWS App Runner, ECS) | Region choice including Southeast Asia; no function-duration constraints; simpler mental model for background work | More operational surface; the team owns build, deploy and scaling configuration |

**`[INFERENCE]` Decision driver:** evidence-pack generation zips a document bundle and may exceed serverless execution limits; and data residency (OQ-6) may rule out some regions. Both push toward a container if the corporate/HRD Corp motion demands local residency.

---

## 10. Testing — **NOT SPECIFIED. PENDING HUMAN APPROVAL** 🔴

**No specification names a testing framework**, yet `CLAUDE.md` Rule 7 forbids claiming completion without validation, and requires testing for business logic, authentication, authorisation, workflow changes, examination and certification functionality.

**`[INFERENCE]` A testing stack is therefore mandatory, and adopting one is explicitly a RED gate** ("no new testing frameworks without approval").

Proposed minimum, for approval:

| Layer | Candidate | Why it is needed here |
|---|---|---|
| Unit / integration | Vitest (or Jest) | Credential requirement evaluation, threshold scoring, conflict-of-interest rule, tenancy filters — the rules that must never silently break |
| Database-level integration | Test database + transactional fixtures | Append-only enforcement, audit emission, tenancy isolation cannot be proven without real SQL |
| End-to-end | Playwright | The §5 journey: diagnostic → enrol → exam → artifact → assessment → credential → verification |
| Accessibility | axe integration in component tests | WCAG 2.2 AA is NFR-3, not aspirational |

**This is the single largest gap between the guardrails and the specifications, and it should be decided before Phase 1B.**

---

## 11. Explicitly rejected technologies (record of what we are *not* adopting)

Recorded so future sessions do not silently reintroduce them.

| Technology | Why rejected | Source | Revisit when |
|---|---|---|---|
| Microservices (3 services) | Premature; three folders in one deploy | `[SPEC]` MVP §9 | Blueprint §26.1 triggers: differing security/scaling/audit profiles become real |
| Graph database | 35 flat skills; the DAG is a recursive CTE | `[SPEC]` MVP §9 | ~200 skills across 5 domains — "probably never" |
| Event bus / message broker | Direct calls + `jobs` table | `[SPEC]` MVP §9 | ~10k users |
| Dedicated vector store | pgvector in the same Postgres | `[SPEC]` MVP §9 | Corpus far beyond 30 articles |
| Redis | Not required by V1's job or cache model | `[SPEC]` MVP §9 (implied by omission); CONF-1/CONF-2 | Rate limiting or session scale demands it |
| LRS / xAPI / SCORM | Zero MVP value; an `events` table suffices | `[SPEC]` MVP §13.1 | Enterprise LMS-hosting deals |
| Online proctoring vendor | Cost, conversion friction, accessibility hostility, integration burden — for a control that is not the real one | `[SPEC]` MVP M5, §13.1 | If the artifact ceases to be the primary integrity control |
| Badge signing / VC infrastructure | `public_uid` + a page + OB 2.0 metadata | `[SPEC]` MVP M7 | Phase 1C/2, possibly via a third-party issuer |
| Native mobile apps | Responsive web covers every MVP journey | `[SPEC]` Mockup §20.4 | After product-market fit |
| Additional currencies beyond MYR/USD | Tax, pricing and reconciliation complexity for revenue that does not exist | `[SPEC]` Mockup §20.4 | New market entry |

---

## 12. Decision status

Replaces the earlier approval checklist. Authoritative status lives in `ARCHITECTURE_DECISION_REGISTER.md`; this is the technology-facing view.

### Approved as architectural direction — 2026-08-30

| ADR | What was approved | What it does **not** authorise |
|---|---|---|
| ADR-002 | Next.js App Router + React + TypeScript as framework and primary language | Initialising Next.js; installing any package |
| ADR-005 | PostgreSQL as the primary persistent relational datastore | Creating a database or schema; choosing a host (ADR-005a open) |
| ADR-004 | Server actions + typed route handlers; no separate API service | Implementation; any transport library |
| ADR-010 | Persistent `jobs` table rather than a queue by default | Implementation. **Adding a queue later now requires AP-11 justification** |
| ADR-003 | **Direction only:** Tailwind styling approach · reusable component architecture · design tokens · light and dark · WCAG 2.2 AA per component | **Any UI package** — Radix, shadcn, icon sets, chart, editor, table or date libraries all remain individually gated |
| ADR-012 | *(still PROPOSED)* Postgres full-text search | — |
| ADR-011 | *(still PROPOSED)* No Redis; cache never a source of truth | — |

### Approved as principle or required capability — 2026-08-30

**Capability approved; vendor NOT approved.** ADR-017 (error tracking, funnel analytics, SLA instrumentation, job health, uptime) · ADR-029 (three environments; forward-only reviewed migrations) · ADR-030 (secret-management principles) · ADR-031 (backups, PITR, object versioning, **rehearsed restore**) · ADR-035 (no session replay on assessment, artifact or evaluation screens) · ADR-038 (five testing layers, risk tiers, Tier 1 workflow set).

### Still open — every one requires approval before use

| # | Decision | ADR | Blocks Track B? |
|---|---|---|---|
| 1 | **ORM / migration tooling** — Prisma vs Drizzle | ADR-007 | **Yes** |
| 2 | **Authentication provider** — Auth.js vs Clerk | ADR-006 | **Yes** |
| 3 | **PostgreSQL host** — Neon vs Supabase vs RDS | ADR-005a | **Yes** (local development may proceed first — ADR-032 sequencing) |
| 4 | **Testing frameworks** | ADR-025 | **Yes** — Track B's final step is automated testing |
| 5 | **Hosting model** — Vercel vs container | ADR-016 | Only at deployment |
| 6 | **Transactional email** — Resend vs Postmark | ADR-015 | Only for real email verification |
| 7 | **Object storage** — R2 vs S3 | ADR-008 | No |
| 8 | **Video provider** | ADR-009 | No — recommend continued deferral |
| 9 | **Payments** — Stripe + Malaysian rail | ADR-014 | No |
| 10 | **Analytics + error tracker** | ADR-017 vendors | No |
| 11 | **AI provider** | ADR-013 | No |
| 12 | **Region / data residency** | ADR-032 | Production only — see the sequencing rule |

### The standing rule

**No approval on this project — including every approval dated 2026-08-30 — authorises installing a package, initialising a framework, creating a database or schema, provisioning infrastructure, or creating an external account.** Each of those is a separate action requiring approval at the moment it is performed.
