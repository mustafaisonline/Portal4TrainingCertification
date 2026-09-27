import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { disconnectPrisma, getPrisma, withTransaction } from "@/db/prisma";
import { replaceTopicFromImport } from "@/modules/free-learning/book.repository";
import { attemptPage, bankSize, findResultByPublicId, finishAttempt, getAttemptForUser, KnowledgeCheckError, listAttemptsForUser, saveAnswers, startAttempt } from "@/modules/free-learning/knowledge-check.repository";
import { importDraftQuestions, setAllQuestionsStatus } from "@/modules/free-learning/quiz.repository";
import { listAuditForEntity } from "@/modules/platform/audit/repository";
import { createAdminUser, createCertificateUser } from "../helpers/certificates-db";
import { completeProfile, deleteTestUser } from "../helpers/identity-db";

/*
 * The Knowledge Check — Milestone 14 Phase 4 against the REAL test database:
 * the bank counts reviewed questions of published topics only; a check is
 * refused while the bank is too small; an attempt serves `size` distinct
 * reviewed questions, pages of ten without answers, saves answers only for
 * served questions, scores and passes at 70 %, snapshots the holder's name,
 * mints a KC id that /verify resolves, audits, and is idempotent to finish.
 */

const prisma = getPrisma();
const SLUG = `t-kc-${Date.now().toString(36)}`;
let topicId = "";
let admin: { id: string; email: string };
let holder: { id: string; email: string; name: string };

beforeAll(async () => {
  admin = await createAdminUser("m14-kc-admin");
  holder = await createCertificateUser({ prefix: "m14-kc-holder", legalName: "Kay Checker" });
  await completeProfile(holder.id, { legalName: "Kay Checker" });
  const r = await withTransaction((tx) =>
    replaceTopicFromImport(tx, { position: 92000, slug: SLUG, title: "KC Topic", sourceHeading: "KC Topic", bodyHtml: "<p>x</p>", bodyText: "x", wordCount: 1, images: [], publish: true, importedAt: new Date() }, (id) => id),
  );
  topicId = r.id;
  await withTransaction((tx) =>
    importDraftQuestions(tx, { topicId, replaceDrafts: false, questions: Array.from({ length: 60 }, (_, i) => ({ stem: `KC question ${i + 1}: pick the marked option?`, options: ["A", "B", "C", "D", "E"].map((l) => `${l}${i}`), correct: i % 5, explanation: null })) }),
  );
});

afterAll(async () => {
  const attempts = await prisma.knowledgeCheckAttempt.findMany({ where: { userId: holder.id }, select: { id: true } });
  await prisma.auditLog.deleteMany({ where: { entityType: "knowledge_check_attempt", entityId: { in: attempts.map((a) => a.id) } } });
  await prisma.knowledgeCheckAttempt.deleteMany({ where: { userId: holder.id } });
  const ids = (await prisma.topicQuestion.findMany({ where: { topicId }, select: { id: true } })).map((x) => x.id);
  await prisma.auditLog.deleteMany({ where: { entityType: "topic_question", entityId: { in: ids } } });
  await prisma.bookTopic.deleteMany({ where: { slug: SLUG } });
  await deleteTestUser(holder.email);
  await deleteTestUser(admin.email);
  await disconnectPrisma();
});

