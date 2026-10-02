# table — auth_sessions

| Field | Value |
|---|---|
| Category | technical |
| Kind | table |
| Source of truth | `prisma/schema.prisma` (model `AuthSession`) and `prisma/migrations/` |
| Owner | founder |
| Version / date | generated from the schema 2026-10-02 |
| Status | approved (in production schema) |
| Related | CLAUDE.md Rule 1 (data model is a RED gate) |

## Purpose
Not described in the schema's doc comment; see the milestone plan that introduced the table.

## Columns

| Column | Type | Nullable | DB type | Default | Keys | Note |
|---|---|---|---|---|---|---|
| `id` | String | no |  |  | PK |  |
| `expires_at` | DateTime | no | `Timestamptz(6)` |  |  |  |
| `token` | String | no |  |  | unique |  |
| `created_at` | DateTime | no | `Timestamptz(6)` | `now()` |  |  |
| `updated_at` | DateTime | no | `Timestamptz(6)` |  |  |  |
| `ip_address` | String | yes |  |  |  |  |
| `user_agent` | String | yes |  |  |  |  |
| `user_id` | String | no |  |  |  |  |

## Relationships

| Field | Target model → table | Cardinality | Definition |
|---|---|---|---|
| `user` | `AuthUser` → `auth_users` | one | `@relation(fields: [userId], references: [id], onDelete: Cascade)` |

## Indexes and constraints

```
@@index([userId])
```

## Change history

- 2026-10-02 — file generated from the schema by CR-2026-10-02-2045. Re-generate or edit when the schema changes (a schema change is a RED gate).
