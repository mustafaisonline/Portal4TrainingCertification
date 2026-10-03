import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { disconnectPrisma, getPrisma, withTransaction } from "@/db/prisma";
import { ORG_QUESTION_CAP, ROLE_TEST_SIZE, ROLE_TEST_TIME_LIMIT_MS } from "@/modules/assessment/constants";
import {
  attemptPage,
  cancelRoleAttempt,
  firstUnansweredPage,
  AssessmentError,
  deleteOwnRoleResult,
  finishRoleAttempt,
  getRoleAttemptForUser,
  listAllResultsForOrganisation,
  listResultsForOrganisation,
  listRoleAttemptsForUser,
  roleResultView,
  runningRoleAttemptForUser,
  saveRoleAnswers,
  settleExpiredRoleAttempts,
  startRoleAttempt,
  viewRolePageResults,
  type AttemptRecord,
} from "@/modules/assessment/attempts.repository";
import { createPrivateRole } from "@/modules/assessment/organisations.repository";
import { listAuditForEntity } from "@/modules/platform/audit/repository";
import { addQuestions, createOrganisationFixture, createSharedRole, deleteRoleFixtures } from "../helpers/assessment-roles-db";
import { createAdminUser, createCertificateUser } from "../helpers/certificates-db";
import { deleteTestUser } from "../helpers/identity-db";

/*
 * Role tests against the REAL test database (CR-2026-10-01-1711): a fresh random
 * draw of up to 100 per attempt; ONE running test per person per role +
 * organisation (also under concurrency); the organisation rule (all of its
 * approved questions, up to 20, plus shared fill; the acknowledgement; never
 * outside its tests; pending questions never served); ten a page without the
 * answers; the 90-minute limit the SERVER enforces (injected clock); scoring and
 * the per-category breakdown; the result view shows model answers only when
 * finished; results reach an organisation only when shared; audit rows.
 * Every fixture is removed afterwards.
 */

const prisma = getPrisma();
const roleIds: string[] = [];
const orgIds: string[] = [];
let candidate: { id: string; email: string; name: string };
let other: { id: string; email: string; name: string };
let admin: { id: string; email: string };

let role: { roleId: string; reviewedIds: string[] }; // 130 reviewed shared
let org: { organisationId: string; slug: string };
let ownIds: string[]; // 12 approved organisation questions on `role`
let otherOrg: { organisationId: string; slug: string };

/** Every fixture question's correct option is A (position 1). */
function answersFor(attempt: AttemptRecord, right: number, wrong = 0): Record<string, number> {
  const a: Record<string, number> = {};
  attempt.questionIds.forEach((id, i) => {
    if (i < right) a[id] = 1;
    else if (i < right + wrong) a[id] = 2;
  });
  return a;
}

async function clearAttempts(userId: string) {
  await prisma.roleTestAttempt.deleteMany({ where: { userId } });
}

const start = (userId: string, roleId: string, extra: { organisationId?: string; acknowledgedSharing?: boolean; now?: Date } = {}) => withTransaction((tx) => startRoleAttempt(tx, { userId, roleId, ...extra }));

beforeAll(async () => {
  admin = await createAdminUser("rt-admin");
  candidate = await createCertificateUser({ prefix: "rt-cand", legalName: "Casey Candidate" });
  other = await createCertificateUser({ prefix: "rt-other", legalName: "Olly Other" });
  const r = await createSharedRole({ slugPrefix: "t-rt", reviewed: 130 });
  role = r;
  roleIds.push(r.roleId);
  org = await createOrganisationFixture({ slugPrefix: "t-rt-org", roleIds: [r.roleId] });
  otherOrg = await createOrganisationFixture({ slugPrefix: "t-rt-other", roleIds: [r.roleId] });
  orgIds.push(org.organisationId, otherOrg.organisationId);
  ownIds = await addQuestions({ roleId: r.roleId, organisationId: org.organisationId, count: 12, status: "reviewed" });
  // Questions that must NEVER be served: this organisation's pending ones and ANOTHER organisation's approved ones.
  await addQuestions({ roleId: r.roleId, organisationId: org.organisationId, count: 4, status: "pending", tag: "pend" });
  await addQuestions({ roleId: r.roleId, organisationId: otherOrg.organisationId, count: 6, status: "reviewed", tag: "oth" });
  await addQuestions({ roleId: r.roleId, count: 5, status: "draft", tag: "dr" });
});

afterAll(async () => {
  for (const u of [candidate.id, other.id]) await prisma.roleTestAttempt.deleteMany({ where: { userId: u } });
  await deleteRoleFixtures({ roleIds, organisationIds: orgIds });
  await deleteTestUser(candidate.email);
  await deleteTestUser(other.email);
  await deleteTestUser(admin.email);
  await disconnectPrisma();
});

