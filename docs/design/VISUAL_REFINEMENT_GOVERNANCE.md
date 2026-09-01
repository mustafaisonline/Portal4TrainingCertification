# Data & AI Academy
## Visual Refinement Strategy & Design Governance Blueprint

**Document type:** Design governance. Strategy only — authorises no implementation.
**Version:** 1.0 · **Created:** 2026-09-01
**Scope:** the mockup portal (`project-artifacts/mockup/`) and any future production surfaces
**Companion:** [`P01_HOMEPAGE_REDESIGN_SPECIFICATION.md`](P01_HOMEPAGE_REDESIGN_SPECIFICATION.md) (content/IA), `project-artifacts/mockup/docs/DESIGN_FOUNDATION.md` (tokens/components)

> ## ⛔ This document authorises no code, CSS, font or component change.
> It establishes the rules **before** implementation. Each roadmap phase in §18 requires its own authorisation and — critically — its own founder visual review before the next phase begins (§1.2).

---

## 1. Executive Summary

### 1.1 The problem, precisely

The 2026-09-01 design audit found the portal **systematised but not art-directed**. It is polished, token-disciplined and honest — and it reads as mechanically assembled, because *nothing ever varies*. Measured baseline (current, post-revert):

| Symptom | Measured |
|---|---:|
| Uppercase eyebrow labels site-wide | 77 (28 in the identical accent treatment) |
| Homepage sections opening eyebrow → heading → paragraph | 9 / 9 |
| Sections at identical `py-16` symmetric padding | 33 |
| `<Card>` instances | 30 |
| Three-column grids | 13 |
| Decorative radial gradients | 7 · plus 2 dot-fields |
| `--ink-faint` contrast on paper | **3.72:1 — fails WCAG AA** |

The goal is to move from *"visually polished and systematised"* to *"deliberately art-directed, credible, human, institutionally mature"* — **by refining the existing design, not replacing it.**

### 1.2 ⚠ The governance lesson this document is built on

**A wholesale remediation of these findings was already implemented and rejected.** Commit `93217e0` applied all ten audit recommendations at once — eyebrows stripped to near-zero, sections de-carded, the wordmark replaced, dot-field and glows deleted, the serif pulled off card titles. The founder reviewed it and reverted it in full (`f7f826a`): *the previous version was much better.*

That is the most important design datum in this repository. It says:

1. **The diagnosis is accepted; the treatment was wrong.** The cure for over-systematisation is not austerity. Stripping the premium texture (atmosphere, cards, the confident hero) removed what the founder values along with the repetition.
2. **Refinement must be calibrated, not corrective.** The current aesthetic is the baseline to *build on*. Variation is added around it; the look is not flattened.
3. **Taste is founder-gated.** Visual judgement calls cannot be batch-applied on an agent's authority. Every phase in §18 ships as a **small, reviewable, independently revertible change**, and the founder's visual sign-off gates the next phase. Where a change is identity-sensitive (wordmark, serif usage), **options are presented, not imposed**.

Every rule below is written with this calibration. Where the audit said *remove*, this blueprint mostly says *bound, vary, and earn*.

---

## 2. Design North Star

> **A quietly confident institution that shows its work.**
>
> Visiting the portal should feel like reading the published material of a serious practitioner body: calm, composed, specific, and backed by visible evidence — with enough warmth and texture to feel premium rather than austere.

Moving **toward**: established · credible · thoughtful · practitioner-led · editorial · calm · human · institutionally mature.
Moving **away from**: generic AI-startup, SaaS template, over-designed concept site — *and equally away from* stripped-down minimalism that reads as unfinished.

---

## 3. Core Design Principles

