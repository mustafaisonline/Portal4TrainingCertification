import { randomInt } from "node:crypto";
import type { Db, Tx } from "@/db/prisma";
import { getPrisma } from "@/db/prisma";
import { isUuid } from "@/modules/catalogue/offerings/repository";
import { ID_ALPHABET } from "@/modules/certificates/constants";
import { todayIso } from "@/modules/certificates/dates";
import { initialExpiry } from "@/modules/certificates/rules";
import { writeAudit } from "@/modules/platform/audit/repository";
import { QUIZ_PAGE_SIZE } from "./quiz.repository";

/*
 * The free Knowledge Check — Milestone 14 Phase 4 (DR-03 §2.4 and §3; founder
 * decisions P2, P12). A signed-in account holder chooses 50, 100 or 200
 * questions, drawn at random from the REVIEWED questions of PUBLISHED
 * topics; answers are saved page by page; finishing scores the attempt,
 * passes it at 70 % and gives it a public ID (`KC-YYYY-XXXX-XXXX`, the
 * certificate alphabet) that /verify resolves. It is a result, NOT a
 * credential (DR-01 unchanged): it is never called a Certificate of
 * Completion and never listed as one. Unlimited retakes, no time limit.
 */

export const KNOWLEDGE_CHECK_SIZES = [50, 100, 200] as const;
export type KnowledgeCheckSize = (typeof KNOWLEDGE_CHECK_SIZES)[number];
export const KNOWLEDGE_CHECK_PASS_PERCENT = 70;
export const KNOWLEDGE_CHECK_ID_RE = /^KC-\d{4}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}$/;

export function isKnowledgeCheckSize(n: number): n is KnowledgeCheckSize {
  return (KNOWLEDGE_CHECK_SIZES as readonly number[]).includes(n);
}

/** `KC-YYYY-XXXX-XXXX`; `random` is injectable for tests. */
export function generateKnowledgeCheckId(year: number, random: (max: number) => number = randomInt): string {
  let symbols = "";
  for (let i = 0; i < 8; i += 1) symbols += ID_ALPHABET[random(ID_ALPHABET.length)];
  return `KC-${year}-${symbols.slice(0, 4)}-${symbols.slice(4)}`;
}

export function passed(score: number, size: number): boolean {
  return size > 0 && (score * 100) / size >= KNOWLEDGE_CHECK_PASS_PERCENT;
}

export class KnowledgeCheckError extends Error {
  constructor(
    readonly reason: "bank_too_small" | "invalid_size" | "not_found" | "already_finished" | "not_finished" | "invalid_reason" | "not_passed" | "already_revoked",
    message: string,
  ) {
    super(message);
    this.name = "KnowledgeCheckError";
  }
}

/** Reviewed questions of published topics — the bank a check draws from. */
export async function bankSize(db: Db = getPrisma()): Promise<number> {
  return db.topicQuestion.count({ where: { status: "reviewed", topic: { published: true } } });
}

export type AttemptRecord = {
  id: string;
  userId: string;
  size: number;
  questionIds: string[];
  answers: Record<string, number>;
  score: number | null;
  passed: boolean | null;
  publicId: string | null;
  holderName: string | null;
  startedAt: Date;
  finishedAt: Date | null;
};

const select = { id: true, userId: true, size: true, questionIds: true, answers: true, score: true, passed: true, publicId: true, holderName: true, startedAt: true, finishedAt: true } as const;

function toRecord(r: { id: string; userId: string; size: number; questionIds: unknown; answers: unknown; score: number | null; passed: boolean | null; publicId: string | null; holderName: string | null; startedAt: Date; finishedAt: Date | null }): AttemptRecord {
  return {
    ...r,
    questionIds: Array.isArray(r.questionIds) ? (r.questionIds as string[]) : [],
    answers: r.answers && typeof r.answers === "object" ? (r.answers as Record<string, number>) : {},
  };
}

/** A fresh attempt: `size` reviewed questions of published topics, shuffled
 *  with a cryptographic source. Refused honestly while the bank is smaller. */
