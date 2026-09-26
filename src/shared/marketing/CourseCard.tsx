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
  priceCardMeta,
  priceRegionMeta,
  pricesForCard,
  type PriceCard,
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

function toEntry(p: ProgrammePriceRecord): EntryPrice {
  return {
    today: formatMoney(p.offerAmountMinor, p.currency),
    original: formatMoney(p.listAmountMinor, p.currency),
    offerLabel: p.offerLabel,
    discounted: p.listAmountMinor > p.offerAmountMinor,
  };
}

function entryPricing(course: CourseCardProgramme): Partial<Record<PriceRegion, EntryPrice>> | undefined {
  if (course.prices && course.prices.length > 0) {
    const out: Partial<Record<PriceRegion, EntryPrice>> = {};
    for (const p of course.prices) out[p.region] = toEntry(p);
    return out;
  }
  // Mentorship is priced per package; show its entry package as the "from".
  if (course.level === "mentorship") {
    const pkg = course.content?.mentorshipPackages?.[0];
    if (pkg) {
      const out: Partial<Record<PriceRegion, EntryPrice>> = {};
      for (const region of LISTING_CARD_ORDER) {
        const r = pkg.pricing[region];
        out[region] = { today: r.today, original: r.original, offerLabel: r.discount, discounted: r.today !== r.original };
      }
      return out;
    }
  }
  return undefined;
}

/** The listing card's region order (unchanged since 2026-09-02): Malaysia,
 *  Pakistan, Rest of the world. Each is a `PriceCard`; the Malaysia entry
 *  shows both Malaysian fee rows (M12 WP1). */
const LISTING_CARD_ORDER: PriceCard[] = ["malaysia", "pakistan", "international"];

/** The "From" figure: the Malaysian card price (the checkout row). */
const HOME_REGION: PriceRegion = "malaysia";

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
 * label ("75% OFF") and the region's note. M12 WP1 (same day, later): the
 * note and the participant minimum are columns of the fee row, and the
 * Malaysia entry lists both Malaysian rows ("Via HRD Corp" / "Without HRD
 * Corp") — `pricesForCard`.
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
  const homeRegion = priceRegionMeta(HOME_REGION);
  const homePrice = pricing?.[HOME_REGION];

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
      {/* No `flex-1` here (removed 2026-09-26, founder-reported: "why so
          much gap before Duration?"). Cards in one /programs grid row are
          stretched to equal height, and `flex-1` on THIS paragraph made the
          shorter card's summary box swallow all the surplus — a blank area
          under one sentence. The surplus now collapses at the bottom via
          `mt-auto` on the CTA link below, so every card's content stacks
          naturally and only the link is pinned to the bottom edge. */}
      <p className="text-body-sm mb-5 text-[var(--color-ink-quiet)]">
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
            {LISTING_CARD_ORDER.map((card) => {
              const meta = priceCardMeta(card);
              const figure = pricing[card];
              if (!figure) return null;
              // The fee rows this card shows (two for Malaysia when the HRD
              // Corp row is published); a mentorship "from" has no rows.
              const rows = course.prices ? pricesForCard(course.prices, card) : [];
              const multi = rows.length > 1;
              const notes = rows.flatMap((p) => (p.note ? [p.note] : [])).filter((n, i, all) => all.indexOf(n) === i);
              return (
                <li key={card} data-testid={`card-price-${card}`}>
                  <span className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="text-body-sm font-medium text-[var(--color-ink)]">{meta.label}</span>
                    {/* When a card lists two fee rows (Malaysia's "Via HRD
                        Corp" / "Without HRD Corp"), there is no single price
                        line left to carry the discount chip, so it sits
                        beside the region name instead — the checkout row's
                        offer label, the same one used below for one price. */}
                    {multi && figure.discounted && figure.offerLabel && <Chip tone="primary">{figure.offerLabel}</Chip>}
                  </span>
                  {multi ? (
                    <dl className="flex flex-col gap-2.5" data-testid={`card-price-options-${card}`}>
                      {rows.map((p) => {
                        const f = toEntry(p);
                        return (
                          <div key={p.region} data-testid={`card-price-row-${p.region}`}>
                            <dt className="text-body-sm font-medium text-[var(--color-ink-quiet)]">{priceRegionMeta(p.region).optionLabel}</dt>
                            <dd>
                              <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                                <span className="text-body-lg font-medium text-[var(--color-primary)]">{f.today}</span>
                                {f.discounted && <span className="text-body-sm text-[var(--color-ink-faint)] line-through">{f.original}</span>}
                              </span>
                              {p.minParticipants !== null && (
                                <span className="text-body-sm block text-[var(--color-ink-quiet)]">minimum {p.minParticipants} participants</span>
                              )}
                            </dd>
                          </div>
                        );
                      })}
                    </dl>
                  ) : (
                    <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <span className="text-body-lg font-medium text-[var(--color-primary)]">{figure.today}</span>
                      {figure.discounted && figure.original && (
                        <>
                          <span className="text-body-sm text-[var(--color-ink-faint)] line-through">{figure.original}</span>
                          {figure.offerLabel && <Chip tone="primary">{figure.offerLabel}</Chip>}
                        </>
                      )}
                    </span>
                  )}
                  {!multi && rows[0]?.minParticipants != null && (
                    <span className="text-body-sm mt-1 block leading-snug text-[var(--color-ink-quiet)]">minimum {rows[0].minParticipants} participants</span>
                  )}
                  {notes.map((note) => (
                    <span key={note} className="text-body-sm mt-1 block leading-snug text-[var(--color-ink-quiet)]">{note}</span>
                  ))}
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <Link
        href={`/programs/${course.slug}`}
        className="text-body-sm mt-auto inline-block py-2 font-medium text-[var(--color-primary)] underline underline-offset-4 hover:text-[var(--color-primary-strong)]"
      >
        Course details →
      </Link>
    </Card>
  );
}
