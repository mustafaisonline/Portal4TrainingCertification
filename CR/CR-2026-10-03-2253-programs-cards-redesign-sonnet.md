# CR-2026-10-03-2253 — /programs: small dynamic training cards

**Received:** 2026-10-03 22:50 MYT · **Status:** BUILT & VERIFIED — deploy next · **Requested by:** founder · **Model:** sonnet

## 1. Request (verbatim)

> * For your information. I have added a new training at backbend from admin dashboard but it's not showing on https://dataainexus.com/programs page.
>    * Cards on this page should get created dynamically.
>    * Please reduce the content on the cards on this Page and just keep Training name, subhead and existing buttons, add some graph as well. We need small cards as people are showing interest an we are going to have 10s of trainings.
>    * In other words redesign the whole training cards look and feel on this page.

## 2. Facts gathered (read-only investigation, 2026-10-03)

- `/programs` is already dynamic and uncached (`force-dynamic`, `listPublishedProgrammesWithPrices()` = all programmes with `status = published`). A new training does **not** appear because it starts as an **unlisted draft** and the admin has not been able to press Publish (see CR-2255). No code defect.
- Cards are `CourseCard` (`leadCard`, `showAllRegions`): level/flagship pills, title, description, up to 4 highlight chips, duration/audience/format rows, per-format timelines, fee rows by region with an offer chip and expandable region toggle, HRD note, and the two buttons. No chart library or chart component exists in the project; a graph would be hand-drawn inline SVG (no dependency) or a new library (needs your approval, rule 5).

## 3. Decisions needed from the founder (with the assistant's recommendation)

1. **What should the "graph" show?** There is no obvious data to chart on a card. Options: (a) a small decorative icon/pictogram per training (no data); (b) a mini bar of the training's *level* or *duration*; (c) a small ring for *seats available* on the next date; (d) none. Recommendation: (b) a compact level/duration indicator drawn as inline SVG (no new dependency). Which do you prefer?
2. **Card content:** title, subhead (the one-line description), graph, the two buttons (View Details / Register). Prices and timelines move off the card (still on the training page). Confirm.
3. **Layout:** a responsive grid (about 3 per row on laptop, 2 on tablet, 1 on phone) with a search/filter later if the list grows. Confirm.

## 4. Impacted elements

`src/shared/marketing/CourseCard.tsx` (or a new compact card used only on `/programs`; the home page and other places may use the current card), `app/(public)/programs/page.tsx`, e2e specs that read card content (`trainings.spec.ts`, `public.spec.ts`, axe on `/programs`). No schema change.

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
| 2026-10-03 23:05 | Founder answered the §3 decisions: "I agree with all your recommendation with my few responses." **Item 10:** "Do as per the best practices" — the assistant will use a compact inline-SVG level/duration indicator (no new dependency), title, subhead and the two buttons, in a responsive grid. |
| 2026-10-04 00:20 | **BUILT & VERIFIED.** /programs now shows small tiles (`TrainingTile`): title, subhead, a graph and the two buttons (View Details / Register), in a responsive grid (1 · 2 · 3 · 4 across). **The graph is a dot row, one dot per pace format — filled = that format has an open date, hollow = no date yet** — drawn as inline SVG with a plain-words label; no chart library, and deliberately NOT a level ladder (DR-01: no ladder, no bands). Prices, timelines and the HRD note stay on each training's own page (their e2e assertions already exist there; the old listing-price assertions were replaced by a tile test). The other pages that use the full `CourseCard` (home, contact) are unchanged. The "new training not on /programs" report was an unpublished draft (see CR-2255); the admin launch e2e (draft → publish → appears on /programs) passes. Full unit/integration suite 848/848; affected e2e specs green. |
