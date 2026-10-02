# table — topic_questions

| Field | Value |
|---|---|
| Category | technical |
| Kind | table |
| Source of truth | `prisma/schema.prisma` (model `TopicQuestion`) and `prisma/migrations/` |
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
| `topic_id` | String | no | `Uuid` |  |  |  |
| `position` | Int | no |  |  |  |  |
| `stem` | String | no |  |  |  |  |
| `explanation` | String | yes |  |  |  | Shown with the answer after Submit; optional. |
| `status` | enum TopicQuestionStatus | no |  | `draft` |  |  |
| `reviewed_by_user_id` | String | yes | `Uuid` |  |  |  |
| `reviewed_at` | DateTime | yes | `Timestamptz(6)` |  |  |  |
| `created_at` | DateTime | no | `Timestamptz(6)` | `now()` |  |  |
| `updated_at` | DateTime | no | `Timestamptz(6)` |  |  |  |

## Relationships

| Field | Target model → table | Cardinality | Definition |
|---|---|---|---|
| `topic` | `BookTopic` → `book_topics` | one | `@relation(fields: [topicId], references: [id], onDelete: Cascade)` |
| `reviewedBy` | `User` → `users` | optional one | `@relation("topic_question_reviewed_by", fields: [reviewedByUserId], references: [id], onDelete: Restrict)` |
| `options` | `TopicQuestionOption` → `topic_question_options` | many |  |

## Indexes and constraints

```
@@unique([topicId, position])
@@index([topicId, status])
```

## Change history

- 2026-10-02 — file generated from the schema by CR-2026-10-02-2045. Re-generate or edit when the schema changes (a schema change is a RED gate).
