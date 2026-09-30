# CR-2026-10-01-0712 — Contact Us: head-office card and partner-location cards

**Received:** 2026-10-01 07:12 MYT · **Status:** BUILT and VERIFIED in dev — awaiting the founder's word to commit, tag and deploy · **Requested by:** founder

## 1. Request (verbatim)

> As you know for training in Pakistan, we are going to use our location partner. https://infocentric.pk/ is our one of the partner. Please extract logo, name, website url, contact details, any details we need to put on our contact us page.
>
> On contract us page, we also need to add similar details about our company as well.
>
> May be we have card for each company. Our card can come on top as head office and rest company cards can come under head office card as partner loctions.
>
> Please create a folder where can call CR (Change Requisition) and when ever I give a new requirement or a fix any, we must create a new .md files with timestamp to record, We will also use it to implement one by one even if our limit hit or our memory goes out.

The `CR/` folder and its `README.md` (naming, template, index) were created with this request.

## 2. Facts gathered (with sources)

### 2a. Partner — Infocentric (read from https://infocentric.pk/ and https://infocentric.pk/contact-us/ on 2026-10-01; both pages agree)

| Item | Value (exactly as published) |
|---|---|
| Name | **Infocentric** |
| Tagline | "Digital Transformation using AI" |
| What it does (their words) | "Helping customers to achieve their productivity and innovation goals" through AI-driven technology solutions and enterprise data management services |
| Website | https://infocentric.pk/ |
| Office address | Plaza 241, Spring North Commercial, Bahria Town Phase 7, Rawalpindi, Pakistan |
| Phone | (+92-51) 8890717 |
| Email | info@infocentric.pk |
| Contact page | https://infocentric.pk/contact-us/ |
| WhatsApp / social links / opening hours | **not published** — not shown on the card |
| Number of offices | one (Rawalpindi) |
| Logo | https://infocentric.pk/wp-content/uploads/2023/01/infocentric_logo-e1622640352525.png — a **156 × 36 px, 5 KB PNG** wordmark ("INFO" in white, "CENTRIC" in orange, tiny tagline). Downloaded to the scratchpad and checked; **not yet added to the repository**. It is white-on-transparent, so on a light card it must sit on a **dark tile**; at 156 px it will look soft on high-density screens. The site offers only this wordmark and a square site-icon, no larger file. |

### 2b. Our company — Your Partner Technologies (head office), from approved records only

| Item | Value | Source |
|---|---|---|
| Name | Your Partner Technologies | `src/content/certificate-brand.ts` (founder, 2026-09-29) |
| Logo | `/public/brand/ypt-logo.jpg` (already in the repository) | founder supplied 2026-09-29 |
| Company No. | 202401023226 (1569075-K) | founder, 2026-09-29 |
| Registered address | 15-03A, One Jelatek Condominium, Jalan Jelatek, Kementah, 54200 Kuala Lumpur W.P. Kuala Lumpur, Malaysia | founder, 2026-09-29 (spelling "Kementah" confirmed) |
| Email | sales@yourpartnertechnologies.com | founder, 2026-09-29 (`src/content/contact.ts`) |
| Website | https://yourpartnertechnologies.com (responds HTTP 200, checked 2026-10-01) | mail domain; **to confirm** |
| Telephone | **none supplied** — the legal drafts still carry a `[phone number]` placeholder | — |

### 2c. Where the page stands today
`app/(public)/contact-us/page.tsx` has a hero, three route cards (individuals / organisations / practitioners)
and one contact option, the sales email. The page states in its header that it shows **no telephone, address
or registration** because none was established in an approved source — that note is now out of date once this
CR is built (the founder has since supplied the address and registration; and will supply the rest).
Content lives in typed modules, not the database (`src/content/contact.ts`); the same pattern fits here.

## 3. Decisions and assumptions

| Ref | What | Status |
|---|---|---|
| **D1** | New section on `/contact-us`: **"Our locations"** — one **Head Office** card on top (full width), the **partner-location** cards under it | founder request |
| **D2** | The partner card shows: logo, name, tagline, a "Training partner — Pakistan" label, address, phone (tap-to-call), email (mailto), website (external link). Nothing the partner has not published is added | founder request |
| **D3** | The head-office card shows: YPT logo, name, "Head office", Company No., registered address, sales email, website | founder request |
| **A1** ✅ | The data sits in a typed content module `src/content/locations.ts` (like `contact.ts`) — **no database table, no schema change, no admin screen**. Adding a future partner = adding one entry to that file | assumption — confirm |
| **A2** ✅ | The Infocentric logo file is copied into `public/brand/partners/infocentric-logo.png` and shown on a **dark tile** so the white "INFO" is readable; replaced later if the founder supplies a better file | assumption — confirm |
| **A3** ✅ | Head-office website = https://yourpartnertechnologies.com (it responds) | assumption — confirm |
| **A4** ✅ | The head-office card has **no phone line** (none supplied); it appears only when the founder supplies a number | assumption — confirm |
| **A5** ✅ | The partner label reads "Local training partner — Pakistan" (founder: "for training in Pakistan we are going to use our location partner") | assumption — confirm |
| **Q1** ⚠ | Use of the partner's **logo and details** on our site — the founder states this is a partnership; please confirm Infocentric agrees to their logo/details being shown (same care as the HRD Corp logo) | **founder said "go ahead with your suggestions" — built; the founder remains responsible for Infocentric's agreement to the logo/details being shown** |
| **Q2** *(NOT built — optional, only if the founder asks)* | On the Pakistan price card and the checkout's "pay through the local partner" step, link to the partner's email/phone instead of only our sales mailbox | **ask** |

