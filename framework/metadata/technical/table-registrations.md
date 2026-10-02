# table — registrations

| Field | Value |
|---|---|
| Category | technical |
| Kind | table |
| Source of truth | `prisma/schema.prisma` (model `Registration`) and `prisma/migrations/` |
| Owner | founder |
| Version / date | generated from the schema 2026-10-02 |
| Status | approved (in production schema) |
| Related | CLAUDE.md Rule 1 (data model is a RED gate) |

## Purpose
A person's place in an offering (ADR-043). Created ONLY by the paid-webhook transaction (plan §6.1).

## Columns

| Column | Type | Nullable | DB type | Default | Keys | Note |
|---|---|---|---|---|---|---|
| `id` | String | no | `Uuid` | `dbgenerated("gen_random_uuid()")` | PK |  |
| `user_id` | String | no | `Uuid` |  |  |  |
| `offering_id` | String | no | `Uuid` |  |  |  |
| `order_id` | String | no | `Uuid` |  | unique |  |
| `status` | enum RegistrationStatus | no |  | `confirmed` |  |  |
| `transfer_used` | Boolean | no |  | `false` |  |  |
| `transferred_to_registration_id` | String | yes | `Uuid` |  |  |  |
| `cancelled_at` | DateTime | yes | `Timestamptz(6)` |  |  |  |
| `cancellation_refund_percent` | Int | yes |  |  |  |  |
| `created_at` | DateTime | no | `Timestamptz(6)` | `now()` |  |  |
| `updated_at` | DateTime | no | `Timestamptz(6)` |  |  |  |

## Relationships

| Field | Target model → table | Cardinality | Definition |
|---|---|---|---|
| `user` | `User` → `users` | one | `@relation(fields: [userId], references: [id], onDelete: Restrict)` |
| `offering` | `ScheduledOffering` → `scheduled_offerings` | one | `@relation(fields: [offeringId], references: [id], onDelete: Restrict)` |
| `order` | `Order` → `orders` | one | `@relation(fields: [orderId], references: [id], onDelete: Restrict)` |
| `review` | `Review` → `reviews` | optional one |  |
| `certificate` | `Certificate` → `certificates` | optional one |  |
| `attendance` | `AttendanceRecord` → `attendance_records` | optional one |  |

## Indexes and constraints

```
@@index([offeringId, status])
@@index([userId, status])
```

## Change history

- 2026-10-02 — file generated from the schema by CR-2026-10-02-2045. Re-generate or edit when the schema changes (a schema change is a RED gate).
