---
name: impact-analysis
description: Thorough impact analysis of a new requirement across the whole workspace — find every route, component, module, table, test, copy, doc, metadata file and deploy item that must change. Use for every new requirement, before the CR spec is written.
---

# Impact analysis

Read-only. Input: the requirement (verbatim) and the open CRs. Work through every layer; search, do not assume.

1. **Terms.** List the words a person would use for the feature (UI labels, route names, table names, old names). Search for each in `app/`, `src/`, `prisma/`, `tests/`, `docs/`, `framework/`, `CR/`, `deploy/`, `public/`.
2. **Layers to check, each with a finding or "none found":**
   - routes and pages (`app/`), layouts and navigation (`src/shared/chrome/`, `site-nav.ts`)
   - components and shared UI (`src/shared/`, `src/modules/*/components`)
   - modules: services, repositories, server actions, route handlers (`src/modules/`, `app/api/`)
   - database: tables and columns read or written (`prisma/schema.prisma`) — flag a needed change as a RED gate; migrations; seed data
   - configuration and env (`src/config/`, `deploy/config.env` names only)
   - copy and legal text: pages, FAQ, Terms/Privacy/Refund (`src/content/`), emails, SEO/sitemap/search
   - roles, permissions, audit logging
   - background jobs, emails, Stripe
   - tests: unit, integration, e2e and accessibility specs that assert the current behaviour (they will need updating)
   - documentation: decision records, BRD, milestones, WBS, PROJECT_STATUS, metadata files (business/technical/operational)
   - deploy and operations: scripts, runbooks, release gate
3. **Cross-checks:** conflicts with decision records `DR-01…DR-08` and `CLAUDE.md` rules; overlap with open CRs (same files); dependencies between tasks.
4. **Output:** a structured list per layer — element (`path:line`), why it is impacted, change type (edit/new/remove/test/doc), risk, RED-gate flag — plus open questions with your recommendation. Hand it to `impact-record`. Never change files yourself.
