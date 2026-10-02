# definition — Business glossary

| Field | Value |
|---|---|
| Category | business |
| Kind | definition |
| Source of truth | the decision records and specifications named per term |
| Owner | founder |
| Version / date | as of 2026-10-02 |
| Status | draft |
| Related | `policy-dr-01` to `policy-dr-08`, `definition-credential-and-certificates`, `policy-terms` |

## Purpose
Gives one place to look up the business terms used across the decision records and specifications. It records meanings stated in the sources; it does not define new ones.

## Description
| Term | Meaning as the sources use it | Source |
|---|---|---|
| Training | The market-facing, expert-led unit of the product, as used in the site and the Terms ("an expert-led Data & AI Academy training"). Site-wide wording adopted 2026-09-27 (UX review U2, per legal file comments). | `src/content/legal/terms.ts` §2; legal file headers |
| Course | Word adopted by DR-02 Amendment A1 (2026-09-02) for the unit formerly called "programme"; it changes the word, not the model. Later site wording is "Training". | DR-02 A1 |
| Programme | The original DR-02 term for the unit of the product (programme, scheduled offering/cohort, session, supporting materials); retired as vocabulary by A1 (the model is unchanged). | DR-02 §4, A1 |
| Format | A pace/delivery format of a training (for example live online, face-to-face, private cohort); administrators declare formats and schedule dates under them. A format is identified by its name. | DR-02 §2; DR-08; Terms §2 |
| Offering | A scheduled delivery of a training with a start date, a format and a trainer. | Terms §2 |
| Registration | A person's booked place on a particular offering. | Terms §2 |
| Interest registration | Paid (USD 2 default, non-refundable, not a seat) expression of interest in a format with no open date; confirmed only by the verified payment webhook; free for participants in Pakistan. | DR-08 |
| Expert-led delivery | Face-to-face, live online, corporate/private, international/on-site; the core experience. Live online is not video. | DR-02 §2 |
| Free Learning | Free self-paced reading and topic self-checks from the founder's book *I Am Datapedia!*; no account needed; stores nothing about the reader. | DR-03 |
| Knowledge Check | The original name (DR-03) of the free account-holder test; its result is a verifiable ID but not a credential. Visible wording renamed to Free Assessment Check by DR-06; internal names and the `KC-` ID prefix are kept. | DR-03, DR-06 |
| Free Assessment Check | The current free attempt: 200 questions, 3 hours, 60 % pass mark, grades Charlie/Bravo/Alpha. | DR-06 |
| Assessment (page) | The page/menu formerly "Free Certifications", at `/assessment`, a gateway with three persona cards. Not the same as the Free Assessment Check, which is one of its tests. | DR-07 |
| Knowledge Check vs Assessment | Knowledge Check = the free test (old name, DR-03); Assessment = the page that now hosts it and two other persona tests (DR-07). | DR-03, DR-06, DR-07 |
| Credential / Certificate of Completion | See `definition-credential-and-certificates`. | DR-01, DR-03 |
| Certificate of Achievement | Document for a passed free check; not the credential. | DR-05 |
| Personas (Assessment page) | Learners ("Assess your Data Foundation"), job seekers ("Prepare for Interview"), organisations ("Interview Screening"). | DR-07 §1.2 |
| `org_admin` / "Organisation" | The existing `org_admin` role, shown to people as "Organisation"; granted by an administrator; has an Organisation Dashboard at `/organisation`. | DR-07 §1.3, §4.3 |
| Organisation (type) | A published organisation of type Company or Education sector that screens candidates; first one is YPT (Your Partner Technologies). | DR-07 §4.2 |
| Trainer | A role granted by an administrator; sees their own trainings and interest. | DR-07, DR-08 |
| HRD Corp claim note | Wording that HRD Corp claims are for Malaysian citizens and normally made through an employer registered with HRD Corp; nothing may be called "HRD Corp Claimable / Registered" without that status. | DR-06 §2.8 |
| Artifact, rubric | The applied deliverable and the published 5 criteria x 4 levels rubric behind the credential. | DR-01 |
| "Academy" | Working-name placeholder, not final; naming tracked as WBS 4.4.1. | DR-02 §10 |
| Supporting materials | Materials that prepare, extend, reinforce or document expert-led delivery; must not silently replace it. | DR-02 (A-4, §5) |

## Change history
- 2026-10-02 written from the sources. Terms not determined from the source: a precise definition of "programme" in the current site, and the full list of format names.
