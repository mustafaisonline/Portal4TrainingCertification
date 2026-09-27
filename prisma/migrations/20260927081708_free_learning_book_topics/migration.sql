-- Free Learning (Milestone 14 Phase 2; DR-03; §4 rows 1–2 approved 2026-09-27).
-- Additive and forward-only: two new tables — one topic per top-level heading of
-- the founder's book, and its images as bytes (P8: PostgreSQL). No existing table
-- or column changes. Reversal: drop both tables.

-- CreateTable
CREATE TABLE "book_topics" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "position" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body_html" TEXT NOT NULL,
    "body_text" TEXT NOT NULL,
    "source_heading" TEXT NOT NULL,
    "word_count" INTEGER NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "imported_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "book_topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "book_topic_images" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "topic_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "mime" TEXT NOT NULL,
    "bytes" BYTEA NOT NULL,
    "alt" TEXT,

    CONSTRAINT "book_topic_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "book_topics_position_key" ON "book_topics"("position");

-- CreateIndex
CREATE UNIQUE INDEX "book_topics_slug_key" ON "book_topics"("slug");

-- CreateIndex
CREATE INDEX "book_topics_published_position_idx" ON "book_topics"("published", "position");

-- CreateIndex
CREATE UNIQUE INDEX "book_topic_images_topic_id_position_key" ON "book_topic_images"("topic_id", "position");

-- AddForeignKey
ALTER TABLE "book_topic_images" ADD CONSTRAINT "book_topic_images_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "book_topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
