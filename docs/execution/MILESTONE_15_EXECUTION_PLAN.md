# Milestone 15 — Portal journey, certificates, Stripe live, Contact — Execution Plan & Progress Tracker

> **Status: PLAN ONLY — nothing below is built yet.** Created 2026-09-29 from the
> founder's twelve-part requirement message of the same day. This file is the
> **resume point for Milestone 15**: if the AI's memory is reset, read
> `CLAUDE.md` → `docs/execution/PROJECT_STATUS.md` → **this file**, then continue
> from the tracker in §1 and the log in §9.
>
> **Working agreement (founder, 2026-09-29):** one requirement at a time. For each
> requirement the AI asks for a "go", waits for it, builds it, verifies it, updates
> §1 and §9, and only then asks for the next. **No requirement is started without
> a recorded "go" in §9.** Nothing is committed or pushed unless the founder says so.
>
> **Authority:** this plan authorises nothing by itself. Three things in it cross a
> `CLAUDE.md` protected boundary and each needs its own explicit approval before the
> requirement that depends on it: **schema changes (Rule 1)**, **new dependencies
> (Rule 5)**, and **payment/production change (RED gate)** — plus one **decision-record
> conflict** (DR-03 §3 / DR-04) that must be resolved before any "free certificate"
> is built. They are listed as decisions **Q1–Q9** in §3 with a recommendation each.

---

## 0. The founder's requirement, mapped (section numbers = the founder's)

| Req | Founder's section | One line |
|---|---|---|
| **1** | §1 | Home page: new "How this portal works" section under YOUR LEARNING JOURNEY — three cards (Knowledge Hub, Free Certification, Professional Training) |
| **2** | §2 + §5 | One reusable certificate design system (two types), A4 landscape, branded, printable |
| **3** | §3 | Free Certification certificate + accurate server-side test timing + DB fields |
| **4** | §4 | Professional Training Certificate of Completion (duration, trainer, signature area) |
| **5** | §6 | Public certificate verification page + QR |
| **6** | §7 | True PDF download of the certificate (not a screenshot) |
| **7** | §8 | Stripe LIVE-mode readiness (no keys in Git/chat; verification matrix) |
| **8** | §9 | Contact Us: remove the form; **email only** (WhatsApp dropped by the founder 2026-09-29) |
| **9** | §10 | *Cross-cutting rule:* database safety (inspect first, migrations only, no data loss) |
| **10** | §11 | *Cross-cutting gate:* existing functionality must keep working |
| **11** | §12 | *Cross-cutting gate:* final UI/UX/QA pass across desktop/tablet/mobile |

Req 9, 10, 11 are constraints and closing gates, not separate features; they are
applied inside every requirement and closed out at the end (§7).

---

## 1. TRACKER — update this table after every step

Legend: `NOT STARTED` · `NEEDS DECISION` (blocked on a §3 question) · `READY FOR GO` ·
`GO GIVEN` · `IN PROGRESS` · `BUILT — VERIFYING` · `DONE` (verified, see §9) · `BLOCKED`.

