import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { disconnectPrisma, getPrisma, withTransaction } from "@/db/prisma";
import { achievementCertificateData } from "@/modules/free-learning/achievement-certificate";
import { ASSESSMENT_TIME_LIMIT_MS, attemptDeadline } from "@/modules/free-learning/assessment-rules";
import {
  attemptPage,
  bankSize,
  deleteFinishedAttempts,
  findResultByPublicId,
  finishAttempt,
  generateKnowledgeCheckId,
  getAttemptForUser,
  KnowledgeCheckError,
  listAttemptsForUser,
  listPassedResultsForAdmin,
  revokeKnowledgeCheck,
  runningAttemptForUser,
  saveAnswers,
  settleExpiredAttempts,
  startAttempt,
  type AttemptRecord,
} from "@/modules/free-learning/knowledge-check.repository";
import { listAuditForEntity } from "@/modules/platform/audit/repository";
import { createAssessmentBank, deleteAssessmentBank } from "../helpers/assessment-bank";
import { createAdminUser, createCertificateUser } from "../helpers/certificates-db";
import { completeProfile, deleteTestUser } from "../helpers/identity-db";

/*
 * The Free Assessment Check (Milestone 14 Phase 4, reshaped 2026-09-30) against
 * the REAL test database: ONE size, 200 questions, refused honestly while the
 * reviewed bank holds fewer; a fresh random draw of the whole bank for every
 * attempt; ten a page without the answers; a 3-hour limit the SERVER enforces
 * (started_at + 3 h, derived — an injected clock proves it): a late save is
 * refused and an expired attempt is scored as it stands; one running attempt per
 * person; a pass at 60 % with a derived grade (Charlie / Bravo / Alpha);
 * results issued before the change keep their old size and 70 % mark and get no
 * grade. The 260-question bank is a fixture, removed afterwards.
 */

const prisma = getPrisma();
const SLUG = `t-kc-${Date.now().toString(36)}`;
let admin: { id: string; email: string };
let holder: { id: string; email: string; name: string };
let other: { id: string; email: string; name: string };
let bankIds: string[] = [];

/** Every fixture question's correct option is A (position 1). `n` right answers, then `wrong` wrong ones. */
function answersFor(attempt: AttemptRecord, right: number, wrong = 0): Record<string, number> {
  const a: Record<string, number> = {};
  attempt.questionIds.forEach((id, i) => {
    if (i < right) a[id] = 1;
    else if (i < right + wrong) a[id] = 2;
  });
  return a;
}

/** Drop any running (unfinished) attempt of the person, so a test starts from a clean slate. */
async function clearRunning(userId: string) {
  const running = await prisma.knowledgeCheckAttempt.findMany({ where: { userId, finishedAt: null }, select: { id: true } });
  await prisma.knowledgeCheckAttempt.deleteMany({ where: { id: { in: running.map((r) => r.id) } } });
}

/** Start, answer `right` correctly, finish now. */
async function finishedWith(userId: string, right: number): Promise<AttemptRecord> {
  await clearRunning(userId);
  const attempt = await withTransaction((tx) => startAttempt(tx, { userId, size: 200 }));
  if (right > 0) await withTransaction((tx) => saveAnswers(tx, { attemptId: attempt.id, userId, answers: answersFor(attempt, right) }));
  return withTransaction((tx) => finishAttempt(tx, { attemptId: attempt.id, userId }));
}

beforeAll(async () => {
  admin = await createAdminUser("m14-kc-admin");
  holder = await createCertificateUser({ prefix: "m14-kc-holder", legalName: "Kay Checker" });
  await completeProfile(holder.id, { legalName: "Kay Checker" });
  other = await createCertificateUser({ prefix: "m14-kc-other", legalName: "Olly Other" });
});

afterAll(async () => {
  for (const userId of [holder.id, other.id, admin.id]) {
    const attempts = await prisma.knowledgeCheckAttempt.findMany({ where: { userId }, select: { id: true } });
    await prisma.auditLog.deleteMany({ where: { entityType: "knowledge_check_attempt", entityId: { in: attempts.map((a) => a.id) } } });
    await prisma.knowledgeCheckAttempt.deleteMany({ where: { userId } });
  }
  await deleteAssessmentBank(SLUG);
  await deleteTestUser(holder.email);
  await deleteTestUser(other.email);
  await deleteTestUser(admin.email);
  await disconnectPrisma();
});