| # | Principle | Meaning in practice |
|---|---|---|
| **P1** | **Evidence over atmosphere — but atmosphere is bounded, not banned** | Decoration that carries no meaning yields, over time, to real artefacts (books, rubric, frameworks). Until the evidence exists, bounded atmosphere is legitimate premium texture (§10). |
| **P2** | **Composed, not assembled** | No page repeats the same section construction more than twice consecutively unless the content is a deliberate structured sequence (§6). |
| **P3** | **Hierarchy over uniformity** | Every page has exactly one dominant visual moment. Everything else is visibly subordinate. If everything is emphasised, nothing is. |
| **P4** | **Scarcity gives meaning** | The serif, the ember accent, the Feature card, the eyebrow — each signals only if it is rare. Frequency caps, not bans (§4, §9). |
| **P5** | **Restraint is the premium** | No new effects, trends, gradients, glass, or animation to solve a credibility problem. What is *removed or bounded* does the work. |
| **P6** | **Honest at every scale** | No fabricated evidence, ever. And the design's implied scale must match the copy's honest scale — quieter and more specific beats bigger and more impressive. |
| **P7** | **Refine in place, gated by the founder** | Build on the existing system. Small diffs, one concern per change, founder review between phases. No wholesale passes (§1.2). |

---

## 4. Typography Governance

**Fonts are settled: Newsreader (display) · Inter (UI/body) · system mono (measured voice).** No font change is proposed. The refinement is in *deployment*.

### 4.1 Display serif (Newsreader)

| Rule | Detail |
|---|---|
| **Belongs at** | `display-xl` (one per page, hero only) · `display-lg` (page titles) · `display` (major section headings) · `h1` (sub-sections) · pull-quotes/citations (italic, new) |
| **Does not belong at** | Metadata, buttons, navigation, chips, table cells, dense reference text |
| **Card titles (`.text-h2`)** | 🔶 **Phase-gated candidate.** The audit found serif card titles dilute the display voice; the change was implemented and reverted with the batch. **Trial on one page only** (Programmes hub), present both versions to the founder, decide from the comparison — never re-apply globally on prior authority. |
| **Weights** | Unify display roles at **500**. (`text-h2` currently 600 — an unexplained inconsistency; align whichever direction the card-title trial lands.) |
| **Italic** | Introduce Newsreader italic for **pull-quotes, the founder's professional philosophy, and citation lines only**. ≤1 italic passage per page. An editorial serif with no italic is being used as a shape, not as typography. |
| **Frequency cap** | ≤6 serif headings visible per viewport-height of normal scrolling; a page that reads serif-everywhere has failed the cap |

### 4.2 UI / body font (Inter)

Navigation, body, metadata, buttons, forms, chips, tables, programme meta strips, dense information. Nothing changes. One addition: **body text max reading measure 68ch** everywhere (already mostly honoured via `max-w-[620–680px]`; make it a rule).

### 4.3 Eyebrow labels — the 77-instance problem

An eyebrow is **wayfinding**, not punctuation.

**Keep an eyebrow when** it names a *category the reader navigates by* — a programme's level on a detail hero ("Practitioner"), a labelled data block ("Certifications", "Duration"), a tab or register context ("Investment").

**Remove (or never add) when** it merely restates the heading beneath it ("Programmes" above "All programmes"), decorates a section opening, or is the third consecutive section to open the same way.

| Rule | Value |
|---|---|
| Section-*opening* eyebrows per page | **≤4** (currently 9 on P01, 10 on detail pages) |
| The identical accent treatment (`text-label` + primary colour) | ≤3 per page — variety of treatment where kept |
| Alternatives to reach hierarchy without an eyebrow | Scale jump (display heading alone) · rhythm change (§5) · rule-line + heading · composition change (§6) |

Removal is **incremental and per-page** (Phase 2+), not a global sweep — the global sweep was the rejected move.

### 4.4 Typography scale (governed ranges)

