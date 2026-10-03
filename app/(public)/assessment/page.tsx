import type { Metadata } from "next";
import Link from "next/link";
import { ORG_QUESTION_CAP, ROLE_TEST_SIZE } from "@/modules/assessment/constants";
import { listPublishedSharedRoles } from "@/modules/assessment/roles.repository";
import { ASSESSMENT_GRADE_BANDS, ASSESSMENT_PASS_PERCENT, ASSESSMENT_SIZE, ASSESSMENT_TIME_LIMIT_MS, attemptDeadline, gradeOfResult } from "@/modules/free-learning/assessment-rules";
import { bankSize, listAttemptsForUser, settleExpiredAttempts } from "@/modules/free-learning/knowledge-check.repository";
import { getCurrentUser } from "@/modules/identity/session";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { formatTimestamp } from "@/shared/util/dates";
import { ResultsList } from "./ResultsList";
import { StartForm } from "./StartForm";

/*
 * /assessment — **Assessment** (RENAMED 2026-10-01 from "Free Certifications" at
 * /free-certifications, founder, CR-2026-10-01-1711 / DR-07; the old address
 * redirects). The page is a gateway with THREE personas, all live — Assess your
 * Data Foundation (the Free Assessment Check below), Prepare for Interview
 * (/assessment/interview) and Organisations — Interview Screening
 * (/assessment/organisations). It was split from /free-trainings on the founder's instruction,
 * 2026-09-28 (the earlier name was permitted by DR-04, now superseded by
 * DR-07). The first persona's section hosts "The Free Assessment Check" — the free test formerly called
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
  title: "Assessment",
  description: `Test yourself, prepare for an interview, or screen candidates. Start with the Free Assessment Check — ${ASSESSMENT_SIZE} questions in 3 hours, a ${ASSESSMENT_PASS_PERCENT}% pass mark, and a graded, verifiable certificate: Charlie, Bravo or Alpha.`,
};

export const dynamic = "force-dynamic";

const HOURS = ASSESSMENT_TIME_LIMIT_MS / 3_600_000;

export default async function AssessmentPage() {
  const user = await getCurrentUser();
  // Lazy expiry: a test whose 3 hours are up is scored as it stands the moment it is read here.
  if (user) await settleExpiredAttempts(user.id);
  const [bank, attempts, roles] = await Promise.all([bankSize(), user ? listAttemptsForUser(user.id) : Promise.resolve([]), listPublishedSharedRoles()]);
  const running = attempts.find((a) => !a.finishedAt) ?? null;
  const finished = attempts.filter((a) => a.finishedAt);
  const personas = [
    {
      id: "interview",
      audience: "For job seekers",
      title: "Prepare for Interview",
      body: `Practise for the interview for your role. Pick a role, answer ${ROLE_TEST_SIZE} questions at your own pace, then read a model answer to each — the way a strong candidate would say it. Free, with an account.`,
      facts: [
        ...(roles.length > 0 ? [{ label: "Roles", text: roles.map((r) => r.name).join(" · ") }] : []),
        { label: `${ROLE_TEST_SIZE} questions`, text: "five options each, drawn fresh for every attempt" },
        { label: "No timer", text: "save and exit any time, or cancel and keep nothing" },
        { label: "Model answers", text: "shown beside your own once you finish" },
      ],
      cta: "Prepare for an interview for Free",
      href: "/assessment/interview",
      live: true,
    },
    {
      id: "organisations",
      audience: "For organisations",
      title: "Organisations — Interview Screening",
      body: "For companies and education institutions: screen candidates for the roles you hire, with your own questions built into the test. Candidates take the role's test; you read every result in your Organisation Dashboard.",
      facts: [
        { label: "Your questions", text: `up to ${ORG_QUESTION_CAP} of your own in each test, added after review` },
        { label: "Consent first", text: "a candidate confirms sharing before starting" },
        { label: "Results", text: "score and time taken per candidate, with CSV export" },
      ],
      cta: "See the organisations",
      href: "/assessment/organisations",
      live: true,
    },
  ] as const;

  return (
    <>
      <section className="night hero-band relative overflow-hidden">
        <div className="relative mx-auto max-w-[1280px] px-6 py-14 lg:py-16">
          <p className="text-label mb-4 text-[var(--color-primary)]">Assessment</p>
          <h1 className="text-display-lg mb-4 max-w-[820px]" data-testid="assessment-title">
            Test yourself. Prepare. Screen.
          </h1>
          <p className="text-body-lg max-w-[680px] text-[var(--color-ink-quiet)]" data-testid="assessment-lead">
            Assessments for people building their data and AI skills, people preparing for an interview, and organisations screening candidates — choose the one
            that fits you.
          </p>
        </div>
      </section>

      {/* ===== Exactly THREE cards (founder, 2026-10-01): the check itself, interview prep, organisations ===== */}
      <section className="mx-auto max-w-[1280px] px-6 pb-16 pt-14" aria-labelledby="personas-heading" data-testid="persona-cards">
        <h2 id="personas-heading" className="sr-only">
          Choose an assessment
        </h2>
        <ul className="grid list-none gap-6 p-0 lg:grid-cols-3">
          {/* Card 1 — "Assess your Data Foundation" IS the Free Assessment Check (founder,
              CR-2026-10-01-2246, 2026-10-01 23:12: "there need to [be] 3 cards"): the whole
              check — grades, start / running / sign-in and "Your results" — lives in this
              card; there is no separate section below any more. */}
          <li className="min-w-0" id="data-foundation">
            <Card variant="panel" className="flex h-full flex-col border border-[var(--color-line)] p-6 sm:p-8" data-testid="persona-card-data-foundation" data-live="yes">
              <p className="text-label mb-3 text-[var(--color-primary)]">For learners</p>
              <h3 className="text-h1 mb-3" data-testid="kc-title">
                Assess your Data Foundation
              </h3>
              {/* Founder's wording (23:50 "here is updated text"; 23:58 "match looks and feel …
                  with other 2 cards"): the same short-paragraph + facts-list shape as cards 2
                  and 3, figures and bands from the constants. The "Start …" sub-heading, the
                  bank count and the not-a-credential line were removed on the same instruction. */}
              <p className="text-body-sm mb-4 text-[var(--color-ink-quiet)]" data-testid="free-test">
                The Free Assessment Check — {ASSESSMENT_SIZE} questions in {HOURS} hours, drawn fresh from a bank of thousands of questions. The attempts are free, you can
                retake it as often as you like.
              </p>
              <ul className="text-body-sm mb-6 flex list-none flex-col gap-1 p-0 text-[var(--color-ink-quiet)]" data-testid="kc-grades">
                <li>
                  <strong className="text-[var(--color-ink)]">Score {ASSESSMENT_PASS_PERCENT} % or more</strong> — earn a graded certificate
                </li>
                {(["alpha", "bravo", "charlie"] as const).map((g) => (
                  <li key={g}>
                    <strong className="text-[var(--color-ink)]">{ASSESSMENT_GRADE_BANDS[g].name}</strong> — {ASSESSMENT_GRADE_BANDS[g].band}
                  </li>
                ))}
              </ul>
              {user ? (
                <div className="mt-auto pt-2">
                  {running ? (
                    <p className="text-body-sm mb-4 text-[var(--color-ink-quiet)]" data-testid="kc-running">
                      You started a test on {formatTimestamp(running.startedAt)}. It ends at {formatTimestamp(attemptDeadline(running.startedAt))}; your answers are kept as you go.
                    </p>
                  ) : null}
                  <StartForm available={running !== null || bank >= ASSESSMENT_SIZE} running={running !== null} />
                </div>
              ) : (
                <div className="mt-auto pt-2" data-testid="kc-signed-out">
                  <Button href="/sign-in?return-to=%2Fassessment" data-testid="start-knowledge-check">
                    Sign in to start the Free Assessment Check
                  </Button>
                </div>
              )}
            </Card>
          </li>
          {personas.map((c) => (
            <li key={c.id} className="min-w-0">
              <Card variant="panel" className="flex h-full flex-col border border-[var(--color-line)] p-6 sm:p-8" data-testid={`persona-card-${c.id}`} data-live={c.live ? "yes" : "no"}>
                <p className="text-label mb-3 text-[var(--color-primary)]">{c.audience}</p>
                <h3 className="text-h1 mb-3">{c.title}</h3>
                <p className="text-body-sm mb-4 text-[var(--color-ink-quiet)]">{c.body}</p>
                <ul className="text-body-sm mb-6 flex list-none flex-col gap-1 p-0 text-[var(--color-ink-quiet)]" data-testid={`persona-facts-${c.id}`}>
                  {c.facts.map((f) => (
                    <li key={f.label}>
                      <strong className="text-[var(--color-ink)]">{f.label}</strong> — {f.text}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto">
                  <Button href={c.href} data-testid={`persona-cta-${c.id}`}>
                    {c.cta}
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      {/* ===== Your results — its own section under the cards (founder, 2026-10-01 23:30:
          "bring Result into separate section under this section: For learners") ===== */}
      {user ? (
        <section className="mx-auto max-w-[1280px] px-6 pb-16" aria-labelledby="kc-results-heading">
          <Card variant="panel" className="p-6 sm:p-8" data-testid="kc-history">
            <h2 id="kc-results-heading" className="text-h1 mb-1">
              Your results
            </h2>
            <p className="text-body-sm mb-4 text-[var(--color-ink-quiet)]" data-testid="kc-history-note">
              Your attempts at the Free Assessment Check.
            </p>
            {/* Founder, 2026-09-28: full stats per result, and the person may delete their
                own entries (checkbox → Delete selected → confirmation). A result whose
                document unlock was ordered is a commercial record, refused server-side. */}
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
        </section>
      ) : null}
    </>
  );
}
