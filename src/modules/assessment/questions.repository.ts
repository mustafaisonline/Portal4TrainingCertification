import type { Db, Tx } from "@/db/prisma";
import { getPrisma } from "@/db/prisma";
import { isUuid } from "@/modules/catalogue/offerings/repository";
import { writeAudit } from "@/modules/platform/audit/repository";
import { ADMIN_PAGE_SIZE, EDITABLE_STATUSES, QUESTION_STATUSES, type RoleQuestionStatus } from "./constants";
import { AssessmentError } from "./errors";
import { isOrganisationMember, organisationOffersRole } from "./organisations.repository";
import { type QuestionContent, validateQuestionContent } from "./question-validation";

export { AssessmentError } from "./errors";

/*
 * Role questions — Milestone P2–P4 (CR-2026-10-01-1711). Every question has
 * exactly FIVE options, exactly ONE correct (enforced here on every write), a
 * category (the per-topic breakdown) and a detailed MODEL ANSWER shown after the
 * test. Lifecycle: shared-bank questions arrive as DRAFTS (the import) and an
 * administrator marks them `reviewed`; an ORGANISATION's own questions are
 * `pending` until an administrator approves (→ `reviewed`); editing an approved
 * organisation question sends it back to `pending`. ONLY `reviewed` questions
 * are ever served. A question is edited or deleted only while draft / pending /
 * rejected. `organisation_id` NULL = the shared bank. Every write is audited.
 */

export type { QuestionContent } from "./question-validation";

export type AdminQuestion = {
  id: string;
  roleId: string;
  roleName: string;
  /** NULL = the shared bank. */
  organisationId: string | null;
  organisationName: string | null;
  category: string;
  stem: string;
  modelAnswer: string;
  status: RoleQuestionStatus;
  source: string | null;
  createdByName: string | null;
  reviewedByName: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  options: { position: number; text: string; isCorrect: boolean }[];
};

const adminSelect = {
  id: true,
  roleId: true,
  organisationId: true,
  category: true,
  stem: true,
  modelAnswer: true,
  status: true,
  source: true,
  reviewedAt: true,
  createdAt: true,
  updatedAt: true,
  role: { select: { name: true } },
  organisation: { select: { name: true } },
  createdBy: { select: { name: true } },
  reviewedBy: { select: { name: true } },
  options: { orderBy: { position: "asc" }, select: { position: true, text: true, isCorrect: true } },
} as const;

type AdminRow = {
  id: string;
  roleId: string;
  organisationId: string | null;
  category: string;
  stem: string;
  modelAnswer: string;
  status: RoleQuestionStatus;
  source: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  role: { name: string };
  organisation: { name: string } | null;
  createdBy: { name: string } | null;
  reviewedBy: { name: string } | null;
  options: { position: number; text: string; isCorrect: boolean }[];
};

function toAdmin(r: AdminRow): AdminQuestion {
  return {
    id: r.id,
    roleId: r.roleId,
    roleName: r.role.name,
    organisationId: r.organisationId,
    organisationName: r.organisation?.name ?? null,
    category: r.category,
    stem: r.stem,
    modelAnswer: r.modelAnswer,
    status: r.status,
    source: r.source,
    createdByName: r.createdBy?.name ?? null,
    reviewedByName: r.reviewedBy?.name ?? null,
    reviewedAt: r.reviewedAt,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    options: r.options,
  };
}

/** One question for the administrator. Read with sequential queries, not nested relation selects: those run in
 *  parallel, which trips pg's "already executing a query" warning on a transaction's single connection. */
