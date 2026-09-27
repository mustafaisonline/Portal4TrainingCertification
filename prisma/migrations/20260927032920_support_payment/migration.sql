-- "Support the Academy" one-off payment (founder decisions M1–M5, 2026-09-27; PROJECT_STATUS §3 item 13).
-- Additive and forward-only: a new order kind, two columns relaxed to NULL
-- (only a support order leaves them empty), and an insert-only settings table
-- that carries the kill switch, amount, currency and label.

-- AlterEnum
ALTER TYPE "order_kind" ADD VALUE 'support';

-- AlterTable
ALTER TABLE "orders" ALTER COLUMN "offering_id" DROP NOT NULL,
ALTER COLUMN "programme_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "support_payment_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "amount_minor" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "label" TEXT NOT NULL,
    "effective_from" TIMESTAMPTZ(6) NOT NULL,
    "created_by_user_id" UUID,
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_payment_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "support_payment_settings_effective_from_idx" ON "support_payment_settings"("effective_from");
