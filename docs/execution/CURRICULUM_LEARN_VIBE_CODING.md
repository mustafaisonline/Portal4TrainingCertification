# Learn VIBE CODING — Curriculum (half-day masterclass)

> **Status: DRAFT v2 for founder review — 2026-09-26.** Rewritten from the founder's outline of 2026-09-26 after the founder fixed the length at **3–4 hours**. A record only: it authorises no portal change. When agreed it becomes a second programme in the catalogue (data, not schema; `programmes` + `programme_modules`), unlisted until the founder publishes it.
> **Reflected in the catalogue seed 2026-09-26** (slug `learn-vibe-coding`, **published**, listed first on `/programs`; prices as the founder gave them — International USD 1,000 · Malaysia RM 100 · Pakistan Rs 5,000, no discount). The founder's outline items are carried as six curriculum modules (Parts 1–5 + the optional hands-on); C1 (certificate) and C4 (title/slug/formats) are implemented as recommended; C2, C3 (credit towards the 2-day fee) and C5 remain open.
> **Relationship:** this is the **vibe-coding block of the 2-day "DATA BLUEPRINT & AI/VIBE CODING" programme**, taught on its own for people who already know their data foundations. The 2-day programme adds the data half and the full build-test-deploy of a product; this course shows the method and starts it.

## 1. Positioning
| | |
|---|---|
| Title | Learn VIBE CODING |
| One line | Build software by directing AI — the method, the tools, and a real build, in one afternoon |
| Length | **3.5 hours core + 30 minutes optional hands-on = 3–4 hours** |
| Format | Face-to-face or live online (same agenda); corporate/private on request |
| Level | Builder (portal level already exists) |
| Audience | Founders, product owners, analysts, managers and curious professionals with **no coding background**; developers new to AI-assisted work are welcome |
| Prerequisites | None. Bring a laptop and one AI account (free tier is enough). A GitHub account is optional |
| Certificate | Certificate of Completion on attendance of the full session (completion recorded by the administrator — M6 decision E2). **Founder to confirm** a half-day earns one |
| Take-home | The Vibe Coding Starter Kit: the eight document templates, a constitution (guardrails) template, a prompt-pattern sheet, a tool-and-cost sheet, and the capstone challenge |

## 2. Learning outcomes — by the end participants can
1. Explain what vibe coding is and is not, and what an LLM, RAG, an agent and a skill are, in plain language.
2. Choose a starting toolset (chat tool, coding agent, Git) and a **minimum** tech stack, and know what each costs.
3. Write prompts that get reliable results, and write a **constitution file** that keeps the AI inside the rules.
4. Follow the **document-first Vibe Coding Method**: Vision → BRD → FSD → HLD → LLD → WBS → TechStack → GuardRails, with reference designs and a theme.
5. Recognise the build sequence — wireframe → physical data model → product → admin panel — and the checks that belong between steps.
6. Name the five ways vibe-coded projects fail and how the method prevents each.
7. Leave with their own **Vision.md** written with AI and a wireframe prompt ready to run (hands-on option).

