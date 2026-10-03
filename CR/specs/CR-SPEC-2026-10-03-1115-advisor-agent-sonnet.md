# CR-SPEC-2026-10-03-1115 — advisor agent

**CR:** [CR-2026-10-03-1115-advisor-agent-sonnet](../CR-2026-10-03-1115-advisor-agent-sonnet.md) · **Recommended model:** Sonnet 5.5

## Resume here
T1–T4 BUILT. T5: Buddy runs `advisor` on the next real requirement; record what it advised and whether it was right.

## Tasks

| # | Task | Files / elements | Status |
|---|---|---|---|
| T1 | Agent | `.claude/agents/advisor.md` (new; tools Read, Grep, Glob, Bash, Skill; preloads next-steps, capability-gap) | BUILT |
| T2 | Skills | `.claude/skills/next-steps/SKILL.md`, `.claude/skills/capability-gap/SKILL.md` (new) | BUILT |
| T3 | Register | `framework/capability-gaps.md` (new, seeded with 9 gaps) | BUILT |
| T4 | Wiring | `.claude/agents/buddy.md` (roster row, "Taking a goal" step, after-CR step), `framework/agents-and-skills.md`, `framework/initiate.md` (document table, rule) | BUILT |
| T5 | First run | — | OPEN |

## Impacted elements
Agents: advisor (new), buddy (edited) · Skills: next-steps, capability-gap (new) · Framework docs: capability-gaps.md (new), agents-and-skills.md, initiate.md · App code/DB/deps: none.

## Validation
Link check, frontmatter/name uniqueness, preloaded skills exist.

## Rollback
Revert the commit.
