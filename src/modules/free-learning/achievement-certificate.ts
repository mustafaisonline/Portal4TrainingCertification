import { certificateBrand } from "@/content/certificate-brand";
import { formatCalendarDate, todayIso } from "@/modules/certificates/dates";
import { formatTimeTaken } from "@/shared/certificate/format";
import { certificateQrSvg } from "@/shared/certificate/qr";
import type { AchievementCertificate } from "@/shared/certificate/Certificate";
import type { PublicKnowledgeCheckView } from "./knowledge-check.repository";

/*
 * A passed Knowledge Check as the data of a Certificate of Achievement
 * (Milestone 15, Requirement 3; DR-05). Everything printed is DERIVED from the
 * stored attempt — score/size for the percentage, finished − started for the
 * time (both instants set by the SERVER; no client value is ever read),
 * finished for the issue date, +1 year for validity — so nothing can drift from
 * the record. Used by the on-screen document and, later, the PDF.
 */
export async function achievementCertificateData(view: PublicKnowledgeCheckView, verifyUrl: string): Promise<AchievementCertificate> {
  if (!view.passed || !view.expiresOn) throw new Error(`Knowledge Check ${view.publicId} did not pass, so it has no certificate.`);
  return {
    kind: "achievement",
    certificateId: view.publicId,
    holderName: view.holderName,
    subjectTitle: `Data & AI Knowledge Check — ${view.size} questions`,
    scoreLabel: `${view.score} of ${view.size} · ${view.percent}%`,
    timeTaken: formatTimeTaken(view.timeTakenMs),
    issuedOn: formatCalendarDate(todayIso(view.finishedAt)),
    validUntil: formatCalendarDate(view.expiresOn),
    verifyUrl,
    qrSvg: await certificateQrSvg(verifyUrl),
    brand: certificateBrand,
  };
}
