import Image from "next/image";
import type { ProgrammeRecord } from "@/modules/catalogue/programmes/types";
import type { ExpertRecord } from "@/modules/catalogue/experts/repository";
import { ImageFrame } from "@/shared/marketing/ImageFrame";
import {
  CohortBuildingIllustration,
  FounderTeachingIllustration,
  TeachingDetailIllustration,
} from "@/shared/marketing/DeliveryIllustrations";
import { DeliveryFormats } from "@/shared/marketing/DeliveryFormats";
import { ProgrammePricing } from "@/shared/marketing/ProgrammePricing";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";

/*
 * PORTED 2026-09-21 from project-artifacts/mockup/app/DataBlueprint-AIVibeCoding/page.tsx
 * (ADR-045). Changed: the flagship programme and its lead expert are read
 * from the repositories (`findFlagshipProgramme`, `listPublishedExperts`)
 * instead of `data/courses.ts` / `data/practitioners.ts`; the mockup's own
 * `PublicShell` wrapper and `assetPath()` are gone (the `(public)` layout
 * provides the chrome; images are served from root `public/`); pricing uses
 * `ProgrammePricing` without the demo `registrationFlow`. Copy, structure and
 * classes are otherwise unchanged. The mockup file records the page's
 * editorial history; `docs/course_landing_page.md` there is its content
 * source.
 *
 * MOVED 2026-09-26 (founder: "/DataBlueprint-AIVibeCoding → /programs",
 * "Programme → Trainings"). Formerly the page at that route; now a server
 * component the training detail page (./page.tsx) renders in place of the
 * generic template whenever the resolved programme is the flagship. The
 * programme and the published experts are passed in — this file no longer
 * reads the database or exports route metadata. The old URL redirects here
 * permanently (next.config.ts). The section that was only ever on the generic
 * template — "Flexible learning formats" — is now included below (shared
 * `DeliveryFormats`), so nothing the flagship published disappears; the
 * closing CTA's "Explore the course" link, which pointed at that template,
 * is now the enquiry link. Everything else is unchanged.
 *
 * A single-proposition page for the founder-designated flagship, resolved by
 * `flagship = true`, never by a slug literal (ADR-023).
 */

/** Original inline glyph, local to this page — identical markup to
 *  the trainers page's own `GlyphArrowRight`, so the "View full profile"
 *  button here matches that page's exactly. */
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
 *  short tags) doesn't fit. */
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

