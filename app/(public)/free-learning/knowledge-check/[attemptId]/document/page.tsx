import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PrintButton } from "@/modules/certificates/components/PrintButton";
import { appBaseUrl } from "@/modules/commerce/checkout.service";
import { unlockStatusForAttempt } from "@/modules/commerce/unlock.service";
import { KnowledgeCheckDocument } from "@/modules/free-learning/components/KnowledgeCheckDocument";
import { getAttemptForUser } from "@/modules/free-learning/knowledge-check.repository";
import { requireUser } from "@/modules/identity/session";

/*
 * /free-learning/knowledge-check/[attemptId]/document — the printable result
 * document (Milestone 14 Phase 5). Served ONLY to the attempt's owner and
 * only when the gate holds (a Free Learning review + the fee paid or
 * exempt); otherwise back to the result page, which explains what is
 * missing. The ID and /verify are never gated.
 */
export const metadata: Metadata = { title: "Knowledge Check result document", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function DocumentPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  const user = await requireUser(`/free-learning/knowledge-check/${attemptId}/document`);
  const attempt = await getAttemptForUser(attemptId, user.id);
  if (!attempt) notFound();
  if (!attempt.finishedAt || !attempt.publicId) redirect(`/free-learning/knowledge-check/${attempt.id}`);
  const status = await unlockStatusForAttempt(attempt); // false for a fail (U5)
  if (!status.unlocked) redirect(`/free-learning/knowledge-check/${attempt.id}/result`);
  let base = "";
  try {
    base = appBaseUrl();
  } catch {
    // local only
  }
  return (
    <section className="bg-[var(--color-ground-tint)] print:bg-white">
      <div className="mx-auto max-w-[900px] px-4 py-10 sm:px-6 sm:py-14 print:p-0">
        <div className="mb-6 flex flex-wrap items-center gap-3 print:hidden">
          <Link href={`/free-learning/knowledge-check/${attempt.id}/result`} className="text-body-sm text-[var(--color-primary)] underline underline-offset-4">
            ← Your result
          </Link>
          <PrintButton />
        </div>
        <KnowledgeCheckDocument attempt={attempt} verifyUrl={`${base}/verify/${attempt.publicId}`} />
      </div>
    </section>
  );
}
