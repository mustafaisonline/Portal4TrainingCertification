# modification.md — Change round M16 (founder, 2026-09-30) — REVISED 2026-09-30 after the founder's answers

**This file is the resume point for this change round.** Read it (then `docs/execution/PROJECT_STATUS.md`)
first in any new session. Update the tracker after every step so the work survives a usage limit or a
lost conversation. Working agreement (unchanged): **one item at a time, each started only on the
founder's recorded "go"; commit/push/deploy only on the founder's say-so.** Nothing below is built yet.

**REVISION NOTICE (2026-09-30, founder's answers, §0b):** the rename to `/certifications` is **CANCELLED** (the page stays `/free-certifications`, name "Free Certifications", DR-04 unchanged); "icons at the Explore level" means a **favicon**; Alpha = 81–100 %; the attempt stays FREE; "Knowledge Check" wording becomes **"Free Assessment Check"**. Where older text in this file conflicts with §0b/§0c, **the newest section wins**. **All assumptions A1–A7 were CONFIRMED by the founder (§0c); A6 was CHANGED (redirect to the trainer's external profile).**

Governance reminders (CLAUDE.md): no schema change without approval (none is expected — see §4); no new
dependency; do not invent business rules — the open questions in §2 are exactly the places where a
rule would otherwise be invented; every change ships with tests, docs and a completion report.

---

## 0. The founder's requirement, verbatim (2026-09-30)

> New more change
>
> * What add icon at the explore level
> * ON this page: /free-trainings
>   * move this section: LEARN FREE at the end before footer section
>   * Remove this text ‘Topics from I Am Datapedia! Read any topic, in the book’s order or by searching for the one you need. Free, no account, nothing saved.’
> * Page /free-certifications,
>   * we want rename this as /certifications
>   * We don’t to give free certification any more. Please remove the three buttons of 50, 100, 200 and any feature and actions or text related to it.
>   * Instead of using words like ‘The free Knowledge Check’, use ‘Assessment’ kind of words etc.
>   * Now this is what we want to do. We only want to keep 200 questions
>     * we want add the time of 3 hours.
>     * Make sure the questions keep changing for everyone and for every attempt from our banks of 3800+ questions
>     * Then there will be three kind of certificate from this certification test
>       * People whose marks are from 60-70% will get certificate name as Charlie
>       * People whose marks are from 71-80% will get certificate name as Bravo
>       * People whose marks are from 60-70% will get certificate name as Alpha  *(sic — see Q2)*
>     * Change text of hero section accordingly.
>     * Then now have no concept of Unfinished takes of tests
>     * Yes, Your results section will be there
> * On this page: /programs,
>   * please remove the trainer image form the training cards
>   * Use the attached reference image as the design direction for the training cards only. Redesign the existing Professional Trainings cards to match this clean, modern style, remove the trainer photos, and keep all other portal pages, navigation, functionality, content, and layout unchanged.
> * Remove this page: /mustafa-qizilbash and it links for the train cards page. In other words no need to add trainer’s dedicated pages concept
> * Every where in the portal wherever HRD is referred, mentioned that its only for Malaysian citizens.
>
> Please make sure implement change in all the relevant places with respect to above new requirements e.g, change at documentation, change at database level, changes are admin side etc.
> Make sure to create a modification.md file to record these change, so we implement one by one even if our limit hit or our memory goes out.

The reference image (two training cards: pill badges, big two-tone title, one-line description,
illustrated hero panel, four icon features, DURATION / FOR / FORMAT rows, a filled "View Details →"
button and an outlined "Watch Trailer" button) is the design direction for **M6 only**. Its hero
illustrations are generated art; they are not reproducible from portal data (see M6 / Q9–Q10).

---

## 0b. The founder's answers and restated requirement (2026-09-30) — BINDING, newest wins

Verbatim answers to the eleven questions in the first version of this file:

> 1 = I meant favicon
> 2 = People whose marks are from 60-70% will get certificate name as Charlie · 71-80% … Bravo · **81-100% … Alpha**
> 3 = Let me give Free Certificate page requirement again
>   * Page /free-certifications, **Keep it as it**
>   * **We still give free attempt for certification.** Please remove the three buttons of 50, 100, 200 and any feature and actions or text related to it.
>   * Instead of using words like ‘The free Knowledge Check’, use **‘The Free Assessment Check’**.
>   * We only want to keep 200 questions — add the time of 3 hours — make sure the questions keep changing for everyone and for every attempt from our banks of 3800+ questions — three kinds of certificate (Charlie 60–70 %, Bravo 71–80 %, Alpha 81–100 %) — change text of hero section accordingly — no concept of Unfinished takes of tests — Yes, Your results section will be there
> 4 = Agree
> 5 = Yes
> 6 = Ignore this in the new card design.
> 7 = Ok
> 8 = NO need
> 9 = Yes,
> 10 = Yes, use something like this ‘HRD Corp claims are normally made through an employer registered with HRD Corp’
> 11 = I mean i dont want trainer's dedicated pages any more.

