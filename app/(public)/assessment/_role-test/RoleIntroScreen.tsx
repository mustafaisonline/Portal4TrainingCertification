import Link from "next/link";
import { listRoleAttemptsForUser, runningRoleAttemptForUser, settleExpiredRoleAttempts } from "@/modules/assessment/attempts.repository";
import { ORG_QUESTION_CAP } from "@/modules/assessment/constants";
import { attemptDeadline } from "@/modules/assessment/rules";
import { roleBasePath, roleResultPath, TEST_MINUTES, type RoleTestScope } from "@/modules/assessment/role-test-scope";
import { getCurrentUser } from "@/modules/identity/session";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";
import { formatTimeTaken } from "@/shared/certificate/format";
import { formatTimestamp } from "@/shared/util/dates";
import { RoleResultsList } from "./RoleResultsList";
import { RoleStartForm } from "./RoleStartForm";

/*
 * The role's introduction — ONE screen for Prepare for Interview
 * (/assessment/interview/[roleSlug]) and for an organisation's screening test
 * (/assessment/organisations/[orgSlug]/[roleSlug]); CR-2026-10-01-1711. What to
 * expect, the start button (or a way back into the running test), and the
 * person's own results for THIS role and organisation. A signed-out visitor sees
 * the same introduction and a sign-in button — the test itself is for account
 * holders. An organisation test names the organisation, says its own questions
 * are included, and asks for the acknowledgement that the result is shared.
 */

