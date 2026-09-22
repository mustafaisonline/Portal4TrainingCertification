import { CERTIFICATE_TIMEZONE } from "./constants";

/*
 * Calendar-date helpers for certificates (M6 plan §3 E5/E6; requirements
 * §4). Pure: no database, no libraries, no clock reads — callers pass `now`.
 *
 * Two kinds of value exist and must never be confused:
 *   - an INSTANT (`Date`) — issued_at-style timestamps, `revoked_at`, `now`;
 *   - a CALENDAR DATE (`"YYYY-MM-DD"` string) — `completed_on`, `issued_on`,
 *     `expires_on`, the offering's `starts_on` / `ends_on`.
 *
 * THE ONE CONVENTION for Prisma `@db.Date` columns: a calendar date is stored
 * as the UTC-midnight `Date` of that day (`isoToDateColumn`) and read back
 * with `dateColumnToIso` (UTC). The same convention the offerings repository
 * uses (`parseCalendarDate`), so a certificate's dates and its offering's
 * dates compare as strings. "Today" for every certificate rule is the
 * calendar date in Asia/Kuala_Lumpur (`todayIso`), never the server's zone.
 *
 * This file is allowed in client components (boundaries test: `dates`), so
 * it must stay free of server imports.
 */

const DAY_MS = 86_400_000;
const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: string): boolean {
  if (!ISO_RE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

function parts(iso: string): [number, number, number] {
  const [y, m, d] = iso.split("-").map(Number);
  return [y!, m!, d!];
}

function toUtcMs(iso: string): number {
  const [y, m, d] = parts(iso);
  return Date.UTC(y, m - 1, d);
}

function fromUtcMs(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** The calendar date at instant `now` in `tz` (default MYT), as YYYY-MM-DD. */
export function todayIso(now: Date, tz: string = CERTIFICATE_TIMEZONE): string {
  const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" });
  const p = fmt.formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) => p.find((x) => x.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Calendar-month arithmetic clamped to month end: 31 Jan + 1 → 28/29 Feb,
 *  29 Feb + 12 → 28 Feb — never a spill into the next month (E5). */
export function addMonths(iso: string, months: number): string {
  const [y, m, d] = parts(iso);
  const total = y * 12 + (m - 1) + months;
  const ty = Math.floor(total / 12);
  const tm = total - ty * 12; // 0-based
  const lastDay = new Date(Date.UTC(ty, tm + 1, 0)).getUTCDate();
  return fromUtcMs(Date.UTC(ty, tm, Math.min(d, lastDay)));
}

export function addDays(iso: string, days: number): string {
  return fromUtcMs(toUtcMs(iso) + days * DAY_MS);
}

/** Whole calendar days from `a` to `b` (positive when `b` is later). */
export function daysBetween(aIso: string, bIso: string): number {
  return Math.round((toUtcMs(bIso) - toUtcMs(aIso)) / DAY_MS);
}

/** A calendar date as the value written to a `@db.Date` column. */
export function isoToDateColumn(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

/** A `@db.Date` column value as a calendar date. */
export function dateColumnToIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const enGb = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/** "22 Sep 2026" — how every certificate page prints a calendar date. */
export function formatCalendarDate(iso: string): string {
  return enGb.format(isoToDateColumn(iso));
}

/**
 * A wall-clock time typed into `<input type="datetime-local">`
 * ("2026-09-22T10:30") read as a time IN `tz` and returned as the UTC
 * instant. Used for the fee's `effective_from`: an administrator states the
 * time in the certificate zone (E6). Null when the value is not parseable.
 */
export function zonedLocalToInstant(value: string, tz: string = CERTIFICATE_TIMEZONE): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value.trim());
  if (!m) {
    const direct = new Date(value);
    // An ISO string that carries its own offset or Z is already an instant.
    return /([zZ]|[+-]\d{2}:?\d{2})$/.test(value.trim()) && !Number.isNaN(direct.getTime()) ? direct : null;
  }
  const [, y, mo, d, h, mi, s] = m;
  const wall = Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s ?? 0));
  if (Number.isNaN(wall)) return null;
  // Offset of `tz` at (about) that instant; a second pass settles the rare
  // case where the first guess straddles a transition (MYT has none).
  let guess = wall - offsetMs(tz, new Date(wall));
  guess = wall - offsetMs(tz, new Date(guess));
  return new Date(guess);
}

function offsetMs(tz: string, at: Date): number {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const p = fmt.formatToParts(at);
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(p.find((x) => x.type === type)?.value ?? "0");
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - Math.floor(at.getTime() / 1000) * 1000;
}
