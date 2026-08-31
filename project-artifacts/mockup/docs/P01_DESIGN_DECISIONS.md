# P01 Homepage — Design Decisions (implementation record)

**Redesigned:** 2026-08-31, under the authorized "P01 Homepage Design &
Implementation" stage.
**Specification followed:** [`docs/design/P01_HOMEPAGE_REDESIGN_SPECIFICATION.md`](../../../docs/design/P01_HOMEPAGE_REDESIGN_SPECIFICATION.md)
(repository root) — its §3 is the durable record of the approved (`HD-*`)
and open (`HO-*`) decisions this page implements. This file records only
the **implementation-level** choices made within that specification's
latitude, so a future session can answer *"why does P01 look like this?"*
without reopening the design exercise.

## The narrative structure chosen

The page runs identity → routing → proof → offer → recognition → commerce
→ honesty:

| Section | Carries |
|---|---|
| `H1` Hero | The D0 compound proof: named genuine practitioner + live delivery formats, in one eyeline. **No date is shown because none exists** (State A — the element is omitted, never faked) |
| `H2` Pathways | The fixed priority order: explore programmes · train your team · assess your capability |
| `H3` Who teaches | Founder-led credibility in depth; rendered from a plural `data/practitioners.ts` array |
| `H4` How it works | "Live means live" — the section that most directly prevents a marketplace reading; needs no inventory |
| `H5` Programmes | State A treatment: describes what a programme *is* and what every programme includes; no cards, no names, no dates, no "coming soon" |
| `H6` Capability areas | Subject scope without counts; plus the second (final) diagnostic placement |
| `H7` Certification | "The credential has to be earned" + rubric-format fragment |
| `H8` For organisations | Distinct band, enquiry-shaped only |
| `H9` Honest close | "The first programmes are being prepared now" + primary CTA |

**Why hero-photo rather than photo-in-H3:** D0 requires the named expert
"early and unmistakably." A face is the unmistakable part, so the genuine
photograph anchors the hero as the page's single `Feature` card (the
three-card-type rule allows Feature once per screen — spending it on the
practitioner *is* the design statement). `H3` then carries substance
(facts) without repeating the image.

## Founder representation — how and why

- Photo: `public/experts/mustafa-qizilbash.jpg`, copied from the founder's
  own résumé materials (`Reference Material/Resume/Mustafa/Resume
  -Editable/Mustafa_Pic.jpg`, 800×800, genuine). **The AI-generated
  portrait in the same folder was deliberately NOT used** — prohibited by
  the P01 specification §16.2, because a synthetic likeness on a page
  claiming "a real practitioner teaches this" falsifies the claim.
- Facts shown are the specification's §8.4 **Tier 1** list only
  (cross-source consistent). Volatile counts (books, episodes, followers)
  and **current employer** are deliberately omitted (spec §8.6/§18.3 — the
  sources conflict on employer; open item `HO-14`).
- "Founder & Lead Trainer" is a **platform role designation**, not an
  employer title.
