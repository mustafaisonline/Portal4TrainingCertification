# table — programme_prices

| Field | Value |
|---|---|
| Category | technical |
| Kind | table |
| Source of truth | `prisma/schema.prisma` (model `ProgrammePrice`) and `prisma/migrations/` |
| Owner | founder |
| Version / date | generated from the schema 2026-10-02 |
| Status | approved (in production schema) |
| Related | CLAUDE.md Rule 1 (data model is a RED gate) |

## Purpose
Published regional prices — data, never constants. Amounts in minor units.

## Columns

| Column | Type | Nullable | DB type | Default | Keys | Note |
|---|---|---|---|---|---|---|
| `id` | String | no | `Uuid` | `dbgenerated("gen_random_uuid()")` | PK |  |
| `programme_id` | String | no | `Uuid` |  |  |  |
| `region` | enum PriceRegion | no |  |  |  |  |
| `currency` | String | no | `Char(3)` |  |  |  |
| `list_amount_minor` | BigInt | no |  |  |  |  |
| `offer_amount_minor` | BigInt | no |  |  |  |  |
| `offer_label` | String | no |  |  |  |  |
| `offer_name` | String | no |  |  |  |  |
| `valid_from` | DateTime | yes | `Timestamptz(6)` |  |  |  |
| `valid_to` | DateTime | yes | `Timestamptz(6)` |  |  |  |
| `min_participants` | Int | yes |  |  |  | "Minimum 25 participants" — data, not presentation JSON (M12 L4). |
| `note` | String | yes |  |  |  | Region note shown under the figure ("no online option in Malaysia"). |

## Relationships

| Field | Target model → table | Cardinality | Definition |
|---|---|---|---|
| `programme` | `Programme` → `programmes` | one | `@relation(fields: [programmeId], references: [id], onDelete: Cascade)` |

## Indexes and constraints

```
@@unique([programmeId, region])
```

## Change history

- 2026-10-02 — file generated from the schema by CR-2026-10-02-2045. Re-generate or edit when the schema changes (a schema change is a RED gate).
