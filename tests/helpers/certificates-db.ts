import { randomUUID } from "node:crypto";
import { getPrisma, withTransaction } from "../../src/db/prisma";
import { findFlagshipProgramme } from "../../src/modules/catalogue/programmes/repository";
import type { ProgrammeRecord } from "../../src/modules/catalogue/programmes/types";
import { addDays, isoToDateColumn, todayIso } from "../../src/modules/certificates/dates";
import { recordCompletion } from "../../src/modules/certificates/issuance.service";
import { toRecord, type CertificateRecord } from "../../src/modules/certificates/repository";
import { grantRole } from "../../src/modules/identity/roles.repository";
import { completeProfile, uniqueEmail } from "./identity-db";

/*
 * Database fixtures for certificate tests (integration + e2e). Relative
 * imports: Playwright resolves no `@/` alias. TEST DATABASE ONLY.
 *
 * Every fixture is created directly in the database except the certificate
 * itself, which goes through the REAL `recordCompletion` path so a fixture
 * can never diverge from what production issues. Clean up with
 * `deleteTestUser` (extended for certificates) and `deleteTestOffering`.
 */

const prisma = getPrisma();

let flagshipCache: ProgrammeRecord | null = null;

export async function flagshipProgramme(): Promise<ProgrammeRecord> {
  if (!flagshipCache) {
    const p = await findFlagshipProgramme();
    if (!p) throw new Error("seeded flagship programme required");
    flagshipCache = p;
  }
  return flagshipCache;
}

/** Today's calendar date in Asia/Kuala_Lumpur — what every certificate rule uses. */
export function certificateTodayIso(now = new Date()): string {
  return todayIso(now);
}

export type OfferingFixture = { id: string; programmeId: string; startsOn: string; endsOn: string };

/**
 * An offering whose last day was `endsOnDaysAgo` MYT days ago (default 3;
 * pass a negative number for one that has not ended). Status defaults to
 * `completed` for an ended offering and `open` otherwise; the roster and
 * issuance do not depend on it.
 */
export async function createEndedOfferingFixture(
  opts: { programmeId?: string; endsOnDaysAgo?: number; durationDays?: number; status?: "planned" | "open" | "full" | "completed" | "cancelled" } = {},
): Promise<OfferingFixture> {
  const programme = await flagshipProgramme();
  const programmeId = opts.programmeId ?? programme.id;
  const daysAgo = opts.endsOnDaysAgo ?? 3;
  const endsOn = addDays(certificateTodayIso(), -daysAgo);
  const startsOn = addDays(endsOn, -(opts.durationDays ?? 2));
  const row = await prisma.scheduledOffering.create({
    data: {
      programmeId,
      deliveryFormatId: programmeId === programme.id ? (programme.deliveryFormats[0]?.id ?? null) : null,
      modality: "live_online",
      timezone: "Asia/Kuala_Lumpur",
      startsOn: isoToDateColumn(startsOn),
      endsOn: isoToDateColumn(endsOn),
      capacity: 10,
      status: opts.status ?? (daysAgo > 0 ? "completed" : "open"),
    },
  });
  return { id: row.id, programmeId, startsOn, endsOn };
}

/** A paid registration order + registration, written directly (the webhook
 *  path is covered by commerce.test.ts). */
export async function createPaidRegistrationFixture(
  userId: string,
  offeringId: string,
  status: "confirmed" | "cancelled" = "confirmed",
): Promise<{ orderId: string; registrationId: string }> {
  const offering = await prisma.scheduledOffering.findUniqueOrThrow({ where: { id: offeringId }, select: { programmeId: true } });
  const order = await prisma.order.create({
    data: {
      userId,
      offeringId,
      programmeId: offering.programmeId,
      kind: "registration",
      status: "paid",
      region: "malaysia",
      currency: "MYR",
      amountMinor: BigInt(499900),
      expiresAt: new Date(Date.now() + 3600_000),
      paidAt: new Date(),
      stripeCheckoutSessionId: `cs_test_${randomUUID().slice(0, 12)}`,
    },
  });
  await prisma.payment.create({
    data: { orderId: order.id, providerPaymentIntentId: `pi_test_${randomUUID().slice(0, 12)}`, amountMinor: order.amountMinor, currency: order.currency, status: "succeeded" },
  });
  const reg = await prisma.registration.create({ data: { userId, offeringId, orderId: order.id, status } });
  return { orderId: order.id, registrationId: reg.id };
}

/** A participant with a checkout-complete profile (legal name set). Pass
 *  `legalName: null` to create the user WITHOUT a profile row. */
export async function createCertificateUser(opts: { prefix?: string; legalName?: string | null; country?: string } = {}): Promise<{ id: string; email: string; name: string }> {
  const legalName = opts.legalName === undefined ? "Certificate Person" : opts.legalName;
  const user = await prisma.user.create({ data: { email: uniqueEmail(opts.prefix ?? "m6"), name: legalName ?? "No Profile", country: opts.country ?? "Malaysia" } });
  if (legalName !== null) await completeProfile(user.id, { legalName });
  return { id: user.id, email: user.email, name: user.name };
}

/** A `platform_admin` for actions that need an actor. */
export async function createAdminUser(prefix = "m6-admin"): Promise<{ id: string; email: string }> {
  const user = await prisma.user.create({ data: { email: uniqueEmail(prefix), name: "Certificates Admin", country: "Malaysia" } });
  await withTransaction((tx) => grantRole(tx, { userId: user.id, role: "platform_admin", grantedByUserId: null, reason: "test" }));
  return { id: user.id, email: user.email };
}

