import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { disconnectPrisma, getPrisma } from "@/db/prisma";
import { MAX_ATTEMPTS, nextAttemptAfter, SEND_BUDGET_PER_DAY, sendBudgetExhausted, sendEmail } from "@/modules/notifications/email";
import { processOutbox, retryFailedEmail } from "@/modules/notifications/outbox.service";
import { addSuppression, isSuppressed, normaliseSuppressedAddress, removeSuppression } from "@/modules/notifications/suppression";

/*
 * CR-2026-10-03-1225 slice 2, against the REAL test database: idempotent sends, the do-not-send list, retry with
 * back-off, the outbox worker (leases, stale rows, log-only refusal, overlapping runs) and the staff Retry.
 * The SMTP transport is replaced by a controllable fake; everything else is real.
 */

const behaviour = { fail: false, error: null as Error | null, gate: null as Promise<void> | null, sends: [] as string[] };
vi.mock("@/modules/notifications/smtp", async (orig) => {
  const actual = await orig<typeof import("@/modules/notifications/smtp")>();
  return {
    ...actual,
    createSmtpTransport: () => ({
      name: "smtp",
      async send(message: { id: string; to: string }) {
        behaviour.sends.push(message.to);
        if (behaviour.gate) await behaviour.gate; // a test can hold a send in flight
        if (behaviour.error) throw behaviour.error;
        if (behaviour.fail) throw new Error("connect ETIMEDOUT");
        return { providerMessageId: `<${message.id}@test>` };
      },
    }),
  };
});

const tag = Math.random().toString(36).slice(2, 8);
const addr = (n: string) => `ob-${tag}-${n}@example.test`;
const saved = { ...process.env };
let parked: string[] = [];

beforeAll(async () => {
  // Other suites leave queued rows behind (the reminders). Park them so this worker run cannot touch them.
  const others = await getPrisma().outboundEmail.findMany({ where: { status: "queued", NOT: { toEmail: { startsWith: `ob-${tag}` } } }, select: { id: true } });
  parked = others.map((o) => o.id);
  await getPrisma().outboundEmail.updateMany({ where: { id: { in: parked } }, data: { nextAttemptAt: new Date(Date.now() + 30 * 24 * 3600_000) } });
});
beforeEach(() => {
  behaviour.fail = false;
  behaviour.error = null;
  behaviour.gate = null;
  behaviour.sends = [];
  Object.assign(process.env, { EMAIL_TRANSPORT: "smtp", SMTP_HOST: "mail.example.test", SMTP_PORT: "2525", SMTP_USER: "u", SMTP_PASSWORD: "p", EMAIL_FROM: "sales@example.test" });
});
afterEach(() => {
  process.env = { ...saved };
});
afterAll(async () => {
  const prisma = getPrisma();
  await prisma.outboundEmail.updateMany({ where: { id: { in: parked } }, data: { nextAttemptAt: null } });
  await prisma.outboundEmail.deleteMany({ where: { toEmail: { startsWith: `ob-${tag}` } } });
  await prisma.emailSuppression.deleteMany({ where: { email: { startsWith: `ob-${tag}` } } });
  await disconnectPrisma();
});

const msg = (to: string, extra: Record<string, unknown> = {}) => ({ to, templateKey: "test.outbox", subject: "s", text: "t", ...extra });
const rowOf = (id: string) => getPrisma().outboundEmail.findUniqueOrThrow({ where: { id } });
const minutes = (m: number) => m * 60_000;

describe("back-off schedule", () => {
  it("is 1, 5 and 30 minutes, then none after 4 attempts", () => {
    const now = new Date("2026-10-03T00:00:00Z");
    expect(nextAttemptAfter(1, now)?.getTime()).toBe(now.getTime() + minutes(1));
    expect(nextAttemptAfter(2, now)?.getTime()).toBe(now.getTime() + minutes(5));
    expect(nextAttemptAfter(3, now)?.getTime()).toBe(now.getTime() + minutes(30));
    expect(nextAttemptAfter(MAX_ATTEMPTS, now)).toBeNull();
  });
});

