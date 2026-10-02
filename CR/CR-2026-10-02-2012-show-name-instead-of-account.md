# CR-2026-10-02-2012 — Header shows the person's name instead of "Account"

**Received:** 2026-10-02 20:12 MYT · **Status:** BUILT & VERIFIED in dev — not deployed · **Requested by:** founder · **Recommended model:** Sonnet 5.5 — small UI change plus e2e; this session is Sonnet 5.5

Spec: [`CR-SPEC-2026-10-02-2012-show-name-instead-of-account.md`](specs/CR-SPEC-2026-10-02-2012-show-name-instead-of-account.md)

## 1. Request (verbatim)

> ⁠Show Name instead of account

*Source: Founder message of 2026-10-02 ("New more change …", seven bullets; the CR for them was requested: "Add a new CR for these requirements").*

## 2. Facts gathered (read-only; nothing changed yet)

- `src/modules/identity/components/AccountMenu.tsx:98`: the signed-in header button shows an avatar plus the fixed word **"Account"** (`hidden md:inline`, so desktop only). The person's full name is already available there (`name`, shown inside the opened menu at the top).
- Tests that may name the label: `tests/e2e/cr-2136-menus-and-admin-labels.spec.ts` uses `aria-label "Account menu for <name>"` (unchanged by this).

## 3. Open questions for the founder

1. **First name** (e.g. "Mustafa") or the **full name**? Long names would be shortened with an ellipsis (assumed: first name, max ~16 characters).
2. Mobile: the avatar only (see CR-2013 — on phones the whole account button is currently hidden).

## 4. Plan (after the answers; one CR at a time, on the founder's "go")

Replace the literal "Account" with the person's display name (truncated); keep the accessible name "Account menu for <name>". Unit/e2e assertions; axe in light and dark. No data model.

## 5. Tracker

| # | Step | Status | Updated |
|---|---|---|---|
| 1 | Founder answers §3 | **AWAITING founder** | — |
| 2 | Build + verify at 375/640/1280 px | **VERIFIED** (e2e, tsc) | 2026-10-02 |

## 6. Progress log

| Date (MYT) | Entry |
|---|---|
| 2026-10-02 20:12 | CR created from the founder's list. Facts gathered read-only.  |
| 2026-10-02 | Executed by `run-cr` using the CR's stated default assumption (first name, max 16 characters). Built; menus spec 6/6; full-suite regression recorded in the commit/summary. Not deployed. |
