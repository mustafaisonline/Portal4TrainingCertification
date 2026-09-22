import type { ReviewRequirement } from "@/modules/reviews/visibility";
import { MIN_NAME_QUERY, RENEWAL_WINDOW_DAYS, VALIDITY_MONTHS, type CertificateStatus } from "./constants";
import { addMonths, daysBetween } from "./dates";

/*
 * The certificate rules — PURE, ported unchanged in substance from the
 * wireframe's tested logic (project-artifacts/mockup/lib/certificates.ts,
 * 42 assertions on 2026-09-20; requirements §4) with two additions the
 * founder approved on 2026-09-22: a `revoked` state that wins over every
 * other (E8) and name normalisation for the search column (E3, §5).
 *
 * No clock reads, no database: callers pass today's MYT calendar date
 * (`todayIso` from ./dates). Calendar dates are compared as dates, never as
 * instants, so a timezone cannot flip a certificate mid-day (D9).
 */

export type StatusInput = {
  /** Last day the certificate is active, inclusive (YYYY-MM-DD). */
  expiresOn: string;
  revokedAt: Date | null;
};

export type StatusResult = {
  status: CertificateStatus;
  /** Days until expiry (≥ 0 while active / renewal due); days since expiry
   *  (> 0) when expired; 0 when revoked. */
  days: number;
};

/** R-L1: revoked wins; expired the day AFTER `expiresOn`; renewal due from
 *  30 days before expiry through the expiry date itself; otherwise active. */
export function statusOf(c: StatusInput, today: string): StatusResult {
  if (c.revokedAt) return { status: "revoked", days: 0 };
  const left = daysBetween(today, c.expiresOn);
  if (left < 0) return { status: "expired", days: -left };
  return { status: left <= RENEWAL_WINDOW_DAYS ? "renewal_due" : "active", days: left };
}

/** Renewal opens RENEWAL_WINDOW_DAYS before expiry and stays open after
 *  lapse (E5); a revoked certificate cannot be renewed (E8). */
export function canRenew(c: StatusInput, today: string): boolean {
  const { status } = statusOf(c, today);
  return status === "renewal_due" || status === "expired";
}

/** E5 / D7: on time → extend from the OLD expiry so no paid time is lost;
 *  lapsed → extend from today. Always +12 calendar months, month-end clamped. */
export function renewedExpiry(expiresOn: string, today: string): string {
  return addMonths(today <= expiresOn ? expiresOn : today, VALIDITY_MONTHS);
}

export function initialExpiry(issuedOn: string): string {
  return addMonths(issuedOn, VALIDITY_MONTHS);
}

/* ------------------------------------------------------------- identifiers */

const ID_LOOSE = /^DAA(\d{4})([A-Z0-9]{4})([A-Z0-9]{4})$/;

/** Accept what a person actually types — any case, spaces, missing hyphens —
 *  and return the canonical `DAA-YYYY-XXXX-XXXX`, or null when the input is
 *  not shaped like an ID. Shape only: whether it EXISTS is the database's answer. */
export function normaliseId(input: string): string | null {
  const squashed = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const m = ID_LOOSE.exec(squashed);
  return m ? `DAA-${m[1]}-${m[2]}-${m[3]}` : null;
}

/* ------------------------------------------------------------------- names */

/** Lower-cased, NFKD accent-stripped, punctuation → space, single-spaced,
 *  trimmed. The value stored in `holder_name_search` AND applied to every
 *  query word, so the two can never drift apart. */
export function normaliseName(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function nameWords(s: string): string[] {
  const n = normaliseName(s);
  return n ? n.split(" ") : [];
}

/* ------------------------------------------------------------------ search */

export type SearchClassification =
  | { kind: "empty" }
  | { kind: "too_short" }
  | { kind: "id"; id: string }
  | { kind: "name"; words: string[] };

/**
 * Requirements §5: an input shaped like an ID → exact lookup (listed or not);
 * otherwise a NAME search needing ≥ MIN_NAME_QUERY non-space characters.
 * The repository applies "every word is a word-prefix of the stored name".
 */
export function classifySearch(input: string): SearchClassification {
  const q = input.trim();
  if (!q) return { kind: "empty" };
  const id = normaliseId(q);
  if (id) return { kind: "id", id };
  const words = nameWords(q);
  if (q.replace(/\s/g, "").length < MIN_NAME_QUERY || words.length === 0) return { kind: "too_short" };
  return { kind: "name", words };
}

/* -------------------------------------------------------------------- gate */

/** E9: the certificate DOCUMENT is served unless a review is still owed.
 *  `satisfied` and `not_applicable` both unlock it; issuance, status and the
 *  public verification page are never gated. */
export function documentUnlocked(requirement: ReviewRequirement): boolean {
  return requirement !== "required";
}
