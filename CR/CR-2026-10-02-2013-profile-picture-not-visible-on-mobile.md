# CR-2026-10-02-2013 — Profile picture not visible on mobile

**Received:** 2026-10-02 20:13 MYT · **Status:** NOT STARTED — root cause identified, fix waits for the CR queue · **Requested by:** founder

## 1. Request (verbatim)

> ⁠profile picture not visible on mobile

*Source: Founder message of 2026-10-02 ("New more change …", seven bullets; the CR for them was requested: "Add a new CR for these requirements").*

## 2. Facts gathered (read-only; nothing changed yet)

- `src/shared/chrome/PublicShell.tsx:142`: the header wraps the whole account control in `<span className="hidden sm:inline-flex">` — below 640 px the avatar/account menu is **not rendered in the header at all**, so a phone shows no picture (and no way to open the account menu except via the burger menu).
- The avatar itself (`AccountMenu.tsx`, `data-testid="header-avatar"`, `/api/me/photo`) is not size-gated; only the wrapper is hidden.
- The burger menu carries the account links (CR-2136) but shows no avatar/name.

## 3. Open questions for the founder

1. On a phone, show the **avatar button in the header** (next to the theme toggle and burger) that opens the same account menu — or show the picture and name at the top of the burger menu instead? (assumed: avatar in the header, as on desktop; also at the top of the burger menu is optional)

## 4. Plan (after the answers; one CR at a time, on the founder's "go")

Remove the `hidden sm:` gate (adjust header spacing so search/theme/burger still fit at 320–375 px); account menu panel must stay on-screen (max width, right-aligned). Playwright at 375 px for signed-in with and without a photo; axe; check it does not collide with CR-2016 (burger scroll). No data model.

## 5. Tracker

| # | Step | Status | Updated |
|---|---|---|---|
| 1 | Founder confirms the placement | **AWAITING founder** | — |
| 2 | Build + verify at 320/375/640 px | NOT STARTED | — |

## 6. Progress log

| Date (MYT) | Entry |
|---|---|
| 2026-10-02 20:13 | CR created from the founder's list. Facts gathered read-only.  |
