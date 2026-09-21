import type { EmailMessage } from "@/modules/notifications/email";
import { formatMoney } from "@/modules/catalogue/programmes/types";

/*
 * Commerce email templates (M4 plan §2 item 8) — plain text through the
 * outbox (`sendEmail`), log transport until ADR-015 names a provider. Every
 * figure comes from OUR rows (order, payment, refund), never from the
 * redirect or the browser.
 */

const SIGN_OFF = "\n\n— Data & AI Academy\nThis is an automated message; replies are not monitored.";

export type OfferingLine = { programmeTitle: string; formatName: string | null; dates: string };

function offeringLine(o: OfferingLine): string {
  return `${o.programmeTitle}${o.formatName ? ` — ${o.formatName}` : ""} — ${o.dates}`;
}

export function registrationConfirmedMessage(input: {
  to: string;
  name: string;
  offering: OfferingLine;
  orderId: string;
  amountMinor: number;
  currency: string;
  accountUrl: string;
}): EmailMessage {
  return {
    to: input.to,
    templateKey: "commerce.registration-confirmed",
    subject: `You are registered: ${input.offering.programmeTitle}`,
    text:
      `Hello ${input.name},\n\n` +
      `Your payment has been received and your place is confirmed.\n\n` +
      `${offeringLine(input.offering)}\n` +
      `Order ${input.orderId.slice(0, 8).toUpperCase()} · Paid ${formatMoney(input.amountMinor, input.currency)}\n\n` +
      `Joining details are sent before the first session. Your registration, order and receipt are in your account:\n${input.accountUrl}\n\n` +
      `Need a different date? You can transfer once, free, before the programme starts. The refund and cancellation policy applies otherwise.` +
      SIGN_OFF,
  };
}

export function registrationCancelledMessage(input: {
  to: string;
  name: string;
  offering: OfferingLine;
  refundPercent: number;
  refundAmountMinor: number;
  currency: string;
  refundStatus: "none" | "pending" | "succeeded" | "failed";
}): EmailMessage {
  const refundLine =
    input.refundStatus === "none"
      ? "Under the refund and cancellation policy no refund is due for this cancellation."
      : input.refundStatus === "failed"
        ? `A refund of ${formatMoney(input.refundAmountMinor, input.currency)} (${input.refundPercent} %) is due, but it could not be issued automatically. We will resolve this with you by email.`
        : `A refund of ${formatMoney(input.refundAmountMinor, input.currency)} (${input.refundPercent} %) has been ${input.refundStatus === "succeeded" ? "issued" : "requested"} to your original payment method. Banks usually take 5–10 working days to show it.`;
  return {
    to: input.to,
    templateKey: "commerce.registration-cancelled",
    subject: `Registration cancelled: ${input.offering.programmeTitle}`,
    text:
      `Hello ${input.name},\n\n` +
      `Your registration has been cancelled as you requested.\n\n` +
      `${offeringLine(input.offering)}\n\n` +
      refundLine +
      SIGN_OFF,
  };
}

export function registrationTransferredMessage(input: {
  to: string;
  name: string;
  from: OfferingLine;
  to_: OfferingLine;
  accountUrl: string;
}): EmailMessage {
  return {
    to: input.to,
    templateKey: "commerce.registration-transferred",
    subject: `Your registration has moved: ${input.to_.programmeTitle}`,
    text:
      `Hello ${input.name},\n\n` +
      `Your place has been transferred, free of charge, to a new date.\n\n` +
      `From: ${offeringLine(input.from)}\n` +
      `To:   ${offeringLine(input.to_)}\n\n` +
      `This was your one free transfer. Your registration is in your account:\n${input.accountUrl}` +
      SIGN_OFF,
  };
}
