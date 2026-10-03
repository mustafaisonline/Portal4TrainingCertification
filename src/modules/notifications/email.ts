import { getPrisma } from "@/db/prisma";
import { notifyFromEmail } from "./notifications.service";
import { createSmtpTransport, smtpConfigFromEnv } from "./smtp";
import { isSuppressed } from "./suppression";

/*
 * Transactional email — behind an interface, with a durable record.
 *
 * ADR-015 (provider): decided 2026-10-03 — a free SMTP relay (SMTP2GO) over
 * SMTP (smtp.ts), no paid provider; the founder's Titan/HostGator mailbox receives the replies (DigitalOcean
 * blocks outbound SMTP 25/465/587, so the mailbox itself cannot send from the server). The part below does not change with
 * the transport:
 *
 *  1. Every email the system decides to send is first written to
 *     `outbound_emails` (status `queued`). Nothing is "sent" without a row, so
 *     a failure is visible and retryable rather than lost (ADR-010 spirit).
 *  2. A transport then delivers it and the row is marked `sent` or `failed`.
 *
 * Transports are selected by EMAIL_TRANSPORT:
 *   - `log`  (default)   — records the row and logs recipient/template/subject
 *                          ONLY. Never the body: verification and reset links
 *                          must not land in logs (SECURITY_ARCHITECTURE §9).
 *                          Tests read the link from the database row.
 *   - `smtp`             — delivers through the SMTP mailbox named by SMTP_HOST,
 *                          SMTP_PORT, SMTP_USER, SMTP_PASSWORD and EMAIL_FROM
 *                          (smtp.ts; founder 2026-10-03: SMTP2GO free relay, no paid
 *                          provider). Missing settings throw at first use — there
 *                          is no silent fallback to `log` in production (AP-07).
 */

export type EmailMessage = {
  to: string;
  /** Stable key naming the template, e.g. "identity.verify-email". */
  templateKey: string;
  subject: string;
  text: string;
  /**
   * Optional: names the EVENT this email is for (e.g. `stripe:evt_123:0`). A second send with the same key never
   * queues a second email — the first row is returned — so a repeated webhook or a double click cannot mail twice.
   */
  idempotencyKey?: string;
};

export type SendResult = { id: string; status: "sent" | "failed" | "queued" };

/** Delivery is tried 4 times in all: now, then after 1 minute, 5 minutes and 30 minutes (CR-2026-10-03-1225 slice 2). */
export const MAX_ATTEMPTS = 4;
export const RETRY_BACKOFF_MINUTES = [1, 5, 30] as const;
/** While the first attempt is in flight, the retry worker leaves the row alone for this long. */
export const FIRST_ATTEMPT_LEASE_MS = 2 * 60 * 1000;

/** When the worker may try again after `attemptsMade` tries, or null when the attempts are used up. */
export function nextAttemptAfter(attemptsMade: number, now: Date): Date | null {
  if (attemptsMade >= MAX_ATTEMPTS) return null;
  const minutes = RETRY_BACKOFF_MINUTES[Math.max(0, attemptsMade - 1)] ?? RETRY_BACKOFF_MINUTES[RETRY_BACKOFF_MINUTES.length - 1]!;
  return new Date(now.getTime() + minutes * 60_000);
}

/**
 * Send budget (security review M2). The free SMTP2GO plan allows 1,000 emails a month and 200 a day; the portal stops
 * short of both so a flood — or a retry storm — can never push the account over its quota and silently block real mail.
 * Only mail the relay actually accepted counts (`provider_message_id` is set; log-transport rows have none). Over the
 * budget, mail waits as `queued` and the worker sends it when the window moves on.
 */
export const SEND_BUDGET_PER_DAY = 180;
export const SEND_BUDGET_PER_30_DAYS = 900;

