# table — diagnostic_questions

| Field | Value |
|---|---|
| Category | technical |
| Kind | table |
| Source of truth | `prisma/schema.prisma` (model `DiagnosticQuestion`) and `prisma/migrations/` |
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
| `code` | String | no |  |  | unique |  |
| `domain_id` | String | no | `Uuid` |  |  |  |
| `position` | Int | no |  |  | unique |  |
| `scenario` | String | no |  |  |  |  |
| `options` | Json | no |  |  |  | string[]; "I'm not sure" is appended by the UI, never stored. |

## Relationships

| Field | Target model → table | Cardinality | Definition |
|---|---|---|---|
| `domain` | `Domain` → `domains` | one | `@relation(fields: [domainId], references: [id], onDelete: Restrict)` |

## Change history

- 2026-10-02 — file generated from the schema by CR-2026-10-02-2045. Re-generate or edit when the schema changes (a schema change is a RED gate).
