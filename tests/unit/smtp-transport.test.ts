import nodemailer from "nodemailer";
import { describe, expect, it } from "vitest";
import { SmtpNotConfiguredError, createSmtpTransport, smtpConfigFromEnv, smtpOptions, type SmtpConfig } from "@/modules/notifications/smtp";

/*
 * The SMTP transport (CR-2026-10-03-1225), tested without a network: nodemailer's
 * own `jsonTransport` captures the message it would have sent, and the options
 * handed to nodemailer are asserted directly (TLS rules, timeouts). The real
 * mail server is exercised by `npm run email:test` on the server.
 */

const env = { SMTP_HOST: "mail.dataainexus.com", SMTP_PORT: "465", SMTP_USER: "sales@dataainexus.com", SMTP_PASSWORD: "s3cret-pass-word", EMAIL_FROM: "sales@dataainexus.com" };

const config: SmtpConfig = { host: "mail.dataainexus.com", port: 465, user: "sales@dataainexus.com", password: "s3cret-pass-word", fromAddress: "sales@dataainexus.com", fromName: "DataAI Nexus" };

describe("smtpConfigFromEnv", () => {
  it("reads the five settings and defaults the display name", () => {
    expect(smtpConfigFromEnv(env)).toEqual(config);
    expect(smtpConfigFromEnv({ ...env, EMAIL_FROM_NAME: "Team" }).fromName).toBe("Team");
  });

  it("names every missing variable — and never a value", () => {
    let err: unknown;
    try {
      smtpConfigFromEnv({ SMTP_HOST: "mail.dataainexus.com", SMTP_PASSWORD: "s3cret-pass-word" });
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(SmtpNotConfiguredError);
    const message = (err as Error).message;
    expect(message).toContain("SMTP_PORT");
    expect(message).toContain("SMTP_USER");
    expect(message).toContain("EMAIL_FROM");
    expect(message).not.toContain("SMTP_HOST,"); // present, so not listed
    expect(message).not.toContain("s3cret-pass-word");
    expect(message).not.toContain("mail.dataainexus.com");
  });

  it("rejects a malformed port, sender address or host", () => {
    for (const bad of [{ SMTP_PORT: "abc" }, { SMTP_PORT: "70000" }, { SMTP_PORT: "0" }, { EMAIL_FROM: "not-an-address" }, { EMAIL_FROM: "a b@c.com" }, { SMTP_HOST: "mail host" }]) {
      expect(() => smtpConfigFromEnv({ ...env, ...bad }), JSON.stringify(bad)).toThrow(SmtpNotConfiguredError);
    }
  });
});

describe("smtpOptions — the security-relevant settings", () => {
  it("port 465 uses TLS from the first byte", () => {
    const o = smtpOptions(config);
    expect(o).toMatchObject({ host: "mail.dataainexus.com", port: 465, secure: true, requireTLS: false, auth: { user: "sales@dataainexus.com", pass: "s3cret-pass-word" } });
  });

  it("any other port must upgrade with STARTTLS — credentials never travel in plain text", () => {
    const o = smtpOptions({ ...config, port: 587 });
    expect(o.secure).toBe(false);
    expect(o.requireTLS).toBe(true);
  });

  it("refuses old TLS and bounds every phase with a timeout", () => {
    const o = smtpOptions(config);
    expect(o.tls.minVersion).toBe("TLSv1.2");
    expect(o.connectionTimeout).toBeLessThanOrEqual(15_000);
    expect(o.greetingTimeout).toBeLessThanOrEqual(15_000);
    expect(o.socketTimeout).toBeLessThanOrEqual(30_000);
  });
});

describe("createSmtpTransport", () => {
  const transport = () => createSmtpTransport(config, () => nodemailer.createTransport({ jsonTransport: true }) as never);

  it("sends from the portal mailbox with a display name, replies to the same address, and carries our id", async () => {
    const t = transport();
    expect(t.name).toBe("smtp");
    const { providerMessageId } = await t.send({ id: "0b1c2d3e-0000-4000-8000-000000000001", to: "aisha@example.com", templateKey: "enquiry.acknowledgement", subject: "We received your message [A1B2C3D4]", text: "Hello Aisha,\n\nThank you." });
    // jsonTransport returns the composed message; providerMessageId is nodemailer's messageId.
    expect(providerMessageId).toBe("<0b1c2d3e-0000-4000-8000-000000000001@dataainexus.com>");
  });

  it("composes the message exactly (from, reply-to, to, subject, text, headers)", async () => {
    let sent: Record<string, unknown> | undefined;
    const t = createSmtpTransport(config, () => ({ sendMail: async (m: Record<string, unknown>) => { sent = m; return { messageId: String(m["messageId"]), accepted: ["aisha@example.com"], rejected: [] }; } }) as never);
    await t.send({ id: "id-1", to: "aisha@example.com", templateKey: "t", subject: "Subject line", text: "Body text" });
    expect(sent).toMatchObject({
      from: { name: "DataAI Nexus", address: "sales@dataainexus.com" },
      replyTo: "sales@dataainexus.com",
      to: { name: "", address: "aisha@example.com" }, // an address OBJECT, never a string (a string is parsed as a list)
      subject: "Subject line",
      text: "Body text",
      messageId: "<id-1@dataainexus.com>",
      headers: { "X-Portal-Email-Id": "id-1" },
    });
  });

  it("treats a refused recipient as a failure, so the outbox row says failed", async () => {
    const t = createSmtpTransport(config, () => ({ sendMail: async () => ({ messageId: "<x@y>", accepted: [], rejected: ["nobody@example.com"] }) }) as never);
    await expect(t.send({ id: "id-2", to: "nobody@example.com", templateKey: "t", subject: "s", text: "b" })).rejects.toThrow(/recipient refused/);
  });

  it("passes a transport error through (timeouts, authentication) for the outbox to record", async () => {
    const t = createSmtpTransport(config, () => ({ sendMail: async () => { throw new Error("Invalid login: 535 Authentication failed"); } }) as never);
    await expect(t.send({ id: "id-3", to: "a@b.co", templateKey: "t", subject: "s", text: "b" })).rejects.toThrow(/Authentication failed/);
  });
});

describe("emailDeliveryProblem — no false promise of delivery", () => {
  it("is null whenever a real transport is configured", async () => {
    const { emailDeliveryProblem } = await import("@/modules/notifications/email");
    expect(emailDeliveryProblem({ EMAIL_TRANSPORT: "smtp", NODE_ENV: "production" })).toBeNull();
  });

  it("flags the log-only transport in production, but not in development or the test suite", async () => {
    const { emailDeliveryProblem } = await import("@/modules/notifications/email");
    expect(emailDeliveryProblem({ NODE_ENV: "production" })).toMatch(/not set up yet/);
    expect(emailDeliveryProblem({ EMAIL_TRANSPORT: "log", NODE_ENV: "production" })).toMatch(/log-only/);
    expect(emailDeliveryProblem({ EMAIL_TRANSPORT: "log", NODE_ENV: "development" })).toBeNull();
    expect(emailDeliveryProblem({ EMAIL_TRANSPORT: "log", NODE_ENV: "production", APP_ENV: "test" })).toBeNull();
  });
});
