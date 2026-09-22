import { formatMoney } from "@/modules/catalogue/programmes/types";
import type { EmailMessage } from "@/modules/notifications/email";
import { formatCalendarDate } from "./dates";

/*
 * Certificate email templates (M6 plan §5 "Emails") — plain text through the
 * outbox (`sendEmail`), log transport until ADR-015 names a provider. Every
 * figure comes from OUR rows (certificate, order, payment), never from the
 * browser. Reminders before expiry are deferred (E10).
 */

const SIGN_OFF = "\n\n— Data & AI Academy\nThis is an automated message; replies are not monitored.";

export const CERTIFICATE_EMAIL_TEMPLATES = {
  issued: "certificate.issued",
  renewed: "certificate.renewed",
} as const;

export function certificateIssuedMessage(input: {
  to: string;
  name: string;
  programmeTitle: string;
  formatName: string;
  certificateId: string;
  expiresOn: string;
  verifyUrl: string;
  accountUrl: string;
}): EmailMessage {
  return {
    to: input.to,
    templateKey: CERTIFICATE_EMAIL_TEMPLATES.issued,
    subject: `Your Certificate of Completion: ${input.programmeTitle}`,
    text:
      `Hello ${input.name},\n\n` +
      `Your completion of ${input.programmeTitle} (${input.formatName}) has been recorded and your Certificate of Completion is ready.\n\n` +
      `Certificate ID: ${input.certificateId}\n` +
      `Active until: ${formatCalendarDate(input.expiresOn)} (renewable from 30 days before)\n` +
      `Verification link (share it with anyone who needs to check it):\n${input.verifyUrl}\n\n` +
      `View, print or save your certificate from your account:\n${input.accountUrl}\n\n` +
      `This certificate records that you completed the programme. It is not the Academy's earned credential.` +
      SIGN_OFF,
  };
}

export function certificateRenewedMessage(input: {
  to: string;
  name: string;
  programmeTitle: string;
  certificateId: string;
  previousExpiresOn: string;
  newExpiresOn: string;
  amountMinor: number;
  currency: string;
  orderId: string;
  receiptUrl: string | null;
  accountUrl: string;
}): EmailMessage {
  return {
    to: input.to,
    templateKey: CERTIFICATE_EMAIL_TEMPLATES.renewed,
    subject: `Certificate renewed: ${input.certificateId}`,
    text:
      `Hello ${input.name},\n\n` +
      `Your payment has been received and your Certificate of Completion for ${input.programmeTitle} has been renewed.\n\n` +
      `Certificate ID: ${input.certificateId}\n` +
      `Previously active until: ${formatCalendarDate(input.previousExpiresOn)}\n` +
      `Now active until: ${formatCalendarDate(input.newExpiresOn)}\n` +
      `Order ${input.orderId.slice(0, 8).toUpperCase()} · Paid ${formatMoney(input.amountMinor, input.currency)}\n` +
      (input.receiptUrl ? `Receipt: ${input.receiptUrl}\n` : "") +
      `\nYour certificate and renewal history are in your account:\n${input.accountUrl}` +
      SIGN_OFF,
  };
}
