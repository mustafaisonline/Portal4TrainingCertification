/*
 * Whether an unconfirmed email address blocks sign-in (CR-2026-10-03-1245;
 * founder, 2026-10-03: "send confirmation email with activation link … confirm
 * at database level"). It is a SETTING, off by default: turning it on before
 * mail really reaches people would lock everyone out — the administrator
 * included — so it is switched on only after `npm run email:test` has proved
 * delivery and the existing accounts have been counted as verified
 * (`npm run email:grandfather`). With it OFF the activation email is still
 * sent and the link still confirms the address; sign-in just does not wait.
 */
export function emailVerificationRequired(env: Record<string, string | undefined> = process.env): boolean {
  return env["REQUIRE_EMAIL_VERIFICATION"]?.trim().toLowerCase() === "true";
}
