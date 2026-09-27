import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { StatusChip } from "@/modules/certificates/components/StatusChip";
import { daysBetween, formatCalendarDate, todayIso } from "@/modules/certificates/dates";
import type { PublicCertificateView } from "@/modules/certificates/repository";
import { publicCertificateById } from "@/modules/certificates/search.service";
import { findResultByPublicId, KNOWLEDGE_CHECK_ID_RE, type PublicKnowledgeCheckView } from "@/modules/free-learning/knowledge-check.repository";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";
import { formatTimestamp } from "@/shared/util/dates";

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
  if (KNOWLEDGE_CHECK_ID_RE.test(id.trim().toUpperCase())) {
    const kc = await findResultByPublicId(id);
    return { title: kc ? `Knowledge Check ${kc.publicId}` : "Result not found", description: "A free Knowledge Check result — not a credential.", robots: { index: false, follow: false } };
  }
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

/** A Knowledge Check ID (M14 Phase 4): the result, plainly NOT a credential. */
function KnowledgeCheckResult({ view }: { view: PublicKnowledgeCheckView }) {
  return (
    <section className="bg-[var(--color-ground-tint)]">
      <div className="mx-auto max-w-[760px] px-4 py-10 sm:px-6 sm:py-14">
        <div className="flex flex-col gap-8">
          <header>
            <p className="text-label mb-2 text-[var(--color-primary)]">Knowledge Check result</p>
            <h1 className="text-display mb-4" data-testid="verify-holder">
              {view.holderName}
            </h1>
            <div className="mb-3">
              <Chip tone={view.passed ? "primary" : "neutral"}>{view.passed ? "Passed" : "Not passed"}</Chip>
            </div>
            <p className="text-body-lg max-w-[62ch] text-[var(--color-ink-quiet)]" data-testid="verify-status-sentence">
              {view.holderName} answered {view.score} of {view.size} questions correctly ({view.percent} %) on the free Knowledge Check on{" "}
              {formatTimestamp(view.finishedAt)} — {view.passed ? "a pass at the 70 % mark" : "below the 70 % pass mark"}.
            </p>
          </header>
          <Card variant="panel" className="p-5 sm:p-6">
            <dl className="text-body-sm grid gap-x-8 gap-y-4 sm:grid-cols-2" data-testid="verify-details">
              <div>
                <dt className="text-label mb-1">Questions</dt>
                <dd>{view.size}, drawn from the reviewed topics of I Am Datapedia!</dd>
              </div>
              <div>
                <dt className="text-label mb-1">Score</dt>
                <dd>
                  {view.score} of {view.size} ({view.percent} %)
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-label mb-1">Knowledge Check ID</dt>
                <dd className="text-mono break-all" data-testid="verify-certificate-id">
                  {view.publicId}
                </dd>
              </div>
            </dl>
            <p className="text-body-sm mt-4 text-[var(--color-ink-faint)]" data-testid="verify-not-credential">
              A Knowledge Check is a free, self-paced test of reading. It is not a Certificate of Completion and not the Academy&rsquo;s credential, which is
              earned by attending an expert-led training.
            </p>
          </Card>
          <Link href="/verify" className="text-body-sm inline-block self-start py-2 text-[var(--color-primary)] underline underline-offset-4" data-testid="verify-search-another">
            Search another certificate
          </Link>
        </div>
      </div>
    </section>
  );
}

export default async function VerifyCertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (KNOWLEDGE_CHECK_ID_RE.test(id.trim().toUpperCase())) {
    const kc = await findResultByPublicId(id);
    if (!kc) notFound();
    return <KnowledgeCheckResult view={kc} />;
  }
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
