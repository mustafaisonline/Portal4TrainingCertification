# table — user_profiles

| Field | Value |
|---|---|
| Category | technical |
| Kind | table |
| Source of truth | `prisma/schema.prisma` (model `UserProfile`) and `prisma/migrations/` |
| Owner | founder |
| Version / date | generated from the schema 2026-10-02 |
| Status | approved (in production schema) |
| Related | CLAUDE.md Rule 1 (data model is a RED gate) |

## Purpose
Not described in the schema's doc comment; see the milestone plan that introduced the table.

## Columns

| Column | Type | Nullable | DB type | Default | Keys | Note |
|---|---|---|---|---|---|---|
| `user_id` | String | no | `Uuid` |  | PK |  |
| `legal_name` | String | no |  |  |  | As on the identity document — printed on certificates. |
| `display_name` | String | yes |  |  |  |  |
| `phone_e164` | String | yes |  |  |  |  |
| `address_line1` | String | yes |  |  |  |  |
| `address_line2` | String | yes |  |  |  |  |
| `city` | String | yes |  |  |  |  |
| `state` | String | yes |  |  |  |  |
| `postal_code` | String | yes |  |  |  |  |
| `country_code` | String | yes | `Char(2)` |  |  |  |
| `timezone` | String | yes |  |  |  |  |
| `organisation` | String | yes |  |  |  |  |
| `job_title` | String | yes |  |  |  |  |
| `industry` | String | yes |  |  |  |  |
| `experience_band` | String | yes |  |  |  |  |
| `linkedin_url` | String | yes |  |  |  |  |
| `id_type` | enum IdDocumentType | yes |  |  |  |  |
| `id_number_ciphertext` | String | yes |  |  |  | AES-256-GCM, application-level (src/modules/identity/profile-crypto.ts). The clear number is never stored, logged or audited. |
| `id_number_last4` | String | yes |  |  |  |  |
| `nationality_code` | String | yes | `Char(2)` |  |  |  |
| `date_of_birth` | DateTime | yes | `Date` |  |  |  |
| `marketing_consent_at` | DateTime | yes | `Timestamptz(6)` |  |  |  |
| `heard_about` | String | yes |  |  |  |  |
| `photo` | Bytes | yes |  |  |  | Interim store for the avatar until object storage is decided (ADR-008): browser-resized, ≤ 300 KB. Served only through the session-gated route. |
| `photo_mime` | String | yes |  |  |  |  |
| `photo_updated_at` | DateTime | yes | `Timestamptz(6)` |  |  |  |
| `completed_at` | DateTime | yes | `Timestamptz(6)` |  |  | Set when every field required before a paid registration is present. |
| `created_at` | DateTime | no | `Timestamptz(6)` | `now()` |  |  |
| `updated_at` | DateTime | no | `Timestamptz(6)` |  |  |  |

## Relationships

| Field | Target model → table | Cardinality | Definition |
|---|---|---|---|
| `user` | `User` → `users` | one | `@relation(fields: [userId], references: [id], onDelete: Restrict)` |

## Change history

- 2026-10-02 — file generated from the schema by CR-2026-10-02-2045. Re-generate or edit when the schema changes (a schema change is a RED gate).
