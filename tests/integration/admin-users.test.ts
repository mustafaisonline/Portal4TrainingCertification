import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { disconnectPrisma, getPrisma, withTransaction } from "@/db/prisma";
import {
  countActivePlatformAdmins,
  getUserForAdmin,
  grantPlatformAdmin,
  listUsersForAdmin,
  revokePlatformAdmin,
  RoleChangeRefusedError,
} from "@/modules/identity/admin-users.repository";
import { activeRolesForUser, grantRole, holdsRole } from "@/modules/identity/roles.repository";
import { listAuditForEntity } from "@/modules/platform/audit/repository";
import { createEndedOfferingFixture, createPaidRegistrationFixture, deleteTestOffering, issueTestCertificate } from "../helpers/certificates-db";
import { completeProfile, deleteTestUser, uniqueEmail } from "../helpers/identity-db";

/*
 * Users & roles administration — integration against the REAL test database
 * (MILESTONE_8_EXECUTION_PLAN.md §2 item 4; §4 criterion 2). Grant and
 * revoke write the role row and the audit row together; the two refusals
 * (self, last administrator) leave nothing behind; a re-grant re-activates
 * the SAME row (unique key); the list searches and counts; the detail
 * carries the masked ID number and never the clear one.
 */

const prisma = getPrisma();
const emails: string[] = [];
const offerings: string[] = [];
const run = randomUUID().slice(0, 8);

async function createUser(name: string, prefix = "m8u") {
  const email = uniqueEmail(prefix);
  emails.push(email);
  return prisma.user.create({ data: { email, name, country: "Malaysia" }, select: { id: true, email: true, name: true } });
}

async function createAdmin(name = "Admin Actor") {
  const user = await createUser(name, "m8u-admin");
  await withTransaction((tx) => grantRole(tx, { userId: user.id, role: "platform_admin", grantedByUserId: null, reason: "test" }));
  return user;
}

afterAll(async () => {
  for (const id of offerings) await deleteTestOffering(id);
  for (const e of emails) await deleteTestUser(e);
  await disconnectPrisma();
});

const ROLLBACK = new Error("rollback");

