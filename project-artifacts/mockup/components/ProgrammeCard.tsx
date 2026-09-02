import Link from "next/link";
import { Card } from "./ui/Card";
import { Chip } from "./ui/Chip";
import {
  mentorshipPackages,
  pricingRegions,
  type Programme,
} from "@/data/programmes";

/**
 * Reusable programme card — used on /programmes, the P01 homepage preview
 * and the "related programmes" rail on detail pages. Token-driven, so it
 * renders correctly on both light and night surfaces.
 *
 * Discovery and navigation: level, duration, audience, formats, a summary
 * and an indicative "from" price (Malaysia rate — the detail page carries
 * all three regions). Still no dates or capacity: scheduled offerings
 * remain an open decision (see data/programmes.ts header).
 */
export function ProgrammeCard({
  programme,
  /**
   * Show the entry price in all three published regions rather than
   * Malaysia alone. On 2026-09-02 the founder pointed out that the
   * programme detail pages list Malaysia, Pakistan and International while
   * the hub showed only Malaysia — an inconsistency a Pakistani or
   * international reader would experience as "the price does not apply to
   * me". Turned on for /programmes.
   *
   * Defaults to false so the P01 homepage preview is unchanged: that page
   * has been reviewed and approved, and three prices per card there is a
   * separate judgement call, not an implied consequence of this one.
   */
  showAllRegions = false,
}: {
  programme: Programme;
  showAllRegions?: boolean;
}) {
  // Mentorship is priced per package; show its entry package as the "from".
  const pricing =
    programme.pricing ??
    (programme.level === "Mentorship"
      ? mentorshipPackages[0]?.pricing
      : undefined);

  return (
    <Card
      variant="panel"
      className="flex h-full flex-col border border-[var(--color-line)]"
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Chip tone="primary">{programme.level}</Chip>
        {programme.flagship && <Chip>Flagship</Chip>}
      </div>
      <h3 className="text-h2 mb-2">{programme.title}</h3>
      <p className="text-body-sm mb-5 flex-1 text-[var(--color-ink-quiet)]">
        {programme.summary}
      </p>
      {/* Metadata list — every value uses ONE treatment: the same face and
          the same size, so the rows align optically. Two of these four
          previously used mono at 0.8rem while the other two inherited sans
          at 0.9375rem, which made the list read ragged (fixed 2026-09-02).
          This now matches the programme detail page's meta strip, which
          already had it right. The price earns emphasis through colour and
          weight alone — one axis, not three. The mono "measured voice"
          stays reserved for the rubric, IDs and the full pricing figures,
          where its scarcity means something. */}
      {/* Specification grid. Two problems fixed here (2026-09-02):
          1. BASELINES — this was a flex row with `align-items: stretch`.
             Labels are 12px/16.8px and values 15px/24px, so the label text
             sat ~3.6px above its value's baseline and the pair read as
             mismatched. `items-baseline` puts them on one line.
          2. CROSS-CARD ALIGNMENT — rows were auto-height, so a card whose
             "For" value fit on one line had its rows land at different
             y-positions from a card whose value wrapped to two. A real
             grid with a uniform minimum row height makes row 1 of every
             card sit at the same height as row 1 of every other card.
          `grid-auto-rows` min is sized for two wrapped lines at the value's
          snug leading, so a wrap no longer changes the row height. */}
      <dl className="text-body-sm mb-5 grid grid-cols-[68px_minmax(0,1fr)] items-baseline gap-x-3 border-t border-[var(--color-line)] pt-4 [grid-auto-rows:minmax(2.75rem,auto)]">
        <dt className="text-label">Duration</dt>
        <dd className="leading-snug text-[var(--color-ink-quiet)]">
          {programme.duration}
        </dd>

        <dt className="text-label">For</dt>
        <dd className="leading-snug text-[var(--color-ink-quiet)]">
          {programme.audienceSummary}
        </dd>

        <dt className="text-label">Delivery</dt>
        <dd className="leading-snug text-[var(--color-ink-quiet)]">
          {programme.formats.join(" · ")}
        </dd>

        {pricing && (
          <>
            <dt className="text-label">From</dt>
            <dd className="leading-snug">
              {showAllRegions ? (
                /* Tabular so the three figures align down the column —
                   .text-mono carries font-variant-numeric: tabular-nums. */
                <span className="flex flex-col gap-1">
                  {pricingRegions.map((region) => (
                    <span key={region.key} className="flex items-baseline gap-2">
                      <span className="font-medium text-[var(--color-primary)]">
                        {pricing[region.key].today}
                      </span>
                      <span className="text-mono text-[0.7rem] text-[var(--color-ink-faint)]">
                        {region.short}
                      </span>
                    </span>
                  ))}
                </span>
              ) : (
                <span className="font-medium text-[var(--color-primary)]">
                  {pricing.malaysia.today}{" "}
                  <span className="font-normal text-[var(--color-ink-faint)]">
                    ({pricingRegions[0].short})
                  </span>
                </span>
              )}
            </dd>
          </>
        )}
      </dl>
      <Link
        href={`/programmes/${programme.slug}`}
        className="text-body-sm font-medium text-[var(--color-primary)] underline underline-offset-4 hover:text-[var(--color-primary-strong)]"
      >
        Programme details →
      </Link>
    </Card>
  );
}
