# CR-2026-10-03-1122 — Agentic hardening: enforced guardrails, stop conditions, worktrees, review gate, notifications, flaky gate, restore rehearsal, prompt-framework consolidation

**Received:** 2026-10-03 11:22 MYT · **Status:** BUILT & VERIFIED — awaiting push · **Requested by:** founder
**Recommended model:** Sonnet 5.5 — configuration, prompt and test edits; one judgement-heavy item (the hook rules). Executed on Fable 5.1 (this session).

Spec: [`CR-SPEC-2026-10-03-1122-agentic-hardening-sonnet.md`](specs/CR-SPEC-2026-10-03-1122-agentic-hardening-sonnet.md)

## 1. Request (verbatim)

> Implement all these as per your recommendations

(pasted: my nine-point gap list of 2026-10-03 — must-haves 1–5, should-haves 6–9; see `framework/capability-gaps.md` G1–G9.)

## 2. Facts gathered

- Hook format and semantics from the Claude Code settings schema (loaded via the `update-config` skill): PreToolUse command hooks receive the tool call as JSON on stdin; `hookSpecificOutput.permissionDecision` allow/deny/ask; `additionalContext` injects a note. `CLAUDE_PROJECT_DIR` names the project.
- `PushNotification` tool exists (desktop notification; phone when Remote Control is connected).
- `claude --worktree` and the `worktree.symlinkDirectories` setting exist (settings schema).
- Flaky test `training-interest.spec.ts:305`: clicks a server-rendered `<Link>` right after `page.goto('/admin/orders')`; the click is lost when it lands during hydration (URL stays `/admin/orders`). Fails ~3 of 4 local runs, unrelated to any product change.
- `scripts/restore-rehearsal.sh` restores a dump into a scratch database on the local PostgreSQL, checks migrations and row counts, and drops the scratch database — non-destructive.

## 3. Decisions & assumptions

- Hook implemented in Python (`.claude/hooks/guard.py`) — no jq dependency, no new technology. Deny list: `git add -A/./--all`, force-push, `git reset --hard`, `git clean -f`, `git checkout -- .`, database resets, recursive delete of protected folders, and edits to `prisma/schema.prisma` / `prisma/migrations/` unless an OPEN CR spec carries `SCHEMA CHANGE APPROVED BY FOUNDER`. Ask: database restore. Warn (context only): application code edited with no CR modified or created today. Everything else is left to normal permissions (the hook prints nothing).
- The approval token is written by the `schema-proposal` skill only after the founder approves in chat. It is a brake against accident and drift, not a lock against a deliberate forgery — that remains a trust boundary, stated here honestly.
- Stop conditions, notification points and the mandatory review gate are written into `buddy.md`, `run-cr`, `deploy-engineer`, `initiate.md`.
- Two-terminal rule: `claude --worktree --model <id>`; `worktree.symlinkDirectories: ["node_modules"]`, `baseRef: "head"` in settings; one Playwright run at a time; Buddy merges.
- Flaky test: assert the link's `href`, then navigate directly — same coverage, no hydration race. **Assumption:** the race is the whole cause (verified by two consecutive green runs after the change).
- Restore rehearsal: run locally against a fresh dev-database dump (proves the backup/restore mechanism and the scripts). The production restore (`deploy-rollback --restore-db`) is destructive and is NOT run; it waits for a session with the founder. G8 therefore PLANNED, not DONE.
- `pf-*` → one `prompt-frameworks` skill (founder: "as per your recommendations"); `pe-selector` preloads it. The 30 skill folders are removed from git (history keeps them).
- G1 (first real run) cannot be "implemented"; it is the next product requirement.

## 4. Plan

See the spec.

## 5. Tracker

| # | Task | Status | Updated |
|---|---|---|---|
| T1 | Guard hook + settings registration; pipe tests; in-session proof; two first-contact fixes | VERIFIED (13/13 cases) | 2026-10-03 |
| T2 | Stop conditions + notifications in Buddy; PushNotification tool | BUILT | 2026-10-03 |
| T3 | Worktree rule (run-cr, new-cr, initiate) + worktree settings | BUILT | 2026-10-03 |
| T4 | Flaky gate test fixed and proven green twice | VERIFIED (10/10, 10/10) | 2026-10-03 |
| T5 | Mandatory review before deploy (run-cr, buddy, deploy-engineer) | BUILT | 2026-10-03 |
| T6 | Local restore rehearsal run and recorded | DONE (local); production restore PLANNED with the founder | 2026-10-03 |
| T7 | `pf-*` folded into `prompt-frameworks`; pe-selector, catalogue, roster updated | BUILT | 2026-10-03 |
| T8 | Gap register updated; link/frontmatter checks; commit | DONE | 2026-10-03 |

## 6. Progress log

| Date (MYT) | Entry |
|---|---|
| 2026-10-03 11:22 | CR created; T2, T3, T5, T7 built; T1/T4/T6 running. |
| 2026-10-03 | **T1 hook proven live:** the assistant's own `git add --all --dry-run` was denied in this session before it ran. **Two first-contact defects, both fixed within the hour:** (a) the hook scanned the whole command text, so harmless commands were denied merely because a CR-log sentence or a test payload *mentioned* a forbidden command — now heredoc bodies are blanked first (unless fed to a shell) and quoted strings are blanked unless the command hands text to an evaluator, where quoted text is executable; (b) `bash -c "git add -A"` slipped through because the pattern required whitespace after the flag — a closing quote now counts as a boundary. Thirteen cases pass: plain forbidden → deny; the same text inside a heredoc or commit message → silent; the heredoc fed to bash, or the text inside an evaluator → deny; real force-push / db reset → deny; safe staging and `git add ./src/x.ts` → silent; schema edit without approval → deny. Documented limit: text executed indirectly from inside a script is not seen — a brake, not a lock. |
| 2026-10-03 | **T4:** `training-interest.spec.ts` green twice in a row after the change (10/10, 10/10); before it the fee-setting test failed ~3 of 4 local runs. **T6:** `scripts/backup.sh` dumped `p4tc_dev` (57 MB, checksum) and `scripts/restore-rehearsal.sh` restored it into a scratch database — PASS: migrations recorded as applied, every business table's row count matched (topic_questions 3830, topic_question_options 19150, users 5 …), scratch database dropped. Proves the mechanism on this machine; the production restore is destructive and waits for a session with the founder (G8 PLANNED). |