describe("Prepare for Interview — the shared bank", () => {
  it("serves 100 distinct REVIEWED shared questions; fresh draws differ; start twice returns the running test", async () => {
    await clearAttempts(candidate.id);
    const a = await start(candidate.id, role.roleId);
    expect(a.size).toBe(ROLE_TEST_SIZE);
    expect(a.questionIds).toHaveLength(100);
    expect(new Set(a.questionIds).size).toBe(100);
    expect(a.questionIds.every((id) => role.reviewedIds.includes(id))).toBe(true); // no organisation, pending, other-org or draft question
    expect(a.organisationId).toBeNull();
    expect(a.sharedWithOrganisation).toBe(false);
    expect(a.finishedAt).toBeNull();

    const again = await start(candidate.id, role.roleId);
    expect(again.id).toBe(a.id);
    expect((await runningRoleAttemptForUser(candidate.id, role.roleId))!.id).toBe(a.id);
    expect(await prisma.roleTestAttempt.count({ where: { userId: candidate.id } })).toBe(1);

    await withTransaction((tx) => finishRoleAttempt(tx, { attemptId: a.id, userId: candidate.id }));
    const b = await start(candidate.id, role.roleId);
    expect(b.id).not.toBe(a.id);
    expect(b.questionIds).not.toEqual(a.questionIds);
    // A different SET, not just an order: 100 of 130 drawn twice share far less than all 100.
    expect(b.questionIds.filter((id) => a.questionIds.includes(id)).length).toBeLessThan(100);
  });

  it("two simultaneous starts (two tabs) open ONE running test", async () => {
    await clearAttempts(candidate.id);
    const [x, y] = await Promise.all([start(candidate.id, role.roleId), start(candidate.id, role.roleId)]);
    expect(x.id).toBe(y.id);
    expect(await prisma.roleTestAttempt.count({ where: { userId: candidate.id, finishedAt: null } })).toBe(1);
  });

  it("one running test per ROLE: a second role runs alongside", async () => {
    await clearAttempts(candidate.id);
    const second = await createSharedRole({ slugPrefix: "t-rt2", reviewed: 15 });
    roleIds.push(second.roleId);
    const a = await start(candidate.id, role.roleId);
    const b = await start(candidate.id, second.roleId);
    expect(b.id).not.toBe(a.id);
    expect(b.size).toBe(15); // min(100, available)
    expect((await runningRoleAttemptForUser(candidate.id, second.roleId))!.id).toBe(b.id);
  });

  it("refuses honestly: unknown, unpublished, private-without-organisation, and empty roles", async () => {
    await clearAttempts(candidate.id);
    await expect(start(candidate.id, "00000000-0000-4000-8000-000000000000")).rejects.toMatchObject({ reason: "role_unavailable" });
    await expect(start(candidate.id, "not-a-uuid")).rejects.toMatchObject({ reason: "role_unavailable" });
    const hidden = await createSharedRole({ slugPrefix: "t-rt-hid", reviewed: 12, published: false });
    const empty = await createSharedRole({ slugPrefix: "t-rt-empty", reviewed: 0 });
    roleIds.push(hidden.roleId, empty.roleId);
    await expect(start(candidate.id, hidden.roleId)).rejects.toMatchObject({ reason: "role_unavailable" });
    await expect(start(candidate.id, empty.roleId)).rejects.toSatisfy((e) => e instanceof AssessmentError && e.reason === "bank_too_small");
    const priv = await withTransaction((tx) => createPrivateRole(tx, org.organisationId, { name: "Own Role", description: "x" }, admin.id));
    await expect(start(candidate.id, priv.id)).rejects.toMatchObject({ reason: "role_unavailable" });
    expect(await prisma.roleTestAttempt.count({ where: { userId: candidate.id } })).toBe(0); // refusals left nothing behind
  });
});

