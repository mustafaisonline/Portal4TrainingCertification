import type { Metadata } from "next";
import { termsOfService } from "@/content/legal/terms";
import { LegalDocumentView } from "@/shared/legal/LegalDocumentView";

/*
 * Published 2026-10-02 (founder: legal documents considered reviewed). Content: src/content/legal.
 * Registration and checkout consent are recorded against the version named in
 * LEGAL_DOCUMENT_VERSIONS (src/modules/identity/legal-documents.ts).
 */
export const metadata: Metadata = {
  title: "Terms of service",
  description: "The terms that apply when you use the DataAI Nexus portal, register for a training or pay for a service.",
};

export default function TermsPage() {
  return <LegalDocumentView document={termsOfService} />;
}
