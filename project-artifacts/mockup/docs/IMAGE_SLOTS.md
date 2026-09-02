# Image slots — what exists, what is reserved, what stays empty

**Established 2026-09-02.** Companion to the
[photography brief](https://claude.ai/code/artifact/c188bb7c-0eef-435e-aafe-070b9160a7b2),
which carries the full inventory and shoot specs. This file records what is
**implemented in code**.

---

## The rule

**An empty slot must look empty.** `components/ImageFrame.tsx` renders a
labelled, visibly unfilled frame carrying the subject, aspect ratio and
minimum width — so it doubles as the shoot brief.

Stock and AI-generated imagery are **prohibited**, not merely discouraged: a
photograph of a classroom is a claim that cohorts have run. The same rule that
rejected the AI portrait in `Reference Material/` applies to every slot here.

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

## Implemented

| Location | Slots | Ratio | Why here |
|---|---|---|---|
| `app/page.tsx` → "Live means live" | 4 (one per delivery format) | 4:3 | **The portal's highest-value image slot.** The section makes the central claim — *you are in the room with a practitioner* — and proved it with a text grid alone |
| `app/trainers/[slug]` → community impact | 3 | 3:2 | Community reach is stated purely as numbers. Per the brief these photographs most likely **already exist** rather than needing a shoot |

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
