# initiate.md — read this first, in every chat

> **Registered in `CLAUDE.md` with `@framework/initiate.md`, so Claude Code loads it at the start of every session.**
> If you use another AI tool (Cursor, Copilot…), point its always-on rules file at this file.
> Owner: founder · Version 1.0 · Created 2026-10-02 (CR-2026-10-02-2034)

## 1. Who you talk to
The founder talks only to **Buddy**, the team lead (`tl`). Buddy turns goals into CRs and delegates to specialist agents (`.claude/agents/`) that use skills (`.claude/skills/`). Catalogue: [`agents-and-skills.md`](agents-and-skills.md).

## 2. Before you do anything
1. Run the **`resume-work`** skill: read `docs/execution/PROJECT_STATUS.md`, then `CR/README.md` and every CR not DONE/DEPLOYED.
2. Read [`guardrails.md`](guardrails.md) for anything significant. `CLAUDE.md` (the constitution) and the founder's current instruction outrank everything.
3. A new requirement or fix → a new CR first (`new-cr` skill), then its spec (`cr-spec` skill), then the work (`run-cr`).

## 3. The document set (what each file is for)

| File | Purpose | Who updates it |
|---|---|---|
| [`vision.md`](vision.md) | The business idea in a few lines — the north star | `br-analyst` |
| [`brd.md`](brd.md) | Business requirements in detail, traced to the approved specifications | `br-analyst` |
| [`milestones.md`](milestones.md) | The requirements broken into milestones; updated when one is achieved | `br-planner` |
| [`wbs.md`](wbs.md) | The project plan; every task maps to a milestone | `br-planner` |
| `../CR/CR-*.md` | One file per requirement, fix or decision | `new-cr` |
| `../CR/specs/CR-SPEC-*.md` | The task-level breakdown of one CR, with code references | `cr-spec` |
| [`guardrails.md`](guardrails.md) | The rules: persistence, no stack changes to fix an issue, approval gates | founder only |
| [`techstack.md`](techstack.md) | Every tool and technology in use | `exec-developer` (with approval) |
| [`wireframe.md`](wireframe.md) | Wireframe sign-off gate — no backend before it is signed | `exec-wireframer` |
| [`metadata/`](metadata/README.md) | Business, technical and operational metadata, one `.md` per item | `meta-steward` |

## 4. Order of work for a new project
vision → brd → milestones → wbs → **wireframe built, tested, signed off** → backend and everything else, CR by CR, against the signed wireframe. For this project the wireframe stage is already signed off (see `wireframe.md`).

## 5. Always true
Persistent state in the backend, never cache or memory only · do not change the tech stack to fix an issue · smallest necessary change · never invent business rules · tests before "done" · reversible changes · human approval at every RED gate (full list: `CLAUDE.md`).
