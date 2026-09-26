"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";
import {
  LOCAL_PARTNER_PAYMENT_MESSAGE,
  PRICE_CARD_ORDER,
  currencyPrefix,
  formatMoney,
  priceCardMeta,
  priceRegionMeta,
  pricesForCard,
  type CheckoutRegion,
  type MentorshipPackage,
  type ProgrammePriceRecord,
} from "@/modules/catalogue/programmes/types";

/*
 * PORTED 2026-09-21 from project-artifacts/mockup/components/CoursePricing.tsx
 * (ADR-045). Changed: figures come from `ProgrammePriceRecord[]` (minor units,
 * rendered with `formatMoney`; "save" = list − offer) instead of the mockup's
 * verbatim strings; the demo `RegisterInterestButton`/`registrationFlow` path
 * is gone — every CTA is an enquiry link carrying the programme slug.
 *
 * REWRITTEN 2026-09-26 (founder change list, item 2.1): a training's
 * Investment section is CARDS, not tabs — International (USD), Malaysia (RM)
 * and Pakistan (Rs) side by side, plus a fourth "Can't pay by card?" card.
 * Each card states how that region pays (the rule the checkout service
 * enforces — `cardPaymentAvailable`): Malaysia by card in RM, everyone
 * outside Malaysia and Pakistan by card in USD, Pakistan through our local
 * partner (no card). The value-stack block is gone.
 *
 * M12 WP1 (2026-09-26, later): every figure is a `programme_prices` ROW —
 * four per training (Malaysia via HRD Corp · Malaysia not via HRD Corp ·
 * Pakistan · Rest of the world). A card shows the rows `PRICE_REGIONS` maps
 * to it: the Malaysia card carries both Malaysian rows, one figure each,
 * labelled "Via HRD Corp" / "Without HRD Corp"; the checkout amount is the
 * `malaysia` row (L6). Minimum participants and the note are columns.
 *
 * The region TABS survive only for the mentorship packages (an unlisted
 * programme priced per package) — that path is unchanged. The `useState`
 * exists for it alone; the cards need no client state.
 *
 * Figures are TIME-LIMITED LAUNCH OFFERS; the component states that plainly.
 */

type Figures = {
  today: string;
  original: string;
  discount: string;
  save: string;
  /** False when list = offer (no discount): no strike-through, no "you save". */
  discounted: boolean;
};

function toFigures(price: ProgrammePriceRecord): Figures {
  return {
    today: formatMoney(price.offerAmountMinor, price.currency),
    original: formatMoney(price.listAmountMinor, price.currency),
    discount: price.offerLabel,
    save: formatMoney(price.listAmountMinor - price.offerAmountMinor, price.currency),
    discounted: price.listAmountMinor > price.offerAmountMinor,
  };
}

/** Mentorship packages carry verbatim strings; a package whose "today"
 *  equals its "original" is likewise undiscounted. */
function packageFigures(p: { today: string; original: string; discount: string; save: string }): Figures {
  return { ...p, discounted: p.today !== p.original };
}

function PriceFigures({ price, discountLabel }: { price: Figures; discountLabel: string }) {
  return (
    <>
      <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        {/* text-h1, not text-display — 2026-09-20, founder: fee figures
            were too large. */}
        <span className="text-h1 text-[var(--color-primary)]">
          {price.today}
        </span>
        {price.discounted && (
          <span className="text-body-sm text-[var(--color-ink-faint)] line-through">
            {price.original}
          </span>
        )}
      </div>
      <p className="text-body-sm text-[var(--color-ink-quiet)]">
        {/* An undiscounted price shows only its offer name — no "was"
            figure, no saving of zero. */}
        {price.discounted ? `${discountLabel}: ${price.discount} · you save ${price.save}` : price.discount}
      </p>
    </>
  );
}

/** Sentence for the fourth card — anyone, anywhere, who cannot pay by card. */
const NO_CARD_ANYWHERE_MESSAGE =
  "Please contact us — we will make sure our local partner contacts you, anywhere in the world, to arrange payment through local banks or in cash.";

/** The distinct notes of a card's rows, in row order (both Malaysian rows
 *  usually carry the same sentence — shown once). */
function cardNotes(rows: ProgrammePriceRecord[]): string[] {
  return rows.flatMap((p) => (p.note ? [p.note] : [])).filter((n, i, all) => all.indexOf(n) === i);
}

