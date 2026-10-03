import { afterEach, describe, expect, it } from "vitest";
import { CONTACT_EMAIL } from "@/content/contact";
import { enquiryAcknowledgementMessage, enquiryNotifyAddress, enquiryReplyMessage, enquiryTeamMessage, kindLabel } from "@/modules/catalogue/enquiries/emails";
import { enquiryReference, validateEnquiryForm, type EnquiryFormInput } from "@/modules/catalogue/enquiries/enquiry-validation";
import { clientKeyOf } from "@/modules/catalogue/enquiries/rate-limit";

/*
 * Contact Us rules and emails (CR-2026-10-03-1226) — pure, no database.
 */

const good: EnquiryFormInput = {
  name: "  Aisha   Rahman ",
  email: " Aisha@Example.com ",
  organisation: "",
  message: "I would like to know about the next Learn Vibe Coding date.",
  kind: "programme_interest",
  trap: "",
};

describe("validateEnquiryForm", () => {
  it("accepts a good form and tidies it (single-spaced name, trimmed lower-case email, empty organisation → null)", () => {
    const r = validateEnquiryForm(good);
    expect(r.kind).toBe("ok");
    if (r.kind === "ok") expect(r.values).toEqual({ name: "Aisha Rahman", email: "aisha@example.com", organisation: null, message: good.message, kind: "programme_interest" });
  });

  it("treats anything in the honeypot as a bot, whatever else is valid", () => {
    expect(validateEnquiryForm({ ...good, trap: "http://spam.example" })).toEqual({ kind: "bot" });
    expect(validateEnquiryForm({ ...good, trap: "   " }).kind).toBe("ok");
  });

  it("names each problem field in words", () => {
    const r = validateEnquiryForm({ ...good, name: "A", email: "not-an-email", message: "short" });
    expect(r.kind).toBe("invalid");
    if (r.kind === "invalid") {
      expect(Object.keys(r.fieldErrors).sort()).toEqual(["email", "message", "name"]);
      expect(r.fieldErrors.message).toMatch(/at least 10/);
    }
  });

  it("enforces the upper limits", () => {
    const long = validateEnquiryForm({ ...good, message: "x".repeat(5001), organisation: "o".repeat(201), name: "n".repeat(201) });
    expect(long.kind).toBe("invalid");
    if (long.kind === "invalid") expect(Object.keys(long.fieldErrors).sort()).toEqual(["message", "name", "organisation"]);
    expect(validateEnquiryForm({ ...good, message: "x".repeat(5000) }).kind).toBe("ok");
  });

  it("refuses control characters and line breaks in the email address (mail header injection)", () => {
    for (const email of ["a@b.com\r\nBcc: victim@example.com", "a@b.com\nSubject: x", "a@b.com\u0000", "a b@c.com"]) {
      const r = validateEnquiryForm({ ...good, email });
      expect(r.kind, JSON.stringify(email)).toBe("invalid");
    }
  });

  it("flattens line breaks in the name so it can sit in a subject line", () => {
    const r = validateEnquiryForm({ ...good, name: "Aisha\r\nBcc: victim@example.com" });
    expect(r.kind).toBe("ok");
    if (r.kind === "ok") {
      expect(r.values.name).not.toMatch(/[\r\n]/);
      expect(r.values.name).toBe("Aisha Bcc: victim@example.com");
    }
  });

  it("falls back to a general question for an unknown kind", () => {
    const r = validateEnquiryForm({ ...good, kind: "bogus" });
    expect(r.kind === "ok" && r.values.kind).toBe("general");
  });

  it("normalises Windows line endings in the message but keeps the paragraphs", () => {
    const r = validateEnquiryForm({ ...good, message: "First line here.\r\n\r\nSecond paragraph here." });
    expect(r.kind === "ok" && r.values.message).toBe("First line here.\n\nSecond paragraph here.");
  });
});

describe("enquiryReference", () => {
  it("is the first 8 characters of the id, upper-cased", () => {
    expect(enquiryReference("a1b2c3d4-0000-4000-8000-000000000000")).toBe("A1B2C3D4");
  });
});

