# Security & Compliance Architecture

> **Status: DRAFT — authorization model approved as direction (ADR-020) and secret-management principles approved (ADR-030), both 2026-08-30. Data residency remains OPEN; its sequencing rule is approved — see §11.1 and ADR-032.**
> **Created:** 2026-08-30 · **Version:** 0.1
> Statements are tagged: **`[PRODUCT REQUIREMENT]`** explicit in an approved specification · **`[BEST PRACTICE]`** recommended, not specified · **`[REGULATORY — VERIFY]`** a legal or scheme obligation that **requires independent human/legal verification and must not be settled by AI inference**.

---

## 1. Why security is a product feature here

This is a **trust product**. Its entire proposition is that a credential means something. Three consequences follow:

1. **Assessment content leakage destroys the item bank** — `[PRODUCT REQUIREMENT]` Blueprint App. B lists this as a high-severity risk.
2. **A credential decision must be defensible years later** — hence append-only assertions, immutable responses and a complete audit trail.
3. **An overstated claim is unrecoverable** — `[PRODUCT REQUIREMENT]` "Do not claim OB3.0 conformance before it is true; on a trust product that is the one lie you cannot afford."

Security failures here are not only technical incidents; they are product failures.

---

## 2. Authentication strategy

| Aspect | Position | Tag |
|---|---|---|
| Build vs buy | **Do not build auth.** Auth.js or Clerk (ADR-006) | `[PRODUCT REQUIREMENT]` |
| Methods at launch | Email/password + Google sign-in; email verification; password reset | `[PRODUCT REQUIREMENT]` M1 |
| MFA | Mandatory for privileged roles | `[PRODUCT REQUIREMENT]` Blueprint §26.5 — **but V1 has only internal admins, so scope needs confirmation (OQ-14)** |
| Sessions | Server-verifiable; session loss logs a user out but never loses business state | `[BEST PRACTICE]` |
| Account recovery | Password reset and email change are a known attack surface; the specifications flag "I earned a credential under an old employer email" as a real, unhandled case | `[PRODUCT REQUIREMENT]` Mockup §20.1 #6 (reassociation is P2) |
| Identity data location | Depends on ADR-006; interacts with residency (OQ-6) | `[REGULATORY — VERIFY]` |

---

## 3. Authorisation strategy

### 3.1 Model
**`[PRODUCT REQUIREMENT]`** Scoped, many-to-many roles: `(user, role, scope_type, scope_id)`. **Never a `role` column on the user.** Both specifications call this the most common and most expensive early data-model mistake. Launch roles: `participant` *(formerly `learner` — DR-02 terminology)*, `expert` *(the trainer/instructor role, **promoted by DR-02** to a real role with a public profile)*, `assessor`, `org_admin`, `platform_admin`. **The authorisation model itself is unchanged and sufficient** — only the role set grows; see ADR-020.

### 3.2 Enforcement point
**`[PRODUCT REQUIREMENT]`** MVP Spec §9 rule 7: *"Assessment content is not readable by non-assessor, non-admin roles at the query layer. Not just hidden in the UI."*

**`[BEST PRACTICE]`** Therefore authorisation, tenancy filtering and integrity rules live in shared service/repository guards that a screen cannot bypass or forget. Direct table access from route or component code is a defect. Database row-level security is worth evaluating as an **additional** layer, not a substitute (ADR-020).

### 3.3 Integrity rules that are authorisation, not policy

| Rule | Requirement | Tag |
|---|---|---|
| **Assessor conflict of interest** | An assessor cannot evaluate a submission from a cohort they instructed. "One database check, enforced in code, from day one" | `[PRODUCT REQUIREMENT]` |
| **No automated credential decision** | Never — not for any component, not as an optimisation | `[PRODUCT REQUIREMENT]` |
| **Two-person revocation** | No single account can revoke an issued credential. *Revocation UI is deferred in V1; the rule must not be violated by any manual path that exists* | `[PRODUCT REQUIREMENT]` |
| **Tenant isolation** | An org admin sees only their own organisation | `[PRODUCT REQUIREMENT]` |
| **Manager privacy boundary** | The individual learner view carries an explicit privacy boundary | `[PRODUCT REQUIREMENT]` `O03` |
| **Assessor qualification** | Verified experience + calibration against the three exemplars + a signed conflict-of-interest and confidentiality undertaking, recorded as a scoped `assessor` role | `[PRODUCT REQUIREMENT]` MVP §15.5 |
| **Segregation of duty** | Finance roles cannot access assessment content; instructors cannot access the live item bank | `[PRODUCT REQUIREMENT]` Blueprint §26.5 — *finance/ops is not a V1 role, so this is a forward obligation* |

