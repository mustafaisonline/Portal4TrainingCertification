# CR-2026-10-03-1105 — Agent network fixes: Skill tool on every agent, consistency, DR/security/schema skills

**Received:** 2026-10-03 11:05 MYT · **Status:** BUILT — pending founder's new-tab test · **Requested by:** founder
**Recommended model:** Sonnet 5.5 — frontmatter and skill-text edits. Executed on **Fable 5.1** (this session; higher tier counts as sufficient — the founder switched models for the next task).

Spec: [`CR-SPEC-2026-10-03-1105-agent-network-fixes-sonnet.md`](specs/CR-SPEC-2026-10-03-1105-agent-network-fixes-sonnet.md)

## 1. Request (verbatim)

> Go ahead and fix all abvoe concerns as per the best practices. End of the day, I need an agentic AI solution whichshould implement my changes on its own but keep me in loop and asking wherever required.

(The "concerns" are the analysis I gave just before: (1) no specialist agent lists `Skill` in `tools:` so none can invoke a skill; (2) `"agent": "buddy"` unproven in the desktop app; the CR-2027 note "subagents cannot spawn subagents" is wrong; `initiate.md` §2.3 and Buddy's "Taking a goal" omit the impact analysis; roster gaps: decision-record author, security review, schema-change proposal.)

## 2. Facts gathered (official Claude Code docs, via the claude-code-guide agent)

- A subagent can invoke project skills only through the Skill tool, and only when `Skill` is in its `tools:` list; skills named in a `skills:` frontmatter field are preloaded into its context at start.
- Subagents may spawn subagents up to three levels deep. Only the main agent can ask the human (AskUserQuestion).
- `"agent": "<name>"` in settings.json starts every session as that agent; desktop-app (Code tab) support is not stated in the docs.
- `@path` imports in CLAUDE.md are valid, resolved relative to CLAUDE.md.

## 3. Decisions & assumptions

- Add `Skill` to every agent's `tools:`; preload each agent's core skills with `skills:` (not pe-selector's 30 — it reads the catalogue).
- New skills: `dr-write` (decision records / ADR entries, under `br-analyst`), `schema-proposal` (the written RED-gate case for a data-model change, under `exec-developer`); map the built-in `security-review` to `governance-reviewer`.
- Fix the ordering text in `initiate.md` §2.3 and Buddy's "Taking a goal"; correct the CR-2027 fact.
- Model rule with a higher-tier session: execute here and state the cheaper option (unchanged assumption; the founder did not object).
- Desktop-app default agent: cannot be verified from inside this session; the founder's new tab is the test, with a fallback written into `initiate.md`.

## 4. Plan

See the spec. No application code, data model or dependency.

## 5. Tracker

| # | Task | Status | Updated |
|---|---|---|---|
| T1 | `Skill` tool + `skills:` preload on all nine specialist agents | BUILT | 2026-10-03 |
| T2 | `initiate.md` §2.3 and Buddy "Taking a goal" include impact analysis; new-tab test and fallback written down | BUILT | 2026-10-03 |
| T3 | Correct CR-2027 fact (subagents can spawn subagents) | BUILT | 2026-10-03 |
| T4 | `dr-write` skill (+ `br-analyst`) | BUILT | 2026-10-03 |
| T5 | `security-review` mapped to `governance-reviewer` | BUILT | 2026-10-03 |
| T6 | `schema-proposal` skill (+ `exec-developer`) | BUILT | 2026-10-03 |
| T7 | Catalogue, Buddy roster, link/frontmatter checks | BUILT | 2026-10-03 |
| T8 | Founder's new-tab test: first reply runs `resume-work` as Buddy | OPEN | — |

## 6. Progress log

| Date (MYT) | Entry |
|---|---|
| 2026-10-03 11:05 | CR created from the analysis; all tasks except the live test built. |
