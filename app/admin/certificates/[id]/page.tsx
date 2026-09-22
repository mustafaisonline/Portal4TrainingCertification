import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatMoney } from "@/modules/catalogue/programmes/types";
import { CERTIFICATE_STATUS_LABEL } from "@/modules/certificates/constants";
import { formatCalendarDate, todayIso } from "@/modules/certificates/dates";
import { getCertificateForAdmin, listRenewals } from "@/modules/certificates/repository";
import { authorise } from "@/modules/identity/session";
import { Card } from "@/shared/ui/Card";
import { formatDateRange, formatTimestamp } from "@/shared/util/dates";
import { CertificateStatusLabel } from "../StatusLabel";
import { CorrectHolderName, RevokeCertificate } from "./CertificateAdminActions";

/*
 * /admin/certificates/[id] — one certificate in full (M6 plan §5 "Admin"):
 * every field, the listing state READ-ONLY (the holder controls it — E3),
 * the revocation block when revoked, renewal history, links to the public
 * verification page and the offering's roster, and the two administrator
 * actions (correct name, revoke). `id` is the row uuid; unknown → 404.
 */
export const metadata: Metadata = { title: "Certificate" };

export const dynamic = "force-dynamic";

function daysInWords(status: string, days: number): string {
  if (status === "revoked") return "";
  if (status === "expired") return days === 1 ? " (expired yesterday)" : ` (expired ${days} days ago)`;
  if (days === 0) return " (last day today)";
  return days === 1 ? " (1 day left)" : ` (${days} days left)`;
}

