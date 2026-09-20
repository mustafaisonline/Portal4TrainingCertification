"use client";

import { SampleTag } from "@/components/account/SampleTag";
import { WireframeNote } from "@/components/auth/FormParts";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PROGRAMME_TITLE, describeRegistration } from "@/data/demoParticipant";
import { useDemoRegistrations } from "@/lib/demoRegistrations";

/** S07 — Orders & receipts (wireframe, 2026-09-20; reworked the same day).
 *  One row per simulated registration (lib/demoRegistrations.ts): empty until
 *  the participant walks the checkout. Amounts are the real published prices
 *  in the currency they chose; order numbers, dates and "Paid" are sample. No
 *  receipt exists to download — Stripe is not attached. */
export default function OrdersPage() {
  const regs = useDemoRegistrations();
  if (regs === null) return null;
  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-label mb-2 text-[var(--color-primary)]">Orders &amp; receipts</p>
        <h1 className="text-display">Your orders</h1>
      </header>
      {regs.length === 0 ? (
        <Card variant="panel" className="p-6 sm:p-8">
          <h2 className="text-h1 mb-2">No orders yet</h2>
          <p className="text-body-sm mb-5 text-[var(--color-ink-quiet)]">
            Your orders and receipts appear here after you register.
          </p>
          <Button href="/account/programme">View the programme</Button>
        </Card>
      ) : (
        <ul className="flex flex-col gap-4">
          {regs.map((reg) => {
            const d = describeRegistration(reg);
            return (
              <li key={reg.orderId}>
                <Card variant="panel" className="p-5 sm:p-6">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                    <p className="text-body-lg font-medium">
                      {PROGRAMME_TITLE} · {d.offering?.formatName}
                    </p>
                    <p className="text-h1 text-[var(--color-primary)]">{d.price?.today}</p>
                  </div>
                  <dl className="text-body-sm mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-4">
                    <div>
                      <dt className="text-label mb-1">Order</dt>
                      <dd className="text-mono">{reg.orderId}</dd>
                    </div>
                    <div>
                      <dt className="text-label mb-1">Date</dt>
                      <dd>{reg.placedOn}</dd>
                    </div>
                    <div>
                      <dt className="text-label mb-1">Status</dt>
                      <dd>Paid</dd>
                    </div>
                    <div>
                      <dt className="text-label mb-1">Method</dt>
                      <dd>
                        {d.method.label} · {d.currency.code}
                      </dd>
                    </div>
                  </dl>
                  <p className="text-body-sm mt-4 text-[var(--color-ink-faint)]">
                    Receipt: available once payments are connected.
                    <SampleTag />
                  </p>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
      <WireframeNote>
        Amounts are the published launch prices in the currency chosen; order
        numbers, dates and payment status are sample. No payment was taken and
        no receipt exists.
      </WireframeNote>
    </div>
  );
}
