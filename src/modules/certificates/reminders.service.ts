import type { Db } from "@/db/prisma";
import { getPrisma, withTransaction } from "@/db/prisma";
import { appBaseUrl } from "@/modules/commerce/checkout.service";
import { listAuditForEntity, writeAudit } from "@/modules/platform/audit/repository";
import { addDays, dateColumnToIso, isoToDateColumn, todayIso } from "./dates";
import { currentFeeSetting } from "./fee.repository";
import { dueStage, isReminderStage, REMINDER_STAGES, REMINDER_WINDOW_DAYS, reminderMessage, type ReminderStage } from "./reminders";

/*
 * Renewal reminders — the runner (Milestone 7; MILESTONE_7_EXECUTION_PLAN.md
 * §2.2–§2.5). STATELESS: every call recomputes what is due from the database
 * and may be repeated any number of times a day.
 *
 * Idempotency without a new table (plan §2.2): each queued reminder writes
 * an audit row `certificate.reminder_queued` with `after: { stage,
 * expiresOn, outboundEmailId }` IN THE SAME TRANSACTION as the outbox row. A
 * stage is skipped when such a row exists for that certificate AND that
 * `expiresOn`; a renewal moves `expiresOn`, so the next cycle's reminders
 * are new. A crash between the two writes leaves neither (Service Restart
 * Test); a crash after the commit leaves a queued row that the next run
 * sees as already done.
 *
 * Delivery (default F3): the outbox row is written `queued` and stays so.
 * `sendEmail` (notifications/email.ts) both inserts the row and hands it to
 * the transport, which would put a second row outside the transaction, and
 * the transport is not exported on its own. With the `log` transport the
 * only difference is the console line, which is printed here in the same
 * shape (recipient, template, subject, id — never the body). When ADR-015
 * names a provider, a dispatcher for `queued` rows delivers these and every
 * other undelivered message; the rows and the audit trail do not change.
 */

export const REMINDER_JOB_ID = "certificate-reminders";

export type ReminderRunResult = {
  /** Non-revoked certificates whose expiry lies within ±30 days of today. */
  considered: number;
  /** Reminders written to the outbox on this run. */
  queued: number;
  /** Considered but not queued: nothing due today, or this stage already
   *  queued for this expiry date. */
  skipped: number;
  /** A certificate whose transaction failed; logged, retried next run. */
  failed: number;
  byStage: Record<ReminderStage, number>;
  /** Today's MYT calendar date the stages were computed against. */
  today: string;
  ranAt: string;
};

export type ReminderRecord = {
  stage: ReminderStage;
  expiresOn: string;
  outboundEmailId: string | null;
  at: Date;
};

export type ReminderRun = {
  ranAt: Date;
  considered: number;
  queued: number;
  skipped: number;
  failed: number;
};

type ReminderAfter = { stage?: unknown; expiresOn?: unknown; outboundEmailId?: unknown };

function reminderAfter(value: unknown): ReminderAfter | null {
  return typeof value === "object" && value !== null ? (value as ReminderAfter) : null;
}

/** Reminders already queued for a certificate, newest first. */
export async function listRemindersForCertificate(certificateId: string, db: Db = getPrisma()): Promise<ReminderRecord[]> {
  const rows = await listAuditForEntity(db, "certificate", certificateId);
  const out: ReminderRecord[] = [];
  for (const row of rows) {
    if (row.action !== "certificate.reminder_queued") continue;
    const after = reminderAfter(row.after);
    if (!after || !isReminderStage(after.stage) || typeof after.expiresOn !== "string") continue;
    out.push({
      stage: after.stage,
      expiresOn: after.expiresOn,
      outboundEmailId: typeof after.outboundEmailId === "string" ? after.outboundEmailId : null,
      at: row.createdAt,
    });
  }
  return out.reverse();
}

/** The newest `job.run` row for this job, or null when it has never run. */
export async function lastReminderRun(db: Db = getPrisma()): Promise<ReminderRun | null> {
  const row = await db.auditLog.findFirst({
    where: { entityType: "job", entityId: REMINDER_JOB_ID, action: "job.run" },
    orderBy: { createdAt: "desc" },
  });
  if (!row) return null;
  const after = (typeof row.after === "object" && row.after !== null ? row.after : {}) as Record<string, unknown>;
  const n = (k: string) => (typeof after[k] === "number" ? (after[k] as number) : 0);
  return { ranAt: row.createdAt, considered: n("considered"), queued: n("queued"), skipped: n("skipped"), failed: n("failed") };
}

