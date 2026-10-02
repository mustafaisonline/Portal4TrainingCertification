---
name: pf-chain-of-thought
description: Prompt-engineering technique: Chain-of-Thought (Ask for step-by-step reasoning before the answer). Use to structure a prompt for arithmetic, logic, multi-step analysis, debugging.
---

# Chain-of-Thought

**Type:** technique · **Structure:** Ask for step-by-step reasoning before the answer

| Aspect | Note |
|---|---|
| Best for | arithmetic, logic, multi-step analysis, debugging |
| Token cost | medium-high (reasoning tokens) |
| Accuracy | raises accuracy on multi-step reasoning |
| Avoid when | simple lookups; models with built-in extended thinking may not need it |

## How to apply
1. Take the raw request and fill each element of the structure above, one short line per element. Keep only what changes the answer; delete filler.
2. Put the parts in the stated order. For Claude, separate instructions from supplied data (files, logs, documents) with XML tags where the prompt is long.
3. State the exact output format and any hard limits (length, language, files that may be touched).
4. Return the rebuilt prompt plus one line: why this framework, expected token cost (medium-high (reasoning tokens)).

Never add facts, business rules or requirements the founder did not give; mark unknowns as `[ask founder]`. This is guidance from commonly published prompt-engineering practice; token-cost and accuracy notes are rules of thumb, not measurements. Selection across frameworks is done by the `pe-selector` agent using `framework/prompt-frameworks.md`.
