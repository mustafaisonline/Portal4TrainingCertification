---
name: next-steps
description: Produce the ordered "what to do next" for a goal, or for the project as a whole, per best practice and the framework order, mapped to the agents and skills that own each step. Use at the start of a goal and after a CR completes or stalls.
---

# Next steps

1. Establish state: `docs/execution/PROJECT_STATUS.md`, `CR/README.md` (open CRs, their tracker and spec "Resume here"), `framework/capability-gaps.md`, `git status --short`, `git log --oneline -5`.
2. If a goal is given, place it: which BRD area (`framework/brd.md`), which milestone/WBS task, which decision records it touches, whether the wireframe gate applies (`framework/wireframe.md`).
3. Lay out the steps in the framework order and skip none silently: `pe-selector` → `br-analyst` (vision/BRD/`dr-write`) → `br-impact-analyst` → `br-planner` (CRs by model, specs) → `exec-wireframer` (if a new area) → `exec-developer` → `test-verifier` + `governance-reviewer` (+ `security-review` for auth/payment/upload changes) → `deploy-engineer` → `meta-steward` (metadata) → `br-planner` (`milestones-update`, `wbs-update`).
4. For each step name the owner agent and skill, what it needs from the founder (decision, approval, screenshot), and whether it can run now or is blocked.
5. Rank: the one action that unblocks the most, first. Call out anything that would violate a guardrail (RED gate, stack change, cache-only state) before it happens.
6. Return the list to Buddy. Do not execute any step.