| Role | Face | Weight | Size | Notes |
|---|---|---:|---:|---|
| Hero display | Newsreader | 500 | 60–68px | One per page. Steps to ~42px <640px |
| Page title | Newsreader | 500 | 48–52px | Detail/hub heroes |
| Major editorial heading | Newsreader | 500 | 36–38px | Section-level; the workhorse serif |
| Sub-section heading | Newsreader | 500 | 26–28px | |
| Card title | *(per §4.1 trial)* | 500/600 | 17–22px | |
| Body large | Inter | 400 | 18px / 1.6 | Section intros |
| Body | Inter | 400 | 16px / 1.6 | Default |
| Body small | Inter | 400 | 15px / 1.6 | Cards, metadata prose |
| Metadata / labels | Inter | 500–600 | 12–13px | Uppercase reserved for true labels |
| Measured voice | Mono | 400 | 13–15px | Numerals, IDs, versions, rubric |

**Letter-spacing:** negative only on display sizes (current values fine); +0.08em uppercase labels unchanged. **Uppercase:** labels and `dt` elements only — never headings, never buttons. **No new levels** without amending this table.

---

## 5. Vertical Rhythm & Spacing System

`py-16` symmetric ×33 is the metronome. The fix is **modes around the existing default**, not a reflow of every section.

| Mode | Padding | Symmetry | Use for |
|---|---|---|---|
| **Dense** | ~3–3.5rem | symmetric | Reference blocks: curricula, credential lists, related rails, spec strips |
| **Standard** | 4rem / *current 4–5rem* | symmetric | Normal content — **remains the default**; most existing sections stay put |
| **Expansive** | 7–8rem | symmetric | ≤1–2 per page: the dominant editorial statement, the hero landing |
| **Transitional** | asymmetric (e.g. 5.5rem top / 2.5rem bottom) | asymmetric | A section that *introduces* the next (lead) or *concludes* the previous (follow) |

**Rules**
- No more than **3 consecutive sections** at the same mode.
- Asymmetry must serve sequence (lead/follow), never novelty.
- Container: `1280px` stays. Reading measure ≤68ch. **Each page earns at most one full-bleed or container-breaking moment** — and only for its dominant statement (P3).
- Implementation shape: named utility classes in `globals.css` (the reverted `.section-*` tiers are the right mechanism; re-introduce them *as available modes* in Phase 1, then apply per page in later phases — application, not introduction, is where the founder gate sits).

---

## 6. Section Composition System

The default construction — eyebrow + heading + paragraph + cards — becomes **one pattern among six**, not the answer to everything.

| Pattern | Anatomy | Use when | Avoid when | Rhythm |
|---|---|---|---|---|
| **A · Editorial Statement** | One large serif statement, ≤2 short lines support, no eyebrow, generous space | The page's single dominant claim | More than once per page | Expansive |
| **B · Informational** *(current default)* | Optional eyebrow · heading · intro · content | Standard explanatory content | Third consecutive use | Standard |
| **C · Evidence** | Heading · real artefacts (covers, rubric, framework, credentials) with captions | Whenever genuine evidence exists — prefer over B | No real artefact available (never fake one) | Standard |
| **D · Dense Reference** | Compact heading · ruled list / table / definition list | Curricula, credentials, spec data, indexes | Persuasive content | Dense |
| **E · Human Story** | Person · genuine photography · narrative · timeline | Trainer surfaces, founder story | Any non-genuine imagery | Standard–Expansive |
| **F · Action Band** | Short statement + 1–2 CTAs, often night | Page close, conversion moment | Mid-page interruptions; >1 per page | Dense–Standard |

**Rules:** each page uses **≥3 distinct patterns**; the same pattern ≤2× consecutively (structured sequences like a curriculum exempt); exactly one A *or* one clearly dominant C per page.

---

## 7. Card Governance

30 cards site-wide; the reflex is the issue, not the component. **The three-type system (plate/panel/feature) and the "Feature ≤1 per page" rule are preserved.**

**A card is earned when** items are *comparable* (programmes, trainers, pricing packages, books) or *selectable/navigable* as units.

**A card is not the answer for** paragraph content · simple lists · process steps · credentials · timelines · single facts. Alternatives, in order of preference: ruled list · definition list · table · editorial columns · inline metadata strip · bordered callout (border-left, no fill).

