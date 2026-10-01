"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { withTransaction } from "@/db/prisma";
import { getCurrentUser } from "@/modules/identity/session";
import { ASSESSMENT_SIZE } from "./assessment-rules";
import { deleteFinishedAttempts, finishAttempt, KnowledgeCheckError, saveAnswers, startAttempt } from "./knowledge-check.repository";

/*
 * Free Assessment Check actions (Milestone 14 Phase 4; reshaped 2026-09-30:
 * one 200-question test, 3 hours, no "unfinished" list or cancel). Every action
 * requires a signed-in user (P12) and acts only on that user's own attempt. The
 * server decides when time is up — a save after the deadline is refused and the
 * attempt is scored as it stands.
 */

export type KnowledgeCheckState = { status: "idle" } | { status: "error"; message: string } | { status: "saved"; message: string };

const SESSION_ENDED = "Your session has ended. Please sign in again.";

export async function startKnowledgeCheckAction(_prev: KnowledgeCheckState, _formData: FormData): Promise<KnowledgeCheckState> {
  const user = await getCurrentUser();
  if (!user) return { status: "error", message: SESSION_ENDED };
  let attemptId = "";
  try {
    // One running test per person: starting again returns the running one.
    const attempt = await withTransaction((tx) => startAttempt(tx, { userId: user.id, size: ASSESSMENT_SIZE }));
    attemptId = attempt.id;
  } catch (err) {
    if (err instanceof KnowledgeCheckError) {
      return { status: "error", message: err.reason === "bank_too_small" ? `The Free Assessment Check is not available yet — it needs ${ASSESSMENT_SIZE} reviewed questions and ${err.message.replace(/^Only /, "only ").replace(/;.*$/, "")}.` : "The check could not be started. Please try again." };
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

/** Save this page's answers; then continue to the next page, or finish. When the 3 hours are up the
 *  save is refused, the attempt is scored as it stands (unanswered = wrong) and the person sees the result. */
export async function saveKnowledgeCheckPageAction(_prev: KnowledgeCheckState, formData: FormData): Promise<KnowledgeCheckState> {
  const user = await getCurrentUser();
  if (!user) return { status: "error", message: SESSION_ENDED };
  const attemptId = String(formData.get("attemptId") ?? "").trim();
  const intent = String(formData.get("intent") ?? "next");
  const page = Number.parseInt(String(formData.get("page") ?? "1"), 10) || 1;
  let timeUp = false;
  try {
    try {
      await withTransaction((tx) => saveAnswers(tx, { attemptId, userId: user.id, answers: answersFrom(formData) }));
    } catch (err) {
      if (!(err instanceof KnowledgeCheckError && err.reason === "time_expired")) throw err;
      timeUp = true;
      // Nothing was written by the refused save; score what was saved earlier (finish instant capped at the deadline).
      await withTransaction((tx) => finishAttempt(tx, { attemptId, userId: user.id }));
      revalidatePath("/account", "layout");
    }
    if (intent === "finish" && !timeUp) {
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
  if (intent === "finish" || timeUp) redirect(`/free-learning/knowledge-check/${attemptId}/result`);
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
    revalidatePath("/assessment");
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
