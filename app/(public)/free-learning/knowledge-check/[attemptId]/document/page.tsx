import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PrintButton } from "@/modules/certificates/components/PrintButton";
import { DownloadPdfButton } from "@/shared/certificate/DownloadPdfButton";
import { appBaseUrl } from "@/modules/commerce/checkout.service";
import { unlockStatusForAttempt } from "@/modules/commerce/unlock.service";
import { achievementCertificateData } from "@/modules/free-learning/achievement-certificate";
import { KnowledgeCheckDocument } from "@/modules/free-learning/components/KnowledgeCheckDocument";
import { findResultByPublicId, getAttemptForUser } from "@/modules/free-learning/knowledge-check.repository";
import { requireUser } from "@/modules/identity/session";

/*
 * /free-learning/knowledge-check/[attemptId]/document — the printable
 * Certificate of Achievement (Milestone 14 Phase 5; redesigned Milestone 15
 * Requirement 3 on the shared certificate, DR-05). Served ONLY to the attempt's owner and
 * only when the gate holds (a Free Learning review + the fee paid or
 * exempt) and the certificate is not revoked; otherwise back to the result
 * page, which explains what is missing. The ID and /verify are never gated.
 */
export const metadata: Metadata = { title: "Certificate of Achievement", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function DocumentPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  const user = await requireUser(`/free-learning/knowledge-check/${attemptId}/document`);
  const attempt = await getAttemptForUser(attemptId, user.id);
  if (!attempt) notFound();
  if (!attempt.finishedAt || !attempt.publicId) redirect(`/free-learning/knowledge-check/${attempt.id}`);
  const status = await unlockStatusForAttempt(attempt); // false for a fail (U5)
  if (!status.unlocked) redirect(`/free-learning/knowledge-check/${attempt.id}/result`);
  const view = await findResultByPublicId(attempt.publicId);
  if (!view || view.status === "revoked") redirect(`/free-learning/knowledge-check/${attempt.id}/result`);
  const certificate = await achievementCertificateData(view, `${appBaseUrl()}/verify/${attempt.publicId}`);
  return (
    <section className="bg-[var(--color-ground-tint)] print:bg-white">
      <div className="mx-auto max-w-[1123px] px-4 py-10 sm:px-6 sm:py-14 print:p-0">
        <div className="mb-6 flex flex-wrap items-center gap-3 print:hidden">
          <Link href={`/free-learning/knowledge-check/${attempt.id}/result`} className="text-body-sm text-[var(--color-primary)] underline underline-offset-4">
            ← Your result
          </Link>
          <PrintButton />
          <DownloadPdfButton href={`/api/knowledge-checks/${attempt.id}/pdf`} />
        </div>
        <KnowledgeCheckDocument certificate={certificate} />
      </div>
    </section>
  );
}