**Decisions this records (D) and the assumptions I made where an answer was ambiguous (A) — an A is
applied unless the founder objects; each is re-stated when its item gets its "go":**

| Ref | What | Source |
|---|---|---|
| **D1** | Item M1 is a **favicon** (the site's browser-tab icon), not navigation icons | answer 1 |
| **D2** | Grade bands: **Charlie 60–70 %, Bravo 71–80 %, Alpha 81–100 %**; below 60 % = not passed | answer 2 |
| **D3** | **`/free-certifications` stays** (URL, page name "Free Certifications", header + footer labels, Home card). **M3 (rename) is cancelled.** DR-04 (the name) is unchanged | answer 3 "Keep it as it" |
| **D4** | The attempt stays **free**; the three 50/100/200 buttons and everything tied to them go; UI wording "the free Knowledge Check" → **"The Free Assessment Check"** | answer 3 |
| **D5** | One test only: **200 questions, 3 hours**, freshly drawn from the whole bank (3,800+) for every person and every attempt | answer 3 |
| **D6** | **No "unfinished test" concept**: server-side deadline start + 3 h; resumable while time remains; when time is up it is **scored automatically as it stands**; no Unfinished list / Continue / Cancel. "Your results" section stays | answers 3 + 4 |
| **D7** | **Existing results stay exactly as issued and verifiable** (old size, old pass mark, no grade); nothing deleted | answer 5 |
| **D8** | Card redesign (M6): **no "Watch Trailer" button** ("ignore this in the new card design" / "Ok") | answers 6, 7 |
| **D9** | Trainer **dedicated pages are removed**; a trainer's name links **only to their external profile URL, and only if one exists — otherwise no link (plain text)**; the `experts` table stays | answers 9, 11 + third reply |
| **D10** | HRD wording: use the founder's sentence (see M8) | answer 10 |
| **A1** | Favicon artwork = the Academy's own logo mark (`LogoMark`, the blue rising-line square) as an SVG icon; **confirm, or say "use the YPT logo"** | answer 1 gave no artwork |
| **A2** | Percentage is **rounded DOWN** to a whole number before banding (so 70.5 % → 70 % → Charlie; 71.0 % → Bravo; 80.5 % → Bravo; 81.0 % → Alpha). In correct answers of 200: **Charlie 120–141, Bravo 142–161, Alpha 162–200**. The pass mark becomes 60 % (was 70 %) | answer 2 gave whole-number bands only |
| **A3** | The **certificate gate is unchanged** (viewing/printing/downloading still needs the Free Learning review + USD 10, Pakistan exempt, admin-switchable) — the founder asked only that the *attempt* stay free | answer 3 |
| **A4** | Certificate title stays **"Certificate of Achievement"** with a prominent grade line, e.g. **"Grade: ALPHA · 81–100 %"** (screen, print, PDF, verify page, sample, admin). **The founder's answer 6 did not address this — confirm at M5's go, or say the title itself should be e.g. "Alpha Certificate"** | answer 6 was unclear |
| **A5** | Card content (M6): answer 8 "NO need" is read as "**no need for the illustrated hero panel / generated art**". The card keeps badges, two-tone title, description, four icon feature chips (first four `highlights`), DURATION / FOR / FORMAT rows and a filled "View Details →" button. **Confirm — if "NO need" meant something else (e.g. no feature chips), say so** | answer 8 was unclear |
| **A6** | Removed trainer URLs (`/mustafa-qizilbash`, `/trainers`, `/trainers/<slug>`) **redirect (308) to `/programs`** so shared links still land somewhere; say "404 instead" if you prefer | answer 11 |
| **A7** | Existing certificates/verify URLs keep the `KC-` ID prefix (renaming IDs would break links already shared); internal names (tables, modules, ID prefix) are not renamed — only visible wording changes | consistency |

Superseded by the above: the first version's Q1–Q13 (answered or resolved), and item M3.

## 0c. Founder's confirmations (2026-09-30, second reply) — BINDING

> Free attempt: it stays free. Visible "Knowledge Check" wording becomes "The Free Assessment Check". The 50/100/200 buttons and everything tied to them go.
> Now 50/100/200 is gone and only 200 is there. with timer etc etc
> A1 = Yes · A2 = Yes · A3 = Yes · A4 = Yes · A5 = Your understanding is correct · A7 = Yes
> **A6 = Redirect to trainer external profile URL. For Mustafa, it will be: https://medium.com/@mustafaisonline/profile-mustafa-qizilbash-2fb7a294f40f**

| Ref | Status |
|---|---|
| A1 favicon = the Academy logo mark | **CONFIRMED** |
| A2 percentage rounded DOWN before banding; Charlie 120–141 · Bravo 142–161 · Alpha 162–200 of 200; pass mark 60 % | **CONFIRMED** |
| A3 certificate gate unchanged (review + USD 10, Pakistan exempt, admin-switchable) | **CONFIRMED** |
| A4 title stays "Certificate of Achievement" + a grade line ("Grade: ALPHA · 81–100 %") | **CONFIRMED** |
| A5 card = badges, two-tone title, description, four feature chips, DURATION / FOR / FORMAT, "View Details →"; no trailer button, no hero art | **CONFIRMED** |
| **A6 removed trainer URLs → redirect to the trainer's EXTERNAL profile URL** (not `/programs`). Mustafa → the Medium profile above. It is already in the data (`experts.profile.mediumProfile`, seeded from `prisma/seed-data/practitioners.ts`), so the redirect is **data-driven**: a trainer's external profile (`mediumProfile`, else `linkedin`), and if a trainer has neither there is nothing to link to, so **the link is removed** (see the rule below) | **CONFIRMED, CHANGED TWICE** |
| A7 internal names (tables, modules, `KC-` ID prefix) not renamed; only visible wording changes | **CONFIRMED** |

**Link rule (founder, 2026-09-30, third reply — BINDING):** *"Is there is no URL, then remove the link."*
Wherever the portal would link to a trainer, it links **only to the trainer's external profile URL**
(`experts.profile.mediumProfile`, else `experts.profile.linkedin`), opened safely (`rel="noopener
noreferrer"`, new tab, with an "external site" hint for screen readers). **A trainer with no external
profile URL gets NO link at all — the name is shown as plain text.** No fallback link to `/programs` or
anywhere else is invented. The retired internal trainer URLs behave the same way: a trainer with an
external profile → 308 to it; a trainer without one → an ordinary 404 (there is nothing to redirect to).

**No open questions remain.** Each item still starts on the founder's "go" (working agreement); the
founder may say **"go all in order"** to run M2 → M10 without stopping between items (commit/push/deploy
still only on the founder's word).


---

## 1. TRACKER — update after every step

| # | Item | Blocked on | Status | Last update |
|---|---|---|---|---|
| M1 | **Favicon** (browser-tab icon) | none (A1 confirmed) | **DONE — built and verified 2026-09-30, UNCOMMITTED** | 2026-09-30 |
| M2 | Knowledge Hub page: move "Learn free" section to the end; remove the intro text | none | **DONE — built and verified 2026-09-30, UNCOMMITTED** | 2026-09-30 |
| M3 | ~~Rename `/free-certifications` → `/certifications`~~ | — | **CANCELLED by the founder (D3)** | 2026-09-30 |
| M4 | The **Free Assessment Check**: remove 50/100/200 and the "Knowledge Check" wording; one 200-question, 3-hour, freshly-drawn test; hero text; no "unfinished" concept; "Your results" stays | none (A2, A3 confirmed) | **DONE — built and verified 2026-09-30, UNCOMMITTED** | 2026-09-30 |
| M5 | Three graded certificates (Charlie / Bravo / Alpha), 60 % pass mark | none (A4 confirmed); needs M4 first | **DONE — built and verified 2026-09-30, UNCOMMITTED** | 2026-09-30 |
| M6 | `/programs` training cards: remove trainer photo; redesign to the reference style (no trailer button, no hero art) | none (A5 confirmed) | **DONE — built and verified 2026-09-30, UNCOMMITTED** | 2026-09-30 |
| M7 | Remove the trainer dedicated pages and every link to them | none (A6 confirmed: external-profile redirect) | **DONE — built and verified 2026-09-30, UNCOMMITTED** | 2026-09-30 |
| M8 | Everywhere HRD is mentioned: the founder's sentence (Malaysian-citizens / employer wording) | none | **DONE — built and verified 2026-09-30, UNCOMMITTED** | 2026-09-30 |
| M9 | Cross-cutting: docs, DR-06, legal drafts, FAQ seed, admin, DB check, regression | after M1–M8 | **DONE in dev 2026-09-30 (DR-06, legal drafts re-versioned `DRAFT-2026-09-30`, FAQ seed, credential page, HRD scan test) — production follow-ups pending** | 2026-09-30 |
| M10 | Release: commit, tag, CI, deploy, production follow-ups | founder's go | AWAITING THE FOUNDER'S WORD (commit, tag, CI, deploy) | 2026-09-30 |

**Recommended order:** M2 → M1 → M8 → M7 → M6 → M4 → M5 → M9 → M10.
Rationale: M2, M1 and M8 are small and unblocked; M7 removes a route the M6 cards link to; M4 and M5 are
the big business change (do them together, M4 first); M9/M10 close the round.

---

## 2. QUESTIONS — the first round is ANSWERED (see §0b). Kept below for the record; only the A-items in §0b remain open, and each is confirmed when its item gets its go.

**Q1 — "What add icon at the explore level" (M1).** I read this as "please add icons at the *Explore*
level" but cannot tell which. The word "Explore" is the **footer column heading** (Knowledge Hub · Free
Certifications · Professional Trainings · Trainer · About Us · Schedule · FAQ · Reviews · Contact Us).
Do you mean (a) a small icon before each link in that footer "Explore" list, (b) icons on the header
menu items, (c) an "Explore" section somewhere else (which page?), or (d) something else?
*Recommended: (a) footer Explore links, and the same icons on the header items so they match.*

**Q2 — The three grade bands.** Your list gives 60–70 % to Charlie, 71–80 % to Bravo and **60–70 %
again** to Alpha — I assume Alpha is **81–100 %**. Also, 200 questions score in half-percents (70.5 %
is possible), so a value between 70 and 71 needs a rule. *Recommended: percentage is rounded DOWN to a
whole number, then Charlie 60–70, Bravo 71–80, Alpha 81–100; below 60 % = not passed, no certificate.
In correct answers out of 200: Charlie 120–141, Bravo 142–161, Alpha 162–200.* This also changes the
pass mark from 70 % (DR-03) to **60 %**.

**Q3 — Is taking the Assessment still free, and does the certificate still need the review + USD 10?**
"We don't give free certification any more" could mean (a) the attempt is still free but the certificate
is paid (today's gate: a Free Learning review + USD 10, Pakistan exempt, switchable in admin), or (b) the
attempt itself must now be paid, or (c) something else. *Recommended: (a) — keep the gate exactly as it
is; only the wording drops "free" for the certificate (the attempt stays free to take). Say if (b).*

**Q4 — "No concept of unfinished takes."** Proposed behaviour: a started Assessment has a **server-side
deadline of start + 3 hours**. While time remains the person can resume (a page refresh must not lose
the test). When time runs out the attempt is **scored automatically as it stands** (unanswered =
wrong) and becomes a normal result, so there is never an "Unfinished" list, "Continue" button or
"Cancel" — only a running test and results. One running test at a time (starting again opens the
running one). *Recommended as described. Confirm, or tell me what you meant.*

**Q5 — Existing results.** Production (and dev) may hold Knowledge Check results already: sizes 50/100/200,
70 % pass mark, some with a "Certificate of Achievement" and public verify URLs. *Recommended: leave them
exactly as issued and verifiable (old size, old pass mark, "Certificate of Achievement", no grade); new
Assessments follow the new rules. Nothing is deleted.* Alternatively they could be retired — say so.

**Q6 — What is the certificate called?** "Certificate name as Charlie/Bravo/Alpha": e.g.
"Certificate of Achievement — Alpha", or "Alpha Certificate", or "Alpha Certificate of Achievement"?
*Recommended: keep the title "Certificate of Achievement" and add a prominent grade line "Grade: Alpha"
(and the same on verify/PDF/sample) — so the existing DR-05 wording, print design and PDF stay valid.*
Also: should the grade words carry a plain descriptor (e.g. "Alpha — 81–100 %")? *Recommended: yes, the
band is printed under the grade.*

**Q9 — "Watch Trailer" button (M6).** No trailer video exists anywhere in the data (a trailer link would
need a new column — a schema change needing your approval — and real video URLs). *Recommended: leave
the button out for now and keep "View Details →"; add trailers later if you supply them.*

**Q10 — Where do the card's four icon features and the FOR / FORMAT rows come from (M6)?** The
reference shows four short feature chips per card. Portal data has: title, subtitle, level, duration
label, delivery formats, audience summary and a `highlights` list per training. *Recommended: chips =
the first four `highlights` (with a neutral icon each), DURATION = duration label, FOR = audience
summary, FORMAT = delivery format names. The illustrated hero panel is replaced by a tasteful CSS
gradient panel with the training's initial mark (no photos, no generated art).*

**Q11 — What else counts as "trainer's dedicated pages concept" (M7)?** Clear: delete the
`/mustafa-qizilbash` page and its links (footer "Trainer", cards, redirects). Not clear: the **trainer
card on each training's own page** (`/programs/<slug>`) and trainer names/accreditation on certificates.
*Recommended: remove the dedicated page and every link to it; keep trainer NAMES as plain text where
they help (training page "Trainer" card without a link/photo, certificates). The `experts` database
table stays — certificates snapshot trainer names from it.*

**Q12 — Exact HRD wording (M8).** You said HRD is "only for Malaysian citizens". Proposed line wherever
HRD Corp is mentioned: **"HRD Corp claim: Malaysian citizens only."** *Please confirm or give the exact
sentence.* (Legal note for your counsel: HRD Corp levy claims are made through a Malaysian employer
registered with HRD Corp; if the intended rule is about employers/residents rather than citizens the
sentence should say that. I will use your wording.) The HRD Corp *trainer accreditation* (a fact about
the trainer, printed only beside that trainer) is not a claimability statement and is left as is unless
you say otherwise.

**Q13 — What should the removed trainer URLs do?** *Recommended: `/mustafa-qizilbash`, `/trainers` and
`/trainers/<slug>` redirect (308) to `/programs`, so any shared link still lands somewhere useful.*
Alternative: plain 404.

---

## 3. PER-ITEM PLAN

### M1 — Favicon  *(D1, A1)*
The site currently has **no favicon** (no `app/icon.*`, no `metadata.icons`). Add the Academy's logo mark
as the browser-tab icon: `app/icon.svg` (Next.js file convention — no dependency; served at `/icon.svg`
with a `<link rel="icon">` added automatically), plus a PNG `app/apple-icon.png` if the mark renders
cleanly at 180×180 (generated from the same SVG with macOS `sips`/a small script — no new tooling).
Light/dark tab support via a `prefers-color-scheme` rule inside the SVG. Files: `app/icon.svg` (new),
optionally `app/apple-icon.png`; `tests/e2e/public.spec.ts` (the home page HTML has a rel=icon link and
`/icon.svg` returns 200 `image/svg+xml`). No data change, no nav change.

### M2 — Knowledge Hub page (`/free-trainings`)
1. Move the **"Learn free"** section to the very end of the page, immediately before the footer.
2. Delete the sentence "Topics from *I Am Datapedia!* Read any topic, in the book's order or by searching
   for the one you need. Free, no account, nothing saved."
Files: `app/(public)/free-trainings/page.tsx`; tests `tests/e2e/free-learning.spec.ts` (order + text
absent). No data change.

### M3 — ~~Rename `/free-certifications` → `/certifications`~~  **CANCELLED (D3)**
The page, its URL, its name "Free Certifications" and DR-04 stay as they are. Nothing to do. (Kept here
so nobody re-plans it.)

### M4 — The Free Assessment Check (200 questions, 3 hours, always fresh)  *(D4–D7, A2, A3)*
**Behaviour**
- Page stays **`/free-certifications`**. Remove the `StartForm` size buttons (50/100/200), the "Choose a
  size" card, the "Unfinished" card and every text tied to sizes/"no time limit"; replace the wording
  "the free Knowledge Check / Give free test and gain certification" with **"The Free Assessment Check"**
  (page, hero, `kc-title`, Home card, header/footer where they say Knowledge Check, emails, admin labels,
  docs, legal drafts). Internal names (tables, modules, `KC-` IDs) are **not** renamed (A7).
- One fixed size: **200 questions**; `KNOWLEDGE_CHECK_SIZES` → one constant `[200]`; `startAttempt` accepts
  only 200 and still refuses honestly when the reviewed bank has fewer than 200.
- **Fresh draw every attempt (D5):** the existing draw already shuffles the whole reviewed pool with a
  cryptographic source per attempt, so every person and every attempt gets a different set from the whole
  bank. Add a test proving two attempts (same person, different people) differ. *(A "don't repeat
  questions you saw recently" rule would be a fairness rule — not added unless asked.)*
- **3-hour limit, server-enforced (D6):** deadline = `started_at + 3 h` (derived; no column). Saving answers
  after the deadline is refused; the running page shows a countdown; on expiry the attempt is **scored
  automatically as it stands** (unanswered = wrong), lazily whenever an expired attempt is read (results
  list, attempt page, save/finish) — **no new scheduled job or infrastructure**. One running test per
  person at a time (starting again opens the running one).
- **No "unfinished" concept:** remove the Unfinished list, Continue and Cancel/Delete-unfinished
  (`CancelAttempt`, `cancelUnfinishedAttempt`, `kc-unfinished`); only a running test and finished results.
- **"Your results"** section stays (per-result stats, delete-own-result rules unchanged).
- **Hero copy (draft for approval):** eyebrow "Free Certifications"; title "Take the Free Assessment
  Check. Earn a graded certificate."; body "A 200-question, 3-hour assessment drawn from a bank of 3,800+
  questions — different every time. Score 60 % or more and earn a certificate: Charlie, Bravo or Alpha.
  The attempt is free."
**Files:** `knowledge-check.repository.ts`, `knowledge-check.actions.ts`,
`app/(public)/free-certifications/{page,StartForm,ResultsList}.tsx`, `[attemptId]/{page,AttemptForm,CancelAttempt}.tsx`,
`result/page.tsx`, `HowPortalWorks.tsx`, `unlock.service.ts` labels, admin `app/admin/free-learning/results/*`,
tests (`knowledge-check*.spec.ts`, `knowledge-check.test.ts`, `free-learning*.spec.ts`).
**Database:** none expected (size stays an `Int`; time derived; grade derived — §4). **Existing results
untouched (D7).**

### M5 — Graded certificates  *(D2, A2, A4; needs M4)*
- Pure `assessmentGrade(score, size)` → `charlie | bravo | alpha | null` per A2 (unit-tested at every
  boundary for size 200: 119/120, 141/142, 161/162; and the floor rule at .5 percents); `passed` uses the
  60 % mark **for new (200-question) attempts only** — old results keep their old pass mark (D7).
- Certificate (screen, print, PDF, sample, admin sample tab, verify page, result page, emails): title
  "Certificate of Achievement" + grade line per **A4** (confirm at the go); the admin sample tab shows one
  sheet per grade; the band is printed under the grade.
- Verify page: type + grade + band for new results; old results keep their old presentation.
- Admin results page: Grade column and filter; revoke unchanged.
- Docs: **DR-06** (below) records the assessment, the grades, the 60 % mark and the 3-hour limit.

### M6 — `/programs` training cards  *(D8, A5)*
- `CourseCard.tsx` — check every place it is used (`/programs`; Home / search may share it) before
  changing: remove the trainer photo and trainer links; restyle to the reference: pill badges (level;
  "Flagship"), large two-tone title, one-line description, four icon feature chips (first four
  `highlights`, a neutral inline icon each), DURATION / FOR / FORMAT rows, a filled **"View Details →"**
  button. **No "Watch Trailer" (D8). No illustrated hero panel (A5)** — the top of the card is a clean
  tinted band with the badges.
- Untouched by instruction: navigation, other pages, pricing blocks, content, layout outside the cards.
- Tests: `public.spec` / `trainings.spec` (cards render; no photo; no trainer link; exact order), axe
  light + dark, 375 / 768 / 1280 px screenshots reviewed.

### M7 — Remove the trainer dedicated pages  *(D9, A6 — confirmed and changed)*
- The trainer's **dedicated page content is removed** (about, quote, background, books, frameworks,
  podcast, community, accreditation card … — everything in `app/(public)/[slug]/page.tsx` and `BackLink.tsx`)
  together with **every link to it** (footer "Trainer", card/trainer links, sitemap, search, `site-nav.ts`,
  `tests/unit/site-nav.test.ts`). **Removal of a page is authorised by this instruction.**
- **The old URLs redirect to the trainer's EXTERNAL profile (A6):** `/mustafa-qizilbash` (and `/trainers`,
  `/trainers/mustafa-qizilbash`) → **https://medium.com/@mustafaisonline/profile-mustafa-qizilbash-2fb7a294f40f**.
  Implemented **data-driven**, not hard-coded: the top-level `[slug]` route becomes a content-less
  redirect (`permanentRedirect(externalUrl)` when the slug is a published trainer with
  `profile.mediumProfile` — else `profile.linkedin` — otherwise a normal 404), and `/trainers/:slug` →
  `/:slug` keeps chaining into it. A trainer with neither URL simply 404s (nothing invented). Because it
  reads the `experts` row, a future trainer with an external profile URL works with no code change.
- **Link rule (founder, third reply):** wherever a trainer's name is shown (training cards/pages,
  certificates' on-screen trainer block), it is a link **only when the trainer has an external profile URL**
  (to that URL, opened safely in a new tab); **with no URL there is no link — plain text.** One small helper
  (`trainerProfileUrl(expert)`) decides this everywhere so the rule cannot drift; unit-tested for Medium →
  LinkedIn → none, and that only `https:` URLs are accepted.
- **Trainer names (D9, refined by the link rule above):** shown on training pages and certificates as text;
  linked to the external profile only when one exists. The PDF/print certificate stays plain text (a printed
  link adds nothing). The `experts` table and admin data stay (certificates snapshot names; the profile URL
  is existing data).
- Tests: `/mustafa-qizilbash` → 308 to the Medium URL (Location header asserted; not followed); an unknown
  slug, and a trainer with no external URL, are 404; a trainer name renders as a link only when a URL exists; no page links to `/mustafa-qizilbash`; the sitemap has no trainer URL; nav test.

### M8 — HRD wording everywhere  *(D10)*
Wherever HRD Corp is referred to, add the founder's wording. **Proposed sentence (combines the two
instructions; confirm at the go):** *"HRD Corp claims are for Malaysian citizens and are normally made
through an employer registered with HRD Corp."* Places: `src/content/hrd-corp.ts`, `HrdCorpSections.tsx`,
`HomeHero.tsx`, `CourseCard.tsx`, `ProgrammePricing.tsx`, `programs/page.tsx`, `programs/[slug]/page.tsx`,
admin fee screens (`TrainingFeeForm`, `fees/page`), checkout/pricing copy (`pricing.ts` region text), FAQ
seed (`prisma/seed-data/faq.ts` — **production FAQ needs the re-seed step**), legal drafts (`terms.ts`,
`privacy.ts`, `refund-policy.ts` where they mention HRD), `ProfileForm` hint. A trainer's own HRD Corp
*accreditation* (a fact about the trainer, printed only beside that trainer) is not a claimability
statement and stays as is. A unit test scans the listed components' copy for "HRD" without the
qualifier so a future mention cannot slip in.

