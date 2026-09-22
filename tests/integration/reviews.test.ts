import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { disconnectPrisma, getPrisma, withTransaction } from "@/db/prisma";
import { findFlagshipProgramme } from "@/modules/catalogue/programmes/repository";
import type { ProgrammeRecord } from "@/modules/catalogue/programmes/types";
import { savePhoto } from "@/modules/identity/profile.repository";
import { listAuditForEntity } from "@/modules/platform/audit/repository";
import {
  findReviewableRegistration,
  listReviewableRegistrations,
  ownReviewStatus,
  registrationReviewStatus,
  reviewRequirementForRegistration,
} from "@/modules/reviews/eligibility";
import {
  countPendingReviews,
  createReview,
  editWindowOpen,
  getPublicReviewPhoto,
  getReviewForAdmin,
  hideReview,
  listPublicReviews,
  listReviewsForAdmin,
  moderateReview,
  restoreReview,
  ReviewConsentError,
  ReviewEditWindowError,
  ReviewNotFoundError,
  updateOwnReview,
} from "@/modules/reviews/repository";
import { validateReviewInput } from "@/modules/reviews/review-validation";
import { completeProfile, uniqueEmail } from "../helpers/identity-db";

/*
 * Reviews — integration against the REAL test database (requirements §11;
 * plan §4 criteria 3, 5, 6, 7). Users, offerings, paid orders and confirmed
 * registrations are created directly (as the commerce tests do); every row
 * is removed in afterAll.
 */

const prisma = getPrisma();
let flagship: ProgrammeRecord;
const createdUsers: string[] = [];
const createdOfferings: string[] = [];
const createdOrders: string[] = [];
const createdRegistrations: string[] = [];

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

async function createUser(name = "Review Person", displayName: string | null = null) {
  const user = await prisma.user.create({ data: { email: uniqueEmail("m5b"), name, country: "Malaysia" } });
  createdUsers.push(user.id);
  await completeProfile(user.id, { legalName: name, displayName });
  return user;
}

async function createOffering(endsInDays: number) {
  const row = await prisma.scheduledOffering.create({
    data: {
      programmeId: flagship.id,
      deliveryFormatId: flagship.deliveryFormats[0]?.id ?? null,
      modality: "live_online",
      timezone: "Asia/Kuala_Lumpur",
      startsOn: daysFromNow(endsInDays - 2),
      endsOn: daysFromNow(endsInDays),
      capacity: 10,
      status: endsInDays < 0 ? "completed" : "open",
    },
  });
  createdOfferings.push(row.id);
  return row;
}

/** A paid order + confirmed registration, written directly (the webhook path is covered by commerce.test.ts). */
async function createConfirmedRegistration(userId: string, offeringId: string, status: "confirmed" | "cancelled" = "confirmed") {
  const order = await prisma.order.create({
    data: {
      userId,
      offeringId,
      programmeId: flagship.id,
      status: "paid",
      region: "malaysia",
      currency: "MYR",
      amountMinor: BigInt(499900),
      expiresAt: new Date(Date.now() + 3600_000),
      paidAt: new Date(),
      stripeCheckoutSessionId: `cs_test_${randomUUID().slice(0, 12)}`,
    },
  });
  createdOrders.push(order.id);
  const reg = await prisma.registration.create({ data: { userId, offeringId, orderId: order.id, status } });
  createdRegistrations.push(reg.id);
  return reg;
}

const BODY = "The sessions were practical and the trainer answered every question with real examples.";

function input(overrides: Partial<{ body: string; rating: number | null; category: string | null; consentPublic: boolean; consentPhoto: boolean }> = {}) {
  const v = validateReviewInput({
    body: overrides.body ?? BODY,
    rating: overrides.rating ?? 5,
    category: overrides.category ?? "programme_experience",
    consentPublic: overrides.consentPublic ?? true,
    consentPhoto: overrides.consentPhoto ?? false,
  });
  if (!v.ok) throw new Error(JSON.stringify(v.fieldErrors));
  return v.value;
}

beforeAll(async () => {
  const p = await findFlagshipProgramme();
  if (!p) throw new Error("seeded flagship programme required");
  flagship = p;
});

