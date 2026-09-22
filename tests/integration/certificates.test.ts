import { randomInt } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { disconnectPrisma, getPrisma, withTransaction } from "@/db/prisma";
import { ID_ALPHABET, LISTING_CONSENT_KEY, LISTING_CONSENT_VERSION } from "@/modules/certificates/constants";
import { addDays, addMonths, todayIso } from "@/modules/certificates/dates";
import { createFeeSetting, currentFeeSetting, listFeeHistory } from "@/modules/certificates/fee.repository";
import { listRoster, recordCompletion } from "@/modules/certificates/issuance.service";
import {
  CertificateNotFoundError,
  CertificateStateError,
  CertificateValidationError,
  correctHolderName,
  countCertificates,
  findByCertificateId,
  findByRegistrationId,
  getCertificateForAdmin,
  listCertificatesForAdmin,
  listCertificatesForUser,
  PUBLIC_VIEW_KEYS,
  revokeCertificate,
  searchListedByName,
  setListed,
  toPublicView,
} from "@/modules/certificates/repository";
import { publicCertificateById, searchCertificates } from "@/modules/certificates/search.service";
import { listAuditForEntity } from "@/modules/platform/audit/repository";
import {
  createAdminUser,
  createCertificateUser,
  createEndedOfferingFixture,
  createPaidRegistrationFixture,
  deleteTestOffering,
  flagshipProgramme,
  issueTestCertificate,
  setCertificateExpiry,
} from "../helpers/certificates-db";
import { deleteTestUser } from "../helpers/identity-db";

/*
 * Certificates — integration against the REAL test database (M6 plan §6
 * criteria 2, 7, 8, 10, 11). Every fixture is created here and removed in
 * afterAll through the shared helpers, so the suite leaves no rows behind.
 */

const prisma = getPrisma();
const emails: string[] = [];
const offerings: string[] = [];
let admin: { id: string; email: string };

async function user(opts: Parameters<typeof createCertificateUser>[0] = {}) {
  const u = await createCertificateUser(opts);
  emails.push(u.email);
  return u;
}

async function issued(opts: Omit<Parameters<typeof issueTestCertificate>[0], "adminUserId"> & { legalName?: string } = {}) {
  const u = opts.userId ? null : await user({ legalName: opts.legalName ?? "Certificate Person" });
  const fixture = await issueTestCertificate({ ...opts, adminUserId: admin.id, userId: opts.userId ?? u!.id });
  offerings.push(fixture.offeringId);
  return fixture;
}

beforeAll(async () => {
  admin = await createAdminUser();
  emails.push(admin.email);
});

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "info").mockImplementation(() => {});
});

afterAll(async () => {
  // Fee rows this suite created (future-dated only) — renewals never reference them.
  await prisma.auditLog.deleteMany({ where: { entityType: "certificate_fee_setting", actorUserId: admin.id } });
  await prisma.certificateFeeSetting.deleteMany({ where: { createdByUserId: admin.id } });
  for (const email of emails) await deleteTestUser(email);
  for (const id of offerings) await deleteTestOffering(id);
  await prisma.outboundEmail.deleteMany({ where: { templateKey: { startsWith: "certificate." }, toEmail: { endsWith: "@example.test" } } });
  await disconnectPrisma();
});

/* ================================================================ issuance */

