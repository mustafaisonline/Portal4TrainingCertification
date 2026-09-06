import { PublicShell } from "@/components/PublicShell";
import { HomeHero } from "@/components/HomeHero";
import { HomeDiagnostic } from "@/components/HomeDiagnostic";
import { ImageFrame } from "@/components/ImageFrame";
import {
  FaceToFaceIllustration,
  LiveOnlineIllustration,
  OnSiteIllustration,
  PrivateCohortIllustration,
} from "@/components/illustrations/DeliveryIllustrations";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

/**
 * P01 — Homepage. Content per docs/design/P01_HOMEPAGE_REDESIGN_SPECIFICATION.md
 * (H0–H9); visual recomposition 2026-08-31 for the premium navy identity —
 * see docs/P01_DESIGN_DECISIONS.md "Visual redesign".
 *
 * Inventory state: STATE A — no confirmed public course inventory.
 * Nothing here shows a course name, date, capacity or price. The
 * courses-vs-offerings emphasis (HO-1) remains open: both concepts are
 * described, neither leads.
 *
 * All decorative graphics below are ORIGINAL inline SVG (deterministic dot
 * fields and geometric glyphs) — nothing is copied from reference
 * material, and no stock or AI-generated imagery is used anywhere.
 */

/** Original geometric glyphs for the three pathways. */
function GlyphRise() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 19 L10 12.5 L14 15.5 L20 6.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="20" cy="6.5" r="2.3" fill="currentColor" />
    </svg>
  );
}
function GlyphNodes() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7.5 8.5 L16.5 8.5 M8.5 10.5 L11 15 M15.5 10.5 L13 15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="6.5" cy="8" r="2.4" fill="currentColor" />
      <circle cx="17.5" cy="8" r="2.4" fill="currentColor" />
      <circle cx="12" cy="17" r="2.4" fill="currentColor" />
    </svg>
  );
}
function GlyphTarget() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="1.7" fill="currentColor" />
    </svg>
  );
}