afterAll(async () => {
  const reviewIds = (await prisma.review.findMany({ where: { userId: { in: createdUsers } }, select: { id: true } })).map((r) => r.id);
  await prisma.$transaction([
    prisma.review.deleteMany({ where: { id: { in: reviewIds } } }),
    prisma.registration.deleteMany({ where: { id: { in: createdRegistrations } } }),
    prisma.order.deleteMany({ where: { id: { in: createdOrders } } }),
    prisma.auditLog.deleteMany({ where: { entityId: { in: [...reviewIds, ...createdUsers] } } }),
    prisma.auditLog.deleteMany({ where: { actorUserId: { in: createdUsers } } }),
    prisma.consent.deleteMany({ where: { userId: { in: createdUsers } } }),
    prisma.userProfile.deleteMany({ where: { userId: { in: createdUsers } } }),
    prisma.scheduledOffering.deleteMany({ where: { id: { in: createdOfferings } } }),
    prisma.user.deleteMany({ where: { id: { in: createdUsers } } }),
  ]);
  await disconnectPrisma();
});

describe("eligibility — which registrations may be reviewed", () => {
  it("lists confirmed registrations on ended offerings with no review; not future, cancelled or reviewed ones", async () => {
    const user = await createUser();
    const past = await createOffering(-1);
    const future = await createOffering(10);
    const reviewable = await createConfirmedRegistration(user.id, past.id);
    await createConfirmedRegistration(user.id, future.id);
    const pastCancelled = await createOffering(-3);
    await createConfirmedRegistration(user.id, pastCancelled.id, "cancelled");

    const list = await listReviewableRegistrations(user.id);
    expect(list.map((r) => r.registrationId)).toEqual([reviewable.id]);
    expect(list[0]).toMatchObject({ programmeId: flagship.id, programmeTitle: flagship.title, offeringId: past.id });
    expect(await findReviewableRegistration(user.id, reviewable.id)).not.toBeNull();
    // Another person's registration is never reviewable from this account.
    const other = await createUser("Other Person");
    expect(await findReviewableRegistration(other.id, reviewable.id)).toBeNull();
    expect(await findReviewableRegistration(user.id, "not-a-uuid")).toBeNull();

    await withTransaction((tx) => createReview(tx, { ...input(), userId: user.id, kind: "registration", registrationId: reviewable.id, programmeId: flagship.id, offeringId: past.id }));
    expect(await listReviewableRegistrations(user.id)).toEqual([]);
  });

  it("an offering ending today is not yet reviewable; yesterday is", async () => {
    const user = await createUser();
    const today = await createOffering(0);
    await createConfirmedRegistration(user.id, today.id);
    expect(await listReviewableRegistrations(user.id)).toEqual([]);
    expect(registrationReviewStatus(null, today.endsOn)).toBe("not_yet");
    expect(registrationReviewStatus(null, daysFromNow(-1))).toBe("required");
  });
});

