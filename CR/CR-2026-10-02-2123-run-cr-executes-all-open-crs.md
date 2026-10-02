# CR-2026-10-02-2123 — `run-cr` plans and executes ALL open CRs (parallel or sequence), flags which need a new terminal/model

**Received:** 2026-10-02 21:23 MYT · **Status:** BUILT · **Requested by:** founder
**Recommended model:** Haiku 4.5 would do; executed on Sonnet 5.5 (this session) — a skill-text edit.

## 1. Request (verbatim)

> No when run-cr run it should s=check what open crs are there and excute all in parallel or in sequence which eever is possible, alsong will highligh which can run int eh same terminal or which need new terminal with differnce model

## 2. Facts gathered

- The previous `run-cr` picked only the newest open CR (it ran `2016` and left six others open — the founder expected all).
- Subagents can run in parallel; `Agent` supports `isolation: "worktree"`. Only one `next dev` per project dir, and Playwright uses port 3101, so e2e runs must be serial.

## 3. Decisions & assumptions

- `run-cr` now: scan all open CRs → classify → dependency/file-overlap analysis → plan (parallel groups, sequence, blocked, needs-founder) → model per CR → split into "this terminal" vs "new terminal on model X" → show the plan → execute the this-terminal set.
- Parallel only when CRs touch disjoint files, share no data-model/dependency change, and are not RED gates; parallel work uses worktree-isolated subagents merged one at a time; tests run serially afterwards. When unsure → sequence. **Assumption.**
- A named CR still runs alone.

## 4. Plan

Rewrite `.claude/skills/run-cr/SKILL.md`; update `framework/initiate.md`/`buddy.md` wording; index row. No app code.

## 5. Tracker

| # | Step | Status | Updated |
|---|---|---|---|
| 1 | Rewrite `run-cr` | **BUILT** | 2026-10-02 |
| 2 | Exercised on the open CRs | NOT STARTED | — |

## 6. Progress log

| Date (MYT) | Entry |
|---|---|
| 2026-10-02 21:23 | CR created; skill rewritten. Not yet exercised (takes effect next session, or by reading the skill now). |
