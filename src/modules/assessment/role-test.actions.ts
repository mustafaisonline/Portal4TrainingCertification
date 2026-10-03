"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { withTransaction } from "@/db/prisma";
import { isUuid } from "@/modules/catalogue/offerings/repository";
import { getCurrentUser } from "@/modules/identity/session";
import { OPTIONS_PER_QUESTION } from "./constants";
import { AssessmentError, cancelRoleAttempt, deleteOwnRoleResult, finishRoleAttempt, getRoleAttemptForUser, saveRoleAnswers, startRoleAttempt, viewRolePageResults } from "./attempts.repository";
import { getOrganisationById } from "./organisations.repository";
import { roleBasePath, roleResultPath, roleTestPath, scopeOfAttempt } from "./role-test-scope";

/*
 * Role-test actions — Prepare for Interview and Organisation Interview Screening
 * (CR-2026-10-01-1711). ONE set of actions for both journeys: the organisation
 * test is the same engine with an organisation id and the candidate's
 * acknowledgement. Every action requires a signed-in user and acts only on that
 * user's own attempt — the user id always comes from the session, never from the
 * form. Where to redirect is worked out on the server from the attempt's own role
 * and organisation, never taken from the browser. The server decides when the
 * 90 minutes are up: a save after the deadline is refused and the test is scored
 * as it stands.
 */

export type RoleTestState = { status: "idle" } | { status: "error"; message: string } | { status: "saved"; message: string };

/** A page the person asked for. Page 1 carries `?page=1` explicitly: with no page in the address the test opens on the FIRST
 *  UNANSWERED page (resume), which is not what "go back to page 1" means. */
const pagePath = (scope: Parameters<typeof roleTestPath>[0], attemptId: string, page: number) => `${roleTestPath(scope, attemptId)}?page=${Math.max(1, page)}`;

const SESSION_ENDED = "Your session has ended. Please sign in again.";

/** Start a role test, or return to the running one. Form fields: `roleId`, `organisationId` (organisation tests only), `acknowledged` (the sharing checkbox). */
export async function startRoleTestAction(_prev: RoleTestState, formData: FormData): Promise<RoleTestState> {
  const user = await getCurrentUser();
  if (!user) return { status: "error", message: SESSION_ENDED };
  const roleId = String(formData.get("roleId") ?? "").trim();
  const organisationRaw = String(formData.get("organisationId") ?? "").trim();
  const organisationId = organisationRaw === "" ? null : organisationRaw;
  if (!isUuid(roleId) || (organisationId !== null && !isUuid(organisationId))) return { status: "error", message: "That test is not available." };
  const acknowledged = formData.get("acknowledged") !== null;
  let path = "";
  try {
    // One running test per person per role + organisation: starting again returns the running one.
    const attempt = await withTransaction((tx) => startRoleAttempt(tx, { userId: user.id, roleId, organisationId, acknowledgedSharing: acknowledged }));
    const scope = await scopeOfAttempt(attempt);
    if (!scope) return { status: "error", message: "That test is not available." };
    path = roleTestPath(scope, attempt.id);
  } catch (err) {
    if (err instanceof AssessmentError) {
      if (err.reason === "organisation_ack_required") {
        const org = organisationId ? await getOrganisationById(organisationId) : null;
        return { status: "error", message: `Tick the box to confirm that you understand your result is shared with ${org?.name ?? "the organisation"} before you start.` };
      }
      if (err.reason === "bank_too_small") return { status: "error", message: "This test is not ready yet — it does not have enough approved questions. Please check back soon." };
      return { status: "error", message: "That test is not available." };
    }
    console.error(`[role-test] start failed for user ${user.id}:`, err instanceof Error ? err.message : err);
    return { status: "error", message: "The test could not be started. Please try again." };
  }
  redirect(path);
}

function answersFrom(formData: FormData): Record<string, number> {
  const answers: Record<string, number> = {};
  for (const [key, value] of formData.entries()) {
    const m = /^q-([0-9a-f-]{36})$/.exec(key);
    if (!m || typeof value !== "string") continue;
    const n = Number.parseInt(value, 10);
    if (Number.isInteger(n) && n >= 1 && n <= OPTIONS_PER_QUESTION) answers[m[1]!] = n;
  }
  return answers;
}

/** Save this page's answers; then continue to the next or previous page, finish, save and exit (interview practice — back to the
 *  role page, where "Return to my running test" resumes), or view this page's results (interview practice — the page's answers are
 *  then locked). For an ORGANISATION test, when the 90 minutes are up the save is refused, the attempt is scored as it stands
 *  (unanswered = wrong) and the person sees the result; interview practice has no time limit. */
