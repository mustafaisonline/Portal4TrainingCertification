# brd.md — Business Requirements Document

> Version 1.0 · 2026-10-02 · **Index-and-trace document.** The approved specifications remain authoritative and are **not** copied or replaced here (`CLAUDE.md`: no new authoritative specification unless instructed). This file organises requirements, says where each is specified, and traces it to milestones.

## 1. Authority order (highest first)
Founder's current instruction → decision records `DR-08` · `DR-07` · `DR-06` · `DR-05` · `DR-04` · `DR-03` · `DR-02` · `DR-01` → the three specifications → architecture docs. Markers `⊘ RETIRED` / `↻ REFRAMED` / `⏸ DEFERRED` in the specifications win over surrounding text. Superseded material is a record, not a requirement.

## 2. Requirement areas

| # | Area | Specified in | Milestones |
|---|---|---|---|
| BR-1 | Organisation identity and expert-led delivery model | `DR-02`, Blueprint | M1–M3 |
| BR-2 | One credential; Certificate of Completion, verification, yearly renewal | `DR-01` (MVP Build Spec), `docs/execution/COMPLETION_CERTIFICATE_REQUIREMENTS.md` | M6, M7 |
| BR-3 | Public portal and course catalogue | MVP Build Spec, Mockup Specification | M3 |
| BR-4 | Identity, access, accounts and profiles | `docs/execution/ACCOUNT_AND_PAYMENT_REQUIREMENTS.md`, `USER_PROFILE_REQUIREMENTS.md` | M2, M5a |
| BR-5 | Registration and payment (Stripe; refund tiers; price by country) | `ACCOUNT_AND_PAYMENT_REQUIREMENTS.md` | M4, M11 |
| BR-6 | Learner reviews | `LEARNER_FEEDBACK_REQUIREMENTS.md` | M5b |
| BR-7 | Administrator and trainer operations; trainings, dates, fees, formats | `ADMIN_REQUIREMENTS.md` | M8, M12 |
| BR-8 | Participant journey: training → dates → payment → My Trainings → attendance → certificate | M13 plan | M13 |
| BR-9 | Free self-paced learning and the free Assessment Check (graded certificates, personas, interview prep, organisation screening) | `DR-03`, `DR-05`, `DR-06`, `DR-07` | M14–M16 |
| BR-10 | Register-your-interest in a training format | `DR-08` | post-M16 (CRs) |
| BR-11 | Production readiness, deployment, backup, launch | `docs/operations/`, `deploy/README.md` | M9–M11 |
| BR-12 | Legal documents (Terms, Privacy incl. Bahasa Malaysia draft, Refund) | MVP Build Spec, CRs 0610 / 0628 | M11, CRs |

## 3. Open and deferred business items
Tracked in `docs/execution/PROJECT_STATUS.md` (numbered founder decisions) and `CR/README.md` (open CRs; email provider deferred). They are not repeated here, to avoid two sources of truth.

## 4. How this file is maintained
New requirement → `br-analyst` adds a BR row (or extends one), links its CR and spec, and flags conflicts with decision records. Business rules are never invented here; ambiguity goes to the founder. Skill: `brd-write`.
