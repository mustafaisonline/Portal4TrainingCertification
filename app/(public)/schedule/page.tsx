import type { Metadata } from "next";
import { findFlagshipProgramme } from "@/modules/catalogue/programmes/repository";
import {
  MODALITY_LABEL,
  listUpcomingPublicOfferings,
  type OfferingRecord,
} from "@/modules/catalogue/offerings/repository";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";

/*
 * PORTED 2026-09-21 from project-artifacts/mockup/app/schedule/page.tsx
 * (ADR-045). Changed: the wireframe's sample offerings, `sampleSeats`,
 * `SampleTag`, `WireframeNote` and the inert waitlist button are gone; the
 * page reads the flagship programme and its REAL upcoming public offerings
 * (`listUpcomingPublicOfferings`). With none scheduled it renders a
 * first-class empty state in the wireframe's own honest wording (from its
 * about-us "Where we are today" section) and a register-interest enquiry
 * link. Capacity is shown as published ("Capacity N") — never "seats left",
 * which needs registrations (M4). Dates are the offering's own, en-GB.
 *
 * Schedule / upcoming dates (P24 Scheduled Offerings). No date is ever
 * invented (DR-02 §4.1).
 */
export const metadata: Metadata = {
  title: "Schedule",
  description: "Upcoming programme dates and formats.",
};

export const dynamic = "force-dynamic";

// Dates are calendar dates (no time); format in UTC so the stored day is
// the day shown regardless of server timezone.
const dayMonth = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const dayMonthYear = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

function formatDateRange(startsOn: Date, endsOn: Date): string {
  if (startsOn.getTime() === endsOn.getTime()) return dayMonthYear.format(startsOn);
  const sameYear = startsOn.getUTCFullYear() === endsOn.getUTCFullYear();
  return `${sameYear ? dayMonth.format(startsOn) : dayMonthYear.format(startsOn)} – ${dayMonthYear.format(endsOn)}`;
}

function OfferingCard({ offering, enquiryHref }: { offering: OfferingRecord; enquiryHref: string }) {
  const f = offering.format;
  return (
    <Card variant="panel" className="p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap gap-2">
            {f?.badge && <Chip tone="primary">{f.badge}</Chip>}
            <Chip>{MODALITY_LABEL[offering.modality]}</Chip>
            {offering.capacity !== null && <Chip>Capacity {offering.capacity}</Chip>}
          </div>
          <p className="text-body-lg font-medium">{f?.name ?? offering.programmeTitle}</p>
          <p className="text-body-sm text-[var(--color-ink-quiet)]">
            {formatDateRange(offering.startsOn, offering.endsOn)}
            {offering.location && ` · ${offering.location}`}
          </p>
          {f && (
            <p className="text-body-sm text-[var(--color-ink-faint)]">
              {f.durationLabel} · {f.scheduleLabel} · {f.totalTimeLabel}
            </p>
          )}
          {offering.scheduleNote && (
            <p className="text-body-sm text-[var(--color-ink-faint)]">{offering.scheduleNote}</p>
          )}
        </div>
        <div className="shrink-0">
          <Button href={enquiryHref}>Register interest</Button>
        </div>
      </div>
    </Card>
  );
}

export default async function SchedulePage() {
  const flagship = await findFlagshipProgramme();
  const offerings = flagship ? await listUpcomingPublicOfferings(flagship.id) : [];
  const enquiryHref = flagship
    ? `/contact-us?kind=programme_interest&programme=${flagship.slug}`
    : "/contact-us";

  return (
    <section className="bg-[var(--color-ground-tint)]">
      <div className="mx-auto max-w-[900px] px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-label mb-3 text-[var(--color-primary)]">Schedule</p>
        <h1 className="mb-3 text-display">Upcoming dates</h1>
        {flagship && (
          <p className="text-body-lg mb-8 max-w-[60ch] text-[var(--color-ink-quiet)]">
            {flagship.title}, delivered live. Choose the format that fits
            your week.
          </p>
        )}
        {offerings.length === 0 ? (
          <Card variant="panel" className="p-5 sm:p-6">
            <p className="text-body-lg font-medium">The first dates are being prepared.</p>
            <p className="text-body-sm mt-2 max-w-[60ch] text-[var(--color-ink-quiet)]">
              Pricing is published and registering interest is open, but
              public schedules are not — dates and invoicing are confirmed
              directly with you. When schedules do publish, they will be real
              dates for this course, not a padded catalogue.
            </p>
            <div className="mt-5">
              <Button href={enquiryHref}>Register interest</Button>
            </div>
          </Card>
        ) : (
          <ul className="flex flex-col gap-4">
            {offerings.map((o) => (
              <li key={o.id}>
                <OfferingCard offering={o} enquiryHref={enquiryHref} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
