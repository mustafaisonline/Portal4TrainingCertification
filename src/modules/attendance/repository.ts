import { countryName } from "@/content/countries";
import type { Db, Tx } from "@/db/prisma";
import { getPrisma } from "@/db/prisma";
import { findOfferingById, isUuid, type OfferingRecord } from "@/modules/catalogue/offerings/repository";
import { scopeWhere, type TrainingScope } from "@/modules/catalogue/programmes/admin.repository";
import { dateColumnToIso, todayIso } from "@/modules/certificates/dates";
import { writeAudit } from "@/modules/platform/audit/repository";

/*
 * Attendance — Milestone 13 (MILESTONE_13_EXECUTION_PLAN.md §3 WP4; founder
 * decision 9; §4 approved 2026-09-27).
 *
 * One `attendance_records` row per CONFIRMED registration holds the current
 * answer (Yes / No), who saved it and when (`updated_at` — the founder's
 * "UpdateDate"). Every save that changes a value writes `attendance.recorded`
 * with the before/after, so the history is in the audit log and this table
 * never needs a history of its own. Scope: an administrator sees every date;
 * a Trainer (N7) only the dates of trainings linked to their profile — the
 * same `TrainingScope` Milestone 12 uses, re-checked on every read and write.
 */

export type AttendanceOfferingRow = {
  offering: OfferingRecord;
  /** Registrations with status `confirmed` — the rows on the sheet. */
  confirmedCount: number;
  /** How many of those have an answer saved. */
  recordedCount: number;
  /** The date is running today (MYT calendar day within starts..ends). */
  isToday: boolean;
  hasEnded: boolean;
};

export type AttendanceSheetRow = {
  registrationId: string;
  user: { id: string; name: string; email: string };
  /** The profile's legal name when set; otherwise the account name. */
  displayName: string;
  /** YYYY-MM-DD or null — shown to the administrator on the sheet (N5 a). */
  dateOfBirth: string | null;
  /** Country NAME from the profile's ISO code, else the account's country. */
  country: string | null;
  attended: boolean | null;
  note: string | null;
  updatedAt: Date | null;
  recordedBy: { name: string } | null;
};

export type AttendanceSheet = {
  offering: OfferingRecord;
  today: string;
  isToday: boolean;
  hasEnded: boolean;
  rows: AttendanceSheetRow[];
};

function dayState(offering: { startsOn: Date; endsOn: Date }, today: string): { isToday: boolean; hasEnded: boolean } {
  const starts = dateColumnToIso(offering.startsOn);
  const ends = dateColumnToIso(offering.endsOn);
  return { isToday: starts <= today && today <= ends, hasEnded: ends < today };
}

/**
 * Every date in scope that has at least one confirmed registration — there is
 * nothing to record on an empty sheet — soonest first, ended dates last.
 */
export async function listAttendanceOfferings(scope: TrainingScope, now = new Date(), db: Db = getPrisma()): Promise<AttendanceOfferingRow[]> {
  const today = todayIso(now);
  const rows = await db.scheduledOffering.findMany({
    where: { programme: scopeWhere(scope), registrations: { some: { status: "confirmed" } } },
    orderBy: [{ startsOn: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      registrations: { where: { status: "confirmed" }, select: { attendance: { select: { id: true } } } },
    },
  });
  const out: AttendanceOfferingRow[] = [];
  for (const r of rows) {
    const offering = await findOfferingById(r.id, db);
    if (!offering) continue;
    out.push({
      offering,
      confirmedCount: r.registrations.length,
      recordedCount: r.registrations.filter((reg) => reg.attendance !== null).length,
      ...dayState(offering, today),
    });
  }
  // Running and upcoming dates first (soonest first), ended dates after them
  // (most recent first) — the administrator opens the sheet for today.
  const live = out.filter((o) => !o.hasEnded);
  const ended = out.filter((o) => o.hasEnded).reverse();
  return [...live, ...ended];
}

/** The sheet for one date, or null when the offering does not exist or is
 *  outside the caller's scope (the page answers 404 either way — a Trainer
 *  learns nothing about another trainer's dates). */
export async function getAttendanceSheet(offeringId: string, scope: TrainingScope, now = new Date(), db: Db = getPrisma()): Promise<AttendanceSheet | null> {
  if (!isUuid(offeringId)) return null;
  const offering = await findOfferingById(offeringId, db);
  if (!offering) return null;
  if (scope.kind === "expert") {
    const allowed = await db.programme.count({ where: { id: offering.programmeId, ...scopeWhere(scope) } });
    if (allowed === 0) return null;
  }
  const today = todayIso(now);
  const regs = await db.registration.findMany({
    where: { offeringId, status: "confirmed" },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          country: true,
          profile: { select: { legalName: true, dateOfBirth: true, countryCode: true } },
        },
      },
      attendance: { select: { attended: true, note: true, updatedAt: true, recordedBy: { select: { name: true } } } },
    },
  });
  const rows = regs.map((r): AttendanceSheetRow => ({
    registrationId: r.id,
    user: { id: r.user.id, name: r.user.name, email: r.user.email },
    displayName: r.user.profile?.legalName?.trim() || r.user.name,
    dateOfBirth: r.user.profile?.dateOfBirth ? dateColumnToIso(r.user.profile.dateOfBirth) : null,
    country: (r.user.profile?.countryCode ? countryName(r.user.profile.countryCode) : null) ?? r.user.country ?? null,
    attended: r.attendance?.attended ?? null,
    note: r.attendance?.note ?? null,
    updatedAt: r.attendance?.updatedAt ?? null,
    recordedBy: r.attendance?.recordedBy ?? null,
  }));
  return { offering, today, rows, ...dayState(offering, today) };
}

