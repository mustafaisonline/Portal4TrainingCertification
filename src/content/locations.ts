import { certificateBrand } from "./certificate-brand";

/*
 * Company locations shown on /contact-us — CR-2026-10-01-0712 (founder,
 * 2026-10-01): OUR head office on top, the local training PARTNERS under it.
 * Typed content, not database rows (the same reasoning as `contact.ts`): page
 * copy the founder edits, never created at runtime. Adding a partner later is
 * adding one entry to `locations`.
 *
 * Nothing here is invented. Every value is either from the founder's approved
 * records (head office: `certificate-brand.ts`, `contact.ts`) or was READ from
 * the partner's own published pages (see `source`). A detail the partner has
 * not published (WhatsApp, social links, opening hours) is simply absent.
 */

export type LocationKind = "head_office" | "partner";

export type OfficeLocation = {
  id: string;
  kind: LocationKind;
  name: string;
  /** The company's own tagline, when it has one. */
  tagline?: string;
  /** The small label on the card ("Head office", "Local training partner — Pakistan"). */
  roleLabel: string;
  /** What the card shows, in one sentence, when the company describes itself. */
  about?: string;
  logo: { src: string; alt: string; width: number; height: number; tile: "light" | "dark" };
  address: string;
  /** Company registration, where it is shown (head office only). */
  registration?: string;
  /** `display` as the company writes it; `tel` digits for the tap-to-call link. */
  phone?: { display: string; tel: string };
  /** A partner's own address, when it publishes one. The head office shows none: our contact route is the Contact Us form (CR-2026-10-03-1246). */
  email?: string;
  website: { url: string; label: string };
  /** Where the details were read from, and when — for the next person to re-check. */
  source?: string;
};

export const headOffice: OfficeLocation = {
  id: "your-partner-technologies",
  kind: "head_office",
  name: certificateBrand.legalName,
  roleLabel: "Head office",
  logo: { src: "/brand/ypt-logo.jpg", alt: "Your Partner Technologies logo", width: 96, height: 96, tile: "light" },
  address: certificateBrand.address ?? "",
  ...(certificateBrand.registrationNumber ? { registration: certificateBrand.registrationNumber } : {}),
  // No telephone: none has been supplied. A line appears here only when the founder gives one.
  website: { url: "https://yourpartnertechnologies.com", label: "yourpartnertechnologies.com" },
  source: "Founder's records (2026-09-29): company number, address, sales email; website checked live 2026-10-01.",
};

export const infocentric: OfficeLocation = {
  id: "infocentric",
  kind: "partner",
  name: "Infocentric",
  tagline: "Digital Transformation using AI",
  roleLabel: "Local training partner — Pakistan",
  about: "Helping customers to achieve their productivity and innovation goals through AI-driven technology solutions and enterprise data management services.",
  // A 156 × 36 px wordmark, white on transparent: it is shown on a dark tile.
  logo: { src: "/brand/partners/infocentric-logo.png", alt: "Infocentric", width: 156, height: 36, tile: "dark" },
  address: "Plaza 241, Spring North Commercial, Bahria Town Phase 7, Rawalpindi, Pakistan",
  phone: { display: "(+92-51) 8890717", tel: "+92518890717" },
  email: "info@infocentric.pk",
  website: { url: "https://infocentric.pk/", label: "infocentric.pk" },
  source: "https://infocentric.pk/ and https://infocentric.pk/contact-us/, read 2026-10-01 (both agree); logo from https://infocentric.pk/wp-content/uploads/2023/01/infocentric_logo-e1622640352525.png.",
};

/** Head office FIRST, then the partner locations in the order they were added. */
export const locations: readonly OfficeLocation[] = [headOffice, infocentric];

export const partnerLocations = locations.filter((l) => l.kind === "partner");
