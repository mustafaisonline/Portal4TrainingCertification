import type { Metadata } from "next";
import Link from "next/link";
import {
  BlockedConsent,
  Field,
  InertForm,
  WireframeNote,
} from "@/components/auth/FormParts";
import { PublicShell } from "@/components/PublicShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getCourse } from "@/data/courses";

/**
 * Checkout / payment — WIREFRAME, added 2026-09-20 by founder direction
 * ("Payment page: I have my company's Stripe account, we will attach
 * that"; "No backend implementation yet").
 *
 * This reverses nothing but does sit against a recorded position:
 * docs/SITE_PAGES.md ("Payments — Stripe") says a payment flow in a mockup
 * would be a simulated success state and was therefore not built. The
 * founder's explicit instruction now asks for the SCREEN. So this draws the
 * layout and stops there: the pay button is genuinely disabled, there is no
 * success/"payment received" state anywhere, and nothing is sent to Stripe.
 *
 * WHAT IS DELIBERATELY NOT HERE
 * - No card-number / expiry / CVC inputs. When Stripe is attached, card
 *   details are entered in Stripe's own hosted fields (the Payment Element)
 *   and never touch this portal's form or servers. Drawing our own card
 *   fields would design the one thing that must not exist, and would invite
 *   real card numbers to be typed into a page that does nothing with them.
 *   The dashed slot below marks where the Element will mount.
 * - No Stripe.js, no publishable/secret key, no new dependency. Attaching the
 *   account is a backend task (ADR-014): orders/candidacy records that are
 *   authoritative, signature-verified idempotent webhooks, entitlement never
 *   derived from the provider. Live keys belong in the deployment
 *   environment, never in the repository.
 * - No payment-method list (cards? FPX? wallets?): which methods are offered
 *   depends on the Stripe account configuration and the still-open Malaysian
 *   rail decision (ADR-014). No tax/SST line: invoicing entity and tax
 *   treatment are open (OQ-9). No accepted-consent checkbox: the Terms and
 *   Refund & cancellation policy are unwritten (OQ-2/OQ-9).
 *
 * THE LINE ITEM is real data — a genuine programme at its published
 * Malaysia launch price from data/courses.ts — but WHICH programme is not
 * wired: there is no cart. It is the summary's shape being shown. HO-10
 * (whether individual online payment is offered at all) is still open, so
 * this screen is a proposal, not a commitment.
 */

export const metadata: Metadata = {
  title: "Checkout — Data & AI Academy",
  description: "Review your registration and pay.",
};

const SAMPLE_SLUG = "data-blueprint";

function Step({ n, title }: { n: number; title: string }) {
  return (
    <h2 className="text-h1 mb-5 flex items-center gap-3">
      <span
        aria-hidden="true"
        className="text-mono grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[var(--color-primary)] text-[0.8rem] text-[var(--color-primary)]"
      >
        {n}
      </span>
      {title}
    </h2>
  );
}

