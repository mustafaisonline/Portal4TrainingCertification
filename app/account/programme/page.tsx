import type { Metadata } from "next";
import Link from "next/link";
import { listUpcomingPublicOfferings, type OfferingRecord } from "@/modules/catalogue/offerings/repository";
import { listPublishedProgrammes } from "@/modules/catalogue/programmes/repository";
import { levelLabel } from "@/modules/catalogue/programmes/types";
import { requireUser } from "@/modules/identity/session";
import { formatOfferingDates } from "@/shared/marketing/ProgrammeDates";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";

/*
 * The Academy's trainings, shown to a signed-in participant.
 * PORTED 2026-09-21 from project-artifacts/mockup/app/account/programme/
 * page.tsx (ADR-045) around the ONE flagship programme. REWORKED
 * 2026-09-26 after Milestone 12: every PUBLISHED training is listed, each
 * with its next public dates — an open date registers through the real
 * checkout, a planned one offers the enquiry — and links to its public
 * page for investment, outcomes and the curriculum. No date is ever
 * invented (DR-02 §4.1); a training without dates says so.
 */
// "Programme" → "Trainings", founder 2026-09-26 (menu rename).
export const metadata: Metadata = { title: "Trainings" };
export const dynamic = "force-dynamic";

function DateRow({ offering }: { offering: OfferingRecord }) {
  const f = offering.format;
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-plate)] border border-[var(--color-line)] bg-[var(--color-ground)] p-4" data-testid="account-training-date">
      <div className="min-w-0">
        <p className="text-body-sm font-medium">
          {f?.name ?? offering.programmeTitle} · {formatOfferingDates(offering.startsOn, offering.endsOn)}
          {offering.location ? ` · ${offering.location}` : ""}
        </p>
        {f && (
          <p className="text-body-sm text-[var(--color-ink-faint)]">
            {f.durationLabel} · {f.scheduleLabel} · {f.totalTimeLabel}
          </p>
        )}
      </div>
      {offering.status === "open" ? (
        <Button href={`/checkout/${offering.id}`} data-testid="register">
          Register
        </Button>
      ) : (
        <Chip>{offering.status === "full" ? "Full" : "Planned"}</Chip>
      )}
    </li>
  );
}

export default async function ProgrammePage() {
  await requireUser("/account/programme");
  const [trainings, offerings] = await Promise.all([listPublishedProgrammes(), listUpcomingPublicOfferings()]);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-label mb-2 text-[var(--color-primary)]">Trainings</p>
        <h1 className="text-display">Trainings</h1>
        <p className="text-body-sm mt-3 max-w-[62ch] text-[var(--color-ink-quiet)]">
          Every training currently published, with its upcoming dates. Investment, outcomes and the full curriculum are on each training&rsquo;s page.
        </p>
      </header>

      {trainings.length === 0 ? (
        <Card variant="panel" className="p-6 sm:p-8">
          <p className="text-body-sm text-[var(--color-ink-quiet)]">No training is published yet.</p>
        </Card>
      ) : (
        <ul className="flex flex-col gap-6" data-testid="account-trainings">
          {trainings.map((t) => {
            const dates = offerings.filter((o) => o.programmeId === t.id);
            const enquiryHref = `/contact-us?kind=programme_interest&programme=${t.slug}`;
            return (
              <li key={t.id}>
                <Card variant="panel" className="p-5 sm:p-6" data-testid="account-training" data-slug={t.slug}>
                  <div className="mb-3 flex flex-wrap gap-2">
                    <Chip tone="primary">{levelLabel(t.level)}</Chip>
                    {t.flagship ? <Chip>Flagship</Chip> : null}
                    <Chip>{t.durationLabel}</Chip>
                  </div>
                  <h2 className="text-h1">{t.title}</h2>
                  {t.subtitle ? <p className="text-body-sm mt-1 font-medium text-[var(--color-ink)]">{t.subtitle}</p> : null}
                  <p className="text-body-sm mt-2 max-w-[62ch] text-[var(--color-ink-quiet)]">{t.summary}</p>
                  {dates.length > 0 ? (
                    <ul className="mt-4 flex flex-col gap-3">
                      {dates.map((o) => (
                        <DateRow key={o.id} offering={o} />
                      ))}
                    </ul>
                  ) : (
                    <p className="text-body-sm mt-4 text-[var(--color-ink-faint)]" data-testid="account-training-no-dates">
                      No public dates yet — register your interest and we will tell you when one opens.
                    </p>
                  )}
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Button variant="secondary" href={`/programs/${t.slug}`}>
                      View the training
                    </Button>
                    {dates.some((o) => o.status === "open") ? null : (
                      <Button variant="secondary" href={enquiryHref}>
                        Register interest
                      </Button>
                    )}
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-body-sm text-[var(--color-ink-quiet)]">
        All trainings are also listed publicly under{" "}
        <Link href="/programs" className="text-[var(--color-primary)] underline underline-offset-4">
          Trainings
        </Link>
        ; dates under{" "}
        <Link href="/schedule" className="text-[var(--color-primary)] underline underline-offset-4">
          Schedule
        </Link>
        .
      </p>
    </div>
  );
}
