import type { Metadata } from "next";
import Link from "next/link";
import { forbidden, notFound, redirect } from "next/navigation";
import { getAttendanceSheet } from "@/modules/attendance/repository";
import { formatCalendarDate } from "@/modules/catalogue/offerings/dates";
import { MODALITY_LABEL } from "@/modules/catalogue/offerings/repository";
import { trainingAccess } from "@/modules/catalogue/programmes/admin-access";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";
import { AttendanceForm } from "./AttendanceForm";

/*
 * /admin/attendance/[offeringId] — the sheet (Milestone 13 WP4): one row per
 * confirmed participant — name, email, date of birth, country (N5 a), the
 * editable Attended answer, a note, and when it was last saved and by whom.
 * Reopening shows the saved answers. A date outside a Trainer's scope is a
 * 404, so nothing about it is revealed.
 */
export const metadata: Metadata = { title: "Attendance sheet" };
export const dynamic = "force-dynamic";

export default async function AttendanceSheetPage({ params }: { params: Promise<{ offeringId: string }> }) {
  const { offeringId } = await params;
  const access = await trainingAccess();
  if (!access.ok) {
    if (access.reason === "signed-out") redirect(`/sign-in?return-to=${encodeURIComponent(`/admin/attendance/${offeringId}`)}`);
    forbidden();
  }
  const sheet = await getAttendanceSheet(offeringId, access.scope);
  if (!sheet) notFound();
  const { offering: o, rows, isToday, hasEnded } = sheet;
  const recorded = rows.filter((r) => r.attended !== null).length;

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link href="/admin/attendance" className="text-body-sm mb-2 inline-block py-1 text-[var(--color-primary)] underline underline-offset-4">
          ← Attendance
        </Link>
        <p className="text-label mb-2 text-[var(--color-primary)]">Attendance sheet</p>
        <h1 className="text-display" data-testid="sheet-title">
          {o.programmeTitle}
        </h1>
        <p className="text-body-sm mt-2 text-[var(--color-ink)]" data-testid="sheet-dates">
          {formatCalendarDate(o.startsOn)} – {formatCalendarDate(o.endsOn)} · {MODALITY_LABEL[o.modality]}
          {o.location ? ` · ${o.location}` : ""}{" "}
          <Chip tone={isToday ? "primary" : "neutral"}>{isToday ? "Today" : hasEnded ? "Ended" : "Upcoming"}</Chip>
        </p>
        <p className="text-body-sm mt-2 text-[var(--color-ink-quiet)]" data-testid="sheet-summary">
          {rows.length} confirmed participant{rows.length === 1 ? "" : "s"} · {recorded} recorded
        </p>
      </header>

      {rows.length === 0 ? (
        <Card variant="panel" className="p-5 sm:p-6">
          <p className="text-body-lg font-medium" data-testid="sheet-empty">
            No confirmed participants on this date
          </p>
        </Card>
      ) : (
        <AttendanceForm offeringId={o.id} rows={rows.map((r) => ({ ...r, updatedAt: r.updatedAt ? r.updatedAt.toISOString() : null }))} />
      )}
    </div>
  );
}
