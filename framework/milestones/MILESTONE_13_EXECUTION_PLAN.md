# Milestone 13 — Participant journey: training → dates → payment → My Trainings → attendance → certificate

> **Status: APPROVED 2026-09-27 — founder: "§4 approved, all recommendations accepted, N1–N7 = yes, start M13", with one amendment: N1 = NO — "no need to have transfer option".** Build in progress; §8 records the outcome.
>
> **Decisions as approved:** §4 table approved · **N1 no Transfer button** (the M4 transfer service and refund-policy §4 text are left in place, hidden from the cards — removing the capability itself is a separate RED decision) · N2 (a) Dashboard tab removed · N3 (a) existing reviews keep the gate satisfied · N4 yes · N5 (a) date of birth shown as asked · N6 completion refused while attendance is No, allowed when not recorded · N7 Trainers may record attendance for their own trainings.
> **Trigger:** founder requirements of 2026-09-27 (the "Flow" note) and the founder's answers to my ten review questions the same day (§1.2).
> **Authority:** DR-02 (the portal *supports* expert-led delivery) · DR-01 (one credential) · the three specifications · M4/M5a/M5b/M6/M8/M12 decision records. Where this plan changes an earlier decision it says so in §1.2 and §2.

---

## 1. What I understood

### 1.1 The journey, end to end

1. **Trainings page** (`/programs`) — one card per published training. The card's link reads **"Register or check course details →"** (was "Course details →").
2. **Training page** (`/programs/<slug>`) — in **Investment**, the Malaysia and Rest-of-the-world cards lose **"See upcoming dates"** and their remaining button reads **"See dates and register"** (was "Register your interest"). It opens the **schedule filtered to that training**. Pakistan's card keeps "Contact us" — Pakistan pays through the local partner, never by card (unchanged, N2 confirmed).
3. **Schedule** (`/schedule?training=<slug>`) — shows only that training's dates, with **Register** on every open date; a link shows all trainings. Register → `/checkout/<date>` → the mandatory-field check (name, date of birth, country — built 2026-09-27) → **Stripe**. An unpaid checkout expires after 30 minutes and the seat is released (existing).
4. **Burger menu** (header account menu) — the **Dashboard** item goes; the menu lists the account tabs **in the account page's order** (§1.3), then "Admin dashboard" for staff and "Sign out".
5. **Account page** (`/account/…`) — tabs re-ordered and renamed (§1.3). **Profile** absorbs Security. **My Trainings** has two sections: **Yet to attend** (paid, date not yet passed; each card offers **Cancel** — refund per the policy — and the existing one free **Transfer**, see N1) and **Attended** (date has passed). An attended training opens a **training detail page** with the training's details and, once issued, its **Certificate of Completion** and **unique certificate ID**, copyable; the ID links to the public certificate page `/verify/<id>`, the same page the home-page search opens.
6. **Certifications** tab — every certificate the person holds, each with its copyable ID; the **document** is shown only after a review of at least **300 characters** for that training (the ID and the public page stay visible — N4 confirmed).
7. **Reviews** — `/reviews` stays public; a signed-in visitor sees it inside the account frame (sidebar tabs).
8. **Attendance** (new) — an **Attendance** tab in admin lists the trainings; opening one shows its participants — name, email, date of birth, country, **Attended (Yes/No, editable)**, **Updated** — saved to a new database table with the administrator and time recorded; re-opening shows the saved values, which can be changed.

### 1.2 Founder decisions already given (2026-09-27), recorded so they are not re-asked

