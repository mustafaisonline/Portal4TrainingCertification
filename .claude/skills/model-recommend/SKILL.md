---
name: model-recommend
description: Recommend the cheapest Claude model that is sufficient for a CR or task, compare it with the session's current model, and decide whether to execute here or ask the founder to open a new terminal. Use before executing any CR or task.
---

# Model recommendation

Rule of thumb (guidance, not a measured benchmark): **the cheapest model that is sufficient**.

| Model | ID | Use for |
|---|---|---|
| Haiku 4.5 | `claude-haiku-4-5-20251001` | Mechanical, well-specified work: link fixes, renames, status/doc updates, metadata from sources, formatting, simple lookups |
| Sonnet 5.5 | `claude-sonnet-5-5` | Typical feature and bug work in known code, single-module changes, tests, CR specs, reviews of small diffs |
| Opus 5.5 | `claude-opus-5-5` | Multi-module changes, architecture and data-model analysis, auth/payment/migration work, hard root-cause debugging, governance review of RED-gate items |
| Fable 5.1 | `claude-fable-5-1` | The hardest cross-cutting redesigns and ambiguity-heavy research where lower tiers fall short |

## Steps
1. Read the CR (and spec). Judge: files and modules touched, ambiguity, reasoning depth, risk (RED gates, money, auth, data), reversibility.
2. Name the recommended model and give a one-line reason. Write it into the CR (`**Recommended model:** <name> — <reason>`) and each spec task if it differs.
3. Compare with the session's current model (stated in the session context; if unknown, ask).
4. **Same model → execute.** **Different → do not execute.** Report to Buddy: "recommended X, this session is Y". Buddy then asks the founder to open a new terminal on the recommended model and run the CR there:
```bash
claude --model <id>
```
The founder may say "continue here"; only then execute on the current model and note it in the CR log. Never switch models yourself.
5. Mixed CRs: recommend per task; propose running each task on its own model only when the saving is clear, otherwise use the highest tier any task needs.