describe("createReview — snapshot, audit, one per registration", () => {
  it("snapshots the display name (falling back to legal name), starts pending, audits without the body", async () => {
    const user = await createUser("Legal Name", "Display Name");
    const off = await createOffering(-2);
    const reg = await createConfirmedRegistration(user.id, off.id);

    const { review, created } = await withTransaction((tx) =>
      createReview(tx, { ...input({ consentPublic: true, consentPhoto: true }), userId: user.id, kind: "registration", registrationId: reg.id, programmeId: flagship.id, offeringId: off.id }),
    );
    expect(created).toBe(true);
    expect(review).toMatchObject({
      displayNameSnapshot: "Display Name",
      moderationStatus: "pending",
      visibilityStatus: "visible",
      consentPublic: true,
      consentPhoto: true,
      rating: 5,
      category: "programme_experience",
      programmeTitle: flagship.title,
      kind: "registration",
    });
    expect(ownReviewStatus(review)).toBe("awaiting_review");
    expect(registrationReviewStatus(review, off.endsOn)).toBe("awaiting_review");

    const audit = await listAuditForEntity(prisma, "review", review.id);
    expect(audit.map((a) => a.action)).toEqual(["review.submitted"]);
    expect(audit[0]!.actorUserId).toBe(user.id);
    expect(JSON.stringify(audit[0]!.after)).not.toContain(BODY.slice(0, 20));
    expect(audit[0]!.after).toMatchObject({ moderationStatus: "pending", consentPublic: true, bodyLength: BODY.length });
  });

  it("falls back to the legal name, then users.name, when no display name is set", async () => {
    const user = await createUser("Only Legal");
    const off = await createOffering(-2);
    const reg = await createConfirmedRegistration(user.id, off.id);
    const { review } = await withTransaction((tx) => createReview(tx, { ...input(), userId: user.id, kind: "registration", registrationId: reg.id, programmeId: flagship.id, offeringId: off.id }));
    expect(review.displayNameSnapshot).toBe("Only Legal");

    const bare = await prisma.user.create({ data: { email: uniqueEmail("m5b-bare"), name: "Bare Identity" } });
    createdUsers.push(bare.id);
    const { review: diag } = await withTransaction((tx) => createReview(tx, { ...input(), userId: bare.id, kind: "diagnostic", registrationId: null, programmeId: flagship.id, offeringId: null }));
    expect(diag.displayNameSnapshot).toBe("Bare Identity");
    expect(diag.registrationId).toBeNull();
  });

  it("a second review for the same registration returns the existing row (no duplicate, no second audit)", async () => {
    const user = await createUser();
    const off = await createOffering(-2);
    const reg = await createConfirmedRegistration(user.id, off.id);
    const base = { userId: user.id, kind: "registration" as const, registrationId: reg.id, programmeId: flagship.id, offeringId: off.id };
    const first = await withTransaction((tx) => createReview(tx, { ...input(), ...base }));
    const second = await withTransaction((tx) => createReview(tx, { ...input({ body: "A completely different second attempt at the same registration." }), ...base }));
    expect(second.created).toBe(false);
    expect(second.review.id).toBe(first.review.id);
    expect(second.review.body).toBe(BODY);
    expect(await prisma.review.count({ where: { registrationId: reg.id } })).toBe(1);
    expect((await listAuditForEntity(prisma, "review", first.review.id)).length).toBe(1);
  });

  it("photo consent is never stored without public consent", async () => {
    const user = await createUser();
    const off = await createOffering(-2);
    const reg = await createConfirmedRegistration(user.id, off.id);
    const { review } = await withTransaction((tx) =>
      createReview(tx, { ...input({ consentPublic: false }), consentPhoto: true, userId: user.id, kind: "registration", registrationId: reg.id, programmeId: flagship.id, offeringId: off.id }),
    );
    expect(review.consentPublic).toBe(false);
    expect(review.consentPhoto).toBe(false);
    expect(ownReviewStatus(review)).toBe("private");
  });
});

describe("public query — publicWhere() only", () => {
  it("excludes pending, rejected, hidden and non-consented rows; includes approved + consented + visible, newest first", async () => {
    const admin = await createUser("Admin Person");
    const user = await createUser("Public Person");
    const make = async (consentPublic: boolean) => {
      const off = await createOffering(-2);
      const reg = await createConfirmedRegistration(user.id, off.id);
      const { review } = await withTransaction((tx) => createReview(tx, { ...input({ consentPublic }), userId: user.id, kind: "registration", registrationId: reg.id, programmeId: flagship.id, offeringId: off.id }));
      return review;
    };
    const pending = await make(true);
    const rejected = await make(true);
    await withTransaction((tx) => moderateReview(tx, rejected.id, admin.id, { status: "rejected", note: "off topic" }));
    const hidden = await make(true);
    await withTransaction((tx) => moderateReview(tx, hidden.id, admin.id, { status: "approved" }));
    await withTransaction((tx) => hideReview(tx, hidden.id, admin.id));
    const privateApproved = await make(false);
    await withTransaction((tx) => moderateReview(tx, privateApproved.id, admin.id, { status: "approved" }));
    const live = await make(true);
    await withTransaction((tx) => moderateReview(tx, live.id, admin.id, { status: "approved" }));

    const page = await listPublicReviews({ pageSize: 50 });
    const ids = page.items.map((i) => i.id);
    expect(ids).toContain(live.id);
    for (const excluded of [pending.id, rejected.id, hidden.id, privateApproved.id]) expect(ids).not.toContain(excluded);
    const card = page.items.find((i) => i.id === live.id)!;
    expect(card).toEqual({
      id: live.id,
      displayNameSnapshot: "Public Person",
      programmeTitle: flagship.title,
      rating: 5,
      body: BODY,
      submittedAt: live.submittedAt,
      consentPhoto: false,
      hasPhoto: false,
    });
    // Public-safe shape: nothing else leaks.
    expect(Object.keys(card).sort()).toEqual(["body", "consentPhoto", "displayNameSnapshot", "hasPhoto", "id", "programmeTitle", "rating", "submittedAt"]);
    // Newest first.
    const times = page.items.map((i) => i.submittedAt.getTime());
    expect([...times].sort((a, b) => b - a)).toEqual(times);
  });

  it("pages with hasMore", async () => {
    const p1 = await listPublicReviews({ page: 1, pageSize: 1 });
    if (p1.items.length === 1) {
      const p2 = await listPublicReviews({ page: 2, pageSize: 1 });
      expect(p1.items[0]!.id).not.toBe(p2.items[0]?.id);
    }
    expect(p1.pageSize).toBe(1);
  });
});

