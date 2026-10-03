import { getPrisma } from "@/db/prisma";
import { attemptDelivery, emailDeliveryProblem, FIRST_ATTEMPT_LEASE_MS, selectTransport, sendBudgetExhausted, SUPPRESSED_MESSAGE, type OutboxRow } from "./email";
import { isSuppressed } from "./suppression";

/*
 * The outbox worker (CR-2026-10-03-1225 slice 2). `POST /api/jobs/email-outbox` calls this once a day at 01:30 UTC (systemd
 * timer, deploy/systemd). It sends the `queued` rows that are due: emails whose first attempt failed (back-off in
 * email.ts) and rows other code queued without sending — the daily certificate reminders.
 *
 * SAFETY
 *  - It refuses to run while the portal is in log-only mode (`emailDeliveryProblem`): the log transport would mark
 *    queued mail "sent" without delivering it.
 *  - Rows older than 7 days are not sent (a stale reminder is worse than none): they are marked `failed` with a
 *    plain reason, so they leave the "waiting" count and an administrator can still press Retry.
 *  - A claim step (`FOR UPDATE SKIP LOCKED` + a lease on `next_attempt_at`) means two overlapping runs, or a run and
 *    a request's first attempt, do not send the same row. The lease is RENEWED for each row immediately before it is
 *    sent, and the send is skipped if another run has taken the row meanwhile — so a slow relay cannot make a long
 *    run send rows a second run already took (security review M1).
 *  - At most 25 emails per run and never past the send budget (email.ts), so a backlog drains gradually and the free
 *    plan's quota (1,000 a month, 200 a day) is never exceeded.
 *  - DELIVERY IS AT-LEAST-ONCE: if the process dies after the relay accepted a message but before the row is marked
 *    sent, the row is sent again after its lease. The Message-ID is stable per row (smtp.ts), so a mail client can
 *    fold such a duplicate. This is inherent without provider-side de-duplication.
 */

export const OUTBOX_BATCH = 25;
export const OUTBOX_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
export const OUTBOX_LEASE_MS = FIRST_ATTEMPT_LEASE_MS;

export type OutboxRunResult = {
  skipped: string | null;
  claimed: number;
  sent: number;
  retrying: number;
  failed: number;
  suppressed: number;
  /** Queued rows older than 7 days: marked failed this run (or, when skipped, just counted). */
  stale: number;
  /** Set when the send budget stopped the run early. */
  budget: string | null;
};

type Claimed = { id: string; to_email: string; template_key: string; subject: string; text_body: string; attempts: number; created_at: Date };

const toRow = (c: Claimed): OutboxRow => ({ id: c.id, toEmail: c.to_email, templateKey: c.template_key, subject: c.subject, textBody: c.text_body, attempts: c.attempts });

