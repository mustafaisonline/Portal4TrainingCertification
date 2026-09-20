"use client";

import { SampleTag } from "@/components/account/SampleTag";
import { SignInGate } from "@/components/account/SignInGate";
import { WireframeNote } from "@/components/auth/FormParts";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PROGRAMME_TITLE, describeRegistration } from "@/data/demoParticipant";
import { useDemoRegistrations } from "@/lib/demoRegistrations";
import { useDemoSession } from "@/lib/demoSession";

/**
 * The SIMULATED payment confirmation — 2026-09-20, founder direction. Shows
 * the most recent demo registration (lib/demoRegistrations.ts). A prominent
 * banner states no payment was taken; every invented value is tagged Sample.
 * In the real product this screen is reached after Stripe redirects back, and
 * it must reflect the server's record of the webhook-confirmed payment — it
 * must never trust the redirect alone.
 */
export function ConfirmationView() {
  const session = useDemoSession();
  const regs = useDemoRegistrations();

  if (session === "unknown" || regs === null) {
    return <div className="min-h-[60vh] bg-[var(--color-ground-tint)]" aria-hidden="true" />;
  }
  if (session === "out") {
    return <SignInGate title="You are not signed in" body="Sign in to see your registration." />;
  }

  const reg = regs[regs.length - 1];
  const d = reg ? describeRegistration(reg) : undefined;

  if (!reg || !d) {
    return (
      <section className="bg-[var(--color-ground-tint)]">
        <div className="mx-auto max-w-[480px] px-4 py-20 text-center sm:px-6">
          <Card variant="panel" className="p-6 sm:p-8">
            <h1 className="text-h1 mb-3">Nothing to confirm</h1>
            <p className="text-body-sm mb-6 text-[var(--color-ink-quiet)]">
              You have no registration in this demo session yet.
            </p>
            <Button href="/account/programme">View the programme</Button>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-[var(--color-ground-tint)]">
      <div className="mx-auto max-w-[640px] px-4 py-12 sm:px-6 sm:py-16">
        <div className="text-body-sm mb-8 rounded-[var(--radius-plate)] border border-[var(--color-accent-line)] bg-[var(--color-accent-soft)] px-4 py-3 text-[var(--color-accent-ink)]">
          <strong className="font-semibold">Demo — no payment was taken.</strong>{" "}
          This confirmation is simulated to show what a participant would see.
        </div>

        <div className="mb-8 text-center">
          <span
            aria-hidden="true"
            className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-[var(--color-ground-raised)] text-[var(--color-success)]"
          >
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none">
              <path d="M5 12.5 10 17.5 19 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <h1 className="text-display mb-2">You are registered</h1>
          <p className="text-body-sm text-[var(--color-ink-quiet)]">
            Thank you. A confirmation email would be sent to you now.
          </p>
        </div>

        <Card variant="panel" className="mb-6 p-6 sm:p-8">
          <p className="text-label mb-2 text-[var(--color-primary)]">
            {d.course?.level} · {d.offering?.formatName}
          </p>
          <h2 className="text-h1 mb-1">{PROGRAMME_TITLE}</h2>
          <p className="text-body-sm mb-5 text-[var(--color-ink-quiet)]">
            {d.offering?.dates}
            <SampleTag />
          </p>
          <dl className="text-body-sm grid gap-x-8 gap-y-4 border-t border-[var(--color-line)] pt-5 sm:grid-cols-2">
            <div>
              <dt className="text-label mb-1">Order</dt>
              <dd className="text-mono">
                {reg.orderId}
                <SampleTag />
              </dd>
            </div>
            <div>
              <dt className="text-label mb-1">Date</dt>
              <dd>{reg.placedOn}</dd>
            </div>
            <div>
              <dt className="text-label mb-1">Paid</dt>
              <dd>
                {d.price?.today} · {d.currency.name}
              </dd>
            </div>
            <div>
              <dt className="text-label mb-1">Method</dt>
              <dd>{d.method.label}</dd>
            </div>
          </dl>
          <p className="text-body-sm mt-5 text-[var(--color-ink-faint)]">
            Receipt: available once payments are connected.
          </p>
        </Card>

        <Card variant="panel" className="mb-8 p-6 sm:p-8">
          <h2 className="text-h1 mb-3">What happens next</h2>
          <ol className="text-body-sm flex list-decimal flex-col gap-2 pl-5 text-[var(--color-ink-quiet)]">
            <li>The joining information is emailed to you before your first session.</li>
            <li>Your materials and schedule appear under My registrations.</li>
            <li>Attend the live sessions with the trainer.</li>
          </ol>
        </Card>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button href={`/account/programmes/${reg.offeringId}`}>View my registration</Button>
          <Button variant="secondary" href="/account">
            Go to dashboard
          </Button>
        </div>
        <WireframeNote>
          Sample data — no order exists and nothing was sent to Stripe or by
          email.
        </WireframeNote>
      </div>
    </section>
  );
}
