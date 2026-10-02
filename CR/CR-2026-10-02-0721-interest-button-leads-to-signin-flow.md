# CR-2026-10-02-0721 — "Register your interest" button must lead to the sign-in / interest flow

**Received:** 2026-10-02 07:21 MYT · **Status:** BUILT & VERIFIED in dev and on the production build — NOT deployed (awaits the founder's word) · **Requested by:** founder

## 1. Request (verbatim)

> Ithink this change     - Where there is Register your interest. Button, when you click, it should take user to the output of this link, Sign in to register your interest — USD 2, non-refundable., is not implemented, Kindly check in devc first.

## 2. Facts gathered

- The hero button `Register your interest` on a training page (`app/(public)/programs/[slug]/page.tsx:168`, shown when the training has no open date) still uses the OLD enquiry link `interestMailto(course.title)` — a `mailto:` — set before CR-2026-10-01-2138 existed.
- CR-2138 (built, deployed) put the real flow under each format: `src/modules/commerce/components/interest-slots.tsx` — signed out → link "Sign in to register your interest — USD 2, non-refundable" → `/sign-in?return-to=/programs/<slug>#formats`; signed in → the form (or "Your interest is registered"). Nothing connected the hero button to it.
- Tests `tests/e2e/trainings.spec.ts:288` and `:384` currently assert the hero button's href equals the mailto.
- `/schedule` has two more mailto buttons labelled "Register interest" (page.tsx:87 for one training with no dates, :103 generic).

## 3. Decisions & assumptions (awaiting confirmation where marked)

- The hero button follows the same path as the format link: signed out → `/sign-in?return-to=/programs/<slug>#formats`; signed in → `#formats` on the same page (where the form is). The interest fee/Pakistan rule/"already registered" states stay exactly as built.
- If the interest feature is OFF (no fee setting in force) or no format shows the flow, the button keeps the old mailto — it must never lead nowhere.
- *Assumption, to confirm:* the `/schedule` single-training "Register interest" button (page.tsx:87) is the same action, so it goes to `/programs/<slug>#formats` the same way (sign-in first when signed out). The generic one (:103, no training) stays a mailto. If the founder wants only the hero changed, revert that one line.

## 4. Plan

`buildInterestSlots` also returns `heroHref` (null when the flow is not active); the training page uses it for the hero button; schedule single-training button uses a link to the training's `#formats`; update the two e2e assertions and add one for the new behaviour (signed out → sign-in with return-to; after sign-in lands on #formats). No data model, no new dependency. Verify in dev first (founder: "check in dev first"), then gate → deploy on the founder's word.

## 5. Tracker

| # | Step | Status | Updated |
|---|---|---|---|
| 1 | Reproduce in dev | **DONE** — hero button href was the `mailto:`; dev trainings both have an open date so the button is hidden there (it only shows with no open date, as in production) → reproduced with the e2e fixture training | 2026-10-02 |
| 2 | Build | **DONE** — `interest-slots.tsx` returns `heroHref` (shared sign-in href); the hero button uses it, mailto only when the flow is off; schedule page NOT changed (see §3, open question) | 2026-10-02 |
| 3 | Verify in dev | **DONE** — new e2e on `next dev`: signed-out click → `/sign-in?return-to=…#formats` (identical href to the format's link); after sign-in lands on `/programs/<slug>#formats` with the form; signed in the button is `#formats`. Feature-off fallback (mailto) is by construction (`heroHref` null), not browser-tested | 2026-10-02 |
| 4 | Tests updated + added; full suite | **DONE** — new test in `training-interest.spec.ts`; two assertions in `trainings.spec.ts` changed from the mailto to the sign-in href; interest spec 9/9 and trainings spec 5/5 on the production build; Vitest all green. (One older interest test timed out once in `next dev` — a click/hydration timing flake — and passed on the production build, which is what the gate uses.) | 2026-10-02 |
| 5 | Deploy | AWAITING founder's word | — |

## 6. Progress log

| Date (MYT) | Entry |
|---|---|
| 2026-10-02 07:21 | CR created; root cause found: hero button was never moved from the mailto to the CR-2138 flow. |
| 2026-10-02 07:50 | Built and verified (see tracker). Open question for the founder: the `/schedule` page has the same kind of button ("Register interest", mailto, for a training with no dates). Change it too (go to the training's formats / sign-in)? Left as is meanwhile. |
| 2026-10-02 20:10 | The open question about `/schedule`'s button is answered by the founder's next message and moved to CR-2026-10-02-2010 (all Register-interest buttons route by availability). Deploy CR-0721 together with it. |
