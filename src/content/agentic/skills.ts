import { PROMPT_FRAMEWORKS_SKILL_FILE } from "./prompt-frameworks-skill";
import type { AgenticItem } from "./types";

/* The eight starter skills (generalised from the ones we run ourselves). */

export const SKILLS: readonly AgenticItem[] = [
  {
    slug: "next-steps",
    kind: "skill",
    title: "Next Steps",
    summary: "Produces the ordered \"what to do next\" for a goal or a whole project, mapped to who or what owns each step, with the decisions you must make flagged.",
    bestFor: ["The start of any goal", "After a piece of work finishes or stalls", "Anyone who loses track of what is open"],
    youGive: ["A goal, or just \"what next?\"", "Your status note and open change list, if you keep them"],
    youGet: ["Steps in delivery order, each with an owner and what it needs from you", "The one action that unblocks the most, first", "Guardrail problems called out before they happen"],
    example: { request: "/next-steps add single sign-on", result: "1. Decide the identity provider (your call). 2. Impact check: login, sessions, tests. 3. Change record + spec. 4. Build in a branch. 5. Test + review. Risk: it changes the auth design — needs your approval first." },
    howItWorks: ["Reads your status note, open changes and recent commits.", "Places the goal in your delivery order.", "Names the owner of each step and whether it can run now.", "Ranks by what unblocks the most, flags risks, returns the list.", "Does not execute any step."],
    limits: ["Only as current as your written status.", "It advises; it does not act."],
    customise: ["Edit the delivery order in step 3 to match your process."],
    definition: `---
name: next-steps
description: Produce the ordered "what to do next" for a goal, or for the project as a whole, per best practice, mapped to the roles and skills that own each step. Use at the start of a goal and after work completes or stalls.
---

# Next steps

1. Establish state: the project status note, the list of open changes (their trackers), \`git status --short\`, \`git log --oneline -5\`.
2. If a goal is given, place it: which requirement area, which decisions it touches, whether it needs a design or wireframe sign-off.
3. Lay out the steps in your delivery order and skip none silently: requirements → impact analysis → plan (one change record per piece of work) → design/sign-off (if a new area) → build → test + review → release → update the docs.
4. For each step name the owner (person, agent or skill), what it needs from the person (decision, approval, screenshot), and whether it can run now or is blocked.
5. Rank: the one action that unblocks the most, first. Call out anything that would break a guardrail (data-model change, new technology, state held only in memory) before it happens.
6. Return the list. Do not execute any step.
`,
  },
  {
    slug: "impact-analysis",
    kind: "skill",
    title: "Impact Analysis",
    summary: "Finds everything a new requirement will touch across your codebase — screens, code, database, tests, copy and docs — before you plan the work.",
    bestFor: ["Sizing a change honestly before you promise a date", "Finding the tests and copy that will break", "Catching a risky data-model change early"],
    youGive: ["The requirement in the person's own words", "Your open changes, so overlaps are visible"],
    youGet: ["A list per layer: element, why it is affected, edit/new/remove/test/doc, risk", "A flag on anything that needs approval", "Open questions with a recommended answer"],
    example: { request: "/impact-analysis rename \"Membership\" to \"Plan\"", result: "Routes: /membership → /plan (redirect). UI: nav, 6 components. Emails: 3 templates. Tests: 9 specs assert the old word. Docs: terms page. DB: none. Risk: SEO — keep a permanent redirect." },
    howItWorks: ["Lists the words people use for the feature, including old names.", "Searches every layer for each word instead of assuming.", "Cross-checks decisions and other open changes.", "Writes the structured list and hands it on. Never edits files."],
    limits: ["Search finds text, not intent: skim the results.", "It does not estimate effort."],
    customise: ["Change the layer list to your own folders."],
    definition: `---
name: impact-analysis
description: Thorough impact analysis of a new requirement across the whole project — every route, component, module, table, test, copy, doc and release item that must change. Use for every new requirement, before the plan is written.
---

# Impact analysis

Read-only. Input: the requirement (verbatim) and the open changes. Work through every layer; search, do not assume.

1. **Terms.** List the words a person would use for the feature (UI labels, route names, table names, old names). Search for each across your source, tests, docs and scripts.
2. **Layers to check, each with a finding or "none found":**
   - routes, pages, layouts and navigation
   - components and shared UI
   - modules: services, repositories, server actions, API handlers
   - database: tables and columns read or written — flag a needed change as RED; migrations; seed data
   - configuration and environment variables (names only)
   - copy and legal text: pages, emails, SEO
   - roles, permissions, audit logging
   - background jobs, emails, payments
   - tests: every unit, integration and browser test that asserts today's behaviour (they will need updating)
   - documentation: decisions, requirements, status notes
   - release and operations: scripts, runbooks
3. **Cross-checks:** conflicts with recorded decisions and your rules; overlap with other open changes (same files).
4. **Output:** a structured list per layer — element (\`path:line\`), why it is impacted, change type (edit / new / remove / test / doc), risk, RED flag — plus open questions with your recommendation. Never change files yourself.
`,
  },
  {
    slug: "change-request",
    kind: "skill",
    title: "Change Request",
    summary: "Turns every new requirement into a written, dated change record before any work starts — verbatim request, facts, plan, tracker and progress log.",
    bestFor: ["Keeping a durable memory of what was asked and decided", "Resuming work after an interruption", "Teams that want traceability without heavy tooling"],
    youGive: ["The request, word for word", "Optionally: the impact analysis"],
    youGet: ["A new file docs/changes/CR-<date>-<title>.md with the request, facts, decisions, plan, tracker and log", "An updated index of open changes"],
    example: { request: "/change-request add CSV export of invoices", result: "Created docs/changes/CR-2026-03-14-1130-invoice-csv-export.md (request quoted verbatim; plan: 3 tasks; tracker: all OPEN) and added it to docs/changes/README.md." },
    howItWorks: ["Evaluates the request against requirements and decisions, runs the impact check.", "Splits the work into tasks; keeps a risky task (data model, payments) in its own record so it can wait for approval.", "Creates the dated file from the template and adds the index row.", "Keeps the tracker and log up to date after every step."],
    limits: ["It records and plans; it does not build.", "A change record is only as good as the verbatim request."],
    customise: ["Change the folder, the file-name pattern and the statuses."],
    definition: `---
name: change-request
description: Evaluate a new requirement and create its change record (CR) before any work starts — one file per bundle of work, with the request quoted verbatim, facts, plan, tracker and a dated log — plus the index row. Use at the start of any new requirement.
---

# New change record

A change record is mandatory before any code or configuration changes.

## 1. Evaluate first
1. Read the requirement; check it against your requirements file, decision records and the open changes.
2. Run the \`impact-analysis\` skill so the whole project is scanned for what it touches.
3. Split the work into tasks. A task that is risky (data model, payments, security, new dependency) stands in its own record so it can wait for approval without blocking the rest. If grouping has several sensible choices, return the options with your recommendation.

## 2. Create the record
4. File name: \`docs/changes/CR-<YYYY-MM-DD-HHMM>-<short-kebab-title>.md\` (use a later minute for each further record of the same bundle).
5. Contents:
   - Header: title, received (date, time), status, requested by.
   - \`## 1. Request (verbatim)\` — the exact words, never paraphrased.
   - \`## 2. Facts gathered\` · \`## 3. Decisions & assumptions\` · \`## 4. Plan\` (a data-model change is a stop-and-ask).
   - \`## 5. Tracker\` — a table: task, status (OPEN → IN PROGRESS → BUILT → VERIFIED → DEPLOYED, plus BLOCKED), updated.
   - \`## 6. Progress log\` — dated lines, newest last.
6. Add a row at the top of \`docs/changes/README.md\` (newest first).
7. Tell the person which records exist. Commit and release only on their word.
`,
  },
  {
    slug: "model-recommend",
    kind: "skill",
    title: "Model Recommend",
    summary: "Recommends the cheapest Claude model that is sufficient for a task, compares it with your session's model, and tells you whether to run it here or open a new session.",
    bestFor: ["Keeping AI costs under control", "Routing simple work to a small model and hard work to a large one", "Teams running several sessions at once"],
    youGive: ["The task or change record"],
    youGet: ["The recommended model with a one-line reason", "A same/different verdict against your current model", "The command to open a session on the right model"],
    example: { request: "/model-recommend rename a label in 14 files", result: "Haiku — mechanical, well-specified, reversible. This session is Opus: recommended cheaper model differs. Open a new session with `claude --model <haiku id>`, or say \"continue here\"." },
    howItWorks: ["Judges files touched, ambiguity, reasoning depth, risk and reversibility.", "Maps the task to the tier table below.", "Compares with the session's model and states the verdict.", "Never switches models by itself."],
    limits: ["A rule of thumb, not a benchmark.", "Model names and IDs change: update the table when they do."],
    customise: ["Edit the table to the models you actually use and their IDs."],
    definition: `---
name: model-recommend
description: Recommend the cheapest Claude model that is sufficient for a task, compare it with the session's current model, and decide whether to execute here or open a new session. Use before executing any larger task.
---

# Model recommendation

Rule of thumb (guidance, not a benchmark): **the cheapest model that is sufficient**. Keep this table current for the models you use.

| Tier | Use for |
|---|---|
| Small | Mechanical, well-specified work: link fixes, renames, status and doc updates, formatting, simple lookups |
| Medium | Typical feature and bug work in known code, single-module changes, tests, specs, reviews of small diffs |
| Large | Multi-module changes, architecture and data-model analysis, auth/payment/migration work, hard root-cause debugging |
| Largest | The hardest cross-cutting redesigns and ambiguity-heavy research where lower tiers fall short |

## Steps
1. Read the task. Judge: files and modules touched, ambiguity, reasoning depth, risk (money, auth, data), reversibility.
2. Name the recommended tier and give a one-line reason. Note it in the change record.
3. Compare with the session's current model (if unknown, ask).
4. Same model → execute. Different → do not execute: report "recommended X, this session is Y" and let the person open a new session on the recommended model (\`claude --model <id>\`). They may say "continue here"; only then execute, and note it in the record. Never switch models yourself.
5. Mixed work: recommend per task; use the highest tier any task needs unless splitting clearly saves cost.
`,
  },
  {
    slug: "schema-proposal",
    kind: "skill",
    title: "Schema Proposal",
    summary: "Drafts the written case for a database change — what, why, the migration, impact and rollback — for your approval, before any schema file is touched.",
    bestFor: ["Protecting a production database from casual changes", "Giving a founder or DBA something concrete to approve", "Checking first whether a change is needed at all"],
    youGive: ["The requirement that seems to need a schema change"],
    youGet: ["A proposal: exact tables, columns, keys, indexes; migration steps; impact on code and tests; alternatives; rollback; privacy notes", "Nothing is changed until you approve in writing"],
    example: { request: "/schema-proposal store a delivery note on each order", result: "Existing column orders.notes already holds free text — no change needed. If you still want a structured field: add nullable delivery_note text (additive, no downtime, rollback = drop column). Awaiting your decision." },
    howItWorks: ["First checks whether an existing table or column already does the job.", "Writes the proposal under the task, marked BLOCKED until approved.", "Returns it to you with a recommendation.", "After your explicit approval it records the exact line and unblocks the work."],
    limits: ["It proposes; a person approves.", "It does not run migrations."],
    customise: ["Add your own required sections (data retention, encryption, regional rules)."],
    definition: `---
name: schema-proposal
description: Draft the written case for a physical data-model change (tables, columns, keys, indexes, migration, rollback) for approval, before any schema or migration file is touched. Use whenever a task appears to need a schema change.
---

# Schema-change proposal

Never change the physical data model without approval. This skill produces the case to approve; it changes nothing.

1. **Confirm it is needed.** Check the schema and the code: does an existing table or column already hold the data? If the stack can do it without a change, say so and stop.
2. **Write the proposal** under the task (status BLOCKED until approved):
   - Why the change is required and which requirement it serves.
   - The exact change: table names, every column (name, type, nullable, default), keys, relations, indexes, enums; additive or destructive.
   - The migration: name, forward summary, any data backfill, whether it can run on the live database without downtime, and its order relative to the code release.
   - Impact: every repository, service, seed, test and doc that reads or writes the affected tables.
   - Alternatives considered and why rejected.
   - Rollback: whether it is reversible, what data would be lost, and the restore path.
   - Privacy: any personal data added, retention, encryption, notice updates.
3. **Ask.** Return the proposal with your recommendation. Only an explicit written approval unblocks the task: quote it into the change record.
4. **After approval:** write the migration on the development database, apply to the test database, update the data documentation.
`,
  },
  {
    slug: "guardrails-check",
    kind: "skill",
    title: "Guardrails Check",
    summary: "Checks a planned or finished change against your written rules — persistence, data model, new technology, testing, destructive actions and git hygiene — and reports PASS or the exact gate that applies.",
    bestFor: ["A quick check before starting significant work", "A last check before declaring work done", "Teams with a written rules file that people forget"],
    youGive: ["The change or plan", "Your rules file"],
    youGet: ["PASS, or the specific rule that applies and what to do about it"],
    example: { request: "/guardrails-check we will cache the cart in memory", result: "Gate: persistence. A cart held only in memory is lost on restart. Persist it in the database (cache is fine for speed, not as the source of truth)." },
    howItWorks: ["Reads your rules file (the quick reference first, then the relevant sections).", "Checks persistence, data model, technology, root-cause fixing, tests, destructive actions and git hygiene.", "Reports PASS or the gate; suggests the Change Reviewer agent for a full diff review."],
    limits: ["It enforces only what you have written.", "It is a checklist, not a full review."],
    customise: ["Point it at your own rules file and add your own gates."],
    definition: `---
name: guardrails-check
description: Check a planned or finished change against the project's written guardrails. Use before starting significant work and before declaring it done.
---

Read the project's rules file (for example \`CLAUDE.md\` or \`docs/guardrails.md\`): the quick reference first, then the relevant sections.

Check: persistence (nothing critical held only in cache or memory), data-model changes, new technology or dependencies, fixing by root cause inside the existing stack, testing, destructive actions, and git hygiene (only this project's files, nothing unrelated staged).

Report PASS, or the specific gate that applies and what the person must do about it. For a full diff review, suggest the \`change-reviewer\` agent.
`,
  },
  {
    slug: "resume-work",
    kind: "skill",
    title: "Resume Work",
    summary: "Orients a new session in seconds: reads your status note and open changes, then summarises what is open, what is waiting on you, and the next single step.",
    bestFor: ["Starting a new session or picking up after a break", "After a lost conversation or a usage limit", "Handing work to a colleague"],
    youGive: ["Nothing — it reads your project files"],
    youGet: ["Open changes with their next step", "Decisions waiting on you and deferred items to raise", "Uncommitted changes, and a proposed next step"],
    example: { request: "/resume-work", result: "Open: CR-0412 invoice export (BUILT, needs review); CR-0415 login copy (OPEN). Waiting on you: choose the CSV date format. Uncommitted: 2 files. Proposed next step: run the change review on CR-0412. Say \"go\" to start." },
    howItWorks: ["Reads the status note and the change index.", "Opens every change that is not finished and reads its tracker and log.", "Runs git status and a short git log.", "Summarises and waits for your \"go\". Changes nothing."],
    limits: ["Only as good as the status note and trackers you keep up to date."],
    customise: ["Change the file names it reads; add items to raise at the start of every session."],
    definition: `---
name: resume-work
description: Orient a new session by reading the status note and the change index, then summarise open changes, pending decisions and deferred items. Use at the start of a session or after a lost conversation.
---

# Resume work

Read-only. Do these in order:

1. Read the project status note (for example \`docs/STATUS.md\`): what is built, decisions awaiting the owner, how to run and test, working agreements.
2. Read the change index (for example \`docs/changes/README.md\`); open every change whose status is not DEPLOYED or CLOSED and read its tracker and log.
3. Run \`git status --short\` and \`git log --oneline -5\`.
4. Summarise: open changes with their next step, decisions awaiting an answer, deferred items to raise now, and uncommitted changes.
5. Propose the single next step and wait for the person's "go". Do not change files or start work.
`,
  },
  {
    slug: "prompt-frameworks",
    kind: "skill",
    title: "Prompt Frameworks",
    summary: "A reference of 30 prompt-engineering techniques with rules for choosing the cheapest accurate one — the knowledge base behind the Prompt Selector agent.",
    bestFor: ["Anyone writing prompts regularly", "Rebuilding a vague request into a precise one", "Teams that want consistent prompt quality"],
    youGive: ["A request to rebuild, or a question like \"which technique fits this?\""],
    youGet: ["The technique, why it fits and what it costs", "A rebuilt prompt in that structure"],
    example: { request: "Which technique for a strict JSON classification task?", result: "Few-shot (2–3 examples) for format accuracy, combined with XML-structured sections if the inputs are long. Zero-shot would be cheaper but weaker on strict formats." },
    howItWorks: ["Holds all 30 techniques with structure, best use, cost and when to avoid each.", "Applies the selection rules: cheapest sufficient first.", "Rebuilds your prompt in the chosen structure, marking unknowns."],
    limits: ["Cost and accuracy notes are rules of thumb, not measurements.", "Techniques help; they do not add knowledge the model lacks."],
    customise: ["Remove techniques you never use to cut the token cost of the skill."],
    definition: PROMPT_FRAMEWORKS_SKILL_FILE,
  },
];
