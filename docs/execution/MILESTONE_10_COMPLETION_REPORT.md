# Milestone 10 — "Launch cutover" · Completion Report (DRAFT — audit half)

> **Status: READINESS AUDIT COMPLETE · CUTOVER NOT STARTED (founder-only)** · 2026-09-23
> **Executed on:** the founder's overnight instruction of 2026-09-22 and [`MILESTONE_10_EXECUTION_PLAN.md`](MILESTONE_10_EXECUTION_PLAN.md) §1 items 1–5. **§2 (publish legal documents, Stripe live, domain, release gate on production, announce, archive the mockup) was not performed and cannot be by an agent.**
> **Branch:** `feat/production-foundation` · commit `83edf36` (with Milestone 9) · `64728c8` (plan) · not pushed.

## 1. Requested
The launch readiness audit: a checklist of every blocker with owner, evidence and state; a reconciliation of every public factual claim against the specifications and DR-02 without changing copy; robots/sitemap/404/500 (delivered by M9); a redirect table for mockup paths that differ; an audit that no wireframe remnant renders, added to the e2e suite.

## 2. Delivered

| Plan item | What | Where |
|---|---|---|
| 1 Readiness checklist | 21 blockers (B1–B21) each with owner, evidence required, state (**all Open or Ready — none Done**) and the runbook that says how | [`LAUNCH_READINESS_CHECKLIST.md`](LAUNCH_READINESS_CHECKLIST.md) §1 |
| 2 Claims reconciliation | 40+ claims across `app/(public)/**` and `app/(auth)/**` in eight groups (HRD Corp, trainer credentials, prices, refunds, certificate wording, company/contact, delivery formats, outcome claims) with origin (code / seed / content / DB) and a source or **UNVERIFIED — founder to confirm**. **No copy changed** (default K2) | checklist §2, summary §2.9 |
| 3 Robots, sitemap, 404, 500 | Delivered by M9 (`app/robots.ts`, `app/sitemap.ts`, existing `not-found.tsx`, new `error.tsx` / `global-error.tsx`) | M9 report |
| 4 Redirect table | Mockup vs production route diff (read-only comparison of `project-artifacts/mockup/app` and `app/`): basePath prefix, `/certifications`, `/journey-placeholder`, checkout paths, account/admin detail paths, `/courses` index; proposed 301 targets; **nothing configured** (no domain) | checklist §4 |
| 5 Wireframe remnants | Source audit: all `Wireframe`/`WireframeNote`/`SAMPLE`/`Mockup` hits are comments; no `Lorem`; `placeholder` only as input attributes, honest copy, and the legal drafts' bracketed tokens (which are the B1 blocker, not a wireframe artefact). Rendered-copy check added as the last test in `tests/e2e/readiness.spec.ts` (unrun — orchestrator) | checklist §3; `tests/e2e/readiness.spec.ts` |

## 3. Findings the founder must see (from the reconciliation)
1. **Visible placeholders in public legal pages** — `[SSM registration number]`, `[contact email]`, `[phone number]`, `[registered business address]`, `[effective date]`, `[SST registration status]` render on `/terms`, `/privacy`, `/refund-policy` (B1 / C26).
2. **Home hero: "1–2 top candidates will be brought to Malaysia for job opportunities."** — no specification, no terms, contradicts `/terms` §11 (C27).
3. **"a company's workflow that used to take 25 people now runs on 5"** — unsubstantiated third-party claim on the programme page (C28).
4. **Three surfaces disagree about payment:** pricing block says "Enquiry-based — no online payment yet"; FAQ says the refund policy "has not been published yet"; the footer says "Legal — not yet published" — while `/schedule → /checkout` takes Stripe payments and the refund draft is a live page (C15, C16, C26b).
5. **"certificate of participation"** (course seed) vs **"Certificate of Completion"** everywhere else (C23).
6. **Prices and the launch offer** — three regional price rows, a value stack and a strike-through "was" price with no end date, all seeded on a 2026-09-06 founder note and absent from the specifications (C10–C14).
7. **Trainer figures** ("24+ years", "40,000+ community", "80+ episodes") — résumé-sourced; one copy is hardcoded on the programme page and will drift from the seed (C6, C7).
8. **Dead links** to `/certifications` (two pages) and `/courses` (home fallback) (B19).

## 4. Testing
| Check | Result |
|---|---|
| Source audit | `grep` over `app/` and `src/` for the six marker strings — recorded in checklist §3 |
| e2e remnant check | `tests/e2e/readiness.spec.ts` — passed 2026-09-23 (full suite 62/62) |
| Route comparison | `find … -name page.tsx` on both trees; table in checklist §4 |
| Plan §4 criteria | 1 ✅ every item has owner and state · 2 ⏸ e2e written, unrun · 3 ✅ every claim has a source or a flag |

## 5. Not changed
No public copy, seed, content file, route, redirect, or the mockup (default K1). `app/layout.tsx` `noindex` retained (B16 is a cutover step).

## 6. Human decisions required
- The seven decisions in checklist §2.9 (legal-entity details to counsel; the Malaysia promise; the 25→5 claim; prices and offer end date; three stale payment sentences; completion vs participation; trainer figures and format durations).
- B19 dead links: create pages or retarget links.
- Every cutover action in M10 plan §2, in order: counsel sign-off → `LEGAL_DOCUMENT_VERSIONS` → M9 J1–J9 → release gate on the production build → lift `noindex` → announce → (separately) archive the mockup.
