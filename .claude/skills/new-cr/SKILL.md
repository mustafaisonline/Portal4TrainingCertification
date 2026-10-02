---
name: new-cr
description: Create a new Change Requisition file in CR/ for a founder requirement, fix or decision, and add it to the CR/README.md index. Use at the start of any new requirement, before changing code or configuration.
---

# New Change Requisition

CLAUDE.md makes a CR mandatory before any code or config change. Steps:

1. Get the current Malaysia time: `TZ=Asia/Kuala_Lumpur date '+%Y-%m-%d-%H%M'`.
2. Create `CR/CR-<YYYY-MM-DD-HHMM>-<short-kebab-title>.md` using the same structure as existing CRs (see `CR/CR-2026-10-02-0630-cr-process-binding.md`):
   - Header: `# CR-<stamp> — <title>`, then Received (date, time MYT), Status, Requested by.
   - `## 1. Request (verbatim)` — the founder's exact words in a blockquote; never paraphrase.
   - `## 2. Facts gathered` — with sources; nothing invented.
   - `## 3. Decisions & assumptions`
   - `## 4. Plan` — files touched, data/DB impact (a schema change is a RED gate: stop and ask), tests, docs.
   - `## 5. Tracker` — table `# | Step | Status | Updated`; statuses NOT STARTED → IN PROGRESS → BUILT → VERIFIED → DEPLOYED.
   - `## 6. Progress log` — dated lines, newest last.
3. Add a row at the top of the index table in `CR/README.md` (newest first): `| [file](file) | Title — STATUS |`.
4. Tell the founder the CR is open, then work one CR at a time. Update the tracker and log after every step; commit, push and deploy only on the founder's word.

Argument, if given, is the request text or title.
