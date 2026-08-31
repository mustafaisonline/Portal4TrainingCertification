# Deployment Architecture

> **Status: DRAFT — environment and backup *policy* approved (ADR-029, ADR-031, 2026-08-30); no vendor, provider, region or infrastructure is approved.**
> **Created:** 2026-08-30 · **Version:** 0.1
> **Nothing is provisioned.** No hosting account, database, bucket, domain or pipeline exists or may be created without explicit human approval.

---

## 1. Deployment model at a glance

```
                         ┌──────────────────────────────┐
                         │  CDN / edge cache            │
                         │  static assets · public pages│
                         └──────────────┬───────────────┘
                                        │
                    ┌───────────────────▼────────────────────┐
                    │  APPLICATION (stateless, replaceable)  │
                    │  one Next.js deployable                │
                    │  public surface + authenticated app +  │
                    │  server actions + route handlers       │
                    └───┬──────────────┬──────────────┬──────┘
                        │              │              │
        ┌───────────────▼──┐  ┌────────▼────────┐  ┌──▼───────────────────┐
        │ PostgreSQL       │  │ Object storage  │  │ External services    │
        │ (+pgvector, FTS) │  │ (S3-compatible) │  │ auth · email ·       │
        │ SOURCE OF TRUTH  │  │ artifacts ·     │  │ payments · video ·   │
        │ backups + PITR   │  │ packs · badges  │  │ AI · errors ·        │
        └──────────────────┘  └─────────────────┘  │ analytics            │
                    ▲                              └──────────────────────┘
                    │
        ┌───────────┴─────────────────────────┐
        │ Scheduled invocation → drains `jobs`│
        │ email · evidence packs · indexing   │
        └─────────────────────────────────────┘
```

**Three persistent services. Everything else is replaceable at any moment.**

---

## 2. Application components

| Component | Deployment | State | Notes |
|---|---|---|---|
| Web application (public + authenticated) | One deployable, horizontally replaceable instances | **None** | ADR-001/ADR-002 |
| Server actions & route handlers | Inside the same deployable | None | Webhooks and job invocation are route handlers |
| Job runner | A scheduled invocation that drains the `jobs` table | State in PostgreSQL | ADR-010; **not** a separate always-on worker in V1 |
| PostgreSQL | Managed service | **Authoritative** | ADR-005; host open (ADR-005a) |
| Object storage | Managed S3-compatible | **Authoritative for files** | ADR-008 |
| CDN / edge | Provided by the hosting platform | Cache only | Public surface and assets |

**`[INFERENCE]`** If evidence-pack generation proves too long-running for the hosting platform's execution limits, the job runner is the component that separates first — a small, well-bounded extraction. This is a known and planned-for pressure point (ADR-016/ADR-033), not a surprise.

---

## 3. Environments

| Environment | Purpose | Data | Providers |
|---|---|---|---|
| **Development** (local) | Day-to-day work | Seeded, synthetic | Provider test/sandbox modes; no production credentials, ever |
| **Staging** | Production-shaped rehearsal of payment, email, issuance and pack generation | Synthetic; never a copy of production personal data `[BEST PRACTICE]` | Test modes throughout |
| **Production** | The real thing | Real | Live credentials |

**Why staging is not optional `[INFERENCE]`:** issuing a credential and sending an email are **irreversible in a way a database row is not**. A permanent public verification URL created by a test cannot be un-created without breaking the promise that the URL is permanent (NFR-2). This is the strongest single argument for the third environment, and it is a cost the project should accept deliberately (ADR-029).

**Preview environments** per change are valuable and cheap on some hosting platforms; they need care about which database they point at `[BEST PRACTICE]`.

---

## 4. Infrastructure requirements

| Requirement | Detail | Status |
|---|---|---|
| Hosting | Vercel **or** a single container on a managed host | OPEN — ADR-016 |
| Region | Driven by data residency | OPEN — ADR-032 / OQ-6 |
| Database | Managed PostgreSQL with `pgvector` available, automated backups, PITR | OPEN host — ADR-005a |
| Object storage | S3-compatible, versioning enabled on evidence buckets | OPEN — ADR-008 |
| Scheduled invocation | Platform scheduler or an external cron caller, authenticated by a shared secret | PROPOSED |
| Domain & TLS | *(Refined 2026-08-30, ADR-039.)* **Permanent credential identity is the architectural requirement**, not the URL. The domain is a product and branding decision, chosen deliberately and early because it appears on certificates and external documents — but the architecture supports redirect-based migration if it ever must change. **It does not block foundational decisions**; it does block the first real issuance | **OQ-5** |
| Email sending domain | SPF, DKIM, DMARC | **OQ-3** |
| Secrets | Platform secret store, per environment | ADR-030 |
| CI | Build, typecheck, lint, tests on every change; migrations applied deliberately, never automatically on deploy `[BEST PRACTICE]` | PROPOSED — depends on ADR-025 |

---

## 5. Stateless service principles

**`[PRODUCT REQUIREMENT]`** Guardrails §15 prefers stateless services; `CLAUDE.md` Rule 6 forbids business-critical state living only in memory.

Applied concretely:

1. **No in-memory session or workflow state** — any instance can serve any request.
2. **No local filesystem dependency** — uploads go to object storage, never to an instance's disk.
3. **No in-process scheduler or timer holding business meaning** — the exam clock is a database timestamp (ADR-021); background work is rows in a table (ADR-010).
4. **No in-memory caches that anything depends on for correctness** — every cache in the design is rebuildable (ADR-011).
5. **Configuration is data, not process state** — thresholds, scheme profiles and feature configuration are database-backed.
6. **A deploy is a replacement, not a migration of running state** — restarting every instance mid-cohort must be a non-event, apart from users needing to sign in again if sessions are instance-independent.

