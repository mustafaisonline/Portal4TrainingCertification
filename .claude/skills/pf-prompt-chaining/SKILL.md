---
name: pf-prompt-chaining
description: Prompt-engineering technique: Prompt chaining (Split a job into a sequence of smaller prompts, each using the previous output). Use to structure a prompt for large jobs (research → outline → draft → review); each step easier to check.
---

# Prompt chaining

**Type:** technique · **Structure:** Split a job into a sequence of smaller prompts, each using the previous output

| Aspect | Note |
|---|---|
| Best for | large jobs (research → outline → draft → review); each step easier to check |
| Token cost | medium overall, low per step |
| Accuracy | high: each stage is verifiable |
| Avoid when | tiny tasks; when context is better kept in one pass |

## How to apply
1. Take the raw request and fill each element of the structure above, one short line per element. Keep only what changes the answer; delete filler.
2. Put the parts in the stated order. For Claude, separate instructions from supplied data (files, logs, documents) with XML tags where the prompt is long.
3. State the exact output format and any hard limits (length, language, files that may be touched).
4. Return the rebuilt prompt plus one line: why this framework, expected token cost (medium overall, low per step).

Never add facts, business rules or requirements the founder did not give; mark unknowns as `[ask founder]`. This is guidance from commonly published prompt-engineering practice; token-cost and accuracy notes are rules of thumb, not measurements. Selection across frameworks is done by the `pe-selector` agent using `framework/prompt-frameworks.md`.
