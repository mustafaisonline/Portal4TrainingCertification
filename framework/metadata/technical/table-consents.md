# table — consents

| Field | Value |
|---|---|
| Category | technical |
| Kind | table |
| Source of truth | `prisma/schema.prisma` (model `Consent`) and `prisma/migrations/` |
| Owner | founder |
| Version / date | generated from the schema 2026-10-02 |
| Status | approved (in production schema) |
| Related | CLAUDE.md Rule 1 (data model is a RED gate) |

## Purpose
Recorded acceptance of a PUBLISHED legal document version. Never written when no version is published (MILESTONE_2_EXECUTION_PLAN.md §6.9).

## Columns

| Column | Type | Nullable | DB type | Default | Keys | Note |
|---|---|---|---|---|---|---|
| `id` | String | no | `Uuid` | `dbgenerated("gen_random_uuid()")` | PK |  |
| `user_id` | String | no | `Uuid` |  |  |  |
| `document_key` | String | no |  |  |  |  |
| `document_version` | String | no |  |  |  |  |
| `accepted_at` | DateTime | no | `Timestamptz(6)` | `now()` |  |  |

## Relationships

| Field | Target model → table | Cardinality | Definition |
|---|---|---|---|
| `user` | `User` → `users` | one | `@relation(fields: [userId], references: [id], onDelete: Restrict)` |

## Indexes and constraints

```
@@unique([userId, documentKey, documentVersion])
```

## Change history

- 2026-10-02 — file generated from the schema by CR-2026-10-02-2045. Re-generate or edit when the schema changes (a schema change is a RED gate).
