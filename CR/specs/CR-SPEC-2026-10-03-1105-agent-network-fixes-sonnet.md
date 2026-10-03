# CR-SPEC-2026-10-03-1105 — Agent network fixes

**CR:** [CR-2026-10-03-1105-agent-network-fixes-sonnet](../CR-2026-10-03-1105-agent-network-fixes-sonnet.md) · **Recommended model:** Sonnet 5.5 (executed on Fable 5.1)

## Resume here
T1–T7 BUILT and committed. T8 is the founder's test in a fresh tab: Buddy's first reply should run `resume-work`. If it does not, the desktop app ignores `"agent"`; use `claude --agent buddy` in a terminal and record the finding here.

## Tasks

| # | Task | Files / elements | Status |
|---|---|---|---|
| T1 | `tools:` gains `Skill`; `skills:` preloads core skills | `.claude/agents/br-analyst.md`, `br-impact-analyst.md`, `br-planner.md`, `exec-wireframer.md`, `exec-developer.md`, `test-verifier.md`, `governance-reviewer.md`, `deploy-engineer.md`, `meta-steward.md`, `pe-selector.md` | BUILT |
| T2 | Ordering and new-tab test | `framework/initiate.md` (§2.3, new §2.4), `.claude/agents/buddy.md` ("Taking a goal") | BUILT |
| T3 | Fact correction | `CR/CR-2026-10-02-2027-buddy-agent.md` §2 | BUILT |
| T4 | `dr-write` | `.claude/skills/dr-write/SKILL.md` (new); `br-analyst` roster | BUILT |
| T5 | `security-review` mapping | `.claude/agents/governance-reviewer.md` | BUILT |
| T6 | `schema-proposal` | `.claude/skills/schema-proposal/SKILL.md` (new); `exec-developer` roster | BUILT |
| T7 | Catalogue and checks | `framework/agents-and-skills.md`, Buddy roster table; link check, frontmatter/name uniqueness | BUILT |
| T8 | Live test | founder's new tab | OPEN |

## Impacted elements (inventory)

| Kind | Element | Change |
|---|---|---|
| Agents | all ten `.claude/agents/*.md` | frontmatter (`tools`, `skills`), roster lines |
| Skills | `dr-write`, `schema-proposal` (new) | process |
| Framework docs | `framework/initiate.md`, `framework/agents-and-skills.md` | ordering, test, catalogue |
| CR records | CR-2027 (fact), this CR | traceability |
| Application code, database, dependencies, deployment | none | — |

## Validation
Link check across all `.md` (0 broken); every agent/skill has frontmatter and a unique `name`; `skills:` entries all exist.

## Rollback
Revert the commit.
