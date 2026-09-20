import type { Metadata } from "next";
import { PolicyPlaceholder } from "@/components/legal/PolicyPlaceholder";

/** Terms of service — PLACEHOLDER; the document is undrafted. See
 *  components/legal/PolicyPlaceholder.tsx. */
export const metadata: Metadata = {
  title: "Terms of service — Data & AI Academy",
  description: "Terms of service (not yet published).",
  robots: { index: false, follow: false },
};

export default function TermsPage() {
  return (
    <PolicyPlaceholder
      title="Terms of service"
      governs="It will set out the agreement between the Academy and anyone who registers for a programme or holds a certificate — including registration, payment, cancellation and refunds, and the certificate's yearly renewal."
      needs={[
        "The Academy's legal entity and invoicing details",
        "The refund and cancellation policy",
        "How registration, payment and certificate renewal work in the final product",
        "Review by legal counsel",
      ]}
    />
  );
}
