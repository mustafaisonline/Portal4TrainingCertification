-- Topic self-check questions (Milestone 14 Phase 3; §4 row 3 approved 2026-09-27).
-- Additive and forward-only: a status enum and two new tables — questions per topic
-- (draft until reviewed) and their five options with one correct. No existing table or
-- column changes. Reversal: drop both tables and the enum.

-- CreateEnum
CREATE TYPE "topic_question_status" AS ENUM ('draft', 'reviewed');

-- CreateTable
CREATE TABLE "topic_questions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "topic_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "stem" TEXT NOT NULL,
    "explanation" TEXT,
    "status" "topic_question_status" NOT NULL DEFAULT 'draft',
    "reviewed_by_user_id" UUID,
    "reviewed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "topic_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topic_question_options" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "question_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL,

    CONSTRAINT "topic_question_options_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "topic_questions_topic_id_status_idx" ON "topic_questions"("topic_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "topic_questions_topic_id_position_key" ON "topic_questions"("topic_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "topic_question_options_question_id_position_key" ON "topic_question_options"("question_id", "position");

-- AddForeignKey
ALTER TABLE "topic_questions" ADD CONSTRAINT "topic_questions_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "book_topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topic_questions" ADD CONSTRAINT "topic_questions_reviewed_by_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topic_question_options" ADD CONSTRAINT "topic_question_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "topic_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
