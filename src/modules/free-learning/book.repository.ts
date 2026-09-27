import type { Db, Tx } from "@/db/prisma";
import { getPrisma } from "@/db/prisma";
import { isUuid } from "@/modules/catalogue/offerings/repository";
import { writeAudit } from "@/modules/platform/audit/repository";

/*
 * Free Learning — the book's topics (Milestone 14 Phase 2; DR-03). Public
 * readers see PUBLISHED topics only; the administrator sees all and flips
 * `published` (audited). The import script writes through
 * `replaceTopicFromImport`, one topic per transaction, replacing the topic's
 * images so a re-import never leaves orphans. Image bytes are stored here
 * (P8) and streamed by /free-learning/images/<id>.
 */

export type TopicListItem = {
  id: string;
  position: number;
  slug: string;
  title: string;
  /** The first ~160 characters of the text, for the list. */
  excerpt: string;
  wordCount: number;
  published: boolean;
  imageCount: number;
};

export type TopicView = TopicListItem & {
  bodyHtml: string;
  /** Neighbours in book order (published only for readers). */
  previous: { slug: string; title: string } | null;
  next: { slug: string; title: string } | null;
};

const listSelect = { id: true, position: true, slug: true, title: true, bodyText: true, wordCount: true, published: true, _count: { select: { images: true } } } as const;

function toListItem(r: { id: string; position: number; slug: string; title: string; bodyText: string; wordCount: number; published: boolean; _count: { images: number } }): TopicListItem {
  return { id: r.id, position: r.position, slug: r.slug, title: r.title, excerpt: r.bodyText.length > 160 ? `${r.bodyText.slice(0, 157).trimEnd()}…` : r.bodyText, wordCount: r.wordCount, published: r.published, imageCount: r._count.images };
}

/** Published topics in book order; with `query`, every word must appear in
 *  the title or the text (case-insensitive). */
export async function listPublishedTopics(query = "", db: Db = getPrisma()): Promise<TopicListItem[]> {
  const words = query.trim().split(/\s+/).filter(Boolean).slice(0, 8);
  const rows = await db.bookTopic.findMany({
    where: {
      published: true,
      ...(words.length ? { AND: words.map((w) => ({ OR: [{ title: { contains: w, mode: "insensitive" } }, { bodyText: { contains: w, mode: "insensitive" } }] })) } : {}),
    },
    orderBy: { position: "asc" },
    select: listSelect,
  });
  return rows.map(toListItem);
}

export async function countPublishedTopics(db: Db = getPrisma()): Promise<number> {
  return db.bookTopic.count({ where: { published: true } });
}

export async function findPublishedTopicBySlug(slug: string, db: Db = getPrisma()): Promise<TopicView | null> {
  const r = await db.bookTopic.findFirst({ where: { slug, published: true }, select: { ...listSelect, bodyHtml: true } });
  if (!r) return null;
  const [previous, next] = await Promise.all([
    db.bookTopic.findFirst({ where: { published: true, position: { lt: r.position } }, orderBy: { position: "desc" }, select: { slug: true, title: true } }),
    db.bookTopic.findFirst({ where: { published: true, position: { gt: r.position } }, orderBy: { position: "asc" }, select: { slug: true, title: true } }),
  ]);
  return { ...toListItem(r), bodyHtml: r.bodyHtml, previous, next };
}

export async function getTopicImage(id: string, db: Db = getPrisma()): Promise<{ mime: string; bytes: Uint8Array; published: boolean } | null> {
  if (!isUuid(id)) return null;
  const r = await db.bookTopicImage.findUnique({ where: { id }, select: { mime: true, bytes: true, topic: { select: { published: true } } } });
  return r ? { mime: r.mime, bytes: r.bytes, published: r.topic.published } : null;
}

/* ------------------------------------------------------------------ admin */

export async function listTopicsForAdmin(db: Db = getPrisma()): Promise<TopicListItem[]> {
  const rows = await db.bookTopic.findMany({ orderBy: { position: "asc" }, select: listSelect });
  return rows.map(toListItem);
}

export async function setTopicPublished(tx: Tx, input: { topicId: string; published: boolean; actorUserId: string }): Promise<TopicListItem | null> {
  if (!isUuid(input.topicId)) return null;
  const before = await tx.bookTopic.findUnique({ where: { id: input.topicId }, select: { published: true, slug: true } });
  if (!before) return null;
  if (before.published !== input.published) {
    await tx.bookTopic.update({ where: { id: input.topicId }, data: { published: input.published } });
    await writeAudit(tx, {
      actorUserId: input.actorUserId,
      action: "book_topic.published_changed",
      entityType: "book_topic",
      entityId: input.topicId,
      before: { published: before.published },
      after: { published: input.published, slug: before.slug },
    });
  }
  const r = await tx.bookTopic.findUniqueOrThrow({ where: { id: input.topicId }, select: listSelect });
  return toListItem(r);
}

/* ----------------------------------------------------------------- import */

export type TopicImportInput = {
  position: number;
  slug: string;
  title: string;
  sourceHeading: string;
  /** HTML with `img://N` placeholders; rewritten here once the images have ids. */
  bodyHtml: string;
  bodyText: string;
  wordCount: number;
  /** ArrayBuffer-backed bytes, as Prisma's `Bytes` requires. */
  images: { ref: number; mime: string; bytes: Uint8Array<ArrayBuffer>; alt: string | null }[];
  /** Publish on import (the founder's default); an existing topic keeps its own flag. */
  publish: boolean;
  importedAt: Date;
};

export type TopicImportResult = { id: string; slug: string; created: boolean; images: number };

/**
 * Insert or replace one topic by slug: the body and images are replaced
 * (old images deleted), `published` is set on creation only, so a topic the
 * administrator unpublished stays unpublished after a re-import.
 */
export async function replaceTopicFromImport(tx: Tx, input: TopicImportInput, imageUrl: (id: string) => string): Promise<TopicImportResult> {
  const existing = await tx.bookTopic.findUnique({ where: { slug: input.slug }, select: { id: true } });
  const base = { position: input.position, title: input.title, sourceHeading: input.sourceHeading, bodyText: input.bodyText, wordCount: input.wordCount, importedAt: input.importedAt };
  const topic = existing
    ? await tx.bookTopic.update({ where: { id: existing.id }, data: { ...base, bodyHtml: "" }, select: { id: true } })
    : await tx.bookTopic.create({ data: { ...base, slug: input.slug, bodyHtml: "", published: input.publish }, select: { id: true } });
  if (existing) await tx.bookTopicImage.deleteMany({ where: { topicId: topic.id } });

  const urlByRef = new Map<number, string>();
  let position = 0;
  for (const img of input.images) {
    position += 1;
    const row = await tx.bookTopicImage.create({ data: { topicId: topic.id, position, mime: img.mime, bytes: img.bytes, alt: img.alt }, select: { id: true } });
    urlByRef.set(img.ref, imageUrl(row.id));
  }
  const bodyHtml = input.bodyHtml.replace(/img:\/\/(\d+)/g, (m, n) => urlByRef.get(Number(n)) ?? m);
  await tx.bookTopic.update({ where: { id: topic.id }, data: { bodyHtml } });
  return { id: topic.id, slug: input.slug, created: !existing, images: position };
}
