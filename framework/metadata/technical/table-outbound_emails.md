# table — outbound_emails

| Field | Value |
|---|---|
| Category | technical |
| Kind | table |
| Source of truth | `prisma/schema.prisma` (model `OutboundEmail`) and `prisma/migrations/` |
| Owner | founder |
| Version / date | generated from the schema 2026-10-02 |
| Status | approved (in production schema) |
| Related | CLAUDE.md Rule 1 (data model is a RED gate) |

## Purpose
Durable record of every email the system decides to send. Nothing is sent without a row (ADR-015 spirit: retryable and visible, never lost).

## Columns

| Column | Type | Nullable | DB type | Default | Keys | Note |
|---|---|---|---|---|---|---|
| `id` | String | no | `Uuid` | `dbgenerated("gen_random_uuid()")` | PK |  |
| `to_email` | String | no |  |  |  |  |
| `template_key` | String | no |  |  |  |  |
| `subject` | String | no |  |  |  |  |
| `text_body` | String | no |  |  |  |  |
| `status` | enum OutboundEmailStatus | no |  | `queued` |  |  |
| `attempts` | Int | no |  | `0` |  |  |
| `last_error` | String | yes |  |  |  |  |
| `provider_message_id` | String | yes |  |  |  |  |
| `created_at` | DateTime | no | `Timestamptz(6)` | `now()` |  |  |
| `sent_at` | DateTime | yes | `Timestamptz(6)` |  |  |  |

## Indexes and constraints

```
@@index([status, createdAt])
```

## Change history

- 2026-10-02 — file generated from the schema by CR-2026-10-02-2045. Re-generate or edit when the schema changes (a schema change is a RED gate).
