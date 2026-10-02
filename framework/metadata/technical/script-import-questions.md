# script — import-questions

| Field | Value |
|---|---|
| Category | technical |
| Kind | script |
| Source of truth | scripts/import-questions.ts |
| Owner | founder |
| Version / date | 2026-10-02 |
| Status | approved |
| Related | Milestone 14 Phase 3, founder decisions P9-P10 (named in the script); npm script learning:import-questions; src/modules/free-learning/quiz.repository.ts |

## Purpose
Loads DRAFT self-check questions for Free Learning topics from JSON files. An administrator reviews them at `/admin/free-learning/<topic>/questions` before readers see them.

## Description
- **Arguments:** `<file.json | directory>` (required, must exist; else usage and exit 2) and optional `--replace-drafts`. A directory means every `*.json` in it, sorted.
- **Input format:** each file is `{ "topic": "<slug>", "questions": [ { "stem", "options": [5 strings], "correct": <index>, "explanation" } ] }` (the example in the script shows five options).
- **Environment variables:** `DATABASE_URL` (if unset, loads `.env.local` from the current directory).
- **Outputs:** summary `done: N file(s) · N draft questions inserted · N drafts replaced · N topic(s) skipped`, a list of skipped topics, and a `NOT FOUND` list (exit code 1) for files whose topic slug does not exist.
- **Database tables:** reads `book_topics` (find by slug); writes `topic_questions` and `topic_question_options` via `importDraftQuestions`, one transaction per topic. Every file is validated (`validateQuestion`) before anything is written.
- **External services:** none.
- **Side effects:** new questions in status draft.
- **Idempotent / destructive:** a topic that already has questions is skipped, so a plain re-run is safe. With `--replace-drafts` it removes that topic's drafts (never its reviewed questions) and loads the file again, which is destructive to the existing drafts.
- **How to run:** `export PATH="/opt/homebrew/opt/node@24/bin:$PATH"; npm run learning:import-questions -- <file.json | directory> [--replace-drafts]`.
- **Safety notes:** imported questions are not visible to readers until reviewed (or bulk-approved with `scripts/bulk-review-questions.ts`). Check the target `DATABASE_URL` first.

## Change history
- 2026-10-02 — metadata file created from the script as it stood in the repository.
