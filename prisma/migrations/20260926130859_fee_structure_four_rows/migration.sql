-- Milestone 12 WP1 — the four-row fee structure (founder 2026-09-26, L4):
--   Malaysia via HRD Corp · Malaysia not via HRD Corp · Pakistan · Rest of the world
-- Additive and forward-only (ADR-029). Nothing is dropped, renamed or retyped.

-- AlterEnum: the fourth fee row. PostgreSQL forbids USING a new enum value in
-- the same transaction that adds it, so no row is written with it here — the
-- seed (initial import) and the admin Fees screen (WP2) create those rows.
ALTER TYPE "price_region" ADD VALUE 'malaysia_hrdcorp';

-- AlterTable: "minimum N participants" and the per-region note become
-- columns. Until now both lived in programmes.content->'regionalPricing'
-- (presentation JSON, added 2026-09-26) — a place only a developer could edit.
ALTER TABLE "programme_prices" ADD COLUMN     "min_participants" INTEGER,
ADD COLUMN     "note" TEXT;

-- Back-fill the notes from the JSON they came from, for the rows that exist.
UPDATE "programme_prices" pp
SET "note" = p."content" -> 'regionalPricing' -> pp."region"::text ->> 'note'
FROM "programmes" p
WHERE p."id" = pp."programme_id"
  AND p."content" -> 'regionalPricing' -> pp."region"::text ->> 'note' IS NOT NULL;

-- Malaysia's "minimum 25 participants" was carried on its display options
-- (the only region that had any); the checkout row's minimum is the same.
UPDATE "programme_prices" pp
SET "min_participants" = (
  SELECT (o ->> 'minParticipants')::int
  FROM jsonb_array_elements(p."content" -> 'regionalPricing' -> 'malaysia' -> 'options') o
  WHERE o ->> 'label' = 'Without HRD Corp'
  LIMIT 1
)
FROM "programmes" p
WHERE p."id" = pp."programme_id"
  AND pp."region" = 'malaysia'
  AND jsonb_typeof(p."content" -> 'regionalPricing' -> 'malaysia' -> 'options') = 'array';

-- The presentation JSON is retired: nothing reads it after this migration.
UPDATE "programmes"
SET "content" = "content" - 'regionalPricing'
WHERE "content" ? 'regionalPricing';
