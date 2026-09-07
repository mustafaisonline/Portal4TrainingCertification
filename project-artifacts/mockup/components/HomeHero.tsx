import Link from "next/link";
import Image from "next/image";
import { assetPath } from "@/lib/basePath";
import { practitioners } from "@/data/practitioners";
import styles from "./HomeHero.module.css";

/**
 * P01 — Homepage hero + learning-journey strip.
 *
 * REBUILT 2026-09-05 from a founder-supplied reference architecture
 * (hero-section-reference.css: an exact DOM contract, design tokens,
 * layout, layering and five responsive breakpoints) with an explicit
 * instruction not to redesign it — implement it, adapting only colours and
 * fonts to the portal's existing tokens where a direct equivalent exists.
 * The CSS lives in HomeHero.module.css, ported near-verbatim from that
 * blueprint; this file supplies the DOM it targets, using this component's
 * own real content (copy, icons) in the slots the blueprint left generic.
 *
 * WHAT WAS ADAPTED, AND WHY (per the blueprint's own instruction to adapt
 * "only where necessary to maintain consistency with the current portal"):
 * - Colour tokens: the blueprint's --hero-text/-soft/-muted map onto this
 *   portal's existing --color-ink/-quiet/-faint (already near-identical
 *   values); its five accent hues (indigo/purple/blue/cyan/orange) map onto
 *   the four --color-hero-* tokens already established for this exact
 *   component in globals.css, rather than introducing a second, redundant
 *   accent palette.
 * - Fonts: the headline uses var(--font-display) (the portal's real,
 *   self-hosted serif, already reserved for exactly this hero) instead of
 *   the blueprint's generic "Georgia" stack; the handwritten annotations
 *   use var(--font-hand) (a real self-hosted handwriting font) instead of
 *   its "Bradley Hand / Comic Sans" fallback stack.
 * - Icons: the blueprint left icon slots generic (font-size on a circle,
 *   no asset specified). Filled with this file's own original inline SVG
 *   glyphs (no icon library, no stock/AI asset) rather than emoji or an
 *   icon font.
 * - Layout, spacing, positioning, breakpoints, animations and the DOM
 *   hierarchy itself are otherwise preserved as specified.
 *
 * STRUCTURAL NOTE — the journey strip moved back inside the hero: an
 * earlier session request (2026-09-05) had pulled the learning-journey
 * band OUT of the hero into its own section (`LearningJourney`, rendered
 * separately in app/page.tsx). This blueprint's own DOM contract nests
 * `.hero-journey` back inside `.hero__inner` as an absolutely-positioned
 * strip — `.hero__inner`'s bottom padding (170px) is sized specifically to
 * make room for it there. Implementing the blueprint "as given" therefore
 * reverses that earlier extraction; `LearningJourney` and its separate
 * export are gone, and app/page.tsx no longer renders it apart from
 * `<HomeHero />`. Flagged in session rather than done silently — worth
 * confirming this is what's wanted if it wasn't intentional.
 *
 * - 2026-09-05, later still: founder asked for the laptop removed from the
 *   hero. `.hero-laptop` (screen, brand row, sidebar, "words", planet
 *   graphic, base) is gone, along with the "Same Laptop. A Bigger Future."
 *   annotation — kept, it would have read as a stray reference to an
 *   object no longer in the composition. The corresponding CSS rules were
 *   removed from HomeHero.module.css rather than left as dead code. The
 *   four cards and the "Work From Anywhere" note are unchanged; the centre
 *   of the composition is now open space, matching the blueprint's own
 *   "empty space is intentional" guardrail.
 *
 * - 2026-09-05, later still: founder asked for 4-5 more floating cards,
 *   naming "Confirm Job.... Post Certification" and "Pass Interview....
 *   Post Trainings" as examples. Those two, taken literally, are outcome
 *   *guarantees* ("you will get a job", "you will pass the interview") —
 *   not a fact this project has established and a real legal/marketing
 *   risk for a training provider to claim outright, so implemented as
 *   "Earn a Certification" and "Prepare for Interviews" instead (honest
 *   framing of the same underlying idea, no guarantee). Added two more —
 *   "Get Career Support" and "Join a Community" — rather than the full 5,
 *   since the blueprint's own guardrails explicitly warn against
 *   overcrowding this composition, and it just lost its central laptop
 *   anchor. 8 cards total now; a 5th can be added if it still reads sparse.
 * - 2026-09-05, later still: founder asked to remove "Build Real Projects"
 *   (02) and "Create a Portfolio" (03). Removed the cards, their CSS
 *   modifiers (`.hero-card--projects`/`--portfolio`, all breakpoints), and
 *   shifted the remaining 6 cards up to close the gap those two left in
 *   the cascade rather than leaving a visible hole — `.hero-visual`'s
 *   min-height reduced to match. Numbers on the remaining cards (01, 04–08)
 *   were left as-is rather than renumbered, since they still read fine as
 *   a sequence and renumbering risked more churn than it was worth.
 * - 2026-09-06: founder direction — a compact HRD Corp credibility mark
 *   (a standalone `HrdCorpBadge` component, linking to /hrd-corp) added to
 *   the content column, below the helper line.
 * - 2026-09-06, later the same day: founder direction — moved into the
 *   floating card composition instead, filling the empty "03" slot left by
 *   "Create a Portfolio" above. `HrdCorpBadge.tsx` is deleted (it had no
 *   other use); the card is built inline here, as a `Link` (not a plain
 *   `<article>` like the other seven) so it still routes to /hrd-corp, with
 *   the actual HRD Corp-issued badge image filling the icon circle instead
 *   of an inline SVG glyph — the one card where showing the genuine mark
 *   matters more than visual consistency with the other seven. Still states
 *   only that the TRAINER holds HRD Corp's "Accredited Trainer" status
 *   (Trainer ID 68923) — not that the organisation is a Registered Training
 *   Provider or that any course is HRD Corp Claimable. See
 *   docs/HRD_CORP.md.
 * - 2026-09-06, later still: founder direction — two more tweaks to the
 *   card composition. (1) Card 03 (HRD Corp) recoloured to gold, distinct
 *   from every other card's hue (blue/purple/orange/teal), and — unlike
 *   every other card here — the override reaches the CARD itself
 *   (background/border/glow), not just its icon, so it visibly stands out
 *   rather than blending in as an eighth same-treatment card. (2) Card 04
 *   ("Explore Opportunities") recoloured from orange to rose — it was
 *   identical to `--community` (both drew from the same orange token) and
 *   had drifted close to card 03's new gold — and its title shortened to
 *   "Opportunities". The journey strip below still reads "Explore
 *   Opportunities" in full; only the floating card's title changed.
 * - 2026-09-06, later still: founder direction — moved HRD Corp (card 03)
 *   to a top-row position (top:40/right:0), swapping slots with
 *   `--certification` rather than computing a new position from scratch —
 *   `--certification` now sits where `--hrdcorp` used to (bottom-left),
 *   an already-overlap-verified spot. All eight cards also reduced in
 *   size (270→230px wide, 116→100px min-height, icon 54→44px, title
 *   17→15px) — positions are unchanged in HomeHero.module.css, since a
 *   smaller box only reduces overlap risk, never increases it.
 * - 2026-09-06, later still: founder direction — the learning-journey
 *   strip redesigned from a supplied reference image. See the comment on
 *   `.hero-journey` below for exactly what changed (intro block added,
 *   steps restacked vertically, connectors redrawn, step 04 recoloured,
 *   the handwritten note replaced by a trailing arrow, step copy for
 *   02–04 rewritten to match the reference).
 * - 2026-09-06, later still: founder direction — card 08's content changed
 *   from "Join a Community" (icon: `GlyphUsers`) to "No Coding Experience
 *   Required" (icon: `GlyphCheckCircle`, new — a plain checkmark, since
 *   the people icon no longer matched). Class name `--community` and card
 *   number 08 kept, per this file's own established practice of not
 *   renaming things just because their content moved on.
 *
 * WHAT IS AND IS NOT A PHOTOGRAPH here: one genuine image — the HRD Corp
 * badge on card 03, an asset HRD Corp itself issued (not a photograph of
 * this Academy or its delivery). Every other visual (cards, annotations)
 * is still CSS/inline SVG, consistent with this file's original history.
 */