| # | Question | Founder's answer | Effect |
|---|---|---|---|
| 1 | Label of the button that now leads to the schedule | **"See dates and register"** | Replaces "Register your interest" on the Malaysia and Rest-of-the-world Investment cards |
| 2 | Pakistan card payment | **Keep the exception** | Pakistan dates show the local-partner note, never a Pay button (rule of 2026-09-26 stands) |
| 3 | "5 lines of review" | **300 characters minimum** | `REVIEW_BODY_MIN` 20 → 300 (see N3 for existing reviews) |
| 4 | Certificate visibility | **Gate the document only** | ID and `/verify` stay public; unchanged M6 behaviour, now applied to the new pages |
| 5 | Dashboard | **Remove the Dashboard item from the burger; list the account tabs in the stated order** | See N5 on the Dashboard *tab* itself |
| 6 | Profile & Security | **Fold Security under Profile** | Password change and sign-out-everywhere move onto the Profile page; `/account/security` redirects |
| 7 | Skills profile, Orders & receipts, Notifications, Help | **Keep as they are** | Unchanged, re-ordered after the named tabs |
| 8 | Reviews inside the account | **Public page; sidebar for signed-in visitors** | `/reviews` renders inside the account frame when signed in |
| 9 | "Attended" | **Date passed = Attended; attendance is recorded separately by the admin in a new table and tab** | §3 WP4 and §4 |
| 10 | Keep Transfer? | *Not understood — explained in N1* | — |

### 1.3 The account tabs, in order (founder decision 5–7)

| # | Tab | Route | Was |
|---|---|---|---|
| 1 | **Profile** | `/account/profile` | "Profile & security" (last but two) |
| 2 | **My Trainings** | `/account/trainings` | "My registrations" at `/account/programmes` |
| 3 | **Certifications** | `/account/certifications` | "Certificate" at `/account/certificate` |
| 4 | **Reviews** | `/reviews` (public, framed when signed in) | same link |
| 5 | Orders & receipts | `/account/orders` | unchanged |
| 6 | Skills profile | `/account/skills` | unchanged |
| 7 | Notifications | `/account/notifications` | unchanged |
| 8 | Help | `/account/help` | unchanged |
| — | ~~Trainings~~ | `/account/programme` | **removed** (the public Trainings page and the schedule replace it) |
| — | ~~Dashboard~~ | `/account` | **see N5** |

Old routes redirect permanently to the new ones, so bookmarks, emails already sent and the tests keep working.

---

## 2. What already exists (the plan builds on it)

| Requirement | Existing piece | Change needed |
|---|---|---|
| Card link on `/programs` | `CourseCard.tsx` "Course details →" | Label only |
| Investment buttons | `ProgrammePricing.tsx` RegionCard: "See upcoming dates" + "Register your interest" | Remove one, relabel and retarget the other |
| Schedule with Register → checkout | `/schedule` grouped by training (M12) | Add the `?training=` filter and "all trainings" link |
| Mandatory fields before Stripe | Registration form + `REQUIRED_FOR_CHECKOUT` (2026-09-27) | None |
| Unpaid checkout cancelled | 30-minute seat hold, `checkout.session.expired` webhook (M4) | None |
| Cancel with refund per policy, one free transfer | `RegistrationActions.tsx`, `registrations.service.ts` (M4) | Move onto the "Yet to attend" cards |
| Certificate ID, copy button, `/verify/<id>` | M6 holder page, `CopyLinkButton`, public search | Reuse on the new detail page; copy the **ID** as well as the link |
| Review gate on the document | `certificates/gate.ts` → `reviewRequirementForRegistration` (M5b/M6) | Raise the minimum length; apply on the new pages |
| Roster with "Record completion" | `/admin/offerings/[id]/participants` (M6) | Attendance is a **separate** tab; completion stays where it is (N6 decides the link) |
| Header account menu | `AccountMenu.tsx` | Items from `account-nav.ts` in the new order; Dashboard item removed |

---

## 3. Proposed scope — five work packages

### WP1 — Public flow (labels, one button, schedule filter)
- `CourseCard.tsx`: "Register or check course details →".
- `ProgrammePricing.tsx`: Malaysia and Rest-of-the-world cards: one button, **"See dates and register"** → `/schedule?training=<slug>`. Pakistan unchanged.
- `/schedule`: `?training=<slug>` shows that training only, with its title and a "See all trainings" link; unknown slug → all trainings. The started-date gap (found 2026-09-27) is closed here: a date that has started shows **Started**, not Register.
- Tests: `tests/e2e/trainings.spec.ts`, `tests/e2e/public.spec.ts` (labels, filter, started date), axe.

