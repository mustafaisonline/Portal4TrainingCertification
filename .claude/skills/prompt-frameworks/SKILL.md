---
name: prompt-frameworks
description: The 30 prompt-engineering frameworks (RTF, TAG, APE, BAB, PAR, RACE, CARE, RODES, ROSES, RASCEF, RISEN, CO-STAR, CRISPE, CLEAR, zero/few-shot, chain-of-thought, self-consistency, tree-of-thoughts, ReAct, least-to-most, step-back, plan-and-solve, prompt chaining, chain-of-verification, self-refine, meta-prompting, generated knowledge, XML-structured, role prompting) with selection rules — pick the cheapest accurate one and rebuild the prompt. Used by pe-selector.
---

# Prompt-engineering frameworks (one skill, 30 frameworks)

Consolidated 2026-10-03 (CR-2026-10-03-1122) from thirty `pf-*` skills to save the per-session cost of thirty descriptions. Catalogue and selection rules also in `framework/prompt-frameworks.md`. Definitions are the commonly published ones; cost and accuracy notes are rules of thumb, not measurements.

## Selection rules (cheapest sufficient first)
1. Clear, common task → **zero-shot** (lowest cost). Add **role prompting** only if tone/depth matters.
2. Strict output format or house style → **few-shot** (2–3 examples).
3. Multi-step reasoning, debugging, analysis → **chain-of-thought** or **plan-and-solve**.
4. Constrained multi-step job → **RISEN** or **RASCEF**; communication/content → **CO-STAR**.
5. Current state → desired state → **BAB**; bug/incident → **PAR**; small action → **TAG** / **RTF** / **APE**.
6. Needs tools, files or lookups → **ReAct**. Fact-critical output → **chain-of-verification**.
7. Big job → **prompt chaining** (small, checkable steps). Long documents + instructions → **XML-structured** (combine with any).
8. Reusable prompt/skill/agent → **meta-prompting**.
9. Highest-cost (**self-consistency**, **tree-of-thoughts**) only for hard, high-stakes problems the cheaper ones cannot solve.

## How to apply any framework
1. Fill each element of the chosen structure in one short line; delete filler. 2. Keep the stated order; for Claude, separate instructions from supplied data with XML tags when the prompt is long. 3. State the exact output format and hard limits. 4. Return the rebuilt prompt plus one line: framework, why, expected token cost. Never add facts or business rules the founder did not give; mark unknowns `[ask founder]`.

## The frameworks

### APE
**Structure:** Action · Purpose · Expectation · **Best for:** short instructions where the why and the expected result matter · **Token cost:** low · **Accuracy:** good for simple tasks · **Avoid when:** tasks that need a persona or audience

### BAB
**Structure:** Before · After · Bridge · **Best for:** change, migration or transformation requests (current state → desired state → how to get there) · **Token cost:** low-medium · **Accuracy:** good for state-transition problems · **Avoid when:** pure generation tasks with no current state

### CARE
**Structure:** Context · Action · Result · Example · **Best for:** tasks where an example of the desired output pins the style · **Token cost:** medium · **Accuracy:** example raises format accuracy · **Avoid when:** when no good example exists

### Chain-of-Thought
**Structure:** Ask for step-by-step reasoning before the answer · **Best for:** arithmetic, logic, multi-step analysis, debugging · **Token cost:** medium-high (reasoning tokens) · **Accuracy:** raises accuracy on multi-step reasoning · **Avoid when:** simple lookups; models with built-in extended thinking may not need it

### Chain-of-Verification
**Structure:** Draft an answer, generate verification questions, answer them independently, revise · **Best for:** fact-heavy outputs where hallucination is the risk · **Token cost:** high · **Accuracy:** reduces unsupported claims · **Avoid when:** creative work

### CLEAR
**Structure:** Concise · Logical · Explicit · Adaptive · Reflective · **Best for:** a checklist for polishing any prompt before sending it · **Token cost:** low · **Accuracy:** improves clarity of any prompt; not a template · **Avoid when:** n/a — use as a final pass

### CO-STAR
**Structure:** Context · Objective · Style · Tone · Audience · Response · **Best for:** writing and communication where style, tone and audience drive quality · **Token cost:** medium-high · **Accuracy:** high for content quality and tone fit · **Avoid when:** code or data tasks where style is irrelevant

### CRISPE
**Structure:** Capacity and Role · Insight · Statement · Personality · Experiment · **Best for:** creative or exploratory work where several variants are wanted · **Token cost:** high · **Accuracy:** good for variety, weaker for strict accuracy · **Avoid when:** tasks needing one exact answer

### Few-shot prompting
**Structure:** Instruction plus 2–5 worked input/output examples · **Best for:** strict output formats, classification, house style · **Token cost:** medium (examples cost tokens) · **Accuracy:** high format and consistency accuracy · **Avoid when:** when examples would bias or leak; very long inputs

### Generated-knowledge prompting
**Structure:** First have the model list relevant facts, then answer using them · **Best for:** commonsense or domain questions lacking supplied context · **Token cost:** medium · **Accuracy:** can help; facts must be checked · **Avoid when:** when the facts are already supplied (use the supplied ones)

### Least-to-most
**Structure:** Decompose into easier sub-problems, solve in order, feed answers forward · **Best for:** problems harder than the examples shown; compositional tasks · **Token cost:** medium-high · **Accuracy:** good on compositional generalisation · **Avoid when:** simple one-step tasks

