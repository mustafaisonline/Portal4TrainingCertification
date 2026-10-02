# table — attendance_records

| Field | Value |
|---|---|
| Category | technical |
| Kind | table |
| Source of truth | `prisma/schema.prisma` (model `AttendanceRecord`) and `prisma/migrations/` |
| Owner | founder |
| Version / date | generated from the schema 2026-10-02 |
| Status | approved (in production schema) |
| Related | CLAUDE.md Rule 1 (data model is a RED gate) |

## Purpose
Attendance as recorded by an administrator or the training's Trainer on the day (Milestone 13, founder decision 9 / §4 approved 2026-09-27). One row per registration holding the CURRENT answer; every save is audited (`attendance.recorded`), so the history lives in the audit log. Separate from completion (certificates): attendance is a fact about the day, completion is the Academy's decision to certify (N6 links them).

## Columns

| Column | Type | Nullable | DB type | Default | Keys | Note |
|---|---|---|---|---|---|---|
| `id` | String | no | `Uuid` | `dbgenerated("gen_random_uuid()")` | PK |  |
| `registration_id` | String | no | `Uuid` |  | unique |  |
| `attended` | Boolean | no |  |  |  | The founder's Yes / No. |
| `note` | String | yes |  |  |  | Optional, e.g. "arrived late", "left after lunch". |
| `recorded_by_user_id` | String | no | `Uuid` |  |  |  |
| `created_at` | DateTime | no | `Timestamptz(6)` | `now()` |  |  |
| `updated_at` | DateTime | no | `Timestamptz(6)` |  |  | The founder's "UpdateDate": set on every save. |

## Relationships

| Field | Target model → table | Cardinality | Definition |
|---|---|---|---|
| `registration` | `Registration` → `registrations` | one | `@relation(fields: [registrationId], references: [id], onDelete: Restrict)` |
| `recordedBy` | `User` → `users` | one | `@relation("attendance_recorded_by", fields: [recordedByUserId], references: [id], onDelete: Restrict)` |

## Change history

- 2026-10-02 — file generated from the schema by CR-2026-10-02-2045. Re-generate or edit when the schema changes (a schema change is a RED gate).
