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

## 7. Open items — status as of 2026-09-06

1. **Merged curriculum** — **deferred by founder direction.** Not drafted
   in this pass; founder will supply this separately before it's written
   into `data/courses.ts` or the page.
2. **Third governing file's name** — **confirmed.** `project_context.md`
   — founder approved the proposal ("if useful, please make it").
3. **The "25 resources → 5" claim** — **stays, as a benefit.** Founder
   will share more supporting detail to substantiate it before it ships
   copy-final; treat as pending elaboration, not as removed or softened.
4. **Detail-page reachability** — **resolved, superseding the earlier
   interpretation.** See §8.7: the flagship course card links directly to
   `/courses/ai-powered-product-development`. Founder confirmed this
   explicitly when specifying the course-card section.

---

## 8. Page structure

**Confirmed order** (founder-approved 2026-09-06, including both proposed
additions):

1. Hero
2. Who can take this training
3. Benefits of this training
4. The Method
5. Your learning journey
6. Who teaches you
7. Course card / section
8. CTA

Section-by-section content is brainstormed below as each is agreed.

### 8.1 Hero — LOCKED (2026-09-06)

- **Eyebrow label:** `Courses` — kept consistent with the site's existing
  page convention; no new pattern introduced.
- **Headline (H1):** "Vibe coding isn't a prompt. It's a method."
  *(sets up §8.4 The Method by name)*
- **Subhead (body-lg):** "Before a single feature gets built, you define
  what you're building, the rules the AI must never break, and the
  context it needs to stay on track — the same discipline that keeps an
  AI coding agent reliable on real work. Taught by a practitioner, not
  sold as a shortcut."
- **CTAs:**
  - Primary: "See how it works" → anchors to §8.4 The Method
  - Secondary: "Who this is for" → anchors to §8.2 Who can take this
    training
