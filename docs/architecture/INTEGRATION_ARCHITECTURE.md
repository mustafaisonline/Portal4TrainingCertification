# Integration Architecture

> **Status: DRAFT — no integration or provider is approved.** Every provider named below remains a candidate for human decision.
> **Created:** 2026-08-30 · **Version:** 0.1
> **No provider has been selected and no integration has been built.** Every provider named below is a candidate for human decision.

---

## 1. Integration principles

| # | Principle | Source |
|---|---|---|
| IP-1 | **Buy undifferentiated infrastructure; build the trust asset.** Never build auth, video, payments, email, error tracking. Do build the assessment engine, the credential rules engine, and the artifact/assessor workflow | `[SPEC]` Blueprint §26.7 |
| IP-2 | **An external service is never the source of truth for business state.** Our database records entitlement, issuance and progress; providers supply events we reconcile against | `[INFERENCE]` from `CLAUDE.md` Rule 6 |
| IP-3 | **Every inbound webhook is signature-verified and idempotent.** Replays must be harmless | `[INFERENCE]` Guardrails §23 |
| IP-4 | **Every outbound call has a defined failure behaviour** — degrade, retry, or fail loudly. Silent failure is forbidden | `[INFERENCE]` Guardrails §26 |
| IP-5 | **No integration may block the learning path.** The tutor being down must not prevent a lesson; email being slow must not prevent a submission | `[INFERENCE]` |
| IP-6 | **Integrations are wrapped behind one internal interface each**, so a provider change is a module change, not a codebase change | `[SPEC]` (stated explicitly for AI model routing; generalised `[INFERENCE]`) |
| IP-7 | **Minimum necessary data leaves the system.** Assessment content and candidate artifacts never leave except where the function requires it | `[SPEC]` Blueprint §26.5 |

---

## 2. Integration landscape summary

| # | Category | MVP? | Candidate providers | Status |
|---|---|---|---|---|
| I-1 | Authentication | **Required** | Auth.js · Clerk | PENDING (ADR-006) |
| I-2 | Payments — cards | **Required** | Stripe | PENDING (ADR-014) |
| I-3 | Payments — Malaysian rail | **Required by spec; priority questionable** | Stripe local methods · Billplz · iPay88 · Razer MS · bank FPX | PENDING + **OQ-2** |
| I-4 | Transactional email | **Required** | Resend · Postmark | PENDING (ADR-015) |
| I-5 | Object storage | **Required** | Cloudflare R2 · AWS S3 | PENDING (ADR-008) |
| I-6 | Video hosting | **Required (thin)** — one real lesson in 1A | Mux · Cloudflare Stream · Bunny | DEFERRED to 1B (ADR-009) |
| I-7 | AI model provider | **Required** | Claude (Anthropic) | PENDING (ADR-013) |
| I-8 | Error tracking | **Required** | Sentry or equivalent | PENDING (ADR-017) |
| I-9 | Product analytics | **Required** | PostHog · Plausible/Fathom · Amplitude/Mixpanel | PENDING (ADR-017/035) |
| I-10 | Certificate & badge generation | **Required — built in-house** | — (PDF + PNG generation libraries) | PROPOSED |
| I-11 | Credential verification | **Required — built in-house** | — (permanent URL, no vendor) | PROPOSED (ADR-018) |
| I-12 | Social sharing (LinkedIn) | **Required (trivial)** | LinkedIn share URL — no API integration | PROPOSED |
| I-13 | Search | **In-house** (Postgres FTS) | — | PROPOSED (ADR-012) |
| I-14 | Uptime monitoring | Recommended | Any hosted checker | PROPOSED |
| I-15 | Proctoring | **NOT in MVP** | — | REJECTED for V1 (ADR-019) |
| I-16 | SSO / SCIM / HRIS | **NOT in MVP** | Via the auth provider later | DEFERRED |
| I-17 | LTI 1.3 / SCORM / LRS | **NOT in MVP** | — | DEFERRED (ADR-024) |
| I-18 | Slack / Teams / calendar | **NOT in MVP** | — | DEFERRED |
| I-19 | Open Badges 3.0 / VC issuer | **NOT in MVP** | Third-party issuer in 1C/Phase 2 | DEFERRED (ADR-018) |
| I-20 | Virtual meetings (live sessions) | **Not integrated** | — | **OQ-13** — cohorts are instructor-led; is any meeting tooling in scope? |

