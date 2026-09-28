import type { Metadata } from "next";
import Link from "next/link";
import { bankSize, KNOWLEDGE_CHECK_PASS_PERCENT, KNOWLEDGE_CHECK_SIZES, listAttemptsForUser } from "@/modules/free-learning/knowledge-check.repository";
import { getCurrentUser } from "@/modules/identity/session";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";
import { formatTimestamp } from "@/shared/util/dates";
import { ResultsList } from "./ResultsList";
import { StartForm } from "./StartForm";

/*
 * /free-certifications — Free Certifications (split from /free-trainings on
 * the founder's instruction, 2026-09-28; the name is permitted by DR-04: a
 * product-line label, never a claim that any one result is a certificate).
 * One page since later the same day ("New more change": "merge
 * /free-learning/knowledge-check into /free-certifications, no need for two
 * pages"): the Knowledge Check's own start screen — bank size, the
 * 50/100/200 buttons, unfinished checks and past results — now lives here,
 * shown to a signed-in visitor; a signed-out visitor sees the pitch and a
 * sign-in button (the check itself stays account-holders-only, DR-03).
 * /free-learning/knowledge-check redirects here; the running check
 * (/free-learning/knowledge-check/[attemptId]) is unchanged. Every
 * "Knowledge Check result" (never "certificate") wording is unchanged by
 * DR-04 and stays.
 */
export const metadata: Metadata = {
  title: "Free Certifications",
  description: "Take the free Knowledge Check — 50, 100 or 200 questions, a 70% pass mark, and a verifiable result ID.",
};

export const dynamic = "force-dynamic";

export default async function FreeCertificationsPage() {
  const user = await getCurrentUser();
  const [bank, attempts] = await Promise.all([bankSize(), user ? listAttemptsForUser(user.id) : Promise.resolve([])]);
  const unfinished = attempts.filter((a) => !a.finishedAt);
  const finished = attempts.filter((a) => a.finishedAt);

  return (
    <>
      <section className="night hero-band relative overflow-hidden">
        <div className="relative mx-auto max-w-[1280px] px-6 py-14 lg:py-16">
          <p className="text-label mb-4 text-[var(--color-primary)]">Free Certifications</p>
          <h1 className="text-display-lg mb-4 max-w-[820px]" data-testid="free-certifications-title">
            Test yourself. Prove it. Free.
          </h1>
          <p className="text-body-lg max-w-[640px] text-[var(--color-ink-quiet)]">
            A free Knowledge Check for account holders — drawn from the Knowledge Hub topics, scored, and given a result anyone can
            verify.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[900px] px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-label mb-3 text-[var(--color-primary)]">Give free test and gain certification</p>
        <h2 className="text-display mb-3" data-testid="kc-title">
          The free Knowledge Check
        </h2>
        <p className="text-body-lg mb-8 max-w-[60ch] text-[var(--color-ink-quiet)]" data-testid="free-test">
          Choose 50, 100 or 200 questions drawn at random from the reviewed topics of <em>I Am Datapedia!</em>. Pass at{" "}
          {KNOWLEDGE_CHECK_PASS_PERCENT} % and your result gets a unique ID anyone can verify. No time limit; retake as often as you
          like.
        </p>

        {user ? (
          <>
            <Card variant="panel" className="mb-8 p-5 sm:p-8">
              <h3 className="text-h1 mb-2">Choose a size</h3>
              <p className="text-body-sm mb-5 text-[var(--color-ink-quiet)]" data-testid="kc-bank">
                {bank} reviewed {bank === 1 ? "question is" : "questions are"} in the bank today.
              </p>
              <StartForm sizes={KNOWLEDGE_CHECK_SIZES.map((size) => ({ size, available: bank >= size }))} />
            </Card>

            {unfinished.length > 0 ? (
              <Card variant="plate" className="mb-8 p-5 sm:p-6" data-testid="kc-unfinished">
                <h3 className="text-h2 mb-2">Unfinished</h3>
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
              {bank} reviewed {bank === 1 ? "question is" : "questions are"} in the bank today. The Knowledge Check is for account
              holders — sign in (or create a free account) to start.
            </p>
            <Button href="/sign-in?return-to=%2Ffree-certifications" data-testid="start-knowledge-check">
              Sign in to start the Knowledge Check
            </Button>
          </Card>
        )}

        <p className="text-body-sm mt-6 max-w-[70ch] text-[var(--color-ink-faint)]">
          A Knowledge Check result is not the Academy&rsquo;s credential. The Certificate of Completion is earned by attending an
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