describe("recordCompletion — the gate to issuance (E2, plan §5)", () => {
  it("refuses before the offering has ended, and the roster says why", async () => {
    const u = await user();
    const offering = await createEndedOfferingFixture({ endsOnDaysAgo: -1 }); // ends tomorrow
    offerings.push(offering.id);
    const { registrationId } = await createPaidRegistrationFixture(u.id, offering.id);
    await expect(recordCompletion({ registrationId, completedOn: offering.startsOn, adminUserId: admin.id })).rejects.toMatchObject({ code: "offering_not_ended" });
    const roster = await listRoster(offering.id);
    expect(roster?.ended).toBe(false);
    expect(roster?.entries[0]).toMatchObject({ registrationId, canRecord: false, reason: "offering_not_ended", legalName: "Certificate Person" });
    expect(await findByRegistrationId(registrationId)).toBeNull();
  });

  it("refuses on the offering's last day itself (ended = the day after ends_on)", async () => {
    const u = await user();
    const offering = await createEndedOfferingFixture({ endsOnDaysAgo: 0 });
    offerings.push(offering.id);
    const { registrationId } = await createPaidRegistrationFixture(u.id, offering.id);
    await expect(recordCompletion({ registrationId, completedOn: offering.endsOn, adminUserId: admin.id })).rejects.toMatchObject({ code: "offering_not_ended" });
  });

  it("refuses a cancelled registration", async () => {
    const u = await user();
    const offering = await createEndedOfferingFixture({ endsOnDaysAgo: 3 });
    offerings.push(offering.id);
    const { registrationId } = await createPaidRegistrationFixture(u.id, offering.id, "cancelled");
    await expect(recordCompletion({ registrationId, completedOn: offering.endsOn, adminUserId: admin.id })).rejects.toMatchObject({ code: "registration_not_confirmed" });
    expect((await listRoster(offering.id))?.entries[0]).toMatchObject({ canRecord: false, reason: "registration_not_confirmed" });
  });

  it("refuses when the participant has no legal name on their profile", async () => {
    const u = await user({ legalName: null });
    const offering = await createEndedOfferingFixture({ endsOnDaysAgo: 3 });
    offerings.push(offering.id);
    const { registrationId } = await createPaidRegistrationFixture(u.id, offering.id);
    await expect(recordCompletion({ registrationId, completedOn: offering.endsOn, adminUserId: admin.id })).rejects.toMatchObject({ code: "profile_incomplete" });
    expect((await listRoster(offering.id))?.entries[0]).toMatchObject({ canRecord: false, reason: "profile_incomplete", legalName: null });
  });

  it("refuses a completion date before the first day, after today, or malformed", async () => {
    const u = await user();
    const offering = await createEndedOfferingFixture({ endsOnDaysAgo: 3 });
    offerings.push(offering.id);
    const { registrationId } = await createPaidRegistrationFixture(u.id, offering.id);
    const today = todayIso(new Date());
    for (const completedOn of [addDays(offering.startsOn, -1), addDays(today, 1), "2026-13-01", "yesterday"]) {
      await expect(recordCompletion({ registrationId, completedOn, adminUserId: admin.id })).rejects.toMatchObject({ code: "completed_on_out_of_range" });
    }
    expect(await findByRegistrationId(registrationId)).toBeNull();
  });

  it("an unknown registration is refused with a stable code", async () => {
    await expect(recordCompletion({ registrationId: "not-a-uuid", completedOn: "2026-01-01", adminUserId: admin.id })).rejects.toMatchObject({ code: "registration_not_found" });
    await expect(recordCompletion({ registrationId: "00000000-0000-4000-8000-000000000000", completedOn: "2026-01-01", adminUserId: admin.id })).rejects.toBeInstanceOf(CertificateStateError);
  });

  it("issues once: snapshots, dates, audit, email; the second call returns the same certificate with no second audit or email", async () => {
    const flagship = await flagshipProgramme();
    const u = await user({ legalName: "Nurul Izzah binti Ahmad" });
    const offering = await createEndedOfferingFixture({ endsOnDaysAgo: 5 });
    offerings.push(offering.id);
    const { registrationId } = await createPaidRegistrationFixture(u.id, offering.id);
    expect((await listRoster(offering.id))?.entries[0]).toMatchObject({ canRecord: true, reason: null });

    const now = new Date();
    const today = todayIso(now);
    const first = await recordCompletion({ registrationId, completedOn: offering.endsOn, adminUserId: admin.id, now });
    expect(first.created).toBe(true);
    const c = first.certificate;
    expect(c.certificateId).toMatch(new RegExp(`^DAA-${today.slice(0, 4)}-[${ID_ALPHABET}]{4}-[${ID_ALPHABET}]{4}$`));
    expect(c).toMatchObject({
      registrationId,
      userId: u.id,
      offeringId: offering.id,
      programmeId: flagship.id,
      holderName: "Nurul Izzah binti Ahmad",
      holderNameSearch: "nurul izzah binti ahmad",
      programmeTitle: flagship.title,
      formatName: flagship.deliveryFormats[0]!.name,
      completedOn: offering.endsOn,
      issuedOn: today,
      expiresOn: addMonths(today, 12),
      listed: false,
      revokedAt: null,
      issuedByUserId: admin.id,
    });

    const audit = await listAuditForEntity(prisma, "certificate", c.id);
    expect(audit.map((a) => a.action)).toEqual(["certificate.issued"]);
    expect(audit[0]!.actorUserId).toBe(admin.id);
    expect(audit[0]!.after).toMatchObject({ certificateId: c.certificateId, registrationId, issuedOn: today, expiresOn: c.expiresOn });
    expect(JSON.stringify(audit[0]!.after)).not.toContain(u.email);

    const email = await prisma.outboundEmail.findFirst({ where: { toEmail: u.email, templateKey: "certificate.issued" } });
    expect(email).not.toBeNull();
    expect(email!.textBody).toContain(c.certificateId);
    expect(email!.textBody).toContain(`${process.env.APP_BASE_URL}/verify/${c.certificateId}`);
    expect(email!.textBody).toContain(flagship.title);

    const second = await recordCompletion({ registrationId, completedOn: offering.startsOn, adminUserId: admin.id });
    expect(second.created).toBe(false);
    expect(second.certificate.id).toBe(c.id);
    expect(second.certificate.certificateId).toBe(c.certificateId);
    expect((await listAuditForEntity(prisma, "certificate", c.id)).map((a) => a.action)).toEqual(["certificate.issued"]);
    expect(await prisma.outboundEmail.count({ where: { toEmail: u.email, templateKey: "certificate.issued" } })).toBe(1);
    expect(await prisma.certificate.count({ where: { registrationId } })).toBe(1);

    const roster = await listRoster(offering.id);
    expect(roster?.entries[0]).toMatchObject({ canRecord: false, reason: "already_issued" });
    expect(roster?.entries[0]?.certificate?.id).toBe(c.id);
    expect((await listCertificatesForUser(u.id)).map((x) => x.id)).toEqual([c.id]);
  });

  it("draws a new ID when the generated one collides (unique-violation retry inside the transaction)", async () => {
    const base = randomInt(ID_ALPHABET.length);
    const next = (base + 1) % ID_ALPHABET.length;
    const a = await user();
    const offeringA = await createEndedOfferingFixture({ endsOnDaysAgo: 3 });
    offerings.push(offeringA.id);
    const regA = await createPaidRegistrationFixture(a.id, offeringA.id);
    const first = await recordCompletion({ registrationId: regA.registrationId, completedOn: offeringA.endsOn, adminUserId: admin.id, random: () => base });
    const sym = ID_ALPHABET[base]!.repeat(4);
    expect(first.certificate.certificateId.endsWith(`-${sym}-${sym}`)).toBe(true);

    // The second issue draws the SAME symbols for its first attempt, then different ones.
    let draws = 0;
    const colliding = () => (draws++ < 8 ? base : next);
    const b = await user();
    const offeringB = await createEndedOfferingFixture({ endsOnDaysAgo: 3 });
    offerings.push(offeringB.id);
    const regB = await createPaidRegistrationFixture(b.id, offeringB.id);
    const second = await recordCompletion({ registrationId: regB.registrationId, completedOn: offeringB.endsOn, adminUserId: admin.id, random: colliding });
    const sym2 = ID_ALPHABET[next]!.repeat(4);
    expect(second.created).toBe(true);
    expect(second.certificate.certificateId.endsWith(`-${sym2}-${sym2}`)).toBe(true);
    expect(draws).toBe(16);
    // The certificate, its audit row and nothing else survived the retry.
    expect((await listAuditForEntity(prisma, "certificate", second.certificate.id)).map((x) => x.action)).toEqual(["certificate.issued"]);
  });

  it("gives up after five collisions without leaving a row behind", async () => {
    const base = randomInt(ID_ALPHABET.length);
    const a = await issued();
    await prisma.certificate.update({ where: { id: a.certificate.id }, data: { certificateId: `DAA-${todayIso(new Date()).slice(0, 4)}-${ID_ALPHABET[base]!.repeat(4)}-${ID_ALPHABET[base]!.repeat(4)}` } });
    const b = await user();
    const offering = await createEndedOfferingFixture({ endsOnDaysAgo: 3 });
    offerings.push(offering.id);
    const { registrationId } = await createPaidRegistrationFixture(b.id, offering.id);
    await expect(recordCompletion({ registrationId, completedOn: offering.endsOn, adminUserId: admin.id, random: () => base })).rejects.toMatchObject({ code: "id_generation_failed" });
    expect(await findByRegistrationId(registrationId)).toBeNull();
  });
});

