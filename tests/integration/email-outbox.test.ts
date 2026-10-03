import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { disconnectPrisma, getPrisma } from "@/db/prisma";
import { emailDeliveryProblem, sendEmail } from "@/modules/notifications/email";

/*
 * The outbox against the REAL test database. After the 2026-10-03 incident (empty
 * SMTP settings took the whole portal down) a misconfigured transport must never
 * throw into a caller: the row is recorded as failed with the reason — variable
 * NAMES only — and nothing else breaks.
 */

const to = `outbox-${Math.random().toString(36).slice(2, 8)}@example.test`;
const saved = { ...process.env };

beforeEach(() => {
  process.env["EMAIL_TRANSPORT"] = "smtp";
  for (const v of ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASSWORD", "EMAIL_FROM"]) delete process.env[v];
});
afterEach(() => {
  process.env = { ...saved };
});
afterAll(async () => {
  await getPrisma().outboundEmail.deleteMany({ where: { toEmail: to } });
  await disconnectPrisma();
});

describe("sendEmail with a misconfigured SMTP transport", () => {
  it("resolves failed — it never throws into the caller — and records which settings are missing", async () => {
    process.env["SMTP_PASSWORD"] = "never-shown-in-an-error";
    const result = await sendEmail({ to, templateKey: "test.outbox", subject: "s", text: "t" });
    expect(result.status).toBe("failed");
    const row = await getPrisma().outboundEmail.findUniqueOrThrow({ where: { id: result.id } });
    expect(row.status).toBe("failed");
    expect(row.attempts).toBe(1);
    expect(row.lastError).toMatch(/SMTP_HOST/);
    expect(row.lastError).toMatch(/SMTP_USER/);
    expect(row.lastError).not.toContain("never-shown-in-an-error"); // names, never values
  });

  it("emailDeliveryProblem reports incomplete SMTP settings so screens that promise delivery refuse", () => {
    expect(emailDeliveryProblem({ EMAIL_TRANSPORT: "smtp" })).toMatch(/incomplete/);
    expect(emailDeliveryProblem({ EMAIL_TRANSPORT: "smtp", SMTP_HOST: "mail.smtp2go.com", SMTP_PORT: "2525", SMTP_USER: "u", SMTP_PASSWORD: "p", EMAIL_FROM: "sales@dataainexus.com" })).toBeNull();
  });
});
