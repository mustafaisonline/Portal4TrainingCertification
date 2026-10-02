# table — faq_entries

| Field | Value |
|---|---|
| Category | technical |
| Kind | table |
| Source of truth | `prisma/schema.prisma` (model `FaqEntry`) and `prisma/migrations/` |
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
| `group_title` | String | no |  |  |  |  |
| `position` | Int | no |  |  |  |  |
| `question` | String | no |  |  |  |  |
| `answer` | String | no |  |  |  |  |
| `href` | String | yes |  |  |  |  |
| `href_label` | String | yes |  |  |  |  |
| `tbc` | Boolean | no |  | `false` |  |  |
| `published` | Boolean | no |  | `true` |  |  |

## Indexes and constraints

```
@@unique([groupTitle, position])
```

## Change history

- 2026-10-02 — file generated from the schema by CR-2026-10-02-2045. Re-generate or edit when the schema changes (a schema change is a RED gate).