export async function startAttempt(tx: Tx, input: { userId: string; size: number }): Promise<AttemptRecord> {
  if (!isKnowledgeCheckSize(input.size)) throw new KnowledgeCheckError("invalid_size", `Size ${input.size} is not 50, 100 or 200.`);
  const pool = await tx.topicQuestion.findMany({ where: { status: "reviewed", topic: { published: true } }, select: { id: true }, orderBy: { id: "asc" } });
  if (pool.length < input.size) throw new KnowledgeCheckError("bank_too_small", `Only ${pool.length} reviewed questions exist; ${input.size} are needed.`);
  const ids = pool.map((q) => q.id);
  for (let i = ids.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [ids[i], ids[j]] = [ids[j]!, ids[i]!];
  }
  const row = await tx.knowledgeCheckAttempt.create({ data: { userId: input.userId, size: input.size, questionIds: ids.slice(0, input.size), answers: {} }, select });
  return toRecord(row);
}

export async function getAttemptForUser(attemptId: string, userId: string, db: Db = getPrisma()): Promise<AttemptRecord | null> {
  if (!isUuid(attemptId)) return null;
  const row = await db.knowledgeCheckAttempt.findFirst({ where: { id: attemptId, userId }, select });
  return row ? toRecord(row) : null;
}

export type AttemptQuestion = { id: string; number: number; stem: string; topicTitle: string; options: { position: number; text: string }[]; chosen: number | null };
export type AttemptPage = { page: number; pages: number; from: number; to: number; answered: number; questions: AttemptQuestion[] };

/** One page of an attempt's questions (ten), with the saved answers, WITHOUT the correct options. */
export async function attemptPage(attempt: AttemptRecord, page: number, db: Db = getPrisma()): Promise<AttemptPage> {
  const pages = Math.max(1, Math.ceil(attempt.questionIds.length / QUIZ_PAGE_SIZE));
  const current = Math.min(Math.max(1, Math.floor(page) || 1), pages);
  const ids = attempt.questionIds.slice((current - 1) * QUIZ_PAGE_SIZE, current * QUIZ_PAGE_SIZE);
  const rows = await db.topicQuestion.findMany({
    where: { id: { in: ids } },
    select: { id: true, stem: true, topic: { select: { title: true } }, options: { orderBy: { position: "asc" }, select: { position: true, text: true } } },
  });
  const byId = new Map(rows.map((r) => [r.id, r]));
  const questions = ids.flatMap((id, i) => {
    const r = byId.get(id);
    if (!r) return [];
    return [{ id, number: (current - 1) * QUIZ_PAGE_SIZE + i + 1, stem: r.stem, topicTitle: r.topic.title, options: r.options, chosen: attempt.answers[id] ?? null }];
  });
  return { page: current, pages, from: (current - 1) * QUIZ_PAGE_SIZE + 1, to: Math.min(attempt.questionIds.length, current * QUIZ_PAGE_SIZE), answered: Object.keys(attempt.answers).length, questions };
}

/** Merge a page's answers into the attempt (only questions the attempt serves; only positions 1–5). */
export async function saveAnswers(tx: Tx, input: { attemptId: string; userId: string; answers: Record<string, number> }): Promise<AttemptRecord> {
  const attempt = await getAttemptForUser(input.attemptId, input.userId, tx);
  if (!attempt) throw new KnowledgeCheckError("not_found", `Attempt ${input.attemptId} not found for user.`);
  if (attempt.finishedAt) throw new KnowledgeCheckError("already_finished", `Attempt ${attempt.id} is finished.`);
  const served = new Set(attempt.questionIds);
  const merged: Record<string, number> = { ...attempt.answers };
  for (const [id, pos] of Object.entries(input.answers)) {
    if (served.has(id) && Number.isInteger(pos) && pos >= 1 && pos <= 5) merged[id] = pos;
  }
  const row = await tx.knowledgeCheckAttempt.update({ where: { id: attempt.id }, data: { answers: merged }, select });
  return toRecord(row);
}

