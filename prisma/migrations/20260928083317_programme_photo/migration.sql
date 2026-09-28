-- AlterTable
ALTER TABLE "programmes" ADD COLUMN     "photo" BYTEA,
ADD COLUMN     "photo_mime" TEXT,
ADD COLUMN     "photo_updated_at" TIMESTAMPTZ(6);
