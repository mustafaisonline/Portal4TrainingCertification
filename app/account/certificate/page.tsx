import type { Metadata } from "next";
import { requireUser } from "@/modules/identity/session";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";

/*
 * The holder's Certificate of Completion.
 * PORTED 2026-09-21 from the "no certificate yet" branch of project-artifacts/
 * mockup/components/account/CertificateView.tsx (ADR-045). Changed: server
 * component on the real session. There is no certificates table yet (a later
 * milestone) and nothing has been issued, so the issued-certificate branch,
 * the sample record, its ID and dates, the "Demo tools" simulation, the
 * renewal flow and the WireframeNote are not ported. The validity period and
 * renewal fee sentence is also left out: those are product rules for the
 * certificate milestone to confirm, not for this screen to assert.
 */
export const metadata: Metadata = { title: "Certificate" };

export default async function CertificatePage() {
  await requireUser("/account/certificate");
  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-label mb-2 text-[var(--color-primary)]">Certificate</p>
        <h1 className="text-display">Your certificate of completion</h1>
      </header>

      <Card variant="panel" className="p-6 sm:p-8">
        <h2 className="text-h1 mb-3">How it works</h2>
        <ol className="text-body-sm flex list-decimal flex-col gap-2 pl-5 text-[var(--color-ink-quiet)]">
          <li>
            When you complete the programme you receive a Certificate of Completion with a unique ID and its own web
            address.
          </li>
          <li>Anyone can check it on the public verification page and see whether it is active.</li>
        </ol>
        <p className="text-body-sm mt-4 text-[var(--color-ink-faint)]">
          The certificate records that you completed the programme. It is not the Academy&rsquo;s earned credential.
        </p>
      </Card>

      <Card variant="panel" className="p-6">
        <p className="text-body-lg font-medium">No certificate has been issued yet.</p>
        <p className="text-body-sm mt-2 mb-4 text-[var(--color-ink-quiet)]">Issued when you complete the programme.</p>
        <Button href="/DataBlueprint-AIVibeCoding">View the programme</Button>
      </Card>
    </div>
  );
}
