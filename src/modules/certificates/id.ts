import { randomInt } from "node:crypto";
import { ID_ALPHABET } from "./constants";

/*
 * Certificate ID generation (M6 plan §4; requirements R-D3). Server-side,
 * from a cryptographically secure source: 8 symbols from a 31-symbol
 * alphabet ≈ 8.5 × 10^11 combinations — not guessable, not sequential (the
 * count of certificates issued is never leaked and IDs cannot be
 * enumerated). Uniqueness is enforced by the database's unique index; the
 * issuance service retries on a collision.
 */

export type RandomInt = (maxExclusive: number) => number;

/** `DAA-YYYY-XXXX-XXXX`. `random` is injectable so a test can make the
 *  output deterministic or force a collision. */
export function generateCertificateId(year: number, random: RandomInt = randomInt): string {
  let symbols = "";
  for (let i = 0; i < 8; i += 1) symbols += ID_ALPHABET[random(ID_ALPHABET.length)];
  return `DAA-${String(year).padStart(4, "0")}-${symbols.slice(0, 4)}-${symbols.slice(4)}`;
}
