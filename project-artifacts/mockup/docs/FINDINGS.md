# Findings — Mockup Milestone 1

Discovery → founder review → root-spec update (where needed), per the
approved flow (approval message, "Documentation-Driven Development Model").
Each entry states what was found, the working decision taken to keep
building, and whether it still needs founder sign-off or a root-spec change.

---

## F1 — `P06`'s anonymous/blurred variant deferred

**Found:** §4 P06 describes an "anonymous variant" that partially blurs the
capability profile and named gaps behind a "create a free account to
unlock" prompt. Building it meaningfully requires `S02` Sign Up, which is
explicitly out of scope for Mockup Milestone 1.

**Working decision:** Ship only the full (post-unlock-equivalent) `P06`
experience in this milestone. Blurring the exact content this milestone
exists to validate (§19 step 1: "does `P06` produce a 'how did you know
that?' reaction") would undermine the validation itself before `S02` even
exists to make the blur meaningful.

**Status:** Sequencing decision, not a product-rule change — no root spec
update needed. Build the anonymous/blurred variant when `S02` Sign Up is
built (§19 step 2).

---

## F2 — Mobile hero text overran the first screen

**Found:** `P01`'s hero used the fixed 3rem/2.25rem display sizes from the
type scale unconditionally. At a 375px viewport, the headline alone took
close to a full screen height, pushing the primary CTA below the fold and
overlapping the (dev-only) theme toggle with body copy.

**Resolution:** Added a `max-width: 640px` step-down for `.text-display-lg`
and `.text-display`, and hid the theme toggle below the `sm` breakpoint.
Verified at the mobile preset (375×812) after the fix.

**Status:** Fixed. Pattern (step down display sizes below 640px) should
carry forward to every future screen using these classes.

---

## F3 — `P01` shows all five domains, not the three §20.2 recommends for launch

**Found:** §20.2's "unnecessary complexity" review recommends showing only
3 domains at real launch (DF, GA, and Literacy as its own product) because
most of the other cells would be empty in the real catalogue. §4's `P01`
spec, read on its own, describes five domain tiles.

**Working decision:** This milestone shows all five, because the thing
being validated here is the *information architecture and differentiation
concept* (does the five-domain model read clearly?), not real catalogue
depth — the mockup has no real course counts behind any tile regardless of
how many are shown. §20.2's concern is about launching an IA that
*advertises real emptiness*, which doesn't apply to a fixture-data mockup.

**Status:** ⊘ **SUPERSEDED (2026-08-31).** DR-02 §4.1 retired the
catalogue framing this finding argued within, and the P01 redesign
replaced domain tiles with count-free capability areas whose launch scope
is an explicitly open decision (P01 spec `HO-3`). Retained for
traceability only.

---

## F4 — Programme card specification rows read ragged and misaligned

**Found:** Reported twice by the founder, with a screenshot, after the
first fix proved incomplete. Two independent causes, both measured in the
browser rather than inferred:

1. **Mixed treatments in one list.** `Duration` and `From` used
   `text-mono` at an off-scale `0.8rem` (12.8px) while `For` and
   `Delivery` inherited sans at `0.9375rem` (15px). One `<dl>`, two faces,
   two sizes.
2. **Baseline and cross-card drift.** The rows were a flex layout at
   `align-items: normal`, so 12px/16.8px labels sat ~3.6px above their
   15px/24px values. And because rows were auto-height, a card whose "For"
   value wrapped to two lines pushed its later rows out of step with its
   neighbours' — measured at y=3519/3549/3579 on card 1 against
   3495/3525/3579 on cards 2–3.

**Resolution:** Replaced the flex rows with a CSS grid —
`grid-cols-[68px_minmax(0,1fr)]`, `items-baseline`, and
`[grid-auto-rows:minmax(2.75rem,auto)]` sized for two wrapped lines at the
value's `leading-snug`, so a wrap no longer changes row height. All
values now use one face at one scale size; the price earns emphasis
through colour and weight alone. Verified aligned at 1440px, 820px and
375px.

**Status:** Fixed (`e83fa09`). The pattern — *uniform minimum row height
whenever equivalent rows must line up across sibling cards* — should carry
to any future card with a specification block. The mono "measured voice"
stays reserved for the rubric, IDs and full pricing figures, where its
scarcity means something.

---

## F5 — The rubric block read as machine output

**Found:** Founder report on the `H7` certification section: *"below text
looks very machine genereated."* The cause was construction, not wording.
The block was a single monospace `<p>` built from `<br />` line breaks,
`&nbsp;&nbsp;` for column spacing, and `○` / `◉` characters standing in
for radio buttons — **ASCII art imitating a form, set in a terminal
face.** Every signal it sent said "terminal output", so no amount of
rewriting the sentence would have fixed it.

**Resolution:** Rebuilt as an actual assessment instrument: an `<ol>` grid
of the four levels with CSS-drawn bars, the criterion named in the UI
face, and a caption. The awarded level is carried by **weight + a filled
bar + the word "Awarded"**, so colour is never the sole carrier of
meaning.

**Status:** Fixed (`dc39dc8`). **No assessor prose was invented** — the
real rubric is still unwritten and must never be faked (MVP spec §11.2).
The block is framed as illustrative of *format* only, and must be
replaced by the genuine published rubric when it exists.

**General lesson:** when something "looks AI-generated", check what the
markup *is* before rewriting what it *says*. Characters imitating UI
controls, and monospace used decoratively rather than for genuinely
tabular or machine content, are reliable tells.
