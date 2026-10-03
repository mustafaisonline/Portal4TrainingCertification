/*
 * Contact — the portal shows NO email address (founder, 2026-10-03,
 * CR-2026-10-03-1246): every way of reaching the team leads to the Contact Us
 * page and its form, and the team answers by email from Admin → Enquiries.
 * (History: the form was removed on 2026-09-29 in favour of one email address;
 * it returned on 2026-10-03.)
 *
 * `CONTACT_EMAIL` is therefore INTERNAL: where the portal announces a new
 * message to the team (`ENQUIRY_NOTIFY_EMAIL` overrides it) and the address
 * the mail account sends from. It must not be printed on a page.
 */

// The portal's own mailbox (founder, 2026-10-03: "we got portal email: sales@dataainexus.com"; CR-2026-10-03-1257).
export const CONTACT_EMAIL = "sales@dataainexus.com";

export type ContactKind = "general" | "programme_interest" | "organisation";

/** A link to the Contact Us form, optionally pre-setting what it is about and which training. */
export function contactUsHref(input: { kind?: ContactKind; programmeSlug?: string | null } = {}): string {
  const params = new URLSearchParams();
  if (input.kind) params.set("kind", input.kind);
  if (input.programmeSlug) params.set("programme", input.programmeSlug);
  const query = params.toString();
  return query ? `/contact-us?${query}` : "/contact-us";
}
