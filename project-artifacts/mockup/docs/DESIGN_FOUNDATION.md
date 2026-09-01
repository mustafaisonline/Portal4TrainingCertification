# Design Foundation — Mockup Milestone 1

The token and component contract every screen in this milestone is built on.
Source of truth for the values: `../app/globals.css` (tokens, type scale) and
`../components/`. This document explains *why*, the code has the *values* —
update both together when either changes.

Grounded in `DATA_AI_ACADEMY_PORTAL_MOCKUP_SPECIFICATION.md` §16 (design
direction) and §19 step 0 (build sequence).

## Scope

Built for exactly what `P01`, `P05`, and `P06` need. Not a complete design
system — see "Deferred" below for what was deliberately left out.

## Tokens (`app/globals.css`)

All colour/spacing/radius/type tokens are plain CSS custom properties on
`:root` — see "Known issues and fixes" below for why `:root`, not Tailwind's
`@theme`. Full light and dark values are defined together in the same file so
they can't drift apart.

- **Ground / Ink / Line** — 2–4 steps each, warm off-white / near-black, never
  pure `#fff`/`#000` (§16.6).
- **Primary** — deep blue-teal, used for all actions/links.
- **Accent** — warm ember. Defined but **not used anywhere in this
  milestone** — it's reserved for credential/achievement moments (`K10`
  and similar), which are out of scope here.
- **Semantic** (success/warning/danger/info) — defined but likewise unused
  in this milestone; no error or status states exist on `P01`/`P05`/`P06`.
- **Proficiency scale** (`--color-prof-1..5`) — a separate 5-step family
  from semantic colour, used by `SkillMeter` and the `P01` heatmap teaser.
  Low proficiency is deliberately *not* coloured as an error.
- **Radius** — one per card type: `--radius-plate` (8px), `--radius-panel`
  (12px), `--radius-feature` (16px).
- **Type scale** — named utility classes (`.text-display-lg`, `.text-h1`,
  `.text-label`, `.text-mono`, etc.) in `globals.css`, not ad hoc sizes in
  components. `.text-display-lg`/`.text-display` step down at ≤640px (see
  Findings — the fixed size otherwise overruns a phone screen).

### Typography (updated 2026-08-31 — visual redesign)

Display roles now use **Newsreader** (editorial serif, weight 500) and
UI/body uses **Inter**, both self-hosted at build time via `next/font` in
`app/layout.tsx` — no runtime font service and no new package. The system
stacks remain as fallbacks in `--font-display` / `--font-body`. The
earlier "system fonts only" simplification is superseded. Mono stays a
system stack.

### Palette (updated 2026-08-31 — visual redesign)

The primary family moved from blue-teal to **capability indigo** (light
`#3d43b8` / night+dark `#9aa3ff`), and the proficiency ramp was re-derived
on the same hue. A scoped **`.night` class** in `globals.css` redefines
the token set for deep-navy editorial sections (used by P01, the header
and the footer); because components read tokens, everything restyles
automatically inside it. Night sections hold in both light and dark
themes — identity, not theming.

## Components

### `components/ui/` — always reused, never one-off

- **Button** — `primary` / `secondary` / `text` variants, renders as
  `<Link>` when given `href`.
- **Chip** — small-caps annotation label (domain tags, role selector).
- **Card** — the three card types (§16.3) as one component's `variant`
  prop (`plate` / `panel` / `feature`), not three separate components.
  Convention (not enforced in code): never nest same-type cards; `feature`
  appears at most once per screen.

### `components/signature/` — scoped to this milestone (Decision 3)

- **DiagnosticQuestionCanvas** (`P05`) — one question, options plus an
  equal-weight "I'm not sure", Back/Continue. Built per the approval
  message's Decision 3.
- **SkillMeter** (`P06`) — horizontal bars on the proficiency scale, with
  an optional `target` profile marker for the "compared to your target
  role" section. A minimal version, not the full signature-component
  treatment (radar option, drill-through) implied by the spec's `SkillMeter`
  — built only as far as `P06` needs it.

**Deferred, not built:** `CredentialCard`, `MilestoneTimeline` (full),
`RubricPanel`, `HeatmapGrid`. `P01`'s heatmap teaser is a static illustrative
grid, not the `HeatmapGrid` signature component.

### Screen-specific markup — deliberately not abstracted

Per the approval message's component-reuse adjustment, one-off sections
(the hero, the three-doors grid, the proof band, the knowledge-library
cards on `P01`) are written directly in each page rather than wrapped in
bespoke components. None of them is reused more than once in this
milestone; abstracting them now would be premature.

## Theming

Light and dark are both first-class (§16.6, §19 step 0), driven by
`prefers-color-scheme` by default and overridable via `data-theme` on
`<html>`. A small `ThemeToggle` (bottom-right, hidden below the `sm`
breakpoint) flips it for review purposes only — see
`docs/MOCK_DATA_REGISTER.md` for why it deliberately does not use
localStorage.

## Known issues and fixes

**Tailwind v4 silently drops unused `@theme` tokens.** Tokens were
originally declared inside Tailwind v4's `@theme { … }` block. Tailwind v4's
content scanner only keeps a theme-declared CSS custom property in its
compiled output if it sees that property referenced inside a utility-class
candidate string (e.g. `bg-[var(--color-primary)]`). Tokens referenced only
from a plain inline `style` — as the proficiency scale is, wherever it's
plotted outside a Tailwind class — are invisible to that scanner and were
silently omitted from the compiled CSS. Found while building `P01`'s
heatmap teaser: the swatches rendered fully transparent. **Fix:** the whole
token block is now plain `:root { … }` CSS (see `app/globals.css`), which
Tailwind never purges, while remaining just as usable via `var(--token)` in
both inline styles and Tailwind arbitrary values. Any future addition to the
token set should go in that same `:root` block, not a new `@theme` block.
