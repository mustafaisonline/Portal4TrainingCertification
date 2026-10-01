"use server";

import { revalidatePath } from "next/cache";
import { withTransaction } from "@/db/prisma";
import { isUuid } from "@/modules/catalogue/offerings/repository";
import { authorise } from "@/modules/identity/session";
import { ORGANISATION_TYPES, type OrganisationType, type RoleQuestionStatus } from "./constants";
import { AssessmentError } from "./errors";
import { addRoleToOrganisation, createOrganisation, organisationOffersRole, removeRoleFromOrganisation, revokeOrganisationAccess, setOrganisationPublished, updateOrganisation } from "./organisations.repository";
import type { QuestionContent } from "./question-validation";
import { bulkSetStatus, createQuestion, deleteQuestion, setQuestionStatus, updateQuestion } from "./questions.repository";
import { createRole, deleteRole, setRolePublished, updateRole } from "./roles.repository";

/*
 * Administrator actions for Interview roles, their question banks, the
 * approval queue and Organisations (CR-2026-10-01-1711, P2–P4). Every action
 * authorises `platform_admin` FIRST — the admin layout gates the page, but an
 * action is its own HTTP endpoint and must gate itself (ADR-020) — then writes
 * (and its audit row) in ONE transaction. The actor is the signed-in
 * administrator, never a form field. Granting Organisation access to a person
 * lives with the Trainer grant, in identity/admin-users.actions.ts.
 */

export type AdminAssessmentState = { status: "idle" } | { status: "error"; message: string } | { status: "done"; message: string };

async function refuseUnlessAdmin(): Promise<AdminAssessmentState | { userId: string }> {
  const result = await authorise("platform_admin");
  if (!result.ok) {
    return { status: "error", message: result.reason === "signed-out" ? "Your session has ended. Please sign in again." : "You do not have permission to manage interview roles and organisations." };
  }
  return { userId: result.user.id };
}

function failure(err: unknown, verb: string): AdminAssessmentState {
  if (err instanceof AssessmentError) {
    if (err.reason === "not_found") return { status: "error", message: "That item could not be found. It may have been removed." };
    if (err.reason === "slug_taken") return { status: "error", message: "That URL name is already used. Choose another." };
    const message = err.message.charAt(0).toUpperCase() + err.message.slice(1);
    return { status: "error", message: /[.!?]$/.test(message) ? message : `${message}.` };
  }
  console.error(`[assessment-admin] ${verb} failed`, err);
  return { status: "error", message: `We could not ${verb}. Please try again.` };
}

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function revalidateRoles(roleId?: string) {
  revalidatePath("/admin/interview");
  revalidatePath("/admin/interview/approvals");
  revalidatePath("/admin/organisations", "layout");
  revalidatePath("/admin/audit");
  if (roleId) revalidatePath(`/admin/interview/${roleId}`);
  revalidatePath("/assessment", "layout");
}

function revalidateOrganisations(organisationId?: string) {
  revalidatePath("/admin/organisations");
  revalidatePath("/admin/interview/approvals");
  revalidatePath("/admin/audit");
  if (organisationId) revalidatePath(`/admin/organisations/${organisationId}`);
  revalidatePath("/assessment", "layout");
  revalidatePath("/organisation", "layout");
}

/* ------------------------------------------------------------------ roles */

/** Fields: `name`, `description`, optional `slug`, optional `position`. */
export async function createRoleAction(_prev: AdminAssessmentState, formData: FormData): Promise<AdminAssessmentState> {
  const gate = await refuseUnlessAdmin();
  if ("status" in gate) return gate;
  const slug = text(formData, "slug");
  const positionText = text(formData, "position");
  try {
    const role = await withTransaction((tx) =>
      createRole(tx, { name: text(formData, "name"), description: text(formData, "description"), ...(slug ? { slug } : {}), ...(positionText ? { position: Number(positionText) } : {}) }, gate.userId),
    );
    revalidateRoles();
    return { status: "done", message: `Role "${role.name}" created (unpublished). Open it to add questions.` };
  } catch (err) {
    return failure(err, "create the role");
  }
}