async function getAdminQuestion(db: Db, id: string): Promise<AdminQuestion | null> {
  if (!isUuid(id)) return null;
  const q = await db.roleQuestion.findUnique({ where: { id }, select: { id: true, roleId: true, organisationId: true, category: true, stem: true, modelAnswer: true, status: true, source: true, reviewedAt: true, createdAt: true, updatedAt: true, createdByUserId: true, reviewedByUserId: true } });
  if (!q) return null;
  const role = await db.assessmentRole.findUnique({ where: { id: q.roleId }, select: { name: true } });
  const organisation = q.organisationId ? await db.organisation.findUnique({ where: { id: q.organisationId }, select: { name: true } }) : null;
  const createdBy = q.createdByUserId ? await db.user.findUnique({ where: { id: q.createdByUserId }, select: { name: true } }) : null;
  const reviewedBy = q.reviewedByUserId ? await db.user.findUnique({ where: { id: q.reviewedByUserId }, select: { name: true } }) : null;
  const options = await db.roleQuestionOption.findMany({ where: { questionId: id }, orderBy: { position: "asc" }, select: { position: true, text: true, isCorrect: true } });
  const { createdByUserId: _c, reviewedByUserId: _r, ...rest } = q;
  void _c;
  void _r;
  return toAdmin({ ...rest, role: { name: role?.name ?? "" }, organisation, createdBy, reviewedBy, options });
}

function isStatus(value: string): value is RoleQuestionStatus {
  return (QUESTION_STATUSES as readonly string[]).includes(value);
}

/** The role must exist, and a question's organisation must match the role's kind: a shared role takes
 *  shared (null) or any organisation's questions; a private role takes ONLY its own organisation's. */
async function checkRoleAndOwner(tx: Tx, roleId: string, organisationId: string | null): Promise<void> {
  const role = isUuid(roleId) ? await tx.assessmentRole.findUnique({ where: { id: roleId }, select: { id: true, organisationId: true } }) : null;
  if (!role) throw new AssessmentError("not_found", `No role ${roleId}.`);
  if (organisationId !== null) {
    if (!isUuid(organisationId) || !(await tx.organisation.findUnique({ where: { id: organisationId }, select: { id: true } }))) throw new AssessmentError("not_found", `No organisation ${organisationId}.`);
    if (role.organisationId !== null && role.organisationId !== organisationId) throw new AssessmentError("forbidden", "That role belongs to another organisation.");
  } else if (role.organisationId !== null) {
    throw new AssessmentError("invalid_input", "An organisation's private role takes only that organisation's questions.");
  }
}

/* ---------------------------------------------------------------- create */

export type CreateQuestionInput = QuestionContent & {
  roleId: string;
  /** NULL = the shared bank. */
  organisationId: string | null;
  status: RoleQuestionStatus;
  createdByUserId?: string | null;
};

/** Add one question (administration, the import, tests). Validates exactly five options and exactly one correct. */
export async function createQuestion(tx: Tx, input: CreateQuestionInput): Promise<AdminQuestion> {
  if (!isStatus(input.status)) throw new AssessmentError("invalid_input", `Unknown status "${input.status}".`);
  const content = validateQuestionContent(input);
  await checkRoleAndOwner(tx, input.roleId, input.organisationId);
  const row = await tx.roleQuestion.create({
    data: {
      roleId: input.roleId,
      organisationId: input.organisationId,
      category: content.category,
      stem: content.stem,
      modelAnswer: content.modelAnswer,
      status: input.status,
      source: content.source,
      createdByUserId: input.createdByUserId ?? null,
      reviewedByUserId: null,
      options: { create: content.options.map((o, i) => ({ position: i + 1, text: o.text, isCorrect: o.isCorrect })) },
    },
    select: { id: true },
  });
  await writeAudit(tx, {
    actorUserId: input.createdByUserId ?? null,
    action: "role_question.created",
    entityType: "role_question",
    entityId: row.id,
    after: { roleId: input.roleId, organisationId: input.organisationId, status: input.status, category: content.category },
  });
  return (await getAdminQuestion(tx, row.id))!;
}

export type ImportItem = QuestionContent;

/** Add DRAFT questions to a role's SHARED bank. Idempotent: a stem the bank already holds for the role
 *  (case-insensitive) is skipped. All items are validated first — one bad item imports nothing. */
