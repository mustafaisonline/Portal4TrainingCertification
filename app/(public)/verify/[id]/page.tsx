import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { StatusChip } from "@/modules/certificates/components/StatusChip";
import { daysBetween, formatCalendarDate, todayIso } from "@/modules/certificates/dates";
import type { PublicCertificateView } from "@/modules/certificates/repository";
import { publicCertificateById } from "@/modules/certificates/search.service";
import { Card } from "@/shared/ui/Card";

/*
 * /verify/[id] — the unique, shareable URL of ONE Certificate of Completion
 * (Milestone 6; MILESTONE_6_EXECUTION_PLAN.md §3 E6, E8, E9; §5
 * "Verification page"; requirements R-V1/R-V2). PORTED 2026-09-22 from
 * project-artifacts/mockup/components/certificates/VerifyDetail.tsx and
 * app/verify/[id]/page.tsx. Changed: a dynamic server page — any ID is
 * resolved from the database at request time and an unknown or malformed
 * one is a real 404 (`generateStaticParams` and the in-browser registry
 * were never ported); the status is computed on read in MYT; the page
 * shows a VERIFICATION LAYOUT, deliberately NOT the printable document
 * (E9: the reviews gate on the document cannot be bypassed through the
 * public link). Nothing outside `PublicCertificateView` is rendered — no
 * email, country, order or ID-document field. Not indexed: the page is
 * reached from a link the holder chose to share.
 */
export const dynamic = "force-dynamic";

const NOT_EARNED = "This certificate records completion of the programme. It is not the Academy’s earned credential.";

const load = cache(async (id: string): Promise<PublicCertificateView | null> => publicCertificateById(id));

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const view = await load(id);
  return {
    title: view ? `Certificate ${view.certificateId}` : "Certificate not found",
    description: "Verification of a Data & AI Academy Certificate of Completion.",
    robots: { index: false, follow: false },
  };
}

function statusSentence(view: PublicCertificateView, today: string): string {
  const until = formatCalendarDate(view.expiresOn);
  switch (view.status) {
    case "revoked":
      return "This certificate was revoked and is no longer valid.";
    case "expired":
      return `This certificate expired on ${until}; the holder completed the programme on ${formatCalendarDate(view.completedOn)}.`;
    case "renewal_due": {
      const days = daysBetween(today, view.expiresOn);
      return `This certificate is active until ${until} (renewal due in ${days} ${days === 1 ? "day" : "days"}).`;
    }
    case "active":
      return `This certificate is active until ${until}.`;
  }
}

export default async function VerifyCertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const view = await load(id);
  if (!view) notFound();
  const today = todayIso(new Date());

  const rows: Array<[string, string]> = [
    ["Holder", view.holderName],
    ["Programme", view.programmeTitle],
    ["Format", view.formatName],
    ["Completed", formatCalendarDate(view.completedOn)],
    ["Issued", formatCalendarDate(view.issuedOn)],
  ];
  if (view.status === "expired") rows.push(["Expired on", formatCalendarDate(view.expiresOn)]);
  else if (view.status !== "revoked") rows.push(["Active until", formatCalendarDate(view.expiresOn)]);

  return (
    <section className="bg-[var(--color-ground-tint)]">
      <div className="mx-auto max-w-[760px] px-4 py-10 sm:px-6 sm:py-14">
        <div className="flex flex-col gap-8">
          <header>
            <p className="text-label mb-2 text-[var(--color-primary)]">Certificate verification</p>
            <h1 className="text-display mb-4" data-testid="verify-holder">
              {view.holderName}
            </h1>
            <div className="mb-3">
              <StatusChip status={view.status} />
            </div>
            <p className="text-body-lg max-w-[62ch] text-[var(--color-ink-quiet)]" data-testid="verify-status-sentence">
              {statusSentence(view, today)}
            </p>
            <p className="text-body-sm mt-2 text-[var(--color-ink-faint)]">
              Checked today, {formatCalendarDate(today)}. Status can change; this page is always current.
            </p>
          </header>

          <Card variant="panel" className="p-5 sm:p-6">
            <h2 className="text-h1 mb-4">Details</h2>
            <dl className="text-body-sm grid gap-x-8 gap-y-4 sm:grid-cols-2" data-testid="verify-details">
              {rows.map(([k, v]) => (
                <div key={k}>
                  <dt className="text-label mb-1">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
              <div className="sm:col-span-2">
                <dt className="text-label mb-1">Certificate ID</dt>
                <dd className="text-mono break-all" data-testid="verify-certificate-id">
                  {view.certificateId}
                </dd>
              </div>
            </dl>
            <p className="text-body-sm mt-4 text-[var(--color-ink-faint)]">Dates are calendar dates in Malaysia (MYT).</p>
            <p className="text-body-sm mt-2 text-[var(--color-ink-faint)]">{NOT_EARNED}</p>
          </Card>

          <Link
            href="/verify"
            className="text-body-sm inline-block self-start py-2 text-[var(--color-primary)] underline underline-offset-4"
            data-testid="verify-search-another"
          >
            Search another certificate
          </Link>
        </div>
      </div>
    </section>
  );
}