### Meta-prompting
**Structure:** Ask the model to write or improve the prompt itself, then use that prompt · **Best for:** reusable prompts, prompt libraries, skills and agents · **Token cost:** medium (one-off cost, reusable) · **Accuracy:** good when the prompt will be reused many times · **Avoid when:** one-off tasks

### PAR
**Structure:** Problem · Action · Result · **Best for:** bug reports, incident write-ups and fix requests · **Token cost:** low-medium · **Accuracy:** good for troubleshooting · **Avoid when:** creative or exploratory tasks

### Plan-and-Solve
**Structure:** Ask the model to write a plan first, then execute it step by step · **Best for:** multi-step tasks where skipped steps are the risk · **Token cost:** medium · **Accuracy:** reduces missing-step errors · **Avoid when:** simple tasks

### Prompt chaining
**Structure:** Split a job into a sequence of smaller prompts, each using the previous output · **Best for:** large jobs (research → outline → draft → review); each step easier to check · **Token cost:** medium overall, low per step · **Accuracy:** high: each stage is verifiable · **Avoid when:** tiny tasks; when context is better kept in one pass

### RACE
**Structure:** Role · Action · Context · Expectation · **Best for:** a task that needs a persona plus background and a stated outcome · **Token cost:** medium · **Accuracy:** good balance of brevity and context · **Avoid when:** trivial one-liners (overkill)

### RASCEF
**Structure:** Role · Action · Steps · Context · Examples · Format · **Best for:** complex, repeatable tasks where steps and output format must be exact · **Token cost:** medium-high · **Accuracy:** high format and process accuracy · **Avoid when:** one-off simple tasks (token cost not justified)

### ReAct
**Structure:** Interleave Reasoning and Acting (tool calls) in a Thought → Action → Observation loop · **Best for:** tasks needing tools, files or lookups to ground answers · **Token cost:** medium-high · **Accuracy:** grounding reduces hallucination · **Avoid when:** pure reasoning with no tools

### RISEN
**Structure:** Role · Instructions · Steps · End goal · Narrowing · **Best for:** multi-step tasks with explicit constraints (narrowing = limits and exclusions) · **Token cost:** medium-high · **Accuracy:** high accuracy for constrained multi-step work · **Avoid when:** simple tasks

### RODES
**Structure:** Role · Objective · Details · Examples · Sense check · **Best for:** tasks that benefit from a final self-check of the answer · **Token cost:** medium · **Accuracy:** sense-check step catches errors · **Avoid when:** very small tasks

### Role prompting
**Structure:** Assign a specific expert role/persona in the system or first line · **Best for:** tone, depth and domain framing · **Token cost:** low · **Accuracy:** shifts style and focus; does not add knowledge · **Avoid when:** tasks where a persona is irrelevant

### ROSES
**Structure:** Role · Objective · Scenario · Solution · Steps · **Best for:** planning and decision tasks that end in an ordered action list · **Token cost:** medium · **Accuracy:** good for plans and recommendations · **Avoid when:** pure factual lookups

### RTF
**Structure:** Role · Task · Format · **Best for:** quick single-output requests where who/what/shape is enough · **Token cost:** low · **Accuracy:** good for simple, well-defined tasks · **Avoid when:** tasks needing context, constraints or multi-step reasoning

### Self-consistency
**Structure:** Sample several reasoning paths, take the majority answer · **Best for:** high-stakes answers with one checkable result · **Token cost:** high (multiple runs) · **Accuracy:** higher accuracy than one chain · **Avoid when:** open-ended output; cost-sensitive work

### Self-refine / Reflexion
**Structure:** Generate, critique own output against criteria, revise (repeat) · **Best for:** writing, code and plans that improve with a review pass · **Token cost:** medium-high · **Accuracy:** good quality gain per iteration · **Avoid when:** when criteria are unclear

### Step-back prompting
**Structure:** First ask a more general question or principle, then answer the specific one · **Best for:** knowledge-heavy or principle-driven questions · **Token cost:** medium · **Accuracy:** improves reasoning grounded in principles · **Avoid when:** trivial or purely procedural tasks

### TAG
**Structure:** Task · Action · Goal · **Best for:** small improvement or action requests with a clear target · **Token cost:** low · **Accuracy:** good for narrow tasks · **Avoid when:** open-ended or analytical work

### Tree-of-Thoughts
**Structure:** Explore and evaluate several branches of reasoning, backtrack · **Best for:** hard planning or search problems with several candidate approaches · **Token cost:** highest · **Accuracy:** strong on hard problems, expensive · **Avoid when:** anything a single chain can solve

### XML-structured prompting (Anthropic style)
**Structure:** Wrap instructions, context, documents, examples and output format in distinct XML tags · **Best for:** long or document-heavy prompts for Claude; separating data from instructions · **Token cost:** low-medium · **Accuracy:** high for Claude: reduces mixing of instruction and data · **Avoid when:** very short prompts

### Zero-shot prompting
**Structure:** Instruction only, no examples · **Best for:** common tasks the model already does well; cheapest option · **Token cost:** lowest · **Accuracy:** good for common tasks; weaker on unusual formats · **Avoid when:** novel formats or strict output schemas
