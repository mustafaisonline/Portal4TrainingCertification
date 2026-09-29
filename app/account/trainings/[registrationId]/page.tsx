import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { attendanceForUser } from "@/modules/attendance/repository";
import { MODALITY_LABEL } from "@/modules/catalogue/offerings/repository";
import { formatMoney } from "@/modules/catalogue/programmes/types";
import { CertificateDocument } from "@/modules/certificates/components/CertificateDocument";
import { CopyLinkButton } from "@/modules/certificates/components/CopyLinkButton";
import { PrintButton } from "@/modules/certificates/components/PrintButton";
import { DownloadPdfButton } from "@/shared/certificate/DownloadPdfButton";
import { StatusChip } from "@/modules/certificates/components/StatusChip";
import { formatCalendarDate, todayIso } from "@/modules/certificates/dates";
import { certificateDocumentAccess } from "@/modules/certificates/gate";
import { listCertificatesForUser } from "@/modules/certificates/repository";
import { statusOf } from "@/modules/certificates/rules";
import { appBaseUrl } from "@/modules/commerce/checkout.service";
import { listRegistrationsForUser } from "@/modules/commerce/registrations.service";
import { requireUser } from "@/modules/identity/session";
import { REVIEW_BODY_MIN } from "@/modules/reviews/constants";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";
import { formatDateRange, formatTimestamp } from "@/shared/util/dates";

/*
 * /account/trainings/[registrationId] — one training the person registered
 * for (Milestone 13 WP2; founder flow "when user clicks an attended
 * training"): the training's details, the attendance the Academy recorded,
 * and — once issued — the Certificate of Completion with its unique ID,
 * copyable, linking to the public certificate page (/verify/<id>, the page
 * the home-page search opens). The DOCUMENT itself is behind the reviews
 * gate (N4 confirmed: the ID and the public page are never gated); not yet
 * issued → said plainly (N4). Another person's registration → 404.
 */
export const metadata: Metadata = { title: "Training details" };
export const dynamic = "force-dynamic";

function verifyHref(certificateId: string): string {
  let base = "";
  try {
    base = appBaseUrl();
  } catch {
    // APP_BASE_URL unset (local only): a path — CopyLinkButton makes it absolute in the browser.
  }
  return `${base}/verify/${certificateId}`;
}

