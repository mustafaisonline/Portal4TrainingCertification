# Courses hub — redesign decision record (proposed, pending founder sign-off)

**Status:** DRAFT — captures a planning conversation on 2026-09-06. Nothing
in `app/courses/` has been changed yet. This file is the record of *intent*;
implementation follows only once the founder confirms the open items at the
bottom.

**Scope of this pass:** the Courses **hub page**
(`app/courses/page.tsx`) only. The course **detail** page
(`app/courses/[slug]/page.tsx`) is explicitly deferred to a second
conversation — see "What is NOT in scope" below.

---

## 1. The positioning decision

Today's hub pitches a seven-course enterprise-data-and-AI **portfolio**
(Foundation → Practitioner → Architect → Executive/Builder/Mentorship). The
founder wants the hub rebuilt around a single, sharper claim instead:

> Most "vibe coding" training is "type a prompt into a chat window and a
> product appears." We teach the discipline around that — the same
> governed way of working an AI coding agent needs to be reliable — so a
> graduate can freelance, build for a company, or replace a bloated team's
> workflow from day one, not just "have taken a course."

This is a genuine repositioning, not a copy tweak: it swaps the organising
idea of the page (a training portfolio) for a single differentiated
proposition (a governed AI-building methodology), and reduces the featured
course count from seven to one for now.

## 2. The flagship course — locked name

**"Data Blueprint & AI / Vibe Coding"** — a merge of the two most related
existing offerings:
- **The Data Blueprint** (`data-blueprint`, Practitioner level) — trusted
  data foundations.
- **AI-Powered Product Development** (`ai-powered-product-development`,
  Builder level, current flagship) — the vibe-coding / product-build
  content.

The merge itself, and the reconciled curriculum, duration, pricing and
formats for the combined course, are **not yet drafted** — see open items.
The existing two source courses' content in `data/courses.ts` is the
material to reconcile from; nothing here should be invented independent of
it.

## 3. The methodology to teach (the actual differentiator)

Every project a student builds is taught to start with a small set of
governing files — not code — before any feature is prompted. Working
names below; the project-context file's name is confirmed, the rest are
carried over from the conversation and should be treated as descriptive
until the founder locks final names:

| File | Purpose |
|---|---|
| `vision.md` | What is being built, for whom, and why. Written first. |
| `guardrails.md` | Rules the AI must never break while building — the non-negotiables for that project. |
| *(name TBD — proposed `project_context.md`)* | Loaded at the start of **every** chat/session so the AI never loses project context between conversations. |
| *(tools & technologies file)* | Declares the approved stack for that project — what the AI is and isn't allowed to reach for. |
| Prompt-engineering best-practice file(s) | So the *right* prompting pattern activates depending on what the student is asking the AI to do, rather than one generic prompt style for everything. |
| **Skills / agent files** | Literal reusable AI-agent skill definitions (the same kind of mechanism this Claude Code session itself uses) — e.g. a "data modelling" skill invoked whenever that kind of work comes up. Students are taught which skills/agents a competent vibe-coding developer needs to build for themselves. |

One explicit engineering principle threaded through the course: **state
that matters must live on the backend, never only in browser/session
memory** — so an app a student builds doesn't silently lose real data on
a refresh or restart. (This mirrors the "Service Restart Test" this
project's own `CLAUDE.md` already holds itself to.)

## 4. What the hub page must communicate (benefits-led)

The founder's brief was explicit: lead with takeaways, not curriculum.
The hub should make a first-time visitor trust the offer within seconds.
Candidate benefit statements from the conversation:

- Freelance-ready from day one — not "I took a course," but a working
  method for taking on real client work immediately.
- Becomes part of the network — **confirmed to mean the existing
  trainers/practitioners already represented on the site**
  (`data/practitioners.ts`), not a new membership concept to invent.
- Can build real products for companies, not just personal projects.
- Can help a company collapse a bloated team's workflow — founder's own
  example: a company's work that took 25 people down to 5, through
  AI-leveraged building. **This is a strong, specific claim — flagged in
  open items below**, since as stated it reads as a guarantee/case study
  rather than a general capability claim, and no such case study currently
  exists in `data/courses.ts` or elsewhere in the repo to substantiate it.

## 5. What is disabled (not deleted) for this pass

Per founder direction: **"disable, don't delete."** Nothing in
`data/courses.ts` is removed. Concretely, once implementation starts:

- The hub page (`app/courses/page.tsx`) stops rendering the six
  non-flagship courses and the six-level pathway/rail sections built
  around all seven courses.
- The `app/courses/[slug]/page.tsx` detail route is taken out of
  navigation reach from the hub (not deleted — the file and its content
  stay; the second conversation decides its future, including whether it
  needs to change to fit the merged course).
- `data/courses.ts` itself is **not edited** by this pass except to add
  the new merged course entry (once drafted and approved) — the existing
  seven entries stay exactly as they are, since `about-us`,
  `certifications`, `CourseCard` and `CoursePricing` all still read this
  file and must keep working.
- Anything currently linking to a now-unreached detail page from *other*
  pages (`about-us`, `certifications`, etc.) needs a pass to check it
  still resolves sensibly — flagged for implementation, not resolved here.

## 6. What is NOT in scope for this pass

- The course detail/subpage design — a second, later conversation per the
  founder.
- Any change to the six non-flagship courses' own content.
- Any pricing decision for the merged course (existing pricing strategy
  guidance in `data/courses.ts` — founder's launch-offer figures — still
  applies; nothing here overrides it).
- Any physical data-model change. `Course` in `data/courses.ts` already
  has the fields (`modules`, `outcomes`, `methodology`, etc.) needed to
  express the merged course as ordinary data — no schema change is
  currently expected.

## 7. Open items requiring founder confirmation before implementation

1. **Merged curriculum** — how "Data Blueprint & AI / Vibe Coding"
   reconciles the two source courses' modules, duration, prerequisites,
   formats and price into one coherent course. This needs to be drafted
   as a proposal and reviewed — it is real curriculum content, not
   something to invent silently.
2. **Third governing file's name** — proposed `project_context.md`, not
   yet confirmed.
3. **The "25 resources → 5" claim** — confirm whether this appears on the
   page as a specific case-study number (which would need a real,
   attributable case behind it) or as a softer capability statement
   ("teams doing more with less"). Recommend the latter unless a real
   case exists to cite.
4. **Detail-page reachability** — confirm it's acceptable for
   `/courses/[slug]` to remain live-but-unlinked from the hub during this
   pass (vs. fully gating it), given other pages may still deep-link into
   it.

---

*Once the above is confirmed, this file becomes the basis for the actual
`app/courses/page.tsx` rewrite and the new course entry in
`data/courses.ts`.*