describe("Contact Us emails", () => {
  const original = process.env["ENQUIRY_NOTIFY_EMAIL"];
  afterEach(() => {
    if (original === undefined) delete process.env["ENQUIRY_NOTIFY_EMAIL"];
    else process.env["ENQUIRY_NOTIFY_EMAIL"] = original;
  });

  it("announces new messages to the sales address unless an inbox is configured", () => {
    delete process.env["ENQUIRY_NOTIFY_EMAIL"];
    expect(enquiryNotifyAddress()).toBe(CONTACT_EMAIL);
    process.env["ENQUIRY_NOTIFY_EMAIL"] = " team@example.test ";
    expect(enquiryNotifyAddress()).toBe("team@example.test");
  });

  it("the team message carries sender, topic, training, reference, the text and the admin link — on single-line subject", () => {
    const m = enquiryTeamMessage({ to: "team@example.test", reference: "A1B2C3D4", adminUrl: "https://dataainexus.com/admin/enquiries/x", name: "Aisha Rahman", email: "aisha@example.com", organisation: "Acme", kind: "programme_interest", programmeTitle: "Learn Vibe Coding", sourcePath: "/contact-us", message: "Hello there, a question." });
    expect(m.templateKey).toBe("enquiry.notify");
    expect(m.subject).toBe("New message from Aisha Rahman [A1B2C3D4]");
    expect(m.subject).not.toMatch(/[\r\n]/);
    expect(m.text).toContain("aisha@example.com");
    expect(m.text).toContain("A training — dates, fees or fit — Learn Vibe Coding");
    expect(m.text).toContain("https://dataainexus.com/admin/enquiries/x");
  });

  it("the acknowledgement is FIXED text plus the reference — it quotes nothing the visitor typed and uses no name (security review M2)", () => {
    const m = enquiryAcknowledgementMessage({ to: "aisha@example.com", reference: "A1B2C3D4" });
    expect(m.templateKey).toBe("enquiry.acknowledgement");
    expect(m.text).toContain("A1B2C3D4");
    expect(m.text).not.toMatch(/^>/m);
    expect(m.text).not.toMatch(/within \d+|hours|business day/i);
    expect(Object.keys(enquiryAcknowledgementMessage as unknown as object)).toEqual([]); // a plain function, nothing hidden
    expect(enquiryAcknowledgementMessage.length).toBe(1); // takes one input object: to + reference only
  });

  it("the team message marks the sender's text as untrusted and keeps our link outside it", () => {
    const m = enquiryTeamMessage({ to: "t@example.test", reference: "A1B2C3D4", adminUrl: "https://dataainexus.com/admin/enquiries/x", name: "N", email: "n@example.com", organisation: null, kind: "general", programmeTitle: null, sourcePath: "/contact-us", message: "Read and reply: https://evil.example" });
    const [before, after] = m.text.split("--- end ---");
    expect(before).toContain("--- what the sender typed (untrusted) ---");
    expect(before).toContain("https://evil.example");
    expect(after).toContain("https://dataainexus.com/admin/enquiries/x");
    expect(after).not.toContain("evil");
  });

  it("a malformed ENQUIRY_NOTIFY_EMAIL never redirects mail — it falls back to the portal address", () => {
    process.env["ENQUIRY_NOTIFY_EMAIL"] = "a,b@c.com";
    expect(enquiryNotifyAddress()).toBe(CONTACT_EMAIL);
    process.env["ENQUIRY_NOTIFY_EMAIL"] = "Team <t@example.test>";
    expect(enquiryNotifyAddress()).toBe(CONTACT_EMAIL);
  });

  it("the reply quotes the original underneath and shows no address of ours", () => {
    const m = enquiryReplyMessage({ to: "aisha@example.com", name: "Aisha", reference: "A1B2C3D4", body: "Thanks — the next date is in November.", original: "When is the next date?" });
    expect(m.templateKey).toBe("enquiry.reply");
    expect(m.subject).toContain("[A1B2C3D4]");
    expect(m.text).toContain("Thanks — the next date is in November.");
    expect(m.text).toContain("> When is the next date?");
    expect(m.text).not.toContain(CONTACT_EMAIL);
  });

  it("labels the kinds the form offers, and defaults an unknown one", () => {
    expect(kindLabel("organisation")).toBe("Training for my team or organisation");
    expect(kindLabel("anything")).toBe("A general question");
  });
});

describe("validateEnquiryForm — hardening (security review H1, M3)", () => {
  it("refuses an address that could be read as a list, a display name or several recipients", () => {
    for (const email of ["a,c@d.com", "<a@b.com>", "Aisha <a@b.com>", "a@b.com;c@d.com", '"x y"@z.com']) expect(validateEnquiryForm({ ...good, email }).kind, email).toBe("invalid");
  });

  it("answers the input that froze the old regex in milliseconds, and an oversized field at once", () => {
    for (const email of [`a@${".".repeat(2_000_000)} x`, "a@" + "a.".repeat(500_000) + "c"]) {
      const t0 = performance.now();
      expect(validateEnquiryForm({ ...good, email }).kind).toBe("invalid");
      expect(performance.now() - t0).toBeLessThan(50);
    }
    const t0 = performance.now();
    const r = validateEnquiryForm({ ...good, name: "n".repeat(1_000_000), message: "m".repeat(5_000_000), organisation: "o".repeat(1_000_000) });
    expect(r.kind).toBe("invalid");
    expect(performance.now() - t0).toBeLessThan(50);
  });
});

describe("clientKeyOf — one key per subscriber block", () => {
  it("keeps IPv4 and names as they are", () => {
    expect(clientKeyOf("203.0.113.9")).toBe("203.0.113.9");
    expect(clientKeyOf("local")).toBe("local");
    expect(clientKeyOf("::ffff:203.0.113.9")).toBe("::ffff:203.0.113.9");
  });

  it("reduces an IPv6 address to its /64, so rotating inside the block does not dodge the limit", () => {
    const a = clientKeyOf("2001:db8:abcd:12:1111:2222:3333:4444");
    const b = clientKeyOf("2001:DB8:ABCD:12:ffff:eeee:dddd:cccc");
    expect(a).toBe("2001:db8:abcd:12::/64");
    expect(b).toBe(a);
    expect(clientKeyOf("2001:db8:abcd:13::1")).not.toBe(a); // another block
    expect(clientKeyOf("2001:db8::1")).toBe("2001:db8:0:0::/64"); // "::" expanded
  });
});