describe("Organisation screening", () => {
  it("is refused without the acknowledgement; with it the test holds ALL the organisation's approved questions + shared fill, and nothing of another organisation, pending or draft", async () => {
    await clearAttempts(candidate.id);
    await expect(start(candidate.id, role.roleId, { organisationId: org.organisationId })).rejects.toMatchObject({ reason: "organisation_ack_required" });
    await expect(start(candidate.id, role.roleId, { organisationId: org.organisationId, acknowledgedSharing: false })).rejects.toMatchObject({ reason: "organisation_ack_required" });
    expect(await prisma.roleTestAttempt.count({ where: { userId: candidate.id } })).toBe(0);

    const seen = new Set<string>();
    for (let i = 0; i < 4; i += 1) {
      const a = await start(candidate.id, role.roleId, { organisationId: org.organisationId, acknowledgedSharing: true });
      expect(a.organisationId).toBe(org.organisationId);
      expect(a.sharedWithOrganisation).toBe(true);
      expect(a.size).toBe(100);
      expect(new Set(a.questionIds).size).toBe(100);
      expect(ownIds.every((id) => a.questionIds.includes(id))).toBe(true); // the organisation's questions ALWAYS appear
      const shared = a.questionIds.filter((id) => !ownIds.includes(id));
      expect(shared).toHaveLength(88);
      expect(shared.every((id) => role.reviewedIds.includes(id))).toBe(true);
      shared.forEach((id) => seen.add(id));
      await withTransaction((tx) => finishRoleAttempt(tx, { attemptId: a.id, userId: candidate.id }));
    }
    expect(seen.size).toBeGreaterThan(88); // fresh draws of the shared fill
  });

  it("an organisation's questions never appear in the public (shared-mode) test", async () => {
    await clearAttempts(other.id);
    for (let i = 0; i < 3; i += 1) {
      const a = await start(other.id, role.roleId);
      expect(a.questionIds.some((id) => ownIds.includes(id))).toBe(false);
      await withTransaction((tx) => finishRoleAttempt(tx, { attemptId: a.id, userId: other.id }));
    }
  });

  it("more than 20 approved questions: exactly 20 of them (random subset), the rest shared", async () => {
    const big = await createSharedRole({ slugPrefix: "t-rt-big", reviewed: 150 });
    roleIds.push(big.roleId);
    await prisma.organisationRole.create({ data: { organisationId: org.organisationId, roleId: big.roleId } });
    const mine = await addQuestions({ roleId: big.roleId, organisationId: org.organisationId, count: 35, status: "reviewed" });
    await clearAttempts(candidate.id);
    const a = await start(candidate.id, big.roleId, { organisationId: org.organisationId, acknowledgedSharing: true });
    expect(a.size).toBe(100);
    expect(a.questionIds.filter((id) => mine.includes(id))).toHaveLength(ORG_QUESTION_CAP);
    await withTransaction((tx) => finishRoleAttempt(tx, { attemptId: a.id, userId: candidate.id }));
    const b = await start(candidate.id, big.roleId, { organisationId: org.organisationId, acknowledgedSharing: true });
    expect(b.questionIds.filter((id) => mine.includes(id)).sort()).not.toEqual(a.questionIds.filter((id) => mine.includes(id)).sort());
  });

  it("is unavailable when the organisation is unpublished, does not offer the role, or the role is another organisation's", async () => {
    await clearAttempts(candidate.id);
    const lone = await createOrganisationFixture({ slugPrefix: "t-rt-lone", roleIds: [] });
    orgIds.push(lone.organisationId);
    await expect(start(candidate.id, role.roleId, { organisationId: lone.organisationId, acknowledgedSharing: true })).rejects.toMatchObject({ reason: "role_unavailable" });
    await prisma.organisation.update({ where: { id: org.organisationId }, data: { published: false } });
    await expect(start(candidate.id, role.roleId, { organisationId: org.organisationId, acknowledgedSharing: true })).rejects.toMatchObject({ reason: "role_unavailable" });
    await prisma.organisation.update({ where: { id: org.organisationId }, data: { published: true } });
    const priv = await withTransaction((tx) => createPrivateRole(tx, otherOrg.organisationId, { name: "Theirs", description: "x" }, admin.id));
    await expect(start(candidate.id, priv.id, { organisationId: org.organisationId, acknowledgedSharing: true })).rejects.toMatchObject({ reason: "role_unavailable" });
  });

  it("a private role below 10 approved questions is refused (bank_too_small); with 10 it runs from the organisation's questions only", async () => {
    await clearAttempts(candidate.id);
    const priv = await withTransaction((tx) => createPrivateRole(tx, org.organisationId, { name: "Private Screening", description: "x" }, admin.id));
    roleIds.push(priv.id);
    const approved = await addQuestions({ roleId: priv.id, organisationId: org.organisationId, count: 9, status: "reviewed" });
    await expect(start(candidate.id, priv.id, { organisationId: org.organisationId, acknowledgedSharing: true })).rejects.toMatchObject({ reason: "bank_too_small" });
    approved.push(...(await addQuestions({ roleId: priv.id, organisationId: org.organisationId, count: 1, status: "reviewed" })));
    const a = await start(candidate.id, priv.id, { organisationId: org.organisationId, acknowledgedSharing: true });
    expect(a.size).toBe(10);
    expect([...a.questionIds].sort()).toEqual([...approved].sort());
  });
});

