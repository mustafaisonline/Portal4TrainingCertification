import type { Metadata } from "next";
import Link from "next/link";
import { forbidden, notFound, redirect } from "next/navigation";
import { participantEmails, participantsDraft, participantsMailto } from "@/modules/attendance/participants-tools";
import { getAttendanceSheet } from "@/modules/attendance/repository";
import { formatCalendarDate } from "@/modules/catalogue/offerings/dates";
import { MODALITY_LABEL } from "@/modules/catalogue/offerings/repository";
import { trainingAccess } from "@/modules/catalogue/programmes/admin-access";
import { CopyLinkButton } from "@/modules/certificates/components/CopyLinkButton";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";
import { formatDateRange } from "@/shared/util/dates";
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
  // CR-2026-10-03-2045 (option B): the trainer's tools for the people who paid — the portal does not send their email.
  const datesLabel = formatDateRange(o.startsOn, o.endsOn);
  const mailto = participantsMailto(sheet, participantsDraft(o.programmeTitle, datesLabel, access.user.name));

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

      {rows.length > 0 ? (
        <Card variant="panel" className="flex flex-col gap-4 p-5" data-testid="participants-tools">
          <p className="text-body-sm text-[var(--color-ink-quiet)]">
            These are the people who paid for this date. To write to them, use your own mailbox: copy their addresses, open one message with everyone in BCC, or download the list. These details are personal data — use them only for this training.
          </p>
          <div className="flex flex-wrap items-start gap-4">
            <CopyLinkButton href={participantEmails(sheet)} literal label="Copy all emails" testId="participants-copy-emails" />
            {mailto ? (
              <Button variant="secondary" href={mailto} data-testid="participants-mailto">
                Open an email to all (BCC)
              </Button>
            ) : (
              <p className="text-body-sm text-[var(--color-ink-faint)]" data-testid="participants-mailto-long">
                There are too many people for one email link — use &ldquo;Copy all emails&rdquo; and paste them into the BCC line.
              </p>
            )}
            <Button variant="secondary" href={`/admin/attendance/${o.id}/export.csv`} data-testid="participants-csv">
              Download CSV
            </Button>
          </div>
        </Card>
      ) : null}

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
