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
  | "password.changed"
  | "profile.updated"
  | "role.granted"
  | "role.revoked"
  | "consent.recorded"
  // Milestone 4 — offerings, orders, payments, registrations, refunds
  | "offering.created"
  | "offering.updated"
  | "order.created"
  | "order.expired"
  | "payment.succeeded"
  | "registration.confirmed"
  | "registration.cancelled"
  | "registration.transferred"
  | "refund.created"
  | "refund.updated"
  // Milestone 5b — reviews
  | "review.submitted"
  | "review.edited"
  | "review.moderated"
  | "review.hidden"
  | "review.restored"
  // Milestone 6 — certificates of completion
  | "certificate.issued"
  | "certificate.renewed"
  | "certificate.listing_changed"
  | "certificate.revoked"
  | "certificate.name_corrected"
  | "certificate_fee.changed"
  // Milestone 7 — renewal reminders (idempotency lives here, plan §2.2)
  | "certificate.reminder_queued"
  | "job.run"
  // Milestone 8 — admin operations
  | "enquiry.status_changed"
  | "profile.exported"
  // Milestone 12 — trainings managed in the portal (details, editorial
  // content, curriculum, pace formats, the four fee rows, visibility)
  | "programme.created"
  | "programme.updated"
  | "programme.content_updated"
  | "programme.modules_updated"
  | "programme.formats_updated"
  | "programme.fee_updated"
  | "programme.fee_removed"
  | "programme.status_changed";

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
