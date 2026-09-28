import type { Metadata } from "next";
import { PolicyPlaceholder } from "@/shared/legal/PolicyPlaceholder";

/*
 * PORTED 2026-09-21 from project-artifacts/mockup/app/credential-integrity-policy/page.tsx (ADR-045)
 * Changed: import path; metadata title shortened (root layout appends the site name).
 */

/** Credential integrity policy — PLACEHOLDER; the policy is undecided
 *  (ADR-018, OQ-21). See src/shared/legal/PolicyPlaceholder.tsx. The
 *  "governs"/"needs" text below describes what the policy will have to
 *  cover — it is not the policy itself, which is never drafted here (Rule
 *  8). UPDATED 2026-09-28 (founder: "update content ... as per our final
 *  changes on the portal") only to name the Knowledge Check result, a
 *  second verifiable, publicly checkable thing the Academy now issues
 *  (Milestone 14, DR-03) alongside the Certificate of Completion — the
 *  policy still needs to say how each is protected, and that a Knowledge
 *  Check result is not the earned credential either. */
export const metadata: Metadata = {
  title: "Credential integrity policy",
  description: "Credential integrity policy (not yet published).",
  robots: { index: false, follow: false },
};

export default function CredentialIntegrityPolicyPage() {
  return (
    <PolicyPlaceholder
      title="Credential integrity policy"
      governs="It will set out how the Academy protects the worth of what it issues — the Certificate of Completion and the Knowledge Check result — including the conditions under which a certificate can be suspended or revoked, how appeals are handled, and how misconduct is dealt with."
      needs={[
        "The Academy's decisions on revocation, appeals and misconduct",
        "The distinction between the Certificate of Completion, the Knowledge Check result and the earned credential",
        "Review by legal counsel",
      ]}
    />
  );
}
