# CR-2026-10-04-0112 — Agentic AI: paid downloads — single items and packs

**Received:** 2026-10-04 01:10 MYT · **Status:** ASSESSED — awaiting the founder's answers (§3) · **Requested by:** founder · **Model:** opus

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
