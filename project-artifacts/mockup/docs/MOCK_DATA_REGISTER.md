# Mock Data Register — REAL vs FAKED

Kept to meaningful product claims only, per the approval message's
adjustment — not a log of trivial simulated UI behaviour. If it's not
listed here, assume any number, name, or outcome shown on `P01`/`P05`/`P06`
is illustrative placeholder content, not a claim about the real product.

| Behaviour | Status | What's actually happening |
|---|---|---|
| Diagnostic question sequence (`P05`) | **FAKED** | A fixed, linear list of 10 hand-written questions (`data/questions.ts`). Not adaptive, not branching. Real adaptive/branching logic is production business logic and is explicitly out of scope for a mockup. |
| Diagnostic scoring / result personalisation (`P06`) | **FAKED** | Two canned result fixtures (`data/results.ts`, `resultFixtures.A` / `.B`). The diagnostic does not compute a score. Which fixture is shown is picked by `selectFixture()` — a single, visible, non-authoritative rule (≥3 "I'm not sure" answers → fixture B, otherwise A) that exists only to make the walkthrough feel responsive. **This must never be mistaken for or evolved into a real scoring engine without an explicit decision to build one.** |
| Domain course counts (`P01`) | **FAKED** | Placeholder integers in `data/domains.ts`. No course catalogue exists yet. |
| Proof band numbers (`P01`) | **Not shown** | Deliberately replaced with an honest empty-state message ("first cohorts are being assembled") rather than any number, real or fake — per §4 P01's own warning that a padded stat band destroys trust. |
| Skills heatmap teaser (`P01`) | **FAKED / illustrative** | A static grid of proficiency-scale colours with no underlying data, explicitly labelled "Illustrative" in the UI. Not the `HeatmapGrid` signature component. |
| "Compared to your target role" targets (`P06`) | **FAKED** | Three illustrative role profiles in `data/roles.ts`. Not derived from any real role-profile data. |
| Knowledge library article cards (`P01`) | **FAKED** | Three hand-written titles with invented version stamps. No knowledge library exists yet. |
| Diagnostic in-progress persistence | **Simulated, approved boundary** | `localStorage` under the key `mockup:diagnostic:in-progress`, holding only the raw in-progress answers — never a computed result, never read anywhere as authoritative. This is the one approved use of `localStorage` in this milestone (approval message, adjustment #3): prototype UX continuity only (resuming an in-progress diagnostic), not business state. Cleared on completion. |
| Theme toggle | **Ephemeral, not persisted** | Sets `data-theme` on `<html>` in memory only. Deliberately does **not** touch `localStorage`, to stay unambiguously outside the approved boundary above — it's a review affordance, not a product feature. |
| "Save results" / "Email me the report" / nav links beyond the diagnostic CTA | **Inert** | Rendered for layout completeness; they don't do anything. No page exists behind them in this milestone. |

## What is real

- The design tokens, type scale, and component contract (`components/`,
  `app/globals.css`) — this is the actual proposed foundation, not a
  simulation of one.
- The screen structure and content hierarchy — built directly from
  `DATA_AI_ACADEMY_PORTAL_MOCKUP_SPECIFICATION.md` §4 (`P01`, `P05`, `P06`),
  not invented.
