/*
 * Contact details — Milestone 15, Requirement 8 (founder, 2026-09-29).
 *
 * The contact form was removed: people write to the sales mailbox instead.
 * The address below was SUPPLIED BY THE FOUNDER (2026-09-29) and supersedes
 * the older note that no business email was established. WhatsApp was
 * considered and dropped by the founder the same day — there is no number,
 * link or configuration for it anywhere.
 *
 * `contactMailto` builds the `mailto:` links used by every "Register interest /
 * Send enquiry / Contact us" button, so the training a visitor was looking at
 * travels with them as the subject line instead of being lost.
 */

export const CONTACT_EMAIL = "sales@yourpartnertechnologies.com";

/** `mailto:` with an optional prefilled subject (and body). Encoded with
 *  `encodeURIComponent` — spaces must be %20 in a mailto, never "+". */
export function contactMailto(subject?: string, body?: string): string {
  const parts: string[] = [];
  if (subject) parts.push(`subject=${encodeURIComponent(subject)}`);
  if (body) parts.push(`body=${encodeURIComponent(body)}`);
  return `mailto:${CONTACT_EMAIL}${parts.length ? `?${parts.join("&")}` : ""}`;
}

/** Subject for "I would like a date for this training". */
export function interestSubject(trainingTitle?: string | null): string {
  return trainingTitle ? `Interest: ${trainingTitle}` : "Interest in a training date";
}

/** "Register interest" — optionally about one named training. */
export function interestMailto(trainingTitle?: string | null): string {
  return contactMailto(interestSubject(trainingTitle));
}

/** Team, education or organisation enquiry. */
export function organisationMailto(): string {
  return contactMailto("Organisation enquiry");
}

/** A participant whose region pays through the local partner (Pakistan). */
export function localPartnerMailto(trainingTitle: string): string {
  return contactMailto(`Payment through the local partner: ${trainingTitle}`);
}
