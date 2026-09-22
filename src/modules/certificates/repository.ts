import type { Db, Tx } from "@/db/prisma";
import { getPrisma } from "@/db/prisma";
import { isUuid } from "@/modules/catalogue/offerings/repository";
import { writeAudit } from "@/modules/platform/audit/repository";
import { LISTING_CONSENT_KEY, LISTING_CONSENT_VERSION, MAX_NAME_RESULTS, type CertificateStatus } from "./constants";
import { addDays, dateColumnToIso, isoToDateColumn, todayIso } from "./dates";
import { normaliseId, normaliseName, statusOf } from "./rules";

/*
 * Certificates repository (Milestone 6; MILESTONE_6_EXECUTION_PLAN.md §4–§5).
 * Every write takes the caller's transaction and writes its audit row in it
 * (ADR-022). Audit snapshots carry ids, dates and flags only — NEVER an
 * email or an ID-document field.
 *
 * Two identifiers, deliberately distinct:
 *   - `id`            — the row's uuid; what every write and owner check takes;
 *   - `certificateId` — the printed `DAA-YYYY-XXXX-XXXX`; what the public
 *                       looks up (`findByCertificateId`).
 *
 * Dates: `completedOn` / `issuedOn` / `expiresOn` are calendar dates
 * (YYYY-MM-DD, via ./dates); `*At` fields are instants.
 */

/* ------------------------------------------------------------------ errors */

export class CertificateNotFoundError extends Error {
  constructor(ref: string) {
    super(`Certificate ${ref} not found.`);
    this.name = "CertificateNotFoundError";
  }
}

export type CertificateStateCode =
  | "registration_not_found"
  | "registration_not_confirmed"
  | "offering_not_ended"
  | "completed_on_out_of_range"
  | "profile_incomplete"
  | "already_revoked"
  | "revoked"
  | "window_closed"
  | "order_pending"
  | "not_owner"
  | "fee_unavailable"
  | "id_generation_failed";

/** A rule refused the change. `code` is stable so an action can choose the
 *  sentence a person sees and a test can assert the reason. */
export class CertificateStateError extends Error {
  readonly code: CertificateStateCode;
  constructor(code: CertificateStateCode, message: string) {
    super(message);
    this.name = "CertificateStateError";
    this.code = code;
  }
}

/** Input did not validate; one message per offending field. */
export class CertificateValidationError extends Error {
  readonly fieldErrors: Record<string, string>;
  constructor(fieldErrors: Record<string, string>) {
    super(`Certificate input validation failed: ${Object.keys(fieldErrors).join(", ")}`);
    this.name = "CertificateValidationError";
    this.fieldErrors = fieldErrors;
  }
}

/* ----------------------------------------------------------------- records */

