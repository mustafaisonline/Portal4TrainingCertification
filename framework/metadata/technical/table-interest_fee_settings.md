# table — interest_fee_settings

| Field | Value |
|---|---|
| Category | technical |
| Kind | table |
| Source of truth | `prisma/schema.prisma` (model `InterestFeeSetting`) and `prisma/migrations/` |
| Owner | founder |
| Version / date | generated from the schema 2026-10-02 |
| Status | approved (in production schema) |
| Related | CLAUDE.md Rule 1 (data model is a RED gate) |

## Purpose
The interest fee, administrator-managed, effective-dated, insert-only (same discipline as `knowledge_check_unlock_settings`): the row in force is the newest `effective_from <= now`; `enabled` is the switch.

## Columns

| Column | Type | Nullable | DB type | Default | Keys | Note |
|---|---|---|---|---|---|---|
| `id` | String | no | `Uuid` | `dbgenerated("gen_random_uuid()")` | PK |  |
| `enabled` | Boolean | no |  | `true` |  |  |
| `amount_minor` | Int | no |  |  |  |  |
| `currency` | String | no | `Char(3)` |  |  |  |
| `label` | String | no |  |  |  |  |
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