describe("moderation — approve, reject, hide, restore, with audit", () => {
  it("moves through the states and audits each with before/after status; restore refuses when consent is No", async () => {
    const admin = await createUser("Admin Two");
    const user = await createUser("Moderated Person");
    const off = await createOffering(-2);
    const reg = await createConfirmedRegistration(user.id, off.id);
    const { review } = await withTransaction((tx) => createReview(tx, { ...input(), userId: user.id, kind: "registration", registrationId: reg.id, programmeId: flagship.id, offeringId: off.id }));
    const before = await countPendingReviews();

    const approved = await withTransaction((tx) => moderateReview(tx, review.id, admin.id, { status: "approved" }));
    expect(approved).toMatchObject({ moderationStatus: "approved", moderatedByUserId: admin.id, moderationNote: null });
    expect(approved.moderatedAt).not.toBeNull();
    expect(await countPendingReviews()).toBe(before - 1);
    expect(ownReviewStatus(approved)).toBe("published");
    expect(registrationReviewStatus(approved, off.endsOn)).toBe("published");

    const hidden = await withTransaction((tx) => hideReview(tx, review.id, admin.id));
    expect(hidden.visibilityStatus).toBe("hidden");
    expect(ownReviewStatus(hidden)).toBe("not_published");
    expect(registrationReviewStatus(hidden, off.endsOn)).toBe("submitted");
    // Idempotent: hiding again writes no second audit row.
    await withTransaction((tx) => hideReview(tx, review.id, admin.id));

    const restored = await withTransaction((tx) => restoreReview(tx, review.id, admin.id));
    expect(restored.visibilityStatus).toBe("visible");

    const rejected = await withTransaction((tx) => moderateReview(tx, review.id, admin.id, { status: "rejected", note: "  Needs a rewrite  " }));
    expect(rejected).toMatchObject({ moderationStatus: "rejected", moderationNote: "Needs a rewrite" });

    const audit = await listAuditForEntity(prisma, "review", review.id);
    expect(audit.map((a) => a.action)).toEqual(["review.submitted", "review.moderated", "review.hidden", "review.restored", "review.moderated"]);
    expect(audit[1]).toMatchObject({ actorUserId: admin.id, before: { moderationStatus: "pending" }, after: { moderationStatus: "approved" } });
    expect(audit[2]).toMatchObject({ before: { visibilityStatus: "visible" }, after: { visibilityStatus: "hidden" } });
    expect(audit[3]).toMatchObject({ before: { visibilityStatus: "hidden" }, after: { visibilityStatus: "visible" } });
    expect(audit[4]).toMatchObject({ after: { moderationStatus: "rejected" }, reason: "Needs a rewrite" });
    for (const a of audit) expect(JSON.stringify([a.before, a.after])).not.toContain(BODY.slice(0, 20));

    // Consent guard.
    const off2 = await createOffering(-4);
    const reg2 = await createConfirmedRegistration(user.id, off2.id);
    const { review: priv } = await withTransaction((tx) => createReview(tx, { ...input({ consentPublic: false }), userId: user.id, kind: "registration", registrationId: reg2.id, programmeId: flagship.id, offeringId: off2.id }));
    await withTransaction((tx) => hideReview(tx, priv.id, admin.id));
    await expect(withTransaction((tx) => restoreReview(tx, priv.id, admin.id))).rejects.toBeInstanceOf(ReviewConsentError);
    expect((await prisma.review.findUniqueOrThrow({ where: { id: priv.id } })).visibilityStatus).toBe("hidden");
    expect((await listAuditForEntity(prisma, "review", priv.id)).map((a) => a.action)).toEqual(["review.submitted", "review.hidden"]);

    await expect(withTransaction((tx) => moderateReview(tx, randomUUID(), admin.id, { status: "approved" }))).rejects.toBeInstanceOf(ReviewNotFoundError);
  });

  it("admin list: search by email, filters, sort, pagination; includes email and never breaks the public query", async () => {
    const user = await createUser("Searchable Person");
    const off = await createOffering(-2);
    const reg = await createConfirmedRegistration(user.id, off.id);
    const { review } = await withTransaction((tx) => createReview(tx, { ...input({ rating: 2, category: "technical_issue", body: "Distinctive phrase zebra-quartz for the admin search test." }), userId: user.id, kind: "registration", registrationId: reg.id, programmeId: flagship.id, offeringId: off.id }));
    const email = (await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).email;

    const byEmail = await listReviewsForAdmin({ q: email.toUpperCase() });
    expect(byEmail.items.map((i) => i.id)).toEqual([review.id]);
    expect(byEmail.items[0]).toMatchObject({ userEmail: email, userName: "Searchable Person", excerpt: expect.stringContaining("zebra-quartz") });
    expect(byEmail.total).toBe(1);

    expect((await listReviewsForAdmin({ q: "zebra-quartz", rating: 2 })).items.map((i) => i.id)).toEqual([review.id]);
    expect((await listReviewsForAdmin({ q: "zebra-quartz", rating: 5 })).items).toEqual([]);
    expect((await listReviewsForAdmin({ q: "zebra-quartz", moderation: "approved" })).items).toEqual([]);
    expect((await listReviewsForAdmin({ q: "zebra-quartz", consent: "yes", programmeId: flagship.id })).items.map((i) => i.id)).toEqual([review.id]);

    const all = await listReviewsForAdmin({ pageSize: 2, sort: "oldest" });
    expect(all.items.length).toBeLessThanOrEqual(2);
    expect(all.pageCount).toBe(Math.max(1, Math.ceil(all.total / 2)));
    const times = all.items.map((i) => i.submittedAt.getTime());
    expect([...times].sort((a, b) => a - b)).toEqual(times);

    const detail = await getReviewForAdmin(review.id);
    expect(detail?.body).toContain("zebra-quartz");
    expect(await getReviewForAdmin("nope")).toBeNull();
  });
});

