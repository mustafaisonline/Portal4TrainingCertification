/*
 * PORTED 2026-09-21 from project-artifacts/mockup/components/CourseCard.tsx
 * (ADR-045). Changes on port: takes a repository `ProgrammeSummary` (or a
 * full `ProgrammeRecord`, which is a superset) in place of the mockup's
 * `Course` constant type — `duration` → `durationLabel`, the level is shown
 * through `levelLabel()`, and the "from" price is derived from the record's
 * `prices` (minor units via `formatMoney`) or, for a mentorship programme,
 * its entry package in `content.mentorshipPackages`. A bare summary (no
 * `prices`/`content`) simply omits the price row — nothing is invented.
 *
 * REDESIGNED 2026-09-30 (founder change round M16, modification.md M6/M7,
 * design direction only): pill badges (level, Flagship) on a tinted band, a
 * large two-tone title, a one-line description, four icon feature chips (the
 * training's first four `content.highlights`; the row is omitted when there
 * are none), DURATION / FOR / FORMAT rows and a filled "View Details →"
 * button. NO trainer photo, NO trainer link (the trainer's dedicated page is
 * removed; the trainer is introduced on the training's own page), NO trailer
 * button and NO hero art. The price/timeline information and every test id
 * the tests use are unchanged.
 */

import type { ReactNode } from "react";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";
import { HRD_CLAIM_NOTE } from "@/content/hrd-corp";
import {
  formatMoney,
  levelLabel,
  priceCardMeta,
  priceRegionMeta,
  pricesForCard,
  type DeliveryFormatRecord,
  type PriceCard,
  type PriceRegion,
  type ProgrammeContent,
  type ProgrammePriceRecord,
  type ProgrammeSummary,
} from "@/modules/catalogue/programmes/types";

/** A summary, optionally carrying the joined parts a full record has.
 *  `deliveryFormats`, when present, drives the per-format timeline row
 *  (founder, 2026-09-28); without it the card falls back to the plain
 *  format-name list it always showed. */
