import { fixedWindowOverLimit } from "@/modules/platform/rate-limit";

/*
 * A per-ADDRESS cap on the emails anyone can trigger without signing in
 * (security review, CR-2026-10-03-1245): the endpoints that send a verification
 * or password-reset link are limited per IP by Better Auth, which does nothing
 * against many IPs aiming at ONE address — a way to email-bomb a person and burn
 * the SMTP quota and sender reputation. At most one such email per address every
 * two minutes and five a day, per kind. Counted in the database (restart-safe).
 * A refused send is silent to the caller (the screens answer neutrally anyway).
 */
const TWO_MINUTES = 2 * 60 * 1000;
const ONE_DAY = 24 * 60 * 60 * 1000;

export async function identityEmailAllowed(kind: "verify" | "reset", address: string, now: number = Date.now()): Promise<boolean> {
  const key = `${kind}mail:${address.trim().toLowerCase()}`;
  if (await fixedWindowOverLimit(`${key}:2m`, TWO_MINUTES, 1, now)) return false;
  if (await fixedWindowOverLimit(`${key}:1d`, ONE_DAY, 5, now)) return false;
  return true;
}
