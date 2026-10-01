import type { Metadata } from "next";
import { refundPolicy } from "@/content/legal/refund-policy";
import { LegalDocumentView } from "@/shared/legal/LegalDocumentView";

/*
 * Published 2026-10-02 (founder: legal documents considered reviewed). Content: src/content/legal.
 * Registration and checkout consent are recorded against the version named in
 * LEGAL_DOCUMENT_VERSIONS (src/modules/identity/legal-documents.ts).
 */
export const metadata: Metadata = {
  title: "Refund & cancellation policy",
  description: "When you can cancel a registration, what is refunded, and what is not.",
};

export default function RefundPolicyPage() {
  return <LegalDocumentView document={refundPolicy} />;
}
