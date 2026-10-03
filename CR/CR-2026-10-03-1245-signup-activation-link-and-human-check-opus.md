# CR-2026-10-03-1245 — Sign-up: activation link confirmed in the database, plus a human-check game

**Received:** 2026-10-03 12:45 MYT · **Status:** IN PROGRESS · **Requested by:** founder · **Model:** opus

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

1. Human-check **game** (self-hosted, free, accessible): a server-generated challenge stored in a new table `human_challenges` (single use, 5-minute expiry), shown on the register form; a text alternative for people who cannot use the game; plus a honeypot field and a minimum-time check; verified server-side in the sign-up hook so a direct POST cannot bypass it. Honest limit: any self-made check is weaker than a commercial CAPTCHA; the emailed activation is the strong control.
2. **Activation**: the link verifies the address, sets `email_verified_at`, and lands on a new confirmation page ("Your email is confirmed", with sign-in); `requireEmailVerification` is controlled by an environment flag (`REQUIRE_EMAIL_VERIFICATION`, default off) so it is switched on only after live delivery is proven; existing accounts are handled by a one-off, founder-approved step so nobody is locked out.
3. Tests: unit + integration + e2e (challenge expiry/replay, wrong answer, honeypot, activation link single-use/expired, unverified sign-in refused when the flag is on); `security-review` before deploy (auth change).

## 5. Tracker

Spec: [CR-SPEC-2026-10-03-1245-signup-activation-link-and-human-check-opus](specs/CR-SPEC-2026-10-03-1245-signup-activation-link-and-human-check-opus.md).

| # | Step | Status | Updated |
|---|---|---|---|
| 1 | Schema: `human_challenges` (SQL shown; dev/test) | NOT STARTED | — |
| 2 | Human-check game component + server verification in the sign-up hook | NOT STARTED | — |
| 3 | Activation confirmation page + flag `REQUIRE_EMAIL_VERIFICATION` | NOT STARTED | — |
| 4 | Existing accounts plan (founder-approved one-off) | NOT STARTED | — |
| 5 | Tests + security review | NOT STARTED | — |

## 6. Progress log

| Date (MYT) | Entry |
|---|---|
| 2026-10-03 12:45 | CR created from the founder's answers. |