describe("knowledge check", () => {
  it("the bank is reviewed questions of published topics; a 50-question check is refused until 50 are reviewed", async () => {
    const before = await bankSize();
    await expect(withTransaction((tx) => startAttempt(tx, { userId: holder.id, size: 50 }))).rejects.toSatisfy((e) => e instanceof KnowledgeCheckError && e.reason === "bank_too_small" && before < 50);
    await expect(withTransaction((tx) => startAttempt(tx, { userId: holder.id, size: 60 as never }))).rejects.toMatchObject({ reason: "invalid_size" });
    await withTransaction((tx) => setAllQuestionsStatus(tx, { topicId, status: "reviewed", actorUserId: admin.id }));
    expect(await bankSize()).toBe(before + 60);
  });

  it("an attempt serves 50 distinct reviewed questions, ten a page without answers; answers save for served questions only", async () => {
    const attempt = await withTransaction((tx) => startAttempt(tx, { userId: holder.id, size: 50 }));
    expect(attempt.questionIds).toHaveLength(50);
    expect(new Set(attempt.questionIds).size).toBe(50);
    expect(attempt.finishedAt).toBeNull();
    const page = await attemptPage(attempt, 1);
    expect([page.pages, page.from, page.to, page.questions.length]).toEqual([5, 1, 10, 10]);
    expect(JSON.stringify(page)).not.toContain("isCorrect");
    expect(page.questions[0]!.number).toBe(1);
    expect((await attemptPage(attempt, 9)).page).toBe(5);

    const served = page.questions[0]!.id;
    const saved = await withTransaction((tx) => saveAnswers(tx, { attemptId: attempt.id, userId: holder.id, answers: { [served]: 3, "00000000-0000-4000-8000-000000000000": 1, [page.questions[1]!.id]: 9 } }));
    expect(saved.answers).toEqual({ [served]: 3 });
    expect((await attemptPage(saved, 1)).questions[0]!.chosen).toBe(3);
    // Another person cannot see it.
    expect(await getAttemptForUser(attempt.id, admin.id)).toBeNull();
  });

  it("finishing scores the attempt, passes at 70 %, snapshots the name, mints a KC id that /verify resolves, audits, and is idempotent", async () => {
    const attempt = await withTransaction((tx) => startAttempt(tx, { userId: holder.id, size: 50 }));
    const correct = await prisma.topicQuestionOption.findMany({ where: { questionId: { in: attempt.questionIds }, isCorrect: true }, select: { questionId: true, position: true } });
    // Answer 36 right (72 %) and the rest wrong.
    const answers: Record<string, number> = {};
    correct.forEach((c, i) => {
      answers[c.questionId] = i < 36 ? c.position : ((c.position % 5) + 1);
    });
    await withTransaction((tx) => saveAnswers(tx, { attemptId: attempt.id, userId: holder.id, answers }));
    const finished = await withTransaction((tx) => finishAttempt(tx, { attemptId: attempt.id, userId: holder.id }));
    expect(finished.score).toBe(36);
    expect(finished.passed).toBe(true);
    expect(finished.holderName).toBe("Kay Checker");
    expect(finished.publicId).toMatch(/^KC-\d{4}-[23456789A-HJKMNP-Z]{4}-[23456789A-HJKMNP-Z]{4}$/);
    expect(finished.finishedAt).toBeInstanceOf(Date);

    const again = await withTransaction((tx) => finishAttempt(tx, { attemptId: attempt.id, userId: holder.id }));
    expect(again.publicId).toBe(finished.publicId);
    await expect(withTransaction((tx) => saveAnswers(tx, { attemptId: attempt.id, userId: holder.id, answers: {} }))).rejects.toMatchObject({ reason: "already_finished" });

    const view = await findResultByPublicId(finished.publicId!.toLowerCase());
    expect(view).toMatchObject({ publicId: finished.publicId, holderName: "Kay Checker", size: 50, score: 36, percent: 72, passed: true });
    expect(await findResultByPublicId("KC-2026-2222-2222")).toBeNull();

    const audit = await listAuditForEntity(prisma, "knowledge_check_attempt", attempt.id);
    expect(audit.map((a) => a.action)).toEqual(["knowledge_check.finished"]);
    expect(audit[0]!.after).toMatchObject({ size: 50, score: 36, passed: true, publicId: finished.publicId });

    const mine = await listAttemptsForUser(holder.id);
    expect(mine.length).toBeGreaterThanOrEqual(2);
    expect(mine[0]!.id).toBe(attempt.id); // newest first
  });

  it("a failing score is not a pass and still gets an ID", async () => {
    const attempt = await withTransaction((tx) => startAttempt(tx, { userId: holder.id, size: 50 }));
    const finished = await withTransaction((tx) => finishAttempt(tx, { attemptId: attempt.id, userId: holder.id }));
    expect(finished.score).toBe(0);
    expect(finished.passed).toBe(false);
    expect(finished.publicId).toBeTruthy();
    expect((await findResultByPublicId(finished.publicId!))?.passed).toBe(false);
  });
});