/* ---------- Original inline glyphs (no icon library, no stock asset) ---------- */

const stroke = {
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  fill: "none",
};

function GlyphCode() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 7l-5 5 5 5M15 7l5 5-5 5" {...stroke} />
    </svg>
  );
}
function GlyphCube() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3.5l7.5 4.3v8.4L12 20.5l-7.5-4.3V7.8L12 3.5z" {...stroke} />
      <path d="M12 12v8.5M4.5 7.8L12 12l7.5-4.2" {...stroke} />
    </svg>
  );
}
function GlyphPerson() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="3.4" {...stroke} />
      <path d="M5.5 19c1-3.5 3.8-5.5 6.5-5.5s5.5 2 6.5 5.5" {...stroke} />
    </svg>
  );
}
function GlyphBriefcase() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3.5" y="8" width="17" height="11" rx="1.5" {...stroke} />
      <path d="M8.5 8V6a2 2 0 012-2h3a2 2 0 012 2v2M3.5 13h17" {...stroke} />
    </svg>
  );
}
function GlyphBook() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 5.2c2.2-1 4.7-1 7 0v13.6c-2.3-1-4.8-1-7 0V5.2z" {...stroke} />
      <path d="M20 5.2c-2.2-1-4.7-1-7 0v13.6c2.3-1 4.8-1 7 0V5.2z" {...stroke} />
    </svg>
  );
}
function GlyphBolt() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M13 3L5 13.5h5.5L11 21l8-10.5h-5.5L13 3z" {...stroke} />
    </svg>
  );
}
function GlyphRobot() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="9" width="14" height="10" rx="2.5" {...stroke} />
      <path d="M12 9V5.5M9.5 5.5h5M2.5 13v3M21.5 13v3" {...stroke} />
      <circle cx="9.5" cy="14" r="1.3" fill="currentColor" />
      <circle cx="14.5" cy="14" r="1.3" fill="currentColor" />
    </svg>
  );
}
function GlyphGlobe() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8" {...stroke} />
      <path
        d="M4 12h16M12 4c2.5 2.2 3.8 5 3.8 8s-1.3 5.8-3.8 8c-2.5-2.2-3.8-5-3.8-8s1.3-5.8 3.8-8z"
        {...stroke}
        strokeWidth={1.4}
      />
    </svg>
  );
}
function GlyphBars() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 19v-6M12 19V8M19 19V5" {...stroke} strokeWidth={2.2} />
    </svg>
  );
}
function GlyphArrowRight() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 12h16M13 5l7 7-7 7" {...stroke} strokeWidth={2} />
    </svg>
  );
}
function GlyphBadge() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="9.5" r="5.5" {...stroke} />
      <path d="M9 14l-2 6 5-2.5 5 2.5-2-6" {...stroke} />
    </svg>
  );
}
function GlyphChat() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 5.5h16v10.5H9.5L5 20v-4H4z" {...stroke} />
      <path d="M8 9.5h8M8 12.5h5" {...stroke} strokeWidth={1.5} />
    </svg>
  );
}
function GlyphCompass() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" {...stroke} />
      <path d="M15 9l-2 6-4-2 2-6z" {...stroke} strokeLinejoin="round" />
    </svg>
  );
}
function GlyphUsers() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="8.5" cy="8" r="2.8" {...stroke} />
      <circle cx="16" cy="9" r="2.2" {...stroke} />
      <path d="M3 19c.7-3 3-4.8 5.5-4.8s4.8 1.8 5.5 4.8" {...stroke} />
      <path d="M14.5 14.5c2 .2 3.6 1.6 4.2 4" {...stroke} />
    </svg>
  );
}
function GlyphCheckCircle() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" {...stroke} />
      <path d="M8 12.5l2.5 2.5L16 9.5" {...stroke} />
    </svg>
  );
}

