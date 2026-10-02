# table — role_test_attempts

| Field | Value |
|---|---|
| Category | technical |
| Kind | table |
| Source of truth | `prisma/schema.prisma` (model `RoleTestAttempt`) and `prisma/migrations/` |
| Owner | founder |
| Version / date | generated from the schema 2026-10-02 |
| Status | approved (in production schema) |
| Related | CLAUDE.md Rule 1 (data model is a RED gate) |

## Purpose
One role test by a signed-in person (Prepare for Interview, or an organisation's screening when `organisation_id` is set). Same shape as `knowledge_check_attempts`: the questions served (ids, in order), the answers so far, and — once finished — the score. The deadline (`started_at` + 90 min), percentage and time taken are DERIVED. The result is visible to the organisation only when `shared_with_organisation` (the candidate's acknowledgement before starting). NOT a credential.

## Columns

| Column | Type | Nullable | DB type | Default | Keys | Note |
|---|---|---|---|---|---|---|
| `id` | String | no | `Uuid` | `dbgenerated("gen_random_uuid()")` | PK |  |
| `user_id` | String | no | `Uuid` |  |  |  |
| `role_id` | String | no | `Uuid` |  |  |  |
| `organisation_id` | String | yes | `Uuid` |  |  |  |
| `size` | Int | no |  |  |  |  |
| `question_ids` | Json | no |  |  |  | string[] — role question ids in the order served. |
| `answers` | Json | no |  | `"{}"` |  | { [questionId]: optionPosition } — saved page by page. |
| `score` | Int | yes |  |  |  |  |
| `started_at` | DateTime | no | `Timestamptz(6)` | `now()` |  |  |
| `finished_at` | DateTime | yes | `Timestamptz(6)` |  |  |  |
| `shared_with_organisation` | Boolean | no |  | `false` |  | The candidate acknowledged, before starting, that this organisation sees the result. |
| `created_at` | DateTime | no | `Timestamptz(6)` | `now()` |  |  |
| `updated_at` | DateTime | no | `Timestamptz(6)` |  |  |  |

## Relationships

| Field | Target model → table | Cardinality | Definition |
|---|---|---|---|
| `user` | `User` → `users` | one | `@relation(fields: [userId], references: [id], onDelete: Restrict)` |
| `role` | `AssessmentRole` → `assessment_roles` | one | `@relation(fields: [roleId], references: [id], onDelete: Restrict)` |
| `organisation` | `Organisation` → `organisations` | optional one | `@relation(fields: [organisationId], references: [id], onDelete: Restrict)` |

## Indexes and constraints

```
@@index([userId, startedAt])
@@index([organisationId, roleId, finishedAt])
```

## Change history

- 2026-10-02 — file generated from the schema by CR-2026-10-02-2045. Re-generate or edit when the schema changes (a schema change is a RED gate).
