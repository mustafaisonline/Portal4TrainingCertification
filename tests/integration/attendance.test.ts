import { afterAll, describe, expect, it } from "vitest";
import { disconnectPrisma, getPrisma, withTransaction } from "@/db/prisma";
import { AttendanceError, getAttendanceSheet, listAttendanceOfferings, saveAttendance } from "@/modules/attendance/repository";
import { addDays } from "@/modules/certificates/dates";
import { listRoster, recordCompletion } from "@/modules/certificates/issuance.service";
import { listAuditForEntity } from "@/modules/platform/audit/repository";
import { certificateTodayIso, createAdminUser, createCertificateUser, createEndedOfferingFixture, createPaidRegistrationFixture, deleteTestOffering } from "../helpers/certificates-db";
import { completeProfile, deleteTestUser } from "../helpers/identity-db";

/*
 * Attendance — Milestone 13 WP4 against the REAL test database: the sheet
 * lists confirmed participants with the government-ID fields; a save upserts
 * one row per answered participant and audits each change; a resave with
 * the same answers changes nothing; rows of another offering are refused;
 * a Trainer's scope hides other trainers' dates; and (N6) completion is
 * refused while attendance says No, allowed when nothing was recorded.
 */

const prisma = getPrisma();
const offerings: string[] = [];
const users: string[] = [];

afterAll(async () => {
  for (const id of offerings) await deleteTestOffering(id);
  for (const email of users) await deleteTestUser(email);
  await disconnectPrisma();
});

async function participant(prefix: string, dob = "1990-05-06", country = "MY") {
  const u = await createCertificateUser({ prefix });
  users.push(u.email);
  await completeProfile(u.id, { legalName: u.name, dateOfBirth: dob, countryCode: country });
  return u;
}

