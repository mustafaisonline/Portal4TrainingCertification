import type { EmailMessage } from "@/modules/notifications/email";
import { formatMoney } from "@/modules/catalogue/programmes/types";
import { EMAIL_SIGN_OFF } from "@/modules/notifications/sign-off";

/*
 * Commerce email templates (M4 plan §2 item 8) — plain text through the
 * outbox (`sendEmail`), log transport until ADR-015 names a provider. Every
 * figure comes from OUR rows (order, payment, refund), never from the
 * redirect or the browser.
 */

const SIGN_OFF = EMAIL_SIGN_OFF;

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
      `Need a different date? You can transfer once, free, before the training starts. The refund and cancellation policy applies otherwise.` +
      SIGN_OFF,
  };
}

/** 2026-09-27 — a paid "Support the Academy" order: a thank-you and the receipt. */
export function supportPaymentReceivedMessage(input: { to: string; name: string; label: string; orderId: string; amountMinor: number; currency: string; receiptUrl: string | null; accountUrl: string }): EmailMessage {
  return {
    to: input.to,
    templateKey: "commerce.support-received",
    subject: `Thank you — ${input.label}`,
    text:
      `Hello ${input.name},\n\n` +
      `Thank you for supporting the Academy. Your payment has been received.\n\n` +
      `${input.label}\n` +
      `Order ${input.orderId.slice(0, 8).toUpperCase()} · Paid ${formatMoney(input.amountMinor, input.currency)}\n\n` +
      (input.receiptUrl ? `Your Stripe receipt: ${input.receiptUrl}\n\n` : "") +
      `Your orders and receipts are in your account:\n${input.accountUrl}` +
      SIGN_OFF,
  };
}

/** M14 Phase 5: the unlock is paid — the result document is now shown. */
export function knowledgeCheckUnlockedMessage(input: { to: string; name: string; publicId: string; orderId: string; amountMinor: number; currency: string; receiptUrl: string | null; documentUrl: string }): EmailMessage {
  return {
    to: input.to,
    templateKey: "commerce.knowledge-check-unlocked",
    subject: `Your Free Assessment Check result document — ${input.publicId}`,
    text:
      `Hello ${input.name},\n\n` +
      `Thank you. Your payment has been received and the result document for Free Assessment Check ${input.publicId} is now available.\n\n` +
      `Order ${input.orderId.slice(0, 8).toUpperCase()} · Paid ${formatMoney(input.amountMinor, input.currency)}\n\n` +
      (input.receiptUrl ? `Your Stripe receipt: ${input.receiptUrl}\n\n` : "") +
      `View or print it here (a review of Free Learning is also needed, if you have not written one yet):\n${input.documentUrl}\n\n` +
      `A Free Assessment Check result is not the Academy's credential; the Certificate of Completion is earned by attending an expert-led training.` +
      SIGN_OFF,
  };
}

/** CR-2026-10-01-2138: the interest payment is confirmed — non-refundable, no seat yet. */
export function interestRegisteredMessage(input: { to: string; name: string; trainingTitle: string; formatName: string; orderId: string; amountMinor: number; currency: string; receiptUrl: string | null; trainingUrl: string; accountUrl: string }): EmailMessage {
  return {
    to: input.to,
    templateKey: "commerce.interest-registered",
    subject: `Your interest is registered: ${input.trainingTitle} (${input.formatName})`,
    text:
      `Hello ${input.name},\n\n` +
      `Thank you. Your interest in ${input.trainingTitle} — ${input.formatName} is registered.\n\n` +
      `Order ${input.orderId.slice(0, 8).toUpperCase()} · Paid ${formatMoney(input.amountMinor, input.currency)} (non-refundable)\n\n` +
      (input.receiptUrl ? `Your Stripe receipt: ${input.receiptUrl}\n\n` : "") +
      `This is not a seat. When the trainer schedules this format, you will be told by email and can register on the portal:\n${input.trainingUrl}\n\n` +
      `Your interests are listed in your account:\n${input.accountUrl}` +
      SIGN_OFF,
  };
}

/** CR-2026-10-03-2252: the free (fee-waived) interest path — same message as the paid one, without a payment line. */
export function interestRegisteredFreeMessage(input: { to: string; name: string; trainingTitle: string; formatName: string; trainingUrl: string; accountUrl: string }): EmailMessage {
  return {
    to: input.to,
    templateKey: "commerce.interest-registered-free",
    subject: `Your interest is registered: ${input.trainingTitle} (${input.formatName})`,
    text:
      `Hello ${input.name},\n\n` +
      `Thank you. Your interest in ${input.trainingTitle} — ${input.formatName} is registered. No fee applies to you.\n\n` +
      `This is not a seat. When the trainer schedules this format, you will be told by email and can register on the portal:\n${input.trainingUrl}\n\n` +
      `Your interests are listed in your account:\n${input.accountUrl}` +
      SIGN_OFF,
  };
}

/** CR-2026-10-04-0112: an Agentic AI purchase is confirmed — what was bought, where to download it, the non-refundable notice. */
export function agenticPurchaseMessage(input: { to: string; name: string; title: string; kind: "item" | "pack" | "pass"; orderId: string; amountMinor: number; currency: string; receiptUrl: string | null; downloadsUrl: string; passEnds: string | null }): EmailMessage {
  const what =
    input.kind === "pass"
      ? `Your pass is active${input.passEnds ? ` until ${input.passEnds}` : ""}.`
      : input.kind === "pack"
        ? "Your 10 download credits are ready. Each credit unlocks one agent or skill for good."
        : "It is yours to download now.";
  return {
    to: input.to,
    templateKey: "commerce.agentic-purchase",
    subject: `Your purchase: ${input.title}`,
    text:
      `Hello ${input.name},\n\n` +
      `Thank you. ${what}\n\n` +
      `Order ${input.orderId.slice(0, 8).toUpperCase()} · Paid ${formatMoney(input.amountMinor, input.currency)}\n\n` +
      (input.receiptUrl ? `Your Stripe receipt: ${input.receiptUrl}\n\n` : "") +
      `Download here (sign in first):\n${input.downloadsUrl}\n\n` +
      `Digital downloads are non-refundable once downloaded. If something is wrong with a file, reply to this email and we will put it right.` +
      SIGN_OFF,
  };
}

/** CR-2026-10-04-0113: a plan ends within 30 days — once, with the way to continue. It never renews by itself. */
export function agenticPassEndingMessage(input: { to: string; name: string; planLabel: string; endsOn: string; renewUrl: string }): EmailMessage {
  return {
    to: input.to,
    templateKey: "commerce.agentic-pass-ending",
    subject: `Your ${input.planLabel} plan ends on ${input.endsOn}`,
    text:
      `Hello ${input.name},\n\n` +
      `Your ${input.planLabel} plan ends on ${input.endsOn}. It does not renew by itself and we will not charge you again.\n\n` +
      `The items you bought or claimed with credits stay yours. To keep unlimited access, you can buy the plan again now — the new year starts when this one ends, so you lose nothing:\n${input.renewUrl}` +
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
