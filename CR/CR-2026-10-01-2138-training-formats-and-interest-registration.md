# CR-2026-10-01-2138 — Formats tab for trainers/admin + "Register your interest" (USD 2) with a "Users Interest" tab

**Received:** 2026-10-01 21:38 MYT · **Status:** BUILT & VERIFIED in dev/test (F1–F6), **uncommitted; the migration SQL awaits the founder's approval before production** — founder said "go ahead with CR 2" (recommendations to Q1–Q9 taken as answered) · **Requested by:** founder

## 1. Request (verbatim)

> * On Accounts page, we need to introduce Formats card and tab for it as well. Aim is
>    * Trainer should be able to create Training (already there)
>    * Trainer should be able to declare formats of the training (missing)
>    * Trainer should be able to Schedule the training based on formats for bootcamp, 1 week (2 hours a day) 2 week (2 hours a day), in fact time of formats (already there)
>    * Please implement this feature in all the relevant places in the portal
>    * Admin should also have relevant tab etc.
> * Based on new feature to give capability to training to create formats, once trainer create these format, we need to enable this visibility to end users to registers their interest for the training by paying non-refundable USD2 to show their interest that they are interested in this training for this format. Now Trainer will have a new tab: Users Interest to see interested candidates. User will fill a small form as well with email (compulsory) and Full name, Mobile number, DOB. to show interest for a particular training and format. Using this detail, Trainer can plan a training. Now when training and particular format is created. Trainer should email to all these interested people about the schedule and ask them to register for the training on the portal. Admin should also have a tab to see these details.

## 2. My understanding and what exists today

**What exists (verified in the code):**
- A training already has **formats** (`delivery_formats`: code, name, badge, duration, schedule, total time, "best for") managed at **Admin → Trainings → [training] → Formats**, and **dates** (scheduled offerings per format) at **… → Dates**; trainers see only their own trainings (Milestone 12). The public training page already shows each format's timeline.
- So "declare formats" **is built per training** — but there is **no top-level Formats place** in the admin/trainer area (the admin bar is Overview · Trainings · Offerings · Attendance · Orders · Coupons · Enquiries · …), and nothing links formats to people.
- Payments: Stripe hosted Checkout with idempotent webhooks; order kinds today are registration, certificate renewal, support, and the Assessment unlock. **There is no interest record, no interest fee, and the portal sends no real email** (`EMAIL_TRANSPORT=log`; no email provider is configured).

**What you want (my reading):**

| # | Piece | Reading |
|---|---|---|
| **F1** | **Formats card + tab** | A **"Formats" tab** in the admin/trainer navigation and a **card on the dashboard overview**: all formats across the person's trainings (a trainer sees their own; the admin sees all), each showing training, format name/duration/schedule, how many **dates are scheduled** and how many **interested people**, with direct links to create/edit the format and to schedule it (the existing tabs). The per-training Formats and Dates tabs stay |
| **F2** | **Register interest** (public) | On a training's page, each **format** gets a **"Register your interest — USD 2 (non-refundable)"** action. The person fills a small form — **email (required)**, full name, mobile number, date of birth (optional) — pays **USD 2** by Stripe Checkout, and the interest is recorded **only after Stripe confirms** the payment (the same rule as every other payment here). Non-refundable, said plainly before paying |
| **F3** | **"Users Interest" tab** (trainer + admin) | A tab listing, per training and format: name, email, mobile, DOB, paid date, notified or not. A trainer sees interest for **their own** trainings; the administrator sees **all**. Filters by training/format; counts feed the Formats card |
| **F4** | **Telling interested people** | When the trainer has created the training + format and scheduled it, the trainer **emails everyone interested** with the schedule and asks them to register on the portal. Because the portal **cannot send email yet**, the tab gives: **"Copy all emails"**, **"Open an email to all (BCC)"** with a ready-made message (schedule, price, link to register), a **CSV export**, and a per-person / bulk **"Mark as notified"**. Real sending from the portal needs an email provider (a new external service — separate approval) |
| **F5** | **"My interests"** (person) | In the person's account (My Trainings), the formats they registered interest in, and whether they have been told a date |

