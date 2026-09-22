import type { Metadata } from "next";
import Link from "next/link";
import { formatMoney } from "@/modules/catalogue/programmes/types";
import { appBaseUrl } from "@/modules/commerce/checkout.service";
import { CertificateDocument } from "@/modules/certificates/components/CertificateDocument";
import { CopyLinkButton } from "@/modules/certificates/components/CopyLinkButton";
import { ListingToggle } from "@/modules/certificates/components/ListingToggle";
import { PrintButton } from "@/modules/certificates/components/PrintButton";
import { RenewForm } from "@/modules/certificates/components/RenewForm";
import { StatusChip } from "@/modules/certificates/components/StatusChip";
import { RENEWAL_WINDOW_DAYS, VALIDITY_MONTHS } from "@/modules/certificates/constants";
import { addDays, formatCalendarDate, todayIso } from "@/modules/certificates/dates";
import { certificateDocumentAccess } from "@/modules/certificates/gate";
import { findRenewalOrderForUser, previewRenewal, type RenewalOrderView, type RenewalPreview } from "@/modules/certificates/renewal.service";
import { listCertificatesForUser, listRenewals, type CertificateRecord, type RenewalRecord } from "@/modules/certificates/repository";
import { statusOf } from "@/modules/certificates/rules";
import { requireUser } from "@/modules/identity/session";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";

/*
 * /account/certificate — the holder's Certificate of Completion (Milestone
 * 6; MILESTONE_6_EXECUTION_PLAN.md §3 E3, E5, E9, E11; §5 "Holder").
 * PORTED 2026-09-22 from the issued branch of project-artifacts/mockup/
 * components/account/CertificateView.tsx; the "no certificate yet" branch
 * ported on 2026-09-21 is kept beneath. Changed: everything comes from the
 * database — `listCertificatesForUser`, the status computed on read in MYT,
 * `previewRenewal` for the fee in force and the window, `listRenewals` for
 * the history; the document is served ONLY when `certificateDocumentAccess`
 * says the review requirement is met (E9) — otherwise the gate card, and no
 * document markup at all; the listing toggle and "Renew" post server
 * actions. With `?order=<id>` (Stripe's return) the page shows SERVER TRUTH
 * about that renewal order, exactly as /account/programmes does for a
 * registration. The mockup's demo tools, simulated clock and sessionStorage
 * were NEVER ported.
 */
export const metadata: Metadata = { title: "Certificate" };

export const dynamic = "force-dynamic";

const MYT_NOTE = "Dates are calendar dates in Malaysia (MYT).";
const NOT_EARNED = "The certificate records that you completed the programme. It is not the Academy’s earned credential.";

function verifyHref(certificateId: string): string {
  let base = "";
  try {
    base = appBaseUrl();
  } catch {
    // APP_BASE_URL unset (local only): a path — CopyLinkButton makes it absolute in the browser.
  }
  return `${base}/verify/${certificateId}`;
}

function OrderBanner({ order, now }: { order: RenewalOrderView | null; now: Date }) {
  if (!order) {
    return (
      <Card variant="panel" className="p-5 sm:p-6" data-testid="renewal-order-missing">
        <p className="text-body-lg font-medium">We could not find that renewal order.</p>
        <p className="text-body-sm text-[var(--color-ink-quiet)]">If you have just paid, the new expiry appears below once Stripe confirms it.</p>
      </Card>
    );
  }
  if (order.effectiveStatus === "pending") {
    return (
      <>
        {/* Server truth only: the page re-asks the database, it never assumes. */}
        <meta httpEquiv="refresh" content="3" />
        <Card variant="panel" className="p-5 sm:p-6" data-testid="renewal-order-pending">
          <p className="text-body-lg font-medium" role="status">
            Payment received? We are confirming with Stripe — this page refreshes.
          </p>
          <p className="text-body-sm text-[var(--color-ink-quiet)]">
            Renewal of {order.certificateCode} · {formatMoney(order.amountMinor, order.currency)}
          </p>
          <p className="text-body-sm mt-2 text-[var(--color-ink-faint)]">
            Your certificate is extended only when Stripe reports the payment as complete. If you closed the Stripe page without paying,
            nothing is charged.
          </p>
        </Card>
      </>
    );
  }
  if (order.status === "paid" || order.status === "refunded" || order.status === "partially_refunded") {
    return (
      <Card variant="feature" className="p-5! sm:p-8!" data-testid="renewal-order-paid">
        <p className="text-label mb-2 text-[var(--color-success)]">Payment confirmed</p>
        <h2 className="text-h1 mb-1" role="status">
          {order.renewal ? `Renewed until ${formatCalendarDate(order.renewal.newExpiresOn)}` : "Renewal paid"}
        </h2>
        <p className="text-body-sm text-[var(--color-ink-quiet)]">
          Certificate {order.certificateCode} · {formatMoney(order.amountMinor, order.currency)}.{" "}
          {order.renewal ? "A receipt email has been queued." : "The extension is being recorded."}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant="secondary" href="/account/orders">
            Orders &amp; receipts
          </Button>
        </div>
      </Card>
    );
  }
  return (
    <Card variant="panel" className="p-5 sm:p-6" data-testid="renewal-order-not-paid">
      <p className="text-body-lg font-medium" role="status">
        {order.status === "failed" ? "This renewal payment could not be started." : "This renewal payment was not completed in time."}
      </p>
      <p className="text-body-sm text-[var(--color-ink-quiet)]">Nothing was charged and your certificate is unchanged. You can start the renewal again below.</p>
    </Card>
  );
}

