---
name: cr-spec
description: Write the specification for a CR: complete task breakdown with references to new or existing code. Use after new-cr and before any coding.
---

Create `CR/specs/CR-SPEC-<same timestamp>-<same title>.md` for the CR. Contents: link to the CR; requirement restated; for each task: description, files to change or create (existing code referenced as `path:line`), data-model impact (RED gate if any), dependencies, tests to add or run, docs to update, rollback; acceptance criteria; risks. Read the code before referencing it; never reference code you have not opened. Link the spec from the CR's plan section.
