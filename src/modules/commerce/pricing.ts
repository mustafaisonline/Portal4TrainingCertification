import type { PriceRegion, ProgrammePriceRecord, ProgrammeRecord } from "@/modules/catalogue/programmes/types";
import { PRICE_REGIONS } from "@/modules/catalogue/programmes/types";
import { CommerceError } from "./errors";

/*
 * Server-side pricing (M4 plan §3 D3, §6 commitment 3): the region is derived
 * from the person's profile country and the amount is read from
 * `programme_prices`. The client never sends an amount, currency or region,
 * and cannot choose a cheaper region.
 *
 * The profile country is a free-text field today (plan §10 default 1), so the
 * match is deliberately forgiving: trimmed, lower-cased, punctuation removed.
 * "Pakistan", "PK", "Pakistan." → pakistan; "Malaysia", "MY" → malaysia;
 * anything else (including an empty profile) → international.
 */

export function normaliseCountry(country: string | null | undefined): string {
  return (country ?? "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function regionForCountry(country: string | null | undefined): PriceRegion {
  const c = normaliseCountry(country);
  if (c === "pk" || c.includes("pakistan")) return "pakistan";
  if (c === "my" || c.includes("malaysia")) return "malaysia";
  return "international";
}

/** Display label of a region, from the published presentation table. */
export function regionLabel(region: PriceRegion): string {
  return PRICE_REGIONS.find((r) => r.key === region)?.label ?? region;
}

/** The price THIS person pays for a programme. Throws when the programme has
 *  no published price for their region — a catalogue defect, not something
 *  to paper over with another region's amount. */
export function priceForUser(programme: ProgrammeRecord, user: { country: string | null }): ProgrammePriceRecord {
  const region = regionForCountry(user.country);
  const price = programme.prices.find((p) => p.region === region);
  if (!price) {
    throw new CommerceError(
      "no_price_for_region",
      `Programme "${programme.slug}" has no published price for region "${region}".`,
    );
  }
  return price;
}
