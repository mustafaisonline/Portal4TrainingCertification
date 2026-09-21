/*
 * Calendar-date formatting for offerings. `starts_on` / `ends_on` are date
 * columns (no time), stored as UTC midnight, so they are formatted in UTC:
 * the stored day is the day shown regardless of the server's timezone. Same
 * rules as the schedule page's formatter (en-GB, "1 – 12 Mar 2027").
 */

const dayMonth = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const dayMonthYear = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const dateTime = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC" });

export function formatCalendarDate(d: Date): string {
  return dayMonthYear.format(d);
}

export function formatDateRange(startsOn: Date, endsOn: Date): string {
  if (startsOn.getTime() === endsOn.getTime()) return dayMonthYear.format(startsOn);
  const sameYear = startsOn.getUTCFullYear() === endsOn.getUTCFullYear();
  return `${sameYear ? dayMonth.format(startsOn) : dayMonthYear.format(startsOn)} – ${dayMonthYear.format(endsOn)}`;
}

/** A timestamp (order placed, paid) — shown in UTC with the zone named. */
export function formatTimestamp(d: Date): string {
  return `${dateTime.format(d)} UTC`;
}
