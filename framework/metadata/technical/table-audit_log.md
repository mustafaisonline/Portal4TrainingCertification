# table — audit_log

| Field | Value |
|---|---|
| Category | technical |
| Kind | table |
| Source of truth | `prisma/schema.prisma` (model `AuditLog`) and `prisma/migrations/` |
| Owner | founder |
| Version / date | generated from the schema 2026-10-02 |
| Status | approved (in production schema) |
| Related | CLAUDE.md Rule 1 (data model is a RED gate) |

## Purpose
INSERT-ONLY (ADR-022). Written in the same transaction as the change it describes. No code path updates or deletes a row.

## Columns

| Column | Type | Nullable | DB type | Default | Keys | Note |
|---|---|---|---|---|---|---|
| `id` | String | no | `Uuid` | `dbgenerated("gen_random_uuid()")` | PK |  |
| `actor_user_id` | String | yes | `Uuid` |  |  | Null = the system itself. |
| `action` | String | no |  |  |  |  |
| `entity_type` | String | no |  |  |  |  |
| `entity_id` | String | no |  |  |  |  |
| `before` | Json | yes |  |  |  |  |
| `after` | Json | yes |  |  |  |  |
| `reason` | String | yes |  |  |  |  |
| `created_at` | DateTime | no | `Timestamptz(6)` | `now()` |  |  |

## Indexes and constraints

```
@@index([entityType, entityId])
@@index([actorUserId])
```

## Change history

- 2026-10-02 — file generated from the schema by CR-2026-10-02-2045. Re-generate or edit when the schema changes (a schema change is a RED gate).
