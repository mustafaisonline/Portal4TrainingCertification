import { getPrisma } from "@/db/prisma";

/*
 * Transactional email — behind an interface, with a durable record.
 *
 * ADR-015 (provider) is OPEN and needs the founder's account and a sending
 * domain (G0-8 / OQ-3), so no provider is wired here (plan §0.1 default 5).
 * What IS built is the part that must not change when one is chosen:
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
 *   - `resend`, `postmark` — recognised but NOT IMPLEMENTED: selecting one
 *                          throws at first use with a message naming the
 *                          decision that is missing. There is no silent
 *                          fallback to `log` in production (AP-07).
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

class EmailNotConfiguredError extends Error {
  constructor(transport: string) {
    super(
      `EMAIL_TRANSPORT="${transport}" is not implemented: the transactional email provider (ADR-015) has not been decided and no credentials exist. Use "log" until it is.`,
    );
    this.name = "EmailNotConfiguredError";
  }
}

const logTransport: EmailTransport = {
  name: "log",
  async send(message) {
    // Recipient, template and subject only — never the body.
    console.info(`[email:log] to=${message.to} template=${message.templateKey} subject="${message.subject}" id=${message.id}`);
    return { providerMessageId: null };
  },
};

function selectTransport(): EmailTransport {
  const name = process.env["EMAIL_TRANSPORT"] ?? "log";
  switch (name) {
    case "log":
      return logTransport;
    case "resend":
    case "postmark":
      throw new EmailNotConfiguredError(name);
    default:
      throw new Error(`Unknown EMAIL_TRANSPORT "${name}". Known: log, resend, postmark.`);
  }
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
