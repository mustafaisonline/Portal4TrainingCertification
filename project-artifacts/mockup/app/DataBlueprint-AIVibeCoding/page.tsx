import type { Metadata } from "next";
import Image from "next/image";
import { assetPath } from "@/lib/basePath";
import { PublicShell } from "@/components/PublicShell";
import { ImageFrame } from "@/components/ImageFrame";
import {
  CohortBuildingIllustration,
  FounderTeachingIllustration,
  TeachingDetailIllustration,
} from "@/components/illustrations/DeliveryIllustrations";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CoursePricing } from "@/components/CoursePricing";
import { getCourse } from "@/data/courses";
import { practitioners } from "@/data/practitioners";

/**
 * Programme hub — REBUILT 2026-09-06, founder direction, replacing the
 * seven-course portfolio hub with a single-proposition page. Full
 * rationale, section-by-section content and open items are recorded in
 * `docs/course_landing_page.md` — that file is the source of truth this
 * page implements; read it before changing this file. (That doc's own
 * section numbering (§8.1 etc.) predates the changes below and hasn't
 * been renumbered — treat §8.1–§8.8 as historical structure, not a
 * literal current map.)
 *
 * DISABLED, NOT DELETED (per founder direction — "just disable, we'll
 * see later"): the six non-flagship courses and the level/pathway rail
 * that organised them are no longer rendered here, but `data/courses.ts`
 * is untouched — `about-us`, `certifications`, `CourseCard` and
 * `CoursePricing` all still read it and keep working. The
 * `/courses/[slug]` detail route is likewise untouched.
 *
 * PLACEHOLDER CONTENT — flagged, not hidden: the hero and other sections
 * below display "Data Blueprint & AI / Vibe Coding" as a page-level title
 * override on top of the existing `ai-powered-product-development` entry.
 * The underlying data is real (migrated content, unedited) but does not
 * yet reflect the actual data-blueprint + vibe-coding merge — the founder
 * is supplying that curriculum separately. Nothing in `data/courses.ts`
 * was changed to produce this (pricing is the one exception — see below).
 *
 * 2026-09-06, LATER THE SAME DAY — a further round of founder direction,
 * "since we are offering only one training":
 * 1. ROUTE RENAMED: this page moved from `app/courses/page.tsx` to
 *    `app/DataBlueprint-AIVibeCoding/page.tsx` (`git mv`, history intact).
 *    `/courses/[slug]` detail pages are UNCHANGED and still live at
 *    `/courses/<slug>` — only the hub moved. Every internal link that
 *    pointed at the old `/courses` hub was re-pointed (PublicShell nav +
 *    footer + header CTA, this page's own CTA, and every other page that
 *    linked to the hub: homepage, about-us, certifications, contact-us,
 *    the course-detail template's back-link and bottom CTA). No redirect
 *    from the old `/courses` URL exists — this project's static-export
 *    build target doesn't reliably support one, so an old bookmark now
 *    404s, same treatment `/certifications` already has when disabled.
 * 2. Primary nav label "Courses" → "Programme" (component/PublicShell.tsx)
 *    — scoped to that one nav item, per the founder's own wording; the
 *    header CTA and footer link keep their existing text, just the new
 *    href.
 * 3. Hero eyebrow label "Courses" → "Data Blueprint & AI/Vibe Coding".
 * 4. The old "The course" section (a flagship-overview block with its own
 *    price-by-region summary) is GONE, replaced by the real `CoursePricing`
 *    component (id="investment") — the same one the detail page uses, so
 *    figures can never drift between the two pages.
 * 5. A new Curriculum section (the flagship's 9 modules, same accordion
 *    markup as the detail page's own Curriculum section) was added,
 *    positioned directly before the closing CTA.
 * 6. "Who Teaches You" now carries the HRD Corp Accredited Trainer badge
 *    on the founder's photo — same overlay pattern already used on
 *    `/trainers` and the homepage hero, linking to `/hrd-corp`.
 * 7. Three sparse sections (Hero, The Method, Learning journey) — flagged
 *    as having a lot of unused visual space on a wide viewport — each
 *    gained a supporting `ImageFrame` (illustration stand-in, not a real
 *    photograph; swapping one in later is still just a `src` prop).
 * 8. Section background colours were varied so no two ADJACENT sections
 *    share an identical treatment (they mostly did before this pass) —
 *    see each section's own comment for its assigned tone.
 * Malaysia pricing for this course also changed the same day — see
 * `data/courses.ts`'s own comment on the `ai-powered-product-development`
 * entry for the exact before/after figures and why `valueStack` was
 * recomputed alongside it.
 */

