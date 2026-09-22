/*
 * Certificates of Completion — pure vocabulary (Milestone 6;
 * MILESTONE_6_EXECUTION_PLAN.md §3 E1, E5, E6; COMPLETION_CERTIFICATE_
 * REQUIREMENTS.md §3, §4). No database import: client components (the
 * listing toggle, the status chip) read labels and limits from here
 * (tests/unit/boundaries.test.ts allows a module named `constants`).
 *
 * This certificate records completion of a programme. It is NOT the
 * Academy's earned credential (DR-01, DR-02 §6) and nothing here may
 * describe it as such.
 */

/** ID symbols with the look-alikes removed (no 0/O, 1/I/L): 31 symbols. */
export const ID_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

/** A certificate is active for this many calendar months from issue (E5). */
export const VALIDITY_MONTHS = 12;

/** Renewal opens this many days before expiry and stays open after (E5). */
export const RENEWAL_WINDOW_DAYS = 30;

/** Minimum non-space characters for a public NAME search (anti-enumeration). */
export const MIN_NAME_QUERY = 3;

/** Cap on name-search results; the page says "narrow your search" beyond it. */
export const MAX_NAME_RESULTS = 10;

/** Every certificate date is a calendar date in this zone (E6 / D9). */
export const CERTIFICATE_TIMEZONE = "Asia/Kuala_Lumpur";

/** `consents.document_key` for the opt-in to public name search (E3). */
export const LISTING_CONSENT_KEY = "certificate_listing";
/** Version of the listing wording the holder agreed to. Bump when it changes. */
export const LISTING_CONSENT_VERSION = "2026-09-22";

export const CERTIFICATE_STATUSES = ["active", "renewal_due", "expired", "revoked"] as const;
export type CertificateStatus = (typeof CERTIFICATE_STATUSES)[number];

export const CERTIFICATE_STATUS_LABEL: Record<CertificateStatus, string> = {
  active: "Active",
  renewal_due: "Active · renewal due",
  expired: "Expired",
  revoked: "Revoked",
};

export function isCertificateStatus(value: string): value is CertificateStatus {
  return (CERTIFICATE_STATUSES as readonly string[]).includes(value);
}

/** The canonical form: DAA-YYYY-XXXX-XXXX with X from `ID_ALPHABET`. */
const CANONICAL_ID_RE = /^DAA-\d{4}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}$/;

/** True when `value` is already a canonical certificate ID (strict: case,
 *  hyphens and alphabet). Use `normaliseId` (rules.ts) for what a person typed. */
export function isCertificateIdShaped(value: string): boolean {
  return CANONICAL_ID_RE.test(value);
}