### WP2 — Account restructure
- `account-nav.ts`: the order in §1.3; `AccountMenu.tsx` reads the same list (one source of truth), minus Dashboard, plus "Admin dashboard" for staff.
- **Profile** page gains the Security section (password change, sign out everywhere) below the profile form; `/account/security` → 308 redirect.
- **My Trainings** (`/account/trainings`): "Yet to attend" = confirmed registrations whose date has not ended; "Attended" = ended (founder decision 9). Yet-to-attend cards carry Cancel and Transfer (existing components). Attended cards link to the **training detail page** `/account/trainings/<registrationId>`: training title, dates, format, location, attendance as recorded (Yes / No / not recorded), certificate ID (copyable, linked to `/verify/<id>`) and the document when the review gate is satisfied; otherwise the "write your review" prompt with the 300-character rule stated.
- **Certifications** (`/account/certifications`): every certificate, ID copyable, link to its training detail page and to `/verify/<id>`; renewal and listing controls move here from the old page unchanged.
- `/account/programmes` → `/account/trainings`, `/account/certificate` → `/account/certifications`, `/account/programme` → `/programs` (308 redirects).
- Tests: `tests/e2e/account.spec.ts`, `profile.spec.ts`, `certificates.spec.ts`, `identity.spec.ts` (security moved), redirects.

### WP3 — Reviews: 300 characters, framed page
- `REVIEW_BODY_MIN` → 300; the form says "at least 300 characters" with a live count; the gate message on the certificate pages states the same rule.
- `/reviews`: when signed in, rendered inside `AccountFrame` with the sidebar; signed out, unchanged.
- Tests: `tests/unit` review validation, `tests/e2e/reviews.spec.ts`.

### WP4 — Attendance (new table + admin tab) — **needs §4 approval**
- Table `attendance_records` (§4): one row per registration; `attended` Yes/No; who recorded it; when last updated.
- Admin **Attendance** tab (`/admin/attendance`): trainings with dates (soonest first, today highlighted); `/admin/attendance/<offeringId>`: table — Name · Email · Date of birth · Country · **Attended** (Yes / No / blank) · **Updated** — one Save button; every change writes `attendance.recorded` to the audit log (before/after per registration). Reopening shows the saved values. Available to platform administrators; **Trainers** for their own trainings if N7 = yes.
- The participant's My Trainings and detail page show the recorded value.
- Tests: `tests/integration/attendance.test.ts` (save, update, audit, scope), `tests/e2e/admin-attendance.spec.ts`, axe.

### WP5 — Dashboard content and the burger
- Whatever N5 decides for `/account`; the "Support the Academy" card and the "open the admin area" link find a home (Profile page footer or the burger) so nothing built in M12/ADR-048 is lost.

---

## 4. ⛔ Physical data model changes (Rule 1 — require explicit approval)

One new table, nothing else. No column on an existing table changes.

| Change | Kind | Reversible? | Why |
|---|---|---|---|
| **New table `attendance_records`** | additive | Yes — drop the table; nothing else references it | Founder decision 9: attendance is recorded and updated by the administrator and must survive restarts (Rule 6) |

Proposed shape (Prisma model `AttendanceRecord`):

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `registration_id` | uuid, **unique**, FK → `registrations.id` (restrict) | One record per registration; the offering and the person come through the registration, so they are never duplicated or contradicted |
| `attended` | boolean, not null | The founder's Yes/No |
| `note` | text, null | Optional (late arrival, left early); no separate table for it |
| `recorded_by_user_id` | uuid, FK → `users.id` (restrict) | Who saved it last |
| `created_at` | timestamptz | First save |
| `updated_at` | timestamptz | The founder's **UpdateDate** — set on every save |

Indexes: the unique on `registration_id` (lookups are by offering through `registrations.offering_id`, already indexed). Audit: `attendance.recorded` rows carry the before/after value per registration, so history is in the audit log — the table holds the current truth only, like `user_profiles`.

Not chosen, and why: a column on `registrations` (attendance is a separate act by a different actor, with its own "who/when"); one row per day of a multi-day training (N6 — start with one Yes/No per registration, add a day column later only if needed; the unique constraint would then change, which is why it is asked now).

