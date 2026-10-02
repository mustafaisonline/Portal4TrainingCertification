---
name: guardrails-check
description: Check a planned or finished change against framework/guardrails.md. Use before starting significant work and before declaring it done.
---

Read `framework/guardrails.md` (top quick-reference, then the relevant sections). Check: persistence (nothing critical only in cache/memory), data-model changes, new technology/dependencies, fixing by root cause inside the stack, testing, destructive actions, git hygiene. Report PASS or the specific gate that applies. For a full diff review use the `governance-reviewer` agent.
