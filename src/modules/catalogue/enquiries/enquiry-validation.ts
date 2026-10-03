/*
 * Contact Us form — the pure rules (CR-2026-10-03-1226; no database, no
 * framework, so they are unit-tested). The form posts through a server action
 * (`actions.ts`); everything it accepts is decided here.
 *
 *  - Honeypot: a field no person can see. A bot that fills it is answered with
 *    the same "sent" screen and nothing is stored (it learns nothing).
 *  - Header safety: every value that may end up in an email header or subject
 *    is single-line and free of control characters, so nobody can smuggle in
 *    extra headers (mail header injection).
 *  - Limits mirror the old form (name 2–200, message 10–5000) and the column
 *    types; the email address is lower-cased by the repository.
 */

export const ENQUIRY_KIND_VALUES = ["general", "programme_interest", "organisation"] as const;
export type EnquiryKindValue = (typeof ENQUIRY_KIND_VALUES)[number];

/** What the visitor picks on the form ("I'm contacting you about…"). */
export const ENQUIRY_KIND_CHOICES: readonly { value: EnquiryKindValue; label: string }[] = [
  { value: "general", label: "A general question" },
  { value: "programme_interest", label: "A training — dates, fees or fit" },
  { value: "organisation", label: "Training for my team or organisation" },
];

export const ENQUIRY_LIMITS = { nameMin: 2, nameMax: 200, emailMax: 254, organisationMax: 200, messageMin: 10, messageMax: 5000 } as const;

export type EnquiryField = "name" | "email" | "organisation" | "message";

export type EnquiryFormInput = {
  name: string;
  email: string;
  organisation: string;
  message: string;
  kind: string;
  /** The honeypot. Anything in it means a bot. */
  website: string;
};

export type EnquiryValues = { name: string; email: string; organisation: string | null; message: string; kind: EnquiryKindValue };

export type EnquiryCheck =
  | { kind: "ok"; values: EnquiryValues }
  | { kind: "bot" }
  | { kind: "invalid"; fieldErrors: Partial<Record<EnquiryField, string>> };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// C0 controls (incl. CR/LF/TAB) and DEL — never allowed in a single-line value.
// eslint-disable-next-line no-control-regex
const CONTROL_RE = /[\u0000-\u001f\u007f]/;

function oneLine(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function isEnquiryKindValue(value: string): value is EnquiryKindValue {
  return (ENQUIRY_KIND_VALUES as readonly string[]).includes(value);
}

export function validateEnquiryForm(input: EnquiryFormInput): EnquiryCheck {
  if (input.website.trim() !== "") return { kind: "bot" };

  const name = oneLine(input.name);
  const email = input.email.trim().toLowerCase(); // one canonical form for the row, the outbox and the rate limit
  const organisation = oneLine(input.organisation);
  const message = input.message.replace(/\r\n/g, "\n").trim();
  const fieldErrors: Partial<Record<EnquiryField, string>> = {};

  if (name.length < ENQUIRY_LIMITS.nameMin || name.length > ENQUIRY_LIMITS.nameMax || CONTROL_RE.test(name)) fieldErrors.name = "Please enter your name.";
  if (!EMAIL_RE.test(email) || email.length > ENQUIRY_LIMITS.emailMax || CONTROL_RE.test(email)) fieldErrors.email = "Please enter a valid email address.";
  if (organisation.length > ENQUIRY_LIMITS.organisationMax) fieldErrors.organisation = `Please keep this under ${ENQUIRY_LIMITS.organisationMax} characters.`;
  if (message.length < ENQUIRY_LIMITS.messageMin) fieldErrors.message = `Please tell us a little more (at least ${ENQUIRY_LIMITS.messageMin} characters).`;
  else if (message.length > ENQUIRY_LIMITS.messageMax) fieldErrors.message = `Please keep your message under ${ENQUIRY_LIMITS.messageMax} characters.`;
  if (Object.keys(fieldErrors).length > 0) return { kind: "invalid", fieldErrors };

  const kind: EnquiryKindValue = isEnquiryKindValue(input.kind) ? input.kind : "general";
  return { kind: "ok", values: { name, email, organisation: organisation || null, message, kind } };
}

/** The short code a visitor quotes: the first 8 characters of the row id. */
export function enquiryReference(id: string): string {
  return id.replace(/-/g, "").slice(0, 8).toUpperCase();
}
