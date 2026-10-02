---
name: pf-xml-structured
description: Prompt-engineering technique: XML-structured prompting (Anthropic style) (Wrap instructions, context, documents, examples and output format in distinct XML tags). Use to structure a prompt for long or document-heavy prompts for Claude; separating data from instructions.
---

# XML-structured prompting (Anthropic style)

**Type:** technique · **Structure:** Wrap instructions, context, documents, examples and output format in distinct XML tags

| Aspect | Note |
|---|---|
| Best for | long or document-heavy prompts for Claude; separating data from instructions |
| Token cost | low-medium |
| Accuracy | high for Claude: reduces mixing of instruction and data |
| Avoid when | very short prompts |

## How to apply
1. Take the raw request and fill each element of the structure above, one short line per element. Keep only what changes the answer; delete filler.
2. Put the parts in the stated order. For Claude, separate instructions from supplied data (files, logs, documents) with XML tags where the prompt is long.
3. State the exact output format and any hard limits (length, language, files that may be touched).
4. Return the rebuilt prompt plus one line: why this framework, expected token cost (low-medium).

Never add facts, business rules or requirements the founder did not give; mark unknowns as `[ask founder]`. This is guidance from commonly published prompt-engineering practice; token-cost and accuracy notes are rules of thumb, not measurements. Selection across frameworks is done by the `pe-selector` agent using `framework/prompt-frameworks.md`.
