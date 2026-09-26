/*
 * PORTED 2026-09-21 from project-artifacts/mockup/app/page.tsx (ADR-045).
 * Changes on port: server component reading the flagship programme, the
 * published experts and the diagnostic questions through repositories and
 * passing them down; the mockup's own `<PublicShell>` wrapper is removed
 * (app/(public)/layout.tsx provides it); `assetPath()` is dropped. Copy,
 * sections, classes and markup are otherwise unchanged.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { findFlagshipProgramme } from "@/modules/catalogue/programmes/repository";
import { listPublishedExperts } from "@/modules/catalogue/experts/repository";
import { listDiagnosticQuestions } from "@/modules/catalogue/diagnostic/repository";
import { HomeHero } from "@/shared/marketing/HomeHero";
import { HomeDiagnostic } from "@/shared/marketing/HomeDiagnostic";
import { ImageFrame } from "@/shared/marketing/ImageFrame";
import {
  FaceToFaceIllustration,
  LiveOnlineIllustration,
  OnSiteIllustration,
  PrivateCohortIllustration,
} from "@/shared/marketing/DeliveryIllustrations";
import { Card } from "@/shared/ui/Card";

export const metadata: Metadata = {
  // The homepage carries the site name alone; every other page uses the
  // root layout's "%s · Data & AI Academy" template.
  title: { absolute: "Data & AI Academy" },
};

/**
 * P01 — Homepage (H0–H9 per the mockup's P01 specification; H5–H9 removed
 * by founder direction before port).
 *
 * Inventory state: no confirmed public course inventory. Nothing here shows
 * a date, capacity or price. Decorative graphics on THIS page (the three
 * pathway glyphs below) are ORIGINAL inline SVG.
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

export default async function HomePage() {
  const [flagship, experts, questions] = await Promise.all([
    findFlagshipProgramme(),
    listPublishedExperts(),
    listDiagnosticQuestions(),
  ]);

  // 2026-09-26 (founder): the public catalogue is the /programs hub
  // ("Trainings"), which lists every published training; the flagship's own
  // page is /programs/<slug>. The hero CTA points at the hub either way.
  const coursesHref = "/programs";
  const founder = experts[0] ?? null;

  return (
    <>
      {/* ============ H1 — Hero (includes the learning-journey strip) ============ */}
      <HomeHero founder={founder} exploreHref={coursesHref} />

      {/* ============ Diagnostic band ============
          The real, live diagnostic walkthrough, embedded directly here so a
          visitor can take it without navigating to /diagnostic. Rendered
          only when the question set exists. */}
      {questions.length > 0 && <HomeDiagnostic questions={questions} />}

      {/* ============ H2 — Three pathways (light) ============
          mt-12 (48px): standardised inter-section gap between every
          homepage section. Separate from each section's own py-* (internal
          content padding). */}
      <section className="mx-auto mt-12 max-w-[1280px] outline outline-[#e5e5e5] px-6 py-[25px]">
        <p className="text-label mb-3 text-center text-[var(--color-primary)]">
          Three pathways
        </p>
        <h2 className="text-display mb-12 text-center">
          Start where it makes sense for you
        </h2>
        {/* Distinct-but-harmonious accent per pathway (blue / purple /
            cyan-teal). Buttons are plain <Link>s with their own full class
            set rather than <Button className=...>: Button's variant classes
            and any background or border override on the same element are
            conflicting Tailwind utilities with no reliable winner. */}
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              accent: "#2563eb",
              chip: "bg-[rgba(37,99,235,0.1)] text-[#2563eb]",
              btn: "bg-[#2563eb] hover:bg-[#1d4ed8] shadow-[0_8px_20px_rgba(37,99,235,0.3)]",
              glyph: <GlyphRise />,
              label: "For individuals",
              title: "Explore courses",
              body: "Expert-led courses with stated capability outcomes, delivered live — and an assessed path to the credential.",
              href: coursesHref,
              cta: "See the courses",
            },
            {
              accent: "#7c3aed",
              chip: "bg-[rgba(124,58,237,0.1)] text-[#7c3aed]",
              btn: "bg-[#7c3aed] hover:bg-[#6d28d9] shadow-[0_8px_20px_rgba(124,58,237,0.3)]",
              glyph: <GlyphNodes />,
              label: "For organisations",
              title: "Train your team",
              body: "Private cohorts and tailored engagements — on-site, live online, and internationally — with evidence the capability changed.",
              href: "/contact-us",
              cta: "How we work with teams",
            },
            {
              accent: "#0e7490",
              chip: "bg-[rgba(8,145,178,0.12)] text-[#0e7490]",
              btn: "bg-[#0e7490] hover:bg-[#155e75] shadow-[0_8px_20px_rgba(14,116,144,0.3)]",
              glyph: <GlyphTarget />,
              label: "Not sure where to start?",
              title: "Assess your capability",
              body: "Ten minutes, free, and you get a specific answer about where you stand — not a score.",
              href: "/diagnostic",
              cta: "Start free diagnostic (10 min)",
            },
          ].map((p) => (
            <Card
              key={p.title}
              variant="panel"
              className="flex flex-col border-t-[3px] transition-transform duration-200 hover:-translate-y-1"
              style={{ borderTopColor: p.accent }}
            >
              <div className={`mb-5 inline-flex self-start rounded-[10px] p-2.5 ${p.chip}`}>
                {p.glyph}
              </div>
              <p className="text-label mb-2">{p.label}</p>
              <h3 className="text-h2 mb-2">{p.title}</h3>
              {/* `flex-1` removed from the body, `mt-auto` on the CTA
                  (2026-09-26): same fix as CourseCard.tsx — equal-height
                  grid cards must shed surplus height at the bottom, not
                  inside a short paragraph. */}
              <p className="text-body-sm mb-6 text-[var(--color-ink-quiet)]">
                {p.body}
              </p>
              <Link
                href={p.href}
                className={`mt-auto inline-flex items-center justify-center gap-2 self-start rounded-[var(--radius-plate)] px-5 py-2.5 text-body-sm font-medium text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb] ${p.btn}`}
              >
                {p.cta}
              </Link>
            </Card>
          ))}
        </div>
      </section>

      {/* ============ H4 — How it works (light, editorial 01–04) ============
          mt-12 (48px): standardised inter-section gap — see "Three pathways". */}
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
          {/* Each format shows a founder-supplied photograph (public/delivery/*).
              `illustration` is left in place on every entry: per ImageFrame's
              contract `src` always wins when both are supplied, so each is
              inert here — reverting any one format to its illustration is
              just deleting that entry's `photo`/`photoAlt` pair. */}
          {[
            {
              title: "Face-to-face",
              body: "Instructor-led courses and workshops, delivered in person.",
              shot: "A face-to-face session in progress — room, participants, practitioner teaching",
              note: "consent required",
              illustration: <FaceToFaceIllustration />,
              photo: "/delivery/face-to-face.png",
              photoAlt:
                "A trainer leading a face-to-face session, presenting to seated participants",
            },
            {
              title: "Live online",
              body: "Real-time sessions with the same interaction, questions and feedback — not pre-recorded content.",
              shot: "A live online session as run — screen, gallery of participants, discussion",
              note: "no client data on screen",
              illustration: <LiveOnlineIllustration />,
              photo: "/delivery/live-online.png",
              photoAlt:
                "A learner attending a live online session on a laptop video call, taking notes",
            },
            {
              title: "Private cohorts",
              body: "Dedicated courses for one organisation, shaped to its context.",
              shot: "A single-organisation cohort working together",
              note: "client consent essential",
              illustration: <PrivateCohortIllustration />,
              photo: "/delivery/private-cohorts.png",
              photoAlt:
                "A small private cohort working together around a table, discussing and taking notes",
            },
            {
              title: "On-site & international",
              body: "Expert-led delivery at your location, including outside Malaysia.",
              shot: "Delivery at a client site, ideally showing place",
              note: "consent required",
              illustration: <OnSiteIllustration />,
              photo: "/delivery/on-site-international.png",
              photoAlt:
                "A practitioner briefing a group on-site, with a city skyline in the background",
            },
          ].map(({ title, body, shot, note, illustration, photo, photoAlt }, i) => (
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
                src={photo}
                alt={photoAlt}
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
    </>
  );
}
