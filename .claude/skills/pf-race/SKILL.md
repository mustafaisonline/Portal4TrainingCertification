---
name: pf-race
description: Prompt-engineering acronym: RACE (Role · Action · Context · Expectation). Use to structure a prompt for a task that needs a persona plus background and a stated outcome.
---

# RACE

**Type:** acronym · **Structure:** Role · Action · Context · Expectation

| Aspect | Note |
|---|---|
| Best for | a task that needs a persona plus background and a stated outcome |
| Token cost | medium |
| Accuracy | good balance of brevity and context |
| Avoid when | trivial one-liners (overkill) |

## How to apply
1. Take the raw request and fill each element of the structure above, one short line per element. Keep only what changes the answer; delete filler.
2. Put the parts in the stated order. For Claude, separate instructions from supplied data (files, logs, documents) with XML tags where the prompt is long.
3. State the exact output format and any hard limits (length, language, files that may be touched).
4. Return the rebuilt prompt plus one line: why this framework, expected token cost (medium).

Never add facts, business rules or requirements the founder did not give; mark unknowns as `[ask founder]`. This is guidance from commonly published prompt-engineering practice; token-cost and accuracy notes are rules of thumb, not measurements. Selection across frameworks is done by the `pe-selector` agent using `framework/prompt-frameworks.md`.
