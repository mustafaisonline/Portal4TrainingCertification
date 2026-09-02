# External Architecture Review — 2026-08-30

> **Document type:** Independent pre-implementation architectural quality-gate review
> **Status:** REVIEW RECORD — advisory only. This document approves nothing, changes no decision state, and authorises no action.
> **Reviewed:** all 24 Markdown documents in the repository as at 2026-08-30 — the three root specifications, `docs/architecture/` (16 documents), `docs/execution/` (3 documents), and the governance layer (`CLAUDE.md`, `AI_DEVELOPMENT_GUARDRAILS.md`).
> **Reviewer stance:** Principal/enterprise architect review conducted before any application code exists. Findings marked ★ are new — not identified anywhere in the existing corpus.

---

## 1. Executive Summary

**Overall assessment.** This is among the strongest pre-code documentation sets reviewed for a project of this size. The unusual thing about it is not volume — it is that the documents *argue with themselves*: the Mockup Spec contains a genuine self-critique (§20), the Build Spec resolves its own contradictions on the record (DR-01), and the architecture layer separates fact from inference from assumption with discipline most enterprises never achieve.

**Architectural maturity:** High. The architecture is deliberately boring in the right ways (modular monolith, one Postgres, jobs table, no premature infrastructure) and deliberately careful in the right places (scoped RBAC, append-only evidence, requirements-as-data, tenancy from commit one). The "Retrofit Test" is the correct organising principle and it is applied consistently.

**Documentation quality:** Excellent, with one systemic caveat — roughly a third of the corpus is governance *about* making decisions rather than the product itself, and the approval machinery is heavier than many enterprise change boards, for a team of one owner plus AI.

**Implementation readiness:** **MOSTLY READY.** The engineering architecture is ready. What is not ready is a small set of business/policy decisions the documents themselves correctly identify but which remain unanswered — plus three genuine gaps the documentation has *not* caught (§5).

**Biggest strengths:** DR-01 (one credential); the Retrofit Test; the "fake the machinery, never the judgement" rule; the Service Restart Test made executable; honest failure conditions in Build Spec §12.5; the conflict registers.

**Biggest concerns:** (1) governance overhead vs. a solo operator's velocity; (2) Track A's *medium* is now undefined after ADR-036/040; (3) the employer-validation workstream — which the Blueprint calls step 1, "do it before writing code" — appears **nowhere in the execution plan**; (4) an unnoticed collision between BR-1 and the founder's roles that materially affects the pilot.

---

## 2. Reviewer's Understanding of the System

**Product.** An evidence-based professional credentialing platform ("Data & AI Academy", working name) whose thesis is that in an AI era, exam-only certificates are collapsing as a signal, and a credential backed by a **human-assessed applied artifact** with a published rubric, real exemplars, and a permanent public verification page will command employer trust. The promise is three sentences: *learn what you're actually missing → prove it by doing the work → carry the proof anywhere.*

**V1 scope (binding, per `DATA_AI_ACADEMY_MVP_BUILD_SPEC.md`):** exactly one domain (Data Foundations, as seeded data), one learning path (~6–8 courses from existing Data Blueprint material), one fixed 20-question diagnostic producing plain-language gap statements, one 60-item/70%-threshold knowledge exam, one artifact brief (3 industry variants) graded by human assessors against a 5×4 rubric with three real exemplars, one credential with a permanent verification URL (OB 2.0 metadata in a PNG; cryptographic VCs deferred), one grounded RAG tutor citing a 20–30 article knowledge library, and a thin corporate layer (orgs, cohorts, attendance grid, progress table, one-click HRD Corp evidence pack) — because Malaysian corporate cohorts are how V1 gets paid. 44 screens (30 P0), 17 conceptual tables, 5 roles.

