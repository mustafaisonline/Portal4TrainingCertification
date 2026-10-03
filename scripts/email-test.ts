/*
 * Send ONE test email through the configured transport and say what happened
 * (CR-2026-10-03-1225). Run it on the server after the SMTP settings are in
 * the environment:
 *
 *   set -a; . /etc/p4tc/production.env; set +a
 *   npm run email:test -- you@example.com
 *
 * It uses the same outbox path as every portal email (`sendEmail`): a row is
 * written to `outbound_emails` first, then the transport delivers it. It
 * prints the transport name, the row's status and the provider's message id —
 * never a password, a setting value or the body. Exit 0 = the mail server
 * accepted it, 1 = it failed (the row says why), 2 = bad usage or settings.
 */
import { existsSync } from "node:fs";
import path from "node:path";

const envFile = path.resolve(process.cwd(), ".env.local");
if (!process.env["DATABASE_URL"] && existsSync(envFile)) process.loadEnvFile(envFile);

const { getPrisma, disconnectPrisma } = await import("../src/db/prisma.ts");
const { isPlainEmailAddress } = await import("../src/shared/util/email-address.ts");
const { sendEmail } = await import("../src/modules/notifications/email.ts");
const { SmtpNotConfiguredError } = await import("../src/modules/notifications/smtp.ts");

const to = process.argv[2]?.trim();
if (!to || !isPlainEmailAddress(to)) {
  console.error("usage: npm run email:test -- <address to send the test to>");
  process.exit(2);
}

const transport = process.env["EMAIL_TRANSPORT"] ?? "log";
console.log(`EMAIL_TRANSPORT=${transport}`);
if (transport === "log") console.log("(the log transport records the row but delivers nothing — set EMAIL_TRANSPORT=smtp to send for real)");

let exitCode = 0;
try {
  const result = await sendEmail({
    to,
    templateKey: "system.test",
    subject: "DataAI Nexus — test email",
    text: `This is a test message from the DataAI Nexus portal, sent ${new Date().toISOString()}.\n\nIf you are reading it, outgoing email works. No action is needed.\n\n— DataAI Nexus`,
  });
  const row = await getPrisma().outboundEmail.findUniqueOrThrow({ where: { id: result.id }, select: { status: true, lastError: true, providerMessageId: true } });
  console.log(`status=${row.status}${row.providerMessageId ? ` messageId=${row.providerMessageId}` : ""}`);
  if (row.status !== "sent") {
    console.error(`FAILED: ${row.lastError ?? "no detail recorded"}`);
    exitCode = 1;
  } else if (transport === "smtp") {
    console.log(`Accepted by the mail server. Check the inbox of ${to} (and its spam folder).`);
  }
} catch (err) {
  if (err instanceof SmtpNotConfiguredError) {
    console.error(`SETTINGS: ${err.message}`);
    exitCode = 2;
  } else {
    console.error(`FAILED: ${err instanceof Error ? `${err.name}: ${err.message}` : String(err)}`);
    exitCode = 1;
  }
} finally {
  await disconnectPrisma();
}
process.exit(exitCode);
