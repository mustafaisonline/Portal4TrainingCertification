# Programme content migration — source, mapping, and what was held back

**Migrated:** 2026-08-31, under the authorized Programmes stage.
**Source:** `yourpartnertechnologies.com/trainings.html` and its seven
programme subpages — the founder's existing, previously authored training
ecosystem. Discovery was verified complete against that site's
`sitemap.xml`: it lists exactly seven training pages, and all seven were
reviewed and migrated.

This file exists so a future session can answer *"where did this programme
content come from, and why is some of it missing?"* without re-auditing
the source site.

## Programmes migrated

| Slug | Title | Level | Duration (as published) |
|---|---|---|---|
| `data-ai-essentials` | Data & AI Essentials | Foundation | Half day – 1 day |
| `data-blueprint` | The Data Blueprint | Practitioner | 1–2 days |
| `enterprise-data-modelling` | Enterprise Data Modelling | Architect | 2–3 days |
| `enterprise-data-architecture` | Enterprise Data Architecture | Architect | 2 days |
| `agentic-ai-strategy-adoption` | Agentic AI Strategy & Adoption | Executive | 1 day |
| `ai-powered-product-development` | AI-Powered Product Development | Builder ★ flagship | 2 days – 4 weeks |
| `data-ai-career-mentorship` | Data & AI Career Mentorship | Mentorship | Flexible |

## Information architecture mapping

```
trainings.html (overview)        →  /programmes
  ├ portfolio grid               →  "All programmes" + ProgrammeCard
  ├ "Choose your learning journey"→  learningPathway[] + pathway section
  ├ level labels                 →  programmeLevels[] taxonomy
  ├ corporate training block     →  "For organisations" section → /#organisations
  └ delivery options             →  "Delivery options" list
[programme].html × 7             →  /programmes/[slug]
  ├ meta strip                   →  hero <dl> (level·duration·prereq·format·certificate·audience)
  ├ Who Should Attend            →  audience section (intro + role chips)
  ├ "Why this matters"           →  rationale (paragraphs + problems)
  ├ Learning Outcomes            →  outcomes[] or outcomeGroups[]
  ├ Course Structure/Agenda      →  modules[] as <details> accordion
  ├ How We Teach                 →  pedagogy (methods + industries)
  ├ Benefits for Organizations   →  benefits
  ├ delivery formats (flagship)  →  deliveryFormats[] cards
  ├ career paths (mentorship)    →  careerPaths[] cards
  ├ frameworks (AI-PPD, mentorship) → methodology.steps[]
  └ Related Training Programs    →  related[] → ProgrammeCard rail
```

**Level, not "category", is the taxonomy** — that is how the source itself
groups the portfolio, and it doubles as the progression. Seven programmes
across six levels is a portfolio, not a catalogue, so the hub uses a level
rail plus one grid rather than client-side facets. Filters were
deliberately not added: they would cost usability at this size and edge
back toward the catalogue-browse pattern DR-02 retired.

**Pathway.** The source publishes an explicit progression, preserved as
`learningPathway`: Foundation → Practitioner → Architect (two parallel
specialisms) → Builder, with Executive and Mentorship as genuinely
parallel tracks. Nothing was invented — the parallel tracks are marked as
such rather than forced into the ladder.

## Link migration

**Internal → portal routes.** Every cross-programme link in the source now
points at the migrated page: `data-blueprint.html` → `/programmes/data-blueprint`,
and so on for all seven. `trainings.html` → `/programmes`. The mentorship
page's `team/mustafa-qizilbash.html` → `/trainers/mustafa-qizilbash`.
`contact.html` → `/#organisations` (the portal's enquiry surface; no
contact screen exists yet).

**Preserved as external** — YPT service pages with no Academy equivalent,
surfaced as labelled "Related resources" cards, never raw URLs:

| Resource | Appears on |
|---|---|
| Data & AI Services | Data Blueprint · Enterprise Data Modelling · Enterprise Data Architecture |
| LTAD 2.0 | Enterprise Data Architecture |
| Value Discovery Canvas™ · Strategic Advisory · Agentic AI Solutions | Agentic AI Strategy & Adoption |
| AI-Powered Consulting | AI-Powered Product Development |

## ⚠ Deliberately NOT migrated

Each is a live open decision, not an oversight. All are recoverable from
the source at any time.

| Held back | Why |
|---|---|
| ~~Prices~~ — **now migrated, 2026-09-01** | See "Pricing migration" below |
| **Dates / scheduled offerings** | The source publishes none, and none may be invented (DR-02 §4.1). Programmes are the *proposition* layer; offerings (format · date · location · capacity) remain State A. This is also what keeps the programmes-vs-offerings emphasis (`HO-1`) genuinely open |
| **Enrol / "Enroll Now" buttons** | Registration and payment do not exist. CTAs stop at "register your interest" and "talk to us" |
| **Founder credibility blocks repeated on every source page** ("Why learn from YPT", 24+ years, community size, podcast) | Consolidated into the Trainers ecosystem and linked, rather than repeated seven times. The trainer card appears once per programme page |
| **YPT company framing and its consultation CTA** | Another company's commercial surface; the Academy is the product here |

## Pricing migration (2026-09-01)

**Correcting an earlier error in this migration.** The first pass reported
that "prices exist on only 2 of the 7 pages". That was **wrong**. The
founder was right that pricing is published for all seven.

**Why it was missed:** the figures are not in the pages' HTML. They are
injected client-side by `renderTrainingInvestment({ course: … })` from
`js/main.min.js` (`TRAINING_INVESTMENT_DATA` and
`buildMentorshipInvestmentRegions()`). A static `curl` fetch never runs
that script, and the extraction step stripped `<script>` blocks before
searching — so five of seven programmes appeared to have no pricing. Only
the two pages that *also* hard-code figures in their HTML showed up.

**Lesson for future migrations from this source:** check
`js/main.min.js` for client-injected content before concluding that
anything is absent.

**What was migrated** — all three published regions, verbatim:

| Region | Training programmes | Mentorship |
|---|---|---|
| Malaysia (RM) | 50% off — Founder's launch offer | 20% off |
| Pakistan (Rs.) | 70% off — Regional scholarship | 30% off |
| International (USD) | 10% off — Global launch offer | 10% off |

Mentorship is priced per **package** (Career Assessment · Professional ·
Executive), not per programme, and its discount rates differ from the
training programmes — hence `mentorshipRegionBadges`. The flagship's
value-stack breakdown (`RM 9,497+` total) is carried in `valueStack`.

**Where it appears:** a region-tabbed "Programme investment" section on
every programme detail page (`components/ProgrammePricing.tsx`), plus an
indicative "from" price (Malaysia rate) on each programme card.

⚠ **These are time-limited launch offers and will date.** They live in
`data/programmes.ts`; changing them is a data edit with no component
changes. **No checkout is implied** — payment is not built (ADR-014 /
OQ-2), so every CTA remains an enquiry.

**On `HO-7`:** displaying these figures was the founder's explicit
direction and supersedes the earlier hold. The Academy's own pricing
*strategy* — whether it ultimately adopts these figures, this regional
model, or this discount framing — remains the founder's decision.

## Content gaps in the source

- **Certification** — the source offers a *certificate of participation* per
  programme. This is recorded per programme and rendered with an explicit
  note distinguishing it from the Academy credential, which is earned
  through assessed applied work (the `OQ-21` boundary). No programme in the
  source maps to an Academy credential yet.
- **Trainer attribution** — the source implies a single trainer throughout;
  each programme page links the founder's profile rather than asserting a
  per-programme roster.
- The mentorship programme has no "modules" in the training sense; its
  engagement stages were structured as modules so the page renders
  consistently, and its Career Acceleration Framework is carried in
  `methodology`.