/* ================================================================= listing */

describe("listing consent (E3)", () => {
  it("turning listing on writes a consent row and an audit row; off is immediate; the owner check holds", async () => {
    const { certificate, userId } = await issued();
    const stranger = await user();
    await expect(withTransaction((tx) => setListed(tx, certificate.id, stranger.id, true))).rejects.toBeInstanceOf(CertificateNotFoundError);

    const on = await withTransaction((tx) => setListed(tx, certificate.id, userId, true));
    expect(on.listed).toBe(true);
    expect(on.listedChangedAt).not.toBeNull();
    const consents = await prisma.consent.findMany({ where: { userId, documentKey: LISTING_CONSENT_KEY } });
    expect(consents).toHaveLength(1);
    expect(consents[0]!.documentVersion).toBe(LISTING_CONSENT_VERSION);

    // Same value again: nothing written.
    await withTransaction((tx) => setListed(tx, certificate.id, userId, true));
    expect((await listAuditForEntity(prisma, "certificate", certificate.id)).map((a) => a.action)).toEqual(["certificate.issued", "certificate.listing_changed"]);

    expect((await searchListedByName(["certificate", "person"])).items.map((c) => c.id)).toContain(certificate.id);
    const off = await withTransaction((tx) => setListed(tx, certificate.id, userId, false));
    expect(off.listed).toBe(false);
    expect((await searchListedByName(["certificate", "person"])).items.map((c) => c.id)).not.toContain(certificate.id);
    const audit = await listAuditForEntity(prisma, "certificate", certificate.id);
    expect(audit.map((a) => a.action)).toEqual(["certificate.issued", "certificate.listing_changed", "certificate.listing_changed"]);
    expect(audit[2]!.before).toEqual({ listed: true });
    expect(audit[2]!.after).toEqual({ listed: false });
    expect(await prisma.consent.count({ where: { userId, documentKey: LISTING_CONSENT_KEY } })).toBe(1);
  });
});

