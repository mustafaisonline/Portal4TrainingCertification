import { reviewRequirementForRegistration } from "@/modules/reviews/eligibility";
import type { ReviewRequirement } from "@/modules/reviews/visibility";
import { documentUnlocked } from "./rules";

/*
 * The reviews gate on the certificate DOCUMENT (M6 plan §3 E9; LEARNER_
 * FEEDBACK_REQUIREMENTS.md §8). ONE server function decides; the holder
 * page, the print view and any future download route call it AFTER the
 * ownership check and BEFORE rendering the document. Not gated: issuance,
 * the certificate's ID and status, and the public /verify pages.
 *
 * `certificateIssuedAt` is not passed: every certificate post-dates the
 * reviews feature (M5b shipped the same day M6 started), so the "issued
 * before the feature" exemption (D-7) cannot apply here.
 */

export type CertificateDocumentAccess = { requirement: ReviewRequirement; unlocked: boolean };

export async function certificateDocumentAccess(certificate: { registrationId: string }): Promise<CertificateDocumentAccess> {
  const requirement = await reviewRequirementForRegistration(certificate.registrationId);
  return { requirement, unlocked: documentUnlocked(requirement) };
}
