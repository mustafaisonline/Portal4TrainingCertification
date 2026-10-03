import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { attemptPage, firstUnansweredPage, getRoleAttemptForUser, settleExpiredRoleAttempts } from "@/modules/assessment/attempts.repository";
import { attemptDeadline } from "@/modules/assessment/rules";
import { roleBasePath, roleResultPath, roleTestPath, scopeOfAttempt, type RoleTestScope } from "@/modules/assessment/role-test-scope";
import { requireUser } from "@/modules/identity/session";
import { CancelTestForm } from "./CancelTestForm";
import { RoleTestForm } from "./RoleTestForm";

/*
 * The running test — ONE screen for Prepare for Interview and for an
 * organisation's screening test (CR-2026-10-01-1711): ten questions a page, the
 * answers saved on every page change, Finish from any page. An organisation's
 * test counts down to the server's 90-minute deadline; interview practice has no
 * time limit and adds Save and exit, Cancel test and per-page results
 * (CR-2026-10-03-2251). The correct options and the model answers never
 * reach this page. Only the attempt's owner can open it (anyone else gets a 404),
 * the address must match the attempt's own role and organisation, and a finished
 * attempt goes to its result. The page settles an expired attempt (scored as it
 * stands) before it reads it.
 */
export async function RoleTestScreen({ scope, attemptId, pageParam }: { scope: RoleTestScope; attemptId: string; pageParam: string | undefined }) {
  const user = await requireUser(roleTestPath(scope, attemptId));
  await settleExpiredRoleAttempts(user.id); // lazy expiry: time up → scored as it stands → the result
  const attempt = await getRoleAttemptForUser(attemptId, user.id);
  if (!attempt) notFound();
  const owner = await scopeOfAttempt(attempt);
  if (!owner || owner.roleSlug !== scope.roleSlug || owner.orgSlug !== scope.orgSlug) notFound();
  if (attempt.finishedAt) redirect(roleResultPath(scope, attempt.id));
  // Interview practice has no time limit (CR-2026-10-03-2251); an organisation's screening test keeps its server-enforced 90 minutes.
  const practice = owner.orgSlug === null;
  // Coming back with no page in the address opens the first page that still has an unanswered question.
  const wanted = pageParam === undefined ? firstUnansweredPage(attempt) : Number.parseInt(pageParam, 10) || 1;
  const page = await attemptPage(attempt, wanted);
  // The server's own remaining time, measured now: the browser counts down from it rather than trusting its own clock.
  const remainingMs = practice ? null : Math.max(0, attemptDeadline(attempt.startedAt).getTime() - Date.now());

  return (
    <section className="bg-[var(--color-ground-tint)]">
      <div className="mx-auto max-w-[860px] px-4 py-12 sm:px-6 sm:py-16">
        <Link href={roleBasePath(scope)} className="text-body-sm mb-2 inline-block py-1 text-[var(--color-primary)] underline underline-offset-4">
          ← {owner.roleName}
        </Link>
        <p className="text-label mb-3 text-[var(--color-primary)]">
          {owner.organisationName ? `${owner.organisationName} · ` : ""}
          {attempt.size}-question test · {owner.roleName}
        </p>
        <h1 className="text-display mb-2" data-testid="attempt-title">
          Questions {page.from}–{page.to} of {attempt.size}
        </h1>
        <p className="text-body-sm mb-6 text-[var(--color-ink-quiet)]" data-testid="attempt-progress">
          Page {page.page} of {page.pages} · {page.answered} of {attempt.size} answered so far. Your answers are saved when you move between pages; finish from any page.{" "}
          {practice ? "There is no time limit: use Save and exit to stop and come back later, or Cancel test to leave without keeping anything." : "When the time is up, the test is scored as it stands."}
        </p>
        <RoleTestForm attemptId={attempt.id} page={page} size={attempt.size} remainingMs={remainingMs} practice={practice} />
        {practice ? <CancelTestForm attemptId={attempt.id} /> : null}
      </div>
    </section>
  );
}
