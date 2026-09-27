-- Knowledge Check unlock (Milestone 14 Phase 5; §4 row 5 approved 2026-09-27).
-- Additive and forward-only: the order kind knowledge_check_unlock, an insert-only
-- settings table (amount, currency, switch), and ONE nullable column on orders —
-- knowledge_check_attempt_id — so an unlock order names the attempt it pays for
-- (the same pattern as certificate_id for renewals). Reversal: drop the column,
-- the table; the enum value stays unused.

-- AlterEnum
ALTER TYPE "order_kind" ADD VALUE 'knowledge_check_unlock';

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "knowledge_check_attempt_id" UUID;

-- CreateTable
CREATE TABLE "knowledge_check_unlock_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "amount_minor" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "label" TEXT NOT NULL,
    "effective_from" TIMESTAMPTZ(6) NOT NULL,
    "created_by_user_id" UUID,
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_check_unlock_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "knowledge_check_unlock_settings_effective_from_idx" ON "knowledge_check_unlock_settings"("effective_from");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_knowledge_check_attempt_id_fkey" FOREIGN KEY ("knowledge_check_attempt_id") REFERENCES "knowledge_check_attempts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
