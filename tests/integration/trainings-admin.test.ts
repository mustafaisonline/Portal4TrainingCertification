import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { disconnectPrisma, getPrisma, withTransaction } from "@/db/prisma";
import { listDomains } from "@/modules/catalogue/domains/repository";
import { createOffering } from "@/modules/catalogue/offerings/repository";
import {
  canManageTraining,
  createTraining,
  getTrainingForAdmin,
  listTrainings,
  parseMajorToMinor,
  removeTrainingFee,
  replaceTrainingFormats,
  replaceTrainingModules,
  saveTrainingFee,
  setTrainingStatus,
  slugify,
  TrainingRefusedError,
  TrainingValidationError,
  updateTrainingContent,
  updateTrainingDetails,
  type TrainingDetailsInput,
  type TrainingScope,
} from "@/modules/catalogue/programmes/admin.repository";
import { findFlagshipProgramme, findProgrammeBySlug, findPublishedProgrammeBySlug, listPublishedProgrammesWithPrices } from "@/modules/catalogue/programmes/repository";
import { priceForUser } from "@/modules/commerce/pricing";
import { grantTrainer, revokeTrainer, RoleChangeRefusedError } from "@/modules/identity/admin-users.repository";
import { grantRole } from "@/modules/identity/roles.repository";
import { listAuditForEntity } from "@/modules/platform/audit/repository";
import { uniqueEmail } from "../helpers/identity-db";

/*
 * Trainings managed in the portal (M12 WP2) against the REAL test database:
 * the full launch sequence through the repository — create a draft → details
 * → sections → curriculum → pace formats → the four fee rows → publish — with
 * the audit row each step writes; the Trainer scope (L7); the slug lock
 * (published address immutable); a format in use cannot be removed; and
 * decision L8: re-running the seed leaves a portal edit untouched.
 */

const prisma = getPrisma();
const run = randomUUID().slice(0, 8);
const ALL: TrainingScope = { kind: "all" };

let admin: { id: string; email: string };
let trainerUser: { id: string; email: string };
let trainerExpertId: string;
let otherExpertId: string;
let domainId: string;
let createdId = "";
let createdSlug = "";
const createdOfferingIds: string[] = [];

function details(over: Partial<TrainingDetailsInput> = {}): TrainingDetailsInput {
  return {
    title: `Test Training ${run}`,
    subtitle: "A subtitle",
    slug: "",
    domainId,
    level: "practitioner",
    flagship: false,
    durationLabel: "2 days",
    prerequisites: "None",
    formats: ["Live online"],
    certificateLabel: "Certificate of Completion",
    audienceSummary: "People who test",
    summary: "A summary of the test training.",
    valueProposition: "Learn to test.",
    sortOrder: 99,
    ...over,
  };
}

beforeAll(async () => {
  domainId = (await listDomains())[0]!.id;
  const a = await prisma.user.create({ data: { email: uniqueEmail("m12-admin"), name: "Ada Admin", country: "Malaysia" }, select: { id: true, email: true } });
  admin = a;
  await withTransaction((tx) => grantRole(tx, { userId: a.id, role: "platform_admin", grantedByUserId: null, reason: "test" }));
  const t = await prisma.user.create({ data: { email: uniqueEmail("m12-trainer"), name: "Tina Trainer", country: "Malaysia" }, select: { id: true, email: true } });
  trainerUser = t;
  await withTransaction((tx) => grantRole(tx, { userId: t.id, role: "expert", grantedByUserId: a.id, reason: "test" }));
  const expertData = { roleTitle: "Trainer", location: "KL", headline: "h", experienceLine: "e", summary: "s", photoPath: "/x.png", expertise: [], profile: {}, published: false };
  trainerExpertId = (await prisma.expert.create({ data: { slug: `m12-trainer-${run}`, name: "Tina Trainer", userId: t.id, ...expertData }, select: { id: true } })).id;
  otherExpertId = (await prisma.expert.create({ data: { slug: `m12-other-${run}`, name: "Otto Other", ...expertData }, select: { id: true } })).id;
});