### M9 — Cross-cutting
**DR-06** (Free Assessment Check: 200 questions, 3 hours, 60 % pass mark, Charlie/Bravo/Alpha; amends DR-03 §2.4/§3, and DR-05's title only if A4 changes it — it does **not** touch DR-04's page name); CLAUDE.md row (on OK); `PROJECT_STATUS.md`; `docs/` mentions of "free Knowledge Check /
Free Certifications / 50-100-200 / 70 %"; legal drafts (Terms, Privacy, Refund, Credential-integrity
policy page) re-worded and **re-versioned** (`DRAFT-<date>`, and the production `LEGAL_DOCUMENT_VERSIONS`
must follow); FAQ seed; admin labels; migration/DB check (none expected); full regression (tsc, Vitest,
build, Playwright against the production build); secrets scan.

### M10 — Release
Commit (verified file list, no bulk add), push, tag, CI, `deploy/start.sh --audit` then
`deploy/start.sh --env production --tag … --yes` **only on the founder's word**; then production
follow-ups (`LEGAL_DOCUMENT_VERSIONS`, FAQ refresh, real-device look).

### Rule for old vs new results (as implemented — `src/modules/free-learning/assessment-rules.ts`)
`size === 200` uses the **current** rules (60 % pass mark, graded Charlie/Bravo/Alpha, 3-hour limit). Any other size (50/100) uses the **legacy** rules (70 % mark, never graded). The stored `passed` value is **never recomputed**. Consequences: an old 200-question result that passed now shows a grade; an old 200-question result that failed at 70 % stays failed; old 50/100 results show no grade. Visible wording for old results also reads "Free Assessment Check" (size and score unchanged).

