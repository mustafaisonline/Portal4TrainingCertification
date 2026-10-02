# table — certificate_renewals

| Field | Value |
|---|---|
| Category | technical |
| Kind | table |
| Source of truth | `prisma/schema.prisma` (model `CertificateRenewal`) and `prisma/migrations/` |
| Owner | founder |
| Version / date | generated from the schema 2026-10-02 |
| Status | approved (in production schema) |
| Related | CLAUDE.md Rule 1 (data model is a RED gate) |

## Purpose
Insert-only (ADR-022). Written ONLY by the paid-webhook transaction; the certificate's `expires_on` moves in the same transaction (C3/C4).

## Columns

| Column | Type | Nullable | DB type | Default | Keys | Note |
|---|---|---|---|---|---|---|
| `id` | String | no | `Uuid` | `dbgenerated("gen_random_uuid()")` | PK |  |
| `certificate_id` | String | no | `Uuid` |  |  |  |
| `order_id` | String | no | `Uuid` |  | unique |  |
| `fee_setting_id` | String | no | `Uuid` |  |  |  |
| `previous_expires_on` | DateTime | no | `Date` |  |  |  |
| `new_expires_on` | DateTime | no | `Date` |  |  |  |
| `amount_minor` | BigInt | no |  |  |  |  |
| `currency` | String | no | `Char(3)` |  |  |  |
| `created_at` | DateTime | no | `Timestamptz(6)` | `now()` |  |  |

## Relationships

| Field | Target model → table | Cardinality | Definition |
|---|---|---|---|
| `certificate` | `Certificate` → `certificates` | one | `@relation(fields: [certificateId], references: [id], onDelete: Restrict)` |
| `order` | `Order` → `orders` | one | `@relation(fields: [orderId], references: [id], onDelete: Restrict)` |
| `feeSetting` | `CertificateFeeSetting` → `certificate_fee_settings` | one | `@relation(fields: [feeSettingId], references: [id], onDelete: Restrict)` |

## Indexes and constraints

```
@@index([certificateId, createdAt])
```

## Change history

- 2026-10-02 — file generated from the schema by CR-2026-10-02-2045. Re-generate or edit when the schema changes (a schema change is a RED gate).
