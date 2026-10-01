-- CreateEnum
CREATE TYPE "interest_status" AS ENUM ('pending', 'confirmed', 'expired');

-- AlterEnum
ALTER TYPE "order_kind" ADD VALUE 'interest';

-- CreateTable
CREATE TABLE "training_interests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "programme_id" UUID NOT NULL,
    "delivery_format_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "order_id" UUID,
    "email" TEXT NOT NULL,
    "full_name" TEXT,
    "mobile" TEXT,
    "date_of_birth" DATE,
    "consent" BOOLEAN NOT NULL,
    "status" "interest_status" NOT NULL DEFAULT 'pending',
    "fee_waived" BOOLEAN NOT NULL DEFAULT false,
    "confirmed_at" TIMESTAMPTZ(6),
    "notified_at" TIMESTAMPTZ(6),
    "notified_by_user_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "training_interests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interest_fee_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "amount_minor" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "label" TEXT NOT NULL,
    "effective_from" TIMESTAMPTZ(6) NOT NULL,
    "created_by_user_id" UUID,
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interest_fee_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "training_interests_order_id_key" ON "training_interests"("order_id");

-- CreateIndex
CREATE INDEX "training_interests_programme_id_status_idx" ON "training_interests"("programme_id", "status");

-- CreateIndex
CREATE INDEX "training_interests_delivery_format_id_status_idx" ON "training_interests"("delivery_format_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "training_interests_user_id_delivery_format_id_key" ON "training_interests"("user_id", "delivery_format_id");

-- CreateIndex
CREATE INDEX "interest_fee_settings_effective_from_idx" ON "interest_fee_settings"("effective_from");

-- AddForeignKey
ALTER TABLE "training_interests" ADD CONSTRAINT "training_interests_programme_id_fkey" FOREIGN KEY ("programme_id") REFERENCES "programmes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_interests" ADD CONSTRAINT "training_interests_delivery_format_id_fkey" FOREIGN KEY ("delivery_format_id") REFERENCES "delivery_formats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_interests" ADD CONSTRAINT "training_interests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_interests" ADD CONSTRAINT "training_interests_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_interests" ADD CONSTRAINT "training_interests_notified_by_user_id_fkey" FOREIGN KEY ("notified_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