/** Score the attempt, decide the pass, snapshot the holder's name, mint the public ID, audit. Idempotent. */
export async function finishAttempt(tx: Tx, input: { attemptId: string; userId: string; now?: Date }): Promise<AttemptRecord> {
  const attempt = await getAttemptForUser(input.attemptId, input.userId, tx);
  if (!attempt) throw new KnowledgeCheckError("not_found", `Attempt ${input.attemptId} not found for user.`);
  if (attempt.finishedAt) return attempt;
  const now = input.now ?? new Date();
  const correct = await tx.topicQuestionOption.findMany({ where: { questionId: { in: attempt.questionIds }, isCorrect: true }, select: { questionId: true, position: true } });
  const correctBy = new Map(correct.map((c) => [c.questionId, c.position]));
  const score = attempt.questionIds.filter((id) => attempt.answers[id] !== undefined && attempt.answers[id] === correctBy.get(id)).length;
  const profile = await tx.userProfile.findUnique({ where: { userId: input.userId }, select: { legalName: true, user: { select: { name: true } } } });
  const holderName = profile?.legalName?.trim() || profile?.user.name || "Account holder";
  let publicId = "";
  for (let i = 0; i < 5; i += 1) {
    publicId = generateKnowledgeCheckId(now.getUTCFullYear());
    if (!(await tx.knowledgeCheckAttempt.findUnique({ where: { publicId }, select: { id: true } }))) break;
    publicId = "";
  }
  if (!publicId) throw new Error("A unique Knowledge Check ID could not be generated.");
  const isPass = passed(score, attempt.size);
  const row = await tx.knowledgeCheckAttempt.update({ where: { id: attempt.id }, data: { score, passed: isPass, publicId, holderName, finishedAt: now }, select });
  await writeAudit(tx, {
    actorUserId: input.userId,
    action: "knowledge_check.finished",
    entityType: "knowledge_check_attempt",
    entityId: attempt.id,
    after: { size: attempt.size, score, passed: isPass, publicId },
  });
  return toRecord(row);
}

export async function listAttemptsForUser(userId: string, db: Db = getPrisma()): Promise<AttemptRecord[]> {
  const rows = await db.knowledgeCheckAttempt.findMany({ where: { userId }, orderBy: { startedAt: "desc" }, select });
  return rows.map(toRecord);
}

/** What a verifier is told about a Knowledge Check. `not_passed` has no
 *  validity at all; a pass is valid for one year from the day it was earned
 *  (Milestone 15, Q8b), unless an administrator revoked it. */
export type KnowledgeCheckStatus = "valid" | "expired" | "revoked" | "not_passed";

/** Pure. `today` is the MYT calendar date (`todayIso`); the pass date is the
 *  MYT calendar date of `finishedAt`. Revoked wins over expired (as for the
 *  Professional certificate); the last valid day is inclusive. */
export function knowledgeCheckStatus(input: { passed: boolean; finishedAt: Date; revokedAt: Date | null }, today: string): { status: KnowledgeCheckStatus; expiresOn: string | null } {
  if (!input.passed) return { status: "not_passed", expiresOn: null };
  const expiresOn = initialExpiry(todayIso(input.finishedAt));
  if (input.revokedAt) return { status: "revoked", expiresOn };
  return { status: today > expiresOn ? "expired" : "valid", expiresOn };
}

export type PublicKnowledgeCheckView = {
  publicId: string;
  holderName: string;
  size: number;
  score: number;
  percent: number;
  passed: boolean;
  finishedAt: Date;
  /** Finish − start, in milliseconds — measured by the server (Milestone 15). */
  timeTakenMs: number;
  status: KnowledgeCheckStatus;
  /** Last valid day (YYYY-MM-DD, MYT); null for a result that did not pass. */
  expiresOn: string | null;
};

