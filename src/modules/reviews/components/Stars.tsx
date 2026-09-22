import { REVIEW_RATING_MAX } from "../constants";

/** A 1–5 rating as stars with a spoken equivalent; null → "No rating". */
export function Stars({ rating }: { rating: number | null }) {
  if (rating === null) return <span className="text-body-sm text-[var(--color-ink-faint)]">No rating</span>;
  const filled = "★".repeat(rating);
  const empty = "☆".repeat(Math.max(0, REVIEW_RATING_MAX - rating));
  return (
    <span role="img" aria-label={`Rated ${rating} out of ${REVIEW_RATING_MAX}`} className="tracking-[0.1em] text-[var(--color-primary)]">
      {filled}
      <span className="text-[var(--color-ink-faint)]">{empty}</span>
    </span>
  );
}

const monthYear = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });

/** "September 2026" — the month a review was submitted (public cards). */
export function formatMonthYear(d: Date): string {
  return monthYear.format(d);
}
