# CR-SPEC-2026-10-03-1048 — CR/spec convention, impact analysis, Buddy routing

**CR:** [CR-2026-10-03-1048-cr-model-naming-impact-analysis-roster-sonnet](../CR-2026-10-03-1048-cr-model-naming-impact-analysis-roster-sonnet.md) · **Recommended model:** Sonnet 5.5

## Resume here
All tasks BUILT. Next: founder review; then exercise the new flow on the next real requirement (new-cr → impact-analysis → cr-spec). Nothing is half-done.

## Tasks (status per task)

| # | Task | Files | Status |
|---|---|---|---|
| T1 | Model suffix in CR names; one CR per model; status vocabulary | `.claude/skills/new-cr/SKILL.md`, `.claude/skills/run-cr/SKILL.md`, `CR/README.md`, `CLAUDE.md` (CR naming sentence) | BUILT |
| T2 | CR-spec convention (1:1 name, per-task status, impacted inventory, resume section) | `.claude/skills/cr-spec/SKILL.md`, `CR/README.md` (spec section) | BUILT |
| T3 | Impact analysis | new `.claude/agents/br-impact-analyst.md`, `.claude/skills/impact-analysis/SKILL.md`, `.claude/skills/impact-record/SKILL.md` | BUILT |
| T4 | Buddy roster, routing, skills in agents | `.claude/agents/buddy.md` and the nine other agent files, `framework/agents-and-skills.md` | BUILT |
| T5 | Multiple-options rule | `framework/initiate.md` (rule 3), `.claude/agents/*.md` (common footer), `.claude/agents/buddy.md` | BUILT |
| T6 | Rename open CR-2015 | `CR/CR-2026-10-02-2015-email-api-and-account-confirmation.md` → `…-sonnet.md`; `CR/README.md` link | BUILT |

## Impacted elements (inventory)

| Kind | Element | Change |
|---|---|---|
| Skills | `new-cr`, `cr-spec`, `run-cr` (edited); `impact-analysis`, `impact-record` (new) | process |
| Agents | `br-impact-analyst` (new); `buddy`, `br-analyst`, `br-planner`, `exec-developer`, `exec-wireframer`, `deploy-engineer`, `meta-steward`, `pe-selector`, `test-verifier`, `governance-reviewer` (edited) | skills lists, rule |
| Framework docs | `framework/initiate.md`, `framework/agents-and-skills.md` | rules, catalogue |
| Governance | `CLAUDE.md` (one sentence), `CR/README.md` | naming, template |
| CR files | CR-2015 renamed | traceability: the index link only (no other references existed) |
| Application code, database, dependencies, deployment | none | — |

## Tests / validation
Link check across all `.md`; every agent/skill file has valid frontmatter and a unique name; rename leaves no stale references.

## Rollback
Revert the commit.
