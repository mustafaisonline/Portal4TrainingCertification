import { certificateBrand } from "@/content/certificate-brand";
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

export function isSampleKind(value: unknown): value is SampleKind {
  return value === "achievement" || value === "completion";
}

export async function sampleCertificate(
  kind: SampleKind,
  opts: { baseUrl?: string; long?: boolean; trainers?: CertificateTrainer[]; now?: Date } = {},
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
    return {
      ...common,
      kind,
      subjectTitle: opts.long
        ? "Data & AI Knowledge Check — 200 questions drawn from the Knowledge Hub topics on data governance, architecture and AI"
        : "Data & AI Knowledge Check — 50 questions",
      scoreLabel: "42 of 50 · 84%",
      timeTaken: formatTimeTaken(24 * 60_000 + 31_000),
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
