import Link from "next/link";
import { Button } from "@/shared/ui/Button";

/* HTTP 403 — rendered by `forbidden()` (next.config.ts authInterrupts). */
export default function Forbidden() {
  return (
    <main className="mx-auto max-w-[560px] px-4 py-20 text-center sm:px-6">
      <p className="text-label mb-3 text-[var(--color-primary)]">403</p>
      <h1 className="text-display mb-3" data-testid="forbidden-title">
        You do not have access to this page
      </h1>
      <p className="text-body-sm mb-8 text-[var(--color-ink-quiet)]">
        Your account is signed in, but it does not hold the role this area requires.
      </p>
      <div className="flex flex-col justify-center gap-3 sm:flex-row">
        <Button href="/account">My account</Button>
        <Button variant="secondary" href="/">
          Back to home
        </Button>
      </div>
      <p className="text-body-sm mt-8 text-[var(--color-ink-faint)]">
        Think this is a mistake? <Link href="/contact-us" className="underline underline-offset-4">Contact us</Link>.
      </p>
    </main>
  );
}
