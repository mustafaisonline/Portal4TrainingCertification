# Architecture Decision Register

> **Status: PARTIALLY APPROVED — 2026-08-30**
> **Created:** 2026-08-30 · **Version:** 1.0
> **20 decisions were approved on 2026-08-30.** Each carries an **Approval record** stating the date, the approval scope, what is approved, and what the approval does **not** authorize. Approval requires an explicit human instruction naming the ADR ID; nothing is approved by implication.
>
> **Qualifiers are load-bearing:** *(direction only)* = the shape is settled, implementation and dependencies are not · *(principles only)* = the capability is settled, the vendor is not · *(policy only)* = the rule is settled, provisioning is not.
>
> ---
>
> ## 🔒 BASELINE FROZEN — 2026-08-30 · EXECUTION MODE
>
> Architecture exploration is closed. This register, the principles, the guardrails and the product specifications are the **execution baseline**.
>
> **Four decision states only:** `APPROVED` · `PENDING` · `DEFERRED` · `SUPERSEDED`. Scope qualifiers stay in the approval records, where they belong; they are not status categories.
>
> **A new ADR is created only when the decision:** blocks the current implementation milestone · is expensive or dangerous to reverse · affects security, privacy, compliance or persistent data · introduces a new external dependency or recurring cost · changes an approved principle · crosses a RED gate · or materially affects multiple modules.
>
> **Otherwise: use the approved architecture and proceed.** Architecture exists to enable delivery, not delay it.
> Superseded decisions are **never deleted** — they are marked `SUPERSEDED` with a `Superseded-by` reference.

---

## 1. Register summary

Statuses in use: `PROPOSED` (recommended by analysis, not yet reviewed) · `PENDING HUMAN APPROVAL` (crosses a protected boundary or the specifications leave the choice open) · `APPROVED` · `REJECTED` · `SUPERSEDED`.

