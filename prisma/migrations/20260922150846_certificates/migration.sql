-- CreateEnum
CREATE TYPE "order_kind" AS ENUM ('registration', 'certificate_renewal');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "certificate_id" UUID,
ADD COLUMN     "kind" "order_kind" NOT NULL DEFAULT 'registration';

-- CreateTable
CREATE TABLE "certificates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "certificate_id" TEXT NOT NULL,
    "registration_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "programme_id" UUID NOT NULL,
    "offering_id" UUID NOT NULL,
    "holder_name" TEXT NOT NULL,
    "holder_name_search" TEXT NOT NULL,
    "programme_title" TEXT NOT NULL,
    "format_name" TEXT NOT NULL,
    "completed_on" DATE NOT NULL,
    "issued_on" DATE NOT NULL,
    "expires_on" DATE NOT NULL,
    "listed" BOOLEAN NOT NULL DEFAULT false,
    "listed_changed_at" TIMESTAMPTZ(6),
    "revoked_at" TIMESTAMPTZ(6),
    "revoked_by_user_id" UUID,
    "revocation_reason" TEXT,
    "issued_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificate_fee_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "amount_minor" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "effective_from" TIMESTAMPTZ(6) NOT NULL,
    "created_by_user_id" UUID,
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "certificate_fee_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificate_renewals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "certificate_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "fee_setting_id" UUID NOT NULL,
    "previous_expires_on" DATE NOT NULL,
    "new_expires_on" DATE NOT NULL,
    "amount_minor" BIGINT NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "certificate_renewals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "certificates_certificate_id_key" ON "certificates"("certificate_id");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_registration_id_key" ON "certificates"("registration_id");

-- CreateIndex
CREATE INDEX "certificates_user_id_idx" ON "certificates"("user_id");

-- CreateIndex
CREATE INDEX "certificates_listed_holder_name_search_idx" ON "certificates"("listed", "holder_name_search");

-- CreateIndex
CREATE INDEX "certificates_expires_on_idx" ON "certificates"("expires_on");

-- CreateIndex
CREATE INDEX "certificate_fee_settings_effective_from_idx" ON "certificate_fee_settings"("effective_from");

-- CreateIndex
CREATE UNIQUE INDEX "certificate_renewals_order_id_key" ON "certificate_renewals"("order_id");

-- CreateIndex
CREATE INDEX "certificate_renewals_certificate_id_created_at_idx" ON "certificate_renewals"("certificate_id", "created_at");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_certificate_id_fkey" FOREIGN KEY ("certificate_id") REFERENCES "certificates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "registrations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_programme_id_fkey" FOREIGN KEY ("programme_id") REFERENCES "programmes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_offering_id_fkey" FOREIGN KEY ("offering_id") REFERENCES "scheduled_offerings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificate_renewals" ADD CONSTRAINT "certificate_renewals_certificate_id_fkey" FOREIGN KEY ("certificate_id") REFERENCES "certificates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificate_renewals" ADD CONSTRAINT "certificate_renewals_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificate_renewals" ADD CONSTRAINT "certificate_renewals_fee_setting_id_fkey" FOREIGN KEY ("fee_setting_id") REFERENCES "certificate_fee_settings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
