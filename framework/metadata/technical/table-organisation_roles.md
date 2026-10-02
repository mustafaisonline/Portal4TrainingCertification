# table — organisation_roles

| Field | Value |
|---|---|
| Category | technical |
| Kind | table |
| Source of truth | `prisma/schema.prisma` (model `OrganisationRole`) and `prisma/migrations/` |
| Owner | founder |
| Version / date | generated from the schema 2026-10-02 |
| Status | approved (in production schema) |
| Related | CLAUDE.md Rule 1 (data model is a RED gate) |

## Purpose
Which roles an organisation offers (shared roles it enabled, plus its own private roles). Composite key; a removal deletes the row (the audit log is the record).

## Columns

| Column | Type | Nullable | DB type | Default | Keys | Note |
|---|---|---|---|---|---|---|
| `organisation_id` | String | no | `Uuid` |  |  |  |
| `role_id` | String | no | `Uuid` |  |  |  |
| `created_at` | DateTime | no | `Timestamptz(6)` | `now()` |  |  |

## Relationships

| Field | Target model → table | Cardinality | Definition |
|---|---|---|---|
| `organisation` | `Organisation` → `organisations` | one | `@relation(fields: [organisationId], references: [id], onDelete: Cascade)` |
| `role` | `AssessmentRole` → `assessment_roles` | one | `@relation(fields: [roleId], references: [id], onDelete: Cascade)` |

## Indexes and constraints

```
@@id([organisationId, roleId])
@@index([roleId])
```

## Change history

- 2026-10-02 — file generated from the schema by CR-2026-10-02-2045. Re-generate or edit when the schema changes (a schema change is a RED gate).
