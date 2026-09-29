import { certificateBrand } from "@/content/certificate-brand";
import { listPublishedExperts } from "@/modules/catalogue/experts/repository";
import { certificateQrSvg } from "@/shared/certificate/qr";
import type { CertificateTrainer, CompletionCertificate } from "@/shared/certificate/Certificate";
import { formatCalendarDate } from "./dates";
import type { CertificateRecord } from "./repository";

/*
 * A Certificate of Completion as the data of the shared certificate design
 * (Milestone 15, Requirement 4). Everything printed comes from the stored
 * certificate: the holder, training, completion date and validity date are
 * the record's own; the training DURATION and the TRAINER NAMES are the
 * snapshots taken at issue (a later catalogue edit never rewrites them).
 * A trainer's HRD Corp accreditation is the only accreditation ever printed,
 * and only beside that trainer: it is read from the trainer's current profile
 * by exact name and is omitted when the trainer cannot be matched — never
 * guessed. The certificate never says it is "HRD Corp certified".
 */

/** The snapshot string back to names (it was written joined by ", "). */
export function trainerNames(snapshot: string | null): string[] {
  return (snapshot ?? "")
    .split(",")
    .map((n) => n.trim())
    .filter(Boolean);
}

export async function completionCertificateData(certificate: CertificateRecord, verifyUrl: string): Promise<CompletionCertificate> {
  const names = trainerNames(certificate.trainerName);
  const experts = names.length > 0 ? await listPublishedExperts() : [];
  const trainers: CertificateTrainer[] = names.map((name) => {
    const expert = experts.find((e) => e.name.trim().toLowerCase() === name.toLowerCase());
    return { name, hrdAccredited: !!expert?.hrdCorpAccreditation, hrdTrainerId: expert?.hrdCorpAccreditation?.trainerId ?? null };
  });
  return {
    kind: "completion",
    certificateId: certificate.certificateId,
    holderName: certificate.holderName,
    subjectTitle: certificate.programmeTitle,
    durationLabel: certificate.trainingDurationLabel,
    completedOn: formatCalendarDate(certificate.completedOn),
    validUntil: formatCalendarDate(certificate.expiresOn),
    trainers,
    verifyUrl,
    qrSvg: await certificateQrSvg(verifyUrl),
    brand: certificateBrand,
  };
}