function expirySentence(c: CertificateRecord, today: string): string {
  const { status, days } = statusOf(c, today);
  const until = formatCalendarDate(c.expiresOn);
  switch (status) {
    case "revoked":
      return `This certificate was revoked${c.revokedAt ? ` on ${formatCalendarDate(todayIso(c.revokedAt))}` : ""} and is no longer valid. If you believe this is a mistake, contact us.`;
    case "expired":
      return `Expired on ${until}. It no longer shows as active; renewing reactivates it for ${VALIDITY_MONTHS} months from the day you renew.`;
    case "renewal_due":
      return `Active until ${until} — ${days} ${days === 1 ? "day" : "days"} left. Renew now to keep it active without a gap.`;
    case "active":
      return `Active until ${until}.`;
  }
}

function renewalRefusal(preview: RenewalPreview): string {
  switch (preview.reason) {
    case "revoked":
      return "A revoked certificate cannot be renewed.";
    case "window_closed":
      return `Renewal opens ${RENEWAL_WINDOW_DAYS} days before expiry, on ${formatCalendarDate(addDays(preview.certificate.expiresOn, -RENEWAL_WINDOW_DAYS))}.`;
    case "order_pending":
      return "A renewal payment for this certificate is already in progress. Finish it on Stripe, or wait for the hold to lapse and try again.";
    case "fee_unavailable":
      return "The renewal fee is not available right now. Please try again later.";
    default:
      return "This certificate cannot be renewed right now.";
  }
}

