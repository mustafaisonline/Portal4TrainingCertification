import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { disconnectPrisma, getPrisma, withTransaction } from "@/db/prisma";
import {
  createOffering,
  findOfferingById,
  listAllOfferings,
  listUpcomingPublicOfferings,
  OfferingValidationError,
  updateOffering,
  type OfferingWriteInput,
} from "@/modules/catalogue/offerings/repository";
import { findProgrammeBySlug, listDeliveryFormatsForAdmin, listProgrammesForAdmin } from "@/modules/catalogue/programmes/repository";
import type { ProgrammeRecord } from "@/modules/catalogue/programmes/types";
import { listAuditForEntity } from "@/modules/platform/audit/repository";
import { courses } from "../../prisma/seed-data/courses";

/*
 * Admin offerings — integration against the REAL test database (M4 plan §2
 * item 2; §7 criterion 2). Programmes and formats are the seeded ones, read
 * through the repository; every offering this file creates is removed again
 * so the "no invented dates" assertion in catalogue.test.ts stays true.
 */
const prisma = getPrisma();
const actor = randomUUID(); // audit_log.actor_user_id is a plain uuid (no FK)
const created: string[] = [];

let flagship: ProgrammeRecord;
let unlisted: ProgrammeRecord;

function baseInput(overrides: Partial<OfferingWriteInput> = {}): OfferingWriteInput {
  return {
    programmeId: flagship.id,
    deliveryFormatId: flagship.deliveryFormats[0]!.id,
    modality: "live_online",
    location: null,
    timezone: "Asia/Kuala_Lumpur",
    startsOn: "2027-03-01",
    endsOn: "2027-03-05",
    capacity: 16,
    status: "planned",
    scheduleNote: "integration test — please ignore",
    leadExpertId: null,
    ...overrides,
  };
}

async function create(input: OfferingWriteInput) {
  const record = await withTransaction((tx) => createOffering(tx, input, actor));
  created.push(record.id);
  return record;
}

async function expectValidationError(fn: () => Promise<unknown>, field: keyof OfferingWriteInput) {
  const err = await fn().then(
    () => null,
    (e: unknown) => e,
  );
  expect(err, `expected a validation error on ${field}`).toBeInstanceOf(OfferingValidationError);
  expect((err as OfferingValidationError).fieldErrors).toHaveProperty(field);
}

beforeAll(async () => {
  const flagshipSlug = courses.find((c) => c.flagship)!.slug;
  const unlistedSlug = courses.find((c) => !c.flagship && c.status !== "published")!.slug;
  flagship = (await findProgrammeBySlug(flagshipSlug))!;
  unlisted = (await findProgrammeBySlug(unlistedSlug))!;
  expect(flagship.deliveryFormats.length).toBeGreaterThan(0);
});

afterAll(async () => {
  if (created.length) {
    await prisma.auditLog.deleteMany({ where: { entityType: "offering", entityId: { in: created } } });
    await prisma.scheduledOffering.deleteMany({ where: { id: { in: created } } });
  }
  expect(await prisma.scheduledOffering.count({ where: { id: { in: created } } })).toBe(0);
  await disconnectPrisma();
});

describe("admin options", () => {
  it("lists every programme (any status) and every format with its programme", async () => {
    const programmes = await listProgrammesForAdmin();
    expect(programmes.map((p) => p.slug)).toEqual(expect.arrayContaining([flagship.slug, unlisted.slug]));
    expect(programmes.find((p) => p.slug === unlisted.slug)?.status).toBe("unlisted");

    const formats = await listDeliveryFormatsForAdmin();
    const flagshipFormats = formats.filter((f) => f.programmeId === flagship.id);
    expect(flagshipFormats.map((f) => f.code)).toEqual(flagship.deliveryFormats.map((f) => f.code));
  });
});

