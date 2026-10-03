# CR-SPEC-2026-10-03-1122 — Agentic hardening

**CR:** [CR-2026-10-03-1122-agentic-hardening-sonnet](../CR-2026-10-03-1122-agentic-hardening-sonnet.md) · **Recommended model:** Sonnet 5.5 (executed on Fable 5.1)

## Resume here
All tasks done and committed. Remaining: founder's word to push; G8 production restore with the founder; G1/G10 proven by the founder's new tab.

## Tasks

| # | Task | Files / elements | Status |
|---|---|---|---|
| T1 | Guard hook | `.claude/hooks/guard.py` (new; heredoc/quoted text treated as data except when fed to a shell or evaluator); `.claude/settings.json` (`hooks.PreToolUse`, `worktree`) | VERIFIED |
| T2 | Stop conditions, notifications | `.claude/agents/buddy.md` (tools + two sections) | BUILT |
| T3 | Worktree rule | `.claude/skills/run-cr/SKILL.md`, `.claude/skills/new-cr/SKILL.md`, `framework/initiate.md` §3a.5, `.claude/settings.json` | BUILT |
| T4 | Flaky test | `tests/e2e/training-interest.spec.ts` (~line 311: assert href, goto) | VERIFIED |
| T5 | Review gate | `run-cr` step 9, `buddy.md` "Before any deploy", `deploy-engineer.md` | BUILT |
| T6 | Restore rehearsal | `scripts/backup.sh` → `scripts/restore-rehearsal.sh` on the dev database (no repo change; PASS in the CR log) | DONE |
| T7 | Prompt-framework consolidation | `.claude/skills/prompt-frameworks/SKILL.md` (new); 30 `pf-*` folders removed; `pe-selector.md`; `framework/agents-and-skills.md`; `framework/prompt-frameworks.md`; Buddy roster | BUILT |
| T8 | Register + checks | `framework/capability-gaps.md`; link check; frontmatter/name uniqueness | DONE |

## Impacted elements
Settings/hooks: `.claude/settings.json`, `.claude/hooks/guard.py` · Agents: buddy, deploy-engineer, pe-selector · Skills: run-cr, new-cr, schema-proposal, prompt-frameworks (new), pf-* (removed) · Framework docs: initiate, agents-and-skills, prompt-frameworks, capability-gaps · Tests: `tests/e2e/training-interest.spec.ts` · Application code / database / dependencies / deployment: none.

## Validation
Hook: pipe tests for every rule + one in-session denial. Test: two consecutive green runs. Docs: link check, frontmatter uniqueness. Settings: JSON valid, hook command resolves.

## Rollback
Revert the commit (removes the hook registration too). To disable the hook alone: delete the `hooks` block from `.claude/settings.json`.
