# standard — Document authority hierarchy and marker convention

| Field | Value |
|---|---|
| Category | business |
| Kind | standard |
| Source of truth | `CLAUDE.md` (section "SOURCE OF PRODUCT REQUIREMENTS") |
| Owner | founder |
| Version / date | as in `CLAUDE.md` at 2026-10-02; DR-04 listed as approved there, now superseded by DR-07 (the CLAUDE.md table was not re-checked after DR-05 to DR-08) |
| Status | approved |
| Related | `policy-dr-01` to `policy-dr-08`, `definition-glossary` |

## Purpose
States which source wins when documents disagree, and how retired or deferred material is marked.

## Description
**Authority hierarchy (highest first).**
1. Explicit current human instruction.
2. Approved decision records (CLAUDE.md names DR-04, DR-03, DR-02, DR-01; later records DR-05 to DR-08 are also decision records, and DR-07 supersedes DR-04).
3. Approved project specification documents (`DATA_AI_ACADEMY_MVP_BUILD_SPEC.md`, `..._PORTAL_BLUEPRINT.md`, `..._PORTAL_MOCKUP_SPECIFICATION.md`).
4. Approved architecture and technical documentation.
5. Existing working implementation.
6. Other approved reference materials.
7. Previous AI assumptions.
8. General AI knowledge.

**Rules that follow from it.** Approved decision records outrank the specifications where they conflict. The three specifications remain authoritative except where a decision record supersedes or reframes them, and carry reconciliation notices at the top. If specifications conflict, the conflict is identified and clarification requested before implementing a decision that depends on it. No new authoritative specification is created unless explicitly instructed. `CuratedProductInstructions.md` and `ChatHistory.md` are intentionally not used.

**Marker convention.** In-place markers with a reason: `⊘ RETIRED`, `↻ REFRAMED`, `⏸ DEFERRED`. Where a marker and surrounding text disagree, the marker wins. Records also use `✎ AMENDMENT` blocks and "NARROWED" / "Superseded" notes. Superseded material is deliberately kept for traceability: a passage marked retired, deferred or superseded is a record, not an instruction.

**Reference material** (outside the repository, read-only via MCP) ranks below approved specifications and must not be copied into the repository without explicit founder direction.

## Change history
- 2026-10-02 written from `CLAUDE.md`.
