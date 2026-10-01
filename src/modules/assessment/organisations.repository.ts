import type { Db, Tx } from "@/db/prisma";
import { getPrisma } from "@/db/prisma";
import { isUuid } from "@/modules/catalogue/offerings/repository";
import { grantRole, revokeRole } from "@/modules/identity/roles.repository";
import { writeAudit } from "@/modules/platform/audit/repository";
import { ORGANISATION_TYPES, type OrganisationType } from "./constants";
import { AssessmentError } from "./errors";
import { slugify, validateContactEmail, validateDescription, validateLogoPath, validateName, validateSlug } from "./question-validation";
import { isRoleListed } from "./rules";
import type { AssessmentRoleRecord } from "./roles.repository";

export { AssessmentError } from "./errors";

/*
 * Organisations — companies and education-sector bodies that screen
 * candidates (CR-2026-10-01-1711). An administrator registers one, links the
 * roles it offers, and grants "Organisation" access (the existing `org_admin`
 * role, scope `organisation`, scope id = the organisation) to its users — like
 * Trainer. Membership is `user_roles` (the only authorisation source of truth,
 * ADR-020); there is no membership table. Every write is audited.
 */

export type OrganisationRecord = {
  id: string;
  slug: string;
  name: string;
  type: OrganisationType;
  logoPath: string | null;
  contactEmail: string;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const orgSelect = { id: true, slug: true, name: true, type: true, logoPath: true, contactEmail: true, published: true, createdAt: true, updatedAt: true } as const;

/* ---------------------------------------------------- the listing rules */

type RoleCounts = { reviewedShared: Map<string, number>; approvedOwn: Map<string, number> };

/** Reviewed shared-bank counts for the roles, and the organisation's APPROVED (reviewed) own counts. */
async function countsFor(db: Db, organisationId: string, roleIds: string[]): Promise<RoleCounts> {
  if (roleIds.length === 0) return { reviewedShared: new Map(), approvedOwn: new Map() };
  const rows = await db.roleQuestion.groupBy({
    by: ["roleId", "organisationId"],
    where: { roleId: { in: roleIds }, status: "reviewed", OR: [{ organisationId: null }, { organisationId }] },
    _count: { _all: true },
  });
  const reviewedShared = new Map<string, number>();
  const approvedOwn = new Map<string, number>();
  for (const r of rows) (r.organisationId === null ? reviewedShared : approvedOwn).set(r.roleId, r._count._all);
  return { reviewedShared, approvedOwn };
}

export type OrganisationRoleView = {
  id: string;
  slug: string;
  name: string;
  description: string;
  position: number;
  published: boolean;
  /** True for the organisation's own role (created by it). */
  isPrivate: boolean;
  /** The organisation's own APPROVED (reviewed) questions for this role. */
  approvedQuestionCount: number;
  /** Reviewed shared-bank questions for this role (always 0 for a private role). */
  sharedQuestionCount: number;
  /** Shown to candidates: see `isRoleListed`. */
  listed: boolean;
};

/** The roles an organisation offers, with the counts that decide whether each is listed. */
export async function listOrganisationRoles(organisationId: string, opts: { onlyListed?: boolean } = {}, db: Db = getPrisma()): Promise<OrganisationRoleView[]> {
  if (!isUuid(organisationId)) return [];
  const links = await db.organisationRole.findMany({
    where: { organisationId },
    select: { role: { select: { id: true, slug: true, name: true, description: true, position: true, published: true, organisationId: true } } },
  });
  const roles = links.map((l) => l.role);
  const counts = await countsFor(db, organisationId, roles.map((r) => r.id));
  const views = roles.map((r): OrganisationRoleView => {
    const isPrivate = r.organisationId !== null;
    const approvedQuestionCount = counts.approvedOwn.get(r.id) ?? 0;
    const sharedQuestionCount = isPrivate ? 0 : (counts.reviewedShared.get(r.id) ?? 0);
    return {
      id: r.id,
      slug: r.slug,
      name: r.name,
      description: r.description,
      position: r.position,
      published: r.published,
      isPrivate,
      approvedQuestionCount,
      sharedQuestionCount,
      listed: isRoleListed({ isPrivate, published: r.published, reviewedSharedCount: sharedQuestionCount, approvedOrganisationCount: approvedQuestionCount }),
    };
  });
  views.sort((a, b) => a.position - b.position || a.name.localeCompare(b.name));
  return opts.onlyListed ? views.filter((v) => v.listed) : views;
}

/* ---------------------------------------------------------------- readers */

/** A PUBLISHED organisation by its URL name (the public page); null when missing or unpublished. */
export async function getOrganisationBySlug(slug: string, db: Db = getPrisma()): Promise<OrganisationRecord | null> {
  return db.organisation.findFirst({ where: { slug, published: true }, select: orgSelect });
}

/** Any organisation by id (administration, the organisation's own dashboard). */
export async function getOrganisationById(id: string, db: Db = getPrisma()): Promise<OrganisationRecord | null> {
  if (!isUuid(id)) return null;
  return db.organisation.findUnique({ where: { id }, select: orgSelect });
}

export type OrganisationListItem = OrganisationRecord & { listedRoleCount: number };

/** Organisations shown to the public: PUBLISHED and offering at least one LISTED role. */
export async function listPublishedOrganisations(db: Db = getPrisma()): Promise<OrganisationListItem[]> {
  const orgs = await db.organisation.findMany({ where: { published: true }, orderBy: { name: "asc" }, select: orgSelect });
  const out: OrganisationListItem[] = [];
  for (const o of orgs) {
    const listedRoleCount = (await listOrganisationRoles(o.id, { onlyListed: true }, db)).length;
    if (listedRoleCount >= 1) out.push({ ...o, listedRoleCount });
  }
  return out;
}

export type AdminOrganisationRow = OrganisationRecord & { roleCount: number; memberCount: number; pendingQuestionCount: number };

/** Every organisation with its role, member and awaiting-approval question counts. */
export async function listOrganisationsForAdmin(db: Db = getPrisma()): Promise<AdminOrganisationRow[]> {
  const orgs = await db.organisation.findMany({ orderBy: { name: "asc" }, select: orgSelect });
  const roleLinks = await db.organisationRole.groupBy({ by: ["organisationId"], _count: { _all: true } });
  const pending = await db.roleQuestion.groupBy({ by: ["organisationId"], where: { organisationId: { not: null }, status: "pending" }, _count: { _all: true } });
  const members = await db.userRole.groupBy({ by: ["scopeId"], where: { role: "org_admin", scopeType: "organisation", revokedAt: null }, _count: { _all: true } });
  const roleBy = new Map(roleLinks.map((r) => [r.organisationId, r._count._all]));
  const pendingBy = new Map(pending.map((r) => [r.organisationId, r._count._all]));
  const memberBy = new Map(members.map((r) => [r.scopeId, r._count._all]));
  return orgs.map((o) => ({ ...o, roleCount: roleBy.get(o.id) ?? 0, memberCount: memberBy.get(o.id) ?? 0, pendingQuestionCount: pendingBy.get(o.id) ?? 0 }));
}

/* ----------------------------------------------------------- administration */

function checkType(type: string): OrganisationType {
  if (!(ORGANISATION_TYPES as readonly string[]).includes(type)) throw new AssessmentError("invalid_input", `the type must be ${ORGANISATION_TYPES.join(" or ")}`);
  return type as OrganisationType;
}

export type OrganisationInput = { name: string; type: OrganisationType; contactEmail: string; slug?: string; logoPath?: string | null; published?: boolean };

/** Register an organisation (an administrator). Starts unpublished unless `published` is true. */
export async function createOrganisation(tx: Tx, input: OrganisationInput, actorId: string): Promise<OrganisationRecord> {
  const name = validateName(input.name, "the organisation name");
  const slug = validateSlug(input.slug ?? slugify(name));
  const data = { slug, name, type: checkType(input.type), logoPath: validateLogoPath(input.logoPath), contactEmail: validateContactEmail(input.contactEmail), published: input.published === true };
  if (await tx.organisation.findUnique({ where: { slug }, select: { id: true } })) throw new AssessmentError("slug_taken", `The URL name "${slug}" is already used.`);
  const row = await tx.organisation.create({ data, select: orgSelect });
  await writeAudit(tx, { actorUserId: actorId, action: "organisation.created", entityType: "organisation", entityId: row.id, after: { slug, name, type: data.type, published: data.published } });
  return row;
}

/** Edit the organisation's details. The URL name never changes (its private roles' names and public links depend on it). */
export async function updateOrganisation(tx: Tx, id: string, input: { name?: string; type?: OrganisationType; contactEmail?: string; logoPath?: string | null }, actorId: string): Promise<OrganisationRecord> {
  const before = await getOrganisationById(id, tx);
  if (!before) throw new AssessmentError("not_found", `No organisation ${id}.`);
  const data = {
    name: input.name === undefined ? before.name : validateName(input.name, "the organisation name"),
    type: input.type === undefined ? before.type : checkType(input.type),
    contactEmail: input.contactEmail === undefined ? before.contactEmail : validateContactEmail(input.contactEmail),
    logoPath: input.logoPath === undefined ? before.logoPath : validateLogoPath(input.logoPath),
  };
  const row = await tx.organisation.update({ where: { id }, data, select: orgSelect });
  await writeAudit(tx, {
    actorUserId: actorId,
    action: "organisation.updated",
    entityType: "organisation",
    entityId: id,
    before: { name: before.name, type: before.type, contactEmail: before.contactEmail, logoPath: before.logoPath },
    after: data,
  });
  return row;
}

export async function setOrganisationPublished(tx: Tx, id: string, published: boolean, actorId: string): Promise<OrganisationRecord> {
  const before = await getOrganisationById(id, tx);
  if (!before) throw new AssessmentError("not_found", `No organisation ${id}.`);
  if (before.published === published) return before;
  const row = await tx.organisation.update({ where: { id }, data: { published }, select: orgSelect });
  await writeAudit(tx, { actorUserId: actorId, action: "organisation.published_changed", entityType: "organisation", entityId: id, before: { published: before.published }, after: { published } });
  return row;
}

/* ----------------------------------------------------------------- roles */

const roleRecordSelect = { id: true, slug: true, name: true, description: true, position: true, published: true, organisationId: true, createdAt: true, updatedAt: true } as const;

/** Does the organisation offer this role? */
export async function organisationOffersRole(organisationId: string, roleId: string, db: Db = getPrisma()): Promise<boolean> {
  if (!isUuid(organisationId) || !isUuid(roleId)) return false;
  return (await db.organisationRole.count({ where: { organisationId, roleId } })) > 0;
}

/** The organisations that offer a role — for the administrator's "add a question on an organisation's behalf". */
export async function listOrganisationsOfferingRole(roleId: string, db: Db = getPrisma()): Promise<{ id: string; name: string }[]> {
  if (!isUuid(roleId)) return [];
  const rows = await db.organisationRole.findMany({ where: { roleId }, select: { organisation: { select: { id: true, name: true } } }, orderBy: { organisation: { name: "asc" } } });
  return rows.map((r) => r.organisation);
}

/** Offer a SHARED role (or one of the organisation's own roles) to the organisation. Returns false when it already did. */
export async function addRoleToOrganisation(tx: Tx, organisationId: string, roleId: string, actorId: string): Promise<boolean> {
  const org = await getOrganisationById(organisationId, tx);
  if (!org) throw new AssessmentError("not_found", `No organisation ${organisationId}.`);
  const role = isUuid(roleId) ? await tx.assessmentRole.findUnique({ where: { id: roleId }, select: { id: true, organisationId: true } }) : null;
  if (!role) throw new AssessmentError("not_found", `No role ${roleId}.`);
  if (role.organisationId !== null && role.organisationId !== organisationId) throw new AssessmentError("forbidden", "That role belongs to another organisation.");
  if (await organisationOffersRole(organisationId, roleId, tx)) return false;
  await tx.organisationRole.create({ data: { organisationId, roleId } });
  await writeAudit(tx, { actorUserId: actorId, action: "organisation_role.added", entityType: "organisation", entityId: organisationId, after: { roleId } });
  return true;
}

/** Stop offering a role. The organisation's questions for it stay (and return if the role is offered again). Returns false when it was not offered. */
export async function removeRoleFromOrganisation(tx: Tx, organisationId: string, roleId: string, actorId: string): Promise<boolean> {
  if (!isUuid(organisationId) || !isUuid(roleId)) return false;
  const removed = await tx.organisationRole.deleteMany({ where: { organisationId, roleId } });
  if (removed.count === 0) return false;
  await writeAudit(tx, { actorUserId: actorId, action: "organisation_role.removed", entityType: "organisation", entityId: organisationId, before: { roleId } });
  return true;
}

/** Create the organisation's OWN role (URL name `<organisation slug>-<role slug>`), offered by it. It is
 *  published at once but LISTED only once ≥ 10 of its questions are approved. */
export async function createPrivateRole(tx: Tx, organisationId: string, input: { name: string; description: string }, actorId: string): Promise<AssessmentRoleRecord> {
  const org = await getOrganisationById(organisationId, tx);
  if (!org) throw new AssessmentError("not_found", `No organisation ${organisationId}.`);
  const name = validateName(input.name, "the role name");
  const description = validateDescription(input.description);
  const tail = slugify(name);
  if (!tail) throw new AssessmentError("invalid_input", "the role name must contain letters or digits");
  const slug = validateSlug(`${org.slug}-${tail}`.slice(0, 80).replace(/-+$/g, ""));
  if (await tx.assessmentRole.findUnique({ where: { slug }, select: { id: true } })) throw new AssessmentError("slug_taken", `The URL name "${slug}" is already used.`);
  const role = await tx.assessmentRole.create({ data: { slug, name, description, position: 1000, published: true, organisationId }, select: roleRecordSelect });
  await tx.organisationRole.create({ data: { organisationId, roleId: role.id } });
  await writeAudit(tx, { actorUserId: actorId, action: "assessment_role.created", entityType: "assessment_role", entityId: role.id, after: { slug, name, organisationId, published: true, private: true } });
  await writeAudit(tx, { actorUserId: actorId, action: "organisation_role.added", entityType: "organisation", entityId: organisationId, after: { roleId: role.id } });
  return role;
}

/** Edit the name or description of the organisation's OWN role (never a shared role). */
export async function updatePrivateRole(tx: Tx, organisationId: string, roleId: string, input: { name?: string; description?: string }, actorId: string): Promise<AssessmentRoleRecord> {
  const before = isUuid(roleId) ? await tx.assessmentRole.findUnique({ where: { id: roleId }, select: roleRecordSelect }) : null;
  if (!before) throw new AssessmentError("not_found", `No role ${roleId}.`);
  if (before.organisationId !== organisationId) throw new AssessmentError("forbidden", "Only an organisation's own role can be edited here.");
  const data = {
    name: input.name === undefined ? before.name : validateName(input.name, "the role name"),
    description: input.description === undefined ? before.description : validateDescription(input.description),
  };
  const row = await tx.assessmentRole.update({ where: { id: roleId }, data, select: roleRecordSelect });
  await writeAudit(tx, { actorUserId: actorId, action: "assessment_role.updated", entityType: "assessment_role", entityId: roleId, before: { name: before.name, description: before.description }, after: data });
  return row;
}

/* ------------------------------------------------------------ membership */

/** Is the person an Organisation user OF THIS organisation (`org_admin`, scope organisation, not revoked)? */
export async function isOrganisationMember(userId: string, organisationId: string, db: Db = getPrisma()): Promise<boolean> {
  if (!isUuid(userId) || !isUuid(organisationId)) return false;
  return (await db.userRole.count({ where: { userId, role: "org_admin", scopeType: "organisation", scopeId: organisationId, revokedAt: null } })) > 0;
}

/** The first organisation (by when access was granted) the person holds Organisation access for; null when none. */
export async function organisationForUser(userId: string, db: Db = getPrisma()): Promise<OrganisationRecord | null> {
  if (!isUuid(userId)) return null;
  const grants = await db.userRole.findMany({
    where: { userId, role: "org_admin", scopeType: "organisation", revokedAt: null, scopeId: { not: null } },
    orderBy: { grantedAt: "asc" },
    select: { scopeId: true },
  });
  for (const g of grants) {
    const org = await getOrganisationById(g.scopeId!, db);
    if (org) return org;
  }
  return null;
}

/** Give a person Organisation access to an organisation (like granting Trainer). Returns false when they already had it. */
export async function grantOrganisationAccess(tx: Tx, input: { userId: string; organisationId: string; grantedByUserId: string | null }): Promise<boolean> {
  const org = await getOrganisationById(input.organisationId, tx);
  if (!org) throw new AssessmentError("not_found", `No organisation ${input.organisationId}.`);
  if (!isUuid(input.userId) || !(await tx.user.findUnique({ where: { id: input.userId }, select: { id: true } }))) throw new AssessmentError("not_found", `No user ${input.userId}.`);
  const granted = await grantRole(tx, { userId: input.userId, role: "org_admin", scope: { scopeType: "organisation", scopeId: input.organisationId }, grantedByUserId: input.grantedByUserId, reason: `Organisation access: ${org.name}` });
  if (granted) await writeAudit(tx, { actorUserId: input.grantedByUserId, action: "organisation_access.granted", entityType: "organisation", entityId: input.organisationId, after: { userId: input.userId } });
  return granted;
}

/** Withdraw the person's Organisation access. Returns false when they had none. */
export async function revokeOrganisationAccess(tx: Tx, input: { userId: string; organisationId: string; revokedByUserId: string | null }): Promise<boolean> {
  const revoked = await revokeRole(tx, { userId: input.userId, role: "org_admin", scope: { scopeType: "organisation", scopeId: input.organisationId }, revokedByUserId: input.revokedByUserId, reason: "Organisation access withdrawn" });
  if (revoked) await writeAudit(tx, { actorUserId: input.revokedByUserId, action: "organisation_access.revoked", entityType: "organisation", entityId: input.organisationId, before: { userId: input.userId } });
  return revoked;
}

export type OrganisationMember = { userId: string; name: string; email: string; grantedAt: Date };

/** The people who currently hold Organisation access to it, oldest grant first. */
export async function listOrganisationMembers(organisationId: string, db: Db = getPrisma()): Promise<OrganisationMember[]> {
  if (!isUuid(organisationId)) return [];
  const rows = await db.userRole.findMany({
    where: { role: "org_admin", scopeType: "organisation", scopeId: organisationId, revokedAt: null },
    orderBy: { grantedAt: "asc" },
    select: { grantedAt: true, user: { select: { id: true, name: true, email: true } } },
  });
  return rows.map((r) => ({ userId: r.user.id, name: r.user.name, email: r.user.email, grantedAt: r.grantedAt }));
}
