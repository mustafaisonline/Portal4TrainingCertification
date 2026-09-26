/*
 * Public shape of a programme as the pages consume it. Mirrors the
 * founder-reviewed content structure of the mockup's `Course` type
 * (project-artifacts/mockup/data/courses.ts) so ported pages keep their
 * field names; the editorial sections live in `programmes.content` (jsonb)
 * and the relational parts (modules, formats, prices, experts) are joined.
 */

export type ProgrammeLevel = "foundation" | "practitioner" | "architect" | "executive" | "builder" | "mentorship";
export type ProgrammeStatus = "published" | "unlisted" | "retired";
/** One fee row per training per region (M12 WP1, four rows). Mirrors the
 *  `price_region` enum. `malaysia_hrdcorp` is display-only: claimed through
 *  the employer's HRD Corp levy, never charged at checkout (L5). */
export type PriceRegion = "malaysia" | "malaysia_hrdcorp" | "pakistan" | "international";
/** The regions a participant can be assigned at checkout by their country
 *  (`regionForCountry`) — every region except the HRD Corp row. Also the
 *  three tabs of the mentorship packages. */
export type CheckoutRegion = Exclude<PriceRegion, "malaysia_hrdcorp">;

export type MentorshipPackage = {
  id: string;
  badge: string;
  name: string;
  duration: string;
  idealFor: string;
  includesLead?: string;
  includes: string[];
  featured?: boolean;
  /** Published figures, verbatim (packages are priced per package). */
  pricing: Record<CheckoutRegion, { original: string; discount: string; save: string; today: string }>;
};

export type ProgrammeContent = {
  highlights: string[];
  whoShouldAttend: { intro: string; roles: string[] };
  rationale: { heading: string; paragraphs: string[]; problems?: string[] };
  outcomes?: string[];
  outcomeGroups?: { title: string; items: string[] }[];
  included?: string[];
  pedagogy?: { intro: string; methods: string[]; industries?: string[] };
  benefits?: { intro: string; items: string[] };
  careerPaths?: { from: string; to: string; challenge: string; helps: string }[];
  methodology?: { name: string; steps: { title: string; body: string }[] };
  valueStack?: { item: string; value: string }[];
  valueStackTotal?: string;
  /** Slugs of related programmes. */
  related: string[];
  externalResources?: { label: string; url: string; description: string }[];
  mentorshipPackages?: MentorshipPackage[];
  /* Optional editorial sections added 2026-09-26 for the Learn Vibe Coding
   * training (founder request). Each renders only when present. */
  /** One sentence placing this training relative to another (shown under the hero proposition). */
  relationshipNote?: string;
  /** "What you can do straight after" — a founder-directed outcomes block. */
  afterThisTraining?: { heading: string; intro: string; items: string[] };
  /** Questions and answers rendered as native <details>. */
  faq?: { q: string; a: string }[];
  /* Founder change list 2026-09-26 (second round). Each renders only when
   * present; `included`, `valueStack` and `valueStackTotal` above are kept
   * for the unlisted programmes but the two published pages no longer
   * render them. */
  /** "What you get out of this training" — rendered before the Investment section. */
  whatYouGet?: string[];
  /** Participant numbers per format, listed under the "Choose your pace" cards. */
  paceNotes?: string[];
  /* `regionalPricing` (2026-09-26, presentation JSON for notes and the
   * "Via / Without HRD Corp" options) was RETIRED by M12 WP1 the same day:
   * every figure, minimum and note is now a `programme_prices` row
   * (`ProgrammePriceRecord`), editable from the admin area. The migration
   * `20260926130859_fee_structure_four_rows` back-filled and removed it. */
};

/** A group of points inside a module — a sub-heading with its own list.
 *  Introduced 2026-09-26 for the flagship's two-module curriculum, whose
 *  Module 1 groups the ten Data Blueprint topics and whose Module 2 groups
 *  the six Learn Vibe Coding parts. Stored in the existing
 *  `programme_modules.points` JSON column (no schema change). */
