# table — domains

| Field | Value |
|---|---|
| Category | technical |
| Kind | table |
| Source of truth | `prisma/schema.prisma` (model `Domain`) and `prisma/migrations/` |
| Owner | founder |
| Version / date | generated from the schema 2026-10-02 |
| Status | approved (in production schema) |
| Related | CLAUDE.md Rule 1 (data model is a RED gate) |

## Purpose
Knowledge domain — the smallest real entity in the approved conceptual model (MVP Spec §8 row 0; DATA_ARCHITECTURE.md §3.4). Approved for Milestone 1 as its single table (MILESTONE_1_EXECUTION_PLAN.md §5.4): exactly these columns and nothing more. The pilot domain is DATA, never a constant in code (ADR-023 / BR-5).

## Columns

| Column | Type | Nullable | DB type | Default | Keys | Note |
|---|---|---|---|---|---|---|
| `id` | String | no | `Uuid` | `dbgenerated("gen_random_uuid()")` | PK |  |
| `code` | String | no |  |  | unique |  |
| `name` | String | no |  |  |  |  |
| `slug` | String | no |  |  | unique |  |
| `description` | String | yes |  |  |  |  |
| `created_at` | DateTime | no | `Timestamptz(6)` | `now()` |  |  |
| `updated_at` | DateTime | no | `Timestamptz(6)` |  |  |  |

## Relationships

| Field | Target model → table | Cardinality | Definition |
|---|---|---|---|
| `programmes` | `Programme` → `programmes` | many |  |
| `diagnosticQuestions` | `DiagnosticQuestion` → `diagnostic_questions` | many |  |

## Change history

- 2026-10-02 — file generated from the schema by CR-2026-10-02-2045. Re-generate or edit when the schema changes (a schema change is a RED gate).
