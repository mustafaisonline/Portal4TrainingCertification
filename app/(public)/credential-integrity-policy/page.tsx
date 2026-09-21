import type { Metadata } from "next";
import { PolicyPlaceholder } from "@/shared/legal/PolicyPlaceholder";

/*
 * PORTED 2026-09-21 from project-artifacts/mockup/app/credential-integrity-policy/page.tsx (ADR-045)
 * Changed: import path; metadata title shortened (root layout appends the site name).
 */

/** Credential integrity policy — PLACEHOLDER; the policy is undecided
 *  (ADR-018, OQ-21). See src/shared/legal/PolicyPlaceholder.tsx. */
export const metadata: Metadata = {
  title: "Credential integrity policy",
  description: "Credential integrity policy (not yet published).",
  robots: { index: false, follow: false },
};

export default function CredentialIntegrityPolicyPage() {
  return (
    <PolicyPlaceholder
      title="Credential integrity policy"
      governs="It will set out how the Academy protects the worth of what it issues — the conditions under which a certificate or credential can be suspended or revoked, how appeals are handled, and how misconduct is dealt with."
      needs={[
        "The Academy's decisions on revocation, appeals and misconduct",
        "The distinction between the Certificate of Completion and the earned credential",
        "Review by legal counsel",
      ]}
    />
  );
}
