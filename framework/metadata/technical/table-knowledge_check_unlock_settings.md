# table — knowledge_check_unlock_settings

| Field | Value |
|---|---|
| Category | technical |
| Kind | table |
| Source of truth | `prisma/schema.prisma` (model `KnowledgeCheckUnlockSetting`) and `prisma/migrations/` |
| Owner | founder |
| Version / date | generated from the schema 2026-10-02 |
| Status | approved (in production schema) |
| Related | CLAUDE.md Rule 1 (data model is a RED gate) |

## Purpose
The Knowledge Check result-document unlock fee — Milestone 14 Phase 5 (§4 row 5 approved 2026-09-27; DR-03 §3; P13 Pakistan exempt, P14 non-refundable). Same shape and rules as `SupportPaymentSetting`: admin-managed, effective-dated, insert-only; `enabled` is the switch.

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
