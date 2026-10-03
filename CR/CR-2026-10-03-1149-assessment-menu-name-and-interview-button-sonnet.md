# CR-2026-10-03-1149 — Menu item "Free Assessment" → "Assessment"; interview button gets "for Free"

**Received:** 2026-10-03 11:49 MYT · **Status:** DEPLOYED (`v2026.10.03-2`, commit `f025009`) · **Requested by:** founder

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
| 3 | Deploy | **DONE** — `v2026.10.03-2`, gate green, delta upload, 06-validate PASSED | 2026-10-03 |

## 6. Progress log

| Date (MYT) | Entry |
|---|---|
| 2026-10-03 11:49 | CR created; occurrences mapped; "Free Assessment Check" product name excluded. |
| 2026-10-03 12:05 | Built and verified (see tracker). "Free Assessment Check" (the product) deliberately unchanged. Not deployed. |
| 2026-10-03 13:05 | Founder: "push it and deploy in production". Before deploying, per `deploy-engineer` rule, the two required checks were run on the exact commit `fb76d7d` (project agents are not loaded in this session, so general-purpose agents ran with each agent's definition): **`governance-reviewer` — PASS WITH NOTES** (delta vs live tag `v2026.10.03-1` is 3 string-only source files + tests; no prisma/package/deploy changes; no RED triggers; wording OK — DR-07 already names the menu "Assessment"); **`test-verifier` — PASS** (tsc clean; Vitest 73 files / 725 tests; e2e not run by it — the deploy gate runs the full Playwright suite). Notes fixed: file renamed with the `-sonnet` suffix, spec added (`specs/CR-SPEC-…`). `security-review` not required (no auth, session, payment, upload, env/config or deploy-script change). |
| 2026-10-03 12:10 | Pushed (`4037c48..f025009`, tag `v2026.10.03-2`) and deployed with `--auto-approve` (the session cannot answer prompts; the flag skips prompts only — every gate ran). Server marker: tag `v2026.10.03-2`, commit `f025009006c0`, previous `v2026.10.03-1`. Live: header/footer/home link text "Assessment"; `/assessment` title "Assessment · DataAI Nexus" and button "Prepare for an interview for Free"; no remaining "Free Assessment" menu text; `/api/health` ok; `/`, `/assessment`, `/assessment/interview`, `/privacy`, `/sitemap.xml` 200. |
