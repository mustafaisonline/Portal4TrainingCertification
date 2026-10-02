# policy — DR-07 "Assessment" Page and Its Three Personas

| Field | Value |
|---|---|
| Category | business |
| Kind | policy |
| Source of truth | `DR-07_ASSESSMENT_PERSONAS.md` (repository root) |
| Owner | founder |
| Version / date | Approved 2026-10-01 |
| Status | approved |
| Related | **supersedes DR-04**; DR-05, DR-06 (unchanged except page name), DR-08, `definition-glossary`, CR-2026-10-01-1711 |

## Purpose
Records the rename of the free-product page to "Assessment" and its three persona entry points, plus the Organisation role.

## Description
- **Decision.**
  - Name: "Free Certifications" becomes "Assessment" everywhere (header, footer, mobile menu, Home card, search, admin labels, documents), at `/assessment`; old addresses redirect permanently (308).
  - Three personas: learners ("Assess your Data Foundation", the DR-06 Free Assessment Check unchanged); job seekers ("Prepare for Interview", per-role interview self-assessment, free, account required, no certificate, no pass mark, 90 minutes, up to 100 questions drawn from a role bank of 100 original questions with model answers, only administrator-reviewed questions served); organisations ("Interview Screening", for companies and education institutions, requiring the candidate to confirm the result is shared with that organisation; the organisation sees only its own candidates).
  - The existing `org_admin` role is shown as "Organisation", granted by an administrator, with an Organisation Dashboard at `/organisation` (tabs Overview, Roles, Questions, Results; organisation questions pending until administrator approval).
  - Every footer link also appears in the header burger menu.
- **Date approved.** 2026-10-01 (change request CR-2026-10-01-1711).
- **Supersedes.** DR-04 §2.1 (the page name) and the DR-06 header statement about the page name and address. The rest of DR-05 and DR-06 stands.
- **Data.** Additive migration (6 tables, 2 enums); shown to the founder before production.
- **Binding effect.** Built in dev at the time of the record; DR-01 unchanged. Résumé/job-description scoring is on hold (nothing built).
- **Plain words.** The free assessment page is now "Assessment", with one card each for learners, job seekers and organisations.

## Change history
- 2026-10-01 approved (P0-P4 built in dev).
- 2026-10-02 this metadata file written from the source. Current deployment state not determined from the source.