export async function sendBudgetExhausted(now: Date = new Date()): Promise<string | null> {
  const prisma = getPrisma();
  const [day, month] = await Promise.all([
    prisma.outboundEmail.count({ where: { providerMessageId: { not: null }, sentAt: { gt: new Date(now.getTime() - 24 * 3600_000) } } }),
    prisma.outboundEmail.count({ where: { providerMessageId: { not: null }, sentAt: { gt: new Date(now.getTime() - 30 * 24 * 3600_000) } } }),
  ]);
  if (day >= SEND_BUDGET_PER_DAY) return `daily send budget reached (${SEND_BUDGET_PER_DAY})`;
  if (month >= SEND_BUDGET_PER_30_DAYS) return `30-day send budget reached (${SEND_BUDGET_PER_30_DAYS})`;
  return null;
}

/** A refusal the server will repeat: a permanent 5xx reply or a refused recipient. Retrying cannot help, so it is `failed` at once. */
export function isPermanentFailure(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const e = err as { permanent?: unknown; responseCode?: unknown };
  return e.permanent === true || (typeof e.responseCode === "number" && e.responseCode >= 500 && e.responseCode < 600);
}

const isUniqueViolation = (err: unknown) => typeof err === "object" && err !== null && (err as { code?: unknown }).code === "P2002";

export type EmailTransport = {
  readonly name: string;
  send(message: EmailMessage & { id: string }): Promise<{ providerMessageId: string | null }>;
};

const logTransport: EmailTransport = {
  name: "log",
  async send(message) {
    // Recipient, template and subject only — never the body.
    console.info(`[email:log] to=${message.to} template=${message.templateKey} subject="${message.subject}" id=${message.id}`);
    return { providerMessageId: null };
  },
};

let smtpTransport: EmailTransport | null = null;

export function selectTransport(): EmailTransport {
  const name = process.env["EMAIL_TRANSPORT"] ?? "log";
  switch (name) {
    case "log":
      return logTransport;
    case "smtp":
      // One transporter per process (connection reuse); settings are read once, at first use.
      smtpTransport ??= createSmtpTransport(smtpConfigFromEnv());
      return smtpTransport;
    default:
      throw new Error(`Unknown EMAIL_TRANSPORT "${name}". Known: log, smtp.`);
  }
}

/**
 * Why outgoing email cannot really be delivered right now, or null when it can.
 * The `log` transport records a row and reports it `sent` without delivering
 * anything — fine in development and tests, a lie in production. Screens that
 * promise a delivery (the admin's Reply) check this first (CR-2026-10-03-1226).
 */
export function emailDeliveryProblem(env: Record<string, string | undefined> = process.env): string | null {
  const transport = env["EMAIL_TRANSPORT"] ?? "log";
  if (transport === "smtp") {
    try {
      smtpConfigFromEnv(env);
      return null;
    } catch (err) {
      return `Outgoing email settings are incomplete (${err instanceof Error ? err.message : "SMTP settings"}), so nothing would be delivered.`;
    }
  }
  if (transport !== "log") return null;
  if (env["NODE_ENV"] !== "production" || env["APP_ENV"] === "test") return null; // development and the test suite use the log on purpose
  return "Outgoing email is not set up yet (the portal is in log-only mode), so nothing would be delivered.";
}

export const SUPPRESSED_MESSAGE = "Not sent: the address is on the do-not-send list.";

export type OutboxRow = { id: string; toEmail: string; templateKey: string; subject: string; textBody: string; attempts: number };

/**
 * One delivery attempt for a row that already exists (used by sendEmail's first try and by the retry worker).
 * Success → `sent`. A delivery error → `queued` again with a back-off, until the attempts are used up → `failed`.
 * Never throws for a delivery error.
 */
