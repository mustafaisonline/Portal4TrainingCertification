import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getRoleAttemptForUser, roleResultView, settleExpiredRoleAttempts } from "@/modules/assessment/attempts.repository";
import { percentOf } from "@/modules/assessment/rules";
import { roleBasePath, roleResultPath, roleTestPath, scopeOfAttempt, type RoleTestScope } from "@/modules/assessment/role-test-scope";
import { requireUser } from "@/modules/identity/session";
import { formatTimeTaken } from "@/shared/certificate/format";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";
import { formatTimestamp } from "@/shared/util/dates";
import { RoleStartForm } from "./RoleStartForm";

const LETTERS = ["A", "B", "C", "D", "E"];

/*
 * The result — ONE screen for Prepare for Interview and for an organisation's
 * screening test (CR-2026-10-01-1711): the score, the percentage and the time
 * taken; the score for each topic; then EVERY question with the person's answer,
 * the correct option and the MODEL ANSWER, readable in full. A practice result
 * has no pass mark and no certificate. Only the attempt's owner can open it; an
 * unfinished attempt goes back to its test, so no answer can leak from a running
 * one.
 */
export async function RoleResultScreen({ scope, attemptId }: { scope: RoleTestScope; attemptId: string }) {
  const user = await requireUser(roleResultPath(scope, attemptId));
  await settleExpiredRoleAttempts(user.id); // a test whose time is up is scored as it stands the moment it is read
  const attempt = await getRoleAttemptForUser(attemptId, user.id);
  if (!attempt) notFound();
  const owner = await scopeOfAttempt(attempt);
  if (!owner || owner.roleSlug !== scope.roleSlug || owner.orgSlug !== scope.orgSlug) notFound();
  if (!attempt.finishedAt || attempt.score === null) redirect(roleTestPath(scope, attempt.id));
  const view = await roleResultView(attempt);
  const base = roleBasePath(scope);

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
          <dl className="text-body-sm grid gap-x-8 gap-y-3 sm:grid-cols-3">
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
            <div>
              <dt className="text-label mb-1">Time taken</dt>
              <dd data-testid="result-time-taken">{formatTimeTaken(view.timeTakenMs)}</dd>
            </div>
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

        <h2 className="text-h1 mb-1 mt-10">Every question, with its model answer</h2>
        <p className="text-body-sm mb-4 max-w-[66ch] text-[var(--color-ink-quiet)]">
          Read the model answer to each question — it is the way a strong candidate would answer it in an interview — whether or not you got it right.
        </p>
        <ol className="flex list-none flex-col gap-4 p-0" data-testid="result-questions">
          {view.questions.map((q) => (
            <li key={q.number}>
              <Card variant="panel" className="p-5" data-testid="result-question" data-outcome={q.chosen === null ? "unanswered" : q.correct ? "correct" : "wrong"}>
                <p className="text-label mb-1 text-[var(--color-ink-faint)]">{q.category}</p>
                <p className="text-body-lg mb-3 font-medium">
                  <span className="text-[var(--color-ink-faint)]">{q.number}.</span> {q.stem}
                </p>
                <p className="text-body-sm mb-3 font-medium" data-testid="result-outcome">
                  {q.chosen === null ? (
                    <span className="text-[var(--color-ink-quiet)]">Not answered</span>
                  ) : q.correct ? (
                    <span className="text-[var(--color-success)]">Correct</span>
                  ) : (
                    <span className="text-[var(--color-danger)]">Not correct</span>
                  )}
                </p>
                <ul className="flex list-none flex-col gap-2 p-0">
                  {q.options.map((o, i) => (
                    <li
                      key={o.position}
                      className={`text-body-sm rounded-[var(--radius-plate)] border px-3 py-2 ${o.isCorrect ? "border-[var(--color-success)]" : o.position === q.chosen ? "border-[var(--color-danger)]" : "border-[var(--color-line)]"}`}
                      data-testid="result-option"
                      data-correct={o.isCorrect ? "yes" : "no"}
                      data-chosen={o.position === q.chosen ? "yes" : "no"}
                    >
                      <span className="text-[var(--color-ink-faint)]">{LETTERS[i]}.</span> {o.text}
                      {o.isCorrect ? <span className="ml-2 font-medium text-[var(--color-success)]">— Correct answer</span> : null}
                      {o.position === q.chosen ? <span className="ml-2 font-medium text-[var(--color-ink)]">— Your answer</span> : null}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 rounded-[var(--radius-plate)] border border-[var(--color-line)] bg-[var(--color-ground-tint)] p-4" data-testid="result-model-answer">
                  <p className="text-label mb-2 text-[var(--color-ink-quiet)]">Model answer</p>
                  <p className="text-body-sm whitespace-pre-line">{q.modelAnswer}</p>
                </div>
              </Card>
            </li>
          ))}
        </ol>

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
