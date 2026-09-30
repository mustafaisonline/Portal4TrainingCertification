import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { formatMoney } from "@/modules/catalogue/programmes/types";
import { CopyLinkButton } from "@/modules/certificates/components/CopyLinkButton";
import { appBaseUrl } from "@/modules/commerce/checkout.service";
import { PAYMENTS_NOT_CONFIGURED_MESSAGE } from "@/modules/commerce/messages";
import { paymentsConfigured } from "@/modules/commerce/stripe";
import { findUnlockOrderForUser, unlockStatusForAttempt } from "@/modules/commerce/unlock.service";
import { ASSESSMENT_GRADE_BANDS, gradeOfResult, passMarkPercent, percentOf } from "@/modules/free-learning/assessment-rules";
import { findResultByPublicId, getAttemptForUser } from "@/modules/free-learning/knowledge-check.repository";
import { requireUser } from "@/modules/identity/session";
import { REVIEW_BODY_MIN } from "@/modules/reviews/constants";
import { UnlockForm } from "./UnlockForm";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";
import { formatCalendarDate } from "@/modules/certificates/dates";
import { Certificate } from "@/shared/certificate/Certificate";
import { sampleCertificate } from "@/shared/certificate/sample";
import { formatTimeTaken } from "@/shared/certificate/format";
import { formatTimestamp } from "@/shared/util/dates";

/*
 * /free-learning/knowledge-check/[attemptId]/result — the outcome
 * (Milestone 14 Phase 4): score, pass at 60 % (the Free Assessment Check's
 * mark since 2026-09-30; a result of an earlier size keeps its 70 %) with its
 * GRADE — Charlie / Bravo / Alpha, derived from the score, a 200-question
 * result only — the public ID (copyable) and its verification link. A PASS also has a printable Certificate of
 * Achievement (Milestone 15 Requirement 3; DR-05), shown once a review of Free
 * Learning and the US$10 unlock (Pakistan exempt) are done — Phase 5's gate,
 * unchanged. A revoked one is not shown at all. Time taken and the validity
 * date are derived from the stored attempt.
 */