afterAll(async () => {
  if (createdOfferingIds.length) {
    await prisma.auditLog.deleteMany({ where: { entityType: "offering", entityId: { in: createdOfferingIds } } });
    await prisma.scheduledOffering.deleteMany({ where: { id: { in: createdOfferingIds } } });
  }
  if (createdId) {
    await prisma.auditLog.deleteMany({ where: { entityType: "programme", entityId: createdId } });
    await prisma.programme.deleteMany({ where: { id: createdId } });
  }
  await prisma.programme.deleteMany({ where: { slug: { startsWith: `test-training-${run}` } } });
  await prisma.expert.deleteMany({ where: { id: { in: [trainerExpertId, otherExpertId] } } });
  for (const u of [admin, trainerUser]) {
    await prisma.auditLog.deleteMany({ where: { OR: [{ actorUserId: u.id }, { entityType: "user", entityId: u.id }] } });
    await prisma.userRole.deleteMany({ where: { userId: u.id } });
    await prisma.user.deleteMany({ where: { id: u.id } });
  }
  await disconnectPrisma();
});

describe("slugs and money", () => {
  it("slugify follows the catalogue's addresses", () => {
    expect(slugify("Data Blueprint & AI/Vibe Coding")).toBe("data-blueprint-and-ai-vibe-coding");
    expect(slugify("  Learn   Vibe Coding! ")).toBe("learn-vibe-coding");
    expect(slugify("Café Déjà Vu")).toBe("cafe-deja-vu");
  });
  it("parseMajorToMinor reads what people type", () => {
    expect(parseMajorToMinor("5,000")).toBe(500000n);
    expect(parseMajorToMinor("5000.00")).toBe(500000n);
    expect(parseMajorToMinor("12.5")).toBe(1250n);
    expect(parseMajorToMinor("0")).toBe(0n);
    expect(parseMajorToMinor("12.345")).toBeNull();
    expect(parseMajorToMinor("RM 5,000")).toBeNull();
    expect(parseMajorToMinor("")).toBeNull();
  });
});

