import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { daysBetween, formatCalendarDate, todayIso } from "@/modules/certificates/dates";
import type { PublicCertificateView } from "@/modules/certificates/repository";
import { publicCertificateById } from "@/modules/certificates/search.service";
import { ASSESSMENT_GRADE_BANDS } from "@/modules/free-learning/assessment-rules";
import { findResultByPublicId, KNOWLEDGE_CHECK_ID_RE, type KnowledgeCheckStatus, passMarkPercent, type PublicKnowledgeCheckView } from "@/modules/free-learning/knowledge-check.repository";
import { certificateBrand } from "@/content/certificate-brand";
import { formatTimeTaken } from "@/shared/certificate/format";
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
 *
 * Milestone 15, Requirement 5 (founder, 2026-09-29): this is the page a
 * certificate's QR code and printed URL lead to. It states, for both kinds of
 * ID, the status in words (Valid / Expired / Revoked), the type, the holder,
 * the dates, the issuing organisation, and — for the Professional
 * certificate — the training duration and trainer(s) as snapshotted at issue.
 * `/verify-certificate[/:id]` redirect here (next.config.ts). A Knowledge
 * Check (now the Free Assessment Check, 2026-09-30) keeps its "result, not a
 * credential" wording; a passed 200-question result also states its grade
 * (Charlie / Bravo / Alpha, derived from the score), an older result shows
 * exactly what it was issued with — its size and its 70 % mark, no grade.
 */
export const dynamic = "force-dynamic";

const NOT_EARNED = "This certificate records completion of the programme. It is not the Academy’s earned credential.";

const load = cache(async (id: string): Promise<PublicCertificateView | null> => publicCertificateById(id));

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  if (KNOWLEDGE_CHECK_ID_RE.test(id.trim().toUpperCase())) {
    const kc = await findResultByPublicId(id);
    return { title: kc ? `Free Assessment Check ${kc.publicId}` : "Result not found", description: "A Free Assessment Check result — not a credential.", robots: { index: false, follow: false } };
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
      return `This certificate expired on ${until}; the holder completed the training on ${formatCalendarDate(view.completedOn)}.`;
    case "renewal_due": {
      const days = daysBetween(today, view.expiresOn);
      return `This certificate is valid until ${until} (renewal due in ${days} ${days === 1 ? "day" : "days"}).`;
    }
    case "active":
      return `This certificate is valid until ${until}.`;
  }
}

type VerifyState = "valid" | "expired" | "revoked" | "neutral";

const VERIFY_LABEL: Record<VerifyState, string> = { valid: "Valid", expired: "Expired", revoked: "Revoked", neutral: "Not passed" };
const VERIFY_ICON: Record<VerifyState, string> = {
  valid: "M5 12.5 10 17.5 19 7.5",
  expired: "M7 7l10 10M17 7 7 17",
  revoked: "M7 7l10 10M17 7 7 17",
  neutral: "M6 12h12",
};

/** The status in words AND an icon — never colour alone. `data-status` carries
 *  the underlying state for tests. */
function VerifyStatus({ state, raw }: { state: VerifyState; raw: string }) {
  return (
    <span className="inline-flex" data-testid="certificate-status" data-status={raw}>
      <Chip tone={state === "valid" ? "primary" : "neutral"}>
        <svg viewBox="0 0 24 24" className="mr-1.5 h-3.5 w-3.5 shrink-0" fill="none" aria-hidden="true" focusable="false">
          <path d={VERIFY_ICON[state]} stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {VERIFY_LABEL[state]}
      </Chip>
    </span>
  );
}

function professionalState(status: PublicCertificateView["status"]): VerifyState {
  return status === "revoked" ? "revoked" : status === "expired" ? "expired" : "valid";
}

const KC_STATE: Record<KnowledgeCheckStatus, VerifyState> = { valid: "valid", expired: "expired", revoked: "revoked", not_passed: "neutral" };

