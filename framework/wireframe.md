# wireframe.md — Wireframe sign-off gate

> Version 1.0 · 2026-10-02

## The rule
Before any backend technology is installed or implemented, the **wireframe** (clickable mockup) must be **built, tested and signed off by the founder**. Only then does the AI install the backend and implement everything *according to the signed wireframe*. Anything not in the signed wireframe is a change request, not a silent addition.

## Status for this project: SIGNED OFF — backend already built
| Item | Where |
|---|---|
| Wireframe / mockup | `project-artifacts/mockup/` (kept for comparison, founder 2026-09-21) |
| Design language and information architecture | `DATA_AI_ACADEMY_PORTAL_MOCKUP_SPECIFICATION.md` |
| Transition to production | [`docs/execution/WIREFRAME_TO_PRODUCTION_PLAN.md`](../docs/execution/WIREFRAME_TO_PRODUCTION_PLAN.md) — accepted 2026-09-21 |
| Backend implementation | Milestones M1–M16 (see [`milestones.md`](milestones.md)) |

Sign-off here is recorded from the existing acceptance (founder, 2026-09-21: keep the mockup, "go ahead and implement the production ready product"). It is **not** a new approval.

## Gate checklist for any new project or major new area
| # | Step | Evidence | Status |
|---|---|---|---|
| 1 | Wireframe screens listed, mapped to BRD areas | | |
| 2 | Wireframe built (no backend) | | |
| 3 | Wireframe tested (navigation, content, responsive) | test notes | |
| 4 | **Founder sign-off recorded** (date, exact words) | | |
| 5 | Backend started — only after row 4 | CR + spec | |

Skill: `wireframe-signoff`. Agent: `exec-wireframer`. `exec-developer` must refuse backend work for an area whose row 4 is empty.
