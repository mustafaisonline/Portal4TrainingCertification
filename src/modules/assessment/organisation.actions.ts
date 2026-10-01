"use server";

import { revalidatePath } from "next/cache";
import { withTransaction } from "@/db/prisma";
import { isUuid } from "@/modules/catalogue/offerings/repository";
import { isOrganisationUser } from "@/modules/identity/roles.repository";
import { getCurrentUser } from "@/modules/identity/session";
import { MIN_PRIVATE_ROLE_QUESTIONS, OPTIONS_PER_QUESTION } from "./constants";
import { AssessmentError } from "./errors";
import { addRoleToOrganisation, createPrivateRole, organisationForUser, removeRoleFromOrganisation } from "./organisations.repository";
import { createOrganisationQuestion, deleteOrganisationQuestion, updateOrganisationQuestion } from "./questions.repository";
import type { QuestionContent } from "./question-validation";
import { getRoleById } from "./roles.repository";

/*
 * Organisation Dashboard actions (CR-2026-10-01-1711, P3/P4). Every action
 * re-authenticates, requires the Organisation role and resolves the person's
 * ORGANISATION FROM THE SESSION (`organisationForUser`) — an organisation id is
 * never taken from the browser. The repositories re-check membership, that the
 * role is offered, and ownership of a question. Reasons are mapped to honest
 * sentences; anything unexpected is logged and answered generically.
 */

export type OrganisationActionState = { status: "idle" } | { status: "error"; message: string } | { status: "saved"; message: string };

const SESSION_ENDED = "Your session has ended. Please sign in again.";
const NO_ACCESS = "You do not have Organisation access.";
const NO_ORGANISATION = "Your organisation is not set up yet. Please contact us.";

type Context = { ok: true; userId: string; organisationId: string } | { ok: false; message: string };

async function context(): Promise<Context> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: SESSION_ENDED };
  if (!isOrganisationUser(user.roles)) return { ok: false, message: NO_ACCESS };
  const organisation = await organisationForUser(user.id);
  if (!organisation) return { ok: false, message: NO_ORGANISATION };
  return { ok: true, userId: user.id, organisationId: organisation.id };
}

const sentence = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s) + (/[.!?]$/.test(s) ? "" : ".");

function messageFor(err: unknown, what: string): string {
  if (err instanceof AssessmentError) {
    switch (err.reason) {
      case "invalid_input":
        return sentence(err.message);
      case "slug_taken":
        return "You already have a role with that name. Please choose another name.";
      case "forbidden":
        return "You do not have access to that.";
      case "role_not_offered":
        return "Your organisation does not offer that role.";
      case "not_found":
        return "That could not be found. It may already have been removed.";
      case "not_editable":
        return "An approved question cannot be deleted. Edit it first to take it out of the tests.";
      default:
        return `${what} could not be done. Please try again.`;
    }
  }
  console.error(`[organisation] ${what} failed:`, err instanceof Error ? err.message : err);
  return `${what} could not be done. Please try again.`;
}

const fail = (message: string): OrganisationActionState => ({ status: "error", message });
const text = (formData: FormData, key: string): string => String(formData.get(key) ?? "").trim();

/* ------------------------------------------------------------------- roles */

/** Offer a role from the catalogue of published SHARED roles. */
export async function addCatalogueRoleAction(_prev: OrganisationActionState, formData: FormData): Promise<OrganisationActionState> {
  const ctx = await context();
  if (!ctx.ok) return fail(ctx.message);
  const roleId = text(formData, "roleId");
  if (!isUuid(roleId)) return fail("Choose a role to add.");
  try {
    const role = await getRoleById(roleId);
    if (!role || role.organisationId !== null || !role.published) return fail("That role is not in the catalogue.");
    const added = await withTransaction((tx) => addRoleToOrganisation(tx, ctx.organisationId, roleId, ctx.userId));
    revalidatePath("/organisation");
    return { status: "saved", message: added ? `${role.name} added to your roles.` : `Your organisation already offers ${role.name}.` };
  } catch (err) {
    return fail(messageFor(err, "Adding the role"));
  }
}

