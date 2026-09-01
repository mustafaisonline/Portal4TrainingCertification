"use client";

import { useState } from "react";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Chip } from "./ui/Chip";
import {
  mentorshipRegionBadges,
  pricingRegions,
  type MentorshipPackage,
  type ProgrammePricing as Pricing,
  type RegionKey,
} from "@/data/programmes";

/**
 * Programme investment — the source site's regional pricing, rendered in
 * the portal's own design system.
 *
 * Figures come from data/programmes.ts (migrated from the source's
 * client-side pricing data). They are TIME-LIMITED LAUNCH OFFERS; the
 * component states that plainly rather than presenting them as standing
 * list prices, and no checkout is implied — payment is not built
 * (ADR-014 / OQ-2), so every CTA is an enquiry.
 *
 * Client component purely for the region tabs.
 */

function PriceFigures({ price, discountLabel }: { price: Pricing[RegionKey]; discountLabel: string }) {
  return (
    <>
      <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-display text-[var(--color-primary)]">
          {price.today}
        </span>
        <span className="text-body-sm text-[var(--color-ink-faint)] line-through">
          {price.original}
        </span>
      </div>
      <p className="text-body-sm text-[var(--color-ink-quiet)]">
        {discountLabel}: {price.discount} · you save {price.save}
      </p>
    </>
  );
}

export function ProgrammePricing({
  pricing,
  packages,
  valueStack,
  valueStackTotal,
}: {
  pricing?: Pricing;
  packages?: MentorshipPackage[];
  valueStack?: { item: string; value: string }[];
  valueStackTotal?: string;
}) {
  const [region, setRegion] = useState<RegionKey>("malaysia");
  const baseRegion =
    pricingRegions.find((r) => r.key === region) ?? pricingRegions[0];
  // Mentorship discounts differ from the training programmes, so its
  // badge is overridden rather than reusing the 50%-off training badge.
  const activeRegion = packages
    ? { ...baseRegion, badge: mentorshipRegionBadges[region] }
    : baseRegion;

  if (!pricing && !packages) return null;

  return (
    <section
      id="investment"
      className="night relative scroll-mt-24 overflow-hidden"
    >
      <div className="mx-auto max-w-[1280px] section px-6">
        <p className="text-label mb-3 text-[var(--color-primary)]">
          Investment
        </p>
        <h2 className="text-display mb-4">Programme investment</h2>
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
          {pricingRegions.map((r) => {
            const active = r.key === region;
            return (
              <button
                key={r.key}
                role="tab"
                aria-selected={active}
                onClick={() => setRegion(r.key)}
                className={`text-label rounded-full border px-4 py-2 transition-colors ${
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

        {/* Single-programme pricing */}
        {pricing && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr] lg:items-start">
            <Card
              variant="feature"
              className="border border-[var(--color-line-strong)]"
            >
              <Chip tone="primary">{activeRegion.badge}</Chip>
              <p className="text-label mb-2 mt-4">Today&rsquo;s investment</p>
              <PriceFigures
                price={pricing[region]}
                discountLabel={activeRegion.discountLabel}
              />
              <div className="mt-7 flex flex-wrap gap-3">
                <Button href="/#organisations">Register your interest</Button>
              </div>
              <p className="text-body-sm mt-4 text-[var(--color-ink-faint)]">
                Enquiry-based — no online payment yet. We confirm dates and
                invoicing with you directly.
              </p>
            </Card>

            {valueStack && (
              <div>
                <p className="text-label mb-4">What is included</p>
                <ul>
                  {valueStack.map((row) => (
                    <li
                      key={row.item}
                      className="flex items-baseline justify-between gap-6 border-t border-[var(--color-line)] py-3 text-body-sm"
                    >
                      <span className="text-[var(--color-ink-quiet)]">
                        {row.item}
                      </span>
                      <span className="text-mono shrink-0 text-[var(--color-ink-faint)]">
                        {row.value}
                      </span>
                    </li>
                  ))}
                  {valueStackTotal && (
                    <li className="flex items-baseline justify-between gap-6 border-t border-[var(--color-line-strong)] py-3 text-body-sm">
                      <span className="font-semibold">Total value</span>
                      <span className="text-mono shrink-0 text-[var(--color-primary)]">
                        {valueStackTotal}
                      </span>
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Mentorship packages */}
        {packages && (
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
                <PriceFigures
                  price={pkg.pricing[region]}
                  discountLabel={activeRegion.discountLabel}
                />
                <p className="text-body-sm mb-5 mt-5 border-t border-[var(--color-line)] pt-4 text-[var(--color-ink-quiet)]">
                  {pkg.idealFor}
                </p>
                {pkg.includesLead && (
                  <p className="text-body-sm mb-2 font-semibold">
                    {pkg.includesLead}
                  </p>
                )}
                <ul className="mb-7 flex flex-1 flex-col gap-1.5">
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
                  href="/#organisations"
                >
                  Enquire about this package
                </Button>
              </Card>
            ))}
          </div>
        )}

        <p className="text-body-sm mt-9 max-w-[760px] text-[var(--color-ink-faint)]">
          Prices are as currently published and reflect a time-limited launch
          offer, shown in the currency of the selected region. Corporate and
          private-cohort engagements are quoted separately —{" "}
          <a
            href="/#organisations"
            className="text-[var(--color-primary)] underline underline-offset-4"
          >
            talk to us about your team
          </a>
          .
        </p>
      </div>
    </section>
  );
}
