# policy — DR-06 The Free Assessment Check (200 questions, 3 hours, grades)

| Field | Value |
|---|---|
| Category | business |
| Kind | policy |
| Source of truth | `DR-06_FREE_ASSESSMENT_CHECK.md` (repository root) |
| Owner | founder |
| Version / date | Approved 2026-09-30 |
| Status | approved (page name part superseded by DR-07) |
| Related | DR-01, DR-03, DR-04, DR-05, DR-07, `definition-credential-and-certificates`, `definition-glossary` |

## Purpose
Records the free attempt as a single rigorous assessment with graded outcomes (Charlie, Bravo, Alpha).

## Description
- **Decision.**
  - Name: "The Free Assessment Check" (internal table, module and `KC-` ID names are not renamed).
  - One test of 200 questions drawn at random from the whole reviewed bank (3,800+), a fresh draw per attempt; the 50 and 100 options are retired.
  - Three hours, server-enforced; at time-up the attempt is scored as it stands; at most one running test per person.
  - Pass mark 60 % for new attempts, percentage rounded down and banded: Charlie 60-70 % (120-141 of 200), Bravo 71-80 % (142-161), Alpha 81-100 % (162-200); below 60 % is not passed. Grade is derived, never stored.
  - A pass earns the Certificate of Achievement (DR-05) with a grade line, valid one year, revocable, verifiable at `/verify/<ID>`; still not a Certificate of Completion or the earned credential.
  - Attempt stays free; viewing/printing stays behind the review plus unlock fee (USD 10 default, Pakistan exempt, admin-switchable).
  - Existing results stay as issued and verifiable.
  - HRD wording: claims are for Malaysian citizens and normally made through an employer registered with HRD Corp; the rule against calling anything "HRD Corp Claimable / Registered" without that status is unchanged.
- **Date approved.** 2026-09-30 (change round M16; assumptions confirmed the same day).
- **Amends.** DR-03 §2.4 and §3 (sizes and pass mark); builds on DR-05; DR-04 and DR-01 unchanged. The header's "Free Certifications" page name was later superseded by DR-07.
- **Not decided.** Renewal of an expired certificate; whether the credential-integrity policy describes grades; a "no repeated questions" fairness rule.
- **Plain words.** One free 200-question, 3-hour test; pass at 60 % and receive a grade.

## Change history
- 2026-09-30 approved.
- 2026-10-01 page name superseded by DR-07.
- 2026-10-02 this metadata file written from the source.
