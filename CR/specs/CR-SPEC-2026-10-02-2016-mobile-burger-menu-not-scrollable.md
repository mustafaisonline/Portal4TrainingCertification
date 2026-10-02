# CR-SPEC-2026-10-02-2016 — Mobile burger menu not scrollable

**CR:** [CR-2026-10-02-2016](../CR-2026-10-02-2016-mobile-burger-menu-not-scrollable.md) · **Recommended model:** Sonnet 5.5 — one-file UI fix plus an e2e test, no RED gate.

| # | Task | Files | Notes |
|---|---|---|---|
| 1 | Cap the open panel to the viewport below the header bar and scroll inside it | `src/shared/chrome/PublicShell.tsx` (`#mobile-nav`, ~line 160): `max-h-[calc(100dvh-4.5rem)] overflow-y-auto overscroll-contain` | header row ≈ 68 px (`py-3.5` + 40 px buttons); 4.5rem leaves margin; `dvh` follows the mobile browser bar |
| 2 | Regression test at 320×568 and 375×600 | `tests/e2e/assessment.spec.ts` (new test before the footer-links burger test) | panel `overflow-y: auto`, content taller than panel, panel bottom within viewport, last link (`/refund-policy`) scrolls into view and is clickable |
| 3 | Run related specs | `assessment.spec.ts`, `cr-2136-menus-and-admin-labels.spec.ts` | existing burger and axe checks stay green |

**Data model:** none. **Dependencies:** none. **Rollback:** revert the commit.
**Not in scope:** CR-2013 (avatar on mobile) — separate CR; the account menu already scrolls (`max-h-[80vh]`).
