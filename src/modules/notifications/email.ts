import { getPrisma } from "@/db/prisma";
import { createSmtpTransport, smtpConfigFromEnv } from "./smtp";

/*
 * Transactional email — behind an interface, with a durable record.
 *
 * ADR-015 (provider): decided 2026-10-03 — the founder's own HostGator mailbox
 * over SMTP (smtp.ts), no paid provider. The part below does not change with
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
 *                          (smtp.ts; founder 2026-10-03: HostGator, no paid
 *                          provider). Missing settings throw at first use — there
 *                          is no silent fallback to `log` in production (AP-07).
 */

export type EmailMessage = {
  to: string;
  /** Stable key naming the template, e.g. "identity.verify-email". */
  templateKey: string;
  subject: string;
  text: string;
};

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

function selectTransport(): EmailTransport {
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
  if (transport !== "log") return null;
  if (env["NODE_ENV"] !== "production" || env["APP_ENV"] === "test") return null; // development and the test suite use the log on purpose
  return "Outgoing email is not set up yet (the portal is in log-only mode), so nothing would be delivered.";
}

/**
 * Record and send one email. Resolves once the row reflects the outcome; it
 * never throws for a delivery failure (the row says `failed`), only for a
 * misconfiguration, which is a deployment defect and should surface.
 */
export async function sendEmail(message: EmailMessage): Promise<{ id: string; status: "sent" | "failed" }> {
  const prisma = getPrisma();
  const row = await prisma.outboundEmail.create({
    data: {
      toEmail: message.to,
      templateKey: message.templateKey,
      subject: message.subject,
      textBody: message.text,
    },
    select: { id: true },
  });

  const transport = selectTransport();
  try {
    const { providerMessageId } = await transport.send({ ...message, id: row.id });
    await prisma.outboundEmail.update({
      where: { id: row.id },
      data: { status: "sent", attempts: { increment: 1 }, providerMessageId, sentAt: new Date() },
    });
    return { id: row.id, status: "sent" };
  } catch (err) {
    const lastError = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    await prisma.outboundEmail.update({
      where: { id: row.id },
      data: { status: "failed", attempts: { increment: 1 }, lastError },
    });
    return { id: row.id, status: "failed" };
  }
}
