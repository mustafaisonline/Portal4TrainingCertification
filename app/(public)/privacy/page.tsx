import type { Metadata } from "next";
import { PolicyPlaceholder } from "@/shared/legal/PolicyPlaceholder";

/*
 * PORTED 2026-09-21 from project-artifacts/mockup/app/privacy/page.tsx (ADR-045)
 * Changed: import path; metadata title shortened (root layout appends the site name).
 */

/** Privacy policy — PLACEHOLDER; the document is undrafted. See
 *  src/shared/legal/PolicyPlaceholder.tsx. */
export const metadata: Metadata = {
  title: "Privacy policy",
  description: "Privacy policy (not yet published).",
  robots: { index: false, follow: false },
};

export default function PrivacyPage() {
  return (
    <PolicyPlaceholder
      title="Privacy policy"
      governs="It will explain what personal data the Academy collects, why, where it is kept and for how long, who it is shared with, and your rights under the Personal Data Protection Act — including how your name may appear in public certificate search."
      needs={[
        "What data the final product actually collects and stores, and where",
        "The public certificate search and listing-consent rules",
        "Data retention periods",
        "Review by legal counsel",
      ]}
    />
  );
}
