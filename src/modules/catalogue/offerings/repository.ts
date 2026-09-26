import type { Db, Tx } from "@/db/prisma";
import { getPrisma } from "@/db/prisma";
import { writeAudit } from "@/modules/platform/audit/repository";

/*
 * Scheduled offerings — the dated instances a person registers for
 * (ADR-043). Public pages show only what is genuinely scheduled; with no
 * rows they render a first-class "no dates yet" state (DR-02 §4.1: never an
 * invented date). Nothing is seeded: every offering is created by an
 * administrator through /admin/offerings (M4 plan §2 item 2), which is the
 * only write path — `createOffering` / `updateOffering` below, each writing
 * its audit row in the caller's transaction (ADR-022).
 *
 * Capacity is displayed here and ENFORCED by the checkout service (module
 * commerce), which counts confirmed registrations + unexpired pending orders.
 */

import {
  DEFAULT_TIMEZONE,
  DELIVERY_MODALITIES,
  OFFERING_STATUSES,
  type DeliveryModality,
  type OfferingStatus,
} from "./constants";

// Pure vocabulary lives in ./constants (no DB import — safe for client
// components); re-exported here so server code keeps one import path.
export * from "./constants";

export type OfferingRecord = {
  id: string;
  programmeId: string;
  programmeSlug: string;
  programmeTitle: string;
  deliveryFormatId: string | null;
  format: { code: string; name: string; badge: string | null; durationLabel: string; scheduleLabel: string; totalTimeLabel: string } | null;
  modality: DeliveryModality;
  location: string | null;
  timezone: string;
  startsOn: Date;
  endsOn: Date;
  scheduleNote: string | null;
  capacity: number | null;
  status: OfferingStatus;
  leadExpertId: string | null;
  leadExpertName: string | null;
};

/** An offering as the admin list shows it: the record plus live seat counts. */
export type AdminOfferingRecord = OfferingRecord & {
  /** `registrations` with status `confirmed`. */
  confirmedCount: number;
  /** `orders` with status `pending` whose hold has not yet expired. */
  pendingCount: number;
};

const include = {
  programme: { select: { slug: true, title: true } },
  deliveryFormat: { select: { code: true, name: true, badge: true, durationLabel: true, scheduleLabel: true, totalTimeLabel: true } },
  leadExpert: { select: { name: true } },
} as const;

type Row = NonNullable<Awaited<ReturnType<typeof loadById>>>;

function loadById(db: Db, id: string) {
  return db.scheduledOffering.findUnique({ where: { id }, include });
}

function toRecord(r: Row): OfferingRecord {
  return {
    id: r.id,
    programmeId: r.programmeId,
    programmeSlug: r.programme.slug,
    programmeTitle: r.programme.title,
    deliveryFormatId: r.deliveryFormatId,
    format: r.deliveryFormat,
    modality: r.modality,
    location: r.location,
    timezone: r.timezone,
    startsOn: r.startsOn,
    endsOn: r.endsOn,
    scheduleNote: r.scheduleNote,
    capacity: r.capacity,
    status: r.status,
    leadExpertId: r.leadExpertId,
    leadExpertName: r.leadExpert?.name ?? null,
  };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

/** Any status, including private cohorts — for checkout, admin and tests.
 *  A malformed id is simply "not found" rather than a database error. */
export async function findOfferingById(id: string, db: Db = getPrisma()): Promise<OfferingRecord | null> {
  if (!isUuid(id)) return null;
  const row = await loadById(db, id);
  return row ? toRecord(row) : null;
}

/** Public, upcoming offerings: planned/open/full, not yet ended, not
 *  private cohorts, and (Milestone 12) only of PUBLISHED trainings — a
 *  draft's dates are never public. Optionally for one programme. */
export async function listUpcomingPublicOfferings(programmeId?: string, db: Db = getPrisma()): Promise<OfferingRecord[]> {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const rows = await db.scheduledOffering.findMany({
    where: {
      ...(programmeId ? { programmeId } : {}),
      programme: { status: "published" },
      status: { in: ["planned", "open", "full"] },
      endsOn: { gte: today },
      organisationId: null,
    },
    orderBy: { startsOn: "asc" },
    include,
  });
  return rows.map(toRecord);
}

/** Every offering, any status, newest start first — the admin list.
 *  Milestone 12: a Trainer's list is limited to the trainings linked to
 *  their profile (`programmeIds`); an administrator passes nothing. */
export async function listAllOfferings(db: Db = getPrisma(), programmeIds?: string[]): Promise<AdminOfferingRecord[]> {
  const now = new Date();
  const rows = await db.scheduledOffering.findMany({
    where: programmeIds ? { programmeId: { in: programmeIds } } : undefined,
    orderBy: [{ startsOn: "desc" }, { createdAt: "desc" }],
    include: {
      ...include,
      _count: {
        select: {
          registrations: { where: { status: "confirmed" } },
          // M6: renewal orders carry the offering id but hold no seat.
          orders: { where: { kind: "registration", status: "pending", expiresAt: { gt: now } } },
        },
      },
    },
  });
  return rows.map((r) => ({
    ...toRecord(r),
    confirmedCount: r._count.registrations,
    pendingCount: r._count.orders,
  }));
}

/* ------------------------------------------------------------------ writes */

export type OfferingWriteInput = {
  programmeId: string;
  /** Must belong to `programmeId`; null = no specific format. */
  deliveryFormatId: string | null;
  modality: DeliveryModality;
  location: string | null;
  /** IANA zone; defaults to Asia/Kuala_Lumpur when blank. */
  timezone: string;
  /** Calendar date, YYYY-MM-DD. */
  startsOn: string;
  /** Calendar date, YYYY-MM-DD; not before `startsOn`. */
  endsOn: string;
  /** null = not published; otherwise an integer ≥ 1. */
  capacity: number | null;
  status: OfferingStatus;
  scheduleNote: string | null;
  leadExpertId: string | null;
};

export type OfferingField = keyof OfferingWriteInput;
export type OfferingFieldErrors = Partial<Record<OfferingField, string>>;

/** Thrown by the write functions when the input is not acceptable. Carries
 *  one message per offending field so a form can highlight them. */
export class OfferingValidationError extends Error {
  readonly fieldErrors: OfferingFieldErrors;
  constructor(fieldErrors: OfferingFieldErrors) {
    super(`Offering validation failed: ${Object.keys(fieldErrors).join(", ")}`);
    this.name = "OfferingValidationError";
    this.fieldErrors = fieldErrors;
  }
}

const LOCATION_MAX = 200;
const NOTE_MAX = 500;
const CAPACITY_MAX = 10_000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** A YYYY-MM-DD string as the UTC midnight Date a `@db.Date` column stores;
 *  null when the string is not a real calendar date. */
export function parseCalendarDate(value: string): Date | null {
  if (!DATE_RE.test(value)) return null;
  const d = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== value ? null : d;
}

function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-GB", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** Pure checks — shape, ranges, ordering. Referential checks (programme,
 *  format, expert) need the database and happen in `validateReferences`. */
