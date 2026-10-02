---
name: pf-chain-of-verification
description: Prompt-engineering technique: Chain-of-Verification (Draft an answer, generate verification questions, answer them independently, revise). Use to structure a prompt for fact-heavy outputs where hallucination is the risk.
---

# Chain-of-Verification

**Type:** technique · **Structure:** Draft an answer, generate verification questions, answer them independently, revise

| Aspect | Note |
|---|---|
| Best for | fact-heavy outputs where hallucination is the risk |
| Token cost | high |
| Accuracy | reduces unsupported claims |
| Avoid when | creative work |

## How to apply
1. Take the raw request and fill each element of the structure above, one short line per element. Keep only what changes the answer; delete filler.
2. Put the parts in the stated order. For Claude, separate instructions from supplied data (files, logs, documents) with XML tags where the prompt is long.
3. State the exact output format and any hard limits (length, language, files that may be touched).
4. Return the rebuilt prompt plus one line: why this framework, expected token cost (high).

Never add facts, business rules or requirements the founder did not give; mark unknowns as `[ask founder]`. This is guidance from commonly published prompt-engineering practice; token-cost and accuracy notes are rules of thumb, not measurements. Selection across frameworks is done by the `pe-selector` agent using `framework/prompt-frameworks.md`.