describe("the running test, page by page", () => {
  it("serves ten a page WITHOUT the correct answers or model answers; saves answers for served questions only", async () => {
    await clearAttempts(candidate.id);
    const a = await start(candidate.id, role.roleId);
    const page = await attemptPage(a, 1);
    expect([page.pages, page.from, page.to, page.questions.length]).toEqual([10, 1, 10, 10]);
    const json = JSON.stringify(page);
    expect(json).not.toContain("isCorrect");
    expect(json).not.toContain("modelAnswer");
    expect(json).not.toContain("model answer");
    expect(page.questions[0]!.options).toHaveLength(5);
    expect((await attemptPage(a, 99)).page).toBe(10);

    const served = page.questions[0]!.id;
    const saved = await withTransaction((tx) => saveRoleAnswers(tx, { attemptId: a.id, userId: candidate.id, answers: { [served]: 3, "00000000-0000-4000-8000-000000000000": 1, [page.questions[1]!.id]: 9 } }));
    expect(saved.answers).toEqual({ [served]: 3 });
    expect((await attemptPage(saved, 1)).questions[0]!.chosen).toBe(3);
    expect(await getRoleAttemptForUser(a.id, other.id)).toBeNull(); // not another person's
    await expect(withTransaction((tx) => saveRoleAnswers(tx, { attemptId: a.id, userId: other.id, answers: {} }))).rejects.toMatchObject({ reason: "not_found" });
  });

  it("the result view is refused while running", async () => {
    const running = (await runningRoleAttemptForUser(candidate.id, role.roleId))!;
    await expect(roleResultView(running)).rejects.toMatchObject({ reason: "not_finished" });
  });
});

describe("the 90-minute limit of an ORGANISATION screening test (injected clock) — interview practice has none (CR-2026-10-03-2251)", () => {
  const startOrg = (now?: Date) => start(candidate.id, role.roleId, { organisationId: org.organisationId, acknowledgedSharing: true, ...(now ? { now } : {}) });

  it("a save is refused AT the deadline; one ms earlier is accepted; an expired attempt is scored as it stands and finished AT the deadline", async () => {
    await clearAttempts(candidate.id);
    const t0 = new Date("2026-10-01T10:00:00.000Z");
    const a = await startOrg(t0);
    expect(a.startedAt.toISOString()).toBe(t0.toISOString());
    const first = a.questionIds.slice(0, 10);
    await withTransaction((tx) => saveRoleAnswers(tx, { attemptId: a.id, userId: candidate.id, answers: Object.fromEntries(first.map((id) => [id, 1])), now: new Date(t0.getTime() + ROLE_TEST_TIME_LIMIT_MS - 1) }));
    await expect(withTransaction((tx) => saveRoleAnswers(tx, { attemptId: a.id, userId: candidate.id, answers: { [a.questionIds[10]!]: 1 }, now: new Date(t0.getTime() + ROLE_TEST_TIME_LIMIT_MS) }))).rejects.toMatchObject({ reason: "time_expired" });
    expect((await getRoleAttemptForUser(a.id, candidate.id))!.answers[a.questionIds[10]!]).toBeUndefined(); // nothing written on refusal

    const done = await withTransaction((tx) => finishRoleAttempt(tx, { attemptId: a.id, userId: candidate.id, now: new Date(t0.getTime() + 3 * 60 * 60_000) }));
    expect(done.finishedAt!.toISOString()).toBe("2026-10-01T11:30:00.000Z");
    expect(done.score).toBe(10); // the ten saved in time count; unanswered are wrong
    const view = await roleResultView(done);
    expect(view.timeTakenMs).toBe(ROLE_TEST_TIME_LIMIT_MS);
    // Finished: nothing more can be saved.
    await expect(withTransaction((tx) => saveRoleAnswers(tx, { attemptId: a.id, userId: candidate.id, answers: {}, now: t0 }))).rejects.toMatchObject({ reason: "already_finished" });
  });

  it("lazy expiry settles an overdue test when the person returns, and starting again opens a NEW test", async () => {
    await clearAttempts(candidate.id);
    const old = new Date(Date.now() - 2 * 60 * 60_000);
    const a = await startOrg(old);
    expect(await settleExpiredRoleAttempts(candidate.id)).toBe(1);
    expect(await settleExpiredRoleAttempts(candidate.id)).toBe(0); // idempotent
    const settled = (await getRoleAttemptForUser(a.id, candidate.id))!;
    expect(settled.finishedAt!.getTime()).toBe(old.getTime() + ROLE_TEST_TIME_LIMIT_MS);
    expect(settled.score).toBe(0);
    expect(await runningRoleAttemptForUser(candidate.id, role.roleId, org.organisationId)).toBeNull();
    const fresh = await startOrg();
    expect(fresh.id).not.toBe(a.id);

    // An overdue test is also settled by starting (not returned as "running").
    await clearAttempts(candidate.id);
    const stale = await startOrg(old);
    const next = await startOrg();
    expect(next.id).not.toBe(stale.id);
    expect((await getRoleAttemptForUser(stale.id, candidate.id))!.finishedAt).not.toBeNull();
  });
});