**Out of scope unless you say so:** crediting the USD 2 against the later fee (you said non-refundable; no credit assumed); sending real emails from the portal; interest for trainings with no formats.

## 3. Questions (recommendations in *italics*)

1. **Q1 — Where is the missing "Formats card and tab"?** Per-training Formats exists (Admin → Trainings → a training → Formats). *I read it as a top-level **Formats** tab + an overview card across all trainings (F1). Is that it, or is something in the per-training Formats screen not working for you?*
2. **Q2 — Account required?** *Recommended: **yes — the person must be signed in** (payment, receipt in Orders & receipts, no spam); the form is pre-filled from their profile and editable; **email required**, name/mobile/DOB optional, with a consent tick ("the trainer may contact me about this training").* If you want non-account visitors to register interest too, that needs a separate guest-payment flow (more work and more risk).
3. **Q3 — When is the button shown?** *Recommended: for a **published training format that has no open scheduled date** (once a date exists they register for the training normally).* Or always?
4. **Q4 — Pakistan.** Card payment is not available in Pakistan (local partner rule). *Recommended: a Pakistan participant **registers interest free of charge** (no card route), clearly marked; alternatives: treat as unavailable, or the local partner collects USD 2.* Your call.
5. **Q5 — The fee.** *Recommended: **USD 2 as an administrator-managed setting with history** (like the Assessment unlock fee), default **USD 2**, can be switched off; **non-refundable** wording on the button, the payment page and in the Terms/Refund draft.* OK?
6. **Q6 — Duplicates.** *Recommended: **one paid interest per person per format**; a second attempt says "you have already registered your interest".*
7. **Q7 — Email.** *Recommended as F4 now (copy / BCC draft / CSV / "Mark as notified"); add real sending later when you choose an email provider.* Confirm.
8. **Q8 — Privacy.** A trainer will see a candidate's email, mobile and date of birth. *Recommended: show DOB only to the administrator and the trainer of that training; the Privacy draft is updated (what is collected, who sees it, why) and re-versioned; the form states it.* OK?
9. **Q9 — Credit.** Does the USD 2 reduce the training fee later? *Assumed: **no** (non-refundable, no credit).*

## 4. Plan — phases (each on the founder's "go"; the schema/payment phases are RED gates — SQL shown first)

| Phase | What | Needs | Schema / payment? |
|---|---|---|---|
| **F1** | Top-level **Formats** tab (trainer + admin) + overview card; counts of dates and interests (interest count shows 0 until F3) | Q1 | No |
| **F2** | **Interest** data and payment: `training_interests` table, an `interest` order kind, an administrator-managed `interest_fee_settings` (USD 2), checkout + webhook handling (record only after Stripe confirms), duplicate rule, Pakistan rule | Q2–Q6 | **YES — schema + payment logic (RED gate)** |
| **F3** | **Public flow**: the button on each eligible format, the form (email required; name, mobile, DOB optional; consent), Stripe, return/thank-you pages, "already registered" | F2 | — |
| **F4** | **Users Interest** tab for trainer and admin (scoped), filters, copy emails, BCC email draft with schedule text, CSV, mark notified; **admin Interest overview** | F2, Q7, Q8 | — |
| **F5** | **My interests** in the person's account | F2 | — |
| **F6** | Docs & legal: DR-08, Terms/Refund/Privacy drafts (non-refundable fee; data shared with the trainer), FAQ, help text, tests, CR close-out | after F2–F5 | — |

