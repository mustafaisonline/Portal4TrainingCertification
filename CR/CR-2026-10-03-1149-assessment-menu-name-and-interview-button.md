# CR-2026-10-03-1149 — Menu item "Free Assessment" → "Assessment"; interview button gets "for Free"

**Received:** 2026-10-03 11:49 MYT · **Status:** BUILT & VERIFIED — committed, NOT deployed (awaits the founder's word) · **Requested by:** founder

## 1. Request (verbatim)

> New Change
>
> * Change menu item name 'Free Assessment' to 'Assessment' everywhere required in the portal
> * On this page: https://dataainexus.com/assessment, change 'Prepare for an interview'. Button name to 'Prepare for an interview for Free'.

## 2. Facts gathered

- The menu item is defined once in `src/shared/chrome/site-nav.ts` (`primaryNav` line 49, `footerExplore` line 60); the header, burger menu, account menu, footer and sitemap all read it.
- Other places that carry the menu item's own name: the `/assessment` page title and eyebrow (`app/(public)/assessment/page.tsx:35, 86`) and the home page card (`src/shared/marketing/HowPortalWorks.tsx:121`, "Step 2 · Validate").
- **Not** the menu item, so deliberately unchanged: the product name **"Free Assessment Check"** (the 200-question test and its result/certificate wording, DR-03/DR-04 naming) and the persona card titles; `HomeDiagnostic.tsx` already says "see Assessment".
- The interview card's button is `cta: "Prepare for an interview"` (`assessment/page.tsx:62`, linking `/assessment/interview`); no test asserts that label.
- Tests naming the old label: `tests/unit/site-nav.test.ts`, `tests/e2e/{assessment,cr-2136-menus-and-admin-labels,home,search}.spec.ts`.

## 3. Decisions & assumptions

- "Everywhere required" = the menu item and every label/heading that IS that item (nav, footer, burger, account menu, page title/eyebrow, home card). The "Free Assessment Check" product keeps its name — assumption; tell me if it should also drop "Free".
- Button text becomes exactly "Prepare for an interview for Free" (capital F, as written).

## 4. Plan

Change the strings above; update the tests that name the label; run tsc, Vitest, the affected Playwright specs on the production build; commit. No data model, no dependency. Deploy only on the founder's word.

## 5. Tracker

| # | Step | Status | Updated |
|---|---|---|---|
| 1 | Strings changed: nav (primary + footer, so header/burger/account menu/sitemap), `/assessment` title + eyebrow, home card, interview button | **DONE** | 2026-10-03 |
| 2 | Tests updated and run | **DONE** — tsc clean; Vitest 725/725; on the production build: assessment, menus, home, search, public, readiness, interview specs 41/41; visual check at 375 px (button on one line, no horizontal overflow, header/footer say "Assessment") | 2026-10-03 |
| 3 | Deploy | AWAITING founder's word | — |

## 6. Progress log

| Date (MYT) | Entry |
|---|---|
| 2026-10-03 11:49 | CR created; occurrences mapped; "Free Assessment Check" product name excluded. |
| 2026-10-03 12:05 | Built and verified (see tracker). "Free Assessment Check" (the product) deliberately unchanged. Not deployed. |