describe("Prepare for Interview — no timer, save & exit, view a page's results, cancel (CR-2026-10-03-2251)", () => {
  it("never expires: an old running test stays open, is not settled, and can still be saved and finished (time taken is null)", async () => {
    await clearAttempts(candidate.id);
    const old = new Date(Date.now() - 30 * 24 * 60 * 60_000); // a month ago
    const a = await start(candidate.id, role.roleId, { now: old });
    expect(await settleExpiredRoleAttempts(candidate.id)).toBe(0);
    expect((await runningRoleAttemptForUser(candidate.id, role.roleId))!.id).toBe(a.id);
    expect((await start(candidate.id, role.roleId)).id).toBe(a.id); // starting again returns the SAME running test
    await withTransaction((tx) => saveRoleAnswers(tx, { attemptId: a.id, userId: candidate.id, answers: answersFor(a, 5) }));
    const done = await withTransaction((tx) => finishRoleAttempt(tx, { attemptId: a.id, userId: candidate.id }));
    expect(done.finishedAt!.getTime()).toBeGreaterThan(old.getTime() + ROLE_TEST_TIME_LIMIT_MS); // not capped at a deadline
    expect((await roleResultView(done)).timeTakenMs).toBeNull();
    expect((await listRoleAttemptsForUser(candidate.id))[0]!.timeTakenMs).toBeNull();
  });

  it("opens on the first page with an unanswered question", async () => {
    await clearAttempts(candidate.id);
    const a = await start(candidate.id, role.roleId);
    expect(firstUnansweredPage(a)).toBe(1);
    const saved = await withTransaction((tx) => saveRoleAnswers(tx, { attemptId: a.id, userId: candidate.id, answers: Object.fromEntries(a.questionIds.slice(0, 25).map((id) => [id, 1])) }));
    expect(firstUnansweredPage(saved)).toBe(3); // 25 answered → question 26 is on page 3
    const all = await withTransaction((tx) => saveRoleAnswers(tx, { attemptId: a.id, userId: candidate.id, answers: Object.fromEntries(a.questionIds.map((id) => [id, 1])) }));
    expect(firstUnansweredPage(all)).toBe(10);
  });

  it("resume skips a viewed (locked) page that still has unanswered questions", async () => {
    await clearAttempts(candidate.id);
    const a = await start(candidate.id, role.roleId);
    // Page 1: only 8 of 10 answered, then viewed → the 2 unanswered stay unanswered (locked). Page 2 is empty.
    const viewed = await withTransaction((tx) => viewRolePageResults(tx, { attemptId: a.id, userId: candidate.id, page: 1, answers: Object.fromEntries(a.questionIds.slice(0, 8).map((id) => [id, 1])) }));
    expect(firstUnansweredPage(viewed)).toBe(2);
    // Everything else answered: the last editable page, never the locked one.
    const done = await withTransaction((tx) => saveRoleAnswers(tx, { attemptId: a.id, userId: candidate.id, answers: Object.fromEntries(a.questionIds.slice(10).map((id) => [id, 1])) }));
    expect(firstUnansweredPage(done)).toBe(10);
    expect(firstUnansweredPage({ questionIds: a.questionIds.slice(0, 10), answers: {}, viewedPages: [1] })).toBe(1); // every page viewed → the last page
  });

  it("two tabs saving at once cannot drop a page lock or lose answers", async () => {
    await clearAttempts(candidate.id);
    const a = await start(candidate.id, role.roleId);
    const page1 = Object.fromEntries(a.questionIds.slice(0, 10).map((id) => [id, 1]));
    const page2 = Object.fromEntries(a.questionIds.slice(10, 20).map((id) => [id, 1]));
    await Promise.all([
      withTransaction((tx) => viewRolePageResults(tx, { attemptId: a.id, userId: candidate.id, page: 1, answers: page1 })),
      withTransaction((tx) => saveRoleAnswers(tx, { attemptId: a.id, userId: candidate.id, answers: page2 })),
    ]);
    const now = (await getRoleAttemptForUser(a.id, candidate.id))!;
    expect(now.viewedPages).toEqual([1]); // the lock survived, whichever transaction ran first
    expect(Object.keys(now.answers)).toHaveLength(20); // and no answer was lost
  });

  it("viewing a page's results saves it, reveals the correct answers and model answers for THAT page only, locks its answers, and still counts it in the score", async () => {
    await clearAttempts(candidate.id);
    const a = await start(candidate.id, role.roleId);
    const page1 = a.questionIds.slice(0, 10);
    const page2 = a.questionIds.slice(10, 20);
    // Before viewing: nothing is revealed.
    expect((await attemptPage(a, 1)).questions.every((q) => q.revealed === null)).toBe(true);
    expect((await attemptPage(a, 1)).viewed).toBe(false);
    // Answer page 1 (7 right, 3 wrong) and view it in one step.
    const answers = Object.fromEntries(page1.map((id, i) => [id, i < 7 ? 1 : 2]));
    const viewed = await withTransaction((tx) => viewRolePageResults(tx, { attemptId: a.id, userId: candidate.id, page: 1, answers }));
    expect(viewed.viewedPages).toEqual([1]);
    const p1 = await attemptPage(viewed, 1);
    expect(p1.viewed).toBe(true);
    expect(p1.questions.every((q) => q.revealed !== null && q.revealed.modelAnswer.includes("Fixture model answer"))).toBe(true);
    expect(p1.questions.filter((q) => q.revealed!.correct)).toHaveLength(7);
    // Page 2 is untouched: not revealed, still editable.
    const p2 = await attemptPage(viewed, 2);
    expect(p2.viewed).toBe(false);
    expect(p2.questions.every((q) => q.revealed === null)).toBe(true);
    // Locked: a later save cannot change page 1, but changes page 2 and keeps the viewed flag.
    const after = await withTransaction((tx) => saveRoleAnswers(tx, { attemptId: a.id, userId: candidate.id, answers: { ...Object.fromEntries(page1.map((id) => [id, 1])), [page2[0]!]: 1 } }));
    expect(after.answers[page1[9]!]).toBe(2); // unchanged (was wrong, stays wrong)
    expect(after.answers[page2[0]!]).toBe(1);
    expect(after.viewedPages).toEqual([1]);
    // Viewing again is idempotent; an unknown page is refused.
    expect((await withTransaction((tx) => viewRolePageResults(tx, { attemptId: a.id, userId: candidate.id, page: 1, answers: {} }))).viewedPages).toEqual([1]);
    await expect(withTransaction((tx) => viewRolePageResults(tx, { attemptId: a.id, userId: candidate.id, page: 11, answers: {} }))).rejects.toMatchObject({ reason: "invalid_input" });
    // The page still counts in the final score: 7 right on page 1 + 1 right on page 2.
    const done = await withTransaction((tx) => finishRoleAttempt(tx, { attemptId: a.id, userId: candidate.id }));
    expect(done.score).toBe(8);
    expect(done.viewedPages).toEqual([1]);
    // The reserved key never leaks into the answers the screens read.
    expect(Object.keys(done.answers).every((k) => a.questionIds.includes(k))).toBe(true);
  });

  it("an organisation's screening test never reveals answers mid-test", async () => {
    await clearAttempts(candidate.id);
    const a = await start(candidate.id, role.roleId, { organisationId: org.organisationId, acknowledgedSharing: true });
    await expect(withTransaction((tx) => viewRolePageResults(tx, { attemptId: a.id, userId: candidate.id, page: 1, answers: {} }))).rejects.toMatchObject({ reason: "forbidden" });
    expect((await attemptPage(a, 1)).questions.every((q) => q.revealed === null)).toBe(true);
    // Even a forged viewed flag in storage would not reveal: attemptPage ignores it for an organisation attempt.
    await prisma.roleTestAttempt.update({ where: { id: a.id }, data: { answers: { _viewedPages: [1] } } });
    const forged = (await getRoleAttemptForUser(a.id, candidate.id))!;
    expect((await attemptPage(forged, 1)).questions.every((q) => q.revealed === null)).toBe(true);
    await clearAttempts(candidate.id);
  });

  it("cancelling an unfinished interview test deletes it with no record of a result (one audit line, no content); never a finished result, an organisation's test, or someone else's", async () => {
    await clearAttempts(candidate.id);
    const a = await start(candidate.id, role.roleId);
    await withTransaction((tx) => saveRoleAnswers(tx, { attemptId: a.id, userId: candidate.id, answers: answersFor(a, 4) }));
    // Another person cannot cancel it.
    await expect(withTransaction((tx) => cancelRoleAttempt(tx, { attemptId: a.id, userId: other.id }))).rejects.toMatchObject({ reason: "not_found" });
    await withTransaction((tx) => cancelRoleAttempt(tx, { attemptId: a.id, userId: candidate.id }));
    expect(await prisma.roleTestAttempt.count({ where: { userId: candidate.id } })).toBe(0);
    expect(await listRoleAttemptsForUser(candidate.id)).toEqual([]);
    const audit = (await listAuditForEntity(prisma, "role_test_attempt", a.id)).filter((r) => r.action === "role_test.cancelled");
    expect(audit).toHaveLength(1);
    expect(JSON.stringify(audit[0])).not.toContain("Fixture"); // no question or answer content
    // Starting again gives a brand-new test.
    const fresh = await start(candidate.id, role.roleId);
    expect(fresh.id).not.toBe(a.id);
    // A finished result is never cancelled.
    const done = await withTransaction((tx) => finishRoleAttempt(tx, { attemptId: fresh.id, userId: candidate.id }));
    await expect(withTransaction((tx) => cancelRoleAttempt(tx, { attemptId: done.id, userId: candidate.id }))).rejects.toMatchObject({ reason: "already_finished" });
    // An organisation's screening test is not cancelled here.
    await clearAttempts(candidate.id);
    const orgAttempt = await start(candidate.id, role.roleId, { organisationId: org.organisationId, acknowledgedSharing: true });
    await expect(withTransaction((tx) => cancelRoleAttempt(tx, { attemptId: orgAttempt.id, userId: candidate.id }))).rejects.toMatchObject({ reason: "forbidden" });
    expect(await prisma.roleTestAttempt.count({ where: { id: orgAttempt.id } })).toBe(1);
    await clearAttempts(candidate.id);
  });
});