export type IssuedCertificateFixture = {
  certificate: CertificateRecord;
  userId: string;
  registrationId: string;
  offeringId: string;
  orderId: string;
};

/**
 * Ended offering → paid, confirmed registration → certificate through the
 * real `recordCompletion`. `expiresOnIso` overrides the expiry afterwards
 * (for renewal-due / expired states). Provide `userId` or `userEmail`; when
 * neither is given a participant is created.
 */
export async function issueTestCertificate(opts: {
  adminUserId: string;
  userId?: string;
  userEmail?: string;
  endsOnDaysAgo?: number;
  completedOn?: string;
  expiresOnIso?: string;
  programmeId?: string;
  listed?: boolean;
}): Promise<IssuedCertificateFixture> {
  let userId = opts.userId;
  if (!userId && opts.userEmail) {
    const u = await prisma.user.findUnique({ where: { email: opts.userEmail.toLowerCase() }, select: { id: true } });
    if (!u) throw new Error(`no user ${opts.userEmail}`);
    userId = u.id;
  }
  if (!userId) userId = (await createCertificateUser()).id;
  const offering = await createEndedOfferingFixture({ endsOnDaysAgo: opts.endsOnDaysAgo ?? 3, programmeId: opts.programmeId });
  const { orderId, registrationId } = await createPaidRegistrationFixture(userId, offering.id);
  const { certificate } = await recordCompletion({ registrationId, completedOn: opts.completedOn ?? offering.endsOn, adminUserId: opts.adminUserId });
  let record = certificate;
  if (opts.expiresOnIso) record = await setCertificateExpiry(certificate.id, opts.expiresOnIso);
  if (opts.listed) {
    const row = await prisma.certificate.update({ where: { id: certificate.id }, data: { listed: true, listedChangedAt: new Date() } });
    record = { ...record, listed: row.listed, listedChangedAt: row.listedChangedAt };
  }
  return { certificate: record, userId, registrationId, offeringId: offering.id, orderId };
}

/** Moves `expires_on` directly (row uuid) so a test can reach renewal-due /
 *  expired states without waiting a year. Returns the refreshed record. */
export async function setCertificateExpiry(certificateId: string, iso: string): Promise<CertificateRecord> {
  const row = await prisma.certificate.update({ where: { id: certificateId }, data: { expiresOn: isoToDateColumn(iso) } });
  return toRecord(row);
}

/** Certificates issued for an offering and everything hanging off them:
 *  renewal orders (+ payments), renewal rows, audit rows, then the
 *  certificates. Registrations and registration orders are left alone. */
export async function deleteTestCertificatesForOffering(offeringId: string): Promise<void> {
  const certIds = (await prisma.certificate.findMany({ where: { offeringId }, select: { id: true } })).map((c) => c.id);
  await deleteCertificateChain(certIds);
}

export async function deleteCertificateChain(certIds: string[]): Promise<void> {
  if (certIds.length === 0) return;
  const renewalOrderIds = (await prisma.order.findMany({ where: { certificateId: { in: certIds } }, select: { id: true } })).map((o) => o.id);
  const renewalIds = (await prisma.certificateRenewal.findMany({ where: { certificateId: { in: certIds } }, select: { id: true } })).map((r) => r.id);
  await prisma.$transaction([
    prisma.auditLog.deleteMany({ where: { entityType: { in: ["certificate", "certificate_renewal"] }, entityId: { in: [...certIds, ...renewalIds] } } }),
    prisma.auditLog.deleteMany({ where: { entityType: "order", entityId: { in: renewalOrderIds } } }),
    prisma.certificateRenewal.deleteMany({ where: { id: { in: renewalIds } } }),
    prisma.payment.deleteMany({ where: { orderId: { in: renewalOrderIds } } }),
    prisma.order.deleteMany({ where: { id: { in: renewalOrderIds } } }),
    prisma.certificate.deleteMany({ where: { id: { in: certIds } } }),
  ]);
}

/** Removes an offering created by a fixture together with its certificates,
 *  reviews, registrations, payments and orders. */
export async function deleteTestOffering(offeringId: string): Promise<void> {
  await deleteTestCertificatesForOffering(offeringId);
  const orderIds = (await prisma.order.findMany({ where: { offeringId }, select: { id: true } })).map((o) => o.id);
  const registrationIds = (await prisma.registration.findMany({ where: { offeringId }, select: { id: true } })).map((r) => r.id);
  const paymentIds = (await prisma.payment.findMany({ where: { orderId: { in: orderIds } }, select: { id: true } })).map((p) => p.id);
  await prisma.$transaction([
    prisma.review.deleteMany({ where: { registrationId: { in: registrationIds } } }),
    prisma.refund.deleteMany({ where: { paymentId: { in: paymentIds } } }),
    prisma.registration.deleteMany({ where: { id: { in: registrationIds } } }),
    prisma.payment.deleteMany({ where: { id: { in: paymentIds } } }),
    prisma.order.deleteMany({ where: { id: { in: orderIds } } }),
    prisma.auditLog.deleteMany({ where: { entityId: { in: [...orderIds, ...registrationIds, ...paymentIds, offeringId] } } }),
    prisma.scheduledOffering.deleteMany({ where: { id: offeringId } }),
  ]);
}
