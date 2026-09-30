import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { attemptDeadline } from "@/modules/free-learning/assessment-rules";
import { attemptPage, getAttemptForUser, settleExpiredAttempts } from "@/modules/free-learning/knowledge-check.repository";
import { requireUser } from "@/modules/identity/session";
import { AttemptForm } from "./AttemptForm";

/*
 * /free-learning/knowledge-check/[attemptId] — the test itself (Milestone
 * 14 Phase 4; the Free Assessment Check since 2026-09-30): ten questions a
 * page, answers saved on every page change, Finish from any page. The correct
 * options never reach the page. Only the attempt's owner can open it; a
 * finished attempt goes to its result. The 3-hour limit is the SERVER's: this
 * page settles an expired attempt (scored as it stands) before it reads it, and
 * shows a countdown to the deadline the server computed; there is no cancel and
 * no "unfinished" state — a test is running or it is a result.
 */
export const metadata: Metadata = { title: "Free Assessment Check", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AttemptPage({ params, searchParams }: { params: Promise<{ attemptId: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { attemptId } = await params;
  const sp = await searchParams;
  const user = await requireUser(`/free-learning/knowledge-check/${attemptId}`);
  await settleExpiredAttempts(user.id); // lazy expiry: time up → scored as it stands → the result
  const attempt = await getAttemptForUser(attemptId, user.id);
  if (!attempt) notFound();
  if (attempt.finishedAt) redirect(`/free-learning/knowledge-check/${attempt.id}/result`);
  const page = await attemptPage(attempt, Number.parseInt(typeof sp["page"] === "string" ? sp["page"] : "1", 10) || 1);
  // The server's own remaining time, measured now: the browser counts down from it rather than trusting its own clock.
  const remainingMs = Math.max(0, attemptDeadline(attempt.startedAt).getTime() - Date.now());

  return (
    <section className="bg-[var(--color-ground-tint)]">
      <div className="mx-auto max-w-[860px] px-4 py-12 sm:px-6 sm:py-16">
        <Link href="/free-certifications" className="text-body-sm mb-2 inline-block py-1 text-[var(--color-primary)] underline underline-offset-4">
          ← Free Assessment Check
        </Link>
        <p className="text-label mb-3 text-[var(--color-primary)]">{attempt.size}-question Free Assessment Check</p>
        <h1 className="text-display mb-2" data-testid="attempt-title">
          Questions {page.from}–{page.to} of {attempt.size}
        </h1>
        <p className="text-body-sm mb-6 text-[var(--color-ink-quiet)]" data-testid="attempt-progress">
          Page {page.page} of {page.pages} · {page.answered} of {attempt.size} answered so far. Your answers are saved when you move between pages;
          finish from any page. When the time is up, the test is scored as it stands.
        </p>
        <AttemptForm attemptId={attempt.id} page={page} size={attempt.size} remainingMs={remainingMs} />
      </div>
    </section>
  );
}
