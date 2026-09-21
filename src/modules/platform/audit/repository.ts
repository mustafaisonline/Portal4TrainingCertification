import type { Db } from "@/db/prisma";

/*
 * Audit log — INSERT-ONLY (ADR-022; SECURITY_ARCHITECTURE §8). This module
 * exposes exactly one write, and it takes the caller's transaction client so
 * the audit row commits with the change it describes — an audit gap is then
 * impossible by construction. There is deliberately no update or delete.
 *
 * `before` / `after` are plain JSON snapshots of the fields that changed;
 * never put secrets, password hashes or tokens in them.
 */

export type AuditAction =
  | "user.registered"
  | "user.email_verified"
  | "password.reset"
  | "role.granted"
  | "role.revoked"
  | "mfa.enabled"
  | "mfa.disabled"
  | "consent.recorded";

export type AuditEntry = {
  /** Our `users.id`; null when the system acted on its own. */
  actorUserId: string | null;
  action: AuditAction;
  entityType: string;
  entityId: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  reason?: string | null;
};

/** Plain JSON only: drops undefined, turns Dates into ISO strings, and
 *  guarantees the value is storable in a jsonb column. */
function snapshot(value: Record<string, unknown> | null | undefined) {
  if (value === null || value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value)) as Record<string, string | number | boolean | null>;
}

export async function writeAudit(db: Db, entry: AuditEntry): Promise<void> {
  await db.auditLog.create({
    data: {
      actorUserId: entry.actorUserId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      before: snapshot(entry.before),
      after: snapshot(entry.after),
      reason: entry.reason ?? null,
    },
  });
}

export type AuditRecord = {
  id: string;
  actorUserId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  before: unknown;
  after: unknown;
  reason: string | null;
  createdAt: Date;
};

/** Read path for tests and, later, the admin audit screen (M8). */
export async function listAuditForEntity(db: Db, entityType: string, entityId: string): Promise<AuditRecord[]> {
  return db.auditLog.findMany({
    where: { entityType, entityId },
    orderBy: { createdAt: "asc" },
  });
}
