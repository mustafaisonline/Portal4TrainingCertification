# CR-2026-10-03-1420 — Upgrade Next.js 16.3.3 → 16.3.8 (critical advisory GHSA-vcvr-r3jv-pc5j)

**Received:** 2026-10-03 14:20 MYT · **Status:** BUILT & VERIFIED — deploys with the next release · **Requested by:** founder ("Yes, prepare it", 2026-10-03; "go ahead with all of it") · **Model:** sonnet

## 1. Request (verbatim)

> May I upgrade Next.js from 16.3.3 to 16.3.8? … → "Yes, prepare it (Recommended)"  ·  "go ahead with all of it"

## 2. Facts

- `npm audit --omit=dev`: `next` 16.3.3 — CRITICAL "RCE in `next/og` ImageResponse" (range >=16.2.0 <16.3.6; fixed in 16.3.6+, `fixAvailable` 16.3.8, not a major). The portal does not use `next/og`/ImageResponse (grep: none), so it is not exploitable today; the patch removes the finding.
- An existing dependency, patch-level change (CLAUDE.md RED gate is "new" or "significant" dependencies — founder approved anyway).

## 3. Plan / tracker

| # | Step | Status | Updated |
|---|---|---|---|
| 1 | `npm install next@16.3.8` (package.json + lock only: next and its platform binaries) | **DONE** | 2026-10-03 |
| 2 | tsc clean; unit 775/775; production build OK; full Playwright **188/188** on the production build; `npm audit --omit=dev`: the critical `next` finding is gone, 4 known high (prisma → deepmerge-ts, mysql2) remain | **DONE** | 2026-10-03 |
| 3 | governance + security + test review, then deploy | NOT STARTED | — |

## 4. Progress log

| Date (MYT) | Entry |
|---|---|
| 2026-10-03 14:20 | CR created. |
