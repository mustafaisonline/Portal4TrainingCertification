-- CreateEnum
CREATE TYPE "programme_level" AS ENUM ('foundation', 'practitioner', 'architect', 'executive', 'builder', 'mentorship');

-- CreateEnum
CREATE TYPE "programme_status" AS ENUM ('published', 'unlisted', 'retired');

-- CreateEnum
CREATE TYPE "price_region" AS ENUM ('malaysia', 'pakistan', 'international');

-- CreateEnum
CREATE TYPE "delivery_modality" AS ENUM ('live_online', 'face_to_face', 'corporate_private');

-- CreateEnum
CREATE TYPE "offering_status" AS ENUM ('planned', 'open', 'full', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "enquiry_kind" AS ENUM ('general', 'organisation', 'programme_interest');

-- CreateEnum
CREATE TYPE "enquiry_status" AS ENUM ('new', 'replied', 'closed');

-- CreateTable
CREATE TABLE "programmes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "domain_id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "level" "programme_level" NOT NULL,
    "status" "programme_status" NOT NULL DEFAULT 'unlisted',
    "flagship" BOOLEAN NOT NULL DEFAULT false,
    "duration_label" TEXT NOT NULL,
    "prerequisites" TEXT NOT NULL,
    "formats" JSONB NOT NULL,
    "certificate_label" TEXT NOT NULL,
    "audience_summary" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "value_proposition" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "programmes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programme_modules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "programme_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "points" JSONB,

    CONSTRAINT "programme_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_formats" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "programme_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "badge" TEXT,
    "duration_label" TEXT NOT NULL,
    "schedule_label" TEXT NOT NULL,
    "total_time_label" TEXT NOT NULL,
    "best_for" JSONB NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "delivery_formats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programme_prices" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "programme_id" UUID NOT NULL,
    "region" "price_region" NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "list_amount_minor" BIGINT NOT NULL,
    "offer_amount_minor" BIGINT NOT NULL,
    "offer_label" TEXT NOT NULL,
    "offer_name" TEXT NOT NULL,
    "valid_from" TIMESTAMPTZ(6),
    "valid_to" TIMESTAMPTZ(6),

    CONSTRAINT "programme_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role_title" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "experience_line" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "photo_path" TEXT NOT NULL,
    "expertise" JSONB NOT NULL,
    "profile" JSONB NOT NULL,
    "hrd_corp_accreditation" JSONB,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "experts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programme_experts" (
    "programme_id" UUID NOT NULL,
    "expert_id" UUID NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'lead',

    CONSTRAINT "programme_experts_pkey" PRIMARY KEY ("programme_id","expert_id")
);

-- CreateTable
CREATE TABLE "scheduled_offerings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "programme_id" UUID NOT NULL,
    "delivery_format_id" UUID,
    "modality" "delivery_modality" NOT NULL,
    "location" TEXT,
    "timezone" TEXT NOT NULL,
    "starts_on" DATE NOT NULL,
    "ends_on" DATE NOT NULL,
    "schedule_note" TEXT,
    "capacity" INTEGER,
    "status" "offering_status" NOT NULL DEFAULT 'planned',
    "organisation_id" UUID,
    "lead_expert_id" UUID,
    "joining_details" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "scheduled_offerings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faq_entries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "group_title" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "href" TEXT,
    "href_label" TEXT,
    "tbc" BOOLEAN NOT NULL DEFAULT false,
    "published" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "faq_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diagnostic_questions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "domain_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "scenario" TEXT NOT NULL,
    "options" JSONB NOT NULL,

    CONSTRAINT "diagnostic_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enquiries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "kind" "enquiry_kind" NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "organisation" TEXT,
    "message" TEXT NOT NULL,
    "programme_id" UUID,
    "source_path" TEXT NOT NULL,
    "status" "enquiry_status" NOT NULL DEFAULT 'new',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enquiries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "programmes_slug_key" ON "programmes"("slug");

-- CreateIndex
CREATE INDEX "programmes_domain_id_idx" ON "programmes"("domain_id");

-- CreateIndex
CREATE INDEX "programmes_status_sort_order_idx" ON "programmes"("status", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "programme_modules_programme_id_position_key" ON "programme_modules"("programme_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_formats_programme_id_code_key" ON "delivery_formats"("programme_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "programme_prices_programme_id_region_key" ON "programme_prices"("programme_id", "region");

-- CreateIndex
CREATE UNIQUE INDEX "experts_slug_key" ON "experts"("slug");

-- CreateIndex
CREATE INDEX "scheduled_offerings_programme_id_status_starts_on_idx" ON "scheduled_offerings"("programme_id", "status", "starts_on");

-- CreateIndex
CREATE UNIQUE INDEX "faq_entries_group_title_position_key" ON "faq_entries"("group_title", "position");

-- CreateIndex
CREATE UNIQUE INDEX "diagnostic_questions_code_key" ON "diagnostic_questions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "diagnostic_questions_position_key" ON "diagnostic_questions"("position");

-- CreateIndex
CREATE INDEX "enquiries_status_created_at_idx" ON "enquiries"("status", "created_at");

-- AddForeignKey
ALTER TABLE "programmes" ADD CONSTRAINT "programmes_domain_id_fkey" FOREIGN KEY ("domain_id") REFERENCES "domains"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programme_modules" ADD CONSTRAINT "programme_modules_programme_id_fkey" FOREIGN KEY ("programme_id") REFERENCES "programmes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_formats" ADD CONSTRAINT "delivery_formats_programme_id_fkey" FOREIGN KEY ("programme_id") REFERENCES "programmes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programme_prices" ADD CONSTRAINT "programme_prices_programme_id_fkey" FOREIGN KEY ("programme_id") REFERENCES "programmes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programme_experts" ADD CONSTRAINT "programme_experts_programme_id_fkey" FOREIGN KEY ("programme_id") REFERENCES "programmes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programme_experts" ADD CONSTRAINT "programme_experts_expert_id_fkey" FOREIGN KEY ("expert_id") REFERENCES "experts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_offerings" ADD CONSTRAINT "scheduled_offerings_programme_id_fkey" FOREIGN KEY ("programme_id") REFERENCES "programmes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_offerings" ADD CONSTRAINT "scheduled_offerings_delivery_format_id_fkey" FOREIGN KEY ("delivery_format_id") REFERENCES "delivery_formats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_offerings" ADD CONSTRAINT "scheduled_offerings_lead_expert_id_fkey" FOREIGN KEY ("lead_expert_id") REFERENCES "experts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnostic_questions" ADD CONSTRAINT "diagnostic_questions_domain_id_fkey" FOREIGN KEY ("domain_id") REFERENCES "domains"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_programme_id_fkey" FOREIGN KEY ("programme_id") REFERENCES "programmes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
