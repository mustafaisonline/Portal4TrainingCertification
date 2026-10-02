# CR-2026-10-02-2034 — AI delivery framework: document set, folders, agents and skills

**Received:** 2026-10-02 20:34 MYT · **Status:** BUILT — awaiting founder review · **Requested by:** founder

## 1. Request (verbatim)

> * initiate.md: First create an initiate.md file and ask AI to register it somewhere in the AI tool you are using like Claude or Cursor etc. whenever any chat is given by user, this file is referred.
> * guardrails.md: This will have details like, no code or functionality should implement in cache or in in-memory etc. To fix issue don't change tech stack etc
> * vision.md: Must create vision file based on business requirement. Business normally give high level requirements in one or two lines or in a paragraph with minimal details.
> * brd.md: This is business requirement document which will have more details as compared to vision.md
> * milestones.md: This will have complete breakdown of the requirements came from brd.md file. Whenever any milestone is achieved, milestone in this file will be updated.
> * wbs.md: This is kind of project management plan. Each task in this file will be mapped with milestones in milestones.md file.
> * cr_<system timestamp>.md: Whenever there is a requirement, it should save in a new CR file. When new project is in progress then requirements from WBS file will be referred here.
> * cr_spec _<system timestamp>.md: Every CR will have specification which will have complete breakdown of task or activities for each requirement in CR file, with all the references new potential code or reference to existing code.
> * techstack.md: This file will have all the tools and technologies used in this project
> * wireframe.md: before implement any backend technologies, we must implement, test and sign-off wireframe of the project. Once wireframe is signed then as AI to install backend and implement everything according to the wireframe.
> * Metadata files which will contact all three kind for metadata related files e.g., contracts, business definitions, each table or views, privacy policies, standard, procedure etc., to have .md files, each script will have .md files etc. all these will be stored in three categories of Metadata i.e., business, technical and operational metadata
>
> Agents and Skills
>
> * For every .md file mentioned above, AI to create all relevant agents and skills. I am. Not sure, if we would need .md files or not
> * There will be different categories of agents e.g., Business Requirements agents, execution agents, testing agents, deployment agents etc.
> * Eventually There will 100s-1000s of skills for each project.
>
> • ⁃ tl.agent: You will only talk to this agent, this agent will talk to all the agents to get the work done etc.
>
> based on these fodler, please crate relevant fodler, create relevant agents and skills. If few similar fiels are there in our project, please rename those to these file names and move thos ein the right fodler.
>
> Once done, pelase share the summary on what has been done.
>
> for example, we already have deployement agent wich have increemntal and full deployment capabilty, it will beocme. skill as well.

## 2. Facts gathered

- Existing look-alikes: `AI_DEVELOPMENT_GUARDRAILS.md` (root, 12 files reference it), `docs/architecture/TECHNOLOGY_STACK.md` (7), `docs/execution/PROJECT_PLAN_WBS.md` (9), 15 `MILESTONE_*_EXECUTION_PLAN.md` + reports (83 references), `WIREFRAME_TO_PRODUCTION_PLAN.md` (19), three authoritative root specifications, CRs in `CR/` (binding naming in `CLAUDE.md`).
- No deployment *agent* exists; the deployment capability is the `deploy/` pipeline (`deploy/start.sh`). It is delta/incremental whenever a `current` release exists (`05-deploy.sh`), and falls back to a full upload on first deploy.
- Subagents cannot spawn subagents, so `buddy` (the team lead) is the main-session agent; "tl.agent" = Buddy.

## 3. Decisions & assumptions (awaiting founder confirmation unless noted)

- All new framework documents live in `framework/`. Metadata in `framework/metadata/{business,technical,operational}/`.
- **Moved with `git mv`, references rewritten:** `AI_DEVELOPMENT_GUARDRAILS.md` → `framework/guardrails.md`; `TECHNOLOGY_STACK.md` → `framework/techstack.md`; `PROJECT_PLAN_WBS.md` → `framework/wbs.md`.
- **Not moved (consolidated by index instead):** milestone plans/reports (83 refs; they are traceability records), `WIREFRAME_TO_PRODUCTION_PLAN.md`, the three specifications and DR files (authoritative, outrank everything but the founder). `framework/milestones.md`, `vision.md`, `brd.md`, `wireframe.md` point at them and summarise; they do not copy or replace them.
- **CR naming kept as `CR-YYYY-MM-DD-HHMM-title.md`** (binding in `CLAUDE.md`, 30+ existing files). CR specs follow the same pattern: `CR/specs/CR-SPEC-YYYY-MM-DD-HHMM-title.md`.
- `tl` is Buddy; no second agent created.
- Agents are categorised by filename prefix: `br-` business requirements, `exec-` execution, `test-` testing, `deploy-` deployment, `meta-` metadata. Existing `governance-reviewer` and `test-verifier` are classed as testing without renaming.
- Skills are the unit that scales; agents stay few.
- Registration of `initiate.md`: an `@framework/initiate.md` import in `CLAUDE.md` (Claude Code loads it every session). Cursor is not used here, so no Cursor rules file.
- No application code, data model, dependency or production change. GREEN/YELLOW (many docs moved).

## 4. Plan

See `CR/specs/CR-SPEC-2026-10-02-2034-ai-delivery-framework.md`.

## 5. Tracker

| # | Step | Status | Updated |
|---|---|---|---|
| 1 | CR + spec | **BUILT** | 2026-10-02 |
| 2 | `framework/` created; three files moved, references rewritten | **BUILT** | 2026-10-02 |
| 3 | New documents (initiate, vision, brd, milestones, wireframe, metadata READMEs/templates) | **BUILT** | 2026-10-02 |
| 4 | Register initiate in CLAUDE.md | **BUILT** | 2026-10-02 |
| 5 | Agents | **BUILT** | 2026-10-02 |
| 6 | Skills (incl. deploy skills) | **BUILT** | 2026-10-02 |
| 7 | Link check, commit | **BUILT** | 2026-10-02 |

## 6. Progress log

| Date (MYT) | Entry |
|---|---|
| 2026-10-02 20:34 | CR created. |
| 2026-10-02 21:00 | All steps built; links checked (0 broken in moved files, index READMEs, framework, specs). Agents/skills not yet exercised (load at session start). Spec: `CR/specs/CR-SPEC-2026-10-02-2034-ai-delivery-framework.md`. |