/* ================================================================== search */

describe("public search (§5; plan §6 criteria 7, 8)", () => {
  let ayse: Awaited<ReturnType<typeof issued>>;
  let ayesha: Awaited<ReturnType<typeof issued>>;
  let unlisted: Awaited<ReturnType<typeof issued>>;
  let revoked: Awaited<ReturnType<typeof issued>>;

  beforeAll(async () => {
    ayse = await issued({ legalName: "Ayşe Núñez-Ortega", listed: true });
    ayesha = await issued({ legalName: "Ayesha Khan", listed: true });
    await issued({ legalName: "Ahmad bin Abdullah", listed: true });
    unlisted = await issued({ legalName: "Ayesha Unlistedperson" });
    revoked = await issued({ legalName: "Ayesha Revokedperson", listed: true });
    await withTransaction((tx) => revokeCertificate(tx, revoked.certificate.id, admin.id, "Issued in error"));
  });

  it("matches word prefixes, case- accent- and word-order-insensitively; never mid-word", async () => {
    const ids = async (words: string[]) => (await searchListedByName(words)).items.map((c) => c.id);
    expect(await ids(["ay"])).toEqual(expect.arrayContaining([ayse.certificate.id, ayesha.certificate.id]));
    expect(await ids(["NUNEZ"])).toEqual([ayse.certificate.id]);
    expect(await ids(["núñez"])).toEqual([ayse.certificate.id]);
    expect(await ids(["ortega", "nunez"])).toEqual([ayse.certificate.id]);
    expect(await ids(["ort", "ay"])).toEqual([ayse.certificate.id]);
    expect(await ids(["yse"])).toEqual([]);
    expect(await ids(["rtega"])).toEqual([]);
    expect(await ids(["khan", "ortega"])).toEqual([]);
  });

  it("an unlisted holder and a revoked holder are invisible by name, found by ID", async () => {
    expect((await searchListedByName(["unlistedperson"])).items).toEqual([]);
    expect((await searchListedByName(["ayesha", "unlisted"])).items).toEqual([]);
    expect((await searchListedByName(["revokedperson"])).items).toEqual([]);
    expect((await findByCertificateId(unlisted.certificate.certificateId))?.id).toBe(unlisted.certificate.id);
    expect((await findByCertificateId(revoked.certificate.certificateId))?.id).toBe(revoked.certificate.id);
    // Any typed form of the ID.
    expect((await findByCertificateId(unlisted.certificate.certificateId.toLowerCase().replace(/-/g, " ")))?.id).toBe(unlisted.certificate.id);
    expect(await findByCertificateId("DAA-2026-0000-0000")).toBeNull();
    expect(await findByCertificateId("Ayesha")).toBeNull();
  });

  it("caps at 10 and says so", async () => {
    for (let i = 0; i < 11; i += 1) await issued({ legalName: `Capfamily Member${i}`, listed: true });
    const r = await searchListedByName(["capfamily"]);
    expect(r.items).toHaveLength(10);
    expect(r.truncated).toBe(true);
    expect(r.items.map((c) => c.holderName)).toEqual([...r.items.map((c) => c.holderName)].sort((a, b) => a.localeCompare(b)));
    const exact = await searchListedByName(["capfamily", "member1"]);
    expect(exact.truncated).toBe(false);
    expect(exact.items.map((c) => c.holderName).sort()).toEqual(["Capfamily Member1", "Capfamily Member10"]);
  });

  it("the public view carries exactly the allowed fields", async () => {
    const view = toPublicView(unlisted.certificate, todayIso(new Date()));
    expect(Object.keys(view).sort()).toEqual([...PUBLIC_VIEW_KEYS].sort());
    expect(view).toMatchObject({ certificateId: unlisted.certificate.certificateId, holderName: "Ayesha Unlistedperson", revoked: false, status: "active" });
    const json = JSON.stringify(view);
    for (const forbidden of ["@example.test", unlisted.userId, unlisted.certificate.id, unlisted.registrationId, "userId", "email"]) expect(json).not.toContain(forbidden);
    expect(toPublicView(revoked.certificate, todayIso(new Date()))).toMatchObject({ revoked: false });
    const revokedNow = await findByCertificateId(revoked.certificate.certificateId);
    expect(toPublicView(revokedNow!, todayIso(new Date()))).toMatchObject({ revoked: true, status: "revoked" });
  });

  it("the search service routes by input shape and returns public views only", async () => {
    expect(await searchCertificates("")).toEqual({ kind: "empty" });
    expect(await searchCertificates("ay")).toEqual({ kind: "too_short" });
    const byId = await searchCertificates(unlisted.certificate.certificateId.toLowerCase());
    expect(byId).toMatchObject({ kind: "id", id: unlisted.certificate.certificateId });
    expect(byId.kind === "id" && Object.keys(byId.result!).sort()).toEqual([...PUBLIC_VIEW_KEYS].sort());
    const unknown = await searchCertificates("DAA-2026-0000-0000");
    expect(unknown).toEqual({ kind: "id", id: "DAA-2026-0000-0000", result: null });
    const byName = await searchCertificates("Núñez");
    expect(byName.kind === "name" && byName.results.map((r) => r.certificateId)).toEqual([ayse.certificate.certificateId]);
    expect(await publicCertificateById("nope")).toBeNull();
    expect((await publicCertificateById(revoked.certificate.certificateId))?.status).toBe("revoked");
  });
});