describe("the size and the bank", () => {
  it("only 200 is accepted, and a check is refused honestly until 200 reviewed questions exist", async () => {
    const before = await bankSize();
    for (const bad of [50, 100, 60, 0, 201]) {
      await expect(withTransaction((tx) => startAttempt(tx, { userId: holder.id, size: bad as never }))).rejects.toMatchObject({ reason: "invalid_size" });
    }
    // The test database holds fewer than 200 reviewed questions until the fixture below is loaded.
    if (before < 200) {
      await expect(withTransaction((tx) => startAttempt(tx, { userId: holder.id, size: 200 }))).rejects.toSatisfy((e) => e instanceof KnowledgeCheckError && e.reason === "bank_too_small");
    }
    const bank = await createAssessmentBank({ slug: SLUG, position: 92000, title: "KC Topic" });
    bankIds = bank.questionIds;
    expect(await bankSize()).toBe(before + bankIds.length);
    expect(await getAttemptForUser("00000000-0000-4000-8000-000000000000", holder.id)).toBeNull();
    expect(await listAttemptsForUser(holder.id)).toEqual([]); // the refused starts left nothing behind
  });
});

describe("the attempt", () => {
  it("serves 200 distinct reviewed questions, ten a page without answers; answers save for served questions only", async () => {
    await clearRunning(holder.id);
    const attempt = await withTransaction((tx) => startAttempt(tx, { userId: holder.id, size: 200 }));
    expect(attempt.size).toBe(200);
    expect(attempt.questionIds).toHaveLength(200);
    expect(new Set(attempt.questionIds).size).toBe(200);
    expect(attempt.questionIds.every((id) => bankIds.includes(id))).toBe(true);
    expect(attempt.finishedAt).toBeNull();
    const page = await attemptPage(attempt, 1);
    expect([page.pages, page.from, page.to, page.questions.length]).toEqual([20, 1, 10, 10]);
    expect(JSON.stringify(page)).not.toContain("isCorrect");
    expect(page.questions[0]!.number).toBe(1);
    expect((await attemptPage(attempt, 99)).page).toBe(20);

    const served = page.questions[0]!.id;
    const saved = await withTransaction((tx) => saveAnswers(tx, { attemptId: attempt.id, userId: holder.id, answers: { [served]: 3, "00000000-0000-4000-8000-000000000000": 1, [page.questions[1]!.id]: 9 } }));
    expect(saved.answers).toEqual({ [served]: 3 });
    expect((await attemptPage(saved, 1)).questions[0]!.chosen).toBe(3);
    // Another person cannot see it.
    expect(await getAttemptForUser(attempt.id, admin.id)).toBeNull();
  });

  it("every attempt draws a FRESH random set from the whole bank: two attempts of one person, and of two people, differ", async () => {
    const first = await finishedWith(holder.id, 0);
    await clearRunning(holder.id);
    const second = await withTransaction((tx) => startAttempt(tx, { userId: holder.id, size: 200 }));
    const third = await withTransaction((tx) => startAttempt(tx, { userId: other.id, size: 200 }));
    expect(second.id).not.toBe(first.id);
    expect(second.questionIds).not.toEqual(first.questionIds);
    expect(third.questionIds).not.toEqual(second.questionIds);
    // A different SET, not just a different order: the bank holds 260, so 200 drawn twice overlap by far less than all 200.
    expect(new Set(second.questionIds).size).toBe(200);
    const shared = second.questionIds.filter((id) => new Set(first.questionIds).has(id)).length;
    expect(shared).toBeLessThan(200);
    // Across a dozen or so draws the whole bank is reachable (every one of the 260 appears).
    const seen = new Set<string>([...first.questionIds, ...second.questionIds, ...third.questionIds]);
    for (let i = 0; i < 10; i += 1) {
      await clearRunning(other.id);
      const draw = await withTransaction((tx) => startAttempt(tx, { userId: other.id, size: 200 }));
      draw.questionIds.forEach((id) => seen.add(id));
    }
    expect(seen.size).toBe(bankIds.length);
    await clearRunning(other.id);
  });

  it("finishing scores the attempt, passes at 60 % with a grade, snapshots the name, mints a KC id that /verify resolves, audits, and is idempotent", async () => {
    await clearRunning(holder.id);
    const attempt = await withTransaction((tx) => startAttempt(tx, { userId: holder.id, size: 200 }));
    // 130 right (65 %), the rest wrong.
    await withTransaction((tx) => saveAnswers(tx, { attemptId: attempt.id, userId: holder.id, answers: answersFor(attempt, 130, 70) }));
    const finished = await withTransaction((tx) => finishAttempt(tx, { attemptId: attempt.id, userId: holder.id }));
    expect(finished.score).toBe(130);
    expect(finished.passed).toBe(true);
    expect(finished.holderName).toBe("Kay Checker");
    expect(finished.publicId).toMatch(/^KC-\d{4}-[23456789A-HJKMNP-Z]{4}-[23456789A-HJKMNP-Z]{4}$/);
    expect(finished.finishedAt).toBeInstanceOf(Date);

    const again = await withTransaction((tx) => finishAttempt(tx, { attemptId: attempt.id, userId: holder.id }));
    expect(again.publicId).toBe(finished.publicId);
    await expect(withTransaction((tx) => saveAnswers(tx, { attemptId: attempt.id, userId: holder.id, answers: {} }))).rejects.toMatchObject({ reason: "already_finished" });

    const view = await findResultByPublicId(finished.publicId!.toLowerCase());
    expect(view).toMatchObject({ publicId: finished.publicId, holderName: "Kay Checker", size: 200, score: 130, percent: 65, passed: true, grade: "charlie" });
    expect(await findResultByPublicId("KC-2026-2222-2222")).toBeNull();

    const audit = await listAuditForEntity(prisma, "knowledge_check_attempt", attempt.id);
    expect(audit.map((a) => a.action)).toEqual(["knowledge_check.finished"]);
    expect(audit[0]!.after).toMatchObject({ size: 200, score: 130, passed: true, publicId: finished.publicId });

    const mine = await listAttemptsForUser(holder.id);
    expect(mine[0]!.id).toBe(attempt.id); // newest first
  });

  it("the pass mark is 60 % and each grade band starts where the founder says: 119 fails; 120 Charlie; 142 Bravo; 162 Alpha", async () => {
    const cases: [number, boolean, string | null][] = [
      [119, false, null],
      [120, true, "charlie"],
      [141, true, "charlie"],
      [142, true, "bravo"],
      [161, true, "bravo"],
      [162, true, "alpha"],
      [200, true, "alpha"],
    ];
    for (const [right, expectPassed, expectGrade] of cases) {
      const done = await finishedWith(holder.id, right);
      expect([right, done.passed]).toEqual([right, expectPassed]);
      expect([right, (await findResultByPublicId(done.publicId!))?.grade]).toEqual([right, expectGrade]);
    }
  });

  it("a failing score is not a pass, has no grade and still gets an ID", async () => {
    const finished = await finishedWith(holder.id, 0);
    expect(finished.score).toBe(0);
    expect(finished.passed).toBe(false);
    expect(finished.publicId).toBeTruthy();
    expect(await findResultByPublicId(finished.publicId!)).toMatchObject({ passed: false, grade: null, status: "not_passed", expiresOn: null });
  });
});

