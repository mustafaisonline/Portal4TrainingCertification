-- CreateEnum
CREATE TYPE "organisation_type" AS ENUM ('company', 'education');

-- CreateEnum
CREATE TYPE "role_question_status" AS ENUM ('draft', 'pending', 'reviewed', 'rejected');

-- CreateTable
CREATE TABLE "organisations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "organisation_type" NOT NULL,
    "logo_path" TEXT,
    "contact_email" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "organisations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_roles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "organisation_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "assessment_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organisation_roles" (
    "organisation_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organisation_roles_pkey" PRIMARY KEY ("organisation_id","role_id")
);

-- CreateTable
CREATE TABLE "role_questions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "role_id" UUID NOT NULL,
    "organisation_id" UUID,
    "category" TEXT NOT NULL,
    "stem" TEXT NOT NULL,
    "model_answer" TEXT NOT NULL,
    "status" "role_question_status" NOT NULL DEFAULT 'draft',
    "source" TEXT,
    "created_by_user_id" UUID,
    "reviewed_by_user_id" UUID,
    "reviewed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "role_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_question_options" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "question_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL,

    CONSTRAINT "role_question_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_test_attempts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "organisation_id" UUID,
    "size" INTEGER NOT NULL,
    "question_ids" JSONB NOT NULL,
    "answers" JSONB NOT NULL DEFAULT '{}',
    "score" INTEGER,
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMPTZ(6),
    "shared_with_organisation" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "role_test_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organisations_slug_key" ON "organisations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_roles_slug_key" ON "assessment_roles"("slug");

-- CreateIndex
CREATE INDEX "assessment_roles_organisation_id_idx" ON "assessment_roles"("organisation_id");

-- CreateIndex
CREATE INDEX "organisation_roles_role_id_idx" ON "organisation_roles"("role_id");

-- CreateIndex
CREATE INDEX "role_questions_role_id_status_idx" ON "role_questions"("role_id", "status");

-- CreateIndex
CREATE INDEX "role_questions_organisation_id_role_id_status_idx" ON "role_questions"("organisation_id", "role_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "role_question_options_question_id_position_key" ON "role_question_options"("question_id", "position");

-- CreateIndex
CREATE INDEX "role_test_attempts_user_id_started_at_idx" ON "role_test_attempts"("user_id", "started_at");

-- CreateIndex
CREATE INDEX "role_test_attempts_organisation_id_role_id_finished_at_idx" ON "role_test_attempts"("organisation_id", "role_id", "finished_at");

-- AddForeignKey
ALTER TABLE "assessment_roles" ADD CONSTRAINT "assessment_roles_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organisation_roles" ADD CONSTRAINT "organisation_roles_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organisation_roles" ADD CONSTRAINT "organisation_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "assessment_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_questions" ADD CONSTRAINT "role_questions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "assessment_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_questions" ADD CONSTRAINT "role_questions_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_questions" ADD CONSTRAINT "role_questions_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_questions" ADD CONSTRAINT "role_questions_reviewed_by_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_question_options" ADD CONSTRAINT "role_question_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "role_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_test_attempts" ADD CONSTRAINT "role_test_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_test_attempts" ADD CONSTRAINT "role_test_attempts_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "assessment_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_test_attempts" ADD CONSTRAINT "role_test_attempts_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
