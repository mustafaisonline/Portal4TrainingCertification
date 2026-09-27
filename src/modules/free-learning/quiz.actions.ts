"use server";

import { revalidatePath } from "next/cache";
import { getPrisma, withTransaction } from "@/db/prisma";
import { authorise } from "@/modules/identity/session";
import { checkAnswers, setAllQuestionsStatus, setQuestionStatus, type AnswerCheck } from "./quiz.repository";

/*
 * Topic quiz actions (Milestone 14 Phase 3).
 *  - checkTopicAnswersAction: PUBLIC — marks one page of answers for a
 *    published topic's reviewed questions and returns the result. Nothing
 *    is stored (P11); the correct options never appear in the page HTML.
 *  - the two admin actions authorise `platform_admin` first (ADR-020).
 */

export type QuizCheckState = { status: "idle" } | { status: "error"; message: string } | { status: "checked"; results: AnswerCheck[]; score: number; of: number };

export async function checkTopicAnswersAction(_prev: QuizCheckState, formData: FormData): Promise<QuizCheckState> {
  const slug = String(formData.get("topic") ?? "").trim();
  const topic = await getPrisma().bookTopic.findFirst({ where: { slug, published: true }, select: { id: true } });
  if (!topic) return { status: "error", message: "This topic is not available." };
  // The page's question list (hidden field) defines what is marked; a radio
  // with no selection sends nothing, so those come back as "not answered".
  const listed = String(formData.get("questions") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^[0-9a-f-]{36}$/.test(s))
    .slice(0, 50);
  const chosen = new Map<string, number>();
  for (const [key, value] of formData.entries()) {
    const m = /^q-([0-9a-f-]{36})$/.exec(key);
    if (!m || typeof value !== "string") continue;
    const n = Number.parseInt(value, 10);
    if (Number.isInteger(n) && n >= 1 && n <= 5) chosen.set(m[1]!, n);
  }
  const ids = listed.length ? listed : [...chosen.keys()];
  if (chosen.size === 0) return { status: "error", message: "Choose an answer for at least one question." };
  const results = await checkAnswers(topic.id, ids.map((questionId) => ({ questionId, optionPosition: chosen.get(questionId) ?? null })));
  return { status: "checked", results, score: results.filter((r) => r.correct).length, of: results.length };
}

export type QuestionAdminState = { status: "idle" } | { status: "error"; message: string } | { status: "done"; message: string };

async function refuseUnlessAdmin(): Promise<QuestionAdminState | { userId: string }> {
  const result = await authorise("platform_admin");
  if (!result.ok) return { status: "error", message: result.reason === "signed-out" ? "Your session has ended. Please sign in again." : "You do not have permission to review questions." };
  return { userId: result.user.id };
}

export async function setQuestionStatusAction(_prev: QuestionAdminState, formData: FormData): Promise<QuestionAdminState> {
  const gate = await refuseUnlessAdmin();
  if ("status" in gate) return gate;
  const questionId = String(formData.get("questionId") ?? "").trim();
  const topicId = String(formData.get("topicId") ?? "").trim();
  const status = String(formData.get("status") ?? "") === "reviewed" ? "reviewed" : "draft";
  try {
    const q = await withTransaction((tx) => setQuestionStatus(tx, { questionId, status, actorUserId: gate.userId }));
    if (!q) return { status: "error", message: "That question could not be found." };
    revalidatePath(`/admin/free-learning/${topicId}/questions`);
    revalidatePath("/admin/free-learning");
    revalidatePath("/free-learning", "layout");
    return { status: "done", message: `Question ${q.position} is now ${q.status === "reviewed" ? "reviewed" : "a draft"}.` };
  } catch (err) {
    console.error(`[free-learning] question status change failed for ${questionId}:`, err instanceof Error ? err.message : err);
    return { status: "error", message: "The change could not be saved. Please try again." };
  }
}

export async function setAllQuestionsStatusAction(_prev: QuestionAdminState, formData: FormData): Promise<QuestionAdminState> {
  const gate = await refuseUnlessAdmin();
  if ("status" in gate) return gate;
  const topicId = String(formData.get("topicId") ?? "").trim();
  const status = String(formData.get("status") ?? "") === "reviewed" ? "reviewed" : "draft";
  try {
    const n = await withTransaction((tx) => setAllQuestionsStatus(tx, { topicId, status, actorUserId: gate.userId }));
    revalidatePath(`/admin/free-learning/${topicId}/questions`);
    revalidatePath("/admin/free-learning");
    revalidatePath("/free-learning", "layout");
    return { status: "done", message: n === 0 ? "Nothing to change." : `${n} ${n === 1 ? "question" : "questions"} marked ${status === "reviewed" ? "reviewed" : "draft"}.` };
  } catch (err) {
    console.error(`[free-learning] bulk status change failed for topic ${topicId}:`, err instanceof Error ? err.message : err);
    return { status: "error", message: "The change could not be saved. Please try again." };
  }
}
