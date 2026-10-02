# CR-SPEC-2026-10-02-2034 — AI delivery framework

**CR:** [CR-2026-10-02-2034](../CR-2026-10-02-2034-ai-delivery-framework-folders-agents-skills.md) · **Created:** 2026-10-02 20:55 MYT

## Tasks

| # | Task | Files | Notes |
|---|---|---|---|
| 1 | Create `framework/` with `metadata/{business,technical,operational}` | `framework/**` | docs only |
| 2 | `git mv` guardrails, techstack, wbs; rewrite links and prose references | `framework/guardrails.md`, `techstack.md`, `wbs.md`; 17 referencing files (`CLAUDE.md`, `README.md`, `docs/**`, `DR-02_…`) | reversible by reverting the commit; link check run on moved files and index READMEs |
| 3 | New docs: `initiate`, `vision`, `brd`, `milestones`, `wireframe`, `agents-and-skills`, metadata READMEs and template | `framework/*.md` | sourced from approved documents only; statuses cite their source |
| 4 | Register `initiate.md` | `CLAUDE.md` (`@framework/initiate.md`) | loaded each session |
| 5 | Guardrails quick-reference block | `framework/guardrails.md` (top) | restates existing rules incl. "never change stack to fix an issue" |
| 6 | Six new agents; Buddy roster | `.claude/agents/*` | `br-analyst`, `br-planner`, `exec-wireframer`, `exec-developer`, `deploy-engineer`, `meta-steward` |
| 7 | Twelve new skills; `new-cr`/`run-cr` extended | `.claude/skills/*` | includes deploy-audit / incremental / full / rollback wrapping `deploy/start.sh` |

## Not in scope
Renaming CR files; moving milestone plans/reports, specifications, DRs or the wireframe plan; writing per-table/per-script metadata; app code, data model, dependencies, deployment.

## Tests / validation
Link check of moved and index files; grep for stale old names; skills/agents frontmatter parse; verify in a fresh session that the agents and skills list and `@framework/initiate.md` loads.

## Rollback
Revert the commit (all moves are `git mv`).
