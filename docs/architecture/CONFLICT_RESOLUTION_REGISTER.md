# Conflict Resolution Register

> **Status: DRAFT — PENDING HUMAN APPROVAL**
> **Created:** 2026-08-30 · **Version:** 0.1
> **No conflict below is resolved.** Each carries a *recommended* resolution awaiting explicit human confirmation.

---

## 1. The authority basis — and its limit

Ten substantive conflicts exist between `DATA_AI_ACADEMY_PORTAL_BLUEPRINT.md` and `DATA_AI_ACADEMY_MVP_BUILD_SPEC.md`. In each case the recommendation follows the MVP Build Spec, on this basis:

- The MVP Build Spec declares itself *"Scope contract. Binding."* and states it **supersedes for build purposes** the scope sections of the Blueprint (§19–21) and the Mockup Specification (§13–14).
- The Blueprint remains authoritative for **vision, architecture direction and design language**.
- `CLAUDE.md` places both at authority level 2, resolved by explicit current human instruction at level 1.

> **This is an interpretation of the documentation hierarchy, not a decision you have made.**
> Every recommendation in this register is **subject to your confirmation**. Where you disagree, your instruction overrides the hierarchy and the relevant ADR must be updated, not quietly reinterpreted.

Two further cautions worth stating:

1. **The Blueprint is not wrong — it is later.** In most of these conflicts the Blueprint describes the correct Phase 2 destination. The recommendation is about *sequence*, not correctness, and the register records the destination so it is not lost.
2. **Two conflicts are not merely scope.** CONF-2 (assessment timers in cache) and CONF-5 (claiming OB 3.0) would, if resolved the Blueprint's way, put the build in conflict with `CLAUDE.md` Rule 6 and with the specifications' own honesty requirement respectively. These are flagged in the register.

---

## 2. Register