export async function importDraftQuestions(tx: Tx, roleId: string, items: ImportItem[], actorId: string): Promise<{ inserted: number; skipped: number }> {
  const role = isUuid(roleId) ? await tx.assessmentRole.findUnique({ where: { id: roleId }, select: { id: true, organisationId: true } }) : null;
  if (!role) throw new AssessmentError("not_found", `No role ${roleId}.`);
  if (role.organisationId !== null) throw new AssessmentError("invalid_input", "The shared-bank import does not apply to an organisation's private role.");
  const valid = items.map((it, i) => validateQuestionContent(it, i));
  const existing = new Set((await tx.roleQuestion.findMany({ where: { roleId, organisationId: null }, select: { stem: true } })).map((q) => q.stem.trim().toLowerCase()));
  let inserted = 0;
  let skipped = 0;
  for (const q of valid) {
    const key = q.stem.toLowerCase();
    if (existing.has(key)) {
      skipped += 1;
      continue;
    }
    existing.add(key);
    await tx.roleQuestion.create({
      data: {
        roleId,
        organisationId: null,
        category: q.category,
        stem: q.stem,
        modelAnswer: q.modelAnswer,
        status: "draft",
        source: q.source,
        createdByUserId: actorId,
        options: { create: q.options.map((o, i) => ({ position: i + 1, text: o.text, isCorrect: o.isCorrect })) },
      },
    });
    inserted += 1;
  }
  await writeAudit(tx, { actorUserId: actorId, action: "role_question.imported", entityType: "assessment_role", entityId: roleId, after: { inserted, skipped } });
  return { inserted, skipped };
}

/* ---------------------------------------------------------- edit / delete */

async function replaceContent(tx: Tx, id: string, content: ReturnType<typeof validateQuestionContent>, extra: { status?: RoleQuestionStatus; clearReview?: boolean }): Promise<AdminQuestion> {
  await tx.roleQuestionOption.deleteMany({ where: { questionId: id } });
  const row = await tx.roleQuestion.update({
    where: { id },
    data: {
      category: content.category,
      stem: content.stem,
      modelAnswer: content.modelAnswer,
      source: content.source,
      ...(extra.status ? { status: extra.status } : {}),
      ...(extra.clearReview ? { reviewedByUserId: null, reviewedAt: null } : {}),
      options: { create: content.options.map((o, i) => ({ position: i + 1, text: o.text, isCorrect: o.isCorrect })) },
    },
    select: { id: true },
  });
  return (await getAdminQuestion(tx, row.id))!;
}

/** Edit a question (administration) — only while draft / pending / rejected; a reviewed one is returned to draft first. */
export async function updateQuestion(tx: Tx, id: string, content: QuestionContent, actorId: string): Promise<AdminQuestion> {
  const before = await getAdminQuestion(tx, id);
  if (!before) throw new AssessmentError("not_found", `No question ${id}.`);
  if (!EDITABLE_STATUSES.includes(before.status)) throw new AssessmentError("not_editable", "A reviewed question cannot be edited; return it to draft first.");
  const valid = validateQuestionContent(content);
  const after = await replaceContent(tx, id, valid, {});
  await writeAudit(tx, { actorUserId: actorId, action: "role_question.updated", entityType: "role_question", entityId: id, before: { stem: before.stem, status: before.status }, after: { stem: after.stem, status: after.status } });
  return after;
}

/** Delete a question (administration) — only while draft / pending / rejected. */
export async function deleteQuestion(tx: Tx, id: string, actorId: string): Promise<void> {
  const before = await getAdminQuestion(tx, id);
  if (!before) throw new AssessmentError("not_found", `No question ${id}.`);
  if (!EDITABLE_STATUSES.includes(before.status)) throw new AssessmentError("not_editable", "A reviewed question cannot be deleted; return it to draft first.");
  await tx.roleQuestion.delete({ where: { id } });
  await writeAudit(tx, { actorUserId: actorId, action: "role_question.deleted", entityType: "role_question", entityId: id, before: { roleId: before.roleId, organisationId: before.organisationId, status: before.status, stem: before.stem } });
}

/* ------------------------------------------- the organisation's own writes */