export default function CheckoutPage() {
  const course = getCourse(SAMPLE_SLUG);
  const price = course?.pricing?.malaysia;

  return (
    <PublicShell>
      <section className="bg-[var(--color-ground-tint)]">
        <div className="mx-auto max-w-[1080px] px-4 py-12 sm:px-6 sm:py-16">
          <p className="text-label mb-3 text-[var(--color-primary)]">
            Checkout
          </p>
          <h1 className="text-display mb-3">Review and pay</h1>
          <p className="text-body-sm mb-10 max-w-[60ch] text-[var(--color-ink-quiet)]">
            Check your registration, add your details and pay. Payments will
            be processed by Stripe.
          </p>

          <div className="grid gap-8 lg:grid-cols-[1.35fr_1fr] lg:items-start">
            <InertForm
              aria-label="Checkout"
              aria-describedby="checkout-status"
              className="flex flex-col gap-6"
            >
              {/* 1 — Details */}
              <Card variant="panel" className="p-6 sm:p-8">
                <Step n={1} title="Your details" />
                <div className="flex flex-col gap-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field
                      label="Full name"
                      name="name"
                      autoComplete="name"
                    />
                    <Field
                      label="Email"
                      type="email"
                      name="email"
                      autoComplete="email"
                      inputMode="email"
                      hint="Your receipt is sent here."
                    />
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field
                      label="Organisation"
                      name="organisation"
                      autoComplete="organization"
                      optional
                    />
                    <Field
                      label="Country"
                      name="country"
                      autoComplete="country-name"
                    />
                  </div>
                </div>
                <p className="text-body-sm mt-5 text-[var(--color-ink-faint)]">
                  Already have an account?{" "}
                  <Link
                    href="/sign-in"
                    className="text-[var(--color-primary)] underline underline-offset-4 hover:text-[var(--color-primary-strong)]"
                  >
                    Sign in
                  </Link>{" "}
                  to fill these in.
                </p>
              </Card>

              {/* 2 — Payment. The dashed slot is where Stripe's Payment
                  Element mounts; see this file's header comment. */}
              <Card variant="panel" className="p-6 sm:p-8">
                <Step n={2} title="Payment" />
                <div
                  role="img"
                  aria-label="Placeholder: Stripe's secure payment fields will appear here"
                  className="grid min-h-[190px] place-items-center rounded-[var(--radius-plate)] border-2 border-dashed border-[var(--color-line-strong)] bg-[var(--color-ground)] px-6 py-8 text-center"
                >
                  <div className="max-w-[40ch]">
                    <p className="text-label mb-2 text-[var(--color-ink-quiet)]">
                      Stripe payment fields
                    </p>
                    <p className="text-body-sm text-[var(--color-ink-faint)]">
                      Stripe&rsquo;s own secure payment fields mount here once
                      the account is attached. Card details are typed into
                      Stripe&rsquo;s fields — never into this page.
                    </p>
                  </div>
                </div>
                <p className="text-body-sm mt-4 text-[var(--color-ink-faint)]">
                  Which payment methods are offered is set by the Academy&rsquo;s
                  Stripe account and is not yet decided.
                </p>
              </Card>

              {/* 3 — Confirm */}
              <Card variant="panel" className="p-6 sm:p-8">
                <Step n={3} title="Confirm" />
                <div className="flex flex-col gap-6">
                  <BlockedConsent reason="Cannot be ticked yet — the Terms of service and the refund & cancellation policy have not been published.">
                    I agree to the Terms of service and the refund &amp;
                    cancellation policy.
                  </BlockedConsent>
                  <Button type="submit" disabled className="w-full">
                    Pay {price?.today ?? "now"}
                  </Button>
                  <div id="checkout-status">
                    <WireframeNote>
                      Not connected yet — no payment is taken, no order is
                      created, and nothing typed is sent or stored. There is
                      no backend and Stripe is not attached.
                    </WireframeNote>
                  </div>
                </div>
              </Card>
            </InertForm>

            {/* Order summary */}
            <aside aria-label="Order summary" className="lg:sticky lg:top-24">
              <Card variant="feature" className="p-6 sm:p-8">
                <h2 className="text-h1 mb-5">Order summary</h2>
                {course && price ? (
                  <>
                    <div className="border-b border-[var(--color-line)] pb-5">
                      <p className="text-label mb-2 text-[var(--color-primary)]">
                        {course.level} · {course.duration}
                      </p>
                      <p className="text-body-lg font-medium">{course.title}</p>
                      <p className="text-body-sm mt-1 text-[var(--color-ink-quiet)]">
                        {course.certificate}
                      </p>
                    </div>
                    <dl className="text-body-sm flex flex-col gap-3 py-5">
                      <div className="flex justify-between gap-4">
                        <dt className="text-[var(--color-ink-quiet)]">
                          Published price
                        </dt>
                        <dd className="text-mono text-[var(--color-ink-faint)] line-through">
                          {price.original}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-[var(--color-ink-quiet)]">
                          Launch offer ({price.discount})
                        </dt>
                        <dd className="text-mono">− {price.save}</dd>
                      </div>
                    </dl>
                    <div className="flex items-baseline justify-between gap-4 border-t border-[var(--color-line)] pt-5">
                      <span className="font-medium">Total today</span>
                      <span className="text-display text-[var(--color-primary)]">
                        {price.today}
                      </span>
                    </div>
                    <p className="text-body-sm mt-4 text-[var(--color-ink-faint)]">
                      Malaysia launch offer as published on the course page;
                      time-limited. Tax and invoicing are not yet decided, so
                      none is shown.
                    </p>
                  </>
                ) : null}
                <div className="mt-6">
                  <WireframeNote>
                    Sample line item — a real programme at its real published
                    price, but choosing a programme is not wired up yet.
                  </WireframeNote>
                </div>
                <p className="text-body-sm mt-5 text-[var(--color-ink-quiet)]">
                  Buying for a team or claiming through HRD Corp?{" "}
                  <Link
                    href="/contact-us"
                    className="text-[var(--color-primary)] underline underline-offset-4 hover:text-[var(--color-primary-strong)]"
                  >
                    Talk to us first
                  </Link>
                  .
                </p>
              </Card>
            </aside>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
