# CR-2026-10-02-0610 — Publish the legal documents, lift `noindex`, confirm Stripe live

**Received:** 2026-10-02 · **Status:** BUILT & unit-tested; **deploy + two server steps pending (founder)** · **Requested by:** founder

## 1. Request (verbatim)

> Switching Stripe to live keys. Response: Please switch stripe to live keys
> Counsel-reviewed legal documents. Response: Consider reviewed
> Removing `noindex` for the public launch. Response: Please do what is required.
> use standard wording for retention, age 18 is correct
> 1. sales@yourpartnertechnologies.com  2. Not registered  3. Same  4. no email provider yet

## 2. Findings and decisions

| Item | Finding | Action |
|---|---|---|
| Stripe live keys | Production **already** ran a live restricted key: `npm run stripe:check` → "Key mode: LIVE (restricted key)", webhook secret set; the live key reads Checkout sessions (0 so far); `api.stripe.com` reachable from the Droplet. `production.env` also holds an inert `sk_test_…` line (line 13) that the later `rk_live_…` line overrides. | Nothing to switch. Keys are never entered by the assistant. Remaining: the real RM 2.00 card test + refund (`STRIPE_GO_LIVE_CHECKLIST.md` step 6) — founder only. |
| Legal documents | Founder: "consider reviewed". Terms, Privacy, Refund set to `published`, version/date **2026-10-02**, "About this draft" section removed, placeholders filled: contact email `sales@yourpartnertechnologies.com`; SST: not registered, none charged; Data Protection Contact = same email; hosting = DigitalOcean, New York (NYC1) → Privacy §7 now states data is stored outside Malaysia; email provider: none at present. **No phone number was given — the pages are email-only.** | Done in `src/content/legal/*.ts`; test `tests/unit/legal-content.test.ts` now forbids any draft notice or `[placeholder]`. |
| Retention (Privacy §10) | "Standard wording" authorised by the founder; values chosen by the assistant: account +30 days after closure; registration/completion records: certificate life +7 years; orders/payments 7 years; consent: account life +6 years; audit 2 years; messages 12 months after resolved. | **Founder may amend any value.** |
| Age | 18 confirmed. Read as: under-18 registrations not accepted (no parental-consent route) — Terms §3, Privacy §14. | Founder to say if a consent route is wanted instead. |
| `noindex` | Site-wide `robots: {index:false}` in `app/layout.tsx` lifted → `index, follow`; the three legal pages no longer carry their own `noindex`. Private/per-attempt pages, search, certificate pages and `/credential-integrity-policy` (still an unpublished placeholder) keep their own `noindex`; `/robots.txt` still disallows the private routes. | Takes effect only after the deploy. |

## 3. Still required on the server (root, founder) after the deploy

`LEGAL_DOCUMENT_VERSIONS` in `/etc/p4tc/production.env` is still `{"terms":"DRAFT-2026-09-28","privacy":"DRAFT-2026-09-28"}`. Set it to `{"terms":"2026-10-02","privacy":"2026-10-02","refund":"2026-10-02"}` and reload PM2. Until then new consents are still recorded against the draft version.

## 4. Observations not acted on (reported)

- `EMAIL_TRANSPORT=log`: the portal sends **no real email** — email verification, password reset and receipts do not reach users. The policy now says so. A decision on an email provider is needed before public launch (new technology → founder approval).
- Footer still links to `/credential-integrity-policy`, a "not yet published" placeholder.
- PDPA notice may be required in Bahasa Malaysia as well as English (the removed draft section flagged this for counsel).
- Rollback: revert the commit and redeploy (or `deploy/07-rollback.sh`); restore the env value.

## 5. Tracker

| # | Step | Status |
|---|---|---|
| 1 | Stripe live-key check | **DONE** (already live) |
| 2 | Legal content + pages + tests | **DONE** — Vitest 717/717, tsc clean |
| 3 | `noindex` lifted in code | **DONE** (in code) |
| 4 | Governed deploy of `v2026.10.02-2` (`bfb358e`) | **DONE** — 06-validate PASSED; legal pages, `index, follow`, no draft text verified live |
| 5 | `LEGAL_DOCUMENT_VERSIONS` on the server | **DONE** — set to 2026-10-02 (terms/privacy/refund), PM2 reloaded; running process confirmed; backup `production.env.bak-*` on the server |
| 6 | RM 2.00 live smoke payment + refund | AWAITING founder |
