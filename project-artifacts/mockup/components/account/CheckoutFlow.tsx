"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CardFieldsPicture, Choice } from "@/components/account/PaymentParts";
import { SampleTag } from "@/components/account/SampleTag";
import { SignInGate } from "@/components/account/SignInGate";
import {
  BlockedConsent,
  Field,
  InertForm,
  WireframeNote,
} from "@/components/auth/FormParts";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { RegionKey } from "@/data/courses";
import {
  PROGRAMME_TITLE,
  currencyChoices,
  demoParticipant,
  getCurrencyChoice,
  getDeliveryFormat,
  getFlagship,
  getRegionMeta,
  offerings,
  paymentMethods,
  type PaymentMethodKey,
} from "@/data/demoParticipant";
import { addDemoRegistration, useDemoRegistrations } from "@/lib/demoRegistrations";
import { useDemoSession } from "@/lib/demoSession";

/**
 * Checkout / registration — WIREFRAME with a SIMULATED payment, 2026-09-20,
 * REWORKED later the same day on founder direction:
 *   • one programme (the flagship), the participant picks a start date;
 *   • prices in ALL published currencies, the participant picks one;
 *   • ALL payment options kept (card + online banking + e-wallet);
 *   • Pay simulates a confirmed payment INSIDE THE DEMO SESSION ONLY.
 *
 * ⚠ WHAT "PAY" DOES: appends a record to sessionStorage
 * (lib/demoRegistrations.ts) and shows a confirmation. It charges nothing,
 * contacts no one, creates no order. This reverses this project's earlier
 * "no simulated payment success" rule, at the founder's explicit request, and
 * is confined to the demo session — a signed-out visitor sees only a sign-in
 * gate and cannot reach Pay. In the real product the browser NEVER creates a
 * registration: the server does, only after a signature-verified Stripe
 * webhook confirms payment.
 *
 * STILL DELIBERATELY NOT HERE
 * - No card-number / expiry / CVC <input>s. Card details are typed into
 *   Stripe's own hosted fields, never this page's. The card panel is a
 *   non-interactive PICTURE of where those fields will appear, so the flow is
 *   reviewable without inviting real card numbers into a page that does
 *   nothing with them.
 * - No Stripe.js, keys or dependency (ADR-014; RED gate). No tax line (OQ-9).
 * - The consent tick stays disabled — Terms and the refund & cancellation
 *   policy are unwritten (OQ-2/OQ-9, docs/SITE_PAGES.md). In the real
 *   product Pay stays disabled until it is ticked; the demo does not gate on
 *   it, and says so.
 * - The payment-method list is generic and provisional: the real list
 *   depends on the Stripe account configuration and the open Malaysian rail
 *   (ADR-014). Which methods work in which currency is likewise undecided.
 */

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