describe("the 3-hour limit is the server's (injected clock)", () => {
  it("deadline = started_at + 3 h: a save just before it works; a save at it is refused and writes nothing", async () => {
    await clearRunning(holder.id);
    const attempt = await withTransaction((tx) => startAttempt(tx, { userId: holder.id, size: 200 }));
    const deadline = attemptDeadline(attempt.startedAt);
    expect(deadline.getTime() - attempt.startedAt.getTime()).toBe(ASSESSMENT_TIME_LIMIT_MS);
    const [q1, q2] = attempt.questionIds as [string, string];

    const justBefore = new Date(deadline.getTime() - 1);
    const ok = await withTransaction((tx) => saveAnswers(tx, { attemptId: attempt.id, userId: holder.id, answers: { [q1]: 1 }, now: justBefore }));
    expect(ok.answers).toEqual({ [q1]: 1 });

    await expect(withTransaction((tx) => saveAnswers(tx, { attemptId: attempt.id, userId: holder.id, answers: { [q2]: 1 }, now: deadline }))).rejects.toMatchObject({ reason: "time_expired" });
    const stored = (await getAttemptForUser(attempt.id, holder.id))!;
    expect(stored.answers).toEqual({ [q1]: 1 }); // the refused save wrote nothing
    expect(stored.finishedAt).toBeNull(); // the refusal alone does not finish it — the caller settles
  });

  it("an expired attempt is scored as it stands: unanswered = wrong, finished AT the deadline (never later), audited", async () => {
    await clearRunning(holder.id);
    const attempt = await withTransaction((tx) => startAttempt(tx, { userId: holder.id, size: 200 }));
    await withTransaction((tx) => saveAnswers(tx, { attemptId: attempt.id, userId: holder.id, answers: answersFor(attempt, 125) })); // 125 right, 75 unanswered
    const deadline = attemptDeadline(attempt.startedAt);
    const muchLater = new Date(deadline.getTime() + 5 * 3_600_000);

    const finished = await withTransaction((tx) => finishAttempt(tx, { attemptId: attempt.id, userId: holder.id, now: muchLater }));
    expect(finished.score).toBe(125);
    expect(finished.passed).toBe(true); // 62.5 % ≥ 60 %
    expect(finished.finishedAt!.getTime()).toBe(deadline.getTime());
    const view = (await findResultByPublicId(finished.publicId!, prisma, muchLater))!;
    expect(view.timeTakenMs).toBe(ASSESSMENT_TIME_LIMIT_MS); // exactly three hours, never more
    expect(view.grade).toBe("charlie"); // 62 %
    expect((await listAuditForEntity(prisma, "knowledge_check_attempt", attempt.id)).map((a) => a.action)).toEqual(["knowledge_check.finished"]);
  });

  it("settleExpiredAttempts (the lazy read-time expiry) finishes only attempts whose 3 hours are up — nothing scheduled", async () => {
    await clearRunning(holder.id);
    const attempt = await withTransaction((tx) => startAttempt(tx, { userId: holder.id, size: 200 }));
    await withTransaction((tx) => saveAnswers(tx, { attemptId: attempt.id, userId: holder.id, answers: answersFor(attempt, 100, 20) })); // 100 right of 200 = 50 %
    const deadline = attemptDeadline(attempt.startedAt);

    // Still within the time: nothing happens, the running attempt is returned.
    expect(await settleExpiredAttempts(holder.id, new Date(deadline.getTime() - 1000))).toBe(0);
    expect((await runningAttemptForUser(holder.id, new Date(deadline.getTime() - 1000)))?.id).toBe(attempt.id);

    // Time up: scored as it stands, exactly once.
    expect(await settleExpiredAttempts(holder.id, new Date(deadline.getTime() + 1000))).toBe(1);
    expect(await settleExpiredAttempts(holder.id, new Date(deadline.getTime() + 2000))).toBe(0);
    const done = (await getAttemptForUser(attempt.id, holder.id))!;
    expect(done).toMatchObject({ score: 100, passed: false });
    expect(done.finishedAt!.getTime()).toBe(deadline.getTime());
    expect(done.publicId).toBeTruthy();
    expect(await runningAttemptForUser(holder.id, new Date(deadline.getTime() + 3000))).toBeNull();
  });

  it("starting again after the time is up settles the old attempt and opens a NEW one", async () => {
    await clearRunning(holder.id);
    const old = await withTransaction((tx) => startAttempt(tx, { userId: holder.id, size: 200 }));
    const later = new Date(attemptDeadline(old.startedAt).getTime() + 60_000);
    const fresh = await withTransaction((tx) => startAttempt(tx, { userId: holder.id, size: 200, now: later }));
    expect(fresh.id).not.toBe(old.id);
    expect((await getAttemptForUser(old.id, holder.id))!.finishedAt).not.toBeNull();
    await clearRunning(holder.id);
  });
});

