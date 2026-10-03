import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { disconnectPrisma } from "@/db/prisma";
import { POST } from "@app/api/jobs/email-outbox/route";

/* POST /api/jobs/email-outbox — the same bearer-secret rules as the reminders job (CR-2026-10-03-1225 slice 2). */

const saved = { ...process.env };
const request = (auth?: string) => new Request("http://localhost/api/jobs/email-outbox", { method: "POST", headers: auth ? { authorization: auth } : {} });

beforeEach(() => {
  // Incomplete SMTP settings: the worker answers "skipped" and never touches another suite's queued rows.
  process.env["EMAIL_TRANSPORT"] = "smtp";
  for (const v of ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASSWORD", "EMAIL_FROM"]) delete process.env[v];
});
afterEach(() => {
  process.env = { ...saved };
});
afterAll(async () => {
  await disconnectPrisma();
});

describe("POST /api/jobs/email-outbox", () => {
  it("503 when JOBS_SECRET is unset", async () => {
    delete process.env["JOBS_SECRET"];
    const res = await POST(request("Bearer anything"));
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "jobs_disabled" });
  });

  it("401 without a bearer token, with the wrong one, or one of a different length", async () => {
    process.env["JOBS_SECRET"] = "integration-jobs-secret";
    for (const auth of [undefined, "Bearer wrong-secret-of-same-length", "Bearer short", "Basic aW50ZWdyYXRpb24tam9icy1zZWNyZXQ=", "integration-jobs-secret"]) {
      const res = await POST(request(auth));
      expect(res.status, auth ?? "(no header)").toBe(401);
      expect(await res.json()).toEqual({ error: "unauthorised" });
    }
  });

  it("200 with the counts when the token matches — and says why it skipped when email is not set up", async () => {
    process.env["JOBS_SECRET"] = "integration-jobs-secret";
    const res = await POST(request("Bearer integration-jobs-secret"));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ skipped: expect.stringMatching(/incomplete/), claimed: 0, sent: 0, retrying: 0, failed: 0, suppressed: 0, stale: expect.any(Number) });
  });
});