---

## 4. Impact analysis — database, admin, documentation

| Area | Effect |
|---|---|
| **Database schema** | **None expected.** Assessment size stays `Int` (only 200 accepted by code); the 3-hour deadline is `started_at + 3 h` (derived); grade is derived from `score`/`size`; existing rows are untouched. If a stored grade or a deadline column is ever wanted, that is a **RED-gate schema change → stop and ask.** |
| **Database data** | Existing attempts/results stay (Q5). No deletion. The unlock setting label "Knowledge Check certificate" and the order title are stored records — relabelling them is a data edit (ask before changing stored order titles). |
| **Admin** | `/admin/free-learning/results` (rename to Assessment results, grade column/filter); admin nav labels; certificate sample tab shows the three grades; unlock fee screen wording; trainer pages are not admin-editable public pages any more (experts data stays). |
| **Public pages/routes** | `/free-certifications` **stays**; the old trainer URLs → 308 to the trainer's external profile (A6); `/free-trainings` reordered; `/programs` cards redesigned; a favicon is added. |
| **Legal / policy** | Terms, Privacy, Refund policy, credential-integrity policy: "free Knowledge Check", "result document", pass mark, and (M8) HRD wording — all DRAFT documents; version bump needed. |
| **Decision records** | New **DR-06** (Free Assessment Check + grades + 60 % + 3 h) amends DR-03 §2.4/§3 (sizes, 70 % mark) and DR-05 (title, only if A4 changes it). **DR-04 is unchanged** (page name stays). |
| **Tests** | Update/replace every e2e/integration/unit test that names 50/100/200, "Knowledge Check" wording, the 70 % mark, the Unfinished list, the trainer page. |
| **Deploy** | Normal governed release; production follow-ups listed in M10. |

