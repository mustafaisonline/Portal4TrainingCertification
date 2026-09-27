import type { Db, Tx } from "@/db/prisma";
import { getPrisma } from "@/db/prisma";
import { isUuid } from "@/modules/catalogue/offerings/repository";
import { writeAudit } from "@/modules/platform/audit/repository";

/*
 * Topic self-check questions — Milestone 14 Phase 3 (§4 row 3; founder
 * decisions P9–P11). Every question has exactly FIVE options and exactly ONE
 * correct — enforced here on every write. Questions arrive as DRAFTS (the
 * import script); an administrator marks them REVIEWED; readers are served
 * reviewed questions only and never receive which option is correct in the
 * page — Submit asks the server, which answers and stores nothing (P11).
 */

export const QUESTION_OPTION_COUNT = 5;
export const QUIZ_PAGE_SIZE = 10;
export const STEM_MIN = 10;
export const STEM_MAX = 500;
export const OPTION_MAX = 300;
export const EXPLANATION_MAX = 600;

export type QuestionStatus = "draft" | "reviewed";

export type QuestionInput = {
  stem: string;
  /** Exactly five, in display order. */
  options: string[];
  /** Index (0–4) of the correct option. */
  correct: number;
  explanation?: string | null;
};

export class QuestionValidationError extends Error {
  constructor(
    readonly index: number,
    message: string,
  ) {
    super(`question ${index + 1}: ${message}`);
    this.name = "QuestionValidationError";
  }
}

/** Trim and check one question; throws with the position for the script's report. */
export function validateQuestion(raw: QuestionInput, index: number): Required<Pick<QuestionInput, "stem" | "options" | "correct">> & { explanation: string | null } {
  const stem = String(raw.stem ?? "").trim();
  if (stem.length < STEM_MIN || stem.length > STEM_MAX) throw new QuestionValidationError(index, `the question must be ${STEM_MIN}–${STEM_MAX} characters`);
  if (!Array.isArray(raw.options) || raw.options.length !== QUESTION_OPTION_COUNT) throw new QuestionValidationError(index, `exactly ${QUESTION_OPTION_COUNT} options are required`);
  const options = raw.options.map((o) => String(o ?? "").trim());
  if (options.some((o) => o.length === 0 || o.length > OPTION_MAX)) throw new QuestionValidationError(index, `every option must be 1–${OPTION_MAX} characters`);
  if (new Set(options.map((o) => o.toLowerCase())).size !== options.length) throw new QuestionValidationError(index, "options must be distinct");
  if (!Number.isInteger(raw.correct) || raw.correct < 0 || raw.correct >= QUESTION_OPTION_COUNT) throw new QuestionValidationError(index, `correct must be an index 0–${QUESTION_OPTION_COUNT - 1}`);
  const explanation = raw.explanation ? String(raw.explanation).trim().slice(0, EXPLANATION_MAX) : null;
  return { stem, options, correct: raw.correct, explanation: explanation || null };
}

/* ----------------------------------------------------------------- import */

export type ImportQuestionsResult = { inserted: number; draftsReplaced: number; skipped: boolean };

/**
 * Add draft questions to a topic. With `replaceDrafts`, the topic's existing
 * DRAFT questions are removed first (reviewed ones are never touched);
 * without it, a topic that already has questions is skipped. New questions
 * take positions after the highest existing one.
 */
export async function importDraftQuestions(tx: Tx, input: { topicId: string; questions: QuestionInput[]; replaceDrafts: boolean }): Promise<ImportQuestionsResult> {
  const validated = input.questions.map((q, i) => validateQuestion(q, i));
  const existing = await tx.topicQuestion.count({ where: { topicId: input.topicId } });
  let draftsReplaced = 0;
  if (existing > 0 && !input.replaceDrafts) return { inserted: 0, draftsReplaced: 0, skipped: true };
  if (input.replaceDrafts) {
    const removed = await tx.topicQuestion.deleteMany({ where: { topicId: input.topicId, status: "draft" } });
    draftsReplaced = removed.count;
  }
  const max = await tx.topicQuestion.aggregate({ where: { topicId: input.topicId }, _max: { position: true } });
  let position = max._max.position ?? 0;
  for (const q of validated) {
    position += 1;
    await tx.topicQuestion.create({
      data: {
        topicId: input.topicId,
        position,
        stem: q.stem,
        explanation: q.explanation,
        options: { create: q.options.map((text, i) => ({ position: i + 1, text, isCorrect: i === q.correct })) },
      },
    });
  }
  return { inserted: validated.length, draftsReplaced, skipped: false };
}

/* ---------------------------------------------------------------- readers */

export type ReaderQuestion = { id: string; position: number; stem: string; options: { position: number; text: string }[] };

export type ReaderQuestionPage = { total: number; page: number; pages: number; from: number; to: number; questions: ReaderQuestion[] };

