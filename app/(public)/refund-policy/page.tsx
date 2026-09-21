import type { Metadata } from "next";
import { refundPolicy } from "@/content/legal/refund-policy";
import { LegalDocumentView } from "@/shared/legal/LegalDocumentView";

/*
 * PORTED 2026-09-21 from project-artifacts/mockup/app/refund-policy/page.tsx (ADR-045)
 * Changed: import path; metadata title shortened (root layout appends the site name).
 *
 * REPLACED 2026-09-21 (later the same day), founder direction: the
 * PolicyPlaceholder ("policy undecided — OQ-2, OQ-9") gave way to a
 * clearly-labelled DRAFT reflecting the founder's refund rule of 2026-09-21
 * (≥14 days 100% · 7–13 days 50% · <7 days or after start 0% · one free
 * transfer · Academy-initiated changes: refund or transfer). The draft lives
 * in src/content/legal/refund-policy.ts; LegalDocumentView shows the "not yet
 * in force" notice whenever status is "draft". Still linked from the footer,
 * the checkout consent line and the FAQ; still a prerequisite for taking any
 * payment, which means the REVIEWED version must be published first.
 * robots noindex stays until then.
 */
export const metadata: Metadata = {
  title: "Refund & cancellation policy",
  description: "Refund and cancellation policy — draft for legal review, not yet in force.",
  robots: { index: false, follow: false },
};

export default function RefundPolicyPage() {
  return <LegalDocumentView document={refundPolicy} />;
}