export type ModulePointGroup = { title: string; description?: string | null; points?: string[] };

/** One entry of `programme_modules.points`: a plain point, or a group. */
export type ModulePoint = string | ModulePointGroup;

export type ProgrammeModuleRecord = {
  position: number;
  title: string;
  description: string | null;
  points: ModulePoint[] | null;
};

export type DeliveryFormatRecord = {
  id: string;
  code: string;
  name: string;
  badge: string | null;
  durationLabel: string;
  scheduleLabel: string;
  totalTimeLabel: string;
  bestFor: string[];
  position: number;
};

export type ProgrammePriceRecord = {
  region: PriceRegion;
  currency: string;
  /** Minor units (e.g. sen, paisa, cents). */
  listAmountMinor: number;
  offerAmountMinor: number;
  offerLabel: string;
  offerName: string;
  /** "minimum N participants", when the fee assumes a group (M12 WP1). */
  minParticipants: number | null;
  /** Note under the figure, e.g. "There is no online option in Malaysia." */
  note: string | null;
};

export type ProgrammeExpertSummary = {
  id: string;
  slug: string;
  name: string;
  roleTitle: string;
  headline: string;
  photoPath: string;
};

export type ProgrammeRecord = {
  id: string;
  domainId: string;
  slug: string;
  title: string;
  subtitle: string;
  level: ProgrammeLevel;
  status: ProgrammeStatus;
  flagship: boolean;
  durationLabel: string;
  prerequisites: string;
  formats: string[];
  certificateLabel: string;
  audienceSummary: string;
  summary: string;
  valueProposition: string;
  content: ProgrammeContent;
  sortOrder: number;
  modules: ProgrammeModuleRecord[];
  deliveryFormats: DeliveryFormatRecord[];
  prices: ProgrammePriceRecord[];
  experts: ProgrammeExpertSummary[];
};

/** Listing card shape — no editorial payload. */
export type ProgrammeSummary = Pick<
  ProgrammeRecord,
  "id" | "slug" | "title" | "subtitle" | "level" | "status" | "flagship" | "durationLabel" | "formats" | "certificateLabel" | "audienceSummary" | "summary" | "sortOrder"
>;

/** How a region pays. Founder rule 2026-09-26: Malaysia pays by card in
 *  RM, everyone outside Malaysia and Pakistan pays by card in USD, and
 *  Pakistan cannot pay by card — a local partner arranges payment through
 *  local banks or in cash. `hrd_corp` (M12 L5): the fee is claimed through
 *  the participant's employer under HRD Corp — shown, never charged here.
 *  Read by the pricing cards (what to show) and by the checkout service
 *  (what to refuse) so the two can never disagree. */
export type RegionPayment = "card" | "local_partner" | "hrd_corp";

/** The pricing CARD a fee row is shown on. Both Malaysian rows share the
 *  "Malaysia" card, one figure each, labelled by `optionLabel`. */
export type PriceCard = CheckoutRegion;

/** Region presentation as published (labels, not amounts). Subtitles and
 *  badges rewritten 2026-09-26 (founder): the "Save up to 50%" / "Regional
 *  scholarship" framing is retired; each region states how it pays, and the
 *  badge names the 75% launch discount (shown only where list > offer).
 *  M12 WP1 (same day): a fourth row, Malaysia via HRD Corp; "International"
 *  renamed "Rest of the world" (L12). ORDER = the founder's fee-row order:
 *  Malaysia via HRD Corp · Malaysia not via HRD Corp · Pakistan · Rest of
 *  the world (the public cards keep their own order — `PRICE_CARD_ORDER`). */