---

## 5. What is deliberately NOT in this milestone

- Pakistan card payment (decision 2 keeps the exception).
- Attendance driving certificate issuance automatically — issuance stays a deliberate "Record completion" action (N6 decides whether it *requires* Attended = Yes).
- A separate per-day attendance register, QR check-in, or participant self-check-in.
- Certificate design or the credential ladder (DR-01: one credential).
- Refund on behalf of a participant (M8 §5 A2, still open).
- Any change to fees, regions or the HRD Corp rows (M12).

---

## 6. ⛔ Founder decisions — answer by number ("N1 = a …")

| # | Question | Recommendation |
|---|---|---|
| **N1** | **Transfer** (your point 10). Today a paid participant who cannot make a date may, once and free of charge, **move the same registration to a later date of the same training** instead of cancelling — that is "Transfer", refund-policy §4, built in M4. Cancel returns money by the tiers; Transfer keeps the money and changes the date. Keep Transfer on the "Yet to attend" cards next to Cancel? | **Yes** — it is already built and it keeps revenue |
| **N2** | The **Dashboard tab** at `/account`. Options: (a) remove it — `/account` opens Profile; its pieces move: open dates → the schedule, latest order → Orders, certificate → Certifications, Support card → Profile page footer, admin link → burger; (b) keep it as the last tab. | **(a)** — matches your stated order; nothing is lost |
| **N3** | The 300-character minimum and **existing reviews**: (a) reviews already written (shorter) keep satisfying the gate; the minimum applies to new reviews; (b) every holder must have a 300-character review, so shorter ones re-open the gate. | **(a)** — nobody loses a certificate they already unlocked |
| **N4** | The **training detail page** for an attended training whose certificate is not yet issued (completion not recorded): show the training details and "Certificate: not yet issued — the Academy records completion after the training". | **Yes** |
| **N5** | **Date of birth in the attendance table** is sensitive personal data shown to every administrator. Options: (a) show it as you asked; (b) show it masked (year only) with the full date on hover/expand; (c) leave it out and rely on the ID document on the day. | **(a)** as asked, with the audit row noting the view — or (b) if you prefer less exposure |
| **N6** | **Attendance ↔ certificate.** Should "Record completion" (which issues the certificate) be **refused while attendance is No or not recorded**? | **Yes, refuse when No; allow when not recorded** (a small training may skip the register) — say if you want "not recorded" refused too |
| **N7** | May a **Trainer** record attendance for their own trainings (the M12 scope), or administrators only? | **Trainers too** — they are in the room |

---

## 7. Order of work and verification (pass/fail)

1. §4 and §6 approved → migration for `attendance_records` (forward-only; rehearsed on the test database; `db:reset` unaffected).
2. WP4 (attendance) → WP2 (account) → WP1 (public flow) → WP3 (reviews) → WP5 (dashboard/burger).
3. Every step: tsc clean · Vitest (new integration tests for attendance, redirects, review minimum, gate) · Playwright on the production build (new admin-attendance spec; account, trainings, reviews, certificates specs updated; axe on every new screen) · confirmed on `localhost:3100`.
4. Docs: this plan §8 completion note; `PROJECT_STATUS.md` §2/§3; ADR-049 (attendance and the participant journey); `USER_PROFILE_REQUIREMENTS.md` untouched; `LEARNER_FEEDBACK_REQUIREMENTS.md` §8 (300 characters); `COMPLETION_CERTIFICATE_*` if N6 = yes.
5. Commit only when asked; files staged by name.

## 8. Completion note (2026-09-27)

**Built as approved (§4, N1–N7 with N1 = no Transfer button).** Nothing deployed — the portal has no production environment yet (M11 Phase B).

