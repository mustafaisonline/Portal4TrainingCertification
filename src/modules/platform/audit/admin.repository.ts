import type { Db } from "@/db/prisma";
import { getPrisma } from "@/db/prisma";
import { isUuid } from "@/modules/catalogue/offerings/repository";

/*
 * Audit log — administrator READ path (MILESTONE_8_EXECUTION_PLAN.md §2
 * item 5). `audit_log` stays insert-only (ADR-022): this module has no
 * write, and the screen built on it posts nothing. The actor's email is
 * resolved in code from `users` (there is no relation on the table by
 * design — an audit row must outlive whatever it points at).
 */

export const AUDIT_PAGE_SIZE = 50;

export type AuditAdminFilters = {
  action?: string;
  entityType?: string;
  /** Exact match on the entity id (ids are uuids or printed codes). */
  entityId?: string;
  /** A user id; `null` selects rows the system wrote on its own. */
  actorUserId?: string | null;
  /** Inclusive lower bound on `created_at`. */
  from?: Date;
  /** Inclusive upper bound on `created_at`. */
  to?: Date;
  page?: number;
};

export type AuditAdminRecord = {
  id: string;
  actorUserId: string | null;
  /** Resolved from `users`; null for the system or a user that no longer exists. */
  actorEmail: string | null;
  action: string;
  entityType: string;
  entityId: string;
  before: unknown;
  after: unknown;
  reason: string | null;
  createdAt: Date;
};

export type AuditAdminPage = { items: AuditAdminRecord[]; total: number; page: number; pageSize: number; pageCount: number };

function whereFrom(filters: AuditAdminFilters) {
  const createdAt =
    filters.from || filters.to ? { ...(filters.from ? { gte: filters.from } : {}), ...(filters.to ? { lte: filters.to } : {}) } : undefined;
  return {
    ...(filters.action ? { action: filters.action } : {}),
    ...(filters.entityType ? { entityType: filters.entityType } : {}),
    ...(filters.entityId ? { entityId: filters.entityId } : {}),
    ...(filters.actorUserId === null ? { actorUserId: null } : filters.actorUserId ? { actorUserId: filters.actorUserId } : {}),
    ...(createdAt ? { createdAt } : {}),
  };
}

async function resolveActors(ids: (string | null)[], db: Db): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter((x): x is string => x !== null))];
  if (unique.length === 0) return new Map();
  const rows = await db.user.findMany({ where: { id: { in: unique } }, select: { id: true, email: true } });
  return new Map(rows.map((r) => [r.id, r.email]));
}

/** Newest first, AUDIT_PAGE_SIZE per page. */
export async function listAuditForAdmin(filters: AuditAdminFilters = {}, db: Db = getPrisma()): Promise<AuditAdminPage> {
  const where = whereFrom(filters);
  const pageSize = AUDIT_PAGE_SIZE;
  const total = await db.auditLog.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, filters.page ?? 1), pageCount);
  const rows = await db.auditLog.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: (page - 1) * pageSize,
    take: pageSize,
  });
  const actors = await resolveActors(
    rows.map((r) => r.actorUserId),
    db,
  );
  return {
    items: rows.map((r) => ({
      id: r.id,
      actorUserId: r.actorUserId,
      actorEmail: r.actorUserId ? (actors.get(r.actorUserId) ?? null) : null,
      action: r.action,
      entityType: r.entityType,
      entityId: r.entityId,
      before: r.before,
      after: r.after,
      reason: r.reason,
      createdAt: r.createdAt,
    })),
    total,
    page,
    pageSize,
    pageCount,
  };
}

/** One row by uuid; a malformed id is "not found". */
export async function getAuditForAdmin(id: string, db: Db = getPrisma()): Promise<AuditAdminRecord | null> {
  if (!isUuid(id)) return null;
  const r = await db.auditLog.findUnique({ where: { id } });
  if (!r) return null;
  const actors = await resolveActors([r.actorUserId], db);
  return {
    id: r.id,
    actorUserId: r.actorUserId,
    actorEmail: r.actorUserId ? (actors.get(r.actorUserId) ?? null) : null,
    action: r.action,
    entityType: r.entityType,
    entityId: r.entityId,
    before: r.before,
    after: r.after,
    reason: r.reason,
    createdAt: r.createdAt,
  };
}

/** The distinct actions and entity types present — what the filter
 *  controls offer, so they never list a value no row carries. */
export async function listAuditFilterValues(db: Db = getPrisma()): Promise<{ actions: string[]; entityTypes: string[] }> {
  const [actions, entityTypes] = await Promise.all([
    db.auditLog.findMany({ distinct: ["action"], select: { action: true }, orderBy: { action: "asc" } }),
    db.auditLog.findMany({ distinct: ["entityType"], select: { entityType: true }, orderBy: { entityType: "asc" } }),
  ]);
  return { actions: actions.map((a) => a.action), entityTypes: entityTypes.map((e) => e.entityType) };
}
