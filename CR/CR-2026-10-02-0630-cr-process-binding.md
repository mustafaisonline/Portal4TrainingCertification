# CR-2026-10-02-0630 — Make the CR (Change Requisition) process binding on every session

**Received:** 2026-10-02 06:30 MYT · **Status:** BUILT · **Requested by:** founder

## 1. Request (verbatim)

> Please create a folder where can call CR (Change Requisition) and when ever I give a new requirement or a fix any, we must create a new .md files with timestamp to record, We will also use it to implement one by one even if our limit hit or our memory goes out.

## 2. Facts gathered

- The `CR/` folder already exists (created 2026-10-01) with a naming rule, a template and an index in `CR/README.md`; 10 CRs exist. What was missing: `CLAUDE.md` — the file every session must obey — did not mention it, so a fresh session could skip it.

## 3. Decisions & assumptions

- Keep the existing folder and naming (`CR-YYYY-MM-DD-HHMM-short-title.md`, Malaysia time). Make it binding in `CLAUDE.md`; add an assistant memory entry; add the open-CR check to `PROJECT_STATUS.md` §7 (resume).

## 4. Plan

Edit `CLAUDE.md` (new section after RESUMING WORK), `docs/execution/PROJECT_STATUS.md`, `CR/README.md`; memory entry.

## 5. Tracker

| # | Step | Status | Updated |
|---|---|---|---|
| 1 | `CLAUDE.md` section added | **DONE** | 2026-10-02 |
| 2 | `PROJECT_STATUS.md` resume step | **DONE** | 2026-10-02 |
| 3 | Memory entry | **DONE** | 2026-10-02 |

## 6. Progress log

| Date (MYT) | Entry |
|---|---|
| 2026-10-02 06:30 | CR created and built. Existing folder kept (no duplicate created). |