export type CourseCardProgramme = ProgrammeSummary & {
  prices?: ProgrammePriceRecord[];
  content?: ProgrammeContent;
  deliveryFormats?: DeliveryFormatRecord[];
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

/** The title in two tones: the leading words in ink, the closing words in
 *  the primary colour. One word stays a single tone. The text content is the
 *  title exactly (a heading's accessible name is unchanged). */
function splitTitle(title: string): [string, string] {
  const words = title.trim().split(/\s+/);
  if (words.length < 2) return [title, ""];
  const lead = Math.floor(words.length / 2);
  return [words.slice(0, lead).join(" "), words.slice(lead).join(" ")];
}

/** Four neutral glyphs, cycled — they decorate the feature chips and carry no
 *  meaning of their own (each chip's text does). aria-hidden. */
const FEATURE_ICONS: ReactNode[] = [
  <path key="a" d="M4 12l5 5L20 6" />,
  <path key="b" d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" />,
  <path key="c" d="M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5" />,
  <path key="d" d="M13 3L5 14h6l-1 7 8-11h-6l1-7z" />,
];

function FeatureIcon({ index }: { index: number }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mt-0.5 shrink-0 text-[var(--color-primary)]"
    >
      {FEATURE_ICONS[index % FEATURE_ICONS.length]}
    </svg>
  );
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
  /**
   * UX review 2026-09-27 U4: the region shown first and open; the other two
   * fold under "Other regions". The hub passes the signed-in profile's region,
   * or Malaysia for a visitor.
   */
  leadCard = "malaysia",
}: {
  course: CourseCardProgramme;
  showAllRegions?: boolean;
  leadCard?: PriceCard;
}) {
  const pricing = entryPricing(course);
  const homeRegion = priceRegionMeta(HOME_REGION);
  const homePrice = pricing?.[HOME_REGION];

  const [titleLead, titleTail] = splitTitle(course.title);
  const features = (course.content?.highlights ?? []).slice(0, 4);
  // The HRD Corp fee row is published for this training only when its prices
  // include the `malaysia_hrdcorp` row — then the founder's sentence follows.
  const showsHrdCorp = !!course.prices?.some((p) => p.region === "malaysia_hrdcorp");
  const formatRows = course.deliveryFormats && course.deliveryFormats.length > 0 ? course.deliveryFormats : null;

  return (
    <Card
      variant="panel"
      className="flex h-full flex-col overflow-hidden border border-[var(--color-line)]"
    >
      {/* Tinted band with the badges (no photo, no art — founder, 2026-09-30).
          The pills sit on the raised surface so they keep their contrast. */}
      <div className="-mx-6 -mt-6 mb-5 flex flex-wrap items-center gap-2 border-b border-[var(--color-line)] bg-[var(--color-ground-tint)] px-6 py-3.5">
        <span className="rounded-full bg-[var(--color-ground-raised)]">
          <Chip tone="primary">{levelLabel(course.level)}</Chip>
        </span>
        {course.flagship && (
          <span className="rounded-full bg-[var(--color-ground-raised)]">
            <Chip>Flagship</Chip>
          </span>
        )}
      </div>
      <h3 className="text-h1 mb-2 leading-tight">
        <span className="text-[var(--color-ink)]">{titleLead}</span>
        {titleTail && <span className="text-[var(--color-primary)]">{" "}{titleTail}</span>}
      </h3>
      {/* One-line description: the subtitle (a single sentence), else the
          summary. */}
      <p className="text-body-sm mb-5 text-[var(--color-ink-quiet)]" data-testid="card-description">
        {course.subtitle || course.summary}
      </p>
      {features.length > 0 && (
        <ul className="mb-5 grid list-none gap-2 p-0 sm:grid-cols-2" data-testid="card-features">
          {features.map((f, i) => (
            <li
              key={f}
              className="text-body-sm flex items-start gap-2 rounded-[var(--radius-plate)] border border-[var(--color-line)] bg-[var(--color-ground-tint)] px-3 py-2 leading-snug text-[var(--color-ink)]"
            >
              <FeatureIcon index={i} />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      )}
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

        <dt className="text-label">Format</dt>
        <dd className="leading-snug text-[var(--color-ink-quiet)]">
          {formatRows ? (
            <ul className="flex list-none flex-col gap-0.5 p-0" data-testid="card-timelines">
              {formatRows.map((f) => (
                <li key={f.code}>
                  <span className="font-medium text-[var(--color-ink)]">{f.name}</span> — {f.durationLabel}
                </li>
              ))}
            </ul>
          ) : (
            course.formats.join(" · ")
          )}
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
            {[leadCard, ...LISTING_CARD_ORDER.filter((c) => c !== leadCard)].map((card, cardIndex) => {
              const meta = priceCardMeta(card);
              const figure = pricing[card];
              if (!figure) return null;
              // The fee rows this card shows (two for Malaysia when the HRD
              // Corp row is published); a mentorship "from" has no rows.
              const rows = course.prices ? pricesForCard(course.prices, card) : [];
              const multi = rows.length > 1;
              const notes = rows.flatMap((p) => (p.note ? [p.note] : [])).filter((n, i, all) => all.indexOf(n) === i);
              const body = (
                <>
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
                </>
              );
              if (cardIndex === 0) {
                return (
                  <li key={card} data-testid={`card-price-${card}`}>
                    {body}
                  </li>
                );
              }
              return (
                <li key={card} data-testid={`card-price-${card}`}>
                  <details className="group">
                    <summary className="text-body-sm cursor-pointer list-none font-medium text-[var(--color-primary)] underline-offset-4 hover:underline [&::-webkit-details-marker]:hidden" data-testid={`card-price-toggle-${card}`}>
                      <span className="group-open:hidden">Price for {meta.label} →</span>
                      <span className="hidden group-open:inline">Price for {meta.label} ↓</span>
                    </summary>
                    <div className="mt-2">{body}</div>
                  </details>
                </li>
              );
            })}
          </ul>
          {showsHrdCorp && (
            <p className="text-body-sm mt-3 leading-snug text-[var(--color-ink-quiet)]" data-testid="card-hrd-note">
              {HRD_CLAIM_NOTE}
            </p>
          )}
        </div>
      )}
      <div className="mt-auto flex flex-wrap items-center gap-3 pt-2">
        <Button href={`/programs/${course.slug}`} data-testid="card-details">
          View Details<span className="sr-only">: {course.title}</span> <span aria-hidden="true">→</span>
        </Button>
        <Button variant="secondary" href={`/schedule?training=${course.slug}`} data-testid="card-register">
          See dates and register
        </Button>
      </div>
    </Card>
  );
}