/* ---------- Content ---------- */

const benefits = [
  { tone: "blue", icon: <GlyphBolt />, label: ["Learn", "by Building"] },
  { tone: "purple", icon: <GlyphRobot />, label: ["AI-Powered", "Skills"] },
  { tone: "orange", icon: <GlyphBriefcase />, label: ["Freelance", "Ready"] },
  { tone: "teal", icon: <GlyphGlobe />, label: ["Work From", "Anywhere"] },
] as const;

const journey = [
  { num: "01", role: "learn", icon: <GlyphBook />, title: "Learn", body: "Master in-demand skills at your own pace." },
  { num: "02", role: "build", icon: <GlyphCube />, title: "Build", body: "Apply your learning through real-world projects." },
  { num: "03", role: "showcase", icon: <GlyphPerson />, title: "Showcase", body: "Create a portfolio that demonstrates what you can actually do." },
  { num: "04", role: "explore", icon: <GlyphBars />, title: "Explore Opportunities", body: "Use your skills and evidence to pursue freelance and remote opportunities." },
] as const;

export function HomeHero() {
  const accreditation = practitioners[0]?.hrdCorpAccreditation;

  return (
    // Fragment, not a single <section>, since 2026-09-05 (later still): the
    // journey strip below moved out of the hero into normal document flow
    // as its own sibling block — see the comment on it for why.
    <>
      {/* `night` (globals.css) redefines --color-ink/--color-primary/etc. to
          their dark-safe values for this subtree — required because this
          hero's CSS module maps onto those shared tokens (see file header),
          and without `.night` they'd resolve to the light theme's dark-text
          values against this hero's always-dark background. */}
      <section className={`${styles.hero} night outline outline-[#e5e5e5]`}>
      <div className={styles["hero__grid-bg"]} aria-hidden="true" />
      <div className={`${styles["hero__ambient-glow"]} ${styles["hero__ambient-glow--one"]}`} aria-hidden="true" />
      <div className={`${styles["hero__ambient-glow"]} ${styles["hero__ambient-glow--two"]}`} aria-hidden="true" />

      <div className={styles["hero__inner"]}>
        {/* ====================== LEFT: content ====================== */}
        <div className={styles["hero__content"]}>
          <p className={styles["hero__eyebrow"]}>Practical skills for a brighter tomorrow</p>

          <h1 className={styles["hero__title"]}>
            <span>Don&rsquo;t Just Learn.</span>
            <span className={styles["hero__title-gradient"]}>Build a Future</span>
            <span>You&rsquo;re Excited</span>
            <span>About.</span>
          </h1>

          <p className={styles["hero__description"]}>
            Learn Vibe Coding and modern digital skills, build real projects,
            create a portfolio, and explore freelance and remote
            opportunities — all from anywhere in the world.
          </p>

          <div className={styles["hero__actions"]}>
            <Link href="/DataBlueprint-AIVibeCoding" className={styles.heroButtonPrimary}>
              Explore Courses
              <span className="[&_svg]:size-4">
                <GlyphArrowRight />
              </span>
            </Link>
            <Link href="/diagnostic" className={styles.heroButtonSecondary}>
              <span className={`${styles["hero-button__icon"]} [&_svg]:size-4`}>
                <GlyphBars />
              </span>
              Start Free Diagnostic (10 min)
            </Link>
          </div>

          <p className={styles["hero__helper"]}>
            Not sure where to start? Take a free 10-minute diagnostic and get
            a personalised learning path.
          </p>

          <div className={styles["hero__benefits"]}>
            {benefits.map(({ tone, icon, label }) => (
              <div key={label[0]} className={styles["hero-benefit"]}>
                <span className={`${styles["hero-benefit__icon"]} ${styles[`hero-benefit__icon--${tone}`]}`}>
                  {icon}
                </span>
                <span className={styles["hero-benefit__text"]}>
                  {label[0]}
                  <br />
                  {label[1]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ====================== RIGHT: visual composition ====================== */}
        <div className={styles["hero-visual"]} aria-label="Learning journey illustration">
          <div className={`${styles["hero-orbit"]} ${styles["hero-orbit--large"]}`} aria-hidden="true" />
          <div className={`${styles["hero-orbit"]} ${styles["hero-orbit--small"]}`} aria-hidden="true" />

          <article className={`${styles["hero-card"]} ${styles["hero-card--vibe"]}`}>
            <span className={styles["hero-card__number"]}>01</span>
            <span className={styles["hero-card__icon"]}>
              <GlyphCode />
            </span>
            <div className={styles["hero-card__content"]}>
              <p className={styles["hero-card__title"]}>Learn Vibe Coding</p>
              <p className={styles["hero-card__description"]}>Turn ideas into real products with AI.</p>
            </div>
          </article>

          {/* Card 03 — the slot "Create a Portfolio" left empty (see file
              header). A Link, not an <article> like its seven siblings: the
              real, verifiable HRD Corp accreditation is worth routing
              somewhere, and .hero-card's hover/focus styling is generic
              (not scoped to <article>), so this costs nothing visually. */}
          {accreditation && (
            <Link
              href="/hrd-corp"
              className={`${styles["hero-card"]} ${styles["hero-card--hrdcorp"]}`}
            >
              <span className={styles["hero-card__number"]}>03</span>
              <span className={styles["hero-card__icon"]}>
                <Image
                  src={assetPath(accreditation.badge)}
                  alt="HRD Corp Accredited Trainer badge"
                  width={44}
                  height={44}
                  className="h-full w-full rounded-full object-cover"
                />
              </span>
              <div className={styles["hero-card__content"]}>
                <p className={styles["hero-card__title"]}>
                  {accreditation.title}
                </p>
                <p className={styles["hero-card__description"]}>
                  Verified — Trainer ID {accreditation.trainerId}.
                </p>
              </div>
            </Link>
          )}

          <article className={`${styles["hero-card"]} ${styles["hero-card--opportunities"]}`}>
            <span className={styles["hero-card__number"]}>04</span>
            <span className={styles["hero-card__icon"]}>
              <GlyphBriefcase />
            </span>
            <div className={styles["hero-card__content"]}>
              {/* Shortened from "Explore Opportunities" — 2026-09-06,
                  founder direction. The journey strip below (`journey`,
                  step 04) still reads "Explore Opportunities" in full;
                  only this floating card's title changed. */}
              <p className={styles["hero-card__title"]}>Opportunities</p>
              {/* "Confirm Job in Pakistan & Malaysia (T&C Applied)" was
                  requested (2026-09-05) and NOT used — same reasoning as
                  the file header's note on "Confirm Job.... Post
                  Certification": a job-placement guarantee, now for two
                  named countries, is a real legal/marketing risk this
                  project has no program, partner-employer list or actual
                  T&C page to back up. The geography itself is a plain
                  fact, not a promise, so it's kept; the guarantee wording
                  is not. */}
              <p className={styles["hero-card__description"]}>Freelance. Remote. Global — including Pakistan &amp; Malaysia.</p>
            </div>
          </article>

          <article className={`${styles["hero-card"]} ${styles["hero-card--certification"]}`}>
            <span className={styles["hero-card__number"]}>05</span>
            <span className={styles["hero-card__icon"]}>
              <GlyphBadge />
            </span>
            <div className={styles["hero-card__content"]}>
              <p className={styles["hero-card__title"]}>Earn a Certification</p>
              <p className={styles["hero-card__description"]}>A credential that proves what you can actually do.</p>
            </div>
          </article>

          <article className={`${styles["hero-card"]} ${styles["hero-card--interview"]}`}>
            <span className={styles["hero-card__number"]}>06</span>
            <span className={styles["hero-card__icon"]}>
              <GlyphChat />
            </span>
            <div className={styles["hero-card__content"]}>
              <p className={styles["hero-card__title"]}>Prepare for Interviews</p>
              <p className={styles["hero-card__description"]}>Practice with real projects, so you walk in ready.</p>
            </div>
          </article>

          <article className={`${styles["hero-card"]} ${styles["hero-card--career"]}`}>
            <span className={styles["hero-card__number"]}>07</span>
            <span className={styles["hero-card__icon"]}>
              <GlyphCompass />
            </span>
            <div className={styles["hero-card__content"]}>
              <p className={styles["hero-card__title"]}>Get Career Support</p>
              <p className={styles["hero-card__description"]}>Guidance connecting your new skills to real opportunities.</p>
            </div>
          </article>

          {/* Was "Join a Community" (GlyphUsers) until 2026-09-06, founder
              direction. Class name `--community` and card number 08 kept
              as-is — same reasoning the file already applies elsewhere
              (renaming risks more churn than it's worth); only the visible
              content and icon changed. */}
          <article className={`${styles["hero-card"]} ${styles["hero-card--community"]}`}>
            <span className={styles["hero-card__number"]}>08</span>
            <span className={styles["hero-card__icon"]}>
              <GlyphCheckCircle />
            </span>
            <div className={styles["hero-card__content"]}>
              <p className={styles["hero-card__title"]}>No Coding Experience Required</p>
              <p className={styles["hero-card__description"]}>Anyone with zero coding background can take this course.</p>
            </div>
          </article>

          <div className={`${styles["hero-script"]} ${styles["hero-script--bottom"]}`}>
            Work From
            <br />
            Anywhere
          </div>
        </div>
      </div>
      </section>

      {/* ====================== Learning journey strip ====================== */}
      {/* Moved out of the hero (founder direction, 2026-09-05, later still):
          normal document flow, directly below the hero, instead of
          absolutely positioned overlapping its bottom edge. Carries `night`
          itself now — its card design (dark gradient, light text via the
          shared --color-ink/--color-primary tokens) depended on the hero's
          `.night` scope for those tokens, which it no longer inherits by
          sitting outside the section.

          REDESIGNED 2026-09-06, founder direction, from a supplied reference
          image: an intro block (eyebrow, two-line headline, description)
          added as its own column/row, steps restacked vertically (number
          above icon above title above description — previously icon beside
          a text column), the text-arrow connectors between steps replaced
          by a drawn line-with-dot, and the handwritten "Your Journey /
          Starts Here" note replaced by a trailing arrow after the last
          step. `--explore` (step 04) recoloured orange, matching the
          reference — it had shared `--learn`'s purple. */}
      <div className={`${styles["hero-journey"]} night outline outline-[#e5e5e5]`}>
        <div className={styles["hero-journey__intro"]}>
          <p className={styles["hero-journey__eyebrow"]}>Your Learning Journey</p>
          <h3 className={styles["hero-journey__title"]}>
            From learning
            <br />
            <span className={styles["hero-journey__title-accent"]}>
              to real opportunities.
            </span>
          </h3>
          <p className={styles["hero-journey__description"]}>
            A clear, practical path from building capability to creating
            evidence of your skills and pursuing meaningful work.
          </p>
        </div>
        {journey.map((step, i) => (
          <div key={step.num} className="contents">
            <article className={`${styles["journey-step"]} ${styles[`journey-step--${step.role}`]}`}>
              <span className={styles["journey-step__number"]}>{step.num}</span>
              <span className={styles["journey-step__icon"]}>
                {step.icon}
              </span>
              <p className={styles["journey-step__title"]}>{step.title}</p>
              <p className={styles["journey-step__description"]}>{step.body}</p>
            </article>
            {i < journey.length - 1 ? (
              <span className={styles["journey-connector"]} aria-hidden="true">
                <span className={styles["journey-connector__dot"]} />
              </span>
            ) : (
              <span className={styles["journey-end-arrow"]} aria-hidden="true">
                <GlyphArrowRight />
              </span>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
