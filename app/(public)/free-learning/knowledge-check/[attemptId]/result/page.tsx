import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { formatMoney } from "@/modules/catalogue/programmes/types";
import { CopyLinkButton } from "@/modules/certificates/components/CopyLinkButton";
import { appBaseUrl } from "@/modules/commerce/checkout.service";
import { PAYMENTS_NOT_CONFIGURED_MESSAGE } from "@/modules/commerce/messages";
import { paymentsConfigured } from "@/modules/commerce/stripe";
import { findUnlockOrderForUser, unlockStatusForAttempt } from "@/modules/commerce/unlock.service";
import { getAttemptForUser, KNOWLEDGE_CHECK_PASS_PERCENT } from "@/modules/free-learning/knowledge-check.repository";
import { requireUser } from "@/modules/identity/session";
import { REVIEW_BODY_MIN } from "@/modules/reviews/constants";
import { UnlockForm } from "./UnlockForm";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";
import { formatTimestamp } from "@/shared/util/dates";

/*
 * /free-learning/knowledge-check/[attemptId]/result — the outcome
 * (Milestone 14 Phase 4): score, pass at 70 %, the public ID (copyable) and
 * its verification link. The printable result DOCUMENT and its gate (a
 * review of Free Learning plus the US$10 unlock, Pakistan exempt) are
 * Phase 5 — said plainly here, not pretended.
 */
export const metadata: Metadata = { title: "Knowledge Check result", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function ResultPage({ params, searchParams }: { params: Promise<{ attemptId: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { attemptId } = await params;
  const sp = await searchParams;
  const user = await requireUser(`/free-learning/knowledge-check/${attemptId}/result`);
  const attempt = await getAttemptForUser(attemptId, user.id);
  if (!attempt) notFound();
  if (!attempt.finishedAt || attempt.score === null || !attempt.publicId) redirect(`/free-learning/knowledge-check/${attempt.id}`);
  const percent = Math.round((attempt.score * 100) / attempt.size);
  const now = new Date();
  const orderParam = typeof sp["order"] === "string" ? sp["order"] : null;
  const [gate, order] = await Promise.all([unlockStatusForAttempt(attempt, now), orderParam ? findUnlockOrderForUser(orderParam, user.id, now) : Promise.resolve(null)]);
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

  return (
    <section className="bg-[var(--color-ground-tint)]">
      <div className="mx-auto max-w-[760px] px-4 py-12 sm:px-6 sm:py-16">
        <Link href="/free-learning/knowledge-check" className="text-body-sm mb-2 inline-block py-1 text-[var(--color-primary)] underline underline-offset-4">
          ← Knowledge Check
        </Link>
        <p className="text-label mb-3 text-[var(--color-primary)]">Your result</p>
        <h1 className="text-display mb-4" data-testid="result-title">
          {attempt.passed ? "Passed" : "Not passed"} — {attempt.score} of {attempt.size} ({percent} %)
        </h1>
        <div className="mb-6">
          <Chip tone={attempt.passed ? "primary" : "neutral"}>{attempt.passed ? `Pass mark ${KNOWLEDGE_CHECK_PASS_PERCENT} % reached` : `Below the ${KNOWLEDGE_CHECK_PASS_PERCENT} % pass mark`}</Chip>
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
            <div className="sm:col-span-2">
              <dt className="text-label mb-1">Knowledge Check ID</dt>
              <dd className="text-mono break-all">
                <Link href={`/verify/${attempt.publicId}`} className="text-[var(--color-primary)] underline underline-offset-4" data-testid="result-public-id">
                  {attempt.publicId}
                </Link>
              </dd>
            </div>
          </dl>
          <div className="mt-5 flex flex-col gap-3">
            <CopyLinkButton href={attempt.publicId} label="Copy Knowledge Check ID" testId="copy-kc-id" literal />
            <CopyLinkButton href={verifyHref} label="Copy verification link" testId="copy-kc-link" />
          </div>
        </Card>

        {/* Phase 5: the result DOCUMENT behind two conditions — a review of
            Free Learning, and the unlock fee (paid, or exempt for Pakistan). */}
        {orderBanner}
        <Card variant="plate" className="mt-6 p-5 sm:p-6" data-testid="result-document">
          <p className="text-label mb-1 text-[var(--color-primary)]">Result document</p>
          {gate.unlocked ? (
            <>
              <p className="text-body-sm mb-4 text-[var(--color-ink-quiet)]" data-testid="result-document-unlocked">
                Your printable result document is ready{gate.fee === "exempt" ? " — no fee applies to you" : ""}.
              </p>
              <Button href={`/free-learning/knowledge-check/${attempt.id}/document`} data-testid="result-document-link">
                View and print the document
              </Button>
            </>
          ) : (
            <div className="flex flex-col gap-4">
              <p className="text-body-sm text-[var(--color-ink-quiet)]">The document is shown once both of these are done. Your ID and its verification page are already yours.</p>
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
              {gate.fee === "required" && !gate.pendingOrderId ? (
                <UnlockForm attemptId={attempt.id} payLabel={`Pay ${formatMoney(gate.amountMinor ?? 0, gate.currency ?? "USD")} with Stripe`} notConfiguredMessage={paymentsConfigured() ? null : PAYMENTS_NOT_CONFIGURED_MESSAGE} />
              ) : null}
            </div>
          )}
        </Card>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="/free-learning/knowledge-check">Take another check</Button>
          <Button variant="secondary" href="/free-learning/topics">
            Back to the topics
          </Button>
        </div>
        <p className="text-body-sm mt-6 max-w-[70ch] text-[var(--color-ink-faint)]">
          A Knowledge Check result is not the Academy&rsquo;s credential. The Certificate of Completion is earned by attending an expert-led training.
        </p>
      </div>
    </section>
  );
}
