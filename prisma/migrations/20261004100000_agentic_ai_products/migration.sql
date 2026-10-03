-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "order_kind" ADD VALUE 'agentic_item';
ALTER TYPE "order_kind" ADD VALUE 'agentic_pack';
ALTER TYPE "order_kind" ADD VALUE 'access_pass';

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "product_sku" TEXT;

-- CreateTable
CREATE TABLE "agentic_ownerships" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "item_slug" TEXT NOT NULL,
    "via" TEXT NOT NULL,
    "order_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agentic_ownerships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agentic_credit_packs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "credits_total" INTEGER NOT NULL,
    "credits_used" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agentic_credit_packs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_passes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "plan" TEXT NOT NULL,
    "order_id" UUID NOT NULL,
    "starts_at" TIMESTAMPTZ(6) NOT NULL,
    "ends_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_passes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "agentic_ownerships_user_id_item_slug_key" ON "agentic_ownerships"("user_id", "item_slug");

-- CreateIndex
CREATE UNIQUE INDEX "agentic_credit_packs_order_id_key" ON "agentic_credit_packs"("order_id");

-- CreateIndex
CREATE INDEX "agentic_credit_packs_user_id_idx" ON "agentic_credit_packs"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "access_passes_order_id_key" ON "access_passes"("order_id");

-- CreateIndex
CREATE INDEX "access_passes_user_id_ends_at_idx" ON "access_passes"("user_id", "ends_at");

-- AddForeignKey
ALTER TABLE "agentic_ownerships" ADD CONSTRAINT "agentic_ownerships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agentic_ownerships" ADD CONSTRAINT "agentic_ownerships_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agentic_credit_packs" ADD CONSTRAINT "agentic_credit_packs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agentic_credit_packs" ADD CONSTRAINT "agentic_credit_packs_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_passes" ADD CONSTRAINT "access_passes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_passes" ADD CONSTRAINT "access_passes_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Integrity rules the code also keeps (CR-2026-10-04-0112): a credit pack can never be over-spent; a pass has a positive length.
ALTER TABLE "agentic_credit_packs" ADD CONSTRAINT "agentic_credit_packs_credits_check" CHECK ("credits_total" > 0 AND "credits_used" >= 0 AND "credits_used" <= "credits_total");
ALTER TABLE "access_passes" ADD CONSTRAINT "access_passes_period_check" CHECK ("ends_at" > "starts_at");
