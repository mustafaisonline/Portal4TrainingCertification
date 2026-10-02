# table — user_roles

| Field | Value |
|---|---|
| Category | technical |
| Kind | table |
| Source of truth | `prisma/schema.prisma` (model `UserRole`) and `prisma/migrations/` |
| Owner | founder |
| Version / date | generated from the schema 2026-10-02 |
| Status | approved (in production schema) |
| Related | CLAUDE.md Rule 1 (data model is a RED gate) |

## Purpose
Scoped RBAC — never a role column on users (ADR-020). Revocation is a state on the row, not a delete, so the history is kept.

## Columns

| Column | Type | Nullable | DB type | Default | Keys | Note |
|---|---|---|---|---|---|---|
| `id` | String | no | `Uuid` | `dbgenerated("gen_random_uuid()")` | PK |  |
| `user_id` | String | no | `Uuid` |  |  |  |
| `role` | enum UserRoleName | no |  |  |  |  |
| `scope_type` | enum RoleScopeType | no |  |  |  |  |
| `scope_id` | String | yes | `Uuid` |  |  | Null only when scopeType = platform. |
| `granted_at` | DateTime | no | `Timestamptz(6)` | `now()` |  |  |
| `granted_by_user_id` | String | yes | `Uuid` |  |  |  |
| `revoked_at` | DateTime | yes | `Timestamptz(6)` |  |  |  |
| `revoked_by_user_id` | String | yes | `Uuid` |  |  |  |

## Relationships

| Field | Target model → table | Cardinality | Definition |
|---|---|---|---|
| `user` | `User` → `users` | one | `@relation(fields: [userId], references: [id], onDelete: Restrict)` |

## Indexes and constraints

```
@@unique([userId, role, scopeType, scopeId])
@@index([userId])
```

## Change history

- 2026-10-02 — file generated from the schema by CR-2026-10-02-2045. Re-generate or edit when the schema changes (a schema change is a RED gate).
