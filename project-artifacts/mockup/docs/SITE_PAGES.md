# Site pages — what exists, what is missing, what is blocked

**Established 2026-09-02**, when About and Contact were added by founder
direction along with the instruction to add "other pages required to make our
portal professional".

This file answers that instruction honestly: it lists what a professional
training-and-certification portal needs, what was built, and — importantly —
**what was deliberately not built, and why.**

---

## Primary navigation (restructured 2026-09-02; updated 2026-09-06)

**Home · HRD Corp · Programme · Trainers · Free Diagnostic · About Us · Search**
— **seven items as of 2026-09-20** ("Search" → `/verify`, certificate search,
promoted from the footer by founder direction; the six-item guideline was
knowingly exceeded). Earlier: five, then six; the history below is retained.

**2026-09-06, later still: Certifications removed**, founder direction —
"We will work on Certification option in future." `/certifications` itself
is disabled the same way (a flag in `app/certifications/page.tsx` makes it
404; content untouched, this is a pause not a deletion). Two other pages
still link to it (`/hrd-corp`, a course detail page's rubric section) — left
as-is rather than silently reworked, so they 404 too until this returns.

Removed by founder direction: **How it works** (`/#delivery`) and **For
organisations** (`/#organisations`). Both were homepage anchors; the sections
themselves still exist and are still reached from elsewhere, so only the nav
entries went.

**2026-09-06:** **Contact Us** removed from this list and **HRD Corp** added
in its place, by founder direction — still six items. Contact Us is not
orphaned: it remains in the footer's Explore list, and every corporate/
enquiry CTA across the site (courses hub, `/hrd-corp`) still routes to
`/contact-us`. Same pattern as the two anchors removed on 2026-09-02 — only
the nav entry moved, not the page or its other entry points.

**Later the same day:** **HRD Corp** moved to position 2, right after Home
— founder direction, giving it the nav's second-highest prominence.

> **⚠ Superseded — record corrected 2026-09-20.** `components/PublicShell.tsx`
> carries a comment that the header **"Explore courses" CTA was removed
> (dated 2026-09-07, founder direction)**, from both the header and the mobile
> menu; the header now carries no CTA, and "Programme" in the nav reaches the
> same page. This file was not updated at the time. The paragraph below is
> retained as history.

The header CTA reads **"Explore courses"**. The instruction said "Explore
Course" (singular); it links to a list of seven, so the plural is used — a
grammatical error on the most prominent button in the portal was not worth
shipping. Say the word if singular was deliberate.

**Certifications** now points at `/certifications`. It was an anchor to a
homepage section, but that section was removed on the same day — which would
have orphaned the menu item, so the content moved to its own page.

## Built

| Route | Purpose | Content status |
|---|---|---|
| `/` | Homepage (P01) | Real |
| `/courses`, `/courses/[slug]` | Portfolio and detail | Real — migrated, with published pricing |
| `/trainers` | Trainer directory, selection standard, the trainer's HRD Corp accreditation, a "Community" video row | Real. "Published work" (books) removed from this page 2026-09-06 (data untouched in `data/practitioners.ts`); the HRD Corp accreditation display ("Held today") moved in the same day from `/hrd-corp`. **2026-09-07:** the closing "In the room"/"Trainers at work" section (live-delivery copy beside an image slot) replaced with "Community" — real episodes from the founder's YouTube show, paged 3 at a time. See `docs/MOCK_DATA_REGISTER.md` and `docs/IMAGE_SLOTS.md` |
| `/about-us` | Organisation identity, commitments, founder, honest current state | **Real — every positioning claim traced to DR-02 §1/§2/§6/§7.** Nothing about scale, history, clients, team size, founding date or accreditation is stated, because none is established |
| `/contact-us` | Three enquiry routes and the enquiry form. **"Reach us directly" (founder's channels + location) removed 2026-09-20, founder direction** — the page now shows no contact channel at all | **Real, with one gap — see below, now sharper: with the channels gone there is no way to contact the Academy from this page except the inert form.** Also now the destination for every "Register your interest" and corporate-enquiry CTA, after the homepage's For-organisations band was removed |
| `/certifications` | The earned-credential argument, the assessment rubric, and the participation-certificate boundary | **Disabled 2026-09-06** (404 via a flag, founder direction — "future" work). Content real and untouched underneath; removed from primary nav. Created 2026-09-02 when the homepage certification section was removed — the content moved rather than being discarded |
| `/diagnostic`, `/diagnostic/result` | Capability assessment (P05/P06) | Pre-DR-02 baseline. `/diagnostic` gained an idle landing stage 2026-09-06 (heading, tier selector, Start button — see `docs/MOCK_DATA_REGISTER.md`), shared with the homepage's embedded diagnostic via `DiagnosticStartCard` so the two never drift apart |
| `/journey-placeholder` | Labelled next-stage placeholder | Placeholder, labelled |
| `/hrd-corp` | What HRD Corp is, and the honest status of organisational registration and course claimability | Real, created 2026-09-06 by founder direction. **In primary nav** (position 2, right after Home — replacing Contact Us, same day, see above), and also reached via the homepage hero's floating "03" card. The trainer's own accreditation display (badge, verify link) moved to `/trainers` the same day — this page still links there for it. Every other page (courses, certifications, course detail, about-us) still carries nothing HRD-Corp-related, by founder direction. See [`HRD_CORP.md`](HRD_CORP.md) |
| `/sign-in`, `/register`, `/forgot-password`, `/sign-out`, `/checkout`, `/checkout/confirmation` | **Account & payment wireframes — added 2026-09-20, founder direction** ("standard pages … No backend implementation yet"). Spec screens `S01` (sign in, incl. recovery), `S02` (create account) and the pay step of `K03`; sign-out has no spec screen (only an avatar-menu item). Reachable from the header's "Sign in" and a reviewer index in the footer's bottom strip | **Wireframe — inert by design, except the labelled demo sign-in** (see "Signed-in wireframes" below). Register / forgot-password / profile buttons are genuinely disabled; the **checkout and renewal "Pay" buttons are enabled only inside the demo session and simulate a payment** (see "Registration & checkout"); forms cannot submit (Enter is swallowed so typed values never reach the URL); each page carries a "Wireframe" note saying nothing is connected. See "Account & payment wireframes" below |

## ⚠ Open gap on `/contact-us` — there is no business email address

**No email address, telephone number, office address, company registration or
response-time commitment appears anywhere on that page, because none exists in
any approved source.** Inventing one would be the most damaging kind of
fabrication on a portal asking for training budgets — a wrong address silently
loses real enquiries.

What is shown instead is genuine: the founder's own published channels
(LinkedIn, Medium, YouTube, Substack — exact URLs from `data/practitioners.ts`)
and the location recorded there.

**Needed from the founder:** a monitored business email address. Ideally also
the registered legal entity name, which several of the pages below depend on.

The enquiry form is **inert** — no backend exists — and says so, rather than
showing a fake success state.

---

## Not built, and why

These are the pages a professional portal in this sector is expected to have.
Each is listed with what actually blocks it. **None is blocked on effort.**

### Blocked on legal drafting — an agent must not write these

| Page | Why it is needed | Why it was not written |
|---|---|---|
| **Terms of service** | Named in the footer; required before any transaction | A binding legal instrument. Drafting it would be inventing the contract between the Academy and its participants |
| **Privacy policy** | Legally required once the enquiry form collects personal data — including in Malaysia (PDPA) | Must describe what is *actually* collected, stored, where, and for how long. None of that is decided, and a policy describing an imaginary system is worse than none |
| **Refund & cancellation policy** | **A prerequisite for taking payment at all** | `OQ-2`/`OQ-9` record refund policy per product type as unresolved. Stripe cannot responsibly go live without it |
| **Credential integrity policy** | Named in the footer; it is the substance of the credential's worth | Product policy — appeals, revocation, misconduct. `ADR-018`, `OQ-21` |

**2026-09-20, founder direction:** each now has its own page — `/terms`,
`/privacy`, `/credential-integrity-policy` (`components/legal/PolicyPlaceholder.tsx`)
— linked from the footer. **The pages are placeholders**: each states the
document is not yet published, what it will govern, and what must be settled
first. **No policy text was written**, for the reasons above. The footer
still carries "not yet published". A footer that promises documents which do
not exist is a small dishonesty that costs trust when discovered.

### Blocked on the product existing

| Page | Blocked on |
|---|---|
| **Verify a credential** (public lookup of the *earned credential*) | No credential has been issued. `ADR-018`/`ADR-039`. The footer still says "available once the first credential is issued". **Not to be confused with** the Certificate-of-Completion verification below, which is a wireframe (2026-09-20) |
| **Schedule / upcoming dates** | State A — no confirmed public inventory. Inventing dates is prohibited (`HD-7`, `HO-2`) |
| **Sign in / account** | *Wireframe drawn 2026-09-20* (see Built). Working sign-in still needs authentication (ADR-006, pending approval) |
| **Checkout** | *Wireframe drawn 2026-09-20, with a SIMULATED payment inside the demo session* (see Built and "Registration & checkout"). A working checkout is still blocked — see the payments record below |

### Deliberately not added

- **Blog / insights** — the founder publishes on Medium and Substack already.
  A second, empty channel in the portal would be an obligation with no content
  behind it. The existing links do the job.
- **Testimonials / case studies** — no cohort has run. Fabricating social
  proof is the single most damaging thing this portal could do.
- **Careers** — nothing to advertise. The `/trainers` page already carries the
  open-position signal.
- ~~**FAQ**~~ — **built 2026-09-20 by founder direction** (`/faq`, `data/faq.ts`).
  The concern above was met with a rule: every answer is either a fact
  already stated on the portal, or an honest "to be confirmed" (chip) pointing
  to the open decision. No answer invents a rule.

---

> **Before any backend work:** the master cross-reference of every screen, its
> simulations, backend requirements and blocking decisions is
> [`../../../docs/execution/BACKEND_HANDOFF_INDEX.md`](../../../docs/execution/BACKEND_HANDOFF_INDEX.md).

## Certificate of Completion & public verification (2026-09-20)

Founder requirement: on completing the training a participant gets a
certificate with a **unique ID** that **expires every year**, kept active by an
**annual fee (USD 10, changeable)**; the certificate is shown to the holder;
**anyone** can search for holders **by name or ID**; each certificate has a
**unique URL** showing the certificate and its **active / expired** status.

The requirement was polished to best practice, with proposed defaults and 15
open decisions, in
[`../../../docs/execution/COMPLETION_CERTIFICATE_REQUIREMENTS.md`](../../../docs/execution/COMPLETION_CERTIFICATE_REQUIREMENTS.md)
— read it before changing any of this. Named **"Certificate of Completion"**,
not "Certification", and stated on the document to be **not the earned
credential**, because `DR-02` §6 explicitly rejects "attend training → receive
certificate" as the credential (decision D1 — for the founder to confirm).

| Route | What it does |
|---|---|
| `/verify` | **Public search** by certificate ID (exact) or holder name (listed holders only, ≥ 3 characters, capped at 10). Linked from the footer ("Verify a certificate") |
| `/verify/[id]` | **The certificate's unique, shareable URL.** Shows the certificate, the holder, dates and a live **Active / Renewal due / Expired** status. Expired certificates stay verifiable as Expired |
| `/account/certificate` | The holder's certificate: live status, **print / save as PDF**, copy link, **public-listing consent**, renewal (fee shown), history |
| `/account/certificate/renew` | Renewal payment — **simulated** (same rules as checkout) |

**All records are invented and unmistakably labelled** — a diagonal SAMPLE
watermark, a "Sample records" banner, obviously fictional names, and IDs that
contain `0`/`1` (which the real ID alphabet never produces, so they cannot pass
as real). Four public samples cover every state: **Active**, **Expired**,
**Renewal due and unlisted** (findable by ID, invisible to name search), and a
second Active. Their dates are relative to today so no example drifts.

**To see the whole loop:** sign in → register (checkout) → *Certificate* →
"Simulate completing the programme" → use the demo buttons to jump to *renewal
due* / *expired* → renew → then search for "Demo Participant" on `/verify` and
switch the listing toggle off to watch the name disappear while the ID still
works.

**Not built, deliberately:** a real QR code (needs an encoder library or
server rendering — a new-dependency approval); PDF generation beyond the
browser's own Print/Save-as-PDF; revocation, reminders and email, holder
corrections, employer/corporate views (all listed as decisions or later).
The wireframe defaults the listing toggle **on** because the founder wants a
public directory; the recommended production default is opt-in.

---

## Later on 2026-09-20 — founder review changes

| Change | Where |
|---|---|
| Fee figures reduced (were `text-display`, now `text-h1` on the public Investment section; `text-body-lg` semibold in the signed-in currency cards, orders and renewal) — "font sizes are large wherever programme fees are involved" | `CoursePricing.tsx`, `CheckoutFlow.tsx`, `account/programme`, `account/orders`, `RenewFlow.tsx` |
| "Search" added to the primary nav (→ `/verify`); footer link kept | `PublicShell.tsx` |
| Footer "Certifications" and "For organisations" plain-text items removed | `PublicShell.tsx` |
| Legal placeholder pages `/terms`, `/privacy`, `/credential-integrity-policy` | `components/legal/PolicyPlaceholder.tsx` |
| `/contact-us` "Reach us directly" section removed | `app/contact-us/page.tsx` |
| Homepage hero card "Opportunities / Freelance. Remote. Global — including Pakistan & Malaysia." → **"Confirm Job / Opportunities in Malaysia"** | `HomeHeroLight.tsx` |

**Later still, 2026-09-20 — second founder review round**

| Change | Where |
|---|---|
| Nav "Search" → **"Search Candidate"** (→ `/verify`) | `PublicShell.tsx` |
| **Six hero cards, founder's order and copy**; "Get Career Support" removed: *Confirm Job Opportunities · Authorised Training Corporation · No Coding Experience Required · Prepare for Interviews · Learn Vibe Coding · Start Freelance Right After Training* | `HomeHeroLight.tsx` |
| **`/faq`** — grouped FAQ, honest "to be confirmed" chips; in footer | `app/faq`, `data/faq.ts` |
| **`/refund-policy`** placeholder; linked from footer, checkout consent, FAQ, help | `app/refund-policy` |
| **`/schedule`** — upcoming dates with seats and waitlist (all sample); in footer | `app/schedule` |
| **`/for-organisations`** — team engagement steps, honest HRD Corp status, inert team enquiry; in footer | `app/for-organisations` |
| **Participant stories** empty-state section (no cohort has run — nothing invented) | `app/DataBlueprint-AIVibeCoding` |
| **`/account/orders/[id]`** sample receipt with placeholder issuer block; `/account/notifications`; `/account/help` | `components/account/ReceiptView.tsx`, `app/account/*` |
| **Trainer / admin wireframe** `/admin` — first pass (6 pages); **rebuilt later the same day** as a full admin side with its own demo persona, see "Trainer & admin side" below | `components/admin/*`, `app/admin/*` |
| Footer "Wireframe index" (was "Account & payment wireframes") now includes Trainer / admin | `PublicShell.tsx` |

**Revised later the same day** (founder, after review): card 2 → "HRD Corp
Accredited Trainer — Verified, Trainer ID …" (accurate); card 1 → "Job
Opportunities in Malaysia — 1–2 top candidates will be brought to Malaysia
for job opportunities" (founder intent, terms still to be written); card 4 →
"Get ready for Data & AI Interview". The paragraph below records the earlier
wording for traceability.

⚠ **Three hero claims had no approved source** and were recorded verbatim at
founder direction: "Confirm Job Opportunities / Top Candidates will be
offered Job in Malaysia"; "**Authorised Training Corporation**" (the
organisation is **not** an HRD Corp registered training provider —
application in progress; only the trainer is accredited — see
`docs/HRD_CORP.md` and HRD Corp's logo-usage terms); "Never fail Data & AI
Interview". Raised with the founder in the 2026-09-20 review.

⚠ The hero card now reads "Confirm Job". Nothing in any approved source
establishes a job guarantee or placement service; this is founder copy,
recorded as-is. See the review notes in the session for the concern.

## Trainer & admin side (`/admin`) — 2026-09-20

Founder direction: "create all kind of pages, dashboards etc an admin side
must have … show pre-loaded username and password for testing."

**Second demo persona.** `/sign-in` now shows two accounts to click-fill:
*Participant* (`demo.participant@example.com` / `Demo-Password-2026`) and
*Trainer / admin* (`demo.admin@example.com` / `Demo-Admin-2026`). The stored
session value is now the **role** (`lib/demoSession.ts`); a participant who
opens `/admin` is told to switch accounts. ⚠ A browser label, not a
permission — nothing is enforced.

**Fifteen screens** (`app/admin/*`, sample data in `data/adminSamples.ts`,
every action disabled): Dashboard (needs-attention list, KPIs, upcoming
offerings, recent orders/enquiries/activity) · Programme (formats, prices,
curriculum, materials) · Dates & seats + per-offering detail (sessions &
attendance, roster, joining info) · Registrations & attendance (record
attendance, **mark complete** → certificate) · Participants + detail · Orders
& payments · Enquiries · Organisations · Certificates + detail (correct,
reissue, **revoke**) · Fees & settings (effective-dated fee, currencies,
eligibility, methods, tax, entity, Stripe, policy publication) · Emails ·
Users & roles · Audit log · Reports.

Requirements, decisions and the delete-list:
[`../../../docs/execution/ADMIN_REQUIREMENTS.md`](../../../docs/execution/ADMIN_REQUIREMENTS.md).

## Mobile friendliness (audit 2026-09-20)

Founder request: the whole portal wireframe must be mobile friendly — it is
being handed to friends to review on their phones.

**Method.** Every route (public, auth, signed-in, checkout) was loaded at
**320px, 375px and 768px** (and spot-checked at 600/820/1024/1280) and probed
for: horizontal overflow, tap targets under ~38px, standalone links under
~28px tall, and form fields under 16px. Results were then checked by eye in
light and dark on a 375px screen (sign-in, checkout, programme, dashboard,
mobile menu).

**Found and fixed**

| Problem | Where | Fix |
|---|---|---|
| Form fields were 15px, so **iOS Safari zooms the page in on focus** and does not zoom back | Every form (contact, sign-in, register, forgot-password, checkout, profile) | One rule in `app/globals.css`: fields are 16px below `sm`; desktop unchanged |
| Tap targets 24–35px | Region price tabs, diagnostic tier/role chips, "Cancel test", curriculum rows, the demo-banner button | `globals.css`: 40px minimum height for buttons, tabs and `<summary>` on phones/touch |
| Text links only 19–24px tall | "Forgot password?", "Create an account", "Course details →", "← All courses", "Read the full profile", and several account-area links | Vertical padding added to each |
| **Trainer name squeezed into a 74px column** beside the photo (1px page overflow) at 320px | `/trainers` cards | Photo stacks above the text under 420px |
| **Homepage scrolled sideways by ~50px at tablet width** (768/820px): the four-column "learning journey" row cannot fit | `/` | Two columns on tablet, four from `lg` (1024px) |
| Feature cards wasted width on phones (32px padding) | `/account`, `/account/programme`, `/checkout` | 20px on phones |

**Files changed for mobile:** `app/globals.css` (16px fields, 40px targets),
`components/HomeHeroLight.tsx` (journey row: 2 columns on tablet, 4 from `lg`),
`components/CourseCard.tsx`, `components/TrainerCard.tsx`,
`app/trainers/page.tsx` (photo stacks under 420px), `app/courses/[slug]/page.tsx`,
`components/signature/DiagnosticQuestionCanvas.tsx` (link padding), and the new
account screens (`components/account/AccountFrame.tsx`, `AccountMenu.tsx`,
`ParticipationView.tsx`, feature-card padding).

**Result.** No horizontal overflow on any route at 320, 375, 600, 768, 820,
1024 or 1280px; no under-sized form fields, buttons or standalone links.

**Not covered — say so honestly.** Tested in a desktop-app browser pane
emulating phone sizes, **not on physical devices** or in Safari/Firefox.
Landscape orientation and OS text-size settings were not tested. Contrast was
not re-audited. The Next.js dev-tools badge (the round "N" bottom-left) that
appears in `next dev` screenshots is not part of the site and is absent from
the published build.

**Known, left as is:** on phones the checkout's order summary sits *below* the
form (it is a side column on desktop); the Pay button carries the total so the
price is still visible at the point of paying.

---

## Account & payment wireframes (2026-09-20)

Founder direction: add Sign-in, Sign-out, Forgot password, User registration
and a Payment page (the company's Stripe account to be attached later), as
wireframe, no backend.

**What was drawn, and what was deliberately left out** — each omission is an
undecided product/architecture question, not an oversight:

| Screen | Drawn | Not drawn, because |
|---|---|---|
| Sign in | Email, password (show/hide), forgot-password link, create-account link | Social providers, "remember me"/session length, MFA, org SSO — ADR-006 (auth) is pending approval |
| Register | Name, email, country, password + confirm | Target role / goals / time budget (that is onboarding, `S03`); phone, DOB, org, ID — no approved source requires them; email verification (`S04`) — needs ADR-015; password rules — ADR-006 |
| Forgot password | Request step only | The "check your email" and "set new password" steps — the first would be a simulated success with nothing sent; both need ADR-015 / ADR-006 |
| Sign out | The signed-out landing screen; reached from the avatar menu and clears the demo session | A real sign-out (server-side session invalidation) — needs authentication |
| Checkout | See "Registration & checkout" below — reworked the same day | **Card fields** (card data is typed into Stripe's own fields, never ours); a final payment-method list (Stripe account config + open Malaysian rail, ADR-014); tax line (`OQ-9`); a ticked consent (Terms and refund policy do not exist) |

**Consent checkboxes are drawn disabled**, with the reason beside them
(Terms / Privacy / Refund policy unpublished — see "Blocked on legal
drafting" above). An enabled tick agreeing to a document that does not exist
would be a fake consent record.

**Register, forgot-password and profile stay inert.** Only the demo
sign-in and the checkout's Pay button do anything, and only inside the demo
session.

### Signed-in wireframes (`/account/*`) — added 2026-09-20, reworked same day

Founder direction: pre-load a dummy username and password so the wireframe
shows how the portal behaves after sign-in. The `/sign-in` form is
pre-filled with a **public demo account**; signing in with it (only it)
opens the signed-in area. This is a **labelled simulation, not
authentication** — see `lib/demoSession.ts` — with a persistent "Demo
session — sample data" banner throughout.

**One programme.** Founder direction, 2026-09-20: "Show only one programme."
The signed-in area shows the single flagship — the same entry the public
`/DataBlueprint-AIVibeCoding` page reads (`ai-powered-product-development`,
displayed as "Data Blueprint & AI / Vibe Coding"; the title and curriculum
are still PLACEHOLDERS pending the founder's real curriculum). The seven-
course catalogue is not shown. **Public-page CTA, changed 2026-09-20 (founder direction):** the "Register
your interest" button in the Investment section of `/DataBlueprint-AIVibeCoding`
now checks the demo session **at click time** — *not signed in* → the sign-in
page (with "Sign in to continue to programme registration."), and sign-in then
returns the visitor to `/checkout`; *already signed in* → straight to
`/checkout`. Implemented as an opt-in `registrationFlow` prop on
`components/CoursePricing.tsx` (button: `components/account/RegisterInterestButton.tsx`).
**Only this page opts in**, because `/checkout` registers for the single
flagship programme. The other course pages (`/courses/<slug>`, including the
flagship's own `/courses/ai-powered-product-development`) and the pricing
component's "Enquire about this package" buttons still route to `/contact-us`.
Other public copy (About Us, the course-detail template) still says there is
no online payment — left unchanged; reconcile when A4 in the requirements
record is decided.

Screen set chosen from the approved specs, following DR-02 §3 (the portal
*supports* live delivery; it is not where learning happens) and its priority
order — discovery → scheduling/commercial → evidence → cohort operations →
supporting materials last:

| Route | Spec | Notes |
|---|---|---|
| `/account` | `L01` Dashboard | Two states: **not registered** (led by an invitation to view/register) and **registered** (led by the **next session**, not a "Continue" card — DR-02 reframing) |
| `/account/programme` | `P10` Programme Detail, signed-in | The one programme: real outcomes, "included" list, curriculum, the **three real delivery formats**, and the **published price in all three currencies**; "Register" CTA |
| `/account/programmes`, `/account/programmes/[id]` | `L02` reframed | **My registrations** (empty until the participant registers) and participation for one start date: schedule, joining info, included materials, certificate of participation. `[id]` is a sample start-date id (static-export requirement) |
| `/account/orders` | `S07` | One row per simulated registration; real prices in the chosen currency, sample order data |
| `/account/skills` | `L05` | Illustrative diagnostic fixture; says so |
| `/account/profile` | `S06` | Details, change password, PDPA export/delete — all disabled |

**Deliberately absent:** lesson player, AI tutor, learning paths, community,
content library (retired/deferred by DR-02); **"My credentials"** (`L09`) —
Certification is paused, founder direction 2026-09-06; gamification.
**Not yet built, offered as a later round:** a corporate-manager demo persona
(`O01` org dashboard, `O10` HRD Corp evidence pack), notifications, help.

**Sample dates are illustrative, by founder choice.** Offered the honest
alternative ("Date to be announced", per DR-02 §4.1) he chose labelled
illustrative dates. Every invented value carries a "Sample" chip. Recorded
as an explicit override in `docs/MOCK_DATA_REGISTER.md`. The three start
dates map one-to-one onto the programme's real delivery formats (Bootcamp /
Accelerator / Mastery); delivery mode and venue are stated by no source, so
none is shown.

### Registration & checkout (`/checkout`, `/checkout/confirmation`) — 2026-09-20

Founder decisions, 2026-09-20 (recorded so the backend build misses none):

| Decision | What the wireframe does |
|---|---|
| Sign in, then register | A signed-out visitor at `/checkout` sees a sign-in gate; sign-in returns them to checkout (return path in `sessionStorage`) |
| Register = check out the programme | Five steps: **start date → currency → details → payment method → confirm**, with an order summary that updates live |
| **Prices in every currency; the user chooses** | Malaysia (RM) · Pakistan (Rs.) · International (USD), each with its published launch price. ⚠ The Pakistan price is a **regional scholarship** (70% off) and the International a 10% offer; **no eligibility rule exists**, so offering all three to everyone is a founder-directed simplification, logged as an open business rule in the requirements record |
| **Keep all payment options** (not card-only) | Credit or debit card · Online banking · E-wallet — **generic, provisional labels**; the real list depends on the Stripe account and the open Malaysian rail (ADR-014) |
| **Simulate a successful payment in the demo session** | "Pay" adds a sample registration and shows `/checkout/confirmation`, with a "Demo — no payment was taken" banner. Enabled **only** inside the demo session |
| No real payment yet | No Stripe.js, keys, dependency or network call |

What is deliberately still not drawn: card `<input>`s (the card panel is a
non-interactive picture of where Stripe's own fields will appear — never a
place to type a card number); tax; a ticked consent (the tick stays disabled —
Terms and refund policy do not exist; the demo does **not** gate Pay on it,
the real product must). A registration that already exists for a start date
disables Pay for that date.

**What it takes to make these real** is recorded in [`../../../docs/execution/ACCOUNT_AND_PAYMENT_REQUIREMENTS.md`](../../../docs/execution/ACCOUNT_AND_PAYMENT_REQUIREMENTS.md), including an inventory of every demo file and what replaces it.


**This does not implement Stripe.** No Stripe.js, no keys, no dependency was
added. The Payments section below still stands as the record of what real
integration requires.

---

## Payments — Stripe

**Recorded, not implemented.** See
[`../../../docs/architecture/ARCHITECTURE_DECISION_REGISTER.md` ADR-014](../../../docs/architecture/ARCHITECTURE_DECISION_REGISTER.md).

The founder confirmed on 2026-09-02 that Stripe is the gateway and that an
account exists. That confirms the Stripe half of ADR-014, which had been
sitting at *PENDING HUMAN APPROVAL*.

**Nothing was implemented in the mockup, and that is the correct outcome:**

1. **There is no backend.** No database, no authentication, no server actions,
   no API routes — by design. ADR-014 requires `orders`/`candidacies` records
   to be authoritative, updated by idempotent, signature-verified webhooks and
   reconcilable after an outage. None of that can exist here.
2. **Entitlement must never derive from the payment provider** (ADR-014). That
   demands real persistence, which the Service Restart Test would fail today.
3. **A payment flow in a mockup would be a simulated success state** —
   explicitly prohibited. A fake "payment received" is the worst possible thing
   to mock. **⚠ Superseded in part, 2026-09-20, by explicit founder
   direction:** a simulated confirmation now exists, confined to the labelled
   demo session (`/checkout/confirmation`, `lib/demoRegistrations.ts`), with a
   "Demo — no payment was taken" banner and never reachable signed-out. The
   prohibition still stands for anything outside that demo.
4. **Refund policy is unresolved** (`OQ-2`, `OQ-9`) and is a prerequisite.
5. **Secrets.** Live Stripe keys must never be handled by an agent or
   committed. They belong in the deployment environment.

**What Stripe needs before it can be built:** candidacy/registration records
in a real backend · the Malaysian rail decision (ADR-014's other half, still
open) · refund policy per product type · the invoicing legal entity and tax
treatment (`OQ-9`) · webhook endpoint with signature verification and
idempotency · `HO-10` (whether individual online payment is offered at all)
resolved.

Until then, every commercial CTA in the portal correctly stops at **explore**
or **enquire** — which is what `HO-10` requires.