export async function attemptDelivery(row: OutboxRow, transport: EmailTransport, now: Date = new Date()): Promise<SendResult["status"]> {
  const prisma = getPrisma();
  try {
    const { providerMessageId } = await transport.send({ to: row.toEmail, templateKey: row.templateKey, subject: row.subject, text: row.textBody, id: row.id });
    await prisma.outboundEmail.update({
      where: { id: row.id },
      data: { status: "sent", attempts: row.attempts + 1, providerMessageId, sentAt: now, lastAttemptAt: now, nextAttemptAt: null },
    });
    return "sent";
  } catch (err) {
    const lastError = (err instanceof Error ? `${err.name}: ${err.message}` : String(err)).slice(0, 500);
    const attemptsMade = row.attempts + 1;
    const next = isPermanentFailure(err) ? null : nextAttemptAfter(attemptsMade, now);
    await prisma.outboundEmail.update({
      where: { id: row.id },
      data: { status: next ? "queued" : "failed", attempts: attemptsMade, lastError, lastAttemptAt: now, nextAttemptAt: next },
    });
    return next ? "queued" : "failed";
  }
}

/**
 * Record and send one email. Resolves once the row reflects the first attempt; it never throws — a delivery
 * failure leaves the row `queued` for the retry worker (or `failed` once the attempts are used up), and a
 * misconfigured transport leaves it `failed` with the reason.
 */
export async function sendEmail(message: EmailMessage): Promise<SendResult> {
  const prisma = getPrisma();
  const key = message.idempotencyKey?.trim() || null;
  if (key) {
    const existing = await prisma.outboundEmail.findUnique({ where: { idempotencyKey: key }, select: { id: true, status: true } });
    if (existing) return { id: existing.id, status: existing.status };
  }

  const suppressed = await isSuppressed(message.to);
  let row: OutboxRow;
  try {
    row = await prisma.outboundEmail.create({
      data: {
        toEmail: message.to,
        templateKey: message.templateKey,
        subject: message.subject,
        textBody: message.text,
        idempotencyKey: key,
        // A suppressed address is recorded (so the log shows why nothing went) but never attempted.
        ...(suppressed ? { status: "failed" as const, lastError: SUPPRESSED_MESSAGE } : { nextAttemptAt: new Date(Date.now() + FIRST_ATTEMPT_LEASE_MS) }),
      },
      select: { id: true, toEmail: true, templateKey: true, subject: true, textBody: true, attempts: true },
    });
  } catch (err) {
    if (key && isUniqueViolation(err)) {
      const existing = await prisma.outboundEmail.findUnique({ where: { idempotencyKey: key }, select: { id: true, status: true } });
      if (existing) return { id: existing.id, status: existing.status }; // a parallel identical send won the race
    }
    throw err;
  }

  // The in-app channel (CR-2026-10-03-1228): the events a person would want in their bell also become a notification —
  // independent of whether mail is delivered, and never able to break the send (failure is logged only).
  void notifyFromEmail(message, row.id).catch((err) => console.error(`[notifications] could not record for "${message.templateKey}":`, err));

  if (suppressed) return { id: row.id, status: "failed" };

  // A transport that cannot be built (missing or malformed SMTP settings) must NEVER take the caller down —
  // sign-in, payments and webhooks send mail through here. The row is marked failed with the reason (variable
  // NAMES only, never a value) and the problem is logged loudly; nothing throws. (Incident 2026-10-03: empty SMTP
  // settings made the whole portal refuse to start; email is not worth an outage.) It is not retried by the worker:
  // a settings problem is not transient — fix the settings, then use Retry in Admin → Email.
  let transport: EmailTransport;
  try {
    transport = selectTransport();
  } catch (err) {
    const lastError = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    console.error(`[email] cannot send "${message.templateKey}" (id=${row.id}): ${lastError}`);
    await prisma.outboundEmail.update({ where: { id: row.id }, data: { status: "failed", attempts: { increment: 1 }, lastError, lastAttemptAt: new Date(), nextAttemptAt: null } });
    return { id: row.id, status: "failed" };
  }
  // Over the send budget the row simply waits (`queued`, no lease): the worker sends it when the window moves on.
  const overBudget = await sendBudgetExhausted();
  if (overBudget) {
    console.warn(`[email] ${overBudget}: "${message.templateKey}" (id=${row.id}) is queued, not sent`);
    await prisma.outboundEmail.update({ where: { id: row.id }, data: { nextAttemptAt: null } });
    return { id: row.id, status: "queued" };
  }
  return { id: row.id, status: await attemptDelivery(row, transport) };
}
