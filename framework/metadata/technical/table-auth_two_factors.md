# table — auth_two_factors

| Field | Value |
|---|---|
| Category | technical |
| Kind | table |
| Source of truth | `prisma/schema.prisma` (model `AuthTwoFactor`) and `prisma/migrations/` |
| Owner | founder |
| Version / date | generated from the schema 2026-10-02 |
| Status | approved (in production schema) |
| Related | CLAUDE.md Rule 1 (data model is a RED gate) |

## Purpose
UNUSED since 2026-09-21: two-factor authentication was removed for MVP 1 by founder decision. Kept (with `AuthUser.twoFactorEnabled`) because dropping is a destructive migration needing separate approval.

## Columns

| Column | Type | Nullable | DB type | Default | Keys | Note |
|---|---|---|---|---|---|---|
| `id` | String | no |  |  | PK |  |
| `secret` | String | no |  |  |  |  |
| `backup_codes` | String | no |  |  |  |  |
| `user_id` | String | no |  |  |  |  |
| `verified` | Boolean | yes |  | `true` |  |  |
| `failed_verification_count` | Int | yes |  | `0` |  |  |
| `locked_until` | DateTime | yes | `Timestamptz(6)` |  |  |  |

## Relationships

| Field | Target model → table | Cardinality | Definition |
|---|---|---|---|
| `user` | `AuthUser` → `auth_users` | one | `@relation(fields: [userId], references: [id], onDelete: Cascade)` |

## Indexes and constraints

```
@@index([secret])
@@index([userId])
```

## Change history

- 2026-10-02 — file generated from the schema by CR-2026-10-02-2045. Re-generate or edit when the schema changes (a schema change is a RED gate).
