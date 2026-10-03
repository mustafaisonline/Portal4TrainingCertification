---
name: schema-proposal
description: Draft the written RED-gate case for a physical data-model change (tables, columns, keys, indexes, migration, rollback) for the founder's approval, before any schema or migration file is touched. Use whenever a task appears to need a schema change.
---

# Schema-change proposal (RED gate)

`CLAUDE.md` Rule 1: never change the physical data model without human approval. This skill produces the case the founder approves; it changes nothing.

1. **Confirm it is needed.** Check `prisma/schema.prisma` and the repositories: does an existing table or column already hold the data (the diagnostic score needed none — `topic_question_options.is_correct` already existed)? If the stack can do it without a schema change, say so and stop.
2. **Write the proposal** into the CR spec under the task (status BLOCKED until approved):
   - Why the change is required and which requirement/DR it serves.
   - The exact change: model and table name, every column (name, type, nullable, default), keys, relations, indexes, enums; additive vs destructive; `@@map` names.
   - The migration: name, forward SQL summary, data backfill if any, whether it can run on the live database without downtime, and the order relative to the code deploy.
   - Impact: every repository, service, seed, test and metadata file that reads or writes the affected tables (from `impact-analysis`).
   - Alternatives considered and why rejected.
   - Rollback: whether the migration is reversible, what data would be lost, and the restore path (`deploy-rollback --restore-db` is destructive and needs the founder's word).
   - Privacy: any personal data added, retention, encryption, and Privacy-notice updates.
3. **Ask.** Return the proposal to Buddy, who presents it to the founder with a recommendation. Only an explicit approval in chat (quoted into the CR log) unblocks the task.
4. **After approval:** write the migration with `prisma migrate dev --name <name>` on the dev database, apply to the test database, update `framework/metadata/technical/table-*.md` for every table touched (`metadata-capture`), and the CR/spec status.
