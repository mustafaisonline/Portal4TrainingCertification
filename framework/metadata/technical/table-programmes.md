# table — programmes

| Field | Value |
|---|---|
| Category | technical |
| Kind | table |
| Source of truth | `prisma/schema.prisma` (model `Programme`) and `prisma/migrations/` |
| Owner | founder |
| Version / date | generated from the schema 2026-10-02 |
| Status | approved (in production schema) |
| Related | CLAUDE.md Rule 1 (data model is a RED gate) |

## Purpose
A designed, expert-led learning experience — the thing a person chooses.

## Columns

| Column | Type | Nullable | DB type | Default | Keys | Note |
|---|---|---|---|---|---|---|
| `id` | String | no | `Uuid` | `dbgenerated("gen_random_uuid()")` | PK |  |
| `domain_id` | String | no | `Uuid` |  |  |  |
| `slug` | String | no |  |  | unique |  |
| `title` | String | no |  |  |  |  |
| `subtitle` | String | no |  |  |  |  |
| `level` | enum ProgrammeLevel | no |  |  |  |  |
| `status` | enum ProgrammeStatus | no |  | `unlisted` |  |  |
| `flagship` | Boolean | no |  | `false` |  |  |
| `duration_label` | String | no |  |  |  |  |
| `prerequisites` | String | no |  |  |  |  |
| `formats` | Json | no |  |  |  | Delivery labels as published (e.g. "Live online", "Face-to-face"). |
| `certificate_label` | String | no |  |  |  |  |
| `audience_summary` | String | no |  |  |  |  |
| `summary` | String | no |  |  |  |  |
| `value_proposition` | String | no |  |  |  |  |
| `photo` | Bytes | yes |  |  |  | Training photo (founder, 2026-09-28): browser-resized landscape image, same interim-storage pattern as the participant avatar (ADR-008) — bytes in Postgres, no object storage. Nullable/additive; the reserved illustration placeholder shows while none is uploaded. |
| `photo_mime` | String | yes |  |  |  |  |
| `photo_updated_at` | DateTime | yes | `Timestamptz(6)` |  |  |  |
| `content` | Json | no |  |  |  | Editorial sections: highlights, whoShouldAttend, rationale, outcomes, outcomeGroups, included, pedagogy, benefits, careerPaths, methodology, valueStack, valueStackTotal, related, externalResources, mentorshipPackages. |
| `sort_order` | Int | no |  | `0` |  |  |
| `version` | Int | no |  | `1` |  |  |
| `created_at` | DateTime | no | `Timestamptz(6)` | `now()` |  |  |
| `updated_at` | DateTime | no | `Timestamptz(6)` |  |  |  |

## Relationships

| Field | Target model → table | Cardinality | Definition |
|---|---|---|---|
| `domain` | `Domain` → `domains` | one | `@relation(fields: [domainId], references: [id], onDelete: Restrict)` |
| `modules` | `ProgrammeModule` → `programme_modules` | many |  |
| `formatsDelivery` | `DeliveryFormat` → `delivery_formats` | many |  |
| `prices` | `ProgrammePrice` → `programme_prices` | many |  |
| `experts` | `ProgrammeExpert` → `programme_experts` | many |  |
| `offerings` | `ScheduledOffering` → `scheduled_offerings` | many |  |
| `enquiries` | `Enquiry` → `enquiries` | many |  |
| `orders` | `Order` → `orders` | many |  |
| `reviews` | `Review` → `reviews` | many |  |
| `certificates` | `Certificate` → `certificates` | many |  |
| `coupons` | `Coupon` → `coupons` | many |  |
| `interests` | `TrainingInterest` → `training_interests` | many |  |

## Indexes and constraints

```
@@index([domainId])
@@index([status, sortOrder])
```

## Change history

- 2026-10-02 — file generated from the schema by CR-2026-10-02-2045. Re-generate or edit when the schema changes (a schema change is a RED gate).