| Conflict ID | Blueprint Position | MVP Spec Position | Recommended Resolution | Reason | Approval Required |
|---|---|---|---|---|---|
| **CONF-1** | Redis + a durable job queue for background work (§26.2) | A `jobs` table + a scheduled route. **Not a queue service.** "Only three jobs exist" (§9) | **Follow MVP Spec.** `jobs` table in PostgreSQL; revisit a queue when volume, fan-out or latency demands it | Three jobs do not justify a new infrastructure component, a second failure domain and a second store of state. Job rows in Postgres also survive restart by construction | 🟡 Confirm — ADR-010 |
| **CONF-2** | Redis holds sessions, rate limits, background jobs **and assessment timers** (§26.2) | No cache service named; no Redis (§9) | **Follow MVP Spec, and explicitly reject cache-held exam timers.** The authoritative clock is a server-side `started_at` in PostgreSQL | ⚠️ Beyond scope: an exam timer in cache **fails the Service Restart Test** and violates `CLAUDE.md` Rule 6. This conflict has a correctness dimension, not only a sequencing one | 🟡 Confirm — ADR-011, ADR-021 |
| **CONF-3** | tRPC or typed REST; GraphQL only for third-party consumers (§26.2) | Server actions + typed route handlers. No separate API service. "tRPC optional, not required" (§9) | **Follow MVP Spec.** Server actions in-app; route handlers for webhooks, scheduled invocation and CSV | A single-consumer application does not need a transport abstraction. The later verification API can be added as route handlers over the same services | 🔴 Yes — ADR-004 |
| **CONF-4** | A managed auth provider supporting OIDC/SAML/SCIM (§26.2) | "Auth.js or Clerk. Do not build auth. SSO comes later via the same provider" (§9) | **Follow MVP Spec**, with one binding constraint: choose a provider whose **later SSO/SCIM path is configuration, not migration** | V1 has no SSO requirement, but the Blueprint's enterprise gate is real. The constraint preserves the destination without paying for it now | 🔴 Yes — ADR-006; interacts with **OQ-7** |
| **CONF-5** | Open Badges 3.0 / W3C Verifiable Credentials as an **MVP, non-negotiable** interoperability standard (§26.3) | `public_uid` + verification page + **OB 2.0** metadata in a PNG; cryptographic VCs deferred to Phase 1C/2 (M7, §13.1) | **Follow MVP Spec.** Ship practical portability now; **publicly claim only what is true** | ⚠️ Beyond scope: the MVP Spec itself warns *"Do not claim OB3.0 conformance before it is true; on a trust product that is the one lie you cannot afford."* Resolving toward the Blueprint without the implementation would create exactly that exposure | 🟡 Confirm — ADR-018 |
| **CONF-6** | Third-party proctoring integration; "never build proctoring" (§26.2, §13.5) | **No proctoring vendor.** Honour undertaking + time limit + randomised order + in-room invigilation for cohorts (M5, §13.1) | **Follow MVP Spec.** State the integrity model openly on the credential page | Cost per exam, conversion friction, accessibility hostility and integration burden — for a control that is not the real one. The artifact is. Also removes an entire class of highly sensitive data (recordings, biometrics) from V1 | 🟡 Confirm — ADR-019 |
| **CONF-7** | xAPI emission at MVP; full LRS in Phase 2 (§26.3) | No LRS, no xAPI, no SCORM. An `events` table; emit xAPI-shaped payloads later from the same rows (§13.1) | **Follow MVP Spec**, with the constraint that the `events` table records enough fidelity (actor, action, object, context, timestamp) that xAPI is later a **projection, not a re-instrumentation** | Zero MVP value; the enterprise LMS deals that need it do not exist yet. The constraint keeps the later cost small | 🟡 Confirm — ADR-024 |
| **CONF-8** | Modular monolith **plus three genuinely separate services** from day one — assessment & credentialing, AI, analytics/LRS (§26.1) | One deployable application, one database. "Three folders with clean boundaries… extracting it later is a day's work" (§9) | **Follow MVP Spec**, with the constraint that module boundaries are **enforced, not aspirational** — assessment and credentialing import nothing from marketing or content code | Three services triple deployment, observability and local development cost for a 1–2 person team. The Blueprint's availability argument is weak when both surfaces are one deploy on managed infrastructure. Enforced boundaries preserve the destination | 🔴 Yes — ADR-001 |
| **CONF-9** | Skill graph v1 of **40–60 nodes** (Appendix C item 3; Mockup §20.3 #5) | **~35 skills**, flat, grouped by area (M2) | **Follow MVP Spec.** Low architectural impact | A content and authoring decision, not an architectural one — the model is identical at either count. Flagged only for completeness and because skill authoring is on the real critical path | 🟢 Note only |
| **CONF-10** | Postgres FTS **+ pgvector hybrid** search, escalating to OpenSearch/Typesense at scale (§26.2) | Postgres full-text search; "OpenSearch would be absurd" at ~30 articles (§9) | **Not a true conflict — follow MVP Spec.** pgvector is present for the tutor regardless, so hybrid search is an available enhancement requiring **no new dependency** | The two positions are compatible; the Blueprint describes a later optimisation of the same components | 🟢 Note only |

---

## 3. Summary by disposition

| Disposition | Conflicts | Meaning |
|---|---|---|
| **Sequencing only** — Blueprint is the correct destination, MVP Spec is the correct starting point | CONF-1, CONF-3, CONF-4, CONF-7, CONF-8 | Recommendation preserves the destination via an explicit constraint |
| **Sequencing + a correctness or honesty dimension** | CONF-2, CONF-5 | Resolving toward the Blueprint without the full implementation would breach a guardrail or a public claim |
| **Stance, not schedule** | CONF-6 | The MVP Spec makes a reasoned argument that the Blueprint's control is not the real one |
| **Not architectural / not a real conflict** | CONF-9, CONF-10 | Recorded for completeness |

---

## 4. What happens on confirmation

For each conflict you confirm:

1. The corresponding ADR status moves from `PENDING HUMAN APPROVAL` / `PROPOSED` to `APPROVED`, dated and citing your instruction.
2. This register records the confirmation and the date.
3. The Blueprint position is **retained here as the recorded future destination** — it is never deleted, because a Phase 2 conversation will need to know it was considered and deferred deliberately, not overlooked.

For any conflict you resolve **against** the recommendation, your instruction is authority level 1 and overrides the hierarchy. A new ADR is created, the affected ADR is marked `SUPERSEDED` with a `Superseded-by` reference, and every affected architecture document is updated.
