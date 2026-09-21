import type { Metadata } from "next";
import Link from "next/link";
import { AuthScreen } from "@/shared/chrome/AuthScreen";
import { ResetPasswordForm } from "./ResetPasswordForm";

/* Set-a-new-password step, reached from the emailed link. Better Auth
   redirects here with ?token=…, or ?error=INVALID_TOKEN when the link is
   expired or already used. */
export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token, error } = await searchParams;
  const invalid = !token || error === "INVALID_TOKEN";
  return (
    <AuthScreen
      eyebrow="Account recovery"
      title="Choose a new password"
      lead="Pick a password of at least 12 characters. All other sessions on your account will be signed out."
      footer={
        <Link
          href="/sign-in"
          className="inline-block py-2 font-medium text-[var(--color-primary)] underline underline-offset-4 hover:text-[var(--color-primary-strong)]"
        >
          ← Back to sign in
        </Link>
      }
    >
      {invalid ? (
        <p role="alert" className="text-body-sm text-[var(--color-danger)]">
          This reset link is not valid — it may have expired or already been used.{" "}
          <Link href="/forgot-password" className="underline underline-offset-4">
            Request a new one
          </Link>
          .
        </p>
      ) : (
        <ResetPasswordForm token={token} />
      )}
    </AuthScreen>
  );
}
