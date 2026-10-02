# table — role_questions

| Field | Value |
|---|---|
| Category | technical |
| Kind | table |
| Source of truth | `prisma/schema.prisma` (model `RoleQuestion`) and `prisma/migrations/` |
| Owner | founder |
| Version / date | generated from the schema 2026-10-02 |
| Status | approved (in production schema) |
| Related | CLAUDE.md Rule 1 (data model is a RED gate) |

## Purpose
A multiple-choice interview question of a role, with a detailed model answer shown after the test. `organisation_id` NULL = the shared bank; set = that organisation's own question (served only in its tests). Exactly five options and exactly one correct are enforced by the repository.

## Columns

| Column | Type | Nullable | DB type | Default | Keys | Note |
|---|---|---|---|---|---|---|
| `id` | String | no | `Uuid` | `dbgenerated("gen_random_uuid()")` | PK |  |
| `role_id` | String | no | `Uuid` |  |  |  |
| `organisation_id` | String | yes | `Uuid` |  |  |  |
| `category` | String | no |  |  |  | The topic the per-category breakdown groups by. |
| `stem` | String | no |  |  |  |  |
| `model_answer` | String | no |  |  |  | The detailed answer, written the way a strong candidate would say it. |
| `status` | enum RoleQuestionStatus | no |  | `draft` |  |  |
| `source` | String | yes |  |  |  | Where the content came from (a blueprint, a source note); optional. |
| `created_by_user_id` | String | yes | `Uuid` |  |  |  |
| `reviewed_by_user_id` | String | yes | `Uuid` |  |  |  |
| `reviewed_at` | DateTime | yes | `Timestamptz(6)` |  |  |  |
| `created_at` | DateTime | no | `Timestamptz(6)` | `now()` |  |  |
| `updated_at` | DateTime | no | `Timestamptz(6)` |  |  |  |

## Relationships

| Field | Target model → table | Cardinality | Definition |
|---|---|---|---|
| `role` | `AssessmentRole` → `assessment_roles` | one | `@relation(fields: [roleId], references: [id], onDelete: Cascade)` |
| `organisation` | `Organisation` → `organisations` | optional one | `@relation(fields: [organisationId], references: [id], onDelete: Restrict)` |
| `createdBy` | `User` → `users` | optional one | `@relation("role_question_created_by", fields: [createdByUserId], references: [id], onDelete: Restrict)` |
| `reviewedBy` | `User` → `users` | optional one | `@relation("role_question_reviewed_by", fields: [reviewedByUserId], references: [id], onDelete: Restrict)` |
| `options` | `RoleQuestionOption` → `role_question_options` | many |  |

## Indexes and constraints

```
@@index([roleId, status])
@@index([organisationId, roleId, status])
```

## Change history

- 2026-10-02 — file generated from the schema by CR-2026-10-02-2045. Re-generate or edit when the schema changes (a schema change is a RED gate).
