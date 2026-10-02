---
name: techstack-check
description: Check a change against framework/techstack.md and the approved stack. Use before adding any library, service or tool.
---

Read `framework/techstack.md` and `package.json`. Does the existing stack already solve it? If a new dependency, service, framework or tool is implied it is a RED gate: stop and prepare the written case (problem, why existing tech is insufficient, risks, cost, licence, alternatives). If the change adds something approved, update `framework/techstack.md` in the same change.
