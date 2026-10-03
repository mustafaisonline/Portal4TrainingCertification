# CR-SPEC-2026-10-03-1149 — Menu "Assessment" and the interview button "… for Free"

**CR:** [CR-2026-10-03-1149](../CR-2026-10-03-1149-assessment-menu-name-and-interview-button-sonnet.md) · **Recommended model:** Sonnet 5.5 — string changes plus the tests that name them, no RED gate.

| # | Task | Files | Status | Notes |
|---|---|---|---|---|
| 1 | Menu label "Free Assessment" → "Assessment" (header, burger, account menu, footer, sitemap read one list) | `src/shared/chrome/site-nav.ts` (primaryNav, footerExplore) | BUILT, VERIFIED | "Free Assessment Check" (the product) unchanged |
| 2 | `/assessment` page title and eyebrow; home "Step 2 · Validate" card title | `app/(public)/assessment/page.tsx`, `src/shared/marketing/HowPortalWorks.tsx` | BUILT, VERIFIED | |
| 3 | Interview card button → "Prepare for an interview for Free" | `app/(public)/assessment/page.tsx` (`cta`) | BUILT, VERIFIED | fits one line at 375 px |
| 4 | Tests that name the old label | `tests/unit/site-nav.test.ts`, `tests/e2e/{assessment,cr-2136-menus-and-admin-labels,home,search}.spec.ts` | BUILT, VERIFIED | |
| 5 | Deploy | `deploy/start.sh --env production --tag <next>` | IN PROGRESS | delta vs live `v2026.10.03-1` |

**Data model:** none. **Dependencies:** none. **Rollback:** revert the commit and redeploy (or `deploy/07-rollback.sh`).
**Resume here:** if the deploy is not recorded as done in the CR log, check `deploy/reports/deployment-summary.md` and the live release (`ssh deploy@… readlink /opt/p4tc/releases/current`).