function validateShape(input: OfferingWriteInput): OfferingFieldErrors {
  const errors: OfferingFieldErrors = {};
  if (!isUuid(input.programmeId)) errors.programmeId = "Choose a programme.";
  if (input.deliveryFormatId !== null && !isUuid(input.deliveryFormatId)) errors.deliveryFormatId = "Choose a valid format.";
  if (!DELIVERY_MODALITIES.includes(input.modality)) errors.modality = "Choose how this offering is delivered.";
  if (!OFFERING_STATUSES.includes(input.status)) errors.status = "Choose a status.";
  if (input.location !== null && input.location.length > LOCATION_MAX) errors.location = `Use at most ${LOCATION_MAX} characters.`;
  if (input.scheduleNote !== null && input.scheduleNote.length > NOTE_MAX) errors.scheduleNote = `Use at most ${NOTE_MAX} characters.`;
  if (!input.timezone || !isValidTimezone(input.timezone)) errors.timezone = "Enter a valid time zone, e.g. Asia/Kuala_Lumpur.";
  const starts = parseCalendarDate(input.startsOn);
  const ends = parseCalendarDate(input.endsOn);
  if (!starts) errors.startsOn = "Enter the first day as a date.";
  if (!ends) errors.endsOn = "Enter the last day as a date.";
  if (starts && ends && ends.getTime() < starts.getTime()) errors.endsOn = "The last day cannot be before the first day.";
  if (input.capacity !== null && (!Number.isInteger(input.capacity) || input.capacity < 1 || input.capacity > CAPACITY_MAX)) {
    errors.capacity = `Capacity must be a whole number from 1 to ${CAPACITY_MAX}, or left blank.`;
  }
  if (input.leadExpertId !== null && !isUuid(input.leadExpertId)) errors.leadExpertId = "Choose a valid expert.";
  return errors;
}

async function validateReferences(db: Db, input: OfferingWriteInput, errors: OfferingFieldErrors): Promise<void> {
  if (!errors.programmeId) {
    const programme = await db.programme.findUnique({ where: { id: input.programmeId }, select: { id: true } });
    if (!programme) errors.programmeId = "That programme does not exist.";
  }
  if (!errors.deliveryFormatId && input.deliveryFormatId !== null) {
    const format = await db.deliveryFormat.findUnique({ where: { id: input.deliveryFormatId }, select: { programmeId: true } });
    if (!format) errors.deliveryFormatId = "That format does not exist.";
    else if (format.programmeId !== input.programmeId) errors.deliveryFormatId = "That format belongs to a different programme.";
  }
  if (!errors.leadExpertId && input.leadExpertId !== null) {
    const expert = await db.expert.findUnique({ where: { id: input.leadExpertId }, select: { id: true } });
    if (!expert) errors.leadExpertId = "That expert does not exist.";
  }
}