| WP | What landed | Where |
|---|---|---|
| **WP4 Attendance** | Migration `20260927063918_attendance_records` (one table, as §4); `src/modules/attendance/{repository,attendance.actions}.ts` — list of dates with participants (scope-aware), the sheet (name · email · date of birth · country · Attended · note · Updated by), save = upsert per answered row + `attendance.recorded` audit with before/after, idempotent, refuses rows of another date; **Admin → Attendance** (`/admin/attendance`, `/admin/attendance/<date>`), in the Trainer's bar too (N7). **N6:** the roster and `recordCompletion` refuse a participant recorded as *No* (`not_attended`, with the reason in words); *not recorded* is allowed | `app/admin/attendance/**`, `issuance.service.ts`, `RecordCompletion.tsx`, `admin.actions.ts`, `admin-nav.ts` |
| **WP2 Account** | Tabs in the founder's order (`account-nav.ts`; the header menu reads the same list, no Dashboard item); `/account` → Profile; **Profile** absorbs Security (password change), the "Support the Academy" card and the account facts (email, verification, roles); **My Trainings** (`/account/trainings`) with *Yet to attend* (Cancel with the refund stated; no Transfer — N1) and *Attended* (date passed — decision 9; attendance shown when recorded; certificate issued / not yet issued — N4), cancelled ones below; **training detail page** (`/account/trainings/<registration>`): facts, attendance, the certificate's unique ID as a link to `/verify/<id>` with **Copy certificate ID**, the document behind the review gate; **Certifications** (`/account/certifications`) = the M6 holder page with the ID copy added. Retired routes redirect permanently (`next.config.ts`); every email link updated | `app/account/**`, `next.config.ts`, `CopyLinkButton.tsx`, checkout/renewal/reminder/webhook URLs |
| **WP1 Public flow** | Card link "Register or check course details →"; Investment cards (Malaysia, Rest of the world) carry ONE button **"See dates and register"** → `/schedule?training=<slug>` (Pakistan unchanged — decision 2); the schedule filtered to one training with "See all trainings", honest when that training has no dates; a **started** date shows *Started* and "Ask about the next date" instead of Register (the gap found 2026-09-27) | `CourseCard.tsx`, `ProgrammePricing.tsx`, `schedule/page.tsx`, `ProgrammeDates.tsx` |
| **WP3 Reviews** | `REVIEW_BODY_MIN` 20 → **300** (form counter, server message); existing reviews keep the gate satisfied (N3 a); `/reviews` stays public and is **framed** with the account sidebar for a signed-in visitor (decision 8) | `reviews/constants.ts`, `app/(public)/reviews/page.tsx` |
| **WP5 Burger / dashboard** | Dashboard tab and item removed (N2 a); its pieces re-homed as above | `account-nav.ts`, `AccountMenu.tsx`, `app/account/page.tsx` |

**Verified 2026-09-27 (locally):** tsc clean · **Vitest 456/456** (+8: the sheet, save/idempotency/audit/scope, N6 on the roster and in issuance; the landing rule; review minimum; account-nav order) · **Playwright 73/73** on the production build (new `admin-attendance.spec` — sheet, reload, change, N6 on the roster; `account.spec` rewritten — tabs, menu order, redirects, My Trainings sections, detail page, certificate ID → public page, 404 for another person's registration; trainings/schedule/reviews/certificates/identity/commerce specs updated; axe on every new screen) · confirmed on `localhost:3100`: Profile-first account with Security/support/roles, My Trainings, `/admin/attendance`, the filtered schedule, the framed `/reviews`.

**Left exactly as decided, not built:** Transfer capability (service + policy text kept, button hidden) · Pakistan card payment · attendance-driven issuance · per-day attendance.

**Same-day follow-up (founder: "on the training page don't show the Dates section … See dates and register should take the user to `/schedule?training=<slug>`"):** the M12 "Dates — Upcoming dates" section is removed from `/programs/<slug>`; the hero's "Register for a date" and "See upcoming dates" both open the schedule filtered to that training, as the Investment cards do. `ProgrammeDates` (the section component) is no longer rendered anywhere; `OfferingDateCard` is still the schedule's card. `admin-trainings.spec` and `trainings.spec` updated.

**Records:** ADR-049 · `LEARNER_FEEDBACK_REQUIREMENTS.md` §8.1 · `PROJECT_STATUS.md` §2 (2026-09-27, evening).