export type CertificateRecord = {
  id: string;
  certificateId: string;
  registrationId: string;
  userId: string;
  programmeId: string;
  offeringId: string;
  holderName: string;
  holderNameSearch: string;
  programmeTitle: string;
  formatName: string;
  completedOn: string;
  issuedOn: string;
  expiresOn: string;
  listed: boolean;
  listedChangedAt: Date | null;
  revokedAt: Date | null;
  revokedByUserId: string | null;
  revocationReason: string | null;
  issuedByUserId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type RenewalRecord = {
  id: string;
  certificateId: string;
  orderId: string;
  feeSettingId: string;
  previousExpiresOn: string;
  newExpiresOn: string;
  amountMinor: number;
  currency: string;
  createdAt: Date;
};

type Row = NonNullable<Awaited<ReturnType<typeof loadById>>>;

function loadById(db: Db, id: string) {
  return db.certificate.findUnique({ where: { id } });
}

export function toRecord(r: Row): CertificateRecord {
  return {
    id: r.id,
    certificateId: r.certificateId,
    registrationId: r.registrationId,
    userId: r.userId,
    programmeId: r.programmeId,
    offeringId: r.offeringId,
    holderName: r.holderName,
    holderNameSearch: r.holderNameSearch,
    programmeTitle: r.programmeTitle,
    formatName: r.formatName,
    completedOn: dateColumnToIso(r.completedOn),
    issuedOn: dateColumnToIso(r.issuedOn),
    expiresOn: dateColumnToIso(r.expiresOn),
    listed: r.listed,
    listedChangedAt: r.listedChangedAt,
    revokedAt: r.revokedAt,
    revokedByUserId: r.revokedByUserId,
    revocationReason: r.revocationReason,
    issuedByUserId: r.issuedByUserId,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

/* ------------------------------------------------------------------- reads */

/** By row uuid. A malformed id is "not found", never a database error. */
export async function findCertificateById(id: string, db: Db = getPrisma()): Promise<CertificateRecord | null> {
  if (!isUuid(id)) return null;
  const row = await loadById(db, id);
  return row ? toRecord(row) : null;
}

/** By printed ID, accepting what a person typed (any case, spaces, missing
 *  hyphens). Finds the certificate whether or not it is listed or revoked —
 *  the ID is the holder's proof-of-share (requirements §5). */
export async function findByCertificateId(input: string, db: Db = getPrisma()): Promise<CertificateRecord | null> {
  const certificateId = normaliseId(input);
  if (!certificateId) return null;
  const row = await db.certificate.findUnique({ where: { certificateId } });
  return row ? toRecord(row) : null;
}

export async function findByRegistrationId(registrationId: string, db: Db = getPrisma()): Promise<CertificateRecord | null> {
  if (!isUuid(registrationId)) return null;
  const row = await db.certificate.findUnique({ where: { registrationId } });
  return row ? toRecord(row) : null;
}

/** The person's certificates, newest issue first. */
export async function listCertificatesForUser(userId: string, db: Db = getPrisma()): Promise<CertificateRecord[]> {
  const rows = await db.certificate.findMany({ where: { userId }, orderBy: [{ issuedOn: "desc" }, { createdAt: "desc" }] });
  return rows.map(toRecord);
}

/** Renewal history of one certificate (row uuid), oldest first. */
export async function listRenewals(id: string, db: Db = getPrisma()): Promise<RenewalRecord[]> {
  if (!isUuid(id)) return [];
  const rows = await db.certificateRenewal.findMany({ where: { certificateId: id }, orderBy: { createdAt: "asc" } });
  return rows.map((r) => ({
    id: r.id,
    certificateId: r.certificateId,
    orderId: r.orderId,
    feeSettingId: r.feeSettingId,
    previousExpiresOn: dateColumnToIso(r.previousExpiresOn),
    newExpiresOn: dateColumnToIso(r.newExpiresOn),
    amountMinor: Number(r.amountMinor),
    currency: r.currency,
    createdAt: r.createdAt,
  }));
}

export async function countCertificates(db: Db = getPrisma()): Promise<number> {
  return db.certificate.count();
}

/* ------------------------------------------------------------------ public */

/**
 * What the public verification pages may show (R-V1/R-V2) — NOTHING else
 * ever leaves for `/verify`: no email, country, user id, order, row uuid or
 * ID-document field. `status` is computed from the caller's MYT today.
 */
export type PublicCertificateView = {
  certificateId: string;
  holderName: string;
  programmeTitle: string;
  formatName: string;
  completedOn: string;
  issuedOn: string;
  expiresOn: string;
  revoked: boolean;
  status: CertificateStatus;
};

export const PUBLIC_VIEW_KEYS = ["certificateId", "holderName", "programmeTitle", "formatName", "completedOn", "issuedOn", "expiresOn", "revoked", "status"] as const;

export function toPublicView(record: CertificateRecord, today: string): PublicCertificateView {
  return {
    certificateId: record.certificateId,
    holderName: record.holderName,
    programmeTitle: record.programmeTitle,
    formatName: record.formatName,
    completedOn: record.completedOn,
    issuedOn: record.issuedOn,
    expiresOn: record.expiresOn,
    revoked: record.revokedAt !== null,
    status: statusOf(record, today).status,
  };
}

export type NameSearchResult = { items: CertificateRecord[]; truncated: boolean };

/**
 * Public NAME search (requirements §5; E3): LISTED and not revoked only;
 * every query word must be a word-prefix of `holder_name_search` (start of
 * the string, or preceded by a space); at most MAX_NAME_RESULTS, with
 * `truncated` set when more matched. `words` must come from `classifySearch`
 * / `nameWords` so they are normalised the same way as the column.
 * An unlisted holder is unreachable here by construction.
 */
export async function searchListedByName(words: string[], db: Db = getPrisma()): Promise<NameSearchResult> {
  const clean = words.map(normaliseName).filter(Boolean);
  if (clean.length === 0) return { items: [], truncated: false };
  const rows = await db.certificate.findMany({
    where: {
      listed: true,
      revokedAt: null,
      AND: clean.map((w) => ({ OR: [{ holderNameSearch: { startsWith: w } }, { holderNameSearch: { contains: ` ${w}` } }] })),
    },
    orderBy: [{ holderName: "asc" }, { issuedOn: "desc" }],
    take: MAX_NAME_RESULTS + 1,
  });
  return { items: rows.slice(0, MAX_NAME_RESULTS).map(toRecord), truncated: rows.length > MAX_NAME_RESULTS };
}

/* ----------------------------------------------------------------- listing */

/**
 * E3: the holder's opt-in to public name search — default off, revocable at
 * any time, effective immediately. Ownership is checked here, not only in
 * the action. Turning it ON records a consent row (wording version) once;
 * every change writes an audit row. Setting the value it already has does
 * nothing (idempotent resubmits).
 */
export async function setListed(tx: Tx, id: string, userId: string, listed: boolean, now = new Date()): Promise<CertificateRecord> {
  const before = isUuid(id) ? await tx.certificate.findUnique({ where: { id } }) : null;
  if (!before || before.userId !== userId) throw new CertificateNotFoundError(id);
  if (before.listed === listed) return toRecord(before);
  const row = await tx.certificate.update({ where: { id }, data: { listed, listedChangedAt: now } });
  if (listed) {
    await tx.consent.createMany({
      data: [{ userId, documentKey: LISTING_CONSENT_KEY, documentVersion: LISTING_CONSENT_VERSION, acceptedAt: now }],
      skipDuplicates: true,
    });
  }
  await writeAudit(tx, {
    actorUserId: userId,
    action: "certificate.listing_changed",
    entityType: "certificate",
    entityId: id,
    before: { listed: before.listed },
    after: { listed: row.listed, consentVersion: listed ? LISTING_CONSENT_VERSION : undefined },
  });
  return toRecord(row);
}

/* ------------------------------------------------------------------- admin */

const REASON_MIN = 3;
const REASON_MAX = 500;
const NAME_MIN = 2;
const NAME_MAX = 200;
// eslint-disable-next-line no-control-regex
const CONTROL_RE = /[ --]/;

/** E8: revoked is a distinct, permanent state (reason, actor, time; audited).
 *  The row never disappears — it verifies as "Revoked". */
export async function revokeCertificate(tx: Tx, id: string, adminUserId: string, reason: string, now = new Date()): Promise<CertificateRecord> {
  const trimmed = reason.replace(/\s+/g, " ").trim();
  if (trimmed.length < REASON_MIN || trimmed.length > REASON_MAX || CONTROL_RE.test(trimmed)) {
    throw new CertificateValidationError({ reason: `Give a reason of ${REASON_MIN} to ${REASON_MAX} characters.` });
  }
  const before = isUuid(id) ? await tx.certificate.findUnique({ where: { id } }) : null;
  if (!before) throw new CertificateNotFoundError(id);
  if (before.revokedAt) throw new CertificateStateError("already_revoked", `Certificate ${before.certificateId} was revoked on ${before.revokedAt.toISOString()}.`);
  const row = await tx.certificate.update({
    where: { id },
    data: { revokedAt: now, revokedByUserId: adminUserId, revocationReason: trimmed },
  });
  await writeAudit(tx, {
    actorUserId: adminUserId,
    action: "certificate.revoked",
    entityType: "certificate",
    entityId: id,
    before: { revokedAt: null },
    after: { revokedAt: now.toISOString(), certificateId: row.certificateId },
    reason: trimmed,
  });
  return toRecord(row);
}

/** E8: name correction by an administrator only — same ID, audited. Keeps
 *  the search column in step. A name equal to the current one is a no-op. */
export async function correctHolderName(tx: Tx, id: string, adminUserId: string, newName: string): Promise<CertificateRecord> {
  const holderName = newName.replace(/\s+/g, " ").trim();
  if (holderName.length < NAME_MIN || holderName.length > NAME_MAX || CONTROL_RE.test(holderName)) {
    throw new CertificateValidationError({ holderName: `Enter the holder's name (${NAME_MIN} to ${NAME_MAX} characters).` });
  }
  const before = isUuid(id) ? await tx.certificate.findUnique({ where: { id } }) : null;
  if (!before) throw new CertificateNotFoundError(id);
  if (before.holderName === holderName) return toRecord(before);
  const row = await tx.certificate.update({ where: { id }, data: { holderName, holderNameSearch: normaliseName(holderName) } });
  await writeAudit(tx, {
    actorUserId: adminUserId,
    action: "certificate.name_corrected",
    entityType: "certificate",
    entityId: id,
    before: { holderName: before.holderName },
    after: { holderName: row.holderName },
  });
  return toRecord(row);
}

export type AdminCertificateItem = CertificateRecord & {
  /** Admin only — never reaches a public page. */
  userEmail: string;
  userName: string;
  offeringStartsOn: string;
  offeringEndsOn: string;
  status: CertificateStatus;
  days: number;
};

export type AdminCertificateFilters = {
  /** Printed ID (any form), part of a holder name, or part of an email. */
  q?: string;
  status?: CertificateStatus;
  page?: number;
  pageSize?: number;
};

export type AdminCertificatePage = { items: AdminCertificateItem[]; total: number; page: number; pageSize: number; pageCount: number; today: string };

export const ADMIN_PAGE_SIZE = 25;

const adminInclude = {
  user: { select: { email: true, name: true } },
  offering: { select: { startsOn: true, endsOn: true } },
} as const;

type AdminRow = Row & { user: { email: string; name: string }; offering: { startsOn: Date; endsOn: Date } };

function toAdminItem(r: AdminRow, today: string): AdminCertificateItem {
  const record = toRecord(r);
  const { status, days } = statusOf(record, today);
  return {
    ...record,
    userEmail: r.user.email,
    userName: r.user.name,
    offeringStartsOn: dateColumnToIso(r.offering.startsOn),
    offeringEndsOn: dateColumnToIso(r.offering.endsOn),
    status,
    days,
  };
}

/** The status filter as date predicates against today's MYT date — the same
 *  boundaries `statusOf` applies, so the list and the chip always agree. */
function statusWhere(status: CertificateStatus, today: string) {
  const t = isoToDateColumn(today);
  const windowEnd = isoToDateColumn(addDays(today, 30));
  switch (status) {
    case "revoked":
      return { revokedAt: { not: null } };
    case "expired":
      return { revokedAt: null, expiresOn: { lt: t } };
    case "renewal_due":
      return { revokedAt: null, expiresOn: { gte: t, lte: windowEnd } };
    case "active":
      return { revokedAt: null, expiresOn: { gt: windowEnd } };
  }
}

export async function listCertificatesForAdmin(filters: AdminCertificateFilters = {}, now = new Date(), db: Db = getPrisma()): Promise<AdminCertificatePage> {
  const today = todayIso(now);
  const pageSize = Math.min(Math.max(filters.pageSize ?? ADMIN_PAGE_SIZE, 1), 100);
  const page = Math.max(filters.page ?? 1, 1);
  const q = filters.q?.trim();
  const id = q ? normaliseId(q) : null;
  const nameQ = q ? normaliseName(q) : "";
  const where = {
    ...(filters.status ? statusWhere(filters.status, today) : {}),
    ...(q
      ? {
          OR: [
            ...(id ? [{ certificateId: id }] : []),
            ...(nameQ ? [{ holderNameSearch: { contains: nameQ } }] : []),
            { user: { email: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };
  const [total, rows] = await Promise.all([
    db.certificate.count({ where }),
    db.certificate.findMany({ where, orderBy: [{ issuedOn: "desc" }, { createdAt: "desc" }], skip: (page - 1) * pageSize, take: pageSize, include: adminInclude }),
  ]);
  return { items: rows.map((r) => toAdminItem(r, today)), total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)), today };
}

/** One certificate for the admin detail page (row uuid). */
export async function getCertificateForAdmin(id: string, now = new Date(), db: Db = getPrisma()): Promise<AdminCertificateItem | null> {
  if (!isUuid(id)) return null;
  const r = await db.certificate.findUnique({ where: { id }, include: adminInclude });
  return r ? toAdminItem(r, todayIso(now)) : null;
}
