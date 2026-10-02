# table — support_payment_settings

| Field | Value |
|---|---|
| Category | technical |
| Kind | table |
| Source of truth | `prisma/schema.prisma` (model `SupportPaymentSetting`) and `prisma/migrations/` |
| Owner | founder |
| Version / date | generated from the schema 2026-10-02 |
| Status | approved (in production schema) |
| Related | CLAUDE.md Rule 1 (data model is a RED gate) |

## Purpose
Insert-only history of the renewal fee (R-F1/R-F2). The fee in force is the newest row whose `effective_from` is not in the future. Seeded at USD 10.00 (founder, 2026-09-20; E4). `created_by_user_id` is null for the seed row only. The "Support the Academy" payment (founder decisions M1–M5, 2026-09-27): an ADMIN-MANAGED, EFFECTIVE-DATED, insert-only setting like the renewal fee — the row in force is the newest `effective_from <= now`. `enabled` false hides the card everywhere and refuses new orders (the kill switch); the amount and label are read from here at the moment an order starts, never from a form. Seeded enabled at RM 2.00 (Stripe's MYR minimum).

## Columns

| Column | Type | Nullable | DB type | Default | Keys | Note |
|---|---|---|---|---|---|---|
| `id` | String | no | `Uuid` | `dbgenerated("gen_random_uuid()")` | PK |  |
| `enabled` | Boolean | no |  | `true` |  |  |
| `amount_minor` | Int | no |  |  |  |  |
| `currency` | String | no | `Char(3)` |  |  |  |
| `label` | String | no |  |  |  | What Stripe's page and the receipt name it. |
| `effective_from` | DateTime | no | `Timestamptz(6)` |  |  |  |
| `created_by_user_id` | String | yes | `Uuid` |  |  |  |
| `note` | String | yes |  |  |  |  |
| `created_at` | DateTime | no | `Timestamptz(6)` | `now()` |  |  |

## Indexes and constraints

```
@@index([effectiveFrom])
```

## Change history

- 2026-10-02 — file generated from the schema by CR-2026-10-02-2045. Re-generate or edit when the schema changes (a schema change is a RED gate).
