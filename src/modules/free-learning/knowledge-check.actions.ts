"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { withTransaction } from "@/db/prisma";
import { getCurrentUser } from "@/modules/identity/session";
import { cancelUnfinishedAttempt, deleteFinishedAttempts, finishAttempt, KnowledgeCheckError, saveAnswers, startAttempt } from "./knowledge-check.repository";

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

/** Founder, 2026-09-28: delete selected finished results from Free
 *  Certifications. Ownership and the refusal rules live in the repository;
 *  the confirmation dialog is the caller's. */
export async function deleteKnowledgeCheckResultsAction(_prev: KnowledgeCheckState, formData: FormData): Promise<KnowledgeCheckState> {
  const user = await getCurrentUser();
  if (!user) return { status: "error", message: SESSION_ENDED };
  const ids = formData.getAll("attempt").filter((v): v is string => typeof v === "string");
  if (ids.length === 0) return { status: "error", message: "Tick at least one result to delete." };
  try {
    const { deleted, refused } = await withTransaction((tx) => deleteFinishedAttempts(tx, { userId: user.id, attemptIds: ids }));
    revalidatePath("/free-certifications");
    revalidatePath("/account", "layout");
    if (deleted === 0) return { status: "error", message: "Nothing was deleted — a result with a document unlock is a record and stays." };
    return {
      status: "saved",
      message: refused > 0 ? `${deleted} deleted; ${refused} kept (a result with a document unlock is a record and stays).` : `${deleted} ${deleted === 1 ? "result" : "results"} deleted.`,
    };
  } catch (err) {
    console.error(`[knowledge-check] delete failed for user ${user.id}:`, err instanceof Error ? err.message : err);
    return { status: "error", message: "The results could not be deleted. Please try again." };
  }
}

/** Founder, 2026-09-28: "if user want to cancel it in the middle of the
 *  test" — cancels (deletes) the person's own UNFINISHED attempt and
 *  returns to Free Certifications. Confirmed client-side by the portal's
 *  own dialog before this is called. */
export async function cancelKnowledgeCheckAttemptAction(_prev: KnowledgeCheckState, formData: FormData): Promise<KnowledgeCheckState> {
  const user = await getCurrentUser();
  if (!user) return { status: "error", message: SESSION_ENDED };
  const attemptId = String(formData.get("attemptId") ?? "").trim();
  let cancelled = false;
  try {
    cancelled = await withTransaction((tx) => cancelUnfinishedAttempt(tx, { attemptId, userId: user.id }));
  } catch (err) {
    console.error(`[knowledge-check] cancel failed for attempt ${attemptId}:`, err instanceof Error ? err.message : err);
    return { status: "error", message: "The check could not be cancelled. Please try again." };
  }
  if (!cancelled) return { status: "error", message: "This check could not be found, or it is already finished." };
  revalidatePath("/free-certifications");
  redirect("/free-certifications");
}
