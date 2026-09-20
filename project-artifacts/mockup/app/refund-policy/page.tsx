import type { Metadata } from "next";
import { PolicyPlaceholder } from "@/components/legal/PolicyPlaceholder";

/** Refund & cancellation policy — PLACEHOLDER; the policy is undecided
 *  (OQ-2, OQ-9) and is a PREREQUISITE for taking any payment. Linked from the
 *  footer, the checkout consent line, the renewal screen and the FAQ. */
export const metadata: Metadata = {
  title: "Refund & cancellation policy — Data & AI Academy",
  description: "Refund and cancellation policy (not yet published).",
  robots: { index: false, follow: false },
};

export default function RefundPolicyPage() {
  return (
    <PolicyPlaceholder
      title="Refund & cancellation policy"
      governs="It will set out when a programme registration can be cancelled or moved to another date, what is refunded and when, and whether the yearly certificate renewal fee is refundable."
      needs={[
        "The Academy's decisions on cancellation windows, transfers and refunds per product",
        "Consumer-protection review of the certificate renewal model",
        "The invoicing legal entity and tax treatment",
        "Review by legal counsel",
      ]}
    />
  );
}
