# table — auth_accounts

| Field | Value |
|---|---|
| Category | technical |
| Kind | table |
| Source of truth | `prisma/schema.prisma` (model `AuthAccount`) and `prisma/migrations/` |
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
| `account_id` | String | no |  |  |  |  |
| `provider_id` | String | no |  |  |  |  |
| `user_id` | String | no |  |  |  |  |
| `access_token` | String | yes |  |  |  |  |
| `refresh_token` | String | yes |  |  |  |  |
| `id_token` | String | yes |  |  |  |  |
| `access_token_expires_at` | DateTime | yes | `Timestamptz(6)` |  |  |  |
| `refresh_token_expires_at` | DateTime | yes | `Timestamptz(6)` |  |  |  |
| `scope` | String | yes |  |  |  |  |
| `password` | String | yes |  |  |  | scrypt hash for the email+password credential (Better Auth default). |
| `created_at` | DateTime | no | `Timestamptz(6)` | `now()` |  |  |
| `updated_at` | DateTime | no | `Timestamptz(6)` |  |  |  |

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
