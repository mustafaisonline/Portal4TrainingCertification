# policy — DR-01 One Credential

| Field | Value |
|---|---|
| Category | business |
| Kind | policy |
| Source of truth | `DATA_AI_ACADEMY_MVP_BUILD_SPEC.md` — section "DECISION RECORD DR-01 — ONE CREDENTIAL" (inside the spec, not a root file) |
| Owner | founder |
| Version / date | Accepted 2026-08-30 |
| Status | approved (still in force; unchanged by every later DR) |
| Related | DR-02 (note added 2026-08-31), DR-03 §3, DR-05, DR-06, `definition-credential-and-certificates`, `standard-document-authority-hierarchy` |

## Purpose
Records the decision that the product has exactly one credential, so no document or screen invents levels, bands or a ladder.

## Description
- **Decision.** The functional MVP ships exactly one of each: one pilot domain (Data Foundations, as seeded data, never hardcoded), one learning path, one certification (a single credential definition: no ladder, no levels, no tiers in the product), one practical artifact (one brief, 3 industry variants), one assessment rubric (5 criteria x 4 levels, with 3 real exemplars).
- **Date approved.** Accepted 2026-08-30.
- **Supersedes.** Every prior statement about MVP credential levels: the L1 Foundation / L2 Practitioner statements in the Blueprint (§19.1, §19.2), the MVP Build Spec (§3.3, §13.1, §14) and the Mockup Spec (§20.2). The spec's §1 ("no second credential level") was already correct.
- **Binding effect.** Binding on all three specifications. The governing principle is "Architect for expansion. Build only what needs validation": the schema carries `domain_id`, `level` and `sort_order` populated with a single value and read by nothing; code has no domain literal or level branch; UI renders domain/credential attributes from data; the product shows one domain and one credential, with no switcher, ladder graphic or "coming soon" tiles. Adding domain or credential #2 must be a data operation plus content, not a migration.
- **Plain words.** There is one credential and it always requires evidence. The reasons given: an exam-only level would add a journey that does not test the evidence-based thesis, would give a cheaper route that skips the evidence gate and corrupts the artifact-submission-rate measure, and would put an exam-only certificate under the same brand as an evidence-based one.
- **Later notes.** DR-02 added a note: DR-01 is unchanged, and its "one learning path" row is not a fixed programme count. DR-03, DR-04, DR-05, DR-06, DR-07 each state that DR-01 is unchanged.

## Change history
- 2026-08-30 accepted.
- 2026-08-31 note added by DR-02 (DR-01 itself unchanged).
- 2026-10-02 this metadata file written from the source.
