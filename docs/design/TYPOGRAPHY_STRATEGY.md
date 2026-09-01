# Data & AI Academy
## Typography Strategy & Font Exploration Report

**Document type:** Typography strategy. Analysis and recommendation only — authorises no implementation.
**Version:** 1.0 · **Created:** 2026-09-01
**Companion:** [`VISUAL_REFINEMENT_GOVERNANCE.md`](VISUAL_REFINEMENT_GOVERNANCE.md) — its §1.2 founder-gate process binds this phase too: any typography change ships as a reviewable experiment, never a global imposition.

> ## ⛔ No code, fonts, or CSS change in this phase.
> ANALYSE → EXPLORE → COMPARE → RECOMMEND. Implementation begins only after the founder approves a direction — and then only as the controlled experiment in §13.

---

## 1. Executive Summary

**The uncomfortable, honest finding first: the current font *pairing itself* is part of the "AI-generated" problem — not just its deployment.**

Newsreader-over-Inter is, almost exactly, the house style of the 2025–26 AI industry. The "editorial serif display + neutral engineered sans" formula was adopted so widely by AI companies and AI-adjacent products that it is now the single most recognisable typographic signature of that world. I chose it for defensible reasons (editorial warmth, screen quality, zero cost), but the association has hardened since: a visitor who has seen fifty AI-startup sites this year has seen this pairing on most of them. Deployment fixes alone cannot remove that association.

At the same time — calibration from the reverted remediation applies — **this is not a licence to redesign.** The sizes, rhythm, and layout roles of the type stay broadly as they are. What is on the table is the *voice*: which faces speak, and where.

**Recommendation (for your decision, not imposed):** **Direction C — the IBM Plex superfamily** (Plex Serif for genuine editorial moments · Plex Sans for UI, body and most headings · Plex Mono replacing the system mono). One family, three coordinated voices, designed literally around the relationship between people and machines — the closest thing that exists to a typeface commissioned for this brand's subject matter. It resolves all three diagnosed weaknesses (anonymous UI font, journalistic serif flavour, unbranded mono) in a single coherent move, at zero licensing cost, through the existing `next/font` pipeline.

Validated by a controlled experiment (§13): homepage + nav + one programme detail page, side-by-side against current, your eye decides. Direction A (same fonts, disciplined redeployment) is retained as the genuine zero-risk alternative — not a straw man.

---

## 2. Current Typography Diagnosis

### 2.1 What Newsreader communicates

Newsreader (Production Type, for Google Fonts) was designed for **on-screen news text** — an optical-size axis, Scotch-roman bones, a warm, literary, journalistic personality. At display sizes it is elegant and readable. Its cultural register, though, is *publishing*: long-read essays, newsletters, the Substack/Medium era of writing on the internet. It says **"thoughtful article"**, not **"institution that certifies people."** It has warmth and intelligence; it lacks weight-bearing authority.

### 2.2 What Inter communicates

Inter is the finest neutral UI typeface of its generation — and that is the problem. It is the default of a decade of SaaS products, dashboards, and design systems. It communicates *competence* and *nothing else*. Set the masthead of an institution in Inter (as the portal currently does) and the institution has no typographic name — it has a label. Functionally excellent for body and UI; brand-mute everywhere it is asked to carry identity.

### 2.3 What the combination communicates

**"2025 AI-company editorial."** Warm serif headlines announcing intelligence + engineered neutral sans announcing competence is precisely the formula the AI industry converged on. The pairing is tasteful — which is why everyone chose it — and its ubiquity is why the portal reads as generated even where the layout doesn't. This is the psychological mechanism: familiarity without provenance. The visitor has seen this voice everywhere and can attach it to no one.

### 2.4 What currently works — keep these