describe("the launch sequence through the repository", () => {
  it("a Trainer creates a DRAFT; the slug is generated; they are linked as lead expert; audit row written", async () => {
    const created = await withTransaction((tx) => createTraining(tx, details(), { userId: trainerUser.id, expertId: trainerExpertId }));
    createdId = created.id;
    createdSlug = created.slug;
    expect(created.slug).toBe(`test-training-${run}`);
    const row = await findProgrammeBySlug(created.slug);
    expect(row?.status).toBe("unlisted");
    expect(row?.experts.map((e) => e.id)).toEqual([trainerExpertId]);
    expect(await findPublishedProgrammeBySlug(created.slug)).toBeNull();
    const audit = await listAuditForEntity(prisma, "programme", created.id);
    expect(audit.map((a) => a.action)).toEqual(["programme.created"]);
    expect(audit[0]!.actorUserId).toBe(trainerUser.id);
  });

  it("validation names every missing field and never creates a row", async () => {
    await expect(
      withTransaction((tx) => createTraining(tx, details({ title: "", subtitle: "", durationLabel: "", formats: [], domainId: "nope" }), { userId: admin.id, expertId: null })),
    ).rejects.toSatisfy((e: unknown) => e instanceof TrainingValidationError && ["domainId", "durationLabel", "formats", "subtitle", "title"].every((f) => f in e.fieldErrors));
    await expect(withTransaction((tx) => createTraining(tx, details({ slug: createdSlug }), { userId: admin.id, expertId: null }))).rejects.toSatisfy(
      (e: unknown) => e instanceof TrainingValidationError && /already uses/.test(e.fieldErrors.slug ?? ""),
    );
  });

  it("scope: the Trainer sees and manages their training; another trainer's scope cannot see it; admin sees all", async () => {
    const mine: TrainingScope = { kind: "expert", expertId: trainerExpertId };
    const theirs: TrainingScope = { kind: "expert", expertId: otherExpertId };
    expect((await listTrainings(mine)).map((t) => t.id)).toEqual([createdId]);
    expect((await listTrainings(theirs)).map((t) => t.id)).toEqual([]);
    expect((await listTrainings(ALL)).some((t) => t.id === createdId)).toBe(true);
    expect(await canManageTraining(prisma, mine, createdId)).toBe(true);
    expect(await canManageTraining(prisma, theirs, createdId)).toBe(false);
    expect(await getTrainingForAdmin(createdId, theirs)).toBeNull();
    await expect(withTransaction((tx) => updateTrainingDetails(tx, createdId, theirs, details({ subtitle: "hijack" }), trainerUser.id))).rejects.toSatisfy(
      (e: unknown) => e instanceof TrainingRefusedError && e.code === "not_found",
    );
  });

  it("details: an unchanged save writes no audit row; a change does", async () => {
    const before = (await listAuditForEntity(prisma, "programme", createdId)).length;
    await withTransaction((tx) => updateTrainingDetails(tx, createdId, ALL, details(), admin.id));
    expect((await listAuditForEntity(prisma, "programme", createdId)).length).toBe(before);
    await withTransaction((tx) => updateTrainingDetails(tx, createdId, ALL, details({ subtitle: "Edited subtitle" }), admin.id));
    const audit = await listAuditForEntity(prisma, "programme", createdId);
    expect(audit.length).toBe(before + 1);
    expect(audit.at(-1)!.action).toBe("programme.updated");
    expect((await findProgrammeBySlug(createdSlug))!.subtitle).toBe("Edited subtitle");
  });

  it("sections, curriculum (with a group) and pace formats are saved and read back by the public repository", async () => {
    await withTransaction((tx) =>
      updateTrainingContent(
        tx,
        createdId,
        { kind: "expert", expertId: trainerExpertId },
        { highlights: ["H1"], whoShouldAttend: { intro: "Intro", roles: ["R1"] }, rationale: { heading: "Why", paragraphs: ["P"] }, related: [], faq: [{ q: "Q?", a: "A." }] },
        trainerUser.id,
      ),
    );
    await withTransaction((tx) =>
      replaceTrainingModules(tx, createdId, ALL, [
        { title: "Module 1", description: "", pointsText: "a\n## Group\n> about\nb" },
        { title: "Module 2", description: "d2", pointsText: "" },
      ], admin.id),
    );
    await withTransaction((tx) =>
      replaceTrainingFormats(tx, createdId, ALL, [
        { name: "Bootcamp", badge: "Most popular", durationLabel: "2 days", scheduleLabel: "8h/day", totalTimeLabel: "16h", bestForText: "Teams\nIndividuals" },
        { name: "Accelerator", badge: "", durationLabel: "4 weeks", scheduleLabel: "2 evenings", totalTimeLabel: "16h", bestForText: "" },
      ], admin.id),
    );
    const row = (await findProgrammeBySlug(createdSlug))!;
    expect(row.content.faq).toEqual([{ q: "Q?", a: "A." }]);
    expect(row.modules.map((m) => m.title)).toEqual(["Module 1", "Module 2"]);
    expect(row.modules[0]!.points).toEqual(["a", { title: "Group", description: "about", points: ["b"] }]);
    expect(row.modules[1]!.points).toBeNull();
    expect(row.deliveryFormats.map((f) => [f.code, f.name, f.badge, f.bestFor])).toEqual([
      ["bootcamp", "Bootcamp", "Most popular", ["Teams", "Individuals"]],
      ["accelerator", "Accelerator", null, []],
    ]);
    // Shrinking the curriculum removes the stale position.
    await withTransaction((tx) => replaceTrainingModules(tx, createdId, ALL, [{ title: "Only", description: "", pointsText: "x" }], admin.id));
    expect((await findProgrammeBySlug(createdSlug))!.modules.map((m) => m.title)).toEqual(["Only"]);
    const actions = (await listAuditForEntity(prisma, "programme", createdId)).map((a) => a.action);
    expect(actions).toEqual(expect.arrayContaining(["programme.content_updated", "programme.modules_updated", "programme.formats_updated"]));
  });

  it("a curriculum row with a bad group line is refused with a per-row error", async () => {
    await expect(withTransaction((tx) => replaceTrainingModules(tx, createdId, ALL, [{ title: "", description: "", pointsText: "> orphan" }], admin.id))).rejects.toSatisfy(
      (e: unknown) => e instanceof TrainingValidationError && "0" in e.fieldErrors,
    );
  });

  it("the four fee rows: saved with minor units, minimum and note; offer > list refused; a Malaysian is charged the not-via-HRD-Corp row", async () => {
    const fee = (region: "malaysia_hrdcorp" | "malaysia" | "pakistan" | "international", list: string, offer: string, extra: Partial<Record<string, string>> = {}) => ({
      region, currency: "", listAmount: list, offerAmount: offer, offerLabel: "50% OFF", offerName: "", minParticipants: "", note: "", validFrom: "", validTo: "", ...extra,
    });
    await withTransaction((tx) => saveTrainingFee(tx, createdId, ALL, { ...fee("malaysia_hrdcorp", "5,000", "5,000", { currency: "myr", offerLabel: "Full fee", minParticipants: "25", note: "In-person only." }) }, admin.id));
    await withTransaction((tx) => saveTrainingFee(tx, createdId, ALL, { ...fee("malaysia", "5,000", "2,500", { currency: "MYR", minParticipants: "25" }) }, admin.id));
    await withTransaction((tx) => saveTrainingFee(tx, createdId, ALL, { ...fee("pakistan", "200000", "100000", { currency: "PKR", offerLabel: "50% OFF" }) }, admin.id));
    await withTransaction((tx) => saveTrainingFee(tx, createdId, ALL, { ...fee("international", "4000", "1000", { currency: "USD", offerLabel: "75% OFF", validFrom: "2026-10-01", validTo: "2026-12-31" }) }, admin.id));
    const row = (await getTrainingForAdmin(createdId, ALL))!;
    expect(row.feeRows.map((r) => [r.region, r.currency, r.listAmountMinor, r.offerAmountMinor, r.minParticipants, r.note])).toEqual([
      ["malaysia_hrdcorp", "MYR", 500000, 500000, 25, "In-person only."],
      ["malaysia", "MYR", 500000, 250000, 25, null],
      ["pakistan", "PKR", 20000000, 10000000, null, null],
      ["international", "USD", 400000, 100000, null, null],
    ]);
    expect(row.feeRows[3]!.validFrom?.toISOString().slice(0, 10)).toBe("2026-10-01");
    expect(row.feeRows[1]!.offerName).toBe("Card payment in RM"); // defaulted from the region
    expect(priceForUser(row, { country: "Malaysia" })).toMatchObject({ region: "malaysia", offerAmountMinor: 250000 });
    await expect(withTransaction((tx) => saveTrainingFee(tx, createdId, ALL, fee("malaysia", "100", "200"), admin.id))).rejects.toSatisfy(
      (e: unknown) => e instanceof TrainingValidationError && /cannot be higher/.test(e.fieldErrors.offerAmount ?? ""),
    );
    await expect(withTransaction((tx) => saveTrainingFee(tx, createdId, ALL, fee("malaysia", "abc", "1", { currency: "M" }), admin.id))).rejects.toSatisfy(
      (e: unknown) => e instanceof TrainingValidationError && "listAmount" in e.fieldErrors && "currency" in e.fieldErrors,
    );
    // Removing and re-adding a row is audited both ways.
    expect(await withTransaction((tx) => removeTrainingFee(tx, createdId, ALL, "pakistan", admin.id))).toBe(true);
    expect(await withTransaction((tx) => removeTrainingFee(tx, createdId, ALL, "pakistan", admin.id))).toBe(false);
    expect((await getTrainingForAdmin(createdId, ALL))!.feeRows.map((r) => r.region)).toEqual(["malaysia_hrdcorp", "malaysia", "international"]);
    await withTransaction((tx) => saveTrainingFee(tx, createdId, ALL, fee("pakistan", "200000", "100000", { currency: "PKR" }), admin.id));
    const actions = (await listAuditForEntity(prisma, "programme", createdId)).map((a) => a.action);
    expect(actions.filter((a) => a === "programme.fee_updated").length).toBe(5);
    expect(actions.filter((a) => a === "programme.fee_removed").length).toBe(1);
  });

  it("publish: the training appears publicly with its four rows; the address is then locked; unpublish hides it again", async () => {
    await withTransaction((tx) => setTrainingStatus(tx, createdId, "published", admin.id));
    const pub = await findPublishedProgrammeBySlug(createdSlug);
    expect(pub?.status).toBe("published");
    expect(pub?.prices.map((p) => p.region)).toEqual(["malaysia_hrdcorp", "malaysia", "pakistan", "international"]);
    expect((await listPublishedProgrammesWithPrices()).some((p) => p.slug === createdSlug)).toBe(true);
    await expect(withTransaction((tx) => updateTrainingDetails(tx, createdId, ALL, details({ slug: `${createdSlug}-moved`, subtitle: "Edited subtitle" }), admin.id))).rejects.toSatisfy(
      (e: unknown) => e instanceof TrainingRefusedError && e.code === "slug_locked",
    );
    await withTransaction((tx) => setTrainingStatus(tx, createdId, "unlisted", admin.id));
    expect(await findPublishedProgrammeBySlug(createdSlug)).toBeNull();
    const statusChanges = (await listAuditForEntity(prisma, "programme", createdId)).filter((a) => a.action === "programme.status_changed");
    expect(statusChanges.map((a) => (a.after as { status: string }).status)).toEqual(["published", "unlisted"]);
  });

  it("a pace format that a date is scheduled under cannot be removed", async () => {
    const training = (await getTrainingForAdmin(createdId, ALL))!;
    const bootcamp = training.deliveryFormats.find((f) => f.code === "bootcamp")!;
    const offering = await withTransaction((tx) =>
      createOffering(tx, { programmeId: createdId, deliveryFormatId: bootcamp.id, modality: "live_online", location: null, timezone: "Asia/Kuala_Lumpur", startsOn: "2030-01-10", endsOn: "2030-01-11", capacity: 10, status: "planned", scheduleNote: `m12-${run}`, leadExpertId: null }, admin.id),
    );
    createdOfferingIds.push(offering.id);
    await expect(withTransaction((tx) => replaceTrainingFormats(tx, createdId, ALL, [{ name: "Accelerator", badge: "", durationLabel: "4 weeks", scheduleLabel: "2 evenings", totalTimeLabel: "16h", bestForText: "" }], admin.id))).rejects.toSatisfy(
      (e: unknown) => e instanceof TrainingRefusedError && e.code === "format_in_use",
    );
    expect((await getTrainingForAdmin(createdId, ALL))!.deliveryFormats.map((f) => f.code)).toEqual(["bootcamp", "accelerator"]);
  });

  it("flagship is exclusive: making this training the flagship un-flags the previous one", async () => {
    const previous = (await findFlagshipProgramme())!;
    await withTransaction((tx) => updateTrainingDetails(tx, createdId, ALL, details({ flagship: true, subtitle: "Edited subtitle" }), admin.id));
    expect((await findProgrammeBySlug(previous.slug))!.flagship).toBe(false);
    // Restore.
    await withTransaction((tx) => updateTrainingDetails(tx, createdId, ALL, details({ flagship: false, subtitle: "Edited subtitle" }), admin.id));
    await prisma.programme.update({ where: { id: previous.id }, data: { flagship: true } });
    expect((await findFlagshipProgramme())!.slug).toBe(previous.slug);
  });
});

