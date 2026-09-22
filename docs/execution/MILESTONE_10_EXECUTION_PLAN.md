# Milestone 10 — "Launch cutover" · Execution Plan

> **Status: ▶ EXECUTING 2026-09-23 (readiness audit and code items) · ⛔ the cutover itself REQUIRES THE FOUNDER** — built on the founder's overnight instruction of 2026-09-22. Launch is the one milestone that cannot be completed by an agent: it needs the lawyer's sign-off, the production accounts from Milestone 9, a domain, and the founder's decision to go live.
> **Roadmap origin:** [`WIREFRAME_TO_PRODUCTION_PLAN.md`](WIREFRAME_TO_PRODUCTION_PLAN.md) §7 row M10 and §9 (retiring the mockup); the 2026-09-21 readiness audit's blocker list.

## 1. Scope (built now)
1. **Launch readiness audit** — `LAUNCH_READINESS_CHECKLIST.md` (this folder): every blocker with its owner, evidence required and current state — legal documents published (`LEGAL_DOCUMENT_VERSIONS`), contact channel live (ENQUIRY_NOTIFY_EMAIL delivering, which needs ADR-015), public claims reconciled (HRD Corp, trainer credentials, pricing, refund tiers, certificate wording), production accounts, domain and DNS, Stripe live mode and webhook, backups rehearsed in production, uptime checks on `/api/health` and `/verify`, release gate passed on the production build, accessibility pass, the Tier 1 workflow set green.
2. **Claims reconciliation** — a pass over every public page's copy against the approved specifications and DR-02, recording each factual claim, its source and whether it is verified, in the checklist. Copy is **not** changed by this milestone unless it is demonstrably false; questions go to the founder.
3. **Robots, sitemap, 404, 500 pages** — delivered by Milestone 9 items 4–5.
4. **Redirects from the old mockup URLs** — not applicable until the domain exists (the mockup is served from a different origin); a redirect table is prepared in the checklist for the paths that differ.
5. **Wireframe remnants** — an audit that no `WireframeNote`, "Mockup" strip, sample data or `SAMPLE` watermark is reachable from the production application (a Vitest boundary test already forbids importing the mockup; this adds a rendered-copy check to the e2e suite).

## 2. ⛔ Founder actions at cutover (checklist items, not done here)
Publish the legal documents once the lawyer signs off (set `LEGAL_DOCUMENT_VERSIONS`; consent gating then activates) · confirm the legal issuer name and the signatory on certificates (E12) · switch Stripe to live and add the production webhook · point the domain · run the release gate on the production build · announce · **archive the mockup** (`project-artifacts/mockup`) — the founder asked for it to stay for comparison; archiving is a deliberate, separately approved step per §9 of the transition plan.

## 3. Defaults taken
| # | Default | Why |
|---|---|---|
| K1 | The mockup stays in the repository untouched | Founder instruction 2026-09-21 |
| K2 | No public copy is edited during reconciliation; discrepancies are reported | Rule 8: product claims are the founder's |

## 4. Verification criteria
1 checklist complete with an owner and state for every item · 2 e2e proves no wireframe remnant text renders on any public route · 3 every claim in the reconciliation table has a source or is flagged.
