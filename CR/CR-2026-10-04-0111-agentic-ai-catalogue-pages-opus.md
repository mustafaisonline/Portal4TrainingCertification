# CR-2026-10-04-0111 — New "Agentic AI" pages: list the agents and skills, with manuals and guides

**Received:** 2026-10-04 01:10 MYT · **Status:** DECIDED — content preparation next · **Requested by:** founder · **Model:** opus

## 1. Request (verbatim)

> * 4th Category: Agentic AI: This is the new Page I want to introduce.
>       * It will have agents and skill as main submenu.
>          * Let's refer to our workspace for the list of agents and skill we create, let's list those on our portal, to start with.
>          * These agents and skills will be downloadable with full user manuals and instruction guides.

## 2. Facts gathered (read-only, 2026-10-04)

- The workspace has **12 agents** (advisor, br-analyst, br-impact-analyst, br-planner, buddy, deploy-engineer, exec-developer, exec-wireframer, governance-reviewer, meta-steward, pe-selector, test-verifier) and **24 skills** (brd-write, capability-gap, cr-spec, deploy-audit, deploy-full, deploy-incremental, deploy-rollback, dr-write, guardrails-check, impact-analysis, impact-record, metadata-capture, milestones-update, model-recommend, new-cr, next-steps, prompt-frameworks, resume-work, run-cr, schema-proposal, techstack-check, vision-write, wbs-update, wireframe-signoff) — **36 items**, defined as files under `.claude/agents/` and `.claude/skills/`.
- They are this project's **own operating framework**: they name this portal's rules (CR process, decision records DR-01…DR-04, the founder, deploy scripts, the Droplet). Publishing them as-is would publish internal business detail; a sellable version needs a generalised copy.
- There is no "full user manual / instruction guide" for any of them today; each would need to be written (purpose, when to use, inputs, example, install steps for Claude Code, limits).
- A downloadable file would be stored the way the portal stores photos (bytes in the database, no new storage service).

## 3. Questions for the founder (with the assistant's recommendation)

1. **Which items go on the portal?** All 36, or a curated starter set? Recommendation: a curated, generalised starter (about 5 agents + 8 skills), each reviewed by you before it is public. The 36 are the framework that runs *this* project; many cannot work for a buyer without that project's documents.
2. **Generalise or sell as-is?** Recommendation: the assistant prepares a generalised copy of each chosen item (project names/paths removed) for you to approve; the originals stay private.
3. **Manuals:** the assistant writes a manual and an installation guide per item (one page each, plus a shared "How to install agents and skills in Claude Code" guide). Confirm that is acceptable, and whether Bahasa Malaysia is needed later.
4. **Page structure:** `/agentic-ai` (what it is) → **Agents** and **Skills** lists → a detail page per item (what it does, who it is for, what is in the download, price). Public to read; downloading needs sign-in and payment (CR-0112). Confirm.
5. **Licence:** what may a buyer do (personal/team use? no resale or redistribution?). Needs your decision and a short licence text.

## 4. Impacted elements

New routes under `app/(public)/agentic-ai/…`, a catalogue source (items, categories, descriptions, manuals), the mega-menu entry (CR-0110), sitemap/search, tests. **Schema:** only if items are stored in the database (recommended so you can edit them in Admin) — a RED gate, SQL shown for approval before it is applied.

## 5. Tracker

| # | Step | Status | Updated |
|---|---|---|---|
| 1 | Founder answers §3 | OPEN | 2026-10-04 |
| 2 | Build (after the answers; RED gates need explicit approval first) | NOT STARTED | — |
| 3 | Verify (tests, reviews) | NOT STARTED | — |
| 4 | Show on the local site (screenshots) then deploy | NOT STARTED | — |

## 6. Progress log

| Date (MYT) | Entry |
|---|---|
| 2026-10-04 01:10 | CR created from the founder's message (sent while the assistant was building CR-2250); nothing built. The founder went to sleep and asked the assistant to record questions. |
| 2026-10-04 04:20 | **Founder approved:** "Yes do that... I approved now." — a **curated, generalised starter set (about 5 agents + 8 skills)**, prepared by the assistant for the founder to approve item by item; the originals stay private; the assistant writes a manual and an install guide per item. Q4 page structure (/agentic-ai → Agents / Skills → detail pages; public to read, sign-in + payment to download) and Q5 licence: not answered; assistant proceeds with the recommendation and a short licence text for the founder to review. |
