import { certificateBrand } from "@/content/certificate-brand";
import { formatCalendarDate, todayIso } from "@/modules/certificates/dates";
import { formatTimeTaken } from "@/shared/certificate/format";
import { certificateQrSvg } from "@/shared/certificate/qr";
import type { AchievementCertificate } from "@/shared/certificate/Certificate";
import { gradeLabel } from "./assessment-rules";
import type { PublicKnowledgeCheckView } from "./knowledge-check.repository";

/*
 * A passed Free Assessment Check (internally "knowledge check") as the data of a Certificate of Achievement
 * (Milestone 15, Requirement 3; DR-05). Everything printed is DERIVED from the
 * stored attempt — score/size for the percentage, finished − started for the
 * time (both instants set by the SERVER; no client value is ever read), score/size
 * for the GRADE (Charlie/Bravo/Alpha — only a passed 200-question result has one;
 * an older result prints as issued, with no grade),
 * finished for the issue date, +1 year for validity — so nothing can drift from
 * the record. Used by the on-screen document and, later, the PDF.
 */
export async function achievementCertificateData(view: PublicKnowledgeCheckView, verifyUrl: string): Promise<AchievementCertificate> {
  if (!view.passed || !view.expiresOn) throw new Error(`Free Assessment Check ${view.publicId} did not pass, so it has no certificate.`);
  const grade = view.grade ? gradeLabel(view.grade) : undefined;
  return {
    kind: "achievement",
    certificateId: view.publicId,
    holderName: view.holderName,
    subjectTitle: `Data & AI Free Assessment Check — ${view.size} questions`,
    scoreLabel: `${view.score} of ${view.size} · ${view.percent}%`,
    ...(grade ? { grade } : {}),
    timeTaken: formatTimeTaken(view.timeTakenMs),
    issuedOn: formatCalendarDate(todayIso(view.finishedAt)),
    validUntil: formatCalendarDate(view.expiresOn),
    verifyUrl,
    qrSvg: await certificateQrSvg(verifyUrl),
    brand: certificateBrand,
  };
}