| ID | Decision | Recommendation | Alternatives | Rationale | Impact | Approval Required | Status |
|---|---|---|---|---|---|---|---|
| ADR-001 | Application shape | Modular monolith — one deployable, enforced module boundaries | 3 separate services (Blueprint §26.1); full microservices | Sized for 1–2 devs; MVP Spec §9 explicit; extraction later is a day's work | Whole system | 🔴 Yes | **APPROVED** 2026-08-30 |
| ADR-002 | Application framework | Next.js App Router + React + TypeScript | Remix; Astro + API; SPA + Node API; Django/Rails | SSR/SEO surface **and** authenticated app in one codebase, one language | Whole system | 🔴 Yes | **APPROVED** 2026-08-30 |
| ADR-003 | UI system | **Direction approved:** Tailwind styling + reusable component architecture + design tokens. **Component libraries remain individually gated** | CSS Modules; MUI/Mantine/Chakra; Headless UI | Accessible primitives; tokens are a spec requirement; light+dark first-class | Every screen | 🔴 Yes | **APPROVED (direction only)** 2026-08-30 |
| ADR-004 | API approach | Server actions + typed route handlers; no separate API service | tRPC; typed REST; GraphQL | MVP Spec §9 explicit; resolves CONF-3 against Blueprint §26.2 | All mutations | 🔴 Yes | **APPROVED** 2026-08-30 |
| ADR-005 | Primary datastore | Single PostgreSQL, sole source of truth | MySQL; document store; polyglot persistence | Relational integrity for credentials/assessments; carries pgvector + FTS | All data | 🔴 Yes | **APPROVED** 2026-08-30 |
| ADR-005a | Postgres host | **Local development: APPROVED** — Compose-compatible PostgreSQL container, recommended runtime **Colima**. **Production host: still open** (Neon vs Supabase vs RDS) | Native machine install; managed dev instance | Reproducible, disposable, matches production version; makes the ADR-031 restore rehearsal cheap | Local dev + production ops | 🔴 Yes (production) | **Local dev APPROVED** 2026-08-30 · production host **DEFERRED** — trigger: first deployment |
| ADR-006 | Authentication | **Better Auth**, with five binding conditions — **requires an approved deviation from `[SPEC]` MVP §9**. Runner-up **Clerk** | Auth.js v4 (legacy line); Auth.js v5 (never released stable); build in-house (rejected by spec) | Full analysis in `DECISION_B_AUTHENTICATION.md`. **Neither spec-named option satisfies the approved principles cleanly** | Identity, all access | 🔴 Yes — **B1 deviation, B2 provider, B3 conditions** | PENDING HUMAN APPROVAL |
| ADR-007 | ORM / migrations | **Prisma ORM + Migrate**, pinned to the 7.x stable line. Paid Prisma products explicitly excluded | Drizzle; Kysely + node-pg-migrate; raw SQL | Apache-2.0, free forever, no account required; stable line actively shipping | Data access layer | 🔴 Yes | **APPROVED (direction only)** 2026-08-30 |
| ADR-008 | Object storage | S3-compatible with signed URLs; **provider open** (R2 vs S3) | Database blobs (rejected); provider-native file APIs | Artifacts, evidence packs, badges must not live in Postgres | Evidence integrity | 🔴 Yes | **DEFERRED** — trigger: artifact submission or evidence packs are built |
| ADR-009 | Video | Managed provider; **defer selection to Phase 1B** | Mux; Cloudflare Stream; Bunny; self-host (rejected) | Largest variable cost; decision is late-binding if the block model is provider-neutral | Content cost | 🔴 Yes (when made) | **DEFERRED** — trigger: real lesson video content exists |
| ADR-010 | Background work | `jobs` table + scheduled invocation route | Redis + durable queue (Blueprint §26.2); managed queue service | Only three jobs exist; resolves CONF-1; job state survives restart | Email, packs, indexing | 🟡 Yes | **APPROVED** 2026-08-30 |
| ADR-011 | Caching | No Redis. Cache only where rebuildable; never a source of truth | Redis for sessions/timers/rate limits | Guardrails Rule 6 + Service Restart Test; resolves CONF-2 | Correctness guarantee | 🟡 Report | **DEFERRED** — trigger: a measured need for rate limiting or shared cache |
| ADR-012 | Search | Postgres full-text search | OpenSearch; Typesense; Algolia | ~30 articles; spec calls alternatives absurd at this scale | Knowledge library | 🟢 | **DEFERRED** — trigger: the knowledge library is built |
| ADR-013 | AI services | Claude behind one routing function; pgvector in the same Postgres | Other LLM vendors; self-hosted models; dedicated vector DB | Model swappability is the requirement; one datastore is explicit | Tutor (M8) | 🔴 Yes | **DEFERRED** — trigger: the knowledge library corpus exists |
| ADR-014 | Payments | Stripe + a Malaysian rail; **rail provider open** | Paddle (merchant of record); Adyen; local gateways; invoice-only | Local rail materially affects conversion; corporate may buy on invoice | Revenue path | 🔴 Yes | **DEFERRED** — trigger: candidacy registration is built; answer OQ-2 first |
| ADR-015 | Transactional email | **Open** — Resend vs Postmark | AWS SES; provider-bundled email | Deliverability is on the SLA path, not cosmetic | SLA, verification | 🔴 Yes | **DEFERRED** — trigger: real email verification is required (Milestone 2+) |
| ADR-016 | Hosting | **Open** — Vercel vs a single container on a managed host | Self-managed VM/Kubernetes (rejected as oversized) | Evidence-pack duration limits and residency drive the choice | Ops, cost, residency | 🔴 Yes | **DEFERRED** — trigger: first deployment |
| ADR-017 | Observability | Error tracker + product analytics + uptime + job health | Logs only (rejected — SLA must be measurable) | NFR-5/NFR-6 require measurement from day one | Operations | 🔴 Yes (analytics) | **APPROVED (principles only)** 2026-08-30 |
| ADR-018 | Credential verification | Permanent credential **identifier** + verification page + OB **2.0** metadata in PNG + PDF | OB 3.0 / W3C VC at MVP; third-party issuer | Resolves CONF-5. **Do not claim OB3.0 conformance before it is true.** Identifier-vs-URL permanence refined by ADR-039 | Trust claim | 🟡 Report | **DEFERRED** — trigger: the credential module is built |
| ADR-019 | Exam integrity | No proctoring vendor. Honour undertaking + time limit + randomised order + in-room invigilation for cohorts | Online proctoring vendor (Blueprint §26.2) | Resolves CONF-6; the artifact is the real integrity control | Integrity posture | 🟡 Report | **DEFERRED** — trigger: the assessment module is built |
| ADR-020 | Authorisation | Scoped many-to-many RBAC; tenancy + integrity rules enforced at the data-access layer | `role` column on users (rejected by spec); UI-level checks (rejected) | Retrofit Test item; BR-1/BR-8/BR-9 must be unavoidable | All access | 🔴 Yes | **APPROVED** 2026-08-30 |
| ADR-021 | Assessment durability | Server-authoritative clock (`started_at` in Postgres) + per-answer server persistence | Client timer; cache-held timer; batch submit at the end | "A lost exam is a refund, a support case, and a reputational hit" | Exam correctness | 🟡 Report | **DEFERRED** — trigger: the assessment module is built |
| ADR-022 | Immutability & audit | `skill_assertions` and `responses` insert-only; audit row in the same transaction as every credential/assessment mutation | Mutable rows with history tables; async audit | Defensibility years later; spec calls it non-negotiable | Credential defence | 🟡 Report | **APPROVED** 2026-08-30 |
| ADR-023 | Expansion shape | Requirements-as-data; no domain literal; no level branch; parameterised routes from day one | Hardcode the pilot domain and revisit later | Domain #2 must be a data operation, not a migration or redesign | Future cost | 🟡 Report | **APPROVED** 2026-08-30 |
| ADR-024 | Learning records | An `events` table only; no LRS, no xAPI, no SCORM in V1 | xAPI emit at MVP (Blueprint §26.3) | Resolves CONF-7; xAPI-shaped payloads can be emitted later from the same rows | Analytics, interop | 🟡 Report | **DEFERRED** — trigger: learning-event capture is built |
| ADR-025 | Testing framework selection | **Vitest · Playwright · @axe-core/playwright.** Paid platforms, hosted grids, visual-regression SaaS and Testcontainers excluded | Jest; Cypress; Testcontainers now | All Tier 1 — free, open source, local. Minimum toolset for ADR-038's five layers | Validation capability | 🔴 Yes | **APPROVED (scoped)** 2026-08-30 |
| ADR-026 | Content versioning | `version`, `status`, `reviewed_at` present from the first schema, read by nothing in V1 | Add versioning when the changelog needs it | Retrofitting versioning is a rewrite | Content lifecycle | 🟡 Report | **DEFERRED** — trigger: the content model is built |
| ADR-027 | Localisation readiness | UI strings externalised from the first commit; no user-visible literals in components | Localise later and refactor then | Extraction later touches every file | Every component | 🟢 | PENDING — follows from `[SPEC]` MVP §2; no separate decision needed to comply |
| ADR-028 | Phase 1A prototype medium | ~~Open — design tool vs fixture-driven production stack~~ | Figma-only; coded prototype; hybrid | Question resolved by human product direction of 2026-08-30 | Phase 1A plan | — | **SUPERSEDED by ADR-036** |
| ADR-029 | Environments & migrations | dev / staging / production; forward-only reviewed migrations; seed data separate from migrations | Two environments; migrations carrying seed data | Payments, email and issuance must be exercised without touching real credentials | Release safety | 🔴 Yes | **APPROVED (policy only)** 2026-08-30 |
| ADR-030 | Secret management | Platform-provided secret store; no secrets in the repository; `.env.example` only | Committed encrypted secrets; a dedicated vault service | `.gitignore` already anticipates this | Security | 🟡 Report | **APPROVED (principles only)** 2026-08-30 |
| ADR-031 | Backup & recovery | Managed automated backups + PITR + a **rehearsed** restore + object-store versioning | Backups without restore testing (rejected) | An unrehearsed backup is an assumption, not a control | Business continuity | 🔴 Yes | **APPROVED (principles only)** 2026-08-30 |
| ADR-032 | Data residency & region (OPEN) | **Residency answer: open.** **Sequencing rule: APPROVED 2026-08-30** — blocks production data infrastructure only, not design, local development, local/automated testing, or non-production prototypes | Assume unconstrained; assume Malaysia-only; block everything until resolved | Seven inputs must be verified and classified; **neither a Malaysian nor an unconstrained requirement may be inferred** | Production hosting, DB, storage **and backups** | 🔴 Yes (residency answer) | **Sequencing rule APPROVED** · residency answer **DEFERRED** — trigger: before provisioning any production data infrastructure |
| ADR-033 | Evidence pack generation | A background job producing a stored, re-downloadable artifact recorded in the database | Generate synchronously on request; generate in the browser | Duration limits; the pack must be reproducible and auditable for a claim | HRD Corp motion | 🟡 Report | **DEFERRED** — trigger: the evidence-pack feature is built |
| ADR-034 | Notifications | Transactional email only in V1, dispatched through the `jobs` table | In-app centre; push; Slack/Teams (all deferred by spec) | Notification centre is explicitly deferred; SLA emails are not | Communication | 🟡 Report | **DEFERRED** — trigger: transactional email is required |
| ADR-035 | Analytics privacy | No session replay or content capture on assessment, artifact, or evaluation screens | Full-session replay everywhere | Assessment content leakage destroys the item bank; artifacts are candidate IP | Privacy, integrity | 🟡 Report | **APPROVED** 2026-08-30 |
| ADR-036 | **Technical vertical slice (Track B)** | A **production-grade vertical slice** on the approved production architecture, ending in verified restart resilience and automated tests | Design-tool prototype (ADR-028); fixture-driven front end | **Human product direction, 2026-08-30.** Validates the real architecture end to end. **Runs alongside Track A — it does not replace it** (ADR-040) | Phase 1 Track B; pulls foundational ADRs forward | 🔴 Yes (to implement) | **APPROVED (direction only)** 2026-08-30 |
| ADR-037 | **Architecture Stability Principle** | Approved architectural boundaries are not replaced without a documented, evidence-based case | Ad-hoc adoption of newer technology; periodic re-platforming | Stability and maintainability are preferred over unnecessary architectural novelty | All future change | 🟡 Governance | **APPROVED** 2026-08-30 |
| ADR-038 | **Testing philosophy** | Five required layers, risk-based and proportionate; named Tier 1 critical workflows | Uniform coverage target; end-to-end only; no formal policy (violates Rule 7) | *A feature is not complete merely because it renders successfully.* Closes the gap between Rule 7 and silent specifications | Definition of Done | 🔴 Yes | **APPROVED** 2026-08-30 |
| ADR-039 | **Credential identity vs verification URL** | Permanent, globally unique **credential identifier** is an architectural requirement; **domain choice** is a product decision with a supported migration path | Treat the URL itself as immutable (earlier position); no stable identifier | Identifier permanence is what portability actually requires; a domain can be migrated with redirects if it ever must be | Credential model; **unblocks foundational work** | 🟡 Confirm | **APPROVED** 2026-08-30 |
| ADR-040 | **Phase 1 dual-track validation** | **Track A** product experience validation **and** **Track B** technical vertical slice, as parallel objectives — neither replaces the other | Track B only (silently drops the MVP Spec's validation intent); Track A only (superseded) | The tracks validate **different risks**: does anyone want it, versus does the architecture hold | Phase 1 plan and exit criteria | 🔴 Yes | **APPROVED** 2026-08-30 |
| ADR-041 | **Adopt the architecture principles set** | AP-01…AP-11 in `ARCHITECTURE_PRINCIPLES.md` as durable, technology-independent principles | No formal principles; intent left embedded in individual ADRs | Principles must outlive the technologies. ADRs record decisions; principles record durable intent | All future architecture work | 🔴 Yes | **APPROVED** 2026-08-30 |
| ADR-042 | **AP-12 Zero-Cost Development and Free-First Technology** | Adopt AP-12: zero mandatory technology cost during development and MVP validation; three-tier preference; mandatory free-alternative analysis and cost assessment | Case-by-case cost judgement; accept small recurring costs for convenience | Issued as human direction 2026-08-30. Removes the failure mode where paid services are adopted for convenience and the cost recurs forever | **All technology selection**; changes Decision B and the hosting decision | 🔴 Issued by direction | **APPROVED** 2026-08-30 |

---

## 2. Full decision records

Each record: **Context · Decision/Recommendation · Alternatives considered · Consequences · Approval status · Superseded-by.**

---

### ADR-001 — Application shape: modular monolith
**Date:** 2026-08-30 · **Status:** APPROVED — 2026-08-30 · **Superseded-by:** —

**Context.** Blueprint §26.1 argues for a modular monolith *plus* three genuinely separate services (assessment & credentialing, AI, analytics/LRS) because their security, availability and scaling profiles differ. MVP Spec §9 states: "One deployable application. One database. No microservices." The team is 1–2 developers plus a designer (NFR-11). This is conflict **CONF-8**.

**Decision.** One deployable application with **internal module boundaries that are enforced, not aspirational**: assessment and credentialing modules import nothing from marketing or content code; cross-module access goes through a named module interface, never by reaching into another module's tables.

**Alternatives.** (a) Three services from day one — correct destination, but triples deployment, observability and local development cost for a two-person team, and the availability argument ("assessment must survive the marketing site being down") is weak when both are one Next.js deploy on managed infrastructure. (b) Full microservices — no justification at this scale.

**Consequences.** Cheap now; extraction later is "a day's work" *only if* the boundaries hold — so boundary violations must be treated as defects, not style. A single deploy means a bad release affects the exam surface too, which raises the importance of ADR-029 (staging) and ADR-021 (exam durability).

**Approval.** 🔴 Required — this is the load-bearing architectural decision.


**Approval record.**
- **Approved:** 2026-08-30, by the project owner.
- **Approval scope:** Architectural direction.
- **What is approved:** A single deployable application with **enforced internal module boundaries**, and the rejection of a service split for V1.
- **What this approval does NOT authorize:** Any second deployable, extracted service, or network boundary between modules. Extraction remains a RED gate requiring AP-10's nine questions **and** AP-11's justification criteria. Nothing here authorises framework initialisation · package installation · database provisioning · schema creation · infrastructure provisioning · external service account creation · deployment · commits or pushes.

---

### ADR-002 — Application framework: Next.js App Router + TypeScript
**Date:** 2026-08-30 · **Status:** APPROVED — 2026-08-30 

**Context.** The product needs server-rendered indexable pages (knowledge library, glossary, credential detail, and the public verification page that carries the growth loop — NFR-4) *and* a heavily interactive authenticated app (lesson player, artifact workspace, assessor workbench). Both specifications name Next.js.

**Decision.** Next.js App Router + React + TypeScript as the single application framework, with server components by default and business logic held in framework-agnostic service modules.

**Alternatives.** Remix; Astro + separate API; SPA + Node API; Django/Rails — assessed in `TECHNOLOGY_STACK.md` §1.1. The SPA option is disqualified by NFR-4; the split-stack options add a second deployable that NFR-11 cannot afford.

**Consequences.** Framework coupling to App Router conventions and caching semantics. Upgrade cadence must be budgeted. Business rules must be deliberately kept out of route and component files so that BR-1, BR-8 and BR-11 are enforceable and testable.

**Approval.** 🔴 Required. Approval of this record is **not** authority to run a scaffolding command — framework initialisation is a separate RED-gate action.


**Approval record.**
- **Approved:** 2026-08-30, by the project owner.
- **Approval scope:** Architectural direction — framework and primary language.
- **What is approved:** Next.js (App Router) + React + TypeScript as the application framework and primary language, with business logic held in framework-agnostic service modules.
- **What this approval does NOT authorize:** **Initialising Next.js. Installing any npm package.** Both remain separately gated. This approval settles *what* the framework will be, not *when* it is created. Nothing here authorises framework initialisation · package installation · database provisioning · schema creation · infrastructure provisioning · external service account creation · deployment · commits or pushes.

---

### ADR-003 — UI system: Tailwind, reusable components, design tokens
**Date:** 2026-08-30 · **Status:** APPROVED (direction only) — 2026-08-30 

**Context.** Blueprint §25.7 requires design tokens as the single source of truth, light and dark as first-class, WCAG 2.2 AA verified per component, and RTL readiness. MVP Spec §10 requires five signature components (`CredentialCard`, `SkillMeter`, `MilestoneTimeline`, `RubricPanel`, diagnostic canvas) built before any screen.

**Decision.** Tailwind for styling, Radix/shadcn primitives for accessible behaviour, with all colour/type/space/radius/motion values defined once as tokens.

**Alternatives.** CSS Modules or vanilla-extract (no accessible primitives, more hand-rolled a11y risk); MUI/Mantine/Chakra (fights the specified visual direction, heavy theme overrides).

**Consequences.** shadcn components become project-owned code the team maintains. Token discipline is the failure mode: any hard-coded colour is a defect.

**Approval.** 🔴 Required (new dependencies).


**Approval record.**
- **Approved:** 2026-08-30, by the project owner.
- **Approval scope:** UI architecture direction only. **Explicitly partial.**
- **What is approved:** Three things: **Tailwind CSS as the styling approach**; a **reusable component architecture**; and **consistent design tokens and design-system principles** (single source of truth for colour, type, space, radius, motion; light and dark first-class; WCAG 2.2 AA per component).
- **What this approval does NOT authorize:** **Any specific UI dependency or component library.** Radix, shadcn, and every other package named in the original recommendation remain subject to the normal dependency approval process, individually. Approval of a styling *approach* is not approval of the packages that might implement it — see the note below. Nothing here authorises framework initialisation · package installation · database provisioning · schema creation · infrastructure provisioning · external service account creation · deployment · commits or pushes.

**Note — the distinction being drawn, and why it matters.**

| Approved as architectural direction | Still requires individual dependency approval |
|---|---|
| Tailwind CSS as the **styling approach** | Any Tailwind plugin or preset |
| A **reusable component architecture** — components designed once, with documented props and states, and reused | **Radix**, **shadcn/ui**, or any other primitive or component library |
| **Design tokens** as the single source of truth for colour, type, space, radius, motion | Any icon set, animation library, chart library, rich-text editor, date picker, file-upload widget, or table library |
| **Light and dark as first-class**, WCAG 2.2 AA verified per component, RTL-capable structure | Any accessibility-testing or component-documentation tooling |

**Why the distinction is real rather than pedantic.** The architectural commitment is that the UI has *a token system and a reusable component layer*. That commitment is satisfiable in several ways, including by hand-building the small number of primitives this product needs. Approving the direction does not decide which — and must not, because each dependency carries its own maintenance, security, licence, accessibility and bundle-size consequences that the direction-level decision never examined.

**Practical effect on Track B.** The slice needs a small set of components (navigation, cards, tables, form inputs, a dialog). Whether any of them come from a library is a **per-package decision requiring approval at the moment it is proposed**, with the case made under AP-11: what current requirement does this dependency meet that the existing approach cannot?

---

### ADR-004 — API approach: server actions + typed route handlers
**Date:** 2026-08-30 · **Status:** APPROVED — 2026-08-30 

**Context.** Conflict **CONF-3**: Blueprint §26.2 recommends "tRPC or typed REST"; MVP Spec §9 states "Server actions + typed route handlers. No separate API service. tRPC optional, not required." The MVP Spec is authoritative for build scope.

**Decision.** Server actions for in-app mutations; typed route handlers for anything with an external caller — payment webhooks (signature-verified, idempotent), scheduled job invocation (shared-secret authenticated), and CSV import/export. The public verification page is a server-rendered page, not an API.

**Alternatives.** tRPC (adds a layer a single-consumer app does not need); typed REST throughout (more ceremony for the same result); GraphQL (explicitly reserved for third-party consumers that do not exist).

**Consequences.** No stable external API contract exists in V1 — acceptable, because the verification API is explicitly a future item. When it arrives, it should be added as route handlers over the same services, not as a rewrite.

**Approval.** 🔴 Required.


**Approval record.**
- **Approved:** 2026-08-30, by the project owner.
- **Approval scope:** Architectural direction — API approach.
- **What is approved:** Server actions for in-app mutations; typed route handlers for external callers (webhooks, scheduled invocation, CSV). No separate API service in V1. Resolves CONF-3 in favour of the MVP Build Spec.
- **What this approval does NOT authorize:** Implementation, or the addition of any transport library. A future public verification API is a separate decision. Nothing here authorises framework initialisation · package installation · database provisioning · schema creation · infrastructure provisioning · external service account creation · deployment · commits or pushes.

---

### ADR-005 / ADR-005a — PostgreSQL as the single source of truth; host open
**Date:** 2026-08-30 · **Status:** APPROVED — 2026-08-30 

**Context.** Credentials, assessments, evidence and audit records must be relationally consistent and defensible years later. Both specifications name PostgreSQL and explicitly reject a graph database, an event bus and a separate vector store.

**Decision.** One managed PostgreSQL instance holds all business state, with `pgvector` for RAG and full-text search for the knowledge library. **The physical schema is not designed here** and its creation remains a separate RED gate (`CLAUDE.md` Rule 1). Host selection (**ADR-005a**: Neon vs Supabase vs AWS RDS) is deliberately left open and is coupled to ADR-016 (hosting) and ADR-032 (residency).

**Alternatives.** MySQL/MariaDB (no in-tree pgvector); document stores (wrong shape for the specification's expensive-to-reverse relational decisions); polyglot persistence (explicitly rejected).

**Consequences.** A single failure domain — answered by ADR-031 (backup, PITR, rehearsed restore). Connection-limit management matters if hosting is serverless.

**Approval.** 🔴 Required, and separately again for any schema creation.


**Approval record.**
- **Approved:** 2026-08-30, by the project owner.
- **Approval scope:** Architectural direction — **PostgreSQL as the primary persistent relational datastore**.
- **What is approved:** PostgreSQL as the sole source of truth for business state, carrying relational data, embeddings and full-text search in one datastore.
- **What this approval does NOT authorize:** **Creating a database. Creating any schema. Provisioning any instance. Selecting a production host** — the production portion of ADR-005a remains PENDING. Physical data-model creation stays a RED gate under `CLAUDE.md` Rule 1, without exception. Nothing here authorises framework initialisation · package installation · database provisioning · schema creation · infrastructure provisioning · external service account creation · deployment · commits or pushes.

---

**ADR-005a — local development portion · APPROVED 2026-08-30.**

- **Approval scope:** How PostgreSQL runs **for local development and automated testing only**.
- **What is approved:** A **Compose-compatible PostgreSQL container** rather than a native machine installation — version-pinned to the intended production major, with `pgvector` available and a separate database for automated tests. Recommended runtime: **Colima** (`[FACT 2026-08-30]` MIT, 30,564 stars, macOS-native, runs the real Docker engine so `docker compose` works unmodified). **Podman** (Apache-2.0) and **Docker Desktop** (free under 250 employees and $10M revenue) are acceptable alternatives — the dependency is on the **Compose specification**, not on any runtime.
- **What this approval does NOT authorize:** Installing a container runtime · creating a database · creating any schema · **selecting the production database host**, which remains open pending ADR-016 and ADR-032.

---

### ADR-006 — Authentication provider (OPEN)
**Date:** 2026-08-30 · **Status:** PENDING HUMAN APPROVAL

**Context.** MVP Spec §9: "Auth.js or Clerk. **Do not build auth.** SSO comes later via the same provider." Blueprint §26.2 wants a managed provider supporting OIDC/SAML/SCIM (conflict **CONF-4**). V1 needs email/password + Google, email verification and password reset only; SSO and SCIM are explicitly deferred.

**Decision (recommendation).** Choose a provider whose **later SSO/SCIM path is configuration rather than migration**, and decide between: **Auth.js** — a library, no per-user cost, identity data stays in our Postgres, but we operate the flows and own more security surface; **Clerk** — hosted flows, MFA and later SSO largely configuration, at a per-MAU cost and with identity data at a vendor.

**Alternatives.** Building authentication in-house — explicitly rejected by the specification. Supabase Auth — only coherent if ADR-005a also selects Supabase.

**Consequences.** Whichever is chosen, the **`user_roles` scoped model (ADR-020) stays in our database** and is never delegated to the auth provider. Authorisation is ours; only authentication is bought.

**Full analysis — 2026-08-30.** Sections A–E (cost/AP-12 fit · identity architecture · portability and exit · maturity including published security history · complexity) are in **[`DECISION_B_AUTHENTICATION.md`](DECISION_B_AUTHENTICATION.md)**. Two findings changed the assessment:

1. `[FACT]` **Clerk exports users including hashed passwords** (dashboard CSV or `getUserList()` API) — the portability objection raised earlier is largely answered, and Clerk's exit complexity drops from *medium-high* to *medium*.
2. `[FACT]` **Better Auth has 20 published security advisories** (2 critical, ~11 high, 2025-02 → 2026-07) versus 14 for next-auth across five years. Advisory counts are not a risk ranking and Clerk's absence from the comparison is a disclosure-model artifact — but the density is high for a two-year-old library on a sign-in path.
3. `[FACT]` **"Auth.js stable" means v4** (4.24.15). v5 has never been published to `latest`.

**Recommendation:** **Better Auth**, subject to five binding conditions (minimum plugin surface · organisation/roles features out of scope · mandatory identity-mapping pattern · prompt-patching commitment · re-evaluation at Phase 1C). **Runner-up: Clerk**, a genuinely defensible alternative if vendor-operated security is weighted above AP-12's cost and local-first preference, or if the patching commitment cannot be met.

**Proposed specification deviation.** `[SPEC]` MVP §9 names "Auth.js or Clerk". On verified evidence **neither satisfies the approved principles cleanly** — Auth.js's stable line is legacy with a successor that never shipped; Clerk is Tier 2 under AP-12, becomes Tier 3 at enterprise SSO, and requires a vendor account and network access in local development and CI. A documented deviation is therefore **proposed, not assumed**.

**Approval.** 🔴 Required — authentication architecture is a named RED gate. **Three separate decisions: B1** approve the specification deviation · **B2** select the provider · **B3** accept conditions 1–5 if Better Auth is selected.

---

### ADR-007 — ORM and migration tooling (OPEN)
**Date:** 2026-08-30 · **Status:** APPROVED (direction only) — 2026-08-30 

**Context.** MVP Spec §9: "Prisma or Drizzle — migrations you can read." Under `CLAUDE.md` Rule 1 every physical data-model change needs human approval, so **the human must be able to read and judge a migration**.

**Decision (recommendation).** Weigh reviewability against delivery speed. **Drizzle** produces plain SQL migrations, which are the easiest artefact to approve under this governance regime. **Prisma** offers a more mature toolchain and broader familiarity, which matters for a very small team.

**Consequences.** Whichever is chosen: seed data must live in seed files, never in migrations (MVP Spec §16.2 rule 5); production migrations are forward-only and reviewed; and the ORM must not be allowed to silently generate destructive operations.

**Approval.** 🔴 Required.


**Approval record.**
- **Approved:** 2026-08-30, by the project owner, **subject to AP-12**.
- **Approval scope:** The ORM and migration **technology direction only** — Prisma ORM and Prisma Migrate, pinned to the **7.x stable line**.
- **What is approved:** Prisma ORM + Migrate as the data-access and migration technology. `[FACT verified 2026-08-30]` Licence **Apache-2.0**; *"Prisma ORM is free and always will be"*; Migrate included at no cost; **"Using Prisma ORM and Migrate requires no paid product or account"** — local development requires no Prisma account.
- **Explicitly outside the approved scope:** **Prisma Postgres · Prisma Compute · Prisma Accelerate · Prisma Optimize · any Prisma Data Platform product.** Adopting any of them would be a **Tier 3 decision under AP-12** requiring separate approval.
- **What this approval does NOT authorize:** Installing Prisma. Creating a schema. Running a migration. ⚠️ Note npm's `latest` tag currently resolves to **8.0.0-rc.12** — the approved direction is 7.x and must be pinned explicitly. Nothing here authorises framework initialisation · package installation · database provisioning · schema creation · infrastructure provisioning · external service account creation · deployment · commits or pushes.

---

### ADR-008 — Object storage
**Date:** 2026-08-30 · **Status:** PENDING HUMAN APPROVAL

**Context.** Artifacts, evidence packs, badge images and lesson downloads need durable storage with controlled access. Candidate artifacts are assessed evidence and must remain retrievable for credential defensibility.

**Decision.** S3-compatible object storage with short-lived signed URLs; the database stores metadata and object keys only; buckets are never publicly listable. Provider open: **Cloudflare R2** (no egress fees, simple pricing) vs **AWS S3** (region choice including Southeast Asia, deepest tooling) — decide alongside ADR-032.

**Alternatives.** Storing files in Postgres (rejected — bloats backups, poor streaming); a provider-native file API tied to the hosting platform (creates lock-in on the one asset class that must outlive vendor choices).

**Consequences.** Upload validation (type, size, malware posture) becomes an explicit requirement. Object lifecycle and retention must be defined per class — see `DATA_ARCHITECTURE.md` §7.

**Approval.** 🔴 Required.

---

### ADR-009 — Video provider (DEFERRED)
**Date:** 2026-08-30 · **Status:** PROPOSED (decision deliberately deferred)

**Context.** "Never build video" is explicit in both specifications. Phase 1A needs exactly **one real 3-minute lesson**; the rest are posters with durations. Video is the largest variable cost in the platform.

**Decision.** Defer provider selection to Phase 1B. Design the content `block` model with a **provider-neutral video reference** so the choice is late-binding.

**Alternatives.** Choosing now (Mux / Cloudflare Stream / Bunny) — no benefit, and locks in cost structure before the content volume is known.

**Consequences.** A provider-neutral reference must be part of the content model design when it is proposed. Captions and transcripts are mandatory (NFR-3) and must be a selection criterion.

**Approval.** 🔴 Required when the decision is actually made.

---

### ADR-010 — Background work: `jobs` table, not a queue service
**Date:** 2026-08-30 · **Status:** APPROVED — 2026-08-30 

**Context.** Conflict **CONF-1**: Blueprint §26.2 specifies "Redis + a durable job queue"; MVP Spec §9 specifies "A `jobs` table + a cron route. Not a queue service. Only three jobs exist: send email, generate evidence pack, index article."

**Decision.** A `jobs` table in Postgres plus a scheduled invocation route. Every handler is idempotent; every job carries attempt count, last error and a terminal failure state visible to platform admin.

**Alternatives.** Redis + BullMQ or a managed queue — adds an infrastructure component, a second failure domain and a second source of state, for three jobs. Revisit when job volume, fan-out or latency requirements make polling inadequate.

**Consequences.** Job state survives restart by construction, satisfying the Service Restart Test. Polling granularity limits latency — acceptable for email and pack generation, and this must be stated so nobody later assumes sub-second dispatch.

**Approval.** 🟡 Report explicitly; the human should confirm the departure from Blueprint §26.2.


**Approval record.**
- **Approved:** 2026-08-30, by the project owner.
- **Approval scope:** Architectural direction — background work.
- **What is approved:** A persistent `jobs` table plus scheduled invocation, with idempotent handlers, in preference to introducing a queue service by default. Resolves CONF-1 in favour of the MVP Build Spec.
- **What this approval does NOT authorize:** Implementation. Note the converse is also now governed: **introducing a queue later requires AP-11 justification** — a current functional requirement, a demonstrated limitation, or a measurable operational need — not anticipated volume. Nothing here authorises framework initialisation · package installation · database provisioning · schema creation · infrastructure provisioning · external service account creation · deployment · commits or pushes.

---

### ADR-011 — Caching: no Redis; cache is never authoritative
**Date:** 2026-08-30 · **Status:** PROPOSED

**Context.** Conflict **CONF-2**: Blueprint §26.2 lists Redis for "sessions, rate limits, background jobs, **assessment timers**". `CLAUDE.md` Rule 6 and Guardrails §13 forbid business-critical state living only in cache. An assessment timer in a cache fails the Service Restart Test outright.

**Decision.** No Redis in V1. Caching is limited to: static/ISR page cache for public content, HTTP/CDN cache for assets, in-request memoisation, and RAG retrieval caching for cost control. Every one of these is rebuildable from Postgres; losing all of them costs latency or money, never correctness.

**Alternatives.** Introducing Redis now — a new infrastructure dependency serving no V1 requirement, and it creates the temptation that Rule 6 exists to prevent.

**Consequences.** Rate limiting, if needed for the AI tutor, must be implemented against Postgres or a platform-provided facility rather than assumed from Redis.

**Approval.** 🟡 Report.

---

### ADR-012 — Search: PostgreSQL full-text
**Date:** 2026-08-30 · **Status:** PROPOSED

**Context.** ~20–30 knowledge articles plus a ~60-term glossary. Blueprint §26.2 suggests FTS + pgvector hybrid, escalating to OpenSearch/Typesense at scale; MVP Spec §9 says Postgres full-text and calls OpenSearch "absurd" at this size. These are compatible (CONF-10).

**Decision.** Postgres full-text search for the library and glossary. `pgvector` is present for the tutor regardless, so a hybrid semantic/keyword search is an enhancement available without a new dependency.

**Consequences.** Global search across the whole product is deferred by the specification and is not implied by this decision.

**Approval.** 🟢

---

### ADR-013 — AI services: Claude behind one routing function
**Date:** 2026-08-30 · **Status:** PENDING HUMAN APPROVAL

**Context.** M8 is the only AI feature in the functional MVP: RAG over the knowledge library, citations with version stamps on every substantive answer, refusal when out of corpus, and **visibly disabled during assessment with the reason shown**.

**Decision.** A thin server-side AI service module with **all model access behind a single function** so models are swappable; embeddings and retrieval in the same Postgres via pgvector; a maintained eval set covering answer accuracy, refusal correctness and citation validity, run on every model or prompt change.

**Alternatives.** Direct model calls scattered through the code (makes model change a rewrite); a dedicated vector database (explicitly rejected); self-hosted models (operationally out of reach for this team, and quality risk on a product whose credibility rests on citation accuracy).

**Consequences.** An external dependency on the tutor path: it must degrade gracefully and never block learning. A **data-processing agreement and a "no training on learner data" contractual term are required** (Blueprint §17.4) — tracked as OQ-4. Per-feature cost budgets with alerting are required by Blueprint §26.6.

**Approval.** 🔴 Required (new external service).

---

### ADR-014 — Payments: Stripe plus a Malaysian rail (rail OPEN)
**Date:** 2026-08-30 · **Status:** PENDING HUMAN APPROVAL

**Context.** MYR + USD only. Local payment methods materially affect conversion in the primary market. The specifications name FPX/DuitNow but no provider.

**Decision.** Stripe for cards and the commerce record; a Malaysian rail to be selected. **Entitlement is never derived from the payment provider** — our `orders`/`candidacies` records are authoritative, updated by idempotent, signature-verified webhooks and reconcilable after any outage.

**Alternatives.** Paddle as merchant of record (simplifies tax at the cost of fees and control); local gateways (Billplz, iPay88, Razer MS); **invoice + bank transfer only** for corporate, which may make an online local rail an individual-conversion feature rather than a launch blocker.

**Consequences.** Tax treatment, the invoicing legal entity, and refund policy per product type are unresolved (OQ-2, OQ-9). Card data is never stored — tokenised at the processor (Blueprint §26.5).

**Approval.** 🔴 Required.

---

### ADR-015 — Transactional email provider (OPEN)
**Date:** 2026-08-30 · **Status:** PENDING HUMAN APPROVAL

**Context.** Email carries verification, password reset, receipts, candidacy windows, **assessor assignment** and **decision notices**. The last two sit on the publicly displayed 10-working-day SLA path.

**Decision.** Resend or Postmark, dispatched through the `jobs` table so a send failure is retried and visible rather than lost. A dedicated sending domain with SPF, DKIM and DMARC is required either way (OQ-3).

**Consequences.** Email delivery becomes an operational metric, not a fire-and-forget call.

**Approval.** 🔴 Required.

---

### ADR-016 — Hosting model (OPEN)
**Date:** 2026-08-30 · **Status:** PENDING HUMAN APPROVAL

**Context.** MVP Spec §9 allows "Vercel (or a single container on any managed host)". Two forces push against pure serverless: **evidence-pack generation** may exceed function execution limits, and **data residency** may constrain regions.

**Decision.** Defer to the human, informed by ADR-032 and ADR-033. If residency is unconstrained and packs are generated as background jobs with modest bundles, Vercel is the lowest-operations choice. If residency is constrained or packs are large, a single container in a Southeast Asian region is the safer answer.

**Consequences.** This decision constrains ADR-005a and ADR-008 (regions), and shapes how the scheduled job invocation is triggered.

**Approval.** 🔴 Required.

---

### ADR-017 — Observability
**Date:** 2026-08-30 · **Status:** APPROVED (principles only) — 2026-08-30 

**Context.** "The funnel must be measurable from day one." The assessment SLA is publicly displayed and must be measured rather than estimated. Artifact submission rate is the single most important number in the business.

**Decision.** Error tracking on server and client; a product analytics tool instrumenting the §5 journey; uptime monitoring including the public verification page; job-health visibility; structured logs that exclude PII and assessment content. The `audit_log` is **business data, not telemetry**, and lives in Postgres.

**Consequences.** Analytics selection needs a privacy review (ADR-035). SLA measurement must be a first-class query over submission and evaluation timestamps, not a dashboard afterthought.

**Approval.** 🔴 Required for the analytics product (new external service).


**Approval record.**
- **Approved:** 2026-08-30, by the project owner.
- **Approval scope:** Observability **principles and required capabilities** only.
- **What is approved:** That the system must have: error tracking on server and client · funnel instrumentation with **artifact submission rate** as the headline metric · **SLA instrumentation** measuring submission-to-decision time · job health visibility · uptime monitoring including the public verification page · structured logs excluding PII and assessment content. The `audit_log` remains business data, not telemetry.
- **What this approval does NOT authorize:** **Any specific vendor or SaaS product.** Sentry, PostHog, Plausible, Amplitude, Mixpanel and every alternative remain PENDING as Group 5 vendor decisions. Nothing here authorises framework initialisation · package installation · database provisioning · schema creation · infrastructure provisioning · external service account creation · deployment · commits or pushes.

---

### ADR-018 — Credential verification and badge standard
**Date:** 2026-08-30 · **Status:** PROPOSED

**Context.** Conflict **CONF-5**: Blueprint §26.3 lists Open Badges 3.0 / W3C VC as MVP; MVP Spec §13.1 and M7 specify a `public_uid` plus a verification page plus OB **2.0** metadata baked into the PNG, with cryptographic VCs deferred to Phase 1C/2.

**Decision.** Follow the MVP Spec. The verification URL is permanent and is treated as a public contract. **Publicly claim only what is true** — practical portability now, cryptographic verifiability later. On a trust product this is the one lie that cannot be afforded.

**Consequences.** The credential **identifier** scheme must be decided carefully once, because the identifier is permanent for the life of the credential. **Refined by ADR-039:** identifier permanence is the architectural requirement; the *domain* is a product and branding decision supported by a migration and redirect strategy, and it does not need to be treated as literally immutable.

**Approval.** 🟡 Report.

---

### ADR-019 — Exam integrity without a proctoring vendor
**Date:** 2026-08-30 · **Status:** PROPOSED

**Context.** Conflict **CONF-6**. MVP Spec M5 rejects a proctoring vendor on four grounds: cost per exam, conversion friction, accessibility hostility, and integration burden — for a control that is not the real one. The artifact is the real integrity control.

**Decision.** Integrity in V1 = honour undertaking + time limit + randomised item order + in-room invigilation for corporate cohorts, stated openly on the credential page.

**Consequences.** No proctoring integration, no recordings, and therefore **no highly sensitive biometric or video data class** in V1 — a meaningful privacy and cost simplification. Exam windows must be scheduled around actual working hours (Spec §13.4) — an operational constraint the software must support.

**Approval.** 🟡 Report.

---

### ADR-020 — Authorisation: scoped RBAC enforced at the data layer
**Date:** 2026-08-30 · **Status:** APPROVED — 2026-08-30 

**Context.** A person is routinely learner + assessor + org admin. Both specifications call a single `role` column "the most common and most expensive early data-model mistake". BR-8 requires assessment content to be unreadable by non-assessors **at the query layer**, not merely hidden in the UI.

**Decision.** `user_roles(user_id, role, scope_type, scope_id)` from the first commit. Authorisation, tenancy filtering (`organisation_id`) and the assessor conflict-of-interest rule (BR-1) are implemented as **shared guards in the service/repository layer** that a screen cannot bypass or forget.

**Alternatives.** UI-level checks (rejected — the specification explicitly forbids this for assessment content); database row-level security (a legitimate additional layer worth evaluating, but not a substitute for service-layer rules).

**Consequences.** Every data-access path must go through the guarded layer; direct table access from route or component code becomes a defect. Tests must cover the negative cases — this is the highest-value test surface in the product.

**Approval.** 🔴 Required (authorisation architecture).


**Approval record.**
- **Approved:** 2026-08-30, by the project owner.
- **Approval scope:** Architectural direction — authorization model and enforcement point.
- **What is approved:** Scoped many-to-many role assignments (`user, role, scope_type, scope_id`), with authorization, tenancy filtering and integrity rules (BR-1 conflict of interest, BR-8 assessment-content restriction, BR-9 tenancy) enforced **at the service and data-access layer, beyond the UI**, as shared guards a feature cannot bypass.
- **What this approval does NOT authorize:** Implementation, schema creation, or selection of an authentication provider (ADR-006 remains PENDING). Authorization is ours regardless of which authentication vendor is chosen. Nothing here authorises framework initialisation · package installation · database provisioning · schema creation · infrastructure provisioning · external service account creation · deployment · commits or pushes.

---

### ADR-021 — Assessment session durability
**Date:** 2026-08-30 · **Status:** PROPOSED

**Context.** NFR-1: an assessment session must survive a page refresh and a brief network loss without data loss. Blueprint §26.2 suggested holding assessment timers in Redis, which would fail the Service Restart Test.

**Decision.** The **server-side `started_at` timestamp in Postgres is the authoritative clock**; the client renders a derived countdown. Each answer is persisted to the server as it is given; `responses` are insert-only. Resume restores from the database, never from browser storage.

**Alternatives.** Client-held timer (trivially manipulable and lost on refresh); cache-held timer (violates Rule 6); batch submission at the end (one network failure destroys an exam).

**Consequences.** More write traffic during exam windows — the spiky workload NFR-9 already identifies. This is the correct place to spend it.

**Approval.** 🟡 Report.

---

### ADR-022 — Immutability and audit
**Date:** 2026-08-30 · **Status:** APPROVED — 2026-08-30 

**Context.** MVP Spec §9 non-negotiables: `skill_assertions` and `responses` are insert-only, never updated; every credential and assessment mutation writes an `audit_log` row. Blueprint §26.4 makes the same point for defensibility years later.

**Decision.** Enforce insert-only in the service layer and, additionally, consider database-level privileges so that no future code path can update these tables. Audit rows are written **in the same transaction** as the mutation they describe, so an audit gap is impossible.

**Alternatives.** Mutable rows plus history tables (weaker guarantee, more code); asynchronous audit writes (creates gaps precisely when the system is failing).

**Consequences.** Corrections are expressed as new rows, and every read path must understand "latest assertion wins". This must be explicit in the conceptual model.

**Approval.** 🟡 Report.


**Approval record.**
- **Approved:** 2026-08-30, by the project owner.
- **Approval scope:** Architectural direction — persistence, immutability and auditability where applicable.
- **What is approved:** Insert-only skill assertions and assessment responses; audit records written **in the same transaction** as the credential or assessment mutation they describe; corrections expressed as new records rather than edits.
- **What this approval does NOT authorize:** Implementation or schema creation. The question of whether audit scope extends beyond credential and assessment actions (OQ-16) remains open. Nothing here authorises framework initialisation · package installation · database provisioning · schema creation · infrastructure provisioning · external service account creation · deployment · commits or pushes.

---

### ADR-023 — Expansion shape without building expansion
**Date:** 2026-08-30 · **Status:** APPROVED — 2026-08-30 

**Context.** MVP Spec §16: adding domain #2 or credential #2 must be a data operation plus content — never a schema migration and never a redesign. The entire cost of keeping the ladder possible is "two integer columns nothing reads".

**Decision.** Adopt the specification's rules as architecture: requirements-as-data; `domain_id` / `level` / `sort_order` / `version` columns present and inert; no domain literal and no level branch in application code; domain-scoped queries take a `domainId` parameter; routes parameterised (`/learn/[domain]/…`, `/certify/[credential]`) from day one; the credential's display name comes from the row.

**Consequences.** A grep for the pilot domain slug outside seed files and content must return zero hits — this is a reviewable, testable rule. Parameterised routes must be settled before any inbound link or verification URL exists, because retrofitting URL structure breaks every earned link.

**Approval.** 🟡 Report.


**Approval record.**
- **Approved:** 2026-08-30, by the project owner.
- **Approval scope:** Architectural direction — approved expansion shape.
- **What is approved:** Requirements-as-data; `domain_id` / `level` / `sort_order` / `version` present and inert; **no domain literal and no level branch in application code**; domain-scoped queries take a `domainId` parameter; parameterised routes; credential display name read from the row.
- **What this approval does NOT authorize:** Implementation. Note this is an AP-11 exception case: these are *structural* shapes costing almost nothing now and a rewrite later — not added components. Nothing here authorises framework initialisation · package installation · database provisioning · schema creation · infrastructure provisioning · external service account creation · deployment · commits or pushes.

---

### ADR-024 — Learning records: an `events` table, no LRS
**Date:** 2026-08-30 · **Status:** PROPOSED

**Context.** Conflict **CONF-7**: Blueprint §26.3 lists xAPI emit as MVP; MVP Spec §13.1 assigns xAPI/LRS/SCORM zero MVP value and specifies "an `events` table; emit xAPI-shaped payloads later from the same rows".

**Decision.** Follow the MVP Spec. Record learning events in our own table with enough fidelity (actor, verb-equivalent, object, context, timestamp) that xAPI statements can be generated later without re-instrumenting.

**Consequences.** Enterprise LMS-hosting deals will require this work later; the shape chosen now determines whether that is a projection or a re-instrumentation.

**Approval.** 🟡 Report.

---

### ADR-025 — Testing framework and library selection
**Date:** 2026-08-30 · **Status:** APPROVED (scoped) — 2026-08-30 · **Scope narrowed 2026-08-30**

**Context.** This record originally covered both testing *philosophy* and *tooling*. On human instruction the two are now separated: **philosophy and required layers are ADR-038** and are documented in `TESTING_ARCHITECTURE.md`; **this record covers tool selection only**, which remains deliberately closed.

**Decision.** Deferred. No testing library is selected and none may be installed. The candidate shape, recorded for comparison only, is: a unit/integration runner, a real test database, a browser-driving end-to-end tool, and an accessibility assertion library.

**Alternatives.** No formal framework — violates `CLAUDE.md` Rule 7. End-to-end only — too slow and too coarse to assert the rule-level guarantees (append-only writes, audit atomicity, tenancy isolation, assessor conflict of interest) that this product depends on.

**Consequences.** Until this is decided, **no work can honestly be reported as complete** beyond "Implemented". Because ADR-036 makes Phase 1A a production-grade vertical slice, this decision is now needed **before Phase 1A**, not before Phase 1B.

**Approval.** 🔴 Required (Guardrails §17 — no new testing frameworks without approval).


**Approval record.**
- **Approved:** 2026-08-30, by the project owner.
- **Approval scope:** The testing toolchain, scoped to three named tools.
- **What is approved:** **Vitest** (unit + integration) · **Playwright** (end-to-end) · **`@axe-core/playwright`** (WCAG 2.2 AA assertions). All Tier 1 under AP-12: free, open source, run locally and in CI at no cost.
- **Explicitly excluded — each requiring separate approval:** paid testing platforms · hosted browser testing grids (BrowserStack, Sauce Labs, cloud Playwright grids) · visual-regression SaaS (Percy, Chromatic, Applitools) — all **Tier 3 under AP-12**; and **Testcontainers**, excluded not on cost (it is MIT and free) but on **AP-11**, until the documented trigger is reached: **measured test-isolation contention** — parallel suites conflicting on one database, or tests that cannot run inside a transaction.
- **What this approval does NOT authorize:** Installing any of them. Nothing here authorises framework initialisation · package installation · database provisioning · schema creation · infrastructure provisioning · external service account creation · deployment · commits or pushes.

---

### ADR-026 — Content versioning fields from day one
**Date:** 2026-08-30 · **Status:** PROPOSED
**Context.** Retrofitting versioning is a rewrite (Blueprint §26.4, Mockup §18.3 #4). **Decision.** Carry `version`, `status`, `reviewed_at` on content records and `article_versions` on knowledge articles from the first schema, read by nothing in V1 beyond the displayed version stamp and changelog. **Consequences.** Slightly larger initial model; the changelog page and version-pinned citations become possible without migration. **Approval.** 🟡 Report.

---

### ADR-027 — Externalised UI strings
**Date:** 2026-08-30 · **Status:** PROPOSED
**Context.** MVP Spec §2: externalise strings "not because we localise in V1 — because extracting them later touches every file". **Decision.** No user-visible string literals in components from the first commit. **Consequences.** Minor authoring overhead now; localisation (Bahasa Malaysia is the stated next locale) becomes additive. **Approval.** 🟢

---

### ADR-028 — Phase 1A prototype medium (OPEN)
**Date:** 2026-08-30 · **Status:** **SUPERSEDED** · **Superseded-by:** ADR-036 (2026-08-30)

> **Retained for history.** This record posed the question; the human answered it the same day with an explicit product direction. The reasoning below is preserved because the trade-off it names — that "fixtures" can quietly become production behaviour — remains a live risk under ADR-036 and must be actively managed, not forgotten.

**Context.** MVP Spec §10 Phase 1A calls for a clickable prototype "before any production code", yet week 1 is "design tokens + the five signature components … light + dark", and the exit criteria are user-testing outcomes. This reads coherently either as a design-tool prototype or as a fixture-driven front end in the production stack.

**Decision (open).** The human must choose. **Design tool:** faster to iterate, zero technical debt, but tokens and components are built twice. **Production stack with fixtures:** the five signature components and the token system become real assets that Phase 1B builds on, at the cost of slower visual iteration and a real risk that "fixtures" quietly become production behaviour — which Guardrails §49 explicitly forbids. **Hybrid:** design in a tool, build only the token set and the five components in code.

**Consequences.** This changes 5–7 weeks of work and determines whether ADR-002/ADR-003 must be approved *before* Phase 1A or only before Phase 1B.

**Outcome.** Resolved by human direction on 2026-08-30 in favour of the production-stack option, scoped as a vertical slice. See **ADR-036**. `OQ-1` is closed.

---

### ADR-029 — Environments and migration strategy
**Date:** 2026-08-30 · **Status:** APPROVED (policy only) — 2026-08-30 

**Context.** Payments, transactional email and credential issuance cannot be safely exercised against production. Issued credentials are permanent public artefacts; a test issuance in production is not reversible in the way a test row is.

**Decision.** Three environments — development (local), staging (production-shaped, with provider test modes), production. Migrations are forward-only in production, reviewed by a human before application, and never carry seed data. Destructive migrations are a RED gate under `CLAUDE.md` Rule 1.

**Consequences.** A second database and a second set of provider credentials. Justified specifically by the irreversibility of issuance and payment.

**Approval.** 🔴 Required (infrastructure).


**Approval record.**
- **Approved:** 2026-08-30, by the project owner.
- **Approval scope:** Environment strategy and migration **policy** only.
- **What is approved:** That there will be three environments — development, staging, production — with staging justified by the irreversibility of credential issuance and email dispatch; and that migrations are forward-only in production, human-reviewed, applied deliberately rather than automatically on deploy, and carry no seed data.
- **What this approval does NOT authorize:** **Provisioning any environment.** No hosting, database instance or deployment target is authorised. This approves the policy that will govern them when they exist. Nothing here authorises framework initialisation · package installation · database provisioning · schema creation · infrastructure provisioning · external service account creation · deployment · commits or pushes.

---

### ADR-030 — Secret management
**Date:** 2026-08-30 · **Status:** APPROVED (principles only) — 2026-08-30 
**Context.** The repository's `.gitignore` already excludes `.env` and permits `.env.example`. Secrets will include auth, payments, email, storage, AI and analytics credentials. **Decision.** Secrets live only in the hosting platform's secret store and in local `.env` files that are never committed; `.env.example` documents names, never values; rotation is possible without a code change; no secret is ever logged or included in an error report. **Consequences.** Error-tracker configuration must scrub headers and payloads. **Approval.** 🟡 Report.


**Approval record.**
- **Approved:** 2026-08-30, by the project owner.
- **Approval scope:** Secret management **principles** only.
- **What is approved:** That secrets live only in a per-environment secret store and in uncommitted local files; `.env.example` documents names and never values; rotation is possible without a code change; no secret appears in logs, error reports, analytics payloads or client bundles; production credentials never exist in development.
- **What this approval does NOT authorize:** **Any specific secret-management product or platform.** The store will be whichever the approved hosting platform provides, or a separately approved product. Nothing here authorises framework initialisation · package installation · database provisioning · schema creation · infrastructure provisioning · external service account creation · deployment · commits or pushes.

---

### ADR-031 — Backup and recovery
**Date:** 2026-08-30 · **Status:** APPROVED (principles only) — 2026-08-30 
**Context.** A single Postgres instance holds every credential, evaluation and audit record; object storage holds the evidence itself. **Decision.** Managed automated backups with point-in-time recovery; object-store versioning enabled for artifact and evidence-pack buckets; **a documented and actually rehearsed restore**, because an untested backup is an assumption. RPO and RTO targets are an open question (OQ-10). **Consequences.** Cost is modest; the rehearsal is the real work. **Approval.** 🔴 Required (infrastructure and cost).


**Approval record.**
- **Approved:** 2026-08-30, by the project owner.
- **Approval scope:** Backup and recovery **principles**, including restore validation.
- **What is approved:** That the system must have: automated backups with point-in-time recovery · object-store versioning on evidence and artifact buckets · a **restore that is actually performed and documented**, not assumed · a defined reconciliation procedure for divergence between the database and object storage.
- **What this approval does NOT authorize:** **Any specific backup product, provider or region.** Backup location is part of the data-residency question (ADR-032 input #7) and remains open. RPO/RTO targets (OQ-10) remain open. Nothing here authorises framework initialisation · package installation · database provisioning · schema creation · infrastructure provisioning · external service account creation · deployment · commits or pushes.

---

### ADR-032 — Data residency and region selection (OPEN)
**Date:** 2026-08-30 · **Status:** PENDING HUMAN APPROVAL · **Scope clarified 2026-08-30 on human instruction**

**Context.** Blueprint §26.5 names PDPA (Malaysia) and GDPR alignment as a baseline and "regional data residency for enterprise". Beyond that, the specifications say nothing about where data must physically reside.

**Explicit correction.** An earlier draft framed this as "determine whether **Malaysian** residency is required", which imported an assumption from the owner's location and the primary market. **That inference is withdrawn.** No residency requirement is assumed in either direction: not Malaysia-only, and not unconstrained. The requirement is whatever independent verification establishes.

**Decision.** Open. Nothing may be provisioned in any region until the seven inputs below have been verified and classified.

**Seven inputs requiring independent verification.**

| # | Input | What must be established | Classification |
|---|---|---|---|
| 1 | **Malaysian PDPA obligations** | Whether the Act, as currently amended, imposes any localisation or cross-border transfer restriction on this data, and what notice/consent is required for transfers | **Legal/regulatory** — requires legal advice, not AI reading |
| 2 | **Customer geography** | Where paying customers and their employees actually are. A Malaysian-led business may sell regionally from day one | **Contractual/customer** |
| 3 | **International learner requirements** | Whether learners outside Malaysia bring their own regime (GDPR for EU residents most obviously) and what that implies for lawful basis and transfer | **Legal/regulatory** |
| 4 | **HRD Corp / e-TRIS requirements** | Whether the scheme imposes any storage, retention or accessibility condition on claim evidence | **Legal/regulatory** where mandated by the scheme; **contractual** where imposed by the employer |
| 5 | **Payment provider data handling** | Where the processor stores cardholder and customer data, and what the merchant agreement commits us to | **Contractual** + **regulatory** (PCI) |
| 6 | **Third-party processor locations** | Where auth, email, object storage, AI, error tracking and analytics actually process and store data — each is an independent transfer | **Contractual**, with regulatory consequences |
| 7 | **Backup and disaster-recovery locations** | Where backups and replicas reside. **A backup in another jurisdiction is a transfer**, and is routinely overlooked | **Legal/regulatory** + **risk management** |

**Classification the answers must carry.** Each finding must be recorded as one of:
- **Legal/regulatory requirement** — non-negotiable; verified with legal counsel.
- **Contractual/customer requirement** — negotiable in principle, binding once signed; may be a sales prerequisite rather than a law.
- **Recommended risk-management practice** — neither legally nor contractually required, adopted because the risk/benefit favours it.

**Consequences.** Constrains ADR-005a (database host), ADR-008 (object storage), ADR-016 (hosting) and ADR-031 (backup location). These four should be decided together, after this record is answered.

**Sequencing rule — recorded on human instruction, 2026-08-30.**

> **Data residency must be resolved before provisioning production infrastructure containing persistent production or customer data.**

Residency does **not** automatically block:

| Not blocked | Condition |
|---|---|
| Architecture design | — |
| Documentation | — |
| **Local development** | No real customer or production data is processed inappropriately |
| **Local testing** | Synthetic fixtures only |
| **Automated testing** | Test databases are ephemeral and synthetic; never a copy of production |
| **Non-production prototypes** | Clearly non-production; no real customer data |

Residency **does** block:

| Blocked until residency is verified |
|---|
| Provisioning production hosting |
| Provisioning any persistent production database |
| Provisioning production object storage |
| **Provisioning production backup or disaster-recovery storage** — a backup is a transfer (input #7) |
| Configuring production external services that will process real customer data |
| Any production deployment |

**The governing condition throughout is the data, not the environment label.** A "local" environment holding a real cohort roster is production data by any regulator's reading; a staging environment holding only synthetic fixtures is not. **`[INFERENCE]`** If real customer data is ever needed outside production — for support or debugging — that is itself a residency and privacy decision, not an exemption from one.

**What this does not block.** Under ADR-039, the *domain* decision is separable from residency and from foundational architecture. Residency constrains **where production data lives**, not **what is designed or built locally**.

**Approval.** 🔴 Required. **No production hosting, database, storage, backup or region decision may be marked approved until items 1–7 are verified and classified.** The sequencing rule above is approved as of 2026-08-30; the residency answer itself remains open.

---

### ADR-033 — Evidence pack generation
**Date:** 2026-08-30 · **Status:** PROPOSED
**Context.** The HRD Corp pack is "templating plus a zip — low build cost, disproportionate commercial value", assembled from attendance registers, participant list, trainer profile, course outline, learning outcomes, certificates and evaluation summary. The reference material confirms these documents exist today in exactly this shape. **Decision.** Generate asynchronously as a `jobs` entry; store the resulting bundle in object storage with a database record capturing what was included and when; make it re-downloadable and reproducible for audit. **Consequences.** Avoids request-duration limits, and gives the claim an auditable provenance record rather than an ephemeral download. **Approval.** 🟡 Report.

---

### ADR-034 — Notifications scope for V1
**Date:** 2026-08-30 · **Status:** PROPOSED
**Context.** The notifications centre is explicitly deferred; transactional email is explicitly required. **Decision.** Transactional email only, dispatched via the `jobs` table, with templates externalised alongside UI strings. **Consequences.** Assessor assignment and decision notices are SLA-critical and must be monitored. In-app, push and Slack/Teams remain Phase 2. **Approval.** 🟡 Report.

---

### ADR-035 — Analytics privacy constraints
**Date:** 2026-08-30 · **Status:** APPROVED — 2026-08-30 
**Context.** Assessment content leakage destroys the item bank (Blueprint App. B); candidate artifacts are the candidate's own professional work; assessor reasoning is confidential until released. **Decision.** No session replay, DOM capture, or content-bearing event payloads on assessment, artifact workspace, or evaluation screens. Funnel analytics record **events, not content**. **Consequences.** Constrains the analytics product choice in ADR-017. **Approval.** 🟡 Report.


**Approval record.**
- **Approved:** 2026-08-30, by the project owner.
- **Approval scope:** Analytics privacy **principle**.
- **What is approved:** That no session replay, DOM capture or content-bearing event payload may be collected on assessment, artifact workspace or evaluation screens. Funnel analytics record events, not content.
- **What this approval does NOT authorize:** Any analytics vendor. This principle now **constrains** the Group 5 analytics selection: a product that cannot be configured to honour it is disqualified. Nothing here authorises framework initialisation · package installation · database provisioning · schema creation · infrastructure provisioning · external service account creation · deployment · commits or pushes.

---

### ADR-036 — Track B: the technical vertical slice
**Date:** 2026-08-30 · **Status:** APPROVED (direction only) — 2026-08-30 · **Supersedes:** ADR-028 · **Scoped by:** ADR-040

**Context.** ADR-028 recorded a genuine ambiguity: MVP Spec §10 calls for a clickable prototype "before any production code", while also requiring design tokens and five signature components first. On 2026-08-30 the human resolved it with an explicit product direction, which under `CLAUDE.md` is authority level 1:

> *"Phase 1A should be a real production-grade vertical slice built using the approved production architecture, rather than a disconnected design-only prototype. The purpose of Phase 1A is to validate the actual architecture with the smallest meaningful end-to-end workflow."*

**Decision / recommendation.** Phase 1A builds the **smallest meaningful end-to-end workflow on the approved production architecture** — real authentication, real authorisation, real database persistence, real deployment — rather than a fixture-driven or design-tool artefact. The indicative slice:

```
authentication → authorised access → dashboard → browse/select training
   → enrolment → access a real lesson → progress persistence
   → SERVICE RESTART RESILIENCE VERIFIED
```

**What this changes.**

1. **Approval sequencing.** Under ADR-028's design-tool reading, the foundational technology decisions could wait for Phase 1B. They now cannot: ADR-001 to ADR-008, ADR-020, ADR-029 and ADR-025/038 are all required **before Phase 1A begins**.
2. **The final step is the point.** "Service restart resilience" is not a closing checklist item — it is the specific thing this slice exists to prove, and it is what makes `CLAUDE.md` Rule 6 and the Service Restart Test executable rather than asserted (`TESTING_ARCHITECTURE.md` §6).
3. **Scope discipline becomes the main risk.** A vertical slice that grows sideways stops being a slice. The workflow above is the boundary; anything not on that line is out of Phase 1A.

**Alternatives considered.** (a) *Design-tool prototype* — faster visual iteration, zero technical debt, but validates nothing about the architecture and builds tokens and components twice. (b) *Fixture-driven front end in the production stack* — looks similar from outside but proves nothing about persistence, authorisation or restart behaviour, and carries the specific hazard ADR-028 named: fixtures quietly becoming production behaviour, which Guardrails §49 forbids. (c) *The chosen direction* — slower to a demo, but the only option that returns evidence about the architecture.

**Consequences.**

- **Positive.** Architectural risk is discovered at week 5, not week 15. The five signature components and the token system become real assets Phase 1B builds on. The Service Restart Test is proven rather than promised.
- **Cost.** Real infrastructure must be provisioned earlier, so ADR-005a, ADR-008, ADR-016 and — critically — **ADR-032 (data residency)** must be answered sooner. Provisioning in the wrong region and moving later is expensive.
- **Resolved tension (was OQ-20).** MVP Spec §10's Phase 1A exit criteria are *user-reaction* criteria over `P06`, `K06`, `K08` and `P16` — the four screens the specification says carry the entire argument — and this slice exercises none of them. **This is now settled by ADR-040: Track A (product experience validation) and Track B (this slice) run as parallel objectives, and neither replaces the other.** This record covers Track B only.
- **Mock discipline.** Anything stubbed inside the slice must be visibly and structurally identified as temporary, per Guardrails §49. Payment, if touched at all, is the obvious candidate.

**Approval.** 🔴 Required before implementation. The direction is recorded; **execution is not authorised** by this record.


**Approval record.**
- **Approved:** 2026-08-30, by the project owner.
- **Approval scope:** **Track B direction**, not execution.
- **What is approved:** That Track B is a production-grade vertical slice on the approved architecture — authentication → authorization → dashboard → training discovery/selection → enrolment → real lesson → progress persistence → **verified restart resilience** → **appropriate automated testing** — rather than a fixture-driven or design-tool artefact.
- **What this approval does NOT authorize:** **Beginning the slice.** Track B cannot start until its blocking decisions are resolved (see the Approval Package). AP-07 applies throughout: anything stubbed inside the slice must be visibly identified as temporary and structurally isolated. Nothing here authorises framework initialisation · package installation · database provisioning · schema creation · infrastructure provisioning · external service account creation · deployment · commits or pushes.

---

### ADR-037 — Architecture Stability Principle
**Date:** 2026-08-30 · **Status:** APPROVED — 2026-08-30 

**Context.** Human instruction of 2026-08-30. The project is a long-lived asset built with AI assistance, and AI assistance has a specific failure mode: proposing replacement of working architecture because a newer or more fashionable option exists. `CLAUDE.md` already prefers "existing architecture over novelty"; this record makes the test explicit and reviewable.

**Decision.** Adopt the Architecture Stability Principle, documented in full in `README.md` §9. In summary: an approved and implemented architectural boundary is not replaced merely because an alternative becomes available. Any proposed change must answer nine questions — what the current architecture fails to solve; why it cannot reasonably be solved within it; alternatives; migration complexity and cost; functionality affected; data migration implications; operational risk; rollback approach; and why the benefit justifies the disruption.

> **Stability and maintainability are preferred over unnecessary architectural novelty.**

**Alternatives.** Ad-hoc adoption as options appear (accumulates half-migrations, which are worse than either endpoint); scheduled re-platforming (solves a problem this project does not have).

**Consequences.** A proposal that cannot answer question 1 — *what does the existing architecture fail to solve* — is closed without further analysis. This is deliberately a high bar. It applies to the AI first and foremost. It does **not** apply to security patches, version upgrades within an approved technology, or reversing a decision that has not yet been implemented.

**Approval.** 🟡 Governance principle; confirm to activate.


**Approval record.**
- **Approved:** 2026-08-30, by the project owner.
- **Approval scope:** Governance principle, approved as part of the principles set (ADR-041).
- **What is approved:** AP-10 Architecture Stability, including the nine questions and the gate on question 1.
- **What this approval does NOT authorize:** Nothing requires authorising; this principle constrains future change rather than enabling work. Nothing here authorises framework initialisation · package installation · database provisioning · schema creation · infrastructure provisioning · external service account creation · deployment · commits or pushes.

---

### ADR-038 — Testing philosophy and required layers
**Date:** 2026-08-30 · **Status:** APPROVED — 2026-08-30 

**Context.** No authoritative specification describes testing, while `CLAUDE.md` Rule 7 forbids claiming completion without validation. Human instruction of 2026-08-30 directs that the philosophy be documented and that framework selection stay closed.

**Decision.** Adopt the philosophy in `TESTING_ARCHITECTURE.md`:

- **Five required layers** — unit, integration, end-to-end, critical business workflow, and regression for resolved defects.
- **Risk-based and proportionate** — four tiers, with Tier 1 (money, credentials, assessment integrity, access control, irreversible actions, published SLA) receiving unit + integration + end-to-end plus explicit negative cases, and Tier 4 (presentation) receiving component and accessibility checks only.
- **A named Tier 1 critical-workflow set** — the nine workflows in the human's direction, plus two recommended additions: *artifact submission and assessor evaluation* (this is the product, and it carries G1, the decisive business metric) and *evidence pack generation* (its output goes to a funding authority).
- **The governing principle:** *A feature is not considered complete merely because it renders successfully. Completion requires validation appropriate to the feature's business and technical risk.*

**Why the integration layer is called out specifically.** Several of this project's non-negotiables — assessment content unreadable **at the query layer**, append-only writes, audit rows written in the same transaction, tenancy isolation, assessor conflict of interest — cannot be verified by unit tests (no database) or by end-to-end tests (they assert what a user sees, not what a query can reach). They are integration-layer assertions or they are unverified.

**Alternatives.** A coverage-percentage target (invites gaming and pushes effort toward cheap Tier 4 tests); end-to-end only (too slow, too coarse, and silent on the rules above); no formal policy (violates Rule 7).

**Consequences.** Definition of Done becomes enforceable. Completion reports must distinguish **Implemented · Tested · Partially tested · Blocked · Requires human validation**. Combined with ADR-036, tooling (ADR-025) is now needed before Phase 1A rather than before Phase 1B.

**Approval.** 🔴 Required.


**Approval record.**
- **Approved:** 2026-08-30, by the project owner.
- **Approval scope:** Testing **philosophy and required layers**.
- **What is approved:** Five required layers (unit, integration, end-to-end, critical business workflow, regression for resolved defects); risk-based proportionality across four tiers; the named Tier 1 critical-workflow set; and the governing principle that *a feature is not complete merely because it renders successfully*.
- **What this approval does NOT authorize:** **Any testing framework or library.** ADR-025 remains PENDING and is a blocking decision for Track B, whose final step is automated testing. Nothing here authorises framework initialisation · package installation · database provisioning · schema creation · infrastructure provisioning · external service account creation · deployment · commits or pushes.

---

### ADR-039 — Permanent credential identity, and verification URL strategy
**Date:** 2026-08-30 · **Status:** APPROVED — 2026-08-30 · **Refines:** ADR-018

**Context.** An earlier position in these documents stated that verification URLs "can never change" and treated domain selection as an immutable architectural commitment blocking foundational work. On human instruction of 2026-08-30 that framing is corrected: it conflated two different things, and it made a product decision into an architectural blocker it need not be.

**Decision.** Separate the two concerns explicitly.

**1. Permanent credential identity — an architectural requirement.**
Every issued credential carries a **globally unique, persistent identifier** that:
- is generated at issuance and **never changes for the life of the credential**, including through renewal, correction, suspension or revocation;
- is independent of any URL, domain, hosting arrangement or presentation format;
- is what the badge metadata, the PDF certificate, any future signed representation and any external reference actually key on;
- is unguessable enough that holders cannot be enumerated, while remaining suitable for printing and manual entry.

This is the property that makes a credential portable. It is non-negotiable and is a design constraint on the credential model.

**2. Verification URL strategy — a product decision with an engineered migration path.**
- The domain should be chosen **deliberately and early**, because it appears on certificates, badges, shared links and external documents, and a change is disruptive and reputationally awkward on a trust product.
- However, **the architecture must not assume the domain can never change.** Businesses rebrand, merge, and lose or change domains. Assuming otherwise builds a fragility rather than removing one.
- Therefore the system supports: a canonical identifier-based verification route; permanent redirects from any retired domain or path to the current canonical one; and the ability to serve verification from more than one hostname during a transition.

**Consequences.**
- **Domain selection no longer blocks foundational architecture.** It remains an important and early product decision, and it *does* block the first real credential issuance — but it does not block ADR-001 to ADR-008, ADR-020 or the Track B slice.
- Verification routing must key on the identifier, not on a path shape that embeds branding.
- A retired domain must be **retained and redirecting**, not released — a lapsed domain serving someone else's content beneath issued credentials is the genuine risk here, and it is an operational obligation rather than an architectural one.
- Honest public claims still apply: the promise is that a credential remains verifiable, not that a specific string of characters is eternal.

**Alternatives considered.** (a) *Treat the URL as immutable* — the earlier position; it overstates what is achievable, blocks foundational work unnecessarily, and still fails if a domain is lost. (b) *No stable identifier, URL only* — the credential then cannot survive any change of presentation, which defeats portability. (c) *A third-party persistent identifier scheme* — worth considering later alongside cryptographic verifiability; unnecessary complexity for V1.

**Approval.** 🟡 Confirm. The identifier requirement is architectural; the domain choice returns to Group 6 as a product decision.


**Approval record.**
- **Approved:** 2026-08-30, by the project owner.
- **Approval scope:** Architectural requirement — permanent credential identity.
- **What is approved:** That every issued credential carries a globally unique, persistent identifier that never changes for the life of the credential, independent of URL, domain, hosting arrangement or presentation format; and that verification routing keys on that identifier, with redirect-based migration supported if a domain ever changes.
- **What this approval does NOT authorize:** Domain selection, which returns to Group 6 as a product decision. Implementation of the credential model. Nothing here authorises framework initialisation · package installation · database provisioning · schema creation · infrastructure provisioning · external service account creation · deployment · commits or pushes.

---

### ADR-040 — Phase 1 dual-track validation model
**Date:** 2026-08-30 · **Status:** APPROVED — 2026-08-30 · **Scopes:** ADR-036

**Context.** ADR-036 introduced a production-grade technical vertical slice. ADR-028's superseded reading had Phase 1A as a product-experience prototype. OQ-20 asked whether the MVP Spec §10 exit criteria were being deferred, replaced or run separately. Human direction of 2026-08-30 answers it: **they are two objectives, not two options.**

**Decision.** Phase 1 runs **two tracks in parallel**, each with its own purpose, artefacts and exit criteria. Neither substitutes for the other, and progress on one is never reported as progress on the other.

#### Track A — Product Experience Validation
**Validates:** whether users understand, value, and can successfully navigate the key product proposition and the critical user experiences defined in the authoritative specifications.
**Preserves:** the validation intent and critical screens of MVP Spec §7 and §10 — in particular `P06` (the gap report), `K06` (the artifact workspace), `K08` (result and feedback) and `P16` (public verification), which the specification identifies as carrying the entire argument.
**Exit criteria (from MVP Spec §10, unchanged):** strangers articulate the difference from a course marketplace unprompted · target-persona learners say the gap report told them something they did not know · a corporate buyer asks what it costs · the owner is willing to be judged on `K06`.
**The risk it addresses:** *building something nobody wants, or that nobody understands.* No amount of architectural correctness answers this.

#### Track B — Technical Vertical Slice
**Validates:** the production architecture, through the smallest meaningful real end-to-end workflow (ADR-036).
**Workflow:** authentication → authorization → dashboard → training discovery or selection → enrolment → access to a real lesson → progress persistence → **service restart resilience** → **appropriate automated testing**.
**The risk it addresses:** *building it on foundations that do not hold.* No amount of user enthusiasm answers this.

**Why both are required.** These are the two independent ways this project fails, and they fail invisibly to each other. A beautiful prototype validated by delighted users tells you nothing about whether exam responses survive a restart. A flawless vertical slice tells you nothing about whether anyone will submit an artifact — and MVP Spec §12.1 names artifact submission rate as *the single most important number in the business*.

**Explicit prohibition.** Neither track may be presented as satisfying the other's exit criteria. A completion report must state each track's status separately.

**Consequences.**
- Track B pulls the foundational, quality and implementation decisions forward, since it runs on real infrastructure.
- Track A can begin **immediately**, in parallel, because it does not depend on any pending technology decision.
- Sequencing, resourcing and whether the tracks share a design-token and component foundation is a planning decision that follows approval — deliberately not pre-empted here.
- The specification's real critical path is unchanged and unaffected by either track: the skill list, diagnostic questions, item bank, brief and variants, the rubric and the three exemplars are expert authoring work that must run in parallel with both.

**Alternatives considered.** (a) *Track B only* — silently discards the MVP Spec's validation intent and the four screens that carry the argument; this is precisely what the human direction rejects. (b) *Track A only* — the superseded ADR-028 position; leaves architectural risk undiscovered until week 15. (c) *Sequential, A then B* — defensible, but delays architectural evidence and is a scheduling choice rather than a validation-model choice.

**Approval.** 🔴 Required. **This record approves the model, not the execution of either track.**


**Approval record.**
- **Approved:** 2026-08-30, by the project owner.
- **Approval scope:** The Phase 1 **validation model**.
- **What is approved:** That Phase 1 runs Track A (product experience validation, preserving the MVP Spec §10 exit criteria and the `P06`/`K06`/`K08`/`P16` critical screens) and Track B (technical vertical slice) as parallel objectives, and that **neither may be reported as satisfying the other's criteria**.
- **What this approval does NOT authorize:** Execution of either track. Track A blocks on nothing and may begin at the owner's discretion; Track B blocks on the decisions listed in the Approval Package. Nothing here authorises framework initialisation · package installation · database provisioning · schema creation · infrastructure provisioning · external service account creation · deployment · commits or pushes.

---

### ADR-041 — Adopt the architecture principles set
**Date:** 2026-08-30 · **Status:** APPROVED — 2026-08-30 

**Context.** Human instruction of 2026-08-30. Until now, durable architectural intent was implicit — distributed across individual ADRs, each of which is tied to a specific technology or moment. That makes intent hard to apply to a decision nobody anticipated, and easy to lose when a technology changes.

**Decision.** Adopt `ARCHITECTURE_PRINCIPLES.md` — **AP-01 to AP-10** — as the durable, technology-independent principles of this project:

| ID | Principle |
|---|---|
| AP-01 | Modular Monolith First |
| AP-02 | Backend and Persistent Storage as Source of Truth |
| AP-03 | Stateless Application Services Where Practical |
| AP-04 | Explicit Authorization Boundaries |
| AP-05 | Persistent Business and Workflow State |
| AP-06 | Smallest Necessary Change |
| AP-07 | No Hidden Mock, Placeholder, or Simulated Production Logic |
| AP-08 | Auditability for Critical Business Actions |
| AP-09 | Significant Architecture Decisions Must Be Persistently Documented |
| AP-10 | Architecture Stability |

**Consequences.**
- Principles outrank ADRs on intent. A decision that conflicts with a principle is a defect unless the principle is explicitly amended through the same governance path.
- Principles are technology-independent by construction, so replacing a framework or vendor does not invalidate them.
- **Identifier collision handled explicitly:** `ARCHITECTURE_OVERVIEW.md` §2.1 previously used `AP-1`…`AP-10` for a different, MVP-specific list. That list is renumbered `AS-1`…`AS-8` ("architectural stances") and now defers to this document. The renumbering is recorded rather than silently applied, per AP-09.
- AP-10 is the enforcement mechanism for the rest: it is what prevents a future session from replacing a principle-derived boundary on preference alone.

**Alternatives considered.** (a) *No formal principles* — leaves intent implicit and unenforceable against an unanticipated decision. (b) *Principles embedded only in ADRs* — the current state; couples durable intent to disposable technology choices. (c) *Adopt an external framework's principles wholesale* — generic, unowned, and not grounded in this product's actual failure modes.

**Approval.** 🔴 Required.

**Approval record.**
- **Approved:** 2026-08-30, by the project owner.
- **Approval scope:** Adoption of the architecture principles set.
- **What is approved:** **AP-01 through AP-11** in `ARCHITECTURE_PRINCIPLES.md` as the project's durable, technology-independent principles — including **AP-11 Simplicity Before Scale**, added on human instruction of 2026-08-30. Principles outrank ADRs on intent; a decision conflicting with a principle is a defect unless the principle is explicitly amended.
- **What this approval does NOT authorize:** Any implementation. Principles constrain how work is done; they never authorise doing it. Nothing here authorises framework initialisation · package installation · database provisioning · schema creation · infrastructure provisioning · external service account creation · deployment · commits or pushes.

---

### ADR-042 — AP-12 Zero-Cost Development and Free-First Technology
**Date:** 2026-08-30 · **Status:** APPROVED — 2026-08-30 · **Extends:** ADR-041

**Context.** ADR-041 approved AP-01…AP-10 (and AP-11) on 2026-08-30. Later the same day the project owner issued a twelfth principle in binding language, establishing that the project must be buildable, testable and validatable without mandatory technology spend.

**`[NOTE ON STATUS]`** This record is marked APPROVED because AP-12 was **issued as a direction by the project owner**, written as binding instruction rather than as a proposal for evaluation — which under `CLAUDE.md` is authority level 1. **If it was intended as a proposal for review rather than a direction, say so and this record moves to PENDING HUMAN APPROVAL.** It is flagged rather than assumed, per AP-09.

**Decision.** Adopt **AP-12** as documented in `ARCHITECTURE_PRINCIPLES.md`: the three-tier preference order (free/open-source/self-hostable → genuine free tier → paid, requiring approval), the mandatory free-alternative analysis, the local-first development baseline, the lock-in evaluation, the prohibition on paid convenience dependencies, the complexity counterweight, and the mandatory twelve-row technology cost assessment on every future recommendation.

**Immediate effects on decisions already recorded.**

| Decision | Effect |
|---|---|
| **Decision B — authentication** | **Materially changed.** Better Auth is Tier 1 (MIT, self-hosted, zero cost). Clerk is Tier 2 at best and Tier 3 for enterprise SSO. AP-12's "no paid convenience dependency" clause directly addresses Clerk's principal advantage. See `TECHNOLOGY_DECISION_PACKAGE_PHASE_1.md` §AP-12 re-assessment |
| **ADR-016 — hosting** | **Materially changed.** `[FACT verified 2026-08-30]` Vercel's Hobby plan "restricts users to non-commercial, personal use only". A paid credential product does not qualify, so Vercel is **Tier 3 from launch**, not a free option that later becomes paid |
| **ADR-015 — email** | Changed in emphasis: `[FACT]` Resend's free tier is 3,000 emails/month (100/day, 3 domains); Postmark's is 100 emails/month, perpetual, **no credit card**. Resend's free allowance is ~30× larger |
| **ADR-005a — database host** | Reinforced: local PostgreSQL for development needs no managed host at all, which AP-12 and the ADR-032 sequencing rule both favour |
| **ADR-017 — observability** | Constrained: self-hostable and free-tier options must be evaluated before any paid analytics or monitoring product |
| **ADR-009, ADR-013, ADR-014** | Video, AI and payments are **production consumption costs**, explicitly separated from development cost and not to be introduced prematurely |
| **Decisions A, C, D** | **Unchanged** — Prisma/Drizzle, Vitest/Playwright/axe-core and Docker Compose are already Tier 1, free, open source and local |

**Consequences.**
- Every future technology recommendation carries the twelve-row cost assessment. Recommendations lacking it are incomplete.
- "Free tier" claims must be verified for **commercial-use permission**, expiry, credit-card requirement and exit path — not accepted on the word "free".
- **AP-12 does not override `[SPEC]` "do not build auth".** Where the only zero-cost option would be to build something the project has no business building, that is a Tier 3 conversation, not a licence to build it. The complexity counterweight in AP-12 says this explicitly.
- Development cost and production cost are assessed separately; production costs return when usage or revenue justifies them.

**Alternatives considered.** (a) *Case-by-case cost judgement* — the current state; it permits exactly the incremental convenience purchases AP-12 exists to prevent. (b) *A budget threshold below which spending is automatic* — simpler, but it makes the default "spend a little", and small recurring costs are the ones that accumulate unexamined.

**Approval record.**
- **Approved:** 2026-08-30, by the project owner, as a direction.
- **Approval scope:** AP-12 as a binding architectural principle governing all technology and vendor selection.
- **What is approved:** The principle, the three tiers, the mandatory free-alternative analysis, the local-first baseline, the lock-in evaluation, the no-paid-convenience rule, the complexity counterweight, and the mandatory cost-assessment table.
- **What this approval does NOT authorize:** Any technology selection or implementation. AP-12 constrains *how* technologies are chosen; it selects none. Nothing here authorises framework initialisation · package installation · database provisioning · schema creation · infrastructure provisioning · external service account creation · deployment · commits or pushes.