describe("grantPlatformAdmin / revokePlatformAdmin", () => {
  it("grants then revokes, writing the role row and the audit row together with the actor recorded", async () => {
    const actor = await createAdmin();
    const target = await createUser("Tara Target");

    expect(await withTransaction((tx) => grantPlatformAdmin(tx, target.id, actor.id))).toBe(true);
    expect(holdsRole(await activeRolesForUser(target.id), "platform_admin")).toBe(true);
    // Granting again is a no-op (no second audit row).
    expect(await withTransaction((tx) => grantPlatformAdmin(tx, target.id, actor.id))).toBe(false);

    const row = await prisma.userRole.findFirstOrThrow({ where: { userId: target.id, role: "platform_admin" } });
    expect(row.grantedByUserId).toBe(actor.id);
    expect(row.revokedAt).toBeNull();

    expect(await withTransaction((tx) => revokePlatformAdmin(tx, target.id, actor.id))).toBe(true);
    expect(holdsRole(await activeRolesForUser(target.id), "platform_admin")).toBe(false);
    const revoked = await prisma.userRole.findUniqueOrThrow({ where: { id: row.id } });
    expect(revoked.revokedAt).not.toBeNull();
    expect(revoked.revokedByUserId).toBe(actor.id);

    const audit = await listAuditForEntity(prisma, "user", target.id);
    const granted = audit.filter((a) => a.action === "role.granted");
    const revokedRows = audit.filter((a) => a.action === "role.revoked");
    expect(granted).toHaveLength(1);
    expect(revokedRows).toHaveLength(1);
    expect(granted[0]!.actorUserId).toBe(actor.id);
    expect(granted[0]!.after).toMatchObject({ role: "platform_admin", scopeType: "platform" });
    expect(revokedRows[0]!.actorUserId).toBe(actor.id);
    expect(revokedRows[0]!.before).toMatchObject({ role: "platform_admin", scopeType: "platform" });

    // The detail shows the history with the actor's email resolved.
    const detail = await getUserForAdmin(target.id);
    expect(detail!.isPlatformAdmin).toBe(false);
    expect(detail!.roleHistory.map((h) => h.action)).toEqual(["role.revoked", "role.granted"]);
    expect(detail!.roleHistory[0]!.actorEmail).toBe(actor.email);
    const adminRow = detail!.roles.find((r) => r.role === "platform_admin")!;
    expect(adminRow.active).toBe(false);
    expect(adminRow.grantedByEmail).toBe(actor.email);
    expect(adminRow.revokedByEmail).toBe(actor.email);
  });

  it("refuses a self-revocation and writes nothing", async () => {
    const actor = await createAdmin("Solo Self");
    const other = await createAdmin("Other Admin"); // so the last-admin rule is not what refuses
    expect(other.id).not.toBe(actor.id);
    await expect(withTransaction((tx) => revokePlatformAdmin(tx, actor.id, actor.id))).rejects.toMatchObject({ code: "self_revoke" });
    expect(holdsRole(await activeRolesForUser(actor.id), "platform_admin")).toBe(true);
    const audit = await listAuditForEntity(prisma, "user", actor.id);
    expect(audit.filter((a) => a.action === "role.revoked")).toHaveLength(0);
  });

  it("refuses to revoke the last remaining administrator", async () => {
    const actor = await createUser("Non Admin Actor");
    const target = await createAdmin("Last Admin");
    // Other test data may hold administrators. Inside ONE transaction, set
    // every other administrator aside, exercise the rule, then roll back so
    // nothing outside this test changes.
    let code: string | null = null;
    let countSeen = -1;
    await expect(
      prisma.$transaction(async (tx) => {
        await tx.userRole.updateMany({
          where: { role: "platform_admin", scopeType: "platform", revokedAt: null, userId: { not: target.id } },
          data: { revokedAt: new Date() },
        });
        countSeen = await countActivePlatformAdmins(tx);
        try {
          await revokePlatformAdmin(tx, target.id, actor.id);
        } catch (err) {
          if (err instanceof RoleChangeRefusedError) code = err.code;
          else throw err;
        }
        throw ROLLBACK;
      }),
    ).rejects.toBe(ROLLBACK);
    expect(countSeen).toBe(1);
    expect(code).toBe("last_admin");
    expect(holdsRole(await activeRolesForUser(target.id), "platform_admin")).toBe(true);
  });

  it("refuses to revoke someone who is not an administrator", async () => {
    const actor = await createAdmin();
    const target = await createUser("Plain Participant");
    await expect(withTransaction((tx) => revokePlatformAdmin(tx, target.id, actor.id))).rejects.toMatchObject({ code: "not_admin" });
  });

  it("a re-grant after revocation re-activates the SAME row", async () => {
    const actor = await createAdmin();
    const target = await createUser("Re Grant");
    await withTransaction((tx) => grantPlatformAdmin(tx, target.id, actor.id));
    const first = await prisma.userRole.findFirstOrThrow({ where: { userId: target.id, role: "platform_admin" } });
    await withTransaction((tx) => revokePlatformAdmin(tx, target.id, actor.id));

    const second = await createAdmin("Second Actor");
    expect(await withTransaction((tx) => grantPlatformAdmin(tx, target.id, second.id))).toBe(true);
    const rows = await prisma.userRole.findMany({ where: { userId: target.id, role: "platform_admin" } });
    expect(rows).toHaveLength(1);
    expect(rows[0]!.id).toBe(first.id);
    expect(rows[0]!.revokedAt).toBeNull();
    expect(rows[0]!.revokedByUserId).toBeNull();
    expect(rows[0]!.grantedByUserId).toBe(second.id);
    expect(rows[0]!.grantedAt.getTime()).toBeGreaterThan(first.grantedAt.getTime());
    expect((await listAuditForEntity(prisma, "user", target.id)).filter((a) => a.action === "role.granted")).toHaveLength(2);
  });

  it("refuses an unknown or malformed target", async () => {
    const actor = await createAdmin();
    await expect(withTransaction((tx) => grantPlatformAdmin(tx, randomUUID(), actor.id))).rejects.toMatchObject({ name: "AdminUserNotFoundError" });
    await expect(withTransaction((tx) => grantPlatformAdmin(tx, "not-a-uuid", actor.id))).rejects.toMatchObject({ name: "AdminUserNotFoundError" });
  });
});

