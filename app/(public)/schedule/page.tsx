import type { Metadata } from "next";
import Link from "next/link";
import { listUpcomingPublicOfferings, type OfferingRecord } from "@/modules/catalogue/offerings/repository";
import { OfferingDateCard } from "@/shared/marketing/ProgrammeDates";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";

/*
 * PORTED 2026-09-21 from project-artifacts/mockup/app/schedule/page.tsx
 * (ADR-045). Changed: the wireframe's sample offerings, `sampleSeats`,
 * `SampleTag`, `WireframeNote` and the inert waitlist button are gone; the
 * page reads REAL upcoming public offerings (`listUpcomingPublicOfferings`).
 * With none scheduled it renders a first-class empty state in the
 * wireframe's own honest wording (from its about-us "Where we are today"
 * section) and a register-interest enquiry link. Capacity is shown as
 * published ("Capacity N") — never "seats left", which needs registrations
 * (M4). Dates are the offering's own, en-GB.
 *
 * Milestone 12 (2026-09-26): until now this page listed the FLAGSHIP's dates
 * only, so a training launched from the portal could never be booked here.
 * It now lists every published training's upcoming public dates, grouped by
 * training, each group linking to its page. The card is shared with the
 * training page's own Dates section (src/shared/marketing/ProgrammeDates).
 *
 * Schedule / upcoming dates (P24 Scheduled Offerings). No date is ever
 * invented (DR-02 §4.1).
 */
export const metadata: Metadata = {
  title: "Schedule",
  description: "Upcoming training dates and formats.",
};

export const dynamic = "force-dynamic";

function groupByProgramme(offerings: OfferingRecord[]): { slug: string; title: string; offerings: OfferingRecord[] }[] {
  const groups = new Map<string, { slug: string; title: string; offerings: OfferingRecord[] }>();
  for (const o of offerings) {
    const g = groups.get(o.programmeId) ?? { slug: o.programmeSlug, title: o.programmeTitle, offerings: [] };
    g.offerings.push(o);
    groups.set(o.programmeId, g);
  }
  return [...groups.values()];
}

export default async function SchedulePage() {
  const offerings = await listUpcomingPublicOfferings();
  const groups = groupByProgramme(offerings);

  return (
    <section className="bg-[var(--color-ground-tint)]">
      <div className="mx-auto max-w-[900px] px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-label mb-3 text-[var(--color-primary)]">Schedule</p>
        <h1 className="mb-3 text-display">Upcoming dates</h1>
        <p className="text-body-lg mb-8 max-w-[60ch] text-[var(--color-ink-quiet)]">
          Every published training, delivered live. Choose the date and format that fit your week.
        </p>
        {groups.length === 0 ? (
          <Card variant="panel" className="p-5 sm:p-6">
            <p className="text-body-lg font-medium">The first dates are being prepared.</p>
            <p className="text-body-sm mt-2 max-w-[60ch] text-[var(--color-ink-quiet)]">
              Pricing is published and registering interest is open, but
              public schedules are not — dates and invoicing are confirmed
              directly with you. When schedules do publish, they will be real
              dates, not a padded catalogue.
            </p>
            <div className="mt-5">
              <Button href="/contact-us?kind=programme_interest">Register interest</Button>
            </div>
          </Card>
        ) : (
          <div className="flex flex-col gap-10">
            {groups.map((g) => {
              const enquiryHref = `/contact-us?kind=programme_interest&programme=${g.slug}`;
              return (
                <section key={g.slug} aria-labelledby={`schedule-${g.slug}`} data-testid="schedule-group" data-slug={g.slug}>
                  <h2 id={`schedule-${g.slug}`} className="text-h1 mb-1">
                    <Link href={`/programs/${g.slug}`} className="hover:text-[var(--color-primary)]">
                      {g.title}
                    </Link>
                  </h2>
                  <p className="text-body-sm mb-4 text-[var(--color-ink-quiet)]">
                    <Link href={`/programs/${g.slug}`} className="text-[var(--color-primary)] underline underline-offset-4">
                      About this training
                    </Link>
                  </p>
                  <ul className="flex flex-col gap-4">
                    {g.offerings.map((o) => (
                      <li key={o.id}>
                        <OfferingDateCard offering={o} enquiryHref={enquiryHref} />
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
