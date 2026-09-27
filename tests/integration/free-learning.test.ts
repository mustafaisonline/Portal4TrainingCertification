import { afterAll, describe, expect, it } from "vitest";
import { disconnectPrisma, getPrisma, withTransaction } from "@/db/prisma";
import {
  countPublishedTopics,
  findPublishedTopicBySlug,
  getTopicImage,
  listPublishedTopics,
  listTopicsForAdmin,
  replaceTopicFromImport,
  setTopicPublished,
} from "@/modules/free-learning/book.repository";
import { listAuditForEntity } from "@/modules/platform/audit/repository";
import { createAdminUser } from "../helpers/certificates-db";
import { deleteTestUser } from "../helpers/identity-db";

/*
 * Free Learning topics — Milestone 14 Phase 2 against the REAL test
 * database: the import inserts a topic with its images and rewrites the
 * image sources; a re-import replaces the body and images (no orphans) and
 * keeps an administrator's unpublish decision; readers see published topics
 * only (list, search, page, neighbours, images); publish changes are audited.
 */

const prisma = getPrisma();
const PREFIX = `t-${Date.now().toString(36)}`;
const users: string[] = [];

afterAll(async () => {
  await prisma.bookTopic.deleteMany({ where: { slug: { startsWith: PREFIX } } });
  for (const e of users) await deleteTestUser(e);
  await disconnectPrisma();
});

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);

function topicInput(n: number, overrides: Partial<Parameters<typeof replaceTopicFromImport>[1]> = {}) {
  return {
    position: 90000 + n,
    slug: `${PREFIX}-topic-${n}`,
    title: `Test Topic ${n}`,
    sourceHeading: `Test Topic ${n}`,
    bodyHtml: `<p>Body of topic ${n} about metadata.</p><p><img src="img://0" /></p>`,
    bodyText: `Body of topic ${n} about metadata.`,
    wordCount: 6,
    images: [{ ref: 0, mime: "image/png", bytes: PNG, alt: null }],
    publish: true,
    importedAt: new Date(),
    ...overrides,
  };
}

describe("import", () => {
  it("inserts a topic with its image and rewrites the image source to the served URL; a re-import replaces body and images", async () => {
    const first = await withTransaction((tx) => replaceTopicFromImport(tx, topicInput(1), (id) => `/free-learning/images/${id}`));
    expect(first.created).toBe(true);
    expect(first.images).toBe(1);
    const view = await findPublishedTopicBySlug(`${PREFIX}-topic-1`);
    expect(view).not.toBeNull();
    const src = /src="(\/free-learning\/images\/[0-9a-f-]{36})"/.exec(view!.bodyHtml)?.[1];
    expect(src).toBeTruthy();
    const imageId = src!.split("/").pop()!;
    const image = await getTopicImage(imageId);
    expect(image).toMatchObject({ mime: "image/png", published: true });
    expect(Buffer.from(image!.bytes).equals(Buffer.from(PNG))).toBe(true);

    const again = await withTransaction((tx) => replaceTopicFromImport(tx, topicInput(1, { bodyHtml: "<p>Rewritten.</p>", bodyText: "Rewritten.", wordCount: 1, images: [] }), (id) => `/free-learning/images/${id}`));
    expect(again.created).toBe(false);
    expect(again.images).toBe(0);
    expect(await getTopicImage(imageId)).toBeNull(); // the old image row is gone
    expect((await findPublishedTopicBySlug(`${PREFIX}-topic-1`))!.bodyHtml).toBe("<p>Rewritten.</p>");
  });

  it("an administrator's unpublish decision survives a re-import; publish changes are audited; unpublished topics and their images are hidden", async () => {
    const admin = await createAdminUser("m14-fl-admin");
    users.push(admin.email);
    await withTransaction((tx) => replaceTopicFromImport(tx, topicInput(2), (id) => `/free-learning/images/${id}`));
    const listed = await listTopicsForAdmin();
    const row = listed.find((t) => t.slug === `${PREFIX}-topic-2`)!;
    expect(row.published).toBe(true);

    const off = await withTransaction((tx) => setTopicPublished(tx, { topicId: row.id, published: false, actorUserId: admin.id }));
    expect(off?.published).toBe(false);
    expect(await findPublishedTopicBySlug(`${PREFIX}-topic-2`)).toBeNull();
    const imageId = (await prisma.bookTopicImage.findFirst({ where: { topicId: row.id }, select: { id: true } }))!.id;
    expect((await getTopicImage(imageId))?.published).toBe(false);

    // Same value again: no second audit row.
    await withTransaction((tx) => setTopicPublished(tx, { topicId: row.id, published: false, actorUserId: admin.id }));
    await withTransaction((tx) => replaceTopicFromImport(tx, topicInput(2), (id) => `/free-learning/images/${id}`));
    expect((await listTopicsForAdmin()).find((t) => t.slug === `${PREFIX}-topic-2`)!.published).toBe(false);

    const on = await withTransaction((tx) => setTopicPublished(tx, { topicId: row.id, published: true, actorUserId: admin.id }));
    expect(on?.published).toBe(true);
    const audit = await listAuditForEntity(prisma, "book_topic", row.id);
    expect(audit.map((a) => a.action)).toEqual(["book_topic.published_changed", "book_topic.published_changed"]);
    expect(audit.map((a) => (a.after as { published: boolean }).published)).toEqual([false, true]);
  });

  it("readers: list in book order, search by every word, neighbours, count", async () => {
    await withTransaction((tx) => replaceTopicFromImport(tx, topicInput(3, { bodyHtml: "<p>Lakehouse storage layers.</p>", bodyText: "Lakehouse storage layers.", images: [] }), (id) => id));
    const all = await listPublishedTopics();
    const mine = all.filter((t) => t.slug.startsWith(PREFIX)).map((t) => t.slug);
    expect(mine).toEqual([`${PREFIX}-topic-1`, `${PREFIX}-topic-2`, `${PREFIX}-topic-3`]);
    expect(all.every((t) => t.published)).toBe(true);
    expect(await countPublishedTopics()).toBeGreaterThanOrEqual(3);

    const hit = (await listPublishedTopics("lakehouse LAYERS")).filter((t) => t.slug.startsWith(PREFIX));
    expect(hit.map((t) => t.slug)).toEqual([`${PREFIX}-topic-3`]);
    expect((await listPublishedTopics("nothing-like-this-anywhere")).filter((t) => t.slug.startsWith(PREFIX))).toEqual([]);

    const middle = (await findPublishedTopicBySlug(`${PREFIX}-topic-2`))!;
    expect(middle.previous?.slug).toBe(`${PREFIX}-topic-1`);
    expect(middle.next?.slug).toBe(`${PREFIX}-topic-3`);
    expect(middle.excerpt.length).toBeLessThanOrEqual(160);
  });
});