export async function saveRoleAnswersAction(_prev: RoleTestState, formData: FormData): Promise<RoleTestState> {
  const user = await getCurrentUser();
  if (!user) return { status: "error", message: SESSION_ENDED };
  const attemptId = String(formData.get("attemptId") ?? "").trim();
  const intent = String(formData.get("intent") ?? "next");
  const page = Number.parseInt(String(formData.get("page") ?? "1"), 10) || 1;
  const attempt = await getRoleAttemptForUser(attemptId, user.id);
  const scope = attempt ? await scopeOfAttempt(attempt) : null;
  if (!attempt || !scope) return { status: "error", message: "This test could not be found." };
  if (attempt.finishedAt) redirect(roleResultPath(scope, attempt.id));
  if (intent === "view") {
    try {
      await withTransaction((tx) => viewRolePageResults(tx, { attemptId, userId: user.id, page, answers: answersFrom(formData) }));
    } catch (err) {
      if (err instanceof AssessmentError) {
        if (err.reason === "already_finished") redirect(roleResultPath(scope, attemptId));
        if (err.reason === "forbidden") return { status: "error", message: "This test does not show results before you finish." };
        return { status: "error", message: "This page could not be shown. Please try again." };
      }
      console.error(`[role-test] view results failed for attempt ${attemptId}:`, err instanceof Error ? err.message : err);
      return { status: "error", message: "Your answers could not be saved. Please try again." };
    }
    redirect(pagePath(scope, attemptId, page));
  }
  let timeUp = false;
  try {
    try {
      await withTransaction((tx) => saveRoleAnswers(tx, { attemptId, userId: user.id, answers: answersFrom(formData) }));
    } catch (err) {
      if (!(err instanceof AssessmentError && err.reason === "time_expired")) throw err;
      timeUp = true;
      // Nothing was written by the refused save; score what was saved earlier (finish instant capped at the deadline).
      await withTransaction((tx) => finishRoleAttempt(tx, { attemptId, userId: user.id }));
    }
    if (intent === "finish" && !timeUp) await withTransaction((tx) => finishRoleAttempt(tx, { attemptId, userId: user.id }));
  } catch (err) {
    if (err instanceof AssessmentError) {
      if (err.reason === "already_finished") redirect(roleResultPath(scope, attemptId));
      return { status: "error", message: "This test could not be found." };
    }
    console.error(`[role-test] save failed for attempt ${attemptId}:`, err instanceof Error ? err.message : err);
    return { status: "error", message: "Your answers could not be saved. Please try again." };
  }
  if (intent === "finish" || timeUp) {
    revalidatePath(roleBasePath(scope));
    redirect(roleResultPath(scope, attemptId));
  }
  if (intent === "exit") {
    revalidatePath(roleBasePath(scope));
    redirect(roleBasePath(scope));
  }
  if (intent === "previous") redirect(pagePath(scope, attemptId, page - 1));
  redirect(pagePath(scope, attemptId, page + 1));
}

/** Interview practice: the person cancels their UNFINISHED test at any time — it is deleted and no record of a result is kept
 *  (CR-2026-10-03-2251). A finished result and an organisation's screening test are refused by the repository. */
export async function cancelRoleTestAction(_prev: RoleTestState, formData: FormData): Promise<RoleTestState> {
  const user = await getCurrentUser();
  if (!user) return { status: "error", message: SESSION_ENDED };
  const attemptId = String(formData.get("attemptId") ?? "").trim();
  if (!isUuid(attemptId)) return { status: "error", message: "This test could not be found." };
  const attempt = await getRoleAttemptForUser(attemptId, user.id);
  const scope = attempt ? await scopeOfAttempt(attempt) : null;
  if (!attempt || !scope) return { status: "error", message: "This test could not be found." };
  try {
    await withTransaction((tx) => cancelRoleAttempt(tx, { attemptId, userId: user.id }));
  } catch (err) {
    if (err instanceof AssessmentError) {
      if (err.reason === "already_finished") redirect(roleResultPath(scope, attemptId));
      if (err.reason === "forbidden") return { status: "error", message: "An organisation's screening test cannot be cancelled here." };
      return { status: "error", message: "This test could not be found." };
    }
    console.error(`[role-test] cancel failed for attempt ${attemptId}:`, err instanceof Error ? err.message : err);
    return { status: "error", message: "The test could not be cancelled. Please try again." };
  }
  revalidatePath(roleBasePath(scope));
  redirect(roleBasePath(scope));
}

/** The person deletes selected finished results of their OWN (form field `attempt`, repeated). Ownership and the
 *  finished-only / not-an-organisation-result rules live in the repository; the confirmation dialog is the caller's. */
export async function deleteRoleResultsAction(_prev: RoleTestState, formData: FormData): Promise<RoleTestState> {
  const user = await getCurrentUser();
  if (!user) return { status: "error", message: SESSION_ENDED };
  const ids = formData.getAll("attempt").filter((v): v is string => typeof v === "string" && isUuid(v));
  if (ids.length === 0) return { status: "error", message: "Tick at least one result to delete." };
  let deleted = 0;
  let refused = 0;
  try {
    for (const id of new Set(ids)) {
      const attempt = await getRoleAttemptForUser(id, user.id);
      const scope = attempt ? await scopeOfAttempt(attempt) : null;
      try {
        await withTransaction((tx) => deleteOwnRoleResult(tx, { userId: user.id, attemptId: id }));
        deleted += 1;
        if (scope) revalidatePath(roleBasePath(scope));
      } catch (err) {
        if (!(err instanceof AssessmentError)) throw err;
        refused += 1; // not found, still running, or an organisation's screening result
      }
    }
  } catch (err) {
    console.error(`[role-test] delete failed for user ${user.id}:`, err instanceof Error ? err.message : err);
    return { status: "error", message: "The results could not be deleted. Please try again." };
  }
  if (deleted === 0) return { status: "error", message: "Nothing was deleted — a running test or a result shared with an organisation stays." };
  return { status: "saved", message: refused > 0 ? `${deleted} deleted; ${refused} kept (a result shared with an organisation stays).` : `${deleted} ${deleted === 1 ? "result" : "results"} deleted.` };
}
