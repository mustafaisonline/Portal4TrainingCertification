-- CreateTable
CREATE TABLE "human_challenges" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "kind" TEXT NOT NULL,
    "answer_hash" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "consumed_at" TIMESTAMPTZ(6),

    CONSTRAINT "human_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "human_challenges_expires_at_idx" ON "human_challenges"("expires_at");
