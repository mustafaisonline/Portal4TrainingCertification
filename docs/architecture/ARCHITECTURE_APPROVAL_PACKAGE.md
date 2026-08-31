# Architecture Approval Package — Decision State

> **Status: PARTIALLY APPROVED — 2026-08-30**
> **Version:** 2.0 — revised 2026-08-30 after AP-12, the Free Tier Qualification Test, and the completed authentication analysis · **Approvals recorded by:** the project owner, 2026-08-30
>
> **This document authorises no action.** It records what has been decided. Implementation remains blocked pending your explicit authorisation.

---

## The standing rule, stated once

**No approval on this project — including every approval dated 2026-08-30 — authorises any of the following:**

initialising a framework · installing a package · creating a database · creating a schema · provisioning hosting or cloud services · creating external service accounts · configuring production infrastructure · deploying · committing · pushing.

Each is a separate action requiring approval **at the moment it is performed**. An approved decision settles *what* will be built. It never settles *that it may now be built*.

---

# 1. Approved architecture principles

**ADR-041 · APPROVED 2026-08-30** (AP-01…AP-11) and **ADR-042 · APPROVED 2026-08-30** (AP-12). AP-01…AP-12 are the project's durable, technology-independent principles. Full statements: [`ARCHITECTURE_PRINCIPLES.md`](ARCHITECTURE_PRINCIPLES.md).

| ID | Principle | In one line |
|---|---|---|
| **AP-01** | Modular Monolith First | One deployable with enforced boundaries; distribute only on demonstrated need |
| **AP-02** | Backend and Persistent Storage as Source of Truth | Everything else is a copy or projection, reconstructible from it |
| **AP-03** | Stateless Application Services Where Practical | Any instance serves any request; replacement is a non-event |
| **AP-04** | Explicit Authorization Boundaries | Central, data-layer enforcement; scoped multi-valued roles; negative cases tested |
| **AP-05** | Persistent Business and Workflow State | Survives full restart with caches cleared; loss window is an explicit decision |
| **AP-06** | Smallest Necessary Change | Requested work plus what is genuinely necessary; improvements reported, not performed |
| **AP-07** | No Hidden Mock, Placeholder, or Simulated Production Logic | Temporary behaviour is labelled, isolated, and cannot become the source of truth |
| **AP-08** | Auditability for Critical Business Actions | Immutable record written in the same transaction as the action |
| **AP-09** | Significant Decisions Persistently Documented | Register with context and alternatives; superseded records retained and linked |
| **AP-10** | Architecture Stability | Approved boundaries not replaced without answering nine questions; Q1 is a gate |
| **AP-11** | **Simplicity Before Scale** | **Earn complexity through demonstrated need.** Future scalability alone is never sufficient justification |
| **AP-12** | **Zero-Cost Development and Free-First Technology** | **Zero mandatory technology cost to build, test and validate the MVP.** Free/open-source/self-hostable preferred; convenience is never a justification for a paid dependency |

**AP-10 and AP-11 are complementary and were added for the same reason.** AP-10 protects the architecture from unnecessary *replacement*; AP-11 protects it from unnecessary *addition*. Together they mean the architecture changes when there is evidence, in the direction the evidence points, and not otherwise.

**AP-11 has immediate effect on decisions already recorded.** Every deferred option in the register now carries a justification burden rather than a schedule: a queue (ADR-010), Redis (ADR-011), a graph database, an event bus, a dedicated vector store, distributed services (ADR-001), OpenSearch (ADR-012). Each may return only with a current functional requirement, a demonstrated limitation, or a measurable operational need.

**AP-11 exception, recorded explicitly:** the Retrofit Test shapes — scoped roles, append-only evidence, tenancy identifiers, content version fields, requirements-as-data — are **structural decisions**, not added components. They cost almost nothing now and a rewrite later, which is precisely the measured trade-off AP-11 asks for.

---

# 2. Approved architectural directions

## 2.1 Core architectural direction — approved in full

