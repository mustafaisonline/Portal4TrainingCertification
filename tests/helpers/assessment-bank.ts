import { randomUUID } from "node:crypto";
import { getPrisma, withTransaction } from "../../src/db/prisma";
import { replaceTopicFromImport } from "../../src/modules/free-learning/book.repository";

/*
 * A fixture question bank for the Free Assessment Check tests (integration +
 * e2e). Relative imports: Playwright resolves no `@/` alias. TEST DATABASE ONLY.
 *
 * The check is ONE fixed size of 200 questions (founder, 2026-09-30) and is
 * refused while the reviewed bank is smaller, so every test that starts an
 * attempt needs at least 200 reviewed questions of a published topic. This
 * creates them with two bulk inserts (fast — no per-question audit rows), all
 * `reviewed`, five options each, the correct option at `correct` (default 1 =
 * "A"). Nothing here is a production override: the production code path and its
 * minimum are unchanged. Remove with `deleteAssessmentBank`.
 */

export const ASSESSMENT_TEST_BANK_SIZE = 260; // comfortably above 200 so two attempts can differ

export async function createAssessmentBank(opts: { slug: string; position: number; title?: string; count?: number; correct?: number }): Promise<{ topicId: string; questionIds: string[] }> {
  const count = opts.count ?? ASSESSMENT_TEST_BANK_SIZE;
  const correct = opts.correct ?? 1;
  const prisma = getPrisma();
  const topic = await withTransaction((tx) =>
    replaceTopicFromImport(
      tx,
      { position: opts.position, slug: opts.slug, title: opts.title ?? "Assessment fixture topic", sourceHeading: "Assessment fixture topic", bodyHtml: "<p>x</p>", bodyText: "x", wordCount: 1, images: [], publish: true, importedAt: new Date() },
      (id) => id,
    ),
  );
  const questionIds = Array.from({ length: count }, () => randomUUID());
  await prisma.topicQuestion.createMany({
    data: questionIds.map((id, i) => ({ id, topicId: topic.id, position: i + 1, stem: `Assessment fixture question ${i + 1}: choose option ${"ABCDE"[correct - 1]}?`, status: "reviewed" as const })),
  });
  await prisma.topicQuestionOption.createMany({
    data: questionIds.flatMap((questionId) => [1, 2, 3, 4, 5].map((position) => ({ questionId, position, text: `Option ${"ABCDE"[position - 1]}`, isCorrect: position === correct }))),
  });
  return { topicId: topic.id, questionIds };
}

/** Removes the fixture topic (its questions and options cascade). */
export async function deleteAssessmentBank(slug: string): Promise<void> {
  await getPrisma().bookTopic.deleteMany({ where: { slug } });
}
