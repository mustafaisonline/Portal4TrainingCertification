# CR-2026-10-04-0112 — Agentic AI: paid downloads — single items and packs

**Received:** 2026-10-04 01:10 MYT · **Status:** DECIDED & APPROVED — building (design in CR-0112) · **Requested by:** founder · **Model:** opus

## 1. Request (verbatim)

> * These will be paid.
>             * We can sell each for USD2 eacb  if someone want to download one Agent or One skill
>             * For combination of 10 agents and skill, it will USD10
>             * For combination of 50 agents and skill, it will USD25
>             * For combination of 100 agents and skill, it will USD40
>             * Unlimited for annual subscription of USD10. Term and conditions are, package can change on the last days of your renewal date.

## 2. Facts gathered (read-only, 2026-10-04)

- Payments today: Stripe Checkout, one-off, one order per purchase, a webhook confirms it, receipts in Orders & receipts; there is **no** download-entitlement or subscription mechanism, and no recurring billing. The only digital-unlock product is the Free Assessment Check result document (a fee, `knowledge_check_unlock` order).
- The catalogue has 36 items today (see CR-0111), so the **50-item and 100-item packs cannot be filled** until the catalogue grows.
- A pack (10 / 50 / 100) means "any N items of your choice" — the portal would need to track how many downloads a person has left (credits) and which items they already own.
- New order kinds, entitlements (who owns which item / how many credits) and signed, session-gated downloads need **new database tables and payment logic** — protected changes (RED gate): schema SQL and the payment design are shown for explicit approval first.

## 3. Questions for the founder (with the assistant's recommendation)

1. **How packs work:** buy a pack of N credits, then spend one credit per item you download (items you already own are free to re-download)? Recommendation: yes. Do credits expire? Recommendation: no expiry for packs.
2. **Offer now:** single (USD 2) and the 10-pack (USD 10) only, adding the 50 / 100 packs when the catalogue has that many items? Recommendation: yes — selling "50" when only 36 exist would be confusing.
3. **Refunds:** digital downloads non-refundable once downloaded (stated before paying). Recommendation: yes; needs a line in the Terms / Refund policy.
4. **Currency:** USD for everyone (Stripe card payment), or also MYR / PKR like trainings? Recommendation: USD only to start.
5. **Receipts and tax:** the existing Stripe receipt + Orders & receipts page is enough? Recommendation: yes.
6. **Approval to proceed with schema + payment changes** once I show you the proposed tables and the checkout design (new order kind, entitlement rows, download route) — the assistant will not start them until you say yes.

## 4. Impacted elements

New tables (products, product files, entitlements/credits — proposed in a schema-proposal for approval), `checkout.service`/webhook (new order kind), a signed download route, Orders & receipts, emails/bell notices, legal text (Terms, Refund policy, Privacy), tests. **RED gates:** schema change and payment logic.

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
| 2026-10-04 04:20 | **Founder's answers:** packs — **single item USD 2 and the 10-pack USD 10 now; the 50 and 100 packs later** ("Yes"). **"I approve"** the new database tables and the payment changes for paid downloads (his answer to Q8). Not answered, assistant proceeds with its recommendations and states them: credits do not expire; downloads non-refundable once downloaded (stated before paying); USD only; Stripe receipt + Orders & receipts. The exact schema SQL and payment design are written into this CR before anything is applied, so the founder can see what "approve" covered. |
| 2026-10-04 06:30 | **DESIGN (what the founder's "I approve" / "go ahead, no need to show" covers).** *Catalogue as code* (like the legal texts): the sellable agents and skills live in `src/content/agentic/` (title, summary, manual, install guide, definition file), reviewed by the founder in git — no item table, no stored files, no admin editor to build; the download is assembled on request as a small `.zip` using Node's built-in `zlib` (CRC-32) — **no new dependency**. *Prices* are one documented constants file (founder-fixed: item USD 2; 10-pack USD 10; Agentic AI Unlimited USD 10/year; Portal Unlimited USD 20/year) — changing a price is a code change. **Schema (additive only):** (1) enum `order_kind` + `agentic_item`, `agentic_pack`, `access_pass`; (2) `orders.product_sku text NULL` (e.g. `item:<slug>`, `pack:10`, `pass:agentic_unlimited`); (3) new table `agentic_ownerships(id, user_id→users, item_slug, via, order_id→orders NULL, created_at)` unique(user_id, item_slug); (4) new table `agentic_credit_packs(id, user_id→users, order_id→orders unique, credits_total, credits_used, created_at)`; (5) new table `access_passes(id, user_id→users, plan, order_id→orders unique, starts_at, ends_at, created_at)`. **Payment:** the existing Stripe Checkout one-off path (new order kinds), the existing signed webhook fulfils the order (ownership / 10 credits / pass) idempotently inside the same transaction as the order's `paid` mark; amounts come from the constants file, never from the browser. **Downloads:** a session-gated route; allowed when the person owns the item, or has an active pass, or spends a pack credit (one credit per new item); a `no-store` attachment. **Plans:** one-off 365-day pass (no automatic renewal, per the founder) — a pass bought while one is active extends from its end date; an expiry reminder email is queued 30 days before the end. **Result documents:** an active Portal Unlimited pass unlocks the Free Assessment Check result document without the unlock fee. **Rollback:** revert the commit; the new tables/columns are unused by the old release; DROP statements are listed in the spec. |\n