/* =================================================================== admin */

describe("administration (E8; plan §5 'Admin')", () => {
  it("revocation: reason required, audited, permanent; a second revocation is refused", async () => {
    const { certificate } = await issued();
    await expect(withTransaction((tx) => revokeCertificate(tx, certificate.id, admin.id, "no"))).rejects.toBeInstanceOf(CertificateValidationError);
    await expect(withTransaction((tx) => revokeCertificate(tx, certificate.id, admin.id, "x".repeat(501)))).rejects.toBeInstanceOf(CertificateValidationError);
    const now = new Date();
    const r = await withTransaction((tx) => revokeCertificate(tx, certificate.id, admin.id, "  Duplicate   registration ", now));
    expect(r.revokedAt?.getTime()).toBe(now.getTime());
    expect(r.revokedByUserId).toBe(admin.id);
    expect(r.revocationReason).toBe("Duplicate registration");
    const audit = await listAuditForEntity(prisma, "certificate", certificate.id);
    expect(audit.map((a) => a.action)).toEqual(["certificate.issued", "certificate.revoked"]);
    expect(audit[1]!.reason).toBe("Duplicate registration");
    await expect(withTransaction((tx) => revokeCertificate(tx, certificate.id, admin.id, "Again"))).rejects.toMatchObject({ code: "already_revoked" });
    await expect(withTransaction((tx) => revokeCertificate(tx, "00000000-0000-4000-8000-000000000000", admin.id, "Nobody"))).rejects.toBeInstanceOf(CertificateNotFoundError);
    expect((await getCertificateForAdmin(certificate.id))?.status).toBe("revoked");
  });

  it("name correction keeps the ID, updates the search column and audits before/after", async () => {
    const { certificate } = await issued({ legalName: "Wrong Name", listed: true });
    await expect(withTransaction((tx) => correctHolderName(tx, certificate.id, admin.id, "A"))).rejects.toBeInstanceOf(CertificateValidationError);
    const same = await withTransaction((tx) => correctHolderName(tx, certificate.id, admin.id, "Wrong  Name"));
    expect(same.holderName).toBe("Wrong Name");
    const fixed = await withTransaction((tx) => correctHolderName(tx, certificate.id, admin.id, "  Zélie  Correctedname "));
    expect(fixed.certificateId).toBe(certificate.certificateId);
    expect(fixed.holderName).toBe("Zélie Correctedname");
    expect(fixed.holderNameSearch).toBe("zelie correctedname");
    const audit = await listAuditForEntity(prisma, "certificate", certificate.id);
    expect(audit.map((a) => a.action)).toEqual(["certificate.issued", "certificate.name_corrected"]);
    expect(audit[1]!.before).toEqual({ holderName: "Wrong Name" });
    expect(audit[1]!.after).toEqual({ holderName: "Zélie Correctedname" });
    expect((await searchListedByName(["zelie"])).items.map((c) => c.id)).toEqual([certificate.id]);
    expect((await searchListedByName(["wrong"])).items.map((c) => c.id)).not.toContain(certificate.id);
  });

  it("the admin list filters by ID / name / email and by computed status", async () => {
    const holder = await user({ legalName: "Filterable Holder" });
    const active = await issued({ userId: holder.id });
    const due = await issued({ legalName: "Filterable Due", expiresOnIso: addDays(todayIso(new Date()), 10) });
    const expired = await issued({ legalName: "Filterable Expired", expiresOnIso: addDays(todayIso(new Date()), -1) });
    const revokedOne = await issued({ legalName: "Filterable Revoked" });
    await withTransaction((tx) => revokeCertificate(tx, revokedOne.certificate.id, admin.id, "Test revocation"));

    const byId = await listCertificatesForAdmin({ q: active.certificate.certificateId.toLowerCase() });
    expect(byId.items.map((i) => i.id)).toEqual([active.certificate.id]);
    expect(byId.items[0]).toMatchObject({ userEmail: holder.email, status: "active" });
    expect(byId.total).toBe(1);

    const byEmail = await listCertificatesForAdmin({ q: holder.email.toUpperCase() });
    expect(byEmail.items.map((i) => i.id)).toEqual([active.certificate.id]);

    const byName = await listCertificatesForAdmin({ q: "filterable" });
    expect(byName.items.map((i) => i.id).sort()).toEqual([active.certificate.id, due.certificate.id, expired.certificate.id, revokedOne.certificate.id].sort());

    const ids = async (status: "active" | "renewal_due" | "expired" | "revoked") => (await listCertificatesForAdmin({ q: "filterable", status })).items.map((i) => i.id);
    expect(await ids("active")).toEqual([active.certificate.id]);
    expect(await ids("renewal_due")).toEqual([due.certificate.id]);
    expect(await ids("expired")).toEqual([expired.certificate.id]);
    expect(await ids("revoked")).toEqual([revokedOne.certificate.id]);
    expect((await listCertificatesForAdmin({ q: "filterable", status: "renewal_due" })).items[0]).toMatchObject({ status: "renewal_due", days: 10 });

    const paged = await listCertificatesForAdmin({ q: "filterable", pageSize: 3, page: 2 });
    expect(paged.total).toBe(4);
    expect(paged.pageCount).toBe(2);
    expect(paged.items).toHaveLength(1);
    expect(await countCertificates()).toBeGreaterThanOrEqual(4);
    // The 30-day boundary agrees with statusOf.
    await setCertificateExpiry(active.certificate.id, addDays(todayIso(new Date()), 31));
    expect(await ids("active")).toEqual([active.certificate.id]);
    await setCertificateExpiry(active.certificate.id, addDays(todayIso(new Date()), 30));
    expect((await ids("renewal_due")).sort()).toEqual([active.certificate.id, due.certificate.id].sort());
  });
});