/** Create the organisation's OWN role (private to it). */
export async function createOwnRoleAction(_prev: OrganisationActionState, formData: FormData): Promise<OrganisationActionState> {
  const ctx = await context();
  if (!ctx.ok) return fail(ctx.message);
  try {
    const role = await withTransaction((tx) => createPrivateRole(tx, ctx.organisationId, { name: text(formData, "name"), description: text(formData, "description") }, ctx.userId));
    revalidatePath("/organisation");
    return { status: "saved", message: `${role.name} created. Candidates see it once it has ${MIN_PRIVATE_ROLE_QUESTIONS} approved questions.` };
  } catch (err) {
    return fail(messageFor(err, "Creating the role"));
  }
}

/** Stop offering a role (the organisation's questions for it are kept). */
export async function removeRoleAction(_prev: OrganisationActionState, formData: FormData): Promise<OrganisationActionState> {
  const ctx = await context();
  if (!ctx.ok) return fail(ctx.message);
  const roleId = text(formData, "roleId");
  if (!isUuid(roleId)) return fail("That role could not be found.");
  try {
    const removed = await withTransaction((tx) => removeRoleFromOrganisation(tx, ctx.organisationId, roleId, ctx.userId));
    revalidatePath("/organisation");
    return removed ? { status: "saved", message: "Role removed. Your questions for it are kept." } : fail("Your organisation does not offer that role.");
  } catch (err) {
    return fail(messageFor(err, "Removing the role"));
  }
}

/* --------------------------------------------------------------- questions */

function contentFrom(formData: FormData): QuestionContent {
  const correct = Number.parseInt(text(formData, "correct"), 10);
  const options = Array.from({ length: OPTIONS_PER_QUESTION }, (_, i) => ({ text: String(formData.get(`option-${i + 1}`) ?? ""), isCorrect: correct === i + 1 }));
  return { category: String(formData.get("category") ?? ""), stem: String(formData.get("stem") ?? ""), options, modelAnswer: String(formData.get("modelAnswer") ?? "") };
}

/** Add a question for one of the organisation's roles. It starts Pending approval. */
export async function addQuestionAction(_prev: OrganisationActionState, formData: FormData): Promise<OrganisationActionState> {
  const ctx = await context();
  if (!ctx.ok) return fail(ctx.message);
  const roleId = text(formData, "roleId");
  if (!isUuid(roleId)) return fail("Choose a role for the question.");
  try {
    await withTransaction((tx) => createOrganisationQuestion(tx, { ...contentFrom(formData), userId: ctx.userId, organisationId: ctx.organisationId, roleId }));
    revalidatePath("/organisation");
    return { status: "saved", message: "Question added. It is Pending approval: candidates see it once an administrator approves it." };
  } catch (err) {
    return fail(messageFor(err, "Adding the question"));
  }
}

/** Edit one of the organisation's questions; whatever its status, it goes back to Pending approval. */
export async function updateQuestionAction(_prev: OrganisationActionState, formData: FormData): Promise<OrganisationActionState> {
  const ctx = await context();
  if (!ctx.ok) return fail(ctx.message);
  const questionId = text(formData, "questionId");
  if (!isUuid(questionId)) return fail("That question could not be found.");
  try {
    await withTransaction((tx) => updateOrganisationQuestion(tx, { ...contentFrom(formData), userId: ctx.userId, organisationId: ctx.organisationId, questionId }));
    revalidatePath("/organisation");
    return { status: "saved", message: "Question saved. It is Pending approval again: candidates see it once an administrator approves it." };
  } catch (err) {
    return fail(messageFor(err, "Saving the question"));
  }
}

/** Delete one of the organisation's questions (pending or rejected only). */
export async function deleteQuestionAction(_prev: OrganisationActionState, formData: FormData): Promise<OrganisationActionState> {
  const ctx = await context();
  if (!ctx.ok) return fail(ctx.message);
  const questionId = text(formData, "questionId");
  if (!isUuid(questionId)) return fail("That question could not be found.");
  try {
    await withTransaction((tx) => deleteOrganisationQuestion(tx, { userId: ctx.userId, organisationId: ctx.organisationId, questionId }));
    revalidatePath("/organisation");
    return { status: "saved", message: "Question deleted." };
  } catch (err) {
    return fail(messageFor(err, "Deleting the question"));
  }
}
