import { certificateDocumentAccess } from "@/modules/certificates/gate";
import { findByCertificateId } from "@/modules/certificates/repository";
import { completionCertificateData } from "@/modules/certificates/professional-certificate";
import { appBaseUrl } from "@/modules/commerce/checkout.service";
import { getCurrentUser } from "@/modules/identity/session";
import { renderCertificatePdf, unsupportedPdfCharacters } from "@/shared/certificate/pdf";
import { pdfResponse, unsupportedTextResponse } from "@/shared/certificate/pdf-response";

/*
 * GET /api/certificates/<DAA-…>/pdf — the Certificate of Completion as a
 * vector A4-landscape PDF (Milestone 15, Requirement 6). Exactly the same
 * authorisation as the on-screen document: the signed-in OWNER only (anyone
 * else — or an unknown ID — gets the same 404, so IDs cannot be probed), the
 * reviews gate must hold (403 until it does), and a revoked certificate is
 * never rendered (403). Never a public file URL; the response is `no-store`.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ certificateId: string }> }): Promise<Response> {
  const user = await getCurrentUser();
  if (!user) return new Response(null, { status: 401 });
  const { certificateId } = await params;
  const certificate = await findByCertificateId(certificateId);
  if (!certificate || certificate.userId !== user.id) return new Response(null, { status: 404 });
  if (certificate.revokedAt) return new Response("This certificate was revoked and cannot be downloaded.", { status: 403 });
  const access = await certificateDocumentAccess(certificate);
  if (!access.unlocked) return new Response("Share your review of the training to download the certificate.", { status: 403 });
  const data = await completionCertificateData(certificate, `${appBaseUrl()}/verify/${certificate.certificateId}`);
  if (unsupportedPdfCharacters([data.holderName, data.subjectTitle, ...data.trainers.map((t) => t.name)].join(" ")).length > 0) return unsupportedTextResponse();
  return pdfResponse(await renderCertificatePdf(data), certificate.certificateId);
}