export default async function TrainingDetailPage({ params }: { params: Promise<{ registrationId: string }> }) {
  const { registrationId } = await params;
  const user = await requireUser(`/account/trainings/${registrationId}`);
  const [registrations, certificates, attendance] = await Promise.all([
    listRegistrationsForUser(user.id),
    listCertificatesForUser(user.id),
    attendanceForUser(user.id),
  ]);
  const registration = registrations.find((r) => r.id === registrationId);
  if (!registration) notFound();
  const o = registration.offering;
  const certificate = certificates.find((c) => c.registrationId === registration.id) ?? null;
  const record = attendance.get(registration.id) ?? null;
  const now = new Date();
  const today = todayIso(now);
  const midnight = new Date(now);
  midnight.setUTCHours(0, 0, 0, 0);
  const ended = o.endsOn.getTime() < midnight.getTime();
  const access = certificate ? await certificateDocumentAccess(certificate) : null;
  const href = certificate ? verifyHref(certificate.certificateId) : null;

  return (
    <div className="flex flex-col gap-8">
      <header>
        <Link href="/account/trainings" className="text-body-sm mb-2 inline-block py-1 text-[var(--color-primary)] underline underline-offset-4">
          ← My Trainings
        </Link>
        <p className="text-label mb-2 text-[var(--color-primary)]">Training details</p>
        <h1 className="text-display" data-testid="training-title">
          {o.programmeTitle}
        </h1>
      </header>

      <Card variant="panel" className="p-5 sm:p-6" data-testid="training-facts">
        <div className="mb-3 flex flex-wrap gap-2">
          <Chip tone={registration.status === "confirmed" ? "primary" : "neutral"}>
            {registration.status === "confirmed" ? (ended ? "Attended" : "Yet to attend") : registration.status === "cancelled" ? "Cancelled" : "Transferred"}
          </Chip>
          <Chip>{MODALITY_LABEL[o.modality]}</Chip>
          {ended ? (
            <span data-testid="training-attendance">
              <Chip tone={record?.attended ? "primary" : "neutral"}>
                {record ? (record.attended ? "Attendance: attended" : "Attendance: recorded as not attended") : "Attendance not recorded"}
              </Chip>
            </span>
          ) : null}
        </div>
        <dl className="text-body-sm grid gap-x-8 gap-y-3 sm:grid-cols-2">
          <div>
            <dt className="text-label mb-1">Format</dt>
            <dd>{o.format?.name ?? MODALITY_LABEL[o.modality]}</dd>
          </div>
          <div>
            <dt className="text-label mb-1">Dates</dt>
            <dd>{formatDateRange(o.startsOn, o.endsOn)}</dd>
          </div>
          {o.location ? (
            <div>
              <dt className="text-label mb-1">Location</dt>
              <dd>{o.location}</dd>
            </div>
          ) : null}
          <div>
            <dt className="text-label mb-1">Paid</dt>
            <dd>
              {formatMoney(registration.order.amountMinor, registration.order.currency)}
              {registration.order.paidAt ? ` · ${formatTimestamp(registration.order.paidAt)}` : ""}
            </dd>
          </div>
          {record ? (
            <div>
              <dt className="text-label mb-1">Attendance recorded</dt>
              <dd>{formatTimestamp(record.updatedAt)}</dd>
            </div>
          ) : null}
        </dl>
        <div className="mt-4">
          <Link href={`/programs/${o.programmeSlug}`} className="text-body-sm text-[var(--color-primary)] underline underline-offset-4">
            About this training
          </Link>
        </div>
      </Card>

      {certificate && access && href ? (
        <section aria-labelledby="training-certificate" className="flex flex-col gap-6" data-testid="training-certificate">
          <Card variant="panel" className="p-5 sm:p-6">
            <h2 id="training-certificate" className="text-h1 mb-3">
              Certificate of Completion
            </h2>
            <div className="mb-3">
              <StatusChip status={statusOf(certificate, today).status} />
            </div>
            <dl className="text-body-sm grid gap-x-8 gap-y-3 sm:grid-cols-2">
              <div>
                <dt className="text-label mb-1">Unique certificate ID</dt>
                <dd className="text-mono break-all">
                  <Link href={`/verify/${certificate.certificateId}`} className="text-[var(--color-primary)] underline underline-offset-4" data-testid="certificate-id-link">
                    {certificate.certificateId}
                  </Link>
                </dd>
              </div>
              <div>
                <dt className="text-label mb-1">Completed</dt>
                <dd>{formatCalendarDate(certificate.completedOn)}</dd>
              </div>
              <div>
                <dt className="text-label mb-1">Valid until</dt>
                <dd>{formatCalendarDate(certificate.expiresOn)}</dd>
              </div>
            </dl>
            <div className="mt-5 flex flex-col gap-3">
              <CopyLinkButton href={certificate.certificateId} label="Copy certificate ID" testId="copy-certificate-id" literal />
              <CopyLinkButton href={href} />
              <Link href="/account/certifications" className="text-body-sm inline-block self-start py-1 text-[var(--color-primary)] underline underline-offset-4">
                All your certifications — renewal and public listing
              </Link>
            </div>
          </Card>

          {statusOf(certificate, today).status === "revoked" ? (
            <Card variant="panel" className="p-5 sm:p-6" data-testid="certificate-revoked">
              <p className="text-body-sm text-[var(--color-ink-quiet)]">
                This certificate was revoked and is no longer valid, so it cannot be shown or printed. Its public verification page says so.
              </p>
            </Card>
          ) : access.unlocked ? (
            <div className="flex flex-col gap-4">
              <CertificateDocument certificate={certificate} verifyUrl={href} />
              <div className="flex flex-wrap gap-3 print:hidden">
                <PrintButton />
                <DownloadPdfButton href={`/api/certificates/${certificate.certificateId}/pdf`} />
              </div>
            </div>
          ) : (
            <Card variant="feature" className="p-5! sm:p-8!" data-testid="certificate-gate">
              <p className="text-label mb-2 text-[var(--color-primary)]">One step left</p>
              <h3 className="text-h1 mb-2">Share your experience to see your certificate</h3>
              <p className="text-body-sm mb-5 max-w-[60ch] text-[var(--color-ink-quiet)]">
                Your certificate is issued and its ID above is already verifiable by anyone. The certificate document itself is shown once you
                have written a review of this training of at least {REVIEW_BODY_MIN} characters.
              </p>
              <Button href={`/reviews#registration-${certificate.registrationId}`} data-testid="certificate-gate-review-link">
                Write your review
              </Button>
            </Card>
          )}
        </section>
      ) : (
        <Card variant="panel" className="p-5 sm:p-6" data-testid="training-no-certificate">
          <h2 className="text-h1 mb-2">Certificate of Completion</h2>
          <p className="text-body-sm text-[var(--color-ink-quiet)]">
            {ended
              ? "Not yet issued — the Academy records completion after the training, and your certificate with its unique ID appears here."
              : "Issued after you complete this training."}
          </p>
        </Card>
      )}
    </div>
  );
}
