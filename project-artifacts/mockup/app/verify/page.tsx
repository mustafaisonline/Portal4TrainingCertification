import type { Metadata } from "next";
import { VerifySearch } from "@/components/certificates/VerifySearch";
import { PublicShell } from "@/components/PublicShell";

/**
 * Public certificate search — WIREFRAME, 2026-09-20, founder requirement.
 * Anyone can search, by certificate ID or holder name, for people who have
 * completed the training. Behaviour, privacy rules and why the records are
 * labelled Sample: components/certificates/VerifySearch.tsx,
 * data/certificates.ts and docs/execution/COMPLETION_CERTIFICATE_REQUIREMENTS.md.
 *
 * This verifies the Certificate of COMPLETION. It is not the earned
 * credential's verification page (P16 / ADR-018), which remains deferred until
 * the first credential exists — the footer says so.
 */
export const metadata: Metadata = {
  title: "Verify a certificate — Data & AI Academy",
  description:
    "Check a Data & AI Academy certificate of completion by certificate ID or holder name.",
};

export default function VerifyPage() {
  return (
    <PublicShell>
      <section className="bg-[var(--color-ground-tint)]">
        <div className="mx-auto max-w-[760px] px-4 py-12 sm:px-6 sm:py-16">
          <p className="text-label mb-3 text-[var(--color-primary)]">Verify</p>
          <h1 className="mb-3 text-display">Verify a certificate</h1>
          <p className="text-body-lg mb-8 max-w-[60ch] text-[var(--color-ink-quiet)]">
            Check that someone completed the training, and whether their
            certificate is still active. Search by the certificate ID printed
            on it, or by the holder&rsquo;s name.
          </p>
          <VerifySearch />
        </div>
      </section>
    </PublicShell>
  );
}