export function CheckoutFlow() {
  const session = useDemoSession();
  const regs = useDemoRegistrations();
  const router = useRouter();
  const course = getFlagship();

  const [offeringId, setOfferingId] = useState<string>(offerings[0].id);
  const [currency, setCurrency] = useState<RegionKey>("malaysia");
  const [method, setMethod] = useState<PaymentMethodKey>("card");
  const [paying, setPaying] = useState(false);

  if (session === "unknown" || regs === null) {
    return <div className="min-h-[60vh] bg-[var(--color-ground-tint)]" aria-hidden="true" />;
  }
  if (session === "out") {
    return (
      <SignInGate
        title="Sign in to register"
        body="You need an account to register for the programme. Sign in and you will come straight back here. This wireframe has a demo account — its details are pre-filled on the sign-in page."
        returnTo="/checkout"
      />
    );
  }
  if (!course?.pricing) return null;

  const offering = offerings.find((o) => o.id === offeringId) ?? offerings[0];
  const format = getDeliveryFormat(offering);
  const price = course.pricing[currency];
  const already = regs.some((r) => r.offeringId === offering.id);

  function pay() {
    setPaying(true);
    // Short pause so the simulated step reads as a step. Nothing is sent.
    window.setTimeout(() => {
      addDemoRegistration({ offeringId: offering.id, currency, method });
      router.push("/checkout/confirmation");
    }, 900);
  }

  return (
    <section className="bg-[var(--color-ground-tint)]">
      <div className="mx-auto max-w-[1080px] px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-label mb-3 text-[var(--color-primary)]">Register</p>
        <h1 className="text-display mb-3">Register and pay</h1>
        <p className="text-body-sm mb-10 max-w-[60ch] text-[var(--color-ink-quiet)]">
          Choose your start date, your currency and how you would like to pay.
          Payments will be processed by Stripe.
        </p>

        <div className="grid gap-8 lg:grid-cols-[1.35fr_1fr] lg:items-start">
          <InertForm
            aria-label="Registration checkout"
            aria-describedby="checkout-status"
            className="flex flex-col gap-6"
          >
            <Card variant="panel" className="p-6 sm:p-8">
              <Step n={1} title="Choose your start date" />
              <div role="radiogroup" aria-label="Start date" className="flex flex-col gap-3">
                {offerings.map((o) => {
                  const f = getDeliveryFormat(o);
                  return (
                    <Choice
                      key={o.id}
                      name="offering"
                      value={o.id}
                      checked={offeringId === o.id}
                      onChange={() => setOfferingId(o.id)}
                    >
                      <span className="text-body-sm block font-medium">
                        {o.formatName} · {o.dates}
                        <SampleTag />
                      </span>
                      {f && (
                        <span className="text-body-sm block text-[var(--color-ink-quiet)]">
                          {f.duration} · {f.schedule} · {f.totalTime}
                        </span>
                      )}
                    </Choice>
                  );
                })}
              </div>
            </Card>

            <Card variant="panel" className="p-6 sm:p-8">
              <Step n={2} title="Choose your currency" />
              <div role="radiogroup" aria-label="Currency" className="grid gap-3 sm:grid-cols-3">
                {currencyChoices.map((c) => {
                  const p = course.pricing?.[c.key];
                  return (
                    <Choice
                      key={c.key}
                      name="currency"
                      value={c.key}
                      checked={currency === c.key}
                      onChange={() => setCurrency(c.key)}
                    >
                      <span className="text-label block">{c.name}</span>
                      <span className="text-h1 block text-[var(--color-primary)]">{p?.today}</span>
                      <span className="text-body-sm block text-[var(--color-ink-faint)]">
                        {getRegionMeta(c.key).subtitle}
                      </span>
                    </Choice>
                  );
                })}
              </div>
            </Card>

            <Card variant="panel" className="p-6 sm:p-8">
              <Step n={3} title="Your details" />
              <div className="flex flex-col gap-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Full name" name="name" defaultValue={demoParticipant.name} autoComplete="name" />
                  <Field
                    label="Email"
                    type="email"
                    name="email"
                    defaultValue={demoParticipant.email}
                    autoComplete="email"
                    inputMode="email"
                    hint="Your receipt is sent here."
                  />
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Organisation" name="organisation" autoComplete="organization" optional />
                  <Field label="Country" name="country" defaultValue={demoParticipant.country} autoComplete="country-name" />
                </div>
              </div>
            </Card>

            <Card variant="panel" className="p-6 sm:p-8">
              <Step n={4} title="Payment method" />
              <div role="radiogroup" aria-label="Payment method" className="flex flex-col gap-3">
                {paymentMethods.map((m) => (
                  <Choice
                    key={m.key}
                    name="method"
                    value={m.key}
                    checked={method === m.key}
                    onChange={() => setMethod(m.key)}
                  >
                    <span className="text-body-sm block font-medium">{m.label}</span>
                    <span className="text-body-sm block text-[var(--color-ink-quiet)]">{m.note}</span>
                  </Choice>
                ))}
              </div>
              <div className="mt-5">
                {method === "card" ? (
                  <CardFieldsPicture />
                ) : (
                  <p
                    role="note"
                    className="text-body-sm rounded-[var(--radius-plate)] border border-dashed border-[var(--color-line-strong)] px-4 py-4 text-[var(--color-ink-faint)]"
                  >
                    Illustration — you would be taken to a secure page to
                    complete this payment, then returned here.
                  </p>
                )}
              </div>
              <p className="text-body-sm mt-4 text-[var(--color-ink-faint)]">
                The methods offered are set by the Academy&rsquo;s Stripe
                account and are not yet final.
              </p>
            </Card>

            <Card variant="panel" className="p-6 sm:p-8">
              <Step n={5} title="Confirm" />
              <div className="flex flex-col gap-6">
                <BlockedConsent reason="Cannot be ticked yet — the Terms of service and the refund & cancellation policy have not been published. (In the real product, Pay stays disabled until this is ticked.)">
                  I agree to the Terms of service and the refund &amp;
                  cancellation policy.
                </BlockedConsent>
                {already && (
                  <p role="status" className="text-body-sm text-[var(--color-ink-quiet)]">
                    You are already registered for this start date.{" "}
                    <Link
                      href="/account/programmes"
                      className="text-[var(--color-primary)] underline underline-offset-4"
                    >
                      View my registration
                    </Link>
                  </p>
                )}
                <Button
                  type="button"
                  className="w-full"
                  disabled={paying || already}
                  onClick={pay}
                >
                  {paying ? "Processing (demo)…" : `Pay ${price.today} (demo)`}
                </Button>
                <div id="checkout-status">
                  <WireframeNote>
                    Demo only — no payment will be taken and Stripe is not
                    attached. Paying shows a simulated confirmation and adds a
                    sample registration to this demo session.
                  </WireframeNote>
                </div>
              </div>
            </Card>
          </InertForm>

          <aside aria-label="Order summary" className="lg:sticky lg:top-24">
            <Card variant="feature" className="p-5! sm:p-8!">
              <h2 className="text-h1 mb-5">Order summary</h2>
              <div className="border-b border-[var(--color-line)] pb-5">
                <p className="text-label mb-2 text-[var(--color-primary)]">
                  {course.level} · {offering.formatName}
                </p>
                <p className="text-body-lg font-medium">{PROGRAMME_TITLE}</p>
                <p className="text-body-sm mt-1 text-[var(--color-ink-quiet)]">
                  {offering.dates}
                  <SampleTag />
                </p>
                {format && (
                  <p className="text-body-sm text-[var(--color-ink-quiet)]">
                    {format.duration} · {format.totalTime}
                  </p>
                )}
              </div>
              <dl className="text-body-sm flex flex-col gap-3 py-5">
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--color-ink-quiet)]">Published price</dt>
                  <dd className="text-mono text-[var(--color-ink-faint)] line-through">{price.original}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--color-ink-quiet)]">
                    {getRegionMeta(currency).discountLabel} ({price.discount})
                  </dt>
                  <dd className="text-mono">− {price.save}</dd>
                </div>
              </dl>
              <div className="flex items-baseline justify-between gap-4 border-t border-[var(--color-line)] pt-5">
                <span className="font-medium">Total today</span>
                <span className="text-display text-[var(--color-primary)]">{price.today}</span>
              </div>
              <p className="text-body-sm mt-4 text-[var(--color-ink-faint)]">
                {getCurrencyChoice(currency).name}. Launch offer as published;
                time-limited. Tax and invoicing are not yet decided, so none
                is shown.
              </p>
              <p className="text-body-sm mt-5 text-[var(--color-ink-quiet)]">
                Buying for a team or claiming through HRD Corp?{" "}
                <Link
                  href="/contact-us"
                  className="text-[var(--color-primary)] underline underline-offset-4"
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
  );
}