- **Deliberately excluded from hero:** the course name ("Data Blueprint &
  AI / Vibe Coding" — lands in §8.7 instead), the benefit claims (§8.3),
  and the 25→5 number (a proof point, not a hero-level promise).

### 8.2 Who can take this training — LOCKED (2026-09-06)

Reuses the existing `whoShouldAttend: { intro, roles }` shape already
used throughout `data/courses.ts` — no new content pattern introduced.

- **Intro:** "This is built for people who want to build — not just talk
  about building. Whether you've never opened a code editor or you
  already write code every day, the method works the same way: that's
  the point of teaching it as a method, not a set of tricks."
- **Roles:**
  - Aspiring freelance developers — want client-ready skills, not another
    tutorial
  - Career changers — moving into tech from a completely different field
  - Entrepreneurs & startup founders — need to build and ship an MVP
    without hiring a dev team
  - Product managers & business analysts — want to go from idea to
    working product themselves
  - Students & graduates — building a portfolio that gets freelance
    work, not just a certificate
  - Working professionals — want to use AI properly at work, not just
    experiment with it
- **Callout beneath the list:** "No prior coding experience required. If
  you already code, the method makes you faster and more reliable — it
  doesn't start you over."
- **Deliberately not committed here:** a hard prerequisite line (e.g.
  "None" vs "Basic awareness") — that depends on the merged-curriculum
  content still to come (§7 open item 1); this framing holds regardless
  of where that lands.

### 8.3 Benefits of this training — LOCKED (2026-09-06)

Six cards, in founder-confirmed order:

1. **Freelance-ready from day one**
   > Leave with a proven method, not a syntax refresher. Take on real
   > client work immediately — you don't need a team behind you to
   > deliver.

2. **Reduce workforce**
   > One example: a company's workflow that used to take 25 people now
   > runs on 5, through the same AI-leveraged building approach you'll
   > learn.
   > *(Pending founder's supporting detail — open item 3 in §7. Slot and
   > title are locked; copy may be refined once that detail arrives.)*

3. **No coding required**
   > You don't need to already know how to code. The method is designed
   > to take you from zero to shipping — coding ability helps, but it
   > was never the barrier.
   > *(Reinforces the same point already made as a callout in §8.2 —
   > deliberate repetition, not a duplicate to dedupe.)*

4. **10–15 frameworks, not just one trick**
   > You're not learning "how to prompt ChatGPT." You're exposed to
   > 10–15 real frameworks — for planning, building, testing and
   > deploying a product — the same discipline a professional
   > AI-builder actually uses.
   > *(Cross-references §8.4 The Method, which walks through what these
   > frameworks actually are — the two sections should link to each
   > other in the build.)*

5. **Build for real companies**
   > This isn't a personal-project bootcamp. You learn to scope, build
   > and deliver work a company would actually pay for — because that's
   > exactly the discipline the method teaches.

6. **Become part of the network**
   > You're not just a graduate — you gain visibility with the
   > practitioner network behind this Academy, the same trainers
   > teaching here, as you go on to build real work.
   > *(Still flagged: "become part of the network" implies a real
   > mechanism — referrals, visibility, an application step — not yet
   > defined. Needs a short answer before copy-final.)*

### 8.4 The Method — LOCKED (2026-09-06)

**Deliberately a teaser, not a disclosure.** Founder direction: don't
give the method away free on the public page — name that it exists and
say it's taught in the course, nothing more. The six governing
files/categories from §3 (`vision.md`, `guardrails.md`,
`project_context.md`, the tools/stack file, prompt-engineering
playbooks, Skills/agents) are **not named or listed on the page** — only
referenced in aggregate here.

- **Eyebrow:** `The Method`
- **H2:** "Before you build the product, you build the method"
- **Body (short, two lines):**
  > "Every project starts with a small set of governing files — what
  > you're building, the rules the AI must never break, and the context
  > it needs to stay on track — plus a set of reusable skills and
  > frameworks for planning, building, testing and deploying.
  > The full method — every file, every framework, in the order it's
  > taught — is inside the course itself."
- **CTA beneath:** "See the course" → anchors to §8.7 Course card

### 8.5 Your learning journey — LOCKED (2026-09-06)

Founder-steered structure (learn → do → earn funnel), shown in full —
unlike §8.4, this section is meant to be fully visible. Reuses the same
numbered-spine visual pattern already on the current courses page.

- **Eyebrow:** `Your Learning Journey`
- **H2:** "From data foundations to paid work"

1. **Learn data foundations** — "Build the trusted-data instincts every
   real product needs — how data is structured, governed and made
   reliable, before AI ever touches it."
2. **Learn AI / vibe coding** — "Apply the method to build real, working
   products with AI — not a toy demo, a working build."
3. **Start developing products & solutions** — "Move from guided
   exercises to your own builds — real briefs, real constraints, a
   capstone you can actually show someone."
4. **Start working as a freelancer or AI engineer** — "Take what you
   built into the market — as a freelancer, an AI engineer, or inside
   your own company."
5. **Earn** — "Designed to lead to paid work, not just a certificate —
   the natural result of stages 1–4, not a separate promise bolted on."
   *(Deliberately phrased as "designed to lead to," not a direct income
   guarantee.)*

### 8.6 Who teaches you — LOCKED (2026-09-06)

Reflects `data/practitioners.ts` honestly: one genuine practitioner
(founder-led today, plural array ready for growth — same convention as
the homepage). No implied faculty.

- **Eyebrow:** `Who Teaches You`
- **H2:** "Taught by a practitioner, not a curriculum team"
- **Body:** "Mustafa Qizilbash has spent 24+ years building enterprise
  data and AI platforms across banking, energy, telecom and government —
  and founded and still runs a 40,000+ member Big Data community,
  alongside a podcast with 80+ episodes. This course is taught by
  someone who has done the work, not someone reading a script."
- **Practitioner card:** reuses the existing card component already
  built for the homepage/`/trainers` (photo, headline, experience line,
  HRD Corp Accredited Trainer badge) — no new component.
- **CTA:** "Meet the trainer" → `/trainers`

**Resolves §7/§8.3 open item — "become part of the network":**
**Confirmed by founder** — "network" means real access to this
40,000+-member Big Data community and the podcast audience, both
genuinely documented in `data/practitioners.ts`. Not a referral or
subcontracting mechanism. §8.3's benefit card #6 flag is now resolved.

### 8.7 Course card / section — LOCKED (2026-09-06)

- **Structure:** reuses the existing Flagship section already built on
  the current courses page (`app/courses/page.tsx` — the "night" band
  with meta strip, region pricing, highlights, image). No new component.
- **Content source:** the existing `ai-powered-product-development`
  entry in `data/courses.ts`, **completely unchanged for now** —
  placeholder until the real merged curriculum arrives (open item 1).
- **Display-only name override:** the hub shows "Data Blueprint & AI /
  Vibe Coding" as a **page-level override**, not an edit to the `title`
  field in `data/courses.ts` — the underlying data record, its slug and
  its provenance notes stay untouched until the actual merge content is
  supplied. Cleaner to unwind if naming changes again before then.
- **CTA:** "Explore the course" → links to the existing detail page at
  its current slug, `/courses/ai-powered-product-development`.

**Supersedes §7 open item 4:** the flagship card **does** link to its
dedicated detail page — founder confirmed this explicitly, replacing the
earlier "reachable-but-unlinked" assumption. The detail page itself is
still unchanged/unredesigned (out of scope per §6) — only now it's
reachable via this one card.

### 8.8 CTA — LOCKED (2026-09-06)

Bookends the hero's "method" language. No fabricated dates — consistent
with DR-02 State A (no scheduled offerings exist yet).

- **H2:** "Stop prompting. Start building properly."
- **Body:** "One course. One method. A skillset you can start
  freelancing with immediately."
- **CTAs:**
  - Primary: "Explore the course" → `/courses/ai-powered-product-development`
    (same detail page as §8.7)
  - Secondary: "Talk to us" → `/contact-us` (same pattern as the
    existing corporate section's "Talk to us about your team")

---

**All eight sections locked 2026-09-06.** Remaining before
implementation: the still-open items in §7 above (#1 merged curriculum,
#3 the 25→5 supporting detail).

---

*This file is the basis for the actual `app/courses/page.tsx` rewrite and
the new course entry in `data/courses.ts`, once the remaining open items
above are resolved.*
