import type { Metadata } from "next";
import Link from "next/link";
import { emailVerifiedAtFor } from "@/modules/identity/users.repository";
import { getCurrentUser } from "@/modules/identity/session";
import { AuthScreen } from "@/shared/chrome/AuthScreen";
import { Button } from "@/shared/ui/Button";
import { formatTimestamp } from "@/shared/util/dates";
import { ResendVerification } from "../verify-email/ResendVerification";

/*
 * The page the activation link opens (CR-2026-10-03-1245; founder: "Once user
 * click this link, it should open new webpage and get confirmation at database
 * level to confirm user is correct user"). Better Auth verifies the link, sets
 * `users.email_verified_at` (afterEmailVerification) and sends the person here.
 * The link does NOT sign anyone in (security review: auto sign-in would let an
 * attacker's pre-registered account capture a victim). So this page is shown to
 * a signed-out visitor first (neutral, with a sign-in button that returns here)
 * and, once the person has signed in with their own password, it READS the
 * confirmation back from the database and shows it — it never claims a
 * confirmation it has not seen.
 */
export const metadata: Metadata = { title: "Email confirmed" };
export const dynamic = "force-dynamic";

export default async function EmailConfirmedPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  if (error) {
    return (
      <AuthScreen eyebrow="Activation" title="This link did not work" lead="The link is invalid, already used or has expired. Request a new one below.">
        <div className="flex flex-col gap-5" data-testid="email-link-invalid">
          <ResendVerification email="" />
        </div>
      </AuthScreen>
    );
  }

  const user = await getCurrentUser();
  const confirmedAt = user ? await emailVerifiedAtFor(user.id) : null;

  if (user && confirmedAt) {
    return (
      <AuthScreen eyebrow="Activation" title="Your email is confirmed" lead="Thank you — your account is active.">
        <div className="flex flex-col gap-4" data-testid="email-confirmed">
          <p className="text-body-sm text-[var(--color-ink-quiet)]">
            <span className="font-medium text-[var(--color-ink)]" data-testid="email-confirmed-address">{user.email}</span> was confirmed on{" "}
            <span data-testid="email-confirmed-at">{formatTimestamp(confirmedAt)}</span>.
          </p>
          <Button href="/account">Go to your account</Button>
        </div>
      </AuthScreen>
    );
  }

  if (user) {
    return (
      <AuthScreen eyebrow="Activation" title="Not confirmed yet" lead="We could not see a confirmation for your address yet.">
        <div className="flex flex-col gap-5" data-testid="email-not-confirmed">
          <ResendVerification email={user.email} />
        </div>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen eyebrow="Activation" title="Thank you" lead="If the link was valid, your email address is now confirmed.">
      <div className="flex flex-col gap-4" data-testid="email-confirmed-signed-out">
        <p className="text-body-sm text-[var(--color-ink-quiet)]">Sign in with your password to continue — the next page shows your confirmation. If you opened the link on a different device, nothing else is needed.</p>
        <Button href="/sign-in?return-to=%2Femail-confirmed">Sign in</Button>
        <p className="text-body-sm text-[var(--color-ink-quiet)]">
          Link did not work?{" "}
          <Link href="/verify-email" className="text-[var(--color-primary)] underline underline-offset-4">
            Request a new one
          </Link>
          .
        </p>
      </div>
    </AuthScreen>
  );
}
