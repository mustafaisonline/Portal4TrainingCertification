import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { disconnectPrisma, getPrisma, withTransaction } from "@/db/prisma";
import { deleteOffering } from "@/modules/catalogue/offerings/repository";
import { createTraining, deleteTraining } from "@/modules/catalogue/programmes/admin.repository";
import { findFlagshipProgramme } from "@/modules/catalogue/programmes/repository";
import type { ProgrammeRecord } from "@/modules/catalogue/programmes/types";
import { deleteOrderForUser } from "@/modules/commerce/registrations.service";
import { listAuditForEntity } from "@/modules/platform/audit/repository";
import { countryCodeFor } from "@/content/countries";
import { completeProfile, uniqueEmail } from "../helpers/identity-db";

/*
 * The guarded deletions of 2026-09-28 (founder: "give the option to delete
 * the entries" on /account/orders, /admin/trainings and /admin/offerings)
 * against the REAL test database. The rule under test everywhere: anything
 * that became money, a seat or a certificate is a record and is refused;
 * only the truly unused row deletes, audited.
 */

const prisma = getPrisma();
let flagship: ProgrammeRecord;
let admin: { id: string };
let user: { id: string; email: string };
const createdUsers: string[] = [];
const createdOfferings: string[] = [];
const createdProgrammes: string[] = [];

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

async function createOffering() {
  const row = await prisma.scheduledOffering.create({
    data: {
      programmeId: flagship.id,
      deliveryFormatId: flagship.deliveryFormats[0]?.id ?? null,
      modality: "live_online",
      timezone: "Asia/Kuala_Lumpur",
      startsOn: daysFromNow(35),
      endsOn: daysFromNow(37),
      capacity: null,
      status: "open",
    },
  });
  createdOfferings.push(row.id);
  return row;
}

beforeAll(async () => {
  const p = await findFlagshipProgramme();
  if (!p) throw new Error("seeded flagship programme required");
  flagship = p;
  const a = await prisma.user.create({ data: { email: uniqueEmail("del-admin"), name: "Delete Admin" } });
  createdUsers.push(a.id);
  admin = { id: a.id };
  const u = await prisma.user.create({ data: { email: uniqueEmail("del-user"), name: "Delete User", country: "Singapore" } });
  createdUsers.push(u.id);
  await completeProfile(u.id, { countryCode: countryCodeFor("Singapore") ?? "SG", nationalityCode: "SG" });
  user = { id: u.id, email: u.email };
});

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(async () => {
  const orderIds = (await prisma.order.findMany({ where: { userId: { in: createdUsers } }, select: { id: true } })).map((o) => o.id);
  await prisma.$transaction([
    prisma.order.deleteMany({ where: { id: { in: orderIds } } }),
    prisma.auditLog.deleteMany({ where: { entityId: { in: [...orderIds, ...createdOfferings, ...createdProgrammes, ...createdUsers] } } }),
    prisma.auditLog.deleteMany({ where: { actorUserId: { in: createdUsers } } }),
    prisma.userProfile.deleteMany({ where: { userId: { in: createdUsers } } }),
    prisma.scheduledOffering.deleteMany({ where: { id: { in: createdOfferings } } }),
    prisma.programme.deleteMany({ where: { id: { in: createdProgrammes } } }),
    prisma.user.deleteMany({ where: { id: { in: createdUsers } } }),
  ]);
  await disconnectPrisma();
});

describe("guarded deletions (founder, 2026-09-28)", () => {
  it("an order: a live pending hold is refused, a paid one is a record, an expired unpaid one deletes with an audit record", async () => {
    const offering = await createOffering();
    const mkOrder = (status: "pending" | "paid", expiresInMs: number) =>
      prisma.order.create({
        data: {
          userId: user.id,
          offeringId: offering.id,
          programmeId: flagship.id,
          status,
          region: "international",
          currency: "USD",
          amountMinor: 100000n,
          expiresAt: new Date(Date.now() + expiresInMs),
        },
      });

    const live = await mkOrder("pending", 20 * 60_000);
    expect(await withTransaction((tx) => deleteOrderForUser(tx, { orderId: live.id, userId: user.id }))).toBe("pending_live");

    const paid = await mkOrder("paid", -60_000);
    expect(await withTransaction((tx) => deleteOrderForUser(tx, { orderId: paid.id, userId: user.id }))).toBe("is_record");

    const stale = await mkOrder("pending", -60_000); // hold expired
    expect(await withTransaction((tx) => deleteOrderForUser(tx, { orderId: stale.id, userId: admin.id }))).toBe("not_found"); // not theirs
    expect(await withTransaction((tx) => deleteOrderForUser(tx, { orderId: stale.id, userId: user.id }))).toBe("deleted");
    expect(await prisma.order.findUnique({ where: { id: stale.id } })).toBeNull();
    expect((await listAuditForEntity(prisma, "order", stale.id)).map((a) => a.action)).toContain("order.deleted");
  });

  it("an offering: one with an order is a record; an empty one deletes with an audit record", async () => {
    const referenced = await createOffering();
    await prisma.order.create({
      data: { userId: user.id, offeringId: referenced.id, programmeId: flagship.id, status: "expired", region: "international", currency: "USD", amountMinor: 100000n, expiresAt: new Date() },
    });
    expect(await withTransaction((tx) => deleteOffering(tx, referenced.id, admin.id))).toBe("in_use");

    const empty = await createOffering();
    expect(await withTransaction((tx) => deleteOffering(tx, empty.id, admin.id))).toBe("deleted");
    expect(await prisma.scheduledOffering.findUnique({ where: { id: empty.id } })).toBeNull();
    expect((await listAuditForEntity(prisma, "scheduled_offering", empty.id)).map((a) => a.action)).toContain("offering.deleted");
    expect(await withTransaction((tx) => deleteOffering(tx, empty.id, admin.id))).toBe("not_found");
  });

  it("a training: one with dates (or any history) is refused; a fresh never-scheduled draft deletes with an audit record", async () => {
    // The flagship has an offering created above → in_use, never deleted.
    expect(await withTransaction((tx) => deleteTraining(tx, flagship.id, admin.id))).toBe("in_use");
    expect(await prisma.programme.findUnique({ where: { id: flagship.id }, select: { id: true } })).not.toBeNull();

    const domain = await prisma.domain.findFirstOrThrow({ select: { id: true } });
    const draft = await withTransaction((tx) =>
      createTraining(
        tx,
        {
          title: `Delete Me ${randomUUID().slice(0, 6)}`,
          subtitle: "A draft with no history",
          slug: "",
          domainId: domain.id,
          level: "practitioner",
          flagship: false,
          durationLabel: "1 day",
          prerequisites: "None",
          formats: ["Live online"],
          certificateLabel: "Certificate of Completion",
          audienceSummary: "Nobody yet",
          summary: "A draft created only to be deleted.",
          valueProposition: "None.",
          sortOrder: 999,
        },
        { userId: admin.id, expertId: null },
      ),
    );
    createdProgrammes.push(draft.id);
    expect(await withTransaction((tx) => deleteTraining(tx, draft.id, admin.id))).toBe("deleted");
    expect(await prisma.programme.findUnique({ where: { id: draft.id } })).toBeNull();
    expect((await listAuditForEntity(prisma, "programme", draft.id)).map((a) => a.action)).toContain("programme.deleted");
  });
});
