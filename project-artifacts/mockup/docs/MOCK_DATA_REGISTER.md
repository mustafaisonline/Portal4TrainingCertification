# Mock Data Register — REAL vs FAKED

Kept to meaningful product claims only, per the approval message's
adjustment — not a log of trivial simulated UI behaviour. If it's not
listed here, assume any number, name, or outcome shown on `P01`/`P05`/`P06`
is illustrative placeholder content, not a claim about the real product.

*Updated 2026-08-31 for the P01 redesign (expert-led model). `P05`/`P06`
rows describe the still-unreconciled pre-DR-02 baseline.*

| Behaviour | Status | What's actually happening |
|---|---|---|
| **Practitioner on `P01`, `/trainers` and `/trainers/[slug]`** (`data/practitioners.ts`, `public/experts/`) | **REAL** | Genuine person, genuine photograph, and profile content drawn only from the founder's own résumé, authorized public profiles, and (founder-directed, 2026-08-31) his published bio at yourpartnertechnologies.com — which is why named past engagements (PETRONAS Digital, Hong Leong Bank), book titles and his frameworks now appear as his own published claims. Still omitted: current employer/role (`HO-14` — sources conflict) and volatile counts. **No practitioner may ever be fabricated, including in fixture data** (DR-02 §7). The profile explicitly claims no Academy programme-delivery history until cohorts have really run |
| Programme inventory on `P01` | **None shown — deliberately** | State A of the P01 specification §10: no programme names, dates, capacities, locations or prices exist yet, so none are displayed or faked. "The first programmes are being finalised" is the honest claim |
| Rubric fragment on `P01` (`H7`) | **Illustrative — format only** | Mirrors the `K06` wireframe in the approved Mockup Specification (criterion + the four level names). The real rubric is not yet authored; when it is, the fragment must come from it (`MVP_BUILD_SPEC` §11.2 — never fake the rubric) |
| Team capability heatmap on `P01` (`H8`) | **FAKED / illustrative** | A static grid of proficiency-scale colours with no underlying data, labelled "Illustrative" in the UI and hidden from assistive tech |
| Inert CTAs on `P01` ("Register your interest" · "Talk to us about your team" · "Sign in") | **Inert** | `href="#"` — no destination exists yet (`P19`, auth, and registration are unbuilt). Rendered for journey completeness per mockup convention |
| Nav anchors (`/#programmes` etc.) | **Simulated navigation** | `P24`/`P10`/`P17`/`P15` do not exist; navigation routes to the P01 sections that represent those concepts |
| Diagnostic question sequence (`P05`) | **FAKED** | A fixed, linear list of 10 hand-written questions (`data/questions.ts`). Not adaptive, not branching. Real adaptive/branching logic is production business logic and out of scope for a mockup |
| Diagnostic scoring / result personalisation (`P06`) | **FAKED** | Two canned result fixtures (`data/results.ts`). Which is shown is picked by `selectFixture()` — a visible, trivial rule that exists only to make the walkthrough feel responsive. **Must never be mistaken for or evolved into a real scoring engine.** ⚠ `P06` also still renders retired path/milestone vocabulary — pre-DR-02 baseline, pending separately authorized reconciliation |
| "Compared to your target role" targets (`P06`) | **FAKED** | Three illustrative role profiles in `data/roles.ts` |
| Diagnostic in-progress persistence | **Simulated, approved boundary** | `localStorage` key `mockup:diagnostic:in-progress`, raw answers only, never authoritative, cleared on completion. The one approved localStorage use |
| Theme toggle | **Ephemeral, not persisted** | Sets `data-theme` in memory only; deliberately avoids localStorage. A review affordance, not a product feature |

## What is real

- The **practitioner** — see the first row. This is the register's most
  important entry: on an expert-led product, the expert is the one thing
  that must never be simulated.
- The design tokens, type scale, and component contract (`components/`,
  `app/globals.css`).
- The screen structure and content hierarchy — `P01` from
  `docs/design/P01_HOMEPAGE_REDESIGN_SPECIFICATION.md`; `P05`/`P06` from
  the (pre-correction) Mockup Specification §4.

## Removed from this register

- *Domain course counts* — the counts themselves were retired from the
  product (DR-02); `data/domains.ts` no longer carries them.
- *Knowledge library article cards* — the three fabricated titles were
  removed from `P01` (omit-rather-than-fill); no article surface remains
  in the mockup.
- *Proof band numbers* — the honest empty-state survives as `H9`; still
  no numbers, real or fake.
