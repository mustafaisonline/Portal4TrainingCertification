/*
 * PORTED 2026-09-21 from project-artifacts/mockup/components/CourseCard.tsx
 * (ADR-045). Changes on port: takes a repository `ProgrammeSummary` (or a
 * full `ProgrammeRecord`, which is a superset) in place of the mockup's
 * `Course` constant type — `duration` → `durationLabel`, the level is shown
 * through `levelLabel()`, and the "from" price is derived from the record's
 * `prices` (minor units via `formatMoney`) or, for a mentorship programme,
 * its entry package in `content.mentorshipPackages`. A bare summary (no
 * `prices`/`content`) simply omits the price row — nothing is invented.
 */

import Link from "next/link";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";
import {
  formatMoney,
  levelLabel,
  PRICE_REGIONS,
  type PriceRegion,
  type ProgrammeContent,
  type ProgrammePriceRecord,
  type ProgrammeSummary,
} from "@/modules/catalogue/programmes/types";

/** A summary, optionally carrying the joined parts a full record has. */
export type CourseCardProgramme = ProgrammeSummary & {
  prices?: ProgrammePriceRecord[];
  content?: ProgrammeContent;
};

/** The published price per region, or — for a mentorship programme, which
 *  is priced per package — its entry package's "today" figure as text. */
type EntryPrice = { today: string; original?: string; offerLabel?: string; discounted: boolean };

function entryPricing(course: CourseCardProgramme): Partial<Record<PriceRegion, EntryPrice>> | undefined {
  if (course.prices && course.prices.length > 0) {
    const out: Partial<Record<PriceRegion, EntryPrice>> = {};
    for (const p of course.prices) {
      out[p.region] = {
        today: formatMoney(p.offerAmountMinor, p.currency),
        original: formatMoney(p.listAmountMinor, p.currency),
        offerLabel: p.offerLabel,
        discounted: p.listAmountMinor > p.offerAmountMinor,
      };
    }
    return out;
  }
  // Mentorship is priced per package; show its entry package as the "from".
  if (course.level === "mentorship") {
    const pkg = course.content?.mentorshipPackages?.[0];
    if (pkg) {
      const out: Partial<Record<PriceRegion, EntryPrice>> = {};
      for (const region of PRICE_REGIONS) {
        const r = pkg.pricing[region.key];
        out[region.key] = { today: r.today, original: r.original, offerLabel: r.discount, discounted: r.today !== r.original };
      }
      return out;
    }
  }
  return undefined;
}

/**
 * Reusable course card — used on the /programs hub ("Trainings",
 * 2026-09-26) and the "related courses" rail on detail pages. Token-driven,
 * so it renders correctly on both light and night surfaces.
 *
 * Discovery and navigation: level, duration, audience, formats, a summary
 * and an indicative "from" price (Malaysia rate — the detail page carries
 * all three regions). Still no dates or capacity: scheduled offerings are
 * read separately.
 *
 * 2026-09-26 (founder change list, item 2): on the hub every region is
 * named in full — "Malaysia", never "(MY)", which read as a currency code
 * next to "RM" — with today's price, the original struck through, the offer
 * label ("75% OFF") and the region's note from `content.regionalPricing`.
 */
export function CourseCard({
  course,
  /**
   * Show the entry price in all three published regions rather than
   * Malaysia alone. Turned on for /programs; defaults to false so the
   * related rail is unchanged.
   */
  showAllRegions = false,
}: {
  course: CourseCardProgramme;
  showAllRegions?: boolean;
}) {
  const pricing = entryPricing(course);
  const homeRegion = PRICE_REGIONS[0];
  const homePrice = homeRegion ? pricing?.[homeRegion.key] : undefined;

  return (
    <Card
      variant="panel"
      className="flex h-full flex-col border border-[var(--color-line)]"
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Chip tone="primary">{levelLabel(course.level)}</Chip>
        {course.flagship && <Chip>Flagship</Chip>}
      </div>
      <h3 className="text-h2 mb-2">{course.title}</h3>
      {/* Subtitle shown on the hub (2026-09-26); absent on older rows. */}
      {course.subtitle && (
        <p className="text-body-sm mb-3 font-medium text-[var(--color-ink)]">
          {course.subtitle}
        </p>
      )}
      <p className="text-body-sm mb-5 flex-1 text-[var(--color-ink-quiet)]">
        {course.summary}
      </p>
      {/* Specification grid: `items-baseline` puts label and value on one
          line; a uniform minimum row height keeps row 1 of every card at the
          same height as row 1 of every other card even when a value wraps. */}
      <dl className="text-body-sm mb-5 grid grid-cols-[68px_minmax(0,1fr)] items-baseline gap-x-3 border-t border-[var(--color-line)] pt-4 [grid-auto-rows:minmax(2.75rem,auto)]">
        <dt className="text-label">Duration</dt>
        <dd className="leading-snug text-[var(--color-ink-quiet)]">
          {course.durationLabel}
        </dd>

        <dt className="text-label">For</dt>
        <dd className="leading-snug text-[var(--color-ink-quiet)]">
          {course.audienceSummary}
        </dd>

        <dt className="text-label">Delivery</dt>
        <dd className="leading-snug text-[var(--color-ink-quiet)]">
          {course.formats.join(" · ")}
        </dd>

        {pricing && homeRegion && homePrice && !showAllRegions && (
          <>
            <dt className="text-label">From</dt>
            <dd className="leading-snug">
              <span className="font-medium text-[var(--color-primary)]">
                {homePrice.today}{" "}
                <span className="font-normal text-[var(--color-ink-faint)]">
                  ({homeRegion.label})
                </span>
              </span>
            </dd>
          </>
        )}
      </dl>
      {pricing && showAllRegions && (
        <div className="mb-5 border-t border-[var(--color-line)] pt-4">
          <p className="text-label mb-3">Investment</p>
          <ul className="flex flex-col gap-3" data-testid="card-prices">
            {PRICE_REGIONS.map((region) => {
              const figure = pricing[region.key];
              if (!figure) return null;
              const note = course.content?.regionalPricing?.[region.key]?.note;
              return (
                <li key={region.key} data-testid={`card-price-${region.key}`}>
                  <span className="text-body-sm block font-medium text-[var(--color-ink)]">{region.label}</span>
                  <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span className="text-body-lg font-medium text-[var(--color-primary)]">{figure.today}</span>
                    {figure.discounted && figure.original && (
                      <>
                        <span className="text-body-sm text-[var(--color-ink-faint)] line-through">{figure.original}</span>
                        {figure.offerLabel && <Chip tone="primary">{figure.offerLabel}</Chip>}
                      </>
                    )}
                  </span>
                  {note && (
                    <span className="text-body-sm mt-1 block leading-snug text-[var(--color-ink-quiet)]">{note}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <Link
        href={`/programs/${course.slug}`}
        className="text-body-sm inline-block py-2 font-medium text-[var(--color-primary)] underline underline-offset-4 hover:text-[var(--color-primary-strong)]"
      >
        Course details →
      </Link>
    </Card>
  );
}