**Architecture (per `docs/architecture/`):** one Next.js/TypeScript deployable with enforced module boundaries; one PostgreSQL as sole source of truth (pgvector + FTS in the same instance); server actions + route handlers; a `jobs` table instead of a queue; scoped many-to-many RBAC enforced at the data-access layer; append-only skill assertions and exam responses; audit rows in the same transaction; server-authoritative exam clock; no Redis, no microservices, no proctoring vendor, no graph DB. Twelve approved principles (AP-01…AP-12) including Simplicity Before Scale and Zero-Cost/Free-First development. 42 ADRs; ~24 approved (many "direction only"), authentication (ADR-006) the sole architectural blocker for the next milestone. Phase 1 runs dual-track: Track A (product-experience validation of the four argument-carrying screens P06/K06/K08/P16) and Track B (a production-grade vertical slice ending in a verified restart-resilience test).

**Operating reality the documents are honest about:** the constraint is not code — it is qualified assessor hours, expert authoring time (skill list, item bank, rubric, exemplars), and employer recognition. The success gate is G1: ≥60% of registered candidates actually submit an artifact.

---

## 3. What Has Been Done Well

1. **DR-01** is the single best decision in the corpus. Cutting to one credential is argued on *measurement integrity* (an exam-only L1 corrupts G1), not just scope — and Build Spec §15 honestly prices what the decision removes, including the two rules it silently breaks (assessor qualification, graceful landing) and replaces.
2. **The Retrofit Test** correctly separates cheap-later from rewrite-later. The expansion columns "populated with one value and read by nothing" is exactly the right cost to pay.
3. **"Fake the machinery, never the judgement"** (Build Spec §11) — the clearest statement of prototype ethics in the corpus.
4. **The Service Restart Test as an executable Track B exit criterion** (`TESTING_ARCHITECTURE.md` §6) converts a principle into a pass/fail control. Restart proofs 7 and 8 in the Milestone 1 plan are the right first milestone.
5. **The conflict registers** (CONF-1…10, and WBS §1.4) surface disagreements instead of silently resolving them, and record the Blueprint positions as deferred destinations, not errors.
6. **Provenance tagging** (`[SPEC]`/`[INFERENCE]`/`[ASSUMPTION]`/`[FACT verified date]`) with expiry on external facts. The Vercel Hobby non-commercial finding and the Auth.js-v5-never-shipped finding both demonstrate the machinery catching real traps.
7. **Honest failure conditions** (Build Spec §12.5) — pre-registering what would falsify the thesis, before emotional investment.
8. **The identity mapping pattern** in `DECISION_B_AUTHENTICATION.md` §B — own UUID as business identity, provider subjects confined to one mapping table, auth-provider org/role features explicitly out of scope — is exactly right and makes the ADR-006 choice low-stakes rather than existential.
9. **Mockup Spec §20** — a specification that critiques itself (accommodations, seat offboarding, refunds, the graceful landing) found most of its own gaps.

---

## 4. Documentation Inconsistencies