/** What /verify shows for a Knowledge Check ID: the result, never the answers. */
export async function findResultByPublicId(publicId: string, db: Db = getPrisma(), now: Date = new Date()): Promise<PublicKnowledgeCheckView | null> {
  const id = publicId.trim().toUpperCase();
  if (!KNOWLEDGE_CHECK_ID_RE.test(id)) return null;
  const r = await db.knowledgeCheckAttempt.findUnique({ where: { publicId: id }, select: { ...select, revokedAt: true } });
  if (!r || !r.finishedAt || r.score === null || r.passed === null) return null;
  const { status, expiresOn } = knowledgeCheckStatus({ passed: r.passed, finishedAt: r.finishedAt, revokedAt: r.revokedAt }, todayIso(now));
  return {
    publicId: id,
    holderName: r.holderName ?? "Account holder",
    size: r.size,
    score: r.score,
    percent: Math.round((r.score * 100) / r.size),
    passed: r.passed,
    finishedAt: r.finishedAt,
    timeTakenMs: Math.max(0, r.finishedAt.getTime() - r.startedAt.getTime()),
    status,
    expiresOn,
  };
}

/* ------------------------------------------------------- administration */

const REVOKE_REASON_MIN = 3;
const REVOKE_REASON_MAX = 500;
// eslint-disable-next-line no-control-regex -- refuses control characters in a typed reason
const CONTROL_CHARS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;

/** Milestone 15 Req 3 (founder, 2026-09-29): an administrator revokes a passed
 *  result's Certificate of Achievement. Mirrors the Professional certificate:
 *  a reason (3–500 characters) is required, it is audited, it is permanent
 *  here, and the verification page then says Revoked. A result that did not
 *  pass has no certificate to revoke. */
export async function revokeKnowledgeCheck(tx: Tx, input: { publicId: string; adminUserId: string; reason: string; now?: Date }): Promise<{ attemptId: string; publicId: string }> {
  const reason = input.reason.replace(/\s+/g, " ").trim();
  if (reason.length < REVOKE_REASON_MIN || reason.length > REVOKE_REASON_MAX || CONTROL_CHARS.test(reason)) {
    throw new KnowledgeCheckError("invalid_reason", `Give a reason of ${REVOKE_REASON_MIN} to ${REVOKE_REASON_MAX} characters.`);
  }
  const id = input.publicId.trim().toUpperCase();
  const row = KNOWLEDGE_CHECK_ID_RE.test(id) ? await tx.knowledgeCheckAttempt.findUnique({ where: { publicId: id }, select: { id: true, publicId: true, passed: true, finishedAt: true, revokedAt: true } }) : null;
  if (!row || !row.finishedAt) throw new KnowledgeCheckError("not_found", `No Knowledge Check result ${input.publicId}.`);
  if (!row.passed) throw new KnowledgeCheckError("not_passed", `Result ${id} did not pass, so it has no certificate.`);
  if (row.revokedAt) throw new KnowledgeCheckError("already_revoked", `Result ${id} was revoked on ${row.revokedAt.toISOString()}.`);
  const now = input.now ?? new Date();
  await tx.knowledgeCheckAttempt.update({ where: { id: row.id }, data: { revokedAt: now, revokedByUserId: input.adminUserId, revocationReason: reason } });
  await writeAudit(tx, {
    actorUserId: input.adminUserId,
    action: "knowledge_check.revoked",
    entityType: "knowledge_check_attempt",
    entityId: row.id,
    before: { revokedAt: null },
    after: { revokedAt: now.toISOString(), publicId: id },
    reason,
  });
  return { attemptId: row.id, publicId: id };
}

export type AdminKnowledgeCheckRow = {
  attemptId: string;
  publicId: string;
  holderName: string;
  email: string;
  size: number;
  score: number;
  percent: number;
  finishedAt: Date;
  status: KnowledgeCheckStatus;
  expiresOn: string | null;
  revocationReason: string | null;
};

/** Passed results for the administrator: by exact Knowledge Check ID, or the
 *  latest. Email is shown here and never publicly. */
