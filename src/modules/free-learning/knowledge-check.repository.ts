import { randomInt } from "node:crypto";
import type { Db, Tx } from "@/db/prisma";
import { getPrisma } from "@/db/prisma";
import { isUuid } from "@/modules/catalogue/offerings/repository";
import { ID_ALPHABET } from "@/modules/certificates/constants";
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
    readonly reason: "bank_too_small" | "invalid_size" | "not_found" | "already_finished" | "not_finished",
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

export type PublicKnowledgeCheckView = { publicId: string; holderName: string; size: number; score: number; percent: number; passed: boolean; finishedAt: Date };

/** What /verify shows for a Knowledge Check ID: the result, never the answers. */
export async function findResultByPublicId(publicId: string, db: Db = getPrisma()): Promise<PublicKnowledgeCheckView | null> {
  const id = publicId.trim().toUpperCase();
  if (!KNOWLEDGE_CHECK_ID_RE.test(id)) return null;
  const r = await db.knowledgeCheckAttempt.findUnique({ where: { publicId: id }, select });
  if (!r || !r.finishedAt || r.score === null || r.passed === null) return null;
  return { publicId: id, holderName: r.holderName ?? "Account holder", size: r.size, score: r.score, percent: Math.round((r.score * 100) / r.size), passed: r.passed, finishedAt: r.finishedAt };
}
