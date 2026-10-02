# table — reviews

| Field | Value |
|---|---|
| Category | technical |
| Kind | table |
| Source of truth | `prisma/schema.prisma` (model `Review`) and `prisma/migrations/` |
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
| `user_id` | String | no | `Uuid` |  |  |  |
| `registration_id` | String | yes | `Uuid` |  | unique | Null only for `kind = diagnostic`. Unique: one review per registration. |
| `programme_id` | String | no | `Uuid` |  |  |  |
| `offering_id` | String | yes | `Uuid` |  |  |  |
| `kind` | enum ReviewKind | no |  |  |  |  |
| `body` | String | no |  |  |  | Plain text, 20–2000 chars; rendered as text, never as HTML. |
| `rating` | Int | yes | `SmallInt` |  |  |  |
| `category` | enum ReviewCategory | yes |  |  |  |  |
| `consent_public` | Boolean | no |  | `false` |  |  |
| `consent_photo` | Boolean | no |  | `false` |  |  |
| `moderation_status` | enum ReviewModeration | no |  | `pending` |  |  |
| `visibility_status` | enum ReviewVisibility | no |  | `visible` |  |  |
| `moderated_by_user_id` | String | yes | `Uuid` |  |  |  |
| `moderated_at` | DateTime | yes | `Timestamptz(6)` |  |  |  |
| `moderation_note` | String | yes |  |  |  |  |
| `display_name_snapshot` | String | no |  |  |  | The name shown publicly, captured at submission (a later profile change never silently alters a published review). |
| `submitted_at` | DateTime | no | `Timestamptz(6)` | `now()` |  |  |
| `edited_at` | DateTime | yes | `Timestamptz(6)` |  |  |  |
| `created_at` | DateTime | no | `Timestamptz(6)` | `now()` |  |  |
| `updated_at` | DateTime | no | `Timestamptz(6)` |  |  |  |

## Relationships

| Field | Target model → table | Cardinality | Definition |
|---|---|---|---|
| `user` | `User` → `users` | one | `@relation(fields: [userId], references: [id], onDelete: Restrict)` |
| `registration` | `Registration` → `registrations` | optional one | `@relation(fields: [registrationId], references: [id], onDelete: Restrict)` |
| `programme` | `Programme` → `programmes` | one | `@relation(fields: [programmeId], references: [id], onDelete: Restrict)` |
| `offering` | `ScheduledOffering` → `scheduled_offerings` | optional one | `@relation(fields: [offeringId], references: [id], onDelete: Restrict)` |

## Indexes and constraints

```
@@index([moderationStatus, visibilityStatus, consentPublic, submittedAt])
@@index([userId])
@@index([programmeId, submittedAt])
```

## Change history

- 2026-10-02 — file generated from the schema by CR-2026-10-02-2045. Re-generate or edit when the schema changes (a schema change is a RED gate).
