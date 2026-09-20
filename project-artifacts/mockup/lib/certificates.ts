import { RENEWAL_WINDOW_DAYS, VALIDITY_MONTHS } from "@/data/certificateConfig";

/**
 * Pure logic for the Certificate of Completion wireframe — no React, no
 * storage, no clock reads (callers pass `now`), so every rule below can be
 * tested in isolation and lifted into the backend unchanged.
 *
 * Dates are ISO calendar dates ("2026-09-20"), compared as dates, not
 * instants, so a timezone cannot flip a certificate between active and
 * expired mid-day. The real product must do the same, in a stated timezone
 * (decision D9).
 */

export type CertificateStatus = "active" | "renewal-due" | "expired";

export type Certificate = {
  /** Human-readable, non-sequential: DAA-2026-XXXX-XXXX. */
  id: string;
  holderName: string;
  programmeTitle: string;
  formatName: string;
  /** Date the holder completed the programme (ISO). */
  completedOn: string;
  /** Date the certificate was first issued (ISO). */
  issuedOn: string;
  /** Last day the certificate is active (ISO, inclusive). */
  expiresOn: string;
  /** Holder has consented to appear in public NAME search. ID/URL lookup
   *  works regardless — anyone the holder shares the link with can verify. */
  listed: boolean;
  /** True for every record in this wireframe. Rendered as a watermark and a
   *  "Sample" chip — see data/certificates.ts. */
  sample: boolean;
};

const DAY_MS = 86_400_000;

export function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fromIso(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Calendar-month arithmetic that clamps to month end (31 Jan + 1 month =
 *  28/29 Feb, never 3 March). */
export function addMonths(iso: string, months: number): string {
  const d = fromIso(iso);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, lastDay));
  return toIso(d);
}

export function addDays(iso: string, days: number): string {
  return toIso(new Date(fromIso(iso).getTime() + days * DAY_MS));
}

/** Whole calendar days from `a` to `b` (positive when b is later). */
export function daysBetween(aIso: string, bIso: string): number {
  return Math.round((fromIso(bIso).getTime() - fromIso(aIso).getTime()) / DAY_MS);
}

export function formatDate(iso: string): string {
  return fromIso(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Active through `expiresOn` inclusive; expired the day after. */
export function statusOf(expiresOn: string, now: Date): {
  status: CertificateStatus;
  /** Days until expiry (>= 0 while active); days since expiry (> 0) if expired. */
  days: number;
} {
  const today = toIso(now);
  const left = daysBetween(today, expiresOn);
  if (left < 0) return { status: "expired", days: -left };
  return { status: left <= RENEWAL_WINDOW_DAYS ? "renewal-due" : "active", days: left };
}

/** Renewal opens RENEWAL_WINDOW_DAYS before expiry and stays open after. */
export function canRenew(expiresOn: string, now: Date): boolean {
  return statusOf(expiresOn, now).status !== "active";
}

/** New expiry after a renewal. PROPOSED (decision D7): renewing on time
 *  extends from the OLD expiry so no paid time is lost; renewing after a lapse
 *  extends from today. */
export function renewedExpiry(expiresOn: string, now: Date): string {
  const today = toIso(now);
  return addMonths(daysBetween(today, expiresOn) >= 0 ? expiresOn : today, VALIDITY_MONTHS);
}

export function initialExpiry(issuedOn: string): string {
  return addMonths(issuedOn, VALIDITY_MONTHS);
}

// ---------------------------------------------------------------------------
// Identifiers
// ---------------------------------------------------------------------------

/**
 * Real ID format: DAA-YYYY-XXXX-XXXX, where X is drawn from an alphabet with
 * the look-alikes removed (no 0/O, 1/I/L). 8 random characters from 31 symbols
 * ≈ 8.5×10^11 combinations — not guessable, not sequential (so the count of
 * certificates issued is not leaked, and IDs cannot be enumerated).
 *
 * SAMPLE IDs in this wireframe deliberately contain `0` and `1`, which the
 * real alphabet never produces — so a sample ID can NEVER collide with, or be
 * mistaken for, a real one. The backend must generate IDs server-side from a
 * cryptographically secure source and enforce uniqueness (docs §4, C-list).
 */
export const ID_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

const ID_LOOSE = /^DAA(\d{4})([A-Z0-9]{4})([A-Z0-9]{4})$/;

/** Accept what a person actually types: any case, spaces, missing hyphens.
 *  Returns the canonical ID, or null if the input is not shaped like one. */
export function normaliseId(input: string): string | null {
  const squashed = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const m = ID_LOOSE.exec(squashed);
  return m ? `DAA-${m[1]}-${m[2]}-${m[3]}` : null;
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

/** Minimum characters for a NAME search — stops "a" from returning everyone
 *  (anti-enumeration; the real product also rate-limits). */
export const MIN_NAME_QUERY = 3;
/** Cap on name-search results, for the same reason. */
export const MAX_NAME_RESULTS = 10;

export type SearchOutcome =
  | { kind: "empty" }
  | { kind: "too-short" }
  | { kind: "id"; query: string; results: Certificate[] }
  | { kind: "name"; query: string; results: Certificate[]; truncated: boolean };

function words(s: string): string[] {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/**
 * Search rules (PROPOSED — decision D3/D4):
 *  • Input shaped like an ID → exact ID lookup. Finds a certificate whether or
 *    not the holder is listed (the ID is the holder's proof-of-share).
 *  • Otherwise a NAME search: only certificates whose holder opted in to be
 *    listed; every query word must be the start of some word in the name; at
 *    least MIN_NAME_QUERY characters; at most MAX_NAME_RESULTS shown.
 *  • A name search never reveals the existence of an unlisted holder.
 */
export function search(input: string, registry: Certificate[]): SearchOutcome {
  const q = input.trim();
  if (!q) return { kind: "empty" };

  const id = normaliseId(q);
  if (id) {
    return { kind: "id", query: id, results: registry.filter((c) => c.id === id) };
  }

  const qWords = words(q);
  if (q.replace(/\s/g, "").length < MIN_NAME_QUERY || qWords.length === 0) {
    return { kind: "too-short" };
  }
  const hits = registry.filter((c) => {
    if (!c.listed) return false;
    const nameWords = words(c.holderName);
    return qWords.every((qw) => nameWords.some((nw) => nw.startsWith(qw)));
  });
  return {
    kind: "name",
    query: q,
    results: hits.slice(0, MAX_NAME_RESULTS),
    truncated: hits.length > MAX_NAME_RESULTS,
  };
}