export default async function AdminCertificateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const result = await authorise("platform_admin");
  if (!result.ok) return null; // the layout has already refused
  const { id } = await params;
  const now = new Date();
  const certificate = await getCertificateForAdmin(id, now);
  if (!certificate) notFound();
  const renewals = await listRenewals(certificate.id);
  const revoked = certificate.revokedAt !== null;
  const today = todayIso(now);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link href="/admin/certificates" className="text-body-sm mb-2 inline-block py-1 text-[var(--color-primary)] underline underline-offset-4">
          ← Certificates
        </Link>
        <p className="text-label mb-2 text-[var(--color-primary)]">Certificate of Completion</p>
        <h1 className="text-display text-mono" data-testid="admin-certificate-title">
          {certificate.certificateId}
        </h1>
        <p className="text-body-lg mt-2 text-[var(--color-ink)]" data-testid="admin-certificate-holder-name">
          {certificate.holderName}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <CertificateStatusLabel status={certificate.status} />
          <span className="text-body-sm text-[var(--color-ink-quiet)]">
            {CERTIFICATE_STATUS_LABEL[certificate.status]}
            {daysInWords(certificate.status, certificate.days)} · today is {formatCalendarDate(today)} in Malaysia
          </span>
        </div>
      </header>

      {revoked ? (
        <Card variant="panel" className="border-[var(--color-line-strong)] p-5" data-testid="revocation-block">
          <p className="text-label mb-1">Revoked</p>
          <p className="text-body-sm text-[var(--color-ink)]">
            Revoked on {certificate.revokedAt ? formatTimestamp(certificate.revokedAt) : "—"}. The certificate stays on record and verifies as revoked; it is excluded from
            public name search and cannot be renewed.
          </p>
          <p className="text-body-sm mt-2 whitespace-pre-line text-[var(--color-ink)]">
            <span className="text-label mr-2">Reason</span>
            {certificate.revocationReason ?? "—"}
          </p>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card variant="panel" className="p-6">
          <h2 className="text-h2 mb-4">Details</h2>
          <dl className="text-body-sm grid gap-y-3">
            <div>
              <dt className="text-label mb-1">Holder</dt>
              <dd>
                {certificate.userName} · <span className="break-all">{certificate.userEmail}</span>
              </dd>
            </div>
            <div>
              <dt className="text-label mb-1">Programme</dt>
              <dd>
                {certificate.programmeTitle} · {certificate.formatName}
              </dd>
            </div>
            <div>
              <dt className="text-label mb-1">Offering dates</dt>
              <dd>
                {formatDateRange(new Date(`${certificate.offeringStartsOn}T00:00:00Z`), new Date(`${certificate.offeringEndsOn}T00:00:00Z`))} ·{" "}
                <Link href={`/admin/offerings/${certificate.offeringId}/participants`} className="text-[var(--color-primary)] underline underline-offset-4" data-testid="admin-certificate-roster-link">
                  Participants & completion
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-label mb-1">Completed on</dt>
              <dd data-testid="admin-certificate-completed-on">{formatCalendarDate(certificate.completedOn)}</dd>
            </div>
            <div>
              <dt className="text-label mb-1">Issued on</dt>
              <dd>{formatCalendarDate(certificate.issuedOn)}</dd>
            </div>
            <div>
              <dt className="text-label mb-1">Expires on</dt>
              <dd data-testid="admin-certificate-expires-on">{formatCalendarDate(certificate.expiresOn)} (inclusive; Malaysia calendar date)</dd>
            </div>
            <div>
              <dt className="text-label mb-1">Listed in public name search</dt>
              <dd data-testid="admin-certificate-listed">
                {certificate.listed ? "Yes" : "No"} — the holder controls this
                {certificate.listedChangedAt ? ` (last changed ${formatTimestamp(certificate.listedChangedAt)})` : ""}
              </dd>
            </div>
            <div>
              <dt className="text-label mb-1">Public verification</dt>
              <dd>
                <Link href={`/verify/${certificate.certificateId}`} className="text-[var(--color-primary)] underline underline-offset-4" data-testid="admin-certificate-verify-link">
                  /verify/{certificate.certificateId}
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-label mb-1">Issued</dt>
              <dd>{formatTimestamp(certificate.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-label mb-1">Registration</dt>
              <dd className="text-mono break-all">{certificate.registrationId}</dd>
            </div>
            <div>
              <dt className="text-label mb-1">Certificate row id</dt>
              <dd className="text-mono break-all">{certificate.id}</dd>
            </div>
          </dl>
        </Card>

        <div className="flex flex-col gap-6">
          <Card variant="panel" className="p-6">
            <h2 className="text-h2 mb-4">Correct the name</h2>
            <CorrectHolderName certificateId={certificate.id} holderName={certificate.holderName} />
          </Card>
          {revoked ? null : (
            <Card variant="panel" className="p-6">
              <h2 className="text-h2 mb-4">Revoke</h2>
              <RevokeCertificate certificateId={certificate.id} printedId={certificate.certificateId} />
            </Card>
          )}
        </div>
      </div>

      <Card variant="panel" className="overflow-x-auto p-0">
        <h2 className="text-h2 px-6 pt-6">Renewal history</h2>
        <table className="text-body-sm w-full min-w-[720px] border-collapse" data-testid="admin-certificate-renewals">
          <thead>
            <tr className="border-b border-[var(--color-line)] text-left">
              {["Paid", "Previous expiry", "New expiry", "Amount", "Order"].map((c) => (
                <th key={c} scope="col" className="text-label px-6 py-3 font-semibold">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {renewals.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-[var(--color-ink-quiet)]">
                  No renewals yet. The first year is included in the programme fee.
                </td>
              </tr>
            ) : (
              renewals.map((r) => (
                <tr key={r.id} className="border-b border-[var(--color-line)] last:border-b-0 align-top">
                  <td className="px-6 py-3 whitespace-nowrap text-[var(--color-ink-quiet)]">{formatTimestamp(r.createdAt)}</td>
                  <td className="px-6 py-3 whitespace-nowrap">{formatCalendarDate(r.previousExpiresOn)}</td>
                  <td className="px-6 py-3 whitespace-nowrap">{formatCalendarDate(r.newExpiresOn)}</td>
                  <td className="px-6 py-3 whitespace-nowrap">{formatMoney(r.amountMinor, r.currency)}</td>
                  <td className="text-mono px-6 py-3 break-all text-[var(--color-ink-quiet)]">{r.orderId}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
