# Prompt-engineering frameworks — catalogue and selection guide

> Version 1.0 · 2026-10-02 (CR-2026-10-02-2054). One skill per framework (`.claude/skills/pf-<name>/SKILL.md`); one selector agent, `pe-selector`. Definitions are the commonly published ones; token-cost and accuracy columns are rules of thumb, not measurements.

## The per-chat rule
When the founder shares a substantive request (a goal, requirement, CR or task — not a short reply such as "yes" or "push it"), Buddy runs `pe-selector` first. It reads the text, picks the framework that gives the **lowest token cost at the highest accuracy for that task**, rebuilds the prompt, and Buddy continues from the rebuilt prompt. Short or already-clear requests get **zero-shot** (cheapest) with no rewrite.

## Selection rules (cheapest sufficient first)
1. Clear, common task → `pf-zero-shot` (lowest cost). Add `pf-role-prompting` only if tone/depth matters.
2. Strict output format or house style → `pf-few-shot` (2–3 examples, not more).
3. Multi-step reasoning, debugging, analysis → `pf-chain-of-thought` or `pf-plan-and-solve`.
4. Constrained multi-step job → `pf-risen` or `pf-rascef`; communication/content → `pf-co-star`.
5. Current state → desired state → `pf-bab`; bug/incident → `pf-par`; small action → `pf-tag`/`pf-rtf`/`pf-ape`.
6. Needs tools, files or lookups → `pf-react`. Fact-critical output → `pf-chain-of-verification`.
7. Big job → `pf-prompt-chaining` (each step small and checkable). Long documents + instructions → `pf-xml-structured` (combine with any of the above).
8. Reusable prompt/skill/agent → `pf-meta-prompting`.
9. Highest-cost techniques (`pf-self-consistency`, `pf-tree-of-thoughts`) only for hard, high-stakes problems the cheaper ones cannot solve.

## Catalogue

| Skill | Framework | Type | Structure | Best for | Token cost |
|---|---|---|---|---|---|
| `pf-rtf` | RTF | acronym | Role · Task · Format | quick single-output requests where who/what/shape is enough | low |
| `pf-tag` | TAG | acronym | Task · Action · Goal | small improvement or action requests with a clear target | low |
| `pf-ape` | APE | acronym | Action · Purpose · Expectation | short instructions where the why and the expected result matter | low |
| `pf-bab` | BAB | acronym | Before · After · Bridge | change, migration or transformation requests (current state → desired state → how to get there) | low-medium |
| `pf-par` | PAR | acronym | Problem · Action · Result | bug reports, incident write-ups and fix requests | low-medium |
| `pf-race` | RACE | acronym | Role · Action · Context · Expectation | a task that needs a persona plus background and a stated outcome | medium |
| `pf-care` | CARE | acronym | Context · Action · Result · Example | tasks where an example of the desired output pins the style | medium |
| `pf-rodes` | RODES | acronym | Role · Objective · Details · Examples · Sense check | tasks that benefit from a final self-check of the answer | medium |
| `pf-roses` | ROSES | acronym | Role · Objective · Scenario · Solution · Steps | planning and decision tasks that end in an ordered action list | medium |
| `pf-rascef` | RASCEF | acronym | Role · Action · Steps · Context · Examples · Format | complex, repeatable tasks where steps and output format must be exact | medium-high |
| `pf-risen` | RISEN | acronym | Role · Instructions · Steps · End goal · Narrowing | multi-step tasks with explicit constraints (narrowing = limits and exclusions) | medium-high |
| `pf-co-star` | CO-STAR | acronym | Context · Objective · Style · Tone · Audience · Response | writing and communication where style, tone and audience drive quality | medium-high |
| `pf-crispe` | CRISPE | acronym | Capacity and Role · Insight · Statement · Personality · Experiment | creative or exploratory work where several variants are wanted | high |
| `pf-clear` | CLEAR | acronym | Concise · Logical · Explicit · Adaptive · Reflective | a checklist for polishing any prompt before sending it | low |
| `pf-zero-shot` | Zero-shot prompting | technique | Instruction only, no examples | common tasks the model already does well; cheapest option | lowest |
| `pf-few-shot` | Few-shot prompting | technique | Instruction plus 2–5 worked input/output examples | strict output formats, classification, house style | medium (examples cost tokens) |
| `pf-chain-of-thought` | Chain-of-Thought | technique | Ask for step-by-step reasoning before the answer | arithmetic, logic, multi-step analysis, debugging | medium-high (reasoning tokens) |
| `pf-self-consistency` | Self-consistency | technique | Sample several reasoning paths, take the majority answer | high-stakes answers with one checkable result | high (multiple runs) |
| `pf-tree-of-thoughts` | Tree-of-Thoughts | technique | Explore and evaluate several branches of reasoning, backtrack | hard planning or search problems with several candidate approaches | highest |
| `pf-react` | ReAct | technique | Interleave Reasoning and Acting (tool calls) in a Thought → Action → Observation loop | tasks needing tools, files or lookups to ground answers | medium-high |
| `pf-least-to-most` | Least-to-most | technique | Decompose into easier sub-problems, solve in order, feed answers forward | problems harder than the examples shown; compositional tasks | medium-high |
| `pf-step-back` | Step-back prompting | technique | First ask a more general question or principle, then answer the specific one | knowledge-heavy or principle-driven questions | medium |
| `pf-plan-and-solve` | Plan-and-Solve | technique | Ask the model to write a plan first, then execute it step by step | multi-step tasks where skipped steps are the risk | medium |
| `pf-prompt-chaining` | Prompt chaining | technique | Split a job into a sequence of smaller prompts, each using the previous output | large jobs (research → outline → draft → review); each step easier to check | medium overall, low per step |
| `pf-chain-of-verification` | Chain-of-Verification | technique | Draft an answer, generate verification questions, answer them independently, revise | fact-heavy outputs where hallucination is the risk | high |
| `pf-self-refine` | Self-refine / Reflexion | technique | Generate, critique own output against criteria, revise (repeat) | writing, code and plans that improve with a review pass | medium-high |
| `pf-meta-prompting` | Meta-prompting | technique | Ask the model to write or improve the prompt itself, then use that prompt | reusable prompts, prompt libraries, skills and agents | medium (one-off cost, reusable) |
| `pf-generated-knowledge` | Generated-knowledge prompting | technique | First have the model list relevant facts, then answer using them | commonsense or domain questions lacking supplied context | medium |
| `pf-xml-structured` | XML-structured prompting (Anthropic style) | technique | Wrap instructions, context, documents, examples and output format in distinct XML tags | long or document-heavy prompts for Claude; separating data from instructions | low-medium |
| `pf-role-prompting` | Role prompting | technique | Assign a specific expert role/persona in the system or first line | tone, depth and domain framing | low |