/**
 * The job. Reads with `db` (the process client by default); every write
 * goes through `withTransaction`, which is bound to the process client — a
 * caller passing a transaction client here would not get nested writes.
 */
export async function runCertificateReminders(opts: { now?: Date; db?: Db } = {}): Promise<ReminderRunResult> {
  const now = opts.now ?? new Date();
  const db = opts.db ?? getPrisma();
  const today = todayIso(now);
  const base = appBaseUrl();
  const feeRow = await currentFeeSetting(now, db);
  const fee = feeRow ? { amountMinor: feeRow.amountMinor, currency: feeRow.currency } : null;

  // Indexed by expires_on; revoked rows never qualify (F4).
  const rows = await db.certificate.findMany({
    where: {
      revokedAt: null,
      expiresOn: { gte: isoToDateColumn(addDays(today, -REMINDER_WINDOW_DAYS)), lte: isoToDateColumn(addDays(today, REMINDER_WINDOW_DAYS)) },
    },
    include: { user: { select: { email: true, name: true } } },
    orderBy: [{ expiresOn: "asc" }, { createdAt: "asc" }],
  });

  const result: ReminderRunResult = {
    considered: rows.length,
    queued: 0,
    skipped: 0,
    failed: 0,
    byStage: Object.fromEntries(REMINDER_STAGES.map((s) => [s, 0])) as Record<ReminderStage, number>,
    today,
    ranAt: now.toISOString(),
  };

  for (const row of rows) {
    const expiresOn = dateColumnToIso(row.expiresOn);
    const stage = dueStage({ expiresOn, revokedAt: row.revokedAt }, today);
    if (!stage) {
      result.skipped += 1;
      continue;
    }
    const already = (await listRemindersForCertificate(row.id, db)).some((r) => r.stage === stage && r.expiresOn === expiresOn);
    if (already) {
      result.skipped += 1;
      continue;
    }
    const message = reminderMessage({
      stage,
      to: row.user.email,
      name: row.user.name,
      certificateId: row.certificateId,
      programmeTitle: row.programmeTitle,
      expiresOn,
      renewalUrl: `${base}/account/certificate`,
      fee,
    });
    try {
      const outboundEmailId = await withTransaction(async (tx) => {
        const email = await tx.outboundEmail.create({
          data: { toEmail: message.to, templateKey: message.templateKey, subject: message.subject, textBody: message.text },
          select: { id: true },
        });
        await writeAudit(tx, {
          actorUserId: null,
          action: "certificate.reminder_queued",
          entityType: "certificate",
          entityId: row.id,
          after: { stage, expiresOn, outboundEmailId: email.id, certificateId: row.certificateId },
        });
        return email.id;
      });
      result.queued += 1;
      result.byStage[stage] += 1;
      // The log transport's line (recipient, template, subject, id — never
      // the body); the row itself stays `queued` — see the header.
      console.info(`[email:log] to=${message.to} template=${message.templateKey} subject="${message.subject}" id=${outboundEmailId}`);
    } catch (err) {
      // One certificate must not stop the rest; the next run retries it
      // because neither row was committed. Counted and returned, not hidden.
      result.failed += 1;
      console.error(`[certificates] reminder ${stage} not queued for certificate ${row.id}`, err);
    }
  }

  await writeAudit(db, {
    actorUserId: null,
    action: "job.run",
    entityType: "job",
    entityId: REMINDER_JOB_ID,
    after: {
      considered: result.considered,
      queued: result.queued,
      skipped: result.skipped,
      failed: result.failed,
      byStage: result.byStage,
      today,
      ranAt: result.ranAt,
    },
  });
  return result;
}

/* --------------------------------------------------- holder visibility (§2.5) */

export type NotificationItem = {
  id: string;
  subject: string;
  templateKey: string;
  status: "queued" | "sent" | "failed";
  createdAt: Date;
  sentAt: Date | null;
};

export const NOTIFICATIONS_CAP = 50;

/** The outbox messages addressed to one person, newest first — what
 *  /account/notifications lists. Subject and status only; never the body
 *  (identity messages carry one-time links). */
export async function listNotificationsForRecipient(email: string, db: Db = getPrisma()): Promise<NotificationItem[]> {
  const rows = await db.outboundEmail.findMany({
    where: { toEmail: email },
    orderBy: { createdAt: "desc" },
    take: NOTIFICATIONS_CAP,
    select: { id: true, subject: true, templateKey: true, status: true, createdAt: true, sentAt: true },
  });
  return rows;
}
