import type { Metadata } from "next";
import Link from "next/link";
import { AuthScreen } from "@/shared/chrome/AuthScreen";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

/*
 * Forgot password — request step. Structure and copy PORTED 2026-09-21 from
 * project-artifacts/mockup/app/forgot-password/page.tsx. The copy avoids
 * saying whether an address is registered (enumeration-safe), and so does
 * the response.
 */
export const metadata: Metadata = {
  title: "Forgot password",
  description: "Request a link to reset your Data & AI Academy password.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthScreen
      eyebrow="Account recovery"
      title="Forgot your password?"
      lead="Enter the email address you registered with. If an account exists for it, we will send a link to choose a new password."
      footer={
        <Link
          href="/sign-in"
          className="inline-block py-2 font-medium text-[var(--color-primary)] underline underline-offset-4 hover:text-[var(--color-primary-strong)]"
        >
          ← Back to sign in
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthScreen>
  );
}