## 3. Agenda (minutes; 215 core, 245 with the option)
| # | Block | Min | Founder's items covered | What happens |
|---|---|---|---|---|
| 0 | Welcome — what you will leave with | 10 | — | The promise, the starter kit, the capstone challenge; one real product shown end to end (this training portal, built this way) |
| 1 | What vibe coding is — and is not | 15 | 1 | Directing versus typing; where it shines (products, internal tools, prototypes) and where it does not; who still needs a professional developer and when |
| 2 | AI essentials for builders | 25 | 2 | LLM in one picture; tokens, context window and **why the AI forgets** (this is why the documents exist); hallucination and verification; RAG versus "just paste it"; tools and MCP in one slide; what a session costs |
| 3 | Your toolkit and the minimum stack | 20 | 3, 4 | Chat tools (ChatGPT, Gemini, Grok, Claude) versus **coding agents** (Claude Code, Cursor, Gemini CLI, Copilot); Git and GitHub as the undo button; what a framework is; the minimum stack = front end + back end + database + hosting, one of each; a one-page tool-and-cost sheet |
| 4 | Talking to AI well | 20 | 5 | Prompt patterns: role, context, constraints, examples, output format, iterate; the **constitution file** (`CLAUDE.md` / `GuardRails.md`) as the rule of every session; "ask, don't invent" for business rules; short live demo |
| — | Break | 15 | | |
| 5 | Agents and Skills | 25 | 6, 7, 8, 9 | What an agent is (goal, tools, loop, sub-agents); **live: make a small agent**; what a skill is (reusable instructions the agent loads); **live: make a skill**; when *not* to use an agent |
| 6 | The Vibe Coding Method — the eight documents | 30 | 10.1–10.8, 11, 12 | Vision → BRD → FSD → HLD → LLD → Project Plan/WBS → TechStack → GuardRails, each shown from the real portal; add reference sites/designs and a theme image; the data model as its own step (conceptual → logical) before the AI generates the physical one; a decision log |
| 7 | Watch it build | 35 | 13.1–13.4 | Live on a real repository: wireframe → physical data model (approve before migrating) → production product in milestones → admin panel; commit after every step; review what the AI changed before accepting; test before claiming done |
| 8 | Guardrails, pitfalls, and what comes next | 10 | — | The five failure modes: scope creep, invented rules, unverified claims, secrets pasted into chat, no version control — and the rule that prevents each; testing, security, deployment and operation are the 2-day programme |
| 9 | Wrap — kit, challenge, next steps | 10 | — | Starter kit hand-over; the 30-day capstone challenge (build one small product with the method); the path to the 2-day programme; feedback |
| **Opt.** | **Hands-on: your first document** | **30** | 10.1, 13.1 | Each participant writes **Vision.md** for their own idea with AI using the template, then generates the wireframe prompt from it; trainer reviews three aloud |

Two delivery lengths: **3 h 35** without the option (large or corporate groups), **4 h 05** with it (groups up to ~15). Trim block 7 to 30 minutes to land exactly on 4 hours.

## 4. Hands-on and materials
- **Live demos** (blocks 4, 5, 7) run on a real repository the trainer owns, never on slides alone. A recording-safe fallback deck exists for venue failures.
- **Participant exercises:** two short prompt exercises in block 4; Vision.md and wireframe prompt in the option.
- **Starter Kit** (given after the session, PDF + editable files): the eight templates; constitution template; prompt-pattern sheet; tool-and-cost sheet; "before you accept AI output" checklist; capstone challenge brief.
- **Assessment:** none formal. Completion = attendance of the full session (option excluded). The capstone challenge is voluntary and feeds the 2-day programme.

## 5. Deliberately not in this course (it is in the 2-day programme)
Data foundations (DSS, data, metadata, building blocks, modelling, processing and storage, architecture, governance) · building a complete product hands-on · testing and quality engineering · security beyond the basics · deployment, domain, environment and operation · payments, authentication and admin as built modules · the graded capstone.

## 6. Relationship to "DATA BLUEPRINT & AI/VIBE CODING" (2 days)
Day 1 = the data half (the existing seven data modules) · Day 2 = **this course's blocks 1–8 expanded** plus hands-on build, test, deploy and the capstone. The module titles used here are reused verbatim there, so the portal shows the standalone course as a true subset.

## 7. Founder decisions
| # | Question | Recommendation |
|---|---|---|
| C1 | Does a half-day earn a Certificate of Completion? | Yes — it is completion of *this* programme; the certificate names the programme, so it cannot be mistaken for the 2-day one |
| C2 | Run the 30-minute hands-on option by default? | Yes for groups ≤ 15 and for live online; drop it for large corporate audiences |
| C3 | Pricing (MYR / PKR / USD) and whether attendance credits the 2-day fee | Set with the 2-day price; recommend a credit equal to the standalone fee within 90 days |
| C4 | Portal title and slug | "Learn Vibe Coding", `learn-vibe-coding`, level Builder, formats: Half-day workshop (F2F), Live online |
| C5 | Demo repository | Use this portal's repository, sanitised (no `.env`, no reference material), or a small purpose-built demo repo |