| # | Issue | Documents | Why it matters | Recommended resolution |
|---|---|---|---|---|
| **I-1** | **Mockup Spec's own scope tags contradict its inventory.** §4/§5/§10 section headers mark `P13` Literacy, `P18` Funding, `N04` Glossary, `N09` Prompt Library, `L08` Portfolio as `[MVP]`; the §13 inventory marks all five `P2`. | `MOCKUP_SPECIFICATION` §4 vs §13 | The Build Spec supersedes both, but anyone reading the mockup spec alone (a design agent, per its stated audience) gets two answers. | One-line errata note in the mockup spec deferring all scope tags to Build Spec §6. Do not renumber. |
| **I-2** | **Appeals.** Mockup `K08` `[MVP]` shows "a visible appeal route to a different assessor"; Build Spec §3.1 defers appeals ("requires an independent second assessor"). But Phase 1C plans **3–5 assessors** — the deferral's own precondition is met at pilot. | Mockup §7 K08; Build Spec §3.1, §10 | A trust product that publishes a rubric but offers no recourse is exposed; and the stated reason for deferral will not survive contact with the pilot roster. | Decide deliberately: either a minimal manual second-look policy at pilot (a paragraph on P15 + a manual admin flow — near-zero build cost), or remove the appeal affordance from the K08 design. Do not leave the two documents disagreeing. |
| **I-3** | **Track A has no defined medium.** ADR-028 (design tool vs production stack) was superseded by ADR-036, which defines Track *B*. ADR-040 preserves Track A's exit criteria but never says what Track A *is built in*. WBS 4.1.1–4.1.7 sequences design tokens and screens without naming the medium. | ADR-036/040; `PROJECT_PLAN_WBS.md` §6.1 | The largest genuine hole in the Phase 1 plan. If Track A is built in the production repo with fixtures, the ADR-028 hazard (fixtures quietly becoming production behaviour) returns; if in a design tool, tokens/components get built twice — the exact trade-off ADR-028 posed was never actually answered for Track A. | Make an explicit ruling and record it as an ADR. Reviewer recommendation: Track A in the production repo, on the real token/component layer, with fixture data structurally isolated (a `/preview` route group + visible "PROTOTYPE" banner satisfying AP-07). Shares Track B's foundation and avoids double-build. |
| **I-4** | **The WBS §1.4 "unresolved conflict" is not really a conflict.** "Track A blocks on nothing" (Approval Package §6) plainly means *no pending architecture decision*; Mockup §20.6 means *business inputs are needed before design*. Compatible statements about different kinds of blocker. | Approval Package §6; Mockup §20.6; WBS §1.4 | Currently freezing Track A behind a formal escalation for something a one-sentence ruling resolves — an instance of the governance machinery over-firing. | Rule it: "the six §20.6 decisions gate Track A design start; the Approval Package sentence refers to architectural blockers only." Update WP 4.1.0. |
| **I-5** | **Status drift between documents.** ADR-007's section heading still reads "(OPEN)" though it is approved; `TECHNOLOGY_STACK.md` §12 lists ADR-011/ADR-012 as "still PROPOSED" while the register lists them DEFERRED; Approval Package §3.2 cites an "OQ-9b" that exists nowhere. | ADR register; Technology Stack; Approval Package | Minor, but the corpus's own consistency obligation (architecture README §6) says drift is a defect. | Sweep once; the register is authoritative. |
| **I-6** | **Candidacy eligibility window is unspecified for V1.** Blueprint J3 says 12 months; the Build Spec's K03 says "the window opens" without a duration; K01 shows a "window countdown". | Blueprint §9 J3; Build Spec §6 | A developer will invent a number. Interacts with the 90-day free-resubmission rule and refund policy (OQ-9). | Add the duration to the Build Spec as a business rule — or to the requirements rows as data (better). |
| **I-7** | **The 17-table model omits entities the architecture requires.** `jobs` (ADR-010), `events` (ADR-024), auth/mapping tables (`auth_identities`), and consent records appear in the architecture docs but not in Build Spec §8. | Build Spec §8; `DATA_ARCHITECTURE.md` D11 | Not a defect — §8 is conceptual — but the first schema proposal should reconcile the two lists explicitly so nothing is "discovered" at RED-gate time. | Note in the eventual schema proposal which tables come from §8 and which from the architecture layer. |

---

## 5. Missing Requirements

The existing documents have already caught most classic gaps (refunds, accommodations, seat offboarding, deletion-vs-permanence). Items marked **★** are new findings not identified anywhere in the corpus.

### Critical