export async function listPassedResultsForAdmin(input: { publicId?: string; limit?: number }, db: Db = getPrisma(), now: Date = new Date()): Promise<AdminKnowledgeCheckRow[]> {
  const id = input.publicId?.trim().toUpperCase();
  if (input.publicId && !(id && KNOWLEDGE_CHECK_ID_RE.test(id))) return [];
  const rows = await db.knowledgeCheckAttempt.findMany({
    where: { passed: true, finishedAt: { not: null }, publicId: id ?? { not: null } },
    orderBy: { finishedAt: "desc" },
    take: input.limit ?? 25,
    select: { id: true, publicId: true, holderName: true, size: true, score: true, finishedAt: true, revokedAt: true, revocationReason: true, user: { select: { email: true } } },
  });
  const today = todayIso(now);
  return rows.flatMap((r) => {
    if (!r.publicId || !r.finishedAt || r.score === null) return [];
    const { status, expiresOn } = knowledgeCheckStatus({ passed: true, finishedAt: r.finishedAt, revokedAt: r.revokedAt }, today);
    return [{ attemptId: r.id, publicId: r.publicId, holderName: r.holderName ?? "Account holder", email: r.user.email, size: r.size, score: r.score, percent: Math.round((r.score * 100) / r.size), finishedAt: r.finishedAt, status, expiresOn, revocationReason: r.revocationReason }];
  });
}

/** Founder, 2026-09-28: a person may delete their OWN finished results from
 *  Free Certifications. Each deletion is audited with the result's facts
 *  (the audit log is the surviving record); the verify page for its ID then
 *  answers not-found, which is the point of deleting. A result whose
 *  document unlock was ever ordered is a commercial record and is refused;
 *  so is an unfinished attempt (it has its own Continue flow). */
export async function deleteFinishedAttempts(
  tx: Tx,
  input: { userId: string; attemptIds: string[] },
): Promise<{ deleted: number; refused: number }> {
  let deleted = 0;
  let refused = 0;
  for (const id of input.attemptIds) {
    if (!isUuid(id)) {
      refused += 1;
      continue;
    }
    const attempt = await tx.knowledgeCheckAttempt.findFirst({ where: { id, userId: input.userId }, select });
    if (!attempt || !attempt.finishedAt) {
      refused += 1;
      continue;
    }
    const order = await tx.order.findFirst({ where: { knowledgeCheckAttemptId: id }, select: { id: true } });
    if (order) {
      refused += 1;
      continue;
    }
    await writeAudit(tx, {
      actorUserId: input.userId,
      action: "knowledge_check.deleted",
      entityType: "knowledge_check_attempt",
      entityId: id,
      before: {
        publicId: attempt.publicId,
        size: attempt.size,
        score: attempt.score,
        passed: attempt.passed,
        finishedAt: attempt.finishedAt.toISOString(),
      },
      after: null,
    });
    await tx.knowledgeCheckAttempt.delete({ where: { id } });
    deleted += 1;
  }
  return { deleted, refused };
}

/** Founder, 2026-09-28: a running (unfinished) check can be cancelled by its
 *  own taker — the attempt row is deleted, audited. A finished attempt is
 *  refused here (its deletion is `deleteFinishedAttempts`, with its own
 *  rules); nothing else references an unfinished attempt. */
export async function cancelUnfinishedAttempt(tx: Tx, input: { attemptId: string; userId: string }): Promise<boolean> {
  if (!isUuid(input.attemptId)) return false;
  const attempt = await tx.knowledgeCheckAttempt.findFirst({ where: { id: input.attemptId, userId: input.userId }, select });
  if (!attempt || attempt.finishedAt) return false;
  await writeAudit(tx, {
    actorUserId: input.userId,
    action: "knowledge_check.deleted",
    entityType: "knowledge_check_attempt",
    entityId: input.attemptId,
    before: { cancelled: true, size: attempt.size, answered: Object.keys(toRecord(attempt).answers).length, startedAt: attempt.startedAt.toISOString() },
    after: null,
  });
  await tx.knowledgeCheckAttempt.delete({ where: { id: input.attemptId } });
  return true;
}
