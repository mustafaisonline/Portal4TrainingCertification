import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { disconnectPrisma, getPrisma, withTransaction } from "@/db/prisma";
import { replaceTopicFromImport } from "@/modules/free-learning/book.repository";
import { achievementCertificateData } from "@/modules/free-learning/achievement-certificate";
import { attemptPage, bankSize, cancelUnfinishedAttempt, deleteFinishedAttempts, findResultByPublicId, finishAttempt, getAttemptForUser, KnowledgeCheckError, listAttemptsForUser, listPassedResultsForAdmin, revokeKnowledgeCheck, saveAnswers, startAttempt } from "@/modules/free-learning/knowledge-check.repository";
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

  it("the public view carries the status and the server-measured time; expiry and revocation follow the stored columns (Q8b)", async () => {
    const attempt = await withTransaction((tx) => startAttempt(tx, { userId: holder.id, size: 50 }));
    const correct = await prisma.topicQuestionOption.findMany({ where: { questionId: { in: attempt.questionIds }, isCorrect: true }, select: { questionId: true, position: true } });
    await withTransaction((tx) => saveAnswers(tx, { attemptId: attempt.id, userId: holder.id, answers: Object.fromEntries(correct.map((c) => [c.questionId, c.position])) }));
    const finished = await withTransaction((tx) => finishAttempt(tx, { attemptId: attempt.id, userId: holder.id }));
    const id = finished.publicId!;

    const fresh = await findResultByPublicId(id);
    expect(fresh).toMatchObject({ status: "valid", passed: true });
    expect(fresh!.timeTakenMs).toBe(finished.finishedAt!.getTime() - finished.startedAt.getTime());
    expect(fresh!.expiresOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(Object.keys(fresh!).sort()).toEqual(["expiresOn", "finishedAt", "holderName", "passed", "percent", "publicId", "score", "size", "status", "timeTakenMs"]);

    // Thirteen months on, the same row reads expired — nothing is stored for it.
    expect((await findResultByPublicId(id, prisma, new Date(finished.finishedAt!.getTime() + 400 * 86_400_000)))?.status).toBe("expired");

    // An administrator's revocation (columns approved 2026-09-29) wins.
    await prisma.knowledgeCheckAttempt.update({ where: { id: attempt.id }, data: { revokedAt: new Date(), revokedByUserId: admin.id, revocationReason: "Test revocation" } });
    expect((await findResultByPublicId(id))?.status).toBe("revoked");
    // The reason is internal: it never reaches the public view.
    expect(JSON.stringify(await findResultByPublicId(id))).not.toContain("Test revocation");
  });

  // Milestone 15 Req 3: the server measures the time; the certificate is derived from the stored attempt.
  it("time taken is finished − started, both server instants; the Certificate of Achievement is derived, pass-only, and carries the ID and a QR", async () => {
    const attempt = await withTransaction((tx) => startAttempt(tx, { userId: holder.id, size: 50 }));
    const started = new Date("2026-05-04T03:00:00.000Z");
    await prisma.knowledgeCheckAttempt.update({ where: { id: attempt.id }, data: { startedAt: started } });
    const correct = await prisma.topicQuestionOption.findMany({ where: { questionId: { in: attempt.questionIds }, isCorrect: true }, select: { questionId: true, position: true } });
    const answers: Record<string, number> = {};
    correct.forEach((c, i) => {
      answers[c.questionId] = i < 42 ? c.position : (c.position % 5) + 1;
    });
    await withTransaction((tx) => saveAnswers(tx, { attemptId: attempt.id, userId: holder.id, answers }));
    const finishedAt = new Date(started.getTime() + (24 * 60 + 31) * 1000); // 24 min 31 s later
    const finished = await withTransaction((tx) => finishAttempt(tx, { attemptId: attempt.id, userId: holder.id, now: finishedAt }));

    const view = (await findResultByPublicId(finished.publicId!, prisma, new Date("2026-06-01T00:00:00Z")))!;
    expect(view.timeTakenMs).toBe(1_471_000);
    const cert = await achievementCertificateData(view, `https://example.test/verify/${view.publicId}`);
    expect(cert).toMatchObject({
      kind: "achievement",
      certificateId: view.publicId,
      holderName: "Kay Checker",
      subjectTitle: "Data & AI Knowledge Check — 50 questions",
      scoreLabel: "42 of 50 · 84%",
      timeTaken: "00:24:31",
      issuedOn: "4 May 2026",
      validUntil: "4 May 2027",
      verifyUrl: `https://example.test/verify/${view.publicId}`,
    });
    expect(cert.qrSvg.startsWith("<svg")).toBe(true);
    expect(JSON.stringify(cert)).not.toMatch(/@example\.test\b(?!\/verify)/); // no email anywhere in the certificate data

    // A failed result has no certificate.
    const failedAttempt = await withTransaction((tx) => startAttempt(tx, { userId: holder.id, size: 50 }));
    const failed = await withTransaction((tx) => finishAttempt(tx, { attemptId: failedAttempt.id, userId: holder.id }));
    await expect(achievementCertificateData((await findResultByPublicId(failed.publicId!))!, "https://example.test/verify/x")).rejects.toThrow(/did not pass/);
  });

  it("revokeKnowledgeCheck: reason required, pass-only, audited with the reason, permanent; the admin list shows the state and the email", async () => {
    const attempt = await withTransaction((tx) => startAttempt(tx, { userId: holder.id, size: 50 }));
    const correct = await prisma.topicQuestionOption.findMany({ where: { questionId: { in: attempt.questionIds }, isCorrect: true }, select: { questionId: true, position: true } });
    await withTransaction((tx) => saveAnswers(tx, { attemptId: attempt.id, userId: holder.id, answers: Object.fromEntries(correct.map((c) => [c.questionId, c.position])) }));
    const finished = await withTransaction((tx) => finishAttempt(tx, { attemptId: attempt.id, userId: holder.id }));
    const publicId = finished.publicId!;

    for (const bad of ["", "  ", "ab", "x".repeat(501), "bad\u0000reason"]) {
      await expect(withTransaction((tx) => revokeKnowledgeCheck(tx, { publicId, adminUserId: admin.id, reason: bad }))).rejects.toMatchObject({ reason: "invalid_reason" });
    }
    await expect(withTransaction((tx) => revokeKnowledgeCheck(tx, { publicId: "KC-2026-2222-2222", adminUserId: admin.id, reason: "Issued in error" }))).rejects.toMatchObject({ reason: "not_found" });
    expect((await findResultByPublicId(publicId))?.status).toBe("valid"); // nothing changed by the refusals

    const done = await withTransaction((tx) => revokeKnowledgeCheck(tx, { publicId: publicId.toLowerCase(), adminUserId: admin.id, reason: "  Issued   in error " }));
    expect(done).toEqual({ attemptId: attempt.id, publicId });
    const row = await prisma.knowledgeCheckAttempt.findUniqueOrThrow({ where: { id: attempt.id }, select: { revokedAt: true, revokedByUserId: true, revocationReason: true } });
    expect(row).toMatchObject({ revokedByUserId: admin.id, revocationReason: "Issued in error" });
    expect(row.revokedAt).toBeInstanceOf(Date);
    expect((await findResultByPublicId(publicId))?.status).toBe("revoked");
    await expect(withTransaction((tx) => revokeKnowledgeCheck(tx, { publicId, adminUserId: admin.id, reason: "Again" }))).rejects.toMatchObject({ reason: "already_revoked" });

    const audit = await listAuditForEntity(prisma, "knowledge_check_attempt", attempt.id);
    expect(audit.map((a) => a.action)).toContain("knowledge_check.revoked");
    expect(audit.find((a) => a.action === "knowledge_check.revoked")).toMatchObject({ actorUserId: admin.id, reason: "Issued in error" });

    const [listed] = await listPassedResultsForAdmin({ publicId });
    expect(listed).toMatchObject({ publicId, status: "revoked", email: holder.email, revocationReason: "Issued in error" });
    expect(await listPassedResultsForAdmin({ publicId: "not-an-id" })).toEqual([]);

    // A result that did not pass has nothing to revoke.
    const failedAttempt = await withTransaction((tx) => startAttempt(tx, { userId: holder.id, size: 50 }));
    const failed = await withTransaction((tx) => finishAttempt(tx, { attemptId: failedAttempt.id, userId: holder.id }));
    await expect(withTransaction((tx) => revokeKnowledgeCheck(tx, { publicId: failed.publicId!, adminUserId: admin.id, reason: "Nothing to revoke" }))).rejects.toMatchObject({ reason: "not_passed" });
  });

  it("a failing score is not a pass and still gets an ID", async () => {
    const attempt = await withTransaction((tx) => startAttempt(tx, { userId: holder.id, size: 50 }));
    const finished = await withTransaction((tx) => finishAttempt(tx, { attemptId: attempt.id, userId: holder.id }));
    expect(finished.score).toBe(0);
    expect(finished.passed).toBe(false);
    expect(finished.publicId).toBeTruthy();
    expect(await findResultByPublicId(finished.publicId!)).toMatchObject({ passed: false, status: "not_passed", expiresOn: null });
  });

  // Founder, 2026-09-28: the person deletes their OWN finished results.
  it("deleteFinishedAttempts: own finished result deleted with an audit record; unfinished, someone else's and a non-uuid are refused", async () => {
    const finished = await withTransaction(async (tx) => {
      const a = await startAttempt(tx, { userId: holder.id, size: 50 });
      return finishAttempt(tx, { attemptId: a.id, userId: holder.id });
    });
    const unfinished = await withTransaction((tx) => startAttempt(tx, { userId: holder.id, size: 50 }));

    // Someone else cannot delete it; an unfinished one and junk are refused.
    const wrong = await withTransaction((tx) => deleteFinishedAttempts(tx, { userId: admin.id, attemptIds: [finished.id] }));
    expect(wrong).toEqual({ deleted: 0, refused: 1 });
    const mixed = await withTransaction((tx) => deleteFinishedAttempts(tx, { userId: holder.id, attemptIds: [unfinished.id, "not-a-uuid", finished.id] }));
    expect(mixed).toEqual({ deleted: 1, refused: 2 });
    expect(await getAttemptForUser(finished.id, holder.id)).toBeNull();
    expect(await getAttemptForUser(unfinished.id, holder.id)).not.toBeNull();
    expect(await findResultByPublicId(finished.publicId!)).toBeNull(); // the verify link stops working — the point of deleting
    const audit = await listAuditForEntity(prisma, "knowledge_check_attempt", finished.id);
    expect(audit.map((a) => a.action)).toContain("knowledge_check.deleted");
    expect(audit.find((a) => a.action === "knowledge_check.deleted")?.before).toMatchObject({ publicId: finished.publicId, size: 50 });
  });

  // Founder, 2026-09-28: a running check can be cancelled by its own taker.
  it("cancelUnfinishedAttempt: own running check deleted and audited; a finished one and someone else's are refused", async () => {
    const running = await withTransaction((tx) => startAttempt(tx, { userId: holder.id, size: 50 }));
    expect(await withTransaction((tx) => cancelUnfinishedAttempt(tx, { attemptId: running.id, userId: admin.id }))).toBe(false); // not theirs
    expect(await withTransaction((tx) => cancelUnfinishedAttempt(tx, { attemptId: running.id, userId: holder.id }))).toBe(true);
    expect(await getAttemptForUser(running.id, holder.id)).toBeNull();
    expect((await listAuditForEntity(prisma, "knowledge_check_attempt", running.id)).map((a) => a.action)).toContain("knowledge_check.deleted");

    const done = await withTransaction(async (tx) => {
      const a = await startAttempt(tx, { userId: holder.id, size: 50 });
      return finishAttempt(tx, { attemptId: a.id, userId: holder.id });
    });
    expect(await withTransaction((tx) => cancelUnfinishedAttempt(tx, { attemptId: done.id, userId: holder.id }))).toBe(false); // finished → its own rules
  });
});
