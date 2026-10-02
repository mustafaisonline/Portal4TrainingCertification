# CR-2026-10-02-2054 — Business and operational metadata; prompt-engineering skills and agent; per-chat and per-task rules

**Received:** 2026-10-02 20:54 MYT · **Status:** BUILT — awaiting push · **Requested by:** founder

**Recommended model:** Sonnet 5.5 — documentation and skill authoring from existing sources, no code or RED-gate analysis (this session is Sonnet 5.5, so executed here).

Groups four related tasks (multi-task CR, per the founder's rule).

## 1. Request (verbatim)

> yes, write the business and operational metadata next aloing woith below requirements
>
> Pelase create skill for all the prompt engineering frameworks and One agent which will fine the appropriate prompt engineering frameworks skill
>
> Few more important rules, these rules need to part of every chat.
>
> * Whenever i share a chat, prompt engieering agent must read the text, evaluate and see which prompt engineering frameworks skill is suitable and which one will geerate lowed token consider highest level of accurcy
> * Whenever we execute a CR or task, it shoudl tell us which claude (as we are using claude) model is good enough task. if current terminal is using same reuired moel then execute else tell buddy to ask me to open new terminal , select right proposed model and execure there.

## 2. Facts gathered

- Business sources: `DR-02`…`DR-08` (root), `DR-01` inside `DATA_AI_ACADEMY_MVP_BUILD_SPEC.md`, the three specifications, legal texts in `src/content/legal/`, CRs 0610 / 0628 / 0627.
- Operational sources: `docs/operations/` (BACKUP_AND_RESTORE, DEPLOYMENT_RUNBOOK, DOMAIN_SETUP, MONITORING_AND_INCIDENTS, RELEASE_GATE, SECURITY_CHECKLIST, STRIPE_GO_LIVE_CHECKLIST), the reminders job. The governed deploy procedure file already exists.
- Models named in this environment: Fable 5.1, Opus 5.5, Sonnet 5.5, Haiku 4.5. This session runs Sonnet 5.5.

## 3. Decisions & assumptions (awaiting founder confirmation)

- **T1/T2** Metadata files describe, never replace, their sources; one file per item.
- **T3** One skill per prompt-engineering framework or technique (`pf-<name>`), one selector agent `pe-selector`, a catalogue `framework/prompt-frameworks.md`. Framework definitions are the commonly published ones; the token-cost and accuracy notes are guidance, not measurements.
- **T4a** "Every chat" rule: Buddy runs `pe-selector` on each **substantive** new request (a goal, requirement, CR or task), not on short replies like "yes" or "push it" — running it on every message would spend more tokens than it saves. **Assumption.**
- **T4b** Model rule: before executing a CR or task Buddy runs the `model-recommend` skill, states the cheapest model that is sufficient, and compares with the session's current model. Same (or a higher-capability) model → execute. Different → Buddy stops and asks the founder to open a new terminal on the proposed model (`claude --model <id>`); no switching without the founder. Recommended model is recorded in the CR. **Assumption:** "higher-capability current model" counts as good enough but Buddy still mentions the cost.
- Rules go in `framework/initiate.md` (loaded every session) and `buddy.md`.

## 4. Plan

Business metadata (agent-assisted, from sources); operational metadata (same); `framework/prompt-frameworks.md` + `pf-*` skills + `model-recommend` skill + `pe-selector` agent; rules in `initiate.md`, `buddy.md`, `new-cr`/`run-cr` skills, catalogue; indexes; link check; commit and push on the founder's word (previous push authorization covered the earlier batch only). No app code, data model, dependency or deployment change.

## 5. Tracker

| # | Step | Status | Updated |
|---|---|---|---|
| T1 | Business metadata (15 files) | **BUILT** | 2026-10-02 |
| T2 | Operational metadata (10 files + existing deploy procedure) | **BUILT** | 2026-10-02 |
| T3 | Prompt-engineering skills (30 `pf-*`), `pe-selector`, `model-recommend`, catalogue | **BUILT** | 2026-10-02 |
| T4 | Per-chat and per-task rules in initiate.md, buddy, new-cr, run-cr | **BUILT** | 2026-10-02 |
| T5 | Index, link check (0 broken), commit | **BUILT** | 2026-10-02 |

## 6. Progress log

| Date (MYT) | Entry |
|---|---|
| 2026-10-02 20:54 | CR created. |
| 2026-10-02 | All tasks built. Business: 15 files (8 DR records, 4 legal, credential definition, glossary, authority hierarchy). Operational: 10 files. 30 `pf-*` skills, `pe-selector`, `model-recommend`; rules added to `initiate.md`, `buddy`, `new-cr`, `run-cr`. Secret scan clean; link check clean. Gaps flagged in files: DR-07 deploy state, counsel review of legal text, intermediate legal versions, glossary gaps, credential-integrity policy unpublished. Push awaits the founder's word. |
