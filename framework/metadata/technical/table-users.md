# table — users

| Field | Value |
|---|---|
| Category | technical |
| Kind | table |
| Source of truth | `prisma/schema.prisma` (model `User`) and `prisma/migrations/` |
| Owner | founder |
| Version / date | generated from the schema 2026-10-02 |
| Status | approved (in production schema) |
| Related | CLAUDE.md Rule 1 (data model is a RED gate) |

## Purpose
THE business identity. One person, one account. Immutable UUID that every future business table references (ADR-020, AP-04; DECISION_B §B).

## Columns

| Column | Type | Nullable | DB type | Default | Keys | Note |
|---|---|---|---|---|---|---|
| `id` | String | no | `Uuid` | `dbgenerated("gen_random_uuid()")` | PK |  |
| `email` | String | no |  |  | unique | Stored lower-cased by the identity service. |
| `name` | String | no |  |  |  |  |
| `country` | String | yes |  |  |  |  |
| `email_verified_at` | DateTime | yes | `Timestamptz(6)` |  |  |  |
| `created_at` | DateTime | no | `Timestamptz(6)` | `now()` |  |  |
| `updated_at` | DateTime | no | `Timestamptz(6)` |  |  |  |

## Relationships

| Field | Target model → table | Cardinality | Definition |
|---|---|---|---|
| `identities` | `AuthIdentity` → `auth_identities` | many |  |
| `roles` | `UserRole` → `user_roles` | many |  |
| `consents` | `Consent` → `consents` | many |  |
| `orders` | `Order` → `orders` | many |  |
| `registrations` | `Registration` → `registrations` | many |  |
| `profile` | `UserProfile` → `user_profiles` | optional one |  |
| `reviews` | `Review` → `reviews` | many |  |
| `certificates` | `Certificate` → `certificates` | many |  |
| `attendanceRecorded` | `AttendanceRecord` → `attendance_records` | many | `@relation("attendance_recorded_by")` |
| `topicQuestionsReviewed` | `TopicQuestion` → `topic_questions` | many | `@relation("topic_question_reviewed_by")` |
| `knowledgeCheckAttempts` | `KnowledgeCheckAttempt` → `knowledge_check_attempts` | many |  |
| `knowledgeChecksRevoked` | `KnowledgeCheckAttempt` → `knowledge_check_attempts` | many | `@relation("kc_revoked_by")` |
| `couponsCreated` | `Coupon` → `coupons` | many | `@relation("coupon_created_by")` |
| `couponsRedeemed` | `Coupon` → `coupons` | many | `@relation("coupon_redeemed_by")` |
| `trainingInterests` | `TrainingInterest` → `training_interests` | many |  |
| `trainingInterestsNotified` | `TrainingInterest` → `training_interests` | many | `@relation("interest_notified_by")` |
| `roleQuestionsCreated` | `RoleQuestion` → `role_questions` | many | `@relation("role_question_created_by")` |
| `roleQuestionsReviewed` | `RoleQuestion` → `role_questions` | many | `@relation("role_question_reviewed_by")` |
| `roleTestAttempts` | `RoleTestAttempt` → `role_test_attempts` | many |  |

## Change history

- 2026-10-02 — file generated from the schema by CR-2026-10-02-2045. Re-generate or edit when the schema changes (a schema change is a RED gate).
