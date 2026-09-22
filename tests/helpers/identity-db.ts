import { randomUUID } from "node:crypto";
import { countryName } from "../../src/content/countries";
import { getPrisma, withTransaction } from "../../src/db/prisma";
import { saveProfile, type ProfileInput, type ProfileView } from "../../src/modules/identity/profile.repository";
import { grantRole, type Role } from "../../src/modules/identity/roles.repository";
import { findUserByEmail } from "../../src/modules/identity/users.repository";

/*
 * Database helpers for identity tests (integration + e2e). Relative imports:
 * Playwright resolves no `@/` alias. TEST DATABASE ONLY — tests/setup-env.ts
 * and playwright.config.ts point DATABASE_URL at DATABASE_URL_TEST.
 */

export function uniqueEmail(prefix = "test"): string {
  return `${prefix}-${randomUUID().slice(0, 8)}@example.test`;
}

export const STRONG_PASSWORD = "correct-horse-battery-staple-42";

/** The most recent email recorded for an address and template. */
export async function latestEmail(to: string, templateKey: string) {
  return getPrisma().outboundEmail.findFirst({
    where: { toEmail: to.toLowerCase(), templateKey },
    orderBy: { createdAt: "desc" },
  });
}

/** Sends are deliberately not awaited by the auth endpoints (timing-safe
 *  responses), so a test polls briefly for the row to appear. */
export async function waitForEmail(to: string, templateKey: string, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const row = await latestEmail(to, templateKey);
    if (row) return row;
    if (Date.now() > deadline) throw new Error(`no ${templateKey} email for ${to} within ${timeoutMs}ms`);
    await new Promise((r) => setTimeout(r, 50));
  }
}

/** The first absolute URL in an email body — the verification / reset link. */
export function firstLink(text: string): string {
  const m = text.match(/https?:\/\/\S+/);
  if (!m) throw new Error("no link in email body");
  return m[0];
}

export async function grantRoleByEmail(email: string, role: Role): Promise<void> {
  const user = await findUserByEmail(email);
  if (!user) throw new Error(`no user ${email}`);
  await withTransaction((tx) => grantRole(tx, { userId: user.id, role, grantedByUserId: null, reason: "test" }));
}

/** A profile that satisfies the checkout gate (M5a plan §3) — every required
 *  field present; `overrides` change any of them (e.g. `countryCode`). */
export function completeProfileInput(overrides: Partial<ProfileInput> = {}): ProfileInput {
  return {
    legalName: "Test Person",
    displayName: null,
    phoneE164: "+60123456789",
    addressLine1: "1 Jalan Test",
    addressLine2: null,
    city: "Kuala Lumpur",
    state: null,
    postalCode: "50000",
    countryCode: "MY",
    timezone: null,
    organisation: "Test Organisation",
    jobTitle: "Analyst",
    industry: null,
    experienceBand: null,
    linkedinUrl: null,
    idType: "passport",
    idNumber: "A1234567",
    nationalityCode: "MY",
    dateOfBirth: "1990-01-01",
    marketingConsent: false,
    heardAbout: null,
    ...overrides,
  };
}

/** Write a checkout-complete profile for a user through the real repository
 *  (encryption, audit and the `users` mirror included). */
export async function completeProfile(userId: string, overrides: Partial<ProfileInput> = {}): Promise<ProfileView> {
  const input = completeProfileInput(overrides);
  return withTransaction((tx) => saveProfile(tx, userId, input, countryName(input.countryCode)));
}

export async function completeProfileByEmail(email: string, overrides: Partial<ProfileInput> = {}): Promise<ProfileView> {
  const user = await findUserByEmail(email);
  if (!user) throw new Error(`no user ${email}`);
  return completeProfile(user.id, overrides);
}

/** The auth endpoints are rate-limited per client and the counters live in
 *  the database (restart-safe, plan §6.7). A test run registers many accounts
 *  from one address in seconds, so each test starts with clear counters. */
