import type { Metadata } from "next";
import { requireUser } from "@/modules/identity/session";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";

/*
 * S07 — Orders & receipts.
 * PORTED 2026-09-21 from project-artifacts/mockup/app/account/orders/page.tsx
 * (ADR-045). Changed: server component on the real session; the simulated
 * order rows (`useDemoRegistrations`, sample order numbers, dates, "Paid",
 * the sample receipt link) and the WireframeNote are gone. There are no
 * orders or payments tables yet (later milestones), so this is the
 * wireframe's own empty state, honestly.
 */
export const metadata: Metadata = { title: "Orders & receipts" };

export default async function OrdersPage() {
  await requireUser("/account/orders");
  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-label mb-2 text-[var(--color-primary)]">Orders &amp; receipts</p>
        <h1 className="text-display">Your orders</h1>
      </header>
      <Card variant="panel" className="p-6 sm:p-8">
        <h2 className="text-h1 mb-2">No orders yet.</h2>
        <p className="text-body-sm mb-5 text-[var(--color-ink-quiet)]">
          Your orders and receipts appear here after you register.
        </p>
        <Button href="/account/programme">View the programme</Button>
      </Card>
    </div>
  );
}
