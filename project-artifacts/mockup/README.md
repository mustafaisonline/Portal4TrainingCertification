# Mockup / Wireframe — Data & AI Academy Portal

> ## ⚠ RECONCILIATION STATUS — read before changing anything
>
> **The product direction was corrected on 2026-08-31** by [`DR-02_EXPERT_LED_DELIVERY_MODEL.md`](../../DR-02_EXPERT_LED_DELIVERY_MODEL.md), and all three root specifications were reconciled with it. This mockup is now **partially reconciled**:
>
> | | |
> |---|---|
> | **`P01` Homepage + `PublicShell`** | ✅ **Redesigned 2026-08-31** under the corrected model, following [`docs/design/P01_HOMEPAGE_REDESIGN_SPECIFICATION.md`](../../docs/design/P01_HOMEPAGE_REDESIGN_SPECIFICATION.md). Decisions recorded in [`docs/P01_DESIGN_DECISIONS.md`](docs/P01_DESIGN_DECISIONS.md) |
> | **`P05`/`P06` Diagnostic + placeholder** | ⚠ Still the **pre-DR-02 baseline** — `P06` in particular still renders retired path/milestone vocabulary. **Intentional and expected**; reconciling them is a separate stage requiring its own authorization |
> | **What is current** | [`DATA_AI_ACADEMY_PORTAL_MOCKUP_SPECIFICATION.md`](../../DATA_AI_ACADEMY_PORTAL_MOCKUP_SPECIFICATION.md), as corrected. It is the specification; this is not |
>
> **Do not silently "fix" the remaining divergence as a side effect of an unrelated task.** Bringing `P05`/`P06` into line with the corrected specification is deliberate, authorized work — not tidying.
>
> ### ⚑ Specifically: the Diagnostic is NOT retired
>
> `P05`/`P06` and the **"Start free diagnostic (10 min)"** CTA on `P01` **remain valid and must not be removed.** DR-02 retired the *self-paced learning model*; it did **not** retire the diagnostic. The capability survives with a **reframed role** — a capability assessment that can lead toward relevant programmes and scheduled offerings, and the entry offer for a corporate engagement.
>
> **Do not infer "self-paced was retired, therefore the diagnostic should go."** That inference is explicitly unauthorized. On the redesigned `P01` the CTA appears exactly twice — as the third pathway ("Assess your capability") and in a supporting band — per the P01 specification §9.

**This is a disposable, isolated artifact. It is not the production application.**

It exists to validate product structure, user journeys, navigation, information
hierarchy, and visual direction against
[`DATA_AI_ACADEMY_PORTAL_MOCKUP_SPECIFICATION.md`](../../DATA_AI_ACADEMY_PORTAL_MOCKUP_SPECIFICATION.md)
before any of it is treated as a production decision. Nothing in this folder —
code, structure, or dependency choices — carries forward automatically. See
the root [`CLAUDE.md`](../../CLAUDE.md) for the governance this artifact
operates under, and `docs/execution/` at the repository root for the
*separate, unrelated* production "Walking Skeleton" Milestone 1 — the two
are not connected.

## What this is not

- Not the production Next.js application (there isn't one yet).
- No database, no authentication, no server actions, no API routes.
- No real business logic: no adaptive diagnostic scoring, no skill-graph
  computation, no credential rules. See [`docs/MOCK_DATA_REGISTER.md`](docs/MOCK_DATA_REGISTER.md)
  for exactly what is simulated and how.

## Status: Mockup Milestone 1 + P01 redesign + programmes/trainers

Screens now built:

| Route | State |
|---|---|
| `/` (`P01` Homepage) | Redesigned 2026-08-31 for the expert-led model; typography adopted 2026-09-02 |
| `/programmes`, `/programmes/[slug]` | Seven **genuine** programmes migrated from the founder's existing training ecosystem, with his published pricing |
| `/trainers` | Redesigned 2026-09-02 as the single trainer surface — directory, selection standard, published work. **Genuine people only.** The per-trainer profile route was retired the same day; cards link out to the trainer's own published profile |
| `/diagnostic`, `/diagnostic/result` (`P05`/`P06`) | ⚠ Still the **pre-DR-02 baseline** — see the reconciliation notice above |
| `/journey-placeholder` | Labelled next-stage placeholder |

The whole portal is set in **IBM Plex** (adopted 2026-09-02, sans-led — the
serif is reserved for the P01 hero and the masthead alone).

See [`docs/DESIGN_FOUNDATION.md`](docs/DESIGN_FOUNDATION.md) for the
token/component contract these screens are built on, and
[`docs/P01_DESIGN_DECISIONS.md`](docs/P01_DESIGN_DECISIONS.md) for why the
homepage looks the way it does.

## Running it locally

```bash
cd project-artifacts/mockup
npm install
npm run dev
```

Then open `http://localhost:3000`. From the repository root, this is also
registered as the `mockup` configuration in `.claude/launch.json`.

## Structure

```
app/                      Next.js App Router pages (P01, P05, P06, programmes hub + detail, trainers index + profile, placeholder)
components/ui/            Button, Chip, Card (the three card types)
components/signature/     DiagnosticQuestionCanvas, SkillMeter (scoped to this milestone)
components/PublicShell.tsx  Global public header/footer (§4)
components/TrainerCard.tsx  Reusable trainer card (P01 + /trainers; genuine people only)
components/ProgrammeCard.tsx Reusable programme card (P01 + /programmes + related rails)
components/ImageFrame.tsx   Reserved photography — labelled empty slot, or the real image
app/icon.svg                Favicon
app/opengraph-image.tsx     1200x630 social share card, generated at build by next/og
assets/fonts/               Build-time TTFs for the OG card only — NOT served to browsers
data/                     Fixtures — programmes (REAL, incl. pricing), practitioners (REAL data only), capability areas, diagnostic questions, result fixtures, role targets
public/experts/           Genuine practitioner photography (never AI-generated or stock)
public/books/             The founder's own published book-cover artwork
docs/                     DESIGN_FOUNDATION.md, MOCK_DATA_REGISTER.md, FINDINGS.md,
                          P01_DESIGN_DECISIONS.md, PROGRAMME_CONTENT_MIGRATION.md,
                          IMAGE_SLOTS.md
```

## Continuing this work in a new session

Read, in order: this file → `docs/DESIGN_FOUNDATION.md` →
`docs/MOCK_DATA_REGISTER.md` → `docs/FINDINGS.md` →
`docs/P01_DESIGN_DECISIONS.md` → `docs/PROGRAMME_CONTENT_MIGRATION.md`.
Together they explain what exists, what every token and component means,
what is simulated, and what was discovered and decided along the way —
without needing this conversation's history.

At the repository root, `docs/design/` adds the governing layer:
`P01_HOMEPAGE_REDESIGN_SPECIFICATION.md` (what P01 must communicate, plus
the `HD-*`/`HO-*` registers), `VISUAL_REFINEMENT_GOVERNANCE.md` (the design
rules and the binding lesson from the reverted audit batch) and
`TYPOGRAPHY_STRATEGY.md` (the faces, why, and the adoption record).

**Two things a new session should know immediately:** `--color-ink-faint`
**fails WCAG AA** and the fix is still unapplied (`DESIGN_FOUNDATION.md`,
"Known issues and fixes"); and visual/taste changes are **founder-gated in
small, revertible diffs** — a batch of ten was implemented once and
rejected wholesale.
