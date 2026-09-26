import type { Db, Tx } from "@/db/prisma";
import { getPrisma } from "@/db/prisma";
import { isUuid } from "@/modules/catalogue/offerings/repository";
import { getProfile } from "./profile.repository";
import { type ActiveRole, grantRole, isRole, PLATFORM, type Role, revokeRole } from "./roles.repository";

/*
 * Administrator view of people (MILESTONE_8_EXECUTION_PLAN.md §2 item 4;
 * ADMIN_REQUIREMENTS AD-*). READ paths join what the person's own screens
 * already show; the profile summary comes from the SAME masked view the
 * profile page renders (`getProfile`), so the ID number can only ever
 * appear as its last four — the ciphertext is never selected here and there
 * is no decrypt call in this module. The photo bytes are never selected.
 *
 * WRITE paths are two: grant and revoke `platform_admin` at platform scope
 * (default G3 — the only grantable role in the MVP). Both delegate to
 * roles.repository so the row semantics (unique key, re-activation, audit)
 * stay in one place; this module adds the two refusals the plan names.
 */

export const ADMIN_USERS_PAGE_SIZE = 25;

export const ROLE_LABEL: Record<Role, string> = {
  participant: "Participant",
  // Milestone 12 (decision L1): the `expert` role IS the Trainer role and is
  // shown as "Trainer" everywhere; the enum value is unchanged.
  expert: "Trainer",
  assessor: "Assessor",
  org_admin: "Organisation administrator",
  platform_admin: "Platform administrator",
};

/* ------------------------------------------------------------------ errors */

export class AdminUserNotFoundError extends Error {
  constructor(id: string) {
    super(`User ${id} not found.`);
    this.name = "AdminUserNotFoundError";
  }
}

export type RoleChangeRefusalCode = "self_revoke" | "last_admin" | "not_admin" | "not_trainer";

/** A rule refused the change; `code` is stable for actions and tests. */
export class RoleChangeRefusedError extends Error {
  readonly code: RoleChangeRefusalCode;
  constructor(code: RoleChangeRefusalCode, message: string) {
    super(message);
    this.name = "RoleChangeRefusedError";
    this.code = code;
  }
}

/* -------------------------------------------------------------------- list */

export type AdminUserListItem = {
  id: string;
  email: string;
  name: string;
  country: string | null;
  emailVerifiedAt: Date | null;
  createdAt: Date;
  roles: ActiveRole[];
  /** Confirmed registrations only. */
  registrationCount: number;
  certificateCount: number;
};

export type AdminUserFilters = {
  /** Case-insensitive "contains" on name or email. */
  q?: string;
  /** Only people holding this role actively (any scope). */
  role?: Role;
  page?: number;
};

export type AdminUserPage = { items: AdminUserListItem[]; total: number; page: number; pageSize: number; pageCount: number };

export async function listUsersForAdmin(filters: AdminUserFilters = {}, db: Db = getPrisma()): Promise<AdminUserPage> {
  const q = filters.q?.trim();
  const where = {
    ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" as const } }, { email: { contains: q, mode: "insensitive" as const } }] } : {}),
    ...(filters.role ? { roles: { some: { role: filters.role, revokedAt: null } } } : {}),
  };
  const pageSize = ADMIN_USERS_PAGE_SIZE;
  const total = await db.user.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, filters.page ?? 1), pageCount);
  const rows = await db.user.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    skip: (page - 1) * pageSize,
    take: pageSize,
    select: {
      id: true,
      email: true,
      name: true,
      country: true,
      emailVerifiedAt: true,
      createdAt: true,
      roles: { where: { revokedAt: null }, select: { role: true, scopeType: true, scopeId: true }, orderBy: { grantedAt: "asc" } },
      _count: { select: { registrations: { where: { status: "confirmed" } }, certificates: true } },
    },
  });
  return {
    items: rows.map((r) => ({
      id: r.id,
      email: r.email,
      name: r.name,
      country: r.country,
      emailVerifiedAt: r.emailVerifiedAt,
      createdAt: r.createdAt,
      roles: r.roles.map((x) => ({ role: x.role, scopeType: x.scopeType, scopeId: x.scopeId })),
      registrationCount: r._count.registrations,
      certificateCount: r._count.certificates,
    })),
    total,
    page,
    pageSize,
    pageCount,
  };
}

/* ------------------------------------------------------------------ detail */

/** The minimum useful profile summary for an administrator: what identifies
 *  the person for a certificate or an invoice. Address lines, LinkedIn,
 *  industry and marketing fields are deliberately left out. */
export type AdminProfileSummary = {
  legalName: string;
  displayName: string | null;
  phoneE164: string | null;
  countryCode: string | null;
  nationalityCode: string | null;
  organisation: string | null;
  jobTitle: string | null;
  idType: "nric" | "passport" | null;
  /** "••••1234" — the masked view, exactly as the profile page shows it. */
  idNumberMasked: string | null;
  dateOfBirth: string | null;
  hasPhoto: boolean;
  completedAt: Date | null;
};

