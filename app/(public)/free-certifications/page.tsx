import type { Metadata } from "next";
import Link from "next/link";
import { ASSESSMENT_GRADE_BANDS, ASSESSMENT_PASS_PERCENT, ASSESSMENT_SIZE, ASSESSMENT_TIME_LIMIT_MS, attemptDeadline, gradeOfResult } from "@/modules/free-learning/assessment-rules";
import { bankSize, listAttemptsForUser, settleExpiredAttempts } from "@/modules/free-learning/knowledge-check.repository";
import { getCurrentUser } from "@/modules/identity/session";
import { plusCount } from "@/shared/marketing/plus-count";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { formatTimestamp } from "@/shared/util/dates";
import { ResultsList } from "./ResultsList";
import { StartForm } from "./StartForm";

/*
 * /free-certifications — Free Certifications (split from /free-trainings on
 * the founder's instruction, 2026-09-28; the name is permitted by DR-04: a
 * product-line label, never a claim that any one result is a certificate).
 * The page hosts "The Free Assessment Check" — the free test formerly called
 * the Knowledge Check (founder, 2026-09-30): ONE test of 200 questions drawn
 * fresh from the whole reviewed bank, 3 hours (enforced by the server), a
 * 60 % pass mark and a graded certificate — Charlie, Bravo or Alpha. There is
 * no size choice and no "unfinished" list: a signed-in person sees a start
 * button (or a way back into the test that is running) and "Your results".
 * A signed-out visitor sees the pitch and a sign-in button (the check itself
 * stays account-holders-only, DR-03). /free-learning/knowledge-check redirects
 * here; the running test (/free-learning/knowledge-check/[attemptId]) is the
 * attempt page. A result is never called "a certificate" on DR-04's authority
 * for the page name alone — the certificate wording is DR-05's.
 */
export const metadata: Metadata = {
  title: "Free Certifications",
  description: `Take the Free Assessment Check — ${ASSESSMENT_SIZE} questions in 3 hours, a ${ASSESSMENT_PASS_PERCENT}% pass mark, and a graded, verifiable certificate: Charlie, Bravo or Alpha.`,
};

export const dynamic = "force-dynamic";

const HOURS = ASSESSMENT_TIME_LIMIT_MS / 3_600_000;

