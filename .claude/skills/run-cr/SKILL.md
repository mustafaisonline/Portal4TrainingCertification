---
name: run-cr
description: Pick and execute the latest Change Requisition in CR/ that is not yet done or deployed. Use when the founder says "execute the latest CR", "do the next CR" or "run CR", with or without a CR name.
---

# Run the latest open CR

If the founder names a CR, use it. Otherwise select one:

1. Read `CR/README.md` to list all CRs, then open each CR file and read its own `**Status:**` header and `## 5. Tracker`. The index status text can be stale or missing, so the CR file wins.
2. Order candidates by the timestamp in the filename, newest first (do not trust the index order).
3. Classify each CR:
   - **Executable:** NOT STARTED or IN PROGRESS (some tracker step not yet BUILT).
   - **Skip, but report:** BUILT / BUILT & VERIFIED (awaiting commit, verify or deploy), DEFERRED, BLOCKED, awaiting a founder decision.
   - **Skip:** DONE, DEPLOYED, or every tracker step complete.
   Legacy entries outside `CR/` (`modification.md`, milestone plans) are all deployed; ignore them.
4. Pick the newest executable CR. State plainly which one and why, plus any newer CRs skipped and the reason. If none is executable, say so, list the BUILT/DEFERRED ones, and stop.
5. Open the CR's spec in `CR/specs/` (create it with `cr-spec` if missing) and follow it. Execute per `CLAUDE.md`: pre-flight assessment, read the CR's request, facts and plan, make the smallest change, one tracker step at a time. Stop and ask at any RED gate (data model, new dependency, auth, payments, destructive action) or open ambiguity; never invent business rules.
6. After each step update the CR's tracker, status header and progress log (MYT), and the status text of its row in `CR/README.md`. Validate (use the `test-verifier` agent) before marking VERIFIED; review with `governance-reviewer` when the change is significant.
7. When a milestone or WBS task is achieved, update `framework/milestones.md` / `framework/wbs.md` (`milestones-update`, `wbs-update`).
8. Commit, push and deploy only on the founder's word. Finish with the standard completion report.
