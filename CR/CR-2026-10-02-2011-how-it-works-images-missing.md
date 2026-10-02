# CR-2026-10-02-2011 — HOW IT WORKS images missing on the home page — bring them from dev to production

**Received:** 2026-10-02 20:11 MYT · **Status:** NOT STARTED — cannot be reproduced yet; needs a screenshot · **Requested by:** founder

## 1. Request (verbatim)

> ON home page, section: HOW IT WORKS, I can see image are missing, Please bring those image from dev to production as well.

*Source: Founder message of 2026-10-02 ("New more change …", seven bullets; the CR for them was requested: "Add a new CR for these requirements").*

## 2. Facts gathered (read-only; nothing changed yet)

- The section is `app/(public)/page.tsx` ("H4 — How it works", four cards: face-to-face, live online, private cohorts, on-site/international) using `ImageFrame` with the photographs `/delivery/face-to-face.png`, `/live-online.png`, `/private-cohorts.png`, `/on-site-international.png`.
- All eight files under `public/delivery/` are **tracked in git**, are in the live release on the server (`/opt/p4tc/releases/current/public/delivery/`) and return **HTTP 200** from `https://dataainexus.com/delivery/...`; the Next image optimiser also returns 200 (`/_next/image?url=%2Fdelivery%2Fface-to-face.png&w=256&q=75`). The production home page HTML contains the four `<img>` elements with their alt text. The working tree has no untracked image files, so dev and production hold the same files.
- So the four photographs are present and served; whatever the founder sees missing is something else (a different image set, uploaded images that live only in the dev database/uploads, a lazy-load/slow-network or mobile-only effect, or a browser cache).

## 3. Open questions for the founder

1. Please send a **screenshot** of the production home page showing what is missing (and the device/browser — desktop or mobile).
2. Are the images you remember **different pictures** from the four delivery photographs (for example photographs you uploaded in dev through Admin)? If yes, where are they in dev (which Admin screen/URL)?

## 4. Plan (after the answers; one CR at a time, on the founder's "go")

Depends on the answers. If they are DB-uploaded images (e.g. Admin → training photos, `/programs/images/[id]`), the fix is a data copy to production — the founder's explicit instruction; stored in the production database/upload store, not in git — done as a reviewed one-off, never by copying the whole dev database. If it is a front-end loading issue, fix `ImageFrame`/lazy loading and test on a throttled phone profile.

## 5. Tracker

| # | Step | Status | Updated |
|---|---|---|---|
| 1 | Screenshot / clarification | **AWAITING founder** | — |
| 2 | Diagnose | NOT STARTED | — |
| 3 | Fix / copy images; verify live | NOT STARTED | — |

## 6. Progress log

| Date (MYT) | Entry |
|---|---|
| 2026-10-02 20:11 | CR created from the founder's list. Facts gathered read-only.  |
| 2026-10-02 | run-cr 2026-10-02: kept OPEN — cannot be reproduced; needs the founder's screenshot (desktop/mobile, browser) and whether the images are different pictures uploaded in dev. Re-run run-cr after that. |