/** Fields: `roleId`, `name`, `description`, `position`. */
export async function updateRoleAction(_prev: AdminAssessmentState, formData: FormData): Promise<AdminAssessmentState> {
  const gate = await refuseUnlessAdmin();
  if ("status" in gate) return gate;
  const roleId = text(formData, "roleId");
  const positionText = text(formData, "position");
  try {
    await withTransaction((tx) => updateRole(tx, roleId, { name: text(formData, "name"), description: text(formData, "description"), ...(positionText ? { position: Number(positionText) } : {}) }, gate.userId));
    revalidateRoles(roleId);
    return { status: "done", message: "Role details saved." };
  } catch (err) {
    return failure(err, "save the role");
  }
}

/** Fields: `roleId`, `published` ("true" | "false"). */
export async function setRolePublishedAction(_prev: AdminAssessmentState, formData: FormData): Promise<AdminAssessmentState> {
  const gate = await refuseUnlessAdmin();
  if ("status" in gate) return gate;
  const roleId = text(formData, "roleId");
  const published = text(formData, "published") === "true";
  try {
    await withTransaction((tx) => setRolePublished(tx, roleId, published, gate.userId));
    revalidateRoles(roleId);
    return { status: "done", message: published ? "Role published." : "Role unpublished." };
  } catch (err) {
    return failure(err, "change the role");
  }
}

/** Fields: `roleId`. Refused while any test attempt exists on the role (it can only be unpublished then). */
export async function deleteRoleAction(_prev: AdminAssessmentState, formData: FormData): Promise<AdminAssessmentState> {
  const gate = await refuseUnlessAdmin();
  if ("status" in gate) return gate;
  const roleId = text(formData, "roleId");
  try {
    const removed = await withTransaction((tx) => deleteRole(tx, roleId, gate.userId));
    revalidateRoles(roleId);
    return { status: "done", message: `Role deleted (${removed.questions} ${removed.questions === 1 ? "question" : "questions"} removed with it).` };
  } catch (err) {
    return failure(err, "delete the role");
  }
}

/* -------------------------------------------------------------- questions */

function questionFromForm(formData: FormData): QuestionContent {
  const correct = Number.parseInt(text(formData, "correct"), 10);
  return {
    category: text(formData, "category"),
    stem: text(formData, "stem"),
    options: [0, 1, 2, 3, 4].map((i) => ({ text: text(formData, `option${i}`), isCorrect: i === correct })),
    modelAnswer: text(formData, "modelAnswer"),
    source: text(formData, "source") || null,
  };
}

/** Fields: `roleId`, `category`, `stem`, `option0`–`option4`, `correct` (0–4), `modelAnswer`, optional `source`, `status` ("draft" | "reviewed"),
 *  optional `organisationId` — add the question to THAT organisation's own questions on its behalf (it must offer the role); then "draft" means
 *  pending approval and "reviewed" approved. */
export async function createQuestionAction(_prev: AdminAssessmentState, formData: FormData): Promise<AdminAssessmentState> {
  const gate = await refuseUnlessAdmin();
  if ("status" in gate) return gate;
  const roleId = text(formData, "roleId");
  const wantReviewed = text(formData, "status") === "reviewed";
  const organisationId = text(formData, "organisationId") || null;
  try {
    if (organisationId && !(isUuid(organisationId) && (await organisationOffersRole(organisationId, roleId)))) {
      return { status: "error", message: "That organisation does not offer this role." };
    }
    await withTransaction(async (tx) => {
      // Created pending/draft, then reviewed through the one audited path, so "reviewed by" and "when" are recorded.
      const q = await createQuestion(tx, { ...questionFromForm(formData), roleId, organisationId, status: organisationId ? "pending" : "draft", createdByUserId: gate.userId });
      if (wantReviewed) await setQuestionStatus(tx, q.id, "reviewed", gate.userId);
    });
    revalidateRoles(roleId);
    if (organisationId) revalidatePath("/organisation");
    return { status: "done", message: organisationId ? (wantReviewed ? "Question added to the organisation's questions and approved." : "Question added to the organisation's questions, pending approval.") : wantReviewed ? "Question added and approved." : "Question added as a draft." };
  } catch (err) {
    return failure(err, "add the question");
  }
}