## 4. Plan

1. **Content** — `src/content/locations.ts`: typed `Location` list (`kind: "head_office" | "partner"`, name, tagline, role label, logo path + alt, address lines, phone, email, website, country). Head office first. Validation in a unit test (https URLs only, E.164-style `tel:` digits, well-formed email, no empty field, exactly one head office and it comes first).
2. **Component** — `src/shared/marketing/LocationCard.tsx` (server component): logo tile (dark tile for the partner's white logo), name, tagline, label chip, definition-style rows (Address / Phone / Email / Website), `tel:` and `mailto:` links, external links `target="_blank" rel="noopener noreferrer"` with "(opens external site)" for screen readers. Design tokens only; light **and** dark contrast checked with axe.
3. **Page** — `/contact-us`: add the "Our locations" section below the existing routes/email block: Head Office card full width; under it a "Partner locations" heading and a responsive grid of partner cards (1 column on mobile, 2 from tablet). Update the stale header note about no address/phone. Keep everything else unchanged.
4. **Assets** — copy the checked Infocentric logo to `public/brand/partners/infocentric-logo.png` (source URL and date noted in `src/content/locations.ts`). The YPT logo already exists.
5. **Legal/docs** — Privacy/Terms drafts: no change required (they hold the company number and address already). `docs/` and this CR updated. *If the founder supplies a head-office phone, the legal drafts' `[phone number]` placeholder can be filled in the same pass (ask).*
6. **Tests** — unit (`locations.test.ts`), e2e (`public.spec.ts` or a new `contact-us.spec.ts`): HQ card first and above the partner card(s); every detail present and correct; links (`tel:+92518890717`, `mailto:info@infocentric.pk`, `https://infocentric.pk/`, `mailto:sales@yourpartnertechnologies.com`); external links safe; logo images have alt text and load; no horizontal overflow at 375/768/1280; axe light + dark.
7. **Deploy** — normal governed release (no schema, no migration, no server steps).

**DB impact:** none. **Dependencies:** none. **Risk:** low (one page + one component + one content file).

## 5. Tracker

| # | Step | Status | Updated |
|---|---|---|---|
| 0 | CR folder + this record created; partner details and logo extracted and checked | **DONE** | 2026-10-01 |
| 1 | Content module `src/content/locations.ts` + unit test `tests/unit/locations.test.ts` (7 tests) | **VERIFIED** | 2026-10-01 |
| 2 | `LocationCard` component `src/shared/marketing/LocationCard.tsx` | **VERIFIED** | 2026-10-01 |
| 3 | `/contact-us` "Our locations" section (Head office on top, "Partner locations" under it) | **VERIFIED** | 2026-10-01 |
| 4 | Logo asset `public/brand/partners/infocentric-logo.png` (5,167 bytes) added | **DONE** | 2026-10-01 |
| 5 | e2e `tests/e2e/contact-locations.spec.ts` (4 tests: content + placement + links, logos load, no overflow at 375/768/1280, axe light + dark) | **VERIFIED** | 2026-10-01 |
| 6 | Commit, release, deploy | **AWAITING THE FOUNDER'S WORD** | 2026-10-01 |

## 6. Progress log

| Date (MYT) | Entry |
|---|---|
| 2026-10-01 07:12 | CR folder created with `README.md` (naming, template, index; earlier `modification.md` and the M15 plan are indexed as history). This CR written: Infocentric details read from both pages of their site (they agree); logo downloaded and inspected (156×36 px wordmark, white-on-transparent → needs a dark tile); our own details gathered from approved records; company website checked live. **No code changed.** Waiting for the founder's answers to Q1 and the assumptions A1–A5, and a "go". |
| 2026-10-01 07:40 | **Built on "go ahead with your suggestions".** `src/content/locations.ts` (head office from `certificate-brand.ts`/`contact.ts`; Infocentric exactly as published), `LocationCard`, the Contact page section; logo copied to `public/brand/partners/`. **Verified:** tsc clean · Vitest (full) · Playwright `contact-locations` + `public` 13/13 (content, order, links incl. `tel:+92518890717`, logos load, no overflow 375/768/1280, axe light + dark) · screenshots reviewed (desktop). No schema, no dependency, no server step. **Not built:** Q2 (partner contact on the Pakistan price card / checkout step). **Open for the founder:** a head-office phone number (the card has none until supplied; the legal drafts' `[phone number]` placeholder could be filled at the same time); a higher-resolution Infocentric logo (the published one is 156×36 px). Uncommitted. |
