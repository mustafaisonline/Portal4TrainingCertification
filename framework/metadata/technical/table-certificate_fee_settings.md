# table — certificate_fee_settings

| Field | Value |
|---|---|
| Category | technical |
| Kind | table |
| Source of truth | `prisma/schema.prisma` (model `CertificateFeeSetting`) and `prisma/migrations/` |
| Owner | founder |
| Version / date | generated from the schema 2026-10-02 |
| Status | approved (in production schema) |
| Related | CLAUDE.md Rule 1 (data model is a RED gate) |

## Purpose
Not described in the schema's doc comment; see the milestone plan that introduced the table.

## Columns

| Column | Type | Nullable | DB type | Default | Keys | Note |
|---|---|---|---|---|---|---|
| `id` | String | no | `Uuid` | `dbgenerated("gen_random_uuid()")` | PK |  |
| `amount_minor` | Int | no |  |  |  |  |
| `currency` | String | no | `Char(3)` |  |  |  |
| `effective_from` | DateTime | no | `Timestamptz(6)` |  |  |  |
| `created_by_user_id` | String | yes | `Uuid` |  |  |  |
| `note` | String | yes |  |  |  |  |
| `created_at` | DateTime | no | `Timestamptz(6)` | `now()` |  |  |

## Relationships

| Field | Target model → table | Cardinality | Definition |
|---|---|---|---|
| `renewals` | `CertificateRenewal` → `certificate_renewals` | many |  |

## Indexes and constraints

```
@@index([effectiveFrom])
```

## Change history

- 2026-10-02 — file generated from the schema by CR-2026-10-02-2045. Re-generate or edit when the schema changes (a schema change is a RED gate).
