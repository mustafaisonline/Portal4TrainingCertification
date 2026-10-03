# CR-2026-10-04-0110 — "Product" mega-menu in the header (desktop only) and "Professional Trainings" renamed "Trainings"

**Received:** 2026-10-04 01:10 MYT · **Status:** ASSESSED — awaiting the founder's answers (§3) · **Requested by:** founder · **Model:** sonnet

## 1. Request (verbatim)

> New Change
>
> * I am thinking to have submenu concept e.g, we introduce a new Menu items: Product on header menu. When user clicks it, a submenu opens on top of Hero section, having menu all possible menu items we have, in a categories manner.
>    * 1st Category: Learning, which will have Knowledge Hub, Assessment items. Assessment to have more submenu as 'Assess You Data Foundation' and 'Prepare for Interview'
>    * 2nd Cetegory: Professional Training
>       * Change it name to Trainings
>       * It will have list of all the currently created trainings, we can show 4-5 and then more link we can give, for user to land on programs page to see the trainings.
>    * 3nd Category: Dashboard
>    * 4th Category: Agentic AI: This is the new Page I want to introduce.   [see CR-2026-10-04-0111]
>    * We can an item: Subscription:   [see CR-2026-10-04-0113]
>    * And so other with all the other categories. Many sure it does overflow from the screen.
>    * Please note this overflow submenu is not for mobile

## 2. Facts gathered (read-only, 2026-10-04)

- Header today (`src/shared/chrome/PublicShell.tsx`, one source `site-nav.ts`): Home (logo) · Knowledge Hub · Assessment · Professional Trainings · Reviews, a search box, the account/bell, and (below 1024 px) the burger. The burger panel and the footer list the same items (a unit test, `site-nav.test.ts`, checks every link has a page). The burger panel is the mobile navigation and stays as it is (the founder: the mega-menu is **not for mobile**).
- Assessment page offers the Free Assessment Check ("Assess your data foundation") and Interview preparation; names/URLs: `/assessment`, `/assessment/interview`.
- The Professional Trainings label appears in the nav, page headings/metadata and several tests; the page title is already "Trainings" (h1). Renaming the label is a labels/tests change; URLs stay `/programs`.
- Dashboard links depend on the signed-in role (User Dashboard, Trainer, Organisation, Admin); signed-out people have none.
- Header tests that would change: `assessment.spec.ts` (burger/nav), `cr-2136-menus-and-admin-labels.spec.ts`, `public.spec.ts`, `search.spec.ts`, `site-nav.test.ts`.

## 3. Questions for the founder (with the assistant's recommendation)

1. **Top bar after the change:** keep today's items and add "Product", or let "Product" hold Knowledge Hub / Assessment / Trainings / Dashboard / Agentic AI / Subscription so the top bar becomes just **Product · Reviews** (+ search, bell, avatar)? Recommendation: the second — otherwise every item appears twice. Reviews and Contact Us stay in the bar.
2. **Dashboard category:** show only what the signed-in person may open (User Dashboard, My Trainings, Notifications, Orders & receipts, plus Trainer / Organisation / Admin dashboards when they hold that role); for signed-out visitors show "Sign in". Recommendation: yes.
3. **Trainings list in the panel:** show the first 5 published trainings (in the order of the Trainings page) with "See all trainings →". Recommendation: yes.
4. **Behaviour:** opens on click (also by keyboard: Esc closes, arrow keys move), full width under the header over the page content ("on top of the hero"), closes when you click outside; never wider than the screen. Recommendation: yes.
5. **Rename scope:** "Professional Trainings" → "Trainings" in the header, panel, footer, page metadata and tests; URLs unchanged. Confirm.

## 4. Impacted elements

`src/shared/chrome/{PublicShell.tsx,site-nav.ts}` (+ a new client mega-menu component), footer, `app/(public)/programs/page.tsx` metadata, `AccountMenu.tsx` link lists, tests listed above. No schema, payment or dependency change. Builds on CR-2026-10-03-2250 (theme switch into the menus, bell in the header).

## 5. Tracker

| # | Step | Status | Updated |
|---|---|---|---|
| 1 | Founder answers §3 | OPEN | 2026-10-04 |
| 2 | Build (after the answers; RED gates need explicit approval first) | NOT STARTED | — |
| 3 | Verify (tests, reviews) | NOT STARTED | — |
| 4 | Show on the local site (screenshots) then deploy | NOT STARTED | — |

## 6. Progress log

| Date (MYT) | Entry |
|---|---|
| 2026-10-04 01:10 | CR created from the founder's message (sent while the assistant was building CR-2250); nothing built. The founder went to sleep and asked the assistant to record questions. |
