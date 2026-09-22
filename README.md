# Data & AI Academy — Training & Certification Portal

Production application for an expert-led training and certification organisation: programmes and scheduled offerings, Stripe registration, participant accounts and profiles, learner Reviews, Certificates of Completion with public verification and yearly renewal, and administrator operations. Next.js 16 · React 19 · Prisma 7 · PostgreSQL 16 · Better Auth · Stripe.

**Returning to the project? Start with [`docs/execution/PROJECT_STATUS.md`](docs/execution/PROJECT_STATUS.md)** — what is built, what is waiting on the founder, how to run and test, how to resume.

| Need | Go to |
|---|---|
| Operating rules for every session | [`CLAUDE.md`](CLAUDE.md) · [`AI_DEVELOPMENT_GUARDRAILS.md`](AI_DEVELOPMENT_GUARDRAILS.md) |
| Product requirements | `DR-02_EXPERT_LED_DELIVERY_MODEL.md` (outranks the specs) · `DATA_AI_ACADEMY_MVP_BUILD_SPEC.md` · `..._PORTAL_BLUEPRINT.md` · `..._MOCKUP_SPECIFICATION.md` |
| Architecture decisions | [`docs/architecture/`](docs/architecture/README.md) |
| Milestone plans and completion reports | [`docs/execution/`](docs/execution/README.md) |
| Deploying, backing up, monitoring | [`docs/operations/`](docs/operations/README.md) |
| The reviewed wireframe (reference only, never imported) | `project-artifacts/mockup/` |

## Quick start (macOS)
```bash
export PATH="/opt/homebrew/opt/node@24/bin:$PATH"
cp .env.example .env.local        # then fill the values; two local PostgreSQL databases: p4tc_dev and p4tc_test
npm install
npm run db:migrate && npm run db:seed
npm run dev                        # http://localhost:3100
```
Tests: `npx vitest run` · `npm run test:e2e`. Full details and the current status in [`PROJECT_STATUS.md`](docs/execution/PROJECT_STATUS.md).
