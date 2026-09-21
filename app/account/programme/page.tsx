import type { Metadata } from "next";
import Link from "next/link";
import { MODALITY_LABEL, listUpcomingPublicOfferings, type OfferingRecord } from "@/modules/catalogue/offerings/repository";
import { findFlagshipProgramme } from "@/modules/catalogue/programmes/repository";
import { requireUser } from "@/modules/identity/session";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";

/*
 * The Academy's programme, shown to a signed-in participant.
 * PORTED 2026-09-21 from project-artifacts/mockup/app/account/programme/
 * page.tsx (ADR-045). Changed: the ONE programme is the flagship from the
 * programme repository (title, subtitle, summary, level, duration, delivery
 * formats); the sample "Next start" dates, `SAMPLE_TRAINER`, `SampleTag`,
 * `WireframeNote` and the /checkout `RegisterButton` are gone. A "Dates"
 * block shows the REAL upcoming public offerings, or says the first dates
 * are being prepared when there are none (DR-02 §4.1: never an invented
 * date). Investment, outcomes, "included" and the curriculum are not
 * repeated here — the public programme page, linked below, carries them.
 */
export const metadata: Metadata = { title: "Programme" };

const dayMonth = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const dayMonthYear = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

function formatDateRange(startsOn: Date, endsOn: Date): string {
  if (startsOn.getTime() === endsOn.getTime()) return dayMonthYear.format(startsOn);
  const sameYear = startsOn.getUTCFullYear() === endsOn.getUTCFullYear();
  return `${sameYear ? dayMonth.format(startsOn) : dayMonthYear.format(startsOn)} – ${dayMonthYear.format(endsOn)}`;
}

function OfferingRow({ offering }: { offering: OfferingRecord }) {
  const f = offering.format;
  return (
    <li className="rounded-[var(--radius-plate)] border border-[var(--color-line)] bg-[var(--color-ground)] p-4">
      <div className="mb-2 flex flex-wrap gap-2">
        {f?.badge && <Chip tone="primary">{f.badge}</Chip>}
        <Chip>{MODALITY_LABEL[offering.modality]}</Chip>
      </div>
      <p className="text-body-lg font-medium">{f?.name ?? offering.programmeTitle}</p>
      <p className="text-body-sm text-[var(--color-ink-quiet)]">
        {formatDateRange(offering.startsOn, offering.endsOn)}
        {offering.location && ` · ${offering.location}`}
      </p>
      {offering.scheduleNote && <p className="text-body-sm text-[var(--color-ink-faint)]">{offering.scheduleNote}</p>}
    </li>
  );
}

export default async function ProgrammePage() {
  await requireUser("/account/programme");
  const course = await findFlagshipProgramme();
  const offerings = course ? await listUpcomingPublicOfferings(course.id) : [];
  const interestHref = course ? `/contact-us?kind=programme_interest&programme=${course.slug}` : "/contact-us";

  if (!course) {
    return (
      <div className="flex flex-col gap-8">
        <header>
          <p className="text-label mb-2 text-[var(--color-primary)]">Programme</p>
          <h1 className="text-display">Programme</h1>
        </header>
        <Card variant="panel" className="p-6 sm:p-8">
          <p className="text-body-sm text-[var(--color-ink-quiet)]">No programme is published yet.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-label mb-2 text-[var(--color-primary)]">Programme</p>
        <h1 className="text-display">{course.title}</h1>
        {course.subtitle && <p className="text-body-lg mt-3 max-w-[62ch] text-[var(--color-ink-quiet)]">{course.subtitle}</p>}
        <p className="text-body-sm mt-3 max-w-[62ch] text-[var(--color-ink-quiet)]">{course.summary}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Chip>{course.level}</Chip>
          <Chip>{course.durationLabel}</Chip>
        </div>
      </header>

      <Card variant="feature" className="p-5! sm:p-8!">
        <h2 className="text-h1 mb-1">Dates</h2>
        {offerings.length === 0 ? (
          <>
            <p className="text-body-lg font-medium">The first dates are being prepared.</p>
            <p className="text-body-sm mt-2 max-w-[60ch] text-[var(--color-ink-quiet)]">
              Pricing is published and registering interest is open, but public schedules are not — dates and
              invoicing are confirmed directly with you.
            </p>
          </>
        ) : (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {offerings.map((o) => (
              <OfferingRow key={o.id} offering={o} />
            ))}
          </ul>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          <Button href={interestHref}>Register interest</Button>
          <Button variant="secondary" href="/schedule">
            Upcoming dates
          </Button>
        </div>
      </Card>

      <section aria-labelledby="prog-formats">
        <h2 id="prog-formats" className="text-h1 mb-4">
          Choose how you attend
        </h2>
        <ul className="grid gap-4 lg:grid-cols-3">
          {course.deliveryFormats.map((f) => (
            <li key={f.id}>
              <Card variant="panel" className="h-full p-5">
                {f.badge && (
                  <div className="mb-3">
                    <Chip tone="primary">{f.badge}</Chip>
                  </div>
                )}
                <p className="text-body-lg font-medium">{f.name}</p>
                <p className="text-body-sm mt-1 text-[var(--color-ink-quiet)]">
                  {f.durationLabel} · {f.scheduleLabel} · {f.totalTimeLabel}
                </p>
                {f.bestFor.length > 0 && (
                  <>
                    <p className="text-label mt-4 mb-1.5">Best for</p>
                    <ul className="text-body-sm list-disc pl-5 text-[var(--color-ink-quiet)]">
                      {f.bestFor.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  </>
                )}
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-body-sm text-[var(--color-ink-quiet)]">
        Investment, outcomes and the full curriculum are on the{" "}
        <Link href="/DataBlueprint-AIVibeCoding" className="text-[var(--color-primary)] underline underline-offset-4">
          programme page
        </Link>
        .
      </p>
    </div>
  );
}