describe("scoring, breakdown and the result view", () => {
  it("scores correct answers, breaks down per category, and shows model answers once finished; finishing twice is idempotent and audited once", async () => {
    await clearAttempts(candidate.id);
    const a = await start(candidate.id, role.roleId);
    await withTransaction((tx) => saveRoleAnswers(tx, { attemptId: a.id, userId: candidate.id, answers: answersFor(a, 62, 10) }));
    const done = await withTransaction((tx) => finishRoleAttempt(tx, { attemptId: a.id, userId: candidate.id }));
    expect(done.score).toBe(62);
    const again = await withTransaction((tx) => finishRoleAttempt(tx, { attemptId: a.id, userId: candidate.id }));
    expect(again.finishedAt!.getTime()).toBe(done.finishedAt!.getTime());
    expect((await listAuditForEntity(prisma, "role_test_attempt", a.id)).filter((r) => r.action === "role_test.finished")).toHaveLength(1);

    const view = await roleResultView(done);
    expect(view).toMatchObject({ score: 62, size: 100, percent: 62 });
    expect(view.questions).toHaveLength(100);
    expect(view.questions.map((q) => q.number)).toEqual(Array.from({ length: 100 }, (_, i) => i + 1));
    expect(view.questions.filter((q) => q.correct)).toHaveLength(62);
    expect(view.questions.filter((q) => q.chosen === null)).toHaveLength(28);
    expect(view.questions[0]!.modelAnswer).toContain("Fixture model answer");
    expect(view.questions[0]!.options.filter((o) => o.isCorrect).map((o) => o.position)).toEqual([1]);
    expect(view.breakdown.reduce((n, b) => n + b.total, 0)).toBe(100);
    expect(view.breakdown.reduce((n, b) => n + b.correct, 0)).toBe(62);
    expect(view.breakdown.map((b) => b.category)).toEqual([...view.breakdown.map((b) => b.category)].sort());
    expect(view.timeTakenMs).toBeNull(); // interview practice: no time limit, no "time taken"
  });

  it("lists the person's own tests, newest first, filterable by role, with derived percent", async () => {
    await clearAttempts(candidate.id);
    const first = await start(candidate.id, role.roleId);
    await withTransaction((tx) => saveRoleAnswers(tx, { attemptId: first.id, userId: candidate.id, answers: answersFor(first, 50) }));
    await withTransaction((tx) => finishRoleAttempt(tx, { attemptId: first.id, userId: candidate.id }));
    const second = await start(candidate.id, role.roleId);
    const rows = await listRoleAttemptsForUser(candidate.id);
    expect(rows.map((r) => r.id)).toEqual([second.id, first.id]);
    expect(rows[0]).toMatchObject({ percent: null, timeTakenMs: null, organisationName: null });
    expect(rows[1]).toMatchObject({ percent: 50, score: 50 });
    expect(rows[1]!.roleName).toContain("Test role");
    expect(await listRoleAttemptsForUser(candidate.id, { roleId: "00000000-0000-4000-8000-000000000000" })).toEqual([]);
    expect(await listRoleAttemptsForUser(other.id, { roleId: role.roleId })).not.toEqual(expect.arrayContaining([expect.objectContaining({ id: first.id })]));
  });
});

