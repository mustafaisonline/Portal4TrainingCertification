-- CreateEnum
CREATE TYPE "id_document_type" AS ENUM ('nric', 'passport');

-- CreateTable
CREATE TABLE "user_profiles" (
    "user_id" UUID NOT NULL,
    "legal_name" TEXT NOT NULL,
    "display_name" TEXT,
    "phone_e164" TEXT,
    "address_line1" TEXT,
    "address_line2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postal_code" TEXT,
    "country_code" CHAR(2),
    "timezone" TEXT,
    "organisation" TEXT,
    "job_title" TEXT,
    "industry" TEXT,
    "experience_band" TEXT,
    "linkedin_url" TEXT,
    "id_type" "id_document_type",
    "id_number_ciphertext" TEXT,
    "id_number_last4" TEXT,
    "nationality_code" CHAR(2),
    "date_of_birth" DATE,
    "marketing_consent_at" TIMESTAMPTZ(6),
    "heard_about" TEXT,
    "photo" BYTEA,
    "photo_mime" TEXT,
    "photo_updated_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("user_id")
);

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
