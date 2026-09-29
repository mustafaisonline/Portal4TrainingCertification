import { describe, expect, it } from "vitest";
import { CONTACT_EMAIL, contactMailto, interestMailto, interestSubject, localPartnerMailto, organisationMailto } from "@/content/contact";

/*
 * Contact helpers — Milestone 15, Requirement 8 (founder, 2026-09-29): the
 * contact form is gone; every "register interest / send enquiry" button is an
 * email to the founder-supplied sales address, with the training carried in
 * the subject line. WhatsApp was dropped by the founder, so none exists.
 */
describe("contact links", () => {
  it("the address is the founder-supplied sales mailbox", () => {
    expect(CONTACT_EMAIL).toBe("sales@yourpartnertechnologies.com");
  });

  it("a bare mailto has no query string", () => {
    expect(contactMailto()).toBe("mailto:sales@yourpartnertechnologies.com");
  });

  it("subject and body are percent-encoded (spaces %20, never +; & and # cannot break the link)", () => {
    const href = contactMailto("Interest: R&D #1", "Hello there");
    expect(href).toBe("mailto:sales@yourpartnertechnologies.com?subject=Interest%3A%20R%26D%20%231&body=Hello%20there");
    expect(new URL(href).searchParams.get("subject")).toBe("Interest: R&D #1");
  });

  it("register-interest names the training, or falls back to a general subject", () => {
    expect(interestSubject("Learn Vibe Coding")).toBe("Interest: Learn Vibe Coding");
    expect(interestSubject()).toBe("Interest in a training date");
    expect(interestSubject(null)).toBe("Interest in a training date");
    expect(new URL(interestMailto("Data Blueprint & AI/Vibe Coding")).searchParams.get("subject")).toBe("Interest: Data Blueprint & AI/Vibe Coding");
  });

  it("organisation and local-partner enquiries carry their own subjects", () => {
    expect(new URL(organisationMailto()).searchParams.get("subject")).toBe("Organisation enquiry");
    expect(new URL(localPartnerMailto("Learn Vibe Coding")).searchParams.get("subject")).toBe("Payment through the local partner: Learn Vibe Coding");
  });

  it("no WhatsApp anywhere in the contact module's output", () => {
    for (const href of [contactMailto(), interestMailto("x"), organisationMailto(), localPartnerMailto("x")]) {
      expect(href.toLowerCase()).not.toMatch(/whatsapp|wa\.me/);
    }
  });
});