/** Fields: `roleId` (for the refresh), `questionId`, and the question fields as for creating. */
export async function updateQuestionAction(_prev: AdminAssessmentState, formData: FormData): Promise<AdminAssessmentState> {
  const gate = await refuseUnlessAdmin();
  if ("status" in gate) return gate;
  const roleId = text(formData, "roleId");
  try {
    await withTransaction((tx) => updateQuestion(tx, text(formData, "questionId"), questionFromForm(formData), gate.userId));
    revalidateRoles(roleId);
    return { status: "done", message: "Question saved." };
  } catch (err) {
    return failure(err, "save the question");
  }
}

/** Fields: `roleId` (for the refresh), `questionId`. */
export async function deleteQuestionAction(_prev: AdminAssessmentState, formData: FormData): Promise<AdminAssessmentState> {
  const gate = await refuseUnlessAdmin();
  if ("status" in gate) return gate;
  const roleId = text(formData, "roleId");
  try {
    await withTransaction((tx) => deleteQuestion(tx, text(formData, "questionId"), gate.userId));
    revalidateRoles(roleId);
    return { status: "done", message: "Question deleted." };
  } catch (err) {
    return failure(err, "delete the question");
  }
}

const SETTABLE: readonly RoleQuestionStatus[] = ["draft", "reviewed", "rejected"];

/** Approve / reject / return to draft one question — the role's bank and the approvals queue.
 *  Fields: `questionId`, `status` ("reviewed" | "rejected" | "draft"), optional `reason` (audited), optional `roleId` (refresh). */
export async function setQuestionStatusAction(_prev: AdminAssessmentState, formData: FormData): Promise<AdminAssessmentState> {
  const gate = await refuseUnlessAdmin();
  if ("status" in gate) return gate;
  const status = text(formData, "status") as RoleQuestionStatus;
  if (!SETTABLE.includes(status)) return { status: "error", message: "That status is not available." };
  const roleId = text(formData, "roleId");
  const reason = text(formData, "reason").slice(0, 500);
  try {
    await withTransaction((tx) => setQuestionStatus(tx, text(formData, "questionId"), status, gate.userId, reason || undefined));
    revalidateRoles(isUuid(roleId) ? roleId : undefined);
    revalidateOrganisations();
    return { status: "done", message: status === "reviewed" ? "Question approved." : status === "rejected" ? "Question rejected." : "Question returned to draft." };
  } catch (err) {
    return failure(err, "change the question");
  }
}

/** "Approve all drafts" of a role's SHARED bank. Fields: `roleId`. */
export async function approveAllDraftsAction(_prev: AdminAssessmentState, formData: FormData): Promise<AdminAssessmentState> {
  const gate = await refuseUnlessAdmin();
  if ("status" in gate) return gate;
  const roleId = text(formData, "roleId");
  try {
    const n = await withTransaction((tx) => bulkSetStatus(tx, { roleId, organisationId: null, from: "draft", to: "reviewed" }, gate.userId));
    revalidateRoles(roleId);
    return { status: "done", message: n === 0 ? "There were no drafts to approve." : `${n} ${n === 1 ? "draft" : "drafts"} approved.` };
  } catch (err) {
    return failure(err, "approve the drafts");
  }
}

/* ---------------------------------------------------------- organisations */

function typeFrom(formData: FormData): OrganisationType {
  const t = text(formData, "type");
  return ((ORGANISATION_TYPES as readonly string[]).includes(t) ? t : "") as OrganisationType;
}

/** Fields: `name`, `type` (company | education), `contactEmail`, optional `logoPath`, optional `slug`. Created unpublished. */
export async function createOrganisationAction(_prev: AdminAssessmentState, formData: FormData): Promise<AdminAssessmentState> {
  const gate = await refuseUnlessAdmin();
  if ("status" in gate) return gate;
  const slug = text(formData, "slug");
  try {
    const org = await withTransaction((tx) =>
      createOrganisation(tx, { name: text(formData, "name"), type: typeFrom(formData), contactEmail: text(formData, "contactEmail"), logoPath: text(formData, "logoPath") || null, ...(slug ? { slug } : {}) }, gate.userId),
    );
    revalidateOrganisations();
    return { status: "done", message: `Organisation "${org.name}" created (unpublished). Open it to offer roles and publish it.` };
  } catch (err) {
    return failure(err, "create the organisation");
  }
}

