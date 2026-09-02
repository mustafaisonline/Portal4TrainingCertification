# Mock Data Register — REAL vs FAKED

Kept to meaningful product claims only, per the approval message's
adjustment — not a log of trivial simulated UI behaviour. If it's not
listed here, assume any number, name, or outcome shown on `P01`/`P05`/`P06`
is illustrative placeholder content, not a claim about the real product.

*Updated 2026-08-31 for the P01 redesign (expert-led model). `P05`/`P06`
rows describe the still-unreconciled pre-DR-02 baseline.*

| Behaviour | Status | What's actually happening |
|---|---|---|
| **Practitioner on `P01`, `/trainers` and `/trainers/[slug]`** (`data/practitioners.ts`, `public/experts/`, `public/books/`) | **REAL** | Genuine person, genuine photograph, and profile content drawn only from the founder's own résumé, authorized public profiles, and (founder-directed, 2026-08-31) his published bio at yourpartnertechnologies.com — including its exact embedded URLs (five Amazon book links, the Medium frameworks article, YouTube/Spotify podcast channels, eight social profiles) and his own book-cover artwork copied to `public/books/`. Community metrics (40,000+ members, 5,000+ followers, 80+ episodes) are **reproduced as the founder publishes them** — his direction to implement that section constitutes the founder confirmation the earlier Tier-2 caution required, and the page labels them "figures as published by the trainer". Still omitted: current employer/role (`HO-14` — sources conflict). **No practitioner may ever be fabricated, including in fixture data** (DR-02 §7). The profile explicitly claims no Academy programme-delivery history until cohorts have really run |
| **Programme catalogue** (`data/programmes.ts`, `/programmes`, `/programmes/[slug]`, `P01` preview) | **REAL** | Seven genuine programmes migrated 2026-08-31 from the founder's existing training ecosystem at yourpartnertechnologies.com — real programme names, audiences, learning outcomes, curricula and pedagogy, previously authored by him. Provenance and mapping in [`PROGRAMME_CONTENT_MIGRATION.md`](PROGRAMME_CONTENT_MIGRATION.md) |
| Programme **prices** | **REAL — migrated 2026-09-01** | The founder's own published pricing for all seven programmes, across all three published regions (Malaysia RM · Pakistan Rs. · International USD), recovered from the source's client-side `js/main.min.js` and reproduced verbatim. **These are time-limited launch offers and will date** — the page says so. No checkout is implied; payment is not built (ADR-014/OQ-2), so every CTA is an enquiry. See [`PROGRAMME_CONTENT_MIGRATION.md`](PROGRAMME_CONTENT_MIGRATION.md) "Pricing migration" |
| Programme **dates / scheduled offerings** | **None shown — deliberately** | The source publishes none and none may be invented (DR-02 §4.1). Programmes are the proposition layer; offerings remain State A, which keeps `HO-1` open |
| Rubric fragment on `P01` (`H7`) | **Illustrative — format only** | Mirrors the `K06` wireframe in the approved Mockup Specification (criterion + the four level names). Rebuilt 2026-09-02 as a real four-level scale that **shows one level marked "Awarded"** — a depiction of how a completed assessment looks, not a record of one; the block is labelled as such and **no assessor reasoning was written**. The real rubric is not yet authored; when it is, the fragment must come from it (`MVP_BUILD_SPEC` §11.2 — never fake the rubric) |
| **Reserved photography slots** (`components/ImageFrame.tsx` — 12 across P01, the trainer profile, the programmes hub and programme detail) | **Honestly empty** | Labelled frames reading "Photograph needed", carrying the subject and shoot spec. **Not images, and not pretending to be** — no stock, no AI-generated, no plausible substitute, because a photograph of a classroom would claim delivery that has not happened. A slot fills by passing `src`; see [`IMAGE_SLOTS.md`](IMAGE_SLOTS.md) |
| **Open Graph card** (`app/opengraph-image.tsx`) | **REAL — typographic** | Generated at build from the portal's own wordmark, hero line and positioning facts. Contains no photograph and no metric, so nothing in it can date or overclaim. ⚠ `metadataBase` still points at localhost until a real domain exists |
| Team capability heatmap on `P01` (`H8`) | **FAKED / illustrative** | A static grid of proficiency-scale colours with no underlying data, labelled "Illustrative" in the UI and hidden from assistive tech |
| Inert CTAs on `P01` ("Register your interest" · "Talk to us about your team" · "Sign in") | **Inert** | `href="#"` — no destination exists yet (`P19`, auth, and registration are unbuilt). Rendered for journey completeness per mockup convention |
| Nav anchors (`/#programmes` etc.) | **Simulated navigation** | `P24`/`P10`/`P17`/`P15` do not exist; navigation routes to the P01 sections that represent those concepts |
| Diagnostic question sequence (`P05`) | **FAKED** | A fixed, linear list of 10 hand-written questions (`data/questions.ts`). Not adaptive, not branching. Real adaptive/branching logic is production business logic and out of scope for a mockup |
| Diagnostic scoring / result personalisation (`P06`) | **FAKED** | Two canned result fixtures (`data/results.ts`). Which is shown is picked by `selectFixture()` — a visible, trivial rule that exists only to make the walkthrough feel responsive. **Must never be mistaken for or evolved into a real scoring engine.** ⚠ `P06` also still renders retired path/milestone vocabulary — pre-DR-02 baseline, pending separately authorized reconciliation |
| "Compared to your target role" targets (`P06`) | **FAKED** | Three illustrative role profiles in `data/roles.ts` |
| Diagnostic in-progress persistence | **Simulated, approved boundary** | `localStorage` key `mockup:diagnostic:in-progress`, raw answers only, never authoritative, cleared on completion. The one approved localStorage use |
| Theme toggle | **Ephemeral, not persisted** | Sets `data-theme` in memory only; deliberately avoids localStorage. A review affordance, not a product feature |

## Binding rule — no licensed imagery (founder direction, 2026-09-02)

**Every image published in this portal must be ours to publish.** No stock
libraries (free tiers included), no third-party licensed photography, no
imagery whose rights sit elsewhere. Acceptable: photographs the founder or
Academy took or commissioned, the founder's own artwork, photographs supplied
with the subject's consent, and original graphics authored for this portal.

This is **broader than the anti-fabrication rule** and catches things it does
not — the DAMA/CDMP material in the reference archive is genuine but
third-party licensed, and may not be reproduced. **When in doubt the slot
stays empty.** See [`IMAGE_SLOTS.md`](IMAGE_SLOTS.md).

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