describe("one running attempt per person", () => {
  it("starting again returns the running attempt — same id, same questions, answers kept; nothing else is created", async () => {
    await clearRunning(holder.id);
    const first = await withTransaction((tx) => startAttempt(tx, { userId: holder.id, size: 200 }));
    await withTransaction((tx) => saveAnswers(tx, { attemptId: first.id, userId: holder.id, answers: answersFor(first, 3) }));
    const again = await withTransaction((tx) => startAttempt(tx, { userId: holder.id, size: 200 }));
    expect(again.id).toBe(first.id);
    expect(again.questionIds).toEqual(first.questionIds);
    expect(Object.keys(again.answers)).toHaveLength(3);
    expect(await prisma.knowledgeCheckAttempt.count({ where: { userId: holder.id, finishedAt: null } })).toBe(1);
    expect((await runningAttemptForUser(holder.id))?.id).toBe(first.id);
    // Another person has their own.
    await clearRunning(other.id);
    const theirs = await withTransaction((tx) => startAttempt(tx, { userId: other.id, size: 200 }));
    expect(theirs.id).not.toBe(first.id);
    await clearRunning(other.id);
    await clearRunning(holder.id);
  });

  it("two simultaneous starts (two tabs) still make ONE running attempt", async () => {
    await clearRunning(other.id);
    const [a, b] = await Promise.all([withTransaction((tx) => startAttempt(tx, { userId: other.id, size: 200 })), withTransaction((tx) => startAttempt(tx, { userId: other.id, size: 200 }))]);
    expect(a.id).toBe(b.id);
    expect(await prisma.knowledgeCheckAttempt.count({ where: { userId: other.id, finishedAt: null } })).toBe(1);
    await clearRunning(other.id);
  });
});