export async function resetRateLimits(): Promise<void> {
  await getPrisma().authRateLimit.deleteMany({});
}

/** Everything a registration created, in reverse. audit_log is insert-only
 *  in the product; this test-only helper clears the rows for the test user so
 *  the TEST database does not grow without bound. */
export async function deleteTestUser(email: string): Promise<void> {
  const prisma = getPrisma();
  const lower = email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: lower }, select: { id: true } });
  if (user) {
    // reviews.user_id restricts deletion of the user (M5b); a review's
    // registration must already be gone (the commerce specs delete those).
    const reviewIds = (await prisma.review.findMany({ where: { userId: user.id }, select: { id: true } })).map((r) => r.id);
    // M6: certificates restrict their registration and the user; renewal
    // orders restrict their certificate; registrations restrict their order.
    // Dependency order: renewals → refunds → payments → renewal orders →
    // certificates → registrations → remaining orders. Specs that already
    // removed their own rows find every step a no-op.
    const certIds = (await prisma.certificate.findMany({ where: { userId: user.id }, select: { id: true } })).map((c) => c.id);
    const renewalIds = (await prisma.certificateRenewal.findMany({ where: { certificateId: { in: certIds } }, select: { id: true } })).map((r) => r.id);
    const renewalOrderIds = (await prisma.order.findMany({ where: { certificateId: { in: certIds } }, select: { id: true } })).map((o) => o.id);
    const orderIds = (await prisma.order.findMany({ where: { userId: user.id }, select: { id: true } })).map((o) => o.id);
    const paymentIds = (await prisma.payment.findMany({ where: { orderId: { in: orderIds } }, select: { id: true } })).map((p) => p.id);
    const refundIds = (await prisma.refund.findMany({ where: { paymentId: { in: paymentIds } }, select: { id: true } })).map((r) => r.id);
    const registrationIds = (await prisma.registration.findMany({ where: { userId: user.id }, select: { id: true } })).map((r) => r.id);
    await prisma.$transaction([
      prisma.auditLog.deleteMany({ where: { entityType: "review", entityId: { in: reviewIds } } }),
      prisma.review.deleteMany({ where: { userId: user.id } }),
      prisma.auditLog.deleteMany({ where: { entityType: { in: ["certificate", "certificate_renewal"] }, entityId: { in: [...certIds, ...renewalIds] } } }),
      prisma.certificateRenewal.deleteMany({ where: { id: { in: renewalIds } } }),
      prisma.refund.deleteMany({ where: { id: { in: refundIds } } }),
      prisma.payment.deleteMany({ where: { id: { in: paymentIds } } }),
      prisma.order.deleteMany({ where: { id: { in: renewalOrderIds } } }),
      prisma.certificate.deleteMany({ where: { id: { in: certIds } } }),
      prisma.registration.deleteMany({ where: { id: { in: registrationIds } } }),
      prisma.order.deleteMany({ where: { id: { in: orderIds } } }),
      prisma.auditLog.deleteMany({ where: { entityId: { in: [...orderIds, ...paymentIds, ...refundIds, ...registrationIds] } } }),
      // user_profiles.user_id restricts deletion of the user (M5a).
      prisma.userProfile.deleteMany({ where: { userId: user.id } }),
      prisma.consent.deleteMany({ where: { userId: user.id } }),
      prisma.userRole.deleteMany({ where: { userId: user.id } }),
      prisma.authIdentity.deleteMany({ where: { userId: user.id } }),
      prisma.auditLog.deleteMany({ where: { OR: [{ entityId: user.id }, { actorUserId: user.id }] } }),
      prisma.user.delete({ where: { id: user.id } }),
    ]);
  }
  // Cascade removes sessions, accounts and two-factor rows.
  await prisma.authUser.deleteMany({ where: { email: lower } });
  await prisma.outboundEmail.deleteMany({ where: { toEmail: lower } });
}
