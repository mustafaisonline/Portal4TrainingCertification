import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { disconnectPrisma, getPrisma, withTransaction } from "@/db/prisma";
import { replaceTopicFromImport } from "@/modules/free-learning/book.repository";
import { checkAnswers, drawDiagnosticQuestions, importDraftQuestions, listQuestionsForAdmin, listReviewedQuestionPage, questionCountsByTopic, setAllQuestionsStatus, setQuestionStatus } from "@/modules/free-learning/quiz.repository";
import { listAuditForEntity } from "@/modules/platform/audit/repository";
import { createAdminUser } from "../helpers/certificates-db";
import { deleteTestUser } from "../helpers/identity-db";

/*
 * Topic self-check questions — Milestone 14 Phase 3 against the REAL test
 * database: drafts import (skip / replace semantics, reviewed ones kept),
 * readers see reviewed questions only and never the correct option, answers
 * are marked server-side, pagination is ten a page, status changes are
 * audited, counts per topic are right.
 */

const prisma = getPrisma();
const SLUG = `t-quiz-${Date.now().toString(36)}`;
let topicId = "";
let admin: { id: string; email: string };

function q(n: number) {
  return { stem: `Question number ${n} about the topic?`, options: [`A${n}`, `B${n}`, `C${n}`, `D${n}`, `E${n}`], correct: n % 5, explanation: `Because ${n}.` };
}

beforeAll(async () => {
  const r = await withTransaction((tx) =>
    replaceTopicFromImport(tx, { position: 91000, slug: SLUG, title: "Quiz Topic", sourceHeading: "Quiz Topic", bodyHtml: "<p>x</p>", bodyText: "x", wordCount: 1, images: [], publish: true, importedAt: new Date() }, (id) => id),
  );
  topicId = r.id;
  admin = await createAdminUser("m14-quiz-admin");
});

afterAll(async () => {
  const ids = (await prisma.topicQuestion.findMany({ where: { topicId }, select: { id: true } })).map((x) => x.id);
  await prisma.auditLog.deleteMany({ where: { entityType: "topic_question", entityId: { in: ids } } });
  await prisma.bookTopic.deleteMany({ where: { slug: SLUG } });
  await deleteTestUser(admin.email);
  await disconnectPrisma();
});

