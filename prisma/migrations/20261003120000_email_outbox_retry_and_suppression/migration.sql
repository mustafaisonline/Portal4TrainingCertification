-- AlterTable
ALTER TABLE "outbound_emails" ADD COLUMN     "idempotency_key" TEXT,
ADD COLUMN     "last_attempt_at" TIMESTAMPTZ(6),
ADD COLUMN     "next_attempt_at" TIMESTAMPTZ(6);

-- CreateTable
CREATE TABLE "email_suppressions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "email_suppressions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_suppressions_email_key" ON "email_suppressions"("email");

-- CreateIndex
CREATE UNIQUE INDEX "outbound_emails_idempotency_key_key" ON "outbound_emails"("idempotency_key");

-- AddForeignKey
ALTER TABLE "email_suppressions" ADD CONSTRAINT "email_suppressions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

