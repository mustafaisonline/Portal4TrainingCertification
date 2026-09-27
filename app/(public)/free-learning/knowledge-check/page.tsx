import type { Metadata } from "next";
import Link from "next/link";
import { bankSize, KNOWLEDGE_CHECK_PASS_PERCENT, KNOWLEDGE_CHECK_SIZES, listAttemptsForUser } from "@/modules/free-learning/knowledge-check.repository";
import { requireUser } from "@/modules/identity/session";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";
import { formatTimestamp } from "@/shared/util/dates";
import { StartForm } from "./StartForm";

/*
 * /free-learning/knowledge-check — "Give free test and gain certificate"
 * (Milestone 14 Phase 4; DR-03; P2, P12). Signed-in only. Choose 50, 100 or
 * 200 questions drawn from the reviewed question bank; sizes the bank cannot
 * serve are shown but disabled, with the number available — never a
 * shortened check presented as the full one. Past attempts are listed with
 * a way to continue an unfinished one.
 */
export const metadata: Metadata = {
  title: "Free Knowledge Check",
  description: "Test yourself on I Am Datapedia! — 50, 100 or 200 questions, free, with a verifiable result.",
};

export const dynamic = "force-dynamic";

export default async function KnowledgeCheckPage() {
  const user = await requireUser("/free-learning/knowledge-check");
  const [bank, attempts] = await Promise.all([bankSize(), listAttemptsForUser(user.id)]);
  const unfinished = attempts.filter((a) => !a.finishedAt);
  const finished = attempts.filter((a) => a.finishedAt);

  return (
    <section className="bg-[var(--color-ground-tint)]">
      <div className="mx-auto max-w-[900px] px-4 py-12 sm:px-6 sm:py-16">
        <Link href="/free-learning" className="text-body-sm mb-2 inline-block py-1 text-[var(--color-primary)] underline underline-offset-4">
          ← Free Training &amp; Certification
        </Link>
        <p className="text-label mb-3 text-[var(--color-primary)]">Give free test and gain certificate</p>
        <h1 className="text-display mb-3" data-testid="kc-title">
          The free Knowledge Check
        </h1>
        <p className="text-body-lg mb-8 max-w-[60ch] text-[var(--color-ink-quiet)]">
          Questions drawn at random from the reviewed topics of <em>I Am Datapedia!</em>. Pass at {KNOWLEDGE_CHECK_PASS_PERCENT} % and your result gets a
          unique ID anyone can verify. No time limit; retake as often as you like.
        </p>

        <Card variant="panel" className="mb-8 p-5 sm:p-8">
          <h2 className="text-h1 mb-2">Choose a size</h2>
          <p className="text-body-sm mb-5 text-[var(--color-ink-quiet)]" data-testid="kc-bank">
            {bank} reviewed {bank === 1 ? "question is" : "questions are"} in the bank today.
          </p>
          <StartForm sizes={KNOWLEDGE_CHECK_SIZES.map((size) => ({ size, available: bank >= size }))} />
        </Card>

        {unfinished.length > 0 ? (
          <Card variant="plate" className="mb-8 p-5 sm:p-6" data-testid="kc-unfinished">
            <h2 className="text-h2 mb-2">Unfinished</h2>
            <ul className="flex flex-col gap-2">
              {unfinished.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 text-body-sm">
                  <span>
                    {a.size} questions · started {formatTimestamp(a.startedAt)} · {Object.keys(a.answers).length} answered
                  </span>
                  <Button variant="secondary" href={`/free-learning/knowledge-check/${a.id}`}>
                    Continue
                  </Button>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}

        <Card variant="panel" className="p-5 sm:p-6" data-testid="kc-history">
          <h2 className="text-h2 mb-2">Your results</h2>
          {finished.length === 0 ? (
            <p className="text-body-sm text-[var(--color-ink-quiet)]">No finished check yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {finished.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 text-body-sm" data-testid="kc-result-row">
                  <span className="flex flex-wrap items-center gap-2">
                    <Chip tone={a.passed ? "primary" : "neutral"}>{a.passed ? "Passed" : "Not passed"}</Chip>
                    {a.score} of {a.size} · {formatTimestamp(a.finishedAt!)} ·{" "}
                    <Link href={`/verify/${a.publicId}`} className="text-mono text-[var(--color-primary)] underline underline-offset-4">
                      {a.publicId}
                    </Link>
                  </span>
                  <Link href={`/free-learning/knowledge-check/${a.id}/result`} className="text-[var(--color-primary)] underline underline-offset-4">
                    Result
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <p className="text-body-sm mt-6 max-w-[70ch] text-[var(--color-ink-faint)]">
          A Knowledge Check result is not the Academy&rsquo;s credential. The Certificate of Completion is earned by attending an expert-led training.
        </p>
      </div>
    </section>
  );
}
