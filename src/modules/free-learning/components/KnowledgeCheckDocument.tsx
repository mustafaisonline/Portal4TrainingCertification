import { Certificate, type AchievementCertificate } from "@/shared/certificate/Certificate";

/*
 * The printable Certificate of Achievement of a PASSED free Knowledge Check
 * (Milestone 15, Requirement 3; DR-05). It is the shared, reusable certificate
 * design (`src/shared/certificate/Certificate.tsx`) — the same sheet the PDF
 * download will use — not a bespoke page. Server component; it prints from the
 * page's Print button. It is shown only behind the existing review + unlock
 * gate, and never for a failed or revoked result.
 */
export function KnowledgeCheckDocument({ certificate }: { certificate: AchievementCertificate }) {
  return (
    <div data-testid="kc-document" aria-label="Certificate of Achievement">
      <Certificate {...certificate} />
    </div>
  );
}
