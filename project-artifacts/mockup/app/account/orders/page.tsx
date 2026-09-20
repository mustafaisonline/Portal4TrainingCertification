import { SampleTag } from "@/components/account/SampleTag";
import { WireframeNote } from "@/components/auth/FormParts";
import { Card } from "@/components/ui/Card";
import { orders, withCourse, getRegistration } from "@/data/demoParticipant";

/** S07 — Orders & receipts (wireframe, 2026-09-20). The place the
 *  /checkout wireframe leads to. Amounts are the real published Malaysia
 *  launch prices (data/courses.ts); order numbers, dates and "Paid" are
 *  sample. No receipt exists to download — Stripe is not attached. */
export default function OrdersPage() {
  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-label mb-2 text-[var(--color-primary)]">Orders &amp; receipts</p>
        <h1 className="text-display">Your orders</h1>
      </header>
      <ul className="flex flex-col gap-4">
        {orders.map((o) => {
          const reg = getRegistration(o.registrationId);
          const { course, price } = reg ? withCourse(reg) : { course: undefined, price: undefined };
          return (
            <li key={o.id}>
              <Card variant="panel" className="p-5 sm:p-6">
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                  <p className="text-body-lg font-medium">{course?.title}</p>
                  <p className="text-h1 text-[var(--color-primary)]">{price?.today}</p>
                </div>
                <dl className="text-body-sm mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-4">
                  <div>
                    <dt className="text-label mb-1">Order</dt>
                    <dd className="text-mono">{o.id}</dd>
                  </div>
                  <div>
                    <dt className="text-label mb-1">Date</dt>
                    <dd>{o.date}</dd>
                  </div>
                  <div>
                    <dt className="text-label mb-1">Status</dt>
                    <dd>{o.status}</dd>
                  </div>
                  <div>
                    <dt className="text-label mb-1">Method</dt>
                    <dd>{o.method}</dd>
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
      <WireframeNote>
        Amounts are the published Malaysia launch prices; order numbers,
        dates and payment status are sample. No payment was taken and no
        receipt exists.
      </WireframeNote>
    </div>
  );
}
