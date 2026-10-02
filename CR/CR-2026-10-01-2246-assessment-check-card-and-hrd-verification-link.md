# CR-2026-10-01-2246 — Assessment page: "The Free Assessment Check" as a card; HRD verification link on "Who delivers this"

**Received:** 2026-10-01 22:46 MYT · **Status:** DEPLOYED (`v2026.10.02-1`) · **Requested by:** founder

## 1. Request (verbatim)

> * http://localhost:3100/assessment
>    * Convert section: THE FREE ASSESSMENT CHECK, into a card
>    * Remove section Assess your Data Foundation
>
> • ⁃ On all the training pages e.g., http://localhost:3100/programs/data-blueprint-ai-vibe-coding there is section: WHO DELIVERS THIS. If there is HRD logo then add HRD verification link as well. E,g. For Mustafa Qizilbash we have that link, I provided last time. Please add that.

## 2. My understanding and the facts

| # | Item | What I understand / what exists today |
|---|---|---|
| **A** | `/assessment` — the test section | Below the three persona cards, the page has a full-width **section**: eyebrow "THE FREE ASSESSMENT CHECK", heading **"Assess your Data Foundation"**, the description, the grade list, then the Start card (or sign-in card) and "Your results". *Reading:* turn that block into **one card** titled **"The Free Assessment Check"** (same content: description, grades, start / running / sign-in, and "Your results" inside), and **remove the heading "Assess your Data Foundation"** from it — the persona card above already carries that name, so it stops appearing twice. The anchor `#data-foundation` (the persona card's link target) stays |
| **B** | HRD verification link | The trainer card in "Who delivers this" already shows the **HRD badge** when the trainer has an accreditation, linking to `/programs#hrd-corp`. The trainer's record **already holds HRD Corp's own verification permalink** (`verifyUrl`, the one you gave: `trainers.hrdcorp.gov.my/ecert?id=…`) but **nothing displays it**. *Change:* when the trainer has the HRD badge, the card also shows a **"Verify on HRD Corp ↗"** link (opens HRD Corp's site in a new tab, `rel="noopener noreferrer"`, announced as external) with the Trainer ID. A trainer without an accreditation renders exactly as before. The same card is used on every training page, so **all trainings** get it |

No schema change, no new dependency, no new content invented: the URL is the one already stored.

## 3. Questions (recommendations in *italics*)

1. **Q1 — "Convert into a card".** *Is my reading right: one card holding the whole test block (description, grades, start/running, results), with the heading "Assess your Data Foundation" gone and the card titled "The Free Assessment Check"?* If you meant something else (e.g. a smaller card in the persona row, or keep only the Start button), say so.
2. **Q2 — HRD link wording.** *"Verify on HRD Corp ↗" next to "HRD Corp Accredited Trainer · ID 68923", beside the badge.* OK, or other wording?

## 4. Plan (one step at a time on the founder's "go")

| # | Step | Schema? |
|---|---|---|
| 1 | `/assessment`: the Free Assessment Check block becomes a card; heading removed; tests (`assessment.spec.ts`, `knowledge-check.spec.ts`, axe light + dark) updated | No |
| 2 | Trainer card: HRD verification link (+ Trainer ID); test on a training page and on the trainer without HRD (no link) | No |
| 3 | Regression (tsc, Vitest, `next build`, Playwright prod mode), CR + PROJECT_STATUS update | — |

## 5. Tracker

| # | Step | Status | Updated |
|---|---|---|---|
| 0 | CR written; existing page and `verifyUrl` data surveyed | **DONE** | 2026-10-01 |
| 1 | Assessment Check card | **BUILT & VERIFIED — corrected 23:12**: the page is exactly THREE cards; the check (grades, start/sign-in, results, disclaimer) lives INSIDE card 1 "Assess your Data Foundation"; no section or fourth card below | 2026-10-01 |
| 2 | HRD verification link | **BUILT & VERIFIED** ("Verify on HRD Corp ↗" + Trainer ID, https-only, new tab; unchanged without accreditation) | 2026-10-01 |
| 3 | Regression + docs | **DONE for the affected areas** (assessment/knowledge-check/trainings specs 14 passed incl. a new all-trainings link test; Vitest 717; build clean). A pre-existing flake in `assessment-organisations.spec.ts` (axe before the streamed title) was seen in a full run — unrelated to this CR, left for a later fix | 2026-10-01 |

## 6. Progress log

| Date (MYT) | Entry |
|---|---|
| 2026-10-01 22:46 | CR created from the founder's message. Surveyed `app/(public)/assessment/page.tsx` (section `#data-foundation`), `src/shared/marketing/TrainerCard.tsx` (badge → `/programs#hrd-corp`, no verify link) and the seeded `hrdCorpAccreditation.verifyUrl`. **No code changed.** |
| 2026-10-01 23:05 | Built on "go ahead with CR 3". `/assessment`: the block is ONE panel card (`free-check-card`) titled "The Free Assessment Check" — description, grades, start/running/sign-in and "Your results" inside, divided by rules; the duplicate heading gone. `TrainerCard`: with an accreditation, "HRD Corp Accredited Trainer · ID <id> · Verify on HRD Corp ↗" linking `verifyUrl` (https checked, `rel="noopener noreferrer"`, external-link aria label). Tests updated (`kc-title` text, single-heading assertion) + a new spec asserting the verify link on EVERY published training page. Verified visually at 1280px, light theme. Founder asked to verify implementation 23:02 — confirmed present. |
| 2026-10-01 23:12 | **Founder correction (screenshot): "I still [see] 4 cards, by right there need to [be] 3 cards."** My first reading (a separate full-width card below the personas) was wrong. Fixed: the standalone section/card is deleted; persona card 1 now contains the whole Free Assessment Check — description with bank figure, the grade bands, start / running / sign-in (`StartForm`, `kc-*` testids kept) and "Your results" (`ResultsList`), plus the not-a-credential line. Cards 2 and 3 untouched. Tests updated (`kc-title` = "Assess your Data Foundation", no CTA/anchor, card count counts `persona-card-*` not every `<li>`); assessment + knowledge-check specs: 9 passed (prod build, axe light+dark, phone overflow). Verified at 1440px: exactly 3 cards. |
| 2026-10-01 23:35 | **Founder (screenshot): "This design look horrible, please fix it. May be bring Result into separate setion udner this section: For learners. Add some more relevant text in other cards."** Done: "Your results" moved out of card 1 into its own panel section below the cards (signed-in only; same `kc-history` testids and ResultsList). Cards 2 and 3 gained a facts list each, every figure from the constants/database, never typed — card 2: live role names (`listPublishedSharedRoles`), 100 questions · 5 options, 90 minutes, model answers; card 3: up to 20 own questions after review, consent before starting, results + CSV in the Organisation Dashboard. assessment + knowledge-check specs: 9 passed (prod build, axe light+dark, phone). Verified at 1440px: three balanced cards. |
| 2026-10-01 23:58 | **Founder: updated card-1 text; remove "Start the Free Assessment Check" sub-heading, the bank count and the not-a-credential line; then "match looks and feel of text of card: For learners with other 2 cards."** Done: card 1 is now the same shape as cards 2 and 3 — the founder's paragraph ("… a bank of thousands of questions. The attempts are free, you can retake it as often as you like.") followed by a facts list (Score 60 % or more — earn a graded certificate; Alpha/Bravo/Charlie bands), then the Start / sign-in button at the card foot. The sub-heading, live bank figure and not-a-credential line are gone from the card (the bank size still gates the Start button server-side; the not-a-credential statement still stands on the result/verify pages and in the Terms). Figures and bands from constants, never typed. assessment + knowledge-check specs: 9 passed (prod build). Verified at 1440px: three matching cards. |
