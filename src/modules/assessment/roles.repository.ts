import type { Db, Tx } from "@/db/prisma";
import { getPrisma } from "@/db/prisma";
import { isUuid } from "@/modules/catalogue/offerings/repository";
import { writeAudit } from "@/modules/platform/audit/repository";
import { AssessmentError } from "./errors";
import { slugify, validateDescription, validateName, validateSlug } from "./question-validation";
import type { RoleQuestionStatus } from "./constants";

export { AssessmentError } from "./errors";

/*
 * Assessment roles — the job roles a person can practise for (Prepare for
 * Interview) or be screened for (Organisation Interview Screening).
 * `organisation_id` NULL = a SHARED role of the catalogue (created by an
 * administrator here); set = an organisation's PRIVATE role (created through
 * `organisations.repository.createPrivateRole`). Every administrator write is
 * audited in the caller's transaction.
 */

export type AssessmentRoleRecord = {
  id: string;
  slug: string;
  name: string;
  description: string;
  position: number;
  published: boolean;
  /** NULL = shared role; set = that organisation's private role. */
  organisationId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const roleSelect = { id: true, slug: true, name: true, description: true, position: true, published: true, organisationId: true, createdAt: true, updatedAt: true } as const;

export type PublicRoleView = { id: string; slug: string; name: string; description: string; reviewedQuestionCount: number };

/** Reviewed shared-bank question counts per role id (one query). */
async function reviewedSharedCounts(db: Db, roleIds: string[]): Promise<Map<string, number>> {
  if (roleIds.length === 0) return new Map();
  const rows = await db.roleQuestion.groupBy({ by: ["roleId"], where: { roleId: { in: roleIds }, organisationId: null, status: "reviewed" }, _count: { _all: true } });
  return new Map(rows.map((r) => [r.roleId, r._count._all]));
}

/** Published SHARED roles, in display order, each with the number of reviewed
 *  shared questions behind it (a role with 0 cannot be started yet — show it as
 *  "coming soon"). */
export async function listPublishedSharedRoles(db: Db = getPrisma()): Promise<PublicRoleView[]> {
  const rows = await db.assessmentRole.findMany({ where: { organisationId: null, published: true }, orderBy: [{ position: "asc" }, { name: "asc" }], select: roleSelect });
  const counts = await reviewedSharedCounts(db, rows.map((r) => r.id));
  return rows.map((r) => ({ id: r.id, slug: r.slug, name: r.name, description: r.description, reviewedQuestionCount: counts.get(r.id) ?? 0 }));
}

/** A PUBLISHED shared role by its URL name (the public page); null when missing, private or unpublished. */
export async function getSharedRoleBySlug(slug: string, db: Db = getPrisma()): Promise<PublicRoleView | null> {
  const r = await db.assessmentRole.findFirst({ where: { slug, organisationId: null, published: true }, select: roleSelect });
  if (!r) return null;
  const counts = await reviewedSharedCounts(db, [r.id]);
  return { id: r.id, slug: r.slug, name: r.name, description: r.description, reviewedQuestionCount: counts.get(r.id) ?? 0 };
}

/** Any role (shared or private, published or not) by id — administration and the repositories. */
export async function getRoleById(id: string, db: Db = getPrisma()): Promise<AssessmentRoleRecord | null> {
  if (!isUuid(id)) return null;
  return db.assessmentRole.findUnique({ where: { id }, select: roleSelect });
}

export type AdminRoleRow = AssessmentRoleRecord & {
  organisationName: string | null;
  /** Question counts by status: the SHARED bank for a shared role, the organisation's own for a private role. */
  counts: Record<RoleQuestionStatus, number>;
  /** Test attempts taken on this role — a role with any cannot be deleted (CR-2026-10-01-2136). */
  attemptCount: number;
};

/** Every role (shared first, then private by organisation) with its question counts by status. */
export async function listRolesForAdmin(db: Db = getPrisma()): Promise<AdminRoleRow[]> {
  const rows = await db.assessmentRole.findMany({
    orderBy: [{ organisationId: { sort: "asc", nulls: "first" } }, { position: "asc" }, { name: "asc" }],
    select: { ...roleSelect, organisation: { select: { name: true } } },
  });
  const grouped = await db.roleQuestion.groupBy({ by: ["roleId", "organisationId", "status"], _count: { _all: true } });
  const attempts = await db.roleTestAttempt.groupBy({ by: ["roleId"], _count: { _all: true } });
  const attemptsBy = new Map(attempts.map((a) => [a.roleId, a._count._all]));
  return rows.map((r) => {
    const counts: Record<RoleQuestionStatus, number> = { draft: 0, pending: 0, reviewed: 0, rejected: 0 };
    for (const g of grouped) if (g.roleId === r.id && g.organisationId === r.organisationId) counts[g.status] += g._count._all;
    const { organisation, ...role } = r;
    return { ...role, organisationName: organisation?.name ?? null, counts, attemptCount: attemptsBy.get(r.id) ?? 0 };
  });
}

export type RoleInput = { name: string; description: string; slug?: string; position?: number; published?: boolean };

function checkPosition(position: number | undefined): number {
  if (position === undefined) return 0;
  if (!Number.isInteger(position) || position < 0 || position > 10_000) throw new AssessmentError("invalid_input", "the position must be a whole number from 0 to 10000");
  return position;
}

/** Create a SHARED role (an administrator). The URL name defaults to the slug of the name. */
export async function createRole(tx: Tx, input: RoleInput, actorId: string): Promise<AssessmentRoleRecord> {
  const name = validateName(input.name, "the role name");
  const description = validateDescription(input.description);
  const slug = validateSlug(input.slug ?? slugify(name));
  if (await tx.assessmentRole.findUnique({ where: { slug }, select: { id: true } })) throw new AssessmentError("slug_taken", `The URL name "${slug}" is already used.`);
  const row = await tx.assessmentRole.create({ data: { slug, name, description, position: checkPosition(input.position), published: input.published === true, organisationId: null }, select: roleSelect });
  await writeAudit(tx, { actorUserId: actorId, action: "assessment_role.created", entityType: "assessment_role", entityId: row.id, after: { slug, name, published: row.published, position: row.position } });
  return row;
}

/** Edit a role's name, description or position. The URL name never changes (links and private-role names depend on it). */
export async function updateRole(tx: Tx, id: string, input: { name?: string; description?: string; position?: number }, actorId: string): Promise<AssessmentRoleRecord> {
  const before = await getRoleById(id, tx);
  if (!before) throw new AssessmentError("not_found", `No role ${id}.`);
  const data = {
    name: input.name === undefined ? before.name : validateName(input.name, "the role name"),
    description: input.description === undefined ? before.description : validateDescription(input.description),
    position: input.position === undefined ? before.position : checkPosition(input.position),
  };
  const row = await tx.assessmentRole.update({ where: { id }, data, select: roleSelect });
  await writeAudit(tx, {
    actorUserId: actorId,
    action: "assessment_role.updated",
    entityType: "assessment_role",
    entityId: id,
    before: { name: before.name, description: before.description, position: before.position },
    after: data,
  });
  return row;
}

/** Publish or unpublish a role (shared or private). Whether it is also LISTED depends on its questions (see `isRoleListed`). */
/** What deleting a role would remove — shown in the confirmation. */
export async function roleDeletionInfo(id: string, db: Db = getPrisma()): Promise<{ attempts: number; questions: number; organisationLinks: number }> {
  if (!isUuid(id)) return { attempts: 0, questions: 0, organisationLinks: 0 };
  const [attempts, questions, organisationLinks] = await Promise.all([
    db.roleTestAttempt.count({ where: { roleId: id } }),
    db.roleQuestion.count({ where: { roleId: id } }),
    db.organisationRole.count({ where: { roleId: id } }),
  ]);
  return { attempts, questions, organisationLinks };
}

/** Delete a SHARED role (an administrator). Refused while ANY test attempt exists on it — results are never deleted;
 *  such a role can only be unpublished. Its questions (and their options) and its organisation links go with it,
 *  and the audit row records what was removed (CR-2026-10-01-2136, founder: "add option for edit and delete"). */
export async function deleteRole(tx: Tx, id: string, actorId: string): Promise<{ questions: number; organisationLinks: number }> {
  const role = await getRoleById(id, tx);
  if (!role) throw new AssessmentError("not_found", `No role ${id}.`);
  if (role.organisationId !== null) throw new AssessmentError("forbidden", "An organisation's own role is managed from that organisation.");
  const info = await roleDeletionInfo(id, tx);
  if (info.attempts > 0) throw new AssessmentError("not_editable", `This role has ${info.attempts} test ${info.attempts === 1 ? "attempt" : "attempts"} and cannot be deleted — unpublish it instead.`);
  await tx.assessmentRole.delete({ where: { id } });
  await writeAudit(tx, { actorUserId: actorId, action: "assessment_role.deleted", entityType: "assessment_role", entityId: id, before: { slug: role.slug, name: role.name, published: role.published }, after: { questionsRemoved: info.questions, organisationLinksRemoved: info.organisationLinks } });
  return { questions: info.questions, organisationLinks: info.organisationLinks };
}

export async function setRolePublished(tx: Tx, id: string, published: boolean, actorId: string): Promise<AssessmentRoleRecord> {
  const before = await getRoleById(id, tx);
  if (!before) throw new AssessmentError("not_found", `No role ${id}.`);
  if (before.published === published) return before;
  const row = await tx.assessmentRole.update({ where: { id }, data: { published }, select: roleSelect });
  await writeAudit(tx, { actorUserId: actorId, action: "assessment_role.published_changed", entityType: "assessment_role", entityId: id, before: { published: before.published }, after: { published } });
  return row;
}
