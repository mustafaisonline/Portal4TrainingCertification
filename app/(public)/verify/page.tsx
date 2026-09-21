import type { Metadata } from "next";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";

/*
 * Certificate verification — PLACEHOLDER until Milestone 6 delivers the real
 * server-side search over issued Certificates of Completion. Linked from the
 * primary nav ("Search Candidate") and the footer, so the route must resolve;
 * it says plainly that nothing can be looked up yet. No sample records (the
 * mockup's `data/certificates.ts` registry is NEVER-PORT).
 */
export const metadata: Metadata = {
  title: "Verify a certificate",
  description: "Public verification of Data & AI Academy certificates of completion.",
};

export default function VerifyPage() {
  return (
    <section className="bg-[var(--color-ground-tint)]">
      <div className="mx-auto max-w-[720px] px-4 py-14 sm:px-6 sm:py-20">
        <p className="text-label mb-3 text-[var(--color-primary)]">Verify a certificate</p>
        <h1 className="text-display mb-3">Certificate verification</h1>
        <p className="text-body-lg mb-8 max-w-[60ch] text-[var(--color-ink-quiet)]">
          Anyone will be able to confirm a Certificate of Completion here by its unique ID or the holder&rsquo;s name,
          where the holder has chosen to be listed.
        </p>
        <Card variant="panel">
          <p className="text-body-sm text-[var(--color-ink-quiet)]" data-testid="verify-unavailable">
            Verification opens once the first certificate has been issued. No certificate has been issued yet, so there
            is nothing to search.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button href="/DataBlueprint-AIVibeCoding">See the programme</Button>
            <Button variant="secondary" href="/contact-us">
              Contact us
            </Button>
          </div>
        </Card>
      </div>
    </section>
  );
}