describe("what an organisation sees, and deleting your own result", () => {
  it("only SHARED, finished results of its own tests — with name, email, score and time; another organisation sees none", async () => {
    await clearAttempts(candidate.id);
    await clearAttempts(other.id);
    const shared = await start(candidate.id, role.roleId, { organisationId: org.organisationId, acknowledgedSharing: true });
    await withTransaction((tx) => saveRoleAnswers(tx, { attemptId: shared.id, userId: candidate.id, answers: answersFor(shared, 40) }));
    await withTransaction((tx) => finishRoleAttempt(tx, { attemptId: shared.id, userId: candidate.id }));
    // A running one is not a result yet.
    await start(other.id, role.roleId, { organisationId: org.organisationId, acknowledgedSharing: true });
    // A finished organisation attempt whose candidate did NOT share (inserted directly — the repository always sets the flag with an organisation).
    const unshared = await prisma.roleTestAttempt.create({ data: { userId: other.id, roleId: role.roleId, organisationId: org.organisationId, size: 10, questionIds: [], answers: {}, score: 9, finishedAt: new Date(), sharedWithOrganisation: false } });
    // A Prepare-for-Interview result (no organisation) of the same role.
    const own = await start(candidate.id, role.roleId);
    await withTransaction((tx) => finishRoleAttempt(tx, { attemptId: own.id, userId: candidate.id }));

    const page = await listResultsForOrganisation(org.organisationId, { roleId: role.roleId });
    expect(page.total).toBe(1);
    expect(page.rows[0]).toMatchObject({ attemptId: shared.id, candidateName: candidate.name, candidateEmail: candidate.email, roleId: role.roleId, score: 40, size: 100, percent: 40 });
    expect(page.rows.map((r) => r.attemptId)).not.toContain(unshared.id);
    expect(page.rows[0]!.timeTakenMs).toBeGreaterThanOrEqual(0);
    expect((await listAllResultsForOrganisation(org.organisationId)).map((r) => r.attemptId)).toEqual([shared.id]);
    expect((await listResultsForOrganisation(otherOrg.organisationId)).total).toBe(0);
    expect(await listResultsForOrganisation("garbage")).toEqual({ total: 0, page: 1, pages: 1, rows: [] });
  });

  it("an organisation's results list settles overdue tests first, so it is complete", async () => {
    await clearAttempts(other.id);
    const old = new Date(Date.now() - 3 * 60 * 60_000);
    const a = await start(other.id, role.roleId, { organisationId: org.organisationId, acknowledgedSharing: true, now: old });
    const rows = (await listAllResultsForOrganisation(org.organisationId)).map((r) => r.attemptId);
    expect(rows).toContain(a.id);
  });

  it("a person deletes only their OWN finished, non-organisation results — audited", async () => {
    await clearAttempts(candidate.id);
    const own = await start(candidate.id, role.roleId);
    await expect(withTransaction((tx) => deleteOwnRoleResult(tx, { userId: candidate.id, attemptId: own.id }))).rejects.toMatchObject({ reason: "not_finished" });
    await withTransaction((tx) => finishRoleAttempt(tx, { attemptId: own.id, userId: candidate.id }));
    await expect(withTransaction((tx) => deleteOwnRoleResult(tx, { userId: other.id, attemptId: own.id }))).rejects.toMatchObject({ reason: "not_found" });
    await withTransaction((tx) => deleteOwnRoleResult(tx, { userId: candidate.id, attemptId: own.id }));
    expect(await getRoleAttemptForUser(own.id, candidate.id)).toBeNull();
    expect((await listAuditForEntity(prisma, "role_test_attempt", own.id)).map((r) => r.action)).toEqual(["role_test.finished", "role_test.deleted"]);

    const screening = await start(candidate.id, role.roleId, { organisationId: org.organisationId, acknowledgedSharing: true });
    await withTransaction((tx) => finishRoleAttempt(tx, { attemptId: screening.id, userId: candidate.id }));
    await expect(withTransaction((tx) => deleteOwnRoleResult(tx, { userId: candidate.id, attemptId: screening.id }))).rejects.toMatchObject({ reason: "forbidden" });
    expect(await getRoleAttemptForUser(screening.id, candidate.id)).not.toBeNull();
  });
});