- **The monospace "measured voice"** for numerals, IDs, versions and the rubric — genuinely distinctive, on-brief, under-exploited. (Its weakness: it's an unbranded *system* stack, so it varies by OS.)
- **Scale discipline** — a named scale, no arbitrary sizes, sound line-heights, 16px+ body, tabular figures.
- **The uppercase label style** as a *component* (tracking, size, weight are well judged) — the audit's issue was frequency, which is governance territory, not font territory.

### 2.5 Strongest negative impressions, ranked

1. **The masthead in Inter** — the institution's name set in the interface font, at near-body size. The single most identity-damaging instance.
2. **The pairing's AI-industry association** (§2.3) — a *selection* problem.
3. **Serif ubiquity** — Newsreader on ~30 card titles turns the display voice into furniture (a *deployment* problem; the fix was trialled, reverted in the batch, and remains phase-gated per governance §4.1).
4. **No italic anywhere** — an editorial serif with its italic never used is deployed as a shape, not as typography.

**Answering the environment's five questions directly:** (1) Newsreader is not *wrong*, but it is journalistic where the brand needs institutional; (2) Inter is too generic *for identity-bearing roles* while remaining excellent for UI; (3) **the combination is the largest issue** — it is the AI-industry template; (4) selection and deployment are *both* implicated, roughly 60/40; (5) hierarchy mechanics are the smallest problem — the scale is sound.

---

## 3. Desired Typography Personality

### 3.1 Positioning spectra

```
Traditional      ←──────●───────────→  Futuristic       (contemporary-classic; never sci-fi)
Corporate        ←──────────●───────→  Editorial        (centre, a step toward editorial)
Institutional    ←───●──────────────→  Startup          (firmly institutional)
Neutral          ←────────●─────────→  Expressive       (restrained, one expressive register)
Technical        ←──────────●───────→  Humanist         (balanced: data credibility + human warmth)
Literary         ←──────────────●───→  Engineered       (lean engineered — this is the axis that moves)
```

The last axis is the decisive one. The current system sits at *literary*; the brand — practitioners who build enterprise data and AI systems — belongs closer to *engineered*, without losing the human register entirely.

### 3.2 Typography Personality Statement

> **The typography should feel like the published technical standard of a practitioner body: engineered precision that has learned to speak plainly, with the warmth of a well-edited book reserved for the moments that deserve it. Confident enough to be quiet; distinctive enough to be remembered; never fashionable enough to date.**

---

## 4. Typography Directions

Four genuinely different directions. None requires layout, colour, card or spacing changes — same portal, different voice.

### Direction A — Refine in Place *(the null hypothesis — a real option, not a straw man)*
**Fonts:** Newsreader + Inter, unchanged. **Character:** current voice, disciplined. Serif retreats to true editorial moments; the optical-size axis and italics are finally used; the masthead gets a proper Newsreader treatment; Inter stays everywhere functional.
**Why it fits:** zero cost, zero risk, no re-learning; honours the calibration lesson maximally. **Risk:** cannot shed the AI-industry pairing association (§2.3) — it polishes the template rather than leaving it. **Best if:** the experiment shows font *selection* mattered less than assumed.

### Direction B — Scholarly Authority
**Fonts:** **STIX Two Text** (display) + Inter retained (UI/body). **Character:** the typeface family of scientific and technical publishing — Times-descended, crisp, unglamorous, credible. Headlines read like a standards document or a journal, not a newsletter.
**Why it fits:** "assessment-driven, evidence-based" rendered typographically; a real provenance story (STM publishing); the smallest possible swap — body/UI untouched. **Risk:** bookish density at large sizes; can tip toward *academic* rather than *practitioner*; the "traditional university website" feel the brief excludes sits one step too close. **Best for:** a future standards/certification-document register even if not chosen site-wide.

### Direction C — Engineered Institution ⭐ *recommended*
**Fonts:** **IBM Plex Serif** (editorial display) + **IBM Plex Sans** (UI, body, most headings) + **IBM Plex Mono** (measured voice). One superfamily.
**Character:** Plex was designed (Mike Abbink/Bold Monday) around the relationship between people and machines — engineered letterforms with deliberate human interruptions. Plex Serif is a sturdy, slab-shouldered Scotch modern: *technical-editorial*, not literary. Plex Sans has actual character (the sheared terminals, the open 'g') where Inter has none. Plex Mono finally brands the measured voice instead of leaving it to the OS.
**Why it fits:** the design brief of the typeface *is* the subject matter of the Academy; a tri-family system reads as institutional discipline (one voice, three registers) rather than a pairing assembled from trends; solves all three §2.5 selection problems in one coherent move; complete weights + italics + variable, Google Fonts, existing `next/font` pipeline.
**Risk:** Plex Sans is familiar from developer tooling (though the *tri-family* deployment is not); the IBM provenance is known to design-literate visitors (neutral-to-positive for an enterprise audience); Plex Serif at very large sizes is sturdier than beautiful — it trades Newsreader's elegance for authority, which is exactly the trade on offer and exactly what you might dislike. Hence the experiment.
**Effect on portal:** sizes and layout essentially unchanged; the voice shifts from literary-editorial to engineered-institutional.

### Direction D — Civic Institution
**Fonts:** **Source Serif 4** (display, optical sizes) + **Public Sans** (UI/body). **Character:** sturdy, plainspoken, trustworthy. Source Serif is a robust transitional with true display opticals; Public Sans is the US Government design-system face — institutional credibility is its literal design brief.
**Why it fits:** maximal trust/mature positioning; excellent long-form; free, variable, reliable. **Risk:** *plain* — the most conservative direction, weakest brand memorability; can drift toward governmental/bureaucratic; Public Sans's advantage over Inter is real but subtle enough that visitors may not perceive the change. **Best if:** the founder's reaction to C is "too characterful" and to A is "too samey."

---

## 5. Font Shortlist — due diligence

| Question | A · Newsreader+Inter | B · STIX Two+Inter | C · Plex Serif+Sans+Mono | D · Source Serif 4+Public Sans |
|---|---|---|---|---|
| Appropriateness | Known quantity | Scientific provenance | Subject-matter provenance | Civic provenance |
| Distinct from Newsreader | — | Yes: scholarly v. journalistic | Yes: engineered v. literary | Yes: sturdy v. literary |
| Distinct from Inter | — | No (Inter kept) | Yes: characterful humanist-grotesque | Somewhat: warmer, rounder |
| Long-form content | ✅ | ✅ (its purpose) | ✅ both faces | ✅ excellent |
| Desktop + mobile | ✅ | ✅ | ✅ | ✅ |
| Weights/styles | 200–800 +it, opsz | 400–700 +it | 100–700 +it, all three faces | 200–900 +it, opsz / 100–900 +it |
| Accessibility/readability | ✅ | ✅ (dense at 15px — display only) | ✅ | ✅ |
| Web availability | Google Fonts | Google Fonts | Google Fonts | Google Fonts |
| Loading/performance | 2 families (current) | 2 families | **3 families** — subset to used weights; comparable page cost to current; mono finally consistent cross-OS | 2 families |

All four run through the existing `next/font/google` pipeline — no new package, no runtime font service, no licensing cost. *(A genuinely bespoke premium identity — commercial faces of the Söhne/Tiempos class — is the long-term brand-exercise option and is out of scope while naming (`HO-4`) is open; noted honestly, not recommended now.)*

---

## 6. Pairing Comparison

Scores /5, honest — the current pairing is *not* sandbagged.

| Criterion | Current (News+Inter) | A refined | B STIX | C Plex ⭐ | D Civic |
|---|---:|---:|---:|---:|---:|
| Institutional credibility | 3 | 3.5 | 4.5 | 4.5 | 4.5 |
| Premium feel | 3.5 | 4 | 3 | 4 | 3 |
| Professionalism | 4 | 4 | 4.5 | 4.5 | 4.5 |
| Distinctiveness | 2 | 2.5 | 3.5 | **4** | 2.5 |
| Modernity | 4.5 | 4.5 | 3 | 4 | 3.5 |
| Long-form readability | 4.5 | 4.5 | 4 | 4.5 | 5 |
| Digital usability | 5 | 5 | 4 | 5 | 5 |
| Brand memorability | 2 | 2.5 | 3.5 | **4** | 2.5 |
| **Risk of AI-generated aesthetic** | **High** | **High** | Low | **Low** | Low |
| Fit with existing portal | 5 | 5 | 4 | 4.5 | 4 |

**Commentary.** The current pairing loses on exactly the dimensions that motivated this phase — distinctiveness, memorability, AI-association — and wins on everything mechanical, which is why it *feels* fine in isolation and *reads* generic in context. B and D fix credibility but not memorability. C is the only direction that moves every weak dimension without giving up the mechanical strengths — its genuine cost is a sturdier, less elegant serif, which only your eye can price.

---

## 7. Wordmark Strategy

"Data & AI Academy" currently sits in Inter 600 at 16.8px — the interface font, near body size. Whatever direction wins, **the wordmark must stop being the UI font.**

**Recommendation: A → C staged.** (A) Now: a proper typographic treatment in the chosen display face — presented as **2–3 side-by-side masthead candidates in context** for your choice, per governance §14; the serif wordmark imposed in the reverted batch is *one candidate*, not the default. (B) A customised wordmark: premature. (C) A dedicated brand identity exercise: **yes, eventually — after naming (`HO-4`) is resolved.** Designing an identity for a placeholder name is wasted work; a typographic treatment is not, and survives a rename as a system even if the letters change.

---

## 8. Serif vs Sans Decision

**Answer: C — primarily sans, with selective serif.** An inversion of today's serif-led hierarchy.

Reasoning: Data & AI is a modern technical discipline; the brand's spine is *practitioner credibility*, which reads sans — engineered, plain-spoken, current. But an all-sans system (pure B) forfeits the editorial warmth that separates an institution from a dashboard, and the portal's honest, essay-like voice deserves a serif register. So: **sans carries the interface, body, and workhorse headings; the serif appears only at moments of consequence** — hero, page titles, editorial statements, pull-quotes — where scarcity makes it signal. This also resolves the audit's "serif spread thin" finding structurally rather than by decree, and it is consistent with governance §4's caps.

*(Note: this allocation applies to whichever direction is chosen — including A.)*

---

## 9. Recommended Direction

**Direction C — Engineered Institution (IBM Plex superfamily)** — subject to the §13 experiment and your approval.

It is the only direction that: sheds the AI-industry pairing signature · gives the UI font actual character · brands the measured voice (mono) for the first time · carries a provenance story that matches the subject matter · and does all of it inside the current layout, scale, pipeline and budget. Its honest weakness — Plex Serif's sturdiness versus Newsreader's elegance — is precisely what the in-context experiment exists to judge.

---

## 10. Proposed Typography Hierarchy (Direction C)

Sizes deliberately track the existing scale — this changes voices, not architecture.

| Role | Face | Weight | Size | LH | Tracking | Usage |
|---|---|---:|---:|---:|---|---|
| Hero display | Plex Serif | 500 | 60–68px | 1.05–1.1 | −0.01em | One per page |
| Page title | Plex Serif | 500 | 44–52px | 1.1 | −0.008em | Detail/hub heroes |
| Editorial statement | Plex Serif | 400–500 | 34–38px | 1.2 | −0.005em | Pattern-A moments; *italic permitted for pull-quotes* |
| Section heading | **Plex Sans** | 600 | 26–30px | 1.25 | −0.01em | The workhorse — sans, per §8 |
| Subheading | Plex Sans | 600 | 20–22px | 1.3 | −0.005em | |
| Card title | Plex Sans | 600 | 17–18px | 1.35 | −0.005em | Resolves the serif-on-cards question by direction, not decree |
| Body large | Plex Sans | 400 | 18px | 1.6 | 0 | Section intros |
| Body | Plex Sans | 400 | 16px | 1.6 | 0 | Default; measure ≤68ch |
| Metadata | Plex Sans | 500 | 13–15px | 1.5 | 0 | |
| Navigation | Plex Sans | 450–500 | 15px | 1 | 0 | |
| Button | Plex Sans | 500 | 15px | 1 | 0 | Sentence case (unchanged rule) |
| Eyebrow/label | Plex Sans | 600 | 12px | 1.4 | +0.08em | UPPERCASE; frequency per governance §4.3 |
| Measured voice | **Plex Mono** | 400–450 | 13–15px | 1.5 | 0 | Numerals, IDs, versions, rubric — now cross-OS consistent |
| Wordmark | Plex Serif *(candidate)* | 500 | 20–22px | 1.1 | +0.005em | Per §7 side-by-sides |

Rules carried over unchanged: display negative tracking only; uppercase = labels only; tabular figures for all data; no new levels without amending this table.

---

## 11. In-Portal Application Test

Same portal, different typography — what changes and what we look at, per area:

| Area | Changes | Unchanged | Evaluate |
|---|---|---|---|
| Homepage hero | Headline → Plex Serif; sub/CTAs → Plex Sans | Layout, night theme, split-colour treatment, CTAs, journey panels | Does the headline gain authority without losing warmth? |
| Nav/masthead | Wordmark candidates; nav links → Plex Sans | Structure, single-CTA rule, logo mark | Does the masthead finally read as a *name*? |
| Programmes hub | Headings → Sans; hero title → Serif | Cards, grid, level rail, pathway | Does the portfolio read more institutional? |
| Programme detail | Body/long-form → Plex Sans; curriculum retains accordions | All structure, pricing section, meta strip | Long-form comfort across a full page |
| Trainer profile | Name/page title → Serif; facts/credentials → Sans + **Plex Mono** for certifications | Layout, photo, evidence blocks | Does the evidence read more credible? |
| Cards | Titles → Plex Sans 600 | Card anatomy, three types, Feature rule | Does the serif regain meaning by absence? |
| Certification section | Rubric fragment → **Plex Mono** | Ember/§ boundary content | Does the rubric read like a real instrument? |

The point of the isolation: **if the portal still feels generated with the type swapped, typography was not the primary problem — and we will know before committing to anything global.**

---

## 12. Risks & Considerations

- **Taste risk (the big one):** Plex Serif is sturdier than Newsreader; you may simply prefer the current elegance. Mitigated entirely by the experiment + revert path — and by Direction A remaining a live option.
- **Familiarity risk:** Plex Sans is known from developer tools; the tri-family deployment and serif/sans inversion are what keep it from reading as a template.
- **Scope creep risk:** typography touches every page; the experiment deliberately touches three surfaces only, one commit, on a branch.
- **Performance:** three families vs two — mitigated by `next/font` subsetting to used weights; verify no CLS regressions in the experiment build.
- **P05/P06 inheritance:** the diagnostic pages inherit fonts through tokens; the experiment must confirm they still render acceptably (inheritance, not redesign — same rule as the palette change).

---

## 13. Controlled Experiment Plan

Per governance §1.2 — small, reviewable, revertible, founder-gated.

**Experiment 1 — Direction C in context.** On a branch (`typography-direction-c`): swap fonts via `next/font` and the token layer only (`--font-display`/`--font-body`/`--font-mono` + the §10 face allocations). **No layout, colour, spacing, card or content change.** Surfaces: homepage, navigation/masthead (with 2–3 wordmark candidates), one programme detail page (Data Blueprint). Deliverable: side-by-side screenshots — current vs C — light and dark, desktop and 375px. **You review in the browser; verdict options: adopt / adjust / reject.**

**Experiment 2 — only if C is rejected on serif grounds:** Direction A's disciplined redeployment on the same three surfaces (serif retreat + opsz + italics + masthead treatment, fonts unchanged), compared the same way. If *both* fail to move your perception, the conclusion is that §2's 60/40 split was wrong and the remaining problem is deployment/governance — valuable knowledge either way.

**Not in any experiment:** global rollout, wordmark finalisation, P05/P06 changes, any layout edits.

---

## 14. Final Recommendation

1. **Approve the direction, not the rollout:** Direction C (IBM Plex superfamily) with the §8 sans-led/selective-serif allocation, validated by Experiment 1 before any global adoption.
2. **Phase 0 of the governance roadmap (the `ink-faint` contrast fix) remains outstanding and independent** — it should ship regardless of the typography verdict.
3. **Wordmark:** typographic treatment candidates inside the experiment; full identity exercise deferred until naming (`HO-4`).
4. **If C fails your eye:** Direction A is a genuine, costless fallback; B's scholarly register stays available for future certification documents; D exists if both feel wrong in opposite directions.
5. **The standing test:** the winning typography is the one that makes a senior data professional feel they are reading the published material of a real practitioner institution — before they've read a single word.

---

*Typography strategy v1.0 · 2026-09-01 · Analysis only — implementation requires founder approval of a direction, then Experiment 1.*

---

## 15. Adoption Record — Experiment 1 approved, rolled out portal-wide

**Status: ADOPTED. 2026-09-02.** Founder verdict on Experiment 1 (Direction C, IBM Plex, homepage only): **adopt**, with instruction to apply portal-wide. This section supersedes §13–§14's "validate before any global adoption" gate, which is now satisfied.

### 15.1 What shipped

| Item | Before | After |
|---|---|---|
| Serif | Newsreader | IBM Plex Serif (400/500/600, incl. italic) |
| Sans | Inter | IBM Plex Sans (400/500/600, incl. italic) |
| Mono | system stack | IBM Plex Mono (400/500/600) |
| `.text-display-xl` | serif 500 | **serif 500 — unchanged** |
| `.text-display-lg` | serif 500 | sans 600, tracking −0.018em |
| `.text-display` | serif 500 | sans 600, tracking −0.018em |
| `.text-h1` | serif 500 | sans 600, tracking −0.012em |
| `.text-h2` | serif 600 | sans 600, tracking −0.006em |
| `.wordmark` | Inter 16.8px semibold | Plex Serif 21px medium (17px ≤640px) |

Sizes, line-heights, colour, spacing, layout and content are **unchanged**. Only family, weight and tracking moved — the experiment isolated the typeface variable and the rollout kept that discipline.

### 15.2 The serif is now reserved for exactly two moments

`.text-display-xl` is used on **one element in the entire portal** — the P01 hero — and the wordmark appears in every masthead. Everything else is Plex Sans. This is §8's thesis carried through: a serif on every heading of every page spends its authority until it carries none.

**Consequence the founder should watch for:** every non-homepage page title (`/programmes`, `/trainers`, programme and trainer detail pages, `/diagnostic/result`) is now sans. Those pages were reviewed after rollout but were **not** part of the approved experiment surface. If the serif is missed there, the cheapest correction is to promote selected page titles to `.text-display-xl`, not to re-serif `.text-display`.

### 15.3 Implementation notes worth keeping

- **Folded into the base type scale, not layered as overrides.** The `.type-plex` scope class was deleted rather than promoted. This matters: `.text-mono` is defined after the display roles at *equal* specificity, so `text-mono text-display` (the pricing figure, the trainer community-impact stats) still resolves to mono. A more specific override rule would have silently broken those. Verified: the `40,000+` figure computes to `IBM Plex Mono / 600`.
- **Plex Mono is loaded at 600** solely because `text-mono text-display` inherits the display weight; without it the browser synthesises a faux bold, which smears a monospace face.
- **`.text-label` hard-codes `--color-ink-faint`** and, as unlayered CSS, outranks any Tailwind `text-*` utility. Recolouring a label requires an inline style or a more specific rule.
- **`/diagnostic` has its own shell**, not `PublicShell`. Its brand link needed the `wordmark` class added explicitly, or it would have been the single sans brand in the portal.

### 15.4 Still open after this rollout

1. **`--color-ink-faint` at 3.72:1 fails WCAG 2.2 AA.** Unchanged by this work; §14.2 still applies. It should ship independently of any taste decision.
2. **The masthead wraps to two lines at 375px on every page.** Pre-existing (measured on `/programmes` before rollout, at the old 16.8px). The serif was stepped down below 640px so header height did not regress, but the wrap itself wants a *layout* fix, not a type one.
3. **Wordmark is a typographic treatment, not an identity.** Full brand exercise still deferred until naming (`HO-4`).

---

*Adoption record appended 2026-09-02. Strategy body above (v1.0, 2026-09-01) is unchanged and remains the rationale of record.*