- Scaling: `data/practitioners.ts` is a plural array with one genuine
  entry. `H3` maps over it; adding a real practitioner is a data change.
  Copy was written to survive growth ("founder-led today… additional
  practitioners will be introduced here — only ever real ones") and no
  layout depends on a count.

## Diagnostic CTA — preserved

**"Start free diagnostic (10 min)"** appears exactly twice, wording
unchanged: the third pathway card (`H2`) and the supporting band after
capability areas (`H6`). It is **not** in the header (single-CTA rule),
not the hero primary, and not the closing CTA. Copy sets the reframed
expectation — locates you across capability areas, names gaps in plain
language — with no learning-path/course-funnel implication.

## Programmes vs scheduled offerings — kept open

`H5` describes **both** concepts in one breath ("a programme… runs as
scheduled offerings: a specific format, dates and location you register
for") and leads with neither. There are no programme cards and no
offering cards to force the choice. When inventory exists, an entry is a
programme identity with offering attributes attached — compatible with
either future emphasis (`HO-1`).

## Notable implementation choices

- **Anchor navigation** (`/#programmes` etc., absolute paths so they work
  from `P06` and the placeholder page). Nav items promise no unbuilt
  screen; `P24`/`P10`/`P17` etc. do not exist yet, so routing goes to the
  page sections that represent them.
- **Inert CTAs** ("Register your interest", "Talk to us about your team",
  "Sign in") use `href="#"` per the established mockup convention —
  registered in `MOCK_DATA_REGISTER.md`.
- The **rubric fragment** in `H7` mirrors the `K06` wireframe in the
  approved Mockup Specification (criterion name + the four level names).
  It illustrates the *format* of the published rubric; the real rubric is
  still to be authored and must replace it (never faked — MVP spec §11.2).
- The **knowledge-library strip was dropped** (it showed three fabricated
  article titles; the P01 spec's launch rule is *omit rather than fill*).
  `D2` therefore has no homepage presence yet — it returns when genuine
  articles exist.
- The **D3 slot stays empty** — no third differentiator was invented; the
  old three-column "why different" block was dissolved into `H3`/`H4`
  (D0), `H7` (D1) rather than rebuilt as a grid with a gap.
- `data/domains.ts` lost `courseCount`/`emphasised` — counts are retired;
  the GA emphasis was a catalogue-era beachhead device.
- **Header at mobile:** "Sign in" hides below `sm` so the wordmark + CTA
  fit at 375px without horizontal scroll.

## Visual redesign — premium navy identity (2026-08-31, later the same day)

A separately authorized visual pass, using a founder-supplied reference
image **as inspiration only**. Nothing was copied from it: no text, no
layout, no logo, no icons, no illustrations, no assets. What was extracted
were *principles* — premium dark/light contrast, editorial serif display
typography, restrained data-inspired atmosphere, structured section
rhythm — and re-expressed as an original design. Notably, the reference
carried a brand name ("SkillMeter"); it was **deliberately not adopted**,
because naming is an open decision (`HO-4`) and copying the reference's
brand is prohibited. The wordmark remains the "Data & AI Academy"
placeholder.

**Principles extracted and how they were originally realised:**

- **Navy/cream editorial alternation.** A scoped `.night` class in
  `globals.css` redefines the full token set for its subtree, so
  Button/Card/Chip restyle themselves inside dark sections with zero
  component changes. Night sections: hero, capability-areas/who-teaches
  band, the H7 rubric card, the pre-footer diagnostic band, header and
  footer. Night is identity, not theming — it holds in light *and* dark
  themes.
- **Editorial serif display.** Newsreader (display) + Inter (UI) via
  next/font — self-hosted at build time, no runtime font service, no new
  package. This supersedes DESIGN_FOUNDATION's "system fonts only"
  simplification (updated there).
- **Indigo replaces teal** as the global primary (light `#3d43b8`, night
  `#9aa3ff`), with the proficiency ramp re-derived on the same hue.
  P05/P06 inherit palette and type through the token system — an intended
  design-system evolution, not a redesign of those screens.
- **Original data atmosphere.** `DotField` — a deterministic masked dot
  grid with falling node streams, plus the logo mark, pathway glyphs and
  check glyphs — all hand-written inline SVG. No cliché AI imagery.
- **Hero composition.** Genuine photograph in a bordered frame with a
  navy gradient tie-in and an overlapping credibility card hanging off the
  bottom-left corner. The same genuine photo appears once more, small and
  CSS-grayscaled, in the who-teaches band (a style treatment; the asset is
  untouched).
- **Credibility descriptor strip** under the hero — positioning facts
  (24+ years in practice · practitioner-led · …), never metrics.

**Diagnostic placement (supersedes the §9 note above):** under this
authorization the CTA appears **three** times — hero secondary, the
assess-pathway card, and the pre-footer band — wording unchanged. The
root P01 spec's "at most twice" guidance (§9.2) is superseded on this
point by the founder's visual direction for this stage.

**Preserved:** all strategic content, State-A honesty, the plural
practitioner model, HO-1 neutrality (H5 still describes programmes and
scheduled offerings without leading with either), and every
anti-fabrication rule.

## Rejected alternatives

- **Leading the hero with an offerings board** ("Direction A") — rejected:
  brittle at zero/one date and reads as an events site. The practitioner
  frame degrades gracefully (spec §7 rationale).
- **A "Meet our experts" grid** — rejected: placeholder slots would imply
  a faculty that does not exist.
- **Keeping the fabricated knowledge cards** for visual balance —
  rejected: omit-rather-than-fill.
- **A date placeholder in the hero** ("dates announced soon" chip) —
  rejected: State A omits the element entirely rather than teasing it.
