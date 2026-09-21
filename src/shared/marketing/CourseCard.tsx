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

/** The "today" figure per region, as published. */
function entryPricing(course: CourseCardProgramme): Partial<Record<PriceRegion, string>> | undefined {
  if (course.prices && course.prices.length > 0) {
    const out: Partial<Record<PriceRegion, string>> = {};
    for (const p of course.prices) out[p.region] = formatMoney(p.offerAmountMinor, p.currency);
    return out;
  }
  // Mentorship is priced per package; show its entry package as the "from".
  if (course.level === "mentorship") {
    const pkg = course.content?.mentorshipPackages?.[0];
    if (pkg) {
      const out: Partial<Record<PriceRegion, string>> = {};
      for (const region of PRICE_REGIONS) out[region.key] = pkg.pricing[region.key].today;
      return out;
    }
  }
  return undefined;
}

/**
 * Reusable course card — used on /courses, the homepage preview and the
 * "related courses" rail on detail pages. Token-driven, so it renders
 * correctly on both light and night surfaces.
 *
 * Discovery and navigation: level, duration, audience, formats, a summary
 * and an indicative "from" price (Malaysia rate — the detail page carries
 * all three regions). Still no dates or capacity: scheduled offerings are
 * read separately.
 */
export function CourseCard({
  course,
  /**
   * Show the entry price in all three published regions rather than
   * Malaysia alone. Turned on for /courses; defaults to false so the
   * homepage preview is unchanged.
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

        {pricing && homeRegion && homePrice && (
          <>
            <dt className="text-label">From</dt>
            <dd className="leading-snug">
              {showAllRegions ? (
                /* Tabular so the three figures align down the column —
                   .text-mono carries font-variant-numeric: tabular-nums. */
                <span className="flex flex-col gap-1">
                  {PRICE_REGIONS.map((region) => {
                    const figure = pricing[region.key];
                    if (!figure) return null;
                    return (
                      <span key={region.key} className="flex items-baseline gap-2">
                        <span className="font-medium text-[var(--color-primary)]">
                          {figure}
                        </span>
                        <span className="text-mono text-[0.7rem] text-[var(--color-ink-faint)]">
                          {region.short}
                        </span>
                      </span>
                    );
                  })}
                </span>
              ) : (
                <span className="font-medium text-[var(--color-primary)]">
                  {homePrice}{" "}
                  <span className="font-normal text-[var(--color-ink-faint)]">
                    ({homeRegion.short})
                  </span>
                </span>
              )}
            </dd>
          </>
        )}
      </dl>
      <Link
        href={`/courses/${course.slug}`}
        className="text-body-sm inline-block py-2 font-medium text-[var(--color-primary)] underline underline-offset-4 hover:text-[var(--color-primary-strong)]"
      >
        Course details →
      </Link>
    </Card>
  );
}
