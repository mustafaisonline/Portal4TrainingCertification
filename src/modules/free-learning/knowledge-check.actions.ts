"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { withTransaction } from "@/db/prisma";
import { getCurrentUser } from "@/modules/identity/session";
import { finishAttempt, KnowledgeCheckError, saveAnswers, startAttempt } from "./knowledge-check.repository";

/*
 * Knowledge Check actions (Milestone 14 Phase 4). Every action requires a
 * signed-in user (P12) and acts only on that user's own attempt.
 */

export type KnowledgeCheckState = { status: "idle" } | { status: "error"; message: string } | { status: "saved"; message: string };

const SESSION_ENDED = "Your session has ended. Please sign in again.";

export async function startKnowledgeCheckAction(_prev: KnowledgeCheckState, formData: FormData): Promise<KnowledgeCheckState> {
  const user = await getCurrentUser();
  if (!user) return { status: "error", message: SESSION_ENDED };
  const size = Number.parseInt(String(formData.get("size") ?? ""), 10);
  let attemptId = "";
  try {
    const attempt = await withTransaction((tx) => startAttempt(tx, { userId: user.id, size }));
    attemptId = attempt.id;
  } catch (err) {
    if (err instanceof KnowledgeCheckError) {
      return { status: "error", message: err.reason === "bank_too_small" ? `Not enough reviewed questions yet for a ${size}-question check — ${err.message.replace(/^Only /, "only ").replace(/;.*$/, "")}. Try a smaller size.` : "Choose 50, 100 or 200 questions." };
    }
    console.error(`[knowledge-check] start failed for user ${user.id}:`, err instanceof Error ? err.message : err);
    return { status: "error", message: "The check could not be started. Please try again." };
  }
  redirect(`/free-learning/knowledge-check/${attemptId}`);
}

function answersFrom(formData: FormData): Record<string, number> {
  const answers: Record<string, number> = {};
  for (const [key, value] of formData.entries()) {
    const m = /^q-([0-9a-f-]{36})$/.exec(key);
    if (!m || typeof value !== "string") continue;
    const n = Number.parseInt(value, 10);
    if (Number.isInteger(n) && n >= 1 && n <= 5) answers[m[1]!] = n;
  }
  return answers;
}

/** Save this page's answers; then continue to the next page, or finish. */
export async function saveKnowledgeCheckPageAction(_prev: KnowledgeCheckState, formData: FormData): Promise<KnowledgeCheckState> {
  const user = await getCurrentUser();
  if (!user) return { status: "error", message: SESSION_ENDED };
  const attemptId = String(formData.get("attemptId") ?? "").trim();
  const intent = String(formData.get("intent") ?? "next");
  const page = Number.parseInt(String(formData.get("page") ?? "1"), 10) || 1;
  try {
    await withTransaction((tx) => saveAnswers(tx, { attemptId, userId: user.id, answers: answersFrom(formData) }));
    if (intent === "finish") {
      await withTransaction((tx) => finishAttempt(tx, { attemptId, userId: user.id }));
      revalidatePath("/account", "layout");
    }
  } catch (err) {
    if (err instanceof KnowledgeCheckError) {
      return { status: "error", message: err.reason === "already_finished" ? "This check is already finished." : "This check could not be found." };
    }
    console.error(`[knowledge-check] save failed for attempt ${attemptId}:`, err instanceof Error ? err.message : err);
    return { status: "error", message: "Your answers could not be saved. Please try again." };
  }
  if (intent === "finish") redirect(`/free-learning/knowledge-check/${attemptId}/result`);
  if (intent === "previous") redirect(`/free-learning/knowledge-check/${attemptId}?page=${Math.max(1, page - 1)}`);
  redirect(`/free-learning/knowledge-check/${attemptId}?page=${page + 1}`);
}
