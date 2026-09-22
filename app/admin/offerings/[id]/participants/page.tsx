import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MODALITY_LABEL } from "@/modules/catalogue/offerings/repository";
import { dateColumnToIso, formatCalendarDate } from "@/modules/certificates/dates";
import { listRoster } from "@/modules/certificates/issuance.service";
import { statusOf } from "@/modules/certificates/rules";
import { authorise } from "@/modules/identity/session";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";
import { formatDateRange } from "@/shared/util/dates";
import { CertificateStatusLabel } from "../../../certificates/StatusLabel";
import { RecordCompletion } from "./RecordCompletion";

/*
 * /admin/offerings/[id]/participants — the roster of one offering with
 * "Record completion" per participant (M6 plan §3 E2, §5 "Admin"). Every
 * registration is listed, whatever its status; the form appears only where
 * issuance is possible now, otherwise the reason in words. Email and legal
 * name are shown here (administrator only) and never on a public page.
 * Unknown offering → 404. The layout gates the route; this page re-checks.
 */
export const metadata: Metadata = { title: "Participants & completion" };

export const dynamic = "force-dynamic";

const columns = ["Participant", "Legal name", "Registration", "Certificate", "Completion"];

const REGISTRATION_LABEL = { confirmed: "Confirmed", cancelled: "Cancelled", transferred: "Transferred" } as const;

export default async function OfferingParticipantsPage({ params }: { params: Promise<{ id: string }> }) {
  const result = await authorise("platform_admin");
  if (!result.ok) return null; // the layout has already refused
  const { id } = await params;
  const roster = await listRoster(id);
  if (!roster) notFound();
  const { offering, ended, today, entries } = roster;
  const startsOn = dateColumnToIso(offering.startsOn);
  const endsOn = dateColumnToIso(offering.endsOn);
  const confirmed = entries.filter((e) => e.status === "confirmed").length;
  const issued = entries.filter((e) => e.certificate).length;

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link href={`/admin/offerings/${offering.id}`} className="text-body-sm mb-2 inline-block py-1 text-[var(--color-primary)] underline underline-offset-4">
          ← Offering
        </Link>
        <p className="text-label mb-2 text-[var(--color-primary)]">Participants & completion</p>
        <h1 className="text-display" data-testid="roster-title">
          {offering.programmeTitle}
        </h1>
        <p className="text-body-sm mt-2 text-[var(--color-ink-quiet)]">
          {offering.format?.name ?? MODALITY_LABEL[offering.modality]} · {MODALITY_LABEL[offering.modality]} · {formatDateRange(offering.startsOn, offering.endsOn)}
        </p>
        <p className="text-body-sm mt-1 text-[var(--color-ink)]" data-testid="roster-ended">
          {ended ? `Ended on ${formatCalendarDate(endsOn)}.` : `Ends on ${formatCalendarDate(endsOn)} — completion can be recorded after the offering has ended.`}
        </p>
      </header>

      <Card variant="panel" className="p-5">
        <p className="text-body-sm text-[var(--color-ink-quiet)]">
          Recording completion issues the participant's Certificate of Completion at once, dated today ({formatCalendarDate(today)}, Malaysia time) and active for twelve months. It records
          completion of the programme; it is not the Academy's earned credential. The certificate prints the legal name from the participant's profile.
        </p>
        <p className="text-body-sm mt-2 text-[var(--color-ink-quiet)]" data-testid="roster-summary">
          {entries.length} {entries.length === 1 ? "registration" : "registrations"} · {confirmed} confirmed · {issued} {issued === 1 ? "certificate" : "certificates"} issued
        </p>
      </Card>

      {entries.length === 0 ? (
        <Card variant="panel" className="p-5 sm:p-6">
          <p className="text-body-lg font-medium" data-testid="roster-empty">
            No registrations
          </p>
          <p className="text-body-sm mt-2 text-[var(--color-ink-quiet)]">Nobody has registered for this offering.</p>
        </Card>
      ) : (
        <Card variant="panel" className="overflow-x-auto p-0">
          <table className="text-body-sm w-full min-w-[960px] border-collapse" data-testid="roster-table">
            <thead>
              <tr className="border-b border-[var(--color-line)] text-left">
                {columns.map((c) => (
                  <th key={c} scope="col" className="text-label px-4 py-3 font-semibold">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.registrationId} className="border-b border-[var(--color-line)] last:border-b-0 align-top" data-testid="roster-row">
                  <td className="px-4 py-3">
                    <p className="font-medium text-[var(--color-ink)]" data-testid="roster-name">
                      {e.user.name}
                    </p>
                    <p className="break-all text-[var(--color-ink-quiet)]">{e.user.email}</p>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-ink)]" data-testid="roster-legal-name">
                    {e.legalName ?? <span className="text-[var(--color-ink-quiet)]">Profile incomplete</span>}
                  </td>
                  <td className="px-4 py-3">
                    <Chip tone={e.status === "confirmed" ? "primary" : "neutral"}>{REGISTRATION_LABEL[e.status]}</Chip>
                  </td>
                  <td className="px-4 py-3" data-testid="roster-certificate">
                    {e.certificate ? (
                      <div className="flex flex-col gap-1">
                        <Link href={`/admin/certificates/${e.certificate.id}`} className="text-mono text-[var(--color-primary)] underline underline-offset-4">
                          {e.certificate.certificateId}
                        </Link>
                        <CertificateStatusLabel status={statusFor(e.certificate.expiresOn, e.certificate.revokedAt, today)} />
                      </div>
                    ) : (
                      <span className="text-[var(--color-ink-quiet)]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <RecordCompletion
                      registrationId={e.registrationId}
                      registrationStatus={e.status}
                      canRecord={e.canRecord}
                      reason={e.reason}
                      defaultDate={endsOn}
                      minDate={startsOn}
                      maxDate={today}
                    />
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

/** Roster entries carry the raw record; the chip uses the same pure rule the
 *  certificates list applies (rules.ts), against the roster's MYT today. */
function statusFor(expiresOn: string, revokedAt: Date | null, today: string) {
  return statusOf({ expiresOn, revokedAt }, today).status;
}
