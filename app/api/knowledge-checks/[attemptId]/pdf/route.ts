import { appBaseUrl } from "@/modules/commerce/checkout.service";
import { unlockStatusForAttempt } from "@/modules/commerce/unlock.service";
import { achievementCertificateData } from "@/modules/free-learning/achievement-certificate";
import { findResultByPublicId, getAttemptForUser } from "@/modules/free-learning/knowledge-check.repository";
import { getCurrentUser } from "@/modules/identity/session";
import { renderCertificatePdf, unsupportedPdfCharacters } from "@/shared/certificate/pdf";
import { pdfResponse, unsupportedTextResponse } from "@/shared/certificate/pdf-response";

/*
 * GET /api/knowledge-checks/<attempt id>/pdf — the Certificate of Achievement
 * of a PASSED free Knowledge Check as a vector A4-landscape PDF (Milestone 15,
 * Requirement 6; DR-05). Same authorisation as the on-screen document: the
 * attempt's signed-in OWNER only (anyone else, or an unknown id, gets the same
 * 404), the unlock gate must hold — a Free Learning review and the fee paid or
 * exempt — (403 until it does), and a failed or revoked result never renders
 * (403). `no-store`; never a public file URL.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ attemptId: string }> }): Promise<Response> {
  const user = await getCurrentUser();
  if (!user) return new Response(null, { status: 401 });
  const { attemptId } = await params;
  const attempt = await getAttemptForUser(attemptId, user.id);
  if (!attempt || !attempt.finishedAt || !attempt.publicId) return new Response(null, { status: 404 });
  const status = await unlockStatusForAttempt(attempt); // false for a fail
  if (!status.unlocked) return new Response("Complete the review and unlock steps to download the certificate.", { status: 403 });
  const view = await findResultByPublicId(attempt.publicId);
  if (!view || !view.passed || view.status === "revoked") return new Response("This certificate is not available.", { status: 403 });
  const data = await achievementCertificateData(view, `${appBaseUrl()}/verify/${attempt.publicId}`);
  if (unsupportedPdfCharacters([data.holderName, data.subjectTitle].join(" ")).length > 0) return unsupportedTextResponse();
  return pdfResponse(await renderCertificatePdf(data), attempt.publicId);
}
