/*
 * The founder's refund rule (M4 plan §3 D2) as ONE pure function, used by the
 * UI (to show what a cancellation returns today), by the cancellation service
 * (to issue it) and quoted in the published policy at /refund-policy
 * (§6 commitment 4):
 *
 *   ≥ 14 calendar days before the start date → 100 %
 *   7–13 days                                → 50 %
 *   < 7 days, or on/after the start date     → 0 %
 *
 * Days are counted between UTC calendar dates: `starts_on` is a date column
 * (stored as UTC midnight), so the comparison is day-to-day and never
 * depends on the server's timezone or the time of day.
 */

export type RefundPercent = 100 | 50 | 0;

export const REFUND_TIERS: readonly { minDays: number; percent: RefundPercent }[] = [
  { minDays: 14, percent: 100 },
  { minDays: 7, percent: 50 },
  { minDays: 0, percent: 0 },
];

const DAY_MS = 86_400_000;

function utcDayNumber(d: Date): number {
  return Math.floor(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) / DAY_MS);
}

/** Whole calendar days from `now` to `startsOn` (negative once started). */
export function daysUntilStart(startsOn: Date, now: Date): number {
  return utcDayNumber(startsOn) - utcDayNumber(now);
}

export function refundPercentFor(startsOn: Date, now: Date): RefundPercent {
  const days = daysUntilStart(startsOn, now);
  if (days >= 14) return 100;
  if (days >= 7) return 50;
  return 0;
}

/** Integer minor units — rounding half up, never a fraction of a sen. */
export function refundAmountMinor(paidAmountMinor: number, percent: RefundPercent): number {
  return Math.round((paidAmountMinor * percent) / 100);
}

/** Copy for the checkout and My registrations screens, in the order the
 *  policy states them. */
export function describeRefundTiers(): { when: string; outcome: string }[] {
  return [
    { when: "Cancel 14 or more days before the start date", outcome: "100 % refund" },
    { when: "Cancel 7 to 13 days before the start date", outcome: "50 % refund" },
    { when: "Cancel fewer than 7 days before, or after the start date", outcome: "No refund" },
    { when: "Transfer to another date of the same programme, before it starts", outcome: "Free, once" },
  ];
}