async function requireMember(tx: Tx, userId: string, organisationId: string): Promise<void> {
  if (!(await isOrganisationMember(userId, organisationId, tx))) throw new AssessmentError("forbidden", "You do not have access to this organisation.");
}

/** An organisation user adds a question for a role THEIR organisation offers. It starts `pending` — an administrator approves it. */
export async function createOrganisationQuestion(tx: Tx, input: QuestionContent & { userId: string; organisationId: string; roleId: string }): Promise<AdminQuestion> {
  await requireMember(tx, input.userId, input.organisationId);
  if (!(await organisationOffersRole(input.organisationId, input.roleId, tx))) throw new AssessmentError("role_not_offered", "Your organisation does not offer that role.");
  return createQuestion(tx, { ...input, status: "pending", createdByUserId: input.userId });
}

/** The question must belong to the organisation the person is a member of. */
async function ownQuestion(tx: Tx, userId: string, organisationId: string, questionId: string): Promise<AdminQuestion> {
  await requireMember(tx, userId, organisationId);
  const q = await getAdminQuestion(tx, questionId);
  if (!q || q.organisationId !== organisationId) throw new AssessmentError("not_found", `No question ${questionId} in your organisation.`);
  return q;
}

/** An organisation user edits one of ITS questions. Whatever its status (approved, rejected, pending) it goes back to `pending` for approval. */
export async function updateOrganisationQuestion(tx: Tx, input: QuestionContent & { userId: string; organisationId: string; questionId: string }): Promise<AdminQuestion> {
  const before = await ownQuestion(tx, input.userId, input.organisationId, input.questionId);
  const valid = validateQuestionContent(input);
  const after = await replaceContent(tx, input.questionId, valid, { status: "pending", clearReview: true });
  await writeAudit(tx, { actorUserId: input.userId, action: "role_question.updated", entityType: "role_question", entityId: input.questionId, before: { stem: before.stem, status: before.status }, after: { stem: after.stem, status: after.status } });
  return after;
}

/** An organisation user deletes one of ITS questions — only while draft / pending / rejected (edit an approved one to withdraw it first). */
export async function deleteOrganisationQuestion(tx: Tx, input: { userId: string; organisationId: string; questionId: string }): Promise<void> {
  const before = await ownQuestion(tx, input.userId, input.organisationId, input.questionId);
  if (!EDITABLE_STATUSES.includes(before.status)) throw new AssessmentError("not_editable", "An approved question cannot be deleted; edit it first to take it out of the tests.");
  await tx.roleQuestion.delete({ where: { id: input.questionId } });
  await writeAudit(tx, { actorUserId: input.userId, action: "role_question.deleted", entityType: "role_question", entityId: input.questionId, before: { roleId: before.roleId, organisationId: before.organisationId, status: before.status, stem: before.stem } });
}

/* --------------------------------------------------------------- review */

/** Move a question to another status (the administrator's review / approval). `reviewed` records who and when; any other status clears it. */
export async function setQuestionStatus(tx: Tx, id: string, status: RoleQuestionStatus, actorId: string, reason?: string): Promise<{ id: string; from: RoleQuestionStatus; to: RoleQuestionStatus }> {
  if (!isStatus(status)) throw new AssessmentError("invalid_input", `Unknown status "${status}".`);
  const before = isUuid(id) ? await tx.roleQuestion.findUnique({ where: { id }, select: { id: true, status: true } }) : null;
  if (!before) throw new AssessmentError("not_found", `No question ${id}.`);
  if (before.status === status) return { id, from: before.status, to: status };
  await tx.roleQuestion.update({ where: { id }, data: { status, reviewedByUserId: status === "reviewed" ? actorId : null, reviewedAt: status === "reviewed" ? new Date() : null } });
  await writeAudit(tx, { actorUserId: actorId, action: "role_question.status_changed", entityType: "role_question", entityId: id, before: { status: before.status }, after: { status }, reason: reason?.trim() || null });
  return { id, from: before.status, to: status };
}

