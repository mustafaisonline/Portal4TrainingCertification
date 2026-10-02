# table — delivery_formats

| Field | Value |
|---|---|
| Category | technical |
| Kind | table |
| Source of truth | `prisma/schema.prisma` (model `DeliveryFormat`) and `prisma/migrations/` |
| Owner | founder |
| Version / date | generated from the schema 2026-10-02 |
| Status | approved (in production schema) |
| Related | CLAUDE.md Rule 1 (data model is a RED gate) |

## Purpose
Pace variants of a programme (Bootcamp / Accelerator / Mastery).

## Columns

| Column | Type | Nullable | DB type | Default | Keys | Note |
|---|---|---|---|---|---|---|
| `id` | String | no | `Uuid` | `dbgenerated("gen_random_uuid()")` | PK |  |
| `programme_id` | String | no | `Uuid` |  |  |  |
| `code` | String | no |  |  |  |  |
| `name` | String | no |  |  |  |  |
| `badge` | String | yes |  |  |  |  |
| `duration_label` | String | no |  |  |  |  |
| `schedule_label` | String | no |  |  |  |  |
| `total_time_label` | String | no |  |  |  |  |
| `best_for` | Json | no |  |  |  |  |
| `position` | Int | no |  |  |  |  |

## Relationships

| Field | Target model → table | Cardinality | Definition |
|---|---|---|---|
| `programme` | `Programme` → `programmes` | one | `@relation(fields: [programmeId], references: [id], onDelete: Cascade)` |
| `offerings` | `ScheduledOffering` → `scheduled_offerings` | many |  |
| `interests` | `TrainingInterest` → `training_interests` | many |  |

## Indexes and constraints

```
@@unique([programmeId, code])
```

## Change history

- 2026-10-02 — file generated from the schema by CR-2026-10-02-2045. Re-generate or edit when the schema changes (a schema change is a RED gate).