---

## 4. Personal data protection

| Aspect | Position | Tag |
|---|---|---|
| Baseline | PDPA (Malaysia) and GDPR alignment | `[REGULATORY — VERIFY]` Blueprint §26.5 |
| Data-subject rights | Export everything; delete account with a clear explanation of what survives | `[PRODUCT REQUIREMENT]` `S06`, Mockup §20.1 #7 |
| The deletion tension | Account deletion must be honoured **while issued credentials remain verifiable** (NFR-2). The proposed direction is anonymised survival of the credential record | `[PRODUCT REQUIREMENT]` + **OQ-12: the exact policy is a human decision** |
| Consent | Explicit consent captured; evidence artifacts linked publicly **only with holder consent** | `[PRODUCT REQUIREMENT]` |
| Minimisation | Profile holds name, photo, headline, country, target role — nothing more is required | `[PRODUCT REQUIREMENT]` M1 |
| Corporate data | Cohort rosters and attendance are employee personal data processed on behalf of the employer — **a processor relationship with contractual terms** | `[REGULATORY — VERIFY]` |
| Learner data and AI | Learner data must not be used to train third-party models; explicit contractual terms with providers | `[PRODUCT REQUIREMENT]` Blueprint §17.4 → **OQ-4** |
| Data residency | "Regional data residency for enterprise" is stated as a requirement direction | `[REGULATORY — VERIFY]` → **OQ-6 / ADR-032** |
| Retention schedules | Documented retention is required; **durations are not specified anywhere** | `[PRODUCT REQUIREMENT]` + `[ASSUMPTION]` — see `DATA_ARCHITECTURE.md` §7.1 |

---

## 5. Payment security

| Aspect | Position | Tag |
|---|---|---|
| Card data | **Never stored — tokenised via the processor** | `[PRODUCT REQUIREMENT]` Blueprint §26.5 |
| Entitlement | Our records are authoritative; provider webhooks advance state, signature-verified and idempotent | `[BEST PRACTICE]` / IP-2 |
| PCI scope | Using a hosted payment surface keeps scope minimal — **but the applicable SAQ level requires verification with the chosen provider** | `[REGULATORY — VERIFY]` |
| Refunds | Refund and withdrawal policy per product type is **entirely absent from the specifications** and legally required in most jurisdictions | `[PRODUCT REQUIREMENT]` Mockup §20.1 #3 → **OQ-9** |
| Tax / invoicing | Malaysian service tax treatment and the invoicing legal entity are unresolved | `[REGULATORY — VERIFY]` → **OQ-2** |

---

## 6. Examination integrity

**`[PRODUCT REQUIREMENT]`** V1 deliberately has **no proctoring vendor** (ADR-019). The stack of controls is:

| Layer | Control | Tag |
|---|---|---|
| Undertaking | Honour undertaking signed at candidate registration | `[PRODUCT REQUIREMENT]` |
| Time | Server-authoritative 60-minute limit (`started_at` in the database, ADR-021) | `[PRODUCT REQUIREMENT]` + `[BEST PRACTICE]` |
| Item exposure | Randomised item order; one fixed form in V1 | `[PRODUCT REQUIREMENT]` |
| Query-layer secrecy | Item content unreadable by non-assessor/non-admin roles | `[PRODUCT REQUIREMENT]` |
| Physical | In-room invigilation for corporate cohorts — "which is how the first customers buy anyway" | `[PRODUCT REQUIREMENT]` |
| Transparency | Say this openly on the credential page | `[PRODUCT REQUIREMENT]` |
| **The real control** | **The artifact**, read and judged by a qualified human | `[PRODUCT REQUIREMENT]` |
| AI-use policy | Declared per assessment and visible before starting: `Restricted` (exam), `Disclosed` (artifact) | `[PRODUCT REQUIREMENT]` |
| Tutor lockout | The AI tutor is **visibly disabled during assessment, with the reason shown** — enforced server-side | `[PRODUCT REQUIREMENT]` |
| Telemetry | Response-time and answer-pattern anomaly detection are **Blueprint-scope, not V1** | Deferred |

**`[BEST PRACTICE]`** Exam windows should be scheduled around actual working hours because 24/7 availability requires support coverage that does not exist (`[PRODUCT REQUIREMENT]` MVP §13.4).

---

## 7. Certificate and credential verification

