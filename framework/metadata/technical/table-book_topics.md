# table — book_topics

| Field | Value |
|---|---|
| Category | technical |
| Kind | table |
| Source of truth | `prisma/schema.prisma` (model `BookTopic`) and `prisma/migrations/` |
| Owner | founder |
| Version / date | generated from the schema 2026-10-02 |
| Status | approved (in production schema) |
| Related | CLAUDE.md Rule 1 (data model is a RED gate) |

## Purpose
--------------------------------------------------------------------------- Free Learning — Milestone 14 Phase 2 (DR-03; §4 rows 1–2 approved 2026-09-27). The founder's book *I Am Datapedia!* as topics: one row per top-level heading of the source document, imported by scripts/ingest-datapedia.ts, published topic by topic. Images are stored here as bytes (founder decision P8: PostgreSQL, not object storage) and served by /free-learning/images/<id>.

## Columns

| Column | Type | Nullable | DB type | Default | Keys | Note |
|---|---|---|---|---|---|---|
| `id` | String | no | `Uuid` | `dbgenerated("gen_random_uuid()")` | PK |  |
| `position` | Int | no |  |  | unique | Order in the book. |
| `slug` | String | no |  |  | unique |  |
| `title` | String | no |  |  |  |  |
| `body_html` | String | no |  |  |  | Sanitised HTML from the import; image `src`s point at the image route. |
| `body_text` | String | no |  |  |  | Plain text of the body, for search and word counts. |
| `source_heading` | String | no |  |  |  | The heading exactly as it appears in the source, for traceability. |
| `word_count` | Int | no |  |  |  |  |
| `published` | Boolean | no |  | `false` |  |  |
| `imported_at` | DateTime | no | `Timestamptz(6)` |  |  |  |
| `created_at` | DateTime | no | `Timestamptz(6)` | `now()` |  |  |
| `updated_at` | DateTime | no | `Timestamptz(6)` |  |  |  |

## Relationships

| Field | Target model → table | Cardinality | Definition |
|---|---|---|---|
| `images` | `BookTopicImage` → `book_topic_images` | many |  |
| `questions` | `TopicQuestion` → `topic_questions` | many |  |

## Indexes and constraints

```
@@index([published, position])
```

## Change history

- 2026-10-02 — file generated from the schema by CR-2026-10-02-2045. Re-generate or edit when the schema changes (a schema change is a RED gate).
