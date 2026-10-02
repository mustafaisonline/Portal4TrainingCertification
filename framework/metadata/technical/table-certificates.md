# table — certificates

| Field | Value |
|---|---|
| Category | technical |
| Kind | table |
| Source of truth | `prisma/schema.prisma` (model `Certificate`) and `prisma/migrations/` |
| Owner | founder |
| Version / date | generated from the schema 2026-10-02 |
| Status | approved (in production schema) |
| Related | CLAUDE.md Rule 1 (data model is a RED gate) |

## Purpose
One per completed registration. Issued in the same transaction as the administrator's completion record (E2); the ID is never reused (R-D3).

## Columns

| Column | Type | Nullable | DB type | Default | Keys | Note |
|---|---|---|---|---|---|---|
| `id` | String | no | `Uuid` | `dbgenerated("gen_random_uuid()")` | PK |  |
| `certificate_id` | String | no |  |  | unique | Human-readable `DAA-YYYY-XXXX-XXXX`, 31-symbol alphabet, server-generated from a cryptographic source; uniqueness enforced here, not by hope. |
| `registration_id` | String | no | `Uuid` |  | unique |  |
| `user_id` | String | no | `Uuid` |  |  |  |
| `programme_id` | String | no | `Uuid` |  |  |  |
| `offering_id` | String | no | `Uuid` |  |  |  |
| `holder_name` | String | no |  |  |  | Snapshots: a later profile or catalogue edit must never rewrite a printed certificate. `holder_name` is correctable by an administrator only (E8). |
| `holder_name_search` | String | no |  |  |  | Lower-cased, accent-stripped copy of `holder_name` for word-prefix search. |
| `programme_title` | String | no |  |  |  |  |
| `format_name` | String | no |  |  |  |  |
| `training_duration_label` | String | yes |  |  |  | Milestone 15 (Q3, approved 2026-09-29): snapshots taken at issue so a later catalogue edit never rewrites a printed certificate. Null only for a row with no linked trainer / no duration to snapshot; existing rows were backfilled from their programme by the migration. |
| `trainer_name` | String | yes |  |  |  | All linked trainers, lead first, comma-separated. |
| `completed_on` | DateTime | no | `Date` |  |  |  |
| `issued_on` | DateTime | no | `Date` |  |  |  |
| `expires_on` | DateTime | no | `Date` |  |  | Last day the certificate is active (inclusive), MYT calendar date. |
| `listed` | Boolean | no |  | `false` |  | Opt-in to public NAME search (E3). ID lookup works regardless. |
| `listed_changed_at` | DateTime | yes | `Timestamptz(6)` |  |  |  |
| `revoked_at` | DateTime | yes | `Timestamptz(6)` |  |  |  |
| `revoked_by_user_id` | String | yes | `Uuid` |  |  |  |
| `revocation_reason` | String | yes |  |  |  |  |
| `issued_by_user_id` | String | no | `Uuid` |  |  |  |
| `created_at` | DateTime | no | `Timestamptz(6)` | `now()` |  |  |
| `updated_at` | DateTime | no | `Timestamptz(6)` |  |  |  |

## Relationships

| Field | Target model → table | Cardinality | Definition |
|---|---|---|---|
| `registration` | `Registration` → `registrations` | one | `@relation(fields: [registrationId], references: [id], onDelete: Restrict)` |
| `user` | `User` → `users` | one | `@relation(fields: [userId], references: [id], onDelete: Restrict)` |
| `programme` | `Programme` → `programmes` | one | `@relation(fields: [programmeId], references: [id], onDelete: Restrict)` |
| `offering` | `ScheduledOffering` → `scheduled_offerings` | one | `@relation(fields: [offeringId], references: [id], onDelete: Restrict)` |
| `renewals` | `CertificateRenewal` → `certificate_renewals` | many |  |
| `orders` | `Order` → `orders` | many |  |

## Indexes and constraints

```
@@index([userId])
@@index([listed, holderNameSearch])
@@index([expiresOn])
```

## Change history

- 2026-10-02 — file generated from the schema by CR-2026-10-02-2045. Re-generate or edit when the schema changes (a schema change is a RED gate).
