# Mockup / Wireframe — Data & AI Academy Portal

**This is a disposable, isolated artifact. It is not the production application.**

It exists to validate product structure, user journeys, navigation, information
hierarchy, and visual direction against
[`DATA_AI_ACADEMY_PORTAL_MOCKUP_SPECIFICATION.md`](../../DATA_AI_ACADEMY_PORTAL_MOCKUP_SPECIFICATION.md)
before any of it is treated as a production decision. Nothing in this folder —
code, structure, or dependency choices — carries forward automatically. See
the root [`CLAUDE.md`](../../CLAUDE.md) for the governance this artifact
operates under, and `docs/execution/` at the repository root for the
*separate, unrelated* production "Walking Skeleton" Milestone 1 — the two
are not connected.

## What this is not

- Not the production Next.js application (there isn't one yet).
- No database, no authentication, no server actions, no API routes.
- No real business logic: no adaptive diagnostic scoring, no skill-graph
  computation, no credential rules. See [`docs/MOCK_DATA_REGISTER.md`](docs/MOCK_DATA_REGISTER.md)
  for exactly what is simulated and how.

## Status: Mockup Milestone 1

Scope: `P01` Homepage → `P05` Diagnostic → `P06` Diagnostic Result → a
labelled next-stage placeholder. See [`docs/DESIGN_FOUNDATION.md`](docs/DESIGN_FOUNDATION.md)
for the token/component contract these screens are built on.

## Running it locally

```bash
cd project-artifacts/mockup
npm install
npm run dev
```

Then open `http://localhost:3000`. From the repository root, this is also
registered as the `mockup` configuration in `.claude/launch.json`.

## Structure

```
app/                      Next.js App Router pages (P01, P05, P06, placeholder)
components/ui/            Button, Chip, Card (the three card types)
components/signature/     DiagnosticQuestionCanvas, SkillMeter (scoped to this milestone)
components/PublicShell.tsx  Global public header/footer (§4)
data/                     Mock fixtures — domains, diagnostic questions, result fixtures, role targets
docs/                     DESIGN_FOUNDATION.md, MOCK_DATA_REGISTER.md, FINDINGS.md
```

## Continuing this work in a new session

Read, in order: this file → `docs/DESIGN_FOUNDATION.md` →
`docs/MOCK_DATA_REGISTER.md` → `docs/FINDINGS.md`. Together they explain what
exists, what every token and component means, what is simulated, and what
was discovered and decided along the way — without needing this
conversation's history.
