---
name: pf-tag
description: Prompt-engineering acronym: TAG (Task · Action · Goal). Use to structure a prompt for small improvement or action requests with a clear target.
---

# TAG

**Type:** acronym · **Structure:** Task · Action · Goal

| Aspect | Note |
|---|---|
| Best for | small improvement or action requests with a clear target |
| Token cost | low |
| Accuracy | good for narrow tasks |
| Avoid when | open-ended or analytical work |

## How to apply
1. Take the raw request and fill each element of the structure above, one short line per element. Keep only what changes the answer; delete filler.
2. Put the parts in the stated order. For Claude, separate instructions from supplied data (files, logs, documents) with XML tags where the prompt is long.
3. State the exact output format and any hard limits (length, language, files that may be touched).
4. Return the rebuilt prompt plus one line: why this framework, expected token cost (low).

Never add facts, business rules or requirements the founder did not give; mark unknowns as `[ask founder]`. This is guidance from commonly published prompt-engineering practice; token-cost and accuracy notes are rules of thumb, not measurements. Selection across frameworks is done by the `pe-selector` agent using `framework/prompt-frameworks.md`.
