# table — programme_modules

| Field | Value |
|---|---|
| Category | technical |
| Kind | table |
| Source of truth | `prisma/schema.prisma` (model `ProgrammeModule`) and `prisma/migrations/` |
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
| `programme_id` | String | no | `Uuid` |  |  |  |
| `position` | Int | no |  |  |  |  |
| `title` | String | no |  |  |  |  |
| `description` | String | yes |  |  |  |  |
| `points` | Json | yes |  |  |  |  |

## Relationships

| Field | Target model → table | Cardinality | Definition |
|---|---|---|---|
| `programme` | `Programme` → `programmes` | one | `@relation(fields: [programmeId], references: [id], onDelete: Cascade)` |

## Indexes and constraints

```
@@unique([programmeId, position])
```

## Change history

- 2026-10-02 — file generated from the schema by CR-2026-10-02-2045. Re-generate or edit when the schema changes (a schema change is a RED gate).