describe("idempotency", () => {
  it("a repeated event with the same key queues and sends ONE email", async () => {
    const key = `test:${tag}:evt1`;
    const a = await sendEmail(msg(addr("idem"), { idempotencyKey: key }));
    const b = await sendEmail(msg(addr("idem"), { idempotencyKey: key }));
    expect(b.id).toBe(a.id);
    expect(await getPrisma().outboundEmail.count({ where: { idempotencyKey: key } })).toBe(1);
    expect(behaviour.sends).toHaveLength(1);
  });

  it("two parallel sends with the same key still produce one row", async () => {
    const key = `test:${tag}:evt2`;
    const [a, b] = await Promise.all([sendEmail(msg(addr("idem2"), { idempotencyKey: key })), sendEmail(msg(addr("idem2"), { idempotencyKey: key }))]);
    expect(a.id).toBe(b.id);
    expect(await getPrisma().outboundEmail.count({ where: { idempotencyKey: key } })).toBe(1);
    expect(behaviour.sends.filter((t) => t === addr("idem2"))).toHaveLength(1); // and the person is mailed once
  });

  it("emails without a key are never merged", async () => {
    const a = await sendEmail(msg(addr("nokey")));
    const b = await sendEmail(msg(addr("nokey")));
    expect(a.id).not.toBe(b.id);
  });
});

describe("do-not-send list", () => {
  it("normalises, is idempotent, and refuses a non-address", async () => {
    expect(normaliseSuppressedAddress("  A@Example.COM ")).toBe("a@example.com");
    expect(normaliseSuppressedAddress("a,b@c.com")).toBeNull();
    expect(await addSuppression("not an address", "x", null)).toBeNull();
    const first = await addSuppression(addr("Sup").toUpperCase(), "bounced", null);
    expect(first?.created).toBe(true);
    expect((await addSuppression(addr("sup"), "again", null))?.created).toBe(false);
    expect(await isSuppressed(addr("SUP"))).toBe(true);
  });

  it("a suppressed address is recorded as failed with the reason and NOTHING is sent", async () => {
    await addSuppression(addr("blocked"), "bounced", null);
    const r = await sendEmail(msg(addr("Blocked")));
    expect(r.status).toBe("failed");
    const row = await rowOf(r.id);
    expect(row.attempts).toBe(0);
    expect(row.lastError).toMatch(/do-not-send/);
    expect(behaviour.sends).toEqual([]);
  });

  it("removing the address lets mail through again", async () => {
    const added = await addSuppression(addr("temp"), "x", null);
    const id = (await getPrisma().emailSuppression.findUniqueOrThrow({ where: { email: added!.email } })).id;
    expect((await removeSuppression(id))?.email).toBe(added!.email);
    expect((await sendEmail(msg(addr("temp")))).status).toBe("sent");
  });
});