/** Move every question of a role's bank (shared when `organisationId` is null, else that organisation's) from one status to another. Returns how many moved. */
export async function bulkSetStatus(tx: Tx, input: { roleId: string; organisationId: string | null; from: RoleQuestionStatus; to: RoleQuestionStatus }, actorId: string): Promise<number> {
  if (!isStatus(input.from) || !isStatus(input.to) || input.from === input.to) throw new AssessmentError("invalid_input", "Give two different statuses.");
  if (!isUuid(input.roleId)) throw new AssessmentError("not_found", `No role ${input.roleId}.`);
  const result = await tx.roleQuestion.updateMany({
    where: { roleId: input.roleId, organisationId: input.organisationId, status: input.from },
    data: { status: input.to, reviewedByUserId: input.to === "reviewed" ? actorId : null, reviewedAt: input.to === "reviewed" ? new Date() : null },
  });
  if (result.count > 0) {
    await writeAudit(tx, { actorUserId: actorId, action: "role_question.bulk_status_changed", entityType: "assessment_role", entityId: input.roleId, after: { organisationId: input.organisationId, from: input.from, to: input.to, count: result.count } });
  }
  return result.count;
}

/* --------------------------------------------------------------- readers */

export type AdminQuestionPage = { total: number; page: number; pages: number; rows: AdminQuestion[] };

/** Questions for the administrator, ADMIN_PAGE_SIZE a page. `organisationId`: undefined = every bank, null = the shared bank only, an id = that organisation's. */
export async function listQuestionsForAdmin(input: { roleId?: string; organisationId?: string | null; status?: RoleQuestionStatus; page?: number }, db: Db = getPrisma()): Promise<AdminQuestionPage> {
  const where = {
    ...(input.roleId !== undefined ? { roleId: input.roleId } : {}),
    ...(input.organisationId !== undefined ? { organisationId: input.organisationId } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
  };
  if ((input.roleId !== undefined && !isUuid(input.roleId)) || (typeof input.organisationId === "string" && !isUuid(input.organisationId))) return { total: 0, page: 1, pages: 1, rows: [] };
  const total = await db.roleQuestion.count({ where });
  const pages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));
  const page = Math.min(Math.max(1, Math.floor(input.page ?? 1) || 1), pages);
  const rows = await db.roleQuestion.findMany({ where, orderBy: [{ category: "asc" }, { createdAt: "asc" }, { stem: "asc" }], skip: (page - 1) * ADMIN_PAGE_SIZE, take: ADMIN_PAGE_SIZE, select: adminSelect });
  return { total, page, pages, rows: rows.map(toAdmin) };
}

/** Every question of one organisation (all statuses), optionally for one role — its own dashboard. */
export async function listQuestionsForOrganisation(organisationId: string, roleId?: string, db: Db = getPrisma()): Promise<AdminQuestion[]> {
  if (!isUuid(organisationId) || (roleId !== undefined && !isUuid(roleId))) return [];
  const rows = await db.roleQuestion.findMany({ where: { organisationId, ...(roleId !== undefined ? { roleId } : {}) }, orderBy: [{ category: "asc" }, { createdAt: "asc" }, { stem: "asc" }], select: adminSelect });
  return rows.map(toAdmin);
}

/** Question counts by status for one role's bank (shared when `organisationId` is null). All four keys are present. */
export async function countsByStatus(roleId: string, organisationId: string | null, db: Db = getPrisma()): Promise<Record<RoleQuestionStatus, number>> {
  const counts: Record<RoleQuestionStatus, number> = { draft: 0, pending: 0, reviewed: 0, rejected: 0 };
  if (!isUuid(roleId)) return counts;
  const rows = await db.roleQuestion.groupBy({ by: ["status"], where: { roleId, organisationId }, _count: { _all: true } });
  for (const r of rows) counts[r.status] = r._count._all;
  return counts;
}

/** Reviewed questions in a role's SHARED bank. */
export async function countReviewedShared(roleId: string, db: Db = getPrisma()): Promise<number> {
  if (!isUuid(roleId)) return 0;
  return db.roleQuestion.count({ where: { roleId, organisationId: null, status: "reviewed" } });
}
