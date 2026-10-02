# table — stripe_events

| Field | Value |
|---|---|
| Category | technical |
| Kind | table |
| Source of truth | `prisma/schema.prisma` (model `StripeEvent`) and `prisma/migrations/` |
| Owner | founder |
| Version / date | generated from the schema 2026-10-02 |
| Status | approved (in production schema) |
| Related | CLAUDE.md Rule 1 (data model is a RED gate) |

## Purpose
Every webhook event, stored BEFORE processing — idempotency + audit.

## Columns

| Column | Type | Nullable | DB type | Default | Keys | Note |
|---|---|---|---|---|---|---|
| `id` | String | no |  |  | PK |  |
| `type` | String | no |  |  |  |  |
| `status` | enum StripeEventStatus | no |  | `received` |  |  |
| `payload` | Json | no |  |  |  |  |
| `error` | String | yes |  |  |  |  |
| `received_at` | DateTime | no | `Timestamptz(6)` | `now()` |  |  |
| `processed_at` | DateTime | yes | `Timestamptz(6)` |  |  |  |

## Indexes and constraints

```
@@index([type, receivedAt])
```

## Change history

- 2026-10-02 — file generated from the schema by CR-2026-10-02-2045. Re-generate or edit when the schema changes (a schema change is a RED gate).
