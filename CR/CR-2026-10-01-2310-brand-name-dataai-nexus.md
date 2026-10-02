# CR-2026-10-01-2310 — Header/footer/title brand name: "DataAI Nexus"

**Received:** 2026-10-01 23:10 MYT · **Status:** DEPLOYED (`v2026.10.02-1`) · **Requested by:** founder

## 1. Request (verbatim)

> Pelase change the header logo as well to reflect new domain name.

(Said in the context of CR-2026-10-01-2136, which records the purchased domain `dataainexus.com`; step 5 of that CR — the actual DNS/Caddy/Stripe cut-over — is still awaiting the founder's steps and is unaffected by this CR.)

## 2. Facts gathered (with sources)

- The header/footer wordmark has shown **"Data & AI Academy"** since the mockup port (ADR-045); the original mockup's own header comment called it "a working placeholder name (open item HO-4) — the reference image's brand name was deliberately NOT adopted, because naming is an open decision." Never finalised.
- Nothing in CR-2026-10-01-2136 or `docs/operations/DOMAIN_SETUP.md` records a decided *display* brand name — `dataainexus.com` only appears there as the literal registered domain string (DNS/Caddy/`APP_BASE_URL`/Stripe webhook config), never as proposed header text.
- "Logo" in this app is an abstract SVG mark (`src/shared/chrome/LogoMark.tsx`, "a capability line rising through data nodes," not tied to any name) plus a text wordmark next to it — there is no separate image-file logo to swap.
- A repo-wide search found "Data & AI Academy" in 38 files outside `project-artifacts/mockup` (off-limits per the working agreement): header/footer, page `<title>`/`description` metadata, body copy (`app/domains/page.tsx`), legal DRAFTS (`src/content/legal/*`), the Certificate of Completion document/PDF, transactional emails, Stripe's internal `appInfo.name`, and historical docs/specs.

## 3. Decisions and assumptions

| Ref | What | Status |
|---|---|---|
| D1 | Exact brand text | **"DataAI Nexus"** — founder's choice, asked directly (two options offered plus "keep as-is" and "something else"; founder picked the closer-to-domain spelling) |
| D2 | Scope | **Header + footer + page title/metadata** — founder's choice, asked directly (narrower "header only" and broader "everywhere" were both offered) |
| D3 | What stayed "Data & AI Academy," found but out of scope — not touched, flagged for a separate decision: | |
| | `app/domains/page.tsx` — visible body text, not title/metadata/header/footer | not touched |
| | `src/content/legal/{privacy,terms,refund-policy}.ts` — legal DRAFTS awaiting counsel review; renaming the contracting party inside legal text is its own decision | not touched |
| | `src/shared/certificate/{Certificate.tsx,pdf.tsx}` — the actual Certificate of Completion document; certificates already issued in UAT name the current org | not touched |
| | `src/modules/{commerce,identity,certificates}/emails.ts`, `identity/auth.ts`, `certificates/reminders.ts` — transactional email templates (sender name/body) | not touched |
| | `src/modules/commerce/stripe.ts` `appInfo.name` — internal Stripe API client identification string, not user-facing | not touched |
| | `README.md`, `DR-02…`, the three `DATA_AI_ACADEMY_*` spec documents, `docs/design/*`, `docs/architecture/*`, other `docs/execution/*` — historical/reference documentation | not touched |
| | `tests/e2e/certificates.spec.ts` title assertion | **updated** — a direct, mechanical consequence of the title-template change (D1/D2), not a scope expansion |

## 4. Plan

No schema change (Rule 1 N/A). Files touched:
- `src/shared/chrome/PublicShell.tsx` — header wordmark, footer brand lockup
- `app/layout.tsx` — root title `default`/`template`
- `app/global-error.tsx` — literal `<title>`
- `app/admin/layout.tsx` — admin section's own title `template`
- `app/(public)/page.tsx` — homepage's `title.absolute` + its comment
- `app/account/layout.tsx` — account section's own title `template` + its comment
- `app/(public)/verify/page.tsx`, `app/(public)/verify/[id]/page.tsx`, `app/(auth)/{sign-in,sign-out,register,forgot-password}/page.tsx` — `description` metadata naming the brand
- `tests/e2e/certificates.spec.ts` — title assertion, to match the new template

## 5. Tracker

| # | Step | Status | Updated |
|---|---|---|---|
| 1 | Rename in the 12 in-scope files above | **BUILT** | 2026-10-01 |
| 2 | Verify (tsc, Vitest, note on Playwright) | **VERIFIED** (tsc clean, Vitest 717/717; Playwright not run — see §6) | 2026-10-01 |
| 3 | Commit, push, deploy | **NOT STARTED** — awaits the founder's word, per the working agreement | — |

## 6. Progress log

| Date (MYT) | Entry |
|---|---|
| 2026-10-01 23:10 | Founder asked to update the header logo to reflect the new domain. No prior decision existed for the *display* name, so asked directly rather than inventing one: exact text ("DataAI Nexus") and scope (header + footer + title/metadata) both confirmed by the founder. Repo-wide search classified every "Data & AI Academy" occurrence into in-scope vs. out-of-scope (D3 table above); the 12 in-scope files were changed. `npx tsc --noEmit --incremental false` clean. `npx vitest run`: **717/717 passed**. Playwright **not run** — would need either stopping another session's running dev server (not done, per the "one `next dev` per directory" rule) or a separate production build; flagged rather than skipped silently. Nothing committed, pushed or deployed — awaits the founder's word, as with every other open CR. |
| 2026-10-01 23:25 | Founder: *"Training & certification -> Change this to Learn, Train, Assess & Certify"* — the small tagline under the wordmark in the header (`PublicShell.tsx`; the only occurrence in the app, confirmed by search). Changed. `tsc` clean; confirmed live on the dev server (`find` on the rendered page). Flagged for a visual check at the 640px breakpoint (longer tagline, `whitespace-nowrap`), since it hadn't been screenshot-verified yet. |
| 2026-10-01 23:30 | Founder: *"check it at 640px width"*. Screenshot taken at 640×400: wordmark + tagline sit cleanly on one line on the left, no wrap/overflow, no crowding against Sign in / theme toggle / burger menu on the right. The earlier flag is resolved — no layout issue. Still uncommitted. |
