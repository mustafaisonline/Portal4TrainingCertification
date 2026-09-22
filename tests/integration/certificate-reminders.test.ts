import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@app/api/jobs/certificate-reminders/route";
import { disconnectPrisma, getPrisma, withTransaction } from "@/db/prisma";
import { addDays } from "@/modules/certificates/dates";
import { REMINDER_STAGES } from "@/modules/certificates/reminders";
import { lastReminderRun, listNotificationsForRecipient, listRemindersForCertificate, REMINDER_JOB_ID, runCertificateReminders } from "@/modules/certificates/reminders.service";
import { revokeCertificate } from "@/modules/certificates/repository";
import { listAuditForEntity, writeAudit, type AuditEntry } from "@/modules/platform/audit/repository";
import { certificateTodayIso, createAdminUser, createCertificateUser, deleteTestOffering, issueTestCertificate, setCertificateExpiry } from "../helpers/certificates-db";
import { deleteTestUser } from "../helpers/identity-db";

/*
 * Renewal reminders — integration against the REAL test database
 * (MILESTONE_7_EXECUTION_PLAN.md §5 criteria 2–6). `writeAudit` is wrapped
 * (pass-through by default) so ONE test can make the audit write fail and
 * prove the outbox row rolls back with it (criterion 5).
 */

vi.mock("@/modules/platform/audit/repository", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/modules/platform/audit/repository")>();
  return { ...actual, writeAudit: vi.fn(actual.writeAudit) };
});

const prisma = getPrisma();
const startedAt = new Date();
const holderEmails: string[] = [];
const offerings: string[] = [];
let admin: { id: string; email: string };
const today = certificateTodayIso();

async function issued(expiresOnIso: string, prefix = "m7") {
  const u = await createCertificateUser({ prefix, legalName: "Reminder Person" });
  holderEmails.push(u.email);
  const fixture = await issueTestCertificate({ adminUserId: admin.id, userId: u.id, expiresOnIso });
  offerings.push(fixture.offeringId);
  return { ...fixture, email: u.email };
}

function outboxFor(email: string) {
  return prisma.outboundEmail.findMany({ where: { toEmail: email, templateKey: { startsWith: "certificate.reminder." } }, orderBy: { createdAt: "asc" } });
}

const run = (now = new Date()) => runCertificateReminders({ now });

beforeAll(async () => {
  admin = await createAdminUser("m7-admin");
});

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "info").mockImplementation(() => {});
});

afterAll(async () => {
  vi.restoreAllMocks();
  for (const email of holderEmails) await deleteTestUser(email);
  for (const id of offerings) await deleteTestOffering(id);
  await deleteTestUser(admin.email);
  // job.run rows this suite produced (test-only hygiene; audit_log is insert-only in the product).
  await prisma.auditLog.deleteMany({ where: { entityType: "job", entityId: REMINDER_JOB_ID, createdAt: { gte: startedAt } } });
  await disconnectPrisma();
});

