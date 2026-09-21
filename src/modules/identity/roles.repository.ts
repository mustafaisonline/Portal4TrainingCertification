import type { Db, Tx } from "@/db/prisma";
import { getPrisma } from "@/db/prisma";
import { writeAudit } from "@/modules/platform/audit/repository";

/*
 * Scoped RBAC — `user_roles (user_id, role, scope_type, scope_id)` is the ONLY
 * authorisation source of truth (ADR-020; DECISION_B condition 2). Better
 * Auth's organisation/admin plugins are not enabled and nothing here reads
 * anything the provider returns.
 *
 * Revocation is a state on the row (revoked_at), never a delete: the unique
 * key (user, role, scope_type, scope_id) means a re-grant re-activates the
 * same row, and history stays in `audit_log`.
 */

export const ROLES = ["participant", "expert", "assessor", "org_admin", "platform_admin"] as const;
export type Role = (typeof ROLES)[number];
export const SCOPE_TYPES = ["platform", "organisation", "offering"] as const;
export type ScopeType = (typeof SCOPE_TYPES)[number];

export type RoleScope = { scopeType: ScopeType; scopeId: string | null };
export type ActiveRole = { role: Role } & RoleScope;

export const PLATFORM: RoleScope = { scopeType: "platform", scopeId: null };

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

export async function activeRolesForUser(userId: string, db: Db = getPrisma()): Promise<ActiveRole[]> {
  const rows = await db.userRole.findMany({
    where: { userId, revokedAt: null },
    select: { role: true, scopeType: true, scopeId: true },
    orderBy: { grantedAt: "asc" },
  });
  return rows.map((r) => ({ role: r.role, scopeType: r.scopeType, scopeId: r.scopeId }));
}

/** Pure check used by the guards. A platform-scoped grant satisfies any
 *  scope of the same role; a narrower grant satisfies only its own scope. */
export function holdsRole(roles: readonly ActiveRole[], role: Role, scope: RoleScope = PLATFORM): boolean {
  return roles.some(
    (r) =>
      r.role === role &&
      (r.scopeType === "platform" || (r.scopeType === scope.scopeType && r.scopeId === scope.scopeId)),
  );
}

export type GrantInput = {
  userId: string;
  role: Role;
  scope?: RoleScope;
  /** Our `users.id` of whoever granted it; null for the bootstrap CLI. */
  grantedByUserId: string | null;
  reason?: string;
};

/** Grant (or re-activate) a role, with its audit row, in the caller's
 *  transaction. Returns false when the role was already active. */
export async function grantRole(tx: Tx, input: GrantInput): Promise<boolean> {
  const scope = input.scope ?? PLATFORM;
  if (scope.scopeType !== "platform" && !scope.scopeId) {
    throw new Error(`scopeId is required for scopeType "${scope.scopeType}"`);
  }
  const existing = await tx.userRole.findFirst({
    where: { userId: input.userId, role: input.role, scopeType: scope.scopeType, scopeId: scope.scopeId },
  });
  if (existing && existing.revokedAt === null) return false;

  if (existing) {
    await tx.userRole.update({
      where: { id: existing.id },
      data: { revokedAt: null, revokedByUserId: null, grantedAt: new Date(), grantedByUserId: input.grantedByUserId },
    });
  } else {
    await tx.userRole.create({
      data: {
        userId: input.userId,
        role: input.role,
        scopeType: scope.scopeType,
        scopeId: scope.scopeId,
        grantedByUserId: input.grantedByUserId,
      },
    });
  }
  await writeAudit(tx, {
    actorUserId: input.grantedByUserId,
    action: "role.granted",
    entityType: "user",
    entityId: input.userId,
    after: { role: input.role, scopeType: scope.scopeType, scopeId: scope.scopeId },
    reason: input.reason ?? null,
  });
  return true;
}

export type RevokeInput = {
  userId: string;
  role: Role;
  scope?: RoleScope;
  revokedByUserId: string | null;
  reason?: string;
};

/** Returns false when there was no active grant to revoke. */
export async function revokeRole(tx: Tx, input: RevokeInput): Promise<boolean> {
  const scope = input.scope ?? PLATFORM;
  const existing = await tx.userRole.findFirst({
    where: { userId: input.userId, role: input.role, scopeType: scope.scopeType, scopeId: scope.scopeId, revokedAt: null },
  });
  if (!existing) return false;
  await tx.userRole.update({
    where: { id: existing.id },
    data: { revokedAt: new Date(), revokedByUserId: input.revokedByUserId },
  });
  await writeAudit(tx, {
    actorUserId: input.revokedByUserId,
    action: "role.revoked",
    entityType: "user",
    entityId: input.userId,
    before: { role: input.role, scopeType: scope.scopeType, scopeId: scope.scopeId },
    reason: input.reason ?? null,
  });
  return true;
}
