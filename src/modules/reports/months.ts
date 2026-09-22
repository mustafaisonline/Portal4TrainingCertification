import { CERTIFICATE_TIMEZONE } from "@/modules/certificates/constants";
import { zonedLocalToInstant } from "@/modules/certificates/dates";

/*
 * Calendar months for the reports (Milestone 8 plan §3 G5: "reports use MYT
 * calendar months"). A month is named `YYYY-MM` and its boundaries are the
 * local midnights in Asia/Kuala_Lumpur, converted to instants with the same
 * helper the certificate fee screen uses. Pure: callers pass `now`.
 */

export const REPORT_TIMEZONE = CERTIFICATE_TIMEZONE;

const MONTH_RE = /^(\d{4})-(\d{2})$/;

export function isMonthKey(value: string): boolean {
  const m = MONTH_RE.exec(value);
  if (!m) return false;
  const month = Number(m[2]);
  return month >= 1 && month <= 12;
}

/** `YYYY-MM` of the instant in `tz`. */
export function monthKeyOf(instant: Date, tz: string = REPORT_TIMEZONE): string {
  const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: tz, year: "numeric", month: "2-digit" });
  const p = fmt.formatToParts(instant);
  const get = (type: Intl.DateTimeFormatPartTypes) => p.find((x) => x.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}`;
}

export function currentMonthKey(now: Date, tz: string = REPORT_TIMEZONE): string {
  return monthKeyOf(now, tz);
}

function nextMonthKey(key: string): string {
  const [y, m] = key.split("-").map(Number) as [number, number];
  const total = y * 12 + (m - 1) + 1;
  const ny = Math.floor(total / 12);
  const nm = total - ny * 12 + 1;
  return `${ny}-${String(nm).padStart(2, "0")}`;
}

/** Half-open instant range `[start, end)` of the month in `tz`. */
export function monthRange(key: string, tz: string = REPORT_TIMEZONE): { start: Date; end: Date } {
  if (!isMonthKey(key)) throw new Error(`not a month key: ${key}`);
  const start = zonedLocalToInstant(`${key}-01T00:00`, tz);
  const end = zonedLocalToInstant(`${nextMonthKey(key)}-01T00:00`, tz);
  if (!start || !end) throw new Error(`month range unavailable for ${key}`);
  return { start, end };
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

/** "Sep 2026" for `2026-09`. Fixed names rather than Intl: ICU versions
 *  disagree on the en-GB short form of September ("Sep" vs "Sept"). */
export function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number) as [number, number];
  return `${MONTH_NAMES[m - 1] ?? key} ${y}`;
}