| Aspect | Position | Tag |
|---|---|---|
| Verification model | A permanent public URL keyed by a stable public identifier; no login required | `[PRODUCT REQUIREMENT]` |
| Identifier design | Must be unguessable enough not to enumerate holders, yet stable forever | `[BEST PRACTICE]` — **and permanent, so it must be right the first time (NFR-2)** |
| Badge metadata | Open Badges **2.0** JSON embedded in the PNG | `[PRODUCT REQUIREMENT]` |
| Cryptographic verifiability | **Deferred** to Phase 1C/2. Do not claim OB3.0 conformance before it is true | `[PRODUCT REQUIREMENT]` |
| Status display | Valid / expired / suspended / revoked, presented neutrally and non-defamatorily | `[PRODUCT REQUIREMENT]` Blueprint §12.5 |
| Evidence link | Only with holder consent | `[PRODUCT REQUIREMENT]` |
| Availability | The verification page is the first brand impression for every employer; it must stay up when the app is degraded | `[BEST PRACTICE]` from NFR-2 |
| Enumeration / scraping | Public by design, but bulk harvesting of holder data should be rate-limited | `[BEST PRACTICE]` |

---

## 8. Audit requirements

| Requirement | Detail | Tag |
|---|---|---|
| Scope in V1 | **Every credential and assessment mutation** writes an audit row: actor, action, entity, before/after | `[PRODUCT REQUIREMENT]` |
| Atomicity | Written in the same transaction as the mutation, so gaps are impossible | `[BEST PRACTICE]` ADR-022 |
| Immutability | Append-only; never edited or deleted | `[PRODUCT REQUIREMENT]` |
| Attendance corrections | Retrospective correction requires its own audit trail | `[PRODUCT REQUIREMENT]` M9 |
| Admin actions | Comprehensive logging of admin actions; break-glass admin access is fully audit-logged | `[PRODUCT REQUIREMENT]` Blueprint §26.5 |
| Separation | The audit log is **business data in the database**, not application telemetry | `[BEST PRACTICE]` |
| Coverage gap to note | The specification scopes V1 audit to credential and assessment actions. **Payments, seat/roster changes and data-subject requests arguably deserve the same treatment** — recommended, not required | `[BEST PRACTICE]` → decision point |

---

## 9. Secret management

| Requirement | Detail |
|---|---|
| Storage | Platform secret store per environment; local `.env` files never committed. `.gitignore` already excludes `.env` and permits `.env.example` |
| Documentation | `.env.example` lists names, never values |
| Rotation | Possible without a code change |
| Exposure | No secret in logs, error reports, analytics payloads or client bundles. The error tracker must be configured to scrub headers and bodies |
| Separation | Distinct credentials per environment; production credentials never present in development |

All `[BEST PRACTICE]`, formalised as ADR-030.

---

## 10. Security boundaries

```
  PUBLIC (no auth)                    │  AUTHENTICATED                │  PRIVILEGED
  ──────────────────────────────────  │  ───────────────────────────  │  ──────────────────────
  marketing · knowledge · glossary    │  learner workspace            │  assessor workbench
  diagnostic (anonymous)              │  programme · session · mat'ls │  (item + submission access)
  credential detail · rubric          │  candidacy · exam · artifact  │  org console (own tenant)
  PUBLIC VERIFICATION PAGE            │                               │  platform admin (break-glass,
                                      │                               │   MFA, fully audit-logged)
  ────────────────────────────────────┴───────────────────────────────┴──────────────────────────
  Crossings that must be guarded at the data layer, not the UI:
   · tenant boundary        org admin → only own organisation
   · assessment secrecy     item content → assessor / platform admin only
   · evidence access        submission → candidate, assigned assessor, platform admin
   · conflict of interest   assessor ⊗ cohort they instructed
   · AI corpus boundary     tutor → published knowledge articles ONLY, and never during an exam
```

---

## 11. Malaysian regulatory considerations

**Every item in this section is `[REGULATORY — VERIFY]`. None may be treated as settled on the basis of this document.**

| # | Consideration | Why it matters here | Status |
|---|---|---|---|
| M-1 | **PDPA (Personal Data Protection Act 2010)** | Learner and cohort employee data is processed in Malaysia's primary market. Consent, notice, retention, security and data-subject rights apply | Requires legal verification. Note the Act has been amended in recent years — **current obligations must be checked, not assumed** |
| M-2 | **Processor relationship with corporate customers** | Cohort rosters and attendance are the employer's employee data | Requires contractual terms |
| M-3 | **Cross-border transfer** | Hosting, auth, email, storage, AI, analytics **and backups** may each place data outside Malaysia — every one is an independent transfer | Drives ADR-032 / OQ-6. **See §11.1 — no residency requirement is assumed in either direction** |
| M-4 | **HRD Corp / e-TRIS evidence requirements** | `O10` is currently specified from general knowledge, not a verified current checklist. "Getting this wrong in front of a corporate buyer is worse than not offering it" | `[PRODUCT REQUIREMENT]` to verify — OQ-8. The reference material contains the real document set (trainer profile, training material, course outline, learning outcomes, brochure, certificates), which should be the specification |
| M-5 | **Service tax / invoicing on training services** | Affects pricing, receipts and the corporate invoice | Requires accounting/legal input — OQ-2 |
| M-6 | **Consumer withdrawal and refund rights** | Refund flows are entirely absent from the specifications | OQ-9 |

