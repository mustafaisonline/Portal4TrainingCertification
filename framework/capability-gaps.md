# Capability gaps — the advisor's register

> Maintained by the `advisor` agent (`capability-gap` skill). One row per recognised gap in the agentic solution itself (not product features — those are CRs). Status: OPEN → PLANNED (CR-…) → DONE / DECLINED. Seeded 2026-10-03 from the review given to the founder that day (CR-2026-10-03-1115).

| # | Gap | Why it matters | Advice | Status | Since |
|---|---|---|---|---|---|
| G1 | The network has never run end to end | No evidence the prompts hold together | First real requirement should be small; fix prompts from evidence | OPEN | 2026-10-03 |
| G2 | Guardrails are prose, not enforced | An agent allowed to commit/deploy can still run `git add -A`, edit `prisma/schema.prisma`, or `prisma migrate reset` | Claude Code hooks (PreToolUse) blocking those; `update-config` skill builds them; one CR | OPEN | 2026-10-03 |
| G3 | Autonomous mode has no stop conditions | Buddy could loop on a failing gate or exceed scope | Add explicit stop rules to `buddy.md`: gate fails twice, a test had to change to pass, >N CRs per run, deploy warning, scope exceeds the CR | OPEN | 2026-10-03 |
| G4 | Two terminals, one checkout | Model-per-CR terminals collide on the working tree | Second terminal works in a `git worktree` on its own branch; Buddy merges; write into `run-cr` and `initiate.md` | OPEN | 2026-10-03 |
| G5 | Flaky release-gate test (`training-interest.spec` fee setting) | Blocks good releases or teaches retry-until-green | Fix or quarantine via a CR before autonomous deploys are routine | OPEN | 2026-10-03 |
| G6 | Governance/security review optional before deploy | Autonomous deploys skip review | Make `governance-reviewer` mandatory before any deploy; `security-review` for auth/payment/upload changes | OPEN | 2026-10-03 |
| G7 | No notification when the founder is away | Autonomous runs finish or block unseen | Push notification at "blocked" and "deployed" | OPEN | 2026-10-03 |
| G8 | No production restore rehearsal | Nightly dump is the sole recovery path; never proven | Rehearse `deploy-rollback --restore-db` once, deliberately, with the founder | OPEN | 2026-10-03 |
| G9 | 30 `pf-*` skill descriptions load every session | Token cost in every chat | Founder's choice: keep one-per-framework, or fold into one `prompt-frameworks` skill | OPEN | 2026-10-03 |
| G10 | Desktop default agent (`"agent": "buddy"`) unverified | Sessions may not start as Buddy | Founder's new-tab test (CR-2026-10-03-1105 T8); fallback `claude --agent buddy` | OPEN | 2026-10-03 |