| Rule | Value |
|---|---|
| Card *groups* per page | ≤3–4 |
| Cards inside a group | Match the real item count — never pad, never ghost |
| Grid of identical cards | Only for genuinely comparable items; otherwise differentiate (feature one, list the rest) |
| Removal policy | **Per-section, phased, founder-reviewed.** The batch de-carding was the rejected move; candidates are listed per page in §13 |

---

## 8. Grid & Layout Governance

Thirteen three-column grids make three-up the reflex. Decision table:

| Layout | Use when |
|---|---|
| Single-column editorial | Long-form reading, statements |
| **Two-column asymmetric** (⅔ + ⅓) | Dominant content + supporting rail — **should become the most common multi-column choice** |
| Equal two-column | Genuine pairs (copy ↔ artefact) |
| Three-column | **Exactly three comparable items** — a deliberate choice, no longer the default |
| Four-column dense | Compact reference/metadata |
| Offset / grid-break | The page's one dominant moment only (P3) |

**Rules:** every multi-column section declares a dominant column or justifies equality; ≤2 three-column sections per page; grid-breaking requires a stated reason (hierarchy/meaning) in a code comment.

---

## 9. Colour Governance

| Colour | Role | Rules |
|---|---|---|
| **Ink** | Authority; reading | Headings and body. No change |
| **Warm paper** `#faf8f4` | Institutional ground | Preserved — a genuine differentiator vs. white SaaS |
| **Deep navy** (night scope) | Depth, identity framing | Hero, action bands, header/footer. ≤3 night sections per page so the alternation stays meaningful |
| **Indigo / periwinkle** | Interactive + navigational | Links, buttons, focus, active states. **As non-interactive text: ≤6 instances per page** (currently ~15+); highlighted words inside headings ≤1 per page (the hero split-headline may stay as the one) |
| **Ember** | **Credential & achievement only** | The scarce colour: certification boundary notes, credential award moments (future `K10`/`P15`), publication milestones. **≤1 ember moment per page.** Never decorative, never a second brand accent |

**🔴 Mandatory accessibility correction — standalone, Phase 0:**
`--ink-faint` `#7a8091` on paper = **3.72:1**, failing WCAG AA across ~54 text nodes. Correct to ≥4.5:1 (e.g. `#6b7183` = 4.59:1). This fix was implemented in `93217e0` and reverted *as part of the batch* — it must be **re-applied on its own**, because it is a defect, not a taste decision, and is visually near-imperceptible. Not founder-gated; report after applying.

**Background alternation:** paper → raised → night transitions should follow content logic (evidence on paper, action on night), not a mechanical every-other-section stripe.

---

## 10. Decorative Visual Governance

**Principle: every decorative element must answer "what does this communicate?" — but the answer "premium texture, deliberately bounded" is acceptable.** (Calibration from §1.2: full deletion read as impoverishment.)

| Motif | Current | Ruling |
|---|---|---|
| Dot-field SVG | 2 instances | **Bound: hero only, one per page.** Retire from secondary bands. Long-term: replaced by evidence artefacts as they exist (P1) |
| Radial glows | 7 | **Reduce to ≤2 per page** (hero + one action band) at current subtlety or lower. No new ones |
| Numbered 01/02 sequences | 5 sequences | Keep only where order is *real* (curriculum, methodology). Remove where items are unordered. ≤2 numbered sequences per page |
| Hairline rules | 41 | Primary structural device — keep; vary weight only for the ember credential border |
| Drop shadows | 0 | **Remains zero.** Non-negotiable |
| New decoration (glass, 3D, animation, gradient text) | — | **Prohibited.** Motion stays functional, 150–250ms, `prefers-reduced-motion` respected |

**Replacement path (as genuine artefacts become available):** book covers (already in repo, underused outside the profile) · framework diagrams (4×4 / DAC / PVP as real diagrams) · the actual rubric once authored · curriculum documents · certificates · delivery photography.

