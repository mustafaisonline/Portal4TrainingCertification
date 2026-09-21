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
};

export type ProgrammeModuleRecord = {
  position: number;
  title: string;
  description: string | null;
  points: string[] | null;
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

/** Region presentation as published (labels, not amounts). */
export const PRICE_REGIONS: { key: PriceRegion; label: string; short: string; subtitle: string; badge: string; discountLabel: string }[] = [
  { key: "malaysia", label: "Malaysia", short: "MY", subtitle: "Founder's launch offer", badge: "Save up to 50%", discountLabel: "Discount" },
  { key: "pakistan", label: "Pakistan", short: "PK", subtitle: "Regional scholarship programme", badge: "Regional scholarship", discountLabel: "Scholarship" },
  { key: "international", label: "International", short: "INT", subtitle: "Global professional pricing", badge: "Global launch offer", discountLabel: "Discount" },
];

const CURRENCY_PREFIX: Record<string, string> = { MYR: "RM", PKR: "Rs.", USD: "USD" };

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