export function FlagshipLanding({
  programme: flagship,
  experts,
}: {
  programme: ProgrammeRecord;
  experts: ExpertRecord[];
}) {
  // The programme's lead expert, with the full published profile (the
  // programme record carries only a summary). Falls back to the first
  // published expert if no association exists.
  const lead =
    experts.find((e) => flagship.experts.some((x) => x.id === e.id)) ??
    experts[0];
  const accreditation = lead?.hrdCorpAccreditation;
  const enquiryHref = `/contact-us?kind=programme_interest&programme=${flagship.slug}`;

  return (
    <>
      {/* ===== Hero — §8.1 =====
          `night hero-band` is the dark navy hero (see app/globals.css).
          Photo: an AI-generated scene (a practitioner walking a group
          through a build framework at a whiteboard) — a generic figure,
          not the founder's likeness; permitted under the mockup's
          docs/IMAGE_SLOTS.md rule 2. `illustration` stays in place, inert
          per ImageFrame's own `src`-wins contract. */}
      <section className="night hero-band relative overflow-hidden">
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
          Background tone: light-blue, distinct from its neighbours. */}
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
          Photo: an AI-generated whiteboard scene mapping the
          Plan→Build→Test→Deploy→Improve loop this section describes. */}
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
          Photo: an AI-generated scene of the five-stage journey on a
          whiteboard; landscape ratio to match this page's other photos. */}
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
          Same `<details>/<summary>` pattern and classes as the course
          detail page's own Curriculum section, over the same `modules`
          rows, so the two pages can never drift on module content. Sits
          directly before "Who Teaches You" (founder direction). */}
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

      {/* ===== Delivery formats — moved here from the generic detail
          template, 2026-09-26 (see header). ===== */}
      <DeliveryFormats formats={flagship.deliveryFormats} />

      {/* ===== Who teaches you — §8.6 =====
          Reflects the experts repository honestly: one genuine
          practitioner today, founder-led — same convention as the homepage
          and /trainers. Plain ground so it does not repeat the Curriculum
          band above it. The card's second column is a flex row: the text
          block keeps its natural (`max-w-[640px]`-capped) width and the
          HRD Corp badge centres in whatever space is left. The badge image
          itself is not a link — the "Verify" button is the one path to
          verification, as on /trainers. */}
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
                src={lead.photoPath}
                alt={`Photograph of ${lead.name}`}
                width={800}
                height={800}
                className="h-28 w-28 shrink-0 rounded-[var(--radius-plate)] object-cover"
              />
              <div className="flex flex-wrap items-center gap-8">
                {/* `max-w-full`: flex-none alone let this block keep its 640px
                    natural width on a phone and push the whole page sideways.
                    Caps it at the row's own width; no effect wider than 640. */}
                <div className="max-w-full flex-none">
                  <h3 className="text-h1 mb-1">{lead.name}</h3>
                  <p className="text-label mb-4">{lead.roleTitle}</p>
                  <p className="mb-6 max-w-[640px] text-body-sm text-[var(--color-ink-quiet)]">
                    {lead.name} has spent 24+ years building enterprise data
                    and AI platforms across banking, energy, telecom and
                    government — and founded and still runs a 40,000+
                    member Big Data community, alongside a podcast with 80+
                    episodes. This course is taught by someone who has done
                    the work, not someone reading a script.
                  </p>
                  {/* The same two OUTBOUND buttons /trainers' own lead-
                      trainer card uses — genuine profile, genuine LinkedIn,
                      both real published channels, opening in a new tab. */}
                  <div className="flex flex-wrap gap-3">
                    {lead.profile.mediumProfile && (
                      <Button
                        href={lead.profile.mediumProfile}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`View ${lead.name}'s full profile on Medium (opens in a new tab)`}
                      >
                        View full profile
                        <GlyphArrowRight />
                      </Button>
                    )}
                    {lead.profile.linkedin && (
                      <Button
                        variant="secondary"
                        href={lead.profile.linkedin}
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
                      src={accreditation.badge}
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

      {/* Participant stories — EMPTY STATE, 2026-09-20 founder direction
          ("add these as sections … data we will add later"). No cohort has
          run, so there are no stories; fabricating testimonials is the most
          damaging thing this portal could do. The section exists so the
          slot is designed and honest. */}
      <section className="mx-auto max-w-[1280px] px-6 py-14">
        <p className="text-label mb-2 text-[var(--color-primary)]">Participant stories</p>
        <h2 className="text-display mb-4">What participants say</h2>
        <div className="rounded-[var(--radius-panel)] border border-dashed border-[var(--color-line-strong)] p-6 text-body-sm text-[var(--color-ink-quiet)] sm:p-8">
          The first cohort has not run yet, so there are no stories to show —
          and we will not invent any. Real participants&rsquo; words, with
          their permission, will appear here after the first programme.
        </div>
      </section>

      {/* ===== Investment — §8.7 =====
          The same `ProgrammePricing` component the detail page uses, fed
          the flagship's own prices/valueStack — so the two pages can never
          show different numbers for the same programme. */}
      {flagship.prices.length > 0 && (
        <ProgrammePricing
          prices={flagship.prices}
          valueStack={flagship.content.valueStack}
          valueStackTotal={flagship.content.valueStackTotal}
          programmeSlug={flagship.slug}
        />
      )}

      {/* ===== CTA — §8.8 =====
          Gradient that bookends the Hero: starts at plain ground so the
          seam with Investment (light-blue) reads as a change in tone. */}
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
            <Button href={enquiryHref}>Register your interest</Button>
            <Button variant="secondary" href="/contact-us">
              Talk to us
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