export async function RoleIntroScreen({
  scope,
  role,
  organisation,
  plannedSize,
  ownQuestionCount,
  sharedQuestionCount,
  isPrivateRole = false,
}: {
  scope: RoleTestScope;
  role: { id: string; name: string; description: string };
  organisation: { id: string; name: string } | null;
  /** How many questions a test would have today. */
  plannedSize: number;
  /** How many of the organisation's own questions every test includes (0 for Prepare for Interview). */
  ownQuestionCount: number;
  /** Reviewed questions in the shared bank behind the test. */
  sharedQuestionCount: number;
  isPrivateRole?: boolean;
}) {
  const user = await getCurrentUser();
  const organisationId = organisation?.id ?? null;
  let running: Awaited<ReturnType<typeof runningRoleAttemptForUser>> = null;
  let finished: Awaited<ReturnType<typeof listRoleAttemptsForUser>> = [];
  if (user) {
    await settleExpiredRoleAttempts(user.id); // lazy expiry: time up → scored as it stands
    running = await runningRoleAttemptForUser(user.id, role.id, organisationId);
    finished = (await listRoleAttemptsForUser(user.id, { roleId: role.id })).filter((a) => a.finishedAt !== null && a.organisationId === organisationId);
  }
  const base = roleBasePath(scope);
  const available = plannedSize > 0;
  const questionWord = plannedSize === 1 ? "question" : "questions";

  return (
    <section className="bg-[var(--color-ground-tint)]">
      <div className="mx-auto max-w-[900px] px-4 py-12 sm:px-6 sm:py-16">
        <Link
          href={organisation ? `/assessment/organisations/${scope.orgSlug}` : "/assessment/interview"}
          className="text-body-sm mb-2 inline-block py-1 text-[var(--color-primary)] underline underline-offset-4"
        >
          ← {organisation ? organisation.name : "Prepare for Interview"}
        </Link>
        <p className="text-label mb-3 text-[var(--color-primary)]">{organisation ? `${organisation.name} · Interview Screening` : "Prepare for Interview"}</p>
        <h1 className="text-display mb-3" data-testid="role-title">
          {role.name}
        </h1>
        {role.description ? <p className="text-body-lg mb-8 max-w-[62ch] text-[var(--color-ink-quiet)]">{role.description}</p> : <div className="mb-8" />}

        <Card variant="panel" className="mb-8 p-5 sm:p-8" data-testid="role-expect">
          <h2 className="text-h1 mb-3">What to expect</h2>
          <ul className="text-body-sm flex max-w-[66ch] list-disc flex-col gap-2 pl-5 text-[var(--color-ink-quiet)]">
            {organisation ? (
              <>
                <li data-testid="role-expect-questions">
                  {available ? `${plannedSize} ${questionWord}` : "No questions yet"}
                  {ownQuestionCount > 0
                    ? `, including ${ownQuestionCount} of ${organisation.name}'s own ${ownQuestionCount === 1 ? "question" : "questions"} (every test includes them${ownQuestionCount >= ORG_QUESTION_CAP ? `, up to ${ORG_QUESTION_CAP}` : ""})`
                    : ""}
                  {sharedQuestionCount > 0 && !isPrivateRole ? (ownQuestionCount > 0 ? `, and questions drawn at random from the shared ${role.name} bank` : ` drawn at random from the shared ${role.name} bank`) : ""}
                  {available ? " — shuffled, and a different draw every time you start." : "."}
                </li>
                <li>
                  This is {organisation.name}&rsquo;s screening test: <strong className="text-[var(--color-ink)]">your result is shared with {organisation.name}</strong>. You are asked to confirm that
                  before you start.
                </li>
              </>
            ) : (
              <li data-testid="role-expect-questions">
                {available ? `${plannedSize} ${questionWord}` : "No questions yet"} drawn at random from the {role.name} question bank — a different set every time you start.
              </li>
            )}
            <li>
              {TEST_MINUTES} minutes. The portal keeps the time; when it is up, your test is scored as it stands.
            </li>
            <li>Ten questions a page, five answers to choose from. Your answers are saved as you move between pages.</li>
            <li>
              At the end you see your score, a breakdown by topic, and every question with the correct answer and a <strong className="text-[var(--color-ink)]">model answer</strong> — written the way a
              strong candidate would answer it in an interview.
            </li>
            <li>{organisation ? "Free, with an account. Not a certificate — there is no pass mark." : "Free, with an account. A practice result, not a certificate — there is no pass mark."}</li>
          </ul>
        </Card>

        {!available ? (
          <Card variant="panel" className="mb-8 p-5 sm:p-8" data-testid="role-unavailable">
            <Chip>Coming soon</Chip>
            <p className="text-body-sm mt-3 text-[var(--color-ink-quiet)]">This test does not have approved questions yet. Please check back soon.</p>
          </Card>
        ) : user ? (
          <Card variant="panel" className="mb-8 p-5 sm:p-8" data-testid="role-start-card">
            <h2 className="text-h1 mb-2">{running ? "Your test is running" : "Start the test"}</h2>
            {running ? (
              <p className="text-body-sm mb-5 text-[var(--color-ink-quiet)]" data-testid="role-running">
                You started a test on {formatTimestamp(running.startedAt)}. It ends at {formatTimestamp(attemptDeadline(running.startedAt))}; your answers are kept as you go.
              </p>
            ) : null}
            <RoleStartForm
              roleId={role.id}
              organisationId={organisationId}
              organisationName={organisation?.name ?? null}
              running={running !== null}
              label={running ? "Return to my running test" : "Start the test"}
            />
          </Card>
        ) : (
          <Card variant="panel" className="mb-8 p-5 sm:p-8" data-testid="role-signed-out">
            <p className="text-body-sm mb-5 text-[var(--color-ink-quiet)]">The test is for account holders — sign in (or create a free account) to start.</p>
            <Button href={`/sign-in?return-to=${encodeURIComponent(base)}`} data-testid="role-signin">
              Sign in to start
            </Button>
          </Card>
        )}

        {user ? (
          <Card variant="panel" className="p-5 sm:p-6" data-testid="role-history">
            <h2 className="text-h2 mb-2">Your results</h2>
            {organisation ? <p className="text-body-sm mb-3 text-[var(--color-ink-quiet)]">These results were shared with {organisation.name}.</p> : null}
            <RoleResultsList
              deletable={organisation === null}
              rows={finished.map((a) => ({
                id: a.id,
                href: roleResultPath(scope, a.id),
                score: a.score ?? 0,
                size: a.size,
                percent: a.percent ?? 0,
                finishedAtLabel: formatTimestamp(a.finishedAt!),
                timeLabel: formatTimeTaken(a.timeTakenMs ?? 0),
              }))}
            />
          </Card>
        ) : null}
      </div>
    </section>
  );
}