**Schema sketch (for approval at F2 — nothing is changed now):** `training_interests` (programme, delivery format, user, order [unique], email, full name?, mobile?, date of birth?, consent flag, status `pending | paid | expired`, notified_at?, created_at) · enum value `interest` on `order_kind` · `interest_fee_settings` (enabled, amount_minor, currency, label, effective_from, created_by — history, like the unlock-fee setting). All additive. A record becomes `paid` **only** in the verified-webhook transaction; duplicate webhooks are no-ops (the existing rule).

## 5. Tracker

| # | Step | Status | Updated |
|---|---|---|---|
| 0 | CR written; existing formats/dates/payments/email surveyed | **DONE** | 2026-10-01 |
| F1 | Formats tab + overview card | **BUILT & VERIFIED** (`/admin/formats`, card on /admin, nav for admin + trainer) | 2026-10-01 |
| F2 | Interest data + fee + payment (schema SQL shown first) | **BUILT & VERIFIED in dev+test; production SQL awaits founder approval** (`20261001140339_training_interests`) | 2026-10-01 |
| F3 | Public "Register your interest" | **BUILT & VERIFIED** (per-format action on `/programs/[slug]`, form, Stripe, return banner, Pakistan free) | 2026-10-01 |
| F4 | Users Interest tab (trainer + admin) | **BUILT & VERIFIED** (`/admin/interest`: filters, copy emails, BCC draft, CSV, mark notified; fee page `/admin/orders/interest`) | 2026-10-01 |
| F5 | My interests | **BUILT & VERIFIED** (section on My Trainings; personal-data export includes interests) | 2026-10-01 |
| F6 | Docs, legal, tests, close-out | **DONE** (DR-08, Terms/Refund/Privacy drafts, tests; FAQ entry not added) | 2026-10-01 |

## 6. Progress log

| Date (MYT) | Entry |
|---|---|
| 2026-10-01 21:38 | CR created from the founder's message. Surveyed: per-training Formats and Dates tabs already exist (Admin → Trainings → [training]); no top-level Formats view; Stripe checkout and webhook patterns exist; **no email provider** (log transport) so "email all interested people" is proposed as copy / BCC draft / CSV / mark-notified. 9 questions with recommendations. **No code changed.** |
| 2026-10-01 22:05 | Founder: **"go ahead with CR 2"**. Taken as acceptance of the recommendations: Q1 top-level Formats tab + card; Q2 signed-in only, email required, consent tick; Q3 button on a published format with no open scheduled date; Q4 Pakistan registers interest free; Q5 admin-managed fee with history, default USD 2, non-refundable wording; Q6 one paid interest per person per format; Q7 copy / BCC draft / CSV / mark-notified (no real sending); Q8 DOB only to admin and that training's trainer, Privacy draft re-versioned; Q9 no credit. Schema is applied to the dev and test databases only; **the SQL is shown to the founder before any production migration** (precedent: the 1711 migration). |
| 2026-10-01 22:40 | **F1–F6 built.** Schema: additive migration `20261001140339_training_interests` (enum `interest_status`, `order_kind.interest`, tables `training_interests` and `interest_fee_settings`; FKs Restrict) applied to dev + test only. Code: `src/modules/commerce/{interest-rules,interest.repository,interest.service,interest.actions,formats-overview}.ts`, `components/{InterestForm,interest-slots}.tsx`, webhook `interest` branch (confirms only on the verified paid event; expired/failed sessions expire the row), `interestRegisteredMessage` email, order-list labels ("Interest — <training>"), data export, deleteTraining/format-removal guards. UI: `/admin/formats`, `/admin/interest` (+ `export.csv`), `/admin/orders/interest`, Formats card on /admin, My interests on /account/trainings, per-format action on the training page. Seed: opening fee USD 2.00. Docs: DR-08; Terms/Refund/Privacy drafts folded into the unreleased `DRAFT-2026-10-01`. Tests: 14 integration (fake gateway + signed webhook), 8 Playwright (axe light+dark), nav unit test; a latent collation assumption in `audit-admin.test.ts` fixed. |
