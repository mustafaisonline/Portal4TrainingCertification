# Metadata

Every contract, definition, table, view, policy, standard, procedure and script gets **one `.md` file** here, in one of three categories. Skill: `metadata-capture`. Agent: `meta-steward`. Each file starts from the template in `_TEMPLATE.md`.

| Category | Holds | Folder |
|---|---|---|
| **Business** | business definitions and glossary, contracts and agreements, policies (privacy, terms, refund), certification and credential rules, standards | [`business/`](business/README.md) |
| **Technical** | each table and view (source of truth: `prisma/schema.prisma`), APIs, integrations, each script's documentation, architecture standards | [`technical/`](technical/README.md) |
| **Operational** | procedures and runbooks, deployment and rollback, backup and restore, monitoring, incident handling, data-load jobs | [`operational/`](operational/README.md) |

Rules: one item per file, named `<kind>-<name>.md`; metadata **describes, never replaces** its source — the schema, the script, the signed policy stay authoritative; every file names its source and owner; a change to a source updates its metadata file in the same change. Documenting a table or script changes no code and no data model.
