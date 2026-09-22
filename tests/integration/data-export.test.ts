import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { disconnectPrisma, getPrisma } from "@/db/prisma";
import { buildDataExport, exportFilename, toJsonSafe } from "@/modules/identity/data-export";
import { getCurrentUser } from "@/modules/identity/session";
import { listAuditForEntity } from "@/modules/platform/audit/repository";
import { GET as exportRoute } from "@app/api/me/export/route";
import { createEndedOfferingFixture, createPaidRegistrationFixture, deleteTestOffering } from "../helpers/certificates-db";
import { completeProfile, deleteTestUser, uniqueEmail } from "../helpers/identity-db";

/*
 * Participant data export — integration against the REAL test database
 * (MILESTONE_8_EXECUTION_PLAN.md §2 item 7; §4 criterion 6). Two people
 * with parallel data: exporting one yields only that person's rows, the ID
 * number appears masked and never in clear, amounts are numbers, dates are
 * ISO strings. The route is exercised with the session lookup replaced —
 * `getCurrentUser` reads Next's request headers, which do not exist here —
 * so the audit row, headers and body come from the real handler.
 */

vi.mock("@/modules/identity/session", () => ({ getCurrentUser: vi.fn() }));

const prisma = getPrisma();
const emails: string[] = [];
const offerings: string[] = [];

type Person = { id: string; email: string; registrationId: string; orderId: string; reviewId: string; nric: string };
let alice: Person;
let bob: Person;

async function createPerson(name: string, nric: string, offeringId: string): Promise<Person> {
  const email = uniqueEmail("m8export");
  emails.push(email);
  const user = await prisma.user.create({ data: { email, name, country: "Malaysia" }, select: { id: true, email: true } });
  await completeProfile(user.id, { legalName: name, idType: "nric", idNumber: nric, organisation: `${name} Ltd` });
  const { orderId, registrationId } = await createPaidRegistrationFixture(user.id, offeringId);
  const offering = await prisma.scheduledOffering.findUniqueOrThrow({ where: { id: offeringId }, select: { programmeId: true } });
  const review = await prisma.review.create({
    data: {
      userId: user.id,
      registrationId,
      programmeId: offering.programmeId,
      offeringId,
      kind: "registration",
      body: `A review written by ${name} for the export test, long enough to be a review.`,
      rating: 5,
      consentPublic: false,
      displayNameSnapshot: name,
    },
    select: { id: true },
  });
  await prisma.consent.create({ data: { userId: user.id, documentKey: "privacy", documentVersion: `v-${randomUUID().slice(0, 6)}` } });
  return { id: user.id, email: user.email, registrationId, orderId, reviewId: review.id, nric };
}

beforeAll(async () => {
  const offering = await createEndedOfferingFixture({ endsOnDaysAgo: -30, status: "open" });
  offerings.push(offering.id);
  alice = await createPerson("Alice Export", "900101011111", offering.id);
  bob = await createPerson("Bob Export", "900202022222", offering.id);
});

afterAll(async () => {
  for (const id of offerings) await deleteTestOffering(id);
  for (const e of emails) await deleteTestUser(e);
  await disconnectPrisma();
});

describe("buildDataExport", () => {
  it("contains only the owner's rows, with the ID number masked and amounts as numbers", async () => {
    const data = await buildDataExport(alice.id);
    expect(data).not.toBeNull();
    const text = JSON.stringify(data);

    expect(data!.account).toMatchObject({ id: alice.id, email: alice.email, name: "Alice Export" });
    expect(data!.profile).toMatchObject({ legalName: "Alice Export", idType: "nric", idNumberMasked: "••••1111", organisation: "Alice Export Ltd" });
    expect(text).not.toContain(alice.nric);
    expect(text).not.toContain(bob.nric);
    expect(text).not.toContain("idNumberCiphertext");
    expect(text).not.toContain("photo\"");

    expect(data!.registrations.map((r) => r["id"])).toEqual([alice.registrationId]);
    expect(data!.orders.map((o) => o["id"])).toEqual([alice.orderId]);
    expect(data!.orders[0]).toMatchObject({ amountMinor: 499900, currency: "MYR", status: "paid", kind: "registration" });
    expect(typeof data!.orders[0]!["amountMinor"]).toBe("number");
    expect(data!.payments).toHaveLength(1);
    expect(data!.payments[0]!["orderId"]).toBe(alice.orderId);
    expect(typeof data!.payments[0]!["amountMinor"]).toBe("number");
    expect(data!.reviews.map((r) => r["id"])).toEqual([alice.reviewId]);
    expect(data!.consents.length).toBeGreaterThanOrEqual(1);
    expect(data!.refunds).toEqual([]);
    expect(data!.certificates).toEqual([]);
    expect(data!.renewals).toEqual([]);

    // The other person is absent entirely.
    for (const id of [bob.id, bob.email, bob.registrationId, bob.orderId, bob.reviewId]) expect(text).not.toContain(id);

    // Actions the person took (the profile save) are included as actor rows.
    expect(data!.auditAsActor.some((a) => a["action"] === "profile.updated" && a["entityId"] === alice.id)).toBe(true);
    expect(data!.auditAsActor.every((a) => a["entityId"] !== bob.id)).toBe(true);

    // Dates are ISO strings; the object round-trips through JSON unchanged.
    expect(typeof data!.account["createdAt"]).toBe("string");
    expect(data!.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(data!.registrations[0]!["startsOn"]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(JSON.parse(text)).toEqual(data);
  });

  it("returns null for an unknown user", async () => {
    expect(await buildDataExport(randomUUID())).toBeNull();
  });

  it("toJsonSafe converts BigInt and Dates and drops undefined", () => {
    const out = toJsonSafe({ a: BigInt(12), b: BigInt("9007199254740993"), c: new Date("2026-01-02T03:04:05.000Z"), d: undefined, e: [BigInt(1)] }) as Record<string, unknown>;
    expect(out).toEqual({ a: 12, b: "9007199254740993", c: "2026-01-02T03:04:05.000Z", e: [1] });
    expect(exportFilename(new Date("2026-09-23T10:00:00Z"))).toBe("my-data-2026-09-23.json");
  });
});

describe("GET /api/me/export", () => {
  it("401 when signed out; otherwise a JSON attachment of the caller's own data with a profile.exported audit row", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(null);
    expect((await exportRoute()).status).toBe(401);

    vi.mocked(getCurrentUser).mockResolvedValue({ id: alice.id, email: alice.email, name: "Alice Export", country: "Malaysia", emailVerified: false, roles: [] });
    const res = await exportRoute();
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/json");
    expect(res.headers.get("content-disposition")).toMatch(/^attachment; filename="my-data-\d{4}-\d{2}-\d{2}\.json"$/);
    expect(res.headers.get("cache-control")).toBe("no-store");
    const body = (await res.json()) as { account: { email: string }; profile: { idNumberMasked: string } };
    expect(body.account.email).toBe(alice.email);
    expect(body.profile.idNumberMasked).toBe("••••1111");
    expect(JSON.stringify(body)).not.toContain(alice.nric);

    const audit = (await listAuditForEntity(prisma, "user", alice.id)).filter((a) => a.action === "profile.exported");
    expect(audit).toHaveLength(1);
    expect(audit[0]!.actorUserId).toBe(alice.id);

    // A second download is a second audit row.
    await exportRoute();
    expect((await listAuditForEntity(prisma, "user", alice.id)).filter((a) => a.action === "profile.exported")).toHaveLength(2);
  });
});
