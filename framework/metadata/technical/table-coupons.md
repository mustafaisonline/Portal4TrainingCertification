# table — coupons

| Field | Value |
|---|---|
| Category | technical |
| Kind | table |
| Source of truth | `prisma/schema.prisma` (model `Coupon`) and `prisma/migrations/` |
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
| `code` | String | no |  |  | unique | Uppercase, unique, crypto-random (N8: TRN- + 6 from an unambiguous alphabet). |
| `email` | String | no |  |  |  | The entitled account email, stored lower-cased; matched against the signed-in account at checkout (N5). |
| `programme_id` | String | no | `Uuid` |  |  |  |
| `discount_percent` | Int | no |  |  |  | 1–100. A 100% coupon still pays the floor (N4). |
| `status` | enum CouponStatus | no |  | `active` |  |  |
| `expires_at` | DateTime | yes | `Timestamptz(6)` |  |  |  |
| `redeemed_at` | DateTime | yes | `Timestamptz(6)` |  |  |  |
| `redeemed_by_user_id` | String | yes | `Uuid` |  |  |  |
| `redeemed_order_id` | String | yes | `Uuid` |  | unique |  |
| `created_by_user_id` | String | no | `Uuid` |  |  |  |
| `created_at` | DateTime | no | `Timestamptz(6)` | `now()` |  |  |
| `updated_at` | DateTime | no | `Timestamptz(6)` |  |  |  |

## Relationships

| Field | Target model → table | Cardinality | Definition |
|---|---|---|---|
| `programme` | `Programme` → `programmes` | one | `@relation(fields: [programmeId], references: [id], onDelete: Restrict)` |
| `redeemedByUser` | `User` → `users` | optional one | `@relation("coupon_redeemed_by", fields: [redeemedByUserId], references: [id], onDelete: Restrict)` |
| `redeemedOrder` | `Order` → `orders` | optional one | `@relation("coupon_redeemed_order", fields: [redeemedOrderId], references: [id], onDelete: Restrict)` |
| `createdByUser` | `User` → `users` | one | `@relation("coupon_created_by", fields: [createdByUserId], references: [id], onDelete: Restrict)` |
| `orders` | `Order` → `orders` | many | `@relation("order_coupon")` |

## Indexes and constraints

```
@@index([email])
@@index([programmeId])
```

## Change history

- 2026-10-02 — file generated from the schema by CR-2026-10-02-2045. Re-generate or edit when the schema changes (a schema change is a RED gate).
