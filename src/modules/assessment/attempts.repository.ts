import type { Db, Tx } from "@/db/prisma";
import { getPrisma, withTransaction } from "@/db/prisma";
import { isUuid } from "@/modules/catalogue/offerings/repository";
import { writeAudit } from "@/modules/platform/audit/repository";
import { ADMIN_PAGE_SIZE, MIN_PRIVATE_ROLE_QUESTIONS, OPTIONS_PER_QUESTION, ORG_QUESTION_CAP, QUESTIONS_PER_PAGE, RESULTS_EXPORT_LIMIT, ROLE_TEST_SIZE, ROLE_TEST_TIME_LIMIT_MS } from "./constants";
import { AssessmentError } from "./errors";
import { attemptDeadline, categoryBreakdown, type CategoryScore, isExpired, percentOf, selectQuestionIds } from "./rules";

export { AssessmentError } from "./errors";

/*
 * Role tests — a person's attempt at a role's test (CR-2026-10-01-1711), the
 * same shape as the Free Assessment Check (`knowledge-check.repository.ts`):
 * up to 100 questions drawn fresh for every attempt, ten a page WITHOUT the
 * correct answers, a 90-minute limit the SERVER enforces (deadline =
 * `started_at` + 90 min, derived — no column; an injectable `now` proves it):
 * saving after it is refused (`time_expired`) and an attempt read after its
 * deadline is scored as it stands (unanswered = wrong), capped at the
 * deadline, lazily — there is no scheduled job. ONE running test per person
 * per role + organisation (a transaction-scoped advisory lock, no table or
 * column): starting again returns it. Shared mode (Prepare for Interview) draws
 * from the REVIEWED shared bank; organisation mode (Interview Screening) =
 * ALL the organisation's approved (reviewed) questions for the role, up to 20,
 * plus shared reviewed questions to make the number; the candidate must have
 * acknowledged that the result is shared with that organisation. Not a
 * credential: no pass mark, no grade, no public ID.
 */

export {
  ROLE_TEST_SIZE,
  ROLE_TEST_TIME_LIMIT_MS,
  ORG_QUESTION_CAP,
  MIN_PRIVATE_ROLE_QUESTIONS,
  OPTIONS_PER_QUESTION,
  QUESTIONS_PER_PAGE,
} from "./constants";
export { attemptDeadline, categoryBreakdown, isExpired, percentOf } from "./rules";

export type AttemptRecord = {
  id: string;
  userId: string;
  roleId: string;
  /** Set for an organisation's screening test; null for Prepare for Interview. */
  organisationId: string | null;
  size: number;
  questionIds: string[];
  answers: Record<string, number>;
  score: number | null;
  startedAt: Date;
  finishedAt: Date | null;
  sharedWithOrganisation: boolean;
  /** Pages (1-based) whose results the person has viewed mid-test — their answers are locked. Interview practice only. */
  viewedPages: number[];
};

/** Reserved key inside the `answers` JSON (question ids are UUIDs, so it can never collide): the pages whose results were viewed.
 *  Stored beside the answers so no schema change is needed (CR-2026-10-03-2251). */
const VIEWED_KEY = "_viewedPages";

/** An interview-practice test (no organisation) has NO time limit; an organisation's screening test keeps its 90 minutes. */
const isTimed = (a: { organisationId: string | null }): boolean => a.organisationId !== null;

function packAnswers(answers: Record<string, number>, viewedPages: readonly number[]): Record<string, number | number[]> {
  return viewedPages.length > 0 ? { ...answers, [VIEWED_KEY]: [...new Set(viewedPages)].sort((a, b) => a - b) } : { ...answers };
}

const select = { id: true, userId: true, roleId: true, organisationId: true, size: true, questionIds: true, answers: true, score: true, startedAt: true, finishedAt: true, sharedWithOrganisation: true } as const;

function toRecord(r: { id: string; userId: string; roleId: string; organisationId: string | null; size: number; questionIds: unknown; answers: unknown; score: number | null; startedAt: Date; finishedAt: Date | null; sharedWithOrganisation: boolean }): AttemptRecord {
  const raw: Record<string, unknown> = r.answers && typeof r.answers === "object" && !Array.isArray(r.answers) ? (r.answers as Record<string, unknown>) : {};
  const viewed = raw[VIEWED_KEY];
  return {
    ...r,
    questionIds: Array.isArray(r.questionIds) ? (r.questionIds as string[]) : [],
    answers: Object.fromEntries(Object.entries(raw).filter(([k, v]) => k !== VIEWED_KEY && typeof v === "number")) as Record<string, number>,
    viewedPages: Array.isArray(viewed) ? viewed.filter((n): n is number => Number.isInteger(n) && n >= 1) : [],
  };
}

