import { Button } from "@/shared/ui/Button";

/* HTTP 404 — the styled page the readiness audit asked for. */
export default function NotFound() {
  return (
    <main className="mx-auto max-w-[560px] px-4 py-20 text-center sm:px-6">
      <p className="text-label mb-3 text-[var(--color-primary)]">404</p>
      <h1 className="text-display mb-3">Page not found</h1>
      <p className="text-body-sm mb-8 text-[var(--color-ink-quiet)]">
        The address may be wrong, or this part of the portal is not available yet.
      </p>
      <div className="flex flex-col justify-center gap-3 sm:flex-row">
        <Button href="/">Back to home</Button>
        <Button variant="secondary" href="/sign-in">
          Sign in
        </Button>
      </div>
    </main>
  );
}