function normalise(input: OfferingWriteInput): OfferingWriteInput {
  const trimOrNull = (v: string | null) => {
    const t = v?.trim() ?? "";
    return t.length ? t : null;
  };
  return {
    programmeId: input.programmeId.trim(),
    deliveryFormatId: trimOrNull(input.deliveryFormatId),
    modality: input.modality,
    location: trimOrNull(input.location),
    timezone: input.timezone.trim() || DEFAULT_TIMEZONE,
    startsOn: input.startsOn.trim(),
    endsOn: input.endsOn.trim(),
    capacity: input.capacity,
    status: input.status,
    scheduleNote: trimOrNull(input.scheduleNote),
    leadExpertId: trimOrNull(input.leadExpertId),
  };
}

async function validate(db: Db, raw: OfferingWriteInput): Promise<OfferingWriteInput> {
  const input = normalise(raw);
  const errors = validateShape(input);
  await validateReferences(db, input, errors);
  if (Object.keys(errors).length) throw new OfferingValidationError(errors);
  return input;
}

/** The columns an administrator sets, as stored — what the audit row records. */
function auditSnapshot(r: OfferingRecord): Record<string, unknown> {
  return {
    programmeId: r.programmeId,
    deliveryFormatId: r.deliveryFormatId,
    modality: r.modality,
    location: r.location,
    timezone: r.timezone,
    startsOn: r.startsOn.toISOString().slice(0, 10),
    endsOn: r.endsOn.toISOString().slice(0, 10),
    capacity: r.capacity,
    status: r.status,
    scheduleNote: r.scheduleNote,
    leadExpertId: r.leadExpertId,
  };
}

function toColumns(input: OfferingWriteInput) {
  return {
    programmeId: input.programmeId,
    deliveryFormatId: input.deliveryFormatId,
    modality: input.modality,
    location: input.location,
    timezone: input.timezone,
    startsOn: parseCalendarDate(input.startsOn)!,
    endsOn: parseCalendarDate(input.endsOn)!,
    capacity: input.capacity,
    status: input.status,
    scheduleNote: input.scheduleNote,
    leadExpertId: input.leadExpertId,
  };
}

/** Creates an offering and its `offering.created` audit row in `tx`.
 *  Throws `OfferingValidationError` when the input is not acceptable. */
export async function createOffering(tx: Tx, rawInput: OfferingWriteInput, actorUserId: string): Promise<OfferingRecord> {
  const input = await validate(tx, rawInput);
  const created = await tx.scheduledOffering.create({ data: toColumns(input), include });
  const record = toRecord(created);
  await writeAudit(tx, {
    actorUserId,
    action: "offering.created",
    entityType: "offering",
    entityId: record.id,
    before: null,
    after: auditSnapshot(record),
  });
  return record;
}

/** Applies `patch` over the stored values, validates the result as a whole,
 *  and writes `offering.updated` with the fields that changed. Returns null
 *  when no offering has that id. A patch that changes nothing writes nothing. */
export async function updateOffering(
  tx: Tx,
  id: string,
  patch: Partial<OfferingWriteInput>,
  actorUserId: string,
): Promise<OfferingRecord | null> {
  const existing = await findOfferingById(id, tx);
  if (!existing) return null;
  const current: OfferingWriteInput = {
    programmeId: existing.programmeId,
    deliveryFormatId: existing.deliveryFormatId,
    modality: existing.modality,
    location: existing.location,
    timezone: existing.timezone,
    startsOn: existing.startsOn.toISOString().slice(0, 10),
    endsOn: existing.endsOn.toISOString().slice(0, 10),
    capacity: existing.capacity,
    status: existing.status,
    scheduleNote: existing.scheduleNote,
    leadExpertId: existing.leadExpertId,
  };
  const merged = await validate(tx, { ...current, ...definedOnly(patch) });

  const before = auditSnapshot(existing);
  const changedBefore: Record<string, unknown> = {};
  const changedAfter: Record<string, unknown> = {};
  for (const key of Object.keys(merged) as OfferingField[]) {
    if (before[key] !== merged[key]) {
      changedBefore[key] = before[key];
      changedAfter[key] = merged[key];
    }
  }
  if (Object.keys(changedAfter).length === 0) return existing;

  const updated = await tx.scheduledOffering.update({ where: { id }, data: toColumns(merged), include });
  const record = toRecord(updated);
  await writeAudit(tx, {
    actorUserId,
    action: "offering.updated",
    entityType: "offering",
    entityId: record.id,
    before: changedBefore,
    after: changedAfter,
  });
  return record;
}

/** `{ a: undefined }` spread over a full object would blank `a`; drop those keys. */
function definedOnly<T extends object>(patch: T): Partial<T> {
  const out: Partial<T> = {};
  for (const [k, v] of Object.entries(patch)) if (v !== undefined) (out as Record<string, unknown>)[k] = v;
  return out;
}