describe("the sheet", () => {
  it("lists confirmed participants only, with legal name, email, date of birth and country; unrecorded rows are blank", async () => {
    const offering = await createEndedOfferingFixture({ endsOnDaysAgo: -2, status: "open" }); // running: starts 4 days ago? no — ends in 2 days
    offerings.push(offering.id);
    const a = await participant("m13-att-a", "1988-02-03", "MY");
    const b = await participant("m13-att-b", "1995-11-30", "PK");
    const c = await participant("m13-att-c");
    await createPaidRegistrationFixture(a.id, offering.id);
    await createPaidRegistrationFixture(b.id, offering.id);
    await createPaidRegistrationFixture(c.id, offering.id, "cancelled");

    const sheet = await getAttendanceSheet(offering.id, { kind: "all" });
    expect(sheet).not.toBeNull();
    expect(sheet!.rows.map((r) => r.user.email).sort()).toEqual([a.email, b.email].sort());
    const rowA = sheet!.rows.find((r) => r.user.email === a.email)!;
    expect(rowA.displayName).toBe(a.name);
    expect(rowA.dateOfBirth).toBe("1988-02-03");
    expect(rowA.country).toBe("Malaysia");
    expect(rowA.attended).toBeNull();
    expect(rowA.updatedAt).toBeNull();
    const rowB = sheet!.rows.find((r) => r.user.email === b.email)!;
    expect(rowB.country).toBe("Pakistan");

    // The list shows this date with 2 participants and 0 recorded.
    const listed = (await listAttendanceOfferings({ kind: "all" })).find((o) => o.offering.id === offering.id);
    expect(listed).toMatchObject({ confirmedCount: 2, recordedCount: 0, hasEnded: false });
  });

  it("saves Yes/No per row with who and when, audits each change, is idempotent, and refuses rows of another offering", async () => {
    const offering = await createEndedOfferingFixture({ endsOnDaysAgo: 0, status: "open" });
    const other = await createEndedOfferingFixture({ endsOnDaysAgo: 0, status: "open" });
    offerings.push(offering.id, other.id);
    const admin = await createAdminUser("m13-att-admin");
    users.push(admin.email);
    const a = await participant("m13-att-save-a");
    const b = await participant("m13-att-save-b");
    const elsewhere = await participant("m13-att-save-x");
    const regA = await createPaidRegistrationFixture(a.id, offering.id);
    const regB = await createPaidRegistrationFixture(b.id, offering.id);
    const regX = await createPaidRegistrationFixture(elsewhere.id, other.id);

    const first = await withTransaction((tx) =>
      saveAttendance(tx, {
        offeringId: offering.id,
        actorUserId: admin.id,
        scope: { kind: "all" },
        entries: [
          { registrationId: regA.registrationId, attended: true, note: null },
          { registrationId: regB.registrationId, attended: null, note: "left blank on purpose" }, // no answer → untouched
        ],
      }),
    );
    expect(first).toEqual({ answered: 1, changed: 1 });
    let sheet = (await getAttendanceSheet(offering.id, { kind: "all" }))!;
    const rowA = sheet.rows.find((r) => r.registrationId === regA.registrationId)!;
    expect(rowA.attended).toBe(true);
    expect(rowA.recordedBy?.name).toBeTruthy();
    expect(rowA.updatedAt).toBeInstanceOf(Date);
    expect(sheet.rows.find((r) => r.registrationId === regB.registrationId)!.attended).toBeNull();
    const firstUpdated = rowA.updatedAt!;

    // Same answers again: nothing changes, nothing is audited.
    const again = await withTransaction((tx) =>
      saveAttendance(tx, { offeringId: offering.id, actorUserId: admin.id, scope: { kind: "all" }, entries: [{ registrationId: regA.registrationId, attended: true, note: null }] }),
    );
    expect(again).toEqual({ answered: 1, changed: 0 });

    // Change A to No with a note, record B as Yes: two changes, two audit rows.
    const changed = await withTransaction((tx) =>
      saveAttendance(tx, {
        offeringId: offering.id,
        actorUserId: admin.id,
        scope: { kind: "all" },
        entries: [
          { registrationId: regA.registrationId, attended: false, note: "Did not arrive" },
          { registrationId: regB.registrationId, attended: true, note: null },
        ],
      }),
    );
    expect(changed).toEqual({ answered: 2, changed: 2 });
    sheet = (await getAttendanceSheet(offering.id, { kind: "all" }))!;
    const rowA2 = sheet.rows.find((r) => r.registrationId === regA.registrationId)!;
    expect(rowA2.attended).toBe(false);
    expect(rowA2.note).toBe("Did not arrive");
    expect(rowA2.updatedAt!.getTime()).toBeGreaterThanOrEqual(firstUpdated.getTime());
    const auditA = await listAuditForEntity(prisma, "registration", regA.registrationId);
    const attendanceAudit = auditA.filter((x) => x.action === "attendance.recorded");
    expect(attendanceAudit).toHaveLength(2);
    expect(attendanceAudit[0]!.before).toBeNull();
    expect(attendanceAudit[1]!.before).toMatchObject({ attended: true });
    expect(attendanceAudit[1]!.after).toMatchObject({ attended: false, note: "Did not arrive" });
    expect((await listAttendanceOfferings({ kind: "all" })).find((o) => o.offering.id === offering.id)).toMatchObject({ confirmedCount: 2, recordedCount: 2 });

    // A row of ANOTHER offering is refused and nothing is written.
    await expect(
      withTransaction((tx) =>
        saveAttendance(tx, { offeringId: offering.id, actorUserId: admin.id, scope: { kind: "all" }, entries: [{ registrationId: regX.registrationId, attended: true, note: null }] }),
      ),
    ).rejects.toBeInstanceOf(AttendanceError);
    expect(await prisma.attendanceRecord.count({ where: { registrationId: regX.registrationId } })).toBe(0);
  });

  it("a Trainer's scope hides another trainer's dates (sheet null, save refused) and shows their own", async () => {
    const offering = await createEndedOfferingFixture({ endsOnDaysAgo: 0, status: "open" });
    offerings.push(offering.id);
    const admin = await createAdminUser("m13-att-scope-admin");
    users.push(admin.email);
    const p = await participant("m13-att-scope-p");
    const reg = await createPaidRegistrationFixture(p.id, offering.id);
    // A Trainer profile linked to NO training: the date is out of scope.
    const expert = await prisma.expert.create({
      data: {
        name: "Scoped Trainer",
        slug: `m13-scope-${reg.registrationId.slice(0, 8)}`,
        roleTitle: "Trainer",
        location: "Kuala Lumpur",
        headline: "t",
        experienceLine: "t",
        summary: "t",
        photoPath: "",
        expertise: [],
        profile: {},
        published: false,
      },
    });
    try {
      expect(await getAttendanceSheet(offering.id, { kind: "expert", expertId: expert.id })).toBeNull();
      expect((await listAttendanceOfferings({ kind: "expert", expertId: expert.id })).map((o) => o.offering.id)).not.toContain(offering.id);
      await expect(
        withTransaction((tx) =>
          saveAttendance(tx, { offeringId: offering.id, actorUserId: admin.id, scope: { kind: "expert", expertId: expert.id }, entries: [{ registrationId: reg.registrationId, attended: true, note: null }] }),
        ),
      ).rejects.toMatchObject({ reason: "offering_not_found" });
      // Linked to the training → in scope.
      const programmeId = (await prisma.scheduledOffering.findUniqueOrThrow({ where: { id: offering.id }, select: { programmeId: true } })).programmeId;
      await prisma.programmeExpert.create({ data: { programmeId, expertId: expert.id, role: "lead" } });
      expect((await getAttendanceSheet(offering.id, { kind: "expert", expertId: expert.id }))?.rows).toHaveLength(1);
      await prisma.programmeExpert.deleteMany({ where: { expertId: expert.id } });
    } finally {
      await prisma.expert.delete({ where: { id: expert.id } });
    }
  });
});

