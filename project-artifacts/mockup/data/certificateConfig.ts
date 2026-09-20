/**
 * Certificate of Completion — policy constants. Added 2026-09-20, founder
 * requirement: a certificate with a unique ID that expires every year and
 * stays active only while the holder pays an annual fee ("USD 10 … this amount
 * can change at a later stage").
 *
 * ⚠ EVERY VALUE HERE IS A PROPOSED DEFAULT, not an approved rule. The full
 * list of open decisions is docs/execution/COMPLETION_CERTIFICATE_REQUIREMENTS.md
 * §6. Only the fee amount/currency and the one-year cadence come from the
 * founder; the rest are conventional defaults flagged for approval.
 *
 * ⚠ THE FEE MUST NOT STAY A CONSTANT. The founder said it will change. In the
 * real product it is administrator-managed configuration stored in the
 * database, EFFECTIVE-DATED (a change applies to future renewals only), and
 * every renewal records the amount actually charged. This file is the one
 * place the wireframe reads it from, so replacing it is a single swap.
 */
export const RENEWAL_FEE = { amount: 10, currency: "USD" } as const;

/** How long a certificate is active after issue or renewal. Founder: yearly. */
export const VALIDITY_MONTHS = 12;

/** PROPOSED: renewal opens this many days before expiry (and stays open after
 *  it lapses). Not founder-specified — decision D6. */
export const RENEWAL_WINDOW_DAYS = 30;

/** Human-readable ID prefix. Real IDs are `DAA-YYYY-XXXX-XXXX`; see
 *  lib/certificates.ts for the format and why sample IDs can never collide. */
export const ID_PREFIX = "DAA";

export function formatFee(fee = RENEWAL_FEE): string {
  return `${fee.currency} ${fee.amount}`;
}