export type AdminUserRegistration = {
  id: string;
  status: "confirmed" | "cancelled" | "transferred";
  createdAt: Date;
  cancelledAt: Date | null;
  offeringId: string;
  programmeTitle: string;
  formatName: string | null;
  startsOn: Date;
  endsOn: Date;
};

export type AdminUserOrder = {
  id: string;
  kind: "registration" | "certificate_renewal";
  status: "pending" | "paid" | "expired" | "failed" | "cancelled" | "refunded" | "partially_refunded";
  currency: string;
  amountMinor: number;
  createdAt: Date;
  paidAt: Date | null;
  programmeTitle: string;
  certificateCode: string | null;
};

export type AdminUserCertificate = {
  id: string;
  certificateId: string;
  programmeTitle: string;
  issuedOn: Date;
  expiresOn: Date;
  revokedAt: Date | null;
};

export type AdminUserReview = {
  id: string;
  kind: "registration" | "diagnostic";
  programmeTitle: string;
  rating: number | null;
  moderationStatus: "pending" | "approved" | "rejected";
  visibilityStatus: "visible" | "hidden";
  consentPublic: boolean;
  submittedAt: Date;
};

export type AdminUserConsent = { documentKey: string; documentVersion: string; acceptedAt: Date };

export type AdminUserRoleRow = {
  id: string;
  role: Role;
  scopeType: "platform" | "organisation" | "offering";
  scopeId: string | null;
  grantedAt: Date;
  grantedByUserId: string | null;
  grantedByEmail: string | null;
  revokedAt: Date | null;
  revokedByUserId: string | null;
  revokedByEmail: string | null;
  active: boolean;
};

export type AdminUserRoleEvent = {
  id: string;
  action: "role.granted" | "role.revoked";
  role: string;
  scopeType: string;
  actorUserId: string | null;
  actorEmail: string | null;
  reason: string | null;
  createdAt: Date;
};

export type AdminUserDetail = {
  id: string;
  email: string;
  name: string;
  country: string | null;
  emailVerifiedAt: Date | null;
  createdAt: Date;
  profile: AdminProfileSummary | null;
  registrations: AdminUserRegistration[];
  orders: AdminUserOrder[];
  certificates: AdminUserCertificate[];
  reviews: AdminUserReview[];
  consents: AdminUserConsent[];
  roles: AdminUserRoleRow[];
  roleHistory: AdminUserRoleEvent[];
  isPlatformAdmin: boolean;
  /** Holds the Trainer role (`expert`, platform scope) — Milestone 12. */
  isTrainer: boolean;
  /** The Trainer profile linked to this account, if any (`experts.user_id`). */
  trainerProfile: { id: string; slug: string; published: boolean } | null;
};

async function emailsById(ids: (string | null)[], db: Db): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter((x): x is string => x !== null))];
  if (unique.length === 0) return new Map();
  const rows = await db.user.findMany({ where: { id: { in: unique } }, select: { id: true, email: true } });
  return new Map(rows.map((r) => [r.id, r.email]));
}

