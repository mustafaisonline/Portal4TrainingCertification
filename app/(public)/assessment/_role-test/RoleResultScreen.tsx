import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getRoleAttemptForUser, roleResultView, settleExpiredRoleAttempts } from "@/modules/assessment/attempts.repository";
import { QUESTIONS_PER_PAGE } from "@/modules/assessment/constants";
import { percentOf } from "@/modules/assessment/rules";
import { roleBasePath, roleResultPath, roleTestPath, scopeOfAttempt, type RoleTestScope } from "@/modules/assessment/role-test-scope";
import { requireUser } from "@/modules/identity/session";
import { formatTimeTaken } from "@/shared/certificate/format";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";
import { formatTimestamp } from "@/shared/util/dates";
import { ResultPager } from "./ResultPager";
import { ResultQuestionCard } from "./ResultQuestionCard";
import { RoleStartForm } from "./RoleStartForm";

/*
 * The result — ONE screen for Prepare for Interview and for an organisation's
 * screening test (CR-2026-10-01-1711): the score, the percentage and the time
 * taken; the score for each topic; then EVERY question with the person's answer,
 * the correct option and the MODEL ANSWER, readable in full, ten a page. A practice result
 * has no pass mark and no certificate. Only the attempt's owner can open it; an
 * unfinished attempt goes back to its test, so no answer can leak from a running
 * one.
 */
export async function RoleResultScreen({ scope, attemptId, pageParam }: { scope: RoleTestScope; attemptId: string; pageParam?: string | undefined }) {
  const user = await requireUser(roleResultPath(scope, attemptId));
  await settleExpiredRoleAttempts(user.id); // a test whose time is up is scored as it stands the moment it is read
  const attempt = await getRoleAttemptForUser(attemptId, user.id);
  if (!attempt) notFound();
  const owner = await scopeOfAttempt(attempt);
  if (!owner || owner.roleSlug !== scope.roleSlug || owner.orgSlug !== scope.orgSlug) notFound();
  if (!attempt.finishedAt || attempt.score === null) redirect(roleTestPath(scope, attempt.id));
  const view = await roleResultView(attempt);
  const base = roleBasePath(scope);
  // The questions are listed ten a page (CR-2026-10-03-2251); the score and the topic breakdown above always cover the whole test.
  const pages = Math.max(1, Math.ceil(view.questions.length / QUESTIONS_PER_PAGE));
  const current = Math.min(Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1), pages);
  const shown = view.questions.slice((current - 1) * QUESTIONS_PER_PAGE, current * QUESTIONS_PER_PAGE);
  const pager = { page: current, pages, from: shown.length > 0 ? (current - 1) * QUESTIONS_PER_PAGE + 1 : 0, to: (current - 1) * QUESTIONS_PER_PAGE + shown.length, total: view.questions.length };
  const resultBase = roleResultPath(scope, attempt.id);

  return (
    <section className="bg-[var(--color-ground-tint)]">
      <div className="mx-auto max-w-[860px] px-4 py-12 sm:px-6 sm:py-16">
        <Link href={base} className="text-body-sm mb-2 inline-block py-1 text-[var(--color-primary)] underline underline-offset-4">
          ← {owner.roleName}
        </Link>
        <p className="text-label mb-3 text-[var(--color-primary)]">
          Your result{owner.organisationName ? ` · ${owner.organisationName}` : ""} · {owner.roleName}
        </p>
        <h1 className="text-display mb-4" data-testid="result-title">
          {view.score} of {view.size} ({view.percent} %)
        </h1>
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <Chip>{owner.organisationName ? `Shared with ${owner.organisationName}` : "Practice result — no pass mark, no certificate"}</Chip>
        </div>

        <Card variant="panel" className="p-5 sm:p-6">
          <dl className={`text-body-sm grid gap-x-8 gap-y-3 ${view.timeTakenMs !== null ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
            <div>
              <dt className="text-label mb-1">Score</dt>
              <dd data-testid="result-score">
                {view.score} of {view.size}
              </dd>
            </div>
            <div>
              <dt className="text-label mb-1">Finished</dt>
              <dd>{formatTimestamp(attempt.finishedAt)}</dd>
            </div>
            {view.timeTakenMs !== null ? (
              <div>
                <dt className="text-label mb-1">Time taken</dt>
                <dd data-testid="result-time-taken">{formatTimeTaken(view.timeTakenMs)}</dd>
              </div>
            ) : null}
          </dl>
        </Card>

        <h2 className="text-h1 mb-3 mt-10">Score by topic</h2>
        <Card variant="panel" className="p-0" data-testid="result-breakdown">
          <div className="overflow-x-auto">
            <table className="text-body-sm w-full border-collapse text-left">
              <caption className="sr-only">Correct answers for each topic</caption>
              <thead>
                <tr className="border-b border-[var(--color-line)]">
                  <th scope="col" className="text-label px-4 py-3">
                    Topic
                  </th>
                  <th scope="col" className="text-label px-4 py-3">
                    Correct
                  </th>
                  <th scope="col" className="text-label px-4 py-3">
                    Share
                  </th>
                </tr>
              </thead>
              <tbody>
                {view.breakdown.map((b) => (
                  <tr key={b.category} className="border-b border-[var(--color-line)] last:border-b-0" data-testid="result-breakdown-row" data-category={b.category}>
                    <th scope="row" className="px-4 py-3 font-medium">
                      {b.category}
                    </th>
                    <td className="px-4 py-3">
                      {b.correct} of {b.total}
                    </td>
                    <td className="px-4 py-3">{percentOf(b.correct, b.total)} %</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <h2 id="result-questions-heading" className="text-h1 mb-1 mt-10 scroll-mt-24">Every question, with its model answer</h2>
        <p className="text-body-sm mb-4 max-w-[66ch] text-[var(--color-ink-quiet)]">
          Read the model answer to each question — it is the way a strong candidate would answer it in an interview — whether or not you got it right.
        </p>
        <ResultPager pager={pager} base={resultBase} position="top" />
        <ol className="flex list-none flex-col gap-4 p-0" data-testid="result-questions">
          {shown.map((q) => (
            <li key={q.number}>
              <ResultQuestionCard q={q} />
            </li>
          ))}
        </ol>
        <ResultPager pager={pager} base={resultBase} position="bottom" />

        <div className="mt-8 flex flex-wrap items-start gap-3">
          {owner.orgSlug === null ? (
            <RoleStartForm roleId={attempt.roleId} label="Take it again" />
          ) : (
            <Button href={base} data-testid="result-retake">
              Take it again
            </Button>
          )}
          <Button variant="secondary" href={base} data-testid="result-back">
            Back to the role
          </Button>
        </div>
      </div>
    </section>
  );
}
