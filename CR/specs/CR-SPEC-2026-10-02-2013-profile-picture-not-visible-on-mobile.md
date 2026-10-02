# CR-SPEC-2026-10-02-2013 — Profile picture not visible on mobile

**CR:** [CR-2026-10-02-2013](../CR-2026-10-02-2013-profile-picture-not-visible-on-mobile.md) · **Recommended model:** Sonnet 5.5 — two-file UI change plus an e2e test.

| # | Task | Files | Notes |
|---|---|---|---|
| 1 | Render the account control on phones | `src/shared/chrome/PublicShell.tsx` (`accountSlot` span: `hidden sm:inline-flex` → `inline-flex`; right cluster `gap-2 sm:gap-3` so nothing overflows at 320 px) | |
| 2 | Keep the open menu on screen below `sm` | `src/modules/identity/components/AccountMenu.tsx` (wrapper `static sm:relative`; panel `inset-x-4` below `sm`, `sm:right-0 sm:w-64`) | the panel anchors to the sticky header on phones |
| 3 | Test at 320 and 375 px | `tests/e2e/cr-2136-menus-and-admin-labels.spec.ts` | avatar visible, menu inside the viewport, no horizontal overflow |

Assumption (CR §3 Q1): avatar button in the header, as on desktop. Data model: none. Rollback: revert the commit.
