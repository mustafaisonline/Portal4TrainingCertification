import type { CertificateRecord } from "@/modules/certificates/repository";
import { completionCertificateData } from "@/modules/certificates/professional-certificate";
import { Certificate } from "@/shared/certificate/Certificate";

/*
 * The Certificate of Completion as a document (M6 plan §3 E1, E9, E11, E12;
 * redesigned Milestone 15, Requirement 4 on the shared certificate design in
 * `src/shared/certificate/Certificate.tsx` — the same sheet the PDF download
 * uses). Print / "Save as PDF" prints this sheet alone: one A4-landscape page.
 *
 * Rendered ONLY where the reviews gate allows it (E9) and never for a revoked
 * certificate: the holder pages decide that, then render this. The public
 * /verify/[id] page shows a verification layout, never this component.
 */
export async function CertificateDocument({ certificate, verifyUrl }: { certificate: CertificateRecord; verifyUrl: string }) {
  const data = await completionCertificateData(certificate, verifyUrl);
  return (
    <div data-testid="certificate-document" aria-label={`Certificate of Completion ${certificate.certificateId}`}>
      <Certificate {...data} />
    </div>
  );
}
