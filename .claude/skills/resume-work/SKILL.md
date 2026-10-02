---
name: resume-work
description: Orient a new session by reading PROJECT_STATUS.md and the CR index, then summarise open CRs, pending founder decisions and deferred items. Use at the start of a session or after a lost conversation.
---

# Resume work

Read-only. Do these in order:

1. Read `docs/execution/PROJECT_STATUS.md` (what is built, numbered decisions awaiting the founder, how to run/test, working agreements).
2. Read `CR/README.md`; open every CR whose status is not DONE or DEPLOYED and read its tracker and progress log.
3. Run `git status --short` and `git log --oneline -5`.
4. Summarise for the founder: open CRs with their next step, decisions awaiting an answer, DEFERRED items to raise now (the email-provider decision, deferred 2026-10-02, must be raised at the start of the next working session), and uncommitted changes.
5. Propose the next single step and wait for the founder's "go". Do not change files or start work.