describe("topic quiz", () => {
  it("imports drafts; a second import is skipped unless drafts are replaced; reviewed questions survive a replace", async () => {
    const first = await withTransaction((tx) => importDraftQuestions(tx, { topicId, questions: [q(1), q(2), q(3)], replaceDrafts: false }));
    expect(first).toEqual({ inserted: 3, draftsReplaced: 0, skipped: false });
    const again = await withTransaction((tx) => importDraftQuestions(tx, { topicId, questions: [q(9)], replaceDrafts: false }));
    expect(again.skipped).toBe(true);

    // Review question 1, then replace drafts: 1 stays, 2–3 go, the new ones
    // are numbered after the highest REMAINING question (so the reader's
    // numbering never has gaps).
    const rows = await listQuestionsForAdmin(topicId);
    await withTransaction((tx) => setQuestionStatus(tx, { questionId: rows[0]!.id, status: "reviewed", actorUserId: admin.id }));
    const replaced = await withTransaction((tx) => importDraftQuestions(tx, { topicId, questions: [q(4), q(5)], replaceDrafts: true }));
    expect(replaced).toEqual({ inserted: 2, draftsReplaced: 2, skipped: false });
    const after = await listQuestionsForAdmin(topicId);
    expect(after.map((x) => [x.position, x.status])).toEqual([
      [1, "reviewed"],
      [2, "draft"],
      [3, "draft"],
    ]);
    expect(after[0]!.options.filter((o) => o.isCorrect)).toHaveLength(1);
  });

  it("readers get reviewed questions only, without the answers; checking is server-side; unreviewed questions are ignored", async () => {
    const page = await listReviewedQuestionPage(topicId, 1);
    expect(page.total).toBe(1);
    expect(page.questions.map((x) => x.position)).toEqual([1]);
    expect(JSON.stringify(page)).not.toContain("isCorrect");
    expect(page.questions[0]!.options).toHaveLength(5);

    const all = await listQuestionsForAdmin(topicId);
    const reviewed = all.find((x) => x.status === "reviewed")!;
    const draft = all.find((x) => x.status === "draft")!;
    const correct = reviewed.options.find((o) => o.isCorrect)!.position;
    const wrong = reviewed.options.find((o) => !o.isCorrect)!.position;
    const results = await checkAnswers(topicId, [
      { questionId: reviewed.id, optionPosition: wrong },
      { questionId: draft.id, optionPosition: 1 },
      { questionId: "00000000-0000-4000-8000-000000000000", optionPosition: 1 },
    ]);
    expect(results).toEqual([{ questionId: reviewed.id, chosen: wrong, correct: false, correctPosition: correct, explanation: "Because 1." }]);
    expect((await checkAnswers(topicId, [{ questionId: reviewed.id, optionPosition: correct }]))[0]!.correct).toBe(true);
    expect((await checkAnswers(topicId, [{ questionId: reviewed.id, optionPosition: null }]))[0]).toMatchObject({ chosen: null, correct: false });
  });

  it("marks all drafts reviewed with one audit row each; pages are ten a page; counts per topic", async () => {
    await withTransaction((tx) => importDraftQuestions(tx, { topicId, questions: Array.from({ length: 12 }, (_, i) => q(10 + i)), replaceDrafts: true }));
    const n = await withTransaction((tx) => setAllQuestionsStatus(tx, { topicId, status: "reviewed", actorUserId: admin.id }));
    expect(n).toBe(12);
    const counts = (await questionCountsByTopic()).get(topicId);
    expect(counts).toEqual({ total: 13, reviewed: 13 });

    const p1 = await listReviewedQuestionPage(topicId, 1);
    const p2 = await listReviewedQuestionPage(topicId, 2);
    const p9 = await listReviewedQuestionPage(topicId, 9); // clamped to the last page
    expect([p1.total, p1.pages, p1.from, p1.to, p1.questions.length]).toEqual([13, 2, 1, 10, 10]);
    expect([p2.page, p2.from, p2.to, p2.questions.length]).toEqual([2, 11, 13, 3]);
    expect(p9.page).toBe(2);

    const one = (await listQuestionsForAdmin(topicId)).at(-1)!;
    const audit = await listAuditForEntity(prisma, "topic_question", one.id);
    expect(audit.map((a) => a.action)).toEqual(["topic_question.status_changed"]);
    expect(audit[0]!.after).toMatchObject({ status: "reviewed", topicId });
    // Same status again: nothing written.
    await withTransaction((tx) => setQuestionStatus(tx, { questionId: one.id, status: "reviewed", actorUserId: admin.id }));
    expect((await listAuditForEntity(prisma, "topic_question", one.id)).length).toBe(1);
  });

  // Founder, 2026-09-28 ("New change" item 1): the free diagnostic draws a
  // fresh random set from the reviewed bank on every start.
  it("drawDiagnosticQuestions: distinct reviewed questions of published topics, with the correct option (no explanation); an oversized draw is refused honestly", async () => {
    const drawn = await drawDiagnosticQuestions(3);
    expect(drawn).not.toBeNull();
    expect(drawn!.length).toBe(3);
    expect(new Set(drawn!.map((d) => d.id)).size).toBe(3);
    for (const d of drawn!) {
      expect(d.options.length).toBe(5);
      expect(d.stem.length).toBeGreaterThan(0);
      expect(d.topicTitle.length).toBeGreaterThan(0);
      // The drawn shape carries the correct option text (CR-2026-10-02-2014: the score is computed in the browser) and never the explanation.
      expect(Object.keys(d).sort()).toEqual(["correct", "id", "options", "stem", "topicSlug", "topicTitle"]);
      expect(d.options).toContain(d.correct);
      const row = await prisma.topicQuestion.findUnique({ where: { id: d.id }, select: { status: true, topic: { select: { published: true } } } });
      expect(row).toMatchObject({ status: "reviewed", topic: { published: true } });
    }
    const bank = await prisma.topicQuestion.count({ where: { status: "reviewed", topic: { published: true } } });
    expect(await drawDiagnosticQuestions(bank + 1000)).toBeNull();
  });
});
