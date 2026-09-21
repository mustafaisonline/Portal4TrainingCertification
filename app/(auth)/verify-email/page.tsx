import type { Metadata } from "next";
import Link from "next/link";
import { AuthScreen } from "@/shared/chrome/AuthScreen";
import { ResendVerification } from "./ResendVerification";

/*
 * S04 — "Check your email". Shown after registration, and again when a
 * sign-in is refused because the address is not yet verified. The link in the
 * email is handled by Better Auth (/api/auth/verify-email) which then signs
 * the person in and lands on /account.
 */
export const metadata: Metadata = { title: "Verify your email" };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;
  return (
    <AuthScreen
      eyebrow="One more step"
      title="Check your email"
      lead="We have sent a verification link to the address you gave. Open it to activate your account."
      footer={
        <Link
          href="/sign-in"
          className="inline-block py-2 font-medium text-[var(--color-primary)] underline underline-offset-4 hover:text-[var(--color-primary-strong)]"
        >
          ← Back to sign in
        </Link>
      }
    >
      <div className="flex flex-col gap-5">
        <p className="text-body-sm text-[var(--color-ink-quiet)]">
          The link works once and expires in 60 minutes. If it does not arrive, check your spam folder, then request a
          new one below.
        </p>
        <ResendVerification email={email ?? ""} />
      </div>
    </AuthScreen>
  );
}
