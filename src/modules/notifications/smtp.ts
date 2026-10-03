import nodemailer from "nodemailer";
import { SMTP_VARIABLES } from "@/config/env";
import { isPlainEmailAddress } from "@/shared/util/email-address";
import type { EmailTransport } from "./email";

/*
 * The SMTP transport (CR-2026-10-03-1225; founder, 2026-10-03: send through the
 * free SMTP2GO relay on port 2525 — DigitalOcean blocks 25/465/587; no paid provider). It plugs into the existing
 * outbox in email.ts: the row is written first, this delivers it, the row is
 * marked `sent` or `failed`.
 *
 *  - Secrets come from the environment only (SMTP_USER / SMTP_PASSWORD, ADR-030);
 *    an error names the MISSING VARIABLES, never a value.
 *  - Credentials never cross the network in the clear: port 465 uses implicit
 *    TLS, any other port must upgrade with STARTTLS (`requireTLS`) or the send
 *    fails — there is no silent fallback to plain text.
 *  - Timeouts on every phase, so a stuck mail server can never hang a request.
 *  - Only recipient/template/subject are ever logged by callers — never a body.
 *  - From is the portal's mailbox (`EMAIL_FROM`); the same address is Reply-To,
 *    so a person's reply lands where the team reads it.
 */

export type SmtpConfig = { host: string; port: number; user: string; password: string; fromAddress: string; fromName: string };

export class SmtpNotConfiguredError extends Error {
  constructor(public readonly missing: string[], public readonly invalid: string[] = []) {
    super(
      `EMAIL_TRANSPORT="smtp" needs ${missing.length ? `these variables: ${missing.join(", ")}` : ""}${missing.length && invalid.length ? "; " : ""}${invalid.length ? `valid values for: ${invalid.join(", ")}` : ""}.`,
    );
    this.name = "SmtpNotConfiguredError";
  }
}

const DEFAULT_FROM_NAME = "DataAI Nexus";

/** Reads and checks the SMTP settings. Throws `SmtpNotConfiguredError` naming what is missing or malformed. */
export function smtpConfigFromEnv(env: Record<string, string | undefined> = process.env): SmtpConfig {
  const get = (name: string) => env[name]?.trim() ?? "";
  const missing = SMTP_VARIABLES.filter((n) => get(n) === "") as string[];
  const invalid: string[] = [];
  const port = Number(get("SMTP_PORT"));
  if (get("SMTP_PORT") !== "" && !(Number.isInteger(port) && port > 0 && port <= 65535)) invalid.push("SMTP_PORT");
  if (get("EMAIL_FROM") !== "" && !isPlainEmailAddress(get("EMAIL_FROM"))) invalid.push("EMAIL_FROM");
  if (/[\r\n]/.test(get("SMTP_HOST")) || /\s/.test(get("SMTP_HOST"))) invalid.push("SMTP_HOST");
  if (missing.length || invalid.length) throw new SmtpNotConfiguredError(missing, invalid);
  return { host: get("SMTP_HOST"), port, user: get("SMTP_USER"), password: env["SMTP_PASSWORD"]!, fromAddress: get("EMAIL_FROM"), fromName: get("EMAIL_FROM_NAME") || DEFAULT_FROM_NAME };
}

type Factory = typeof nodemailer.createTransport;

/** The options handed to nodemailer — exported so a test can assert the security-relevant ones. */
export function smtpOptions(config: SmtpConfig) {
  const implicitTls = config.port === 465;
  return {
    host: config.host,
    port: config.port,
    secure: implicitTls, // 465: TLS from the first byte
    requireTLS: !implicitTls, // anything else must upgrade with STARTTLS — never plain text
    auth: { user: config.user, pass: config.password },
    tls: { minVersion: "TLSv1.2" as const }, // certificates are verified (nodemailer's default)
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  };
}

/** `Message-ID` host: the domain of the From address, so the id is ours and traceable to the outbox row. */
function messageIdFor(id: string, fromAddress: string): string {
  return `<${id}@${fromAddress.split("@")[1]}>`;
}

export function createSmtpTransport(config: SmtpConfig, factory: Factory = nodemailer.createTransport): EmailTransport {
  const transporter = factory(smtpOptions(config));
  return {
    name: "smtp",
    async send(message) {
      const info = await transporter.sendMail({
        from: { name: config.fromName, address: config.fromAddress },
        // An address OBJECT, never a string: nodemailer parses a string as a list ("a,b@c.com" = two recipients).
        to: { name: "", address: message.to },
        replyTo: config.fromAddress,
        subject: message.subject,
        text: message.text,
        messageId: messageIdFor(message.id, config.fromAddress),
        headers: { "X-Portal-Email-Id": message.id },
      });
      // A single recipient the server refused is a failure, not a success.
      if (info.rejected && info.rejected.length > 0) {
        // Permanent: the server said no to this address — retrying cannot help (email.ts stops after one try).
        throw Object.assign(new Error(`recipient refused by the mail server: ${info.rejected.length} of ${(info.accepted?.length ?? 0) + info.rejected.length}`), { permanent: true });
      }
      return { providerMessageId: info.messageId ?? null };
    },
  };
}
