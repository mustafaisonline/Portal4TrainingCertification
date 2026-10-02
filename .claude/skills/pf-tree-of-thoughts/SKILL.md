---
name: pf-tree-of-thoughts
description: Prompt-engineering technique: Tree-of-Thoughts (Explore and evaluate several branches of reasoning, backtrack). Use to structure a prompt for hard planning or search problems with several candidate approaches.
---

# Tree-of-Thoughts

**Type:** technique · **Structure:** Explore and evaluate several branches of reasoning, backtrack

| Aspect | Note |
|---|---|
| Best for | hard planning or search problems with several candidate approaches |
| Token cost | highest |
| Accuracy | strong on hard problems, expensive |
| Avoid when | anything a single chain can solve |

## How to apply
1. Take the raw request and fill each element of the structure above, one short line per element. Keep only what changes the answer; delete filler.
2. Put the parts in the stated order. For Claude, separate instructions from supplied data (files, logs, documents) with XML tags where the prompt is long.
3. State the exact output format and any hard limits (length, language, files that may be touched).
4. Return the rebuilt prompt plus one line: why this framework, expected token cost (highest).

Never add facts, business rules or requirements the founder did not give; mark unknowns as `[ask founder]`. This is guidance from commonly published prompt-engineering practice; token-cost and accuracy notes are rules of thumb, not measurements. Selection across frameworks is done by the `pe-selector` agent using `framework/prompt-frameworks.md`.
