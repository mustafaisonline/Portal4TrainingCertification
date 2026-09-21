import type { EmailMessage } from "@/modules/notifications/email";

/*
 * Identity email templates — plain text, deliberately. Links are absolute
 * (Better Auth builds them from APP_BASE_URL). Copy states what the message
 * is for and what to do if it was not requested; it never confirms or denies
 * that an address is registered beyond the fact of this message.
 */

const SIGN_OFF = "\n\n— Data & AI Academy\nThis is an automated message; replies are not monitored.";

export function verifyEmailMessage(input: { to: string; name: string; url: string; expiresInMinutes: number }): EmailMessage {
  return {
    to: input.to,
    templateKey: "identity.verify-email",
    subject: "Verify your email address",
    text:
      `Hello ${input.name},\n\n` +
      `Confirm this email address for your Data & AI Academy account by opening the link below. ` +
      `It works once and expires in ${input.expiresInMinutes} minutes.\n\n${input.url}\n\n` +
      `If you did not create an account, you can ignore this message; nothing further will happen.` +
      SIGN_OFF,
  };
}

export function resetPasswordMessage(input: { to: string; name: string; url: string; expiresInMinutes: number }): EmailMessage {
  return {
    to: input.to,
    templateKey: "identity.reset-password",
    subject: "Choose a new password",
    text:
      `Hello ${input.name},\n\n` +
      `A password reset was requested for your Data & AI Academy account. Open the link below to choose a new password. ` +
      `It works once and expires in ${input.expiresInMinutes} minutes.\n\n${input.url}\n\n` +
      `If you did not request this, you can ignore this message; your password has not changed.` +
      SIGN_OFF,
  };
}