/** Serialises one person's start/settle work so two tabs can never open two running tests of the same
 *  role + organisation (a transaction-scoped advisory lock on the user id — released at commit). */
async function lockUserAttempts(tx: Tx, userId: string): Promise<void> {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`role-attempts:${userId}`}))`;
}

/** Finishes, as it stands, every unfinished attempt of `userId` whose deadline has passed. */
async function settleOpenAttempts(tx: Tx, userId: string, now: Date): Promise<void> {
  const open = await tx.roleTestAttempt.findMany({ where: { userId, finishedAt: null, organisationId: { not: null } }, select: { id: true, startedAt: true } });
  for (const a of open) if (isExpired(a.startedAt, now)) await finishRoleAttempt(tx, { attemptId: a.id, userId, now });
}

/** Lazy expiry: scores, as it stands, every unfinished ORGANISATION attempt of the person whose 90 minutes are up (interview practice has no time limit). Idempotent; returns how many were finished. */
export async function settleExpiredRoleAttempts(userId: string, now: Date = new Date()): Promise<number> {
  if (!isUuid(userId)) return 0;
  const cutoff = new Date(now.getTime() - ROLE_TEST_TIME_LIMIT_MS);
  const due = await getPrisma().roleTestAttempt.findMany({ where: { userId, finishedAt: null, organisationId: { not: null }, startedAt: { lte: cutoff } }, select: { id: true } });
  for (const { id } of due) await withTransaction((tx) => finishRoleAttempt(tx, { attemptId: id, userId, now }));
  return due.length;
}

/** The same lazy expiry for the candidates of one organisation, so its results list is complete. */
async function settleExpiredForOrganisation(organisationId: string, now: Date): Promise<void> {
  const cutoff = new Date(now.getTime() - ROLE_TEST_TIME_LIMIT_MS);
  const due = await getPrisma().roleTestAttempt.findMany({ where: { organisationId, finishedAt: null, startedAt: { lte: cutoff } }, select: { id: true, userId: true } });
  for (const { id, userId } of due) await withTransaction((tx) => finishRoleAttempt(tx, { attemptId: id, userId, now }));
}

/** The person's one RUNNING test for this role (+ organisation), after settling expired ones; null when none. */
export async function runningRoleAttemptForUser(userId: string, roleId: string, organisationId?: string | null, now: Date = new Date()): Promise<AttemptRecord | null> {
  if (!isUuid(userId) || !isUuid(roleId)) return null;
  await settleExpiredRoleAttempts(userId, now);
  const row = await getPrisma().roleTestAttempt.findFirst({ where: { userId, roleId, organisationId: organisationId ?? null, finishedAt: null }, orderBy: { startedAt: "desc" }, select });
  return row ? toRecord(row) : null;
}

/** Start a role test, or return the person's running one for the same role + organisation.
 *  Refusals (`AssessmentError.reason`): `organisation_ack_required` (an organisation test without
 *  `acknowledgedSharing`), `role_unavailable` (missing, unpublished, not offered, the wrong kind for this
 *  test, or an unpublished organisation), `bank_too_small` (nothing to draw, or a private role below 10
 *  approved questions). Size = min(100, questions available to this test). `now` is injectable. */
export async function startRoleAttempt(tx: Tx, input: { userId: string; roleId: string; organisationId?: string | null; acknowledgedSharing?: boolean; now?: Date }): Promise<AttemptRecord> {
  const now = input.now ?? new Date();
  const organisationId = input.organisationId ?? null;
  if (!isUuid(input.roleId) || (organisationId !== null && !isUuid(organisationId))) throw new AssessmentError("role_unavailable", "That role is not available.");
  await lockUserAttempts(tx, input.userId);
  await settleOpenAttempts(tx, input.userId, now);
  const running = await tx.roleTestAttempt.findFirst({ where: { userId: input.userId, roleId: input.roleId, organisationId, finishedAt: null }, orderBy: { startedAt: "desc" }, select });
  if (running) return toRecord(running);

  if (organisationId !== null && input.acknowledgedSharing !== true) {
    throw new AssessmentError("organisation_ack_required", "The candidate must acknowledge that the result is shared with the organisation.");
  }
  const role = await tx.assessmentRole.findUnique({ where: { id: input.roleId }, select: { id: true, published: true, organisationId: true } });
  if (!role || !role.published) throw new AssessmentError("role_unavailable", "That role is not available.");

  let ownIds: string[] = [];
  let sharedIds: string[] = [];
  if (organisationId === null) {
    if (role.organisationId !== null) throw new AssessmentError("role_unavailable", "That role is only tested through its organisation.");
    sharedIds = (await tx.roleQuestion.findMany({ where: { roleId: role.id, organisationId: null, status: "reviewed" }, select: { id: true }, orderBy: { id: "asc" } })).map((q) => q.id);
  } else {
    const org = await tx.organisation.findUnique({ where: { id: organisationId }, select: { id: true, published: true } });
    const offered = org ? (await tx.organisationRole.count({ where: { organisationId, roleId: role.id } })) > 0 : false;
    if (!org || !org.published || !offered || (role.organisationId !== null && role.organisationId !== organisationId)) throw new AssessmentError("role_unavailable", "That role is not available from this organisation.");
    ownIds = (await tx.roleQuestion.findMany({ where: { roleId: role.id, organisationId, status: "reviewed" }, select: { id: true }, orderBy: { id: "asc" } })).map((q) => q.id);
    if (role.organisationId !== null && ownIds.length < MIN_PRIVATE_ROLE_QUESTIONS) throw new AssessmentError("bank_too_small", `A private role needs at least ${MIN_PRIVATE_ROLE_QUESTIONS} approved questions; it has ${ownIds.length}.`);
    if (role.organisationId === null) sharedIds = (await tx.roleQuestion.findMany({ where: { roleId: role.id, organisationId: null, status: "reviewed" }, select: { id: true }, orderBy: { id: "asc" } })).map((q) => q.id);
  }
  const usable = Math.min(ownIds.length, ORG_QUESTION_CAP) + sharedIds.length;
  if (usable === 0) throw new AssessmentError("bank_too_small", "There are no approved questions for this test yet.");
  const size = Math.min(ROLE_TEST_SIZE, usable);
  const questionIds = selectQuestionIds({ organisationQuestionIds: ownIds, sharedQuestionIds: sharedIds, size, cap: ORG_QUESTION_CAP });
  const row = await tx.roleTestAttempt.create({
    data: { userId: input.userId, roleId: role.id, organisationId, size: questionIds.length, questionIds, answers: {}, sharedWithOrganisation: organisationId !== null, startedAt: now },
    select,
  });
  return toRecord(row);
}

export async function getRoleAttemptForUser(attemptId: string, userId: string, db: Db = getPrisma()): Promise<AttemptRecord | null> {
  if (!isUuid(attemptId) || !isUuid(userId)) return null;
  const row = await db.roleTestAttempt.findFirst({ where: { id: attemptId, userId }, select });
  return row ? toRecord(row) : null;
}

export type AttemptQuestion = {
  id: string;
  number: number;
  category: string;
  stem: string;
  options: { position: number; text: string }[];
  chosen: number | null;
  /** Set ONLY on a page whose results the person asked to see (interview practice): the correct option and the model answer. */
  revealed: RoleResultQuestion | null;
};
export type AttemptPage = { page: number; pages: number; from: number; to: number; answered: number; /** This page's answers are locked and its results are shown. */ viewed: boolean; questions: AttemptQuestion[] };

/** The page (1-based) a question number (1-based) is on. */
export const pageOfNumber = (n: number): number => Math.floor((n - 1) / QUESTIONS_PER_PAGE) + 1;

/** The page to open when the person returns: the first with an unanswered question that is not locked (a viewed page stays as it is);
 *  when nothing editable is left unanswered, the last page that is not locked (or the last page when every page was viewed). */
export function firstUnansweredPage(attempt: Pick<AttemptRecord, "questionIds" | "answers" | "viewedPages">): number {
  const pages = Math.max(1, Math.ceil(attempt.questionIds.length / QUESTIONS_PER_PAGE));
  const i = attempt.questionIds.findIndex((id, idx) => attempt.answers[id] === undefined && !attempt.viewedPages.includes(pageOfNumber(idx + 1)));
  if (i !== -1) return pageOfNumber(i + 1);
  for (let p = pages; p >= 1; p -= 1) if (!attempt.viewedPages.includes(p)) return p;
  return pages;
}

/** One page of an attempt's questions (ten), with the saved answers, WITHOUT the correct options or the model answers. */
export async function attemptPage(attempt: AttemptRecord, page: number, db: Db = getPrisma()): Promise<AttemptPage> {
  const pages = Math.max(1, Math.ceil(attempt.questionIds.length / QUESTIONS_PER_PAGE));
  const current = Math.min(Math.max(1, Math.floor(page) || 1), pages);
  const ids = attempt.questionIds.slice((current - 1) * QUESTIONS_PER_PAGE, current * QUESTIONS_PER_PAGE);
  // Results are only ever shown on an interview-practice page the person explicitly viewed; an organisation's test never reveals.
  const viewed = attempt.organisationId === null && attempt.viewedPages.includes(current);
  const rows = await db.roleQuestion.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      category: true,
      stem: true,
      ...(viewed ? { modelAnswer: true } : {}),
      options: { orderBy: { position: "asc" }, select: { position: true, text: true, ...(viewed ? { isCorrect: true } : {}) } },
    },
  });
  const byId = new Map(rows.map((r) => [r.id, r]));
  const questions = ids.flatMap((id, i): AttemptQuestion[] => {
    const r = byId.get(id);
    if (!r) return [];
    const number = (current - 1) * QUESTIONS_PER_PAGE + i + 1;
    const chosen = attempt.answers[id] ?? null;
    let revealed: RoleResultQuestion | null = null;
    if (viewed) {
      const withKey = r as unknown as { modelAnswer: string; options: { position: number; text: string; isCorrect: boolean }[] };
      const correctPos = withKey.options.find((o) => o.isCorrect)?.position;
      revealed = { number, category: r.category, stem: r.stem, options: withKey.options, chosen, correct: chosen !== null && chosen === correctPos, modelAnswer: withKey.modelAnswer };
    }
    return [{ id, number, category: r.category, stem: r.stem, options: r.options.map((o) => ({ position: o.position, text: o.text })), chosen, revealed }];
  });
  return { page: current, pages, from: (current - 1) * QUESTIONS_PER_PAGE + 1, to: Math.min(attempt.questionIds.length, current * QUESTIONS_PER_PAGE), answered: Object.keys(attempt.answers).length, viewed, questions };
}

/** Merge a page's answers into the attempt (only questions the attempt serves; only positions 1–5; never a question on a page whose
 *  results were viewed — those answers are locked). For an ORGANISATION test, REFUSED once the 90 minutes are up (`time_expired`) —
 *  the server, not the browser's clock, decides. Interview practice has no time limit. Nothing is written on refusal; the caller then
 *  settles the attempt (`finishRoleAttempt`). */
export async function saveRoleAnswers(tx: Tx, input: { attemptId: string; userId: string; answers: Record<string, number>; now?: Date }): Promise<AttemptRecord> {
  await lockUserAttempts(tx, input.userId); // two tabs cannot overwrite each other's read-modify-write of the answers (or drop a page lock)
  const attempt = await getRoleAttemptForUser(input.attemptId, input.userId, tx);
  if (!attempt) throw new AssessmentError("not_found", `Attempt ${input.attemptId} not found for user.`);
  if (attempt.finishedAt) throw new AssessmentError("already_finished", `Attempt ${attempt.id} is finished.`);
  if (isTimed(attempt) && isExpired(attempt.startedAt, input.now ?? new Date())) throw new AssessmentError("time_expired", `The time for attempt ${attempt.id} is up.`);
  const merged = mergeAnswers(attempt, input.answers);
  const row = await tx.roleTestAttempt.update({ where: { id: attempt.id }, data: { answers: packAnswers(merged, attempt.viewedPages) }, select });
  return toRecord(row);
}

/** The attempt's answers with `incoming` merged in — served questions only, positions 1–5, never on a viewed (locked) page. */
function mergeAnswers(attempt: AttemptRecord, incoming: Record<string, number>): Record<string, number> {
  const served = new Set(attempt.questionIds);
  const locked = new Set(attempt.questionIds.filter((_, i) => attempt.viewedPages.includes(pageOfNumber(i + 1))));
  const merged: Record<string, number> = { ...attempt.answers };
  for (const [id, pos] of Object.entries(incoming)) {
    if (served.has(id) && !locked.has(id) && Number.isInteger(pos) && pos >= 1 && pos <= OPTIONS_PER_QUESTION) merged[id] = pos;
  }
  return merged;
}

/** Interview practice: save this page's answers, then LOCK the page and show its results (`attemptPage` reveals it). The page still
 *  counts in the final score. Refusals: `not_found`, `already_finished`, `forbidden` (an organisation's test never reveals answers
 *  mid-test), `invalid_input` (no such page). Idempotent for a page already viewed. */
export async function viewRolePageResults(tx: Tx, input: { attemptId: string; userId: string; page: number; answers: Record<string, number> }): Promise<AttemptRecord> {
  await lockUserAttempts(tx, input.userId);
  const attempt = await getRoleAttemptForUser(input.attemptId, input.userId, tx);
  if (!attempt) throw new AssessmentError("not_found", `Attempt ${input.attemptId} not found for user.`);
  if (attempt.finishedAt) throw new AssessmentError("already_finished", `Attempt ${attempt.id} is finished.`);
  if (isTimed(attempt)) throw new AssessmentError("forbidden", "An organisation's test does not show results mid-test.");
  const pages = Math.max(1, Math.ceil(attempt.questionIds.length / QUESTIONS_PER_PAGE));
  if (!Number.isInteger(input.page) || input.page < 1 || input.page > pages) throw new AssessmentError("invalid_input", `Page ${input.page} does not exist.`);
  const merged = mergeAnswers(attempt, input.answers);
  const row = await tx.roleTestAttempt.update({ where: { id: attempt.id }, data: { answers: packAnswers(merged, [...attempt.viewedPages, input.page]) }, select });
  return toRecord(row);
}

/** Interview practice: the person cancels an UNFINISHED test — the attempt and its answers are deleted and no record of the result
 *  exists (only an audit line with no content). Never a finished result (`already_finished`) and never an organisation's test
 *  (`forbidden`; it is the organisation's screening). Refusals: `not_found`, `already_finished`, `forbidden`. */
export async function cancelRoleAttempt(tx: Tx, input: { attemptId: string; userId: string }): Promise<void> {
  await lockUserAttempts(tx, input.userId);
  const attempt = await getRoleAttemptForUser(input.attemptId, input.userId, tx);
  if (!attempt) throw new AssessmentError("not_found", `Attempt ${input.attemptId} not found for user.`);
  if (attempt.finishedAt) throw new AssessmentError("already_finished", "A finished result is not cancelled.");
  if (isTimed(attempt)) throw new AssessmentError("forbidden", "An organisation's screening test cannot be cancelled here.");
  await writeAudit(tx, {
    actorUserId: input.userId,
    action: "role_test.cancelled",
    entityType: "role_test_attempt",
    entityId: attempt.id,
    before: { roleId: attempt.roleId, size: attempt.size, answered: Object.keys(attempt.answers).length },
    after: null,
  });
  await tx.roleTestAttempt.delete({ where: { id: attempt.id } });
}

/** Score the attempt as it stands and audit. Idempotent. The finish instant is CAPPED at the deadline
 *  (`started_at` + 90 min), so a test scored after its time ran out reads as taking exactly 90 minutes. */
export async function finishRoleAttempt(tx: Tx, input: { attemptId: string; userId: string; now?: Date }): Promise<AttemptRecord> {
  await lockUserAttempts(tx, input.userId);
  const attempt = await getRoleAttemptForUser(input.attemptId, input.userId, tx);
  if (!attempt) throw new AssessmentError("not_found", `Attempt ${input.attemptId} not found for user.`);
  if (attempt.finishedAt) return attempt;
  const requested = input.now ?? new Date();
  const deadline = attemptDeadline(attempt.startedAt);
  // Only an organisation's timed test is capped at its deadline; interview practice has no deadline.
  const finishedAt = isTimed(attempt) && requested.getTime() > deadline.getTime() ? deadline : requested;
  const correct = await tx.roleQuestionOption.findMany({ where: { questionId: { in: attempt.questionIds }, isCorrect: true }, select: { questionId: true, position: true } });
  const correctBy = new Map(correct.map((c) => [c.questionId, c.position]));
  const score = attempt.questionIds.filter((id) => attempt.answers[id] !== undefined && attempt.answers[id] === correctBy.get(id)).length;
  const row = await tx.roleTestAttempt.update({ where: { id: attempt.id }, data: { score, finishedAt }, select });
  await writeAudit(tx, {
    actorUserId: input.userId,
    action: "role_test.finished",
    entityType: "role_test_attempt",
    entityId: attempt.id,
    after: { roleId: attempt.roleId, organisationId: attempt.organisationId, size: attempt.size, score },
  });
  return toRecord(row);
}

export type RoleResultQuestion = {
  number: number;
  category: string;
  stem: string;
  options: { position: number; text: string; isCorrect: boolean }[];
  /** The position the person chose; null when unanswered. */
  chosen: number | null;
  correct: boolean;
  modelAnswer: string;
};

export type RoleResultView = {
  score: number;
  size: number;
  /** Whole-number percentage, rounded DOWN. */
  percent: number;
  /** Finish − start, in milliseconds (never more than 90 minutes). null for interview practice — it has no time limit and "time taken" is not shown. */
  timeTakenMs: number | null;
  breakdown: CategoryScore[];
  questions: RoleResultQuestion[];
};

/** The result with every question, the correct option and the MODEL ANSWER — ONLY for a finished attempt
 *  (`AssessmentError("not_finished")` otherwise, so answers can never leak from a running test).
 *  Questions are shown as they are now; a question since deleted is skipped. */
export async function roleResultView(attempt: AttemptRecord, db: Db = getPrisma()): Promise<RoleResultView> {
  if (!attempt.finishedAt || attempt.score === null) throw new AssessmentError("not_finished", `Attempt ${attempt.id} is not finished.`);
  const rows = await db.roleQuestion.findMany({
    where: { id: { in: attempt.questionIds } },
    select: { id: true, category: true, stem: true, modelAnswer: true, options: { orderBy: { position: "asc" }, select: { position: true, text: true, isCorrect: true } } },
  });
  const byId = new Map(rows.map((r) => [r.id, r]));
  const questions = attempt.questionIds.flatMap((id, i): RoleResultQuestion[] => {
    const r = byId.get(id);
    if (!r) return [];
    const chosen = attempt.answers[id] ?? null;
    const correctPos = r.options.find((o) => o.isCorrect)?.position;
    return [{ number: i + 1, category: r.category, stem: r.stem, options: r.options, chosen, correct: chosen !== null && chosen === correctPos, modelAnswer: r.modelAnswer }];
  });
  return {
    score: attempt.score,
    size: attempt.size,
    percent: percentOf(attempt.score, attempt.size),
    timeTakenMs: isTimed(attempt) ? Math.max(0, attempt.finishedAt.getTime() - attempt.startedAt.getTime()) : null,
    breakdown: categoryBreakdown(questions.map((q) => ({ category: q.category, correct: q.correct }))),
    questions,
  };
}

export type RoleAttemptSummary = AttemptRecord & {
  roleName: string;
  roleSlug: string;
  organisationName: string | null;
  organisationSlug: string | null;
  /** null while running. */
  percent: number | null;
  /** null while running, and always null for interview practice (no time limit). */
  timeTakenMs: number | null;
};

/** The person's role tests, newest started first, optionally for one role. Settles expired ones first. */
export async function listRoleAttemptsForUser(userId: string, opts: { roleId?: string; now?: Date } = {}, db: Db = getPrisma()): Promise<RoleAttemptSummary[]> {
  if (!isUuid(userId) || (opts.roleId !== undefined && !isUuid(opts.roleId))) return [];
  await settleExpiredRoleAttempts(userId, opts.now ?? new Date());
  const rows = await db.roleTestAttempt.findMany({
    where: { userId, ...(opts.roleId ? { roleId: opts.roleId } : {}) },
    orderBy: { startedAt: "desc" },
    select: { ...select, role: { select: { name: true, slug: true } }, organisation: { select: { name: true, slug: true } } },
  });
  return rows.map((r) => {
    const { role, organisation, ...rest } = r;
    const rec = toRecord(rest);
    return {
      ...rec,
      roleName: role.name,
      roleSlug: role.slug,
      organisationName: organisation?.name ?? null,
      organisationSlug: organisation?.slug ?? null,
      percent: rec.score === null ? null : percentOf(rec.score, rec.size),
      timeTakenMs: rec.finishedAt && isTimed(rec) ? Math.max(0, rec.finishedAt.getTime() - rec.startedAt.getTime()) : null,
    };
  });
}

export type OrganisationResultRow = {
  attemptId: string;
  candidateName: string;
  candidateEmail: string;
  roleId: string;
  roleName: string;
  score: number;
  size: number;
  percent: number;
  finishedAt: Date;
  timeTakenMs: number;
};

const resultSelect = { id: true, roleId: true, size: true, score: true, startedAt: true, finishedAt: true, role: { select: { name: true } }, user: { select: { name: true, email: true } } } as const;

function toResultRow(r: { id: string; roleId: string; size: number; score: number | null; startedAt: Date; finishedAt: Date | null; role: { name: string }; user: { name: string; email: string } }): OrganisationResultRow[] {
  if (r.score === null || !r.finishedAt) return [];
  return [{ attemptId: r.id, candidateName: r.user.name, candidateEmail: r.user.email, roleId: r.roleId, roleName: r.role.name, score: r.score, size: r.size, percent: percentOf(r.score, r.size), finishedAt: r.finishedAt, timeTakenMs: Math.max(0, r.finishedAt.getTime() - r.startedAt.getTime()) }];
}

export type OrganisationResultsPage = { total: number; page: number; pages: number; rows: OrganisationResultRow[] };

/** Finished results of THIS organisation's own screening tests whose candidate acknowledged sharing
 *  (`shared_with_organisation`), newest first, ADMIN_PAGE_SIZE a page; optionally for one role. */
export async function listResultsForOrganisation(organisationId: string, opts: { roleId?: string; page?: number; now?: Date } = {}, db: Db = getPrisma()): Promise<OrganisationResultsPage> {
  if (!isUuid(organisationId) || (opts.roleId !== undefined && !isUuid(opts.roleId))) return { total: 0, page: 1, pages: 1, rows: [] };
  await settleExpiredForOrganisation(organisationId, opts.now ?? new Date());
  const where = { organisationId, sharedWithOrganisation: true, finishedAt: { not: null }, ...(opts.roleId ? { roleId: opts.roleId } : {}) };
  const total = await db.roleTestAttempt.count({ where });
  const pages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));
  const page = Math.min(Math.max(1, Math.floor(opts.page ?? 1) || 1), pages);
  const rows = await db.roleTestAttempt.findMany({ where, orderBy: [{ finishedAt: "desc" }, { id: "asc" }], skip: (page - 1) * ADMIN_PAGE_SIZE, take: ADMIN_PAGE_SIZE, select: resultSelect });
  return { total, page, pages, rows: rows.flatMap(toResultRow) };
}

/** All such results (for a CSV export), newest first, at most RESULTS_EXPORT_LIMIT. */
export async function listAllResultsForOrganisation(organisationId: string, opts: { roleId?: string; now?: Date } = {}, db: Db = getPrisma()): Promise<OrganisationResultRow[]> {
  if (!isUuid(organisationId) || (opts.roleId !== undefined && !isUuid(opts.roleId))) return [];
  await settleExpiredForOrganisation(organisationId, opts.now ?? new Date());
  const rows = await db.roleTestAttempt.findMany({
    where: { organisationId, sharedWithOrganisation: true, finishedAt: { not: null }, ...(opts.roleId ? { roleId: opts.roleId } : {}) },
    orderBy: [{ finishedAt: "desc" }, { id: "asc" }],
    take: RESULTS_EXPORT_LIMIT,
    select: resultSelect,
  });
  return rows.flatMap(toResultRow);
}

/** A person deletes one of their OWN finished results — never a running test and never an organisation's
 *  screening result (the organisation holds that). Audited with the result's facts. Refusals: `not_found`,
 *  `not_finished`, `forbidden`. */
export async function deleteOwnRoleResult(tx: Tx, input: { userId: string; attemptId: string }): Promise<void> {
  const attempt = await getRoleAttemptForUser(input.attemptId, input.userId, tx);
  if (!attempt) throw new AssessmentError("not_found", `Result ${input.attemptId} not found for user.`);
  if (!attempt.finishedAt) throw new AssessmentError("not_finished", "A running test cannot be deleted.");
  if (attempt.organisationId !== null) throw new AssessmentError("forbidden", "A result shared with an organisation cannot be deleted here.");
  await writeAudit(tx, {
    actorUserId: input.userId,
    action: "role_test.deleted",
    entityType: "role_test_attempt",
    entityId: attempt.id,
    before: { roleId: attempt.roleId, size: attempt.size, score: attempt.score, finishedAt: attempt.finishedAt.toISOString() },
    after: null,
  });
  await tx.roleTestAttempt.delete({ where: { id: attempt.id } });
}
