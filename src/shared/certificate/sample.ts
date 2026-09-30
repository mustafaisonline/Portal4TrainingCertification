import { certificateBrand } from "@/content/certificate-brand";
import { ASSESSMENT_GRADE_BANDS, ASSESSMENT_GRADES, ASSESSMENT_SIZE, type AssessmentGrade, isAssessmentGrade } from "@/modules/free-learning/assessment-rules";
import type { CertificateData, CertificateTrainer } from "./Certificate";
import { formatTimeTaken } from "./format";
import { certificateQrSvg } from "./qr";

/*
 * SAMPLE certificates — one source for every place a sample is shown: the
 * administrator's Certificates tab and design preview, and the locked state of
 * a Knowledge Check result (so a person sees what the certificate looks like
 * before they unlock it). Milestone 15 follow-up, founder 2026-09-29.
 *
 * A sample is deliberately NOT anyone's certificate: it carries a diagonal
 * SAMPLE watermark, a made-up name, and IDs that verify nothing (the QR and
 * URL point at an address that answers "not found"). Nothing from a real
 * result — name, ID, score, time, QR — ever appears in it, so a screenshot of
 * a sample is worth nothing. The real certificate stays behind the gate.
 */
export type SampleKind = "achievement" | "completion";

export const SAMPLE_IDS: Record<SampleKind, string> = { achievement: "KC-2026-SAMP-PLE2", completion: "DAA-2026-SAMP-PLE2" };

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kuala_Lumpur" });

/** The sample of each grade (Free Assessment Check): a made-up score inside the grade's band. Of 200 questions. */
export const SAMPLE_GRADE_SCORES: Record<AssessmentGrade, number> = { charlie: 130, bravo: 150, alpha: 180 };

export { ASSESSMENT_GRADES as SAMPLE_GRADES, isAssessmentGrade as isSampleGrade };

export function isSampleKind(value: unknown): value is SampleKind {
  return value === "achievement" || value === "completion";
}

export async function sampleCertificate(
  kind: SampleKind,
  opts: { baseUrl?: string; long?: boolean; trainers?: CertificateTrainer[]; now?: Date; grade?: AssessmentGrade } = {},
): Promise<CertificateData> {
  const now = opts.now ?? new Date();
  const nextYear = new Date(now);
  nextYear.setUTCFullYear(nextYear.getUTCFullYear() + 1);
  const base = (opts.baseUrl ?? "https://example.test").replace(/\/+$/, "");
  const id = SAMPLE_IDS[kind];
  const verifyUrl = `${base}/verify/${id}`;
  const common = {
    certificateId: id,
    holderName: opts.long ? "Alexandra Maria-Isabella Fitzgerald-Montgomery de la Rosa Wan Abdul Rahman" : "Aisha Binti Rahman",
    validUntil: dateFmt.format(nextYear),
    verifyUrl,
    qrSvg: await certificateQrSvg(verifyUrl),
    brand: certificateBrand,
    sample: true,
  } as const;
  if (kind === "achievement") {
    const grade = opts.grade ?? "alpha";
    const score = SAMPLE_GRADE_SCORES[grade];
    return {
      ...common,
      kind,
      subjectTitle: opts.long
        ? `Data & AI Free Assessment Check — ${ASSESSMENT_SIZE} questions drawn from the Knowledge Hub topics on data governance, architecture and AI`
        : `Data & AI Free Assessment Check — ${ASSESSMENT_SIZE} questions`,
      scoreLabel: `${score} of ${ASSESSMENT_SIZE} · ${Math.floor((score * 100) / ASSESSMENT_SIZE)}%`,
      grade: { name: ASSESSMENT_GRADE_BANDS[grade].name, band: ASSESSMENT_GRADE_BANDS[grade].band },
      timeTaken: formatTimeTaken((2 * 60 + 14) * 60_000 + 31_000),
      issuedOn: dateFmt.format(now),
    };
  }
  return {
    ...common,
    kind,
    subjectTitle: opts.long ? "Data Blueprint & AI/Vibe Coding: Trusted Data Foundations and Building Real Products with AI for Practitioners and Teams" : "Data Blueprint & AI/Vibe Coding",
    durationLabel: "2 Days",
    completedOn: dateFmt.format(now),
    trainers: opts.trainers ?? [{ name: "Sample Trainer", hrdAccredited: false }],
  };
}
