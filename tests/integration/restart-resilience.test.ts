import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "../../src/generated/prisma/client.ts";
import { disconnectPrisma, getPrisma } from "@/db/prisma";
import { dateColumnToIso } from "@/modules/certificates/dates";
import { currentFeeSetting } from "@/modules/certificates/fee.repository";
import { publicCertificateById } from "@/modules/certificates/search.service";
import { createAdminUser, deleteTestOffering, issueTestCertificate } from "../helpers/certificates-db";
import { deleteTestUser } from "../helpers/identity-db";

/*
 * The Service Restart Test as an executable control (TESTING_ARCHITECTURE.md
 * §6; CLAUDE.md Rule 6; M9 plan §2 item 9).
 *
 * Shape: drive the product into partial states with the ordinary process
 * client, then read every one of them back through a BRAND-NEW PrismaClient
 * built from nothing but DATABASE_URL — the equivalent of a fresh instance
 * after a restart with every cache cleared. Nothing is read from process
 * memory, module state or the first client's pool. If any of these states
 * lived only in memory, the fresh client could not see it.
 *
 * States covered (the ones the plan names):
 *   - the renewal fee in force            (certificate_fee_settings)
 *   - an issued certificate's expiry      (certificates.expires_on)
 *   - a pending order's seat hold         (orders.status/expires_at)
 *   - a rate-limit counter                (auth_rate_limits)
 *   - a queued outbox row                 (outbound_emails)
 */

const prisma = getPrisma();
let fresh: PrismaClient;

let admin: { id: string; email: string };
let cert: Awaited<ReturnType<typeof issueTestCertificate>>;
let holderEmail: string;
let pendingOrderId: string;
let rateLimitKey: string;
let outboxId: string;

beforeAll(async () => {
  admin = await createAdminUser("m9-admin");
  cert = await issueTestCertificate({ adminUserId: admin.id });
  holderEmail = (await prisma.user.findUniqueOrThrow({ where: { id: cert.userId }, select: { email: true } })).email;

  // A seat hold: a pending order with an expiry in the future (M4 §2).
  const offering = await prisma.scheduledOffering.findUniqueOrThrow({ where: { id: cert.offeringId }, select: { programmeId: true } });
  const pending = await prisma.order.create({
    data: {
      userId: cert.userId,
      offeringId: cert.offeringId,
      programmeId: offering.programmeId,
      kind: "registration",
      status: "pending",
      region: "malaysia",
      currency: "MYR",
      amountMinor: BigInt(499900),
      expiresAt: new Date(Date.now() + 30 * 60_000),
    },
    select: { id: true },
  });
  pendingOrderId = pending.id;

  // A rate-limit counter, in the shape Better Auth's DB storage writes.
  rateLimitKey = `m9-restart-${randomUUID().slice(0, 8)}`;
  await prisma.authRateLimit.create({ data: { id: randomUUID(), key: rateLimitKey, count: 2, lastRequest: BigInt(Date.now()) } });

  // A queued outbox row (status defaults to `queued`).
  const outbox = await prisma.outboundEmail.create({
    data: { toEmail: holderEmail, templateKey: "m9.restart-probe", subject: "restart probe", textBody: "probe" },
    select: { id: true },
  });
  outboxId = outbox.id;

  // The fresh instance: a second, independent client and pool.
  const url = process.env["DATABASE_URL"];
  if (!url) throw new Error("DATABASE_URL must be set (tests/setup-env.ts points it at the test database)");
  fresh = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
});

afterAll(async () => {
  await fresh?.$disconnect();
  await prisma.outboundEmail.deleteMany({ where: { id: outboxId } });
  await prisma.authRateLimit.deleteMany({ where: { key: rateLimitKey } });
  await prisma.order.deleteMany({ where: { id: pendingOrderId } });
  await deleteTestOffering(cert.offeringId);
  await deleteTestUser(holderEmail);
  await deleteTestUser(admin.email);
  await disconnectPrisma();
});

describe("restart resilience — every critical state is readable by a fresh client", () => {
  it("the fresh client is genuinely a different connection", async () => {
    const a = await prisma.$queryRaw<{ pid: number }[]>`SELECT pg_backend_pid() AS pid`;
    const b = await fresh.$queryRaw<{ pid: number }[]>`SELECT pg_backend_pid() AS pid`;
    expect(a[0]?.pid).not.toBe(b[0]?.pid);
  });

  it("the renewal fee in force (repository over the fresh client)", async () => {
    const viaProcess = await currentFeeSetting(new Date(), prisma);
    const viaFresh = await currentFeeSetting(new Date(), fresh);
    expect(viaProcess).not.toBeNull();
    expect(viaFresh).toEqual(viaProcess);
    expect(viaFresh!.amountMinor).toBeGreaterThan(0);
  });

  it("an issued certificate's expiry and public status", async () => {
    const row = await fresh.certificate.findUniqueOrThrow({ where: { id: cert.certificate.id } });
    expect(dateColumnToIso(row.expiresOn)).toBe(cert.certificate.expiresOn);
    const view = await publicCertificateById(cert.certificate.certificateId, new Date(), fresh);
    expect(view?.certificateId).toBe(cert.certificate.certificateId);
    expect(view?.status).toBe("active");
  });

  it("a pending order's seat hold", async () => {
    const row = await fresh.order.findUniqueOrThrow({ where: { id: pendingOrderId } });
    expect(row.status).toBe("pending");
    expect(row.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("a rate-limit counter", async () => {
    const row = await fresh.authRateLimit.findUniqueOrThrow({ where: { key: rateLimitKey } });
    expect(row.count).toBe(2);
  });

  it("a queued outbox row", async () => {
    const row = await fresh.outboundEmail.findUniqueOrThrow({ where: { id: outboxId } });
    expect(row.status).toBe("queued");
    expect(row.attempts).toBe(0);
  });
});
