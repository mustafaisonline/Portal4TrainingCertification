---
name: impact-record
description: Record an impact-analysis result in the CR spec — the "Impacted elements" inventory and the per-task rows with status — and keep it current as work proceeds. Use right after impact-analysis and whenever scope changes.
---

# Record impact in the CR spec

1. Open the CR's spec in `CR/specs/` (create it with `cr-spec` if missing; names are 1:1 with the CR).
2. Write the analysis into **Impacted elements (inventory)**: one row per element — kind, `path:line` or `path (new)`, change, task number, risk/RED flag. Include tests, copy, docs and metadata files, not only code.
3. Make sure every task row in **Tasks** lists the elements it touches and has a status (OPEN to start).
4. Add RED-gate items (schema change, new dependency, auth/payment, destructive) as their own tasks with BLOCKED status until the founder approves; propose them to Buddy with a recommendation.
5. Update **Resume here**. As work proceeds, update element and task status here and in the CR tracker in the same change; if scope grows, add the new elements before changing them.
