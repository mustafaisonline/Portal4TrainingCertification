# table — enquiries

| Field | Value |
|---|---|
| Category | technical |
| Kind | table |
| Source of truth | `prisma/schema.prisma` (model `Enquiry`) and `prisma/migrations/` |
| Owner | founder |
| Version / date | generated from the schema 2026-10-02 |
| Status | approved (in production schema) |
| Related | CLAUDE.md Rule 1 (data model is a RED gate) |

## Purpose
Contact / register-interest submissions — persistent from day one.

## Columns

| Column | Type | Nullable | DB type | Default | Keys | Note |
|---|---|---|---|---|---|---|
| `id` | String | no | `Uuid` | `dbgenerated("gen_random_uuid()")` | PK |  |
| `kind` | enum EnquiryKind | no |  |  |  |  |
| `name` | String | no |  |  |  |  |
| `email` | String | no |  |  |  |  |
| `organisation` | String | yes |  |  |  |  |
| `message` | String | no |  |  |  |  |
| `programme_id` | String | yes | `Uuid` |  |  |  |
| `source_path` | String | no |  |  |  |  |
| `status` | enum EnquiryStatus | no |  | `new` |  |  |
| `created_at` | DateTime | no | `Timestamptz(6)` | `now()` |  |  |

## Relationships

| Field | Target model → table | Cardinality | Definition |
|---|---|---|---|
| `programme` | `Programme` → `programmes` | optional one | `@relation(fields: [programmeId], references: [id], onDelete: SetNull)` |

## Indexes and constraints

```
@@index([status, createdAt])
```

## Change history

- 2026-10-02 — file generated from the schema by CR-2026-10-02-2045. Re-generate or edit when the schema changes (a schema change is a RED gate).
