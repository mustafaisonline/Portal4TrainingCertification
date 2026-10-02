# table — payments

| Field | Value |
|---|---|
| Category | technical |
| Kind | table |
| Source of truth | `prisma/schema.prisma` (model `Payment`) and `prisma/migrations/` |
| Owner | founder |
| Version / date | generated from the schema 2026-10-02 |
| Status | approved (in production schema) |
| Related | CLAUDE.md Rule 1 (data model is a RED gate) |

## Purpose
Not described in the schema's doc comment; see the milestone plan that introduced the table.

## Columns

| Column | Type | Nullable | DB type | Default | Keys | Note |
|---|---|---|---|---|---|---|
| `id` | String | no | `Uuid` | `dbgenerated("gen_random_uuid()")` | PK |  |
| `order_id` | String | no | `Uuid` |  | unique |  |
| `provider` | String | no |  | `"stripe"` |  |  |
| `provider_payment_intent_id` | String | no |  |  | unique |  |
| `provider_charge_id` | String | yes |  |  |  |  |
| `amount_minor` | BigInt | no |  |  |  |  |
| `currency` | String | no | `Char(3)` |  |  |  |
| `receipt_url` | String | yes |  |  |  |  |
| `provider_fee_minor` | BigInt | yes |  |  |  | Stripe's non-recoverable processing fee for this charge, in minor units of the charge currency (converted from the settlement currency when they differ). Null until the balance transaction is available. Refunds are net of it (founder decision 2026-09-22). |
| `status` | enum PaymentStatus | no |  | `succeeded` |  |  |
| `created_at` | DateTime | no | `Timestamptz(6)` | `now()` |  |  |

## Relationships

| Field | Target model → table | Cardinality | Definition |
|---|---|---|---|
| `order` | `Order` → `orders` | one | `@relation(fields: [orderId], references: [id], onDelete: Restrict)` |
| `refunds` | `Refund` → `refunds` | many |  |

## Change history

- 2026-10-02 — file generated from the schema by CR-2026-10-02-2045. Re-generate or edit when the schema changes (a schema change is a RED gate).