describe("listUsersForAdmin", () => {
  it("searches name and email case-insensitively, filters by active role, and counts confirmed registrations and certificates", async () => {
    const admin = await createAdmin();
    const needle = `Zebulon${run}`;
    const person = await createUser(`${needle} Searchable`, `m8u-${run.toLowerCase()}`);
    await completeProfile(person.id, { legalName: `${needle} Searchable` });
    const offering = await createEndedOfferingFixture({ endsOnDaysAgo: 3 });
    offerings.push(offering.id);
    await createPaidRegistrationFixture(person.id, offering.id, "cancelled");
    const issued = await issueTestCertificate({ adminUserId: admin.id, userId: person.id });
    offerings.push(issued.offeringId);

    const byName = await listUsersForAdmin({ q: needle.toLowerCase() });
    expect(byName.items.map((u) => u.id)).toEqual([person.id]);
    expect(byName.total).toBe(1);
    const hit = byName.items[0]!;
    expect(hit.registrationCount).toBe(1); // the cancelled one is not counted
    expect(hit.certificateCount).toBe(1);
    expect(hit.roles.map((r) => r.role)).toEqual([]); // created directly: no participant row

    const byEmail = await listUsersForAdmin({ q: `M8U-${run}` });
    expect(byEmail.items.map((u) => u.id)).toContain(person.id);

    const admins = await listUsersForAdmin({ q: admin.email.toUpperCase(), role: "platform_admin" });
    expect(admins.items.map((u) => u.id)).toEqual([admin.id]);
    expect(admins.items[0]!.roles.map((r) => r.role)).toEqual(["platform_admin"]);

    const notAdmin = await listUsersForAdmin({ q: person.email, role: "platform_admin" });
    expect(notAdmin.items).toEqual([]);
    expect(notAdmin.total).toBe(0);

    // The page clamps to the last page rather than returning nothing.
    const clamped = await listUsersForAdmin({ q: person.email, page: 99 });
    expect(clamped.page).toBe(1);
    expect(clamped.items).toHaveLength(1);
  });
});

describe("getUserForAdmin", () => {
  it("returns identity facts, the MASKED profile summary and the person's rows; unknown or malformed id → null", async () => {
    const admin = await createAdmin();
    const person = await createUser("Masked Person");
    const NRIC = "880808085555";
    await completeProfile(person.id, { legalName: "Masked Person", idType: "nric", idNumber: NRIC, organisation: "Acme" });
    const issued = await issueTestCertificate({ adminUserId: admin.id, userId: person.id });
    offerings.push(issued.offeringId);
    await prisma.consent.create({ data: { userId: person.id, documentKey: "terms", documentVersion: `t-${run}` } });

    const detail = await getUserForAdmin(person.id);
    expect(detail).not.toBeNull();
    expect(detail!.email).toBe(person.email);
    expect(detail!.profile).toMatchObject({ legalName: "Masked Person", idType: "nric", idNumberMasked: "••••5555", organisation: "Acme" });
    expect(JSON.stringify(detail)).not.toContain(NRIC);
    expect(detail!.registrations).toHaveLength(1);
    expect(detail!.registrations[0]!.status).toBe("confirmed");
    expect(detail!.orders).toHaveLength(1);
    expect(detail!.orders[0]).toMatchObject({ kind: "registration", status: "paid", amountMinor: 499900, currency: "MYR" });
    expect(detail!.certificates.map((c) => c.certificateId)).toEqual([issued.certificate.certificateId]);
    expect(detail!.consents.map((c) => c.documentVersion)).toContain(`t-${run}`);
    expect(detail!.isPlatformAdmin).toBe(false);

    expect(await getUserForAdmin(randomUUID())).toBeNull();
    expect(await getUserForAdmin("nope")).toBeNull();
  });
});
