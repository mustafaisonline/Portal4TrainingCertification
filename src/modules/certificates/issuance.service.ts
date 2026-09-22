import type { Db, Tx } from "@/db/prisma";
import { getPrisma, withTransaction } from "@/db/prisma";
import { findOfferingById, isUuid, MODALITY_LABEL, type OfferingRecord } from "@/modules/catalogue/offerings/repository";
import { appBaseUrl } from "@/modules/commerce/checkout.service";
import { sendEmail } from "@/modules/notifications/email";
import { writeAudit } from "@/modules/platform/audit/repository";
import { dateColumnToIso, isIsoDate, isoToDateColumn, todayIso } from "./dates";
import { certificateIssuedMessage } from "./emails";
import { generateCertificateId, type RandomInt } from "./id";
import { CertificateStateError, toRecord, type CertificateRecord } from "./repository";
import { initialExpiry, normaliseName } from "./rules";

/*
 * Issuance (M6 plan §3 E2, §5 "Issuance"; requirements R-I1/R-I3). An
 * ADMINISTRATOR records completion per participant, only after the
 * offering's end date and only for a CONFIRMED registration; recording
 * completion issues the certificate IN THE SAME TRANSACTION. No attendance
 * percentage, no assessment, no self-declaration. A second call for the
 * same registration returns the existing certificate — idempotent.
 *
 * The printed name is the profile's LEGAL name at issue (plan §8 "Name
 * source"); a participant without one is shown as "profile incomplete" and
 * refused until it exists. Programme title and format name are snapshotted
 * so a later catalogue edit never rewrites a printed certificate.
 */

export type RosterBlockReason = "registration_not_confirmed" | "offering_not_ended" | "profile_incomplete" | "already_issued";

export type RosterEntry = {
  registrationId: string;
  status: "confirmed" | "cancelled" | "transferred";
  registeredAt: Date;
  user: { id: string; name: string; email: string };
  /** The profile's legal name — what the certificate will print. */
  legalName: string | null;
  certificate: CertificateRecord | null;
  /** True when "Record completion" may be submitted for this row now. */
  canRecord: boolean;
  reason: RosterBlockReason | null;
};

export type Roster = {
  offering: OfferingRecord;
  /** `ends_on` is before today's MYT date. */
  ended: boolean;
  today: string;
  entries: RosterEntry[];
};

/** The offering has ended when its last day is BEFORE today (MYT): on the
 *  last day itself completion cannot yet be recorded. */
export function offeringHasEnded(offering: { endsOn: Date }, today: string): boolean {
  return dateColumnToIso(offering.endsOn) < today;
}

/** Every registration on the offering (any status) with what blocks
 *  issuance, for /admin/offerings/[id]/participants. Null when no offering. */
export async function listRoster(offeringId: string, now = new Date(), db: Db = getPrisma()): Promise<Roster | null> {
  const offering = await findOfferingById(offeringId, db);
  if (!offering) return null;
  const today = todayIso(now);
  const ended = offeringHasEnded(offering, today);
  const rows = await db.registration.findMany({
    where: { offeringId: offering.id },
    orderBy: { createdAt: "asc" },
    include: {
      user: { select: { id: true, name: true, email: true, profile: { select: { legalName: true } } } },
      certificate: true,
    },
  });
  const entries = rows.map((r): RosterEntry => {
    const legalName = r.user.profile?.legalName?.trim() || null;
    const certificate = r.certificate ? toRecord(r.certificate) : null;
    const reason: RosterBlockReason | null = certificate
      ? "already_issued"
      : r.status !== "confirmed"
        ? "registration_not_confirmed"
        : !ended
          ? "offering_not_ended"
          : !legalName
            ? "profile_incomplete"
            : null;
    return {
      registrationId: r.id,
      status: r.status,
      registeredAt: r.createdAt,
      user: { id: r.user.id, name: r.user.name, email: r.user.email },
      legalName,
      certificate,
      canRecord: reason === null,
      reason,
    };
  });
  return { offering, ended, today, entries };
}

/* ---------------------------------------------------------------- issuance */

export type RecordCompletionInput = {
  registrationId: string;
  /** Calendar date (YYYY-MM-DD) the participant completed, within the
   *  offering's first day and today inclusive. */
  completedOn: string;
  adminUserId: string;
  /** Injectable clock for tests. */
  now?: Date;
  /** Injectable randomness for tests (deterministic IDs, forced collisions). */
  random?: RandomInt;
};

export type RecordCompletionResult = { certificate: CertificateRecord; created: boolean };

const ID_ATTEMPTS = 5;

/** P2002 on the named column. Prisma reports the target as a column list,
 *  a constraint name (`certificates_certificate_id_key`) or only in the
 *  message depending on the engine, so all three are checked. */
function uniqueViolationOn(err: unknown, column: string): boolean {
  if (typeof err !== "object" || err === null || (err as { code?: unknown }).code !== "P2002") return false;
  const target = (err as { meta?: { target?: unknown } }).meta?.target;
  const list = Array.isArray(target) ? target.map(String) : typeof target === "string" ? [target] : [];
  const message = (err as { message?: unknown }).message;
  return list.some((t) => t.includes(column)) || (typeof message === "string" && message.includes(column));
}

const registrationInclude = {
  user: { select: { id: true, name: true, email: true, profile: { select: { legalName: true } } } },
  offering: { include: { programme: { select: { title: true } }, deliveryFormat: { select: { name: true } } } },
  certificate: true,
} as const;

