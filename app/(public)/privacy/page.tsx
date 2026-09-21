import type { Metadata } from "next";
import { privacyPolicy } from "@/content/legal/privacy";
import { LegalDocumentView } from "@/shared/legal/LegalDocumentView";

/*
 * PORTED 2026-09-21 from project-artifacts/mockup/app/privacy/page.tsx (ADR-045)
 * Changed: import path; metadata title shortened (root layout appends the site name).
 *
 * REPLACED 2026-09-21 (later the same day), founder direction: the
 * PolicyPlaceholder ("not yet published") gave way to a clearly-labelled DRAFT
 * of the Privacy policy (PDPA 2010, as amended), written for review by a
 * Malaysian-qualified lawyer. The draft lives in src/content/legal/privacy.ts;
 * LegalDocumentView shows the "not yet in force" notice whenever status is
 * "draft". Registration remains gated on LEGAL_DOCUMENT_VERSIONS naming a
 * PUBLISHED version (src/modules/identity/legal-documents.ts) — this page does
 * not open it. robots noindex stays until the reviewed version is published.
 */
export const metadata: Metadata = {
  title: "Privacy policy",
  description: "Privacy policy — draft for legal review, not yet in force.",
  robots: { index: false, follow: false },
};

export default function PrivacyPage() {
  return <LegalDocumentView document={privacyPolicy} />;
}
