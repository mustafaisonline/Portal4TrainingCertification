import type { Metadata } from "next";
import { CONTACT_EMAIL, contactMailto, interestSubject } from "@/content/contact";
import { headOffice, partnerLocations } from "@/content/locations";
import { findPublishedProgrammeBySlug } from "@/modules/catalogue/programmes/repository";
import { Button } from "@/shared/ui/Button";
import { LocationCard } from "@/shared/marketing/LocationCard";
import { Card } from "@/shared/ui/Card";

/*
 * PORTED 2026-09-21 from project-artifacts/mockup/app/contact-us/page.tsx (ADR-045)
 * Changed: the inert enquiry form is now the real `EnquiryForm` (server action);
 * the page reads `kind` and `programme` from the query string so other pages
 * can pre-set the enquiry type and the programme it concerns; the
 * "For organisations" route card links to /programs#for-organisations (the
 * mockup linked back to /contact-us itself, predating that section; the
 * dedicated /for-organisations page it linked to for a while was retired
 * 2026-09-28, merged into /programs); the mockup's own
 * <PublicShell> wrapper dropped (app/(public)/layout.tsx provides it);
 * metadata title shortened. Copy otherwise unchanged.
 */

/**
 * Contact — added 2026-09-02 by founder direction; REDUCED 2026-09-29
 * (Milestone 15, Requirement 8): the enquiry form is gone and the page is the
 * three routes plus ONE contact option, the sales email — supplied by the
 * founder and shared from `@/content/contact`. WhatsApp was considered and
 * dropped by the founder the same day. Nothing else is invented: still no
 * telephone number, office address, company registration or response-time
 * commitment on this page, because none is established in an approved source.
 *
 * Old links of the form /contact-us?kind=…&programme=<slug> still resolve:
 * the page reads `programme` only to name the training in a line and in the
 * email's subject, so a shared link keeps its context.
 *
 * ADDED 2026-10-01 (CR-2026-10-01-0712, founder): an "Our locations" section —
 * the head office card on top, the local training partners under it
 * (`src/content/locations.ts`). The head office carries the company number and
 * registered address the founder supplied on 2026-09-29; it still shows no
 * telephone because none has been supplied.
 */

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Talk to us about a training for yourself, capability development for your team, or teaching with the Academy.",
};

const routes = [
  {
    label: "For individuals",
    title: "A training for yourself",
    body: "Tell us where you are and what you need to be able to do. If a training fits, we will say which one — and if none does, we will say that too.",
    cta: "Explore trainings",
    href: "/programs",
  },
  {
    label: "For organisations",
    title: "Capability for your team",
    body: "Private cohorts, tailored engagements and on-site delivery, in Malaysia or internationally. These start with a conversation about the gap, not a quote.",
    cta: "How we work with teams",
    href: "/programs#for-organisations",
  },
  {
    label: "For practitioners",
    title: "Teaching with the Academy",
    body: "We add trainers slowly and only when they meet the standard. If you have built and led this work in real organisations, we would like to hear from you.",
    cta: "About the Academy",
    href: "/about-us",
  },
];

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const programmeSlug = first(params["programme"]);
  const programme = programmeSlug ? await findPublishedProgrammeBySlug(programmeSlug) : null;
  const subject = programme ? interestSubject(programme.title) : undefined;

  return (
    <>
      {/* ===== Hero ===== */}
      <section className="night hero-band relative overflow-hidden">
        <div className="relative mx-auto max-w-[1280px] px-6 py-16 lg:py-20">
          <p className="text-label mb-4 text-[var(--color-primary)]">
            Contact us
          </p>
          <h1 className="text-display-lg mb-6 max-w-[760px]">
            Tell us what you are trying to build
          </h1>
          <p className="text-body-lg max-w-[640px] text-[var(--color-ink-quiet)]">
            Whether that is your own capability, your team&rsquo;s, or a
            training you want delivered at your location — write to us and a
            practitioner will answer, not a sales sequence.
          </p>
        </div>
      </section>

      {/* ===== Three routes ===== */}
      <section className="mx-auto max-w-[1280px] px-6 py-16">
        <div className="grid gap-6 lg:grid-cols-3">
          {routes.map((r) => (
            <Card
              key={r.label}
              variant="panel"
              className="flex h-full flex-col border border-[var(--color-line)]"
            >
              <p className="text-label mb-4 text-[var(--color-primary)]">
                {r.label}
              </p>
              <h2 className="text-h1 mb-3">{r.title}</h2>
              {/* `flex-1` removed from the body, `mt-auto` on the CTA
                  wrapper (2026-09-26): same fix as CourseCard.tsx. */}
              <p className="text-body-sm mb-6 text-[var(--color-ink-quiet)]">
                {r.body}
              </p>
              <div className="mt-auto">
                <Button variant="secondary" href={r.href}>
                  {r.cta}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ===== Get in touch — the one contact option (founder, 2026-09-29) ===== */}
      <section className="border-t border-[var(--color-line)] bg-[var(--color-ground-raised)]" data-testid="contact-section">
        <div className="mx-auto max-w-[1280px] px-6 py-16">
          <div className="max-w-[720px]">
            <h2 className="text-display mb-4">Get in touch</h2>
            <p className="text-body-lg mb-8 max-w-[56ch] text-[var(--color-ink-quiet)]">
              Have a question about our training, certification or enterprise programs? Get in touch with our team.
            </p>
            {programme ? (
              <p className="text-body-sm mb-6 text-[var(--color-ink-quiet)]" data-testid="contact-about">
                About: <span className="font-medium text-[var(--color-ink)]">{programme.title}</span>
              </p>
            ) : null}

            <Card variant="panel" className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:gap-6 sm:p-8" data-testid="contact-email-card">
              <span
                aria-hidden="true"
                className="grid h-12 w-12 shrink-0 place-items-center rounded-[var(--radius-plate)] bg-[var(--color-primary)]/12 text-[var(--color-primary)]"
              >
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
                  <rect x={3.5} y={5.5} width={17} height={13} rx={2.2} />
                  <path d="M4.5 7.5l7.5 5.5 7.5-5.5" />
                </svg>
              </span>
              <div className="min-w-0">
                <p className="text-label mb-1">Email</p>
                <a
                  href={contactMailto(subject)}
                  className="text-h2 break-all text-[var(--color-primary)] underline underline-offset-4"
                  data-testid="contact-email"
                >
                  {CONTACT_EMAIL}
                </a>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* ===== Our locations — head office on top, partner locations under it (founder, 2026-10-01) ===== */}
      <section className="border-t border-[var(--color-line)]" data-testid="locations-section" aria-labelledby="locations-heading">
        <div className="mx-auto max-w-[1280px] px-6 py-16">
          <p className="text-label mb-3 text-[var(--color-primary)]">Where to find us</p>
          <h2 id="locations-heading" className="text-display mb-8">
            Our locations
          </h2>

          <div className="mb-12" data-testid="head-office">
            <LocationCard location={headOffice} />
          </div>

          {partnerLocations.length > 0 ? (
            <div data-testid="partner-locations">
              <h3 className="text-h1 mb-2">Partner locations</h3>
              <p className="text-body-sm mb-6 max-w-[62ch] text-[var(--color-ink-quiet)]">
                Where a training is delivered through a local partner, you can reach the partner directly.
              </p>
              <div className="grid gap-6 md:grid-cols-2">
                {partnerLocations.map((l) => (
                  <LocationCard key={l.id} location={l} />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}