---

## 11. Evidence & Trust Strategy

**Show the work.** The portal's strongest asset is real IP that currently sits below decorative atmosphere in the visual hierarchy.

| Level | Evidence | Status | Elevation opportunity |
|---|---|---|---|
| **1 · Direct** | 5 published books (covers in repo) · 3 named frameworks · rubric structure · 7 full curricula | ✅ exists | Books/frameworks onto homepage-level surfaces (Pattern C); rubric fragment given ember treatment; curricula already strong |
| **2 · Professional** | 24+ yrs, sector history, 6 certifications, podcast, community | ✅ exists | Certification list as a designed credential block, not a plain list |
| **3 · Social / institutional** | Partners, clients, accreditation, participant outcomes | ❌ none yet | **Add only when genuine.** Ship empty rather than padded — the current honest empty-states are correct and preserved |

**Absolute rule (restated):** no fabricated testimonials, logos, statistics, partnerships, accreditations, or people — including in fixtures.

---

## 12. Photography & Human Presence Strategy

**Phase A — now (no photography exists):** authenticity comes from genuine artefacts already held: the founder's portrait (used with editorial confidence, not repeated thumbnail-small), the five book covers, the rubric, framework names, curricula. Design carries texture via typography, rules and bounded atmosphere. **No stock, no AI-generated people, no synthetic rooms — prohibited outright.**

**Phase B — when genuine photography arrives** (content dependency, repeatedly flagged): real teaching in a real room · the founder mid-delivery · materials/whiteboards in use · venue context. Treatment: documentary not corporate; captioned (place/programme, honestly); colour-graded toward the warm-paper/navy palette; placed at hero-adjacent and Human Story (E) sections. What remains banned: posed handshakes, people-pointing-at-screens, anything implying cohorts that have not run.

---

## 13. Page-Specific Art Direction

| Page | Dominant role | The one dominant moment | Density | Patterns to lean on | De-card / de-eyebrow candidates (phased) |
|---|---|---|---|---|---|
| **Homepage** | Resolve identity, route | Hero (already strong — preserved) | Medium | A(hero) · B · C · F | Delivery formats → ruled grid; capability areas → index; eyebrows 9→≤4 |
| **Programmes hub** | Orient a portfolio | The pathway (most institutional section on the site — elevate it) | Medium–dense | B · D · C | Philosophy tiles → definition list; levels 3-col → 2-col; keep programme cards (comparable) |
| **Programme detail** | Depth with hierarchy | Curriculum (Expansive; everything else subordinate) | Dense | B · D · C · F | 13 equal sections → 3 rhythm tiers; eyebrows 10→≤4; keep pricing + format cards |
| **Trainers** | Credible at n=1 | The single trainer, treated editorially large (Pattern E) — small count framed as selectivity, not sparsity | Low | E · A | Index card could become full editorial block |
| **Trainer profile** | **Most evidence-rich page** | Books + frameworks as designed evidence (C), not sidebar lists | Dense | E · C · D | Sidebar cards → designed credential blocks; strongest candidate page for the serif-italic pull-quote |
| **Certification** *(currently a P01 section; `P15` unbuilt)* | Rigour | The rubric itself | Medium | C · B | The ember moment lives here. When `P15` is authorised, it is designed evidence-first: rubric, process, boundary — a document, not a landing page |

---

## 14. Wordmark & Brand Identity Direction

**Strategy only — explicitly not implemented here.** The audit correctly found the Inter-set masthead weak; the unilateral serif replacement was **reverted with the batch**, confirming identity is founder-taste territory.

- The mark should remain **typographic** — an institution's authority is its name set properly; a startup-style symbol is not required and the geometric glyph should not be *assumed* either way.
- **Blocked-adjacent:** naming is open (`HO-4` / WBS 4.4.1). A full brand identity exercise before the name is settled would be wasted; a *treatment* exercise is not.
- **Recommended next step:** a small, contained exercise producing **2–3 side-by-side masthead candidates** (current Inter lockup · serif editorial lockup · serif + rule/descriptor variant), screenshot-compared in context, founder picks. One commit, trivially revertible. Slot: Phase 2.