| Req | Requirement | Blocked on | Status | Last update |
|---|---|---|---|---|
| 8 | Contact Us: remove form, email only (WhatsApp dropped) | none | **DONE — verified 2026-09-29** (uncommitted) | 2026-09-29 |
| 1 | Home: How this portal works | none | **DONE — verified 2026-09-29** (uncommitted) | 2026-09-29 |
| 2 | Certificate design system | none — YPT/signatory/HRD assets (Q5) are omitted gracefully until supplied | **DONE — verified 2026-09-29** (uncommitted) | 2026-09-29 |
| 5 | Verification page + QR | none — Q2, Q4 approved | **DONE — verified in dev, UNCOMMITTED** (QR is drawn on the certificates in Req 3/4; migration not yet on production) | 2026-09-29 |
| 3 | Free Certification certificate + timing + DB | none — founder said implement now and review DR-05 later | **DONE — verified in dev, UNCOMMITTED** (DR-05 drafted, **awaiting the founder's read**) | 2026-09-29 |
| 4 | Professional Certificate of Completion | none — Q3, Q8 answered; assets as in Req 2 | **DONE — verified in dev, UNCOMMITTED** | 2026-09-29 |
| 6 | PDF download | none | **DONE — verified in dev, UNCOMMITTED** (Latin-script names only; see log) | 2026-09-29 |
| 7 | Stripe LIVE readiness | founder-side steps only (keys, live webhook, RM 2.00 smoke test) | **CODE/TESTS/DOCS DONE — go-live itself is founder-executed and NOT done** | 2026-09-29 |
| 9–11 | DB safety / regression / final QA | Req 7 parked | **9 and 10 DONE in dev; 11 partly (automated a11y + layout checks; a human look on real phones/tablets still to do); Stripe check waits for Req 7** | 2026-09-29 |

**Recommended order** (smallest and least-blocked first, dependencies respected):
**8 → 1 → 2 → 5 → 3 → 4 → 6 → 7 → 9–11.** Rationale: 8 and 1 are independent and
touch no protected boundary (beyond confirming inputs); 2 is the shared component the
rest reuse; 5 (verification) exists already and only needs extending before
certificates point QR codes at it; 3 and 4 are the two certificate types; 6 needs
both to exist; 7 is a RED-gate production change and goes last so nothing else waits
on live keys.

---

## 2. Pre-flight findings (inspected 2026-09-29, before any change)

Facts verified in the repository — the plan is built on these, not on assumption.

### Already exists (reuse, do not duplicate — founder §10)
- **Professional certificate** (`certificates` table, `src/modules/certificates/*`):
  ID `DAA-YYYY-XXXX-XXXX`, snapshots of holder name / programme title / format /
  completed / issued / expires dates, `listed` opt-in for name search, `revokedAt` +
  reason (so **Valid/Revoked already exists** for professional certificates), yearly
  expiry with a paid renewal (USD 10, effective-dated fee table). Document component:
  `src/modules/certificates/components/CertificateDocument.tsx` — HTML, print via
  `PrintButton` (`window.print()` / browser "Save as PDF"). Its own header records
  that **QR was deferred (E11)** and **no signatory is printed until the founder
  supplies one (E12)**; issuer line "Issued by Your Partner Technologies".
  The holder's document is behind the **reviews gate (E9)**.
- **Free Knowledge Check** (`knowledge_check_attempts`): `startedAt` defaults to
  `now()` at creation and `finishedAt` is set in `finishAttempt` — **both server-side
  today**; `score`, `passed`, `publicId` (`KC-YYYY-XXXX-XXXX`), `holderName` snapshot
  exist. **Elapsed time and percentage are therefore derivable with no new column.**
  Pass mark is one constant, `KNOWLEDGE_CHECK_PASS_PERCENT = 70`
  (`knowledge-check.repository.ts`). A printable **result document**
  (`KnowledgeCheckDocument`, route `/free-learning/knowledge-check/[attemptId]/document`)
  already exists **behind a gate: a Free Learning review + an unlock fee** (admin-
  switchable; Pakistan exempt) — see Q1b.
- **Public verification already exists**: `/verify` (search by ID, or by opt-in listed
  name) and `/verify/[id]` (resolves **both** `DAA-…` and `KC-…` IDs; public, no
  login; the KC page carries an explicit "not a Certificate of Completion" notice).
  `/verify-certificate/[id]` (founder's example) is **not** needed as a second
  system — see Q4.
- **Stripe**: hosted Checkout (server creates the session, browser redirects); webhook
  `/api/stripe/webhook` with signature verification, an insert-only `stripe_events`
  idempotency store, paid/expired/failed order handling, payment rows, refunds.
  `src/config/env.ts` already accepts `sk_live_`/`rk_live_` keys and **warns** when a
  test key is used in production. **No publishable key is used anywhere** (hosted
  Checkout needs none).
- **Content already in the repo**: the Amazon URL for *I Am Datapedia!* (expert
  record; `https://www.amazon.com/dp/B0F1NT87CL`), live topic count
  (`countPublishedTopics`) and question-bank size (`bankSize`), the trainer's
  HRD Corp accreditation record and badge (`/public/hrd-corp/accredited-trainer-badge.png`).

### Does NOT exist (must be supplied or built — never invented)
- **No PDF library and no QR library** (`package.json` has neither). Both are new
  dependencies → Rule 5 (Q2).
- **No WhatsApp number anywhere** in the app or content (the request assumed one; the founder then dropped WhatsApp altogether, 2026-09-29
  exists). **No YPT logo file**, **no HRD Corp organisation logo** (only the
  *trainer's* accreditation badge), **no signatory name/signature image**, and the
  legal drafts still carry the placeholders `[SSM registration number]` and
  `[registered business address]` — so **YPT's legal/company details are not
  established in any approved source**.
- **No "test" entity**: a Knowledge Check draws a random question set per attempt;
  there is no named test to reference (Q3).
- **No `certificate_type` / `certificate_status` on Knowledge Check attempts**;
  professional certificates have no stored **training duration**, **trainer name** or
  **signatory** snapshot.

### Conflicts and risks found
1. **Decision-record conflict (blocks Req 3):** DR-03 §3 and **DR-04** (approved
   2026-09-27/28) say a Knowledge Check result is **not a certificate**, and DR-04
   permits "Free Certifications" only as a *page/menu label*. The founder's §3
   ("Certificate of Achievement… Certificate ID… certificate_type") calls it one.
   `CLAUDE.md` Rule 8/10: this cannot be silently changed → Q1.
2. **The Contact form is load-bearing (Req 8):** `/contact-us?kind=…&programme=…`
   is the destination of "Register interest" (schedule, every training page), the
   Pakistan local-partner checkout message, and "Send enquiry" on the organisation
   section; submissions feed the admin **Enquiries** screen. Removing the form
   changes all of those → Q6.
3. **The home page already has two adjacent explanatory sections** — "Three pathways"
   (individuals / organisations / assess your capability) and "How it works
   (01–04)". The new section overlaps their purpose → Q9.
4. **Going live on Stripe while production is UAT** on the interim
   `sslip.io` host with **DRAFT** legal documents → Q7.
5. **Elapsed time is wall-clock** (start → submit); there is no timer, so a check left
   open overnight would print e.g. 14:02:11. Accurate as recorded; flagged so the
   certificate wording is chosen deliberately ("Time taken" vs "Elapsed time") — Q3.

---

## 3. DECISIONS — needed before the requirements they block

Each has a recommendation; the founder may accept ("Q1–Q9 as recommended"), amend
any, or answer individually. **Record answers in §9.**

### 3.0 FOUNDER ANSWERS — received 2026-09-29 (these OVERRIDE the recommendations below where they differ)

| Q | Founder's answer (verbatim intent) | Effect on the plan |
|---|---|---|
| **Q1** | "No, we still need USD 10 if anyone wants to view and download the certificate." | **The existing review-plus-fee gate STAYS.** The free-test certificate is viewable/downloadable only after the existing gate (Free Learning review + USD 10 fee, Pakistan exempt, admin-switchable — default fee is already USD 10.00). The **attempt is free; the certificate document is paid.** Verification by ID/QR stays ungated. The **intent of DR-05** (a passed free test may issue a "Certificate of Achievement", never the earned credential) is taken as approved; the **DR-05 text will be drafted and shown for the founder's read before Req 3 is built**. |
| **Q2** | "Yes." | `qrcode` and `@react-pdf/renderer` (plus OFL font files) **approved** as the two new dependencies (Rule 5 satisfied). |
| **Q3** | "Yes — it will be a free attempt but for the certificate the user must pay USD 10. Rest of the change, I agree." | Schema change **approved** as proposed: revocation columns on `knowledge_check_attempts`; `training_duration_label` + `trainer_name` snapshots on `certificates` (with a non-destructive backfill). Derived values (time taken, percentage, issue date, ID, type) are **not** stored, per the plan. SQL is shown for review before it is applied. |
| **Q4** | "Yes." | Keep `/verify` + `/verify/[id]`; add `/verify-certificate` → `/verify` redirects. |
| **Q5** | "Agree." | The wording guard is accepted: certificates **never** say "HRD Corp certified/accredited/approved"; only the *trainer's* accreditation is shown. **Assets are still NOT supplied** (YPT logo + legal details, signatory name + signature image, HRD Corp logo authorisation) — they render as clearly marked placeholders until sent; nothing is invented. |
| **Q6** | "User has to send email for coordination." | Contact page = **email only** (`mailto:`). **Update, later the same day: "Remove WhatsApp option, just keep email option" — WhatsApp is dropped entirely** (no row, no config value, no env var). Every "Register interest / Send enquiry / Contact us" button becomes an email link with a prefilled subject naming the training. Existing enquiry rows and the admin Enquiries screen are kept as history. |
| **Q7** | "Yes. Now we can declare the DigitalOcean server as Production — no more UAT." | **Production is declared (not UAT) as of 2026-09-29**, with live card charges accepted while the Terms/Privacy/Refund documents are still DRAFT (the founder's informed choice, recorded). Live keys/webhook are still entered **only by the founder in the server env file**; a live RM 2.00 support-payment + refund smoke test comes before selling a training. Docs that say "UAT" are updated when Req 7 lands. |
| **Q8** | "Get the trainer from the training details. And yes please add expiry date as well." | **Trainer(s) come from the training's linked experts** (`programme_experts`), snapshotted onto the certificate at issue (all linked trainers, in order). The yearly expiry rule stays for the professional certificate. **"Add expiry date as well" is read as: the free certificate also carries an expiry date** — the validity period and whether it can be renewed are **not** stated → open question **Q8b** below (Rule 8: not invented). |
| **Q9** | "OK." | Keep "Three pathways" and "How it works"; add the new section after the journey strip; revisit after review. |

**RESOLVED 2026-09-29 — Q8b: founder "agree[s] with recommendations for Q8b"** (below is the question with the accepted recommendation). **Accepted:** a free certificate is valid **1 year from the pass date**; it **lapses without a paid renewal** (retaking the test is free); the verify page shows **Valid / Expired / Revoked**; the expiry date is **derived** (`finished_at + 1 year`, MYT calendar date) — **no extra column**.

**(Original) Q8b:** (i) How long is a free Knowledge Check certificate
valid — **1 year from the pass date** (same as the professional certificate)?
(ii) When it expires, can the holder **renew** it (a paid renewal like the
professional one — same USD 10 renewal fee table?), or does it simply lapse and the
person retakes the test? (iii) Should the verify page show **"Expired"** once the date
passes? *Recommended:* 1 year, lapses without a paid renewal (retake is free), verify
shows Valid / Expired / Revoked. If accepted as recommended, the expiry date is
**derived** (`finished_at + 1 year`, MYT calendar date) — **no extra column**.

**Q1 — Free-test "certificate" vs DR-03 §3 / DR-04 *(blocks Req 3, and the free half of 2, 5, 6)***
- **1a.** Approve a new decision record **DR-05** that narrows DR-03 §3/DR-04 so a
  *passed* Knowledge Check may issue a **"Certificate of Achievement"** — explicitly
  **not** the Academy's earned credential (DR-01 unchanged; the professional
  *Certificate of Completion* stays the only credential-grade document), with the
  existing "not a credential" disclosure on the certificate and the verify page and a
  matching update to the credential-integrity policy placeholder.
  **Recommended.** Without it Req 3 cannot be built.
- **1b.** *(SUPERSEDED by the founder's answer in §3.0 — the gate STAYS; the text
  below is the original question/recommendation, kept for the record.)* Does the new free certificate **replace** the existing gated "result
  document" (review + fee), or sit **behind the same gate**? Your text says
  "free of charge … earn a certificate when you pass". **Recommended:** the
  certificate for a *pass* is free and un-gated; the old fee/review gate is switched
  off with the **existing admin switch** (no code, no schema, fully reversible),
  the settings and any past unlock orders remain as records.

**Q2 — New dependencies (Rule 5, RED gate): QR + PDF *(blocks Req 5 QR, Req 6)***
Written case: no QR/PDF capability exists; native browser print gives a "Save as PDF"
via the print dialog but not a downloadable, print-ready file and cannot embed a QR
without a generator. Options:
- **A (recommended):** `qrcode` (MIT, small, pure JS, emits **SVG** — vector, crisp in
  print) **+** `@react-pdf/renderer` (MIT; server-side vector PDF, A4 landscape, embeds
  fonts). One shared **layout-token file** (sizes, colours, copy) feeds both the HTML
  preview and the PDF so they cannot drift. Cost: two dependencies, ~a few MB of
  server bundle; runs on the existing Node runtime under PM2; no headless browser.
- **B:** `pdfkit` + `qrcode`. Lower-level drawing; more code for the same fidelity.
- **C:** no new dependencies — print stylesheet (`@page A4 landscape`) + the existing
  `PrintButton`, QR omitted. Does **not** meet "download as PDF / QR verification".
- **D:** headless-Chromium PDF. Rejected: heavy on a 2 GiB Droplet and it *is* a
  render of the page (the founder said not a screenshot).
- Font files (Plus Jakarta Sans — OFL) must be added to the repo for PDF embedding.

**Q3 — Schema changes (Rule 1, RED gate) *(blocks Req 3, 4)***
Founder §10 says *extend, don't duplicate*. Recommended **minimal, additive,
nullable, reversible** migration (present each SQL for review before applying):
- `knowledge_check_attempts`: add `revoked_at`, `revoked_by_user_id`,
  `revocation_reason` (mirrors `certificates`) → gives **Valid/Revoked**.
  **Not added** (derived, so they cannot drift): `time_taken` = `finished_at −
  started_at`; `percentage` = `score / size`; `certificate_id` = existing `public_id`;
  `certificate_issue_date` = `finished_at`; `certificate_type` = constant
  `free_achievement`; `test_id` — there is no named test, so the certificate names
  **"Data & AI Knowledge Check — {size} questions"**. (If you want the literal
  columns stored anyway, say so and I will add them as generated columns.)
- `certificates`: add snapshot columns `training_duration_label`, `trainer_name`
  (nullable). Existing rows are **backfilled from the programme/expert at migration
  time** (data backfill, non-destructive) so an old certificate is not rewritten by
  a later catalogue edit — the same snapshot rule the table already follows.
- Wording choice for elapsed time: **"Time taken"** as requested (recorded
  wall-clock, start → submit).

**Q4 — Verification route *(Req 5)***
Keep the existing **`/verify` + `/verify/[id]`** as the one system (QR encodes
`{APP_BASE_URL}/verify/{certificate-id}`); add a permanent redirect
`/verify-certificate` → `/verify` and `/verify-certificate/:id` → `/verify/:id` so
your example URL also works. **Recommended** (no second verification system).

**Q5 — Branding and legal assets (nothing invented) *(blocks Req 2, 4 rendering)***
Please supply, or tell me to render placeholders clearly marked "to be supplied":
- YPT **logo** file (SVG preferred) and **official legal name**, **SSM number**,
  **registered address**, phone/web for the footer.
- **Authorised signatory** name/title and a **signature image** (E12 previously:
  print no signatory until you give one).
- **HRD Corp logo**: confirm you hold authorisation to display the **organisation**
  logo and supply the official asset. Until then only the existing **trainer
  accreditation badge** is used, beside the trainer's name.
- **Wording guard (binding, `src/content/hrd-corp.ts`):** YPT is **not** an HRD Corp
  Registered Training Provider and no course is HRD Corp Claimable. Certificates will
  **never** say "HRD Corp certified/accredited/approved"; the only HRD statement
  permitted is the *trainer's* accreditation ("HRD Corp Accredited Trainer, ID …"),
  because that one is real and verifiable.

**Q6 — Contact page *(Req 8)***
- Email `sales@yourpartnertechnologies.com` — recorded as **founder-supplied and
  authoritative** (supersedes the page's old "no business email established" note).
- **WhatsApp: DROPPED by the founder (2026-09-29)** — the page carries the email
  option only; no WhatsApp number, link, config value or environment variable exists.
- **CTA fallout — recommended:** keep the `enquiries` table and the admin Enquiries
  screen (existing data preserved, read-only history); stop collecting new form
  submissions; repoint every "Register interest / Send enquiry / Contact us" link to
  the new Contact page, and give those CTAs a `mailto:` with a prefilled subject
  ("Interest: {training}") so the programme context is not lost. The Pakistan
  local-partner checkout message keeps working (its button goes to Contact).

**Q7 — Stripe LIVE *(Req 7; production / payment = RED gate)***
- The integration needs **no publishable key** (hosted Checkout). I recommend **not**
  adding `STRIPE_PUBLISHABLE_KEY` (dead config); say so if you plan an embedded
  Elements checkout later.
- **Keys never travel through chat or Git.** You place `STRIPE_SECRET_KEY`
  (`sk_live_…` or a restricted `rk_live_…` with the documented permission set) and
  `STRIPE_WEBHOOK_SECRET` (`whsec_…`) **only in the server's root-owned production env
  file** (per the deploy runbook); I prepare code, docs and a checklist, and you
  create the **live webhook endpoint** in the Stripe dashboard
  (`https://<domain>/api/stripe/webhook`; events listed in the runbook).
- **Prerequisites to confirm:** (i) the Stripe account is activated for live charges;
  (ii) you accept live card charges while production is **UAT on the interim
  `sslip.io` host with DRAFT Terms/Privacy/Refund documents** — the founder's own call,
  recorded either way; (iii) a **live smoke test** with the existing RM 2.00
  "Support the Academy" payment followed by a refund, before any training is sold.

**Q8 — Professional-certificate content *(Req 4)***
Training duration and trainer come from the snapshot columns in Q3. Multiple
trainers: list all linked trainers in order. Certificate **validity** (spec §5 item
16): keep the existing rule — "Active until {date}", status confirmed at the verify
URL. *(The original "free certificate has no expiry" line is superseded: the founder
asked for an expiry date on it too — see Q8b in §3.0.)*

**Q9 — Home page overlap *(Req 1)***
The existing "Three pathways" and "How it works" sections sit below the diagnostic
band. **Recommended:** add the new section as asked (directly after the hero's
YOUR LEARNING JOURNEY strip), **keep the others for now**, and after you see it
decide together whether "Three pathways" (which duplicates the journey) should be
removed — a one-line follow-up. Note "Assess your capability" in Three pathways still
links the diagnostic, which you previously wanted reachable only from its home band.

---

## 4. REQUIREMENT PLANS

Each block: scope · design/behaviour · files (predicted) · data · tests · acceptance ·
what needs your "go". Files marked (new) do not exist yet.

### Req 8 — Contact Us (do first; small)
- **Scope:** remove the enquiry form from `/contact-us`; show intro copy, **Email**
  (`mailto:`) only, keep visual identity.
  Founder copy: "Have a question about our training, certification or enterprise
  programs? Get in touch with our team."
- **Also:** keep the three route cards? (individuals / organisations / practitioners) —
  they are navigation, not a form; **recommended: keep**, they lead to real pages.
- **Files:** `app/(public)/contact-us/page.tsx` (rewrite), remove `EnquiryForm`
  + its server action (`createEnquiry` public path) — **admin Enquiries and the table
  stay**; a small shared contact helper (the email constant + `mailto:` builders);
  repoint links in `schedule`, `programs`, `programs/[slug]`, `checkout`, `about-us`,
  `faq`, `account/help`, home (Q6).
- **Data:** none changed (form data retained).
- **Tests:** unit (mailto building/encoding); e2e (page has
  mailto, no form, no `<form>`; each repointed CTA resolves; axe); admin Enquiries
  still lists history.
- **Acceptance:** no submit path remains; email clickable; no WhatsApp anywhere;
  nothing invented; existing enquiry rows untouched.

### Req 1 — Home: HOW THIS PORTAL WORKS
- **Scope/copy:** your intro paragraph verbatim; three equal cards; a subtle
  Knowledge → Certification → Professional Training flow (arrows between cards on
  desktop, chevrons stacked on mobile) — not over-designed.
- **Cards:** exact copy as specified. **Numbers are live, not hard-coded:** topics =
  `countPublishedTopics()` shown as "{floor to 10}+ Topics" (383 → **380+**),
  questions = `bankSize()` as "{floor to 100}+ Questions" (3,830 → **3,800+**). Pass
  mark read from `KNOWLEDGE_CHECK_PASS_PERCENT` (not hard-coded; card copy says "the
  required passing score"). Amazon link: from the existing expert-record book URL
  (falls back to hidden if absent — never invented). CTAs → `/free-trainings`,
  `/free-certifications`, `/programs`. "Free" badge on cards 1–2. Original inline SVG
  icons (no icon library — Rule 5).
- **Layout:** `grid md:grid-cols-2 lg:grid-cols-3` (3 / 2+1 / 1), white cards on the
  existing background, rounded, subtle border/shadow, existing tokens and dark mode.
- **Files:** `app/(public)/page.tsx` (insert after `<HomeHero/>`, before the
  diagnostic band), `src/shared/marketing/HowPortalWorks.tsx` (new).
- **Tests:** e2e — section order (after journey strip), three cards, CTA hrefs, live
  counts present, Amazon link, responsive overflow check at 375/768/1280, axe.
- **Acceptance:** matches the copy; numbers follow the database; no console errors.

### Req 2 — Certificate design system (shared, reusable)
- **Design:** one `Certificate` component with a `type` prop
  (`achievement` | `completion`), fixed light "paper" palette (prints the same in dark
  mode, as today), navy/blue brand, subtle geometric Data & AI motif (original SVG),
  premium serif-free corporate typography (Plus Jakarta Sans), clean double border,
  generous whitespace, **A4 landscape (297×210 mm)** layout, and slots for: brand
  lockup (Data & AI Academy + YPT logo), title, presented-to, name, course/test name,
  type-specific fields, date, Certificate ID, QR + verification URL, signature area,
  trainer (completion only), footer with YPT legal/company details, validity/status.
- **Shared tokens:** `src/shared/certificate/tokens.ts` (new) — dimensions, colours,
  copy — consumed by both the HTML view and the PDF (Req 6) so they stay identical.
- **Guards:** no "HRD Corp certified/accredited/approved" text on any certificate
  (Q5); every field comes from snapshot columns (never live catalogue text).
  **As built (refines the original wording):** a missing asset is **omitted gracefully,
  not printed as a bracketed placeholder** (logo → the issuer's name as a wordmark; legal
  details → only what is set; signatory → an empty signature line captioned "Authorised
  Signatory"; HRD Corp logo → not shown until supplied AND authorisation recorded). The
  admin **Design preview** lists exactly what is still missing.
- **Files:** `src/shared/certificate/*` (new). **Scope decision:** the existing
  `CertificateDocument` and `KnowledgeCheckDocument` pages are **not** switched over in
  Req 2 — the professional one moves onto this component in **Req 4** and the free one
  in **Req 3**, together with their content changes (routes, gates and tests unchanged).
- **Tests:** component snapshot/DOM tests for both types; long-name and long-title
  overflow cases; print-CSS check; axe.
- **Acceptance:** both types render from the one component; consistent on screen and
  in print; placeholders visible where assets are pending.

### Req 5 — Verification page + QR (extend the existing system)
- **Scope:** `/verify/[id]` already public; **extend** to show, per spec §6:
  Certificate ID, holder name, type, name of training/certification, issue/completion
  date, **score/percentage (free)**, **status Valid / Revoked** (free needs Q3's revoked
  columns; professional already has it), issuing organisation, **trainer (professional)**.
  Sensitive data stays out (no email, DoB, ID, country). Name search stays opt-in.
- **QR:** server-generated **SVG** encoding `{APP_BASE_URL}/verify/{id}`; shown on the
  certificate (HTML + PDF) and on the holder's page. Aliases per Q4.
- **Files:** `app/(public)/verify/[id]/page.tsx`, `src/modules/certificates/…`
  (verification read-model), `next.config.ts` (alias redirects), a small
  `qr` helper (new; needs Q2).
- **Tests:** integration (read-model per type, revoked/valid, no sensitive fields);
  e2e (visit by ID, by QR URL, revoked shows status, not-found is a real 404).

### Req 3 — Free Certification certificate + timing + DB *(needs Q1, Q3)*
- **Timing:** confirm `startedAt`/`finishedAt` are both set **server-side** (audit
  `startAttempt`/`finishAttempt` — they are today) and that no client-supplied
  duration is ever read; **time taken = finishedAt − startedAt** formatted `HH:MM:SS`.
- **Certificate content:** DATA & AI ACADEMY · **Certificate of Achievement** ·
  "This certificate is proudly presented to" · **candidate name** (the profile name
  snapshot `holderName`) · "for successfully completing" · **Data & AI Knowledge Check
  — {size} questions** · **Score** ("{correct} of {size} · {XX}%") · **Result: PASSED** ·
  **Time Taken** · **Date Issued** · **Valid until {expiry date}** (Q8b) · **Certificate ID (`KC-…`)** · QR + URL · signature
  area · YPT/HRD (trainer-badge rule, Q5) · footer. **Only for a pass**; a fail keeps
  its ID and verify page but gets no certificate (existing U5 rule).
- **Data:** per Q3 (revocation columns only); **no duplicate structures**.
- **Files:** `src/modules/free-learning/knowledge-check.repository.ts` (+ read-model
  helpers), `KnowledgeCheckDocument` → new certificate component, the result page /
  document route, account "Certifications" list link, admin view to revoke (mirrors
  the professional revoke action).
- **Gate (founder, 2026-09-29):** the attempt is free; **viewing/downloading the
  certificate stays behind the existing gate** (Free Learning review + USD 10 fee,
  Pakistan exempt, admin-switchable). The new certificate simply *replaces the
  rendering* of the current result document; the gate, fee setting, unlock orders and
  their tests are unchanged. `/verify` and the QR are never gated. The PDF download
  (Req 6) uses the same gate.
- **Tests:** integration (elapsed-time correctness incl. an injected clock; percentage;
  pass-only; revoke → verify shows Revoked; owner-only access); e2e (finish → pass →
  certificate view; fail → none); regression on the existing KC specs.

### Req 4 — Professional Certificate of Completion *(needs Q3, Q5, Q8)*
- **Content:** DATA & AI ACADEMY · **Certificate of Completion** · presented to ·
  candidate name · "for successfully completing" · **training name** · **Training
  Duration** (snapshot) · **Completion Date** · **Certificate ID (`DAA-…`)** ·
  **Authorized Trainer / Instructor** (from the training's linked experts, snapshotted at issue — founder Q8; trainer HRD accreditation badge only
  with the trainer, per Q5) · **Signature** (authorised signatory once supplied) · QR ·
  URL · YPT logo/details footer · "Active until {date}" per the existing yearly rule.
- **Files:** `src/modules/certificates/issuance.service.ts` (write the two snapshot
  fields at issue), a backfill inside the migration, `CertificateDocument` → shared
  component; holder page and admin certificate view unchanged in behaviour.
- **Tests:** issuance snapshots duration + trainer; backfill correct for existing
  rows; editing the programme later does not change a printed certificate;
  existing certificate specs (issue, renew, revoke, search) stay green.

### Req 6 — PDF download *(needs Q2)*
- **Scope:** "Download PDF" beside the existing Print on both document pages.
  A **route handler** renders the **same shared layout** server-side to a **vector
  A4-landscape PDF** (fonts embedded, QR as vector, no UI chrome, print-ready),
  streamed with `Content-Disposition: attachment; filename="{certificate-id}.pdf"`,
  `Cache-Control: no-store`. **Same authorisation as the on-screen document**
  (owner + existing gates); never a public file URL.
- **Not** a screenshot; no headless browser.
- **Files:** `app/api/certificates/[id]/pdf/route.ts` (new), `src/shared/certificate/pdf.tsx`
  (new), font files in `public/fonts/` or `assets/` (OFL), download buttons.
- **Tests:** route returns `application/pdf`, page size A4 landscape, contains the
  certificate ID, refuses non-owners/ungated; a visual review of the file at 100% in
  a PDF viewer on the dev server (recorded in §9).

### Req 7 — Stripe LIVE readiness *(needs Q7)*
- **Code/config work (small):** keep `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`
  as the only credentials; confirm the production env validator, the `.env.example`,
  the deploy runbook and the monitoring doc describe live values; add a **read-only
  operator check** (`npm run stripe:check`) that, run on the server with the live key,
  reports the key mode, the account's charges-enabled status and which webhook events
  are subscribed — so live readiness is *verified*, not assumed. Nothing secret is
  ever logged or committed.
- **Verification matrix (spec §8), run in Stripe TEST mode now via the existing fake
  gateway + signed-webhook tests, then once LIVE by you:** checkout creates order ·
  successful payment → paid + payment row + registration · failed/expired payment ·
  cancelled checkout (no order confirmation) · webhook signature failure → 400 ·
  **duplicate webhook is a no-op** · enrolment created once · certificate eligibility
  unaffected · refund path.
- **Your side (I cannot do these):** enter the live keys in the server env file;
  create the live webhook endpoint and paste only the *signing secret* into that same
  file; run the RM 2.00 support payment + refund as the smoke test.
- **Tests:** the existing commerce/webhook suites re-run; new cases only where a gap
  is found (recorded in §9).
- **Rollback:** switch the two env values back to test-mode values and reload PM2.

### Req 9–11 — Cross-cutting gates (closed at the end, §7)
Database safety (every migration reviewed, forward-only, nullable/backfilled, applied
to dev and test, then through the release pipeline; **no production data deleted**),
full regression matrix, and the desktop/tablet/mobile/links/console/overflow pass.

---

## 5. Dependencies and new technology summary

| Item | Boundary | Status |
|---|---|---|
| Migration: KC revocation columns; certificate duration/trainer snapshots (+ backfill) | Rule 1 — schema | **approved** (Q3); SQL shown before applying |
| `qrcode` + `@react-pdf/renderer` + font files | Rule 5 — new tech | **approved** (Q2) |
| Free "certificate" wording (DR-05); unlock gate **kept** | DR-03 §3 / DR-04 / Rule 8 | intent approved (Q1); DR-05 text to be read before Req 3 |
| Live Stripe keys/webhook; production payment mode | RED — payment/production | **approved** (Q7); founder enters keys on the server |
| HRD Corp logo use | third-party brand terms | needs founder confirmation (Q5) |

---

## 6. Configuration the founder must supply

| Value | Where it goes | Needed for |
|---|---|---|
| YPT logo (SVG/PNG); YPT legal name, SSM no., registered address, phone/web | repo assets + a `ypt` content module (or send them; I add them) | Req 2, 3, 4 |
| Authorised signatory name/title + signature image | repo asset + content module | Req 2, 4 |
| HRD Corp organisation logo + written confirmation of use | repo asset | Req 2 (optional) |
| `STRIPE_SECRET_KEY` (live) | **server env file only** — never chat/Git | Req 7 |
| `STRIPE_WEBHOOK_SECRET` (live `whsec_…`) | **server env file only** | Req 7 |
| `APP_BASE_URL` (already set) — QR/verification URLs derive from it | server env file | Req 5, 6 |
| ~~`STRIPE_PUBLISHABLE_KEY`~~ | not used by the hosted-Checkout design | — |

---

## 7. Final verification matrix (Req 10 + 11) — run once at the end

- **Routes/regression:** Home · Knowledge Hub · Free Certifications · Professional
  Trainings · register/login · Knowledge Check start/score/finish · certificate
  eligibility/issue/holder page/download/verify · Stripe checkout & enrolment (test
  mode) · Contact · trainer page · admin (Trainings, Offerings, Orders, Coupons,
  Certificates, Enquiries, Free Learning).
- **Suites:** `tsc` clean · Vitest (all) · Playwright (all, production build) · axe on
  every new/changed page.
- **Manual (browser pane):** desktop 1280, tablet 768, mobile 375 — no horizontal
  overflow, all links resolve, no console errors, certificate on screen == print ==
  PDF, QR scans to the verification page.
- **Migrations:** applied to `p4tc_dev` and `p4tc_test`; reviewed SQL recorded; a dry
  run against a copy of production-shaped data before the release tag.

---

## 8. Operating notes for whoever resumes this

- Read `docs/execution/PROJECT_STATUS.md` first; it now points here.
- `main` was clean at `e44e473` when this plan was written; production is UAT
  (Droplet, PM2, `sslip.io`), Stripe **test** mode, email log-only, legal DRAFT.
- Environment: Node 24 via `export PATH="/opt/homebrew/opt/node@24/bin:$PATH"`; one dev
  server at a time; test DB `p4tc_test`.
- Standards that apply to every step: stage files by name; commit/push only when the
  founder says so; never write, echo or commit secrets; tests written and run before
  a requirement is marked DONE; `PROJECT_STATUS.md` updated at each DONE.

---

## 9. PROGRESS LOG (append-only — newest last)

| Date | Entry |
|---|---|
| 2026-09-29 | Founder's twelve-part requirement received. Repository inspected (schema, certificates, KC attempts, verification, Stripe, contact page, home page, assets). This plan written; **no code changed**. Awaiting answers to **Q1–Q9** and a **"go"** on the first requirement (recommended: Req 8, then Req 1). |
| 2026-09-29 | **Founder answered Q1–Q9** (recorded verbatim-intent in §3.0). Unlock gate (review + USD 10) **stays** — free attempt, paid certificate; DR-05 intent approved (text to be read before Req 3); `qrcode` + `@react-pdf/renderer` **approved**; schema change **approved**; `/verify-certificate` redirect **approved**; HRD-wording guard **agreed**; Contact = **email only, WhatsApp hidden** (no number supplied); Stripe live **approved** and **production declared (no more UAT)**; trainers from the training's linked experts; "add expiry date" read as expiry on the free certificate too → **open Q8b**; Three pathways kept. Assets (YPT logo/legal, signatory, HRD logo) **still not supplied** — placeholders until sent. Tracker updated: Req 8, 1, 2, 5, 4, 6, 7 **READY FOR GO**; Req 3 waits only on the DR-05 text read. **No code changed.** |
| 2026-09-29 | **GO given for Req 8 (Contact Us).** Pre-flight inspection of the form's dependants starting. |
| 2026-09-29 | **Q8b resolved: founder agrees with the recommendations** — free certificate valid 1 year from the pass date, lapses without paid renewal, verify shows Valid / Expired / Revoked, expiry derived (no column). Req 3 is no longer blocked on Q8b. |
| 2026-09-29 | **Founder: "Remove WhatsApp option, just keep email option."** WhatsApp dropped from Req 8 entirely (no row/config/env var); plan text revised. |
| 2026-09-29 | **Req 8 DONE (uncommitted).** Founder scope changes during the build: WhatsApp dropped entirely; "no notification emails as of now". **Built:** `/contact-us` is the three route cards + one "Get in touch" section with the founder-supplied email as the only option (no form, no WhatsApp anywhere); an old `?programme=` link still resolves and the email subject keeps the training. New `src/content/contact.ts` (email constant + `mailto:` builders, percent-encoded). Every context button is now an email with a subject: schedule ×3, training-page hero + **price cards** (`ProgrammePricing` takes a new `programmeTitle`), checkout ("Email us" for the Pakistan local-partner message; "Register interest"), organisation "Email our team". Generic "Contact us" links still go to the page. **Removed:** `EnquiryForm.tsx` and the public server action `enquiries/actions.ts` (recoverable from git) — this also removes the notification email; `ENQUIRY_NOTIFY_EMAIL` retired in `.env.example` and the runbook. **Kept:** the `enquiries` table, its repository and the admin Enquiries screen (history, reworded as such) — no data touched, no schema change. FAQ answer "Use the enquiry form…" and the account Help card reworded; the FAQ row updated on dev + test. **Tests:** tsc clean · Vitest 53 files / 511 (new `contact.test.ts`, 6) · Playwright **89/89** (contact-page test replaces the form test: no `<form>` in `<main>`, the mailto, no WhatsApp, old-link subject, axe; schedule/trainings/commerce link assertions updated). The first e2e run caught a real miss — the price cards built their own `/contact-us?…` link that my search had not found — fixed and re-verified. Browser check: desktop, 768 and 375 widths, no overflow; live mailto subjects confirmed. **Follow-ups for the founder (not done, by design):** (1) **production's FAQ row** still says "Use the enquiry form…" until reference data is refreshed there (a one-row update, no deploy needed beyond the next release + reseed step — say when); (2) the **Privacy draft** still lists "the contact form" among data collected (legal drafts are the founder's/counsel's — not edited); (3) `deploy/10-server-bootstrap-serverscript.sh` still carries a commented-out `ENQUIRY_NOTIFY_EMAIL=` template line (harmless; left untouched as deploy scripts are outside this requirement). |
| 2026-09-29 | **GO given for Req 1 (Home — How this portal works).** Pre-flight inspection of the home page and journey strip starting. |
| 2026-09-29 | **Req 1 DONE (uncommitted).** New section "HOW THIS PORTAL WORKS" directly under YOUR LEARNING JOURNEY (before the diagnostic band): the founder's intro verbatim and three equal cards — Knowledge Hub, Free Certification, Professional Training — with the founder's copy, Step 1/2/3 labels, Free badges on the first two, original inline SVG icons, arrows between cards at desktop and downward on mobile (hidden at the 2 + 1 tablet layout, where the numbered labels carry the order). **Live figures, not typed:** "380+ Topics" and "3,800+ Questions" come from `countPublishedTopics()` / `bankSize()` through a new tested `plusCount` (rounds DOWN, so 383 → 380+, never 400+; omits the figure if 0). **No passing percentage is written** (copy says "the required passing score"; the real value stays the one `KNOWLEDGE_CHECK_PASS_PERCENT` constant). The Amazon link is the URL already on the trainer's record (hidden if absent, never invented). CTAs: `/free-trainings`, `/free-certifications`, `/programs`. **Files:** new `src/shared/marketing/HowPortalWorks.tsx`, `src/shared/marketing/plus-count.ts`, `tests/unit/plus-count.test.ts`, `tests/e2e/home.spec.ts`; edited `app/(public)/page.tsx`. No schema, dependency or env change. Existing "Three pathways" / "How it works" kept (Q9). **Tests:** tsc clean · Vitest 54 files / 515 · Playwright **94/94** (5 new: placement below the journey and above the diagnostic band, exact copy, live counts, hrefs and that all three land 200, desktop 3-across / tablet 2+1 / mobile single column with equal card heights and no overflow at 1280/800/375, axe light + dark). Browser check at desktop, 800 and 375. Polish found and fixed in review: CTA buttons aligned at the same baseline across cards (Amazon link moved above the button) and the arrow is glued to the last word so it never strands on its own line. **Flagged for the founder (copy is yours, so unchanged):** (1) card 2 says "earn a certificate" / "Certificate on Passing" — the free certificate itself is Req 3 and DR-05 is not yet adopted, so until then a pass yields a Knowledge Check result with its ID (the printable document sits behind the review + USD 10 gate, per Q1); (2) the card does not mention that USD 10 — consider a short line such as "Certificate document: USD 10" so a visitor is not surprised at the end; say if you want it. |
| 2026-09-29 | **Founder: agrees to add the fee line to the Free Certification card** ("Certificate document: USD 10", read live from the unlock-fee setting) **and gives GO for Req 2 (Certificate design system).** |
| 2026-09-29 | **Req 2 DONE (uncommitted); Req 1 addendum done.** **Addendum (founder "agree … add this line"):** the Free Certification home card now reads "Certificate document: USD 10" — read live from the admin-managed unlock-fee setting (`enabledUnlockSetting`), never typed, and absent if the fee is switched off; covered in `home.spec.ts`. **Req 2 built:** one reusable `Certificate` component (`src/shared/certificate/Certificate.tsx`) for both types — `achievement` (Certificate of Achievement: score, PASSED, Time Taken HH:MM:SS, issued, valid until) and `completion` (Certificate of Completion: training duration, completion date, valid until, authorised trainer(s) with the trainer's OWN HRD Corp accreditation + badge when accredited) — A4 landscape (297 × 210 mm), scaling as one piece with `cqw` container units so screen, print and (Req 6) PDF share proportions; navy double rule, faint original data-network motif, clean sans type, signature area, vector QR + verification URL + Certificate ID, issuer details footer, plain disclosures (achievement: not the Certificate of Completion; completion: not the earned credential; status confirmed only at the verification address). Supporting: `src/content/certificate-brand.ts` (only the issuer's name is set; everything else `null`, plus `certificateBrandGaps()`), `src/shared/certificate/format.ts` (`formatTimeTaken`, `fitStep` — long names/titles shrink), `src/shared/certificate/qr.ts` (`certificateQrSvg`, validates http(s), inline-safe SVG); `LogoMark` gained an optional `style` (default unchanged); a print stylesheet scoped to the certificate page (A4 landscape, zero margin, everything else removed from layout, sheet at 297 × 209.5 mm) — the first version printed 3 pages because the page's own wrappers still took space, caught by the print test and fixed. **New route:** `/admin/certificates/preview` (platform administrators only; sample data with a SAMPLE watermark, sample IDs that do not verify; `?kind=` for one sheet, `?long=1` for stress values; linked from Admin → Certificates → Design preview). **New dependency (approved Q2):** `qrcode` 1.5.4 (+ `@types/qrcode` 1.5.6 dev) — adds ~25 small transitive packages (mostly CLI helpers) to the lockfile; `npm audit` shows no advisory in that tree (the four existing ones are the pre-existing Prisma-related set). No schema, env or payment change. **Tests:** tsc clean · Vitest 55 files / 526 (new `certificate.test.ts`, 11: time format incl. >24 h, fit steps, brand gaps, QR safety/determinism/refusals) · Playwright **99/99** (new `certificate-preview.spec.ts`, 5: admin-only (signed-out → sign-in, participant → 403); both types render every required field with the QR, the trainer and accreditation from the record; no over-claiming (no "HRD Corp certified/approved"), no bracketed placeholders, no invented registration/address; A4-landscape proportions at 1280 and 800 with normal and very long values and nothing outside the sheet; **each certificate prints as exactly one A4-landscape page** (PDF page count and MediaBox verified, all four variants); axe light + dark). The printed PDF was also rendered and inspected visually. **Still needed from the founder for a complete certificate (rendered omitted until then):** YPT logo, registration number, registered address, contact line, authorised signatory name/title + signature image, HRD Corp organisation logo + authorisation. **Next:** Req 5 (verification + QR), then Req 3 and 4 put real data through this component. |
| 2026-09-29 | **Founder supplied the certificate brand details and gave GO for Req 5.** Received: the **YPT logo** (image), **Company No. 202401023226 (1569075-K)**, the **registered address** (15-03A, One Jelatek Condominium, Jalan Jelatek, Kementah, 54200 Kuala Lumpur W.P. Kuala Lumpur Malaysia). Decisions: **no issuer-name text** (the logo carries the name); **no signature and no signature line** ("system generated"); **no HRD Corp logo on the Free-test certificate** (the trainer's own accreditation stays on the Professional one). Applying these to Req 2's design, then starting Req 5. |

*(Add a row for every founder decision, every "go", every requirement completed —
with date, what changed, tests run and their results, and any deviation.)*

---

## 10. Final summary template (filled in when everything is DONE)

1. Files/components changed —
2. Database changes (migration names) —
3. New routes —
4. New certificate functionality —
5. Stripe changes —
6. Contact page changes —
7. Configuration/environment variables required —
| 2026-09-29 | **Req 5 DONE in dev (uncommitted).** **Verify page** (`/verify/[id]`, both ID kinds) now shows: status in words **Valid / Expired / Revoked** (icon + word), Type, holder, programme/format, **training duration and trainer(s)** (Professional, snapshotted at issue), completed/issued dates, **Valid until**, ID and **Issued by: Your Partner Technologies**; Knowledge Check adds score, time taken (server-measured), taken-on, and **Valid until = pass date + 1 year (MYT, last day inclusive)**, plus **Not passed** for a fail. A KC keeps its "result, not a credential" wording until DR-05 is adopted. No email/DoB/ID/country/revocation reason is ever exposed (tests assert the exact public keys). **Schema (approved Q3), additive:** `certificates.training_duration_label`, `certificates.trainer_name`; `knowledge_check_attempts.revoked_at / revoked_by_user_id / revocation_reason` (+FK to users); migration `20260929131017_certificate_verification_fields` also **backfills** the two snapshot columns for existing certificates from their programme (NULL-only, idempotent). Applied to dev and test only — **production not migrated; SQL to be shown to the founder first.** Issuance now snapshots duration + trainers (lead first). `/verify-certificate` and `/verify-certificate/:id` → 308 to `/verify…`. **Not built here (belongs to Req 3):** the admin action that revokes a Knowledge Check — the columns and the verify behaviour exist and are tested. **Tests:** tsc clean · Vitest 55 files / 533 · production build compiles · Playwright **100/100**. |
| 2026-09-29 | **Req 3 and Req 4 DONE in dev (uncommitted); Req 7 PARKED; Req 6 in progress.** **Founder:** implement Req 3 now, review DR-05 later; commit and push only when ALL requirements are done; "Kementah" spelling is right; Stripe parked until the founder can give inputs; run the rest in parallel. **Req 3 (Free Certification):** `DR-05_FREE_CERTIFICATE_OF_ACHIEVEMENT.md` drafted (**provisional — the founder has not read it**); the free result's document is now the shared Certificate of Achievement (name, "Data & AI Knowledge Check — N questions", score "X of N · P%", PASSED, Time Taken HH:MM:SS, issue date, valid-until, KC ID, QR/URL, plain not-the-Certificate-of-Completion disclosure, no signature), pass-only, behind the UNCHANGED review + USD 10 gate (Pakistan exempt); result page shows time taken and validity and the wording "Certificate of Achievement"; a revoked certificate is neither shown nor printable; verify page Type reads "Certificate of Achievement — Free Knowledge Check" for a pass. **Timing** is server-measured (`startedAt` DB default, `finishedAt` set by the server; no client value is read); time = finished − started, derived, not stored. **Admin:** `/admin/free-learning/results` (linked from Admin → Free Learning) finds passed results by exact KC ID / lists the latest and revokes with a reason (3–500 chars, confirmation, audited `knowledge_check.revoked`, permanent; a fail cannot be revoked). Action file renamed `knowledge-check-admin.actions.ts` to satisfy the client-import boundary rule. **Req 4 (Professional):** `CertificateDocument` now renders the shared Certificate of Completion from the stored record — training duration and trainer(s) from the issue-time snapshots, completion/valid-until dates, QR; a trainer's HRD accreditation is printed only beside a trainer matched by exact name (else omitted); never "HRD Corp certified"; revoked → not shown or printable (holder pages say so). **Not changed:** the unlock setting/order label "Knowledge Check result document", refund policy/Terms/Privacy drafts (their wording is for the founder's review), the certificate-renewal flow, no schema change beyond Req 5's migration. **Tests:** tsc clean · Vitest 55 files / 535+ (new: KC timing with an injected clock, certificate data, revoke rules and audit, professional certificate data) · Playwright 101/101 before the Req 4 additions; the Req 4 e2e (`certificates`, `account`) pass; full re-run pending at the end. |
| 2026-09-29 | **Req 6 DONE in dev (uncommitted); Req 9, 10 verified; Req 11 partly.** **Req 6:** `@react-pdf/renderer` 4.9.0 added (approved Q2; lockfile +~55 entries, `npm audit` unchanged — the same 4 pre-existing Prisma-related advisories). `src/shared/certificate/pdf.tsx` draws BOTH certificate kinds as a real vector A4-landscape PDF (exactly one page, vector QR via `qr-path.ts`, built-in Helvetica/Courier so no font files or licences, logo and HRD trainer badge read from `/public`); routes `GET /api/certificates/<DAA-…>/pdf` (owner only, same review gate, revoked → 403, unknown or someone else's → the same 404, signed out → 401) and `GET /api/knowledge-checks/<attempt id>/pdf` (owner only, the same review + USD 10 gate, pass-only, revoked → 403); `Content-Disposition: attachment`, `no-store`; **Download PDF** buttons beside Print on the three document pages. **Limitation (needs a founder decision if it matters):** the standard PDF fonts cover Latin (Windows-1252) text only; a holder or trainer name in another script gets a clear 422 from the PDF route (the on-screen certificate and Print still work). Embedding an open-licence font would lift it. A first draft threw `Infinity` on real data (page with only absolutely-positioned children → zero height); fixed and covered by tests. Build warning about dynamic file reading silenced with the bundler's ignore comment (the path is confined to `/public`). **Req 9 (DB safety):** the only migration is additive (2 nullable columns on `certificates`, 3 nullable + 1 FK on `knowledge_check_attempts`, plus a NULL-only, idempotent backfill); schema diff is +18/−0 lines; no drops, deletes or renames; applied to dev and test only — **production NOT migrated, SQL to be shown to the founder first.** **Req 10 (regression):** tsc clean · Vitest **56 files / 555** · production build compiles with no warnings · Playwright **101/101** (all existing suites, including checkout, coupons, support, reviews, identity, admin), and the PDF specs re-run after the last edits. **Req 11:** every new/changed page is under axe WCAG 2.2 AA (light/dark where the spec covers it); certificate proportions checked at 1280 and 800 px and in print; a human look on real phones/tablets/browsers is still to do, as is the Stripe verification (Req 7, PARKED). |
| 2026-09-29 | **Req 7 (founder "go for requirement 7") — readiness built; going live is the founder's.** Audit found the env validator, runbook and `.env.example` already describe live values (live key shapes, refuse-to-start in production, loud warning for a test key); `STRIPE_PUBLISHABLE_KEY` is intentionally unused (hosted Checkout). **Added:** read-only operator check `npm run stripe:check` (`scripts/stripe-check.ts` + pure `src/modules/commerce/stripe-check.ts`) — reports key MODE, charges-enabled, and whether the endpoint for `APP_BASE_URL` is enabled and subscribed to all nine handled events; never prints a secret; restricted keys that cannot read the account/endpoints get a WARN pointing at the Dashboard; **new tests:** `stripe-check.test.ts` (unit, incl. "handled events == the webhook switch" source guard), `stripe-webhook-route.test.ts` (the HTTP route: no/wrong/tampered signature → 400 and nothing stored, signed → 200, replay → `duplicate: true`, no secret → honest 500), and `async_payment_failed` in `commerce.test.ts`. **New doc:** `docs/operations/STRIPE_GO_LIVE_CHECKLIST.md` (steps, rollback, matrix → proving test), linked from the runbook and operations README. **Finding (not changed):** a refund made in the Stripe Dashboard is recorded as an *ignored* event and leaves the app's order "Paid" — the app's refund flow covers in-product cancellations only (admin-initiated refunds were scoped to a later milestone). **Not done and cannot be by me:** live key on the server, live webhook endpoint, RM 2.00 real-card payment + Dashboard refund. **Tests:** tsc clean · Vitest 58 files / 569 · build clean; Playwright not re-run (no app code changed). |
| 2026-09-29 | **Follow-ups before the production deploy — done in dev (uncommitted).** **Founder:** DR-05 read and approved ("I am fine with this"); bump the legal version; SSM number and address supplied; embed a wider PDF font (yes); wait for the production deploy. **New changes requested:** (1) a person must not get the paid certificate without paying but may see a sample; (2) a sample in Admin → Certificates; (3) Knowledge Hub topic: Topic and Questions tabs. **Built:** shared `src/shared/certificate/sample.ts` (SAMPLE watermark, made-up name, IDs that verify nothing) used by the design preview, the admin tab and the locked result; **locked result page** now shows a sample (never the person's own name, ID, score, time or QR; no print/download buttons) and it disappears once unlocked — the real certificate and its PDF stay behind the same gate; **Admin → Certificates** shows a sample with a Free/Professional switch, Print, and **Download sample PDF** (`/api/admin/certificates/sample-pdf`, admins only: 401/403/400); **topic page** has Topic / Questions (N) tabs (plain links: `?tab=questions`; a quiz `?page=N` link always opens Questions; a "Go to the questions" button ends the Topic tab; questions sit right under the tabs). **Legal drafts:** Company No. 202401023226 (1569075-K) and the registered address filled in; the two placeholders removed from each "About this draft" list and from `LEGAL_PLACEHOLDERS`; "contact form" and "result document" reworded to email / Certificate of Achievement; **version bumped to `DRAFT-2026-09-29`** in all three (test updated). **DR-05 marked Approved.** **Production step this creates:** `LEGAL_DOCUMENT_VERSIONS` on the server must be changed to `{"terms":"DRAFT-2026-09-29","privacy":"DRAFT-2026-09-29"}` with the deploy (people who agreed earlier are asked again at their next registration/checkout). **Tests:** tsc clean · Vitest 58 files / 569 · build clean · Playwright **104/104**. **Open:** PDF font — needs the founder's explicit OK to download the font files (below). |
