/*
 * Public shape of a programme as the pages consume it. Mirrors the
 * founder-reviewed content structure of the mockup's `Course` type
 * (project-artifacts/mockup/data/courses.ts) so ported pages keep their
 * field names; the editorial sections live in `programmes.content` (jsonb)
 * and the relational parts (modules, formats, prices, experts) are joined.
 */

export type ProgrammeLevel = "foundation" | "practitioner" | "architect" | "executive" | "builder" | "mentorship";
export type ProgrammeStatus = "published" | "unlisted" | "retired";
export type PriceRegion = "malaysia" | "pakistan" | "international";

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
  pricing: Record<PriceRegion, { original: string; discount: string; save: string; today: string }>;
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
  /** Per-region presentation that the single `programme_prices` row cannot
   *  carry: a note under the figure, and — where a region publishes more
   *  than one figure (the flagship in Pakistan: in-person and online) — the
   *  options. The `programme_prices` row stays the one authoritative amount
   *  for checkout; `options` are display strings and one of them must equal
   *  that row (asserted in tests/integration/catalogue.test.ts). */
  regionalPricing?: Partial<
    Record<
      PriceRegion,
      {
        note?: string;
        options?: { label: string; original: string; today: string; minParticipants?: number }[];
      }
    >
  >;
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
 *  local banks or in cash. Read by the pricing cards (what to show) and by
 *  the checkout service (what to refuse) so the two can never disagree. */
export type RegionPayment = "card" | "local_partner";

/** Region presentation as published (labels, not amounts). Subtitles and
 *  badges rewritten 2026-09-26 (founder): the "Save up to 50%" / "Regional
 *  scholarship" framing is retired; each region states how it pays, and the
 *  badge names the 75% launch discount (shown only where list > offer). */
export const PRICE_REGIONS: {
  key: PriceRegion;
  label: string;
  short: string;
  subtitle: string;
  badge: string;
  discountLabel: string;
  payment: RegionPayment;
}[] = [
  { key: "malaysia", label: "Malaysia", short: "MY", subtitle: "Card payment in RM", badge: "75% launch discount", discountLabel: "Discount", payment: "card" },
  { key: "pakistan", label: "Pakistan", short: "PK", subtitle: "Payment through our local partner", badge: "75% launch discount", discountLabel: "Discount", payment: "local_partner" },
  { key: "international", label: "International", short: "INT", subtitle: "Card payment in USD", badge: "75% launch discount", discountLabel: "Discount", payment: "card" },
];

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
