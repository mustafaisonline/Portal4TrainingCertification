-- CreateEnum
CREATE TYPE "review_kind" AS ENUM ('registration', 'diagnostic');

-- CreateEnum
CREATE TYPE "review_category" AS ENUM ('programme_experience', 'course_content', 'certification_process', 'user_experience', 'technical_issue', 'other');

-- CreateEnum
CREATE TYPE "review_moderation" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "review_visibility" AS ENUM ('visible', 'hidden');

-- CreateTable
CREATE TABLE "reviews" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "registration_id" UUID,
    "programme_id" UUID NOT NULL,
    "offering_id" UUID,
    "kind" "review_kind" NOT NULL,
    "body" TEXT NOT NULL,
    "rating" SMALLINT,
    "category" "review_category",
    "consent_public" BOOLEAN NOT NULL DEFAULT false,
    "consent_photo" BOOLEAN NOT NULL DEFAULT false,
    "moderation_status" "review_moderation" NOT NULL DEFAULT 'pending',
    "visibility_status" "review_visibility" NOT NULL DEFAULT 'visible',
    "moderated_by_user_id" UUID,
    "moderated_at" TIMESTAMPTZ(6),
    "moderation_note" TEXT,
    "display_name_snapshot" TEXT NOT NULL,
    "submitted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "edited_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reviews_registration_id_key" ON "reviews"("registration_id");

-- CreateIndex
CREATE INDEX "reviews_moderation_status_visibility_status_consent_public__idx" ON "reviews"("moderation_status", "visibility_status", "consent_public", "submitted_at");

-- CreateIndex
CREATE INDEX "reviews_user_id_idx" ON "reviews"("user_id");

-- CreateIndex
CREATE INDEX "reviews_programme_id_submitted_at_idx" ON "reviews"("programme_id", "submitted_at");

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "registrations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_programme_id_fkey" FOREIGN KEY ("programme_id") REFERENCES "programmes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_offering_id_fkey" FOREIGN KEY ("offering_id") REFERENCES "scheduled_offerings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
