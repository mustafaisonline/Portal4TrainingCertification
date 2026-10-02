# table — experts

| Field | Value |
|---|---|
| Category | technical |
| Kind | table |
| Source of truth | `prisma/schema.prisma` (model `Expert`) and `prisma/migrations/` |
| Owner | founder |
| Version / date | generated from the schema 2026-10-02 |
| Status | approved (in production schema) |
| Related | CLAUDE.md Rule 1 (data model is a RED gate) |

## Purpose
The trainer / practitioner — a real role with a public profile (DR-02).

## Columns

| Column | Type | Nullable | DB type | Default | Keys | Note |
|---|---|---|---|---|---|---|
| `id` | String | no | `Uuid` | `dbgenerated("gen_random_uuid()")` | PK |  |
| `user_id` | String | yes | `Uuid` |  |  | Linked when the person registers; null until then. |
| `slug` | String | no |  |  | unique |  |
| `name` | String | no |  |  |  |  |
| `role_title` | String | no |  |  |  |  |
| `location` | String | no |  |  |  |  |
| `headline` | String | no |  |  |  |  |
| `experience_line` | String | no |  |  |  |  |
| `summary` | String | no |  |  |  |  |
| `photo_path` | String | no |  |  |  |  |
| `expertise` | Json | no |  |  |  |  |
| `profile` | Json | no |  |  |  | about, background, specialisations, careerAchievements, books, frameworks, frameworksUrl, podcast, communityImpact, socialLinks, technologies, certifications, education, linkedin, mediumProfile. |
| `hrd_corp_accreditation` | Json | yes |  |  |  |  |
| `published` | Boolean | no |  | `false` |  |  |
| `created_at` | DateTime | no | `Timestamptz(6)` | `now()` |  |  |
| `updated_at` | DateTime | no | `Timestamptz(6)` |  |  |  |

## Relationships

| Field | Target model → table | Cardinality | Definition |
|---|---|---|---|
| `programmes` | `ProgrammeExpert` → `programme_experts` | many |  |
| `leadOfferings` | `ScheduledOffering` → `scheduled_offerings` | many |  |

## Change history

- 2026-10-02 — file generated from the schema by CR-2026-10-02-2045. Re-generate or edit when the schema changes (a schema change is a RED gate).
