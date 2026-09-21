/*
 * Calendar-date presentation for offerings. `starts_on` / `ends_on` are
 * `@db.Date` columns read back as UTC midnight, so they are always formatted
 * in UTC: the stored day is the day shown whatever the server's zone.
 */

const enGb: Intl.DateTimeFormatOptions = { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" };

/** e.g. "3 Nov 2026" */
export function formatCalendarDate(date: Date): string {
  return date.toLocaleDateString("en-GB", enGb);
}

/** The `YYYY-MM-DD` value an `<input type="date">` takes. */
export function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}
