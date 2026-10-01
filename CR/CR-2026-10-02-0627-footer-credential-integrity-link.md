# CR-2026-10-02-0627 — Footer links to an unpublished policy

**Received:** 2026-10-02 06:27 MYT · **Status:** BUILT & unit-tested — in the next deploy · **Requested by:** founder

## 1. Request (verbatim)

> Smaller items: Credential-integrity page: the footer link still goes to a "not yet published" page. … Response: Please fix these as per best practices

## 2. Facts gathered

- `src/shared/chrome/site-nav.ts` `footerLegal` listed `/credential-integrity-policy`; that list also feeds the footer, the account menu and `app/sitemap.ts`.
- The page is a `PolicyPlaceholder` ("not yet published"), `noindex`. The policy is business policy the founder/counsel must write (CLAUDE.md rule 8).
- Terms §12 already says what applies meanwhile: the Academy tells the holder in writing before revoking a certificate and allows a response.

## 3. Decisions & assumptions

- Best practice: link only published documents. The item is removed from `footerLegal` (so also from the sitemap); the route stays, `noindex`.
- NOT done: writing the policy. Needs the founder: revocation, correction and appeal rules.

## 4. Plan

Remove one list item; comment explains how to restore it. Tests derive from the list, so none are edited.

## 5. Tracker

| # | Step | Status | Updated |
|---|---|---|---|
| 1 | Remove the item; tsc clean; `site-nav` unit tests 4/4 | **DONE** | 2026-10-02 |
| 2 | Full gate + deploy | AWAITING founder's deploy | — |
| 3 | Write the credential-integrity policy, then re-add the link | **BLOCKED on the founder's policy** | — |

## 6. Progress log

| Date (MYT) | Entry |
|---|---|
| 2026-10-02 06:27 | CR created and built. |