/* ===================================================================== fee */

describe("renewal fee setting (E4; plan §6 criterion 6)", () => {
  it("a change effective tomorrow leaves today's fee unchanged; history is newest first; audited against the fee in force", async () => {
    const before = await currentFeeSetting();
    expect(before).not.toBeNull();
    const tomorrow = new Date(Date.now() + 24 * 3600_000);
    const created = await withTransaction((tx) => createFeeSetting(tx, { amountMinor: 1500, currency: "usd", effectiveFrom: tomorrow, note: " Trial increase " }, admin.id));
    expect(created).toMatchObject({ amountMinor: 1500, currency: "USD", createdByUserId: admin.id, note: "Trial increase" });
    expect(created.effectiveFrom.getTime()).toBe(tomorrow.getTime());

    const now = await currentFeeSetting();
    expect(now!.id).toBe(before!.id);
    expect(now!.amountMinor).toBe(before!.amountMinor);
    expect((await currentFeeSetting(new Date(tomorrow.getTime() + 1000)))!.id).toBe(created.id);

    const history = await listFeeHistory();
    expect(history[0]!.id).toBe(created.id);
    expect(history.map((h) => h.id)).toContain(before!.id);
    expect(history.every((h, i) => i === 0 || history[i - 1]!.effectiveFrom.getTime() >= h.effectiveFrom.getTime())).toBe(true);

    const audit = await listAuditForEntity(prisma, "certificate_fee_setting", created.id);
    expect(audit.map((a) => a.action)).toEqual(["certificate_fee.changed"]);
    expect(audit[0]!.before).toMatchObject({ feeSettingId: before!.id, amountMinor: before!.amountMinor });
    expect(audit[0]!.after).toMatchObject({ amountMinor: 1500, currency: "USD" });
  });

  it("validates amount, currency and effective time", async () => {
    const future = new Date(Date.now() + 3600_000);
    const attempt = (input: Parameters<typeof createFeeSetting>[1]) => withTransaction((tx) => createFeeSetting(tx, input, admin.id));
    await expect(attempt({ amountMinor: 0, currency: "USD", effectiveFrom: future })).rejects.toMatchObject({ fieldErrors: { amountMinor: expect.any(String) } });
    await expect(attempt({ amountMinor: 100_001, currency: "USD", effectiveFrom: future })).rejects.toMatchObject({ fieldErrors: { amountMinor: expect.any(String) } });
    await expect(attempt({ amountMinor: 10.5, currency: "USD", effectiveFrom: future })).rejects.toBeInstanceOf(CertificateValidationError);
    await expect(attempt({ amountMinor: 1000, currency: "US", effectiveFrom: future })).rejects.toMatchObject({ fieldErrors: { currency: expect.any(String) } });
    await expect(attempt({ amountMinor: 1000, currency: "USD", effectiveFrom: new Date(Date.now() - 120_000) })).rejects.toMatchObject({ fieldErrors: { effectiveFrom: expect.any(String) } });
    await expect(attempt({ amountMinor: 1000, currency: "USD", effectiveFrom: new Date("nope") })).rejects.toMatchObject({ fieldErrors: { effectiveFrom: expect.any(String) } });
    await expect(attempt({ amountMinor: 1000, currency: "USD", effectiveFrom: future, note: "n".repeat(501) })).rejects.toMatchObject({ fieldErrors: { note: expect.any(String) } });
  });
});