function RegionCard({
  card,
  rows,
  enquiryHref,
}: {
  card: CheckoutRegion;
  /** The fee rows this card shows (`pricesForCard`), at least one. */
  rows: ProgrammePriceRecord[];
  enquiryHref: string;
}) {
  const region = priceCardMeta(card);
  // The checkout row (the card's own region) carries the discount chip and
  // the single-figure layout; the Malaysia card's HRD Corp row is a second
  // figure beside it.
  const checkoutRow = rows.find((p) => p.region === card) ?? rows[0]!;
  const figures = toFigures(checkoutRow);
  const byCard = region.payment === "card";
  const notes = cardNotes(rows);
  return (
    <Card
      variant="panel"
      className="flex h-full flex-col border border-[var(--color-line-strong)]"
      data-testid={`price-card-${card}`}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-h2">
          {region.label}{" "}
          <span className="text-body-sm font-normal text-[var(--color-ink-faint)]">({currencyPrefix(checkoutRow.currency)})</span>
        </h3>
        {figures.discounted && <Chip tone="primary">{figures.discount}</Chip>}
      </div>

      {rows.length > 1 ? (
        /* More than one fee row on a card (Malaysia: via / without HRD
           Corp): each row shows its label, today's figure, the original
           struck through when it differs, and the participant minimum. */
        <dl className="mb-4 flex flex-col gap-4">
          {rows.map((p) => {
            const f = toFigures(p);
            return (
              <div key={p.region} data-testid={`price-row-${p.region}`}>
                <dt className="text-label mb-1">{priceRegionMeta(p.region).optionLabel}</dt>
                <dd>
                  <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-h1 text-[var(--color-primary)]">{f.today}</span>
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
        <>
          <p className="text-label mb-2">Today&rsquo;s investment</p>
          <PriceFigures price={figures} discountLabel={region.discountLabel} />
          {checkoutRow.minParticipants !== null && (
            <p className="text-body-sm text-[var(--color-ink-quiet)]">minimum {checkoutRow.minParticipants} participants</p>
          )}
        </>
      )}

      <p className="text-body-sm mt-4 border-t border-[var(--color-line)] pt-4">
        <span className="text-label">How you pay</span>
        <span className="mt-1 block text-[var(--color-ink)]">{region.subtitle}</span>
      </p>
      {notes.map((note) => (
        <p key={note} className="text-body-sm mt-3 text-[var(--color-ink-quiet)]" data-testid={`price-note-${card}`}>
          {note}
        </p>
      ))}

      <div className="mt-auto pt-6">
        {byCard ? (
          <div className="flex flex-wrap gap-3">
            <Button href="/schedule">See upcoming dates</Button>
            <Button variant="secondary" href={enquiryHref}>
              Register your interest
            </Button>
          </div>
        ) : (
          <>
            <p className="text-body-sm mb-4 text-[var(--color-ink)]" data-testid="local-partner-message">
              {LOCAL_PARTNER_PAYMENT_MESSAGE}
            </p>
            <Button href={enquiryHref}>Contact us</Button>
          </>
        )}
      </div>
    </Card>
  );
}

export function ProgrammePricing({
  prices,
  packages,
  programmeSlug,
}: {
  prices: ProgrammePriceRecord[];
  packages?: MentorshipPackage[];
  /** Carried into the enquiry link so the contact form knows which
   *  programme the interest is for. */
  programmeSlug: string;
}) {
  // Mentorship packages only: the three checkout regions that actually have
  // a published figure get a tab (packages are not priced via HRD Corp).
  const regions = PRICE_CARD_ORDER.map(priceCardMeta).filter((r) => packages?.some((pkg) => Boolean(pkg.pricing[r.key as CheckoutRegion])) ?? false);
  const [region, setRegion] = useState<CheckoutRegion>((regions[0]?.key as CheckoutRegion | undefined) ?? "malaysia");
  const activeRegion = regions.find((r) => r.key === region) ?? regions[0];
  const enquiryHref = `/contact-us?kind=programme_interest&programme=${programmeSlug}`;

  // Training cards, in the founder's order, only for cards with a fee row.
  const cards = PRICE_CARD_ORDER.flatMap((card) => {
    const rows = pricesForCard(prices, card);
    return rows.length > 0 ? [{ card, rows }] : [];
  });

  if (packages ? !activeRegion : cards.length === 0) return null;

  return (
    // `.night` removed, 2026-09-06 light-theme propagation — see
    // components/HomeHeroLight.tsx's header comment. Gradient hue moved
    // indigo→blue to match; flat light-blue band (not the hero's gradient
    // wash) since this is a secondary section, not a page-opening hero.
    <section
      id="investment"
      className="relative scroll-mt-24 overflow-hidden bg-[var(--color-ground-tint)]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(50% 85% at 80% 25%, rgba(47,95,224,0.12), transparent 70%)",
        }}
      />
      <div className="relative mx-auto max-w-[1280px] px-6 py-16">
        <p className="text-label mb-3 text-[var(--color-primary)]">
          Investment
        </p>
        <h2 className="text-display mb-4">Course investment</h2>

        {packages && activeRegion ? (
          <>
            <p className="text-body-lg mb-8 max-w-[620px] text-[var(--color-ink-quiet)]">
              Pricing is shown by region. {activeRegion.subtitle} —{" "}
              <span className="text-[var(--color-ink)]">{activeRegion.badge}</span>.
            </p>

            {/* Region tabs */}
            <div
              role="tablist"
              aria-label="Select your region"
              className="mb-9 flex flex-wrap gap-2"
            >
              {regions.map((r) => {
                const active = r.key === region;
                return (
                  <button
                    key={r.key}
                    role="tab"
                    aria-selected={active}
                    onClick={() => setRegion(r.key as CheckoutRegion)}
                    // `.text-label` is unlayered CSS that sets `color`, so it would
                    // beat the text-* utilities below and leave ink-faint text on the
                    // selected tab's blue fill (axe: 1.9:1 — inherited from the
                    // mockup). Its typography is restated here without the colour.
                    className={`rounded-full border px-4 py-2 text-[0.75rem] font-semibold uppercase leading-[1.4] tracking-[0.08em] transition-colors ${
                      active
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-ink)]"
                        : "border-[var(--color-line-strong)] text-[var(--color-ink-quiet)] hover:border-[var(--color-primary)] hover:text-[var(--color-ink)]"
                    }`}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>

            {/* Mentorship packages */}
            <div className="grid gap-6 lg:grid-cols-3">
              {packages.map((pkg) => (
                <Card
                  key={pkg.id}
                  variant={pkg.featured ? "feature" : "panel"}
                  className="flex flex-col border border-[var(--color-line-strong)]"
                >
                  <div className="mb-4">
                    <Chip tone={pkg.featured ? "primary" : "neutral"}>
                      {pkg.badge}
                    </Chip>
                  </div>
                  <h3 className="text-h1 mb-1">{pkg.name}</h3>
                  <p className="text-mono text-body-sm mb-5 text-[var(--color-ink-faint)]">
                    {pkg.duration}
                  </p>
                  {pkg.pricing[region] && (
                    <PriceFigures
                      price={packageFigures(pkg.pricing[region])}
                      discountLabel={activeRegion.discountLabel}
                    />
                  )}
                  <p className="text-body-sm mb-5 mt-5 border-t border-[var(--color-line)] pt-4 text-[var(--color-ink-quiet)]">
                    {pkg.idealFor}
                  </p>
                  {pkg.includesLead && (
                    <p className="text-body-sm mb-2 font-semibold">
                      {pkg.includesLead}
                    </p>
                  )}
                  {/* `flex-1` removed from the list, `mt-auto` on the button
                      (2026-09-26): same fix as CourseCard.tsx — the three
                      package cards are one equal-height grid row, and a
                      shorter "includes" list must not stretch into blank
                      space; the button is pinned to the bottom instead. */}
                  <ul className="mb-7 flex flex-col gap-1.5">
                    {pkg.includes.map((item) => (
                      <li
                        key={item}
                        className="text-body-sm text-[var(--color-ink-quiet)]"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={pkg.featured ? "primary" : "secondary"}
                    href={enquiryHref}
                    className="mt-auto"
                  >
                    Enquire about this package
                  </Button>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <>
            <p className="text-body-lg mb-10 max-w-[720px] text-[var(--color-ink-quiet)]">
              Pricing is shown by region. Participants in Malaysia pay by card
              in RM; participants outside Malaysia and Pakistan pay by card in
              USD; participants in Pakistan pay through our local partner, not
              by card.
            </p>

            {/* One card per region, plus the "Can't pay by card?" card. */}
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4" data-testid="price-cards">
              {cards.map(({ card, rows }) => (
                <RegionCard key={card} card={card} rows={rows} enquiryHref={enquiryHref} />
              ))}
              <Card
                variant="plate"
                className="flex h-full flex-col p-6"
                data-testid="price-card-no-card"
              >
                <h3 className="text-h2 mb-4">Can&rsquo;t pay by card?</h3>
                <p className="text-body-sm mb-6 text-[var(--color-ink-quiet)]">{NO_CARD_ANYWHERE_MESSAGE}</p>
                <div className="mt-auto">
                  <Button variant="secondary" href={enquiryHref}>
                    Contact us
                  </Button>
                </div>
              </Card>
            </div>
          </>
        )}

        <p className="text-body-sm mt-9 max-w-[760px] text-[var(--color-ink-faint)]">
          Prices are as currently published and reflect a time-limited launch
          offer, shown in each region&rsquo;s own currency. Corporate and
          private-cohort engagements are quoted separately —{" "}
          <Link
            href="/contact-us"
            className="text-[var(--color-primary)] underline underline-offset-4"
          >
            talk to us about your team
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
