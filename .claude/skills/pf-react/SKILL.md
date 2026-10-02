---
name: pf-react
description: Prompt-engineering technique: ReAct (Interleave Reasoning and Acting (tool calls) in a Thought → Action → Observation loop). Use to structure a prompt for tasks needing tools, files or lookups to ground answers.
---

# ReAct

**Type:** technique · **Structure:** Interleave Reasoning and Acting (tool calls) in a Thought → Action → Observation loop

| Aspect | Note |
|---|---|
| Best for | tasks needing tools, files or lookups to ground answers |
| Token cost | medium-high |
| Accuracy | grounding reduces hallucination |
| Avoid when | pure reasoning with no tools |

## How to apply
1. Take the raw request and fill each element of the structure above, one short line per element. Keep only what changes the answer; delete filler.
2. Put the parts in the stated order. For Claude, separate instructions from supplied data (files, logs, documents) with XML tags where the prompt is long.
3. State the exact output format and any hard limits (length, language, files that may be touched).
4. Return the rebuilt prompt plus one line: why this framework, expected token cost (medium-high).

Never add facts, business rules or requirements the founder did not give; mark unknowns as `[ask founder]`. This is guidance from commonly published prompt-engineering practice; token-cost and accuracy notes are rules of thumb, not measurements. Selection across frameworks is done by the `pe-selector` agent using `framework/prompt-frameworks.md`.
