import type { DemoRegistration } from "@/lib/demoRegistrations";
import { DEMO_EMAIL } from "@/lib/demoCredentials";
import { getCourse, pricingRegions, type RegionKey } from "./courses";

/**
 * SAMPLE DATA for the signed-in wireframe — added 2026-09-20, REWORKED
 * later the same day (founder direction: "show only one programme", let the
 * user pick a currency, keep all payment options, simulate a confirmed
 * payment inside the demo session).
 *
 * ⚠ ILLUSTRATIVE, AND LABELLED "SAMPLE" WHEREVER IT APPEARS. When asked, the
 * founder chose labelled illustrative dates over honest "date to be
 * announced" states, knowingly overriding the DR-02 §4.1 default (no
 * invented dates — no real scheduled offering exists). The override is
 * confined to this file and to screens that render `SampleTag`. It is not a
 * claim that any cohort has run or any session is scheduled. Do not lift any
 * value here into a real page.
 *
 * WHAT IS REAL: the programme (its title as shown on the public
 * /DataBlueprint-AIVibeCoding page, outcomes, curriculum, "included" list,
 * the three delivery formats and their durations/schedules, and the
 * published price in every currency) — all read from data/courses.ts — and
 * the trainer's name (the founder is the Academy's one real trainer).
 *
 * WHAT IS INVENTED: the participant ("Demo Participant"), every start date,
 * order number and payment state. There are NO pre-existing registrations:
 * the demo participant starts with none and acquires one only by walking the
 * checkout (stored in the browser tab — lib/demoRegistrations.ts). No other
 * person, expert, company or venue is invented (DR-02 §7).
 */

export const demoParticipant = {
  name: "Demo Participant",
  initials: "DP",
  email: DEMO_EMAIL,
  country: "Malaysia",
};

export const SAMPLE_TRAINER = "Mustafa Qizilbash";

/** The ONE programme the Academy offers (founder, 2026-09-06 "we are
 *  offering only one training"; confirmed for the signed-in area
 *  2026-09-20). Same entry the public programme page reads. */
export const FLAGSHIP_SLUG = "ai-powered-product-development";

/** Display title, duplicated from app/DataBlueprint-AIVibeCoding/page.tsx
 *  (`flagshipDisplayTitle`) — a page-level override there, not a data field.
 *  ⚠ PLACEHOLDER: the founder is still supplying the real Data Blueprint +
 *  Vibe Coding curriculum; when that lands, change both places (or hoist the
 *  title into data/courses.ts). */
export const PROGRAMME_TITLE = "Data Blueprint & AI / Vibe Coding";

export function getFlagship() {
  return getCourse(FLAGSHIP_SLUG);
}

/** A bookable start date for one of the programme's REAL delivery formats.
 *  The formats (Bootcamp / Accelerator / Mastery), their durations and
 *  schedules come from courses.ts `deliveryFormats`; the start/end dates are
 *  the invented, "Sample"-tagged part. Delivery mode (in-person / online) and
 *  venue are not stated by any source, so none is shown. */
export type Offering = {
  id: "bootcamp" | "accelerator" | "mastery";
  /** Must equal a `deliveryFormats[].name` in courses.ts. */
  formatName: "Bootcamp" | "Accelerator" | "Mastery";
  dates: string;
  startsOn: string;
};

export const offerings: Offering[] = [
  { id: "bootcamp", formatName: "Bootcamp", startsOn: "Thu 12 Nov 2026", dates: "Thu 12 – Fri 13 Nov 2026" },
  { id: "accelerator", formatName: "Accelerator", startsOn: "Mon 16 Nov 2026", dates: "Mon 16 – Fri 27 Nov 2026" },
  { id: "mastery", formatName: "Mastery", startsOn: "Mon 16 Nov 2026", dates: "Mon 16 Nov – Fri 11 Dec 2026" },
];

export function getOffering(id: string) {
  return offerings.find((o) => o.id === id);
}

/** The real delivery-format record (duration, schedule, total time, best
 *  for) behind an offering. */
export function getDeliveryFormat(offering: Offering) {
  return getFlagship()?.deliveryFormats?.find((f) => f.name === offering.formatName);
}

/** Currency the participant chooses to pay in — founder direction
 *  2026-09-20: "show prices in all the available currencies and let the user
 *  decide". Keys are the three published price regions in courses.ts.
 *  ⚠ The Pakistan price is a REGIONAL SCHOLARSHIP (70% off) and the
 *  International price a 10% offer; no eligibility rule exists for either, so
 *  offering all three to everyone is a founder-directed simplification —
 *  recorded as an open business rule in docs/execution/
 *  ACCOUNT_AND_PAYMENT_REQUIREMENTS.md, not decided here. */
export const currencyChoices: {
  key: RegionKey;
  name: string;
  code: string;
}[] = [
  { key: "malaysia", name: "Malaysian ringgit", code: "RM" },
  { key: "pakistan", name: "Pakistani rupee", code: "Rs." },
  { key: "international", name: "US dollar", code: "USD" },
];

export function getCurrencyChoice(key: RegionKey) {
  return currencyChoices.find((c) => c.key === key) ?? currencyChoices[0];
}

export function getRegionMeta(key: RegionKey) {
  return pricingRegions.find((r) => r.key === key) ?? pricingRegions[0];
}

/** Payment methods drawn at checkout. Founder direction 2026-09-20: "keep
 *  all the options" (card AND the other methods). The exact list is NOT
 *  decided — it depends on the Stripe account configuration and the open
 *  Malaysian rail (ADR-014) — so these are deliberately generic labels, not
 *  brand names, and are candidates only. */
export type PaymentMethodKey = "card" | "online-banking" | "e-wallet";

export const paymentMethods: {
  key: PaymentMethodKey;
  label: string;
  note: string;
}[] = [
  { key: "card", label: "Credit or debit card", note: "Pay by card, processed by Stripe" },
  { key: "online-banking", label: "Online banking", note: "Pay from your bank account" },
  { key: "e-wallet", label: "E-wallet", note: "Pay from a supported wallet app" },
];

export function getPaymentMethod(key: PaymentMethodKey) {
  return paymentMethods.find((m) => m.key === key) ?? paymentMethods[0];
}

/** A stored demo registration joined with the real records behind it. The
 *  price is the real published price for the chosen currency. */
export function describeRegistration(reg: DemoRegistration) {
  const course = getFlagship();
  const offering = getOffering(reg.offeringId);
  return {
    reg,
    course,
    offering,
    format: offering ? getDeliveryFormat(offering) : undefined,
    price: course?.pricing?.[reg.currency],
    currency: getCurrencyChoice(reg.currency),
    method: getPaymentMethod(reg.method),
  };
}
