# table — training_interests

| Field | Value |
|---|---|
| Category | technical |
| Kind | table |
| Source of truth | `prisma/schema.prisma` (model `TrainingInterest`) and `prisma/migrations/` |
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
| `programme_id` | String | no | `Uuid` |  |  |  |
| `delivery_format_id` | String | no | `Uuid` |  |  |  |
| `user_id` | String | no | `Uuid` |  |  |  |
| `order_id` | String | yes | `Uuid` |  | unique | The pending/paid order (null when the fee is waived or not yet started). |
| `email` | String | no |  |  |  | The contact email the person gave (required); the trainer writes to this. |
| `full_name` | String | yes |  |  |  |  |
| `mobile` | String | yes |  |  |  |  |
| `date_of_birth` | DateTime | yes | `Date` |  |  |  |
| `consent` | Boolean | no |  |  |  | The person agreed that the trainer of this training may contact them. |
| `status` | enum InterestStatus | no |  | `pending` |  |  |
| `fee_waived` | Boolean | no |  | `false` |  | True for a participant in Pakistan (no card route): registered without the fee. |
| `confirmed_at` | DateTime | yes | `Timestamptz(6)` |  |  |  |
| `notified_at` | DateTime | yes | `Timestamptz(6)` |  |  |  |
| `notified_by_user_id` | String | yes | `Uuid` |  |  |  |
| `created_at` | DateTime | no | `Timestamptz(6)` | `now()` |  |  |
| `updated_at` | DateTime | no | `Timestamptz(6)` |  |  |  |

## Relationships

| Field | Target model → table | Cardinality | Definition |
|---|---|---|---|
| `programme` | `Programme` → `programmes` | one | `@relation(fields: [programmeId], references: [id], onDelete: Restrict)` |
| `deliveryFormat` | `DeliveryFormat` → `delivery_formats` | one | `@relation(fields: [deliveryFormatId], references: [id], onDelete: Restrict)` |
| `user` | `User` → `users` | one | `@relation(fields: [userId], references: [id], onDelete: Restrict)` |
| `order` | `Order` → `orders` | optional one | `@relation(fields: [orderId], references: [id], onDelete: Restrict)` |
| `notifiedByUser` | `User` → `users` | optional one | `@relation("interest_notified_by", fields: [notifiedByUserId], references: [id], onDelete: Restrict)` |

## Indexes and constraints

```
@@unique([userId, deliveryFormatId])
@@index([programmeId, status])
@@index([deliveryFormatId, status])
```

## Change history

- 2026-10-02 — file generated from the schema by CR-2026-10-02-2045. Re-generate or edit when the schema changes (a schema change is a RED gate).