describe("edit window — the author only, 7 days, back to pending", () => {
  it("updates the own review, resets moderation and audits; refuses others and closed windows", async () => {
    const admin = await createUser("Admin Three");
    const user = await createUser("Editing Person");
    const other = await createUser("Someone Else");
    const off = await createOffering(-2);
    const reg = await createConfirmedRegistration(user.id, off.id);
    const { review } = await withTransaction((tx) => createReview(tx, { ...input(), userId: user.id, kind: "registration", registrationId: reg.id, programmeId: flagship.id, offeringId: off.id }));
    await withTransaction((tx) => moderateReview(tx, review.id, admin.id, { status: "approved", note: "fine" }));

    await expect(withTransaction((tx) => updateOwnReview(tx, review.id, other.id, input()))).rejects.toBeInstanceOf(ReviewNotFoundError);

    const edited = await withTransaction((tx) => updateOwnReview(tx, review.id, user.id, input({ body: "An edited version of my review, still long enough to be valid.", rating: 4, consentPublic: false })));
    expect(edited).toMatchObject({ rating: 4, consentPublic: false, consentPhoto: false, moderationStatus: "pending", moderatedByUserId: null, moderationNote: null });
    expect(edited.editedAt).not.toBeNull();
    expect(edited.body).toContain("edited version");
    expect((await listPublicReviews({ pageSize: 50 })).items.map((i) => i.id)).not.toContain(review.id);

    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 3600 * 1000);
    expect(editWindowOpen(eightDaysAgo)).toBe(false);
    expect(editWindowOpen(new Date())).toBe(true);
    await expect(withTransaction((tx) => updateOwnReview(tx, review.id, user.id, input(), new Date(review.submittedAt.getTime() + 8 * 24 * 3600 * 1000)))).rejects.toBeInstanceOf(ReviewEditWindowError);

    const audit = await listAuditForEntity(prisma, "review", review.id);
    expect(audit.map((a) => a.action)).toEqual(["review.submitted", "review.moderated", "review.edited"]);
    expect(audit[2]).toMatchObject({ actorUserId: user.id, before: { moderationStatus: "approved", rating: 5 }, after: { moderationStatus: "pending", rating: 4 } });
  });
});

