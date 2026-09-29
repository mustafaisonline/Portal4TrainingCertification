import type { Metadata } from "next";
import Link from "next/link";
import { forbidden } from "next/navigation";
import { certificateBrand, certificateBrandGaps } from "@/content/certificate-brand";
import { listPublishedExperts } from "@/modules/catalogue/experts/repository";
import { appBaseUrl } from "@/modules/commerce/checkout.service";
import { authorise } from "@/modules/identity/session";
import { PrintButton } from "@/modules/certificates/components/PrintButton";
import { Certificate } from "@/shared/certificate/Certificate";
import { sampleCertificate } from "@/shared/certificate/sample";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";

/*
 * /admin/certificates/preview — the certificate DESIGN, on sample data
 * (Milestone 15, Requirement 2; founder, 2026-09-29). Platform administrators
 * only. Every sheet here carries a SAMPLE watermark and its ID/QR point at
 * nothing real: this page exists so the design can be reviewed, printed and
 * checked BEFORE any real certificate is rendered with it.
 *
 * `?kind=achievement|completion` shows one sheet (so Print gives one A4 page);
 * `?long=1` swaps in a very long name and title to prove nothing overflows.
 */
export const metadata: Metadata = { title: "Certificate design preview" };
export const dynamic = "force-dynamic";

export default async function CertificatePreviewPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const access = await authorise("platform_admin");
  if (!access.ok) forbidden();
  const sp = await searchParams;
  const only = sp["kind"] === "achievement" || sp["kind"] === "completion" ? (sp["kind"] as "achievement" | "completion") : null;
  const long = sp["long"] === "1";

  let base = "https://example.test";
  try {
    base = appBaseUrl();
  } catch {
    // local only — a sample URL is fine on a sample page
  }
  const experts = await listPublishedExperts();
  const trainer = experts[0];
  const trainers = trainer
    ? [{ name: trainer.name, hrdAccredited: trainer.hrdCorpAccreditation !== null, hrdTrainerId: trainer.hrdCorpAccreditation?.trainerId ?? null }]
    : undefined;
  const [achievement, completion] = await Promise.all([sampleCertificate("achievement", { baseUrl: base, long, trainers }), sampleCertificate("completion", { baseUrl: base, long, trainers })]);
  const gaps = certificateBrandGaps(certificateBrand);

  return (
    <div className="flex flex-col gap-6">
      <header className="print:hidden">
        <Link href="/admin/certificates" className="text-body-sm mb-2 inline-block py-1 text-[var(--color-primary)] underline underline-offset-4">
          ← Certificates
        </Link>
        <p className="text-label mb-2 text-[var(--color-primary)]">Design review</p>
        <h1 className="text-display" data-testid="certificate-preview-title">
          Certificate design preview
        </h1>
        <p className="text-body-sm mt-2 max-w-[70ch] text-[var(--color-ink-quiet)]">
          One reusable design, two certificate types, A4 landscape. Everything below is <strong>sample data</strong> with a watermark — nothing here is a real
          certificate and the sample IDs do not verify.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button variant="secondary" href="/admin/certificates/preview" data-testid="preview-both">
            Both
          </Button>
          <Button variant="secondary" href="/admin/certificates/preview?kind=achievement" data-testid="preview-achievement">
            Free Certification only
          </Button>
          <Button variant="secondary" href="/admin/certificates/preview?kind=completion" data-testid="preview-completion">
            Professional Training only
          </Button>
          <Button variant="secondary" href={`/admin/certificates/preview${only ? `?kind=${only}&long=1` : "?long=1"}`} data-testid="preview-long">
            Very long name and title
          </Button>
          <PrintButton />
        </div>
      </header>

      <Card variant="plate" className="p-5 print:hidden" data-testid="brand-gaps">
        <h2 className="text-h2 mb-2">Not yet supplied</h2>
        {gaps.length === 0 ? (
          <p className="text-body-sm text-[var(--color-ink-quiet)]">Every brand and legal detail is set.</p>
        ) : (
          <>
            <p className="text-body-sm mb-3 text-[var(--color-ink-quiet)]">
              These are omitted from the certificates until you send them — nothing is invented, and no bracketed placeholder is ever printed on a real
              certificate.
            </p>
            <ul className="text-body-sm flex list-disc flex-col gap-1 pl-5" data-testid="brand-gaps-list">
              {gaps.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
          </>
        )}
      </Card>

      {/* On a phone the sheet keeps its proportions and scrolls sideways rather than shrinking to unreadable type. */}
      <div className="flex flex-col gap-10">
        {only !== "completion" ? (
          <div className="overflow-x-auto">
            <div className="mx-auto min-w-[760px] max-w-[1123px]">
              <p className="text-label mb-2 print:hidden">Free Certification — Certificate of Achievement</p>
              <Certificate {...achievement} />
            </div>
          </div>
        ) : null}
        {only !== "achievement" ? (
          <div className="overflow-x-auto">
            <div className="mx-auto min-w-[760px] max-w-[1123px]">
              <p className="text-label mb-2 print:hidden">Professional Training — Certificate of Completion</p>
              <Certificate {...completion} />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