**The Service Restart Test is applied category by category in `DATA_ARCHITECTURE.md` §6.** All 21 categories answer YES by design.

---

## 6. Persistent services

Exactly three things in the deployment hold state that matters:

| Service | Holds | Loss consequence | Protection |
|---|---|---|---|
| **PostgreSQL** | Every business record, workflow state, configuration, job state, audit log | Catastrophic — the product | Automated backups, PITR, rehearsed restore (ADR-031) |
| **Object storage** | Candidate artifacts, evidence packs, badges, certificates, downloads | Severe — the evidence behind credentials | Versioning, deletion protection on credential assets |
| **External providers** | Payment records, sent email, identity | Recoverable by reconciliation | Our records remain authoritative (IP-2) |

**`[INFERENCE]`** Because state lives in two systems that fail independently, the recovery procedure must state how a database restore and an object-store state are reconciled — for example a submission record whose file is missing, or an orphaned object with no record.

---

## 7. Scalability considerations

| Dimension | Shape | Response |
|---|---|---|
| Overall load | **Read-heavy**; public surface dominates traffic | Static/ISR caching; CDN. `[PRODUCT REQUIREMENT]` Blueprint §26.6 |
| **Assessment** | **Spiky and latency-sensitive** — cohort exams concentrate load into narrow windows | Isolate the code path; per-answer writes are small; **load-test to 10× expected concurrency** `[PRODUCT REQUIREMENT]` Blueprint §26.6 |
| Artifact submission | Low volume, large files | Direct-to-object-storage uploads with signed URLs `[BEST PRACTICE]` |
| Evidence pack generation | Low volume, long-running | Background job (ADR-033) |
| AI tutor | Usage-priced, variable | Model routing, retrieval caching, per-user rate limits, per-feature budgets with alerting `[PRODUCT REQUIREMENT]` |
| Video | Largest variable cost | Fully offloaded to a managed provider |
| Database connections | The classic serverless failure mode | Pooling; a selection criterion for ADR-005a/ADR-016 `[BEST PRACTICE]` |
| Actual MVP volume | One cohort of 15–25, ~25 individual learners, 3–5 assessors | **The architecture is not volume-constrained. It is constrained by qualified assessor hours** — `[PRODUCT REQUIREMENT]` MVP §13.4 |

**The honest scaling statement:** nothing in this deployment is at risk from MVP traffic. The genuine capacity limit in the business is human assessment throughput, and no infrastructure decision changes it.

---

## 8. Backup and recovery

| Concern | Position |
|---|---|
| Database | Managed automated backups + point-in-time recovery |
| Object storage | Versioning on artifact and evidence buckets; deletion protection on issued-credential assets |
| **Rehearsal** | A restore must be performed and documented before the pilot cohort. **An untested backup is an assumption, not a control** |
| RPO / RTO | **OQ-10** — not stated in any specification; a business tolerance decision |
| Irreversible actions | Issued credentials and sent emails are not undone by a restore — the reason staging exists |
| Cross-system consistency | Reconciliation procedure required (§6) |
| Retention of backups | Must align with the retention schedule that does not yet exist (`DATA_ARCHITECTURE.md` §7.1) |

---

## 9. Monitoring

| Signal | Why | Alert-worthy |
|---|---|---|
| Uptime of the app **and the public verification page** | The verification page is the first employer impression and the growth loop | Yes |
| Error rate (server and client) | Baseline health | Yes |
| **Assessment session failures** | A lost exam is a refund, a support case and a reputational hit | **Yes — highest priority** |
| Job queue depth, failures, oldest pending job | Unsent SLA email is an invisible failure | Yes |
| Payment webhook failures / reconciliation drift | Money and entitlement | Yes |
| **Time from submission to decision** | The 10-working-day SLA is published, so it must be measured | Yes — reported, not just alerted |
| **Artifact submission rate** | The single most important number in the business | Reported continuously |
| Funnel: diagnostic → account → enrolment → candidacy → submission | The MVP's success criteria | Reported |
| AI cost per feature | Cost control requirement | Yes, on budget breach |
| Database health (connections, storage, slow queries) | Standard | Yes |
| Backup success **and restore rehearsal date** | A backup nobody verified is not a backup | Yes |

**`[BEST PRACTICE]`** Logs must exclude PII, assessment content and artifact content. The `audit_log` is business data and is deliberately **not** part of the observability stack.

---

## 10. Deployment risks worth stating now

| # | Risk | Mitigation |
|---|---|---|
| 1 | A deploy during a live cohort exam window | Deploy windows scheduled around exam windows; per-answer persistence (ADR-021) makes an instance replacement survivable |
| 2 | Evidence-pack generation exceeding execution limits | Background job + a hosting choice that accommodates it (ADR-016/033) |
| 3 | Serverless connection exhaustion against Postgres | Pooling; a selection criterion, not an afterthought |
| 4 | Region chosen before residency is settled | **Do not provision before ADR-032 is answered** — hosting, database and storage regions are all expensive to move |
| 5 | A retired verification domain lapsing and being re-registered by someone else | The real risk is **not** that a domain change is impossible (ADR-039 supports migration by redirect) — it is a lapsed domain serving foreign content beneath issued credentials. Any retired domain is **retained and redirecting indefinitely**; this is an operational obligation, not an architectural one |
| 6 | A migration applied automatically on deploy | Migrations are applied deliberately and reviewed (ADR-029); destructive migrations are a RED gate |

---

## 11. Approval status

Every item in this document is **DRAFT**. Provisioning any hosting account, database, bucket, domain, scheduler or pipeline requires explicit human approval and is a RED-gate action under `CLAUDE.md` ("changing production infrastructure", "introducing new external services").
