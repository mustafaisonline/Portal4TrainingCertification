---
name: pf-clear
description: Prompt-engineering acronym: CLEAR (Concise · Logical · Explicit · Adaptive · Reflective). Use to structure a prompt for a checklist for polishing any prompt before sending it.
---

# CLEAR

**Type:** acronym · **Structure:** Concise · Logical · Explicit · Adaptive · Reflective

| Aspect | Note |
|---|---|
| Best for | a checklist for polishing any prompt before sending it |
| Token cost | low |
| Accuracy | improves clarity of any prompt; not a template |
| Avoid when | n/a — use as a final pass |

## How to apply
1. Take the raw request and fill each element of the structure above, one short line per element. Keep only what changes the answer; delete filler.
2. Put the parts in the stated order. For Claude, separate instructions from supplied data (files, logs, documents) with XML tags where the prompt is long.
3. State the exact output format and any hard limits (length, language, files that may be touched).
4. Return the rebuilt prompt plus one line: why this framework, expected token cost (low).

Never add facts, business rules or requirements the founder did not give; mark unknowns as `[ask founder]`. This is guidance from commonly published prompt-engineering practice; token-cost and accuracy notes are rules of thumb, not measurements. Selection across frameworks is done by the `pe-selector` agent using `framework/prompt-frameworks.md`.
