# checklist — Security (pre-launch review)

| Field | Value |
|---|---|
| Category | operational |
| Kind | checklist |
| Source of truth | `docs/operations/SECURITY_CHECKLIST.md` (this file describes it; it does not replace it) |
| Owner | founder |
| Version / date | 2026-10-02 |
| Status | approved (source is a draft dated 2026-09-23) |
| Related | `docs/architecture/SECURITY_ARCHITECTURE.md`; [runbook-deployment.md](runbook-deployment.md); [runbook-monitoring-and-incidents.md](runbook-monitoring-and-incidents.md) |

## Purpose
Walk before the first production deploy and after any change touching authentication, authorization, payments, personal data or headers.

## Description
Source is a 26-row table, each row mapped to a section of the Security Architecture, naming where the control lives and a verification method, with state Built, Operator or Open.
- **Built (examples):** email and password auth with verification and database-backed sessions; database rate limits; optional TOTP; server-side role gates with real 403; own-photo-only route; ID number AES-256-GCM at rest; verification page field set, noindex, no-store; audit rows in the same transaction; webhook signature over raw bytes with idempotency; error pages show only a correlation id; fail-fast production start; health endpoint reveals nothing sensitive; security headers and no-store cache rules.
- **Operator:** HSTS and TLS verified after deploy (row 9); live keys only in the production store and rotate the pasted test key (14); per-environment secrets (17); `npm audit` before each release (23); dumps encrypted and access-controlled (25).
- **Open at the time of writing:** Content-Security-Policy (J8, row 12); data residency (J1, row 22; the operations README records J1 as resolved 2026-09-27); retention and account deletion (J7, row 24).
- **Stale:** row 26 (Docker image) refers to a container path no longer used (PM2 deployment); row 16 and others refer to `.dockerignore`.
- **Before go-live confirm in writing:** rows 9, 14, 17, 23, 25 performed; rows 12, 22, 24 decided or deferred by the founder; `npm run test` and `npm run test:e2e` green on the release commit.

Whether the go-live confirmations were ticked is not determined from the source.

## Preconditions
Release commit tested (see [procedure-release-gate.md](procedure-release-gate.md)).

## Safety notes
Never commit values for keys; `.env*` is gitignored and only `.env.example` carries names.

## Change history
- 2026-10-02 — created from `docs/operations/SECURITY_CHECKLIST.md`.