describe("decision L8 — the seed is an initial import, the portal is the truth", () => {
  it("re-running the programme seed leaves a portal edit in place", async () => {
    // Called in-process (the seed exports its functions and guards main()):
    // with every training already present it inserts nothing and touches
    // nothing — which is exactly the policy.
    const { seedDomains, seedProgrammes } = await import("../../prisma/seed");
    const flagship = (await findFlagshipProgramme())!;
    const originalSubtitle = flagship.subtitle;
    const edited = `${originalSubtitle} — edited in the portal ${run}`;
    await prisma.programme.update({ where: { id: flagship.id }, data: { subtitle: edited } });
    try {
      const domainIds = await seedDomains();
      const ids = await seedProgrammes(domainIds);
      expect(ids.get(flagship.slug)).toBe(flagship.id);
      expect((await findProgrammeBySlug(flagship.slug))!.subtitle).toBe(edited);
    } finally {
      await prisma.programme.update({ where: { id: flagship.id }, data: { subtitle: originalSubtitle } });
    }
  });
});

describe("the Trainer role (WP3; decisions L1, L10)", () => {
  let person: { id: string; email: string };
  afterAll(async () => {
    if (!person) return;
    await prisma.expert.deleteMany({ where: { userId: person.id } });
    await prisma.auditLog.deleteMany({ where: { OR: [{ actorUserId: person.id }, { entityType: "user", entityId: person.id }] } });
    await prisma.userRole.deleteMany({ where: { userId: person.id } });
    await prisma.user.deleteMany({ where: { id: person.id } });
  });

  it("granting Trainer grants the `expert` role AND creates an unpublished Trainer profile linked to the account; a second grant is a no-op", async () => {
    person = await prisma.user.create({ data: { email: uniqueEmail("m12-person"), name: `Péter Trainer ${run}`, country: "Malaysia" }, select: { id: true, email: true } });
    const first = await withTransaction((tx) => grantTrainer(tx, person.id, admin.id));
    expect(first).toEqual({ granted: true, profileCreated: true });
    const profile = await prisma.expert.findFirst({ where: { userId: person.id } });
    expect(profile).toMatchObject({ name: `Péter Trainer ${run}`, roleTitle: "Trainer", published: false, slug: `peter-trainer-${run}` });
    expect(await prisma.userRole.count({ where: { userId: person.id, role: "expert", scopeType: "platform", revokedAt: null } })).toBe(1);
    const again = await withTransaction((tx) => grantTrainer(tx, person.id, admin.id));
    expect(again).toEqual({ granted: false, profileCreated: false });
    expect(await prisma.expert.count({ where: { userId: person.id } })).toBe(1);
    const audit = await listAuditForEntity(prisma, "user", person.id);
    expect(audit.filter((a) => a.action === "role.granted")).toHaveLength(1);
    expect((audit[0]!.after as { role: string }).role).toBe("expert");
  });

  it("a Trainer's scope is the trainings linked to their profile — nothing else", async () => {
    const profile = (await prisma.expert.findFirst({ where: { userId: person.id }, select: { id: true } }))!;
    const scope: TrainingScope = { kind: "expert", expertId: profile.id };
    expect(await listTrainings(scope)).toEqual([]);
    await prisma.programmeExpert.create({ data: { programmeId: createdId, expertId: profile.id, role: "lead" } });
    expect((await listTrainings(scope)).map((t) => t.id)).toEqual([createdId]);
    expect(await canManageTraining(prisma, scope, createdId)).toBe(true);
    const flagship = (await findFlagshipProgramme())!;
    expect(await canManageTraining(prisma, scope, flagship.id)).toBe(false);
    await prisma.programmeExpert.delete({ where: { programmeId_expertId: { programmeId: createdId, expertId: profile.id } } });
  });

  it("revoking Trainer keeps the profile; revoking a non-trainer is refused", async () => {
    expect(await withTransaction((tx) => revokeTrainer(tx, person.id, admin.id))).toBe(true);
    expect(await prisma.userRole.count({ where: { userId: person.id, role: "expert", revokedAt: null } })).toBe(0);
    expect(await prisma.expert.count({ where: { userId: person.id } })).toBe(1);
    await expect(withTransaction((tx) => revokeTrainer(tx, person.id, admin.id))).rejects.toSatisfy((e: unknown) => e instanceof RoleChangeRefusedError && e.code === "not_trainer");
  });
});