describe("retry with back-off, then the worker", () => {
  it("a delivery error leaves the row queued with the next try in a minute; the worker waits for it, then sends", async () => {
    behaviour.fail = true;
    const to = addr("retry");
    const r = await sendEmail(msg(to));
    expect(r.status).toBe("queued");
    const row = await rowOf(r.id);
    expect(row.attempts).toBe(1);
    expect(row.lastError).toMatch(/ETIMEDOUT/);
    expect(row.nextAttemptAt!.getTime() - row.lastAttemptAt!.getTime()).toBeGreaterThanOrEqual(minutes(1) - 1000);

    // Not due yet: a run 10 seconds later does nothing to it.
    behaviour.fail = false;
    const early = await processOutbox({ now: new Date(row.lastAttemptAt!.getTime() + 10_000) });
    expect(early.claimed).toBe(0);
    expect((await rowOf(r.id)).status).toBe("queued");

    const due = await processOutbox({ now: new Date(row.nextAttemptAt!.getTime() + 1000) });
    expect(due.sent).toBe(1);
    const done = await rowOf(r.id);
    expect(done.status).toBe("sent");
    expect(done.attempts).toBe(2);
    expect(done.nextAttemptAt).toBeNull();
    expect(done.sentAt).not.toBeNull();
  });

  it("after four failed tries the row is failed, with 1 → 5 → 30 minute gaps", async () => {
    behaviour.fail = true;
    const r = await sendEmail(msg(addr("exhaust")));
    let row = await rowOf(r.id);
    const gaps = [minutes(5), minutes(30)];
    for (const gap of gaps) {
      const run = await processOutbox({ now: new Date(row.nextAttemptAt!.getTime() + 1000) });
      expect(run.retrying).toBe(1);
      const next = await rowOf(r.id);
      expect(next.status).toBe("queued");
      expect(next.nextAttemptAt!.getTime() - next.lastAttemptAt!.getTime()).toBe(gap);
      row = next;
    }
    const last = await processOutbox({ now: new Date(row.nextAttemptAt!.getTime() + 1000) });
    expect(last.failed).toBe(1);
    row = await rowOf(r.id);
    expect(row.status).toBe("failed");
    expect(row.attempts).toBe(MAX_ATTEMPTS);
    expect(row.nextAttemptAt).toBeNull();
    // A failed row is never picked up again by the worker.
    expect((await processOutbox({ now: new Date(Date.now() + 3600_000) })).claimed).toBe(0);
  });

  it("the worker sends a row that other code queued without sending (the daily reminders)", async () => {
    const row = await getPrisma().outboundEmail.create({ data: { toEmail: addr("reminder"), templateKey: "certificate.reminder-60", subject: "s", textBody: "t" } });
    const run = await processOutbox();
    expect(run.sent).toBeGreaterThanOrEqual(1);
    expect((await rowOf(row.id)).status).toBe("sent");
  });

  it("a row whose first attempt is still in flight (inside its lease) is left alone", async () => {
    const row = await getPrisma().outboundEmail.create({ data: { toEmail: addr("lease"), templateKey: "t", subject: "s", textBody: "t", nextAttemptAt: new Date(Date.now() + minutes(2)) } });
    const run = await processOutbox();
    expect(behaviour.sends).not.toContain(addr("lease"));
    expect((await rowOf(row.id)).status).toBe("queued");
    expect(run.claimed).toBe(0);
  });

  it("queued rows older than 7 days are not sent: they are marked failed with a plain reason (and can be retried)", async () => {
    const row = await getPrisma().outboundEmail.create({ data: { toEmail: addr("stale"), templateKey: "t", subject: "s", textBody: "t", createdAt: new Date(Date.now() - 8 * 24 * 3600_000) } });
    const run = await processOutbox();
    expect(run.stale).toBeGreaterThanOrEqual(1);
    expect(behaviour.sends).not.toContain(addr("stale"));
    const after = await rowOf(row.id);
    expect(after.status).toBe("failed");
    expect(after.lastError).toMatch(/more than 7 days/);
  });

  it("a suppressed address queued before it was suppressed is failed, not sent", async () => {
    const to = addr("late");
    const row = await getPrisma().outboundEmail.create({ data: { toEmail: to, templateKey: "t", subject: "s", textBody: "t" } });
    await addSuppression(to, "bounced", null);
    const run = await processOutbox();
    expect(run.suppressed).toBe(1);
    expect((await rowOf(row.id)).status).toBe("failed");
    expect(behaviour.sends).not.toContain(to);
  });

  it("two overlapping runs send each row exactly once", async () => {
    const tos = [addr("par1"), addr("par2"), addr("par3"), addr("par4")];
    for (const to of tos) await getPrisma().outboundEmail.create({ data: { toEmail: to, templateKey: "t", subject: "s", textBody: "t" } });
    await Promise.all([processOutbox(), processOutbox()]);
    for (const to of tos) expect(behaviour.sends.filter((s) => s === to), to).toHaveLength(1);
  });

  it("refuses to run in log-only production mode, so unsent mail is never marked sent", async () => {
    const row = await getPrisma().outboundEmail.create({ data: { toEmail: addr("logonly"), templateKey: "t", subject: "s", textBody: "t" } });
    process.env["EMAIL_TRANSPORT"] = "log";
    Object.assign(process.env, { NODE_ENV: "production" });
    delete process.env["APP_ENV"];
    const run = await processOutbox();
    expect(run.skipped).toMatch(/log-only/);
    expect(run.claimed).toBe(0);
    expect((await rowOf(row.id)).status).toBe("queued");
  });
});

