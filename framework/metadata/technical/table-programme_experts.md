# table — programme_experts

| Field | Value |
|---|---|
| Category | technical |
| Kind | table |
| Source of truth | `prisma/schema.prisma` (model `ProgrammeExpert`) and `prisma/migrations/` |
| Owner | founder |
| Version / date | generated from the schema 2026-10-02 |
| Status | approved (in production schema) |
| Related | CLAUDE.md Rule 1 (data model is a RED gate) |

## Purpose
Expert association (ADR-043).

## Columns

| Column | Type | Nullable | DB type | Default | Keys | Note |
|---|---|---|---|---|---|---|
| `programme_id` | String | no | `Uuid` |  |  |  |
| `expert_id` | String | no | `Uuid` |  |  |  |
| `role` | String | no |  | `"lead"` |  |  |

## Relationships

| Field | Target model → table | Cardinality | Definition |
|---|---|---|---|
| `programme` | `Programme` → `programmes` | one | `@relation(fields: [programmeId], references: [id], onDelete: Cascade)` |
| `expert` | `Expert` → `experts` | one | `@relation(fields: [expertId], references: [id], onDelete: Restrict)` |

## Indexes and constraints

```
@@id([programmeId, expertId])
```

## Change history

- 2026-10-02 — file generated from the schema by CR-2026-10-02-2045. Re-generate or edit when the schema changes (a schema change is a RED gate).
