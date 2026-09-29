-- AlterTable
ALTER TABLE "certificates" ADD COLUMN     "trainer_name" TEXT,
ADD COLUMN     "training_duration_label" TEXT;

-- AlterTable
ALTER TABLE "knowledge_check_attempts" ADD COLUMN     "revocation_reason" TEXT,
ADD COLUMN     "revoked_at" TIMESTAMPTZ(6),
ADD COLUMN     "revoked_by_user_id" UUID;

-- AddForeignKey
ALTER TABLE "knowledge_check_attempts" ADD CONSTRAINT "knowledge_check_attempts_revoked_by_user_id_fkey" FOREIGN KEY ("revoked_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Milestone 15 (Q3, approved by the founder 2026-09-29) — DATA BACKFILL, not seed
-- data: the two new snapshot columns are filled ONCE for certificates that
-- already exist, from their programme as it stands now, so a certificate issued
-- before this migration verifies with a duration and trainer(s) too. Additive
-- and non-destructive: only NULL values are written, nothing is overwritten,
-- and running it twice changes nothing. Certificates issued from here on take
-- their own snapshot at issue (issuance.service.ts).
UPDATE "certificates" AS c
SET "training_duration_label" = p."duration_label"
FROM "programmes" AS p
WHERE p."id" = c."programme_id"
  AND c."training_duration_label" IS NULL;

UPDATE "certificates" AS c
SET "trainer_name" = t."names"
FROM (
  SELECT pe."programme_id",
         string_agg(e."name", ', ' ORDER BY (pe."role" = 'lead') DESC, e."name") AS "names"
  FROM "programme_experts" AS pe
  JOIN "experts" AS e ON e."id" = pe."expert_id"
  GROUP BY pe."programme_id"
) AS t
WHERE t."programme_id" = c."programme_id"
  AND c."trainer_name" IS NULL;