describe("create → find → update", () => {
  it("creates an offering with its audit row, and reads it back by id", async () => {
    const record = await create(baseInput());
    expect(record.programmeSlug).toBe(flagship.slug);
    expect(record.format?.code).toBe(flagship.deliveryFormats[0]!.code);
    expect(record.startsOn.toISOString()).toBe("2027-03-01T00:00:00.000Z");
    expect(record.endsOn.toISOString()).toBe("2027-03-05T00:00:00.000Z");
    expect(record.capacity).toBe(16);
    expect(record.status).toBe("planned");

    const found = await findOfferingById(record.id);
    expect(found).toEqual(record);
    expect(await findOfferingById("not-a-uuid")).toBeNull();
    expect(await findOfferingById(randomUUID())).toBeNull();

    const audit = await listAuditForEntity(prisma, "offering", record.id);
    expect(audit.map((a) => a.action)).toEqual(["offering.created"]);
    expect(audit[0]!.actorUserId).toBe(actor);
    expect(audit[0]!.before).toBeNull();
    expect(audit[0]!.after).toMatchObject({ programmeId: flagship.id, startsOn: "2027-03-01", endsOn: "2027-03-05", capacity: 16, status: "planned" });
  });

  it("updates status and capacity, auditing only the fields that changed", async () => {
    const record = await create(baseInput({ startsOn: "2027-04-12", endsOn: "2027-04-16" }));
    const updated = await withTransaction((tx) => updateOffering(tx, record.id, { status: "open", capacity: 12 }, actor));
    expect(updated?.status).toBe("open");
    expect(updated?.capacity).toBe(12);
    expect(updated?.startsOn.toISOString()).toBe("2027-04-12T00:00:00.000Z"); // untouched fields are kept

    // An identical patch changes nothing and writes no audit row.
    await withTransaction((tx) => updateOffering(tx, record.id, { status: "open", capacity: 12 }, actor));

    const audit = await listAuditForEntity(prisma, "offering", record.id);
    expect(audit.map((a) => a.action)).toEqual(["offering.created", "offering.updated"]);
    expect(audit[1]!.before).toEqual({ status: "planned", capacity: 16 });
    expect(audit[1]!.after).toEqual({ status: "open", capacity: 12 });

    expect(await withTransaction((tx) => updateOffering(tx, randomUUID(), { status: "open" }, actor))).toBeNull();
  });

  it("appears in the admin list with zero counts, and on the public list only while planned/open/full", async () => {
    const record = await create(baseInput({ startsOn: "2027-05-03", endsOn: "2027-05-07", status: "open" }));
    const admin = (await listAllOfferings()).find((o) => o.id === record.id);
    expect(admin).toBeDefined();
    expect(admin!.confirmedCount).toBe(0);
    expect(admin!.pendingCount).toBe(0);
    expect((await listUpcomingPublicOfferings(flagship.id)).map((o) => o.id)).toContain(record.id);

    await withTransaction((tx) => updateOffering(tx, record.id, { status: "cancelled" }, actor));
    expect((await listUpcomingPublicOfferings(flagship.id)).map((o) => o.id)).not.toContain(record.id);
    expect((await listAllOfferings()).find((o) => o.id === record.id)?.status).toBe("cancelled");
  });
});

describe("validation", () => {
  it("rejects a last day before the first day", async () => {
    await expectValidationError(() => create(baseInput({ startsOn: "2027-03-05", endsOn: "2027-03-04" })), "endsOn");
  });

  it("rejects a capacity of 0 (and negative or fractional values)", async () => {
    await expectValidationError(() => create(baseInput({ capacity: 0 })), "capacity");
    await expectValidationError(() => create(baseInput({ capacity: -3 })), "capacity");
    await expectValidationError(() => create(baseInput({ capacity: 2.5 })), "capacity");
  });

  it("rejects a format that belongs to another programme", async () => {
    await expectValidationError(
      () => create(baseInput({ programmeId: unlisted.id, deliveryFormatId: flagship.deliveryFormats[0]!.id })),
      "deliveryFormatId",
    );
  });

  it("rejects malformed dates, unknown programme / expert, and an invalid time zone", async () => {
    await expectValidationError(() => create(baseInput({ startsOn: "2027-02-30" })), "startsOn");
    await expectValidationError(() => create(baseInput({ endsOn: "next week" })), "endsOn");
    await expectValidationError(() => create(baseInput({ programmeId: randomUUID(), deliveryFormatId: null })), "programmeId");
    await expectValidationError(() => create(baseInput({ leadExpertId: randomUUID() })), "leadExpertId");
    await expectValidationError(() => create(baseInput({ timezone: "Mars/Olympus_Mons" })), "timezone");
  });

  it("applies the same rules on update, and a failed update leaves the row and audit untouched", async () => {
    const record = await create(baseInput({ startsOn: "2027-06-07", endsOn: "2027-06-11" }));
    await expectValidationError(
      () => withTransaction((tx) => updateOffering(tx, record.id, { endsOn: "2027-06-01" }, actor)),
      "endsOn",
    );
    await expectValidationError(() => withTransaction((tx) => updateOffering(tx, record.id, { capacity: 0 }, actor)), "capacity");
    expect((await findOfferingById(record.id))?.endsOn.toISOString()).toBe("2027-06-11T00:00:00.000Z");
    expect((await listAuditForEntity(prisma, "offering", record.id)).map((a) => a.action)).toEqual(["offering.created"]);
  });

  it("nothing this file created leaks into the public schedule after cleanup (checked in afterAll)", () => {
    expect(created.length).toBeGreaterThan(0);
  });
});
