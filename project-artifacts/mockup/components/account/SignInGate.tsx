"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { setReturnTo } from "@/lib/demoSession";

/**
 * Shown where an account is needed and the visitor is not signed in to the
 * demo session — the /account screens and the checkout. Extracted
 * 2026-09-20 from AccountFrame so both share one card.
 *
 * `returnTo` is remembered so sign-in lands the visitor back where they were
 * (the "sign in, then register" flow). A card with a link rather than a
 * redirect, so a signed-out visitor sees why, and there is no redirect flash.
 * Client-side only — NOT access control (see components/account/AccountFrame).
 */
export function SignInGate({
  title,
  body,
  returnTo,
}: {
  title: string;
  body: string;
  returnTo?: string;
}) {
  return (
    <section className="bg-[var(--color-ground-tint)]">
      <div className="mx-auto max-w-[480px] px-4 py-20 sm:px-6">
        <Card variant="panel" className="p-6 text-center sm:p-8">
          <h1 className="text-h1 mb-3">{title}</h1>
          <p className="text-body-sm mb-6 text-[var(--color-ink-quiet)]">{body}</p>
          <Button
            href="/sign-in"
            onClick={returnTo ? () => setReturnTo(returnTo) : undefined}
          >
            Go to sign in
          </Button>
        </Card>
      </div>
    </section>
  );
}
