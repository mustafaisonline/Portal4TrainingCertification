# Agents and skills catalogue

> Version 1.0 · 2026-10-02 (CR-2026-10-02-2034). Agents live in `.claude/agents/`, skills in `.claude/skills/<name>/SKILL.md`. **Agents are few and role-based; skills are the unit that scales** (expect hundreds over time). Do we need `.md` files for them? Yes — Claude Code reads agents and skills only as `.md` files, so these are the real definitions, not extra documentation. Add a row here whenever one is created.

## Agents (categories by filename prefix)

| Category | Agent | Role |
|---|---|---|
| Advisory | `advisor` | What to do next (best practice + framework order, mapped to our agents/skills); names missing agents/skills and advises the human to create them; keeps `capability-gaps.md` |
| Team lead | `buddy` (= `tl`) | The only agent the founder talks to; guided / autonomous modes; delegates to all others. Default session agent (`.claude/settings.json`) |
| Business requirements | `br-analyst` | Vision and BRD |
| Business requirements | `br-impact-analyst` | Whole-workspace impact analysis, recorded in the CR spec |
| Business requirements | `br-planner` | Milestones, WBS, CRs, CR specs |
| Execution | `exec-wireframer` | Wireframe build, test, sign-off gate |
| Execution | `exec-developer` | Implements one CR against its spec |
| Testing | `test-verifier` | Runs typecheck, vitest, e2e; reports honestly |
| Testing | `governance-reviewer` | Reviews a diff against the rules and decision records |
| Deployment | `deploy-engineer` | Governed deploy pipeline, rollback, verification |
| Metadata | `meta-steward` | Business / technical / operational metadata files |
| Prompt engineering | `pe-selector` | Picks the cheapest accurate `pf-*` framework skill and rebuilds the prompt |

## Skills

| Area | Skill | Purpose |
|---|---|---|
| Session | `resume-work` | Orient: status, open CRs, deferred items |
| Advisory | `next-steps` · `capability-gap` | Ordered next steps with owners; roster coverage and the gap register |
| Business requirements | `vision-write` · `brd-write` · `dr-write` | Maintain `vision.md`, `brd.md`; write/update decision records (DR, ADR) |
| Planning | `milestones-update` · `wbs-update` | Maintain `milestones.md`, `wbs.md` |
| Impact analysis | `impact-analysis` · `impact-record` | Scan the workspace for every impacted element; record it in the CR spec |
| Change control | `new-cr` · `cr-spec` · `run-cr` | CR file → its spec → plan and execute all open CRs; CRs are split by model with the model at the end of the name (parallel/sequence; flags new-terminal/model) |
| Governance | `guardrails-check` · `techstack-check` · `schema-proposal` · `security-review` (built-in) | Check work against the guardrails and stack; draft the RED-gate case for a schema change; security review of pending changes |
| Wireframe | `wireframe-signoff` | Check/record the sign-off gate |
| Metadata | `metadata-capture` | One `.md` per table, view, script, policy, procedure |
| Prompt engineering | 30 `pf-*` skills (RTF, TAG, APE, BAB, PAR, RACE, CARE, RODES, ROSES, RASCEF, RISEN, CO-STAR, CRISPE, CLEAR, zero-shot, few-shot, chain-of-thought, self-consistency, tree-of-thoughts, ReAct, least-to-most, step-back, plan-and-solve, prompt-chaining, chain-of-verification, self-refine, meta-prompting, generated-knowledge, xml-structured, role-prompting) | One per framework; catalogue in [`prompt-frameworks.md`](prompt-frameworks.md) |
| Model choice | `model-recommend` | Cheapest sufficient Claude model per CR/task; same model → execute, else new terminal |
| Deployment | `deploy-audit` · `deploy-incremental` · `deploy-full` · `deploy-rollback` | The existing `deploy/` pipeline as skills |

## How agents reach skills
Every agent lists `Skill` in its `tools:` and preloads its core skills in `skills:` (Claude Code docs: a subagent can invoke project skills only through the Skill tool). Buddy, the main agent, is the only one that can ask the human.

## Adding more
New capability → a skill first (`skill-creator`); a new agent only for a genuinely new role or tool boundary. Record it above in the same change.
