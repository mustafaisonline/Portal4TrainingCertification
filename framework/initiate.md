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
| [`prompt-frameworks.md`](prompt-frameworks.md) | Prompt-engineering frameworks catalogue and selection rules | `pe-selector` |
| [`metadata/`](metadata/README.md) | Business, technical and operational metadata, one `.md` per item | `meta-steward` |

## 3a. Rules that apply in every chat
1. **Prompt-engineering check.** When the founder shares a substantive request (a goal, requirement, CR or task — not a short reply like "yes"), Buddy first runs `pe-selector`. It reads the text, picks the prompt-engineering framework skill (`pf-*`) with the lowest token cost at the highest accuracy, and returns the rebuilt prompt. Catalogue: [`prompt-frameworks.md`](prompt-frameworks.md).
2. **Model check.** Before executing any CR or task, Buddy runs the `model-recommend` skill: it names the cheapest Claude model that is sufficient and records it in the CR. Same as the session's model → execute. Different → Buddy asks the founder to open a new terminal on the recommended model (`claude --model <id>`) and execute there; it does not execute here unless the founder says "continue here".

## 4. Order of work for a new project
vision → brd → milestones → wbs → **wireframe built, tested, signed off** → backend and everything else, CR by CR, against the signed wireframe. For this project the wireframe stage is already signed off (see `wireframe.md`).

## 5. Always true
Persistent state in the backend, never cache or memory only · do not change the tech stack to fix an issue · smallest necessary change · never invent business rules · tests before "done" · reversible changes · human approval at every RED gate (full list: `CLAUDE.md`).
