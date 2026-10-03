# CR-2026-10-03-2250 — Header: theme switch into the menu, notification bell in its place

**Received:** 2026-10-03 22:50 MYT · **Status:** BUILT & VERIFIED — waiting for the founder's approval after he sees the screenshots (not deployed) · **Requested by:** founder · **Model:** sonnet

## 1. Request (verbatim)

> New changes
> * I woudl suggest moving daylight and nightlight items inside burger menu on mobile and on laptop or bigger screen and replace it wiht Bell Notice screen.
> (Earlier the same evening, on the bell: "I cant see Bell notice on mobile?")

## 2. Facts gathered (read-only investigation, 2026-10-03)

- Today the header has, at every width: logo, avatar/account control, the light/dark `ThemeToggle` (icon-only, 36 px) and (below 1024 px) the burger. The bell shows only from 640 px up; on phones an unread badge sits on the avatar (`PublicShell.tsx:142-157`, `NotificationBell.tsx:124`, `MobileUnreadBadge.tsx`).
- The burger menu exists only below 1024 px. At laptop width the only menu is the avatar dropdown (`AccountMenu.tsx`), and it is for signed-in people only. There is no theme control in either menu today.
- Signed-out visitors see only the header theme toggle; if it moves into menus only, a signed-out visitor at 1024 px or wider would have no theme switch (they would follow their operating-system setting, with no override).
- At 320 px the bell overflowed the header in testing (the reason it was hidden on phones); the burger ended at 364 px.

## 3. Decisions needed from the founder (with the assistant's recommendation)

1. **Signed-out visitors on a laptop:** where does their theme switch live? Recommendation: theme row inside the burger (phone/tablet) and inside the avatar menu (signed-in laptop); for signed-out laptop visitors add a small theme switch in the page footer. (Alternative: keep the header toggle for signed-out visitors only.)
2. **Bell on very narrow phones (< ~360 px):** show the bell when it fits and keep the avatar badge only below that? Recommendation: yes.

## 4. Impacted elements

`src/shared/chrome/PublicShell.tsx`, `ThemeToggle.tsx` (needs a labelled menu-row variant), `NotificationBell.tsx`, `MobileUnreadBadge.tsx`, `AccountControls.tsx`, `AccountMenu.tsx`; tests: `tests/e2e/notifications.spec.ts` (the 320 px phone test must be rewritten), `assessment.spec.ts` (burger/`#mobile-nav`/axe), `cr-2136-menus-and-admin-labels.spec.ts` and the identity/profile/account/search specs that touch the header. No schema, payment or dependency change.

## 5. Tracker

| # | Step | Status | Updated |
|---|---|---|---|
| 1 | Founder answers §3 | OPEN | 2026-10-03 |
| 2 | Build (after the answers) | NOT STARTED | — |
| 3 | Verify (tests, reviews) | NOT STARTED | — |
| 4 | Deploy | NOT STARTED | — |

## 6. Progress log

| Date (MYT) | Entry |
|---|---|
| 2026-10-03 22:50 | CR created from the founder's message; existing code inspected read-only; nothing built. |
| 2026-10-03 23:05 | Founder answered the §3 decisions: "I agree with all your recommendation with my few responses." No exception: all recommended (theme switch into burger + avatar menu, footer switch for signed-out laptop visitors; bell shown when it fits, avatar badge only on the narrowest phones). |
| 2026-10-04 01:40 | **Built and verified locally (NOT deployed — the founder asked to see it first).** The light/dark switch left the header: it is now a labelled row ("Switch to dark/light theme") in the burger menu (under "Appearance"), in the avatar menu, and in the footer (so a signed-out visitor on a laptop still has it); all three follow the page's real theme (they stay in step). The bell now shows from 360 px up beside the avatar; below 360 px the count stays as a badge on the avatar. Tests: notifications spec (+2: 375 px phone, laptop & signed-out), 45 header-related e2e + 484 unit tests pass. Screenshots saved for the founder. **Note:** the new "Product" mega-menu (CR-0110) will change this header again; it is built on top of this. |