describe("attendance and completion (N6)", () => {
  it("completion is refused while attendance is No, allowed when nothing was recorded, and the roster says why", async () => {
    const offering = await createEndedOfferingFixture({ endsOnDaysAgo: 3 });
    offerings.push(offering.id);
    const admin = await createAdminUser("m13-att-n6-admin");
    users.push(admin.email);
    const absent = await participant("m13-att-n6-absent");
    const unrecorded = await participant("m13-att-n6-unrecorded");
    const regAbsent = await createPaidRegistrationFixture(absent.id, offering.id);
    const regUnrecorded = await createPaidRegistrationFixture(unrecorded.id, offering.id);
    await withTransaction((tx) =>
      saveAttendance(tx, { offeringId: offering.id, actorUserId: admin.id, scope: { kind: "all" }, entries: [{ registrationId: regAbsent.registrationId, attended: false, note: null }] }),
    );

    const roster = (await listRoster(offering.id))!;
    const rowAbsent = roster.entries.find((e) => e.registrationId === regAbsent.registrationId)!;
    expect(rowAbsent).toMatchObject({ canRecord: false, reason: "not_attended", attended: false });
    const rowUnrecorded = roster.entries.find((e) => e.registrationId === regUnrecorded.registrationId)!;
    expect(rowUnrecorded).toMatchObject({ canRecord: true, reason: null, attended: null });

    const completedOn = addDays(certificateTodayIso(), -3);
    await expect(recordCompletion({ registrationId: regAbsent.registrationId, completedOn, adminUserId: admin.id })).rejects.toMatchObject({ code: "not_attended" });
    expect(await prisma.certificate.count({ where: { registrationId: regAbsent.registrationId } })).toBe(0);
    const issued = await recordCompletion({ registrationId: regUnrecorded.registrationId, completedOn, adminUserId: admin.id });
    expect(issued.created).toBe(true);

    // Attendance corrected to Yes → completion now allowed.
    await withTransaction((tx) =>
      saveAttendance(tx, { offeringId: offering.id, actorUserId: admin.id, scope: { kind: "all" }, entries: [{ registrationId: regAbsent.registrationId, attended: true, note: "corrected" }] }),
    );
    const afterFix = await recordCompletion({ registrationId: regAbsent.registrationId, completedOn, adminUserId: admin.id });
    expect(afterFix.created).toBe(true);
    expect(afterFix.certificate).toBeTruthy();
  });
});
