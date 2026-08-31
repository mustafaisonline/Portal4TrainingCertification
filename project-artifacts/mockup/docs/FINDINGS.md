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

**Status:** Not a conflict requiring resolution now — a launch-scope
decision (how many domains to populate for real) versus a mockup-scope
decision (how many tiles to show while validating the concept). Flag for
the founder before this becomes a production catalogue decision.
