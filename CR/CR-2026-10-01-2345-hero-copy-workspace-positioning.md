# CR-2026-10-01-2345 — Homepage hero copy: from training portal to Data & AI workspace

**Received:** 2026-10-01 23:45 MYT · **Status:** BUILT & VERIFIED, uncommitted · **Requested by:** founder

## 1. Request (verbatim)

> * We have converted our portal from purely a training portal toward a workspace for Data & AI folks.
> * Now we have free Knowledge Hub with thousands of questions bank.
> * We have Questions bank to prepare for interview for free for multiple role
> * We have option for organisations to get initial screening on our portal.
> * I think we have to change text on our home page hero section. Keep the cards as-is, let change the header and test on the left side of hte hero section.
>
> • ⁃ First please tell me what you are going change. Once I approve then lets change.

## 2. Facts gathered (with sources)

- The hero's left column (`src/shared/marketing/HomeHero.tsx`) is: eyebrow "PRACTICAL SKILLS FOR A BRIGHTER TOMORROW" → headline "Don't Just Learn. *Build a Future* You're Excited About." (gradient on the middle phrase) → description paragraph (Vibe Coding / projects / portfolio / freelance) → two buttons (Explore trainings · Free Diagnostic) → four benefit chips (Learn by Building · AI-Powered Skills · Freelance Ready · Work From Anywhere).
- The right column is the six glass cards + "Real Skills. Real Opportunities." — **kept as-is per the request.**
- Knowledge Hub / Knowledge Check bank: **3,830 reviewed questions across all 383 topics** of *I Am Datapedia!* (PROJECT_STATUS.md, 2026-09-27 entry) — "thousands of questions" is honest.
- ⚠ **Per-role interview question banks and organisation screening are NOT fully live yet**: CR-2026-10-01-1711 has P0+P1 built (persona cards, Organisation role/dashboard shell), but the role tests and screening flows are P2–P4, blocked on schema approval. Hero copy is drafted so it does not overclaim (Q2 below).

## 3. Decisions and assumptions

| Ref | What | Status |
|---|---|---|
| D1 | Scope: eyebrow + headline + description + benefit chips (founder: "Q2 yes"); cards and buttons unchanged | **decided** |
| D2 | Headline **A** — "More Than Training. *Your Data & AI Workspace.*" | **founder, "Headline A"** |
| D3 | Description **A** — the "Expert-led training is just the beginning…" paragraph | **founder, "Description A"** |
| D4 | Honest wording kept (no "multiple roles" / live-screening claim while CR-1711 P2–P4 are unbuilt) | **founder, "Q1 honest"** |
| D5 | Chips → Free Knowledge Hub · Interview Prep · Assess & Certify · Expert-Led Training (icons reused: book, chat, check-circle, person; the orphaned IconBolt/IconRobot components removed as dead code) | **founder, "Q2 yes"** |

## 4. Plan

One file, `src/shared/marketing/HomeHero.tsx` (three JSX text nodes). No schema, no logic, no route changes. Tests: tsc + Vitest; any e2e spec asserting hero copy updated to match; visual check on the dev server.

## 5. Tracker

| # | Step | Status | Updated |
|---|---|---|---|
| 0 | CR written, proposal presented | **DONE** | 2026-10-01 |
| 1 | Founder approves wording | **DONE** — "Headline A, Description A, Q1 honest, Q2 yes" | 2026-10-01 |
| 2 | Build + verify | **BUILT & VERIFIED** | 2026-10-01 |
| 3 | Commit, push, deploy | NOT STARTED — awaits the founder's word | — |

## 6. Progress log

| Date (MYT) | Entry |
|---|---|
| 2026-10-01 23:45 | CR created. Current copy read from `HomeHero.tsx`; live-state facts checked against PROJECT_STATUS.md and CR-1711 (role banks/org screening partially built — copy drafted not to overclaim). Proposal presented in chat. **No code changed.** |
| 2026-10-01 23:55 | Founder: *"Headline A, Description A, Q1 honest, Q2 yes."* Built in `src/shared/marketing/HomeHero.tsx` only: eyebrow, headline (gradient span kept, same classes), description, and the four benefit chips (icons reused from the file's own set; the now-orphaned `IconBolt`/`IconRobot` components deleted rather than left dead). Searched first: no test or other code referenced the old copy. Verified: `tsc` clean · **Vitest 717/717** · screenshot of the live dev server — eyebrow/headline/description/chips all render as approved, cards and buttons untouched, no console errors. Still uncommitted, per the working agreement. |
