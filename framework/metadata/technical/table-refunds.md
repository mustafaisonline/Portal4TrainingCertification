# table — refunds

| Field | Value |
|---|---|
| Category | technical |
| Kind | table |
| Source of truth | `prisma/schema.prisma` (model `Refund`) and `prisma/migrations/` |
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
| `payment_id` | String | no | `Uuid` |  |  |  |
| `provider_refund_id` | String | yes |  |  | unique |  |
| `amount_minor` | BigInt | no |  |  |  |  |
| `percent` | Int | no |  |  |  |  |
| `reason` | enum RefundReason | no |  |  |  |  |
| `status` | enum RefundStatus | no |  | `pending` |  |  |
| `requested_by_user_id` | String | yes | `Uuid` |  |  |  |
| `created_at` | DateTime | no | `Timestamptz(6)` | `now()` |  |  |
| `updated_at` | DateTime | no | `Timestamptz(6)` |  |  |  |

## Relationships

| Field | Target model → table | Cardinality | Definition |
|---|---|---|---|
| `payment` | `Payment` → `payments` | one | `@relation(fields: [paymentId], references: [id], onDelete: Restrict)` |

## Change history

- 2026-10-02 — file generated from the schema by CR-2026-10-02-2045. Re-generate or edit when the schema changes (a schema change is a RED gate).