describe("staff Retry", () => {
  it("retries a failed email with a fresh set of attempts", async () => {
    const row = await getPrisma().outboundEmail.create({ data: { toEmail: addr("manual"), templateKey: "t", subject: "s", textBody: "t", status: "failed", attempts: MAX_ATTEMPTS, lastError: "boom" } });
    const r = await retryFailedEmail(row.id);
    expect(r).toEqual({ ok: true, status: "sent" });
    const after = await rowOf(row.id);
    expect(after.status).toBe("sent");
    expect(after.lastError).toBeNull();
  });

  it("refuses an email that is not failed, an unknown id, and log-only mode", async () => {
    const sent = await sendEmail(msg(addr("okrow")));
    expect(await retryFailedEmail(sent.id)).toMatchObject({ ok: false, reason: "not-failed" });
    expect(await retryFailedEmail("00000000-0000-4000-8000-000000000000")).toMatchObject({ ok: false, reason: "not-found" });
    const failed = await getPrisma().outboundEmail.create({ data: { toEmail: addr("manual2"), templateKey: "t", subject: "s", textBody: "t", status: "failed", attempts: 4 } });
    process.env["EMAIL_TRANSPORT"] = "log";
    Object.assign(process.env, { NODE_ENV: "production" });
    delete process.env["APP_ENV"];
    expect(await retryFailedEmail(failed.id)).toMatchObject({ ok: false, reason: "not-configured" });
    expect((await rowOf(failed.id)).status).toBe("failed");
  });

  it("a Retry whose single attempt fails goes back to failed (not into a back-off the worker would ignore)", async () => {
    const row = await getPrisma().outboundEmail.create({ data: { toEmail: addr("manual4"), templateKey: "t", subject: "s", textBody: "t", status: "failed", attempts: MAX_ATTEMPTS, createdAt: new Date(Date.now() - 10 * 24 * 3600_000) } });
    behaviour.fail = true;
    expect(await retryFailedEmail(row.id)).toEqual({ ok: true, status: "failed" });
    const after = await rowOf(row.id);
    expect(after.status).toBe("failed");
    expect(after.nextAttemptAt).toBeNull();
    expect(after.lastError).toMatch(/ETIMEDOUT/);
  });

  it("a suppressed address stays failed on Retry", async () => {
    const to = addr("manual3");
    await addSuppression(to, "bounced", null);
    const failed = await getPrisma().outboundEmail.create({ data: { toEmail: to, templateKey: "t", subject: "s", textBody: "t", status: "failed", attempts: 4 } });
    expect(await retryFailedEmail(failed.id)).toEqual({ ok: true, status: "failed" });
    expect(behaviour.sends).not.toContain(to);
  });
});