---

## 3. Integration detail

### I-1 Authentication — **MVP required**
**Why needed.** `[SPEC]` "Do not build auth." V1 needs email/password + Google sign-in, email verification and password reset. SSO is deferred but must not require a rewrite when it arrives.
**Boundary.** The provider authenticates; **our database owns identity attributes and all scoped role assignments** (ADR-020). Authorisation is never delegated.
**Data exchanged.** Email address, name, and an external identifier. Nothing about learning, assessment or credentials.
**Security.** Session integrity; MFA available for platform admin; account-recovery flows are an attack surface and must be reviewed.
**Failure handling.** Sign-in unavailability blocks new sessions; existing sessions should continue. **Business data is never at risk** because it is all in our database.
**Alternatives.** Building it in-house — explicitly rejected by the specification.

### I-2/I-3 Payments — **MVP required**
**Why needed.** Individual candidates pay for the path and the candidacy; corporates buy cohorts. Local rails materially affect conversion in Malaysia.
**Boundary.** The provider holds card data and processes charges. **Our `orders` and `candidacies` records are authoritative for entitlement.** A webhook advances our state; it does not define it.
**Data exchanged.** Amount, currency, customer reference, product reference. **Never** learning or assessment data.
**Security.** No card data stored or logged; webhook signature verification; idempotency keys on both charge creation and webhook handling.
**Failure handling.** A missed webhook must be recoverable by reconciliation, not by manual database editing. Duplicate webhooks must be harmless. A payment success that fails to record must be detectable — this is a money-and-trust path, so it warrants explicit alerting.
**Open.** **OQ-2** — which Malaysian rail, under which legal entity, and whether corporate purchases actually run on invoice and bank transfer rather than an online rail (which would change this integration's priority substantially).

### I-4 Transactional email — **MVP required**
**Why needed.** Verification, password reset, receipts, candidacy window, seat invitations, **assessor assignment**, **decision issued**, credential awarded.
**Boundary.** Dispatched through the `jobs` table so a failure is retried and visible, never silently dropped.
**Data exchanged.** Recipient address, name, and templated content. **No assessment content, no artifact content, no assessor reasoning in an email body** `[INFERENCE]` — link into the product instead.
**Security.** Dedicated sending domain with SPF/DKIM/DMARC (**OQ-3**); links are single-purpose and expiring where they grant access.
**Failure handling.** Retry with backoff; terminal failures surfaced to platform admin. Assessor-assignment and decision emails are **SLA-critical** (NFR-6) and must be monitored, not assumed.

### I-5 Object storage — **MVP required**
**Why needed.** Candidate artifacts, evidence packs, badge images, PDF certificates, lesson downloads, profile photos.
**Boundary.** Files in the object store; metadata and keys in PostgreSQL. Buckets never public-listable. Access via short-lived signed URLs.
**Data exchanged.** File bytes and object keys.
**Security.** Upload type and size validation; separate prefixes (and access rules) per class — public badge assets vs restricted candidate evidence; versioning enabled on evidence buckets (ADR-031).
**Failure handling.** An upload failure must not silently produce a submission record with no file — the submission is not complete until the object is confirmed `[INFERENCE]`.

### I-6 Video — **thin in 1A, real in 1B; provider deferred**
**Why needed.** `[SPEC]` "Never build video." Adaptive streaming, captions and transcripts are required by NFR-3.
**Boundary.** The content `block` model stores a **provider-neutral reference**, so the provider is late-binding (ADR-009).
**Data exchanged.** Video assets and playback identifiers. No learner PII need leave the system for basic playback `[INFERENCE]`.
**Failure handling.** A video failing to load must degrade to transcript-first, which is also the low-bandwidth answer (NFR-12).
**Cost.** The largest variable cost in the platform — a selection criterion, not a footnote.

### I-7 AI model provider — **MVP required**
**Why needed.** M8, the grounded tutor — the only AI feature in the functional MVP.
**Boundary.** A single internal function is the only place model calls happen (ADR-013). Retrieval happens against our own pgvector index; **only retrieved public knowledge-article text and the learner's question leave the system.**
**Data exchanged.** Question text, retrieved corpus excerpts, conversation context. **Never** item content, submissions, evaluations, or other learners' data.
**Security and governance `[SPEC]`.** Learner data must not be used to train third-party models, with explicit contractual terms and a data-processing agreement (**OQ-4**). Answers cite sources with version stamps. The tutor is **disabled during assessment**, with the reason shown — this must be enforced server-side, not by hiding a button.
**Failure handling.** Tutor unavailability shows an honest message and never blocks the lesson (IP-5).
**Cost.** Per-feature budget with alerting; retrieval caching; per-user rate limits.

### I-8/I-9 Error tracking and product analytics — **MVP required**
**Why needed.** "The funnel must be measurable from day one"; the SLA is published and must be measured; artifact submission rate is the decisive business metric.
**Boundary.** Client and server SDKs.
**Data exchanged.** Events and exceptions. **Scrubbed of PII, secrets, assessment content and artifact content.**
**Security.** **ADR-035** — no session replay or DOM capture on assessment, artifact workspace or evaluation screens. This constrains the analytics product choice.
**Failure handling.** Telemetry failure must never affect the user path.

### I-10/I-11/I-12 Credentials, badges and sharing — **built in-house**
**Why in-house.** `[SPEC]` The credential and its verification page **are the trust asset**. The verification page is where an employer first meets the brand, and it is the growth loop.
**Composition.** A permanent public identifier and URL; a server-rendered verification page; a PNG badge carrying Open Badges **2.0** metadata; a PDF certificate; a LinkedIn share with pre-composed text (a URL, not an API integration).
**Boundary.** No vendor is in the verification path in V1. Cryptographic verifiability via a third-party issuer is a Phase 1C/2 decision (ADR-018).
**Security.** The verification URL is public by design and must expose only what the specification lists; the evidence artifact is linked **only with holder consent**.
**Failure handling.** The verification page must remain available even if the authenticated app is degraded — it is read-only and cacheable, which makes this achievable.
**`[SPEC]` warning:** do not claim OB 3.0 conformance before it is true.

### I-15 Proctoring — **explicitly not in MVP**
Rejected for V1 on four grounds (cost, conversion friction, accessibility hostility, integration burden) for a control that is not the real one — the artifact is (ADR-019). This removes an entire class of highly sensitive data from the platform.

### I-16 to I-19 Enterprise and standards integrations — **deferred**
SSO/SCIM/HRIS, LTI 1.3, SCORM/xAPI/LRS, Slack/Teams/calendar, and Open Badges 3.0 / W3C VC issuance are all explicitly deferred. The architectural obligation today is only that **none of them require a rewrite later**: the auth provider should make SSO a configuration; the `events` table should make xAPI a projection; the credential model should make a signed VC an additional representation of an existing record.

### I-20 Live session tooling — **OPEN**
Cohorts are instructor-led with attendance captured, and the corporate motion is blended delivery. The MVP Spec does not mention any virtual meeting integration, and the Blueprint lists it only under community events. **OQ-13:** are live sessions run on tooling outside the platform (with the platform only recording attendance), or is any integration expected? The former is assumed here.

---

## 4. Cross-cutting integration concerns

| Concern | Requirement |
|---|---|
| **Provider outage** | Each integration has a stated degradation mode (§3). None may corrupt business state |
| **Reconciliation** | Payments and email dispatch must be reconcilable after an outage without manual database editing |
| **Idempotency** | All webhooks and all job handlers |
| **Secrets** | Per-environment credentials in the platform secret store; never in the repository (ADR-030) |
| **Data leaving the country** | Every integration is a cross-border transfer question until residency is settled — **OQ-6** applies to all of them, not just hosting |
| **Vendor exit** | Each integration is behind one internal interface (IP-6), so replacement is bounded. The exception, deliberately, is the framework (ADR-002) |
| **Cost visibility** | AI and video are usage-priced and must have budgets with alerting `[SPEC]` Blueprint §26.6 |

---

## 5. Approval status

**Every integration in §2 marked PENDING requires explicit human approval before any account is created, any SDK is installed, or any credential is configured.** Introducing an external service is a RED-gate action under `CLAUDE.md` and Guardrails §17.
