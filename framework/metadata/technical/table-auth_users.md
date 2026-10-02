# table — auth_users

| Field | Value |
|---|---|
| Category | technical |
| Kind | table |
| Source of truth | `prisma/schema.prisma` (model `AuthUser`) and `prisma/migrations/` |
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
| `name` | String | no |  |  |  |  |
| `email` | String | no |  |  | unique |  |
| `email_verified` | Boolean | no |  | `false` |  |  |
| `image` | String | yes |  |  |  |  |
| `two_factor_enabled` | Boolean | yes |  | `false` |  |  |
| `country` | String | yes |  |  |  | Input carrier only: collected at registration (the reviewed form has it) and copied to `users.country` by the mapping hook. Not read afterwards. |
| `created_at` | DateTime | no | `Timestamptz(6)` | `now()` |  |  |
| `updated_at` | DateTime | no | `Timestamptz(6)` |  |  |  |

## Relationships

| Field | Target model → table | Cardinality | Definition |
|---|---|---|---|
| `sessions` | `AuthSession` → `auth_sessions` | many |  |
| `accounts` | `AuthAccount` → `auth_accounts` | many |  |
| `twoFactors` | `AuthTwoFactor` → `auth_two_factors` | many |  |

## Change history

- 2026-10-02 — file generated from the schema by CR-2026-10-02-2045. Re-generate or edit when the schema changes (a schema change is a RED gate).