export async function processOutbox(opts: { now?: Date; limit?: number } = {}): Promise<OutboxRunResult> {
  const now = opts.now ?? new Date();
  const limit = Math.min(Math.max(1, Math.floor(opts.limit ?? OUTBOX_BATCH)), 100);
  const result: OutboxRunResult = { skipped: null, claimed: 0, sent: 0, retrying: 0, failed: 0, suppressed: 0, stale: 0, budget: null };
  const prisma = getPrisma();

  const cutoff = new Date(now.getTime() - OUTBOX_MAX_AGE_MS);
  const problem = emailDeliveryProblem();
  if (problem) {
    result.stale = await prisma.outboundEmail.count({ where: { status: "queued", createdAt: { lte: cutoff } } }); // counted only: log-only mode changes nothing
    return { ...result, skipped: problem };
  }
  result.stale = (await prisma.outboundEmail.updateMany({ where: { status: "queued", createdAt: { lte: cutoff } }, data: { status: "failed", lastError: "Not sent: it was queued for more than 7 days, so it is out of date. Use Retry if it is still wanted.", nextAttemptAt: null } })).count;

  const lease = new Date(now.getTime() + OUTBOX_LEASE_MS);
  const claimed = await prisma.$queryRaw<Claimed[]>`
    UPDATE outbound_emails SET next_attempt_at = ${lease}
    WHERE id IN (
      SELECT id FROM outbound_emails
      WHERE status = 'queued'::outbound_email_status AND created_at > ${cutoff}
        AND (next_attempt_at IS NULL OR next_attempt_at <= ${now})
      ORDER BY created_at
      LIMIT ${limit}
      FOR UPDATE SKIP LOCKED)
    RETURNING id, to_email, template_key, subject, text_body, attempts, created_at`;
  // `UPDATE … RETURNING` gives no order: send the oldest first, as the claim intended.
  claimed.sort((a, b) => a.created_at.getTime() - b.created_at.getTime());
  result.claimed = claimed.length;
  if (claimed.length === 0) return result;

  let transport: ReturnType<typeof selectTransport>;
  try {
    transport = selectTransport();
  } catch (err) {
    // Settings broke between the check and now: release the claim so the next run retries; nothing is lost.
    await prisma.outboundEmail.updateMany({ where: { id: { in: claimed.map((c) => c.id) } }, data: { nextAttemptAt: null } });
    console.error("[outbox] transport unavailable:", err instanceof Error ? err.message : err);
    return { ...result, skipped: "The outgoing email transport could not be built.", claimed: 0 };
  }

  for (const [i, c] of claimed.entries()) {
    const row = toRow(c);
    try {
      const overBudget = await sendBudgetExhausted(now);
      if (overBudget) {
        // Stop here: put the rest back, to be sent when the window moves on.
        await prisma.outboundEmail.updateMany({ where: { id: { in: claimed.slice(i).map((r) => r.id) }, status: "queued" }, data: { nextAttemptAt: null } });
        console.warn(`[outbox] ${overBudget}; ${claimed.length - i} email(s) left queued`);
        result.budget = overBudget;
        break;
      }
      // Renew the lease for THIS row and make sure it is still ours (queued, and holding the lease we set when claiming).
      const renewed = await prisma.outboundEmail.updateMany({ where: { id: row.id, status: "queued", nextAttemptAt: lease }, data: { nextAttemptAt: new Date(Date.now() + OUTBOX_LEASE_MS) } });
      if (renewed.count === 0) continue; // another run took it, or it was sent/failed meanwhile
      if (await isSuppressed(row.toEmail)) {
        await prisma.outboundEmail.update({ where: { id: row.id }, data: { status: "failed", lastError: SUPPRESSED_MESSAGE, lastAttemptAt: now, nextAttemptAt: null } });
        result.suppressed += 1;
        continue;
      }
      const outcome = await attemptDelivery(row, transport, now);
      if (outcome === "sent") result.sent += 1;
      else if (outcome === "queued") result.retrying += 1;
      else result.failed += 1;
    } catch (err) {
      // A database error on one row must not stop the rest; the lease expires and the row is picked up again.
      console.error(`[outbox] row ${row.id} could not be processed:`, err instanceof Error ? `${err.name}: ${err.message}`.slice(0, 300) : "unknown error"); // never the whole error: a database error can carry the message text
      result.failed += 1;
    }
  }
  return result;
}

export type RetryResult = { ok: true; status: "sent" | "queued" | "failed" } | { ok: false; reason: "not-found" | "not-failed" | "not-configured"; message: string };

/**
 * Staff pressed Retry on a failed email: it gets a fresh set of attempts and one try right now.
 * Refused while the portal is log-only, so a Retry can never report "sent" for mail that went nowhere.
 */
export async function retryFailedEmail(id: string, now: Date = new Date()): Promise<RetryResult> {
  const problem = emailDeliveryProblem();
  if (problem) return { ok: false, reason: "not-configured", message: problem };
  const prisma = getPrisma();
  const claimed = await prisma.$queryRaw<Claimed[]>`
    UPDATE outbound_emails SET status = 'queued'::outbound_email_status, attempts = 0, next_attempt_at = ${new Date(now.getTime() + OUTBOX_LEASE_MS)}, last_error = NULL
    WHERE id = ${id}::uuid AND status = 'failed'::outbound_email_status
    RETURNING id, to_email, template_key, subject, text_body, attempts, created_at`;
  const c = claimed[0];
  if (!c) {
    const exists = await prisma.outboundEmail.findUnique({ where: { id }, select: { id: true } }).catch(() => null);
    return exists ? { ok: false, reason: "not-failed", message: "Only a failed email can be retried." } : { ok: false, reason: "not-found", message: "This email could not be found." };
  }
  const row = toRow(c);
  if (await isSuppressed(row.toEmail)) {
    await prisma.outboundEmail.update({ where: { id }, data: { status: "failed", lastError: SUPPRESSED_MESSAGE, nextAttemptAt: null } });
    return { ok: true, status: "failed" };
  }
  let transport: ReturnType<typeof selectTransport>;
  try {
    transport = selectTransport();
  } catch (err) {
    const lastError = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    await prisma.outboundEmail.update({ where: { id }, data: { status: "failed", lastError, nextAttemptAt: null } });
    return { ok: true, status: "failed" };
  }
  const status = await attemptDelivery(row, transport, now);
  if (status === "queued") {
    // A manual Retry is ONE attempt. If it fails, the row goes back to `failed` (with the reason), not into the
    // automatic back-off — the worker ignores old rows, so it would otherwise wait forever with no Retry button.
    await prisma.outboundEmail.update({ where: { id }, data: { status: "failed", nextAttemptAt: null } });
    return { ok: true, status: "failed" };
  }
  return { ok: true, status };
}
