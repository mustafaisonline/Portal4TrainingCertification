---
name: pf-rodes
description: Prompt-engineering acronym: RODES (Role · Objective · Details · Examples · Sense check). Use to structure a prompt for tasks that benefit from a final self-check of the answer.
---

# RODES

**Type:** acronym · **Structure:** Role · Objective · Details · Examples · Sense check

| Aspect | Note |
|---|---|
| Best for | tasks that benefit from a final self-check of the answer |
| Token cost | medium |
| Accuracy | sense-check step catches errors |
| Avoid when | very small tasks |

## How to apply
1. Take the raw request and fill each element of the structure above, one short line per element. Keep only what changes the answer; delete filler.
2. Put the parts in the stated order. For Claude, separate instructions from supplied data (files, logs, documents) with XML tags where the prompt is long.
3. State the exact output format and any hard limits (length, language, files that may be touched).
4. Return the rebuilt prompt plus one line: why this framework, expected token cost (medium).

Never add facts, business rules or requirements the founder did not give; mark unknowns as `[ask founder]`. This is guidance from commonly published prompt-engineering practice; token-cost and accuracy notes are rules of thumb, not measurements. Selection across frameworks is done by the `pe-selector` agent using `framework/prompt-frameworks.md`.