| ADR | What is approved | What it does **not** authorise |
|---|---|---|
| **ADR-001** | Modular monolith: one deployable, enforced internal boundaries | Any second deployable or extracted service — now gated by AP-10 **and** AP-11 |
| **ADR-002** | Next.js App Router + React + TypeScript; business logic in framework-agnostic modules | **Initialising Next.js. Installing any package.** |
| **ADR-004** | Server actions + typed route handlers; no separate API service | Implementation; any transport library |
| **ADR-005** | **PostgreSQL as the primary persistent relational datastore**, sole source of truth | **Creating a database or schema. Provisioning an instance. Choosing a host** (ADR-005a open) |
| **ADR-010** | Persistent `jobs` table rather than introducing a queue by default | Implementation. Adding a queue later now requires AP-11 justification |
| **ADR-020** | Scoped many-to-many roles; authorization, tenancy and integrity rules enforced **beyond the UI**, at the service and data-access layer | Implementation; schema creation; the authentication provider (ADR-006 open) |
| **ADR-022** | Insert-only assertions and responses; audit written in the same transaction | Implementation; schema creation. Audit scope beyond credential/assessment (OQ-16) still open |
| **ADR-023** | Approved expansion shape: requirements-as-data, no domain literal, no level branch, parameterised routes | Implementation |
| **ADR-036** | **Track B direction** — a production-grade vertical slice ending in verified restart resilience and automated testing | **Beginning the slice** |
| **ADR-039** | **Permanent credential identity** — a globally unique persistent identifier independent of URL, domain or format | Domain selection (returns to §5); implementation |
| **ADR-040** | **Dual-track validation** — Track A and Track B in parallel; neither may be reported as satisfying the other's criteria | Execution of either track |

## 2.2 UI architecture — approved as **direction only**

**ADR-003 · APPROVED (direction only).** The distinction below is load-bearing.

| Approved as architectural direction | Still requires individual dependency approval |
|---|---|
| **Tailwind CSS as the styling approach** | Any Tailwind plugin or preset |
| **Reusable component architecture** — designed once, documented props and states, reused | **Radix · shadcn/ui · any primitive or component library** |
| **Design tokens** as the single source of truth for colour, type, space, radius, motion | Icon sets · chart libraries · rich-text editors · date pickers · file-upload widgets · table libraries |
| **Light and dark first-class**, WCAG 2.2 AA per component, RTL-capable structure | Accessibility-testing and component-documentation tooling |

The architectural commitment is that the UI *has* a token system and a reusable component layer. That is satisfiable in several ways — including by hand-building the small set of primitives this product actually needs. Each dependency carries maintenance, security, licence, accessibility and bundle-size consequences the direction-level decision never examined, so each is approved **individually, at the moment it is proposed**, with an AP-11 justification.

## 2.3 Engineering quality and operations — approved as **principles and required capabilities**

**Approved: the capability and its constraints. Not approved: any vendor, SaaS product, cloud provider, or infrastructure implementation.**

| ADR | Capability approved | Vendor / implementation status |
|---|---|---|
| **ADR-038** | Five testing layers; risk-based tiers; named Tier 1 workflow set; *a feature is not complete merely because it renders successfully* | **Frameworks open (ADR-025)** |
| **ADR-029** | Three environments (dev/staging/production); forward-only human-reviewed migrations; seed data outside migrations | **Provisioning not authorised** |
| **ADR-031** | Automated backups + PITR + object versioning + **a rehearsed restore**; DB/object reconciliation procedure | **Provider and region open;** backup location is a residency input |
| **ADR-030** | Secrets in a per-environment store; `.env.example` names only; rotation without code change; never in logs or bundles | **Specific store open** |
| **ADR-017** | Error tracking · funnel analytics with artifact submission rate · **SLA instrumentation** · job health · uptime including the verification page | **All vendors open** |
| **ADR-035** | No session replay or content capture on assessment, artifact or evaluation screens | Now **constrains** the analytics selection: a product that cannot honour it is disqualified |

## 2.4 Data residency sequencing — approved rule, open answer

**ADR-032 · sequencing rule APPROVED 2026-08-30; the residency answer itself remains open.**

> **Data residency must be resolved before provisioning production infrastructure containing persistent production or customer data.**

| Proceeds without the residency answer | Blocked until residency is verified |
|---|---|
| Architecture design · documentation | Production hosting |
| **Local development** | Any persistent **production** database |
| **Local testing** · **automated testing** | Production object storage |
| **Non-production prototypes** | **Production backup / DR storage** — a backup is a transfer |
| — | Production external services processing real customer data |
| — | Any production deployment |

**Condition:** no real customer or production data is processed inappropriately in any of the permitted activities. **The governing factor is the data, not the environment label** — a "local" environment holding a real cohort roster is production data by any regulator's reading.

**Effect on sequencing:** residency is **no longer the first blocker**. It moves from the top of the critical path to the boundary between Track B and production deployment.

---

# 3. Revised decision state — 2026-08-30

