import { MODALITY_LABEL } from "@/modules/catalogue/offerings/constants";
import type { OfferingRecord } from "@/modules/catalogue/offerings/repository";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";

/*
 * Dates on a training's own page (Milestone 12, decision L11 — the gap the
 * founder hit on 2026-09-26: a training page with no way to book). Renders
 * the training's upcoming public dates; an OPEN date registers through the
 * real checkout, a planned or full date offers the enquiry. With none, the
 * section is not rendered at all — the hero keeps "Register your interest".
 * Same card shape as /schedule so the two never disagree.
 */
const dayMonth = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const dayMonthYear = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export function formatOfferingDates(startsOn: Date, endsOn: Date): string {
  if (startsOn.getTime() === endsOn.getTime()) return dayMonthYear.format(startsOn);
  const sameYear = startsOn.getUTCFullYear() === endsOn.getUTCFullYear();
  return `${sameYear ? dayMonth.format(startsOn) : dayMonthYear.format(startsOn)} – ${dayMonthYear.format(endsOn)}`;
}

export function OfferingDateCard({ offering, enquiryHref }: { offering: OfferingRecord; enquiryHref: string }) {
  const f = offering.format;
  return (
    <Card variant="panel" className="p-5 sm:p-6" data-testid="offering-card" data-offering-id={offering.id} data-status={offering.status}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap gap-2">
            {f?.badge && <Chip tone="primary">{f.badge}</Chip>}
            <Chip>{MODALITY_LABEL[offering.modality]}</Chip>
            {offering.capacity !== null && <Chip>Capacity {offering.capacity}</Chip>}
          </div>
          <p className="text-body-lg font-medium">{f?.name ?? offering.programmeTitle}</p>
          <p className="text-body-sm text-[var(--color-ink-quiet)]">
            {formatOfferingDates(offering.startsOn, offering.endsOn)}
            {offering.location && ` · ${offering.location}`}
          </p>
          {f && (
            <p className="text-body-sm text-[var(--color-ink-faint)]">
              {f.durationLabel} · {f.scheduleLabel} · {f.totalTimeLabel}
            </p>
          )}
          {offering.scheduleNote && <p className="text-body-sm text-[var(--color-ink-faint)]">{offering.scheduleNote}</p>}
        </div>
        <div className="shrink-0">
          {/* M4 (2026-09-21): an OPEN date registers through the real
              checkout; other statuses keep the register-interest enquiry. */}
          {offering.status === "open" ? (
            <Button href={`/checkout/${offering.id}`} data-testid="register">
              Register
            </Button>
          ) : (
            <Button href={enquiryHref}>Register interest</Button>
          )}
        </div>
      </div>
    </Card>
  );
}

export function ProgrammeDates({ offerings, enquiryHref }: { offerings: OfferingRecord[]; enquiryHref: string }) {
  if (offerings.length === 0) return null;
  const open = offerings.filter((o) => o.status === "open").length;
  return (
    <section id="dates" className="scroll-mt-24 border-t border-[var(--color-line)] bg-[var(--color-ground)]" data-testid="programme-dates">
      <div className="mx-auto max-w-[1280px] px-6 py-16">
        <p className="text-label mb-3 text-[var(--color-primary)]">Dates</p>
        <h2 className="text-display mb-4">Upcoming dates</h2>
        <p className="text-body-lg mb-8 max-w-[640px] text-[var(--color-ink-quiet)]">
          {open > 0 ? "Register for an open date and pay on Stripe's secure page; your place is confirmed the moment the payment completes." : "Dates are planned; register your interest and we will tell you the moment registration opens."}
        </p>
        <ul className="flex flex-col gap-4">
          {offerings.map((o) => (
            <li key={o.id}>
              <OfferingDateCard offering={o} enquiryHref={enquiryHref} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