export default function HomePage() {
  return (
    <PublicShell>
      {/* ============ H1 — Hero (includes the learning-journey strip) ============
          Lives in components/HomeHero.tsx since 2026-09-05, with its full
          change history (the DR-02 copy override, the founder photo, the
          declined AI composite, the reference-architecture rebuild that
          brought the journey strip back inside the hero) in that file's
          header comment. */}
      <HomeHero />

      {/* ============ Diagnostic band (night) ============
          Moved above "Three pathways" (2026-09-05, founder request) — was
          previously the last section before the footer.

          REBUILT 2026-09-05, later still (founder request): from a static
          CTA banner into the real, live diagnostic walkthrough, embedded
          directly here so a visitor can take it without navigating to
          /diagnostic. Lives in components/HomeDiagnostic.tsx — its own
          header comment covers what's real (the same 10 questions, same
          fixture logic as /diagnostic) versus what's a wireframe (the
          50/100/200 question-count options, and the certificate-of-
          attempt offer on the result page this leads to). */}
      <HomeDiagnostic />

      {/* ============ H2 — Three pathways (light) ============
          mt-12 (48px): standardised inter-section gap, matching the
          hero→journey-strip gap (HomeHero.module.css `.hero-journey`'s
          `margin: 48px auto 64px`) — 2026-09-05, founder request to keep
          that same spacing between every homepage section. Separate from
          each section's own py-* (internal content padding, unchanged). */}
      <section className="mx-auto mt-12 max-w-[1280px] outline outline-[#e5e5e5] px-6 py-[25px]">
        <p className="text-label mb-3 text-center text-[var(--color-primary)]">
          Three pathways
        </p>
        <h2 className="text-display mb-12 text-center">
          Start where it makes sense for you
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          <Card variant="panel">
            <div className="mb-5 inline-flex rounded-[10px] bg-[var(--color-prof-1)] p-2.5 text-[var(--color-primary)]">
              <GlyphRise />
            </div>
            <p className="text-label mb-2">For individuals</p>
            <h3 className="text-h2 mb-2">Explore courses</h3>
            <p className="text-body-sm mb-6 text-[var(--color-ink-quiet)]">
              Expert-led courses with stated capability outcomes, delivered
              live — and an assessed path to the credential.
            </p>
            <Button variant="secondary" href="/courses">
              See the courses
            </Button>
          </Card>
          <Card variant="panel">
            <div className="mb-5 inline-flex rounded-[10px] bg-[var(--color-prof-1)] p-2.5 text-[var(--color-primary)]">
              <GlyphNodes />
            </div>
            <p className="text-label mb-2">For organisations</p>
            <h3 className="text-h2 mb-2">Train your team</h3>
            <p className="text-body-sm mb-6 text-[var(--color-ink-quiet)]">
              Private cohorts and tailored engagements — on-site, live online,
              and internationally — with evidence the capability changed.
            </p>
            <Button variant="secondary" href="/contact-us">
              How we work with teams
            </Button>
          </Card>
          <Card variant="panel">
            <div className="mb-5 inline-flex rounded-[10px] bg-[var(--color-prof-1)] p-2.5 text-[var(--color-primary)]">
              <GlyphTarget />
            </div>
            <p className="text-label mb-2">Not sure where to start?</p>
            <h3 className="text-h2 mb-2">Assess your capability</h3>
            <p className="text-body-sm mb-6 text-[var(--color-ink-quiet)]">
              Ten minutes, free, and you get a specific answer about where you
              stand — not a score.
            </p>
            <Button variant="secondary" href="/diagnostic">
              Start free diagnostic (10 min)
            </Button>
          </Card>
        </div>
      </section>

      {/* ============ H4 — How it works (light, editorial 01–04) ============
          mt-12 (48px): standardised inter-section gap — see the note on
          "Three pathways" above. */}
      <section
        id="delivery"
        className="mx-auto mt-12 max-w-[1280px] scroll-mt-24 outline outline-[#e5e5e5] px-6 py-[25px]"
      >
        <p className="text-label mb-3 text-[var(--color-primary)]">
          How it works
        </p>
        <h2 className="text-display mb-4 max-w-[680px]">
          Live means live. You are in the room — physical or online.
        </h2>
        <p className="text-body-lg mb-12 max-w-[680px] text-[var(--color-ink-quiet)]">
          A session is interaction: questions, discussion of your own
          situation, worked examples, and direct expert feedback — alongside
          peers from other organisations. It is never watching a recording.
        </p>
        <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Each format reserves a photograph (2026-09-02). This is the
              portal's highest-value image slot: the section makes the
              product's central claim — you are in the room with a
              practitioner — and until now proved it with a text grid alone.
              2026-09-05: each frame now shows an original abstract SVG
              illustration (components/illustrations/DeliveryIllustrations.tsx)
              rather than staying an empty dashed box — see that file's own
              header comment for why this isn't a stock/AI photograph.
              Swapping in a real photograph is still just a `src` prop; no
              layout changes. */}
          {[
            {
              title: "Face-to-face",
              body: "Instructor-led courses and workshops, delivered in person.",
              shot: "A face-to-face session in progress — room, participants, practitioner teaching",
              note: "consent required",
              illustration: <FaceToFaceIllustration />,
            },
            {
              title: "Live online",
              body: "Real-time sessions with the same interaction, questions and feedback — not pre-recorded content.",
              shot: "A live online session as run — screen, gallery of participants, discussion",
              note: "no client data on screen",
              illustration: <LiveOnlineIllustration />,
            },
            {
              title: "Private cohorts",
              body: "Dedicated courses for one organisation, shaped to its context.",
              shot: "A single-organisation cohort working together",
              note: "client consent essential",
              illustration: <PrivateCohortIllustration />,
            },
            {
              title: "On-site & international",
              body: "Expert-led delivery at your location, including outside Malaysia.",
              shot: "Delivery at a client site, ideally showing place",
              note: "consent required",
              illustration: <OnSiteIllustration />,
            },
          ].map(({ title, body, shot, note, illustration }, i) => (
            <div
              key={title}
              className="border-t-2 border-[var(--color-primary)]/60 pt-5"
            >
              <p className="text-mono text-body-sm mb-3 text-[var(--color-ink-faint)]">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="text-h2 mb-2">{title}</h3>
              <p className="text-body-sm mb-5 text-[var(--color-ink-quiet)]">
                {body}
              </p>
              <ImageFrame
                subject={shot}
                ratio="4 / 3"
                minWidth={1600}
                note={note}
                illustration={illustration}
              />
            </div>
          ))}
        </div>
        <p className="mt-12 max-w-[680px] text-body-sm text-[var(--color-ink-faint)]">
          Materials — readings, templates, exercises, session preparation —
          support the live experience. They prepare, extend and reinforce it;
          they never replace it.
        </p>
      </section>

      {/* H6 "Capability areas" and its paired "Why expert-led" panel were
          REMOVED 2026-09-05 by founder direction. Capability areas listed
          the subject-scope domains (data/domains.ts) with a Chip per code;
          "Why expert-led" restated the live/direct-feedback/earned-
          credential differentiator already stated in H1 and H4. Neither
          was discarded from the codebase — data/domains.ts, <Chip>, and
          the differentiator copy all still exist, just unused on this
          page now. The #capability and #why-expert-led anchors are gone
          too; nothing else on the site links to them.

          H5 Courses, H7 Certification, H8 For organisations and H9
          "Where we are today" were REMOVED 2026-09-02 by founder
          direction. See docs/P01_DESIGN_DECISIONS.md "Homepage reduced"
          for what each carried and where it went. The certification
          content was not discarded — it moved to /certifications. */}
    </PublicShell>
  );
}