Five categories, as directed. Authoritative status lives in `ARCHITECTURE_DECISION_REGISTER.md`.

## 3.1 APPROVED

| ID | What is approved | Qualifier |
|---|---|---|
| **ADR-041 / ADR-042** | Architecture principles **AP-01…AP-12**, including AP-11 Simplicity Before Scale and **AP-12 Zero-Cost Development** with the Free Tier Qualification Test and the No Paid Surprise rule | Principles — authorise no implementation |
| **ADR-001** | Modular monolith, one deployable, enforced boundaries | Direction |
| **ADR-002** | Next.js App Router + React + TypeScript | Direction |
| **ADR-003** | Tailwind styling · reusable component architecture · design tokens | **Direction only — every UI package individually gated** |
| **ADR-004** | Server actions + typed route handlers | Direction |
| **ADR-005** | PostgreSQL as the primary persistent relational datastore | Direction |
| **ADR-005a** | **Local development: Compose-compatible PostgreSQL container**, runtime **Colima** recommended | **Local dev only — production host still open** |
| **ADR-007** | **Prisma ORM + Migrate**, pinned to 7.x | **Direction only. All paid Prisma products excluded** |
| **ADR-010** | Persistent `jobs` table rather than a queue | Direction |
| **ADR-017** | Observability capabilities | **Principles only — no vendor** |
| **ADR-020** | Scoped RBAC enforced beyond the UI | Direction |
| **ADR-022** | Insert-only evidence; audit in the same transaction | Direction |
| **ADR-023** | Expansion shape | Direction |
| **ADR-025** | **Vitest · Playwright · @axe-core/playwright** | **Scoped — exclusions below** |
| **ADR-029** | Three environments; forward-only reviewed migrations | **Policy only — no provisioning** |
| **ADR-030** | Secret-management principles | **Principles only** |
| **ADR-031** | Backups, PITR, versioning, **rehearsed restore** | **Principles only — no provider** |
| **ADR-032** | **Residency sequencing rule** — blocks production data infrastructure only | Rule approved; **residency answer open** |
| **ADR-035** | No session replay on assessment/artifact/evaluation screens | Principle |
| **ADR-036** | Track B technical vertical slice | **Direction only — not authorised to begin** |
| **ADR-037** | AP-10 Architecture Stability | Principle |
| **ADR-038** | Testing philosophy — five layers, risk tiers, Tier 1 workflows | Principle |
| **ADR-039** | Permanent credential identity | Requirement |
| **ADR-040** | Dual-track validation — Track A and Track B, neither replaces the other | Model |

## 3.2 PENDING HUMAN DECISION

| ID | Decision | Why it is open |
|---|---|---|
| **B1** | **Approve a documented deviation** from `[SPEC]` MVP §9's "Auth.js or Clerk" | Verified evidence shows neither named option satisfies the approved principles cleanly. **Only you can authorise a specification deviation** |
| **B2 / ADR-006** | Authentication provider — **Better Auth** recommended, **Clerk** the defensible alternative | Blocks Track B step 1 |
| **B3** | Accept the five binding conditions if Better Auth is selected | Minimum plugin surface · org/roles out of scope · mapping pattern · prompt patching · Phase 1C re-evaluation |
| **ADR-005a** | **Production** database host — Neon vs Supabase vs RDS | Coupled to ADR-016 and ADR-032 |
| **ADR-016** | Hosting model | ⚠️ **Vercel is Tier 3 from launch** — its Hobby plan is non-commercial only. Free-tier and self-hostable alternatives must be evaluated first |
| **ADR-032** | **The residency answer** — seven inputs verified and classified | Blocks production infrastructure only |
| **ADR-008** | Object storage — R2 vs S3 | Not needed for Track B |
| **ADR-013 / 014 / 015 / 017** | AI provider · payments · email · analytics and error tracking | Not needed for Track B (email needed only for real verification) |
| **OQ-5 · 8 · 9 · 9b · 11 · 12** and others | Domain · HRD Corp verification · refunds · withdrawal · autosave tolerance · deletion vs credential permanence | Product decisions |

## 3.3 PROPOSED — analysed, not yet reviewed

ADR-011 (no Redis) · ADR-012 (Postgres FTS) · ADR-018 (verification model, OB 2.0) · ADR-019 (no proctoring vendor) · **ADR-021 (server-authoritative exam clock — worth early attention; it governs exam durability)** · ADR-024 (events table, no LRS) · ADR-026 (content version fields) · ADR-027 (externalised strings) · ADR-033 (evidence pack as a job) · ADR-034 (transactional email only).

