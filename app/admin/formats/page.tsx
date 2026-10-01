import type { Metadata } from "next";
import Link from "next/link";
import { forbidden, redirect } from "next/navigation";
import { trainingAccess } from "@/modules/catalogue/programmes/admin-access";
import { listFormatsOverview, summariseFormats } from "@/modules/commerce/formats-overview";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";

/*
 * /admin/formats — every pace format of the caller's trainings in one place
 * (CR-2026-10-01-2138, F1; founder: "Trainer should be able to declare formats
 * of the training … schedule the training based on formats"). A Trainer sees
 * the formats of their own trainings, an administrator all of them. Declaring
 * a format and scheduling it live in the per-training Formats and Dates tabs;
 * this screen shows where each format stands (dates scheduled, people
 * interested) and links straight to both.
 */
export const metadata: Metadata = { title: "Formats" };
export const dynamic = "force-dynamic";

export default async function AdminFormatsPage() {
  const access = await trainingAccess();
  if (!access.ok) {
    if (access.reason === "signed-out") redirect(`/sign-in?return-to=${encodeURIComponent("/admin/formats")}`);
    forbidden();
  }
  const rows = await listFormatsOverview(access.scope);
  const sum = summariseFormats(rows);
  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-label mb-2 text-[var(--color-primary)]">{access.isAdmin ? "Admin" : "Trainer"}</p>
        <h1 className="text-display" data-testid="formats-title">
          Formats
        </h1>
        <p className="text-body-sm mt-2 max-w-[70ch] text-[var(--color-ink-quiet)]">
          A format is a pace a training can be taken at — a bootcamp, one week at two hours a day, two weeks at two hours a day. Declare the formats of a training, then schedule dates
          under each. People can register their interest in a format that has no open date; you will find them under{" "}
          <Link href="/admin/interest" className="text-[var(--color-primary)] underline underline-offset-4">
            Users Interest
          </Link>
          .
        </p>
        <p className="text-body-sm mt-2 text-[var(--color-ink-quiet)]" data-testid="formats-summary">
          {sum.formats} {sum.formats === 1 ? "format" : "formats"} across {sum.trainings} {sum.trainings === 1 ? "training" : "trainings"} · {sum.formatsWithoutDate} without an open date ·{" "}
          {sum.interested} interested {sum.interested === 1 ? "person" : "people"} ({sum.awaitingNotice} not yet told).
        </p>
      </header>

      {rows.length === 0 ? (
        <Card variant="panel" className="p-6" data-testid="formats-empty">
          <p className="text-body-lg font-medium">{access.isAdmin ? "There are no trainings yet." : "No training is linked to your profile yet."}</p>
          {access.isAdmin ? (
            <div className="mt-4">
              <Button href="/admin/trainings/new">Add a training</Button>
            </div>
          ) : null}
        </Card>
      ) : null}

      {rows.map((t) => (
        <Card key={t.programmeId} variant="panel" className="p-5 sm:p-6" data-testid="formats-training" data-programme={t.programmeId}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-h2">{t.title}</h2>
              <p className="mt-1">
                <Chip tone={t.status === "published" ? "primary" : "neutral"}>{t.status === "published" ? "Published" : t.status === "unlisted" ? "Draft (unlisted)" : "Retired"}</Chip>
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" href={`/admin/trainings/${t.programmeId}/formats`} data-testid="formats-declare">
                {t.formats.length === 0 ? "Declare formats" : "Edit formats"}
              </Button>
              <Button variant="secondary" href={`/admin/trainings/${t.programmeId}/dates`} data-testid="formats-schedule">
                Schedule dates
              </Button>
            </div>
          </div>
          {t.formats.length === 0 ? (
            <p className="text-body-sm text-[var(--color-ink-quiet)]" data-testid="formats-none">
              No format is declared for this training yet — declare the paces it can be taken at (e.g. bootcamp, 1 week, 2 weeks).
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="text-body-sm w-full min-w-[720px] text-left" data-testid="formats-table">
                <caption className="sr-only">Formats of {t.title}</caption>
                <thead>
                  <tr className="text-label border-b border-[var(--color-line)]">
                    <th scope="col" className="py-2 pr-4">Format</th>
                    <th scope="col" className="py-2 pr-4">Duration · schedule</th>
                    <th scope="col" className="py-2 pr-4">Dates</th>
                    <th scope="col" className="py-2 pr-4">Interested</th>
                    <th scope="col" className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {t.formats.map((f) => (
                    <tr key={f.formatId} className="border-b border-[var(--color-line)] align-top" data-testid="formats-row" data-format={f.formatId}>
                      <th scope="row" className="py-3 pr-4 font-medium text-[var(--color-ink)]">
                        {f.name}
                        {f.badge ? <span className="ml-2 text-[var(--color-ink-faint)]">{f.badge}</span> : null}
                      </th>
                      <td className="py-3 pr-4 text-[var(--color-ink-quiet)]">
                        {f.durationLabel} · {f.scheduleLabel}
                        <br />
                        <span className="text-[var(--color-ink-faint)]">{f.totalTimeLabel}</span>
                      </td>
                      <td className="py-3 pr-4 text-[var(--color-ink-quiet)]" data-testid="formats-dates">
                        {f.openDates > 0 ? `${f.openDates} open` : "No open date"}
                        {f.upcomingDates > f.openDates ? ` · ${f.upcomingDates} upcoming` : ""}
                      </td>
                      <td className="py-3 pr-4 text-[var(--color-ink-quiet)]" data-testid="formats-interest">
                        {f.interestConfirmed}
                        {f.interestConfirmed > 0 ? ` (${f.interestConfirmed - f.interestNotified} not yet told)` : ""}
                      </td>
                      <td className="py-3">
                        <span className="flex flex-wrap gap-x-4 gap-y-1">
                          <Link href={`/admin/trainings/${t.programmeId}/dates`} className="text-[var(--color-primary)] underline underline-offset-4" aria-label={`Schedule ${t.title} — ${f.name}`}>
                            Schedule
                          </Link>
                          <Link href={`/admin/interest?format=${f.formatId}`} className="text-[var(--color-primary)] underline underline-offset-4" aria-label={`Interested people for ${t.title} — ${f.name}`}>
                            Interested
                          </Link>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
