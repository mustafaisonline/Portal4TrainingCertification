# CR-2026-10-02-2016 — Mobile burger menu is not scrollable

**Received:** 2026-10-02 20:16 MYT · **Status:** BUILT & VERIFIED in dev — not deployed · **Requested by:** founder · **Recommended model:** Sonnet 5.5 — one-file UI fix plus an e2e test; this session is Sonnet 5.5

Spec: [`CR-SPEC-2026-10-02-2016-mobile-burger-menu-not-scrollable.md`](specs/CR-SPEC-2026-10-02-2016-mobile-burger-menu-not-scrollable.md)

## 1. Request (verbatim)

> on mobile buger menu is not scrollable, please fix that

*Source: Founder message of 2026-10-02 ("New more change …", seven bullets; the CR for them was requested: "Add a new CR for these requirements").*

## 2. Facts gathered (read-only; nothing changed yet)

- `src/shared/chrome/PublicShell.tsx:162`: the open mobile panel `#mobile-nav` has **no maximum height and no `overflow-y: auto`**. The header is sticky, so on a short phone screen the panel grows taller than the viewport and the lower items (footer links, "More", search link) cannot be reached by scrolling the page.
- The account menu already does this correctly (`max-h-[80vh] overflow-y-auto`, `AccountMenu.tsx`).

## 3. Open questions for the founder

None needed (assumed: scroll inside the open panel; the page behind should not scroll while it is open).

## 4. Plan (after the answers; one CR at a time, on the founder's "go")

Give the panel a viewport-based max height under the header (`dvh` so it respects the mobile browser bar), `overflow-y: auto`, `overscroll-behavior: contain`; keep every link closing the panel. Playwright at 375×600 (a short screen): the last item scrolls into view and is clickable; the existing burger-menu tests and axe stay green. Coordinate with CR-2013 (the avatar in the header).

## 5. Tracker

| # | Step | Status | Updated |
|---|---|---|---|
| 1 | Build | **BUILT** — `max-h-[calc(100dvh-4.5rem)] overflow-y-auto overscroll-contain` on `#mobile-nav` | 2026-10-02 |
| 2 | Verify | **VERIFIED** — new Playwright test at 320×568 and 375×600 fails without the fix, passes with it; `assessment.spec.ts` + `cr-2136-menus-and-admin-labels.spec.ts` 11/11; `tsc` clean. Not run at 390×844 or on a real phone. | 2026-10-02 |
| 3 | Deploy | NOT STARTED (founder's word) | — |

## 6. Progress log

| Date (MYT) | Entry |
|---|---|
| 2026-10-02 20:16 | CR created from the founder's list. Facts gathered read-only.  |
| 2026-10-02 | Executed via `run-cr` (latest open CR). Fix in `PublicShell.tsx`, test added to `assessment.spec.ts`. Full gate (`deploy/04-release-gate.sh`) not run; that happens at deploy. CR-2013 (avatar on mobile) untouched. |
