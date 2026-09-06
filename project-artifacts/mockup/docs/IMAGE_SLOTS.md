# Image slots — what exists, what is reserved, what stays empty

**Established 2026-09-02.** Companion to the
[photography brief](https://claude.ai/code/artifact/c188bb7c-0eef-435e-aafe-070b9160a7b2),
which carries the full inventory and shoot specs. This file records what is
**implemented in code**.

---

## The rules

### 1. No licensed imagery — founder direction, 2026-09-02

**Every image published in this portal must be ours to publish.** No stock
libraries — free tiers included — no third-party licensed photography, no
imagery whose rights sit with someone else, however permissive the terms look.

Acceptable sources are exactly these:

| Source | Example |
|---|---|
| Photographs the founder or the Academy took or commissioned | a delivery shoot |
| The founder's own artwork | the five book covers already in `public/books/` |
| Photographs supplied with the subject's consent | participants in a session |
| Original graphics authored for this portal | `DotField`, the logo mark, the OG card |

**This is broader than the honesty rule below and catches things that rule
does not.** Notably, the DAMA/CDMP material in the reference archive is
third-party licensed and may not be reproduced even though it is genuine, and
even though the founder holds the certification.

**When in doubt, the slot stays empty.** An empty frame costs nothing; a
licensing claim costs a great deal more than a photograph.

### 2. An empty slot must look empty

`components/ImageFrame.tsx` renders a labelled, visibly unfilled frame
carrying the subject, aspect ratio and minimum width — so it doubles as the
shoot brief.

Stock and AI-generated imagery are **prohibited** on honesty grounds as well:
a photograph of a classroom is a claim that cohorts have run. The same rule
that rejected the AI portrait in `Reference Material/` applies to every slot
here.

## The engineering rule

**A slot with no image is a design state, not a hole.** Some of these
photographs may not exist for months. `ImageFrame` reserves the box at the
right aspect ratio, so:

```tsx
<ImageFrame subject="…" ratio="4 / 3" minWidth={1600} />          // empty
<ImageFrame subject="…" ratio="4 / 3" src="/x.jpg" alt="…" />     // filled
```

Filling a slot is **a `src` prop and nothing else** — no layout work, no
reflow, because the frame already holds the space.

### Illustrated stand-ins — 2026-09-05, founder direction

All 8 slots below now render an original, abstract SVG illustration
(`components/illustrations/DeliveryIllustrations.tsx`) via a new
`illustration` prop, instead of staying an empty dashed box while the real
photography is pending.

**The request that started this was explicitly framed as "AI-generated
images" and explicitly accepted as overriding rule 1 above** ("a photograph
of a classroom is a claim that cohorts have run"). No image-generation tool
is available in this environment, so hand-authored original SVG illustration
was offered as the alternative and chosen instead. That choice means the
override was never actually exercised: an abstract, clearly non-photographic
line illustration is not a photograph and cannot be mistaken for one — it
sits inside the **existing** "original graphics authored for this portal"
exception (rule 1's table, row 4), the same category as `DotField` and the
homepage hero glyphs. Rule 1 itself is unchanged and still binds: no stock
or AI-generated **photograph** may go in any of these frames.

`ImageFrame` now has three states, in priority order: `src` (a real
photograph) → `illustration` (this stand-in) → empty (the dashed "Photograph
needed" box). Swapping an illustration for the real photograph is still
just a `src` prop.

## Implemented

**8 frames across 4 templates.** All are empty; each fills with a `src` prop.

> **↻ 2026-09-02, later the same day.** The `/trainers/[slug]` profile route was
> retired by founder direction, taking its 4 frames with it (3 community + 1
> podcast). The count went 12 → 8. Those subjects are **not lost** — they are
> recorded in the [photography brief](https://claude.ai/code/artifact/c188bb7c-0eef-435e-aafe-070b9160a7b2)
> and remain worth shooting; they simply have no surface in the portal today.

| Location | Slots | Ratio | Why here |
|---|---|---|---|
| `app/page.tsx` → "Live means live" | 4 (one per delivery format) | 4:3 | **The portal's highest-value image slot.** The section makes the central claim — *you are in the room with a practitioner* — and proved it with a text grid alone |
| `app/trainers` → "Trainers at work" | 1 | 3:2 | A trainer mid-session. The only slot on the redesigned trainers page |
| `app/courses/[slug]` → header band | 1 per programme (7) | 21:9 | Placed **below** the hero, not inside it: the hero is a night section carrying the title and meta strip, and an empty box there would weaken the page's one dominant moment |
| `app/courses/[slug]` → "How it is taught" | 1 (where the programme has pedagogy) | 3:2 | The most abstract writing on the page; a photograph of the teaching makes it concrete |
| `app/courses` → flagship band | 1 | 4:3 | The flagship earns a distinct treatment; an image is one way to give it one |

**Frame content is centred, not bottom-anchored.** On the 21:9 header (~500px
tall) a caption in the corner reads as a broken image; centred content reads
as a deliberate empty state.

### Reserved slots are deliberately loud (founder direction, 2026-09-02)

An empty frame previously used `--color-ground-raised` — the **same surface as
a Panel card** — so it blended into the page and reserved slots were hard to
pick out while reviewing. They now carry a dedicated ember tint:

| Token | Light | Dark | Night | Role |
|---|---|---|---|---|
| `--color-accent-soft` | `#f7ece2` | `#241a12` | `#1a1710` | Frame ground |
| `--color-accent-line` | `#b5652b` | `#a0713f` | `#a0713f` | 2px dashed border |
| `--color-accent-ink` | `#8f4d1d` | `#e0975c` | `#e0975c` | "Photograph needed" label |

**Contrast was computed, not eyeballed** — and the computation changed the
values. The base `--color-accent` (`#b5652b`) reaches only **3.71:1** on the
tint and would have failed AA for the 12px label, hence the darker
`--color-accent-ink` at **5.56:1**. Body text sits at 6.82:1 and the border
clears 3:1 for non-text contrast. The spec line moved from `--color-ink-faint`
(3.39:1 on the tint — a fail) to `--color-ink-quiet`.

**The loudness is temporary by construction.** A filled frame renders the
photograph alone, so the tint disappears exactly as the slots are satisfied —
the page gets quieter as the work gets done, with nothing to clean up.

## Deliberately NOT given frames

Frames were added only where there was a **genuine gap**. Where working
content already occupies the slot, an empty frame would be a downgrade:

| Location | Currently | Decision |
|---|---|---|
| P01 hero | Original SVG learning-journey composition | **Keep.** A genuine photograph would be stronger, but the SVG works and is honest. Upgrade when a real photograph exists — do not frame it in the meantime |
| P01 organisations band | Illustrative capability heatmap | **Keep.** Replacing working content with an empty box loses more than it flags |
| P01 certification band | The rubric panel | **Keep.** Blocked on a real credential being designed; the rubric is the better answer until then |
| Programme cards | Text-led | **Never.** Thumbnails on programme cards is the course-marketplace convention DR-02 moved away from, and is how a site starts to look template-assembled |
| Capability areas · pathways · curriculum | Type and rules | **No.** Structured reference content — a photograph would be decorative by definition |
| Diagnostic + result | Deliberately bare | **No.** A focused task surface; every image is a distraction |

## Global assets — added 2026-09-02

| Asset | File | Notes |
|---|---|---|
| Favicon | `app/icon.svg` | The `PublicShell` LogoMark is a hairline outline that disappears at 16px, so this is the same idea rebuilt for small sizes: solid indigo ground, white strokes |
| Open Graph card | `app/opengraph-image.tsx` | 1200×630 PNG generated at build by `next/og` (part of Next.js — no new dependency). **Typographic, not photographic**, so it is truthful today |

### ⚠ `metadataBase` must be set before launch

`app/layout.tsx` sets it from `NEXT_PUBLIC_SITE_URL`, falling back to
`http://localhost:3000`. **An `og:image` pointing at localhost renders for
nobody.** Set that variable to the real domain when one exists.

### Why TTFs are vendored in `assets/fonts/`

Satori (inside `ImageResponse`) cannot read the hashed `.woff2` files
`next/font` emits, and needs static instances — it renders variable fonts
unreliably. Three OFL-licensed TTFs are therefore vendored.

They live in `assets/fonts/`, **not `public/`**, deliberately: they are
build-time inputs and must never be served to browsers. The runtime faces
still come from `next/font`.

## Traps

1. **`.text-label` defeats Tailwind colour utilities.** The frame's ember
   label is set with an inline `style`, because `.text-label` hard-codes
   `--color-ink-faint` and, being unlayered CSS, outranks `text-[…]`. This was
   hit *again* while building `ImageFrame`, having already been documented —
   see `DESIGN_FOUNDATION.md` "CSS layer/specificity traps".
2. **`.night` had no `--color-accent`.** Ember elements inside night sections
   inherited the light-mode value at poor contrast on navy. Added 2026-09-02.
3. **`Trainer Photos/` in the reference archive is not delivery
   photography** despite the name. See `docs/REFERENCE_MATERIAL_ACCESS.md` §5.
