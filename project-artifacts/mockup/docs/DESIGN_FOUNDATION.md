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
- **Primary** — deep **capability indigo** (light `#3d43b8` / night+dark
  `#9aa3ff`), used for all actions/links. *(Was blue-teal until the
  2026-08-31 visual redesign — see Palette below.)*
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

### Typography (updated 2026-09-02 — IBM Plex adopted portal-wide)

The portal is set in the **IBM Plex superfamily** — Plex Serif, Plex Sans
and Plex Mono — self-hosted at build time via `next/font` in
`app/layout.tsx`. No runtime font service and no new package. System
stacks remain as fallbacks in `--font-display` / `--font-body` /
`--font-mono`.

**The allocation is sans-led, and the serif is reserved.** This is
deliberate and it inverts the 2026-08-31 arrangement, where every display
role was serif: a serif on every heading of every page spends its
authority until it carries none. The serif now appears in exactly two
places —

| Serif (`--font-display`) | Everything else |
|---|---|
| `.text-display-xl` — used on **one element in the whole portal**, the P01 hero | `.text-display-lg`, `.text-display`, `.text-h1`, `.text-h2` → Plex Sans 600 |
| `.wordmark` — the masthead, on every page | Body, labels → Plex Sans |

Rationale and the rejected directions: `docs/design/TYPOGRAPHY_STRATEGY.md`
(Direction C); the adoption record is §15 of that document.

**Two traps here, both hit in practice:**

1. The sans-led allocation is written **into the base type-scale
   definitions**, not layered on top as override rules. `.text-mono` is
   defined *after* the display roles at *equal* specificity, so
   `text-mono text-display` (the pricing figure, the trainer
   community-impact stats) still resolves to mono. A more specific
   override would break those silently.
2. Plex Mono is loaded at **600** only because that same combination
   inherits the display weight. Without the 600 cut the browser
   synthesises a faux bold, which smears a monospace face.

Superseded: the original "system fonts only" simplification, and the
Newsreader + Inter pairing that replaced it.

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

**CSS layer/specificity traps in the type scale.** Three related gotchas,
all found by measuring rather than reading — each produces a *silent*
wrong result, never an error:

1. **`.text-label` outranks Tailwind colour utilities.** It sets
   `color: var(--color-ink-faint)` itself, and because `globals.css`
   declares it outside any cascade layer while Tailwind's utilities live
   *inside* one, the unlayered rule wins regardless of source order.
   `className="text-label text-[var(--color-primary)]"` renders faint,
   not primary. Recolour with an inline `style` or a more specific rule.
   The same applies to any other custom class here that sets a property a
   utility might also set.
2. **`.text-mono` and the display roles are order-dependent.**
   `.text-mono` is declared *after* `.text-display*` at *equal*
   specificity, so `text-mono text-display` resolves to mono — which is
   what the pricing figures and the trainer community-impact stats rely
   on. Adding a more specific display rule (e.g. a scope class) inverts
   that and silently turns them sans. The 2026-09-02 typography rollout
   deliberately edited the base definitions in place rather than layering
   overrides, for exactly this reason.
3. **Combined classes inherit weight across families.** `text-mono
   text-display` takes the display role's weight 600, so Plex Mono must
   be *loaded* at 600 or the browser synthesises a faux bold — which
   smears a monospace face. Check the `next/font` weight array whenever a
   role's weight changes.

**`--color-ink-faint` fails WCAG 2.2 AA.** `#7a8091` on `--color-ground`
`#faf8f4` measures **3.72:1**, below the 4.5:1 required for body-size
text. It is used for `.text-label`, captions and de-emphasised metadata.
A fix to `#6b7183` (4.59:1) was implemented once and lost when an
unrelated batch was reverted (`93217e0` → `f7f826a`); it has not been
re-applied. **This is a defect, not a style preference** — it is Phase 0
of the governance roadmap and is explicitly exempt from founder taste
review. Fix it standalone.
