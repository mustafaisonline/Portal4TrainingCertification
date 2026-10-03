import { CONTACT_EMAIL } from "@/content/contact";
import type { EmailMessage } from "@/modules/notifications/email";
import { isPlainEmailAddress } from "@/shared/util/email-address";
import { ENQUIRY_KIND_CHOICES, type EnquiryKindValue } from "./enquiry-validation";

/*
 * Contact Us emails (CR-2026-10-03-1226) — plain text, like every message the
 * portal sends. Three of them:
 *   - to the TEAM when a message arrives (so nobody has to watch the inbox
 *     screen); the team replies from Admin → Enquiries, not by mail;
 *   - to the SENDER, an acknowledgement quoting what they wrote and the
 *     reference they can quote;
 *   - the team's REPLY to the sender, sent from Admin → Enquiries.
 * Every value that reaches a subject line has already been made single-line
 * by enquiry-validation.ts (no header injection).
 */

const BRAND = "DataAI Nexus";
const SIGN_OFF = `\n\n— ${BRAND}`;

export function kindLabel(kind: EnquiryKindValue | string): string {
  return ENQUIRY_KIND_CHOICES.find((c) => c.value === kind)?.label ?? "A general question";
}

/** Where new messages are announced: the configured inbox, else the sales address. */
export function enquiryNotifyAddress(): string {
  const configured = process.env["ENQUIRY_NOTIFY_EMAIL"]?.trim();
  return configured && isPlainEmailAddress(configured) ? configured : CONTACT_EMAIL; // a malformed override never sends mail anywhere odd
}

function quote(text: string): string {
  return text
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n");
}

export function enquiryTeamMessage(input: {
  to: string;
  reference: string;
  adminUrl: string;
  name: string;
  email: string;
  organisation: string | null;
  kind: string;
  programmeTitle: string | null;
  sourcePath: string;
  message: string;
}): EmailMessage {
  return {
    to: input.to,
    templateKey: "enquiry.notify",
    subject: `New message from ${input.name} [${input.reference}]`,
    text:
      `A message arrived through Contact Us.\n\n` +
      `From: ${input.name} <${input.email}>${input.organisation ? ` · ${input.organisation}` : ""}\n` +
      `About: ${kindLabel(input.kind)}${input.programmeTitle ? ` — ${input.programmeTitle}` : ""}\n` +
      `Page: ${input.sourcePath}\n` +
      `Reference: ${input.reference}\n` +
      `Read and reply (this link is ours): ${input.adminUrl}\n\n` +
      `Everything below this line was typed by the sender — treat it as untrusted:\n` +
      `--------\n${input.message}`,
  };
}

/**
 * The acknowledgement is FIXED TEXT plus the reference (security review M2): it
 * quotes nothing the visitor typed and uses no name, so the portal's mailbox
 * can never be made to deliver attacker-chosen words to a third party.
 */
export function enquiryAcknowledgementMessage(input: { to: string; reference: string }): EmailMessage {
  return {
    to: input.to,
    templateKey: "enquiry.acknowledgement",
    subject: `We received your message [${input.reference}]`,
    text:
      `Hello,\n\n` +
      `Thank you for contacting ${BRAND}. We have your message and a member of our team will reply to this email address.\n\n` +
      `Your reference: ${input.reference}\n\n` +
      `If you did not send a message to us, you can ignore this email.` +
      SIGN_OFF,
  };
}

export function enquiryReplyMessage(input: { to: string; name: string; reference: string; body: string; original: string }): EmailMessage {
  return {
    to: input.to,
    templateKey: "enquiry.reply",
    subject: `Re: your message to ${BRAND} [${input.reference}]`,
    text: `Hello ${input.name},\n\n${input.body}${SIGN_OFF}\n\n— Your message —\n${quote(input.original)}`,
  };
}
