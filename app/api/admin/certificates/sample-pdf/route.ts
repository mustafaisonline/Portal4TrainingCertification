import { appBaseUrl } from "@/modules/commerce/checkout.service";
import { authorise } from "@/modules/identity/session";
import { renderCertificatePdf } from "@/shared/certificate/pdf";
import { pdfResponse } from "@/shared/certificate/pdf-response";
import { isSampleGrade, isSampleKind, sampleCertificate } from "@/shared/certificate/sample";

/*
 * GET /api/admin/certificates/sample-pdf?kind=achievement|completion[&grade=alpha|bravo|charlie] — the
 * SAMPLE certificate as a PDF, so an administrator can test the download and
 * look at the file. Platform administrators only (401 signed out, 403
 * otherwise). The sheet carries the SAMPLE watermark and an ID that verifies
 * nothing; no real person's data is read.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  const access = await authorise("platform_admin");
  if (!access.ok) return new Response(null, { status: access.reason === "signed-out" ? 401 : 403 });
  const kind = new URL(req.url).searchParams.get("kind");
  if (!isSampleKind(kind)) return new Response("kind must be achievement or completion", { status: 400 });
  let baseUrl: string | undefined;
  try {
    baseUrl = appBaseUrl();
  } catch {
    baseUrl = undefined; // local only — a sample URL is fine
  }
  // The Assessment sample has one sheet per grade (default Alpha); an unknown grade is a 400.
  const gradeParam = new URL(req.url).searchParams.get("grade");
  if (gradeParam !== null && !isSampleGrade(gradeParam)) return new Response("grade must be alpha, bravo or charlie", { status: 400 });
  const grade = kind === "achievement" && gradeParam !== null && isSampleGrade(gradeParam) ? gradeParam : undefined;
  const data = await sampleCertificate(kind, { baseUrl, grade });
  return pdfResponse(await renderCertificatePdf(data), `SAMPLE-${kind}${grade ? `-${grade}` : ""}-certificate`);
}