export const metadata: Metadata = { title: "Free Assessment Check result", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function ResultPage({ params, searchParams }: { params: Promise<{ attemptId: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { attemptId } = await params;
  const sp = await searchParams;
  const user = await requireUser(`/free-learning/knowledge-check/${attemptId}/result`);
  const attempt = await getAttemptForUser(attemptId, user.id);
  if (!attempt) notFound();
  if (!attempt.finishedAt || attempt.score === null || !attempt.publicId) redirect(`/free-learning/knowledge-check/${attempt.id}`);
  const percent = percentOf(attempt.score, attempt.size); // rounded DOWN, so it always agrees with the grade band
  const passMark = passMarkPercent(attempt.size);
  const grade = gradeOfResult({ score: attempt.score, size: attempt.size, passed: attempt.passed });
  const now = new Date();
  const orderParam = typeof sp["order"] === "string" ? sp["order"] : null;
  const [gate, order, view] = await Promise.all([
    unlockStatusForAttempt(attempt, now),
    orderParam ? findUnlockOrderForUser(orderParam, user.id, now) : Promise.resolve(null),
    findResultByPublicId(attempt.publicId, undefined, now),
  ]);
  const revoked = view?.status === "revoked";
  // The `?order=` return from Stripe: server truth, never the redirect.
  const orderBanner = orderParam ? (
    !order ? (
      <p className="text-body-sm mt-6 text-[var(--color-ink-quiet)]" role="status" data-testid="unlock-order-missing">
        We could not find that payment. If you have just paid, the document unlocks once Stripe confirms it — refresh in a moment.
      </p>
    ) : order.effectiveStatus === "pending" ? (
      <>
        <meta httpEquiv="refresh" content="3" />
        <p className="text-body-sm mt-6 text-[var(--color-ink-quiet)]" role="status" data-testid="unlock-order-pending">
          Payment received? We are confirming with Stripe — this page refreshes.
        </p>
      </>
    ) : order.effectiveStatus === "paid" ? (
      <p className="text-body-sm mt-6 text-[var(--color-success)]" role="status" data-testid="unlock-order-paid">
        Payment confirmed — {formatMoney(order.amountMinor, order.currency)}.{order.receiptUrl ? " Your Stripe receipt is in Orders & receipts." : ""}
      </p>
    ) : (
      <p className="text-body-sm mt-6 text-[var(--color-ink-quiet)]" role="status" data-testid="unlock-order-not-paid">
        That payment was not completed. Nothing was charged; you can try again below.
      </p>
    )
  ) : sp["cancelled"] === "1" ? (
    <p className="text-body-sm mt-6 text-[var(--color-ink-quiet)]" role="status" data-testid="unlock-cancelled">
      The payment was cancelled. Nothing was charged.
    </p>
  ) : null;
  let base = "";
  try {
    base = appBaseUrl();
  } catch {
    // local only
  }
  const verifyHref = `${base}/verify/${attempt.publicId}`;
  // Until the gate is met the person sees a SAMPLE of the certificate — never their own
  // (no name, score, time, ID or QR of the real one), so nothing can be lifted from this page.
  const showSample = attempt.passed && !revoked && !gate.unlocked;
  const sample = showSample ? await sampleCertificate("achievement", { baseUrl: base || undefined, grade: grade ?? undefined }) : null;

  return (
    <section className="bg-[var(--color-ground-tint)]">
      <div className="mx-auto max-w-[760px] px-4 py-12 sm:px-6 sm:py-16">
        <Link href="/free-certifications" className="text-body-sm mb-2 inline-block py-1 text-[var(--color-primary)] underline underline-offset-4">
          ← Free Assessment Check
        </Link>
        <p className="text-label mb-3 text-[var(--color-primary)]">Your result</p>
        <h1 className="text-display mb-4" data-testid="result-title">
          {attempt.passed ? "Passed" : "Not passed"} — {attempt.score} of {attempt.size} ({percent} %)
        </h1>
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <Chip tone={attempt.passed ? "primary" : "neutral"}>{attempt.passed ? `Pass mark ${passMark} % reached` : `Below the ${passMark} % pass mark`}</Chip>
          {grade ? (
            <span data-testid="result-grade" data-grade={grade}>
              <Chip tone="primary">
                Grade {ASSESSMENT_GRADE_BANDS[grade].name} · {ASSESSMENT_GRADE_BANDS[grade].band}
              </Chip>
            </span>
          ) : null}
        </div>

        <Card variant="panel" className="p-5 sm:p-6">
          <dl className="text-body-sm grid gap-x-8 gap-y-3 sm:grid-cols-2">
            <div>
              <dt className="text-label mb-1">Name on the result</dt>
              <dd data-testid="result-holder">{attempt.holderName}</dd>
            </div>
            <div>
              <dt className="text-label mb-1">Finished</dt>
              <dd>{formatTimestamp(attempt.finishedAt)}</dd>
            </div>
            <div>
              <dt className="text-label mb-1">Time taken</dt>
              <dd data-testid="result-time-taken">{formatTimeTaken(view?.timeTakenMs ?? attempt.finishedAt.getTime() - attempt.startedAt.getTime())}</dd>
            </div>
            {view?.expiresOn ? (
              <div>
                <dt className="text-label mb-1">{view.status === "expired" ? "Certificate expired on" : "Certificate valid until"}</dt>
                <dd data-testid="result-valid-until">{formatCalendarDate(view.expiresOn)}</dd>
              </div>
            ) : null}
            <div className="sm:col-span-2">
              <dt className="text-label mb-1">Free Assessment Check ID</dt>
              <dd className="text-mono break-all">
                <Link href={`/verify/${attempt.publicId}`} className="text-[var(--color-primary)] underline underline-offset-4" data-testid="result-public-id">
                  {attempt.publicId}
                </Link>
              </dd>
            </div>
          </dl>
          <div className="mt-5 flex flex-col gap-3">
            <CopyLinkButton href={attempt.publicId} label="Copy Assessment Check ID" testId="copy-kc-id" literal />
            <CopyLinkButton href={verifyHref} label="Copy verification link" testId="copy-kc-link" />
          </div>
        </Card>

        {/* Phase 5: the result DOCUMENT behind two conditions — a review of
            Free Learning, and the unlock fee (paid, or exempt for Pakistan).
            UX review 2026-09-27 U5: offered after a pass only; a fail keeps its
            ID and verify page and is invited to retake. */}
        {orderBanner}
        {attempt.passed && revoked ? (
          <Card variant="plate" className="mt-6 p-5 sm:p-6" data-testid="result-document">
            <p className="text-label mb-1 text-[var(--color-primary)]">Certificate of Achievement</p>
            <p className="text-body-sm text-[var(--color-ink-quiet)]" data-testid="result-revoked">
              This certificate was revoked and is no longer valid, so it cannot be shown or printed. Your ID&rsquo;s verification page says so. You can retake the Free Assessment Check as often as you like.
            </p>
          </Card>
        ) : attempt.passed ? (
        <Card variant="plate" className="mt-6 p-5 sm:p-6" data-testid="result-document">
          <p className="text-label mb-1 text-[var(--color-primary)]">Certificate of Achievement</p>
          {gate.unlocked ? (
            <>
              <p className="text-body-sm mb-4 text-[var(--color-ink-quiet)]" data-testid="result-document-unlocked">
                Your printable Certificate of Achievement is ready{gate.fee === "exempt" ? " — no fee applies to you" : ""}.
              </p>
              <Button href={`/free-learning/knowledge-check/${attempt.id}/document`} data-testid="result-document-link">
                View and print the certificate
              </Button>
            </>
          ) : (
            <div className="flex flex-col gap-4">
              <p className="text-body-sm text-[var(--color-ink-quiet)]">The certificate is shown once both of these are done. Your ID and its verification page are already yours.</p>
              <ol className="text-body-sm flex list-decimal flex-col gap-3 pl-5">
                <li data-testid="result-gate-review" data-satisfied={gate.reviewSatisfied ? "yes" : "no"}>
                  {gate.reviewSatisfied ? (
                    <span className="text-[var(--color-success)]">Your review of Free Learning — done.</span>
                  ) : (
                    <>
                      A review of Free Learning ({REVIEW_BODY_MIN} characters or more).{" "}
                      <Link href="/reviews#free-learning" className="text-[var(--color-primary)] underline underline-offset-4" data-testid="result-gate-review-link">
                        Write it on the Reviews page
                      </Link>
                      .
                    </>
                  )}
                </li>
                <li data-testid="result-gate-fee" data-fee={gate.fee}>
                  {gate.fee === "paid" ? (
                    <span className="text-[var(--color-success)]">The one-time unlock — paid.</span>
                  ) : gate.fee === "exempt" ? (
                    <span className="text-[var(--color-success)]">The one-time unlock — no fee applies to participants in Pakistan.</span>
                  ) : gate.fee === "unavailable" ? (
                    "The one-time unlock is not available at the moment."
                  ) : (
                    <>
                      A one-time unlock of {formatMoney(gate.amountMinor ?? 0, gate.currency ?? "USD")}.
                      {gate.pendingOrderId ? " A payment you started is still open in Stripe; finish it there, or try again when its hold expires." : ""}
                    </>
                  )}
                </li>
              </ol>
              {sample ? (
                <div className="flex flex-col gap-2" data-testid="result-sample">
                  <p className="text-label text-[var(--color-primary)]">What your certificate will look like</p>
                  <p className="text-body-sm text-[var(--color-ink-quiet)]">
                    This is a <strong>sample</strong> with a made-up name. Your own Certificate of Achievement carries your name, score, time and ID once both steps above are done.
                  </p>
                  <div className="overflow-x-auto">
                    <div className="min-w-[640px]">
                      <Certificate {...sample} />
                    </div>
                  </div>
                </div>
              ) : null}
              {gate.fee === "required" && !gate.pendingOrderId ? (
                <UnlockForm attemptId={attempt.id} payLabel={`Pay ${formatMoney(gate.amountMinor ?? 0, gate.currency ?? "USD")} with Stripe`} notConfiguredMessage={paymentsConfigured() ? null : PAYMENTS_NOT_CONFIGURED_MESSAGE} />
              ) : null}
            </div>
          )}
        </Card>
        ) : (
          <p className="text-body-sm mt-6 max-w-[70ch] text-[var(--color-ink-quiet)]" data-testid="result-retake-hint">
            Your ID and its verification page are yours to keep. The printable Certificate of Achievement is offered once you pass — there is no limit on retakes.
          </p>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="/free-certifications">{attempt.passed ? "Take another check" : "Retake the Free Assessment Check"}</Button>
          <Button variant="secondary" href="/free-learning/topics">
            Back to the topics
          </Button>
        </div>
        <p className="text-body-sm mt-6 max-w-[70ch] text-[var(--color-ink-faint)]">
          A Free Assessment Check result is not the Academy&rsquo;s credential. The Certificate of Completion is earned by attending an expert-led training.
        </p>
      </div>
    </section>
  );
}
