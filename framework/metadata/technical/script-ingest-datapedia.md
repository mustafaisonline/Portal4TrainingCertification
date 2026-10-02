# script — ingest-datapedia

| Field | Value |
|---|---|
| Category | technical |
| Kind | script |
| Source of truth | scripts/ingest-datapedia.ts |
| Owner | founder |
| Version / date | 2026-10-02 |
| Status | approved |
| Related | Milestone 14 Phase 2, DR-03, founder decisions P3 P7 P8 P18 (named in the script); npm script learning:import; src/modules/free-learning/import.ts; src/modules/free-learning/book.repository.ts |

## Purpose
Imports the founder's book *I Am Datapedia!* (a .docx) into Free Learning: one topic per top-level heading, with its images.

## Description
- **Arguments:** `"/path/to/I Am Datapedia.docx"` (required, must exist; otherwise usage and exit 2), optional `--draft` (import everything unpublished; default publishes) and `--only <slug>` (import just that topic).
- **Environment variables:** `DATABASE_URL` (if unset, loads `.env.local` from the current directory).
- **Outputs:** progress lines (converted counts and timing, a line every 25 topics) and a final summary: topics created and replaced, images stored, undisplayable images dropped.
- **Database tables:** writes `book_topics` and `book_topic_images` via `replaceTopicFromImport`, one transaction per topic, so a failure leaves other topics intact. A topic is matched by slug; its body and images are replaced, and an administrator's unpublish decision is kept (per the script comment). Other tables touched by that repository function are not determined from the script.
- **External services:** none; uses `mammoth` (a devDependency, decision P7) to convert .docx to HTML. Images not displayable in a browser (for example EMF) are dropped and counted.
- **Side effects:** replaces the stored body and images of imported topics; the default run publishes them.
- **Idempotent / destructive:** safe to re-run, but it overwrites the body and images of matching topics, so manual edits to those topics made in the database would be lost (inferred from "body and images replaced"). Does not delete topics that are absent from the file.
- **How to run:** `export PATH="/opt/homebrew/opt/node@24/bin:$PATH"; npm run learning:import -- "/path/to/I Am Datapedia.docx" [--draft] [--only <slug>]`. One-off, dev-time tool.
- **Safety notes:** the book file itself never enters the repository (`Book/` is ignored, per the script). Prefer `--draft` when the result should be reviewed before readers see it. Check the target `DATABASE_URL` first.

## Change history
- 2026-10-02 — metadata file created from the script as it stood in the repository.
