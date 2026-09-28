"use server";

import { drawDiagnosticQuestions } from "@/modules/free-learning/quiz.repository";
import { DIAGNOSTIC_QUESTION_COUNT, type DrawnDiagnosticQuestion } from "@/shared/signature/diagnostic";

/*
 * Founder, 2026-09-28 ("New change" item 1): every press of the start button
 * draws a fresh random set of ten questions from the reviewed Free Learning
 * question bank. A server action, not a page load, so a second start on the
 * same page gets a genuinely new draw. Anonymous and read-only: no attempt
 * row, no answer ever reaches the server (the diagnostic saves nothing).
 */

export type DiagnosticDrawResult =
  | { ok: true; questions: DrawnDiagnosticQuestion[] }
  | { ok: false };

export async function drawDiagnosticQuestionsAction(): Promise<DiagnosticDrawResult> {
  const drawn = await drawDiagnosticQuestions(DIAGNOSTIC_QUESTION_COUNT);
  if (drawn === null) return { ok: false };
  return {
    ok: true,
    questions: drawn.map((q) => ({
      code: q.id,
      scenario: q.stem,
      options: q.options,
      domainCode: q.topicSlug,
      domainName: q.topicTitle,
    })),
  };
}
