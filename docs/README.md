# Project Documentation

> **Status as at 2026-08-30: PLANNING & ARCHITECTURE MODE — implementation not authorized.**

| Folder | Holds | Index |
|---|---|---|
| [`architecture/`](architecture/README.md) | **Decisions** — principles, ADRs, technology choices, data/security/integration/deployment architecture. The frozen baseline | [Architecture index](architecture/README.md) |
| [`execution/`](execution/README.md) | **Delivery** — milestone plans, RED-gate action lists, verification criteria, completion reports | [Execution index](execution/README.md) |

**The test for where something belongs:** if it would still be true after the current milestone ships, it is architecture. If it describes *this* piece of work, it is execution.

## Authoritative sources above this folder

Product requirements come from the approved specifications in the repository root, which outrank everything here:

- `DATA_AI_ACADEMY_MVP_BUILD_SPEC.md` — authoritative for **what gets built first**
- `DATA_AI_ACADEMY_PORTAL_BLUEPRINT.md` — authoritative for **vision and architecture direction**
- `DATA_AI_ACADEMY_PORTAL_MOCKUP_SPECIFICATION.md` — authoritative for **design language and information architecture**

Governance comes from `CLAUDE.md` and `AI_DEVELOPMENT_GUARDRAILS.md`. Where this folder and any of the above conflict, **the above wins and this folder is wrong**.
