# table — organisations

| Field | Value |
|---|---|
| Category | technical |
| Kind | table |
| Source of truth | `prisma/schema.prisma` (model `Organisation`) and `prisma/migrations/` |
| Owner | founder |
| Version / date | generated from the schema 2026-10-02 |
| Status | approved (in production schema) |
| Related | CLAUDE.md Rule 1 (data model is a RED gate) |

## Purpose
A registered organisation that screens candidates (a company or an education-sector body). Created by an administrator; listed publicly only when `published` and it offers at least one listed role.

## Columns

| Column | Type | Nullable | DB type | Default | Keys | Note |
|---|---|---|---|---|---|---|
| `id` | String | no | `Uuid` | `dbgenerated("gen_random_uuid()")` | PK |  |
| `slug` | String | no |  |  | unique |  |
| `name` | String | no |  |  |  |  |
| `type` | enum OrganisationType | no |  |  |  |  |
| `logo_path` | String | yes |  |  |  | A public path of a logo image, when supplied; never a user upload. |
| `contact_email` | String | no |  |  |  |  |
| `published` | Boolean | no |  | `false` |  |  |
| `created_at` | DateTime | no | `Timestamptz(6)` | `now()` |  |  |
| `updated_at` | DateTime | no | `Timestamptz(6)` |  |  |  |

## Relationships

| Field | Target model → table | Cardinality | Definition |
|---|---|---|---|
| `privateRoles` | `AssessmentRole` → `assessment_roles` | many |  |
| `offeredRoles` | `OrganisationRole` → `organisation_roles` | many |  |
| `questions` | `RoleQuestion` → `role_questions` | many |  |
| `attempts` | `RoleTestAttempt` → `role_test_attempts` | many |  |

## Change history

- 2026-10-02 — file generated from the schema by CR-2026-10-02-2045. Re-generate or edit when the schema changes (a schema change is a RED gate).
