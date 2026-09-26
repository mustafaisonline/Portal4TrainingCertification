import type { Metadata } from "next";
import Link from "next/link";
import { forbidden, redirect } from "next/navigation";
import { formatCalendarDate } from "@/modules/catalogue/offerings/dates";
import {
  listAllOfferings,
  MODALITY_LABEL,
  OFFERING_STATUS_LABEL,
  type AdminOfferingRecord,
} from "@/modules/catalogue/offerings/repository";
import { trainingAccess } from "@/modules/catalogue/programmes/admin-access";
import { listTrainings } from "@/modules/catalogue/programmes/admin.repository";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";

/*
 * PORTED 2026-09-21 (structure and column labels) from
 * project-artifacts/mockup/app/admin/offerings/page.tsx and the `AdminHeader`
 * / `AdminTable` scaffolding in components/admin/AdminTable.tsx (ADR-045).
 * Changed: the wireframe's sample offerings, seat strings, `SampleTag` and
 * `WireframeNote` are gone; every row is a REAL `scheduled_offerings` row
 * (`listAllOfferings`) with live counts of confirmed registrations and
 * unexpired pending orders; "Add a date" is a working link; with no rows the
 * page says so plainly — nothing is ever invented (DR-02 §4.1). Waitlist,
 * roster, sessions and attendance are M8.
 *
 * Milestone 12 (L7): a Trainer sees only the dates of their own trainings;
 * an administrator sees every date.
 */
export const metadata: Metadata = { title: "Offerings" };
export const dynamic = "force-dynamic";

const columns = ["Programme", "Format", "Delivery", "Dates", "Capacity", "Confirmed", "Pending", "Status", ""];

function StatusChip({ status }: { status: AdminOfferingRecord["status"] }) {
  return <Chip tone={status === "open" ? "primary" : "neutral"}>{OFFERING_STATUS_LABEL[status]}</Chip>;
}

export default async function AdminOfferingsPage() {
  const access = await trainingAccess();
  if (!access.ok) {
    if (access.reason === "signed-out") redirect(`/sign-in?return-to=${encodeURIComponent("/admin/offerings")}`);
    forbidden();
  }
  const offerings = access.isAdmin ? await listAllOfferings() : await listAllOfferings(undefined, (await listTrainings(access.scope)).map((t) => t.id));
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/admin" className="text-body-sm mb-2 inline-block py-1 text-[var(--color-primary)] underline underline-offset-4">
            ← Operations
          </Link>
          <p className="text-label mb-2 text-[var(--color-primary)]">Dates & seats</p>
          <h1 className="text-display" data-testid="offerings-title">
            Scheduled offerings
          </h1>
        </div>
        <Button href="/admin/offerings/new">New offering</Button>
      </header>

      {offerings.length === 0 ? (
        <Card variant="panel" className="p-5 sm:p-6">
          <p className="text-body-lg font-medium" data-testid="offerings-empty">
            No offerings yet
          </p>
          <p className="text-body-sm mt-2 max-w-[60ch] text-[var(--color-ink-quiet)]">
            Nothing is scheduled. Create the first date and it appears on the public schedule as soon as its
            status is planned, open or full.
          </p>
          <div className="mt-5">
            <Button href="/admin/offerings/new">New offering</Button>
          </div>
        </Card>
      ) : (
        <Card variant="panel" className="overflow-x-auto p-0">
          <table className="text-body-sm w-full min-w-[880px] border-collapse" data-testid="offerings-table">
            <thead>
              <tr className="border-b border-[var(--color-line)] text-left">
                {columns.map((c, i) => (
                  <th key={i} scope="col" className="text-label px-4 py-3 font-semibold">
                    {c || <span className="sr-only">Actions</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {offerings.map((o) => (
                <tr key={o.id} className="border-b border-[var(--color-line)] last:border-b-0" data-testid="offering-row">
                  <td className="px-4 py-3 align-top text-[var(--color-ink)]">{o.programmeTitle}</td>
                  <td className="px-4 py-3 align-top text-[var(--color-ink-quiet)]">{o.format?.name ?? "—"}</td>
                  <td className="px-4 py-3 align-top text-[var(--color-ink-quiet)]">{MODALITY_LABEL[o.modality]}</td>
                  <td className="px-4 py-3 align-top whitespace-nowrap text-[var(--color-ink-quiet)]">
                    {formatCalendarDate(o.startsOn)} – {formatCalendarDate(o.endsOn)}
                  </td>
                  <td className="px-4 py-3 align-top text-[var(--color-ink-quiet)]">{o.capacity ?? "—"}</td>
                  <td className="px-4 py-3 align-top text-[var(--color-ink-quiet)]">{o.confirmedCount}</td>
                  <td className="px-4 py-3 align-top text-[var(--color-ink-quiet)]">{o.pendingCount}</td>
                  <td className="px-4 py-3 align-top">
                    <StatusChip status={o.status} />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <Link
                      href={`/admin/offerings/${o.id}`}
                      className="text-[var(--color-primary)] underline underline-offset-4"
                      aria-label={`Edit ${o.programmeTitle}, ${formatCalendarDate(o.startsOn)}`}
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
