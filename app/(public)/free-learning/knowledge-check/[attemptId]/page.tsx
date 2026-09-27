import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { attemptPage, getAttemptForUser } from "@/modules/free-learning/knowledge-check.repository";
import { requireUser } from "@/modules/identity/session";
import { AttemptForm } from "./AttemptForm";

/*
 * /free-learning/knowledge-check/[attemptId] — the check itself (Milestone
 * 14 Phase 4): ten questions a page, answers saved on every page change,
 * Finish from any page. The correct options never reach the page. Only the
 * attempt's owner can open it; a finished attempt goes to its result.
 */
export const metadata: Metadata = { title: "Knowledge Check", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AttemptPage({ params, searchParams }: { params: Promise<{ attemptId: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { attemptId } = await params;
  const sp = await searchParams;
  const user = await requireUser(`/free-learning/knowledge-check/${attemptId}`);
  const attempt = await getAttemptForUser(attemptId, user.id);
  if (!attempt) notFound();
  if (attempt.finishedAt) redirect(`/free-learning/knowledge-check/${attempt.id}/result`);
  const page = await attemptPage(attempt, Number.parseInt(typeof sp["page"] === "string" ? sp["page"] : "1", 10) || 1);

  return (
    <section className="bg-[var(--color-ground-tint)]">
      <div className="mx-auto max-w-[860px] px-4 py-12 sm:px-6 sm:py-16">
        <Link href="/free-learning/knowledge-check" className="text-body-sm mb-2 inline-block py-1 text-[var(--color-primary)] underline underline-offset-4">
          ← Knowledge Check
        </Link>
        <p className="text-label mb-3 text-[var(--color-primary)]">{attempt.size}-question Knowledge Check</p>
        <h1 className="text-display mb-2" data-testid="attempt-title">
          Questions {page.from}–{page.to} of {attempt.size}
        </h1>
        <p className="text-body-sm mb-6 text-[var(--color-ink-quiet)]" data-testid="attempt-progress">
          Page {page.page} of {page.pages} · {page.answered} of {attempt.size} answered so far. Your answers are saved when you move between pages;
          finish from any page.
        </p>
        <AttemptForm attemptId={attempt.id} page={page} size={attempt.size} />
      </div>
    </section>
  );
}