export const PRICE_REGIONS: {
  key: PriceRegion;
  /** Full name, as the admin Fees screen and the listing card name it. */
  label: string;
  short: string;
  subtitle: string;
  badge: string;
  discountLabel: string;
  payment: RegionPayment;
  /** Which public pricing card carries this row. */
  card: PriceCard;
  /** Row label on a card that shows more than one figure. */
  optionLabel: string;
}[] = [
  { key: "malaysia_hrdcorp", label: "Malaysia — via HRD Corp", short: "MY·HRD", subtitle: "Claimed through your employer under HRD Corp", badge: "HRD Corp claimable", discountLabel: "Discount", payment: "hrd_corp", card: "malaysia", optionLabel: "Via HRD Corp" },
  { key: "malaysia", label: "Malaysia", short: "MY", subtitle: "Card payment in RM", badge: "75% launch discount", discountLabel: "Discount", payment: "card", card: "malaysia", optionLabel: "Without HRD Corp" },
  { key: "pakistan", label: "Pakistan", short: "PK", subtitle: "Payment through our local partner", badge: "75% launch discount", discountLabel: "Discount", payment: "local_partner", card: "pakistan", optionLabel: "Pakistan" },
  { key: "international", label: "Rest of the world", short: "RoW", subtitle: "Card payment in USD", badge: "75% launch discount", discountLabel: "Discount", payment: "card", card: "international", optionLabel: "Rest of the world" },
];

/** The public cards in the founder's order (2026-09-26, item 2.1): USD, RM, Rs. */
export const PRICE_CARD_ORDER: PriceCard[] = ["international", "malaysia", "pakistan"];

/** Presentation of a card: the checkout-region row's metadata (its label,
 *  how it pays). Every card key is itself a region key, by construction. */
export function priceCardMeta(card: PriceCard): (typeof PRICE_REGIONS)[number] {
  return PRICE_REGIONS.find((r) => r.key === card)!;
}

/** The fee rows shown on one card, in `PRICE_REGIONS` order (HRD Corp
 *  first on the Malaysia card, as published). */
export function pricesForCard(prices: ProgrammePriceRecord[], card: PriceCard): ProgrammePriceRecord[] {
  return PRICE_REGIONS.filter((r) => r.card === card).flatMap((r) => prices.filter((p) => p.region === r.key));
}

/** Metadata of one fee row. */
export function priceRegionMeta(region: PriceRegion): (typeof PRICE_REGIONS)[number] {
  return PRICE_REGIONS.find((r) => r.key === region)!;
}

/** The sentence shown wherever a region pays through the local partner —
 *  the Pakistan pricing card and the checkout screen. Lives here (a `types`
 *  module) so the client-side pricing card can import it without pulling
 *  the commerce module into the browser bundle; commerce re-exports it. */
export const LOCAL_PARTNER_PAYMENT_MESSAGE =
  "Please contact us — our local partner will contact you to arrange payment through local banks or in cash.";

/** Whether a region can pay by card at checkout (see `RegionPayment`). */
export function cardPaymentAvailable(region: PriceRegion): boolean {
  return PRICE_REGIONS.find((r) => r.key === region)?.payment === "card";
}

const CURRENCY_PREFIX: Record<string, string> = { MYR: "RM", PKR: "Rs.", USD: "USD" };

/** The published prefix of a currency ("RM", "Rs.", "USD") — for labels
 *  that name the currency without an amount. */
export function currencyPrefix(currency: string): string {
  return CURRENCY_PREFIX[currency] ?? currency;
}

/** Formats minor units the way the source site published them
 *  ("RM 4,999", "Rs. 102,839.86", "USD 2,811"). */
export function formatMoney(amountMinor: number, currency: string): string {
  const prefix = CURRENCY_PREFIX[currency] ?? currency;
  const major = amountMinor / 100;
  const hasCents = amountMinor % 100 !== 0;
  const text = major.toLocaleString("en-MY", { minimumFractionDigits: hasCents ? 2 : 0, maximumFractionDigits: 2 });
  return `${prefix} ${text}`;
}

/** Display form of a level (DR-01: display only). */
export function levelLabel(level: ProgrammeLevel): string {
  return level.charAt(0).toUpperCase() + level.slice(1);
}