---

## 15. Component Governance

| Component | Purpose | Use when | Don't | Variation rule |
|---|---|---|---|---|
| Section header | Orient | Per §4.3/§6 | Default eyebrow ritual | ≤4 opening eyebrows/page |
| Card (3 types) | Contain comparables | §7 | Contain prose/lists | Feature ≤1/page (kept) |
| Button (3 variants) | Action | Unchanged — **preserved as-is** | New variants; uppercase | One primary action per view |
| Link (text + arrow) | Navigation | Inline and card footers | Raw URLs | `→` internal, `↗` external |
| Metadata strip | Facts | `dt/dd` pairs, mono values | Marketing copy | Uppercase labels OK here |
| Callout | Boundary/notice | OQ-21 note, honesty notes | Decoration | Border-left only; ember for credential |
| Table | Comparison | Format/criteria comparison | Layout scaffolding | Header sans, values mono |
| Accordion | Progressive disclosure | Curricula (kept — right pattern) | Hiding key info | Native `<details>` |
| Timeline | Real sequences | Methodology, career | Unordered content | Numbered only if truly ordered |
| Resource link card | External resources | Genuine external destinations | Internal nav | Label + purpose, `↗` |

**Rule:** a new component requires demonstrating no existing pattern communicates the content — and a line in `DESIGN_FOUNDATION.md`.

---

## 16. Design Exceptions Policy

Consistency where it builds trust (tokens, buttons, spacing modes, a11y); variation where it builds hierarchy (composition, rhythm, emphasis).

- **Standard components** (buttons, chips, cards, forms, tables, nav): follow the system, no deviations.
- **Art-directed moments** (hero, dominant statement, evidence showcases, credential/ember moments, page-specific storytelling): *may* deviate from composition defaults — never from tokens, type scale, or accessibility.
- **Every exception carries its reason as a code comment** (`{/* Art-directed: … because … */}`). Acceptable reasons: hierarchy, meaning, evidence, storytelling. Never "to look different."
- Budget: **≤2 art-directed deviations per page.** An exception used on 3+ pages is no longer an exception — promote it into the system or retire it.

---

## 17. Design Decision Checklist

Before shipping any new or modified section:

1. Does this page still have exactly **one** dominant moment?
2. Is this the third consecutive section with the same composition? → vary.
3. **Eyebrow:** does it aid orientation, or restate the heading? Page total ≤4?
4. **Card:** are these items genuinely comparable/selectable? Would a ruled list be clearer?
5. **Three columns:** are there *exactly three comparable* things?
6. **Serif:** is this heading a moment of consequence, or furniture?
7. **Uppercase:** is this a true label?
8. **Accent text:** page indigo-as-text count ≤6? Heading highlight ≤1?
9. **Ember:** is this genuinely a credential/achievement moment? Page count ≤1?
10. **Decoration:** what does it communicate? Within the §10 bounds?
11. **Numbered sequence:** is the order real?
12. **Spacing:** which rhythm mode — and is it the fourth identical one in a row?
13. **Asymmetry/full-bleed:** what hierarchy does it serve? (Comment it.)
14. **Evidence:** does a real artefact exist that could replace this claim or decoration?
15. **Honesty:** does anything imply scale/inventory/validation that doesn't exist?
16. **Contrast:** every text/background pair ≥4.5:1 (3:1 large)?
17. **Both themes + 375px** verified?
18. **New component:** can an existing pattern do this?
19. **Scope of diff:** is this change small enough to review and revert on its own? (§1.2)
20. The ultimate test: *does this help a serious professional trust that this is a real institution with genuine expertise?*

---

## 18. Prioritised Implementation Roadmap

**Process rules (binding, from §1.2):** one page or one concern per commit · founder visual review gates each phase · identity-sensitive changes ship as side-by-side candidates · any phase is independently revertible.