async function lockRegistration(tx: Tx, registrationId: string) {
  if (!isUuid(registrationId)) return null;
  const locked = await tx.$queryRaw<{ id: string }[]>`SELECT id FROM registrations WHERE id = ${registrationId}::uuid FOR UPDATE`;
  if (locked.length === 0) return null;
  return tx.registration.findUnique({ where: { id: registrationId }, include: registrationInclude });
}

export async function recordCompletion(input: RecordCompletionInput): Promise<RecordCompletionResult> {
  const now = input.now ?? new Date();
  const today = todayIso(now);

  const outcome = await withTransaction(async (tx): Promise<RecordCompletionResult & { email: { to: string; name: string } | null }> => {
    const reg = await lockRegistration(tx, input.registrationId);
    if (!reg) throw new CertificateStateError("registration_not_found", `Registration ${input.registrationId} does not exist.`);
    // Idempotent before anything else: a resubmit after a network error, or
    // a second administrator, gets the certificate that already exists.
    if (reg.certificate) return { certificate: toRecord(reg.certificate), created: false, email: null };

    if (reg.status !== "confirmed") {
      throw new CertificateStateError("registration_not_confirmed", `Registration ${reg.id} is ${reg.status}; only a confirmed registration can be completed.`);
    }
    if (!offeringHasEnded(reg.offering, today)) {
      throw new CertificateStateError("offering_not_ended", `Offering ${reg.offeringId} ends on ${dateColumnToIso(reg.offering.endsOn)}; completion can be recorded from the next day.`);
    }
    const startsOn = dateColumnToIso(reg.offering.startsOn);
    if (!isIsoDate(input.completedOn) || input.completedOn < startsOn || input.completedOn > today) {
      throw new CertificateStateError("completed_on_out_of_range", `completedOn must be a date from ${startsOn} to ${today}; got "${input.completedOn}".`);
    }
    const legalName = reg.user.profile?.legalName?.trim();
    if (!legalName) {
      throw new CertificateStateError("profile_incomplete", `User ${reg.userId} has no legal name on their profile; the certificate cannot name them.`);
    }

    const issuedOn = today;
    const expiresOn = initialExpiry(issuedOn);
    const data = {
      registrationId: reg.id,
      userId: reg.userId,
      programmeId: reg.offering.programmeId,
      offeringId: reg.offeringId,
      holderName: legalName,
      holderNameSearch: normaliseName(legalName),
      programmeTitle: reg.offering.programme.title,
      formatName: reg.offering.deliveryFormat?.name ?? MODALITY_LABEL[reg.offering.modality],
      completedOn: isoToDateColumn(input.completedOn),
      issuedOn: isoToDateColumn(issuedOn),
      expiresOn: isoToDateColumn(expiresOn),
      issuedByUserId: input.adminUserId,
    };
    const year = Number(issuedOn.slice(0, 4));

    let created: CertificateRecord | null = null;
    for (let attempt = 1; attempt <= ID_ATTEMPTS && !created; attempt += 1) {
      const certificateId = generateCertificateId(year, input.random);
      try {
        // A savepoint per attempt: a unique violation must not poison the
        // enclosing transaction (PostgreSQL aborts it otherwise).
        await tx.$executeRawUnsafe(`SAVEPOINT certificate_id_${attempt}`);
        const row = await tx.certificate.create({ data: { ...data, certificateId } });
        created = toRecord(row);
      } catch (err) {
        await tx.$executeRawUnsafe(`ROLLBACK TO SAVEPOINT certificate_id_${attempt}`);
        if (uniqueViolationOn(err, "certificate_id")) continue; // collision: draw again
        if (uniqueViolationOn(err, "registration_id")) {
          // Two administrators raced past the pre-check; the constraint won.
          const winner = await tx.certificate.findUnique({ where: { registrationId: reg.id } });
          if (winner) return { certificate: toRecord(winner), created: false, email: null };
        }
        throw err;
      }
    }
    if (!created) throw new CertificateStateError("id_generation_failed", `No unique certificate ID after ${ID_ATTEMPTS} attempts.`);

    await writeAudit(tx, {
      actorUserId: input.adminUserId,
      action: "certificate.issued",
      entityType: "certificate",
      entityId: created.id,
      after: {
        certificateId: created.certificateId,
        registrationId: created.registrationId,
        offeringId: created.offeringId,
        programmeId: created.programmeId,
        completedOn: created.completedOn,
        issuedOn: created.issuedOn,
        expiresOn: created.expiresOn,
      },
    });
    return { certificate: created, created: true, email: { to: reg.user.email, name: reg.user.name } };
  });

  // After the commit, like commerce: the certificate exists whether or not
  // the outbox accepts the message; a failure is logged, never surfaced as
  // a failed issuance.
  if (outcome.created && outcome.email) {
    const c = outcome.certificate;
    try {
      const base = appBaseUrl();
      await sendEmail(
        certificateIssuedMessage({
          to: outcome.email.to,
          name: outcome.email.name,
          programmeTitle: c.programmeTitle,
          formatName: c.formatName,
          certificateId: c.certificateId,
          expiresOn: c.expiresOn,
          verifyUrl: `${base}/verify/${c.certificateId}`,
          accountUrl: `${base}/account/certificate`,
        }),
      );
    } catch (err) {
      console.error(`[certificates] issued email not queued for certificate ${c.id}`, err);
    }
  }
  return { certificate: outcome.certificate, created: outcome.created };
}
