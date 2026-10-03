import { describe, expect, it } from "vitest";
import { CONTACT_EMAIL, contactUsHref } from "@/content/contact";
import { headOffice } from "@/content/locations";

/*
 * Contact links — CR-2026-10-03-1246 (founder, 2026-10-03): the portal shows
 * no email address; every route to the team is a link to the Contact Us form,
 * with what it is about and which training carried in the query string.
 * WhatsApp was dropped by the founder on 2026-09-29, so none exists.
 */
describe("contact links", () => {
  it("the portal address is internal: the team's inbox and the mail sender, never printed", () => {
    expect(CONTACT_EMAIL).toBe("sales@dataainexus.com");
    expect(headOffice.email, "the head-office card must not print our address").toBeUndefined();
  });

  it("a bare link goes to the form", () => {
    expect(contactUsHref()).toBe("/contact-us");
  });

  it("carries the kind and the training, encoded", () => {
    expect(contactUsHref({ kind: "organisation" })).toBe("/contact-us?kind=organisation");
    expect(contactUsHref({ kind: "programme_interest", programmeSlug: "learn-vibe-coding" })).toBe("/contact-us?kind=programme_interest&programme=learn-vibe-coding");
    expect(contactUsHref({ programmeSlug: "a b&c" })).toBe("/contact-us?programme=a+b%26c");
    expect(contactUsHref({ programmeSlug: null })).toBe("/contact-us");
  });

  it("is always a same-site path — never a mailto, an address or WhatsApp", () => {
    for (const href of [contactUsHref(), contactUsHref({ kind: "general" }), contactUsHref({ kind: "programme_interest", programmeSlug: "x" })]) {
      expect(href.startsWith("/contact-us")).toBe(true);
      expect(href.toLowerCase()).not.toMatch(/mailto|@|whatsapp|wa\.me/);
    }
  });
});
