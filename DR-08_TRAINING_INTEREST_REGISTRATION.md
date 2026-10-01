# DECISION RECORD DR-08 — "REGISTER YOUR INTEREST" IN A TRAINING FORMAT, AND THE FORMATS / USERS INTEREST TABS

**Status:** Approved by the founder, 2026-10-01 (change request `CR/CR-2026-10-01-2138-training-formats-and-interest-registration.md`; the founder's instruction *"go ahead with CR 2"*, taking the recommendations to its questions Q1–Q9). Additive to DR-02 (expert-led delivery) and DR-03 §3 (payments here stay small, one-off and honest); it supersedes nothing.

## 1. The decision

1. **Formats tab and card.** Administrators and Trainers have a top-level **Formats** tab (`/admin/formats`) and an overview card on the dashboard: every pace format of the caller's trainings (a Trainer: their own; an administrator: all), with how many dates are scheduled under it and how many people are interested, and direct links to declare/edit formats and to schedule dates. Declaring a format and scheduling it stay where they were (Admin → Trainings → *[training]* → Formats / Dates).
2. **Register your interest.** On a **published** training's page, a format that has **no open scheduled date** offers *"Register your interest — USD 2 (non-refundable)"*. The person must be **signed in**; the form asks for **email (required)**, full name, mobile number and date of birth (optional) and a consent tick that the trainer may contact them. Once a date is open under the format the action disappears and the page points to the dates.
3. **The fee.** An **administrator-managed, effective-dated, insert-only setting** (`/admin/orders/interest`; default **USD 2.00**; can be switched off), read from the database at the moment an order starts — never from the browser. It is **non-refundable**, **not credited** against the training fee, and **not a seat**. Said before the person pays, on Stripe's page name, in the confirmation email, and in the Terms / Refund / Privacy drafts.
4. **Recorded only when paid.** The interest becomes **confirmed only in the verified Stripe webhook's transaction** (same rules as every payment here: signed, idempotent, audited). An unpaid row never counts and is re-used by a retry. **One row per person per format.**
5. **Pakistan.** There is no card route for participants in Pakistan (the local-partner rule), so a participant whose profile country is Pakistan **registers interest without the fee**, immediately, and the row says so.
6. **Who sees it.** Trainers see the people interested in **their own trainings**; administrators see everyone; **date of birth is shown only to them** (and to the person). Tab: **Users Interest** (`/admin/interest`), with filters, **Copy all emails**, a ready-made **BCC email** draft (with the schedule) for one chosen format, a **CSV** download, and **Mark as notified**. The person sees **My interests** in My Trainings.
7. **Email.** The portal has **no email provider** (`EMAIL_TRANSPORT=log`): the trainer sends the message from their own mail app. Real sending from the portal needs an email provider — a new external service — and is a separate approval.
8. **A format people are waiting for cannot be removed.** A format is identified by its name, so removing or renaming a format that has registered interest is refused with an explanation.

## 2. Data (additive; shown to the founder before production)

Migration `20261001140339_training_interests`: one enum (`interest_status`), one enum value (`order_kind.interest`), two tables (`training_interests`, `interest_fee_settings`). Nothing existing is altered or dropped. Applied to the dev and test databases only; **production receives it after the founder has seen the SQL.** Seed: the opening fee row (USD 2.00), create-only.

## 3. What does not change

DR-01 (one credential), DR-05/06 (the Certificate of Achievement and the Free Assessment Check), the registration and refund rules for scheduled dates (the interest fee is outside the cancellation schedule), Stripe as the only payment processor, the audit log, and the scoped Trainer access of the Trainings area.

## 4. Open items

- A lawyer must review the drafts that now mention the interest fee (version `DRAFT-2026-10-01`, folded into the unreleased draft; no new `LEGAL_DOCUMENT_VERSIONS` value is needed beyond the one already planned).
- Sending the announcement from the portal (rather than from the trainer's mail app) is deferred until an email provider is chosen.