export async function getUserForAdmin(id: string, db: Db = getPrisma()): Promise<AdminUserDetail | null> {
  if (!isUuid(id)) return null;
  const user = await db.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, country: true, emailVerifiedAt: true, createdAt: true },
  });
  if (!user) return null;

  const [view, registrations, orders, certificates, reviews, consents, roleRows, roleAudit] = await Promise.all([
    getProfile(id, db),
    db.registration.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        createdAt: true,
        cancelledAt: true,
        offeringId: true,
        offering: { select: { startsOn: true, endsOn: true, programme: { select: { title: true } }, deliveryFormat: { select: { name: true } } } },
      },
    }),
    db.order.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        kind: true,
        status: true,
        currency: true,
        amountMinor: true,
        createdAt: true,
        paidAt: true,
        programme: { select: { title: true } },
        certificate: { select: { certificateId: true } },
      },
    }),
    db.certificate.findMany({
      where: { userId: id },
      orderBy: [{ issuedOn: "desc" }, { createdAt: "desc" }],
      select: { id: true, certificateId: true, programmeTitle: true, issuedOn: true, expiresOn: true, revokedAt: true },
    }),
    db.review.findMany({
      where: { userId: id },
      orderBy: { submittedAt: "desc" },
      select: {
        id: true,
        kind: true,
        rating: true,
        moderationStatus: true,
        visibilityStatus: true,
        consentPublic: true,
        submittedAt: true,
        programme: { select: { title: true } },
      },
    }),
    db.consent.findMany({ where: { userId: id }, orderBy: { acceptedAt: "asc" }, select: { documentKey: true, documentVersion: true, acceptedAt: true } }),
    db.userRole.findMany({ where: { userId: id }, orderBy: { grantedAt: "asc" } }),
    db.auditLog.findMany({
      where: { entityType: "user", entityId: id, action: { in: ["role.granted", "role.revoked"] } },
      orderBy: { createdAt: "desc" },
      select: { id: true, action: true, actorUserId: true, before: true, after: true, reason: true, createdAt: true },
    }),
  ]);

  const emails = await emailsById(
    [...roleRows.map((r) => r.grantedByUserId), ...roleRows.map((r) => r.revokedByUserId), ...roleAudit.map((a) => a.actorUserId)],
    db,
  );
  const snapshot = (v: unknown): { role: string; scopeType: string } => {
    const o = (v ?? {}) as Record<string, unknown>;
    return { role: String(o["role"] ?? ""), scopeType: String(o["scopeType"] ?? "") };
  };

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    country: user.country,
    emailVerifiedAt: user.emailVerifiedAt,
    createdAt: user.createdAt,
    profile: view
      ? {
          legalName: view.legalName,
          displayName: view.displayName,
          phoneE164: view.phoneE164,
          countryCode: view.countryCode,
          nationalityCode: view.nationalityCode,
          organisation: view.organisation,
          jobTitle: view.jobTitle,
          idType: view.idType,
          idNumberMasked: view.idNumberMasked,
          dateOfBirth: view.dateOfBirth,
          hasPhoto: view.hasPhoto,
          completedAt: view.completedAt,
        }
      : null,
    registrations: registrations.map((r) => ({
      id: r.id,
      status: r.status,
      createdAt: r.createdAt,
      cancelledAt: r.cancelledAt,
      offeringId: r.offeringId,
      programmeTitle: r.offering.programme.title,
      formatName: r.offering.deliveryFormat?.name ?? null,
      startsOn: r.offering.startsOn,
      endsOn: r.offering.endsOn,
    })),
    orders: orders.map((o) => ({
      id: o.id,
      kind: o.kind,
      status: o.status,
      currency: o.currency,
      amountMinor: Number(o.amountMinor),
      createdAt: o.createdAt,
      paidAt: o.paidAt,
      programmeTitle: o.programme.title,
      certificateCode: o.certificate?.certificateId ?? null,
    })),
    certificates: certificates.map((c) => ({ ...c })),
    reviews: reviews.map((r) => ({
      id: r.id,
      kind: r.kind,
      programmeTitle: r.programme.title,
      rating: r.rating,
      moderationStatus: r.moderationStatus,
      visibilityStatus: r.visibilityStatus,
      consentPublic: r.consentPublic,
      submittedAt: r.submittedAt,
    })),
    consents,
    roles: roleRows.map((r) => ({
      id: r.id,
      role: r.role,
      scopeType: r.scopeType,
      scopeId: r.scopeId,
      grantedAt: r.grantedAt,
      grantedByUserId: r.grantedByUserId,
      grantedByEmail: r.grantedByUserId ? (emails.get(r.grantedByUserId) ?? null) : null,
      revokedAt: r.revokedAt,
      revokedByUserId: r.revokedByUserId,
      revokedByEmail: r.revokedByUserId ? (emails.get(r.revokedByUserId) ?? null) : null,
      active: r.revokedAt === null,
    })),
    roleHistory: roleAudit.map((a) => {
      const s = snapshot(a.action === "role.granted" ? a.after : a.before);
      return {
        id: a.id,
        action: a.action as "role.granted" | "role.revoked",
        role: s.role,
        scopeType: s.scopeType,
        actorUserId: a.actorUserId,
        actorEmail: a.actorUserId ? (emails.get(a.actorUserId) ?? null) : null,
        reason: a.reason,
        createdAt: a.createdAt,
      };
    }),
    isPlatformAdmin: roleRows.some((r) => r.role === "platform_admin" && r.scopeType === "platform" && r.revokedAt === null),
    isTrainer: roleRows.some((r) => r.role === "expert" && r.scopeType === "platform" && r.revokedAt === null),
    trainerProfile: await db.expert.findFirst({ where: { userId: id }, select: { id: true, slug: true, published: true } }),
  };
}

/* ---------------------------------------------------------------- trainer */

function expertSlugFrom(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return base || "trainer";
}

/**
 * Grant the Trainer role (`expert`, platform scope — Milestone 12, L1) and
 * make sure the person has a Trainer profile (`experts` row linked by
 * `user_id`, decision L10): created UNPUBLISHED with the account's name and
 * empty sections, so they can be linked to trainings at once and appear on
 * /trainers only when the profile is filled in and published. Returns what
 * happened so the screen can say it.
 */
