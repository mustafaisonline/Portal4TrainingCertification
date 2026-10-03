# CR-2026-10-03-1245 — Sign-up: activation link confirmed in the database, plus a human-check game

**Received:** 2026-10-03 12:45 MYT · **Status:** BUILT & VERIFIED — review + deploy next; strict activation stays OFF · **Requested by:** founder · **Model:** opus

## 1. Request (verbatim)

> 4 = For sign-up, please send confirmation email with activation Link. Once user click this link, it should open new webpage and get confiramtion at database level to convfirme user is correct user. please also introduce that features that when user signup, it should show that verfiication game i.e. to verfiy whether user createing new account is ahuman or not

## 2. Facts gathered

- Better Auth already sends a verification email on sign-up (`sendOnSignUp`) and `afterEmailVerification` sets `users.email_verified_at`; `requireEmailVerification` is `false` only because no mail could be delivered (comment in `src/modules/identity/auth.ts`). A `/verify-email` page with a resend control exists. Rate limit for sign-up: 3/min (database-backed).
- A human check does not exist. Free and self-hosted is required (no paid or external CAPTCHA).
- Danger: switching `requireEmailVerification` on before mail really delivers would lock everyone out, including the administrator.

Proposal: [docs/execution/EMAIL_AND_NOTIFICATIONS_PROPOSAL.md](../docs/execution/EMAIL_AND_NOTIFICATIONS_PROPOSAL.md)

## 3. Decisions & assumptions

Decided by the founder on 2026-10-03 (see CR-2026-10-03-1225 §7). Assumptions are listed in the plan; anything uncertain is raised, not guessed.

## 4. Plan

1. Human-check **game** (self-hosted, free, accessible): a server-generated challenge stored in a new table `human_challenges` (single use, 10-minute expiry), shown on the register form; a text alternative for people who cannot use the game; plus a honeypot field and verified server-side in the sign-up hook so a direct POST cannot bypass it. Honest limit: any self-made check is weaker than a commercial CAPTCHA; the emailed activation is the strong control.
2. **Activation**: the link verifies the address, sets `email_verified_at`, and lands on a new confirmation page ("Your email is confirmed", with sign-in); `requireEmailVerification` is controlled by an environment flag (`REQUIRE_EMAIL_VERIFICATION`, default off) so it is switched on only after live delivery is proven; existing accounts are handled by a one-off, founder-approved step so nobody is locked out.
3. Tests: unit + integration + e2e (challenge expiry/replay, wrong answer, honeypot, activation link single-use/expired, unverified sign-in refused when the flag is on); `security-review` before deploy (auth change).

## 5. Tracker

Spec: see `specs/`.

| # | Step | Status | Updated |
|---|---|---|---|
| 1 | Schema: `human_challenges` (new table; keyed hash only, single use, expires after 10 min; **purely additive**, SQL shown in the migration `20261003061100_human_challenges`) — applied to dev + test; production gets it at deploy (backup + migration sandbox first) | **DONE (dev/test)** | 2026-10-03 |
| 2 | Human-check game (`src/modules/identity/human-check.ts`, `app/api/human-check`, `app/(auth)/register/HumanCheck.tsx`): tap-the-shapes with labelled buttons + a text-question alternative; verified on the server in the sign-up hook BEFORE any lookup; one-time, atomic, honeypot; a test-only bypass honoured solely when `APP_ENV=test` | **DONE** | 2026-10-03 |
| 3 | Activation: the emailed link opens the new `/email-confirmed` page, which READS the confirmation back from `users.email_verified_at` and shows it; tampered link → kind error + resend; sign-up success leads to "Check your email" when the setting is on | **DONE** | 2026-10-03 |
| 4 | Strict activation as a SETTING: `REQUIRE_EMAIL_VERIFICATION=true` (default OFF — switching it on before mail delivers would lock everyone out); `sendOnSignIn` re-sends the link on a blocked sign-in | **DONE (off)** | 2026-10-03 |
| 5 | Existing accounts counted as verified (founder: "Count them as verified"): `npm run email:grandfather` (dry run by default; `-- --apply` marks them in `users` AND the provider's flag Better Auth checks; audited; counts only, no addresses) | **DONE** — to be run on the server just before the setting is switched on | 2026-10-03 |
| 6 | Tests: unit (puzzle fairness, answer normalisation, bypass cannot work outside the test env, setting off-by-default) + integration against the DB (single use incl. 8 parallel attempts, expiry, replay, malformed input, hash-only storage) + e2e (game on the real form, wrong answer, text alternative, direct-API refusals, replay, rate limit, axe light/dark, activation link, tampered link) | **DONE** — unit/integration 792/792; human-check + identity e2e 17/17 | 2026-10-03 |
| 7 | Review (governance + security + tests) and deploy | IN PROGRESS | 2026-10-03 |
| 8 | Founder steps (later, after SMTP2GO delivers): `npm run email:grandfather -- --apply`, then `REQUIRE_EMAIL_VERIFICATION=true` in the server env (guarded one-liner) | AWAITING delivery + founder | — |

## 6. Progress log

| Date (MYT) | Entry |
|---|---|
| 2026-10-03 12:45 | CR created from the founder's answers. |
| 2026-10-03 16:20 | Built while the founder was away (his go: "go ahead with all of it"; existing accounts = count as verified). Facts found on the way: Better Auth's verification link is a signed token valid for its 60 minutes and is NOT single-use (so "works once" in the email/page was wrong and is fixed to "expires in 60 minutes"); the activation email is branded "DataAI Nexus" in its first line (full template rebrand is CR-1227). Existing e2e/integration tests changed only for the new link target and the test-only bypass. |
| 2026-10-03 17:00 | **Pre-deploy checks on e18763e:** governance PASS WITH NOTES; tests PASS (792/792); **security PASS WITH NOTES — 2 MEDIUM, all applied before deploy:** (1) account pre-hijack — with auto sign-in after verification an attacker could register a victim's address with the attacker's own password and the victim, clicking the link, would be signed INTO the attacker's account → **`autoSignInAfterVerification: false`**: the link confirms the address, the person signs in with their OWN password, and `/email-confirmed` (reached through `return-to`) then shows the confirmation read from the database; (2) the test bypass now also requires a localhost `APP_BASE_URL` (a mistaken `APP_ENV=test` on the real site stays closed — tested). Also applied: per-address cap on verification and reset emails (1 per 2 min, 5/day, per kind; DB-backed, atomic — the Better Auth limit is per IP only, useless against many IPs aiming at one inbox; before SMTP goes live); every activation link is rewritten to open `/email-confirmed`; HMAC domain-separated (`human-check:v1:`); grandfather script: guarded update, `--before <ISO>` cutoff, prints the database host/name; `next` pinned to 16.3.8; `REQUIRE_EMAIL_VERIFICATION` documented in `.env.example` with the order to switch it on; this CR's §4 text corrected (10-minute expiry, no minimum-time check). **Honest limit, from the security review:** the shapes game stops only the laziest bots — a script can read the puzzle from the JSON; real bot protection arrives with strict activation (`REQUIRE_EMAIL_VERIFICATION`), which stays OFF until delivery is proven. **Gate before switching strict mode ON:** an automated test that an unverified sign-in is refused (not written yet). Unit/integration 797/797; human-check + identity e2e 17/17. |