---

## 5. Progress log (newest last)

| Date | Entry |
|---|---|
| 2026-09-30 | **File created.** Founder's round M16 recorded verbatim; code surveyed (footer "Explore" heading, `/free-certifications` page + `StartForm`/`ResultsList`, `KNOWLEDGE_CHECK_SIZES=[50,100,200]` and the 70 % constant, top-level `[slug]` expert page, `CourseCard`, HRD mentions in ~25 files). 13 open questions (§2) raised with recommendations. **No code changed.** Waiting for answers and a "go" on the first item. |
| 2026-09-30 | **Founder's answers received; file REVISED.** M3 (rename) cancelled — `/free-certifications` stays (DR-04 unchanged); M1 is a favicon; Alpha = 81–100 %; attempt stays free, wording "The Free Assessment Check"; no unfinished tests (auto-score at 3 h); existing results kept; no Watch Trailer; trainer names kept as plain text, dedicated pages removed; HRD sentence supplied. Seven assumptions (A1–A7) recorded in §0b for confirmation at each item's go. Favicon survey: the site currently has none. **No code changed.** Waiting for the founder's "go". |
| 2026-09-30 | **Founder confirmed A1–A7; A6 changed** (trainer URLs redirect to the trainer's external profile URL — Mustafa: the Medium profile, already stored as `experts.profile.mediumProfile`; implemented data-driven). M7 plan rewritten; tracker unblocked (M1, M2, M4, M5, M6, M7, M8 all READY). **No open questions. No code changed.** Waiting for the founder's "go" (or "go all in order"). |
| 2026-09-30 | **Founder's third reply: "If there is no URL, then remove the link."** Rule recorded (§0c "Link rule" and M7): a trainer name is linked only to an external profile URL that exists (Medium, else LinkedIn); no URL → plain text, no link, and the old internal URL 404s. D9 and A6 rows updated. **No code changed.** Still waiting for the "go". |
| 2026-09-30 | **Founder: "go ahead — run in parallel where possible".** Work split: agent A = M4+M5 (assessment + grades), agent B = M6+M7 (cards + trainer pages, incl. the trainer link rule); main session = M1 favicon, M2 Knowledge Hub page, M8 HRD wording outside B's files, M9 legal/FAQ/DR-06. Agents write code + vitest/tsc only; the main session runs the build and Playwright once at the end (shared DB/ports). M1, M2, M8-part, M9-part built. |
| 2026-09-30 | **M1–M9 BUILT AND VERIFIED (uncommitted).** Two parallel agents (A: M4+M5, B: M6+M7) plus the main session (M1, M2, M8, M9). **Verification:** tsc clean · Vitest 61 files / 606 · production build clean · Playwright **107 tests** against the dev server (3 failures fixed: a grade-sheet overflow of 10 px in the long variant → grade line trimmed; a dark-mode axe check that sampled a mid-transition colour → transitions disabled in the test; the FAQ page still linking `/trainers` because the test/dev DBs had the old FAQ rows → re-ran the idempotent seed) and **106/106** against the production build (one unreproducible first-request flake in `knowledge-check.spec.ts`, then 3 clean repeats). The cards were screenshotted at 1280 and 375 px. **Pre-deploy notes:** (1) production needs `npm run db:seed` for the FAQ text (or edit FAQ rows in admin); (2) `LEGAL_DOCUMENT_VERSIONS` must become `{"terms":"DRAFT-2026-09-30","privacy":"DRAFT-2026-09-30"}`; (3) an old *unfinished* attempt older than 3 h is scored (zero answers → "Not passed") the next time its owner opens it — intended by D6; (4) the stored unlock-fee label is still "Knowledge Check result document" (also the Stripe product name) until an admin edits it at `/admin/orders/unlock`; (5) admin-uploaded training photos are no longer shown publicly (the card was the only place); (6) the Contact page's "For practitioners" button became "About the Academy" → `/about-us` (its target page is gone). No schema change. **Awaiting the founder's word to commit, tag and deploy.** |
