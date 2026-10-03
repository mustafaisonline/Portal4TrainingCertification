---
name: capability-gap
description: Check whether the project's agents and skills cover the steps a goal needs; name the missing ones and advise the human to create them; keep framework/capability-gaps.md current. Use with next-steps, and whenever a step has no owner.
---

# Capability gap check

1. Read the real roster: every `.claude/agents/*.md` (name, description, `skills:`) and every `.claude/skills/*/SKILL.md` (name, description). Compare with `framework/agents-and-skills.md` and report drift.
2. For each step from `next-steps`, find the agent and skill that own it. A step with no owner, or whose owner's skill does not actually cover the step, is a gap.
3. For each gap, advise the human (through Buddy): proposed name (`<category>-<role>` for agents, kebab-case for skills), purpose in one sentence, the agent it belongs under, how to build it (`skill-creator` for a skill; a new agent file with `tools:` including `Skill` and a `skills:` preload), and the risk of working without it. Never create it yourself.
4. Maintain `framework/capability-gaps.md`: add new gaps with date and source; update status when the founder decides (OPEN → PLANNED (CR-…) → DONE / DECLINED). This is the only file this skill edits.
5. Return: table of steps → owner (or GAP), plus the advice list.
