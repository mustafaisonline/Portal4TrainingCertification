---
name: pf-care
description: Prompt-engineering acronym: CARE (Context · Action · Result · Example). Use to structure a prompt for tasks where an example of the desired output pins the style.
---

# CARE

**Type:** acronym · **Structure:** Context · Action · Result · Example

| Aspect | Note |
|---|---|
| Best for | tasks where an example of the desired output pins the style |
| Token cost | medium |
| Accuracy | example raises format accuracy |
| Avoid when | when no good example exists |

## How to apply
1. Take the raw request and fill each element of the structure above, one short line per element. Keep only what changes the answer; delete filler.
2. Put the parts in the stated order. For Claude, separate instructions from supplied data (files, logs, documents) with XML tags where the prompt is long.
3. State the exact output format and any hard limits (length, language, files that may be touched).
4. Return the rebuilt prompt plus one line: why this framework, expected token cost (medium).

Never add facts, business rules or requirements the founder did not give; mark unknowns as `[ask founder]`. This is guidance from commonly published prompt-engineering practice; token-cost and accuracy notes are rules of thumb, not measurements. Selection across frameworks is done by the `pe-selector` agent using `framework/prompt-frameworks.md`.