export const metadata: Metadata = {
  title: "Data Blueprint & AI/Vibe Coding — Data & AI Academy",
};

/** Original inline glyph, local to this page — identical markup to
 *  app/trainers/page.tsx's own `GlyphArrowRight`, added 2026-09-07 so the
 *  "View full profile" button here matches that page's exactly. */
function GlyphArrowRight() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 shrink-0">
      <path
        d="M4 12h16M13 5l7 7-7 7"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

/** §8.2 of course_landing_page.md. Rendered as description cards rather
 *  than short tags — each role carries a full one-line reason, not just
 *  a label, which the existing `whoShouldAttend`/Chip pattern (built for
 *  short tags) doesn't fit. Reuses the Philosophy section's card shape
 *  from the previous version of this page instead. */
const audienceRoles = [
  [
    "Aspiring freelance developers",
    "Want client-ready skills, not another tutorial.",
  ],
  [
    "Career changers",
    "Moving into tech from a completely different field.",
  ],
  [
    "Entrepreneurs & startup founders",
    "Need to build and ship an MVP without hiring a dev team.",
  ],
  [
    "Product managers & business analysts",
    "Want to go from idea to working product themselves.",
  ],
  [
    "Students & graduates",
    "Building a portfolio that gets freelance work, not just a certificate.",
  ],
  [
    "Working professionals",
    "Want to use AI properly at work, not just experiment with it.",
  ],
] as const;

/** §8.3. Order is founder-confirmed and locked. */
const benefits = [
  {
    title: "Freelance-ready from day one",
    body: "Leave with a proven method, not a syntax refresher. Take on real client work immediately — you don't need a team behind you to deliver.",
  },
  {
    title: "Reduce workforce",
    body: "One example: a company's workflow that used to take 25 people now runs on 5, through the same AI-leveraged building approach you'll learn.",
  },
  {
    title: "No coding required",
    body: "You don't need to already know how to code. The method is designed to take you from zero to shipping — coding ability helps, but it was never the barrier.",
  },
  {
    title: "10–15 frameworks, not just one trick",
    body: "You're not learning “how to prompt ChatGPT.” You're exposed to 10–15 real frameworks — for planning, building, testing and deploying a product — the same discipline a professional AI-builder actually uses.",
  },
  {
    title: "Build for real companies",
    body: "This isn't a personal-project bootcamp. You learn to scope, build and deliver work a company would actually pay for — because that's exactly the discipline the method teaches.",
  },
  {
    title: "Become part of the network",
    body: "You're not just a graduate — you gain visibility with the practitioner network behind this Academy, the same trainers teaching here, as you go on to build real work.",
  },
] as const;

/** §8.5. Shown in full — unlike The Method, this funnel is meant to be
 *  fully visible on the page. */
const journey = [
  {
    stage: "Learn data foundations",
    body: "Build the trusted-data instincts every real product needs — how data is structured, governed and made reliable, before AI ever touches it.",
  },
  {
    stage: "Learn AI / vibe coding",
    body: "Apply the method to build real, working products with AI — not a toy demo, a working build.",
  },
  {
    stage: "Start developing products & solutions",
    body: "Move from guided exercises to your own builds — real briefs, real constraints, a capstone you can actually show someone.",
  },
  {
    stage: "Start working as a freelancer or AI engineer",
    body: "Take what you built into the market — as a freelancer, an AI engineer, or inside your own company.",
  },
  {
    stage: "Earn",
    body: "Designed to lead to paid work, not just a certificate — the natural result of stages 1–4, not a separate promise bolted on.",
  },
] as const;

