import type { Metadata } from "next";
import { privacyPolicy } from "@/content/legal/privacy";
import { LegalDocumentView } from "@/shared/legal/LegalDocumentView";

/*
 * Published 2026-10-02 (founder: legal documents considered reviewed). Content: src/content/legal.
 * Registration and checkout consent are recorded against the version named in
 * LEGAL_DOCUMENT_VERSIONS (src/modules/identity/legal-documents.ts).
 */
export const metadata: Metadata = {
  title: "Privacy policy",
  description: "What personal data DataAI Nexus collects, why, who it is shared with, how long it is kept, and your rights.",
};

export default function PrivacyPage() {
  return <LegalDocumentView document={privacyPolicy} />;
}
