import { Button } from "@/shared/ui/Button";

/*
 * HTTP 404 for /verify/[id] (M6 plan §5 "Verification page"): unknown or
 * malformed ID. Neutral copy — it never says whether a holder exists or is
 * listed; the same page for both.
 */
export default function CertificateNotFound() {
  return (
    <section className="bg-[var(--color-ground-tint)]">
      <div className="mx-auto max-w-[560px] px-4 py-20 text-center sm:px-6">
        <p className="text-label mb-3 text-[var(--color-primary)]">Certificate verification</p>
        <h1 className="text-display mb-3" data-testid="verify-not-found">
          No certificate found
        </h1>
        <p className="text-body-sm mb-8 text-[var(--color-ink-quiet)]">
          We found no Certificate of Completion at this address. Check the ID against the certificate and try again.
        </p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button href="/verify">Search certificates</Button>
        </div>
      </div>
    </section>
  );
}