export default function CoursesPage() {
  // Display-only override — see file header. `data/courses.ts` is unedited.
  const flagship = getCourse("ai-powered-product-development");
  const flagshipDisplayTitle = "Data Blueprint & AI / Vibe Coding";
  const lead = practitioners[0];
  const accreditation = lead.hrdCorpAccreditation;

  return (
    <PublicShell>
      {/* ===== Hero — §8.1 =====
          `.night` removed, 2026-09-06 light-theme propagation — see
          components/HomeHeroLight.tsx's header comment. Gradient hue
          moved indigo→blue to match.
          LATER THE SAME DAY: label "Courses" → "Data Blueprint & AI/Vibe
          Coding" (founder direction); restructured single-column → 2-col
          grid with an ImageFrame, since this section had no visual
          counterbalance and read as conspicuously empty on wide
          viewports. Background tone: gradient (bookends the page — the
          closing CTA shares it).
          2026-09-07, founder direction: filled with a real photograph —
          an AI-generated scene (a practitioner walking a group through a
          build framework at a whiteboard), saved to
          public/delivery/teaching-the-method.png. Named for the scene, not
          the founder — same as the homepage's four "How it works" photos,
          this is a generic AI-generated figure, not the founder's actual
          likeness, despite standing in for `FounderTeachingIllustration`.
          Permitted under docs/IMAGE_SLOTS.md rule 2 (AI-generated imagery
          allowed portal-wide; rule 1's stock/licensed-imagery ban is
          separate and untouched — this wasn't sourced from either).
          `illustration` stays in place, inert per ImageFrame's own
          `src`-wins contract. */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#eef2fc] to-[var(--color-ground)]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(55% 75% at 78% 25%, rgba(47,95,224,0.13), transparent 70%)",
          }}
        />
        <div className="relative mx-auto grid max-w-[1280px] gap-12 px-6 py-16 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:py-20">
          <div>
            <p className="text-label mb-4 text-[var(--color-primary)]">
              Data Blueprint & AI/Vibe Coding
            </p>
            <h1 className="text-display-lg mb-6 max-w-[760px]">
              Vibe coding isn&rsquo;t a prompt. It&rsquo;s a method.
            </h1>
            <p className="text-body-lg mb-9 max-w-[640px] text-[var(--color-ink-quiet)]">
              Before a single feature gets built, you define what you&rsquo;re
              building, the rules the AI must never break, and the context it
              needs to stay on track — the same discipline that keeps an AI
              coding agent reliable on real work. Taught by a practitioner,
              not sold as a shortcut.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Button href="#the-method">See how it works</Button>
              <Button variant="secondary" href="#who-can-take-this-training">
                Who this is for
              </Button>
            </div>
          </div>
          <ImageFrame
            subject="Data Blueprint & AI/Vibe Coding — the practitioner teaching the method, live"
            ratio="4 / 3"
            minWidth={1600}
            note="consent required"
            illustration={<FounderTeachingIllustration />}
            src="/delivery/teaching-the-method.png"
            alt="A practitioner walking a group through a build framework at a whiteboard"
          />
        </div>
      </section>

      {/* ===== Who can take this training — §8.2 ===== */}
      <section
        id="who-can-take-this-training"
        className="mx-auto max-w-[1280px] scroll-mt-24 px-6 py-16"
      >
        <p className="text-label mb-3 text-[var(--color-primary)]">
          Who can take this training
        </p>
        <h2 className="text-display mb-5 max-w-[640px]">
          Built for people who want to build
        </h2>
        <p className="text-body-lg mb-12 max-w-[640px] text-[var(--color-ink-quiet)]">
          This is built for people who want to build — not just talk about
          building. Whether you&rsquo;ve never opened a code editor or you
          already write code every day, the method works the same way:
          that&rsquo;s the point of teaching it as a method, not a set of
          tricks.
        </p>
        <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          {audienceRoles.map(([title, body]) => (
            <Card key={title} variant="plate" className="p-5">
              <h3 className="text-h2 mb-2">{title}</h3>
              <p className="text-body-sm text-[var(--color-ink-quiet)]">
                {body}
              </p>
            </Card>
          ))}
        </div>
        <p className="mt-10 max-w-[640px] text-body-sm text-[var(--color-ink-quiet)]">
          No prior coding experience required. If you already code, the
          method makes you faster and more reliable — it doesn&rsquo;t
          start you over.
        </p>
      </section>

      {/* ===== Benefits of this training — §8.3 =====
          Background tone: light-blue (was white-raised, same as "Who
          Teaches You" below it — 2026-09-06 background-variation pass, so
          adjacent sections stop reading as identical). */}
      <section className="bg-[var(--color-ground-tint)]">
        <div className="mx-auto max-w-[1280px] px-6 py-16">
          <p className="text-label mb-3 text-[var(--color-primary)]">
            Why train with us
          </p>
          <h2 className="text-display mb-12 max-w-[640px]">
            What you actually leave with
          </h2>
          <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map(({ title, body }, i) => (
              <div
                key={title}
                className="border-t-2 border-[var(--color-primary)]/60 pt-5"
              >
                <p className="text-mono text-body-sm mb-3 text-[var(--color-ink-faint)]">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="text-h2 mb-2">{title}</h3>
                <p className="text-body-sm text-[var(--color-ink-quiet)]">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== The Method — §8.4 =====
          Deliberately a teaser, not a disclosure: the governing files and
          frameworks are referenced in aggregate only. Full detail is
          taught inside the course, not published on this page.
          `.night` removed, 2026-09-06 light-theme propagation.
          LATER THE SAME DAY: background tone swapped to white-raised +
          border-y (was the same light-blue as "Benefits" above it —
          background-variation pass). Added an ImageFrame — this section
          was flagged as having no visual counterbalance (text capped at
          640px inside a 1280px section). "See the course" now points at
          the new Curriculum section (`#curriculum`) — its old target,
          `#course`, no longer exists (see the Investment section's own
          comment for what replaced it).
          2026-09-07, founder direction: filled with a real photograph —
          an AI-generated whiteboard scene mapping the Plan→Build→Test→
          Deploy→Improve loop this section describes, saved to
          public/delivery/the-method.png. Same basis as the Hero's own
          photo above (docs/IMAGE_SLOTS.md rule 2); `illustration` stays
          in place, inert per ImageFrame's `src`-wins contract. */}
      <section
        id="the-method"
        className="relative scroll-mt-24 overflow-hidden border-y border-[var(--color-line)] bg-[var(--color-ground-raised)]"
      >
        <div className="relative mx-auto grid max-w-[1280px] gap-12 px-6 py-16 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:py-20">
          <div>
            <p className="text-label mb-3 text-[var(--color-primary)]">
              The Method
            </p>
            <h2 className="text-display mb-6 max-w-[640px]">
              Before you build the product, you build the method
            </h2>
            <p className="text-body-lg mb-8 max-w-[640px] text-[var(--color-ink-quiet)]">
              Every project starts with a small set of governing files — what
              you&rsquo;re building, the rules the AI must never break, and
              the context it needs to stay on track — plus a set of reusable
              skills and frameworks for planning, building, testing and
              deploying.
            </p>
            <p className="text-body-lg mb-10 max-w-[640px] text-[var(--color-ink-quiet)]">
              The full method — every file, every framework, in the order
              it&rsquo;s taught — is inside the course itself.
            </p>
            <Button href="#curriculum">See the course</Button>
          </div>
          <ImageFrame
            subject="The governing files and frameworks, in a real session"
            ratio="4 / 3"
            minWidth={1600}
            note="consent required"
            illustration={<TeachingDetailIllustration />}
            src="/delivery/the-method.png"
            alt="A whiteboard mapping the plan, build, test, deploy and improve loop, with a laptop showing a project plan"
          />
        </div>
      </section>

      {/* ===== Your learning journey — §8.5 =====
          LATER THE SAME DAY: added an ImageFrame alongside the timeline —
          flagged as having a large unused right-hand gutter (timeline
          text capped at 640px inside a 1280px section, no supporting
          visual). Background tone: plain ground (unchanged) — distinct
          from "The Method" (white-raised) above it and "Curriculum"
          (white-raised) below it, once that section moved up ahead of
          "Who Teaches You" on 2026-09-07 — see that section's own
          comment.
          2026-09-07, later still, founder direction: filled with a real
          photograph — an AI-generated scene of the five-stage journey on
          a whiteboard (Learn Foundations → Learn AI/Vibe Coding → Build
          Real Projects → Work as a Freelancer or AI Engineer → Earn Real
          Opportunities), saved to public/delivery/learning-journey.png.
          `ratio` changed from the original "3 / 4" (portrait, sized for
          `CohortBuildingIllustration`) to "4 / 3" (landscape, matching
          this page's other two photos) — the photo itself is landscape,
          and `ImageFrame`'s `src` mode crops to `object-cover`, so keeping
          the portrait box would have cut off most of the whiteboard on
          both sides. `illustration` stays in place, inert per
          ImageFrame's `src`-wins contract; docs/IMAGE_SLOTS.md rule 2
          covers the AI-generated-imagery basis, as with this page's other
          photos. */}
      <section className="mx-auto max-w-[1280px] px-6 py-16">
        <p className="text-label mb-3 text-[var(--color-primary)]">
          Your Learning Journey
        </p>
        <h2 className="text-display mb-14 max-w-[640px]">
          From data foundations to paid work
        </h2>
        <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-start">
          <ol className="relative flex flex-col gap-9">
            <span
              aria-hidden="true"
              className="absolute bottom-4 left-[15px] top-4 w-px bg-[var(--color-line-strong)]"
            />
            {journey.map((step, i) => (
              <li key={step.stage} className="relative flex gap-6">
                <span
                  aria-hidden="true"
                  className="text-mono relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--color-primary)] bg-[var(--color-ground)] text-[0.75rem] text-[var(--color-primary)]"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1 pt-1">
                  <p className="text-h2 mb-2">{step.stage}</p>
                  <p className="text-body-sm max-w-[640px] leading-snug text-[var(--color-ink-quiet)]">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          <ImageFrame
            subject="A cohort mid-build, moving through the stages of the journey"
            ratio="4 / 3"
            minWidth={1200}
            note="consent required"
            illustration={<CohortBuildingIllustration />}
            src="/delivery/learning-journey.png"
            alt="A learner at a laptop beside a whiteboard mapping the five-stage learning journey, from foundations to real opportunities"
          />
        </div>
      </section>

      {/* ===== Curriculum =====
          2026-09-06: added, sourced verbatim from that page's own
          Curriculum accordion (app/courses/[slug]/page.tsx) — same
          `<details>/<summary>` pattern, same classes — swapping
          `course.modules` for `flagship.modules` so the two pages can
          never drift out of sync on module content either.
          2026-09-07, founder direction: "Bring Curriculum section before
          Who Teaches You Section." Moved up from directly before the CTA
          (where it sat between Investment and CTA) to directly before
          "Who Teaches You" instead — no change to the section's own
          content or `id="curriculum"` anchor, so "The Method" section's
          "See the course" button (`href="#curriculum"`) still resolves
          correctly. Background stays white-raised (bg-ground-raised +
          border-y) — it now sits between "Your learning journey" (plain
          ground) and "Who Teaches You" (also changed today, see below),
          so it still reads as a distinct band on both sides. */}
      {flagship && (
        <section
          id="curriculum"
          className="border-y border-[var(--color-line)] bg-[var(--color-ground-raised)]"
        >
          <div className="mx-auto max-w-[1280px] scroll-mt-24 px-6 py-16">
            <p className="text-label mb-3 text-[var(--color-primary)]">
              Course content
            </p>
            <h2 className="text-display mb-4">Curriculum</h2>
            <p className="text-body-sm mb-10 text-[var(--color-ink-faint)]">
              {flagship.modules.length} modules · expand any module to see
              what it covers
            </p>
            <div className="max-w-[860px]">
              {flagship.modules.map((module, i) => {
                const hasDetail = Boolean(module.description || module.points);
                const header = (
                  <>
                    <span className="text-mono text-body-sm shrink-0 text-[var(--color-primary)]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1 font-semibold">{module.title}</span>
                  </>
                );
                if (!hasDetail) {
                  return (
                    <div
                      key={module.title}
                      className="flex items-baseline gap-5 border-t border-[var(--color-line)] py-4"
                    >
                      {header}
                    </div>
                  );
                }
                return (
                  <details
                    key={module.title}
                    className="group border-t border-[var(--color-line)]"
                  >
                    <summary className="flex cursor-pointer list-none items-baseline gap-5 py-4 hover:text-[var(--color-primary)] [&::-webkit-details-marker]:hidden">
                      {header}
                      <span
                        aria-hidden="true"
                        className="text-[var(--color-ink-faint)] transition-transform group-open:rotate-45"
                      >
                        +
                      </span>
                    </summary>
                    <div className="pb-5 pl-[2.6rem] pr-4">
                      {module.description && (
                        <p className="text-body-sm mb-3 text-[var(--color-ink-quiet)]">
                          {module.description}
                        </p>
                      )}
                      {module.points && (
                        <ul className="flex flex-col gap-1.5">
                          {module.points.map((point) => (
                            <li
                              key={point}
                              className="text-body-sm text-[var(--color-ink-quiet)]"
                            >
                              · {point}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </details>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ===== Who teaches you — §8.6 =====
          Reflects data/practitioners.ts honestly: one genuine
          practitioner today, founder-led, plural array ready for growth —
          same convention as the homepage and /trainers.
          2026-09-07, founder direction: "Bring Curriculum section before
          Who Teaches You Section" — Curriculum (white-raised) now sits
          directly above this section, so background tone changed HERE
          from white-raised to plain ground (border-y and the raised
          surface both dropped) to avoid two identical bands back to back.
          Plain ground is the same treatment "Who can take this training"
          and "Your learning journey" already use elsewhere on this page —
          not a new tone, just reused where the reorder now needs it.
          2026-09-07, founder direction: "Right area of the Mustafa
          Qizilbash Card is empty. Please place HRD Log[o] th[ere]." The
          card's text column is `1fr` but the copy caps at `max-w-[640px]`,
          so on wide viewports the column ran well past the text and left a
          bare gap on the right — this is that gap. The earlier small
          corner-overlay badge on the photo (added earlier today) was
          REMOVED here, not kept alongside — the same image showing twice
          in one card, once tiny and once large, read as a mistake rather
          than emphasis. That overlay pattern is untouched everywhere else
          it's used (components/TrainerCard.tsx, /trainers, the homepage
          hero) — this is the one place it's replaced by the larger
          placement instead.

          LATER THE SAME DAY, founder direction: "Move the logo in the
          middle of the available space" — a flat `auto` third grid column
          sizes itself to the badge and pins it flush against the card's
          own right edge/padding, which isn't the middle of anything. Fixed
          by keeping the grid at two columns (photo, then everything else)
          and making that second column its own flex row: the text block
          keeps its natural (`max-w-[640px]`-capped) width via `flex-none`,
          and the badge sits in a `flex-1` sibling that centers it — so it
          lands in the middle of WHATEVER space is actually left over after
          the text, on any viewport, rather than at a fixed pixel offset.

          Also added, same direction: "Verify this certificate at HRD Corp"
          — the exact button /trainers already renders in its "Held today"
          section, linking out to the trainer's real HRD Corp e-certificate
          (`accreditation.verifyUrl`, opens in a new tab). Per that same
          page's convention the large badge image itself is NOT a link (it
          wasn't there either) — this button is the one path to verification,
          not two competing ones. */}
      {lead && (
        <section>
          <div className="mx-auto max-w-[1280px] px-6 py-16">
            <p className="text-label mb-3 text-[var(--color-primary)]">
              Who Teaches You
            </p>
            <h2 className="text-display mb-10 max-w-[640px]">
              Taught by a practitioner, not a curriculum team
            </h2>
            <Card
              variant="panel"
              className="grid gap-8 border border-[var(--color-line)] md:grid-cols-[auto_1fr] md:items-center"
            >
              <Image
                src={assetPath(lead.photo)}
                alt={`Photograph of ${lead.name}`}
                width={800}
                height={800}
                className="h-28 w-28 shrink-0 rounded-[var(--radius-plate)] object-cover"
              />
              <div className="flex flex-wrap items-center gap-8">
                <div className="flex-none">
                  <h3 className="text-h1 mb-1">{lead.name}</h3>
                  <p className="text-label mb-4">{lead.role}</p>
                  <p className="mb-6 max-w-[640px] text-body-sm text-[var(--color-ink-quiet)]">
                    {lead.name} has spent 24+ years building enterprise data
                    and AI platforms across banking, energy, telecom and
                    government — and founded and still runs a 40,000+
                    member Big Data community, alongside a podcast with 80+
                    episodes. This course is taught by someone who has done
                    the work, not someone reading a script.
                  </p>
                  {/* 2026-09-07, founder direction: "Add these as buttons
                      ... just like it's showing on /trainers ... remove
                      button: Meet the trainer." Replaces the single
                      internal "Meet the trainer" link (→ /trainers) with
                      the same two OUTBOUND buttons that page's own lead-
                      trainer card uses — genuine profile, genuine
                      LinkedIn, both real published channels from
                      data/practitioners.ts, opening in a new tab. */}
                  <div className="flex flex-wrap gap-3">
                    {lead.mediumProfile && (
                      <Button
                        href={lead.mediumProfile}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`View ${lead.name}'s full profile on Medium (opens in a new tab)`}
                      >
                        View full profile
                        <GlyphArrowRight />
                      </Button>
                    )}
                    {lead.linkedin && (
                      <Button
                        variant="secondary"
                        href={lead.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${lead.name} on LinkedIn (opens in a new tab)`}
                      >
                        LinkedIn ↗
                      </Button>
                    )}
                  </div>
                </div>
                {accreditation && (
                  <div className="flex min-w-[200px] flex-1 flex-col items-center justify-center gap-5 text-center">
                    <Image
                      src={assetPath(accreditation.badge)}
                      alt="HRD Corp Accredited Trainer badge"
                      width={176}
                      height={176}
                      className="h-36 w-36 rounded-full object-cover shadow-md ring-1 ring-[var(--color-line-strong)] lg:h-44 lg:w-44"
                    />
                    <Button
                      variant="secondary"
                      href={accreditation.verifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Verify this certificate at HRD Corp ↗
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </section>
      )}

      {/* ===== Investment (was "The course") — §8.7 =====
          2026-09-06, founder direction: "Replace this section 'The course'
          with 'Investment' section from
          /courses/ai-powered-product-development." The old flagship-summary
          block (title override, meta strip, a bare region-price table, and
          two buttons pointing at the detail page's own investment section)
          is gone — it existed only to send visitors to the detail page for
          pricing. Now that the founder wants pricing seen HERE, this
          section is a direct call to the same `CoursePricing` component the
          detail page uses (components/CoursePricing.tsx), fed the flagship
          course's own `pricing`/`valueStack` fields — so the two pages can
          never show different numbers for the same course. Its `id`
          ("investment") replaces the old `id="course"` anchor; nothing else
          on this page still links to `#course`. The old right-column
          "What it leads to" highlights + CohortBuildingIllustration were
          dropped rather than kept alongside — that illustration now lives
          in the "Your learning journey" section above instead (no
          duplicate use of the same original artwork on one page), and the
          highlights themselves already appear as the Benefits section
          higher up this same page. */}
      {flagship?.pricing && (
        <CoursePricing
          pricing={flagship.pricing}
          valueStack={flagship.valueStack}
          valueStackTotal={flagship.valueStackTotal}
        />
      )}

      {/* ===== CTA — §8.8 =====
          Background changed 2026-09-06 from a flat transparent section
          (which sat directly on white-raised background above it, i.e.
          looked identical) to a gradient that bookends the Hero: Hero runs
          light-blue→ground top-to-bottom, this closing section runs
          ground→light-blue, so the page opens and closes on the same tone
          without repeating any interior section's exact treatment.
          2026-09-07: Curriculum (previously directly above this section)
          moved up ahead of "Who Teaches You" — see that section's own
          comment. Investment (light-blue, via `CoursePricing`) is now
          this section's immediate neighbour instead; the gradient here
          starts at plain ground, not light-blue, so the seam between the
          two still reads as a change in tone, not a repeat. */}
      <section className="bg-gradient-to-b from-[var(--color-ground)] to-[#eef2fc] text-center">
        <div className="mx-auto max-w-[1280px] px-6 py-20">
          <h2 className="text-display mx-auto mb-5 max-w-[24ch]">
            Stop prompting. Start building properly.
          </h2>
          <p className="text-body-lg mx-auto mb-9 max-w-[52ch] text-[var(--color-ink-quiet)]">
            One course. One method. A skillset you can start freelancing with
            immediately.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {flagship && (
              <Button href={`/courses/${flagship.slug}`}>
                Explore the course
              </Button>
            )}
            <Button variant="secondary" href="/contact-us">
              Talk to us
            </Button>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
