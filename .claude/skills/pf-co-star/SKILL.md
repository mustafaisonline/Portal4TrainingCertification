---
name: pf-co-star
description: Prompt-engineering acronym: CO-STAR (Context · Objective · Style · Tone · Audience · Response). Use to structure a prompt for writing and communication where style, tone and audience drive quality.
---

# CO-STAR

**Type:** acronym · **Structure:** Context · Objective · Style · Tone · Audience · Response

| Aspect | Note |
|---|---|
| Best for | writing and communication where style, tone and audience drive quality |
| Token cost | medium-high |
| Accuracy | high for content quality and tone fit |
| Avoid when | code or data tasks where style is irrelevant |

## How to apply
1. Take the raw request and fill each element of the structure above, one short line per element. Keep only what changes the answer; delete filler.
2. Put the parts in the stated order. For Claude, separate instructions from supplied data (files, logs, documents) with XML tags where the prompt is long.
3. State the exact output format and any hard limits (length, language, files that may be touched).
4. Return the rebuilt prompt plus one line: why this framework, expected token cost (medium-high).

Never add facts, business rules or requirements the founder did not give; mark unknowns as `[ask founder]`. This is guidance from commonly published prompt-engineering practice; token-cost and accuracy notes are rules of thumb, not measurements. Selection across frameworks is done by the `pe-selector` agent using `framework/prompt-frameworks.md`.
