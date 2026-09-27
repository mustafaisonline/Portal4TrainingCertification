-- The free Knowledge Check (Milestone 14 Phase 4; §4 row 4 approved 2026-09-27).
-- Additive and forward-only: one new table, one row per attempt (questions served,
-- answers, score, pass, public ID). No existing table or column changes.
-- Reversal: drop the table.

-- CreateTable
CREATE TABLE "knowledge_check_attempts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "size" INTEGER NOT NULL,
    "question_ids" JSONB NOT NULL,
    "answers" JSONB NOT NULL DEFAULT '{}',
    "score" INTEGER,
    "passed" BOOLEAN,
    "public_id" TEXT,
    "holder_name" TEXT,
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "knowledge_check_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_check_attempts_public_id_key" ON "knowledge_check_attempts"("public_id");

-- CreateIndex
CREATE INDEX "knowledge_check_attempts_user_id_started_at_idx" ON "knowledge_check_attempts"("user_id", "started_at");

-- AddForeignKey
ALTER TABLE "knowledge_check_attempts" ADD CONSTRAINT "knowledge_check_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