function kcSentence(view: PublicKnowledgeCheckView): string {
  const mark = passMarkPercent(view.size);
  const result = `${view.holderName} answered ${view.score} of ${view.size} questions correctly (${view.percent} %) on the Free Assessment Check on ${formatTimestamp(view.finishedAt)}`;
  const grade = view.grade ? ` — Grade ${ASSESSMENT_GRADE_BANDS[view.grade].name} (${ASSESSMENT_GRADE_BANDS[view.grade].band})` : "";
  switch (view.status) {
    case "not_passed":
      return `${result} — below the ${mark} % pass mark.`;
    case "revoked":
      return `${result}. This result was revoked and is no longer valid.`;
    case "expired":
      return `${result} — a pass at the ${mark} % mark${grade}. It expired on ${formatCalendarDate(view.expiresOn!)}.`;
    case "valid":
      return `${result} — a pass at the ${mark} % mark${grade}. It is valid until ${formatCalendarDate(view.expiresOn!)}.`;
  }
}

function IssuedBy() {
  return (
    <div className="sm:col-span-2">
      <dt className="text-label mb-1">Issued by</dt>
      <dd data-testid="verify-issuer">{certificateBrand.legalName}</dd>
    </div>
  );
}

/** A Free Assessment Check ID (`KC-`; M14 Phase 4): the result, plainly NOT a credential. */
function KnowledgeCheckResult({ view }: { view: PublicKnowledgeCheckView }) {
  const rows: Array<[string, string]> = [
    ["Type", view.passed ? "Certificate of Achievement — Free Assessment Check" : "Free Assessment Check (not passed)"],
    ["Questions", `${view.size}, drawn from the reviewed topics of I Am Datapedia!`],
    ["Score", `${view.score} of ${view.size} (${view.percent} %)`],
    ["Time taken", formatTimeTaken(view.timeTakenMs)],
    ["Taken on", formatTimestamp(view.finishedAt)],
  ];
  if (view.grade) rows.splice(3, 0, ["Grade", `${ASSESSMENT_GRADE_BANDS[view.grade].name} (${ASSESSMENT_GRADE_BANDS[view.grade].band})`]);
  if (view.expiresOn) rows.push([view.status === "expired" ? "Expired on" : "Valid until", formatCalendarDate(view.expiresOn)]);
  return (
    <section className="bg-[var(--color-ground-tint)]">
      <div className="mx-auto max-w-[760px] px-4 py-10 sm:px-6 sm:py-14">
        <div className="flex flex-col gap-8">
          <header>
            <p className="text-label mb-2 text-[var(--color-primary)]">Free Assessment Check result</p>
            <h1 className="text-display mb-4" data-testid="verify-holder">
              {view.holderName}
            </h1>
            <div className="mb-3">
              <VerifyStatus state={KC_STATE[view.status]} raw={view.status} />
            </div>
            <p className="text-body-lg max-w-[62ch] text-[var(--color-ink-quiet)]" data-testid="verify-status-sentence">
              {kcSentence(view)}
            </p>
          </header>
          <Card variant="panel" className="p-5 sm:p-6">
            <dl className="text-body-sm grid gap-x-8 gap-y-4 sm:grid-cols-2" data-testid="verify-details">
              {rows.map(([k, v]) => (
                <div key={k}>
                  <dt className="text-label mb-1">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
              <div className="sm:col-span-2">
                <dt className="text-label mb-1">Free Assessment Check ID</dt>
                <dd className="text-mono break-all" data-testid="verify-certificate-id">
                  {view.publicId}
                </dd>
              </div>
              <IssuedBy />
            </dl>
            <p className="text-body-sm mt-4 text-[var(--color-ink-faint)]">Dates are calendar dates in Malaysia (MYT).</p>
            <p className="text-body-sm mt-2 text-[var(--color-ink-faint)]" data-testid="verify-not-credential">
              The Free Assessment Check is a free online test. Its certificate is not a Certificate of Completion and not the Academy&rsquo;s credential, which is
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
    ["Type", "Certificate of Completion — Professional Training"],
    ["Holder", view.holderName],
    ["Programme", view.programmeTitle],
    ["Format", view.formatName],
  ];
  if (view.trainingDurationLabel) rows.push(["Training duration", view.trainingDurationLabel]);
  if (view.trainerName) rows.push(["Trainer(s)", view.trainerName]);
  rows.push(["Completed", formatCalendarDate(view.completedOn)], ["Issued", formatCalendarDate(view.issuedOn)]);
  if (view.status === "expired") rows.push(["Expired on", formatCalendarDate(view.expiresOn)]);
  else if (view.status !== "revoked") rows.push(["Valid until", formatCalendarDate(view.expiresOn)]);

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
              <VerifyStatus state={professionalState(view.status)} raw={view.status} />
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
              <IssuedBy />
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
