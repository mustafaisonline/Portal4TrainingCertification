# table — knowledge_check_attempts

| Field | Value |
|---|---|
| Category | technical |
| Kind | table |
| Source of truth | `prisma/schema.prisma` (model `KnowledgeCheckAttempt`) and `prisma/migrations/` |
| Owner | founder |
| Version / date | generated from the schema 2026-10-02 |
| Status | approved (in production schema) |
| Related | CLAUDE.md Rule 1 (data model is a RED gate) |

## Purpose
The free Knowledge Check — Milestone 14 Phase 4 (§4 row 4 approved 2026-09-27; DR-03 §2.4, §3). One row per attempt by a signed-in account holder: the questions served (ids, in order), the answers so far, and — once finished — the score, pass (≥ 70 %), the holder's name at that moment and a public ID that /verify resolves. NOT a credential (DR-01).

## Columns

| Column | Type | Nullable | DB type | Default | Keys | Note |
|---|---|---|---|---|---|---|
| `id` | String | no | `Uuid` | `dbgenerated("gen_random_uuid()")` | PK |  |
| `user_id` | String | no | `Uuid` |  |  |  |
| `size` | Int | no |  |  |  | 50, 100 or 200. |
| `question_ids` | Json | no |  |  |  | string[] — reviewed question ids in the order served. |
| `answers` | Json | no |  | `"{}"` |  | { [questionId]: optionPosition } — saved page by page. |
| `score` | Int | yes |  |  |  |  |
| `passed` | Boolean | yes |  |  |  |  |
| `public_id` | String | yes |  |  | unique | KC-YYYY-XXXX-XXXX, set when finished; what /verify resolves. |
| `holder_name` | String | yes |  |  |  | The profile's legal name when finished, as the result shows it. |
| `started_at` | DateTime | no | `Timestamptz(6)` | `now()` |  |  |
| `finished_at` | DateTime | yes | `Timestamptz(6)` |  |  |  |
| `revoked_at` | DateTime | yes | `Timestamptz(6)` |  |  | Milestone 15 (Q3, approved 2026-09-29): a passed check's certificate can be revoked, mirroring `certificates`. Time taken, percentage, issue date, certificate ID/type and expiry are DERIVED (finished_at − started_at, score/size, finished_at, public_id, finished_at + 12 months) — deliberately not stored, so they cannot drift. |
| `revoked_by_user_id` | String | yes | `Uuid` |  |  |  |
| `revocation_reason` | String | yes |  |  |  |  |
| `created_at` | DateTime | no | `Timestamptz(6)` | `now()` |  |  |
| `updated_at` | DateTime | no | `Timestamptz(6)` |  |  |  |

## Relationships

| Field | Target model → table | Cardinality | Definition |
|---|---|---|---|
| `user` | `User` → `users` | one | `@relation(fields: [userId], references: [id], onDelete: Restrict)` |
| `revokedByUser` | `User` → `users` | optional one | `@relation("kc_revoked_by", fields: [revokedByUserId], references: [id], onDelete: Restrict)` |
| `unlockOrders` | `Order` → `orders` | many |  |

## Indexes and constraints

```
@@index([userId, startedAt])
```

## Change history

- 2026-10-02 — file generated from the schema by CR-2026-10-02-2045. Re-generate or edit when the schema changes (a schema change is a RED gate).