### 11.1 Data residency — what must be independently verified

**Explicit correction (2026-08-30).** Earlier drafts framed this as "is *Malaysian* residency required?", which imported an assumption from the owner's location and the primary market. **That inference is withdrawn.** No residency requirement is assumed in either direction — not Malaysia-only, and not unconstrained. The obligation is whatever verification establishes, and until then the question is open.

Seven inputs, each to be verified independently and then **classified**:

| # | Input | What must be established | Classification |
|---|---|---|---|
| 1 | **Malaysian PDPA obligations** | Whether the Act as currently amended imposes any localisation or cross-border transfer restriction on this data, and what notice or consent a transfer requires | **Legal/regulatory** — requires legal advice, not an AI reading of the statute |
| 2 | **Customer geography** | Where paying customers and their employees actually are. A Malaysian-led business may sell regionally from day one | **Contractual/customer** |
| 3 | **International learner requirements** | Whether learners outside Malaysia bring their own regime (GDPR for EU residents most obviously), and what that implies for lawful basis and transfer | **Legal/regulatory** |
| 4 | **HRD Corp / e-TRIS requirements** | Whether the scheme imposes any storage, retention or accessibility condition on claim evidence | **Legal/regulatory** where the scheme mandates it; **contractual** where the employer imposes it |
| 5 | **Payment provider data handling** | Where the processor stores cardholder and customer data, and what the merchant agreement commits us to | **Contractual**, with **regulatory** (PCI) consequences |
| 6 | **Third-party processor locations** | Where auth, email, object storage, AI, error tracking and analytics each process and store data | **Contractual**, with regulatory consequences |
| 7 | **Backup and disaster-recovery locations** | Where backups and replicas reside. **A backup in another jurisdiction is a transfer** — routinely overlooked | **Legal/regulatory** + **risk management** |

**The three classifications, kept distinct:**

| Class | Meaning | Who decides |
|---|---|---|
| **Legal / regulatory requirement** | Non-negotiable; imposed by law or by a scheme | Verified with legal counsel. **Never inferred here** |
| **Contractual / customer requirement** | Negotiable in principle, binding once signed. Often a sales prerequisite rather than a law | Commercial decision |
| **Recommended risk-management practice** | Neither legally nor contractually required; adopted because the risk/benefit favours it | Architecture recommendation, owner's call |

Conflating these is how a sales preference becomes a believed legal constraint, or a real legal constraint gets treated as negotiable. **No hosting or region decision may be approved until items 1–7 are verified and classified.**

| M-7 | **Accessibility obligations** | A certification body has a legal and ethical obligation to provide reasonable adjustments; the specifications call this "the most serious omission" and place accommodations in MVP | `[PRODUCT REQUIREMENT]` `K03` — the *policy* and approval workflow need a human owner |

---

## 12. Open security questions

| ID | Question | Why it cannot be inferred |
|---|---|---|
| OQ-4 | Is a data-processing agreement in place with the AI provider, with a "no training on learner data" term? | Contractual, not technical |
| OQ-6 | Is Malaysian or Southeast Asian data residency required? | Regulatory and commercial; constrains hosting, database and storage regions irreversibly |
| OQ-9 | What is the refund/withdrawal policy per product type (course, path, exam, candidacy, corporate seat)? | A business and legal decision; exam and candidacy fees have a different cost structure from course fees |
| OQ-10 | What are the RPO and RTO targets? | A business tolerance question |
| OQ-12 | On account deletion, exactly what survives on the verification page? | Sits between a legal obligation and a public trust claim |
| OQ-14 | Is MFA in scope for V1 admin accounts? | Specified for privileged roles generally; V1 has only internal admins |
| OQ-15 | Who owns the accommodations approval decision, and what is the published policy? | An operational and legal responsibility, not a software design |
| OQ-16 | Should the V1 audit log extend beyond credential and assessment actions to payments, seat changes and data-subject requests? | The specification scopes it narrowly; broadening is a cost/benefit call |
| OQ-17 | Is a penetration test required before the first corporate sale? | Blueprint §26.5 states "annual penetration test before enterprise sales conversations" — timing and budget are a human decision |