| Phase | Scope | Contents | Impact/Effort | Risk |
|---|---|---|---|---|
| **0 · Mandatory correction** | Global, 1-line | Re-apply the `--ink-faint` contrast fix standalone (§9). Not taste-gated | High/Trivial | None |
| **1 · Foundations (introduce, don't apply)** | `globals.css` + docs | Add rhythm-mode utilities and italic style as *available options*; record caps (§4–§10) in `DESIGN_FOUNDATION.md`. **Zero visual change** | Med/Low | None |
| **2 · Homepage art direction** | P01 only | Apply §13 row 1 *incrementally*: eyebrow reduction to ≤4, rhythm variation on 2–3 sections, bound decoration, ember credential moment. **Plus the masthead candidates exercise (§14) as side-by-sides.** Founder reviews in browser before Phase 3 | High/Med | Taste — mitigated by small diffs + gate |
| **3 · Programmes experience** | Hub + detail template | §13 rows 2–3: rhythm tiers on detail pages, hub de-card candidates, curriculum elevated | High/Med | Low–taste |
| **4 · Trainers & evidence** | Trainers + profile | Editorial trainer treatment; books/frameworks as designed evidence; serif italic pull-quote | High/Med | Low |
| **5 · Certification authority** | Ember system-wide; `P15` when authorised | Credential moments unified under ember; certification page designed evidence-first | Med/Med | Depends on P15 authorisation |
| **6 · Photography integration** | Blocked on content | Phase B of §12 — only when genuine photography exists | High/— | **Blocked: content dependency, not design** |

---

## 19. Success Criteria

Measured against the §1.1 baseline, evaluated per phase:

| Dimension | Baseline | Target | Test |
|---|---|---:|---|
| Section-opening eyebrows per page | 9–10 | **≤4** | DOM count |
| Composition patterns per page | ~1 | **≥3 distinct** | §6 review |
| Consecutive same-rhythm sections | unlimited | **≤3** | Computed padding |
| Card groups per page | up to 6+ | **≤4** | Count |
| Three-column sections per page | up to 4 | **≤2** | Count |
| Indigo-as-text per page | ~15 | **≤6** | Computed styles |
| Ember moments per page | 0 | **exactly 1 where relevant** | Review |
| Contrast | 1 AA failure | **0 failures** | Measured ratios |
| Decoration | 7 glows + 2 dot-fields | **≤2 glows, ≤1 dot-field/page** | Count |
| **Founder acceptance** | `f7f826a` (rejected batch) | **each phase accepted in browser review** | The gate that outranks every metric |
| Qualitative | — | A first-time senior professional can't point at any section and say "template" | Ask one |

---

## 20. Final Design Governance Summary

1. **The diagnosis stands; the treatment changes.** Over-systematisation is real (77/9-of-9/33 metronome). The cure is calibrated variation around the existing premium baseline — not the austerity that was tried and reverted.
2. **Caps, not bans.** Eyebrows ≤4, ember ≤1, three-column ≤2, glows ≤2, patterns ≥3, same-composition ≤2 consecutive. Scarcity is what makes each device signal.
3. **Evidence rises as it becomes real.** Books, frameworks, rubric and curricula progressively displace atmosphere. Nothing is ever fabricated to fill the gap — including photography.
4. **Preserved without debate:** warm paper, night navy, zero shadows, the button system, token architecture, honest empty states, content depth, accessibility patterns.
5. **Process is the safeguard:** small diffs · one concern per commit · founder-gated phases · options for identity calls · everything revertible. `93217e0`→`f7f826a` is the standing reminder of why.
6. **Phase 0 (contrast) is the only change exempt from the taste gate** — it is a defect.
7. The test for everything: *does this help a serious professional trust that this is a real institution with genuine expertise?*

---

*Governance blueprint v1.0 · 2026-09-01 · Strategy only — each roadmap phase requires separate authorisation.*
