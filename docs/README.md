# Project Documentation

> **Status as at 2026-08-30: PLANNING & ARCHITECTURE MODE — implementation not authorized.**

| Folder | Holds | Index |
|---|---|---|
| [`architecture/`](architecture/README.md) | **Decisions** — principles, ADRs, technology choices, data/security/integration/deployment architecture. The frozen baseline | [Architecture index](architecture/README.md) |
| [`execution/`](execution/README.md) | **Delivery** — milestone plans, RED-gate action lists, verification criteria, completion reports | [Execution index](execution/README.md) |
| [`design/`](design/) | **Design specifications & governance** — what screens must communicate (below the Mockup Specification, above visual design), and the rules that govern visual refinement | [`P01_HOMEPAGE_REDESIGN_SPECIFICATION.md`](design/P01_HOMEPAGE_REDESIGN_SPECIFICATION.md) — also the durable Homepage Design Strategy record (its §3) · [`VISUAL_REFINEMENT_GOVERNANCE.md`](design/VISUAL_REFINEMENT_GOVERNANCE.md) — the design-governance blueprint, incl. the binding lesson from the reverted audit remediation (`93217e0`→`f7f826a`) · [`TYPOGRAPHY_STRATEGY.md`](design/TYPOGRAPHY_STRATEGY.md) — font exploration, recommendation and the **adoption record** (§15): Direction C / IBM Plex approved after Experiment 1 and **rolled out portal-wide 2026-09-02** |

**The test for where something belongs:** if it would still be true after the current milestone ships, it is architecture. If it describes *this* piece of work, it is execution. If it defines what a specific screen must become, it is design.

## Authoritative sources above this folder

Product requirements come from the repository root, which outranks everything here — in this order:

- **`DR-02_EXPERT_LED_DELIVERY_MODEL.md`** — the approved strategic correction of 2026-08-31. **Outranks the three specifications where they conflict**, on organisation identity, delivery model, portal role, programme model, certification relationship, expert model and corporate model. Its §12 lists every superseded statement by document and location. *(`DR-01`, inside the MVP Build Spec, carries the same standing.)*
- `DATA_AI_ACADEMY_MVP_BUILD_SPEC.md` — authoritative for **what gets built first**
- `DATA_AI_ACADEMY_PORTAL_BLUEPRINT.md` — authoritative for **vision and architecture direction**
- `DATA_AI_ACADEMY_PORTAL_MOCKUP_SPECIFICATION.md` — authoritative for **design language and information architecture**

All three specifications have been reconciled with DR-02 and carry reconciliation notices plus in-place `⊘ RETIRED` / `↻ REFRAMED` / `⏸ DEFERRED` markers. **Superseded wording is retained deliberately for traceability — where a marker and the surrounding text disagree, the marker wins.**

Governance comes from `CLAUDE.md` and `AI_DEVELOPMENT_GUARDRAILS.md`. Where this folder and any of the above conflict, **the above wins and this folder is wrong**.
