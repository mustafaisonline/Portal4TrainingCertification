import type { Db } from "@/db/prisma";
import { getPrisma } from "@/db/prisma";
import { getProfile } from "./profile.repository";

/*
 * Participant data export — the PDPA access right (MILESTONE_8_EXECUTION_PLAN
 * §2 item 7; default G4). One function builds a plain JSON object of the
 * person's OWN records: every query is filtered by the owner's user id, and
 * rows that hang off an owned row (payments, refunds, renewals) are reached
 * only through that ownership. The profile comes from the SAME masked view
 * the profile page renders — the ID number appears as its last four and the
 * photo bytes are never selected. Dates become ISO strings, BigInt amounts
 * become numbers (or a decimal string past 2^53), so the result is
 * `JSON.stringify`-safe with no replacer.
 */

export type DataExport = {
  exportedAt: string;
  format: "data-ai-academy/personal-data-export";
  version: 1;
  account: Record<string, unknown>;
  profile: Record<string, unknown> | null;
  roles: Record<string, unknown>[];
  registrations: Record<string, unknown>[];
  orders: Record<string, unknown>[];
  payments: Record<string, unknown>[];
  refunds: Record<string, unknown>[];
  reviews: Record<string, unknown>[];
  certificates: Record<string, unknown>[];
  renewals: Record<string, unknown>[];
  consents: Record<string, unknown>[];
  auditAsActor: Record<string, unknown>[];
};

/** Plain JSON: Dates → ISO, BigInt → number when safe (else a decimal
 *  string), undefined dropped, nested objects and arrays walked. */
export function toJsonSafe<T>(value: T): unknown {
  return JSON.parse(
    JSON.stringify(value, (_k, v: unknown) => {
      if (typeof v === "bigint") return v <= BigInt(Number.MAX_SAFE_INTEGER) && v >= BigInt(-Number.MAX_SAFE_INTEGER) ? Number(v) : v.toString();
      return v;
    }),
  );
}

const asRecords = (rows: unknown[]): Record<string, unknown>[] => toJsonSafe(rows) as Record<string, unknown>[];