describe("runCertificateReminders — stages, idempotency, re-arming", () => {
  it("queues before_30 once — outbox row and audit row together — and a replay queues nothing", async () => {
    const a = await issued(addDays(today, 20));

    const first = await run();
    expect(first.today).toBe(today);
    expect(first.queued).toBeGreaterThanOrEqual(1);
    expect(first.failed).toBe(0);
    expect(first.considered).toBe(first.queued + first.skipped + first.failed);

    const reminders = await listRemindersForCertificate(a.certificate.id);
    expect(reminders).toHaveLength(1);
    expect(reminders[0]!.stage).toBe("before_30");
    expect(reminders[0]!.expiresOn).toBe(a.certificate.expiresOn);

    const outbox = await outboxFor(a.email);
    expect(outbox).toHaveLength(1);
    expect(outbox[0]!.templateKey).toBe("certificate.reminder.before_30");
    expect(outbox[0]!.status).toBe("queued");
    expect(outbox[0]!.subject).toContain(a.certificate.certificateId);
    expect(outbox[0]!.textBody).toContain("USD 10.00");
    expect(outbox[0]!.textBody).toContain("/account/certificate");
    expect(reminders[0]!.outboundEmailId).toBe(outbox[0]!.id);

    const audit = await listAuditForEntity(prisma, "certificate", a.certificate.id);
    const queuedRows = audit.filter((r) => r.action === "certificate.reminder_queued");
    expect(queuedRows).toHaveLength(1);
    expect(queuedRows[0]!.actorUserId).toBeNull();
    expect(queuedRows[0]!.after).toMatchObject({ stage: "before_30", expiresOn: a.certificate.expiresOn, outboundEmailId: outbox[0]!.id });

    // Replay: nothing new anywhere.
    const second = await run();
    expect(second.queued).toBe(0);
    expect(second.failed).toBe(0);
    expect(second.skipped).toBe(second.considered);
    expect(await listRemindersForCertificate(a.certificate.id)).toHaveLength(1);
    expect(await outboxFor(a.email)).toHaveLength(1);

    // The holder sees it on /account/notifications (subject + status, never the body).
    const notes = await listNotificationsForRecipient(a.email);
    const mine = notes.filter((n) => n.templateKey.startsWith("certificate.reminder."));
    expect(mine).toHaveLength(1);
    expect(mine[0]).toMatchObject({ subject: outbox[0]!.subject, status: "queued" });
    expect(Object.keys(mine[0]!)).not.toContain("textBody");

    // A new stage is new: 5 days left → before_7.
    await setCertificateExpiry(a.certificate.id, addDays(today, 5));
    const third = await run();
    expect(third.byStage.before_7).toBeGreaterThanOrEqual(1);
    const afterSeven = await listRemindersForCertificate(a.certificate.id);
    expect(afterSeven.map((r) => r.stage)).toEqual(["before_7", "before_30"]); // newest first
    expect(await outboxFor(a.email)).toHaveLength(2);

    // Renewed (expiry moved a year out): nothing due, nothing queued.
    await setCertificateExpiry(a.certificate.id, addDays(today, 370));
    await run();
    expect(await listRemindersForCertificate(a.certificate.id)).toHaveLength(2);

    // Next cycle: the same stage for a NEW expiresOn is queued again. (A
    // renewal always yields a different date; the SAME date would rightly
    // be treated as already reminded.)
    const nextExpiry = addDays(today, 21);
    await setCertificateExpiry(a.certificate.id, nextExpiry);
    await run();
    const rearmed = await listRemindersForCertificate(a.certificate.id);
    expect(rearmed).toHaveLength(3);
    expect(rearmed[0]).toMatchObject({ stage: "before_30", expiresOn: nextExpiry });
    expect(await outboxFor(a.email)).toHaveLength(3);
    // …and only once for that expiry.
    await run();
    expect(await listRemindersForCertificate(a.certificate.id)).toHaveLength(3);
  });

  it("a revoked certificate is never reminded (F4)", async () => {
    const b = await issued(addDays(today, 10));
    await withTransaction((tx) => revokeCertificate(tx, b.certificate.id, admin.id, "integration test revocation"));
    await run();
    expect(await listRemindersForCertificate(b.certificate.id)).toEqual([]);
    expect(await outboxFor(b.email)).toEqual([]);
  });

  it("lapsed yesterday → lapsed_1 exactly once; lapsed 45 days ago → nothing", async () => {
    const c = await issued(addDays(today, -1));
    const d = await issued(addDays(today, -45));
    const r = await run();
    expect(r.byStage.lapsed_1).toBeGreaterThanOrEqual(1);
    const cRem = await listRemindersForCertificate(c.certificate.id);
    expect(cRem).toHaveLength(1);
    expect(cRem[0]!.stage).toBe("lapsed_1");
    expect((await outboxFor(c.email))[0]!.templateKey).toBe("certificate.reminder.lapsed_1");
    expect((await outboxFor(c.email))[0]!.subject).toMatch(/expired on/);
    await run();
    expect(await listRemindersForCertificate(c.certificate.id)).toHaveLength(1);
    expect(await listRemindersForCertificate(d.certificate.id)).toEqual([]);
    expect(await outboxFor(d.email)).toEqual([]);
  });

  it("the clock is injectable: the same certificate moves through the stages as 'now' advances", async () => {
    const e = await issued(addDays(today, 60));
    const at = (daysFromToday: number) => new Date(`${addDays(today, daysFromToday)}T04:00:00Z`); // noon MYT
    await run(at(0));
    expect(await listRemindersForCertificate(e.certificate.id)).toEqual([]);
    await run(at(30)); // 30 days left
    await run(at(53)); // 7 days left
    await run(at(61)); // expired yesterday
    await run(at(61)); // replay
    expect((await listRemindersForCertificate(e.certificate.id)).map((r) => r.stage)).toEqual(["lapsed_1", "before_7", "before_30"]);
    expect(await outboxFor(e.email)).toHaveLength(3);
  });

  it("records every run as a job.run audit row with its counts; lastReminderRun reads the newest", async () => {
    const before = await lastReminderRun();
    const r = await run();
    const after = await lastReminderRun();
    expect(after).not.toBeNull();
    expect(after!.ranAt.getTime()).toBeGreaterThanOrEqual(startedAt.getTime());
    if (before) expect(after!.ranAt.getTime()).toBeGreaterThanOrEqual(before.ranAt.getTime());
    expect(after).toMatchObject({ considered: r.considered, queued: r.queued, skipped: r.skipped, failed: r.failed });
    const rows = await prisma.auditLog.findMany({ where: { entityType: "job", entityId: REMINDER_JOB_ID, action: "job.run", createdAt: { gte: startedAt } } });
    expect(rows.length).toBeGreaterThanOrEqual(2);
    expect(rows.at(-1)!.actorUserId).toBeNull();
    expect(rows.at(-1)!.after).toMatchObject({ today, byStage: expect.objectContaining(Object.fromEntries(REMINDER_STAGES.map((s) => [s, expect.any(Number)]))) });
  });

  it("outbox row and audit row commit together: a failing audit write leaves neither, is counted as failed, and the next run succeeds", async () => {
    const f = await issued(addDays(today, 20));
    const actual = (await vi.importActual<typeof import("@/modules/platform/audit/repository")>("@/modules/platform/audit/repository")).writeAudit;
    const mocked = vi.mocked(writeAudit);
    mocked.mockImplementation(async (db, entry: AuditEntry) => {
      if (entry.action === "certificate.reminder_queued" && entry.entityId === f.certificate.id) throw new Error("injected audit failure");
      return actual(db, entry);
    });
    try {
      const r = await run();
      expect(r.failed).toBe(1);
      expect(await listRemindersForCertificate(f.certificate.id)).toEqual([]);
      expect(await outboxFor(f.email)).toEqual([]);
      expect((await lastReminderRun())!.failed).toBe(1);
    } finally {
      mocked.mockImplementation(actual);
    }
    const again = await run();
    expect(again.failed).toBe(0);
    expect(await listRemindersForCertificate(f.certificate.id)).toHaveLength(1);
    expect(await outboxFor(f.email)).toHaveLength(1);
  });

  it("invariant: one outbox row per reminder audit row across everything this suite queued", async () => {
    const certs = await prisma.certificate.findMany({ where: { offeringId: { in: offerings } }, select: { id: true } });
    const auditCount = await prisma.auditLog.count({ where: { action: "certificate.reminder_queued", entityType: "certificate", entityId: { in: certs.map((c) => c.id) } } });
    const outboxCount = await prisma.outboundEmail.count({ where: { toEmail: { in: holderEmails }, templateKey: { startsWith: "certificate.reminder." } } });
    expect(auditCount).toBeGreaterThan(0);
    expect(outboxCount).toBe(auditCount);
    // Everything stays queued: nothing pretends to have been sent (F3).
    expect(await prisma.outboundEmail.count({ where: { toEmail: { in: holderEmails }, templateKey: { startsWith: "certificate.reminder." }, status: { not: "queued" } } })).toBe(0);
  });
});

describe("POST /api/jobs/certificate-reminders", () => {
  const saved = process.env["JOBS_SECRET"];
  const request = (auth?: string) => new Request("http://localhost/api/jobs/certificate-reminders", { method: "POST", headers: auth ? { authorization: auth } : {} });

  afterAll(() => {
    if (saved === undefined) delete process.env["JOBS_SECRET"];
    else process.env["JOBS_SECRET"] = saved;
  });

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

  it("200 with the counts when the token matches", async () => {
    process.env["JOBS_SECRET"] = "integration-jobs-secret";
    const res = await POST(request("Bearer integration-jobs-secret"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ considered: expect.any(Number), queued: expect.any(Number), skipped: expect.any(Number), failed: 0, today, byStage: expect.any(Object) });
    expect((await lastReminderRun())!.considered).toBe(body.considered);
  });
});
