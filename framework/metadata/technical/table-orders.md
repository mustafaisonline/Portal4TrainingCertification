# table — orders

| Field | Value |
|---|---|
| Category | technical |
| Kind | table |
| Source of truth | `prisma/schema.prisma` (model `Order`) and `prisma/migrations/` |
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
| `user_id` | String | no | `Uuid` |  |  |  |
| `offering_id` | String | yes | `Uuid` |  |  | Null ONLY for kind = support (2026-09-27): a support payment buys no seat and belongs to no training. Registration and renewal orders always carry both (a renewal keeps the original registration's). |
| `programme_id` | String | yes | `Uuid` |  |  |  |
| `status` | enum OrderStatus | no |  | `pending` |  |  |
| `kind` | enum OrderKind | no |  | `registration` |  | M6: a renewal order keeps the original registration's offering and programme. Capacity counting and the duplicate checks look at `registration` orders only. |
| `certificate_id` | String | yes | `Uuid` |  |  |  |
| `knowledge_check_attempt_id` | String | yes | `Uuid` |  |  | M14 Phase 5: the attempt an unlock order pays for (kind = knowledge_check_unlock only). |
| `region` | enum PriceRegion | no |  |  |  |  |
| `currency` | String | no | `Char(3)` |  |  |  |
| `amount_minor` | BigInt | no |  |  |  |  |
| `coupon_id` | String | yes | `Uuid` |  |  | Coupon feature (N1–N8 approved 2026-09-28). Set only when a coupon was applied at checkout: the coupon, the percent applied, and the price BEFORE the discount — `amountMinor` stays what Stripe actually charges (after the discount and the 2.00-per-currency floor, N2). |
| `coupon_discount_percent` | Int | yes |  |  |  |  |
| `amount_before_coupon_minor` | BigInt | yes |  |  |  |  |
| `stripe_checkout_session_id` | String | yes |  |  | unique |  |
| `stripe_payment_intent_id` | String | yes |  |  |  |  |
| `expires_at` | DateTime | no | `Timestamptz(6)` |  |  |  |
| `paid_at` | DateTime | yes | `Timestamptz(6)` |  |  |  |
| `created_at` | DateTime | no | `Timestamptz(6)` | `now()` |  |  |
| `updated_at` | DateTime | no | `Timestamptz(6)` |  |  |  |

## Relationships

| Field | Target model → table | Cardinality | Definition |
|---|---|---|---|
| `user` | `User` → `users` | one | `@relation(fields: [userId], references: [id], onDelete: Restrict)` |
| `offering` | `ScheduledOffering` → `scheduled_offerings` | optional one | `@relation(fields: [offeringId], references: [id], onDelete: Restrict)` |
| `programme` | `Programme` → `programmes` | optional one | `@relation(fields: [programmeId], references: [id], onDelete: Restrict)` |
| `certificate` | `Certificate` → `certificates` | optional one | `@relation(fields: [certificateId], references: [id], onDelete: Restrict)` |
| `knowledgeCheckAttempt` | `KnowledgeCheckAttempt` → `knowledge_check_attempts` | optional one | `@relation(fields: [knowledgeCheckAttemptId], references: [id], onDelete: Restrict)` |
| `coupon` | `Coupon` → `coupons` | optional one | `@relation("order_coupon", fields: [couponId], references: [id], onDelete: Restrict)` |
| `payment` | `Payment` → `payments` | optional one |  |
| `registration` | `Registration` → `registrations` | optional one |  |
| `renewal` | `CertificateRenewal` → `certificate_renewals` | optional one |  |
| `couponRedemption` | `Coupon` → `coupons` | optional one | `@relation("coupon_redeemed_order")` |
| `interest` | `TrainingInterest` → `training_interests` | optional one |  |

## Indexes and constraints

```
@@index([userId, createdAt])
@@index([offeringId, status, expiresAt])
@@index([couponId])
```

## Change history

- 2026-10-02 — file generated from the schema by CR-2026-10-02-2045. Re-generate or edit when the schema changes (a schema change is a RED gate).