describe("permanent failures, first-attempt lease, lease theft, budget", () => {
  it("a permanent refusal (5xx reply, or a refused recipient) is failed at once — no retries", async () => {
    behaviour.error = Object.assign(new Error("550 5.1.1 no such user"), { responseCode: 550 });
    const a = await sendEmail(msg(addr("perm1")));
    expect(a.status).toBe("failed");
    expect(await rowOf(a.id)).toMatchObject({ status: "failed", attempts: 1, nextAttemptAt: null });
    behaviour.error = Object.assign(new Error("recipient refused"), { permanent: true });
    expect((await sendEmail(msg(addr("perm2")))).status).toBe("failed");
  });

  it("a temporary reply (4xx) is retried with back-off", async () => {
    behaviour.error = Object.assign(new Error("451 try again later"), { responseCode: 451 });
    const r = await sendEmail(msg(addr("temp4xx")));
    expect(r.status).toBe("queued");
    expect((await rowOf(r.id)).nextAttemptAt).not.toBeNull();
  });

  it("while its first attempt is in flight the row holds a ~2 minute lease, cleared once sent", async () => {
    await getPrisma().outboundEmail.deleteMany({ where: { toEmail: { startsWith: `ob-${tag}` }, status: "queued" } }); // no other due row may be claimed while the gate is closed
    let release!: () => void;
    behaviour.gate = new Promise<void>((r) => (release = r));
    const to = addr("inflight");
    const pending = sendEmail(msg(to));
    let row = null as Awaited<ReturnType<typeof rowOf>> | null;
    await expect.poll(async () => (row = await getPrisma().outboundEmail.findFirst({ where: { toEmail: to } })) !== null && behaviour.sends.includes(to)).toBe(true);
    expect(row!.status).toBe("queued");
    expect(row!.nextAttemptAt!.getTime() - Date.now()).toBeGreaterThan(100_000);
    expect((await processOutbox()).claimed).toBe(0); // the worker leaves it alone
    release();
    expect((await pending).status).toBe("sent");
    expect((await rowOf(row!.id)).nextAttemptAt).toBeNull();
  });

  it("a run that is slow never sends a row another run has taken meanwhile", async () => {
    await getPrisma().outboundEmail.deleteMany({ where: { toEmail: { startsWith: `ob-${tag}` }, status: "queued" } }); // only these two are due
    const first = await getPrisma().outboundEmail.create({ data: { toEmail: addr("slow1"), templateKey: "t", subject: "s", textBody: "t" } });
    const second = await getPrisma().outboundEmail.create({ data: { toEmail: addr("slow2"), templateKey: "t", subject: "s", textBody: "t", createdAt: new Date(Date.now() + 1000) } });
    let release!: () => void;
    behaviour.gate = new Promise<void>((r) => (release = r));
    const run = processOutbox();
    await expect.poll(() => behaviour.sends.includes(addr("slow1"))).toBe(true); // run A is mid-send of the first row, holding a claim on the second
    // Meanwhile "run B" takes the second row (its lease is moved on).
    await getPrisma().outboundEmail.update({ where: { id: second.id }, data: { nextAttemptAt: new Date(Date.now() + 600_000) } });
    release();
    const result = await run;
    expect(result.sent).toBe(1);
    expect(behaviour.sends).not.toContain(addr("slow2"));
    expect((await rowOf(first.id)).status).toBe("sent");
    expect((await rowOf(second.id)).status).toBe("queued");
  });

  it("past the daily send budget mail waits (queued), the worker stops early, and nothing is lost", async () => {
    const prisma = getPrisma();
    await prisma.outboundEmail.deleteMany({ where: { toEmail: { startsWith: `ob-${tag}` }, status: "queued" } });
    const filler = Array.from({ length: SEND_BUDGET_PER_DAY }, (_, i) => ({ toEmail: addr(`fill${i}`), templateKey: "t", subject: "s", textBody: "t", status: "sent" as const, attempts: 1, providerMessageId: `<fill${i}@test>`, sentAt: new Date() }));
    await prisma.outboundEmail.createMany({ data: filler });
    try {
      expect(await sendBudgetExhausted()).toMatch(/daily/);
      const r = await sendEmail(msg(addr("overbudget")));
      expect(r.status).toBe("queued");
      expect(behaviour.sends).not.toContain(addr("overbudget"));
      expect((await rowOf(r.id)).nextAttemptAt).toBeNull();
      const run = await processOutbox();
      expect(run.budget).toMatch(/daily/);
      expect(run.sent).toBe(0);
      expect((await rowOf(r.id)).status).toBe("queued");
    } finally {
      await prisma.outboundEmail.deleteMany({ where: { toEmail: { startsWith: `ob-${tag}-fill` } } });
    }
    // The window has room again: the waiting mail goes out.
    expect((await processOutbox()).sent).toBeGreaterThanOrEqual(1);
    expect(behaviour.sends).toContain(addr("overbudget"));
  });
});