/** Null when the user does not exist. */
export async function buildDataExport(userId: string, db: Db = getPrisma(), now = new Date()): Promise<DataExport | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, country: true, emailVerifiedAt: true, createdAt: true, updatedAt: true },
  });
  if (!user) return null;

  const [profile, roles, registrations, orders, payments, refunds, reviews, certificates, renewals, consents, auditAsActor] = await Promise.all([
    getProfile(userId, db),
    db.userRole.findMany({
      where: { userId },
      orderBy: { grantedAt: "asc" },
      select: { role: true, scopeType: true, scopeId: true, grantedAt: true, revokedAt: true },
    }),
    db.registration.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        status: true,
        transferUsed: true,
        transferredToRegistrationId: true,
        cancelledAt: true,
        cancellationRefundPercent: true,
        createdAt: true,
        orderId: true,
        offeringId: true,
        offering: {
          select: { startsOn: true, endsOn: true, modality: true, location: true, timezone: true, programme: { select: { title: true } }, deliveryFormat: { select: { name: true } } },
        },
      },
    }),
    db.order.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        kind: true,
        status: true,
        region: true,
        currency: true,
        amountMinor: true,
        offeringId: true,
        programmeId: true,
        certificateId: true,
        expiresAt: true,
        paidAt: true,
        createdAt: true,
        programme: { select: { title: true } },
      },
    }),
    db.payment.findMany({
      where: { order: { userId } },
      orderBy: { createdAt: "asc" },
      select: { id: true, orderId: true, provider: true, amountMinor: true, currency: true, status: true, receiptUrl: true, providerFeeMinor: true, createdAt: true },
    }),
    db.refund.findMany({
      where: { payment: { order: { userId } } },
      orderBy: { createdAt: "asc" },
      select: { id: true, paymentId: true, amountMinor: true, percent: true, reason: true, status: true, createdAt: true, updatedAt: true },
    }),
    db.review.findMany({
      where: { userId },
      orderBy: { submittedAt: "asc" },
      select: {
        id: true,
        registrationId: true,
        kind: true,
        body: true,
        rating: true,
        category: true,
        consentPublic: true,
        consentPhoto: true,
        moderationStatus: true,
        visibilityStatus: true,
        displayNameSnapshot: true,
        submittedAt: true,
        editedAt: true,
        programme: { select: { title: true } },
      },
    }),
    db.certificate.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        certificateId: true,
        registrationId: true,
        holderName: true,
        programmeTitle: true,
        formatName: true,
        completedOn: true,
        issuedOn: true,
        expiresOn: true,
        listed: true,
        listedChangedAt: true,
        revokedAt: true,
        revocationReason: true,
        createdAt: true,
      },
    }),
    db.certificateRenewal.findMany({
      where: { certificate: { userId } },
      orderBy: { createdAt: "asc" },
      select: { id: true, certificateId: true, orderId: true, previousExpiresOn: true, newExpiresOn: true, amountMinor: true, currency: true, createdAt: true },
    }),
    db.consent.findMany({ where: { userId }, orderBy: { acceptedAt: "asc" }, select: { documentKey: true, documentVersion: true, acceptedAt: true } }),
    db.auditLog.findMany({
      where: { actorUserId: userId },
      orderBy: { createdAt: "asc" },
      select: { id: true, action: true, entityType: true, entityId: true, before: true, after: true, reason: true, createdAt: true },
    }),
  ]);

  const dateOnly = (d: Date) => d.toISOString().slice(0, 10);

  return {
    exportedAt: now.toISOString(),
    format: "data-ai-academy/personal-data-export",
    version: 1,
    account: toJsonSafe(user) as Record<string, unknown>,
    // The masked view, field for field — `idNumberMasked` is "••••1234".
    profile: profile ? (toJsonSafe(profile) as Record<string, unknown>) : null,
    roles: asRecords(roles),
    registrations: asRecords(
      registrations.map((r) => ({
        id: r.id,
        status: r.status,
        transferUsed: r.transferUsed,
        transferredToRegistrationId: r.transferredToRegistrationId,
        cancelledAt: r.cancelledAt,
        cancellationRefundPercent: r.cancellationRefundPercent,
        createdAt: r.createdAt,
        orderId: r.orderId,
        offeringId: r.offeringId,
        programmeTitle: r.offering.programme.title,
        formatName: r.offering.deliveryFormat?.name ?? null,
        startsOn: dateOnly(r.offering.startsOn),
        endsOn: dateOnly(r.offering.endsOn),
        modality: r.offering.modality,
        location: r.offering.location,
        timezone: r.offering.timezone,
      })),
    ),
    orders: asRecords(orders.map(({ programme, ...o }) => ({ ...o, programmeTitle: programme.title }))),
    payments: asRecords(payments),
    refunds: asRecords(refunds),
    reviews: asRecords(reviews.map(({ programme, ...r }) => ({ ...r, programmeTitle: programme.title }))),
    certificates: asRecords(
      certificates.map((c) => ({ ...c, completedOn: dateOnly(c.completedOn), issuedOn: dateOnly(c.issuedOn), expiresOn: dateOnly(c.expiresOn) })),
    ),
    renewals: asRecords(renewals.map((r) => ({ ...r, previousExpiresOn: dateOnly(r.previousExpiresOn), newExpiresOn: dateOnly(r.newExpiresOn) }))),
    consents: asRecords(consents),
    auditAsActor: asRecords(auditAsActor),
  };
}

/** `my-data-YYYY-MM-DD.json` — the attachment name the route sends. */
export function exportFilename(now = new Date()): string {
  return `my-data-${now.toISOString().slice(0, 10)}.json`;
}
