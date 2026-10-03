# CR-SPEC-2026-10-04-0112-agentic-ai-packs-and-downloads-opus — Agentic AI paid downloads, packs and passes

**CR:** [CR-2026-10-04-0112-agentic-ai-packs-and-downloads-opus](../CR-2026-10-04-0112-agentic-ai-packs-and-downloads-opus.md) (also serves CR-2026-10-04-0113, annual passes)

| # | Task | Files | Status | Notes |
|---|---|---|---|---|
| 1 | Schema (additive) + migration | `prisma/schema.prisma`, `prisma/migrations/*_agentic_products` | OPEN | see below |
| 2 | Catalogue content (generalised starter set) + manuals | `src/content/agentic/*` | OPEN | founder approves items |
| 3 | Pricing constants + entitlement service | `src/modules/agentic/*` | OPEN |  |
| 4 | Checkout + webhook fulfilment (new order kinds) | `src/modules/commerce/*` | OPEN | payment logic — founder approved |
| 5 | Pages: /agentic-ai, lists, detail, plans, My downloads | `app/(public)/agentic-ai/*`, `app/account/*` | OPEN |  |
| 6 | Download route (zip) | `app/api/agentic/*` | OPEN | session-gated, no-store |
| 7 | Result-document unlock via pass | `src/modules/commerce/unlock.service.ts` | OPEN |  |
| 8 | Legal text (Terms, Refund, Privacy) + tests + reviews | `src/content/legal/*`, `tests/*` | OPEN |  |

**Data model (all additive):** `order_kind` += `agentic_item`, `agentic_pack`, `access_pass`; `orders.product_sku` (text, nullable); tables `agentic_ownerships`, `agentic_credit_packs`, `access_passes` (columns in the CR progress log, 2026-10-04 06:30).

**SCHEMA CHANGE APPROVED BY FOUNDER** — 2026-10-04: "I approve." (answer to the approval of the new tables and payment changes for paid downloads and subscriptions) and "Please go ahead, no need to show. You have my approval."

**Rollback:** revert the commit; the old release ignores the new columns/tables. Manual undo SQL (founder-approved only): `DROP TABLE access_passes, agentic_credit_packs, agentic_ownerships; ALTER TABLE orders DROP COLUMN product_sku;` (enum values cannot be dropped; unused values are harmless).