/** Fields: `organisationId`, `name`, `type`, `contactEmail`, `logoPath` (blank clears it). */
export async function updateOrganisationAction(_prev: AdminAssessmentState, formData: FormData): Promise<AdminAssessmentState> {
  const gate = await refuseUnlessAdmin();
  if ("status" in gate) return gate;
  const organisationId = text(formData, "organisationId");
  try {
    await withTransaction((tx) => updateOrganisation(tx, organisationId, { name: text(formData, "name"), type: typeFrom(formData), contactEmail: text(formData, "contactEmail"), logoPath: text(formData, "logoPath") || null }, gate.userId));
    revalidateOrganisations(organisationId);
    return { status: "done", message: "Organisation details saved." };
  } catch (err) {
    return failure(err, "save the organisation");
  }
}

/** Fields: `organisationId`, `published` ("true" | "false"). */
export async function setOrganisationPublishedAction(_prev: AdminAssessmentState, formData: FormData): Promise<AdminAssessmentState> {
  const gate = await refuseUnlessAdmin();
  if ("status" in gate) return gate;
  const organisationId = text(formData, "organisationId");
  const published = text(formData, "published") === "true";
  try {
    await withTransaction((tx) => setOrganisationPublished(tx, organisationId, published, gate.userId));
    revalidateOrganisations(organisationId);
    return { status: "done", message: published ? "Organisation published." : "Organisation unpublished." };
  } catch (err) {
    return failure(err, "change the organisation");
  }
}

/** Fields: `organisationId`, `roleId`. */
export async function addRoleToOrganisationAction(_prev: AdminAssessmentState, formData: FormData): Promise<AdminAssessmentState> {
  const gate = await refuseUnlessAdmin();
  if ("status" in gate) return gate;
  const organisationId = text(formData, "organisationId");
  try {
    const added = await withTransaction((tx) => addRoleToOrganisation(tx, organisationId, text(formData, "roleId"), gate.userId));
    revalidateOrganisations(organisationId);
    return { status: "done", message: added ? "Role added to the organisation." : "The organisation already offers this role." };
  } catch (err) {
    return failure(err, "add the role");
  }
}

/** Fields: `organisationId`, `roleId`. */
export async function removeRoleFromOrganisationAction(_prev: AdminAssessmentState, formData: FormData): Promise<AdminAssessmentState> {
  const gate = await refuseUnlessAdmin();
  if ("status" in gate) return gate;
  const organisationId = text(formData, "organisationId");
  try {
    const removed = await withTransaction((tx) => removeRoleFromOrganisation(tx, organisationId, text(formData, "roleId"), gate.userId));
    revalidateOrganisations(organisationId);
    return { status: "done", message: removed ? "Role removed from the organisation. Its questions are kept." : "The organisation did not offer this role." };
  } catch (err) {
    return failure(err, "remove the role");
  }
}

/** Withdraw one member's access from the organisation's own page. Fields: `organisationId`, `userId`. */
export async function revokeMemberAction(_prev: AdminAssessmentState, formData: FormData): Promise<AdminAssessmentState> {
  const gate = await refuseUnlessAdmin();
  if ("status" in gate) return gate;
  const organisationId = text(formData, "organisationId");
  const userId = text(formData, "userId");
  try {
    const revoked = await withTransaction((tx) => revokeOrganisationAccess(tx, { userId, organisationId, revokedByUserId: gate.userId }));
    revalidateOrganisations(organisationId);
    revalidatePath(`/admin/users/${userId}`);
    revalidatePath("/admin/users");
    return { status: "done", message: revoked ? "Organisation access revoked." : "This person did not have access." };
  } catch (err) {
    return failure(err, "revoke the access");
  }
}