/** Reviewed questions of a published topic, ten at a time, WITHOUT the answers. */
export async function listReviewedQuestionPage(topicId: string, page: number, db: Db = getPrisma()): Promise<ReaderQuestionPage> {
  const total = await db.topicQuestion.count({ where: { topicId, status: "reviewed" } });
  const pages = Math.max(1, Math.ceil(total / QUIZ_PAGE_SIZE));
  const current = Math.min(Math.max(1, Math.floor(page) || 1), pages);
  const rows = await db.topicQuestion.findMany({
    where: { topicId, status: "reviewed" },
    orderBy: { position: "asc" },
    skip: (current - 1) * QUIZ_PAGE_SIZE,
    take: QUIZ_PAGE_SIZE,
    select: { id: true, position: true, stem: true, options: { orderBy: { position: "asc" }, select: { position: true, text: true } } },
  });
  const from = total === 0 ? 0 : (current - 1) * QUIZ_PAGE_SIZE + 1;
  return { total, page: current, pages, from, to: Math.min(total, current * QUIZ_PAGE_SIZE), questions: rows };
}

export type AnswerCheck = { questionId: string; chosen: number | null; correct: boolean; correctPosition: number; explanation: string | null };

/** Mark the given answers for REVIEWED questions of the topic. Unknown or
 *  unreviewed questions are ignored; nothing is stored. */
export async function checkAnswers(topicId: string, answers: { questionId: string; optionPosition: number | null }[], db: Db = getPrisma()): Promise<AnswerCheck[]> {
  const ids = answers.map((a) => a.questionId).filter(isUuid);
  if (ids.length === 0) return [];
  const rows = await db.topicQuestion.findMany({
    where: { id: { in: ids }, topicId, status: "reviewed" },
    select: { id: true, explanation: true, options: { where: { isCorrect: true }, select: { position: true } } },
  });
  const byId = new Map(rows.map((r) => [r.id, r]));
  return answers.flatMap((a) => {
    const q = byId.get(a.questionId);
    if (!q) return [];
    const correctPosition = q.options[0]?.position ?? 0;
    return [{ questionId: a.questionId, chosen: a.optionPosition, correct: a.optionPosition === correctPosition, correctPosition, explanation: q.explanation }];
  });
}

/* ------------------------------------------------------------------ admin */

export type AdminQuestion = {
  id: string;
  position: number;
  stem: string;
  explanation: string | null;
  status: QuestionStatus;
  reviewedAt: Date | null;
  reviewedBy: { name: string } | null;
  options: { position: number; text: string; isCorrect: boolean }[];
};

export async function listQuestionsForAdmin(topicId: string, db: Db = getPrisma()): Promise<AdminQuestion[]> {
  if (!isUuid(topicId)) return [];
  return db.topicQuestion.findMany({
    where: { topicId },
    orderBy: { position: "asc" },
    select: {
      id: true, position: true, stem: true, explanation: true, status: true, reviewedAt: true,
      reviewedBy: { select: { name: true } },
      options: { orderBy: { position: "asc" }, select: { position: true, text: true, isCorrect: true } },
    },
  });
}

/** Per topic: how many questions exist and how many are reviewed. */
export async function questionCountsByTopic(db: Db = getPrisma()): Promise<Map<string, { total: number; reviewed: number }>> {
  const rows = await db.topicQuestion.groupBy({ by: ["topicId", "status"], _count: { _all: true } });
  const out = new Map<string, { total: number; reviewed: number }>();
  for (const r of rows) {
    const entry = out.get(r.topicId) ?? { total: 0, reviewed: 0 };
    entry.total += r._count._all;
    if (r.status === "reviewed") entry.reviewed += r._count._all;
    out.set(r.topicId, entry);
  }
  return out;
}

export async function setQuestionStatus(tx: Tx, input: { questionId: string; status: QuestionStatus; actorUserId: string }): Promise<AdminQuestion | null> {
  if (!isUuid(input.questionId)) return null;
  const before = await tx.topicQuestion.findUnique({ where: { id: input.questionId }, select: { status: true, topicId: true } });
  if (!before) return null;
  if (before.status !== input.status) {
    const reviewed = input.status === "reviewed";
    await tx.topicQuestion.update({
      where: { id: input.questionId },
      data: { status: input.status, reviewedByUserId: reviewed ? input.actorUserId : null, reviewedAt: reviewed ? new Date() : null },
    });
    await writeAudit(tx, {
      actorUserId: input.actorUserId,
      action: "topic_question.status_changed",
      entityType: "topic_question",
      entityId: input.questionId,
      before: { status: before.status },
      after: { status: input.status, topicId: before.topicId },
    });
  }
  const rows = await listQuestionsForAdmin(before.topicId, tx);
  return rows.find((q) => q.id === input.questionId) ?? null;
}

/** Every DRAFT question of a topic → reviewed (or every reviewed → draft); one audit row each. */
export async function setAllQuestionsStatus(tx: Tx, input: { topicId: string; status: QuestionStatus; actorUserId: string }): Promise<number> {
  if (!isUuid(input.topicId)) return 0;
  const from: QuestionStatus = input.status === "reviewed" ? "draft" : "reviewed";
  const rows = await tx.topicQuestion.findMany({ where: { topicId: input.topicId, status: from }, select: { id: true } });
  for (const r of rows) await setQuestionStatus(tx, { questionId: r.id, status: input.status, actorUserId: input.actorUserId });
  return rows.length;
}