async function CertificateSection({ certificate, userId, today }: { certificate: CertificateRecord; userId: string; today: string }) {
  const [access, preview, renewals] = await Promise.all([
    certificateDocumentAccess(certificate),
    previewRenewal(certificate.id, userId),
    listRenewals(certificate.id),
  ]);
  const { status } = statusOf(certificate, today);
  const href = verifyHref(certificate.certificateId);
  const renewLabel = preview?.allowed && preview.amountMinor !== null && preview.currency ? `Renew for ${VALIDITY_MONTHS} months — ${formatMoney(preview.amountMinor, preview.currency)}` : null;

  return (
    <section aria-labelledby={`cert-${certificate.id}`} className="flex flex-col gap-6" data-testid="certificate-section">
      {/* (a) status card — never gated */}
      <Card variant="panel" className="p-5 sm:p-6" data-testid="certificate-status-card">
        <h2 id={`cert-${certificate.id}`} className="text-h1 mb-3">
          {certificate.programmeTitle}
        </h2>
        <div className="mb-3">
          <StatusChip status={status} />
        </div>
        <p className="text-body-sm max-w-[62ch] text-[var(--color-ink)]" data-testid="certificate-expiry-sentence">
          {expirySentence(certificate, today)}
        </p>
        <p className="text-body-sm mt-1 text-[var(--color-ink-faint)]">{MYT_NOTE}</p>
        <dl className="text-body-sm mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
          <div>
            <dt className="text-label mb-1">Certificate ID</dt>
            <dd className="text-mono break-all" data-testid="certificate-id">
              {certificate.certificateId}
            </dd>
          </div>
          <div>
            <dt className="text-label mb-1">Completed</dt>
            <dd>{formatCalendarDate(certificate.completedOn)}</dd>
          </div>
        </dl>
        <div className="mt-5 flex flex-col gap-3">
          <CopyLinkButton href={href} />
          <Link
            href={`/verify/${certificate.certificateId}`}
            className="text-body-sm inline-block self-start py-1 text-[var(--color-primary)] underline underline-offset-4"
            data-testid="certificate-public-link"
          >
            View the public verification page
          </Link>
        </div>
      </Card>

      {/* (b) the document — behind the reviews gate (E9) */}
      {access.unlocked ? (
        <div className="flex flex-col gap-4">
          <CertificateDocument certificate={certificate} verifyUrl={href} />
          <div className="flex flex-wrap gap-3 print:hidden">
            <PrintButton />
          </div>
        </div>
      ) : (
        <Card variant="feature" className="p-5! sm:p-8!" data-testid="certificate-gate">
          <p className="text-label mb-2 text-[var(--color-primary)]">One step left</p>
          <h3 className="text-h1 mb-2">Share your review to view and download your certificate</h3>
          <p className="text-body-sm mb-5 max-w-[60ch] text-[var(--color-ink-quiet)]">
            Your certificate has been issued and anyone can verify it by its ID. The document itself opens here once you have shared
            your experience of the programme — a private review counts too.
          </p>
          <Button href={`/reviews#registration-${certificate.registrationId}`} data-testid="certificate-gate-review-link">
            Share your review
          </Button>
        </Card>
      )}

      {/* (c) renewal, (d) history */}
      <Card variant="panel" className="p-5 sm:p-6" data-testid="certificate-renewal">
        <h3 className="text-h1 mb-2">Renewal</h3>
        <p className="text-body-sm mb-4 text-[var(--color-ink-quiet)]">
          A certificate is active for {VALIDITY_MONTHS} months. Renewing extends it by {VALIDITY_MONTHS} calendar months — from the current
          expiry when you renew on time, or from the day you renew after it has lapsed. You always see the exact amount before you pay.
        </p>
        {preview && renewLabel ? (
          <RenewForm certificateId={certificate.id} label={renewLabel} />
        ) : (
          <p className="text-body-sm text-[var(--color-ink)]" data-testid="renewal-closed">
            {preview ? renewalRefusal(preview) : "Renewal is not available for this certificate."}
          </p>
        )}
        <h4 className="text-label mt-6 mb-2">History</h4>
        <ul className="text-body-sm flex flex-col gap-2 text-[var(--color-ink-quiet)]" data-testid="renewal-history">
          <li>Issued {formatCalendarDate(certificate.issuedOn)} · active until {formatCalendarDate(renewals[0]?.previousExpiresOn ?? certificate.expiresOn)}</li>
          {renewals.map((r: RenewalRecord) => (
            <li key={r.id}>
              Renewed {formatCalendarDate(todayIso(r.createdAt))} · {formatMoney(r.amountMinor, r.currency)} · {formatCalendarDate(r.previousExpiresOn)} →{" "}
              {formatCalendarDate(r.newExpiresOn)}
            </li>
          ))}
        </ul>
      </Card>

      {/* (e) listing consent */}
      <Card variant="panel" className="p-5 sm:p-6" data-testid="certificate-listing">
        <h3 className="text-h1 mb-3">Public listing</h3>
        <ListingToggle certificateId={certificate.id} listed={certificate.listed} />
      </Card>
    </section>
  );
}

export default async function CertificatePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser("/account/certificate");
  const sp = await searchParams;
  const orderParam = typeof sp["order"] === "string" ? sp["order"] : null;
  const cancelled = sp["cancelled"] === "1";
  const now = new Date();
  const today = todayIso(now);
  const [certificates, order] = await Promise.all([
    listCertificatesForUser(user.id),
    orderParam ? findRenewalOrderForUser(orderParam, user.id, now) : Promise.resolve(null),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-label mb-2 text-[var(--color-primary)]">Certificate</p>
        <h1 className="text-display">Your certificate of completion</h1>
      </header>

      {orderParam ? <OrderBanner order={order} now={now} /> : null}
      {cancelled ? (
        <p className="text-body-sm text-[var(--color-ink-quiet)]" role="status" data-testid="renewal-cancelled">
          The renewal payment was cancelled. Nothing was charged and your certificate is unchanged.
        </p>
      ) : null}

      {certificates.length === 0 ? (
        <>
          <Card variant="panel" className="p-6 sm:p-8">
            <h2 className="text-h1 mb-3">How it works</h2>
            <ol className="text-body-sm flex list-decimal flex-col gap-2 pl-5 text-[var(--color-ink-quiet)]">
              <li>When you complete the programme you receive a Certificate of Completion with a unique ID and its own web address.</li>
              <li>Anyone can check it on the public verification page and see whether it is active.</li>
            </ol>
            <p className="text-body-sm mt-4 text-[var(--color-ink-faint)]">{NOT_EARNED}</p>
          </Card>

          <Card variant="panel" className="p-6" data-testid="certificate-none">
            <p className="text-body-lg font-medium">No certificate has been issued yet.</p>
            <p className="text-body-sm mt-2 mb-4 text-[var(--color-ink-quiet)]">Issued when you complete the programme.</p>
            <Button href="/DataBlueprint-AIVibeCoding">View the programme</Button>
          </Card>
        </>
      ) : (
        <>
          {certificates.map((c) => (
            <CertificateSection key={c.id} certificate={c} userId={user.id} today={today} />
          ))}
          <p className="text-body-sm text-[var(--color-ink-faint)]">{NOT_EARNED}</p>
        </>
      )}
    </div>
  );
}
