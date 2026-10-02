---
name: pf-least-to-most
description: Prompt-engineering technique: Least-to-most (Decompose into easier sub-problems, solve in order, feed answers forward). Use to structure a prompt for problems harder than the examples shown; compositional tasks.
---

# Least-to-most

**Type:** technique · **Structure:** Decompose into easier sub-problems, solve in order, feed answers forward

| Aspect | Note |
|---|---|
| Best for | problems harder than the examples shown; compositional tasks |
| Token cost | medium-high |
| Accuracy | good on compositional generalisation |
| Avoid when | simple one-step tasks |

## How to apply
1. Take the raw request and fill each element of the structure above, one short line per element. Keep only what changes the answer; delete filler.
2. Put the parts in the stated order. For Claude, separate instructions from supplied data (files, logs, documents) with XML tags where the prompt is long.
3. State the exact output format and any hard limits (length, language, files that may be touched).
4. Return the rebuilt prompt plus one line: why this framework, expected token cost (medium-high).

Never add facts, business rules or requirements the founder did not give; mark unknowns as `[ask founder]`. This is guidance from commonly published prompt-engineering practice; token-cost and accuracy notes are rules of thumb, not measurements. Selection across frameworks is done by the `pe-selector` agent using `framework/prompt-frameworks.md`.
