import type { Metadata } from "next";
import Link from "next/link";
import { forbidden, redirect } from "next/navigation";
import { listAttendanceOfferings } from "@/modules/attendance/repository";
import { formatCalendarDate } from "@/modules/catalogue/offerings/dates";
import { MODALITY_LABEL } from "@/modules/catalogue/offerings/repository";
import { trainingAccess } from "@/modules/catalogue/programmes/admin-access";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";

/*
 * /admin/attendance — Milestone 13 WP4 (founder decision 9). Every date with
 * confirmed participants, soonest first, today's date flagged; an
 * administrator sees all, a Trainer their own (N7). Opening a date shows the
 * sheet. Nothing is invented: a date without confirmed registrations is not
 * listed because there is nobody to mark.
 */
export const metadata: Metadata = { title: "Attendance" };
export const dynamic = "force-dynamic";

const columns = ["Training", "Dates", "Delivery", "Participants", "Recorded", "Status", ""];

export default async function AdminAttendancePage() {
  const access = await trainingAccess();
  if (!access.ok) {
    if (access.reason === "signed-out") redirect(`/sign-in?return-to=${encodeURIComponent("/admin/attendance")}`);
    forbidden();
  }
  const rows = await listAttendanceOfferings(access.scope);
  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link href="/admin" className="text-body-sm mb-2 inline-block py-1 text-[var(--color-primary)] underline underline-offset-4">
          ← Operations
        </Link>
        <p className="text-label mb-2 text-[var(--color-primary)]">On the day</p>
        <h1 className="text-display" data-testid="attendance-title">
          Attendance
        </h1>
        <p className="text-body-sm mt-2 max-w-[64ch] text-[var(--color-ink-quiet)]">
          Open a date to mark who attended. Answers are saved to the database with who recorded them and when, and can be
          changed later; every change is in the audit log.
        </p>
      </header>

      {rows.length === 0 ? (
        <Card variant="panel" className="p-5 sm:p-6">
          <p className="text-body-lg font-medium" data-testid="attendance-empty">
            No dates with participants yet
          </p>
          <p className="text-body-sm mt-2 max-w-[60ch] text-[var(--color-ink-quiet)]">
            A date appears here once at least one registration on it is confirmed.
          </p>
        </Card>
      ) : (
        <Card variant="panel" className="overflow-x-auto p-0">
          <table className="text-body-sm w-full min-w-[880px] border-collapse" data-testid="attendance-table">
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
              {rows.map(({ offering: o, confirmedCount, recordedCount, isToday, hasEnded }) => (
                <tr key={o.id} className="border-b border-[var(--color-line)] last:border-b-0" data-testid="attendance-row" data-offering={o.id}>
                  <td className="px-4 py-3 align-top text-[var(--color-ink)]">{o.programmeTitle}</td>
                  <td className="px-4 py-3 align-top whitespace-nowrap text-[var(--color-ink-quiet)]">
                    {formatCalendarDate(o.startsOn)} – {formatCalendarDate(o.endsOn)}
                  </td>
                  <td className="px-4 py-3 align-top text-[var(--color-ink-quiet)]">
                    {MODALITY_LABEL[o.modality]}
                    {o.location ? ` · ${o.location}` : ""}
                  </td>
                  <td className="px-4 py-3 align-top text-[var(--color-ink-quiet)]">{confirmedCount}</td>
                  <td className="px-4 py-3 align-top text-[var(--color-ink-quiet)]" data-testid="attendance-recorded">
                    {recordedCount} of {confirmedCount}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <Chip tone={isToday ? "primary" : "neutral"}>{isToday ? "Today" : hasEnded ? "Ended" : "Upcoming"}</Chip>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <Link
                      href={`/admin/attendance/${o.id}`}
                      className="text-[var(--color-primary)] underline underline-offset-4"
                      aria-label={`Open the attendance sheet for ${o.programmeTitle}, ${formatCalendarDate(o.startsOn)}`}
                      data-testid="attendance-open"
                    >
                      Open sheet
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
