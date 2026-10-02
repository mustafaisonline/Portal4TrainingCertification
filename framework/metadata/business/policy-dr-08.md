# policy — DR-08 Register Your Interest and the Formats / Users Interest Tabs

| Field | Value |
|---|---|
| Category | business |
| Kind | policy |
| Source of truth | `DR-08_TRAINING_INTEREST_REGISTRATION.md` (repository root) |
| Owner | founder |
| Version / date | Approved 2026-10-01 |
| Status | approved |
| Related | DR-02, DR-03 §3, CR-2026-10-01-2138, `policy-terms`, `policy-privacy`, `policy-refund`, `definition-glossary` |

## Purpose
Records how a person can register paid interest in a training format that has no open date, and the tabs administrators and trainers use to see it.

## Description
- **Decision.**
  - Formats tab (`/admin/formats`) for Administrators and Trainers, showing formats, dates scheduled and people interested.
  - On a published training, a format with no open date offers "Register your interest - USD 2 (non-refundable)". Signed-in only; email required, name, mobile and date of birth optional, plus a consent tick that the trainer may contact the person.
  - Fee: an administrator-managed, effective-dated, insert-only setting (default USD 2.00, can be switched off), read from the database when an order starts; non-refundable, not credited against the training fee, not a seat.
  - Interest is confirmed only in the verified Stripe webhook transaction; one row per person per format.
  - Participants in Pakistan register interest without the fee.
  - Trainers see interest in their own trainings, administrators all; date of birth is shown only to them and the person. "Users Interest" tab has filters, copy emails, BCC draft, CSV and mark-as-notified; people see "My interests".
  - No email provider (`EMAIL_TRANSPORT=log`): the trainer sends from their own mail app.
  - A format with registered interest cannot be removed or renamed.
- **Date approved.** 2026-10-01 (founder: "go ahead with CR 2").
- **Supersedes.** Nothing. Additive to DR-02 and DR-03 §3.
- **Data.** Additive migration `20261001140339_training_interests` (one enum, one enum value, two tables); production only after the founder has seen the SQL.
- **Open items.** Lawyer review of the drafts mentioning the interest fee; sending from the portal deferred until an email provider is chosen.
- **Plain words.** If no date exists yet, a signed-in person can pay USD 2 (non-refundable, not a seat) to register interest, and the trainer sees the list.

## Change history
- 2026-10-01 approved.
- 2026-10-02 this metadata file written from the source.