describe("verification, the certificate, revocation and the admin list", () => {
  it("the public view carries the grade, the status and the server-measured time; expiry and revocation follow the stored columns (Q8b)", async () => {
    const finished = await finishedWith(holder.id, 200);
    const id = finished.publicId!;

    const fresh = await findResultByPublicId(id);
    expect(fresh).toMatchObject({ status: "valid", passed: true, grade: "alpha", percent: 100 });
    expect(fresh!.timeTakenMs).toBe(finished.finishedAt!.getTime() - finished.startedAt.getTime());
    expect(fresh!.expiresOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(Object.keys(fresh!).sort()).toEqual(["expiresOn", "finishedAt", "grade", "holderName", "passed", "percent", "publicId", "score", "size", "status", "timeTakenMs"]);

    // Thirteen months on, the same row reads expired — nothing is stored for it.
    expect((await findResultByPublicId(id, prisma, new Date(finished.finishedAt!.getTime() + 400 * 86_400_000)))?.status).toBe("expired");

    // An administrator's revocation (columns approved 2026-09-29) wins.
    await prisma.knowledgeCheckAttempt.update({ where: { id: finished.id }, data: { revokedAt: new Date(), revokedByUserId: admin.id, revocationReason: "Test revocation" } });
    expect((await findResultByPublicId(id))?.status).toBe("revoked");
    // The reason is internal: it never reaches the public view.
    expect(JSON.stringify(await findResultByPublicId(id))).not.toContain("Test revocation");
  });

  // Milestone 15 Req 3: the server measures the time; the certificate is derived from the stored attempt.
  it("time taken is finished − started, both server instants; the certificate is derived, pass-only, carries the GRADE, the ID and a QR", async () => {
    await clearRunning(holder.id);
    const attempt = await withTransaction((tx) => startAttempt(tx, { userId: holder.id, size: 200 }));
    const started = new Date("2026-05-04T03:00:00.000Z");
    await prisma.knowledgeCheckAttempt.update({ where: { id: attempt.id }, data: { startedAt: started } });
    await withTransaction((tx) => saveAnswers(tx, { attemptId: attempt.id, userId: holder.id, answers: answersFor(attempt, 168, 32), now: new Date(started.getTime() + 60_000) }));
    const finishedAt = new Date(started.getTime() + (24 * 60 + 31) * 1000); // 24 min 31 s later
    const finished = await withTransaction((tx) => finishAttempt(tx, { attemptId: attempt.id, userId: holder.id, now: finishedAt }));

    const view = (await findResultByPublicId(finished.publicId!, prisma, new Date("2026-06-01T00:00:00Z")))!;
    expect(view.timeTakenMs).toBe(1_471_000);
    const cert = await achievementCertificateData(view, `https://example.test/verify/${view.publicId}`);
    expect(cert).toMatchObject({
      kind: "achievement",
      certificateId: view.publicId,
      holderName: "Kay Checker",
      subjectTitle: "Data & AI Free Assessment Check — 200 questions",
      scoreLabel: "168 of 200 · 84%",
      grade: { name: "Alpha", band: "81–100 %" },
      timeTaken: "00:24:31",
      issuedOn: "4 May 2026",
      validUntil: "4 May 2027",
      verifyUrl: `https://example.test/verify/${view.publicId}`,
    });
    expect(cert.qrSvg.startsWith("<svg")).toBe(true);
    expect(JSON.stringify(cert)).not.toMatch(/@example\.test\b(?!\/verify)/); // no email anywhere in the certificate data

    // A failed result has no certificate.
    const failed = await finishedWith(holder.id, 0);
    await expect(achievementCertificateData((await findResultByPublicId(failed.publicId!))!, "https://example.test/verify/x")).rejects.toThrow(/did not pass/);
  });

  it("results issued BEFORE the change keep their old size, 70 % mark and no grade (D7): nothing is recomputed", async () => {
    await clearRunning(holder.id);
    const legacy = async (size: number, score: number, passedFlag: boolean, publicId: string) => {
      const ids = bankIds.slice(0, size);
      const startedAt = new Date("2026-03-01T03:00:00Z");
      return prisma.knowledgeCheckAttempt.create({
        data: { userId: holder.id, size, questionIds: ids, answers: {}, score, passed: passedFlag, publicId, holderName: "Kay Checker", startedAt, finishedAt: new Date(startedAt.getTime() + 20 * 60_000) },
      });
    };
    const old50 = await legacy(50, 44, true, generateKnowledgeCheckId(2026)); // 88 % — would be Alpha under the new rules, but it is a 50-question result
    const old100Fail = await legacy(100, 68, false, generateKnowledgeCheckId(2026)); // 68 % — failed at 70 %; would pass at 60 %, but the stored decision stands
    const old100 = await legacy(100, 70, true, generateKnowledgeCheckId(2026));

    const v50 = (await findResultByPublicId(old50.publicId!))!;
    expect(v50).toMatchObject({ size: 50, score: 44, percent: 88, passed: true, grade: null, status: "valid" });
    const vFail = (await findResultByPublicId(old100Fail.publicId!))!;
    expect(vFail).toMatchObject({ size: 100, passed: false, grade: null, status: "not_passed", expiresOn: null });
    expect((await findResultByPublicId(old100.publicId!))!.grade).toBeNull();

    // Its certificate prints as issued: no grade, its own size.
    const cert = await achievementCertificateData(v50, "https://example.test/verify/x");
    expect(cert.grade).toBeUndefined();
    expect(cert.subjectTitle).toBe("Data & AI Free Assessment Check — 50 questions");
    expect(cert.scoreLabel).toBe("44 of 50 · 88%");

    // The admin list shows the old result with no grade, and the grade filter leaves it out.
    const [row] = await listPassedResultsForAdmin({ publicId: old50.publicId! });
    expect(row).toMatchObject({ size: 50, grade: null, status: "valid" });
    const alphaIds = (await listPassedResultsForAdmin({ grade: "alpha", limit: 200 })).map((r) => r.publicId);
    expect(alphaIds).not.toContain(old50.publicId);
    await prisma.knowledgeCheckAttempt.deleteMany({ where: { id: { in: [old50.id, old100Fail.id, old100.id] } } });
  });

  it("revokeKnowledgeCheck: reason required, pass-only, audited with the reason, permanent; the admin list shows the state, the grade and the email; the grade filter narrows", async () => {
    const alpha = await finishedWith(holder.id, 190);
    const charlie = await finishedWith(holder.id, 125);
    const publicId = alpha.publicId!;

    for (const bad of ["", "  ", "ab", "x".repeat(501), "bad\u0000reason"]) {
      await expect(withTransaction((tx) => revokeKnowledgeCheck(tx, { publicId, adminUserId: admin.id, reason: bad }))).rejects.toMatchObject({ reason: "invalid_reason" });
    }
    await expect(withTransaction((tx) => revokeKnowledgeCheck(tx, { publicId: "KC-2026-2222-2222", adminUserId: admin.id, reason: "Issued in error" }))).rejects.toMatchObject({ reason: "not_found" });
    expect((await findResultByPublicId(publicId))?.status).toBe("valid"); // nothing changed by the refusals

    // Before revoking: grade column and filter.
    const [listedAlpha] = await listPassedResultsForAdmin({ publicId });
    expect(listedAlpha).toMatchObject({ publicId, grade: "alpha", score: 190, percent: 95 });
    const alphaList = (await listPassedResultsForAdmin({ grade: "alpha", limit: 200 })).map((r) => r.publicId);
    expect(alphaList).toContain(publicId);
    expect(alphaList).not.toContain(charlie.publicId);
    const charlieList = (await listPassedResultsForAdmin({ grade: "charlie", limit: 200 })).map((r) => r.publicId);
    expect(charlieList).toContain(charlie.publicId);
    expect(charlieList).not.toContain(publicId);
    expect((await listPassedResultsForAdmin({ grade: "bravo", limit: 200 })).map((r) => r.publicId)).not.toContain(publicId);

    const done = await withTransaction((tx) => revokeKnowledgeCheck(tx, { publicId: publicId.toLowerCase(), adminUserId: admin.id, reason: "  Issued   in error " }));
    expect(done).toEqual({ attemptId: alpha.id, publicId });
    const row = await prisma.knowledgeCheckAttempt.findUniqueOrThrow({ where: { id: alpha.id }, select: { revokedAt: true, revokedByUserId: true, revocationReason: true } });
    expect(row).toMatchObject({ revokedByUserId: admin.id, revocationReason: "Issued in error" });
    expect(row.revokedAt).toBeInstanceOf(Date);
    expect((await findResultByPublicId(publicId))?.status).toBe("revoked");
    await expect(withTransaction((tx) => revokeKnowledgeCheck(tx, { publicId, adminUserId: admin.id, reason: "Again" }))).rejects.toMatchObject({ reason: "already_revoked" });

    const audit = await listAuditForEntity(prisma, "knowledge_check_attempt", alpha.id);
    expect(audit.map((a) => a.action)).toContain("knowledge_check.revoked");
    expect(audit.find((a) => a.action === "knowledge_check.revoked")).toMatchObject({ actorUserId: admin.id, reason: "Issued in error" });

    const [listed] = await listPassedResultsForAdmin({ publicId });
    expect(listed).toMatchObject({ publicId, status: "revoked", grade: "alpha", email: holder.email, revocationReason: "Issued in error" });
    expect(await listPassedResultsForAdmin({ publicId: "not-an-id" })).toEqual([]);

    // A result that did not pass has nothing to revoke.
    const failed = await finishedWith(holder.id, 0);
    await expect(withTransaction((tx) => revokeKnowledgeCheck(tx, { publicId: failed.publicId!, adminUserId: admin.id, reason: "Nothing to revoke" }))).rejects.toMatchObject({ reason: "not_passed" });
  });
});

describe("deleting your own results", () => {
  // Founder, 2026-09-28: the person deletes their OWN finished results. There is no cancel of a running test.
  it("deleteFinishedAttempts: own finished result deleted with an audit record; a running test, someone else's and a non-uuid are refused", async () => {
    const finished = await finishedWith(holder.id, 0);
    await clearRunning(holder.id);
    const running = await withTransaction((tx) => startAttempt(tx, { userId: holder.id, size: 200 }));

    // Someone else cannot delete it; a running test and junk are refused.
    const wrong = await withTransaction((tx) => deleteFinishedAttempts(tx, { userId: admin.id, attemptIds: [finished.id] }));
    expect(wrong).toEqual({ deleted: 0, refused: 1 });
    const mixed = await withTransaction((tx) => deleteFinishedAttempts(tx, { userId: holder.id, attemptIds: [running.id, "not-a-uuid", finished.id] }));
    expect(mixed).toEqual({ deleted: 1, refused: 2 });
    expect(await getAttemptForUser(finished.id, holder.id)).toBeNull();
    expect(await getAttemptForUser(running.id, holder.id)).not.toBeNull();
    expect(await findResultByPublicId(finished.publicId!)).toBeNull(); // the verify link stops working — the point of deleting
    const audit = await listAuditForEntity(prisma, "knowledge_check_attempt", finished.id);
    expect(audit.map((a) => a.action)).toContain("knowledge_check.deleted");
    expect(audit.find((a) => a.action === "knowledge_check.deleted")?.before).toMatchObject({ publicId: finished.publicId, size: 200 });
    await clearRunning(holder.id);
  });
});