describe("photo route rules and the certificate gate", () => {
  it("returns bytes only when the review is public AND the reviewer consented to the photo", async () => {
    const admin = await createUser("Admin Four");
    const user = await createUser("Photo Person");
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);
    await withTransaction((tx) => savePhoto(tx, user.id, png, "image/png"));
    const off = await createOffering(-2);
    const reg = await createConfirmedRegistration(user.id, off.id);
    const { review } = await withTransaction((tx) => createReview(tx, { ...input({ consentPublic: true, consentPhoto: true }), userId: user.id, kind: "registration", registrationId: reg.id, programmeId: flagship.id, offeringId: off.id }));

    expect(await getPublicReviewPhoto(review.id), "pending").toBeNull();
    await withTransaction((tx) => moderateReview(tx, review.id, admin.id, { status: "approved" }));
    const photo = await getPublicReviewPhoto(review.id);
    expect(photo?.mime).toBe("image/png");
    expect(Array.from(photo!.bytes)).toEqual(Array.from(png));
    expect((await listPublicReviews({ pageSize: 50 })).items.find((i) => i.id === review.id)).toMatchObject({ consentPhoto: true, hasPhoto: true });

    await withTransaction((tx) => hideReview(tx, review.id, admin.id));
    expect(await getPublicReviewPhoto(review.id), "hidden").toBeNull();
    await withTransaction((tx) => restoreReview(tx, review.id, admin.id));
    expect(await getPublicReviewPhoto(review.id)).not.toBeNull();

    // Photo consent withdrawn by an edit → nothing, even once re-approved.
    await withTransaction((tx) => updateOwnReview(tx, review.id, user.id, input({ consentPublic: true, consentPhoto: false })));
    await withTransaction((tx) => moderateReview(tx, review.id, admin.id, { status: "approved" }));
    expect(await getPublicReviewPhoto(review.id), "no photo consent").toBeNull();
    expect(await getPublicReviewPhoto("not-a-uuid")).toBeNull();
    expect(await getPublicReviewPhoto(randomUUID())).toBeNull();
  });

  it("reviewRequirementForRegistration: required until any review exists; hidden/rejected still satisfy", async () => {
    const admin = await createUser("Admin Five");
    const user = await createUser("Gate Person");
    const off = await createOffering(-2);
    const reg = await createConfirmedRegistration(user.id, off.id);
    expect(await reviewRequirementForRegistration(reg.id)).toBe("required");
    const { review } = await withTransaction((tx) => createReview(tx, { ...input({ consentPublic: false }), userId: user.id, kind: "registration", registrationId: reg.id, programmeId: flagship.id, offeringId: off.id }));
    expect(await reviewRequirementForRegistration(reg.id)).toBe("satisfied");
    await withTransaction((tx) => moderateReview(tx, review.id, admin.id, { status: "rejected" }));
    await withTransaction((tx) => hideReview(tx, review.id, admin.id));
    expect(await reviewRequirementForRegistration(reg.id)).toBe("satisfied");
    expect(await reviewRequirementForRegistration(reg.id, { certificateIssuedAt: new Date("2026-01-01T00:00:00Z") })).toBe("not_applicable");
    expect(await reviewRequirementForRegistration("not-a-uuid")).toBe("required");
  });
});