export default async function FreeCertificationsPage() {
  const user = await getCurrentUser();
  // Lazy expiry: a test whose 3 hours are up is scored as it stands the moment it is read here.
  if (user) await settleExpiredAttempts(user.id);
  const [bank, attempts] = await Promise.all([bankSize(), user ? listAttemptsForUser(user.id) : Promise.resolve([])]);
  const running = attempts.find((a) => !a.finishedAt) ?? null;
  const finished = attempts.filter((a) => a.finishedAt);
  const bankFigure = plusCount(bank, 100);

  return (
    <>
      <section className="night hero-band relative overflow-hidden">
        <div className="relative mx-auto max-w-[1280px] px-6 py-14 lg:py-16">
          <p className="text-label mb-4 text-[var(--color-primary)]">Free Certifications</p>
          <h1 className="text-display-lg mb-4 max-w-[820px]" data-testid="free-certifications-title">
            Take the Free Assessment Check. Earn a graded certificate.
          </h1>
          <p className="text-body-lg max-w-[640px] text-[var(--color-ink-quiet)]" data-testid="free-certifications-lead">
            A {ASSESSMENT_SIZE}-question, {HOURS}-hour assessment drawn from a bank of {bankFigure ? `${bankFigure} ` : ""}questions — different every time. Score{" "}
            {ASSESSMENT_PASS_PERCENT} % or more and earn a certificate: Charlie, Bravo or Alpha. The attempt is free.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[900px] px-4 py-12 sm:px-6 sm:py-16">
        <h2 className="text-display mb-3" data-testid="kc-title">
          The Free Assessment Check
        </h2>
        <p className="text-body-lg mb-4 max-w-[60ch] text-[var(--color-ink-quiet)]" data-testid="free-test">
          {ASSESSMENT_SIZE} questions drawn at random from the reviewed topics of <em>I Am Datapedia!</em> — a fresh set for every person and every attempt. You have{" "}
          {HOURS} hours from the moment you start; the portal keeps the time, and when it is up your test is scored as it stands. Retake as often as you like.
        </p>
        <ul className="text-body-sm mb-8 flex max-w-[60ch] flex-col gap-1 text-[var(--color-ink-quiet)]" data-testid="kc-grades">
          {(["alpha", "bravo", "charlie"] as const).map((g) => (
            <li key={g}>
              <strong className="text-[var(--color-ink)]">{ASSESSMENT_GRADE_BANDS[g].name}</strong> — {ASSESSMENT_GRADE_BANDS[g].band}
            </li>
          ))}
        </ul>

        {user ? (
          <>
            <Card variant="panel" className="mb-8 p-5 sm:p-8">
              <h3 className="text-h1 mb-2">{running ? "Your test is running" : "Start the Free Assessment Check"}</h3>
              <p className="text-body-sm mb-5 text-[var(--color-ink-quiet)]" data-testid="kc-bank">
                {bank} reviewed {bank === 1 ? "question is" : "questions are"} in the bank today.
              </p>
              {running ? (
                <p className="text-body-sm mb-5 text-[var(--color-ink-quiet)]" data-testid="kc-running">
                  You started a test on {formatTimestamp(running.startedAt)}. It ends at {formatTimestamp(attemptDeadline(running.startedAt))}; your answers are kept as you go.
                </p>
              ) : null}
              <StartForm available={running !== null || bank >= ASSESSMENT_SIZE} running={running !== null} />
            </Card>

            <Card variant="panel" className="p-5 sm:p-6" data-testid="kc-history">
              <h3 className="text-h2 mb-2">Your results</h3>
              {/* Founder, 2026-09-28: full stats per result, and the person
                  may delete their own entries (checkbox → Delete selected →
                  confirmation). A result whose document unlock was ordered
                  is a commercial record and is refused server-side. */}
              <ResultsList
                rows={finished.map((a) => {
                  const answered = Object.keys(a.answers).length;
                  const correct = a.score ?? 0;
                  return {
                    id: a.id,
                    passed: a.passed === true,
                    gradeName: (() => {
                      const g = gradeOfResult({ score: a.score, size: a.size, passed: a.passed });
                      return g ? ASSESSMENT_GRADE_BANDS[g].name : null;
                    })(),
                    size: a.size,
                    answered,
                    correct,
                    wrong: answered - correct,
                    unanswered: a.size - answered,
                    publicId: a.publicId ?? "",
                    finishedAtLabel: formatTimestamp(a.finishedAt!),
                  };
                })}
              />
            </Card>
          </>
        ) : (
          <Card variant="panel" className="p-5 sm:p-8" data-testid="kc-signed-out">
            <p className="text-body-sm mb-5 text-[var(--color-ink-quiet)]" data-testid="kc-bank">
              {bank} reviewed {bank === 1 ? "question is" : "questions are"} in the bank today. The Free Assessment Check is for account
              holders — sign in (or create a free account) to start.
            </p>
            <Button href="/sign-in?return-to=%2Ffree-certifications" data-testid="start-knowledge-check">
              Sign in to start the Free Assessment Check
            </Button>
          </Card>
        )}

        <p className="text-body-sm mt-6 max-w-[70ch] text-[var(--color-ink-faint)]">
          A Free Assessment Check certificate is not the Academy&rsquo;s Certificate of Completion, which is earned by attending an
          expert-led training —{" "}
          <Link href="/programs" className="underline underline-offset-4">
            see the trainings
          </Link>
          .
        </p>
      </section>
    </>
  );
}
