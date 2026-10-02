# table — scheduled_offerings

| Field | Value |
|---|---|
| Category | technical |
| Kind | table |
| Source of truth | `prisma/schema.prisma` (model `ScheduledOffering`) and `prisma/migrations/` |
| Owner | founder |
| Version / date | generated from the schema 2026-10-02 |
| Status | approved (in production schema) |
| Related | CLAUDE.md Rule 1 (data model is a RED gate) |

## Purpose
A dated instance of a programme — the thing a person registers for. ZERO rows until a real date exists (DR-02 §4.1). Capacity is named, not enforced (ADR-043); the hold mechanism is M4's.

## Columns

| Column | Type | Nullable | DB type | Default | Keys | Note |
|---|---|---|---|---|---|---|
| `id` | String | no | `Uuid` | `dbgenerated("gen_random_uuid()")` | PK |  |
| `programme_id` | String | no | `Uuid` |  |  |  |
| `delivery_format_id` | String | yes | `Uuid` |  |  |  |
| `modality` | enum DeliveryModality | no |  |  |  |  |
| `location` | String | yes |  |  |  |  |
| `timezone` | String | no |  |  |  |  |
| `starts_on` | DateTime | no | `Date` |  |  |  |
| `ends_on` | DateTime | no | `Date` |  |  |  |
| `schedule_note` | String | yes |  |  |  |  |
| `capacity` | Int | yes |  |  |  |  |
| `status` | enum OfferingStatus | no |  | `planned` |  |  |
| `organisation_id` | String | yes | `Uuid` |  |  | Private-cohort scope. Plain UUID until `organisations` exists (M8). |
| `lead_expert_id` | String | yes | `Uuid` |  |  |  |
| `joining_details` | String | yes |  |  |  | ADR-044: the portal holds joining details; delivery is external. Participant-only (M5); never rendered publicly. |
| `created_at` | DateTime | no | `Timestamptz(6)` | `now()` |  |  |
| `updated_at` | DateTime | no | `Timestamptz(6)` |  |  |  |

## Relationships

| Field | Target model → table | Cardinality | Definition |
|---|---|---|---|
| `programme` | `Programme` → `programmes` | one | `@relation(fields: [programmeId], references: [id], onDelete: Restrict)` |
| `deliveryFormat` | `DeliveryFormat` → `delivery_formats` | optional one | `@relation(fields: [deliveryFormatId], references: [id], onDelete: Restrict)` |
| `leadExpert` | `Expert` → `experts` | optional one | `@relation(fields: [leadExpertId], references: [id], onDelete: Restrict)` |
| `orders` | `Order` → `orders` | many |  |
| `registrations` | `Registration` → `registrations` | many |  |
| `reviews` | `Review` → `reviews` | many |  |
| `certificates` | `Certificate` → `certificates` | many |  |

## Indexes and constraints

```
@@index([programmeId, status, startsOn])
```

## Change history

- 2026-10-02 — file generated from the schema by CR-2026-10-02-2045. Re-generate or edit when the schema changes (a schema change is a RED gate).