1. ★ **Employer validation has no workstream.** Blueprint Appendix C, item 1: *"Validate the evidence-based premise with 8–10 employer interviews… Do it before writing code."* Mockup §20.3 #8 calls the two-sided cold start critical and says the employer side must be solved "first and manually." G2 requires ≥3 named employers. Yet the WBS has workstreams for authoring (4.3) and assessor recruitment (4.3.10) but **no work package anywhere for employer interviews, advisory board, or recognition commitments**. This is the single most dangerous omission in the execution plan, because it is the failure condition ("zero employer recognition after 6 months → the thesis is wrong") with the longest lead time.
2. ★ **BR-1 structurally excludes the founder from assessing the pilot cohort.** BR-1: an assessor cannot evaluate a submission from a cohort they instructed. At pilot, the founder is the (only) instructor of the (only) cohort. Therefore the most qualified assessor for this credential can assess **zero** of the first ~25 artifacts, and the entire pilot assessment load lands on 2–4 newly calibrated external assessors inside a 10-working-day published SLA. The documents state BR-1 and state the assessor plan, but never state this consequence. It changes assessor recruitment from "important" to "the pilot fails without it," and should reshape WP 4.3.10 (recruit early enough to calibrate *before* the cohort's artifacts land, and consider a second instructor for cohort one so the founder can assess).
3. ★ **Two-person revocation is unsatisfiable in V1 — meaning no revocation path exists at all.** BR-3 requires two authorised people; V1 has one platform admin. The docs defer the revocation *UI* and say the rule "must not be violated by any manual path" — the logical consequence is that if a pilot integrity incident occurs (plagiarised artifact discovered post-award), there is **no compliant way to revoke**, on a product whose verification page advertises a "Revoked" status. Decide now: either name a second authorised person (an assessor can hold the role), or record an explicit interim exception with owner sign-off.
4. **Refund/cancellation/withdrawal policy (OQ-9)** — already identified, still unanswered, legally required; blocks commerce design and P99/K03 content.
5. **Accommodations policy and owner (OQ-15)** — already identified as "the most serious omission"; still has no owner or published policy.
6. **Verified HRD Corp/e-TRIS checklist (OQ-8)** — `O10` is the commercial closer and is still specified from general knowledge. Getting this wrong in front of the first corporate buyer is worse than not shipping it.

### Important

7. ★ **"10 working days" has no defined calendar.** The SLA is publicly displayed with a live countdown. Working days by which calendar — Malaysian public holidays? Whose timezone? A published contractual promise computed by code; define it.
8. ★ **The RAG tutor needs an embeddings provider that no document names.** ADR-013 routes *generation* through one function, but embedding the corpus and queries is a separate model/API (the named LLM vendor does not provide embeddings; typical stacks add a third-party or local model). An additional external service with its own DPA/residency/AP-12 implications, invisible in `INTEGRATION_ARCHITECTURE.md`.
9. ★ **Assessor calibration uses published answer keys.** BR-12 approves assessors by "independently grading the three exemplars and matching the published outcome" — but those exemplars are published on `P15` *labelled* Competent/Proficient/Distinguished. The calibration instrument's answers are public. Hold back an unpublished fourth artifact, or grade the exemplars before publishing them.
10. ★ **Account linking**: Google sign-in and email/password with the same address is the most common auth edge case and is unspecified. Decide before Milestone 2 (auto-link on verified email is the usual answer; it has security implications worth one paragraph).
11. ★ **Assessor unavailability mid-review**: assignment is manual, but reassignment of a claimed submission (assessor ill, conflict discovered late) has no defined state transition. One state-machine arrow, decided now, avoids an audit-log mess later.
12. **Seat offboarding** (Mockup §20.1 #2): identified, but the designed answer (`O02b`) is not in the 44-screen V1 scope while the promise ("credentials leave with the employee") *is* public V1 copy. A policy + manual admin operation is acceptable for V1 — but write the policy.
13. ★ **Consent records** have no entity: evidence-link consent (P16), holder name/photo consent, marketing consent. PDPA needs provable consent capture; add a conceptual `consents` entity.

### Recommended

14. ★ **Payment webhook event log**: IP-2/IP-3 require reconciliation after outages; storing raw provider events (not just derived order state) is what makes reconciliation possible. One table.
15. **Time-zone display** for exam windows, SLA countdowns, cohort sessions (regional audience is explicit).
16. ✅ **RESOLVED 2026-09-02 — the recommendation below was taken.** The founder relocated the folder to `/Users/mustafaqizilbash/Documents/GitHub/ReferenceMaterial`, outside the repository; it is now reached read-only via the `reference-material` MCP server (see [`../REFERENCE_MATERIAL_ACCESS.md`](../REFERENCE_MATERIAL_ACCESS.md)). The accidental-bulk-stage risk is structurally eliminated. Original finding: ★ **`Reference Material/` contains what appears to be client-confidential third-party material** (Petronas CLASS documents, DAMA/CDMP PDFs) sitting untracked in the repo. The owner has directed it not be gitignored — respected — but the standing risk is that it is one accidental bulk-stage away from a confidentiality incident, with the ban on `git add .` as the only control. Consider relocating it outside the repository entirely (a decision, not an action).

### Optional

17. Bulk verification, verification API, low-bandwidth mode, cohort peer groups — already correctly triaged to P2 in Mockup §20.1.

---

## 6. Architecture Concerns

| # | Issue | Why it matters | Long-term risk | Recommendation |
|---|---|---|---|---|
| **A-1** | **Governance mass vs. team of one.** ~10 of 24 documents, and AP-09/AP-12's mandatory artifacts (twelve-row cost tables, eight-check free-tier tests, per-package approval *at the moment of installation*, three-state doc registers) constitute a change-control regime heavier than most enterprises run — operated by one person and an AI. The entire architecture layer was produced in one day (2026-08-30), which proves the analysis can be fast; but the *per-action* gates bite during implementation, when Milestone 1 alone enumerates five separate authorisation moments for a hello-world slice. | The failure mode is not chaos — the guardrails prevent that — it is **velocity collapse and owner fatigue**, where the governance becomes the project. The spec's own 14–18-week estimate assumed a team that ships, not one that requests permission per npm package. | Meta-work crowds out the real critical path (authoring, assessors, employers), which no document gates and every document says matters most. | Keep the constitution; **batch the ceremony**. Approve packages and RED-gates *per accepted milestone plan* (the plan already enumerates them — Milestone 1 §5 lists the exact pinned set), so one authorisation covers one milestone's enumerated actions. Preserves every boundary while cutting approval round-trips ~5×. |
| **A-2** | **Dual-track duplication and fixture contamination.** With Track A's medium undefined (I-3), the two most likely outcomes are building the token/component layer twice, or Track A fixtures cohabiting with Track B's real persistence in one repo. ADR-028's retained warning — fixtures quietly becoming production behaviour — is the exact hazard, and AP-07 is the control, but only if the isolation structure is designed, not assumed. | The four Track A screens (P06/K06/K08/P16) are the product's argument; the temptation to "just wire them up" into Track B's real stack will be constant. | Silent mock logic in production paths — the precise thing Guardrails §49 exists to prevent. | Resolve I-3 with a structural rule: fixture data enters only via a clearly bounded prototype module/route group that production code cannot import. Make "no import from `/preview`" a lint rule, same as module boundaries. |
| **A-3** | **Better Auth's condition 4 is the weak point of ADR-006.** The analysis is honest and the mapping pattern makes the choice reversible, but "subscribe to the advisory feed and treat security updates as priority work" is a standing operational commitment assigned to a solo founder whose binding constraint is already time. 20 advisories in ~18 months means this fires roughly monthly. | If patching slips — and on this team it will slip during cohort delivery weeks — the sign-in path of a trust product runs known-vulnerable. The analysis itself says: if condition 4 cannot be met, Clerk is the better choice. | An unpatched auth CVE on a credential platform is a reputational event, not a bug. | Answer condition 4 honestly *as a capacity question* before choosing. If the answer is "probably not during cohorts," take Clerk (verify the two open facts: card requirement, hash-export algorithm) and accept the SSO cost cliff as a known, dated trigger — AP-12 itself says security may outweigh cost. Either choice is defensible; choosing Better Auth *without* genuinely committing to condition 4 is the only wrong outcome. |
| **A-4** | **Verification-page availability claim vs. one deployable.** Security/Integration docs say the verification page "must stay up when the app is degraded," but it ships in the same deploy. ISR/CDN caching makes this *mostly* true; it is not an availability boundary. | An employer hitting a 500 on a verification URL during an outage is a first-impression failure. | Low — but the claim should match the architecture. | Keep one deployable (AP-01/AP-11 are right); ensure the verification route is statically cached with a long stale-while-revalidate window, and word the claim as "cached and served from CDN," not "independent." |
| **A-5** | **Schedule realism.** 14–18 weeks (1–2 devs) was estimated before: dual-track, the walking-skeleton milestone, the approval cadence, and the fact that Phase 5's exit criterion ("on production") pulls the entire Production Readiness chain (residency verification → hosting → backups → rehearsed restore) into Phase 1B. | Expectations set by the spec will be missed for structural reasons, not execution ones. | Morale/credibility with the project's own plan. | Re-baseline the timeline once ADR-006 and the Track A ruling land; treat 14–18 weeks as the *engineering* estimate and add the governance and production-readiness overhead explicitly. |

---

## 7. Security Decisions Required Before Development

`SECURITY_ARCHITECTURE.md` already enumerates most of these; consolidated, with additions ★:

1. **ADR-006** (B1/B2/B3) — the sign-in path. Blocks Milestone 2.
2. **MFA scope for V1 admins (OQ-14)** — with one admin holding every privileged role, admin-account compromise is total compromise. Recommendation: yes, mandatory, decide now (it also constrains ADR-006).
3. ★ **Revocation path with one admin** (§5 item 3) — name a second authorised person or record an exception.
4. **Residency verification plan (ADR-032)** — the *sequencing rule* is approved; assign the seven verification inputs an owner and a date, or they will still be open at first deployment.
5. **AI DPA + no-training term (OQ-4)** — ★ extended to the *embeddings* provider, which is currently unidentified.
6. **Audit scope (OQ-16)** — recommend extending V1 audit to payments, seat changes, and data-subject requests; the cost is one shared guard being built anyway.
7. **Deletion vs. permanence policy (OQ-12)** and **retention durations** (Data Architecture §7.1 — every duration is currently an assumption).
8. ★ **Rate-limiting posture for public surfaces** — the anonymous diagnostic, verification pages (enumeration/scraping is noted), and especially the tutor (per-user limits are `[SPEC]` but no mechanism is approved, and Redis is excluded; decide the Postgres/platform mechanism before M8).
9. ★ **Account-linking policy** (§5 item 10).
10. **Pen-test timing (OQ-17)** — Blueprint says before enterprise sales conversations; put a date on it relative to Phase 1C.

None of these blocks Milestone 1. Items 1–3 block Milestone 2; the rest block their named modules.

---

## 8. Database & Data Model Gaps

The conceptual model is strong: append-only assertions, immutable responses, same-transaction audit, requirements-as-data, tenancy from commit one are all correct and are the expensive-to-reverse shapes. Gaps to close in the first schema proposal:

1. **`consents`** — evidence-link consent, profile-visibility consent, marketing. Missing entirely.
2. **`auth_identities`** — specified in Decision B, absent from the Build Spec's table list; reconcile (I-7).
3. **Payment/webhook event log** — store raw provider events for reconciliation; "our records are authoritative" requires the inputs to re-derive them.
4. **Candidacy state machine completeness** — add the eligibility-window duration (I-6), the resubmission counter (one free within 90 days needs enforcement data), and the withdrawal state that OQ-9 will create.
5. **Credential status transitions** — `suspended`/`revoked` render on `P16`; with revocation UI deferred, define which transitions are possible in V1 and by what path.
6. **Brief-variant assignment provenance** — round-robin assignment should be recorded (variant on `submissions` suffices; confirm).
7. **`jobs` / `events`** — present in architecture docs, absent from Build Spec §8; harmonise.
8. **Retention** — every duration in Data Architecture §7.1 needs a human decision before the deletion feature (`S06`) is built; the schema (soft-delete vs anonymise columns) depends on OQ-12's answer.

No unnecessary entities were found — the "explicitly NOT in the model" list (Build Spec §8) is correct and admirably restrained.

---

## 9. Implementation Readiness Assessment

| Area | Status | Notes |
|---|---|---|
| Architecture principles & shape (monolith, Postgres, RBAC, immutability, jobs) | 🟢 READY | Approved, internally consistent, correctly sized |
| Milestone 1 (walking skeleton) | 🟢 READY | No architectural blocker; awaiting execution authorisation only |
| Testing philosophy & tooling | 🟢 READY | ADR-038/025 approved; Tier-1 workflow set is the right list |
| Expert authoring workstream (skills, items, brief, rubric, exemplars, articles) | 🟢 READY | Blocks on nothing; is the real critical path; start it |
| Content & learning module (M3) | 🟢 READY | Provider-neutral video reference resolves the deferred vendor cleanly |
| Identity & auth (M1) | 🟡 PARTIALLY READY | ADR-006 undecided; account-linking and MFA scope open |
| Skills & diagnostic (M2) | 🟢 READY | Flat list + fixed diagnostic well specified |
| Assessment (M5) | 🟡 PARTIALLY READY | ADR-021 (exam clock) analysed but unreviewed; OQ-11 autosave window; SLA calendar undefined (★) |
| Evidence & assessor workflow (M6) — *the product* | 🟡 PARTIALLY READY | Screens/workflow well specified; calibration validity (★), assessor reassignment (★), appeal stance (I-2), and the BR-1/founder collision (★) need answers |
| Credentials & verification (M7) | 🟡 PARTIALLY READY | ADR-039 settles identity; blocked by naming/domain (OQ-5), revocation path (★), OQ-12 |
| AI tutor (M8) | 🟡 PARTIALLY READY | Corpus-first sequencing correct; embeddings provider unidentified (★); rate-limit mechanism undecided |
| Corporate & HRD Corp (M9) | 🔴 NOT READY | `O10` explicitly built on unverified scheme knowledge (OQ-8) — verify before designing, not after |
| Commerce & payments | 🔴 NOT READY | OQ-2 (rail/entity/invoice-vs-rail), OQ-9 (refunds), tax treatment — all open, all legally load-bearing |
| Track A (product validation) | 🔴 NOT READY | Medium undefined (I-3); gated on the six §20.6 business decisions and the §1.4 ruling |
| Production readiness chain | 🔴 NOT READY (by design) | Correctly sequenced behind residency verification; needs an owner and date |
| Employer validation | 🔴 NOT READY | **Does not exist as planned work** (§5 item 1) |

---

## 10. Overengineering Risks

1. **The approval cadence itself** (A-1). The boundaries are right; the *granularity* is wrong for the team size. Batch to milestone-scoped authorisations.
2. **Full 8-step framework + twelve-row tables for low-stakes choices.** The framework's own Standing Rule 1 says it is disproportionate for trivial decisions — apply that clause. The Colima runtime analysis, which itself concludes "low-consequence, easily reversed… should not be over-engineered," took several pages to say so.
3. **The WBS** is an excellent orientation document already showing the cost of its own fidelity (per §15.1 it must be updated on every state change — a standing tax). Keep §1 (Current Position) religiously current; let the rest lag deliberately.
4. **The §1.4 formal conflict** for a resolvable ambiguity (I-4) — escalation machinery consuming a decision a sentence resolves.
5. Not overengineering: the Retrofit-Test columns, staging, the three environments, append-only evidence — these all pass AP-11's own exception clause correctly.

## 11. Underengineering Risks

1. **Employer-side validation** — no plan at all (§5 item 1). The one that kills the thesis silently.
2. **Assessment operations design** — SLA calendar, reassignment, founder-exclusion math, calibration validity. The *software* for M6 is well specified; the *operation* of it is under-designed relative to how publicly the SLA is promised.
3. **Track A definition** — a validation track with unresolved medium and no defined budget of fidelity.
4. **Recourse/complaints** on a trust product in V1 (I-2).
5. **Documentation baseline not in git** — the WBS's own finding: the entire frozen baseline exists only in the working tree. A one-authorisation fix; do it first.

---

## 12. Prioritised Action Plan

### 🔴 Phase 1 — Must resolve before coding (before Milestone 1 authorisation or immediately alongside)

1. **Commit the documentation baseline** (WP 1.4) — the frozen baseline is currently one disk failure from gone.
2. **Rule on Track A's medium** (I-3) and the §1.4 start condition (I-4) — one ADR, one sentence each.
3. **Decide ADR-006** (B1/B2/B3) — answering condition 4 as a capacity question (A-3).
4. **Add an employer-validation workstream** to the WBS (8–10 interviews, target: 3 named recognitions) and start it in parallel with authoring — it has the longest lead time of anything in the project.
5. **Resolve the BR-1/founder collision** in the assessor plan (second instructor for cohort 1, or accept founder-cannot-assess and size recruitment accordingly).
6. **Start Workstream 4.3 (expert authoring)** — it blocks on nothing and gates everything.

### 🟠 Phase 2 — Strongly recommended before coding the affected modules

7. The six Mockup §20.6 business decisions (naming and pricing first — naming gates Track A, both have architectural surface via ADR-039 and commerce).
8. OQ-9 refunds, OQ-15 accommodations, revocation interim path (★), account-linking policy (★).
9. Verify HRD Corp/e-TRIS against current rules (OQ-8) **before** `O10` design.
10. Batch-approval process change (A-1): approvals per accepted milestone plan.
11. Confirm the ten CONF resolutions formally (three are already implicitly settled).
12. Identify the embeddings provider (★) and fold it into ADR-013's scope with its own DPA check.

### 🟡 Phase 3 — Can be decided during development (at their recorded triggers)

13. ADR-021 review (before M5), OQ-11 autosave window, SLA calendar (★, before K07 copy), OQ-16 audit scope, OQ-3 sending domain, OQ-13 live-session tooling, consent entity design, webhook event log.
14. Residency verification (before any production provisioning), then hosting/DB host/object storage as the already-coupled bundle.
15. Retention durations and OQ-12 before building `S06` deletion.

### 🟢 Phase 4 — Future considerations

16. Everything in the deferred register — correctly triaged; nothing needs pulling forward. Appeals return with the pilot roster (I-2). OB 3.0/VCs at 1C if cheap. Documentation-drift sweep (I-5) at the next baseline touch.

---

## 13. Final Verdict

### **MOSTLY READY — minor gaps should be addressed first.**

The architecture is ready — genuinely. The stack decisions are sound and correctly sized, the expensive-to-reverse shapes are identified and protected, the conflicts between vision and MVP are resolved in the right direction with the destinations preserved, and the testing philosophy makes the product's invisible guarantees provable. **No architectural decision in the corpus warrants reversal.** Milestone 1 could be authorised today.

What stands between "mostly ready" and "ready" is not engineering:

1. **Three business-decision clusters** the documents themselves flag but have not closed: ADR-006 authentication, the six Mockup §20.6 product decisions, and the legally required policies (refunds, accommodations).
2. **One planning hole**: Track A's undefined medium.
3. **Three findings this review adds**: the missing employer-validation workstream, the BR-1/founder assessment collision, and the V1 revocation impossibility — plus smaller ones (SLA calendar, embeddings provider, calibration validity) that should enter the open-questions register.
4. **One safety action**: commit the baseline.

**What must happen next, in order:** commit `docs/` (one authorisation) → rule on Track A's medium and start condition → decide ADR-006 → add and start the employer workstream → start expert authoring → authorise Milestone 1. Everything else lands at its recorded trigger — the register already built is precisely what makes that safe.

The most important thing to protect moving into execution is stated in the project's own Build Spec: **the constraint is not code.** The documentation is now better than it needs to be; the rubric, the exemplars, the assessors, and the employers are not yet what they need to be. Spend accordingly.

---

*End of review record. This document is advisory. It changes no ADR status, resolves no open question, and authorises no action. New findings (★) should be triaged by the owner into the open-questions register and the WBS through the normal governance path.*
