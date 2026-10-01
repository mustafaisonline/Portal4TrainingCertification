# CR-2026-10-02-0626 — Email provider — DEFERRED, remind the founder

**Received:** 2026-10-02 06:26 MYT · **Status:** DEFERRED (founder: "We will do it later. Please remind me later.") · **Requested by:** founder

## 1. Request (verbatim)

> Email provider (needs your decision). The portal still sends no real email, so verification emails, password resets and receipts never reach users. The Privacy page says "none at present."
> Response: We will do it later. Please remind me later.

## 2. Facts gathered

- Production: `EMAIL_TRANSPORT=log` — no real email is sent (checked 2026-10-02 in `/etc/p4tc/production.env`).
- Effect: email verification, password reset and receipts do not reach users. The published Privacy policy (§5) says "Email provider — none at present".
- An email provider is new technology/an external service (CLAUDE.md RED gate): needs a written case and the founder's approval. ADR-015 (email provider) is still unratified (PROJECT_STATUS §3 item 5).

## 3. Decisions & assumptions

- Founder: decide later. **Reminder owed by the assistant:** raise this at the start of the next working session and again before any public announcement or marketing.
- When chosen, update Privacy §5 and §3 wording the same day.

## 4. Plan

1. Founder names a provider (or asks for options with cost/deliverability/PDPA notes).
2. Assistant writes the case for approval (RED gate), then implements the transport behind the existing `EMAIL_TRANSPORT` switch.
3. Add the provider to Privacy §5; deploy.

## 5. Tracker

| # | Step | Status | Updated |
|---|---|---|---|
| 1 | Founder decision | **DEFERRED — REMIND** | 2026-10-02 |
| 2 | Case for approval | NOT STARTED | — |
| 3 | Implement + Privacy §5 + deploy | NOT STARTED | — |

## 6. Progress log

| Date (MYT) | Entry |
|---|---|
| 2026-10-02 06:26 | CR created; deferred at the founder's word. Added to PROJECT_STATUS §3 (item 16) and the assistant's memory so any session raises it. |