export async function grantTrainer(tx: Tx, targetUserId: string, actorUserId: string, reason?: string): Promise<{ granted: boolean; profileCreated: boolean }> {
  if (!isUuid(targetUserId)) throw new AdminUserNotFoundError(targetUserId);
  const user = await tx.user.findUnique({ where: { id: targetUserId }, select: { id: true, name: true } });
  if (!user) throw new AdminUserNotFoundError(targetUserId);
  const granted = await grantRole(tx, { userId: targetUserId, role: "expert", scope: PLATFORM, grantedByUserId: actorUserId, reason: reason ?? "granted from /admin/users (Trainer)" });
  let profileCreated = false;
  const existing = await tx.expert.findFirst({ where: { userId: targetUserId }, select: { id: true } });
  if (!existing) {
    const base = expertSlugFrom(user.name);
    let slug = base;
    for (let n = 2; await tx.expert.findUnique({ where: { slug }, select: { id: true } }); n++) slug = `${base}-${n}`;
    await tx.expert.create({
      data: {
        userId: targetUserId,
        slug,
        name: user.name,
        roleTitle: "Trainer",
        location: "",
        headline: "",
        experienceLine: "",
        summary: "",
        photoPath: "",
        expertise: [],
        profile: { about: [], background: [], specialisations: [], technologies: [], certifications: [], education: [] },
        published: false,
      },
    });
    profileCreated = true;
  }
  return { granted, profileCreated };
}

/** Revoke the Trainer role. The Trainer profile and its links to trainings
 *  are kept (history; a re-grant restores access to the same trainings). */
export async function revokeTrainer(tx: Tx, targetUserId: string, actorUserId: string, reason?: string): Promise<boolean> {
  if (!isUuid(targetUserId)) throw new AdminUserNotFoundError(targetUserId);
  const active = await tx.userRole.findFirst({ where: { userId: targetUserId, role: "expert", scopeType: "platform", scopeId: null, revokedAt: null }, select: { id: true } });
  if (!active) throw new RoleChangeRefusedError("not_trainer", "This person is not a trainer.");
  return revokeRole(tx, { userId: targetUserId, role: "expert", scope: PLATFORM, revokedByUserId: actorUserId, reason: reason ?? "revoked from /admin/users (Trainer)" });
}

/* ------------------------------------------------------------------- roles */

export function parseRoleFilter(value: string | null | undefined): Role | undefined {
  return value && isRole(value) ? value : undefined;
}

/** Active platform-scoped administrators — the count the last-admin rule protects. */
export async function countActivePlatformAdmins(db: Db = getPrisma()): Promise<number> {
  return db.userRole.count({ where: { role: "platform_admin", scopeType: "platform", scopeId: null, revokedAt: null } });
}

/**
 * Grant `platform_admin` (platform scope) to an existing user, with its
 * audit row, in the caller's transaction. A previously revoked row is
 * re-activated (unique key on user/role/scope — roles.repository). Returns
 * false when the person already holds it.
 */
export async function grantPlatformAdmin(tx: Tx, targetUserId: string, actorUserId: string, reason?: string): Promise<boolean> {
  if (!isUuid(targetUserId)) throw new AdminUserNotFoundError(targetUserId);
  const exists = await tx.user.findUnique({ where: { id: targetUserId }, select: { id: true } });
  if (!exists) throw new AdminUserNotFoundError(targetUserId);
  return grantRole(tx, {
    userId: targetUserId,
    role: "platform_admin",
    scope: PLATFORM,
    grantedByUserId: actorUserId,
    reason: reason ?? "granted from /admin/users",
  });
}

/**
 * Revoke `platform_admin` (platform scope). Refused when the target is the
 * actor ("self_revoke"), when the target does not hold it ("not_admin"), or
 * when the target is the last active administrator ("last_admin") — the
 * count is taken inside the same transaction as the write.
 */
export async function revokePlatformAdmin(tx: Tx, targetUserId: string, actorUserId: string, reason?: string): Promise<boolean> {
  if (!isUuid(targetUserId)) throw new AdminUserNotFoundError(targetUserId);
  if (targetUserId === actorUserId) throw new RoleChangeRefusedError("self_revoke", "You cannot revoke your own administrator access.");
  const active = await tx.userRole.findFirst({
    where: { userId: targetUserId, role: "platform_admin", scopeType: "platform", scopeId: null, revokedAt: null },
    select: { id: true },
  });
  if (!active) throw new RoleChangeRefusedError("not_admin", "This person is not an administrator.");
  if ((await countActivePlatformAdmins(tx)) <= 1) {
    throw new RoleChangeRefusedError("last_admin", "The last remaining administrator cannot be revoked.");
  }
  return revokeRole(tx, {
    userId: targetUserId,
    role: "platform_admin",
    scope: PLATFORM,
    revokedByUserId: actorUserId,
    reason: reason ?? "revoked from /admin/users",
  });
}
