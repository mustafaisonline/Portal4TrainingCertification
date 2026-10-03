---
name: cr-spec
description: Write the one-to-one specification for a CR in CR/specs/ — every portal element the CR's tasks impact, status per task, and a "resume here" section so another terminal can continue. Use after new-cr and impact-analysis, before any coding.
---

# CR specification

**One spec per CR, strictly 1:1, same name:** `CR/CR-<stamp>-<title>-<model>.md` ↔ `CR/specs/CR-SPEC-<stamp>-<title>-<model>.md`. The spec holds everything needed to start in a fresh terminal and continue where the last one stopped.

Contents:
1. Header: link to the CR, recommended model.
2. **Resume here** — 2–5 lines: what is done, what is in progress, the very next step, anything blocking. Update it every time work stops.
3. **Tasks** — table `# | Task | Files / elements | Status`, one row per task of the CR (same task numbers as the CR tracker). Status: OPEN, IN PROGRESS, BUILT, VERIFIED, DEPLOYED, CLOSED, BLOCKED. Keep it in step with the CR's tracker.
4. **Impacted elements (inventory)** — every element of the portal the tasks touch, from `impact-analysis` (recorded with `impact-record`): routes/pages, components, modules/services, database tables and migrations (schema change = RED gate), API routes, jobs, tests, copy and legal text, docs and metadata files, deploy scripts. Existing code as `path:line`, new code as `path (new)`. Read the code before referencing it.
5. Per task detail where needed: data-model impact, dependencies, tests to add or run, docs to update, rollback.
6. Acceptance criteria and risks.

Rules: never reference code you have not opened; do not invent business rules (ask); when several approaches exist, return the options with your recommendation to Buddy. Link the spec from the CR header.