/** The person's own answers, registration id → attended (M13: My Trainings
 *  and the training detail page show what was recorded). */
export async function attendanceForUser(userId: string, db: Db = getPrisma()): Promise<Map<string, { attended: boolean; updatedAt: Date }>> {
  const rows = await db.attendanceRecord.findMany({
    where: { registration: { userId } },
    select: { registrationId: true, attended: true, updatedAt: true },
  });
  return new Map(rows.map((r) => [r.registrationId, { attended: r.attended, updatedAt: r.updatedAt }]));
}

export type AttendanceEntry = {
  registrationId: string;
  /** null = no answer given for this row on this save: the existing record,
   *  if any, is left exactly as it is. */
  attended: boolean | null;
  note: string | null;
};

export type SaveAttendanceResult = {
  /** Rows that had an answer on this save. */
  answered: number;
  /** Rows whose stored value or note actually changed (each audited). */
  changed: number;
};

export class AttendanceError extends Error {
  constructor(
    readonly reason: "offering_not_found" | "registration_not_on_offering" | "note_too_long",
    message: string,
  ) {
    super(message);
    this.name = "AttendanceError";
  }
}

export const ATTENDANCE_NOTE_MAX = 200;

/**
 * Save the sheet for one date in the caller's transaction. Every entry is
 * checked to be a CONFIRMED registration of THIS offering (a form cannot
 * write to another date's rows); each row is upserted; a change writes one
 * `attendance.recorded` audit row with the before/after. Idempotent: saving
 * the same answers again changes nothing and audits nothing.
 */
export async function saveAttendance(
  tx: Tx,
  input: { offeringId: string; actorUserId: string; entries: AttendanceEntry[]; scope: TrainingScope },
): Promise<SaveAttendanceResult> {
  if (!isUuid(input.offeringId)) throw new AttendanceError("offering_not_found", `Offering ${input.offeringId} does not exist.`);
  const offering = await tx.scheduledOffering.findFirst({
    where: { id: input.offeringId, programme: scopeWhere(input.scope) },
    select: { id: true },
  });
  if (!offering) throw new AttendanceError("offering_not_found", `Offering ${input.offeringId} does not exist or is outside the caller's scope.`);

  const confirmed = await tx.registration.findMany({
    where: { offeringId: offering.id, status: "confirmed" },
    select: { id: true, attendance: { select: { attended: true, note: true } } },
  });
  const byId = new Map(confirmed.map((r) => [r.id, r.attendance]));

  let answered = 0;
  let changed = 0;
  for (const entry of input.entries) {
    if (entry.attended === null) continue;
    if (!byId.has(entry.registrationId)) {
      throw new AttendanceError("registration_not_on_offering", `Registration ${entry.registrationId} is not a confirmed registration of offering ${offering.id}.`);
    }
    const note = entry.note?.trim() || null;
    if (note && note.length > ATTENDANCE_NOTE_MAX) {
      throw new AttendanceError("note_too_long", `Note for registration ${entry.registrationId} exceeds ${ATTENDANCE_NOTE_MAX} characters.`);
    }
    answered += 1;
    const before = byId.get(entry.registrationId) ?? null;
    if (before && before.attended === entry.attended && (before.note ?? null) === note) continue;

    await tx.attendanceRecord.upsert({
      where: { registrationId: entry.registrationId },
      create: { registrationId: entry.registrationId, attended: entry.attended, note, recordedByUserId: input.actorUserId },
      update: { attended: entry.attended, note, recordedByUserId: input.actorUserId },
    });
    await writeAudit(tx, {
      actorUserId: input.actorUserId,
      action: "attendance.recorded",
      entityType: "registration",
      entityId: entry.registrationId,
      before: before ? { attended: before.attended, note: before.note } : null,
      after: { attended: entry.attended, note, offeringId: offering.id },
    });
    changed += 1;
  }
  return { answered, changed };
}
