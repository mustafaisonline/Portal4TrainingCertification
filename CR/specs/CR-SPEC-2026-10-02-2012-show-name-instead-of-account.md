# CR-SPEC-2026-10-02-2012 — Header shows the person's name instead of "Account"

**CR:** [CR-2026-10-02-2012](../CR-2026-10-02-2012-show-name-instead-of-account.md) · **Recommended model:** Sonnet 5.5 — one-component change plus an e2e test.

| # | Task | Files | Notes |
|---|---|---|---|
| 1 | Replace the literal "Account" with the first name (max 16 characters, ellipsis) | `src/modules/identity/components/AccountMenu.tsx` (`firstName`, `data-testid="header-account-name"`) | desktop (`md:`) only, as before; phones show the avatar (CR-2013) |
| 2 | Keep the accessible name `Account menu for <full name>` | same | unchanged; existing profile/account specs rely on it |
| 3 | Test | `tests/e2e/cr-2136-menus-and-admin-labels.spec.ts` | label is "Pia", button no longer contains "Account", aria-label unchanged |

Assumption (CR §3 Q1): first name. Data model: none. Rollback: revert the commit.