Also awaiting confirmation: the ten conflicts in [`CONFLICT_RESOLUTION_REGISTER.md`](CONFLICT_RESOLUTION_REGISTER.md). CONF-1, CONF-3 and CONF-8 are now implicitly settled by approvals, but should be confirmed so the Blueprint's positions are recorded as deliberately deferred rather than overlooked.

## 3.4 DEFERRED — with recorded triggers

| Item | Deferred until | Cost of deferring |
|---|---|---|
| **Video provider** (ADR-009) | Real lesson content exists | None, given a provider-neutral video reference. Largest variable cost in the platform |
| **Object storage** (ADR-008) | Artifact submission is built | None — Track B stores no files |
| **Payments** (ADR-014) | Candidacy registration is built | None. Answer OQ-2 first — corporate may buy on invoice |
| **AI provider** (ADR-013) | The knowledge library exists | None — the corpus must precede the tutor |
| **Analytics product** (ADR-017) | Real users exist | Low — design the instrumentation points now |
| **Production hosting and database host** | Deployment | None — local development needs neither |
| **Testcontainers** | **Measured test-isolation contention** | None — transaction rollback suffices today |
| **SSO · SCIM · LTI · xAPI · OB 3.0 · proctoring** | Phase 2, or a customer requirement | None — deferred by specification and now also governed by AP-11 |

## 3.5 EXPLICITLY EXCLUDED — require separate approval to revisit

| Excluded | Basis |
|---|---|
| **All paid Prisma products** — Postgres, Compute, Accelerate, Optimize, Data Platform | AP-12 Tier 3. The ORM approval covers Prisma ORM + Migrate only |
| **Paid testing platforms · hosted browser grids · visual-regression SaaS** | AP-12 Tier 3 — Playwright runs locally and in CI at no cost |
| **Vercel Hobby for this product** | `[FACT]` Non-commercial, personal use only. **Tier 3 in disguise** |
| **Adopting any auth provider's organisation/roles as the authorization source** | ADR-020 and AP-04 — `user_roles` in our PostgreSQL is the only authorization source of truth |
| **Building authentication ourselves** | `[SPEC]` MVP §9, explicit |
| Redis · graph database · event bus · dedicated vector store · microservices · LRS/xAPI/SCORM · proctoring vendor · badge signing infrastructure · automated credential decisions · currencies beyond MYR/USD | `[SPEC]` + AP-11 — each may return only with an AP-11 justification |

---

# 4. Decisions required before beginning the Technical Vertical Slice

**Reduced from four to one and a half.**

| # | Decision | Status |
|---|---|---|
| 1 | ORM and migrations | ✅ **APPROVED** — Prisma 7.x |
| 2 | Testing frameworks | ✅ **APPROVED** — Vitest · Playwright · axe |
| 3 | Local development database | ✅ **APPROVED** — Compose container, Colima |
| 4 | **Authentication** | ⏳ **PENDING — B1, B2, B3.** The only remaining blocker |

Then, separately and at the moment each is performed: authorisation to initialise the framework · to install each package · to create the local database and its schema.

---

# 5. Mandatory for every future technology recommendation

Non-negotiable from this point, per AP-12 and ADR-042:

1. **AP-12 tier classification** — Tier 1 / 2 / 3, with reasoning.
2. **The Free Tier Qualification Test** — all eight checks, each with source and date. *"Free" means viable for the intended stage of the product, not merely that a free signup button exists.*
3. **The No Paid Surprise lifecycle table** — local development · automated testing · preview · MVP validation · **initial commercial production** · growth, with the trigger and cost model.
4. **The twelve-row technology cost assessment.**
5. **Free-alternative analysis** — open-source, self-hostable and free-tier managed options evaluated before any paid recommendation.

A recommendation missing any of these is incomplete and must not be acted on.

---

# 6. What still stands between here and implementation

The authentication decision (B1, B2, B3), then your explicit authorisation to begin. When you authorise implementation, each first action will be requested individually: initialise the framework · install the first packages · create the local database · create the first schema — the last a RED gate under `CLAUDE.md` Rule 1 regardless of everything approved above.

**Track A — product experience validation — blocks on nothing** and may begin at your discretion, as may the expert authoring work the specification identifies as the real critical path: the skill list, diagnostic questions, item bank, the brief and its three variants, **the rubric**, and **the three exemplars**.
